import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import { listAudienceOptions } from "@/lib/ai-campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/admin/ai/campaigns/audience-options — §56 builder helper.  */
/* Distinct customer statuses / tags / countries / services (from     */
/* invoices + inquiries) with counts, for the audience picker.        */
/* broadcast_subscribers-gated.                                        */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  const guard = await authorizeAdmin(req, "broadcast_subscribers");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    const options = await listAudienceOptions();
    return NextResponse.json({ ok: true, options });
  } catch (err) {
    console.error("[GET /api/admin/ai/campaigns/audience-options]", err);
    return NextResponse.json({ ok: false, error: "Could not load audience options" }, { status: 500 });
  }
}
