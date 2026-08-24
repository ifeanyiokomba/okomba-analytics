"use client";

import { DIFFERENTIATORS } from "@/lib/content";
import { SectionHeading } from "./section-heading";
import { ServiceIcon } from "./service-icon";
import { Reveal } from "./reveal";

export function WhySection() {
  return (
    <section id="why" className="section-pad relative scroll-mt-20 overflow-hidden" aria-label="Why Okomba Analytics">
      <div
        className="pointer-events-none absolute inset-0 bg-dots opacity-40 [mask-image:radial-gradient(50%_60%_at_50%_40%,black,transparent)]"
        aria-hidden="true"
      />
      <div className="container-xl relative">
        <SectionHeading
          eyebrow="Why Okomba"
          title={
            <>
              Chosen for <span className="text-gradient-gold">execution</span>, kept for partnership
            </>
          }
          desc="Every claim below maps to something we actually do on engagements — no buzzwords, no borrowed pitches."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DIFFERENTIATORS.map((d, i) => (
            <Reveal key={d.title} delay={i * 70}>
              <article className="surface-card group relative h-full p-6 md:p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-teal/20 bg-teal-dim text-teal transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <ServiceIcon name={d.icon} size={20} />
                </span>
                <h3 className="mt-5 text-[16px] font-semibold text-foreground">{d.title}</h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">{d.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
