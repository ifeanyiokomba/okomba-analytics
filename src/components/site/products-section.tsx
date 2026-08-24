"use client";

import { ArrowUpRight } from "lucide-react";
import { PRODUCTS, type Product } from "@/lib/content";
import { SectionHeading } from "./section-heading";
import { ServiceIcon } from "./service-icon";
import { Reveal } from "./reveal";

const ACCENTS = {
  gold: {
    icon: "border-gold/25 bg-gold-dim text-gold",
    badge: "border-gold/30 bg-gold-dim text-gold",
  },
  teal: {
    icon: "border-teal/25 bg-teal/10 text-teal",
    badge: "border-teal/30 bg-teal/10 text-teal",
  },
  blue: {
    icon: "border-[#2d6bd4]/25 bg-[#2d6bd4]/10 text-[#2d6bd4]",
    badge: "border-[#2d6bd4]/30 bg-[#2d6bd4]/10 text-[#2d6bd4]",
  },
} as const;

function ProductCard({ p }: { p: Product }) {
  const a = ACCENTS[p.accent];
  return (
    <article className="surface-card-light group relative w-[300px] shrink-0 overflow-hidden p-6 sm:w-[340px]">
      {/* top accent hairline */}
      <span
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-gold-light via-gold to-gold-light opacity-70"
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-4">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${a.icon}`}>
          <ServiceIcon name={p.icon} size={22} />
        </span>
        <span className={`eyebrow rounded-full border px-3 py-1 text-[9px] ${a.badge}`}>{p.category}</span>
      </div>

      <h3 className="mt-5 font-display text-[21px] font-bold text-foreground">{p.name}</h3>
      <p className="mt-1 text-[12.5px] font-medium text-gold">{p.tagline}</p>
      <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">{p.desc}</p>

      <ul className="mt-4 space-y-1.5">
        {p.points.map((pt) => (
          <li key={pt} className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" aria-hidden="true" />
            {pt}
          </li>
        ))}
      </ul>

      <button
        onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
        className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground transition-colors hover:text-gold"
      >
        Discuss this solution
        <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
      </button>
    </article>
  );
}

/**
 * Products & platforms — light cream section with a dual-direction
 * auto-scrolling carousel: the first row travels right (L→R), the
 * second travels left (R→L). Pauses on hover. Duplicated halves
 * loop seamlessly.
 */
export function ProductsSection() {
  const scrollToServices = () =>
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Row composition: row 1 = all four products; row 2 = same four (visual rhythm)
  const rowA = [...PRODUCTS, ...PRODUCTS]; // duplicated for seamless loop
  const rowB = [...PRODUCTS.slice().reverse(), ...PRODUCTS.slice().reverse()];

  return (
    <section id="solutions" className="section-light scroll-mt-20 overflow-hidden bg-background" aria-label="Solutions">
      <div className="relative">
        {/* soft warm radial decor */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_0%,rgba(201,145,10,0.08),transparent)]" aria-hidden="true" />

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

          {/* Carousel — row 1 travels left → right */}
          <div className="marquee-track mask-fade-x -mx-1 overflow-hidden py-3" aria-label="Product carousel, first row">
            <div className="animate-marquee-reverse flex w-max gap-5 px-2" style={{ ["--marquee-duration" as string]: "48s" }}>
              {rowA.map((p, i) => (
                <div key={`a-${p.id}-${i}`} aria-hidden={i >= PRODUCTS.length}>
                  <ProductCard p={p} />
                </div>
              ))}
            </div>
          </div>

          {/* Carousel — row 2 travels right → left */}
          <div className="marquee-track mask-fade-x -mx-1 overflow-hidden py-3" aria-label="Product carousel, second row">
            <div className="animate-marquee flex w-max gap-5 px-2" style={{ ["--marquee-duration" as string]: "42s" }}>
              {rowB.map((p, i) => (
                <div key={`b-${p.id}-${i}`} aria-hidden={i >= PRODUCTS.length}>
                  <ProductCard p={p} />
                </div>
              ))}
            </div>
          </div>

          <Reveal delay={100} className="mt-6 flex justify-center">
            <button
              onClick={scrollToServices}
              className="inline-flex items-center gap-2 rounded-2xl border border-gold/40 bg-white px-6 py-3.5 text-[14px] font-semibold text-gold shadow-gold transition-all hover:-translate-y-0.5 hover:border-gold/70 hover:shadow-gold-lg"
            >
              Explore all services
              <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
