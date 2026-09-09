import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { approveCampaign, toCampaignDto } from "@/lib/ai-campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/admin/ai/campaigns/[id]/approve — §56 approve the          */
/* previewed campaign (draft | pending_approval → approved; 409 when  */
/* already sent/failed). Audited as ai.campaign.approved.              */
/* broadcast_subscribers-gated.                                        */
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
    if (campaign.status === "sent" || campaign.status === "partial" || campaign.status === "sending") {
      return NextResponse.json(
        { ok: false, error: `Campaign is ${campaign.status} — already dispatched` },
        { status: 409 }
      );
    }
    if (campaign.status === "approved") {
      return NextResponse.json(
        { ok: false, error: "Campaign is already approved" },
        { status: 409 }
      );
    }

    await approveCampaign(id, guard.auth.email);
    const updated = await db.aiCampaign.findUnique({ where: { id } });
    return NextResponse.json({ ok: true, campaign: updated ? toCampaignDto(updated) : null });
  } catch (err) {
    console.error("[POST /api/admin/ai/campaigns/[id]/approve]", err);
    return NextResponse.json({ ok: false, error: "Approval failed" }, { status: 500 });
  }
}
