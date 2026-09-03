import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/ads/click — §41 engagement tracking for sponsored CTAs.  */
/* Fire-and-forget from the public UI; increments the campaign's     */
/* click counter and records an analytics event. Only live campaigns */
/* count — you can't inflate a completed request.                     */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { id?: unknown };
    const id = typeof body.id === "string" ? body.id : "";
    if (!id || id.length > 64) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const updated = await db.adRequest.updateMany({
      where: { id, status: "active" },
      data: { clicks: { increment: 1 } },
    });
    if (updated.count === 0) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    try {
      await db.analyticsEvent.create({
        data: { type: "ad_click", meta: { adId: id } },
      });
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/ads/click]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
