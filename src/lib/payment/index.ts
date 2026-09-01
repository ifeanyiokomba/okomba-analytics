/**
 * Payment domain boundary (directive §38).
 *
 * Re-exports the typed Paystack client, customer service, error model,
 * and country-aware eligibility helpers so higher layers can depend on
 * a single, stable surface. Paystack is the first implementation; future
 * providers can be added behind this boundary without forcing a rewrite.
 */

export * from "./errors";
export * from "./paystack-client";
export * from "./paystack-customer-service";
export * from "./paystack-dva-service";
export * from "./payment-reconciliation";
export {
  resolvePaymentEligibility,
  currencyForCountry,
  countryLabel,
  countryByCode,
  normalizePhone,
  normalizeEmail,
  COUNTRIES,
  COUNTRY_CODES,
  type Country,
} from "@/lib/countries";
