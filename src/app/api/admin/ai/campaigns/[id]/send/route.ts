import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { sendCampaign } from "@/lib/ai-campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* ------------------------------------------------------------------ */
/* POST /api/admin/ai/campaigns/[id]/send — §56 batch send.            */
/* REQUIRES status approved (409 otherwise — the preview-before-send  */
/* policy). Runs sendCampaign(): §57 per-recipient materialization,    */
/* 150ms spacing, §52 daily-budget gate per batch, per-recipient      */
/* status/error/emailLogId, counts + status roll-up. Never throws —   */
/* returns the report. broadcast_subscribers-gated.                   */
/* ------------------------------------------------------------------ */

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "broadcast_subscribers");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    const { id } = await ctx.params;
    const campaign = await db.aiCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
    }
    if (campaign.status !== "approved") {
      return NextResponse.json(
        {
          ok: false,
          error: `Campaign is ${campaign.status} — approve the preview before sending (§56 preview-before-send policy)`,
        },
        { status: 409 }
      );
    }

    const report = await sendCampaign(id, { trigger: "admin", triggerActor: guard.auth.email });
    return NextResponse.json({ ok: report.ok, report });
  } catch (err) {
    console.error("[POST /api/admin/ai/campaigns/[id]/send]", err);
    return NextResponse.json({ ok: false, error: "Send failed" }, { status: 500 });
  }
}
