/**
 * Regenerate the branded proposal+invoice PDF for a stored Invoice
 * row, from its immutable `proposalJson` snapshot. Deterministic —
 * every regeneration produces the same document the customer
 * originally received, which is exactly what reminders re-attach.
 */

import type { Invoice } from "@/generated/prisma";
import { generateProposalPdf } from "@/lib/pdf/proposal-pdf";
import type { ProposalDraft } from "@/lib/proposal";
import { DVA_ACCOUNT_NAME } from "@/lib/brand";

export function parseProposalSnapshot(invoice: Invoice): ProposalDraft {
  try {
    const parsed = JSON.parse(invoice.proposalJson ?? "{}") as ProposalDraft;
    if (
      parsed &&
      typeof parsed.executiveSummary === "string" &&
      Array.isArray(parsed.objectives)
    ) {
      return parsed;
    }
  } catch {
    /* fall through */
  }
  return {
    executiveSummary: `${invoice.service} engagement proposal.`,
    objectives: [],
    scope: [],
    deliverables: [],
    timeline: [],
    terms: [],
  };
}

export async function regenerateInvoicePdf(invoice: Invoice): Promise<Buffer> {
  return generateProposalPdf({
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
    proposal: parseProposalSnapshot(invoice),
    dva: invoice.dvaAccountNumber
      ? {
          accountNumber: invoice.dvaAccountNumber,
          bankName: invoice.dvaBankName ?? "Paystack",
          accountName: DVA_ACCOUNT_NAME,
          sandbox: invoice.dvaBankName?.includes("Sandbox") ?? false,
        }
      : null,
  });
}
