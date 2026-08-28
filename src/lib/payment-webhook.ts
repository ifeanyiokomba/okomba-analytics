/**
 * Paystack webhook engine (Phase-2 Module 7 — PRIORITY).
 *
 * POST /api/paystack/webhook → verifyPaystackSignature() →
 * processPaystackEvent().
 *
 * Spec (user):
 *   1. Verify signature: x-paystack-signature header (HMAC-SHA512
 *      of the RAW request body with the secret key, hex-encoded).
 *   2. On "charge.success":
 *      a. Find invoice by DVA account_number
 *      b. Update invoice.status = "paid"
 *      c. Stop all reminders for this invoice
 *      d. AI "Thanks for payment" Email + WhatsApp — both with the
 *         official receipt PDF attached
 *      e. Create event: "Project Kickoff in 24h"
 *   3. On "transfer.success" — log for accounting.
 *
 * Every event lands in `webhook_logs` (the money trail the admin
 * inspects). Processing is idempotent: Paystack retries webhooks,
 * and a replay of the same event id resolves as `duplicate`.
 *
 * Signature secret resolution:
 *   PAYSTACK_WEBHOOK_SECRET  → preferred (allows dev-signed test
 *                              payloads while PAYSTACK_SECRET_KEY
 *                              is unset and DVAs stay in sandbox)
 *   PAYSTACK_SECRET_KEY      → production default (Paystack signs
 *                              with the secret key of the mode).
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import type { InputJsonValue } from "@prisma/client/runtime/library";
import { generateReceiptPdf, receiptNumberFor } from "@/lib/pdf/receipt-pdf";
import { generatePaymentThanks } from "@/lib/payment-ai";
import { sendPaymentThankYouEmail } from "@/lib/notify";
import { dispatchWhatsApp } from "@/lib/whatsapp";

export function paystackWebhookSecret(): string | null {
  return process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || null;
}

/** Verify the x-paystack-signature header against the RAW body. */
export function verifyPaystackSignature(
  rawBody: string,
  signature: string | null
): { valid: boolean; configured: boolean } {
  const secret = paystackWebhookSecret();
  if (!secret) return { valid: false, configured: false };
  if (!signature) return { valid: false, configured: true };
  const expected = createHmac("sha512", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim(), "utf8");
  if (a.length !== b.length) return { valid: false, configured: true };
  return { valid: timingSafeEqual(a, b), configured: true };
}

/* ── Payload shapes (only what we use) ─────────────────────── */

type PaystackDedicatedAccount = {
  account_number?: string;
  account_name?: string;
  bank?: { name?: string } | string;
};

type PaystackChargeData = {
  id?: number | string;
  domain?: string;
  status?: string;
  reference?: string;
  amount?: number; // kobo
  currency?: string;
  paid_at?: string;
  channel?: string;
  customer?: { email?: string; first_name?: string; last_name?: string };
  dedicated_account?: PaystackDedicatedAccount;
};

export type PaystackEvent = {
  event: string;
  data: PaystackChargeData & Record<string, unknown>;
};

/* ── Types for results ─────────────────────────────────────── */

export type WebhookOutcome = {
  status: "processed" | "failed" | "ignored" | "duplicate";
  detail: Record<string, unknown>;
  error?: string;
};

function trimPayload(raw: string): object {
  // Keep a bounded snapshot for the audit log (payloads can be big).
  try {
    const obj = JSON.parse(raw) as object;
    const json = JSON.stringify(obj);
    if (json.length > 6000) {
      return { truncated: json.slice(0, 6000) + "…[truncated]" };
    }
    return obj;
  } catch {
    return { raw: raw.length > 6000 ? raw.slice(0, 6000) + "…[truncated]" : raw };
  }
}

function paidLabel(d: Date): string {
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ── Main entry ────────────────────────────────────────────── */

/**
 * Process a verified (or admin-test) Paystack event.
 * Returns the outcome and persists the WebhookLog row.
 */
export async function processPaystackEvent(
  evt: PaystackEvent,
  opts: {
    rawBody: string;
    signatureValid: boolean;
    source?: "webhook" | "admin-test";
    logId?: string; // reuse an existing "received" row
  }
): Promise<{ logId: string; outcome: WebhookOutcome }> {
  const data = evt.data ?? {};
  const paystackId = data.id != null ? String(data.id) : null;
  const amount = typeof data.amount === "number" ? data.amount : null;
  const reference = typeof data.reference === "string" ? data.reference : null;

  // ── Dedup: same provider+event+paystackId already logged ──
  // (opts.logId is OUR OWN pre-created row from the route — not a dup)
  if (paystackId) {
    const existing = await db.webhookLog.findUnique({
      where: { provider_event_paystackId: { provider: "paystack", event: evt.event, paystackId } },
    });
    if (existing && existing.id !== opts.logId) {
      const dup: WebhookOutcome = {
        status: "duplicate",
        detail: { note: `event ${evt.event}/${paystackId} already logged`, originalLogId: existing.id },
      };
      // The caller pre-created a "received" row (webhook route) → flip it
      // to duplicate; otherwise record a fresh marker WITHOUT the unique
      // triple so the constraint on (provider, event, paystackId) holds.
      if (opts.logId) {
        await db.webhookLog
          .update({
            where: { id: opts.logId },
            data: {
              status: "duplicate",
              result: dup.detail as InputJsonValue,
              processedAt: new Date(),
            },
          })
          .catch(() => {});
        return { logId: opts.logId, outcome: dup };
      }
      const log = await db.webhookLog.create({
        data: {
          event: evt.event,
          paystackId: null, // avoid the unique triple — original owns it
          reference,
          amountKobo: amount,
          currency: typeof data.currency === "string" ? data.currency : null,
          signatureValid: opts.signatureValid,
          source: opts.source ?? "webhook",
          status: "duplicate",
          result: dup.detail as InputJsonValue,
          payload: trimPayload(opts.rawBody),
          processedAt: new Date(),
        },
      });
      return { logId: log.id, outcome: dup };
    }
  }

  // ── Persist / update the audit row ──
  const logData = {
    event: evt.event,
    paystackId,
    reference,
    amountKobo: amount,
    currency: typeof data.currency === "string" ? data.currency : null,
    signatureValid: opts.signatureValid,
    source: opts.source ?? "webhook",
    status: "received",
    payload: trimPayload(opts.rawBody),
  };
  const log = opts.logId
    ? await db.webhookLog.update({ where: { id: opts.logId }, data: logData })
    : await db.webhookLog.create({ data: logData });

  let outcome: WebhookOutcome;
  try {
    if (evt.event === "charge.success") {
      outcome = await handleChargeSuccess(data);
    } else if (evt.event === "transfer.success") {
      // Accounting log only — payouts from the Paystack balance.
      outcome = {
        status: "processed",
        detail: {
          note: "transfer.success logged for accounting",
          amount,
          reference,
          recipient: (data as { recipient?: unknown }).recipient ?? null,
        },
      };
    } else {
      outcome = { status: "ignored", detail: { note: `event ${evt.event} not handled` } };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "webhook processing failed";
    console.error(`[paystack-webhook] ${evt.event} failed:`, msg);
    outcome = { status: "failed", detail: {}, error: msg };
  }

  // Attach invoice linkage if the handler found one
  const invoiceNumber = typeof outcome.detail.invoiceNumber === "string" ? outcome.detail.invoiceNumber : null;
  const invoiceId = typeof outcome.detail.invoiceId === "string" ? outcome.detail.invoiceId : null;

  await db.webhookLog.update({
    where: { id: log.id },
    data: {
      status: outcome.status,
      result: outcome.detail as InputJsonValue,
      error: outcome.error ?? null,
      processedAt: new Date(),
      ...(invoiceId ? { invoiceId } : {}),
      ...(invoiceNumber ? { invoiceNumber } : {}),
    },
  });

  return { logId: log.id, outcome };
}

/* ── charge.success handler (the money path) ───────────────── */

async function handleChargeSuccess(data: PaystackChargeData): Promise<WebhookOutcome> {
  // Audit fix (Phase 27 + B2 deep-trace): invoice matching uses an
  // IMMUTABLE binding chain — never email+amount (which can collide
  // across multiple open invoices for the same customer). The lookup
  // order is:
  //   1. paystackReference (data.reference) — strongest, intended to
  //      be set at DVA / checkout creation time, unique per invoice.
  //      NOTE (B2 deep-trace): in the current production DVA-only
  //      flow this field is NOT actually written at invoice creation
  //      (src/lib/invoice-service.ts omits it from the create call),
  //      so for bank-transfer payments the primary lookup is dead
  //      code — only the secondary below actually matches. Switching
  //      to Paystack transaction.initialize / payment_request would
  //      let us mint our own reference at creation time and have it
  //      echoed in the webhook. Tracked as a recommended future fix
  //      in docs/paystack-flow-trace.md §E.
  //   2. dvaAccountNumber — per-customer (NOT per-invoice) on real
  //      Paystack; see the inline note in the secondary block below
  //      for how the multi-invoice case is handled (ambiguous →
  //      manual reconciliation, never "guess most recent").
  //   3. NO FALLBACK. If neither uniquely resolves, the payment lands
  //      in a "needs manual reconciliation" queue + alerts the admin.
  //      We do NOT auto-mark any invoice paid by email+amount heuristic.
  const reference =
    typeof data.reference === "string" && data.reference.trim()
      ? data.reference.trim()
      : null;
  const dva = data.dedicated_account ?? {};
  const accountNumber =
    typeof dva.account_number === "string" ? dva.account_number : null;

  let invoice: Awaited<ReturnType<typeof db.invoice.findFirst>> = null;

  // 1. Primary — paystackReference (intended unique-per-invoice; see
  //    the header note above for the B2 deep-trace caveat that the
  //    production DVA-only flow currently leaves this NULL at invoice
  //    creation, so this branch only fires for test-webhook admin
  //    smoke tests + future checkout-session flows).
  if (reference) {
    invoice = await db.invoice.findUnique({
      where: { paystackReference: reference },
    });
  }

  // 2. Secondary — DVA account_number.
  //
  // B2 deep-trace finding (Master Directive §5 / §13): the original
  // Phase 27 audit fix comment claimed "Paystack issues a fresh DVA
  // per invoice", but the production createInvoiceDva() path (see
  // src/lib/paystack.ts) actually REUSES the customer's existing DVA
  // on a second invoice — Paystack's DVA model is per-customer, not
  // per-invoice. The previous `findFirst({ orderBy: createdAt desc })`
  // would silently pick the most-recent invoice sharing that DVA,
  // re-introducing the original "wrong invoice marked paid" class of
  // bug for repeat customers with multiple outstanding invoices.
  //
  // The B1-A regression test (tests/paystack-account-isolation.test.ts)
  // does not catch this because every test invoice has a UNIQUE
  // dvaAccountNumber. In production, a single customer with two open
  // invoices shares the SAME dvaAccountNumber.
  //
  // Minimal fix: enumerate ALL invoices sharing this DVA. Only auto-
  // pay when exactly one match exists. When 2+ matches exist, route
  // to manual reconciliation so the admin picks the right invoice
  // (matches §13's "use stable database identifiers + explicit
  // relationships" rule — never guess by recency).
  if (!invoice && accountNumber) {
    const matches = await db.invoice.findMany({
      where: { dvaAccountNumber: accountNumber },
      orderBy: { createdAt: "desc" },
    });
    if (matches.length === 1) {
      invoice = matches[0] ?? null;
    } else if (matches.length > 1) {
      // Ambiguous: multiple invoices share this DVA. DO NOT guess.
      return {
        status: "failed",
        detail: {
          note:
            "multiple invoices share this DVA account_number — admin must manually reconcile to avoid marking the wrong invoice paid",
          lookedUpReference: reference,
          lookedUpAccount: accountNumber,
          customerEmail: data.customer?.email ?? null,
          amountKobo: typeof data.amount === "number" ? data.amount : null,
          ambiguousInvoiceIds: matches.map((m) => m.id),
          ambiguousInvoiceNumbers: matches.map((m) => m.invoiceNumber),
        },
        error: "ambiguous_dva_match_needs_manual_reconciliation",
      };
    }
  }

  // 3. No match — manual reconciliation queue (NEVER auto-pick by email+amount)
  if (!invoice) {
    return {
      status: "failed",
      detail: {
        note: "no invoice matched this payment by reference or DVA — queued for manual reconciliation",
        lookedUpReference: reference,
        lookedUpAccount: accountNumber,
        customerEmail: data.customer?.email ?? null,
        amountKobo: typeof data.amount === "number" ? data.amount : null,
        // The admin opens the failed webhook in the dashboard, verifies
        // the payment in Paystack, then manually marks the correct
        // invoice paid. Zero risk of marking the wrong invoice.
      },
      error: "invoice_not_found_needs_manual_reconciliation",
    };
  }

  const base = { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber };

  // Idempotency: already paid → nothing to do
  if (invoice.status === "paid") {
    return {
      status: "duplicate",
      detail: { ...base, note: "invoice already marked paid — no action" },
    };
  }

  const paidAt = data.paid_at ? new Date(data.paid_at) : new Date();
  if (Number.isNaN(paidAt.getTime())) paidAt.setTime(Date.now());
  const amountNaira = Math.round(invoice.amountKobo / 100);

  // b. Update invoice.status = "paid"
  invoice = await db.invoice.update({
    where: { id: invoice.id },
    data: { status: "paid", paidAt },
  });

  // c. Stop all reminders for this invoice
  const stopped = await db.eventRecord.updateMany({
    where: {
      relatedInvoiceId: invoice.id,
      type: { startsWith: "invoice.reminder" },
      status: "scheduled",
    },
    data: { status: "skipped" },
  });

  // d. AI "Thanks for payment" Email + WhatsApp with receipt PDF
  const thanks = await generatePaymentThanks({
    customerName: invoice.customerName,
    invoiceNumber: invoice.invoiceNumber,
    amountNaira,
    service: invoice.service,
    paidLabel: paidLabel(paidAt),
  });

  const receiptNumber = receiptNumberFor(invoice.invoiceNumber);
  const channelLabel = accountNumber
    ? `Bank transfer to dedicated account ${accountNumber}${typeof dva.bank === "object" && dva.bank?.name ? ` (${dva.bank.name})` : ""}`
    : null;
  const receiptPdf = await generateReceiptPdf({
    invoice,
    receiptNumber,
    paidAt,
    paystackReference: data.reference ?? null,
    channelLabel,
  });
  const receiptBase64 = receiptPdf.toString("base64");
  const receiptFilename = `Okomba_Receipt_${receiptNumber}.pdf`;

  const emailResult = await sendPaymentThankYouEmail({
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    receiptNumber,
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    service: invoice.service,
    amountNaira,
    paidLabel: paidLabel(paidAt),
    paystackReference: data.reference ?? null,
    bodyText: thanks.emailBody,
    pdfBase64: receiptBase64,
    pdfFilename: receiptFilename,
  });

  let whatsapp: { status: string; error?: string } = { status: "skipped" };
  if (invoice.customerPhone) {
    const wa = await dispatchWhatsApp({
      to: invoice.customerPhone,
      caption: thanks.whatsappText,
      pdfBase64: receiptBase64,
      filename: receiptFilename,
      invoiceId: invoice.id,
      source: "admin",
    });
    whatsapp = { status: wa.status, error: wa.error };
  }

  // e. Create event: "Project Kickoff in 24h"
  const kickoffAt = new Date(paidAt.getTime() + 24 * 60 * 60 * 1000);
  await db.eventRecord.create({
    data: {
      type: "project.kickoff",
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone,
      eventDate: kickoffAt,
      relatedInvoiceId: invoice.id,
      payload: {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        service: invoice.service,
        amountNaira,
        note: "Project kickoff in 24h after payment",
        paidAt: paidAt.toISOString(),
      },
      status: "scheduled",
    },
  });

  return {
    status: "processed",
    detail: {
      ...base,
      note: "payment confirmed — invoice marked paid",
      amountNaira,
      receiptNumber,
      remindersStopped: stopped.count,
      email: emailResult.ok ? "sent" : `failed: ${emailResult.error ?? "unknown"}`,
      whatsapp: whatsapp.status,
      aiUsedFallback: thanks.usedFallback,
      kickoffScheduledFor: kickoffAt.toISOString(),
    },
  };
}
