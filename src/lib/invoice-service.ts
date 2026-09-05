/**
 * Invoice service — orchestrates the Phase-2 Module 4 pipeline:
 *
 *   inquiry → AI proposal (edited by admin) → invoice number
 *   → Paystack DVA → branded PDF → email w/ attachment
 *   → reminder events (Module 5 processes them)
 *   → WhatsApp caption queue (Module 6 dispatches it)
 *
 * ── BATCH 5 refactor (directive §9, §15, §23, §27, §29, §32, §33) ──
 * The DVA is now CUSTOMER-OWNED, not invoice-owned. The pipeline is:
 *
 *   load Inquiry
 *     ↓
 *   resolve Customer (by inquiry.customerId, fall back to email lookup)
 *     ↓
 *   resolve payment eligibility (NG/GH → DVA path; else → standard checkout)
 *     ↓
 *   getOrCreateCustomerDva(customer)   ← customer-level, idempotent
 *     ↓
 *   create Invoice (customerId FK + DVA snapshot)
 *     ↓
 *   generate PDF → email → WhatsApp → portal → reminders
 *
 * The invoice snapshots the customer's CURRENT DVA at creation time
 * (directive §33, §45) — if the customer's DVA changes later, the
 * historical invoice's displayed DVA does NOT silently change.
 *
 * Per directive §29, DVA provisioning does NOT happen at enquiry
 * submission time — only when a proposal is accepted and an invoice
 * is created.
 *
 * Per directive §27, non-eligible countries (US, GB, KE, ZA, …) skip
 * the DVA flow entirely. The customer pays via the standard Paystack
 * checkout route (the admin can generate a checkout URL separately).
 *
 * Per directive §21, production FAILS CLOSED for DVA provisioning —
 * if `PAYSTACK_SECRET_KEY` is unset in production and the customer is
 * DVA-eligible, we do NOT fabricate a synthetic account. The invoice
 * still sends (so the customer gets the proposal + portal link), but
 * the DVA snapshot fields stay NULL and the admin can retry DVA
 * provisioning from the CRM after configuring the secret key.
 */

import { db } from "@/lib/db";
import { createInvoiceDva, mintPaystackReference, type DvaResult } from "@/lib/paystack";
import type { InputJsonValue } from "@prisma/client/runtime/library";
import { getOrCreateCustomerDva, resolvePaymentEligibility, currencyForCountry, type CustomerDvaResult, type DvaStatus } from "@/lib/payment";
import { findOrCreateCustomer, type CustomerIdentityInput } from "@/lib/customer-service";
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
  /** Full DVA snapshot incl. OKM-{invoiceNumber} reference (see paystack.ts). */
  dva?: DvaResult;
  emailSent?: boolean;
  emailError?: string;
  whatsappQueued?: boolean;
  whatsappCaption?: string;
  customerId?: string;
  dvaStatus?: DvaStatus | null;
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

  // ── BATCH 5 (directive §32 step 1-3): resolve Customer ──
  //   The Customer row was created at enquiry submission (BATCH 2),
  //   so inquiry.customerId should be set. If a legacy inquiry doesn't
  //   have one (created before BATCH 2), we backfill via the local
  //   find-or-create helper using the inquiry's firstName/lastName/
  //   email/phone/countryCode fields.
  let customerId: string | null = inquiry.customerId ?? null;
  let customerCountryCode: string | null = inquiry.countryCode ?? null;
  let customerFirstName: string | null = inquiry.firstName ?? null;
  let customerLastName: string | null = inquiry.lastName ?? null;
  if (!customerId) {
    try {
      const identity: CustomerIdentityInput = {
        firstName: inquiry.firstName ?? inquiry.name?.split(" ")[0] ?? "Client",
        lastName: inquiry.lastName ?? (inquiry.name?.split(" ").slice(1).join(" ") || ""),
        email: inquiry.email,
        phone: inquiry.phone,
        whatsapp: inquiry.whatsapp,
        countryCode: inquiry.countryCode,
        source: "inquiry",
      };
      const upsert = await findOrCreateCustomer(identity);
      customerId = upsert.customer.id;
      customerCountryCode = upsert.customer.countryCode;
      customerFirstName = upsert.customer.firstName;
      customerLastName = upsert.customer.lastName;
      // Backfill the inquiry's customerId so future runs skip this.
      await db.inquiry.update({ where: { id: inquiry.id }, data: { customerId } }).catch(() => {});
    } catch (err) {
      console.error("[invoice-service] customer backfill failed:", err);
      // Non-fatal — we can still send the invoice without a customerId;
      // the existing email/PDF/portal pipeline uses customerEmail/Name
      // as the snapshot fields.
    }
  } else {
    // Load the Customer row to read the canonical countryCode + names.
    const c = await db.customer.findUnique({ where: { id: customerId } });
    if (c) {
      customerCountryCode = c.countryCode;
      if (c.firstName) customerFirstName = c.firstName;
      if (c.lastName) customerLastName = c.lastName;
    }
  }

  // ── BATCH 5 (directive §32 step 4): resolve payment eligibility ──
  //   NG/GH → DVA path. Anything else → standard Paystack checkout
  //   (directive §27). The browser is never the final authority —
  //   this is server-side.
  const eligibility = resolvePaymentEligibility(customerCountryCode);
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const isProduction = process.env.NODE_ENV === "production";

  // The DVA snapshot we'll write into the Invoice row (directive §33).
  // Stays null for non-eligible countries OR when DVA provisioning fails.
  let dvaSnapshot: {
    accountId?: string;
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
    bankCode?: string;
    bankSlug?: string;
    provider?: string;
    currency?: string;
  } | null = null;

  // The legacy DvaResult used by the existing PDF generator (carries
  // accountNumber/bankName/accountName/sandbox flag).
  let dvaForPdf: DvaResult | null = null;
  let dvaStatus: DvaStatus | null = null;

  if (eligibility === "eligible" && customerId) {
    // ── BATCH 5 (directive §32 step 5): getOrCreateCustomerDva ──
    //   Customer-owned, idempotent. In dev without PAYSTACK_SECRET_KEY,
    //   this throws DvaProvisioningError — we fall back to the legacy
    //   sandbox DVA so the local dev workflow still exercises the
    //   PDF + email + WhatsApp pipeline (directive §22: sandbox is OK
    //   for tests, never for production).
    try {
      const result: CustomerDvaResult = await getOrCreateCustomerDva({
        id: customerId,
        firstName: customerFirstName,
        lastName: customerLastName,
        email: inquiry.email,
        phone: inquiry.phone,
        countryCode: customerCountryCode ?? undefined,
      });
      if (result.status === "active" && result.dva) {
        dvaSnapshot = {
          accountId: result.dva.accountId,
          accountNumber: result.dva.accountNumber,
          accountName: result.dva.accountName,
          bankName: result.dva.bankName,
          bankCode: result.dva.bankCode,
          bankSlug: result.dva.bankSlug,
          provider: result.dva.provider,
          currency: result.dva.currency,
        };
        dvaForPdf = {
          accountNumber: result.dva.accountNumber,
          bankName: result.dva.bankName,
          bankCode: result.dva.bankCode,
          bankSlug: result.dva.bankSlug,
          provider: result.dva.provider,
          currency: result.dva.currency,
          accountName: result.dva.accountName || DVA_ACCOUNT_NAME,
          // B3 GAP-A fix (merged): the customer-level DVA flow mints the
          // same per-invoice reference as the legacy entrypoint so the
          // webhook's primary findUnique-by-reference lookup always has
          // a value to match (tests/paystack-reference-mint.test.ts).
          reference: mintPaystackReference(invoiceNumber),
          sandbox: false,
        };
        dvaStatus = "active";
      }
    } catch (err) {
      // DVA provisioning failed. In production, NEVER fabricate (§21).
      // In dev, fall back to the legacy sandbox DVA so the pipeline can
      // be exercised end-to-end.
      if (!isProduction && !secretKey) {
        console.info("[invoice-service] DVA service unavailable in dev — falling back to legacy sandbox DVA");
        dvaForPdf = await createInvoiceDva({
          name: inquiry.name,
          email: inquiry.email,
          phone: inquiry.phone ?? inquiry.whatsapp ?? null,
          invoiceNumber,
        });
        dvaStatus = "pending";
      } else {
        // Production OR Paystack misconfigured in dev. Log + continue
        // without a DVA snapshot — the customer pays via standard
        // Paystack checkout. The admin can retry DVA provisioning from
        // the CRM after fixing the configuration.
        console.error("[invoice-service] DVA provisioning failed — invoice will send without a DVA snapshot:", err);
        dvaStatus = "failed";
      }
    }
  } else if (eligibility !== "eligible") {
    // Non-eligible country — standard Paystack checkout route (§27).
    dvaStatus = "not_eligible";
  }

  // ── BATCH 5 (directive §32 step 6): generate the branded PDF ──
  //   The PDF generator accepts an optional DVA block — when null, it
  //   omits the "pay into this account" section and shows the standard
  //   "we'll send you a secure payment link" copy instead.
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
    currency: dvaSnapshot?.currency ?? currencyForCountry(customerCountryCode) ?? "NGN",
    proposal: input.proposal,
    dva: dvaForPdf ?? null,
  });
  const pdfBase64 = pdfBuffer.toString("base64");
  const pdfFilename = `Okomba_Proposal_${invoiceNumber}.pdf`;

  // 2b. Upload to Cloudinary (Module 8B) — falls back to local storage
  //     when unconfigured; never breaks the send pipeline.
  const cloudUpload = await uploadProposalPdf(invoiceNumber, pdfBuffer);

  // ── BATCH 5 (directive §32 step 7): create the Invoice row ──
  //    customerId FK + DVA snapshot fields (directive §33). The legacy
  //    customerName/customerEmail/customerPhone fields stay as snapshots
  //    for backward-compat with the existing PDF/email/portal.
  //
  //    B3 GAP-A fix (merged from the audit stream): persist
  //    `paystackReference` (minted via mintPaystackReference — the same
  //    contract as createInvoiceDva) so the webhook handler's primary
  //    lookup (findUnique by reference) has something to match against
  //    future checkout-session flows (transaction.initialize /
  //    payment_request echo back the reference in charge.success).
  //    For the current DVA-bank-transfer flow, Paystack's webhook does
  //    NOT carry this reference, so the webhook falls through to the
  //    secondary lookup (dvaAccountNumber, now ambiguity-safe per B2's
  //    fix). The reference is also surfaced in the admin CRM timeline.
  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      inquiryId: inquiry.id,
      customerId, // ── BATCH 1 + BATCH 5: FK to Customer (directive §23)
      customerName: inquiry.name,
      customerEmail: inquiry.email,
      customerPhone: inquiry.phone ?? inquiry.whatsapp ?? null,
      service: inquiry.service,
      description: input.description ?? null,
      proposalJson: input.proposal as InputJsonValue,
      amountKobo: amountNaira * 100,
      currency: dvaSnapshot?.currency ?? currencyForCountry(customerCountryCode) ?? "NGN",
      durationLabel: input.durationLabel ?? null,
      dueDate: input.dueDate ?? null,
      status: "sent",
      // ── DVA snapshot (directive §33, §45) — historical copy at send time ──
      //    (falls back to the legacy dvaForPdf values when only the legacy
      //    sandbox path ran, so the webhook matcher always has data)
      dvaAccountId: dvaSnapshot?.accountId ?? null,
      dvaAccountNumber: dvaSnapshot?.accountNumber ?? dvaForPdf?.accountNumber ?? null,
      dvaAccountName: dvaSnapshot?.accountName ?? dvaForPdf?.accountName ?? null,
      dvaBankName: dvaSnapshot?.bankName ?? dvaForPdf?.bankName ?? null,
      dvaBankCode: dvaSnapshot?.bankCode ?? dvaForPdf?.bankCode ?? null,
      dvaBankSlug: dvaSnapshot?.bankSlug ?? dvaForPdf?.bankSlug ?? null,
      dvaProvider: dvaSnapshot?.provider ?? dvaForPdf?.provider ?? null,
      dvaCurrency: dvaSnapshot?.currency ?? dvaForPdf?.currency ?? null,
      // B3 GAP-A fix (merged): per-invoice Paystack reference, persisted
      // at creation for the webhook's primary lookup. Minted with the
      // same contract as createInvoiceDva — see mintPaystackReference.
      paystackReference: dvaForPdf?.reference ?? mintPaystackReference(invoiceNumber),
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
    currency: dvaSnapshot?.currency ?? "NGN",
    durationLabel: input.durationLabel ?? null,
    dueDate: input.dueDate ? input.dueDate.toISOString() : null,
    dvaAccountNumber: dvaForPdf?.accountNumber ?? null,
    dvaBankName: dvaForPdf?.bankName ?? null,
    dvaAccountName: dvaForPdf?.accountName || DVA_ACCOUNT_NAME,
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
  //    ── BATCH 5: prefer firstName for the salutation (directive §48 —
  //    no name splitting for newly submitted users). For legacy rows
  //    that only have `name`, fall back to the first word. ──
  const salutation = customerFirstName ?? inquiry.name.split(" ")[0];
  const caption = `Hi ${salutation}, here is your proposal and invoice from Okomba Analytics`;
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
    dva: dvaForPdf
      ? {
          accountNumber: dvaForPdf.accountNumber,
          bankName: dvaForPdf.bankName,
          bankCode: dvaForPdf.bankCode,
          bankSlug: dvaForPdf.bankSlug,
          provider: dvaForPdf.provider,
          currency: dvaForPdf.currency,
          accountName: dvaForPdf.accountName,
          reference: dvaForPdf.reference,
          sandbox: dvaForPdf.sandbox,
        }
      : undefined,
    emailSent: emailResult.ok,
    emailError: emailResult.error,
    whatsappQueued,
    whatsappCaption: whatsappQueued ? caption : undefined,
    customerId: customerId ?? undefined,
    dvaStatus,
  };
}
