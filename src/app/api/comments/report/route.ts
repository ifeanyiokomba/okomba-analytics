import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { COMMENT_LIMITS, getClientIp, isRateLimited } from "@/lib/comments";
import { sendAdminAlertEmail } from "@/lib/notify";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/comments/report (§92 report mechanism)                    */
/* Body: { commentId, reason? }                                        */
/* Each report bumps reportedCount; at REPORT_AUTO_HIDE the comment   */
/* auto-hides (back to pending) until an admin reviews it.            */
/* ------------------------------------------------------------------ */
const reportSchema = z.object({
  commentId: z.string().trim().min(1),
  reason: z.string().trim().max(300).optional(),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    // Looser limit than comments: 10 reports / 10 min / IP
    if (isRateLimited(`report:${ip}`)) {
      return NextResponse.json(
        { ok: false, error: "Too many reports — please try again later." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid report" }, { status: 400 });
    }

    const comment = await db.comment.findUnique({
      where: { id: parsed.data.commentId },
      select: {
        id: true,
        status: true,
        reportedCount: true,
        body: true,
        postId: true,
        post: { select: { title: true, slug: true } },
      },
    });
    if (!comment || comment.status !== "approved") {
      return NextResponse.json({ ok: false, error: "Comment not found" }, { status: 404 });
    }

    const nextCount = comment.reportedCount + 1;
    const autoHidden = nextCount >= COMMENT_LIMITS.reportAutoHide;

    await db.comment.update({
      where: { id: comment.id },
      data: {
        reportedCount: nextCount,
        reporterNote: parsed.data.reason ?? null,
        ...(autoHidden ? { status: "pending" } : {}),
        updatedAt: new Date(),
      },
    });

    if (autoHidden) {
      // Auto-hidden at threshold — alert the admin (fire-and-forget)
      sendAdminAlertEmail({
        key: `comment.reported.${comment.id}`,
        subject: `Comment auto-hidden after ${nextCount} reports — ${comment.post.title}`,
        bodyText: [
          `A comment on "${comment.post.title}" received ${nextCount} reports and was`,
          "automatically hidden (moved back to pending) for review.",
          "",
          comment.body.slice(0, 400),
        ].join("\n"),
      }).catch((err) => console.error("[comments/report] alert failed:", err));
    }

    return NextResponse.json({ ok: true, autoHidden });
  } catch (err) {
    console.error("[POST /api/comments/report]", err);
    return NextResponse.json({ ok: false, error: "Failed to report comment" }, { status: 500 });
  }
}
