"use client";

import { BadgeCheck, Quote } from "lucide-react";
import { CASE_STUDIES } from "@/lib/content";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

export function CaseStudiesSection() {
  return (
    <section id="work" className="section-pad relative scroll-mt-20" aria-label="Featured work">
      <div className="pointer-events-none absolute left-0 top-1/3 h-[320px] w-[320px] rounded-full bg-[#5b9eff]/[0.05] blur-[110px]" aria-hidden="true" />

      <div className="container-xl relative">
        <SectionHeading
          eyebrow="Featured work"
          title={
            <>
              Projects told as <span className="text-gradient-gold">structured stories</span>
            </>
          }
          desc="Not thumbnails — real engagements with a challenge, a solution and an outcome you can interrogate."
        />

        <div className="flex flex-col gap-6 md:gap-8">
          {CASE_STUDIES.map((cs, i) => (
            <Reveal key={cs.id} delay={i * 80}>
              <article className="surface-card group relative overflow-hidden">
                {/* index watermark */}
                <span
                  className="pointer-events-none absolute -top-7 right-4 select-none font-display text-[7rem] font-bold leading-none text-white/[0.025] md:text-[9rem]"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="grid grid-cols-1 gap-8 p-7 md:grid-cols-[1.25fr_0.75fr] md:gap-10 md:p-10">
                  {/* Story column */}
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-[22px] font-bold text-foreground md:text-2xl">{cs.client}</h3>
                      <span className="eyebrow rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1 text-[9px] text-muted-foreground">
                        {cs.industry}
                      </span>
                    </div>

                    <div className="mt-6 space-y-5">
                      <div className="flex gap-4">
                        <span className="eyebrow mt-1 shrink-0 text-[9px] text-gold">Challenge</span>
                        <p className="text-[14px] leading-relaxed text-muted-foreground">{cs.challenge}</p>
                      </div>
                      <div className="flex gap-4">
                        <span className="eyebrow mt-1 shrink-0 text-[9px] text-gold">Solution</span>
                        <p className="text-[14px] leading-relaxed text-muted-foreground">{cs.solution}</p>
                      </div>
                      <div className="flex gap-4">
                        <span className="eyebrow mt-1 shrink-0 text-[9px] text-teal">Outcome</span>
                        <p className="text-[14px] leading-relaxed text-foreground/90">{cs.outcome}</p>
                      </div>
                    </div>

                    {/* stack chips */}
                    <div className="mt-7 flex flex-wrap gap-2">
                      {cs.stack.map((t) => (
                        <span
                          key={t}
                          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Metrics column */}
                  <div className="flex flex-col gap-3.5 md:border-l md:border-white/[0.06] md:pl-8">
                    {cs.metrics.map((m) => (
                      <div key={m.label} className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
                        <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">{m.label}</span>
                        <span className="font-display text-[15px] font-bold text-gold">{m.value}</span>
                      </div>
                    ))}
                    <div className="mt-auto flex items-start gap-2.5 rounded-xl bg-teal/[0.06] p-4 text-[12.5px] leading-relaxed text-teal/90">
                      <BadgeCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                      Verified engagement — outcome reported by the client.
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Pull-quote strip */}
        <Reveal delay={120}>
          <figure className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-gold/15 bg-gold-dim/30 px-8 py-9 text-center md:px-14">
            <Quote size={22} className="text-gold" aria-hidden="true" />
            <blockquote className="max-w-2xl text-balance font-display text-lg font-medium leading-relaxed text-foreground/95 md:text-[22px]">
              “OKOMBA ANALYTICS transformed our digital operations completely. The web app they
              built for us exceeded every expectation — professional, fast, and beautifully designed.”
            </blockquote>
            <figcaption className="text-[13px] text-muted-foreground">
              Chukwuemeka Obi · Founder, TechStartNG
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
