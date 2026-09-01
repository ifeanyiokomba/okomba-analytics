"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, SERVICES, type Service } from "@/lib/content";
import { SectionHeading } from "./section-heading";
import { ServiceIcon } from "./service-icon";
import { Reveal } from "./reveal";

type ServicesSectionProps = {
  onRequestService: (service: Service | null) => void;
};

export function ServicesSection({ onRequestService }: ServicesSectionProps) {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(
    () => (active === "All" ? SERVICES : SERVICES.filter((s) => s.category === active)),
    [active]
  );

  return (
    <section id="services" className="section-pad relative isolate overflow-hidden scroll-mt-20" aria-label="Services">
      {/* Ambient color field — gives the glass cards something to refract. */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute right-[6%] top-16 h-[340px] w-[340px] rounded-full bg-teal/[0.10] blur-[120px] animate-aurora-a" />
        <div className="absolute left-[4%] top-1/3 h-[300px] w-[300px] rounded-full bg-gold/[0.12] blur-[120px] animate-aurora-b" />
        <div className="absolute right-1/4 bottom-10 h-[260px] w-[260px] rounded-full bg-teal/[0.08] blur-[110px] animate-aurora-c" />
      </div>
      <div className="container-xl relative">
        <SectionHeading
          eyebrow="What we do"
          title={
            <>
              Productized services, <span className="text-gradient-gold">engineered end-to-end</span>
            </>
          }
          desc="Fourteen service lines across technology, finance, operations, creative and education — each with a clear scope, defined outcomes and a team that has delivered it before."
        />

        {/* Category filter chips */}
        <Reveal delay={100} className="mb-10 flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = active === cat;
            const count = cat === "All" ? SERVICES.length : SERVICES.filter((s) => s.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActive(cat);
                  setExpanded(null);
                }}
                aria-pressed={isActive}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-all",
                  isActive
                    ? "border-gold/50 bg-gold-dim text-gold shadow-gold"
                    : "border-black/[0.08] bg-black/[0.03] text-muted-foreground hover:border-black/20 hover:text-foreground"
                )}
              >
                {cat}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 font-mono text-[9.5px] leading-none",
                    isActive ? "bg-gold/20 text-gold" : "bg-black/[0.06] text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </Reveal>

        {/* Service cards grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((svc, i) => (
              <ServiceCard
                key={svc.id}
                svc={svc}
                index={i}
                expanded={expanded === svc.id}
                onExpand={() => setExpanded(expanded === svc.id ? null : svc.id)}
                onRequest={() => onRequestService(svc)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

type ServiceCardProps = {
  svc: Service;
  index: number;
  expanded: boolean;
  onExpand: () => void;
  onRequest: () => void;
};

function ServiceCard({ svc, index, expanded, onExpand, onRequest }: ServiceCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass-card-premium spotlight group flex flex-col p-6",
        expanded && "border-gold/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold-dim text-gold transition-transform duration-300 group-hover:scale-105">
          <ServiceIcon name={svc.icon} size={22} />
        </span>
        <span className="eyebrow rounded-full border border-black/[0.08] bg-black/[0.03] px-2.5 py-1 text-[9px] text-muted-foreground">
          {svc.category}
        </span>
      </div>

      <h3 className="mt-5 text-[17.5px] font-semibold leading-snug text-foreground">{svc.title}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{svc.desc}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {svc.tags.slice(0, 3).map((t) => (
          <span key={t} className="rounded-md bg-black/[0.05] px-2 py-1 font-mono text-[10px] text-muted-foreground">
            {t}
          </span>
        ))}
      </div>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-5 space-y-4 rounded-xl border border-black/[0.07] bg-[#fafbfd] p-4">
              <div>
                <p className="eyebrow mb-2.5 text-[9px] text-gold">Capabilities</p>
                <ul className="grid gap-1.5">
                  {svc.subs.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-[12.5px] text-muted-foreground">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-teal" aria-hidden="true" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="eyebrow mb-2.5 text-[9px] text-gold">Benefits</p>
                  <ul className="space-y-1.5">
                    {svc.benefits.map((b) => (
                      <li key={b} className="text-[12.5px] text-muted-foreground">
                        <span className="text-teal">✓</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="eyebrow mb-2.5 text-[9px] text-gold">Ideal for</p>
                  <div className="flex flex-wrap gap-1.5">
                    {svc.idealFor.map((t) => (
                      <span key={t} className="rounded-md bg-black/[0.05] px-2 py-1 text-[11px] text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card actions */}
      <div className="mt-auto flex items-center gap-2 pt-5">
        <button
          onClick={onRequest}
          className="btn-shine inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-gold-light to-gold px-4 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
        >
          Request <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
        </button>
        <button
          onClick={onExpand}
          aria-expanded={expanded}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.09] bg-black/[0.03] text-muted-foreground transition-colors hover:border-gold/35 hover:text-gold"
          aria-label={expanded ? `Hide ${svc.title} details` : `View ${svc.title} details`}
        >
          <ChevronDown size={16} className={cn("transition-transform duration-300", expanded && "rotate-180")} aria-hidden="true" />
        </button>
      </div>
    </motion.article>
  );
}
