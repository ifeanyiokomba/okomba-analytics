"use client";

import { ArrowUpRight, ExternalLink, Sparkles } from "lucide-react";
import Image from "next/image";
import { PRODUCTS, type Product } from "@/lib/content";
import { SectionHeading } from "./section-heading";
import { ServiceIcon } from "./service-icon";
import { Reveal } from "./reveal";

/* ──────────────────────────────────────────────────────────
   Brand color palettes — lifted from the actual product sites
   (Phase 19 research briefs). Each palette maps to the
   Product.accent field in content.ts.
   ────────────────────────────────────────────────────────── */
type Palette = {
  /* top hairline + dot bullets + tagline + ring */
  hairline: string;        // gradient class for the 3px top accent
  dot: string;             // bullet dot color
  tagline: string;         // tagline text color
  ring: string;            // outer card ring on hover
  badgeBg: string;         // status pill bg
  badgeText: string;       // status pill text
  badgeBorder: string;     // status pill border
  iconWrap: string;        // service icon container
  ctaPrimary: string;      // CTA button bg
  ctaPrimaryHover: string; // CTA button hover
  ctaText: string;         // CTA button text color
  imageRing: string;       // image preview ring
  statsBorder: string;     // stats divider color
};

const PALETTES: Record<Product["accent"], Palette> = {
  /* Turbopay — emerald (from turbopay.okomba.com #39bf89) */
  emerald: {
    hairline: "from-emerald-300 via-emerald-500 to-emerald-300",
    dot: "bg-emerald-500/80",
    tagline: "text-emerald-700",
    ring: "hover:ring-emerald-300/70",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
    iconWrap: "border-emerald-200 bg-emerald-50 text-emerald-700",
    ctaPrimary: "bg-emerald-600",
    ctaPrimaryHover: "hover:bg-emerald-700",
    ctaText: "text-white",
    imageRing: "ring-emerald-200/60",
    statsBorder: "border-emerald-100",
  },
  /* Votewise — royal blue (from votewise.com.ng #2249b7) */
  royal: {
    hairline: "from-blue-400 via-blue-700 to-blue-400",
    dot: "bg-blue-600/80",
    tagline: "text-blue-700",
    ring: "hover:ring-blue-300/70",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-200",
    iconWrap: "border-blue-200 bg-blue-50 text-blue-700",
    ctaPrimary: "bg-blue-700",
    ctaPrimaryHover: "hover:bg-blue-800",
    ctaText: "text-white",
    imageRing: "ring-blue-200/60",
    statsBorder: "border-blue-100",
  },
  /* Bill Swift — navy + mint (from billswift.com.ng #00C896 / #1E3A5F) */
  mint: {
    hairline: "from-teal-300 via-teal-500 to-teal-300",
    dot: "bg-teal-500/80",
    tagline: "text-teal-700",
    ring: "hover:ring-teal-300/70",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700",
    badgeBorder: "border-teal-200",
    iconWrap: "border-teal-200 bg-teal-50 text-teal-700",
    ctaPrimary: "bg-teal-600",
    ctaPrimaryHover: "hover:bg-teal-700",
    ctaText: "text-white",
    imageRing: "ring-teal-200/60",
    statsBorder: "border-teal-100",
  },
  /* Okomba gold (default — used for roadmap products) */
  gold: {
    hairline: "from-gold-light via-gold to-gold-light",
    dot: "bg-gold/80",
    tagline: "text-gold",
    ring: "hover:ring-gold/40",
    badgeBg: "bg-gold-dim",
    badgeText: "text-gold",
    badgeBorder: "border-gold/30",
    iconWrap: "border-gold/25 bg-gold-dim text-gold",
    ctaPrimary: "bg-gradient-to-r from-gold-light to-gold",
    ctaPrimaryHover: "hover:shadow-gold",
    ctaText: "text-ink",
    imageRing: "ring-gold/20",
    statsBorder: "border-gold/10",
  },
  /* Okomba teal */
  teal: {
    hairline: "from-teal-300 via-teal to-teal-300",
    dot: "bg-teal/80",
    tagline: "text-teal",
    ring: "hover:ring-teal/40",
    badgeBg: "bg-teal/10",
    badgeText: "text-teal",
    badgeBorder: "border-teal/30",
    iconWrap: "border-teal/25 bg-teal/10 text-teal",
    ctaPrimary: "bg-teal",
    ctaPrimaryHover: "hover:bg-teal-dark",
    ctaText: "text-white",
    imageRing: "ring-teal/20",
    statsBorder: "border-teal/10",
  },
  /* Okomba blue (used for TrustScore roadmap) */
  blue: {
    hairline: "from-[#5b8fd4] via-[#2d6bd4] to-[#5b8fd4]",
    dot: "bg-[#2d6bd4]/80",
    tagline: "text-[#2d6bd4]",
    ring: "hover:ring-[#5b8fd4]/50",
    badgeBg: "bg-[#2d6bd4]/10",
    badgeText: "text-[#2d6bd4]",
    badgeBorder: "border-[#2d6bd4]/30",
    iconWrap: "border-[#2d6bd4]/25 bg-[#2d6bd4]/10 text-[#2d6bd4]",
    ctaPrimary: "bg-[#2d6bd4]",
    ctaPrimaryHover: "hover:bg-[#1f55a8]",
    ctaText: "text-white",
    imageRing: "ring-[#2d6bd4]/20",
    statsBorder: "border-[#2d6bd4]/10",
  },
};

function StatusPill({ status }: { status: Product["status"] }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
        </span>
        Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
      <Sparkles size={10} aria-hidden="true" />
      Coming soon
    </span>
  );
}

function ProductCard({ p }: { p: Product }) {
  const a = PALETTES[p.accent] ?? PALETTES.gold;
  const isLive = p.status === "live";

  const handleCta = () => {
    if (isLive && p.link) {
      window.open(p.link, "_blank", "noopener,noreferrer");
      return;
    }
    // Coming-soon + roadmap → scroll to inquiry section
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <article
      className={`surface-card-light group relative w-[320px] shrink-0 overflow-hidden rounded-2xl p-0 ring-1 ring-black/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-20px_rgba(20,25,38,0.18)] sm:w-[360px] ${a.ring}`}
    >
      {/* top accent hairline */}
      <span
        className={`absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r ${a.hairline} opacity-80`}
        aria-hidden="true"
      />

      {/* Preview image — real screenshot for LIVE, brand banner for roadmap */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-b from-black/[0.03] to-black/[0.06]">
        <Image
          src={p.image}
          alt={`${p.name} — ${p.tagline}`}
          fill
          sizes="(max-width: 640px) 320px, 360px"
          loading="eager"
          className={`object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] ring-1 ${a.imageRing}`}
        />
        {/* gradient fade so text badges sit cleanly on the image */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/95 to-transparent" aria-hidden="true" />
        {/* status pill — top-left of image */}
        <div className="absolute left-3 top-3">
          <StatusPill status={p.status} />
        </div>
        {/* category eyebrow — top-right of image */}
        <span className="absolute right-3 top-3 rounded-full border border-white/60 bg-white/80 px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-ink/70 backdrop-blur">
          {p.category}
        </span>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Service icon */}
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${a.iconWrap}`}>
              <ServiceIcon name={p.icon} size={18} />
            </span>
            {/* Product name + tagline */}
            <div className="leading-tight">
              <h3 className="font-display text-[18px] font-bold text-foreground">{p.name}</h3>
              <p className={`text-[12px] font-medium ${a.tagline}`}>{p.tagline}</p>
            </div>
          </div>
          {p.logo && (
            // Brand logo (small, top-right of body)
            <Image
              src={p.logo}
              alt={`${p.name} logo`}
              width={28}
              height={28}
              style={{ width: 28, height: 28 }}
              className="shrink-0 opacity-80"
            />
          )}
        </div>

        <p className="mt-3 line-clamp-3 text-[12.5px] leading-relaxed text-muted-foreground">{p.desc}</p>

        {/* Feature bullets */}
        <ul className="mt-3 grid grid-cols-1 gap-1.5">
          {p.points.slice(0, 4).map((pt) => (
            <li key={pt} className="flex items-start gap-2 text-[12px] text-muted-foreground">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${a.dot}`} aria-hidden="true" />
              <span className="leading-snug">{pt}</span>
            </li>
          ))}
        </ul>

        {/* Stats band */}
        {p.stats && p.stats.length > 0 && (
          <div
            className={`mt-4 grid gap-2 border-t ${a.statsBorder} pt-3`}
            style={{ gridTemplateColumns: `repeat(${Math.min(p.stats.length, 4)}, minmax(0, 1fr))` }}
          >
            {p.stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className={`font-display text-[13px] font-bold ${a.tagline}`}>{s.value}</p>
                <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground/70">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pricing note */}
        {p.pricingNote && (
          <p className="mt-3 text-center text-[11px] font-medium text-muted-foreground/80">{p.pricingNote}</p>
        )}

        {/* CTA */}
        <button
          onClick={handleCta}
          className={`mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl ${a.ctaPrimary} ${a.ctaPrimaryHover} px-4 py-2.5 text-[12.5px] font-semibold ${a.ctaText} transition-all hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold`}
        >
          {p.ctaLabel}
          {isLive ? <ExternalLink size={13} aria-hidden="true" /> : <ArrowUpRight size={13} aria-hidden="true" />}
        </button>
      </div>
    </article>
  );
}

/**
 * Products & platforms — light cream section with a dual-direction
 * auto-scrolling carousel: the first row travels right (L→R), the
 * second travels left (R→L). Pauses on hover. Duplicated halves
 * loop seamlessly.
 *
 * Phase 19 rebuild: cards now show REAL screenshots from the live
 * product sites (Turbopay, Votewise, Bill Swift) + brand-accurate
 * color palettes (emerald / royal / mint) + Live/Coming soon
 * status pills + stats bands + external "Visit site" CTAs.
 * Roadmap products (TrustScore, Omniscore, Sanctum) show the
 * existing brand banner + a "Coming soon" pill + a waitlist CTA.
 */
export function ProductsSection() {
  const scrollToServices = () =>
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Row composition: row 1 = all six products; row 2 = same six reversed (visual rhythm)
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
            <div className="animate-marquee-reverse flex w-max gap-5 px-2" style={{ ["--marquee-duration" as string]: "60s" }}>
              {rowA.map((p, i) => (
                <div key={`a-${p.id}-${i}`} aria-hidden={i >= PRODUCTS.length}>
                  <ProductCard p={p} />
                </div>
              ))}
            </div>
          </div>

          {/* Carousel — row 2 travels right → left */}
          <div className="marquee-track mask-fade-x -mx-1 overflow-hidden py-3" aria-label="Product carousel, second row">
            <div className="animate-marquee flex w-max gap-5 px-2" style={{ ["--marquee-duration" as string]: "54s" }}>
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
