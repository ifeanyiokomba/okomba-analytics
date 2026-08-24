"use client";

import { Layers, ShieldCheck, Star, TrendingUp } from "lucide-react";
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

/** Credibility stats — light cream band with mixed card treatments. */
export function StatsBand() {
  const stats = [
    {
      num: "200+",
      label: "Projects completed",
      icon: TrendingUp,
      // dark navy card (anchor piece)
      card: "bg-[#0b101c] border-[#0b101c]",
      numColor: "text-gold",
      labelColor: "text-white/70",
      iconBox: "bg-gold-dim text-[#f0a500]",
    },
    {
      num: "14+",
      label: "Service categories",
      icon: Layers,
      card: "bg-white border-black/[0.08]",
      numColor: "text-foreground",
      labelColor: "text-muted-foreground",
      iconBox: "bg-gold-dim text-gold",
    },
    {
      num: "50+",
      label: "Satisfied clients",
      icon: Star,
      // gold-tinted card (accent piece)
      card: "bg-[#f3e8cf] border-[#a06e00]/25",
      numColor: "text-[#7a5400]",
      labelColor: "text-[#7a5400]/70",
      iconBox: "bg-[#a06e00]/15 text-[#a06e00]",
    },
    {
      num: "5+",
      label: "Years of experience",
      icon: ShieldCheck,
      card: "bg-white border-black/[0.08]",
      numColor: "text-foreground",
      labelColor: "text-muted-foreground",
      iconBox: "bg-teal/10 text-teal",
    },
  ];

  return (
    <section aria-label="Company statistics" className="section-light bg-background">
      <div className="container-xl">
        <div className="grid grid-cols-1 gap-3 py-14 sm:grid-cols-2 md:grid-cols-4 md:gap-4 md:py-16">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div
                className={`group flex h-full items-center gap-4 rounded-2xl border p-5 shadow-[0_8px_28px_-16px_rgba(20,25,38,0.25)] transition-transform duration-300 hover:-translate-y-1 md:flex-col md:items-start md:p-6 ${s.card}`}
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.iconBox}`}>
                  <s.icon size={20} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <div>
                  <p className={`font-display text-3xl font-bold tracking-tight md:text-[2.5rem] ${s.numColor}`}>
                    {s.num}
                  </p>
                  <p className={`mt-1 text-[12.5px] font-medium md:text-[13.5px] ${s.labelColor}`}>{s.label}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
