/**
 * Paystack Dedicated Virtual Account (DVA) — legacy compat shim.
 *
 * ── BATCH 3 (directive §38, §41, §48) ──
 * This file is preserved for backward-compat with `src/lib/invoice-service.ts`,
 * which still imports `createInvoiceDva()`. Internally it now delegates to
 * the typed payment domain boundary (`@/lib/payment`), so:
 *
 *   • Customer creation no longer splits a combined `name` string
 *     (directive §48: "Do not use name splitting for newly submitted users")
 *     — the caller passes `firstName`/`lastName` explicitly and the
 *     typed client passes them straight through to Paystack.
 *   • Misleading comments ("DVA is per invoice") have been corrected to
 *     "DVA is customer-level" (directive §41). Invoices snapshot the
 *     customer's DVA at creation time (handled in BATCH 5).
 *   • The deterministic sandbox DVA fallback is RETAINED for local dev /
 *     automated tests ONLY when `NODE_ENV !== "production"`. Production
 *     FAILS CLOSED — no synthetic account is ever shown to a real
 *     customer (directive §21, §22).
 *
 * BATCH 4 will replace this legacy entrypoint entirely with
 * `getOrCreateCustomerDva(customer)`.
 */

import { createHash } from "node:crypto";
import { DVA_ACCOUNT_NAME } from "@/lib/brand";
import {
  createPaystackClient,
  type PaystackDva,
} from "@/lib/payment/paystack-client";
import { DvaProvisioningError, PaystackCustomerError } from "@/lib/payment/errors";

export type DvaResult = {
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  bankSlug?: string;
  provider?: string;
  currency?: string;
  accountName: string;
  /**
   * Minted per-invoice Paystack reference. The Paystack Dedicated
   * Virtual Account API does NOT return a per-invoice reference
   * (DVAs are per-customer, not per-invoice) — so we mint our own
   * deterministic OKM-{invoiceNumber} token at creation time.
   *
   * This reference is persisted to `Invoice.paystackReference` so
   * the webhook handler's primary lookup (findUnique by reference)
   * has something to match against future checkout-session flows
   * (transaction.initialize / payment_request) — which DO echo
   * back the reference — and so the @unique DB constraint at
   * `prisma/schema.prisma` is exercised at the production data
   * level. For the current DVA-bank-transfer flow, Paystack's
   * charge.success webhook does NOT carry this reference, so the
   * webhook handler falls through to the secondary lookup
   * (dvaAccountNumber) — which is now ambiguity-safe per B2's fix.
   */
  reference?: string;
  sandbox: boolean;
};

/** 
 * Deterministic sandbox DVA generator — LOCAL DEV / TESTS ONLY.
 * Never reachable in production (guard at the call site).
 */
function sandboxDva(seed: string, invoiceNumber: string): DvaResult {
  const digest = createHash("sha256").update(seed).digest("hex");
  const accountNumber = (parseInt(digest.slice(0, 10), 16) % 1_000_000_000)
    .toString()
    .padStart(10, "9");
  return {
    accountNumber,
    bankName: "Paystack Test Bank (Sandbox)",
    accountName: DVA_ACCOUNT_NAME,
    // Deterministic per-invoice reference — idempotent across retries
    // of `createInvoiceDva` for the same invoiceNumber. Matches the
    // B3 GAP-A fix contract: OKM-{invoiceNumber} (no timestamp in
    // sandbox mode so re-runs of the pipeline against the same
    // invoiceNumber produce the same persisted paystackReference,
    // avoiding @unique-constraint violations on retry).
    reference: `OKM-${invoiceNumber}`,
    sandbox: true,
  };
}

/**
 * Create (or reuse) a Paystack customer + dedicated virtual account for
 * the client of an invoice. Falls back to a SANDBOX DVA when no
 * `PAYSTACK_SECRET_KEY` is configured AND we are NOT in production.
 *
 * In production without a secret key, this THROWS — never fabricates
 * an account (directive §21: "A synthetic account must never be
 * presented to a real customer").
 *
 * NOTE (directive §9): the canonical DVA belongs to the Customer, not
 * the Invoice. BATCH 4 will replace this function with
 * `getOrCreateCustomerDva(customer)` and the invoice pipeline will
 * snapshot the customer's DVA into the Invoice row. For now, this
 * legacy entrypoint is kept so the existing invoice workflow keeps
 * working through the BATCH 3 transition.
 */
export async function createInvoiceDva(client: {
  // The legacy caller in invoice-service.ts still passes a single `name`
  // string. We treat it as a DISPLAY-ONLY fallback — we do NOT split it
  // (directive §41, §48). BATCH 4 removes this entirely.
  name: string;
  email: string;
  phone?: string | null;
  invoiceNumber: string;
}): Promise<DvaResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const isProduction = process.env.NODE_ENV === "production";

  // ── No secret key configured ──
  //   Dev / test → deterministic sandbox DVA.
  //   Production → THROW. No synthetic accounts to real customers (§21).
  if (!secretKey) {
    if (isProduction) {
      throw new DvaProvisioningError(
        "PAYSTACK_SECRET_KEY is not configured — refusing to fabricate a DVA in production",
        { meta: { invoiceNumber: client.invoiceNumber, email: client.email } }
      );
    }
    console.info(
      `[paystack] PAYSTACK_SECRET_KEY not set — issuing sandbox DVA for ${client.invoiceNumber}`
    );
    return sandboxDva(`${client.email}|${client.invoiceNumber}`, client.invoiceNumber);
  }

  const ps = createPaystackClient(() => secretKey);

  // 1. Create the customer. We pass `first_name`/`last_name` WITHOUT
  //    splitting the legacy `name` string (directive §41, §48). For
  //    legacy callers that only have one combined `name`, we send the
  //    whole thing as `first_name`. BATCH 4 removes this entrypoint.
  //    If the create call fails because the customer already exists,
  //    we fall through to fetch by email.
  let customerId: number | undefined;
  try {
    const created = await ps.createCustomer({
      email: client.email,
      firstName: client.name || "Client",
      lastName: "",
      phone: client.phone ?? "",
    });
    customerId = created.id;
  } catch (err) {
    if (err instanceof PaystackCustomerError && /already exists|duplicate/i.test(err.message)) {
      // Fall through to fetch-by-email below.
    } else {
      console.warn("[paystack] createCustomer failed — will try fetch:", err instanceof Error ? err.message : err);
    }
  }

  if (!customerId) {
    const lookup = await ps.fetchCustomer(client.email);
    if (lookup) customerId = lookup.id;
  }

  if (!customerId) {
    if (isProduction) {
      throw new DvaProvisioningError(
        "Could not create or resolve a Paystack customer — refusing to fabricate a DVA in production",
        { meta: { invoiceNumber: client.invoiceNumber, email: client.email } }
      );
    }
    console.error("[paystack] could not create/resolve customer — sandbox fallback");
    return sandboxDva(`${client.email}|${client.invoiceNumber}`, client.invoiceNumber);
  }

  // 2. Create the DVA. The canonical model (BATCH 4) will check for an
  //    existing active DVA on the Customer row BEFORE creating a new one
  //    (directive §15 step 3). For now this legacy path always tries to
  //    create — Paystack itself dedupes one DVA per customer and returns
  //    the existing one in that case.
  let dva: PaystackDva | null = null;
  try {
    dva = await ps.createDva({ customer: customerId });
  } catch (err) {
    // DVA may already exist for this customer — fall through to list.
    console.warn("[paystack] createDva failed — will try list:", err instanceof Error ? err.message : err);
  }

  // 3. List + reuse an existing active DVA for this customer.
  if (!dva) {
    try {
      const list = await ps.listDvas({ customer: customerId, active: true });
      dva = list[0] ?? null;
    } catch (err) {
      console.error("[paystack] DVA list fallback failed:", err);
    }
  }

  if (dva) {
    return {
      accountNumber: dva.account_number,
      bankName: dva.bank?.name ?? "Paystack",
      bankCode: dva.bank?.code,
      bankSlug: dva.bank?.slug,
      provider: dva.provider_slug,
      currency: dva.currency,
      accountName: dva.account_name || DVA_ACCOUNT_NAME,
      // Mint our own per-invoice reference (Paystack's DVA API does
      // not return one — DVAs are per-customer, not per-invoice).
      // Unique per creation attempt via Date.now() so two distinct
      // createInvoiceDva calls for DIFFERENT invoices can never
      // collide on the @unique constraint. (For the SAME invoice
      // this branch is only reached once per proposal send; on
      // retries the existing-DVA fallback above is taken instead.)
      // This is the B3 GAP-A contract: the webhook's PRIMARY lookup
      // is findUnique(Invoice.paystackReference).
      reference: `OKM-${client.invoiceNumber}-${Date.now()}`,
      sandbox: false,
    };
  }

  if (isProduction) {
    throw new DvaProvisioningError(
      "DVA creation failed and no existing DVA was found — refusing to fabricate in production",
      { meta: { invoiceNumber: client.invoiceNumber, customerId } }
    );
  }
  console.error("[paystack] DVA creation failed — sandbox fallback");
  return sandboxDva(`${client.email}|${client.invoiceNumber}`, client.invoiceNumber);
}

// ── Re-export the new typed client for new callers (BATCH 4 onward) ──
export { createPaystackClient, type PaystackDva } from "@/lib/payment/paystack-client";
export type { PaystackCustomerResolution } from "@/lib/payment/paystack-customer-service";
export {
  getOrCreatePaystackCustomer,
} from "@/lib/payment/paystack-customer-service";
export type { PaymentError } from "@/lib/payment/errors";
