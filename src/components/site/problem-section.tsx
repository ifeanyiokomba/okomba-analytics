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

   Stage 11 (founder directive): each card now carries its own
   accent palette — gold, teal, coral, royal, plum, jade — so
   the grid feels alive and three-dimensional, not pale. The
   accent flows from the icon, through the top hairline, into
   the index spec chip and the hover state, while the body
   text stays readable.
   ───────────────────────────────────────────────────────────── */

type Problem = {
  icon: LucideIcon;
  title: string;
  desc: string;
  // Per-card accent palette — drives icon bg, top hairline,
  // index chip, hover ring, and the colored shadow.
  accent: {
    name: string;
    text: string;       // icon / accent text color
    bgSoft: string;     // icon-bg soft fill (rgba)
    borderSoft: string; // icon border (rgba)
    hairline: string;  // top hairline gradient stop
    shadowHex: string;  // card colored-shadow hex (used in inline style)
    chipBg: string;     // index chip bg
    chipText: string;   // index chip text
    ringHover: string;  // card border on hover
    glowOnHover: string; // radial glow on hover
  };
};

const PROBLEMS: Problem[] = [
  {
    icon: Unplug,
    title: "Disconnected tools",
    desc: "Sales live in one app, the books in another, customer history in someone's inbox.",
    accent: {
      name: "gold",
      text: "text-gold",
      bgSoft: "bg-gold-dim",
      borderSoft: "border-gold/30",
      hairline: "rgba(201,145,10,0.55)",
      shadowHex: "rgba(201,145,10,0.16)",
      chipBg: "bg-gold-dim",
      chipText: "text-gold",
      ringHover: "hover:border-gold/45",
      glowOnHover: "rgba(201,145,10,0.10)",
    },
  },
  {
    icon: Repeat,
    title: "Manual, repetitive work",
    desc: "Skilled people spending their week on copy-paste a script should own.",
    accent: {
      name: "teal",
      text: "text-teal",
      bgSoft: "bg-teal-dim",
      borderSoft: "border-teal/30",
      hairline: "rgba(10,157,132,0.55)",
      shadowHex: "rgba(10,157,132,0.14)",
      chipBg: "bg-teal-dim",
      chipText: "text-teal",
      ringHover: "hover:border-teal/45",
      glowOnHover: "rgba(10,157,132,0.10)",
    },
  },
  {
    icon: EyeOff,
    title: "Data you can't see",
    desc: "Numbers everywhere, answers nowhere — no single source of truth to act on.",
    accent: {
      name: "coral",
      text: "text-[#E0563A]",
      bgSoft: "bg-[#E0563A]/10",
      borderSoft: "border-[#E0563A]/30",
      hairline: "rgba(224,86,58,0.55)",
      shadowHex: "rgba(224,86,58,0.14)",
      chipBg: "bg-[#E0563A]/10",
      chipText: "text-[#E0563A]",
      ringHover: "hover:border-[#E0563A]/45",
      glowOnHover: "rgba(224,86,58,0.10)",
    },
  },
  {
    icon: Hourglass,
    title: "Expensive, slow development",
    desc: "Every small change needs a quote, a queue and three weeks of waiting.",
    accent: {
      name: "royal",
      text: "text-[#3D4FB8]",
      bgSoft: "bg-[#3D4FB8]/10",
      borderSoft: "border-[#3D4FB8]/30",
      hairline: "rgba(61,79,184,0.55)",
      shadowHex: "rgba(61,79,184,0.14)",
      chipBg: "bg-[#3D4FB8]/10",
      chipText: "text-[#3D4FB8]",
      ringHover: "hover:border-[#3D4FB8]/45",
      glowOnHover: "rgba(61,79,184,0.10)",
    },
  },
  {
    icon: Network,
    title: "Systems that don't talk",
    desc: "Payments, inventory and the website have never been properly introduced.",
    accent: {
      name: "plum",
      text: "text-[#7B3FA0]",
      bgSoft: "bg-[#7B3FA0]/10",
      borderSoft: "border-[#7B3FA0]/30",
      hairline: "rgba(123,63,160,0.55)",
      shadowHex: "rgba(123,63,160,0.14)",
      chipBg: "bg-[#7B3FA0]/10",
      chipText: "text-[#7B3FA0]",
      ringHover: "hover:border-[#7B3FA0]/45",
      glowOnHover: "rgba(123,63,160,0.10)",
    },
  },
  {
    icon: Megaphone,
    title: "A presence that undersells",
    desc: "A website that hides how good the work behind it actually is.",
    accent: {
      name: "jade",
      text: "text-[#1E8C5E]",
      bgSoft: "bg-[#1E8C5E]/10",
      borderSoft: "border-[#1E8C5E]/30",
      hairline: "rgba(30,140,94,0.55)",
      shadowHex: "rgba(30,140,94,0.14)",
      chipBg: "bg-[#1E8C5E]/10",
      chipText: "text-[#1E8C5E]",
      ringHover: "hover:border-[#1E8C5E]/45",
      glowOnHover: "rgba(30,140,94,0.10)",
    },
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
            const a = p.accent;
            return (
              <Reveal key={p.title} delay={i * 80}>
                <article
                  className={cn(
                    "surface-card-light group relative h-full overflow-hidden p-5 md:p-6 transition-all duration-300",
                    "hover:-translate-y-0.5",
                    a.ringHover,
                  )}
                  style={{ boxShadow: `0 14px 40px -22px ${a.shadowHex}` }}
                >
                  {/* Top hairline — colored gradient strip so each card
                      carries its accent identity even before hover. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[3px] block"
                    style={{
                      background: `linear-gradient(90deg, ${a.hairline}, transparent 75%)`,
                    }}
                  />
                  {/* Hover-only radial glow underlay */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(60% 60% at 30% 0%, ${a.glowOnHover}, transparent 70%)`,
                    }}
                  />

                  <div className="relative flex items-start justify-between gap-3">
                    {/* Icon chip — colored bg + colored border + colored icon */}
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300",
                        a.bgSoft,
                        a.borderSoft,
                        a.text,
                      )}
                    >
                      <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    {/* Spec-style index chip — colored to match the card
                        accent, reads like an error code, not decoration. */}
                    <span
                      className={cn(
                        "rounded-md border border-black/[0.05] px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.14em]",
                        a.chipBg,
                        a.chipText,
                      )}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="relative mt-4 text-[15.5px] font-semibold leading-snug text-foreground">
                    {p.title}
                  </h3>
                  <p className="relative mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    {p.desc}
                  </p>

                  {/* Subtle accent underline that animates on hover — gives
                      the card a "pressable" feel without lifting it. */}
                  <div
                    aria-hidden="true"
                    className="relative mt-4 h-px w-full bg-black/[0.04]"
                  >
                    <span
                      className="block h-px w-0 transition-all duration-500 ease-out group-hover:w-full"
                      style={{ background: a.hairline }}
                    />
                  </div>
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
