/**
 * Payment reconciliation — webhook → Payment record → Invoice matching
 * (directive §25, §26, §34, §35, §36, §37).
 *
 * The matching chain per directive §25 + §36 (NEVER email+amount):
 *
 *   1. provider transaction/reference (data.reference)
 *      → bound to a specific invoice at checkout/DVA creation time
 *      → UNIQUE per invoice (Phase 27 audit fix added `paystackReference`
 *         String? @unique to the Invoice schema)
 *   2. DVA account_number → Customer
 *      → DVA is customer-owned (directive §9), not invoice-owned
 *      → identifies the CUSTOMER, not the invoice
 *   3. If Customer has exactly ONE open invoice (sent | pending | overdue):
 *      auto-bind it — safe because there's no ambiguity.
 *   4. If Customer has MULTIPLE open invoices:
 *      send to ambiguity queue — `Payment.status = "ambiguous"`,
 *      `invoiceId = null`. The admin manually picks the right invoice
 *      from the CRM (BATCH 7 will add the manual reconcile endpoint).
 *      NEVER auto-pick the newest invoice (directive §25 step 5).
 *   5. NO FALLBACK to email + amount (directive §36 — the Phase 27 audit
 *      fix already removed this heuristic).
 *
 * A Payment row is created on EVERY charge.success — even when the
 * invoice can't be safely matched — so the admin CRM's "Payment history"
 * panel sees every cent received (directive §26, §44).
 */

import { db } from "@/lib/db";
import {
  PaymentReconciliationError,
  toPaymentError,
} from "./errors";

export type NormalizedPaymentInput = {
  /** Paystack's data.id (event-level id) — used for dedup via WebhookLog. */
  paystackEventId?: string | number | null;
  /** Paystack's data.reference — unique per charge. */
  reference: string | null;
  /** Paystack's data.amount — kobo (NGN) or pesewas (GHS). */
  amountMinor: number | null;
  /** Paystack's data.currency — "NGN" | "GHS" | … */
  currency: string | null;
  /** Paystack's data.channel — "bank_transfer" | "card" | "ussd" | … */
  channel: string | null;
  /** Paystack's data.dedicated_account.account_number (when paid via DVA). */
  accountNumber: string | null;
  /** Paystack's data.paid_at — ISO timestamp. */
  paidAt: string | null;
  /** The raw data object — snapshotted into Payment.rawMetadata (bounded). */
  raw: Record<string, unknown>;
  /** The WebhookLog row id for back-linking. */
  webhookLogId?: string | null;
};

export type ReconciliationOutcome = {
  /** Created Payment row id (always present). */
  paymentId: string;
  /** Matched invoice id — null when ambiguous or not found. */
  invoiceId: string | null;
  /** Matched customer id — null when no DVA + no email match. */
  customerId: string | null;
  /** "successful" — invoice matched + marked paid.
   *  "ambiguous" — customer found, multiple open invoices, needs admin.
   *  "unmatched" — no customer found, needs admin. */
  status: "successful" | "ambiguous" | "unmatched";
  /** True when an invoice was marked paid this call. */
  invoicePaid: boolean;
  /** Diagnostic detail for the WebhookLog. */
  detail: Record<string, unknown>;
};

const OPEN_INVOICE_STATUSES = ["sent", "pending", "overdue"] as const;

/**
 * Reconcile a normalized Paystack charge.success into a Payment row +
 * safely mark the matching Invoice paid.
 *
 * Idempotent on `reference` (Payment.reference @unique) — a second call
 * with the same reference returns the existing Payment row's outcome
 * without creating a duplicate or re-marking the invoice.
 */
export async function reconcilePayment(
  input: NormalizedPaymentInput
): Promise<ReconciliationOutcome> {
  if (!input.reference) {
    throw new PaymentReconciliationError(
      "reconcilePayment: reference is required (no provider transaction id)",
      { meta: { input } }
    );
  }

  // ── Idempotency: a Payment with this reference already exists ──
  const existingPayment = await db.payment.findUnique({
    where: { reference: input.reference },
    include: { invoice: true, customer: true },
  });
  if (existingPayment) {
    return {
      paymentId: existingPayment.id,
      invoiceId: existingPayment.invoiceId,
      customerId: existingPayment.customerId,
      status:
        existingPayment.status === "successful"
          ? "successful"
          : existingPayment.status === "ambiguous"
            ? "ambiguous"
            : "unmatched",
      invoicePaid: existingPayment.invoice?.status === "paid",
      detail: {
        note: "Payment with this reference already exists — returning cached outcome",
        reference: input.reference,
      },
    };
  }

  // ── Step 1: try to match by reference on the Invoice (directive §25 step 1) ──
  //   This is the STRONGEST match — `paystackReference` is bound to an
  //   invoice at DVA / checkout creation time, unique per invoice.
  let invoice = input.reference
    ? await db.invoice.findUnique({
        where: { paystackReference: input.reference },
      })
    : null;
  let customerId: string | null = invoice?.customerId ?? null;

  // ── Step 2: resolve Customer by DVA account_number (directive §25 step 2) ──
  //   DVA is customer-owned — the account_number on the webhook identifies
  //   the Customer, not the Invoice.
  if (!customerId && input.accountNumber) {
    const customer = await db.customer.findFirst({
      where: { dvaAccountNumber: input.accountNumber },
    });
    if (customer) customerId = customer.id;
  }

  // ── Step 3: if no invoice matched by reference but customer found,
  //    count the customer's open invoices (directive §25 step 3) ──
  let ambiguityReason: string | null = null;
  if (!invoice && customerId) {
    const openInvoices = await db.invoice.findMany({
      where: {
        customerId,
        status: { in: [...OPEN_INVOICE_STATUSES] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (openInvoices.length === 1) {
      // Exactly one open invoice — safe to auto-bind.
      invoice = openInvoices[0];
    } else if (openInvoices.length === 0) {
      ambiguityReason = `customer ${customerId} has no open invoices — likely an overpayment or prepayment; needs admin`;
    } else {
      ambiguityReason = `customer ${customerId} has ${openInvoices.length} open invoices — admin must pick which one this payment applies to (no auto-pick by newest)`;
    }
  }

  // ── Step 4: persist the Payment row (directive §26) ──
  //   Always created — even when no invoice matched. The admin CRM's
  //   "Payment history" panel reads this table (directive §44).
  const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
  if (Number.isNaN(paidAt.getTime())) paidAt.setTime(Date.now());

  const status: "successful" | "ambiguous" | "unmatched" = invoice
    ? "successful"
    : customerId
      ? "ambiguous"
      : "unmatched";

  const rawMetadata = JSON.stringify(input.raw).slice(0, 6000);

  const payment = await db.payment.create({
    data: {
      customerId,
      invoiceId: invoice?.id ?? null,
      provider: "paystack",
      providerTransactionId: input.paystackEventId != null ? String(input.paystackEventId) : null,
      reference: input.reference,
      amountMinor: input.amountMinor ?? 0,
      currency: input.currency ?? "NGN",
      channel: input.channel,
      accountNumber: input.accountNumber,
      status,
      paidAt,
      rawMetadata,
      webhookLogId: input.webhookLogId ?? null,
      reconciledAt: invoice ? paidAt : null,
      reconciledBy: invoice ? "auto" : null,
    },
  });

  if (!invoice) {
    return {
      paymentId: payment.id,
      invoiceId: null,
      customerId,
      status,
      invoicePaid: false,
      detail: {
        note: "no invoice safely matched — Payment row created with status=" + status,
        reference: input.reference,
        accountNumber: input.accountNumber,
        amountMinor: input.amountMinor,
        currency: input.currency,
        ambiguityReason,
      },
    };
  }

  // ── Step 5: mark the invoice paid (only when safely matched) ──
  //   Idempotent on the invoice — if it's already paid, skip the
  //   update + downstream side-effects (receipt email, kickoff event).
  const freshInvoice = await db.invoice.findUnique({ where: { id: invoice.id } });
  if (!freshInvoice) {
    throw new PaymentReconciliationError(
      `reconcilePayment: invoice ${invoice.id} disappeared between match + update`,
      { meta: { paymentId: payment.id, invoiceId: invoice.id } }
    );
  }

  if (freshInvoice.status === "paid") {
    return {
      paymentId: payment.id,
      invoiceId: freshInvoice.id,
      customerId,
      status: "successful",
      invoicePaid: false, // already paid before this call — caller skips side-effects
      detail: {
        note: "invoice already paid before this payment arrived — Payment row recorded for audit; no side-effects fired",
        reference: input.reference,
        invoiceId: freshInvoice.id,
        invoiceNumber: freshInvoice.invoiceNumber,
      },
    };
  }

  const updatedInvoice = await db.invoice.update({
    where: { id: freshInvoice.id },
    data: { status: "paid", paidAt },
  });

  return {
    paymentId: payment.id,
    invoiceId: updatedInvoice.id,
    customerId,
    status: "successful",
    invoicePaid: true,
    detail: {
      note: "payment reconciled — invoice marked paid",
      reference: input.reference,
      invoiceId: updatedInvoice.id,
      invoiceNumber: updatedInvoice.invoiceNumber,
      customerId,
      amountMinor: input.amountMinor,
      currency: input.currency,
    },
  };
}

/**
 * Admin manual reconciliation — the admin CRM (BATCH 7) calls this when
 * a Payment row is in `ambiguous` or `unmatched` status and the admin
 * has verified which invoice the payment applies to.
 *
 * Idempotent — re-running with the same paymentId + invoiceId is a no-op
 * after the first call marks both rows reconciled.
 */
export async function manuallyReconcilePayment(
  paymentId: string,
  invoiceId: string,
  opts?: { adminEmail?: string }
): Promise<{ ok: true; paymentId: string; invoiceId: string }> {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) {
    throw new PaymentReconciliationError(
      `manuallyReconcilePayment: payment ${paymentId} not found`,
      { meta: { paymentId, invoiceId } }
    );
  }
  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) {
    throw new PaymentReconciliationError(
      `manuallyReconcilePayment: invoice ${invoiceId} not found`,
      { meta: { paymentId, invoiceId } }
    );
  }

  // If payment is already reconciled to this invoice, no-op.
  if (payment.invoiceId === invoiceId && payment.status === "successful") {
    return { ok: true, paymentId, invoiceId };
  }

  const now = new Date();
  await db.payment.update({
    where: { id: paymentId },
    data: {
      invoiceId,
      status: "successful",
      reconciledAt: now,
      reconciledBy: opts?.adminEmail ?? "admin",
    },
  });

  // Only flip the invoice if it's not already paid.
  if (invoice.status !== "paid") {
    await db.invoice.update({
      where: { id: invoiceId },
      data: { status: "paid", paidAt: payment.paidAt ?? now },
    });
  }

  return { ok: true, paymentId, invoiceId };
}

/** Bounded JSON snapshot for raw webhook payloads (kept under 6k chars). */
export function trimRawPayload(raw: string): string {
  return raw.length > 6000 ? `${raw.slice(0, 6000)}…[truncated]` : raw;
}

/** Defensive helper — wrap any thrown unknown into a typed PaymentReconciliationError. */
export function safeReconcilePayment(
  input: NormalizedPaymentInput
): Promise<ReconciliationOutcome> {
  return reconcilePayment(input).catch((err) => {
    throw toPaymentError(err);
  });
}
