"use client";

import { useEffect } from "react";
import { BadgeCheck, CalendarClock, Quote, Users2, X } from "lucide-react";
import { CASE_STUDIES, CASE_STUDY_DETAILS, type CaseStudy } from "@/lib/content";
import { ServiceIcon } from "./service-icon";

type CaseStudyDialogProps = {
  caseStudy: CaseStudy | null;
  onClose: () => void;
};

/** Full case-study reading dialog — richer story layout with detail data. */
export function CaseStudyDialog({ caseStudy, onClose }: CaseStudyDialogProps) {
  useEffect(() => {
    if (!caseStudy) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [caseStudy, onClose]);

  if (!caseStudy) return null;

  const detail = CASE_STUDY_DETAILS[caseStudy.id];

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Case study: ${caseStudy.client}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <article className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.08] bg-[#0b101c] shadow-float sm:rounded-3xl [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
        {/* Header */}
        <header className="relative border-b border-white/[0.06] p-6 md:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gold/[0.09] blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="eyebrow rounded-full border border-gold/25 bg-gold-dim px-3 py-1 text-[9px] text-gold">
                  {caseStudy.industry}
                </span>
                {detail && (
                  <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground">
                    <CalendarClock size={11} aria-hidden="true" /> {detail.timeline}
                  </span>
                )}
              </div>
              <h2 className="mt-3.5 font-display text-2xl font-bold text-foreground">{caseStudy.client}</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close case study"
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-7 md:px-8 md:py-8">
          {detail && <p className="text-[14.5px] leading-[1.75] text-foreground/90">{detail.summary}</p>}

          {/* Challenge / Solution / Outcome */}
          <div className="mt-7 space-y-5">
            {[
              { label: "Challenge", text: caseStudy.challenge, color: "text-gold" },
              { label: "Solution", text: caseStudy.solution, color: "text-gold" },
              { label: "Outcome", text: caseStudy.outcome, color: "text-teal" },
            ].map((row) => (
              <div key={row.label} className="flex gap-4">
                <span className={`eyebrow mt-1 shrink-0 text-[9px] ${row.color}`}>{row.label}</span>
                <p className="text-[14px] leading-relaxed text-muted-foreground">{row.text}</p>
              </div>
            ))}
          </div>

          {/* Highlights */}
          {detail && (
            <div className="mt-7 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <p className="eyebrow mb-3 text-[9px] text-gold">Engagement highlights</p>
              <ul className="space-y-2.5">
                {detail.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                    <BadgeCheck size={15} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-4 font-mono text-[10.5px] text-muted-foreground">
                <Users2 size={12} aria-hidden="true" /> {detail.teamSize}
              </p>
            </div>
          )}

          {/* Metrics grid */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {caseStudy.metrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5 text-center">
                <p className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">{m.label}</p>
                <p className="mt-1.5 font-display text-[15.5px] font-bold text-gold">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Stack chips */}
          <div className="mt-6 flex flex-wrap gap-2">
            {caseStudy.stack.map((t) => (
              <span key={t} className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                {t}
              </span>
            ))}
          </div>

          {/* Client quote (from testimonials) */}
          <figure className="mt-7 flex flex-col gap-3 rounded-2xl bg-gold-dim/40 p-5">
            <Quote size={18} className="text-gold" aria-hidden="true" />
            <blockquote className="text-[13.5px] leading-relaxed text-foreground/90">{caseStudy.outcome}</blockquote>
            <figcaption className="font-mono text-[10px] text-muted-foreground">— {caseStudy.client} engagement</figcaption>
          </figure>
        </div>
      </article>
    </div>
  );
}
