import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import {
  createCampaign,
  toCampaignDto,
  CAMPAIGN_AUDIENCE_SCHEMA,
} from "@/lib/ai-campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/* GET  /api/admin/ai/campaigns — §56 list (≤100, newest first, with   */
/*       counts + status).                                             */
/* POST /api/admin/ai/campaigns — body {name, goal?, audience filter,  */
/*       generate?} → draft campaign + AI-generated templates (or a    */
/*       blank draft when generate=false) + recipientCount preview.    */
/* broadcast_subscribers-gated.                                        */
/* ------------------------------------------------------------------ */

const createSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required").max(120),
  goal: z.string().trim().max(1000).optional(),
  audience: CAMPAIGN_AUDIENCE_SCHEMA,
  generate: z.boolean().optional().default(true),
});

export async function GET(req: Request) {
  const guard = await authorizeAdmin(req, "broadcast_subscribers");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    const rows = await db.aiCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({
      ok: true,
      campaigns: rows.map((r) =>
        toCampaignDto({
          ...r,
          approvedAt: r.approvedAt,
          sentAt: r.sentAt,
        })
      ),
    });
  } catch (err) {
    console.error("[GET /api/admin/ai/campaigns]", err);
    return NextResponse.json({ ok: false, error: "Could not load campaigns" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const guard = await authorizeAdmin(req, "broadcast_subscribers");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid campaign" },
        { status: 422 }
      );
    }

    const { campaign, content } = await createCampaign({
      name: parsed.data.name,
      goal: parsed.data.goal ?? null,
      audience: parsed.data.audience,
      generate: parsed.data.generate,
    });
    return NextResponse.json({ ok: true, campaign, content }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/ai/campaigns]", err);
    return NextResponse.json({ ok: false, error: "Could not create campaign" }, { status: 500 });
  }
}
