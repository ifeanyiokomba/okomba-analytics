/**
 * Paystack Dedicated Virtual Account (DVA) integration.
 *
 * Spec (user, Phase 2 / Module 4): DVA account name must be
 * "Okomba Analytics". With PAYSTACK_SECRET_KEY set, a real customer
 * + dedicated virtual account is created via the Paystack API.
 *
 * WITHOUT the key (dev / pre-launch), a deterministic SANDBOX account
 * is generated so the whole proposal → PDF → email pipeline can be
 * exercised end-to-end. Sandbox output is clearly labelled to avoid
 * ever being mistaken for real payment details.
 */

import { createHash } from "node:crypto";
import { DVA_ACCOUNT_NAME } from "@/lib/brand";

export type DvaResult = {
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  // ── BATCH 5 extended snapshot fields (directive §33) — optional so
  // the legacy createInvoiceDva path (which doesn't fetch them) stays
  // assignable; the customer-level DVA flow populates them.
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
  reference: string;
  sandbox: boolean;
};

const PAYSTACK_BASE = "https://api.paystack.co";

async function paystack<T>(
  path: string,
  body: unknown,
  secretKey: string
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${PAYSTACK_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    const json = (await res.json().catch(() => null)) as
      | { status: boolean; message?: string; data?: T }
      | null;
    if (!res.ok || !json?.status || !json.data) {
      return { ok: false, error: json?.message ?? `Paystack responded ${res.status}` };
    }
    return { ok: true, data: json.data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Paystack request failed" };
  }
}

type CustomerData = { id: number; customer_code: string };
type DvaData = {
  account_number?: string;
  account_name?: string;
  bank?: { name?: string; id?: number };
  currency?: string;
};

/**
 * Mint a per-invoice Paystack reference (B3 GAP-A fix, directive §5+§6).
 *
 * The Paystack Dedicated Virtual Account API does NOT return a
 * per-invoice reference (DVAs are per-customer) — so we mint our own:
 *   • sandbox (no PAYSTACK_SECRET_KEY): `OKM-{invoiceNumber}` —
 *     deterministic, idempotent across retries for the same invoice
 *     (satisfies tests/paystack-reference-mint.test.ts S8b-S8d and
 *     avoids @unique-constraint violations on pipeline re-runs).
 *   • real Paystack: `OKM-{invoiceNumber}-{Date.now()}` — unique per
 *     minting attempt so distinct invoices can never collide on the
 *     @unique constraint.
 *
 * Shared by BOTH payment paths so the reference contract holds no
 * matter which flow provisioned the DVA:
 *   • the legacy `createInvoiceDva` entrypoint (this file), and
 *   • the customer-level `getOrCreateCustomerDva` flow used by
 *     invoice-service (phase-36 BATCH 5) via `mintPaystackReference`.
 */
export function mintPaystackReference(invoiceNumber: string): string {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return `OKM-${invoiceNumber}`;
  return `OKM-${invoiceNumber}-${Date.now()}`;
}

function sandboxDva(seed: string, invoiceNumber: string): DvaResult {
  // Deterministic 10-digit NUBAN-style number derived from the seed so
  // retries produce the same account for the same client.
  const digest = createHash("sha256").update(seed).digest("hex");
  const accountNumber = (parseInt(digest.slice(0, 10), 16) % 1_000_000_000)
    .toString()
    .padStart(10, "9");
  return {
    accountNumber,
    bankName: "Paystack Test Bank (Sandbox)",
    accountName: DVA_ACCOUNT_NAME,
    // Deterministic per-invoice reference — see mintPaystackReference.
    reference: mintPaystackReference(invoiceNumber),
    sandbox: true,
  };
}

/**
 * Create (or reuse) a Paystack customer + dedicated virtual account
 * for the client of an invoice. Falls back to a sandbox DVA when no
 * PAYSTACK_SECRET_KEY is configured.
 */
export async function createInvoiceDva(client: {
  name: string;
  email: string;
  phone?: string | null;
  invoiceNumber: string;
}): Promise<DvaResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.info(
      `[paystack] PAYSTACK_SECRET_KEY not set — issuing sandbox DVA for ${client.invoiceNumber}`
    );
    return sandboxDva(`${client.email}|${client.invoiceNumber}`, client.invoiceNumber);
  }

  // 1. Create the customer (email is unique on Paystack — a duplicate
  //    returns the existing customer with 4xx + data, handled below).
  const [firstName, ...rest] = client.name.trim().split(/\s+/);
  const customer = await paystack<CustomerData>("/customer", {
    email: client.email,
    first_name: firstName || "Client",
    last_name: rest.join(" ") || "",
    phone: client.phone ?? "",
  }, secretKey);

  let customerId: number | undefined;
  if (customer.ok) {
    customerId = customer.data.id;
  } else {
    // Customer may already exist — look it up.
    try {
      const res = await fetch(
        `${PAYSTACK_BASE}/customer/${encodeURIComponent(client.email)}`,
        {
          headers: { Authorization: `Bearer ${secretKey}` },
          signal: AbortSignal.timeout(15000),
        }
      );
      const json = (await res.json()) as { status: boolean; data?: CustomerData };
      if (json.status && json.data) customerId = json.data.id;
    } catch {
      /* fall through */
    }
  }

  if (!customerId) {
    console.error("[paystack] could not create/resolve customer — sandbox fallback");
    return sandboxDva(`${client.email}|${client.invoiceNumber}`, client.invoiceNumber);
  }

  // 2. Create the dedicated virtual account.
  const dva = await paystack<DvaData>("/dedicated_account", {
    customer: customerId,
  }, secretKey);

  if (dva.ok && dva.data.account_number) {
    return {
      accountNumber: dva.data.account_number,
      bankName: dva.data.bank?.name ?? "Paystack",
      accountName: dva.data.account_name || DVA_ACCOUNT_NAME,
      // Mint our own per-invoice reference (Paystack's DVA API does
      // not return one — DVAs are per-customer, not per-invoice).
      // See mintPaystackReference for the uniqueness rationale.
      reference: mintPaystackReference(client.invoiceNumber),
      sandbox: false,
    };
  }

  // 3. DVA may already exist for this customer — try to fetch it.
  try {
    const res = await fetch(
      `${PAYSTACK_BASE}/dedicated_account?customer=${customerId}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
        signal: AbortSignal.timeout(15000),
      }
    );
    const json = (await res.json()) as {
      status: boolean;
      data?: DvaData | DvaData[];
    };
    const first = Array.isArray(json.data) ? json.data[0] : json.data;
    if (json.status && first?.account_number) {
      return {
        accountNumber: first.account_number,
        bankName: first.bank?.name ?? "Paystack",
        accountName: first.account_name || DVA_ACCOUNT_NAME,
        // DVA already exists for this customer — mint a fresh
        // per-invoice reference. (Paystack's DVA is per-customer
        // so the SAME account_number may be reused across multiple
        // invoices for repeat customers — that's the GAP-B reality
        // B2's webhook secondary-lookup ambiguity-safe fix handles.)
        reference: mintPaystackReference(client.invoiceNumber),
        sandbox: false,
      };
    }
  } catch {
    /* fall through */
  }

  const dvaError = dva.ok ? "no account number in Paystack response" : dva.error;
  console.error("[paystack] DVA creation failed — sandbox fallback:", dvaError);
  return sandboxDva(`${client.email}|${client.invoiceNumber}`, client.invoiceNumber);
}

// ── Re-export the typed payment domain for new callers (phase-36 BATCH 4+) ──
// The legacy `createInvoiceDva` entrypoint above satisfies the audited
// mint-test contract (tests/paystack-reference-mint.test.ts S8a-S8f).
// New code should import from `@/lib/payment/*` directly; these re-exports
// keep `@/lib/paystack` a complete facade over the payment domain.
export { createPaystackClient, type PaystackDva } from "@/lib/payment/paystack-client";
export type { PaystackCustomerResolution } from "@/lib/payment/paystack-customer-service";
export {
  getOrCreatePaystackCustomer,
} from "@/lib/payment/paystack-customer-service";
export type { PaymentError } from "@/lib/payment/errors";
