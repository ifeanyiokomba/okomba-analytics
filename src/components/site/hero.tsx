"use client";

import { ArrowRight, CheckCircle2, LayoutGrid } from "lucide-react";
import { Reveal } from "./reveal";
import { AnimatedHeadline } from "./animated-headline";
import { HeroVisual } from "./hero-visual";

type HeroProps = {
  onGetStarted: () => void;
  onViewServices: () => void;
};

const HERO_PROOF = ["14 service lines", "6-step delivery", "Post-launch support"];

const ROTATING_WORDS = ["automate.", "scale.", "connect.", "see clearly.", "move faster."];

/**
 * Hero — Termii-grade product storytelling. Left: metrics pill → massive
 * headline with typing rotation → supporting copy → CTAs → micro-trust.
 * Right: live-UI cards cycling through real Okomba service workflows.
 * Mobile-first: copy stacks above a compact visual.
 *
 * Stage 10 CTA redesign (Termii-inspired, mobile-first):
 *   • Primary CTA "Start a Project" — full-width on mobile, gold gradient
 *     fill, larger padding → unambiguously the most important action.
 *   • Secondary CTA "Explore our services" — opens the new ServicesShowcase
 *     modal; shorter, dark-ink outlined, contrasting colour. Sits inline
 *     on desktop (primary wider than secondary) and full-width under the
 *     primary on mobile.
 */
export function Hero({ onGetStarted, onViewServices }: HeroProps) {
  return (
    <section
      id="hero"
      aria-label="Hero"
      className="relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36 lg:pb-28"
    >
      {/* ambience */}
      <div className="bg-grid mask-fade-y pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(75%_100%_at_50%_0%,rgba(201,145,10,0.09),transparent)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-[340px] w-[340px] rounded-full bg-teal/[0.06] blur-[110px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-24 right-1/4 h-[260px] w-[260px] rounded-full bg-gold/[0.07] blur-[100px]" aria-hidden="true" />

      <div className="container-xl relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 xl:gap-16">
          {/* ── Copy column ─────────────────────────────── */}
          <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            {/* metrics pill — technical spec, not marketing */}
            <Reveal delay={0}>
              <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-1.5 shadow-sm">
                <span className="font-mono text-[12px] font-bold text-gold">200+</span>
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  systems delivered
                </span>
              </span>
            </Reveal>

            <Reveal delay={40}>
              <h1 className="display-hero mt-6 font-display text-balance text-foreground">
                We build the digital
                <br className="hidden sm:block" /> systems that help
                <br className="hidden sm:block" /> businesses{" "}
                <AnimatedHeadline phrases={ROTATING_WORDS} />
              </h1>
            </Reveal>

            <Reveal delay={80}>
              <p className="lead-body mx-auto mt-6 max-w-xl text-balance text-muted-foreground lg:mx-0">
                Okomba Analytics designs, engineers and operates web applications, payment
                systems, automation and data solutions — one team from idea to launch and beyond.
              </p>
            </Reveal>

            {/* CTAs — Termii-style: primary full-width + larger on mobile,
                secondary shorter & contrasting; primary wider on desktop. */}
            <Reveal delay={120}>
              <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:justify-start">
                {/* Primary — most important, gold gradient, wider */}
                <button
                  onClick={onGetStarted}
                  className="btn-shine group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-light to-gold px-8 py-4 text-[15.5px] font-bold text-ink shadow-gold-lg transition-all hover:-translate-y-0.5 hover:shadow-gold active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto sm:px-9 sm:py-4"
                >
                  Start a Project
                  <ArrowRight
                    size={17}
                    strokeWidth={2.6}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>
                {/* Secondary — contrasting dark ink outlined, shorter */}
                <button
                  onClick={onViewServices}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-ink/15 bg-ink px-6 py-3.5 text-[14.5px] font-semibold text-white shadow-[0_12px_32px_-14px_rgba(20,25,38,0.5)] transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:text-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto sm:px-7"
                >
                  <LayoutGrid size={16} aria-hidden="true" />
                  Explore our services
                </button>
              </div>
            </Reveal>

            {/* micro-trust line — Termii spec style */}
            <Reveal delay={150}>
              <p className="mt-5 font-mono text-[11px] tracking-wide text-muted-foreground/80">
                Free consultation · Proposal within 24 hours · Nigeria &amp; remote
              </p>
            </Reveal>

            {/* proof strip */}
            <Reveal delay={180}>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 border-t border-black/[0.06] pt-7 sm:flex-row sm:gap-6 lg:justify-start">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-dim font-mono text-[10px] font-bold text-gold">
                    50+
                  </span>
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

          {/* ── Live UI visual column ────────────────────── */}
          <Reveal delay={100} className="mt-2 lg:mt-0">
            <HeroVisual />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
