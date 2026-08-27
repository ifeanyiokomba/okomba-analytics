/**
 * Consent-gated third-party script loader (Phase-1 Module 1).
 *
 * RESEARCH DECISION — react-cookie-consent vs custom banner:
 * The site already ships a bespoke consent banner that persists both
 * choices, reopens from the footer, matches the brand system and is
 * fully accessible. Installing react-cookie-consent would REPLACE that
 * with a generic off-the-shelf widget — a visual and functional
 * regression. What was missing was script GATING, so this module adds
 * exactly that and the existing banner calls into it.
 *
 * Contract: third-party scripts (analytics, payments) only inject after
 * the visitor accepts cookies. "Essential only" and undecided visitors
 * get zero third-party requests.
 *
 * Stage 10 audit fix: the env var name is now aligned with
 * layout.tsx / analytics.ts — NEXT_PUBLIC_GA4_MEASUREMENT_ID. Previously
 * this read the non-existent NEXT_PUBLIC_GA_MEASUREMENT_ID, so the
 * consent-gated GA4 injection NEVER fired even after the visitor
 * accepted. The single source of truth for the GA4 ID lives here now;
 * layout.tsx no longer unconditionally injects GA4 (it relied on the
 * wrong gate and bypassed consent entirely).
 */

const GA_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
export const CONSENT_STORAGE_KEY = "okomba_cookie_consent";
export const CONSENT_ACCEPTED = "accepted";

export type ConsentChoice = "accepted" | "essential" | null;

export function getConsentChoice(): ConsentChoice {
  try {
    const v = localStorage.getItem(CONSENT_STORAGE_KEY);
    return v === "accepted" || v === "essential" ? v : null;
  } catch {
    return null;
  }
}

function injectScript(id: string, src: string, async = true): HTMLScriptElement | null {
  if (typeof document === "undefined") return null;
  if (document.getElementById(id)) return null;
  const s = document.createElement("script");
  s.id = id;
  s.src = src;
  if (async) s.async = true;
  document.head.appendChild(s);
  return s;
}

/**
 * Inject every consent-gated third-party script the visitor has allowed.
 * Safe to call repeatedly (idempotent). New providers (Paystack, Phase 2)
 * register here so consent gating stays in one place.
 */
export function loadThirdPartyScripts(): void {
  if (getConsentChoice() !== CONSENT_ACCEPTED) return;

  // Google Analytics 4 — only when a measurement ID is configured
  if (GA_ID) {
    injectScript("ga-gtag-src", `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
    if (!document.getElementById("ga-gtag-init")) {
      const init = document.createElement("script");
      init.id = "ga-gtag-init";
      init.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`;
      document.head.appendChild(init);
    }
  }
  // Paystack inline JS (Phase 2) and any future providers register here.
}
