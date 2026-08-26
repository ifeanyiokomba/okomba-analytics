import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordAnalyticsEvent } from "@/lib/analytics-server";
import { regenerateInvoicePdf } from "@/lib/invoice-pdf";
import { withAttachmentFlag } from "@/lib/cloudinary";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/portal/[token]/pdf — Download the proposal PDF (Module 8A)  */
/* Cloudinary URL set → 302 redirect (fl_attachment). Otherwise the    */
/* branded PDF is regenerated on the fly from the immutable snapshot   */
/* (deterministic — identical to what the customer originally got).    */
/* Records a `pdf_download` analytics event (spec 8C).                  */
/* ------------------------------------------------------------------ */

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

    // Analytics: pdf_download (spec 8C) — fire before serving
    void recordAnalyticsEvent({
      type: "pdf_download",
      invoiceId: invoice.id,
      secureToken: token,
      meta: {
        invoiceNumber: invoice.invoiceNumber,
        storage: invoice.pdfStorage ?? "generated",
      },
    });

    // Cloudinary-hosted PDF → redirect for a fast, cached download.
    if (invoice.pdfStorage === "cloudinary" && invoice.pdfUrl) {
      return NextResponse.redirect(withAttachmentFlag(invoice.pdfUrl), 302);
    }

    // Fallback (local/unconfigured): regenerate deterministically.
    const pdf = await regenerateInvoicePdf(invoice);
    const filename = `Okomba_Proposal_${invoice.invoiceNumber}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/portal/[token]/pdf]", err);
    return NextResponse.json({ ok: false, error: "PDF unavailable" }, { status: 500 });
  }
}
