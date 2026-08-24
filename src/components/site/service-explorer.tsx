"use client";

import {
  Fragment,
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Database,
  FileCheck2,
  FileSpreadsheet,
  LineChart,
  Lock,
  Mail,
  Network,
  RotateCw,
  ShieldCheck,
  UserRound,
  Webhook,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICES, type Service } from "@/lib/content";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

/* ─────────────────────────────────────────────────────────────
   ServiceExplorer — Termii directive #9/#10: services become
   experiences. Four pillars (BUILD / DATA / AUTOMATE / CONNECT)
   drive a live product-UI stage. Desktop: vertical tab rail +
   large panel. Mobile: single-open accordion. Every panel ends
   in real SERVICES chips + a gold "Request this service" CTA.
   ───────────────────────────────────────────────────────────── */

type ServiceExplorerProps = {
  onRequestService: (service: { title: string } | null) => void;
};

type Pillar = {
  id: string;
  label: string;
  value: string;
  desc: string;
  serviceIds: string[];
  flagship: string;
};

const PILLARS: Pillar[] = [
  {
    id: "build",
    label: "Build",
    value: "From idea to production-ready product.",
    desc: "Web, mobile and full-stack engineering — plus the design and media that make it sell.",
    serviceIds: ["web-dev", "graphic", "video"],
    flagship: "web-dev",
  },
  {
    id: "data",
    label: "Data",
    value: "Turn your data into decisions.",
    desc: "Research, reporting and dashboards that end the guesswork.",
    serviceIds: ["research", "healthcare", "consulting"],
    flagship: "research",
  },
  {
    id: "automate",
    label: "Automate",
    value: "Make repetitive work disappear.",
    desc: "Digital operations, applications and lead workflows running on rails.",
    serviceIds: ["digital-ops", "events", "education", "client-acq"],
    flagship: "digital-ops",
  },
  {
    id: "connect",
    label: "Connect",
    value: "Make your systems work together.",
    desc: "Payment rails, APIs and comms — with the support that keeps them talking.",
    serviceIds: ["fintech", "payment-int", "tech-support", "training"],
    flagship: "payment-int",
  },
];

const serviceById = new Map(SERVICES.map((s) => [s.id, s]));

function servicesOf(pillar: Pillar): Service[] {
  return pillar.serviceIds
    .map((id) => serviceById.get(id))
    .filter((s): s is Service => Boolean(s));
}

/**
 * Stagger delays are applied via INLINE animation-delay (class-based
 * [animation-delay:*] utilities lose to the unlayered .animate-*
 * shorthands in globals.css) and collapse to 0 under
 * prefers-reduced-motion so every panel settles instantly.
 */
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

/** ms → resolved animation-delay string (0ms under reduced motion). */
function useStagger(): (ms: number) => string {
  const reduced = usePrefersReducedMotion();
  return (ms: number) => `${reduced ? 0 : ms}ms`;
}

export function ServiceExplorer({ onRequestService }: ServiceExplorerProps) {
  const [active, setActive] = useState(0); // desktop tab / stage
  const [open, setOpen] = useState<number | null>(0); // mobile accordion
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const pillar = PILLARS[active];
  const services = servicesOf(pillar);
  const flagship = serviceById.get(pillar.flagship) ?? services[0] ?? null;

  const moveTab = useCallback((dir: 1 | -1) => {
    setActive((prev) => {
      const next = (prev + dir + PILLARS.length) % PILLARS.length;
      tabRefs.current[next]?.focus();
      return next;
    });
  }, []);

  const onTablistKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      moveTab(1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      moveTab(-1);
    }
  };

  return (
    <section
      id="services"
      aria-label="Services — interactive explorer"
      className="section-light section-pad relative scroll-mt-20 overflow-hidden bg-background"
    >
      {/* ambience */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(58%_40%_at_50%_0%,rgba(201,145,10,0.06),transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full bg-teal/[0.05] blur-[120px]"
        aria-hidden="true"
      />

      <div className="container-xl relative">
        <SectionHeading
          eyebrow="The ecosystem"
          title={
            <>
              One team. <span className="text-gradient-gold">Four ways</span> we
              build your system.
            </>
          }
          desc="Everything we ship pulls from the same engineering bench — design, code, data and infrastructure. Select a pillar to see what working with it actually looks like."
        />

        <div className="lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-8 xl:gap-12">
          {/* ── Desktop: vertical pillar tab rail ─────────────── */}
          <div
            role="tablist"
            aria-label="Service pillars"
            aria-orientation="vertical"
            onKeyDown={onTablistKeyDown}
            className="hidden flex-col gap-3 lg:flex"
          >
            {PILLARS.map((p, i) => {
              const isActive = i === active;
              return (
                <button
                  key={p.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  role="tab"
                  id={`pillar-tab-${p.id}`}
                  aria-selected={isActive}
                  aria-controls="explorer-stage"
                  tabIndex={isActive ? 0 : -1}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className={cn(
                    "group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                    isActive
                      ? "border-gold/35 bg-gold-dim shadow-gold"
                      : "border-black/[0.08] bg-white hover:border-gold/30 hover:bg-gold-dim/50"
                  )}
                >
                  {/* gold left-edge indicator */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-y-4 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-gold-light to-gold transition-opacity duration-300",
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                    )}
                  />
                  <div className="flex items-center justify-between gap-3 pl-2.5">
                    <span className="flex items-baseline gap-2.5">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "font-mono text-[10px] font-semibold tracking-[0.18em] transition-colors",
                          isActive ? "text-gold" : "text-muted-foreground/50"
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display text-[clamp(1.4rem,1.9vw,1.65rem)] font-bold uppercase leading-none tracking-[-0.02em] text-foreground">
                        {p.label}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full border border-black/[0.08] bg-black/[0.03] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      {p.serviceIds.length} services
                    </span>
                  </div>
                  <p className="mt-2.5 pl-2.5 text-[13.5px] font-medium leading-snug text-foreground/80">
                    {p.value}
                  </p>
                </button>
              );
            })}
          </div>

          {/* ── Desktop: stage panel ──────────────────────────── */}
          <div
            id="explorer-stage"
            role="tabpanel"
            aria-labelledby={`pillar-tab-${pillar.id}`}
            className="hidden lg:block"
          >
            <div key={pillar.id} className="animate-panel-in">
              <PillarStage
                pillar={pillar}
                index={active}
                services={services}
                onRequestService={onRequestService}
                flagship={flagship}
              />
            </div>
          </div>

          {/* ── Mobile: single-open accordion ─────────────────── */}
          <Reveal delay={80} className="lg:hidden">
            <p className="mb-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
              <ChevronDown size={12} aria-hidden="true" />
              Tap a pillar to expand
            </p>
            <div className="flex flex-col gap-3">
              {PILLARS.map((p, i) => {
                const isOpen = open === i;
                const pServices = servicesOf(p);
                return (
                  <div key={p.id} className="surface-card-light overflow-hidden">
                    <button
                      id={`pillar-header-${p.id}`}
                      aria-expanded={isOpen}
                      aria-controls={`pillar-panel-${p.id}`}
                      onClick={() => {
                        setOpen(isOpen ? null : i);
                        setActive(i);
                      }}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={cn(
                            "font-mono text-[10px] font-semibold tracking-[0.18em]",
                            isOpen ? "text-gold" : "text-muted-foreground/50"
                          )}
                          aria-hidden="true"
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-display text-[22px] font-bold uppercase leading-none tracking-[-0.02em] text-foreground">
                          {p.label}
                        </span>
                        <span className="rounded-full border border-black/[0.08] bg-black/[0.03] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          {p.serviceIds.length}
                        </span>
                      </span>
                      <ChevronDown
                        size={18}
                        aria-hidden="true"
                        className={cn(
                          "shrink-0 transition-transform duration-300",
                          isOpen ? "rotate-180 text-gold" : "text-muted-foreground"
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div
                        id={`pillar-panel-${p.id}`}
                        role="region"
                        aria-labelledby={`pillar-header-${p.id}`}
                        className="animate-panel-in border-t border-black/[0.06] p-4"
                      >
                        <PillarStage
                          pillar={p}
                          index={i}
                          services={pServices}
                          onRequestService={onRequestService}
                          flagship={serviceById.get(p.flagship) ?? pServices[0] ?? null}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Shared stage (desktop panel / mobile accordion body) ──── */

type PillarStageProps = {
  pillar: Pillar;
  index: number;
  services: Service[];
  flagship: Service | null;
  onRequestService: (service: { title: string } | null) => void;
};

function PillarStage({ pillar, index, services, flagship, onRequestService }: PillarStageProps) {
  return (
    <div className="surface-card shadow-float p-4 md:p-6">
      {/* panel header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
            Pillar {String(index + 1).padStart(2, "0")} · {pillar.label}
          </p>
          <p className="mt-1.5 font-display text-[18px] font-bold leading-tight tracking-[-0.02em] text-foreground md:text-[20px]">
            {pillar.value}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{pillar.desc}</p>
        </div>
        <span className="shrink-0 rounded-full border border-black/[0.08] bg-black/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          {services.length} services
        </span>
      </div>

      {/* the product visual */}
      <div className="mt-5">
        {pillar.id === "build" && <BuildVisual />}
        {pillar.id === "data" && <DataVisual />}
        {pillar.id === "automate" && <AutomateVisual />}
        {pillar.id === "connect" && <ConnectVisual />}
      </div>

      {/* real service chips */}
      <div className="mt-7">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
          Included services
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => onRequestService(s)}
              aria-label={`Request ${s.title}`}
              className="rounded-lg border border-black/[0.08] bg-black/[0.03] px-2.5 py-1.5 text-[11.5px] font-medium text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:bg-gold-dim hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* request row */}
      <div className="mt-6 flex flex-col gap-3 border-t border-black/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground/80">
          Proposal within 24h · Fixed-scope quotes · Nigeria &amp; remote
        </p>
        <button
          onClick={() => onRequestService(flagship)}
          className="btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-3 text-[13.5px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Request this service
          <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ── BUILD: browser-window mockup, wireframe assembling ────── */

function BuildVisual() {
  const stagger = useStagger();
  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.08] bg-[#fafbfd]">
      {/* browser chrome */}
      <div className="flex items-center gap-3 border-b border-black/[0.07] bg-white px-3.5 py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-black/[0.12]" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/[0.12]" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/[0.12]" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-black/[0.04] px-2.5 py-1">
          <Lock size={9} className="shrink-0 text-teal" aria-hidden="true" />
          <span className="truncate font-mono text-[10px] text-muted-foreground">yourproduct.com</span>
        </div>
        <RotateCw size={11} className="shrink-0 text-muted-foreground/50" aria-hidden="true" />
      </div>

      {/* wireframe body — blocks assemble with staggered panel-in */}
      <div className="space-y-5 p-4 md:p-6">
        {/* nav */}
        <div
          className="animate-panel-in flex items-center justify-between gap-3"
          style={{ animationDelay: stagger(120) }}
        >
          <div className="h-3 w-16 rounded-full bg-ink" aria-hidden="true" />
          <div className="flex items-center gap-2.5" aria-hidden="true">
            <span className="hidden h-2 w-9 rounded-full bg-black/[0.12] sm:block" />
            <span className="hidden h-2 w-9 rounded-full bg-black/[0.12] sm:block" />
            <span className="h-2 w-9 rounded-full bg-black/[0.12]" />
            <span className="h-7 w-16 rounded-lg bg-ink" />
          </div>
        </div>

        {/* hero */}
        <div
          className="animate-panel-in space-y-2.5 pt-2"
          style={{ animationDelay: stagger(260) }}
        >
          <div className="h-4 w-[72%] rounded-md bg-gradient-to-r from-gold-light to-gold" aria-hidden="true" />
          <div className="h-4 w-[46%] rounded-md bg-black/[0.14]" aria-hidden="true" />
          <div className="space-y-1.5 pt-1" aria-hidden="true">
            <span className="block h-2 w-[64%] rounded-full bg-black/[0.08]" />
            <span className="block h-2 w-[48%] rounded-full bg-black/[0.08]" />
          </div>
          <div className="flex gap-2.5 pt-2" aria-hidden="true">
            <span className="h-8 w-24 rounded-lg bg-gradient-to-r from-gold-light to-gold shadow-gold" />
            <span className="h-8 w-24 rounded-lg border border-black/10 bg-white" />
          </div>
        </div>

        {/* feature cards */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-panel-in rounded-lg border border-black/[0.07] bg-white p-2.5 md:p-3"
              style={{ animationDelay: stagger(420 + i * 140) }}
            >
              <span
                className={cn(
                  "block h-6 w-6 rounded-md",
                  i === 1 ? "bg-teal-dim" : "bg-gold-dim"
                )}
                aria-hidden="true"
              />
              <span className="mt-2.5 block h-2 w-full rounded-full bg-black/[0.1]" aria-hidden="true" />
              <span className="mt-1.5 block h-2 w-2/3 rounded-full bg-black/[0.07]" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>

      {/* deployment status footer */}
      <div className="flex items-center gap-2 border-t border-black/[0.07] bg-white px-4 py-2.5">
        <span className="animate-status-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
        <p className="truncate font-mono text-[9.5px] tracking-wide text-muted-foreground">
          Deployed · SSL active · Core Web Vitals passed
        </p>
      </div>
    </div>
  );
}

/* ── DATA: live dashboard — KPIs, drawn chart, filling bars ── */

const DATA_KPIS = [
  { label: "Revenue", value: "₦4.2M", delta: "↗ +18%" },
  { label: "Active users", value: "12,840", delta: "↗ +7%" },
  { label: "Conversion", value: "3.4%", delta: "↗ +0.6pt" },
] as const;

const DATA_BARS = [
  { label: "Lagos", pct: 78 },
  { label: "Abuja", pct: 52 },
  { label: "Port Harcourt", pct: 34 },
] as const;

function DataVisual() {
  const stagger = useStagger();
  return (
    <div className="relative">
      <div className="rounded-xl border border-black/[0.08] bg-white p-4 md:p-5">
        {/* dashboard header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LineChart size={13} className="text-gold" aria-hidden="true" />
            <p className="text-[13px] font-semibold text-foreground">Revenue overview</p>
          </div>
          <span className="rounded-full border border-black/[0.08] bg-black/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Last 30 days
          </span>
        </div>

        {/* KPI chips */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {DATA_KPIS.map((k, i) => (
            <div
              key={k.label}
              className="animate-panel-in rounded-lg border border-black/[0.07] bg-[#fafbfd] p-2.5 md:p-3"
              style={{ animationDelay: stagger(120 + i * 160) }}
            >
              <p className="truncate font-mono text-[8.5px] uppercase tracking-wider text-muted-foreground">
                {k.label}
              </p>
              <p className="mt-1 font-display text-[15px] font-bold leading-none text-foreground md:text-[17px]">
                {k.value}
              </p>
              <p className="mt-1.5 font-mono text-[9.5px] font-semibold text-teal">{k.delta}</p>
            </div>
          ))}
        </div>

        {/* self-drawing line chart */}
        <div className="mt-3.5 rounded-lg border border-black/[0.07] bg-[#fafbfd] p-3">
          <div className="flex justify-between font-mono text-[8.5px] text-muted-foreground/70">
            <span>Sep 01</span>
            <span>Sep 30</span>
          </div>
          <svg viewBox="0 0 320 110" className="mt-1 h-28 w-full md:h-32" fill="none" role="img" aria-label="Revenue trend rising over 30 days">
            {[28, 56, 84].map((y) => (
              <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="rgba(20,25,38,0.06)" strokeWidth="1" />
            ))}
            <path
              d="M0 88 C 40 84, 70 90, 110 80 S 190 70, 230 74 S 290 66, 320 60"
              stroke="#0a9d84"
              strokeWidth="2"
              opacity="0.45"
              className="animate-chart-draw"
              style={{ ["--dash" as keyof CSSProperties]: "340" } as CSSProperties}
            />
            <path
              d="M0 92 C 36 86, 66 78, 104 80 S 176 52, 214 56 S 282 26, 320 18"
              stroke="#C9910A"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="animate-chart-draw"
              style={{
                ["--dash" as keyof CSSProperties]: "360",
                animationDelay: stagger(150),
              } as CSSProperties}
            />
            <circle cx="320" cy="18" r="3.5" fill="#C9910A" />
            <circle cx="214" cy="56" r="3" fill="#ffffff" stroke="#C9910A" strokeWidth="2" />
          </svg>
        </div>

        {/* region bars filling to their true share */}
        <div className="mt-3.5 space-y-2.5">
          {DATA_BARS.map((b, i) => (
            <div key={b.label} className="flex items-center gap-3">
              <p className="w-[74px] shrink-0 truncate font-mono text-[9px] uppercase tracking-wide text-muted-foreground sm:w-20">
                {b.label}
              </p>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                {/* wrapper pins the true share; inner bar draws to it via the
                    existing @keyframes fill-bar — inline shorthand because the
                    .fill-bar-anim class is stripped by the CSS pipeline
                    (var() duration inside the shorthand). */}
                <div className="h-full" style={{ width: `${b.pct}%` }}>
                  <div
                    className="h-full w-full rounded-full bg-gradient-to-r from-gold-light to-gold"
                    style={{
                      animation: `fill-bar ${1.4 + i * 0.35}s cubic-bezier(0.16,1,0.3,1) both`,
                    }}
                  />
                </div>
              </div>
              <span className="w-9 shrink-0 text-right font-mono text-[9.5px] font-semibold text-foreground/80">
                {b.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* report toast — floats over the card's bottom edge */}
      <div
        className="animate-panel-in absolute -bottom-3.5 right-3 flex items-center gap-2.5 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 shadow-float"
        style={{ animationDelay: stagger(1500) }}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-dim text-teal">
          <FileCheck2 size={14} aria-hidden="true" />
        </span>
        <div>
          <p className="text-[11.5px] font-semibold leading-tight text-foreground">Report generated</p>
          <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">Q3-summary.pdf · ready to share</p>
        </div>
      </div>
    </div>
  );
}

/* ── AUTOMATE: pipeline with sequential checks + live status ── */

const FLOW_NODES: { icon: LucideIcon; label: string; meta: string }[] = [
  { icon: ClipboardList, label: "Form", meta: "New entry · 09:41" },
  { icon: ShieldCheck, label: "Validate", meta: "Rules passed" },
  { icon: Mail, label: "Email", meta: "Sent · 09:41" },
  { icon: FileSpreadsheet, label: "Sheet", meta: "Row appended" },
];

function AutomateVisual() {
  const stagger = useStagger();
  return (
    <div className="rounded-xl border border-black/[0.08] bg-[#fafbfd] p-4 md:p-5">
      {/* header + running status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Workflow size={13} className="text-gold" aria-hidden="true" />
          <p className="text-[13px] font-semibold text-foreground">Lead capture pipeline</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-dim px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-gold">
          <span className="animate-status-pulse h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
          Automation running
        </span>
      </div>

      {/* pipeline: vertical on mobile, horizontal from sm */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-stretch">
        {FLOW_NODES.map((n, i) => {
          const Icon = n.icon;
          return (
            <Fragment key={n.label}>
              <div className="relative flex flex-1 items-center gap-3 rounded-xl border border-black/[0.08] bg-white p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold-dim text-gold">
                  <Icon size={15} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-foreground">{n.label}</p>
                  <p className="mt-0.5 truncate font-mono text-[9px] text-muted-foreground">{n.meta}</p>
                </div>
                {/* gold check badge lands in sequence */}
                <span
                  className="animate-panel-in absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-ink shadow-gold"
                  style={{ animationDelay: stagger(450 + i * 400) }}
                  aria-hidden="true"
                >
                  <Check size={11} strokeWidth={3.2} />
                </span>
              </div>

              {i < FLOW_NODES.length - 1 && (
                <Fragment>
                  {/* vertical connector (mobile) — aligned under the node icon */}
                  <div className="flex justify-start pl-[26px] sm:hidden" aria-hidden="true">
                    <svg width="10" height="26" viewBox="0 0 10 26" fill="none">
                      <line
                        x1="5"
                        y1="2"
                        x2="5"
                        y2="24"
                        stroke="#C9910A"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="animate-flow-dash"
                      />
                    </svg>
                  </div>
                  {/* horizontal connector (sm+) */}
                  <svg
                    className="hidden h-6 w-6 shrink-0 self-center sm:block"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <line
                      x1="2"
                      y1="12"
                      x2="22"
                      y2="12"
                      stroke="#C9910A"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="animate-flow-dash"
                    />
                  </svg>
                </Fragment>
              )}
            </Fragment>
          );
        })}
      </div>

      <p className="mt-4 font-mono text-[9.5px] tracking-wide text-muted-foreground">
        247 runs this month · 6.2 hrs saved weekly · zero manual entry
      </p>
    </div>
  );
}

/* ── CONNECT: systems diagram + verified transaction card ──── */

function SystemNode({
  icon: Icon,
  label,
  className,
  hub = false,
}: {
  icon: LucideIcon;
  label: string;
  className?: string;
  hub?: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5",
        className
      )}
    >
      <span
        className={cn(
          "relative flex items-center justify-center rounded-xl border bg-white text-foreground/75",
          hub
            ? "h-12 w-12 border-gold/40 bg-gold-dim text-gold shadow-gold"
            : "h-10 w-10 border-black/[0.08] shadow-sm"
        )}
      >
        <Icon size={hub ? 19 : 16} strokeWidth={1.9} aria-hidden="true" />
        {hub && (
          <span
            className="animate-status-pulse absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-gold"
            aria-hidden="true"
          />
        )}
      </span>
      <span className="rounded-full border border-black/[0.08] bg-white/90 px-2 py-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

/** Node coordinates (%) + line endpoints must stay in sync. */
const CONNECT_NODES = {
  payment: { x: 18, y: 24 },
  database: { x: 18, y: 76 },
  api: { x: 50, y: 50 },
  client: { x: 84, y: 50 },
} as const;

const CONNECT_LINKS: { from: keyof typeof CONNECT_NODES; to: keyof typeof CONNECT_NODES; delay: string }[] = [
  { from: "payment", to: "api", delay: "0s" },
  { from: "database", to: "api", delay: "-0.5s" },
  { from: "api", to: "client", delay: "-1s" },
  { from: "payment", to: "database", delay: "-1.5s" },
];

function ConnectVisual() {
  return (
    <div className="rounded-xl border border-black/[0.08] bg-[#fafbfd] p-4 md:p-5">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Network size={13} className="text-gold" aria-hidden="true" />
          <p className="text-[13px] font-semibold text-foreground">Payment infrastructure</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/25 bg-teal-dim px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-teal">
          <span className="animate-status-pulse h-1.5 w-1.5 rounded-full bg-teal" aria-hidden="true" />
          Uptime 99.98%
        </span>
      </div>

      {/* systems diagram — nodes over flowing dashed links */}
      <div className="relative mt-4 h-[190px] md:h-[205px]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          {CONNECT_LINKS.map((l, i) => {
            const a = CONNECT_NODES[l.from];
            const b = CONNECT_NODES[l.to];
            return (
              <Fragment key={i}>
                {/* faint static track */}
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="rgba(20,25,38,0.1)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                {/* flowing dash */}
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#C9910A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  className="animate-flow-dash"
                  style={{ animationDelay: l.delay }}
                />
              </Fragment>
            );
          })}
        </svg>

        <SystemNode icon={CreditCard} label="Payments" className="left-[18%] top-[24%]" />
        <SystemNode icon={Database} label="Database" className="left-[18%] top-[76%]" />
        <SystemNode icon={Webhook} label="API" className="left-1/2 top-1/2" hub />
        <SystemNode icon={UserRound} label="Client" className="left-[84%] top-1/2" />
      </div>

      {/* transaction card — the RESULT of the wiring */}
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 rounded-xl border border-black/[0.08] bg-white p-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-dim text-teal">
            <Zap size={15} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold text-foreground">TXN-2042 · ₦85,000</p>
            <p className="mt-0.5 truncate font-mono text-[9px] text-muted-foreground">
              Card payment · webhook delivered in 240ms
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-full border border-gold/25 bg-gold-dim px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-gold">
            Verified
          </span>
          <ArrowRight size={11} className="text-muted-foreground/40" aria-hidden="true" />
          <span className="inline-flex items-center gap-1 rounded-full border border-teal/25 bg-teal-dim px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-teal">
            <Check size={8} strokeWidth={3} aria-hidden="true" />
            Settled
          </span>
        </div>
      </div>
    </div>
  );
}
