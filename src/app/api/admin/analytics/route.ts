import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { backupStatus } from "@/lib/backup";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/admin/analytics — data for the Admin Analytics tab (8C)     */
/* KPIs: Revenue MTD · Paid count · AI conversion % · Avg deal size      */
/* Chart: revenue per day, last 90 days · Table: revenue by service     */
/* Plus funnel event counts (30d) and the Module-8B backup trail.       */
/* All paid-revenue math uses paidAt in Africa/Lagos (UTC+1).           */
/* ------------------------------------------------------------------ */

const LAGOS_OFFSET_MS = 60 * 60 * 1000; // UTC+1, no DST

function lagosDayKey(d: Date): string {
  return new Date(d.getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
}
function lagosMonthStart(): { start: Date; key: string } {
  const nowLagos = new Date(Date.now() + LAGOS_OFFSET_MS);
  const y = nowLagos.getUTCFullYear();
  const m = nowLagos.getUTCMonth();
  const startUtc = new Date(Date.UTC(y, m, 1) - LAGOS_OFFSET_MS);
  return { start: startUtc, key: `${y}-${String(m + 1).padStart(2, "0")}` };
}

export async function GET() {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [paidInvoices, allInvoices, aiInquiries, events, drafts, backups] = await Promise.all([
      db.invoice.findMany({
        where: { status: "paid", paidAt: { not: null } },
        select: { id: true, service: true, amountKobo: true, paidAt: true, inquiryId: true, invoiceNumber: true },
      }),
      db.invoice.findMany({
        select: { id: true, amountKobo: true, status: true, createdAt: true },
      }),
      db.inquiry.findMany({
        where: { source: "ai_chat" },
        select: { id: true, createdAt: true },
      }),
      db.analyticsEvent.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { type: true, createdAt: true },
      }),
      db.draftProposal.count(),
      backupStatus(),
    ]);

    /* ── KPIs ── */
    const { start: mtdStart } = lagosMonthStart();
    const revenueMtd = paidInvoices
      .filter((i) => (i.paidAt as Date) >= mtdStart)
      .reduce((s, i) => s + i.amountKobo, 0);
    const revenueTotal = paidInvoices.reduce((s, i) => s + i.amountKobo, 0);
    const avgDealKobo = paidInvoices.length
      ? Math.round(revenueTotal / paidInvoices.length)
      : 0;
    const outstandingKobo = allInvoices
      .filter((i) => i.status === "sent" || i.status === "pending" || i.status === "overdue")
      .reduce((s, i) => s + i.amountKobo, 0);

    // AI conversion: AI-chat inquiries → invoices PAID
    const aiInquiryIds = new Set(aiInquiries.map((i) => i.id));
    const aiWon = paidInvoices.filter((i) => i.inquiryId && aiInquiryIds.has(i.inquiryId)).length;
    const aiConversion = aiInquiries.length ? Math.round((aiWon / aiInquiries.length) * 100) : 0;

    /* ── Revenue per day (90 days, paid only) ── */
    const dayMap = new Map<string, number>();
    for (let d = 89; d >= 0; d--) {
      dayMap.set(lagosDayKey(new Date(now.getTime() - d * 24 * 60 * 60 * 1000)), 0);
    }
    for (const inv of paidInvoices) {
      const key = lagosDayKey(inv.paidAt as Date);
      if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + inv.amountKobo);
    }
    const revenueByDay = Array.from(dayMap.entries()).map(([date, kobo]) => ({
      date,
      amountNaira: Math.round(kobo / 100),
    }));

    /* ── Revenue by service (paid only) ── */
    const svcMap = new Map<string, { naira: number; count: number }>();
    for (const inv of paidInvoices) {
      const cur = svcMap.get(inv.service) ?? { naira: 0, count: 0 };
      cur.naira += Math.round(inv.amountKobo / 100);
      cur.count += 1;
      svcMap.set(inv.service, cur);
    }
    const revenueByService = Array.from(svcMap.entries())
      .map(([service, v]) => ({ service, amountNaira: v.naira, paidCount: v.count }))
      .sort((a, b) => b.amountNaira - a.amountNaira);

    /* ── Event counts (30 days) ── */
    const eventCounts: Record<string, number> = {
      ai_chat_start: 0,
      portal_visit: 0,
      proposal_view: 0,
      pdf_download: 0,
      payment_click: 0,
      payment_proof_uploaded: 0,
    };
    for (const e of events) {
      eventCounts[e.type] = (eventCounts[e.type] ?? 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      kpis: {
        revenueMtdNaira: Math.round(revenueMtd / 100),
        revenueTotalNaira: Math.round(revenueTotal / 100),
        outstandingNaira: Math.round(outstandingKobo / 100),
        paidCount: paidInvoices.length,
        avgDealNaira: Math.round(avgDealKobo / 100),
        aiLeads: aiInquiries.length,
        aiWon,
        aiConversionPct: aiConversion,
        draftsCount: drafts,
        invoicesTotal: allInvoices.length,
      },
      revenueByDay,
      revenueByService,
      eventCounts,
      backups: {
        configured: backups.configured,
        cloudinary: isCloudinaryConfigured(),
        retentionDays: backups.retentionDays,
        logs: backups.logs.slice(0, 8),
      },
      generatedAt: now.toISOString(),
    });
  } catch (err) {
    console.error("[GET /api/admin/analytics]", err);
    return NextResponse.json({ ok: false, error: "Failed to load analytics" }, { status: 500 });
  }
}
