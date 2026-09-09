import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { toCampaignDto, getCampaignPreviews, CAMPAIGN_AUDIENCE_SCHEMA } from "@/lib/ai-campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/admin/ai/campaigns/[id] — §56 detail: campaign + recipients */
/* (paginated ≤500) + ≤3 MASKED pre-send previews (§56 "generates a   */
/* preview before sending").                                           */
/* PUT — edit templates/name/goal/audience while draft|pending_approval */
/* only (409 otherwise). broadcast_subscribers-gated.                 */
/* ------------------------------------------------------------------ */

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  goal: z.string().trim().max(1000).nullable().optional(),
  audience: CAMPAIGN_AUDIENCE_SCHEMA.optional(),
  subjectTemplate: z.string().trim().min(3).max(80).optional(),
  bodyTemplate: z.string().trim().min(20).max(6000).optional(),
  ctaLabel: z.string().trim().max(28).nullable().optional(),
  ctaUrl: z.string().trim().max(400).nullable().optional(),
});

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
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

    const url = new URL(req.url);
    const offsetRaw = Number(url.searchParams.get("offset") ?? "0");
    const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.trunc(offsetRaw)) : 0;
    const recipients = await db.aiCampaignRecipient.findMany({
      where: { campaignId: id },
      orderBy: { createdAt: "asc" },
      skip: offset,
      take: 500,
    });

    const previews = await getCampaignPreviews(id, 3);

    return NextResponse.json({
      ok: true,
      campaign: toCampaignDto(campaign),
      recipients: recipients.map((r) => ({
        id: r.id,
        email: r.email,
        firstName: r.firstName,
        status: r.status,
        emailLogId: r.emailLogId,
        error: r.error,
        sentAt: r.sentAt?.toISOString() ?? null,
        subjectRendered: r.subjectRendered,
        bodyRendered: r.bodyRendered,
      })),
      previews,
    });
  } catch (err) {
    console.error("[GET /api/admin/ai/campaigns/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not load campaign" }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
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
    if (campaign.status !== "draft" && campaign.status !== "pending_approval") {
      return NextResponse.json(
        {
          ok: false,
          error: `Campaign is ${campaign.status} — only draft or pending_approval campaigns can be edited`,
        },
        { status: 409 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid campaign update" },
        { status: 422 }
      );
    }

    let recipientCount = campaign.recipientCount;
    if (parsed.data.audience) {
      const { selectCampaignAudience } = await import("@/lib/ai-campaigns");
      recipientCount = (await selectCampaignAudience(parsed.data.audience)).length;
    }

    const updated = await db.aiCampaign.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.goal !== undefined ? { goal: parsed.data.goal } : {}),
        ...(parsed.data.audience !== undefined
          ? { audienceJson: parsed.data.audience as unknown as never }
          : {}),
        ...(parsed.data.subjectTemplate !== undefined
          ? { subjectTemplate: parsed.data.subjectTemplate }
          : {}),
        ...(parsed.data.bodyTemplate !== undefined ? { bodyTemplate: parsed.data.bodyTemplate } : {}),
        ...(parsed.data.ctaLabel !== undefined ? { ctaLabel: parsed.data.ctaLabel } : {}),
        ...(parsed.data.ctaUrl !== undefined ? { ctaUrl: parsed.data.ctaUrl } : {}),
        ...(parsed.data.audience !== undefined ? { recipientCount } : {}),
      },
    });

    return NextResponse.json({ ok: true, campaign: toCampaignDto(updated) });
  } catch (err) {
    console.error("[PUT /api/admin/ai/campaigns/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not update campaign" }, { status: 500 });
  }
}
