/**
 * Invoice service — orchestrates the Phase-2 Module 4 pipeline:
 *
 *   inquiry → AI proposal (edited by admin) → invoice number
 *   → Paystack DVA → branded PDF → email w/ attachment
 *   → reminder events (Module 5 processes them)
 *   → WhatsApp caption queue (Module 6 dispatches it)
 */

import { db } from "@/lib/db";
import { createInvoiceDva } from "@/lib/paystack";
import { generateProposalPdf } from "@/lib/pdf/proposal-pdf";
import { sendProposalEmail } from "@/lib/notify";
import type { ProposalDraft } from "@/lib/proposal";
import { DVA_ACCOUNT_NAME } from "@/lib/brand";

export type SendProposalInput = {
  inquiryId: string;
  proposal: ProposalDraft;
  amountNaira: number;
  durationLabel?: string | null;
  dueDate?: Date | null;
  description?: string | null;
};

export type SendProposalResult = {
  ok: boolean;
  error?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  dva?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
    sandbox: boolean;
  };
  emailSent?: boolean;
  emailError?: string;
  whatsappQueued?: boolean;
  whatsappCaption?: string;
};

/* ── INV-YYYY-NNNN sequence ──────────────────────────────── */

export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const count = await db.invoice.count({
    where: { invoiceNumber: { startsWith: prefix } },
  });
  // Guard against rare collisions (e.g. cancelled rows) by bumping
  // until a free number is found.
  for (let i = count + 1; i < count + 50; i++) {
    const candidate = `${prefix}${String(i).padStart(4, "0")}`;
    const clash = await db.invoice.findUnique({ where: { invoiceNumber: candidate } });
    if (!clash) return candidate;
  }
  return `${prefix}${String(count + 50).padStart(4, "0")}`;
}

/* ── Full send pipeline ──────────────────────────────────── */

export async function sendProposal(input: SendProposalInput): Promise<SendProposalResult> {
  const inquiry = await db.inquiry.findUnique({ where: { id: input.inquiryId } });
  if (!inquiry) return { ok: false, error: "Inquiry not found" };

  const amountNaira = Math.max(0, Math.round(input.amountNaira));
  if (amountNaira <= 0) return { ok: false, error: "Amount must be greater than zero" };

  const invoiceNumber = await nextInvoiceNumber();
  const now = new Date();

  // 1. Paystack Dedicated Virtual Account (real or sandbox fallback)
  const dva = await createInvoiceDva({
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone ?? inquiry.whatsapp ?? null,
    invoiceNumber,
  });

  // 2. Branded proposal + invoice PDF
  const pdfBuffer = await generateProposalPdf({
    invoiceNumber,
    date: now,
    dueDate: input.dueDate ?? null,
    durationLabel: input.durationLabel ?? null,
    client: {
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone ?? inquiry.whatsapp ?? null,
    },
    service: inquiry.service,
    description: input.description ?? null,
    amountNaira,
    currency: "NGN",
    proposal: input.proposal,
    dva,
  });
  const pdfBase64 = pdfBuffer.toString("base64");
  const pdfFilename = `Okomba_Proposal_${invoiceNumber}.pdf`;

  // 3. Persist the invoice row (status: sent)
  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      inquiryId: inquiry.id,
      customerName: inquiry.name,
      customerEmail: inquiry.email,
      customerPhone: inquiry.phone ?? inquiry.whatsapp ?? null,
      service: inquiry.service,
      description: input.description ?? null,
      proposalJson: JSON.stringify(input.proposal),
      amountKobo: amountNaira * 100,
      currency: "NGN",
      durationLabel: input.durationLabel ?? null,
      dueDate: input.dueDate ?? null,
      status: "sent",
      dvaAccountNumber: dva.accountNumber,
      dvaBankName: dva.bankName,
      sentAt: now,
    },
  });

  // 4. Email with the PDF attached (subject fixed by spec)
  const emailResult = await sendProposalEmail({
    invoiceId: invoice.id,
    invoiceNumber,
    customerName: inquiry.name,
    customerEmail: inquiry.email,
    service: inquiry.service,
    description: input.description ?? null,
    amountNaira,
    currency: "NGN",
    durationLabel: input.durationLabel ?? null,
    dueDate: input.dueDate ? input.dueDate.toISOString() : null,
    dvaAccountNumber: dva.accountNumber,
    dvaBankName: dva.bankName,
    dvaAccountName: dva.accountName || DVA_ACCOUNT_NAME,
    pdfBase64,
    pdfFilename,
  });

  // 5. Nudge the inquiry into "contacted" once a proposal went out
  if (inquiry.status === "new") {
    try {
      await db.inquiry.update({ where: { id: inquiry.id }, data: { status: "contacted" } });
    } catch {
      /* non-fatal */
    }
  }

  // 6. Schedule reminder events (processed by the Module-5 cron)
  const due = input.dueDate ?? null;
  try {
    const events: { type: string; date: Date }[] = [];
    if (due) {
      const d3 = new Date(due.getTime() - 3 * 24 * 60 * 60 * 1000);
      if (d3 > now) {
        events.push({ type: "invoice.reminder_3d", date: d3 });
      }
      events.push({ type: "invoice.reminder_due", date: new Date(due) });
      events.push({
        type: "invoice.reminder_overdue",
        date: new Date(due.getTime() + 24 * 60 * 60 * 1000),
      });
    }
    if (events.length) {
      await db.eventRecord.createMany({
        data: events.map((e) => ({
          type: e.type,
          customerEmail: inquiry.email,
          customerPhone: inquiry.phone ?? inquiry.whatsapp ?? null,
          eventDate: e.date,
          relatedInvoiceId: invoice.id,
          payload: JSON.stringify({
            invoiceNumber,
            customerName: inquiry.name,
            amountNaira,
            service: inquiry.service,
          }),
          status: "scheduled",
        })),
      });
    }
  } catch (err) {
    console.error("[invoice-service] scheduling reminders failed:", err);
  }

  // 7. Queue the WhatsApp caption (spec text) — dispatched by the
  //    WhatsApp mini-service (Module 6) when connected.
  const caption = `Hi ${inquiry.name.split(" ")[0]}, here is your proposal and invoice from Okomba Analytics`;
  const waPhone = inquiry.whatsapp ?? inquiry.phone ?? null;
  let whatsappQueued = false;
  if (waPhone) {
    try {
      await db.whatsAppMessage.create({
        data: {
          direction: "outbound",
          toPhone: waPhone,
          messageText: caption,
          mediaFilename: pdfFilename,
          relatedInvoiceId: invoice.id,
        },
      });
      whatsappQueued = true;
    } catch (err) {
      console.error("[invoice-service] whatsapp queue failed:", err);
    }

    // Best-effort immediate dispatch if the WhatsApp mini-service is up
    const waUrl = process.env.WHATSAPP_SERVICE_URL;
    if (waUrl) {
      try {
        await fetch(`${waUrl.replace(/\/$/, "")}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: waPhone,
            caption,
            pdfBase64,
            filename: pdfFilename,
            invoiceId: invoice.id,
          }),
          signal: AbortSignal.timeout(12000),
        });
      } catch {
        /* stays queued — Module 6 retries */
      }
    }
  }

  return {
    ok: emailResult.ok,
    error: emailResult.ok ? undefined : emailResult.error,
    invoiceId: invoice.id,
    invoiceNumber,
    dva,
    emailSent: emailResult.ok,
    emailError: emailResult.error,
    whatsappQueued,
    whatsappCaption: whatsappQueued ? caption : undefined,
  };
}
