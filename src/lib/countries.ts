/**
 * Country catalogue + DVA eligibility (BATCH 2 — directive §7, §8, §27).
 *
 * The browser shows a structured `<select>` of human-readable labels; the
 * backend stores the ISO-2 code (`NG`, `GH`, `US`, `GB`, …). The DVA
 * eligibility rule (directive §8) is enforced server-side only — the
 * browser is never the final authority. Eligibility controls whether the
 * Paystack Dedicated Virtual Account flow is invoked (BATCH 4) or the
 * standard card/checkout route is used (directive §27).
 *
 *   NG → DVA eligible   (Paystack NGN virtual accounts — wema-bank etc.)
 *   GH → DVA eligible   (Paystack GHS virtual accounts — stanbic etc.)
 *   anything else → DVA unavailable (use normal Paystack checkout)
 */

export type Country = {
  /** ISO 3166-1 alpha-2 code — the canonical storage value. */
  code: string;
  /** Human-readable label shown in the UI `<select>`. */
  label: string;
  /** E.164 dial code hint (display-only; not used for validation). */
  dialCode: string;
  /** Whether the Paystack DVA flow is permitted for this country. */
  dvaEligible: boolean;
  /** Default Paystack currency for this country (informational). */
  currency: string;
};

export const COUNTRIES: readonly Country[] = [
  // ── DVA-eligible (Paystack dedicated virtual account supported) ──
  { code: "NG", label: "Nigeria", dialCode: "+234", dvaEligible: true, currency: "NGN" },
  { code: "GH", label: "Ghana", dialCode: "+233", dvaEligible: true, currency: "GHS" },

  // ── Non-DVA — standard Paystack checkout route (directive §27) ──
  { code: "KE", label: "Kenya", dialCode: "+254", dvaEligible: false, currency: "KES" },
  { code: "ZA", label: "South Africa", dialCode: "+27", dvaEligible: false, currency: "ZAR" },
  { code: "US", label: "United States", dialCode: "+1", dvaEligible: false, currency: "USD" },
  { code: "GB", label: "United Kingdom", dialCode: "+44", dvaEligible: false, currency: "GBP" },
  { code: "CA", label: "Canada", dialCode: "+1", dvaEligible: false, currency: "CAD" },
  { code: "AU", label: "Australia", dialCode: "+61", dvaEligible: false, currency: "AUD" },
  { code: "IN", label: "India", dialCode: "+91", dvaEligible: false, currency: "INR" },
  { code: "AE", label: "United Arab Emirates", dialCode: "+971", dvaEligible: false, currency: "AED" },
  { code: "DE", label: "Germany", dialCode: "+49", dvaEligible: false, currency: "EUR" },
  { code: "FR", label: "France", dialCode: "+33", dvaEligible: false, currency: "EUR" },
  { code: "ES", label: "Spain", dialCode: "+34", dvaEligible: false, currency: "EUR" },
  { code: "IT", label: "Italy", dialCode: "+39", dvaEligible: false, currency: "EUR" },
  { code: "NL", label: "Netherlands", dialCode: "+31", dvaEligible: false, currency: "EUR" },
  { code: "BR", label: "Brazil", dialCode: "+55", dvaEligible: false, currency: "BRL" },
  { code: "EG", label: "Egypt", dialCode: "+20", dvaEligible: false, currency: "EGP" },
  { code: "CI", label: "Côte d'Ivoire", dialCode: "+225", dvaEligible: false, currency: "XOF" },
  { code: "SN", label: "Senegal", dialCode: "+221", dvaEligible: false, currency: "XOF" },
  { code: "TZ", label: "Tanzania", dialCode: "+255", dvaEligible: false, currency: "TZS" },
  { code: "UG", label: "Uganda", dialCode: "+256", dvaEligible: false, currency: "UGX" },
  { code: "RW", label: "Rwanda", dialCode: "+250", dvaEligible: false, currency: "RWF" },
  { code: "CM", label: "Cameroon", dialCode: "+237", dvaEligible: false, currency: "XAF" },
  { code: "OTHER", label: "Other / Not listed", dialCode: "", dvaEligible: false, currency: "USD" },
] as const;

export const COUNTRY_CODES: readonly string[] = COUNTRIES.map((c) => c.code);

/** Look up a country by ISO-2 code. Returns null for unknown codes. */
export function countryByCode(code: string | null | undefined): Country | null {
  if (!code) return null;
  const upper = code.toUpperCase();
  return COUNTRIES.find((c) => c.code === upper) ?? null;
}

/**
 * Resolve DVA eligibility for a country code (directive §8).
 * Server-side authority — the browser never decides this on its own.
 *
 *   NG → "eligible"
 *   GH → "eligible"
 *   anything else (or null) → "not_eligible"
 */
export function resolvePaymentEligibility(
  countryCode: string | null | undefined
): "eligible" | "not_eligible" {
  const country = countryByCode(countryCode);
  return country?.dvaEligible ? "eligible" : "not_eligible";
}

/** Default currency for a country (used for invoice/Paystack currency). */
export function currencyForCountry(countryCode: string | null | undefined): string {
  return countryByCode(countryCode)?.currency ?? "USD";
}

/** Human-readable label for a country code, falling back to the raw code. */
export function countryLabel(code: string | null | undefined): string {
  return countryByCode(code)?.label ?? (code ?? "—");
}

/** Normalized phone (strip spaces, dashes, parentheses; keep leading +). */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Collapse internal whitespace and remove parentheses / dashes / dots.
  const cleaned = trimmed.replace(/[\s().-]+/g, " ").trim();
  // If the user typed "0" + digits without a country code, that's their
  // decision — we store exactly what they typed. We don't auto-prefix.
  return cleaned || null;
}

/** Normalized email — lowercase + trim — for canonical lookup. */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed || null;
}
