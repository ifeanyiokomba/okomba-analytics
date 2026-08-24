"use client";

import { useEffect, useState } from "react";
import { Check, Cookie, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "okomba_cookie_consent";
const CONSENT_VALUE = "accepted";

/**
 * Cookie consent banner — slides up on first visit, persists choice
 * in localStorage, fully dismissed afterwards. Accessible (role, aria).
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== CONSENT_VALUE) {
        // Small delay so the page settles before the banner appears
        const t = setTimeout(() => setVisible(true), 1400);
        return () => clearTimeout(t);
      }
    } catch {
      // Storage unavailable — default to showing the banner
      const t = setTimeout(() => setVisible(true), 1400);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => setVisible(false), 320);
  };

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, CONSENT_VALUE);
    } catch {
      /* storage blocked — still dismiss for this session */
    }
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
        <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-gold/[0.1] blur-2xl" aria-hidden="true" />

        <div className="relative flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-dim text-gold">
            <Cookie size={18} aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-foreground">Cookies, kept minimal</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
              We use essential cookies to run this site and anonymous analytics to improve it.
              No advertising trackers, no data resale — see our{" "}
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

            <div className="mt-4 flex items-center gap-2.5">
              <button
                onClick={accept}
                className="btn-shine inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gold-light to-gold px-4 py-2.5 text-[12.5px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                <Check size={13} strokeWidth={2.6} aria-hidden="true" />
                Accept
              </button>
              <button
                onClick={dismiss}
                aria-label="Dismiss cookie notice"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground focus-visible:outline-2 focus-visible:outline-gold"
              >
                <X size={13} aria-hidden="true" />
                Essential only
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
