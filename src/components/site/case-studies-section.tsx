"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, ExternalLink, Quote } from "lucide-react";
import { PROJECTS, type Project } from "@/lib/content";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { ProjectDialog } from "./project-dialog";

/**
 * Featured work — real projects Okomba Analytics has built and runs:
 * Votewise, Turbopay, BillSwift, Sanctum, TrustScore, Omniscore CPaaS.
 */
export function CaseStudiesSection() {
  const [openProject, setOpenProject] = useState<Project | null>(null);

  return (
    <section id="work" className="relative scroll-mt-20 section-pad" aria-label="Featured work">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[700px] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-[110px]"
        aria-hidden="true"
      />

      <div className="container-xl relative">
        <SectionHeading
          eyebrow="Featured work"
          title={
            <>
              Real products, <span className="text-gradient-gold">live &amp; in production</span>
            </>
          }
          desc="Not mockups — platforms we've engineered, launched and operate every day."
        />

        {/* Projects grid: first two featured large, rest standard */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i * 70, 350)} className={i < 2 ? "md:col-span-1 lg:col-span-1" : ""}>
              <article className="surface-card group relative h-full overflow-hidden">
                {/* Visual banner */}
                <button
                  onClick={() => setOpenProject(p)}
                  className="block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-gold"
                  aria-label={`View ${p.name} project details`}
                >
                  <div className="relative h-44 w-full overflow-hidden sm:h-48">
                    <Image
                      src={p.image}
                      alt={`${p.name} — ${p.tagline}`}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b101c] via-[#0b101c]/20 to-transparent" aria-hidden="true" />
                    {/* name badge over image */}
                    <span className="absolute bottom-3.5 left-5 flex items-center gap-2 rounded-full border border-gold/40 bg-[#05070d]/75 px-3.5 py-1.5 backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" aria-hidden="true" />
                      <span className="eyebrow text-[9px] text-gold">{p.category}</span>
                    </span>
                    {p.link && (
                      <span
                        className="absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#141926] shadow-sm"
                        aria-hidden="true"
                      >
                        <ExternalLink size={10} /> Live
                      </span>
                    )}
                  </div>
                </button>

                {/* Body */}
                <div className="p-6">
                  <button onClick={() => setOpenProject(p)} className="text-left focus-visible:outline-2 focus-visible:outline-gold">
                    <h3 className="font-display text-[19px] font-bold text-foreground transition-colors group-hover:text-gold">
                      {p.name}
                    </h3>
                  </button>
                  <p className="mt-0.5 text-[12.5px] font-medium text-gold">{p.tagline}</p>
                  <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{p.overview}</p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded-md bg-black/[0.05] px-2 py-1 font-mono text-[10px] text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-black/[0.07] pt-4">
                    <button
                      onClick={() => setOpenProject(p)}
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground transition-colors hover:text-gold"
                    >
                      View project
                      <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                    </button>
                    {p.link && (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.1] bg-black/[0.03] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-gold/50 hover:text-gold"
                      >
                        <ExternalLink size={11} aria-hidden="true" />
                        Visit site
                      </a>
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Pull-quote strip (real testimonial) */}
        <Reveal delay={120}>
          <figure className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-gold/25 bg-gold-dim/40 px-8 py-9 text-center md:px-14">
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

      <ProjectDialog project={openProject} onClose={() => setOpenProject(null)} />
    </section>
  );
}
