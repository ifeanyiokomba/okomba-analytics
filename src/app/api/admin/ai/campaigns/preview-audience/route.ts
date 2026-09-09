import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdmin } from "@/lib/admin-auth";
import { selectCampaignAudience, CAMPAIGN_AUDIENCE_SCHEMA } from "@/lib/ai-campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/admin/ai/campaigns/preview-audience — §56 dry audience    */
/* count + a MASKED sample (firstName, status, countryCode — NO        */
/* emails, §57 privacy) before any campaign is created.               */
/* broadcast_subscribers-gated.                                        */
/* ------------------------------------------------------------------ */

const schema = z.object({ filter: CAMPAIGN_AUDIENCE_SCHEMA });

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

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid audience filter" },
        { status: 422 }
      );
    }

    const audience = await selectCampaignAudience(parsed.data.filter);
    return NextResponse.json({
      ok: true,
      count: audience.length,
      sample: audience.slice(0, 10).map((c) => ({
        firstName: c.firstName,
        status: c.status,
        countryCode: c.countryCode,
      })),
    });
  } catch (err) {
    console.error("[POST /api/admin/ai/campaigns/preview-audience]", err);
    return NextResponse.json({ ok: false, error: "Could not preview audience" }, { status: 500 });
  }
}
