/**
 * DVA service — customer-owned Paystack Dedicated Virtual Account
 * provisioning (directive §8, §9, §11, §15, §16, §17, §18, §19, §20, §21).
 *
 * The canonical DVA belongs to the Customer, NOT the Invoice (§9).
 * An invoice may snapshot the customer's current DVA at creation time
 * for historical presentation, but the live DVA record is on Customer.
 *
 * `getOrCreateCustomerDva(customer)` implements the 10-step pipeline
 * from directive §15:
 *   1. validate customer eligibility            (§8 — NG/GH only)
 *   2. check local active DVA                    (§15 step 2-3)
 *   3. if active, reuse it
 *   4. resolve Paystack customer                (BATCH 3 — getOrCreatePaystackCustomer)
 *   5. inspect available DVA providers           (§16 — listDvaProviders)
 *   6. select an appropriate provider            (§17 — preferred → fallback)
 *   7. create the DVA                            (§18 — POST /dedicated_account)
 *   8. retrieve/confirm the assigned DVA         (§19 — GET /dedicated_account)
 *   9. persist the actual result                 (§20 — full identity)
 *  10. return the canonical DVA
 *
 * Production fails closed — no synthetic DVA is ever shown to a real
 * customer (directive §21, §22).
 */

import { db } from "@/lib/db";
import {
  resolvePaymentEligibility,
  currencyForCountry,
} from "@/lib/countries";
import { createPaystackClient, type PaystackDva, type PaystackDvaProvider } from "./paystack-client";
import { getOrCreatePaystackCustomer, type LocalCustomerIdentity } from "./paystack-customer-service";
import {
  DvaEligibilityError,
  DvaProvisioningError,
  DvaProviderUnavailableError,
  DvaAssignmentPendingError,
  PaymentValidationError,
} from "./errors";

/**
 * Checkout route — the high-level payment strategy for a country
 * (directive §8, §27). Determines which Paystack surface a customer
 * hits when an invoice is sent.
 *
 *   • "dva_ng"  — Dedicated Virtual Account (NGN). The customer pays
 *                 by bank transfer into a Paystack-issued virtual
 *                 account number owned by them. Driven by
 *                 PAYSTACK_PREFERRED_BANK_NG (default: wema-bank).
 *   • "dva_gh"  — Dedicated Virtual Account (GHS). Mobile-money-style
 *                 virtual account for Ghana. Driven by
 *                 PAYSTACK_PREFERRED_BANK_GH (default:
 *                 zenithmobilemoneyprovider).
 *   • "standard_checkout" — Every other country (KE, ZA, US, GB, …).
 *                 No DVA is provisioned. The customer is sent to the
 *                 Paystack Standard Checkout (POST /transaction/
 *                 initialize) where they pay by card, mobile money,
 *                 bank transfer or USSD depending on the currency.
 *                 PAYSTACK_PREFERRED_BANK_* is IRRELEVANT here.
 */
export type CheckoutRoute = "dva_ng" | "dva_gh" | "standard_checkout";

/**
 * Resolve the high-level checkout route for a country code.
 * This is the single source of truth that higher layers should
 * consult to decide whether to invoke the DVA pipeline or skip it.
 *
 *   NG → "dva_ng"          (DVA eligible, NGN)
 *   GH → "dva_gh"          (DVA eligible, GHS)
 *   anything else → "standard_checkout"
 */
export function resolveCheckoutRoute(
  countryCode: string | null | undefined
): CheckoutRoute {
  const eligibility = resolvePaymentEligibility(countryCode);
  if (eligibility !== "eligible") return "standard_checkout";
  if (countryCode?.toUpperCase() === "GH") return "dva_gh";
  return "dva_ng";
}

/**
 * Preferred DVA bank provider_slug, resolved per-country with a
 * sensible global fallback. Resolution order (first wins):
 *
 *   1. PAYSTACK_PREFERRED_BANK_NG  — applies only to NG customers
 *   2. PAYSTACK_PREFERRED_BANK_GH  — applies only to GH customers
 *   3. PAYSTACK_PREFERRED_BANK     — global override (any DVA country)
 *   4. Hard-coded default          — wema-bank (NG), zenithmobilemoneyprovider (GH)
 *
 * The slug MUST be a `provider_slug` from Paystack's
 * /dedicated_account/available_providers endpoint (e.g. "wema-bank",
 * "access-bank", "zenith-bank", "zenithmobilemoneyprovider",
 * "stanbic-ghana-provider"). The listDvaProviders() call (§16) is
 * the source of truth — this is only a PREFERENCE; if the preferred
 * slug is not in the live provider list for that currency, pickProvider
 * falls back to a deterministic order.
 *
 * NOTE: For non-DVA countries (KE, ZA, US, GB, …) this function is
 * NEVER consulted — resolveCheckoutRoute returns "standard_checkout"
 * and the DVA pipeline is skipped entirely. Setting
 * PAYSTACK_PREFERRED_BANK for those countries has NO effect.
 */
function preferredBankForCountry(countryCode: string): string | undefined {
  const upper = countryCode.toUpperCase();
  // 1. per-country override
  const perCountry =
    upper === "NG"
      ? process.env.PAYSTACK_PREFERRED_BANK_NG
      : upper === "GH"
        ? process.env.PAYSTACK_PREFERRED_BANK_GH
        : undefined;
  if (perCountry && perCountry.trim()) return perCountry.trim();
  // 2. global override
  const env = process.env.PAYSTACK_PREFERRED_BANK;
  if (env && env.trim()) return env.trim();
  // 3. hard-coded defaults
  switch (upper) {
    case "NG": return "wema-bank";
    case "GH": return "zenithmobilemoneyprovider";
    default: return undefined;
  }
}

export type DvaStatus =
  | "not_eligible"
  | "eligible"
  | "pending"
  | "active"
  | "failed"
  | "deactivated"
  | "requires_validation";

export type CustomerDvaResult = {
  customerId: string;
  status: DvaStatus;
  /** Present when status === "active". */
  dva?: {
    accountId: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode: string;
    bankSlug: string;
    provider: string;
    currency: string;
  };
  /** True if we created a new DVA this call. */
  created: boolean;
  /** True if we reused an existing local active DVA (zero Paystack calls). */
  reused: boolean;
};

/**
 * Deterministic fallback order — directive §16: "If Wema is configured
 * as preferred but unavailable, choose another valid provider according
 * to a deterministic fallback order." We rank by:
 *   1. providers that support the customer's currency
 *   2. then by `bank_id` ascending (stable across calls)
 * The preferred provider, if present + available, always wins.
 */
function pickProvider(
  providers: PaystackDvaProvider[],
  preferredSlug: string | undefined,
  currency: string
): PaystackDvaProvider | null {
  if (providers.length === 0) return null;
  // Filter to providers serving the customer's currency.
  const valid = providers.filter((p) => p.currency === currency);
  if (valid.length === 0) return null;
  // Preferred first, if it's in the valid list.
  if (preferredSlug) {
    const preferred = valid.find((p) => p.provider_slug === preferredSlug);
    if (preferred) return preferred;
  }
  // Deterministic fallback: sort by bank_id asc, pick the first.
  // (bank_id is a stable Paystack-internal id — deterministic across calls.)
  const sorted = [...valid].sort((a, b) => a.bank_id - b.bank_id);
  return sorted[0] ?? null;
}

/** Convert a Paystack DVA into the local Customer row's column values. */
function dvaToCustomerFields(dva: PaystackDva) {
  return {
    dvaAccountId: String(dva.id),
    dvaAccountNumber: dva.account_number,
    dvaAccountName: dva.account_name,
    dvaBankName: dva.bank?.name ?? "Paystack",
    dvaBankCode: dva.bank?.code ?? "",
    dvaBankSlug: dva.bank?.slug ?? dva.provider_slug,
    dvaProvider: dva.provider_slug,
    dvaCurrency: dva.currency,
    dvaStatus: "active" as DvaStatus,
    dvaAssignedAt: new Date(),
    dvaUpdatedAt: new Date(),
  };
}

/**
 * Idempotent: get-or-create a DVA for a local Customer row.
 *
 * Throws:
 *   • `PaymentValidationError` — Customer has no email.
 *   • `DvaEligibilityError`   — Country not in the DVA-eligible set (NG, GH).
 *   • `PaystackCustomerError` — Customer identity could not be resolved at
 *     the Paystack boundary (delegated from getOrCreatePaystackCustomer).
 *   • `DvaProviderUnavailableError` — No DVA providers serve this currency.
 *   • `DvaProvisioningError`  — DVA creation AND existing-DVA lookup both
 *     failed at the Paystack boundary.
 */
export async function getOrCreateCustomerDva(
  customer: LocalCustomerIdentity & { countryCode?: string | null },
  opts?: { client?: ReturnType<typeof createPaystackClient> }
): Promise<CustomerDvaResult> {
  // ── 1. validate customer eligibility (directive §8) ──
  // The browser never decides this — server-side authority.
  const eligibility = resolvePaymentEligibility(customer.countryCode ?? null);
  if (eligibility !== "eligible") {
    // Persist the not_eligible state so the admin CRM sees the verdict.
    await db.customer.update({
      where: { id: customer.id },
      data: { dvaStatus: "not_eligible", dvaUpdatedAt: new Date() },
    }).catch(() => { /* non-fatal */ });
    throw new DvaEligibilityError(customer.countryCode, {
      meta: { customerId: customer.id, countryCode: customer.countryCode ?? null },
    });
  }

  // ── 2. check local active DVA (directive §15 step 2-3) ──
  const local = await db.customer.findUnique({ where: { id: customer.id } });
  if (local?.dvaStatus === "active" && local.dvaAccountId && local.dvaAccountNumber) {
    return {
      customerId: customer.id,
      status: "active",
      dva: {
        accountId: local.dvaAccountId,
        accountNumber: local.dvaAccountNumber,
        accountName: local.dvaAccountName ?? "",
        bankName: local.dvaBankName ?? "",
        bankCode: local.dvaBankCode ?? "",
        bankSlug: local.dvaBankSlug ?? "",
        provider: local.dvaProvider ?? "",
        currency: local.dvaCurrency ?? currencyForCountry(customer.countryCode),
      },
      created: false,
      reused: true,
    };
  }

  // ── 3. ensure Paystack customer exists (BATCH 3) ──
  const client = opts?.client ?? createPaystackClient();
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new DvaProvisioningError(
      "PAYSTACK_SECRET_KEY is not configured — cannot provision a DVA",
      { meta: { customerId: customer.id } }
    );
  }
  const resolution = await getOrCreatePaystackCustomer(customer, { client });

  // Mark DVA status as pending while we're provisioning (directive §11).
  await db.customer.update({
    where: { id: customer.id },
    data: { dvaStatus: "pending", dvaUpdatedAt: new Date() },
  }).catch(() => { /* non-fatal */ });

  // ── 4. inspect available DVA providers (directive §16) ──
  let providers: PaystackDvaProvider[] = [];
  try {
    providers = await client.listDvaProviders();
  } catch (err) {
    throw new DvaProviderUnavailableError(
      `listDvaProviders failed: ${err instanceof Error ? err.message : "unknown error"}`,
      { cause: err, meta: { customerId: customer.id } }
    );
  }

  // ── 5. select an appropriate provider (directive §17) ──
  const currency = currencyForCountry(customer.countryCode);
  const preferredSlug = preferredBankForCountry(customer.countryCode!);
  const selected = pickProvider(providers, preferredSlug, currency);
  if (!selected) {
    await db.customer.update({
      where: { id: customer.id },
      data: { dvaStatus: "failed", dvaUpdatedAt: new Date() },
    }).catch(() => { /* non-fatal */ });
    throw new DvaProviderUnavailableError(
      `No DVA providers available for currency ${currency} (preferred: ${preferredSlug ?? "—"})`,
      {
        meta: {
          customerId: customer.id,
          currency,
          preferred: preferredSlug ?? null,
          availableProviders: providers.map((p) => `${p.provider_slug}/${p.currency}`),
        },
      }
    );
  }

  // ── 6. create the DVA (directive §18: POST /dedicated_account) ──
  let dva: PaystackDva | null = null;
  try {
    dva = await client.createDva({
      customer: resolution.paystackCustomerCode,
      preferredBank: selected.provider_slug,
    });
  } catch (err) {
    // DVA may already exist for this customer — fall through to list
    // (directive §15 step 8: "retrieve/confirm the assigned DVA").
    console.warn("[dva-service] createDva failed — will try list:", err instanceof Error ? err.message : err);
  }

  // ── 7. retrieve/confirm the assigned DVA (directive §19) ──
  // Paystack may return a DVA object whose `account_number` is null
  // momentarily after creation (the bank has to assign the number). In
  // that case, list + fetch until we have a real account_number — but
  // bounded to a single retry to avoid a tight loop.
  if (!dva || !dva.account_number) {
    try {
      const list = await client.listDvas({
        customer: resolution.paystackCustomerCode,
        active: true,
        currency,
      });
      dva = list[0] ?? null;
    } catch (err) {
      throw new DvaProvisioningError(
        `listDvas fallback failed: ${err instanceof Error ? err.message : "unknown error"}`,
        { cause: err, meta: { customerId: customer.id, paystackCustomerCode: resolution.paystackCustomerCode } }
      );
    }
  }

  if (!dva || !dva.account_number) {
    // Mark as pending — the bank hasn't issued the account number yet.
    // The caller can retry later (directive §11 "pending" state).
    await db.customer.update({
      where: { id: customer.id },
      data: { dvaStatus: "pending", dvaUpdatedAt: new Date() },
    }).catch(() => { /* non-fatal */ });
    throw new DvaAssignmentPendingError(
      "Paystack has not yet assigned an account number — try again shortly",
      {
        meta: {
          customerId: customer.id,
          paystackCustomerCode: resolution.paystackCustomerCode,
          selectedProvider: selected.provider_slug,
        },
      }
    );
  }

  // ── 8. fetch by id to confirm the canonical record (directive §19) ──
  // The list/create response may omit fields the GET-by-id response
  // includes. We trust the canonical fetch over the create response.
  let canonical: PaystackDva = dva;
  try {
    const fetched = await client.fetchDva(dva.id);
    if (fetched) canonical = fetched;
  } catch (err) {
    console.warn("[dva-service] fetchDva confirmation failed — using create/list response:", err instanceof Error ? err.message : err);
  }

  // ── 9. persist the actual result (directive §20) ──
  // We persist EVERY useful real Paystack DVA field — never fabricate.
  const fields = dvaToCustomerFields(canonical);
  await db.customer.update({
    where: { id: customer.id },
    data: fields,
  });

  // ── 10. return the canonical DVA ──
  return {
    customerId: customer.id,
    status: "active",
    dva: {
      accountId: fields.dvaAccountId,
      accountNumber: fields.dvaAccountNumber,
      accountName: fields.dvaAccountName,
      bankName: fields.dvaBankName,
      bankCode: fields.dvaBankCode,
      bankSlug: fields.dvaBankSlug,
      provider: fields.dvaProvider,
      currency: fields.dvaCurrency,
    },
    created: true,
    reused: false,
  };
}

/** Convenience: read-only DVA status lookup for the admin CRM (directive §44). */
export async function getCustomerDvaStatus(
  customerId: string
): Promise<{ status: DvaStatus | null; dva: CustomerDvaResult["dva"] | null }> {
  const c = await db.customer.findUnique({ where: { id: customerId } });
  if (!c) return { status: null, dva: null };
  if (!c.dvaStatus) return { status: null, dva: null };
  if (c.dvaStatus !== "active" || !c.dvaAccountId || !c.dvaAccountNumber) {
    return { status: c.dvaStatus as DvaStatus, dva: null };
  }
  return {
    status: c.dvaStatus as DvaStatus,
    dva: {
      accountId: c.dvaAccountId,
      accountNumber: c.dvaAccountNumber,
      accountName: c.dvaAccountName ?? "",
      bankName: c.dvaBankName ?? "",
      bankCode: c.dvaBankCode ?? "",
      bankSlug: c.dvaBankSlug ?? "",
      provider: c.dvaProvider ?? "",
      currency: c.dvaCurrency ?? "",
    },
  };
}
