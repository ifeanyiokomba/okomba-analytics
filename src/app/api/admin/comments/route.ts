import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";
import {
  COMMENT_MODERATION_ACTIONS,
  COMMENT_STATUSES,
  type CommentModerationAction,
} from "@/lib/comments";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* COMMENT MODERATION (directive §23 admin management + §92).         */
/* GET    ?status=pending|approved|rejected|spam (default: all)       */
/* PATCH  { id, action: approve|reject|spam|pending }                 */
/* DELETE ?id=… (cascades replies)                                     */
/* ------------------------------------------------------------------ */

export type AdminComment = {
  id: string;
  postId: string;
  postTitle: string;
  postSlug: string;
  parentId: string | null;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: string;
  reportedCount: number;
  reporterNote: string | null;
  flagged: { checks?: string[]; score?: number };
  createdAt: string;
  moderatedAt: string | null;
};

const actionSchema = z.object({
  id: z.string().trim().min(1),
  action: z.enum(COMMENT_MODERATION_ACTIONS),
});

const STATUS_BY_ACTION: Record<CommentModerationAction, string> = {
  approve: "approved",
  reject: "rejected",
  spam: "spam",
  pending: "pending",
};

function parseFlagged(raw: unknown): { checks?: string[]; score?: number } {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return {
      checks: Array.isArray(obj.checks) ? obj.checks.filter((c) => typeof c === "string") : undefined,
      score: typeof obj.score === "number" ? obj.score : undefined,
    };
  }
  return {};
}

export async function GET(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const statusFilter = new URL(req.url).searchParams.get("status");
    const where =
      statusFilter && (COMMENT_STATUSES as readonly string[]).includes(statusFilter)
        ? { status: statusFilter }
        : {};

    const rows = await db.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { post: { select: { id: true, title: true, slug: true, status: true } } },
    });

    const comments: AdminComment[] = rows.map((r) => ({
      id: r.id,
      postId: r.postId,
      postTitle: r.post?.title ?? "(deleted post)",
      postSlug: r.post?.slug ?? "",
      parentId: r.parentId,
      authorName: r.authorName,
      authorEmail: r.authorEmail,
      body: r.body,
      status: r.status,
      reportedCount: r.reportedCount,
      reporterNote: r.reporterNote,
      flagged: parseFlagged(r.flagged),
      createdAt: r.createdAt.toISOString(),
      moderatedAt: r.moderatedAt ? r.moderatedAt.toISOString() : null,
    }));

    return NextResponse.json({ ok: true, comments });
  } catch (err) {
    console.error("[GET /api/admin/comments]", err);
    return NextResponse.json({ ok: false, error: "Failed to load comments" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid moderation action" }, { status: 400 });
    }

    const updated = await db.comment.update({
      where: { id: parsed.data.id },
      data: { status: STATUS_BY_ACTION[parsed.data.action], moderatedAt: new Date() },
    });
    return NextResponse.json({ ok: true, status: updated.status });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ ok: false, error: "Comment not found" }, { status: 404 });
    }
    console.error("[PATCH /api/admin/comments]", err);
    return NextResponse.json({ ok: false, error: "Failed to moderate comment" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    }
    await db.comment.delete({ where: { id } }); // replies cascade
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ ok: false, error: "Comment not found" }, { status: 404 });
    }
    console.error("[DELETE /api/admin/comments]", err);
    return NextResponse.json({ ok: false, error: "Failed to delete comment" }, { status: 500 });
  }
}
