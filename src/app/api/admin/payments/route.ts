import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/admin/payments                                             */
/* Webhook log (the money trail) + paid-invoice roll-up for the        */
/* admin Payments tab.                                                 */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  try {
    if (!(await isAdminAuthorized(req))) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 200);

    const logs = await db.webhookLog.findMany({
      orderBy: { receivedAt: "desc" },
      take: limit,
    });

    const paidInvoices = await db.invoice.findMany({
      where: { status: "paid" },
      orderBy: { paidAt: "desc" },
      take: 50,
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        customerEmail: true,
        service: true,
        amountKobo: true,
        currency: true,
        paidAt: true,
      },
    });

    const kickoffEvents = await db.eventRecord.findMany({
      where: { type: "project.kickoff" },
      orderBy: { eventDate: "desc" },
      take: 20,
    });

    return NextResponse.json({
      ok: true,
      logs,
      paidInvoices,
      kickoffEvents,
    });
  } catch (err) {
    console.error("[GET /api/admin/payments]", err);
    return NextResponse.json({ ok: false, error: "Failed to load payments" }, { status: 500 });
  }
}
