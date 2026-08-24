"use client";

import { ArrowRight } from "lucide-react";
import { PROCESS_STEPS } from "@/lib/content";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

type ProcessSectionProps = {
  onGetStarted: () => void;
};

export function ProcessSection({ onGetStarted }: ProcessSectionProps) {
  return (
    <section
      id="process"
      className="section-light scroll-mt-20 border-y border-border bg-background"
      aria-label="Our process"
    >
      <div className="container-xl relative">
        <SectionHeading
          eyebrow="How we work"
          title={
            <>
              A disciplined path from <span className="text-gradient-gold">idea to impact</span>
            </>
          }
          desc="Six phases, each with clear outputs — so you always know where your project stands and what happens next."
        />

        <ol className="relative grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PROCESS_STEPS.map((s, i) => (
            <Reveal as="li" key={s.step} delay={i * 80}>
              <div className="surface-card-light group relative h-full p-6 md:p-7">
                {/* step number */}
                <div className="flex items-center gap-3.5">
                  <span
                    className="font-display text-[2rem] font-bold leading-none text-foreground/20 transition-colors duration-300 group-hover:text-gold/60"
                    aria-hidden="true"
                  >
                    {s.step}
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-gold/50 to-transparent" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-[17px] font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={140} className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="max-w-md text-[14.5px] text-muted-foreground">
            Most projects move from discovery to launch in weeks, not quarters — without cutting
            corners on quality or security.
          </p>
          <button
            onClick={onGetStarted}
            className="btn-shine group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-gold-light to-gold px-7 py-3.5 text-[14.5px] font-semibold text-[#141926] shadow-gold-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Begin with step 01 — Discovery
            <ArrowRight size={16} strokeWidth={2.4} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </button>
        </Reveal>
      </div>
    </section>
  );
}
