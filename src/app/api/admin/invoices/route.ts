import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/admin/invoices — list invoices for the Proposals tab       */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const invoices = await db.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({
      ok: true,
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        inquiryId: inv.inquiryId,
        customerName: inv.customerName,
        customerEmail: inv.customerEmail,
        service: inv.service,
        amountNaira: Math.round(inv.amountKobo / 100),
        currency: inv.currency,
        durationLabel: inv.durationLabel,
        dueDate: inv.dueDate?.toISOString() ?? null,
        status: inv.status,
        dvaAccountNumber: inv.dvaAccountNumber,
        dvaBankName: inv.dvaBankName,
        dvaSandbox: inv.dvaBankName?.includes("Sandbox") ?? false,
        sentAt: inv.sentAt?.toISOString() ?? null,
        paidAt: inv.paidAt?.toISOString() ?? null,
        createdAt: inv.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/invoices]", err);
    return NextResponse.json({ ok: false, error: "Failed to load invoices" }, { status: 500 });
  }
}
