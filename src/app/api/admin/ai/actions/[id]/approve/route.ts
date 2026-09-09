import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { aiAudit } from "@/lib/ai-chat-monitor";
import { executeParkedAction } from "@/lib/ai-workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/* ------------------------------------------------------------------ */
/* POST /api/admin/ai/actions/[id]/approve — §53 approval execution.   */
/* Only rows with status pending_approval are approvable:             */
/*   proposal.send  → sendProposal() with the parked draftJson params  */
/*   email.followup → deliverAiEmail() with the parked content         */
/*   campaign.send  → approveCampaign() on the parked campaign         */
/* Marks the row executed (or failed) + actor + ai.action.approved.    */
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
        { ok: false, error: `Action is already ${row.status} (only pending_approval rows can be approved)` },
        { status: 409 }
      );
    }

    const result = await executeParkedAction(
      {
        id: row.id,
        action: row.action,
        level: row.level,
        customerEmail: row.customerEmail,
        inquiryId: row.inquiryId,
        draftJson: row.draftJson,
      },
      guard.auth.email
    );

    const updated = await db.aiActionLog.findUnique({ where: { id: row.id } });
    return NextResponse.json({
      ok: result.ok,
      result,
      action: updated
        ? {
            id: updated.id,
            action: updated.action,
            status: updated.status,
            actor: updated.actor,
            error: updated.error,
            resultJson: updated.resultJson,
          }
        : null,
    });
  } catch (err) {
    console.error("[POST /api/admin/ai/actions/[id]/approve]", err);
    return NextResponse.json({ ok: false, error: "Approval failed" }, { status: 500 });
  }
}
