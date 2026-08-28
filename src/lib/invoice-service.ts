/**
 * Invoice service — orchestrates the Phase-2 Module 4 pipeline:
 *
 *   inquiry → AI proposal (edited by admin) → invoice number
 *   → Paystack DVA → branded PDF → email w/ attachment
 *   → reminder events (Module 5 processes them)
 *   → WhatsApp caption queue (Module 6 dispatches it)
 */

import { db } from "@/lib/db";
import type { InputJsonValue } from "@prisma/client/runtime/library";
import { createInvoiceDva } from "@/lib/paystack";
import { generateProposalPdf } from "@/lib/pdf/proposal-pdf";
import { sendProposalEmail } from "@/lib/notify";
import { dispatchWhatsApp } from "@/lib/whatsapp";
import type { ProposalDraft } from "@/lib/proposal";
import { DVA_ACCOUNT_NAME } from "@/lib/brand";
import { generatePortalToken, portalUrlFor } from "@/lib/portal";
import { uploadProposalPdf } from "@/lib/cloudinary";

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
  const secureToken = generatePortalToken();

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

  // 2b. Upload to Cloudinary (Module 8B) — falls back to local storage
  //     when unconfigured; never breaks the send pipeline.
  const cloudUpload = await uploadProposalPdf(invoiceNumber, pdfBuffer);

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
      proposalJson: input.proposal as InputJsonValue,
      amountKobo: amountNaira * 100,
      currency: "NGN",
      durationLabel: input.durationLabel ?? null,
      dueDate: input.dueDate ?? null,
      status: "sent",
      dvaAccountNumber: dva.accountNumber,
      dvaBankName: dva.bankName,
      secureToken,
      pdfUrl: cloudUpload.url,
      pdfStorage: cloudUpload.storage,
      sentAt: now,
    },
  });
  const portalUrl = portalUrlFor(secureToken);

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
    portalUrl,
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
          payload: {
            invoiceNumber,
            customerName: inquiry.name,
            amountNaira,
            service: inquiry.service,
          } as InputJsonValue,
          status: "scheduled",
        })),
      });
    }
  } catch (err) {
    console.error("[invoice-service] scheduling reminders failed:", err);
  }

  // 7. Queue + dispatch the WhatsApp caption (spec text) through the
  //    shared helper — the row lands in whatsapp_messages so it shows
  //    in the admin chat widget, and the mini-service transports it
  //    when connected (queued + flushed on reconnect otherwise).
  //    Module 8B: when Cloudinary uploaded OK, send the link (no bytes);
  //    otherwise keep the base64 attachment behaviour.
  const caption = `Hi ${inquiry.name.split(" ")[0]}, here is your proposal and invoice from Okomba Analytics`;
  const waPhone = inquiry.whatsapp ?? inquiry.phone ?? null;
  let whatsappQueued = false;
  if (waPhone) {
    try {
      const wa = await dispatchWhatsApp({
        to: waPhone,
        caption,
        pdfBase64: cloudUpload.storage === "cloudinary" ? null : pdfBase64,
        pdfUrl: cloudUpload.storage === "cloudinary" ? cloudUpload.url : null,
        filename: pdfFilename,
        invoiceId: invoice.id,
        source: "proposal",
      });
      whatsappQueued = wa.status === "sent" || wa.status === "queued";
    } catch (err) {
      console.error("[invoice-service] whatsapp dispatch failed:", err);
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
