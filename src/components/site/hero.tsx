"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
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
          width={36}
          height={36}
          className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm"
          style={{ zIndex: avatars.length - i }}
        />
      ))}
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gold-dim font-mono text-[10px] font-semibold text-gold shadow-sm"
        style={{ zIndex: 0 }}
      >
        50+
      </span>
    </span>
  );
}

/**
 * Hero — full-width editorial layout. No container card, no floating
 * dashboard cards. Headline + supporting copy + CTAs + social proof
 * expand across the section, mobile-first.
 */
export function Hero({ onGetStarted }: HeroProps) {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section
      id="hero"
      aria-label="Hero"
      className="relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36 lg:pb-32"
    >
      {/* ambience */}
      <div className="bg-grid mask-fade-y pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(75%_100%_at_50%_0%,rgba(160,110,0,0.08),transparent)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-[340px] w-[340px] rounded-full bg-teal/[0.06] blur-[110px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-24 right-1/4 h-[260px] w-[260px] rounded-full bg-gold/[0.07] blur-[100px]" aria-hidden="true" />

      <div className="container-xl relative">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal delay={0}>
            <span className="eyebrow inline-flex items-center gap-2.5 rounded-full border border-gold/30 bg-gold-dim px-4 py-1.5 text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" aria-hidden="true" />
              Digital services &amp; technology company
            </span>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-6 text-balance font-display text-[2.5rem] font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-[4.25rem] lg:text-[5rem]">
              Digital products, systems &amp; experiences{" "}
              <span className="text-gradient-gold">built to move</span> your business forward.
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-[15px] leading-relaxed text-muted-foreground md:text-lg md:leading-relaxed">
              Okomba Analytics designs, engineers and operates the technology behind ambitious
              organizations — web applications, payment systems, automation and digital
              operations, delivered end-to-end.
            </p>
          </Reveal>

          {/* CTAs — stacked full-width on mobile, inline from sm */}
          <Reveal delay={270}>
            <div className="mt-9 flex flex-col items-stretch justify-center gap-3.5 sm:flex-row sm:items-center">
              <button
                onClick={onGetStarted}
                className="btn-shine group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-light to-gold px-8 py-4 text-[15px] font-semibold text-white shadow-gold-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto"
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-black/12 bg-white px-8 py-4 text-[15px] font-medium text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto"
              >
                Explore Services
              </button>
            </div>
          </Reveal>

          {/* Social proof */}
          <Reveal delay={360}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <div className="flex items-center gap-3">
                <ProofAvatars />
                <p className="text-left text-[12.5px] leading-tight text-muted-foreground">
                  Trusted by <span className="font-semibold text-foreground">50+ clients</span>
                  <span className="block text-[11px] text-muted-foreground/70">across 200+ projects</span>
                </p>
              </div>
              <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 sm:border-l sm:border-black/[0.08] sm:pl-6">
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
      </div>
    </section>
  );
}
