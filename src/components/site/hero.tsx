"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { CONTACT } from "@/lib/content";
import { HeroVisual } from "./hero-visual";
import { Reveal } from "./reveal";

type HeroProps = {
  onGetStarted: () => void;
};

const HERO_PROOF = ["14 service lines", "6-step delivery", "Post-launch support"];

/** Social-proof avatar stack (client portraits from testimonials). */
function ProofAvatars() {
  const avatars = [
    "/images/avatar-chukwuemeka.png",
    "/images/avatar-adaeze.png",
    "/images/avatar-ibrahim.png",
  ];
  return (
    <span className="flex -space-x-2.5" aria-hidden="true">
      {avatars.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 rounded-full border-2 border-white object-cover"
          style={{ zIndex: avatars.length - i }}
        />
      ))}
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gold-dim font-mono text-[9px] font-semibold text-gold"
        style={{ zIndex: 0 }}
      >
        50+
      </span>
    </span>
  );
}

export function Hero({ onGetStarted }: HeroProps) {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section id="hero" aria-label="Hero" className="relative overflow-hidden pb-10 pt-24 md:pb-14 md:pt-32">
      {/* page-level ambience */}
      <div className="bg-grid mask-fade-y pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(70%_100%_at_50%_0%,rgba(240,165,0,0.06),transparent)]" aria-hidden="true" />

      <div className="container-xl relative">
        {/* ── Floating hero container (Saasify-style rounded card) ── */}
        <div className="relative overflow-hidden rounded-[28px] border border-black/[0.08] bg-gradient-to-b from-[#0b111f] to-[#080d18] shadow-[0_32px_90px_-24px_rgba(20,25,38,0.35)]">
          {/* in-container decor */}
          <div className="bg-grid-on-dark pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(75%_70%_at_50%_30%,black,transparent)]" aria-hidden="true" />
          <div className="pointer-events-none absolute -top-32 left-1/2 h-[380px] w-[680px] -translate-x-1/2 rounded-full bg-gold/[0.08] blur-[120px]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-[300px] w-[300px] rounded-full bg-teal/[0.06] blur-[100px]" aria-hidden="true" />
          {/* top gold hairline */}
          <span className="shimmer-line absolute inset-x-0 top-0 h-px opacity-70" aria-hidden="true" />

          <div className="relative grid grid-cols-1 items-center gap-12 p-6 sm:p-8 md:p-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 xl:p-14">
            {/* ── Copy column (mobile-first order) ── */}
            <div className="section-dark max-w-xl">
              <Reveal delay={0}>
                <span className="eyebrow inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-gold-dim px-4 py-1.5 text-gold">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" aria-hidden="true" />
                  Digital services &amp; technology company
                </span>
              </Reveal>

              <Reveal delay={90}>
                <h1 className="mt-5 text-balance font-display text-[2.35rem] font-bold leading-[1.06] tracking-tight text-foreground sm:text-5xl lg:text-[4rem]">
                  Digital products, systems &amp; experiences{" "}
                  <span className="text-gradient-gold">built to move</span> your business forward.
                </h1>
              </Reveal>

              <Reveal delay={180}>
                <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground md:text-lg">
                  Okomba Analytics designs, engineers and operates the technology behind ambitious
                  organizations — web applications, payment systems, automation and digital
                  operations, delivered end-to-end.
                </p>
              </Reveal>

              {/* CTAs — stacked full-width on mobile, inline from sm */}
              <Reveal delay={270}>
                <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                  <button
                    onClick={onGetStarted}
                    className="btn-shine group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-light to-gold px-7 py-4 text-[15px] font-semibold text-ink shadow-gold-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto"
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
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-7 py-4 text-[15px] font-medium text-foreground transition-colors hover:border-gold/50 hover:bg-white/[0.1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto"
                  >
                    Explore Services
                  </button>
                </div>
              </Reveal>

              {/* Social proof row — avatars + checkmarks */}
              <Reveal delay={360}>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <div className="flex items-center gap-3">
                    <ProofAvatars />
                    <p className="text-[12.5px] leading-tight text-muted-foreground">
                      Trusted by <span className="font-semibold text-foreground">50+ clients</span>
                      <span className="block text-[11px] text-muted-foreground/70">across 200+ projects</span>
                    </p>
                  </div>
                  <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 sm:border-l sm:border-black/[0.08] sm:pl-6">
                    {HERO_PROOF.map((p) => (
                      <li key={p} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <CheckCircle2 size={13} className="text-teal" aria-hidden="true" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>

            {/* ── Visual column ── */}
            <Reveal delay={220} className="lg:pl-4">
              <HeroVisual />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
