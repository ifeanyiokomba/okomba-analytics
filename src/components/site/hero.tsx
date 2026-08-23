"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { CONTACT } from "@/lib/content";
import { HeroVisual } from "./hero-visual";
import { Reveal } from "./reveal";

type HeroProps = {
  onGetStarted: () => void;
};

const HERO_PROOF = [
  "14 service lines",
  "6-step delivery process",
  "Post-launch support",
];

export function Hero({ onGetStarted }: HeroProps) {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section id="hero" aria-label="Hero" className="relative overflow-hidden">
      {/* Backdrop decor */}
      <div className="bg-grid mask-fade-y pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-gold/[0.07] blur-[130px]" aria-hidden="true" />

      <div className="container-xl relative grid grid-cols-1 items-center gap-14 pb-24 pt-32 md:pb-32 md:pt-40 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-40 lg:pt-44">
        {/* ── Copy column ── */}
        <div className="max-w-xl">
          <Reveal delay={0}>
            <span className="eyebrow inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-gold-dim px-4 py-1.5 text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" aria-hidden="true" />
              Digital services &amp; technology company
            </span>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-6 text-balance font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-[4.2rem]">
              Digital products, systems &amp; experiences{" "}
              <span className="text-gradient-gold">built to move</span> your business forward.
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-6 max-w-lg text-[15.5px] leading-relaxed text-muted-foreground md:text-lg">
              Okomba Analytics designs, engineers and operates the technology behind ambitious
              organizations — web applications, payment systems, automation and digital
              operations, delivered end-to-end.
            </p>
          </Reveal>

          <Reveal delay={270}>
            <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <button
                onClick={onGetStarted}
                className="btn-shine group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-light to-gold px-7 py-4 text-[15px] font-semibold text-ink shadow-gold-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Start a Project
                <ArrowRight
                  size={17}
                  strokeWidth={2.4}
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
              <button
                onClick={() => scrollTo("services")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] px-7 py-4 text-[15px] font-medium text-foreground transition-colors hover:border-gold/35 hover:bg-gold-dim/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Explore Services
              </button>
            </div>
          </Reveal>

          <Reveal delay={360}>
            <ul className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2.5">
              {HERO_PROOF.map((p) => (
                <li key={p} className="flex items-center gap-2 text-[13.5px] text-muted-foreground">
                  <CheckCircle2 size={15} className="text-teal" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* ── Visual column ── */}
        <Reveal delay={220} className="lg:pl-4">
          <HeroVisual />
        </Reveal>
      </div>

      {/* Bottom fade divider */}
      <div className="shimmer-line absolute inset-x-0 bottom-0 h-px opacity-60" aria-hidden="true" />
    </section>
  );
}
