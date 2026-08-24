"use client";

import Image from "next/image";
import { Compass, Eye, HeartHandshake, ShieldCheck } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

const PILLARS = [
  {
    icon: Compass,
    title: "Mission",
    desc: "To give every ambitious organization — from student to enterprise — access to technology that is practical, secure and genuinely moves their work forward.",
  },
  {
    icon: Eye,
    title: "Vision",
    desc: "A digital Nigeria where great ideas are never held back by technical capability: systems that work, payments that flow, operations that scale.",
  },
  {
    icon: HeartHandshake,
    title: "Philosophy",
    desc: "Technology should serve the business, not the other way around. We build what is needed, we finish what we start, and we stay after launch.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="section-pad relative scroll-mt-20 overflow-hidden" aria-label="About Okomba Analytics">
      <div className="pointer-events-none absolute -left-32 top-1/4 h-[360px] w-[360px] rounded-full bg-gold/[0.05] blur-[120px]" aria-hidden="true" />

      <div className="container-xl relative">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Editorial intro column */}
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <span className="eyebrow inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-gold-dim px-4 py-1.5 text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" aria-hidden="true" />
                About us
              </span>
              <h2 className="mt-6 text-balance font-display text-3xl font-bold leading-[1.12] text-foreground sm:text-4xl">
                A technology company built on <span className="text-gradient-gold">capability</span>, not buzzwords.
              </h2>
              <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
                Okomba Analytics is a professional digital services and technology company. We combine
                engineering, fintech operations, design and digital administration into one disciplined
                practice — serving individuals, startups, SMEs, organizations and institutions.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                What distinguishes us is not a service list — it is the willingness to understand a
                business first, then build the exact system it needs: from a founder&apos;s first web app to a
                foundation&apos;s national registration platform.
              </p>

              {/* capability ticker strip */}
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { k: "Founded on", v: "Real client work" },
                  { k: "Serves", v: "Individuals → enterprises" },
                  { k: "Specialty", v: "End-to-end delivery" },
                  { k: "Support", v: "Beyond launch" },
                ].map((f) => (
                  <div key={f.k} className="rounded-xl border border-black/[0.08] bg-black/[0.02] px-4 py-3.5">
                    <p className="eyebrow text-[9px] text-muted-foreground">{f.k}</p>
                    <p className="mt-1.5 text-[13.5px] font-semibold text-foreground">{f.v}</p>
                  </div>
                ))}
              </div>

              {/* Visual panel with floating badge */}
              <div className="relative mt-8 hidden overflow-hidden rounded-2xl border border-black/[0.08] sm:block">
                <div className="relative h-52 w-full">
                  <Image
                    src="/images/about-visual.png"
                    alt="Okomba Analytics — connected systems visual"
                    fill
                    sizes="(min-width: 1024px) 384px, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" aria-hidden="true" />
                </div>
                <div className="surface-glass absolute bottom-4 left-4 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-float animate-float-med">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-dim text-teal">
                    <ShieldCheck size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-foreground">Systems built to last</p>
                    <p className="text-[10.5px] text-muted-foreground">Security &amp; support included</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Pillars column */}
          <div className="flex flex-col gap-4">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 90}>
                <article className="surface-card group flex h-full gap-5 p-7 md:p-8">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold-dim text-gold transition-transform duration-300 group-hover:scale-110">
                    <p.icon size={22} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">{p.title}</h3>
                    <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">{p.desc}</p>
                  </div>
                </article>
              </Reveal>
            ))}

            {/* Approach statement */}
            <Reveal delay={280}>
              <div className="rounded-2xl border border-teal/20 bg-teal/[0.05] p-7 md:p-8">
                <p className="eyebrow text-[9px] text-teal">Our approach</p>
                <p className="mt-3 text-balance font-display text-[17px] font-medium leading-relaxed text-foreground/95 md:text-[19px]">
                  “Approachable for a student registering for JAMB. Rigorous enough for an institution
                  processing millions in payments. That balance is the craft.”
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
