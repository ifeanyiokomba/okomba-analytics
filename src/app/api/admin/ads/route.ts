import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { runAdLifecycle } from "@/lib/ads";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/admin/ads — §40 ads management list.                      */
/* Runs the §42 lifecycle engine first so statuses are fresh, then    */
/* returns every AdRequest (with attachment/creative previews) plus  */
/* queue stats for the tab header.                                    */
/* ------------------------------------------------------------------ */
export async function GET(req: Request) {
  try {
    const guard = await authorizeAdmin(req, "manage_ads");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    // §42 — flip due campaigns so the admin view is always current
    try {
      await runAdLifecycle();
    } catch (err) {
      console.error("[GET /api/admin/ads] lifecycle engine failed:", err);
    }

    const url = new URL(req.url);
    const wantsStats = url.searchParams.get("stats") === "1";

    const ads = await db.adRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        attachment: { select: { id: true, url: true, thumbUrl: true, originalName: true, mime: true } },
        creative: { select: { id: true, url: true, thumbUrl: true, originalName: true, mime: true } },
      },
    });

    const rows = ads.map((a) => ({
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      company: a.company,
      email: a.email,
      phone: a.phone,
      whatsapp: a.whatsapp,
      countryCode: a.countryCode,
      websiteUrl: a.websiteUrl,
      adType: a.adType,
      placement: a.placement,
      startDate: a.startDate,
      durationDays: a.durationDays,
      budget: a.budget,
      description: a.description,
      termsConsent: a.termsConsent,
      attachment: a.attachment,
      status: a.status,
      statusHistory: a.statusHistory,
      paymentStatus: a.paymentStatus,
      amount: a.amount ? a.amount.toString() : null,
      currency: a.currency,
      paidAt: a.paidAt,
      startAt: a.startAt,
      endAt: a.endAt,
      publishedAt: a.publishedAt,
      creative: a.creative,
      creativeUrl: a.creativeUrl,
      headline: a.headline,
      bodyCopy: a.bodyCopy,
      ctaLabel: a.ctaLabel,
      ctaUrl: a.ctaUrl,
      adminNotes: a.adminNotes,
      reviewedAt: a.reviewedAt,
      clicks: a.clicks,
      views: a.views,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    const stats = wantsStats
      ? {
          total: rows.length,
          new: rows.filter((r) => r.status === "new").length,
          awaitingAdmin: rows.filter(
            (r) => r.status === "new" || r.status === "reviewing" || r.status === "awaiting_customer"
          ).length,
          active: rows.filter((r) => r.status === "active").length,
          scheduled: rows.filter((r) => r.status === "scheduled").length,
          awaitingPayment: rows.filter(
            (r) => r.paymentStatus === "pending" && r.status !== "rejected"
          ).length,
          paidRevenue: rows
            .filter((r) => r.paymentStatus === "paid" && r.amount)
            .reduce((sum, r) => sum + Number(r.amount), 0),
        }
      : undefined;

    return NextResponse.json({ ok: true, ads: rows, ...(stats ? { stats } : {}) });
  } catch (err) {
    console.error("[GET /api/admin/ads]", err);
    return NextResponse.json({ ok: false, error: "Could not load ads" }, { status: 500 });
  }
}
