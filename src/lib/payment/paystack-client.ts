/**
 * Typed Paystack HTTP client (directive §39, §40).
 *
 * We retain native `fetch` instead of pulling in `@paystack/paystack-sdk`
 * (directive §39: "Do NOT add the SDK merely for appearance"). The
 * request/response shapes below mirror the PaystackOSS/openapi contract:
 *
 *   POST /customer                       → create customer
 *   GET  /customer/{email_or_code}       → fetch customer
 *   GET  /dedicated_account/available_providers → list DVA providers
 *   POST /dedicated_account              → create DVA for existing customer
 *   GET  /dedicated_account              → list DVAs (filters: customer, active, currency, provider_slug, bank_id, account_number, perPage, page)
 *   GET  /dedicated_account/{account_id} → fetch a single DVA
 *   DELETE /dedicated_account/{account_id} → deactivate a DVA
 *
 * All calls are made server-side only — the secret key never reaches the
 * browser. Timeouts are enforced via AbortSignal so a hung Paystack call
 * can never block the request indefinitely.
 */

import { PaystackCustomerError, DvaProvisioningError } from "./errors";

const PAYSTACK_BASE = "https://api.paystack.co";

export type PaystackSecretResolver = () => string | null;

/** Default secret resolver — reads PAYSTACK_SECRET_KEY from env. */
export const defaultSecretResolver: PaystackSecretResolver = () =>
  process.env.PAYSTACK_SECRET_KEY || null;

export type PaystackResponse<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string; raw: unknown };

/** Internal: typed wrapper around the Paystack REST shape `{ status, message, data }`. */
type PaystackEnvelope<T> = {
  status: boolean;
  message?: string;
  data?: T | T[];
};

/** Paystack customer object (POST /customer + GET /customer/{code}). */
export type PaystackCustomer = {
  id: number;
  customer_code: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  metadata?: unknown;
  risk_action?: string;
  integration?: number;
  domain?: string;
  identified?: boolean;
  identifications?: unknown[];
  createdAt?: string;
  updatedAt?: string;
};

/** Available DVA provider (GET /dedicated_account/available_providers). */
export type PaystackDvaProvider = {
  provider_slug: string; // e.g. "wema-bank", "access-provider", "zenithmobilemoneyprovider"
  name: string; // human-readable bank name
  provider_id: number;
  country_code: string; // "NG" | "GH"
  currency: "NGN" | "GHS";
  bank_id: number;
  // banks list within the provider (Paystack returns this under "banks" sometimes)
  banks?: Array<{ id: number; name: string; code: string; slug?: string }>;
};

/** Paystack DVA resource (POST /dedicated_account + GET /dedicated_account). */
export type PaystackDva = {
  id: number; // account_id — supports GET/DELETE by id (directive §12, §37)
  account_number: string;
  account_name: string;
  bank: { id: number; name: string; code: string; slug: string };
  currency: "NGN" | "GHS";
  provider_slug: string;
  customer: number; // customer id
  active: boolean;
  assigned: boolean;
  split_config?: unknown;
  created_at?: string;
  updated_at?: string;
};

/**
 * Build a typed Paystack HTTP caller bound to a specific secret key.
 * Throws `PaystackCustomerError` or `DvaProvisioningError` for any
 * transport/parse failure so the higher layers can branch cleanly.
 */
export function createPaystackClient(
  secretResolver: PaystackSecretResolver = defaultSecretResolver
) {
  /**
   * Issue a Paystack HTTP request and unwrap the envelope. The HTTP
   * method defaults to GET unless `body` is supplied (→ POST). For
   * DELETE, pass `method: "DELETE"`.
   */
  async function request<T>(
    path: string,
    opts: { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown; params?: Record<string, string | number | boolean | undefined | null>; timeoutMs?: number } = {}
  ): Promise<PaystackResponse<T>> {
    const secret = secretResolver();
    if (!secret) {
      return { ok: false, status: 0, message: "PAYSTACK_SECRET_KEY is not configured", raw: null };
    }

    let url = `${PAYSTACK_BASE}${path}`;
    if (opts.params) {
      const cleaned = Object.fromEntries(
        Object.entries(opts.params).filter(([, v]) => v !== undefined && v !== null && v !== "")
      );
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(cleaned).map(([k, v]) => [k, String(v)]))
      ).toString();
      if (qs) url += `?${qs}`;
    }

    try {
      const res = await fetch(url, {
        method: opts.method ?? (opts.body ? "POST" : "GET"),
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
        signal: AbortSignal.timeout(opts.timeoutMs ?? 20000),
      });
      const json = (await res.json().catch(() => null)) as PaystackEnvelope<T> | null;
      if (!res.ok || !json || !json.status) {
        return { ok: false, status: res.status, message: json?.message ?? `Paystack responded ${res.status}`, raw: json };
      }
      const data = json.data;
      if (!data) {
        return { ok: false, status: res.status, message: "Paystack returned no data", raw: json };
      }
      return { ok: true, data: (Array.isArray(data) ? (data as T[]) : data) as T };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Paystack request failed";
      // Don't leak the raw error to the customer — wrap in a typed error.
      return { ok: false, status: 0, message: msg, raw: null };
    }
  }

  /** Throw the appropriate typed error for a non-OK response. */
  function throwIfNotOk<T>(resp: PaystackResponse<T>, ErrorCtor: typeof PaystackCustomerError, context: string): T {
    if (resp.ok) return resp.data;
    const message = `${context}: ${resp.message} (HTTP ${resp.status})`;
    throw new ErrorCtor(message, { meta: { status: resp.status, raw: resp.raw } });
  }

  return {
    /* ── Customer endpoints (directive §3, §13) ── */

    /** POST /customer — create a customer. Returns the customer object. */
    async createCustomer(input: {
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      metadata?: unknown;
    }): Promise<PaystackCustomer> {
      const resp = await request<PaystackCustomer>("/customer", {
        body: {
          email: input.email,
          first_name: input.firstName ?? "",
          last_name: input.lastName ?? "",
          phone: input.phone ?? "",
          ...(input.metadata ? { metadata: input.metadata } : {}),
        },
      });
      return throwIfNotOk(resp, PaystackCustomerError, "createCustomer");
    },

    /**
     * GET /customer/{email_or_code} — fetch a customer by email or
     * customer_code. Paystack accepts either as the path segment.
     */
    async fetchCustomer(emailOrCode: string): Promise<PaystackCustomer | null> {
      const resp = await request<PaystackCustomer>(
        `/customer/${encodeURIComponent(emailOrCode)}`
      );
      if (resp.ok) return resp.data;
      // 404 → null (no such customer). Other errors → throw.
      if (resp.status === 404) return null;
      return throwIfNotOk(resp, PaystackCustomerError, "fetchCustomer");
    },

    /* ── DVA endpoints (directive §2, §16, §18, §19, §37) ── */

    /** GET /dedicated_account/available_providers — list DVA providers. */
    async listDvaProviders(): Promise<PaystackDvaProvider[]> {
      const resp = await request<PaystackDvaProvider[]>(
        "/dedicated_account/available_providers"
      );
      return throwIfNotOk(resp, DvaProvisioningError, "listDvaProviders");
    },

    /**
     * POST /dedicated_account — create a DVA for an existing customer.
     * `customer` is the Paystack CUSTOMER CODE (CUS_xxx) or numeric id;
     * `preferred_bank` is the provider_slug, not a free-text bank name.
     */
    async createDva(input: {
      customer: string | number;
      preferredBank?: string; // provider_slug
      subaccount?: string;
      splitCode?: string;
    }): Promise<PaystackDva> {
      const resp = await request<PaystackDva>("/dedicated_account", {
        body: {
          customer: input.customer,
          ...(input.preferredBank ? { preferred_bank: input.preferredBank } : {}),
          ...(input.subaccount ? { subaccount: input.subaccount } : {}),
          ...(input.splitCode ? { split_code: input.splitCode } : {}),
        },
      });
      return throwIfNotOk(resp, DvaProvisioningError, "createDva");
    },

    /**
     * GET /dedicated_account — list DVAs with filters.
     * Supported filters (directive §2): account_number, customer, active,
     * currency, provider_slug, bank_id, perPage, page.
     */
    async listDvas(filters: {
      customer?: string | number;
      active?: boolean;
      currency?: string;
      providerSlug?: string;
      bankId?: number;
      accountNumber?: string;
      perPage?: number;
      page?: number;
    }): Promise<PaystackDva[]> {
      const resp = await request<PaystackDva[]>("/dedicated_account", {
        params: {
          customer: filters.customer,
          active: filters.active,
          currency: filters.currency,
          provider_slug: filters.providerSlug,
          bank_id: filters.bankId,
          account_number: filters.accountNumber,
          perPage: filters.perPage,
          page: filters.page,
        },
      });
      return throwIfNotOk(resp, DvaProvisioningError, "listDvas");
    },

    /** GET /dedicated_account/{account_id} — fetch a single DVA. */
    async fetchDva(accountId: string | number): Promise<PaystackDva | null> {
      const resp = await request<PaystackDva>(
        `/dedicated_account/${encodeURIComponent(String(accountId))}`
      );
      if (resp.ok) return resp.data;
      if (resp.status === 404) return null;
      return throwIfNotOk(resp, DvaProvisioningError, "fetchDva");
    },

    /** DELETE /dedicated_account/{account_id} — deactivate a DVA. */
    async deactivateDva(accountId: string | number): Promise<void> {
      const resp = await request<{ deactivated: boolean; deactivated_account: unknown }>(
        `/dedicated_account/${encodeURIComponent(String(accountId))}`,
        { method: "DELETE" }
      );
      if (!resp.ok) {
        throw new DvaProvisioningError(
          `deactivateDva: ${resp.message} (HTTP ${resp.status})`,
          { meta: { status: resp.status, raw: resp.raw } }
        );
      }
    },

    /** Expose the raw request fn for higher-level composition. */
    request,
  };
}

export type PaystackClient = ReturnType<typeof createPaystackClient>;
