"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCTS } from "@/lib/content";
import { SectionHeading } from "./section-heading";
import { ServiceIcon } from "./service-icon";
import { Reveal } from "./reveal";

const ACCENTS = {
  gold: {
    icon: "border-gold/25 bg-gold-dim text-gold",
    badge: "border-gold/30 bg-gold-dim text-gold",
    line: "from-gold/60",
  },
  teal: {
    icon: "border-teal/25 bg-teal-dim text-teal",
    badge: "border-teal/30 bg-teal-dim text-teal",
    line: "from-teal/60",
  },
  blue: {
    icon: "border-[#5b9eff]/25 bg-[#5b9eff]/10 text-[#5b9eff]",
    badge: "border-[#5b9eff]/30 bg-[#5b9eff]/10 text-[#5b9eff]",
    line: "from-[#5b9eff]/60",
  },
} as const;

export function ProductsSection() {
  const scrollToServices = () =>
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section id="solutions" className="section-pad relative scroll-mt-20 overflow-hidden" aria-label="Solutions">
      {/* Backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(240,165,0,0.05),transparent)]" aria-hidden="true" />

      <div className="container-xl relative">
        <SectionHeading
          eyebrow="Products & platforms"
          title={
            <>
              Not just services — <span className="text-gradient-gold">real products</span> we run
            </>
          }
          desc="Okomba Analytics builds and operates its own technology platforms. The same engineering discipline behind them is what we deploy on every client engagement."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PRODUCTS.map((p, i) => {
            const a = ACCENTS[p.accent];
            return (
              <Reveal key={p.id} delay={i * 90}>
                <article className="surface-card group relative h-full overflow-hidden p-7 md:p-8">
                  {/* top accent line */}
                  <span
                    className={cn(
                      "absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent opacity-60",
                      a.line
                    )}
                    aria-hidden="true"
                  />
                  {/* hover glow */}
                  <span
                    className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gold/[0.06] opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                    aria-hidden="true"
                  />

                  <div className="flex items-start justify-between gap-4">
                    <span className={cn("flex h-13 w-13 items-center justify-center rounded-2xl border p-3.5", a.icon)}>
                      <ServiceIcon name={p.icon} size={24} />
                    </span>
                    <span className={cn("eyebrow rounded-full border px-3 py-1.5 text-[9px]", a.badge)}>
                      {p.category}
                    </span>
                  </div>

                  <h3 className="mt-6 font-display text-[22px] font-bold text-foreground">{p.name}</h3>
                  <p className="mt-1.5 text-[13.5px] font-medium text-gold/90">{p.tagline}</p>
                  <p className="mt-3.5 text-[14px] leading-relaxed text-muted-foreground">{p.desc}</p>

                  <ul className="mt-5 grid gap-2 sm:grid-cols-1">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                        <span className={cn("h-1.5 w-1.5 rounded-full bg-current", a.icon.match("teal") ? "text-teal" : "text-gold")} aria-hidden="true" />
                        {pt}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={scrollToServices}
                    className="mt-7 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-foreground transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
                  >
                    Discuss this solution
                    <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </button>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
