"use client";

import {
  ArrowDown,
  EyeOff,
  Hourglass,
  Megaphone,
  Network,
  Repeat,
  Unplug,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

/* ─────────────────────────────────────────────────────────────
   ProblemSection — problem-first storytelling (Termii directive
   #8): before any service is pitched, name the struggle the
   reader lives with every week. Six sharp cards, then the
   emotional pivot into the solution ("we bring it together").
   ───────────────────────────────────────────────────────────── */

type Problem = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

const PROBLEMS: Problem[] = [
  {
    icon: Unplug,
    title: "Disconnected tools",
    desc: "Sales live in one app, the books in another, customer history in someone's inbox.",
  },
  {
    icon: Repeat,
    title: "Manual, repetitive work",
    desc: "Skilled people spending their week on copy-paste a script should own.",
  },
  {
    icon: EyeOff,
    title: "Data you can't see",
    desc: "Numbers everywhere, answers nowhere — no single source of truth to act on.",
  },
  {
    icon: Hourglass,
    title: "Expensive, slow development",
    desc: "Every small change needs a quote, a queue and three weeks of waiting.",
  },
  {
    icon: Network,
    title: "Systems that don't talk",
    desc: "Payments, inventory and the website have never been properly introduced.",
  },
  {
    icon: Megaphone,
    title: "A presence that undersells",
    desc: "A website that hides how good the work behind it actually is.",
  },
];

export function ProblemSection() {
  return (
    <section
      id="why-the-struggle"
      aria-label="The daily struggle of running on disconnected tools"
      className="section-light section-pad relative scroll-mt-20 overflow-hidden bg-background"
    >
      {/* ambience — warm radial + faint dot texture (paper feel) */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_42%_at_50%_0%,rgba(201,145,10,0.07),transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-dots opacity-30 [mask-image:radial-gradient(46%_38%_at_50%_34%,black,transparent)]"
        aria-hidden="true"
      />

      <div className="container-xl relative">
        <SectionHeading
          eyebrow="Sound familiar?"
          title={
            <>
              Running a business on disconnected tools is{" "}
              <span className="text-gradient-gold">exhausting.</span>
            </>
          }
          desc="Before we talk about what we build — this is what we hear in almost every first conversation. If two or three of these sound like your week, you are exactly who we work with."
        />

        {/* ── The six struggles ─────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEMS.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.title} delay={i * 80}>
                <article className="surface-card-light group h-full p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/[0.07] bg-black/[0.03] text-foreground/70 transition-colors duration-300 group-hover:border-gold/30 group-hover:bg-gold-dim group-hover:text-gold">
                      <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    {/* spec-style index — reads like an error code, not decoration */}
                    <span
                      className="font-mono text-[10px] font-medium tracking-[0.14em] text-muted-foreground/45"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[15.5px] font-semibold leading-snug text-foreground">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    {p.desc}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* ── The pivot: consequence → solution ─────────────── */}
        <Reveal delay={140} className="mt-16 md:mt-24">
          <div className="relative mx-auto max-w-3xl text-center">
            {/* soft gold glow behind the statement */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[min(520px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.08] blur-[100px]"
              aria-hidden="true"
            />

            <span
              className="shimmer-line mx-auto block h-px w-44"
              aria-hidden="true"
            />

            <p className="eyebrow mt-8 text-gold">The fix</p>

            <p className="mt-4 font-display text-balance text-[clamp(2rem,4.6vw,3.3rem)] font-bold leading-[1.07] tracking-[-0.032em] text-foreground">
              We build the systems that{" "}
              <span className="text-gradient-gold">bring everything together.</span>
            </p>

            <p className="mx-auto mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-muted-foreground md:text-base">
              One team, from first sketch to post-launch support — so the tools
              finally work for the business, instead of the other way around.
            </p>

            <a
              href="#services"
              className={cn(
                "group mt-7 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white px-5 py-2.5",
                "font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gold shadow-gold",
                "transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-gold-lg",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              )}
            >
              Explore the ecosystem
              <ArrowDown
                size={13}
                strokeWidth={2.4}
                className="transition-transform duration-300 group-hover:translate-y-0.5"
                aria-hidden="true"
              />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
