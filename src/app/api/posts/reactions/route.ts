import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
  getOrCreateVisitorKey,
  readVisitorKey,
} from "@/lib/comments";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST REACTIONS (directive §24) — like / helpful / insightful /     */
/* interested. One per (visitor, type) enforced by a DB unique        */
/* constraint; submitting the same reaction again toggles it OFF.     */
/* The visitor identity is an httpOnly random cookie minted on the    */
/* first reaction — anonymous, no PII, 180-day session.               */
/* ------------------------------------------------------------------ */

export const REACTION_TYPES = ["like", "helpful", "insightful", "interested"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

const typeSchema = z.enum(REACTION_TYPES);

type ReactionSummary = {
  counts: Record<ReactionType, number>;
  mine: ReactionType[];
};

async function summarize(postId: string, visitorKey: string | null): Promise<ReactionSummary> {
  const groups = await db.reaction.groupBy({
    by: ["type"],
    where: { postId },
    _count: { id: true },
  });
  const counts: Record<ReactionType, number> = {
    like: 0,
    helpful: 0,
    insightful: 0,
    interested: 0,
  };
  for (const g of groups) {
    if ((REACTION_TYPES as readonly string[]).includes(g.type)) {
      counts[g.type as ReactionType] = g._count.id;
    }
  }
  const mine: ReactionType[] = [];
  if (visitorKey) {
    const rows = await db.reaction.findMany({
      where: { postId, visitorKey },
      select: { type: true },
    });
    for (const r of rows) {
      if ((REACTION_TYPES as readonly string[]).includes(r.type)) {
        mine.push(r.type as ReactionType);
      }
    }
  }
  return { counts, mine };
}

/* GET /api/posts/reactions?postId=… → counts + this visitor's set  */
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
      return NextResponse.json({ ok: false, error: "Post not found" }, { status: 404 });
    }
    const summary = await summarize(postId, readVisitorKey(req));
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("[GET /api/posts/reactions]", err);
    return NextResponse.json({ ok: false, error: "Failed to load reactions" }, { status: 500 });
  }
}

/* POST /api/posts/reactions { postId, type } → toggle + summary    */
export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = z
      .object({ postId: z.string().trim().min(1), type: typeSchema })
      .safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid reaction — must be like, helpful, insightful or interested" },
        { status: 400 }
      );
    }
    const { postId, type } = parsed.data;

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true },
    });
    if (!post || post.status !== "published") {
      return NextResponse.json({ ok: false, error: "Post not found" }, { status: 404 });
    }

    const { key, isNew } = getOrCreateVisitorKey(req);

    // Toggle: existing reaction from this visitor+type → remove it
    const existing = await db.reaction.findFirst({
      where: { postId, visitorKey: key, type },
      select: { id: true },
    });
    if (existing) {
      await db.reaction.delete({ where: { id: existing.id } });
    } else {
      try {
        await db.reaction.create({ data: { postId, visitorKey: key, type } });
      } catch (err) {
        // Unique-constraint race (double-click) → treat as already set
        if (
          !(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")
        ) {
          throw err;
        }
      }
    }

    const summary = await summarize(postId, key);
    const res = NextResponse.json({ ok: true, ...summary });
    if (isNew) {
      res.cookies.set({
        name: VISITOR_COOKIE,
        value: key,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: VISITOR_COOKIE_MAX_AGE,
      });
    }
    return res;
  } catch (err) {
    console.error("[POST /api/posts/reactions]", err);
    return NextResponse.json({ ok: false, error: "Failed to save reaction" }, { status: 500 });
  }
}
