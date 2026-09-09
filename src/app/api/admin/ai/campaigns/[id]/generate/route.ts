import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { regenerateCampaignContent } from "@/lib/ai-campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/* POST /api/admin/ai/campaigns/[id]/generate — §56 regenerate the AI  */
/* subject/body/CTA from the stored name/goal/audience. DRAFT-only    */
/* (409 otherwise — a previewed/approved campaign must not silently   */
/* change copy). broadcast_subscribers-gated.                         */
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
    if (campaign.status !== "draft") {
      return NextResponse.json(
        { ok: false, error: `Campaign is ${campaign.status} — only draft campaigns can be regenerated` },
        { status: 409 }
      );
    }

    const updated = await regenerateCampaignContent(id);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, campaign: updated });
  } catch (err) {
    console.error("[POST /api/admin/ai/campaigns/[id]/generate]", err);
    return NextResponse.json({ ok: false, error: "Regeneration failed" }, { status: 500 });
  }
}
