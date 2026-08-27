"use client";

/**
 * Services Showcase dialog (Stage 10).
 *
 * Opened from the Hero secondary CTA ("Explore our services"). A
 * premium, mobile-first full-bleed sheet (mobile) / centered
 * modal (desktop) that surfaces all 14 Okomba service lines,
 * grouped by category, with live search + category filter and
 * one-tap "Request this service" that hands off to the inquiry
 * modal workflow (unchanged from Module 1).
 *
 * Design language: glass surface, gold-accent category chips,
 * soft entrance, keyboard-dismissible, focus-trapped visuals.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search, X, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, SERVICES, type Service } from "@/lib/content";
import { ServiceIcon } from "./service-icon";

type ServicesShowcaseProps = {
  open: boolean;
  onClose: () => void;
  onRequestService: (service: Service) => void;
};

export function ServicesShowcase({ open, onClose, onRequestService }: ServicesShowcaseProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("All");

  // Lock body scroll + close on Escape while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byCat = active === "All" ? SERVICES : SERVICES.filter((s) => s.category === active);
    if (!q) return byCat;
    return byCat.filter((s) =>
      s.title.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q)) ||
      s.subs.some((sub) => sub.toLowerCase().includes(q))
    );
  }, [query, active]);

  // Group filtered results by category for an editorial layout
  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of filtered) {
      const arr = map.get(s.category) ?? [];
      arr.push(s);
      map.set(s.category, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-label="All Okomba services"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close services showcase"
            onClick={onClose}
            className="absolute inset-0 bg-[#04060b]/55 backdrop-blur-md"
          />

          {/* Panel — mobile bottom sheet, desktop centered modal */}
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.5 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-gold/20 bg-[#f7f5ef] shadow-float sm:max-h-[86dvh] sm:w-[min(960px,92vw)] sm:rounded-3xl"
          >
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 sm:hidden" aria-hidden="true">
              <span className="h-1.5 w-10 rounded-full bg-black/15" />
            </div>

            {/* Header */}
            <header className="relative shrink-0 border-b border-black/[0.06] px-5 pb-4 pt-3 sm:px-7 sm:pt-5">
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" aria-hidden="true" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow text-[10px] text-gold">All 14 services · one team</p>
                  <h2 className="mt-1.5 font-display text-[1.4rem] font-bold leading-tight text-foreground sm:text-[1.85rem]">
                    Explore our <span className="text-gradient-gold">service lines</span>
                  </h2>
                  <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
                    Technology, finance, operations, creative and education — each with a clear scope, defined outcomes, and a team that has delivered it before. Tap any service to request it.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              </div>

              {/* Search + filter row */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <label htmlFor="svc-search" className="sr-only">Search services</label>
                <div className="relative flex-1">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" aria-hidden="true" />
                  <input
                    id="svc-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search services — e.g. payment, automation, dashboard…"
                    className="h-11 w-full rounded-xl border border-black/[0.1] bg-white pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/70 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/25"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {CATEGORIES.map((cat) => {
                    const isActive = active === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActive(cat)}
                        aria-pressed={isActive}
                        className={cn(
                          "whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all",
                          isActive
                            ? "border-gold/50 bg-gold-dim text-gold shadow-gold"
                            : "border-black/[0.08] bg-white text-muted-foreground hover:border-black/15 hover:text-foreground"
                        )}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </header>

            {/* Body — grouped grid */}
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              {grouped.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-dim text-gold">
                    <Search size={20} aria-hidden="true" />
                  </span>
                  <p className="text-[14px] font-semibold text-foreground">No services match &ldquo;{query}&rdquo;</p>
                  <p className="text-[12.5px] text-muted-foreground">Try a different keyword or clear the search.</p>
                  <button
                    onClick={() => { setQuery(""); setActive("All"); }}
                    className="mt-1 rounded-full border border-gold/40 bg-gold-dim px-4 py-1.5 text-[12px] font-semibold text-gold"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="space-y-7">
                  {grouped.map(([cat, items]) => (
                    <section key={cat} aria-label={cat}>
                      <div className="mb-3 flex items-center gap-3">
                        <h3 className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-gold">{cat}</h3>
                        <span className="font-mono text-[10px] text-muted-foreground/70">{items.length}</span>
                        <span className="h-px flex-1 bg-black/[0.06]" aria-hidden="true" />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((svc, i) => (
                          <ShowcaseCard
                            key={svc.id}
                            svc={svc}
                            index={i}
                            onRequest={() => { onRequestService(svc); onClose(); }}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>

            {/* Footer band */}
            <footer className="shrink-0 border-t border-black/[0.06] bg-white px-5 py-3.5 sm:px-7">
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Sparkles size={13} className="text-gold" aria-hidden="true" />
                  Not sure which fits? The AI service finder will match you in seconds.
                </p>
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <CheckCircle2 size={13} className="text-teal" aria-hidden="true" />
                  Proposal within 24 hours · Free consultation
                </div>
              </div>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShowcaseCard({ svc, index, onRequest }: { svc: Service; index: number; onRequest: () => void }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.25), ease: [0.22, 1, 0.36, 1] }}
      onClick={onRequest}
      className="surface-card-light spotlight group flex h-full flex-col text-left"
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold-dim text-gold transition-transform duration-300 group-hover:scale-105">
            <ServiceIcon name={svc.icon} size={20} />
          </span>
          <span className="rounded-full bg-black/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
            {svc.category}
          </span>
        </div>
        <h4 className="mt-4 text-[15px] font-semibold leading-snug text-foreground">{svc.title}</h4>
        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">{svc.desc}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {svc.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-md bg-black/[0.04] px-1.5 py-0.5 font-mono text-[9.5px] text-muted-foreground">{t}</span>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-[12px] font-semibold text-gold">
          Request this service
          <ArrowRight size={13} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </div>
      </div>
    </motion.button>
  );
}
