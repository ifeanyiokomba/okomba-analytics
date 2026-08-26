import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordAnalyticsEvent } from "@/lib/analytics-server";
import { parseProposalSnapshot } from "@/lib/invoice-pdf";
import { DVA_ACCOUNT_NAME } from "@/lib/brand";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/portal/[token] — Client Portal data (Module 8A)            */
/* Auth-free by design: the 192-bit unguessable token IS the auth.      */
/* Records a `portal_visit` analytics event + first-view stamp.         */
/* ------------------------------------------------------------------ */

const ALLOWED_STATUSES = new Set(["draft", "sent", "pending", "paid", "overdue", "cancelled"]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token || token.length < 16 || token.length > 128 || !/^[A-Za-z0-9_-]+$/.test(token)) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const invoice = await db.invoice.findUnique({ where: { secureToken: token } });
    if (!invoice) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    if (!ALLOWED_STATUSES.has(invoice.status)) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const proposal = parseProposalSnapshot(invoice);
    const amountNaira = Math.round(invoice.amountKobo / 100);

    // First-visit stamp (non-fatal)
    if (!invoice.portalViewedAt) {
      db.invoice
        .update({ where: { id: invoice.id }, data: { portalViewedAt: new Date() } })
        .catch(() => {});
    }
    // Analytics: portal_visit (spec 8C)
    void recordAnalyticsEvent({
      type: "portal_visit",
      invoiceId: invoice.id,
      secureToken: token,
      meta: { invoiceNumber: invoice.invoiceNumber, status: invoice.status },
    });

    return NextResponse.json({
      ok: true,
      portal: {
        token,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        service: invoice.service,
        description: invoice.description,
        amountNaira,
        currency: invoice.currency,
        durationLabel: invoice.durationLabel,
        dueDate: invoice.dueDate?.toISOString() ?? null,
        status: invoice.status,
        paidAt: invoice.paidAt?.toISOString() ?? null,
        sentAt: invoice.sentAt?.toISOString() ?? null,
        createdAt: invoice.createdAt.toISOString(),
        portalViewedAt: invoice.portalViewedAt?.toISOString() ?? null,
        dva: invoice.dvaAccountNumber
          ? {
              accountNumber: invoice.dvaAccountNumber,
              bankName: invoice.dvaBankName ?? "",
              accountName: DVA_ACCOUNT_NAME,
            }
          : null,
        pdf: {
          cloudinaryUrl: invoice.pdfStorage === "cloudinary" && invoice.pdfUrl ? invoice.pdfUrl : null,
          downloadUrl: `/api/portal/${token}/pdf`,
          storage: invoice.pdfStorage ?? "generated",
        },
        paymentProof: invoice.paymentProofUrl
          ? {
              fileName: invoice.paymentProofName,
              uploadedAt: invoice.paymentProofUploadedAt?.toISOString() ?? null,
            }
          : null,
        proposal,
      },
    });
  } catch (err) {
    console.error("[GET /api/portal/[token]]", err);
    return NextResponse.json({ ok: false, error: "Portal unavailable" }, { status: 500 });
  }
}
