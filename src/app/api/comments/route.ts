import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  COMMENT_LIMITS,
  bodyHash,
  getClientIp,
  hashIp,
  isRateLimited,
  runSpamChecks,
  type PublicComment,
} from "@/lib/comments";
import { notifyNewComment } from "@/lib/notify";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/comments?postId=…                                          */
/* Public: approved comments for one published post, replies nested   */
/* one level (§23).                                                    */
/* ------------------------------------------------------------------ */
export async function GET(req: Request) {
  try {
    const postId = new URL(req.url).searchParams.get("postId");
    if (!postId) {
      return NextResponse.json({ ok: false, error: "postId is required" }, { status: 400 });
    }

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true },
    });
    if (!post || post.status !== "published") {
      return NextResponse.json({ ok: true, comments: [] });
    }

    const rows = await db.comment.findMany({
      where: { postId, status: "approved" },
      orderBy: { createdAt: "asc" },
    });

    // Nest replies one level under their top-level parent.
    const tops = rows.filter((r) => !r.parentId);
    const byParent = new Map<string, typeof rows>();
    for (const r of rows) {
      if (!r.parentId) continue;
      const list = byParent.get(r.parentId) ?? [];
      list.push(r);
      byParent.set(r.parentId, list);
    }

    const map = (r: (typeof rows)[number]): PublicComment => ({
      id: r.id,
      authorName: r.authorName,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      replies: (byParent.get(r.id) ?? []).map(map),
    });

    return NextResponse.json({
      ok: true,
      comments: tops.map(map) satisfies PublicComment[],
    });
  } catch (err) {
    console.error("[GET /api/comments]", err);
    return NextResponse.json({ ok: false, error: "Failed to load comments" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* POST /api/comments — submit a comment (§23 + §92 protections)      */
/* Body: { postId, parentId?, authorName, authorEmail?, body,         */
/*         company? (honeypot), ts? (form render time, time-trap) }   */
/* Every comment starts `pending`; approval is admin-only.            */
/* ------------------------------------------------------------------ */
const submitSchema = z.object({
  postId: z.string().trim().min(1),
  parentId: z.string().trim().min(1).optional(),
  authorName: z
    .string()
    .trim()
    .min(COMMENT_LIMITS.authorNameMin, "Name must be at least 2 characters")
    .max(COMMENT_LIMITS.authorNameMax, "Name is too long"),
  authorEmail: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.email("Please provide a valid email address").max(COMMENT_LIMITS.emailMax).optional()
  ),
  body: z
    .string()
    .trim()
    .min(COMMENT_LIMITS.bodyMin, "Comment must be at least 10 characters")
    .max(COMMENT_LIMITS.bodyMax, "Comment is too long (2000 max)"),
  // §92 anti-bot fields — real users never fill these
  company: z.string().max(200).optional(), // honeypot
  ts: z.number().optional(), // client render timestamp (ms)
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    // 1) Rate limit (§92) — before parsing the body
    if (isRateLimited(`comment:${ip}`)) {
      return NextResponse.json(
        { ok: false, error: "Too many comments — please try again later." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid comment" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // 2) Target post must be published
    const post = await db.post.findUnique({
      where: { id: data.postId },
      select: { id: true, status: true, title: true, slug: true },
    });
    if (!post || post.status !== "published") {
      return NextResponse.json({ ok: false, error: "Post not found" }, { status: 404 });
    }

    // 3) Honeypot — silently discard (bot trap, no tip-off)
    if (data.company && data.company.trim() !== "") {
      console.warn(`[comments] honeypot tripped from ${hashIp(ip)}`);
      return NextResponse.json({ ok: true, status: "pending" });
    }

    // 4) Time-trap — humans need > 2.5s to read + type a comment
    if (typeof data.ts === "number" && Number.isFinite(data.ts) && Date.now() - data.ts < 2500) {
      console.warn(`[comments] time-trap tripped from ${hashIp(ip)}`);
      return NextResponse.json({ ok: true, status: "pending" });
    }

    // 5) Duplicate body from the same IP within 24h (§92 spam)
    const dup = await db.comment.findFirst({
      where: {
        ipHash: hashIp(ip),
        body: data.body,
        createdAt: { gte: new Date(Date.now() - COMMENT_LIMITS.duplicateWindowMs) },
      },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json(
        { ok: false, error: "This comment was already submitted." },
        { status: 409 }
      );
    }

    // 6) Resolve reply target — replies always nest under a
    //    top-level comment (reply-to-reply flattens one level up)
    let parentId: string | null = null;
    if (data.parentId) {
      const parent = await db.comment.findUnique({
        where: { id: data.parentId },
        select: { id: true, postId: true, parentId: true },
      });
      if (!parent || parent.postId !== post.id) {
        return NextResponse.json({ ok: false, error: "Parent comment not found" }, { status: 400 });
      }
      parentId = parent.parentId ?? parent.id;
    }

    // 7) Content checks (§92): links / shorteners / profanity / caps
    const check = runSpamChecks({
      body: data.body,
      authorName: data.authorName,
      authorEmail: data.authorEmail ?? null,
    });
    if (check.action === "reject") {
      return NextResponse.json(
        {
          ok: false,
          error:
            check.reasons[0]?.startsWith("link-budget")
              ? "Comments may include at most 2 links."
              : "This comment was blocked by our abuse filter.",
        },
        { status: 422 }
      );
    }
    const status = check.action === "spam" ? "spam" : "pending";

    const created = await db.comment.create({
      data: {
        postId: post.id,
        parentId,
        authorName: data.authorName,
        authorEmail: data.authorEmail ?? null,
        body: data.body,
        status,
        ipHash: hashIp(ip),
        flagged: { checks: check.reasons, score: check.score },
      },
    });

    // 8) Admin notification (§23 notification — fire-and-forget)
    notifyNewComment({
      id: created.id,
      postTitle: post.title,
      postSlug: post.slug,
      authorName: created.authorName,
      authorEmail: created.authorEmail,
      body: created.body,
      status,
    }).catch((err) => console.error("[comments] notify failed:", err));

    return NextResponse.json({ ok: true, status }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/comments]", err);
    return NextResponse.json({ ok: false, error: "Failed to submit comment" }, { status: 500 });
  }
}
