"use client";

import { TICKER_ITEMS } from "@/lib/content";
import { Reveal } from "./reveal";

/** Marquee ticker of capability keywords (from original Ticker workflow). */
export function CapabilityTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <section aria-label="Capabilities" className="border-y border-white/[0.06] bg-[#070b14]">
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

/** Credibility stats — figures preserved from original company materials. */
export function StatsBand() {
  const stats = [
    { num: "14+", label: "Service categories", accent: "text-gold" },
    { num: "200+", label: "Projects completed", accent: "text-teal" },
    { num: "50+", label: "Satisfied clients", accent: "text-[#5b9eff]" },
    { num: "5+", label: "Years of experience", accent: "text-[#c084fc]" },
  ];
  return (
    <section aria-label="Company statistics" className="container-xl">
      <div className="grid grid-cols-2 gap-3 py-14 md:grid-cols-4 md:gap-4 md:py-16">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 80}>
            <div className="surface-card group h-full p-5 text-center md:p-6">
              <p className={`font-display text-3xl font-bold tracking-tight md:text-[2.6rem] ${s.accent}`}>
                {s.num}
              </p>
              <p className="mt-2 text-[12.5px] font-medium text-muted-foreground md:text-[13.5px]">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
