"use client";

import { useState } from "react";
import { ArrowRight, BadgeCheck, Eye, LayoutGrid, Megaphone, ShieldCheck, TrendingUp } from "lucide-react";
import { Reveal } from "./reveal";
import { AdRequestDialog } from "./ad-request-dialog";
import { AD_PLACEMENTS } from "@/lib/ads-shared";

/* ── BATCH 6 (§37/§41) — public "Advertise With Us" section ────
   Explains the marketplace (formats + placements + guardrails),
   then opens the §37 request dialog. Placement cards use the
   same keys the backend serves, so the pitch matches reality. */

type AdvertiseSectionProps = {
  onRequestAd?: (placement?: string) => void;
};

const GUARANTEES = [
  {
    icon: Eye,
    title: "High-intent audience",
    desc: "Founders, directors, and teams actively researching digital, data, and growth services.",
  },
  {
    icon: ShieldCheck,
    title: "Brand-safe placements",
    desc: "Every campaign is reviewed by a human before it ships — no adjacency surprises.",
  },
  {
    icon: TrendingUp,
    title: "Clearly sponsored, never deceptive",
    desc: "Ads are always labelled “Sponsored” and sized to complement — never overpower — our content.",
  },
  {
    icon: BadgeCheck,
    title: "Transparent workflow",
    desc: "Request → review → pricing → payment → schedule → live. You're notified at every step.",
  },
];

export function AdvertiseSection({ onRequestAd }: AdvertiseSectionProps) {
  const [open, setOpen] = useState(false);
  const [thanksName, setThanksName] = useState<string | null>(null);

  const openDialog = (placement?: string) => {
    if (onRequestAd) {
      onRequestAd(placement);
      return;
    }
    setOpen(true);
  };

  return (
    <section id="advertise" aria-label="Advertise with us" className="section-pad relative scroll-mt-20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        aria-hidden="true"
      />

      <div className="container-xl relative">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-gold-dim px-4 py-1.5 text-gold">
              <Megaphone size={13} aria-hidden="true" />
              Advertise with us
            </span>
            <h2 className="display-section mt-6 font-display text-balance text-foreground">
              Put your brand in front of{" "}
              <span className="text-gradient-gold">decision-makers.</span>
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
              Our readers come here to solve real business problems — the exact moment your
              campaign belongs in. Choose a placement, tell us about your campaign, and we&apos;ll
              handle review, scheduling, and reporting.
            </p>
            <button
              onClick={() => openDialog()}
              className="btn-gold group mx-auto mt-8 flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-[14px] font-semibold text-ink transition-all"
            >
              Request advertisement
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          </div>
        </Reveal>

        {/* Placement inventory — §41 formats, real backend keys */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AD_PLACEMENTS.map((p, i) => (
            <Reveal key={p.key} delay={0.06 * i}>
              <button
                onClick={() => openDialog(p.key)}
                className="surface-card group flex h-full w-full flex-col items-start gap-3 p-5 text-left transition-all hover:-translate-y-1 hover:border-gold/35 focus-visible:outline-2 focus-visible:outline-gold"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim text-gold">
                  <LayoutGrid size={17} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <span className="text-[14.5px] font-semibold text-foreground">{p.label}</span>
                <span className="text-[12.5px] leading-relaxed text-muted-foreground">{p.desc}</span>
                <span className="mt-auto flex items-center gap-1.5 pt-2 text-[12px] font-medium text-gold">
                  Request this
                  <ArrowRight
                    size={13}
                    className="transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </Reveal>
            ))}
        </div>

        {/* Guardrails */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GUARANTEES.map((g, i) => (
            <Reveal key={g.title} delay={0.05 * i}>
              <div className="flex h-full items-start gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal/25 bg-teal-dim text-teal">
                  <g.icon size={16} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold text-foreground">{g.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{g.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <AdRequestDialog
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={(name) => setThanksName(name)}
      />

      {/* Lightweight thank-you toast — the dialog closes on success */}
      {thanksName && (
        <div
          className="fixed bottom-6 left-1/2 z-[120] -translate-x-1/2 rounded-xl border border-teal/30 bg-[#0b101c] px-5 py-3.5 text-[13px] text-foreground shadow-float"
          role="status"
          aria-live="polite"
        >
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-dim text-teal align-middle">
            <BadgeCheck size={13} aria-hidden="true" />
          </span>
          Thank you, {thanksName} — your advertising request has been received.
          <button
            onClick={() => setThanksName(null)}
            className="ml-4 text-[12px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </section>
  );
}
