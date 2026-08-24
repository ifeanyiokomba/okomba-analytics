"use client";

import { Layers, ShieldCheck, Star, TrendingUp } from "lucide-react";
import { TICKER_ITEMS } from "@/lib/content";
import { Reveal } from "./reveal";
import { AnimatedNumber } from "./animated-number";

/** Marquee ticker of capability keywords (from original Ticker workflow). */
export function CapabilityTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <section aria-label="Capabilities" className="border-y border-black/[0.07] bg-[#070b14]">
      <div className="marquee-track mask-fade-x overflow-hidden py-5">
        <div className="animate-marquee flex w-max items-center gap-10">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-10" aria-hidden={i >= TICKER_ITEMS.length}>
              <span className="eyebrow whitespace-nowrap text-[11px] text-muted-foreground transition-colors hover:text-gold">
                {item}
              </span>
              <span className="h-1 w-1 shrink-0 rounded-full bg-gold/50" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Credibility stats — light cream band with mixed card treatments.
 * Termii-style technical spec cards: mono uppercase label on top,
 * massive tabular display value that counts up on scroll into view.
 */
export function StatsBand() {
  const stats = [
    {
      value: 200,
      suffix: "+",
      label: "Projects completed",
      icon: TrendingUp,
      // dark navy card (anchor piece)
      card: "bg-[#0b101c] border-[#0b101c]",
      numColor: "text-gold-light",
      labelColor: "text-white/60",
      iconBox: "bg-white/[0.07] text-gold-light",
      hairline: "bg-white/10",
    },
    {
      value: 14,
      suffix: "+",
      label: "Service categories",
      icon: Layers,
      card: "bg-white border-black/[0.08]",
      numColor: "text-foreground",
      labelColor: "text-muted-foreground",
      iconBox: "bg-gold-dim text-gold",
      hairline: "bg-black/[0.07]",
    },
    {
      value: 50,
      suffix: "+",
      label: "Satisfied clients",
      icon: Star,
      // gold-tinted card (accent piece)
      card: "bg-[#fdf3d7] border-[#C9910A]/30",
      numColor: "text-[#8a5e00]",
      labelColor: "text-[#8a5e00]/75",
      iconBox: "bg-[#C9910A]/15 text-[#8a5e00]",
      hairline: "bg-[#C9910A]/20",
    },
    {
      value: 5,
      suffix: "+",
      label: "Years of experience",
      icon: ShieldCheck,
      card: "bg-white border-black/[0.08]",
      numColor: "text-foreground",
      labelColor: "text-muted-foreground",
      iconBox: "bg-teal/10 text-teal",
      hairline: "bg-black/[0.07]",
    },
  ];

  return (
    <section aria-label="Company statistics" className="section-light bg-background">
      <div className="container-xl">
        <div className="grid grid-cols-1 gap-3 py-14 sm:grid-cols-2 md:grid-cols-4 md:gap-4 md:py-16">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div
                className={`group flex h-full flex-col rounded-2xl border p-5 shadow-[0_8px_28px_-16px_rgba(20,25,38,0.25)] transition-transform duration-300 hover:-translate-y-1 md:p-6 ${s.card}`}
              >
                {/* spec label row */}
                <div className="flex items-start justify-between gap-3">
                  {/* inline tracking: the unlayered .eyebrow rule would beat a
                      Tailwind tracking-* utility, so tighten via inline style */}
                  <p
                    className={`eyebrow text-[10px] leading-relaxed ${s.labelColor}`}
                    style={{ letterSpacing: "0.15em" }}
                  >
                    {s.label}
                  </p>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.iconBox}`}>
                    <s.icon size={17} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                </div>
                {/* massive tabular value */}
                <p
                  className={`mt-4 font-display text-[clamp(2.2rem,3vw,3rem)] font-bold leading-none tracking-tight ${s.numColor}`}
                >
                  <span aria-hidden="true">
                    <AnimatedNumber value={s.value} suffix={s.suffix} duration={1500 + i * 150} />
                  </span>
                  <span className="sr-only">
                    {s.value}
                    {s.suffix}
                  </span>
                </p>
                {/* spec footer */}
                <div className={`mt-4 h-px w-full ${s.hairline}`} aria-hidden="true" />
                <p className={`mt-3 font-mono text-[9.5px] font-medium uppercase tracking-[0.18em] ${s.labelColor}`}>
                  Stat / {String(i + 1).padStart(2, "0")}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
