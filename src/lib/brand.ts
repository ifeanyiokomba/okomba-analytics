/**
 * Centralized brand tokens — the single source of truth for the
 * Okomba Analytics identity across EMAIL templates and PDF documents.
 *
 * DECISION (user-approved, Phase 2): keep the LIVE brand —
 * "Ink + Honey Gold". Directive's #0A2540 / #00D4FF palette was
 * rejected in favour of consistency with the live site.
 *
 * A future rebrand is a two-line change: edit BRAND below and every
 * email, invoice PDF and attachment follows.
 */

export const BRAND = {
  name: "Okomba Analytics",
  tagline: "digital products, systems & experiences",

  // Primary (header/footer bands)
  primary: "#0B0F1A", // Okomba ink
  primaryText: "#FFFFFF",
  // Accent (CTA / rules / totals)
  accent: "#C9910A", // Okomba honey gold
  accentSoft: "#FFC94D", // lighter honey (highlights on ink)
  accentText: "#141926",
  // Neutrals
  text: "#1c2333",
  muted: "#5a6373",
  bg: "#f7f5ef",
  card: "#ffffff",
  border: "#e4e1d8",
} as const;

export const CONTACT = {
  email: "support@okomba.com",
  insightsEmail: "insights@okomba.com",
  phone: "+234 808 894 8657",
  whatsapp: "https://wa.me/2348088948657",
  address: "Nigeria",
  site: "https://okomba.com",
} as const;

/** Paystack Dedicated Virtual Account display name (per spec). */
export const DVA_ACCOUNT_NAME = "Okomba Analytics";
