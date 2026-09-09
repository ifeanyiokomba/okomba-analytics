import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { aiAudit } from "@/lib/ai-chat-monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/admin/ai/actions/[id]/decline — §53 decline.              */
/* pending_approval → declined + actor + ai.action.declined audit.     */
/* 409 when already actioned; 404 when missing. access_ai-gated.       */
/* ------------------------------------------------------------------ */

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "access_ai");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    const { id } = await ctx.params;
    const row = await db.aiActionLog.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ ok: false, error: "Action not found" }, { status: 404 });
    }
    if (row.status !== "pending_approval") {
      return NextResponse.json(
        { ok: false, error: `Action is already ${row.status} (only pending_approval rows can be declined)` },
        { status: 409 }
      );
    }

    const updated = await db.aiActionLog.update({
      where: { id },
      data: { status: "declined", actor: guard.auth.email, updatedAt: new Date() },
    });

    await aiAudit("ai.action.declined", {
      actor: guard.auth.email,
      targetId: row.inquiryId ?? null,
      meta: { action: row.action, actionLogId: row.id, level: row.level },
    });

    return NextResponse.json({
      ok: true,
      action: {
        id: updated.id,
        action: updated.action,
        status: updated.status,
        actor: updated.actor,
      },
    });
  } catch (err) {
    console.error("[POST /api/admin/ai/actions/[id]/decline]", err);
    return NextResponse.json({ ok: false, error: "Decline failed" }, { status: 500 });
  }
}
