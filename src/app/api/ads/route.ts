import { NextResponse } from "next/server";
import { activeAdsForPlacement, AD_PLACEMENT_KEYS, runAdLifecycle } from "@/lib/ads";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/ads?placement=home-banner — §41/§42 public ad feed.       */
/* Runs the lazy lifecycle engine first (scheduled→active→completed/  */
/* expired), then returns only live, sanitized ads for the requested */
/* placement. Placement is required and validated. No identity,      */
/* payment, or internal data ever leaves this route.                  */
/* ------------------------------------------------------------------ */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const placement = url.searchParams.get("placement") ?? "";
    if (!AD_PLACEMENT_KEYS.includes(placement as (typeof AD_PLACEMENT_KEYS)[number])) {
      return NextResponse.json({ ok: false, error: "Unknown placement" }, { status: 400 });
    }

    // §42 — flip due campaigns before serving
    try {
      await runAdLifecycle();
    } catch (err) {
      console.error("[GET /api/ads] lifecycle engine failed:", err);
    }

    const ads = await activeAdsForPlacement(placement);
    return NextResponse.json(
      { ok: true, placement, ads },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } }
    );
  } catch (err) {
    console.error("[GET /api/ads]", err);
    return NextResponse.json({ ok: false, error: "Could not load ads" }, { status: 500 });
  }
}
