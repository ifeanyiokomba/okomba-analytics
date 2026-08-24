"use client";

import { useEffect } from "react";
import Image from "next/image";
import { BadgeCheck, CheckCircle2, ExternalLink, X } from "lucide-react";
import type { Project } from "@/lib/content";

type ProjectDialogProps = {
  project: Project | null;
  onClose: () => void;
};

/** Full project reading dialog — overview, what we built, live link. */
export function ProjectDialog({ project, onClose }: ProjectDialogProps) {
  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[#03050a]/70 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Project: ${project.name}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <article className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-black/[0.1] bg-white shadow-float sm:rounded-3xl [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
        {/* Cover visual */}
        <div className="relative h-44 w-full shrink-0 sm:h-52">
          <Image
            src={project.image}
            alt={`${project.name} — ${project.tagline}`}
            fill
            sizes="(min-width: 640px) 672px, 100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" aria-hidden="true" />
          <button
            onClick={onClose}
            aria-label="Close project details"
            className="absolute right-4 top-4 rounded-xl border border-white/30 bg-black/40 p-2.5 text-white backdrop-blur-md transition-colors hover:border-gold/60"
          >
            <X size={17} aria-hidden="true" />
          </button>
          <div className="absolute bottom-4 left-6 right-6">
            <span className="eyebrow rounded-full border border-gold/50 bg-black/50 px-3 py-1 text-[9px] text-[#f0a500] backdrop-blur-md">
              {project.category}
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold text-white drop-shadow">{project.name}</h2>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-7 md:px-8" style={{ display: "grid", gap: "1.15rem" }}>
          <p className="text-[14.5px] font-medium text-gold">{project.tagline}</p>
          <p className="text-[14.5px] leading-[1.75] text-foreground/90">{project.overview}</p>

          <div className="rounded-2xl border border-black/[0.07] bg-[#fafbfd] p-5">
            <p className="eyebrow mb-3 text-[9px] text-gold">What we built</p>
            <ul className="space-y-2.5">
              {project.built.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {project.tags.map((t) => (
                <span key={t} className="rounded-lg border border-black/[0.08] bg-black/[0.03] px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-3 text-[13.5px] font-semibold text-[#141926] shadow-gold transition-transform hover:-translate-y-0.5"
              >
                <ExternalLink size={14} aria-hidden="true" />
                Visit {project.name.replace(" Multipurpose", "")}
              </a>
            )}
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-gold-dim/50 p-4 text-[12.5px] leading-relaxed text-muted-foreground">
            <BadgeCheck size={15} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
            Built and operated by Okomba Analytics.
          </div>
        </div>
      </article>
    </div>
  );
}
