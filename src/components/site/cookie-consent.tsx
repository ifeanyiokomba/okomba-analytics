"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Cookie, Settings2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadThirdPartyScripts } from "@/lib/consent-scripts";

const STORAGE_KEY = "okomba_cookie_consent";
const ACCEPTED = "accepted";
const ESSENTIAL = "essential";

/**
 * Cookie consent banner — slides up on first visit, persists the choice
 * (accept all, or essential-only) in localStorage. The banner can be
 * re-opened anytime from the footer "Cookies" link via the
 * `okomba:open-cookie-settings` window event.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [returning, setReturning] = useState(false);

  const show = useCallback((isReturning = false) => {
    setReturning(isReturning);
    setLeaving(false);
    setVisible(true);
  }, []);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage unavailable — fall through and show */
    }
    if (stored !== ACCEPTED && stored !== ESSENTIAL) {
      const t = setTimeout(() => show(false), 1400);
      return () => clearTimeout(t);
    }
    // Returning visitor who already accepted → restore third-party scripts
    if (stored === ACCEPTED) loadThirdPartyScripts();
  }, [show]);

  // Re-open from the footer "Cookies" link
  useEffect(() => {
    const onOpen = () => show(true);
    window.addEventListener("okomba:open-cookie-settings", onOpen);
    return () => window.removeEventListener("okomba:open-cookie-settings", onOpen);
  }, [show]);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => setVisible(false), 320);
  };

  const store = (value: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* storage blocked — still dismiss for this session */
    }
  };

  const accept = () => {
    store(ACCEPTED);
    loadThirdPartyScripts(); // GA (and Phase-2 providers) only load now
    dismiss();
  };

  const essentialOnly = () => {
    store(ESSENTIAL);
    dismiss();
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className={cn(
        "fixed inset-x-4 bottom-4 z-[110] sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-w-md",
        "transition-all duration-300 ease-out",
        leaving ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"
      )}
    >
      <div className="surface-glass relative overflow-hidden rounded-2xl p-5 shadow-float">
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gold/[0.12] blur-2xl" aria-hidden="true" />
        <div className="shimmer-line pointer-events-none absolute inset-x-0 top-0 h-px opacity-60" aria-hidden="true" />

        <div className="relative flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-dim text-gold">
            <Cookie size={18} aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[13.5px] font-semibold text-foreground">
              {returning ? (
                <>
                  <Settings2 size={13} className="text-gold" aria-hidden="true" />
                  Cookie settings
                </>
              ) : (
                "We use cookies for the best experience on Okomba Analytics"
              )}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
              Analytics and payment scripts only load if you accept. No advertising
              trackers, no data resale — see our{" "}
              <button
                onClick={() => {
                  accept();
                  document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="font-medium text-gold underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-gold"
              >
                privacy approach
              </button>
              .
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <button
                onClick={accept}
                className="btn-shine inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gold-light to-gold px-4 py-2.5 text-[12.5px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                <Check size={13} strokeWidth={2.6} aria-hidden="true" />
                Accept all
              </button>
              <button
                onClick={essentialOnly}
                className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.1] bg-black/[0.03] px-4 py-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-black/25 hover:text-foreground focus-visible:outline-2 focus-visible:outline-gold"
              >
                <X size={13} aria-hidden="true" />
                Essential only
              </button>
            </div>
          </div>

          <button
            onClick={dismiss}
            aria-label="Close cookie notice"
            className="shrink-0 rounded-lg p-1 text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-gold"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
