/**
 * Paystack customer service — `getOrCreatePaystackCustomer`
 * (directive §13, §14, §41).
 *
 * Idempotent resolution order (directive §14):
 *   1. Check the local Customer row's `paystackCustomerId` /
 *      `paystackCustomerCode`. If present, use them.
 *   2. Otherwise, try to look the customer up by email via
 *      `GET /customer/{email}` — if found, persist the IDs.
 *   3. Otherwise, create a new Paystack customer via `POST /customer`.
 *   4. Save the Paystack identity back to the local Customer row.
 *   5. Never create duplicate Paystack customers unnecessarily.
 *
 * The operation is idempotent: a second call with the same Customer row
 * returns the cached IDs without any Paystack network calls.
 *
 * Note on `name` splitting (directive §41, §48): the LEGACY
 * `src/lib/paystack.ts createInvoiceDva()` used
 * `client.name.trim().split(/\s+/)` to derive `first_name`/`last_name`
 * from a single combined string. We never do that here — the Customer
 * row already carries explicit `firstName`/`lastName` fields (BATCH 2),
 * so we pass them straight through. The misleading `name.split` code
 * is marked for removal in BATCH 4's DVA refactor.
 */

import { db } from "@/lib/db";
import { createPaystackClient, type PaystackCustomer } from "./paystack-client";
import {
  PaystackCustomerError,
  PaymentValidationError,
  toPaymentError,
} from "./errors";

export type LocalCustomerIdentity = {
  id: string; // local Customer.id
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone?: string | null;
};

export type PaystackCustomerResolution = {
  /** Local Customer.id (echoed for caller's convenience). */
  customerId: string;
  paystackCustomerId: string; // Paystack numeric id (stored as string for portability)
  paystackCustomerCode: string; // CUS_xxx
  /** True if a NEW Paystack customer was created this call. */
  created: boolean;
  /** True if we resolved an existing customer without POSTing. */
  reused: boolean;
};

/**
 * Idempotent: get-or-create a Paystack customer for a local Customer row.
 *
 * Throws `PaymentValidationError` when the local Customer has no usable
 * email, or `PaystackCustomerError` when both the create and lookup
 * paths fail (Paystack boundary issue).
 */
export async function getOrCreatePaystackCustomer(
  customer: LocalCustomerIdentity,
  opts?: { client?: ReturnType<typeof createPaystackClient> }
): Promise<PaystackCustomerResolution> {
  if (!customer.email || !customer.email.includes("@")) {
    throw new PaymentValidationError(
      "getOrCreatePaystackCustomer: customer.email is required and must be a valid email",
      { meta: { customerId: customer.id } }
    );
  }

  const client = opts?.client ?? createPaystackClient();
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  // ── 0. Paystack not configured → cannot proceed ──
  // The caller decides the fallback (BATCH 4 will route to standard
  // checkout or surface a friendly error). We never fabricate a customer.
  if (!secretKey) {
    throw new PaystackCustomerError(
      "PAYSTACK_SECRET_KEY is not configured — cannot create or resolve a Paystack customer",
      { meta: { customerId: customer.id } }
    );
  }

  // ── 1. Check local Customer's cached Paystack identity ──
  const local = await db.customer.findUnique({ where: { id: customer.id } });
  if (local?.paystackCustomerCode && local?.paystackCustomerId) {
    return {
      customerId: customer.id,
      paystackCustomerId: local.paystackCustomerId,
      paystackCustomerCode: local.paystackCustomerCode,
      created: false,
      reused: true,
    };
  }

  // ── 2. Look up the customer by email (they may already exist on Paystack) ──
  let paystackCustomer: PaystackCustomer | null = null;
  let reused = false;
  try {
    paystackCustomer = await client.fetchCustomer(customer.email);
    if (paystackCustomer) reused = true;
  } catch (err) {
    // A fetch failure isn't fatal — fall through to createCustomer.
    // If createCustomer also fails, the typed error bubbles up.
    console.warn("[paystack-customer-service] fetchCustomer failed — will try create:", err);
  }

  // ── 3. Create the Paystack customer if not found ──
  let created = false;
  if (!paystackCustomer) {
    try {
      paystackCustomer = await client.createCustomer({
        email: customer.email,
        firstName: customer.firstName ?? undefined,
        lastName: customer.lastName ?? undefined,
        phone: customer.phone ?? undefined,
      });
      created = true;
    } catch (err) {
      // Paystack returns 400 with "email already in use" when a customer
      // exists but `fetchCustomer` somehow missed them. Retry the fetch
      // once before giving up.
      if (err instanceof PaystackCustomerError && /already exists|duplicate/i.test(err.message)) {
        paystackCustomer = await client.fetchCustomer(customer.email);
        if (paystackCustomer) {
          reused = true;
        } else {
          throw new PaystackCustomerError(
            "Paystack reported duplicate customer but the lookup returned nothing — possible provider inconsistency",
            { cause: err, meta: { customerId: customer.id, email: customer.email } }
          );
        }
      } else {
        throw toPaymentError(err) instanceof PaystackCustomerError
          ? err
          : new PaystackCustomerError(
              `createCustomer failed: ${err instanceof Error ? err.message : "unknown error"}`,
              { cause: err, meta: { customerId: customer.id } }
            );
      }
    }
  }

  if (!paystackCustomer) {
    throw new PaystackCustomerError(
      "Could not create or resolve Paystack customer — no customer object returned",
      { meta: { customerId: customer.id, email: customer.email } }
    );
  }

  // ── 4. Persist the Paystack identity back to the local Customer row ──
  await db.customer.update({
    where: { id: customer.id },
    data: {
      paystackCustomerId: String(paystackCustomer.id),
      paystackCustomerCode: paystackCustomer.customer_code,
    },
  });

  return {
    customerId: customer.id,
    paystackCustomerId: String(paystackCustomer.id),
    paystackCustomerCode: paystackCustomer.customer_code,
    created,
    reused,
  };
}
