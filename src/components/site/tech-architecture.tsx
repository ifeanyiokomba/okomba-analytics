"use client";

import { Fragment, useSyncExternalStore } from "react";
import {
  Activity,
  Boxes,
  Check,
  Database,
  FileText,
  GitBranch,
  Monitor,
  Server,
  ShieldCheck,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

/* ─────────────────────────────────────────────────────────────
   TechArchitecture — Termii directive #15: not a wall of logos
   but an interactive architecture visualization. Five connected
   layers (Interface → Application → API → Data → Infrastructure)
   joined by animated flow lines, each carrying the real
   technologies we build with. Below: the engineering practices
   every engagement actually runs on. Compact and confident.
   ───────────────────────────────────────────────────────────── */

type Layer = {
  id: string;
  index: string;
  icon: LucideIcon;
  label: string;
  role: string;
  chips: string[];
};

const LAYERS: Layer[] = [
  {
    id: "interface",
    index: "L1",
    icon: Monitor,
    label: "Interface",
    role: "What your users touch",
    chips: ["React", "Next.js", "Tailwind CSS"],
  },
  {
    id: "application",
    index: "L2",
    icon: Boxes,
    label: "Application",
    role: "Where the logic lives",
    chips: ["Node.js", "TypeScript", "Python"],
  },
  {
    id: "api",
    index: "L3",
    icon: Webhook,
    label: "API",
    role: "How systems talk",
    chips: ["REST", "Webhooks", "Integrations"],
  },
  {
    id: "data",
    index: "L4",
    icon: Database,
    label: "Data",
    role: "Where the truth lives",
    chips: ["PostgreSQL", "SQLite", "Prisma"],
  },
  {
    id: "infrastructure",
    index: "L5",
    icon: Server,
    label: "Infrastructure",
    role: "Runs, watched, restored",
    chips: ["Cloud deploys", "Monitoring", "CI"],
  },
];

const PRACTICES: { icon: LucideIcon; label: string }[] = [
  { icon: GitBranch, label: "Version-controlled" },
  { icon: ShieldCheck, label: "Tested before launch" },
  { icon: FileText, label: "Documented handover" },
  { icon: Activity, label: "Monitored post-launch" },
];

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

export function TechArchitecture() {
  const reduced = usePrefersReducedMotion();

  return (
    <section
      id="stack"
      aria-label="Under the hood — technology architecture"
      className="section-dark section-pad relative scroll-mt-20 overflow-hidden bg-background"
    >
      {/* ambience — engineering grid + soft gold glow */}
      <div
        className="bg-grid-on-dark pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(74%_60%_at_50%_36%,black,transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(48%_55%_at_50%_0%,rgba(245,196,81,0.06),transparent)]"
        aria-hidden="true"
      />

      <div className="container-xl relative">
        <SectionHeading
          eyebrow="Under the hood"
          title={
            <>
              A modern stack, <span className="text-gradient-gold">engineered end-to-end.</span>
            </>
          }
          desc="Not a wall of logos — a layered architecture we design, build, connect and run together. You review every layer before launch, and you own all of it after handover."
        />

        {/* ── Layered architecture flow ─────────────────────── */}
        <Reveal delay={80} className="mt-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.5rem_1fr_1.5rem_1fr_1.5rem_1fr_1.5rem_1fr] lg:gap-0">
            {LAYERS.map((layer, i) => {
              const Icon = layer.icon;
              return (
                <Fragment key={layer.id}>
                  <div
                    className={cn(
                      "relative z-10 h-full",
                      i === LAYERS.length - 1 && "sm:col-span-2 lg:col-span-1",
                      !reduced && "animate-float-med"
                    )}
                    style={reduced ? undefined : { animationDelay: `${-i * 1.1}s` }}
                  >
                    <article
                      className="surface-card group relative h-full p-4 md:p-5"
                      aria-label={`${layer.label} layer — ${layer.chips.join(", ")}`}
                    >
                      {/* gold glow on hover */}
                      <span
                        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(130%_90%_at_50%_0%,rgba(245,196,81,0.09),transparent_62%)]"
                        aria-hidden="true"
                      />
                      <div className="relative flex items-start justify-between">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.04] text-gold transition-colors duration-300 group-hover:border-gold/35 group-hover:bg-gold-dim">
                          <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
                        </span>
                        <span
                          className="font-mono text-[9.5px] tracking-[0.18em] text-muted-foreground/40"
                          aria-hidden="true"
                        >
                          {layer.index}
                        </span>
                      </div>
                      <h3 className="relative mt-4 font-display text-[16px] font-bold text-foreground">
                        {layer.label}
                      </h3>
                      <p className="relative mt-1 font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground/65">
                        {layer.role}
                      </p>
                      <div className="relative mt-4 flex flex-wrap gap-1.5">
                        {layer.chips.map((chip) => (
                          <span
                            key={chip}
                            className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 font-mono text-[9.5px] text-foreground/75 transition-colors duration-300 group-hover:border-gold/25 group-hover:text-foreground"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </article>
                  </div>

                  {/* animated connector — tucks under both cards */}
                  {i < LAYERS.length - 1 && (
                    <div className="relative z-0 hidden lg:block" aria-hidden="true">
                      <svg
                        className="absolute -left-3.5 -right-3.5 top-0 h-full w-auto overflow-visible"
                        viewBox="0 0 48 8"
                        preserveAspectRatio="none"
                        fill="none"
                      >
                        <line
                          x1="8"
                          y1="4"
                          x2="31"
                          y2="4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          vectorEffect="non-scaling-stroke"
                          className="animate-flow-dash text-gold/40"
                          style={{ animationDelay: `${-i * 0.35}s` }}
                        />
                        <path
                          d="M31 1.2 L36.5 4 L31 6.8"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                          className="text-gold/55"
                        />
                      </svg>
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        </Reveal>

        {/* proof line — the site itself is the demo */}
        <Reveal delay={100} className="mt-9">
          <p className="flex items-center justify-center gap-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
            <Check size={12} strokeWidth={2.6} className="text-teal" aria-hidden="true" />
            This website runs on the same stack — you&apos;re looking at it.
          </p>
        </Reveal>

        {/* ── Practices strip ────────────────────────────────── */}
        <Reveal delay={150} className="mt-10">
          <p className="text-center font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground/50">
            On every engagement
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {PRACTICES.map((p) => {
              const Icon = p.icon;
              return (
                <span
                  key={p.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.03] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground transition-colors duration-300 hover:border-gold/30 hover:text-foreground"
                >
                  <Icon size={12} strokeWidth={2} className="text-gold/80" aria-hidden="true" />
                  {p.label}
                </span>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
