/**
 * Normalized payment error model (directive §42).
 *
 * Every payment-domain failure maps to one of these typed classes so the
 * caller can branch on intent (retry vs surface vs queue for manual
 * reconciliation) WITHOUT leaking raw Paystack internals to the customer.
 *
 * Each error carries:
 *   - `code`  — a stable machine-readable token (logged + sent to admin
 *               CRM but NEVER shown to the end customer)
 *   - `message` — human-readable cause (admin-only)
 *   - `cause`  — optional original error (Paystack fetch error, etc.)
 *   - `meta`  — optional structured diagnostic data (admin-only)
 *
 * The customer-facing layer is responsible for translating these into
 * a generic, friendly message — never expose the raw `code`/`message`
 * of these classes to the browser.
 */

export type PaymentErrorCode =
  | "PAYMENT_VALIDATION"
  | "UNSUPPORTED_COUNTRY"
  | "PAYSTACK_CUSTOMER"
  | "DVA_ELIGIBILITY"
  | "DVA_PROVIDER_UNAVAILABLE"
  | "DVA_ASSIGNMENT_PENDING"
  | "DVA_PROVISIONING"
  | "PAYMENT_RECONCILIATION";

export class PaymentError extends Error {
  readonly code: PaymentErrorCode;
  readonly meta?: Record<string, unknown>;
  readonly cause?: unknown;

  constructor(
    code: PaymentErrorCode,
    message: string,
    opts?: { cause?: unknown; meta?: Record<string, unknown> }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.cause = opts?.cause;
    this.meta = opts?.meta;
  }
}

/** Input failed an internal sanity check (bad amount, missing email, …). */
export class PaymentValidationError extends PaymentError {
  constructor(message: string, opts?: { cause?: unknown; meta?: Record<string, unknown> }) {
    super("PAYMENT_VALIDATION", message, opts);
  }
}

/** Country is not on the supported list (e.g. trying to provision a DVA for GB). */
export class UnsupportedCountryError extends PaymentError {
  constructor(countryCode: string | null | undefined, opts?: { cause?: unknown; meta?: Record<string, unknown> }) {
    super("UNSUPPORTED_COUNTRY", `Country ${countryCode ?? "—"} is not supported for this operation`, opts);
  }
}

/** Paystack customer create/resolve failed (HTTP error, parse error, …). */
export class PaystackCustomerError extends PaymentError {
  constructor(message: string, opts?: { cause?: unknown; meta?: Record<string, unknown> }) {
    super("PAYSTACK_CUSTOMER", message, opts);
  }
}

/** Customer is in a country where DVA is not supported (e.g. GB). */
export class DvaEligibilityError extends PaymentError {
  constructor(countryCode: string | null | undefined, opts?: { cause?: unknown; meta?: Record<string, unknown> }) {
    super("DVA_ELIGIBILITY", `Customer country ${countryCode ?? "—"} is not DVA-eligible`, opts);
  }
}

/** All Paystack DVA providers are unavailable — cannot pick a bank. */
export class DvaProviderUnavailableError extends PaymentError {
  constructor(message: string, opts?: { cause?: unknown; meta?: Record<string, unknown> }) {
    super("DVA_PROVIDER_UNAVAILABLE", message, opts);
  }
}

/** DVA assignment is in-flight (Paystack returned pending) — caller should retry. */
export class DvaAssignmentPendingError extends PaymentError {
  constructor(message: string, opts?: { cause?: unknown; meta?: Record<string, unknown> }) {
    super("DVA_ASSIGNMENT_PENDING", message, opts);
  }
}

/** DVA creation/lookup failed at the Paystack boundary. */
export class DvaProvisioningError extends PaymentError {
  constructor(message: string, opts?: { cause?: unknown; meta?: Record<string, unknown> }) {
    super("DVA_PROVISIONING", message, opts);
  }
}

/** A payment was received but could not be confidently matched to an invoice. */
export class PaymentReconciliationError extends PaymentError {
  constructor(message: string, opts?: { cause?: unknown; meta?: Record<string, unknown> }) {
    super("PAYMENT_RECONCILIATION", message, opts);
  }
}

/**
 * Convert any unknown error into a PaymentError, picking the most
 * appropriate subclass when possible. Used as a defensive boundary at
 * the edges of the payment domain so we never throw a raw Paystack
 * fetch error out of the service layer.
 */
export function toPaymentError(err: unknown): PaymentError {
  if (err instanceof PaymentError) return err;
  const message = err instanceof Error ? err.message : "Unknown payment error";
  return new PaymentValidationError(message, { cause: err });
}
