"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Cookie, Settings2, ShieldCheck, X } from "lucide-react";
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
 *
 * Stage 11 (founder directive): surfaces faster (700ms vs the old 1.4s),
 * renders a three-button choice — Accept all / Allow analytics / Essential
 * only — and adds a tiny "Manage" expander with toggle chips for the
 * analytics category so users feel in control. Slides in from the bottom
 * with a gold hairline + a soft halo so it doesn't feel like an afterthought.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [returning, setReturning] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(true);

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
      // Surface quickly — 700ms feels responsive without feeling intrusive.
      const t = setTimeout(() => show(false), 700);
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
        "fixed inset-x-3 bottom-3 z-[110] sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-w-md",
        "transition-all duration-300 ease-out",
        leaving ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100",
        "[animation:slide-in-up_0.4s_cubic-bezier(0.22,1,0.36,1)]"
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

            {/* Manage panel — toggle chips for the analytics category */}
            {expanded && (
              <div className="mt-3 rounded-xl border border-gold/15 bg-gold/[0.05] p-3">
                <p className="mb-2 font-mono text-[9.5px] uppercase tracking-wider text-gold/80">
                  Preferences
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={13} className="text-foreground/70" aria-hidden="true" />
                      <div>
                        <p className="text-[12px] font-medium text-foreground">Essential</p>
                        <p className="text-[10.5px] text-muted-foreground">Required for the site to function.</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-black/10 bg-black/[0.05] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Always on
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnalyticsOn((v) => !v)}
                    aria-pressed={analyticsOn}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-black/[0.03]"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <Settings2 size={13} className={analyticsOn ? "text-gold" : "text-muted-foreground"} aria-hidden="true" />
                      <div>
                        <p className="text-[12px] font-medium text-foreground">Analytics</p>
                        <p className="text-[10.5px] text-muted-foreground">Anonymous page-view metrics only.</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                        analyticsOn ? "bg-gold" : "bg-black/15"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                          analyticsOn ? "translate-x-4" : "translate-x-1"
                        )}
                      />
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <button
                onClick={accept}
                className="btn-shine inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gold-light to-gold px-4 py-2.5 text-[12.5px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                <Check size={13} strokeWidth={2.6} aria-hidden="true" />
                Accept all
              </button>
              <button
                onClick={() => {
                  if (analyticsOn) accept();
                  else essentialOnly();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gold/30 bg-gold/[0.06] px-4 py-2.5 text-[12.5px] font-medium text-gold transition-colors hover:border-gold/50 hover:bg-gold/15 focus-visible:outline-2 focus-visible:outline-gold"
              >
                Allow analytics
              </button>
              <button
                onClick={essentialOnly}
                className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.1] bg-black/[0.03] px-4 py-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-black/25 hover:text-foreground focus-visible:outline-2 focus-visible:outline-gold"
              >
                <X size={13} aria-hidden="true" />
                Essential only
              </button>
            </div>

            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80 transition-colors hover:text-foreground"
              aria-expanded={expanded}
            >
              {expanded ? "Hide preferences" : "Manage preferences"}
            </button>
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
