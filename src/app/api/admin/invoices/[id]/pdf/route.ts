import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { generateProposalPdf } from "@/lib/pdf/proposal-pdf";
import type { ProposalDraft } from "@/lib/proposal";
import { DVA_ACCOUNT_NAME } from "@/lib/brand";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/admin/invoices/[id]/pdf?download=1                         */
/* Regenerates the branded proposal+invoice PDF from the stored        */
/* snapshot so the admin can view or re-download it any time.          */
/* ------------------------------------------------------------------ */

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const invoice = await db.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 });
    }

    let proposal: ProposalDraft;
    try {
      proposal = JSON.parse(invoice.proposalJson ?? "{}") as ProposalDraft;
    } catch {
      proposal = {
        executiveSummary: `${invoice.service} engagement proposal.`,
        objectives: [],
        scope: [],
        deliverables: [],
        timeline: [],
        terms: [],
      };
    }

    const pdf = await generateProposalPdf({
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.sentAt ?? invoice.createdAt,
      dueDate: invoice.dueDate,
      durationLabel: invoice.durationLabel,
      client: {
        name: invoice.customerName,
        email: invoice.customerEmail,
        phone: invoice.customerPhone,
      },
      service: invoice.service,
      description: invoice.description,
      amountNaira: Math.round(invoice.amountKobo / 100),
      currency: invoice.currency,
      proposal,
      dva: invoice.dvaAccountNumber
        ? {
            accountNumber: invoice.dvaAccountNumber,
            bankName: invoice.dvaBankName ?? "Paystack",
            accountName: DVA_ACCOUNT_NAME,
            sandbox: invoice.dvaBankName?.includes("Sandbox") ?? false,
          }
        : null,
    });

    const url = new URL(req.url);
    const download = url.searchParams.get("download") === "1";
    const filename = `Okomba_Proposal_${invoice.invoiceNumber}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/invoices/[id]/pdf]", err);
    return NextResponse.json({ ok: false, error: "Failed to build PDF" }, { status: 500 });
  }
}
