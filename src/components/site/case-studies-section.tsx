"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, ExternalLink, Quote } from "lucide-react";
import { PROJECTS, type Project } from "@/lib/content";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { ProjectDialog } from "./project-dialog";

/**
 * Featured work — real products Okomba Analytics has built and runs:
 * Votewise, Turbopay, BillSwift, Sanctum, TrustScore, Omniscore CPaaS.
 *
 * Directive #12: every project is framed as Problem → Approach → Result,
 * with the stated outcome highlighted in gold. Honest reframings of the
 * existing project data — no invented metrics.
 */

/* P/A/R reframing per project (derived from content.ts overview + built) */
const CASE_NARRATIVE: Record<Project["id"], { problem: string; approach: string; result: string }> = {
  "p-votewise": {
    problem: "Paper ballots, slow counts, disputed results.",
    approach: "Secure digital voting engine with a live results console and full audit trail.",
    result: "Elections people trust — live, transparent, in production today.",
  },
  "p-turbopay": {
    problem: "Collections and transfers too slow for a digital-first economy.",
    approach: "Payments platform for fast collections, transfers and business processing — merchant-ready APIs.",
    result: "Payments at turbo speed, live at turbopay.okomba.com.",
  },
  "p-billswift": {
    problem: "Bills scattered across channels, no clean records.",
    approach: "One flow for airtime, data and utilities with instant confirmation.",
    result: "Bills paid in seconds — every transaction confirmed and recorded.",
  },
  "p-trustscore": {
    problem: "Businesses can't quickly tell who they're dealing with.",
    approach: "Identity verification engine with trust scoring and fraud-aware checks.",
    result: "Customers validated fast, with confidence behind every check.",
  },
  "p-omniscore": {
    problem: "Messaging spread across separate SMS, voice and WhatsApp vendors.",
    approach: "One CPaaS platform unifying bulk SMS, voice, WhatsApp, Telegram and OTP.",
    result: "Every channel behind a single integration.",
  },
  "p-sanctum": {
    problem: "Disconnected tools for every operational need.",
    approach: "Modular platform capabilities that adapt to varied operations.",
    result: "One platform, many purposes — organization-ready tooling.",
  },
};

function ProblemApproachResult({ projectId }: { projectId: Project["id"] }) {
  const n = CASE_NARRATIVE[projectId];
  return (
    <dl className="mt-5 space-y-2.5 border-t border-black/[0.06] pt-4">
      <div className="flex gap-3">
        <dt className="w-[76px] shrink-0 pt-px font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
          Problem
        </dt>
        <dd className="text-[12.5px] leading-snug text-muted-foreground">{n.problem}</dd>
      </div>
      <div className="flex gap-3">
        <dt className="w-[76px] shrink-0 pt-px font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
          Approach
        </dt>
        <dd className="text-[12.5px] leading-snug text-muted-foreground">{n.approach}</dd>
      </div>
      <div className="-ml-2.5 flex gap-3 rounded-lg bg-gold-dim/70 px-2.5 py-2">
        <dt className="w-[76px] shrink-0 pt-px font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-gold">
          Result
        </dt>
        <dd className="text-[12.5px] font-medium leading-snug text-[#8a5e00]">{n.result}</dd>
      </div>
    </dl>
  );
}

export function CaseStudiesSection() {
  const [openProject, setOpenProject] = useState<Project | null>(null);

  const featured = PROJECTS.slice(0, 2);
  const rest = PROJECTS.slice(2);

  return (
    <section id="work" className="relative scroll-mt-20 section-pad" aria-label="Selected work">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[700px] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-[110px]"
        aria-hidden="true"
      />

      <div className="container-xl relative">
        <SectionHeading
          eyebrow="Selected work"
          title={
            <>
              Built for <span className="text-gradient-gold">real problems.</span>
            </>
          }
          desc="Every project below started as a problem someone needed gone. The problem, our approach, the result — nothing else."
        />

        {/* ── Featured: alternating full-width rows, visuals dominate ── */}
        <div className="space-y-4 md:space-y-6">
          {featured.map((p, i) => (
            <Reveal key={p.id}>
              <article className="surface-card group relative overflow-hidden">
                <div className="lg:grid lg:grid-cols-[1.12fr_1fr]">
                  {/* Visual banner */}
                  <button
                    onClick={() => setOpenProject(p)}
                    className={cn(
                      "relative block h-56 w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-gold sm:h-64 lg:h-auto lg:min-h-[380px]",
                      i % 2 === 1 && "lg:order-2"
                    )}
                    aria-label={`View ${p.name} project details`}
                  >
                    <Image
                      src={p.image}
                      alt={`${p.name} — ${p.tagline}`}
                      fill
                      sizes="(min-width: 1024px) 55vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b101c] via-[#0b101c]/20 to-transparent" aria-hidden="true" />
                    {/* name badge over image */}
                    <span className="absolute bottom-4 left-5 flex items-center gap-2 rounded-full border border-gold/40 bg-[#05070d]/75 px-3.5 py-1.5 backdrop-blur-md">
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
                  </button>

                  {/* Body */}
                  <div className={cn("flex flex-col p-6 md:p-8 lg:p-9", i % 2 === 1 && "lg:order-1")}>
                    <button onClick={() => setOpenProject(p)} className="text-left focus-visible:outline-2 focus-visible:outline-gold">
                      <h3 className="font-display text-[22px] font-bold text-foreground transition-colors group-hover:text-gold md:text-[24px]">
                        {p.name}
                      </h3>
                    </button>
                    <p className="mt-0.5 text-[12.5px] font-medium text-gold">{p.tagline}</p>

                    <ProblemApproachResult projectId={p.id} />

                    <div className="mb-6 mt-5 flex flex-wrap gap-1.5">
                      {p.tags.map((t) => (
                        <span key={t} className="rounded-md bg-black/[0.05] px-2 py-1 font-mono text-[10px] text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-black/[0.07] pt-4">
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
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* ── The rest: standard cards with the same P→A→R framing ── */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:mt-6 md:grid-cols-2">
          {rest.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i * 70, 210)}>
              <article className="surface-card group relative flex h-full flex-col overflow-hidden">
                {/* Visual banner */}
                <button
                  onClick={() => setOpenProject(p)}
                  className="relative block h-44 w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-gold sm:h-48 md:h-52"
                  aria-label={`View ${p.name} project details`}
                >
                  <Image
                    src={p.image}
                    alt={`${p.name} — ${p.tagline}`}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b101c] via-[#0b101c]/20 to-transparent" aria-hidden="true" />
                  {/* name badge over image */}
                  <span className="absolute bottom-3.5 left-5 flex items-center gap-2 rounded-full border border-gold/40 bg-[#05070d]/75 px-3.5 py-1.5 backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" aria-hidden="true" />
                    <span className="eyebrow text-[9px] text-gold">{p.category}</span>
                  </span>
                </button>

                {/* Body */}
                <div className="flex flex-1 flex-col p-6">
                  <button onClick={() => setOpenProject(p)} className="text-left focus-visible:outline-2 focus-visible:outline-gold">
                    <h3 className="font-display text-[19px] font-bold text-foreground transition-colors group-hover:text-gold">
                      {p.name}
                    </h3>
                  </button>
                  <p className="mt-0.5 text-[12.5px] font-medium text-gold">{p.tagline}</p>

                  <ProblemApproachResult projectId={p.id} />

                  <div className="mb-6 mt-5 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded-md bg-black/[0.05] px-2 py-1 font-mono text-[10px] text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-black/[0.07] pt-4">
                    <button
                      onClick={() => setOpenProject(p)}
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground transition-colors hover:text-gold"
                    >
                      View project
                      <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                    </button>
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
