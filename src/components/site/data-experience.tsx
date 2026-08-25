"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowDownLeft,
  Compass,
  FileBarChart,
  FileCheck2,
  LayoutDashboard,
  LineChart,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

/* ─────────────────────────────────────────────────────────────
   DataExperience — Termii directive #14: the company is Okomba
   ANALYTICS, so data must be visibly present. A realistic
   analytics dashboard hero card (self-drawing chart with hover
   crosshair, KPI count-ups, channel bars, a report toast and a
   live activity ticker) beside three value props. All numbers
   are framed as capability illustrations, never client claims.
   ───────────────────────────────────────────────────────────── */

/* ── Chart geometry (viewBox 0 0 560 240) ─────────────────── */
const VIEW_W = 560;
const VIEW_H = 240;
const X0 = 44;
const X_STEP = 84;
const xOf = (i: number) => X0 + i * X_STEP;
const yOf = (v: number) => 204 - v * 1.8; // 0% → y204, 100% → y24

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL"] as const;
const REVENUE = [58, 63, 60, 70, 67, 78, 85]; // % of target — illustrative
const TARGET = [60, 60, 64, 64, 66, 70, 70];

const REVENUE_PATH =
  "M44 99.6 C72 97, 100 91.6, 128 90.6 C156 89.6, 184 96.4, 212 96 C240 95.6, 268 81.6, 296 78 C324 74.4, 352 84.8, 380 83.4 C408 82, 436 66, 464 63.6 C492 61.2, 520 54.2, 548 51";
const AREA_PATH = `${REVENUE_PATH} L548 204 L44 204 Z`;
const TARGET_PATH = "M44 96 L128 96 L212 88.8 L296 88.8 L380 85.2 L464 78 L548 78";

const KPIS = [
  { label: "Metrics tracked", value: 18, suffix: "", note: "on one screen" },
  { label: "Data sources", value: 6, suffix: "", note: "unified, live" },
  { label: "Reports generated", value: 12, suffix: "/mo", note: "arrive on schedule" },
];

const CHANNELS = [
  { label: "Online store", pct: 64, bar: "bg-gold" },
  { label: "Invoices", pct: 22, bar: "bg-gold-light" },
  { label: "Walk-in & POS", pct: 14, bar: "bg-teal" },
];

const ACTIVITY = [
  { id: "ord-4821", label: "Order #4821 settled", amount: "₦38,500", status: "Settled" },
  { id: "sub-119", label: "Subscription renewed", amount: "₦12,000", status: "Settled" },
  { id: "inv-220", label: "Invoice #220 paid", amount: "₦96,200", status: "Processing" },
  { id: "pos-38", label: "POS batch closed", amount: "₦24,850", status: "Settled" },
] as const;

const VALUE_PROPS: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboards",
    desc: "One live screen for the numbers that run your business — orders, revenue, stock — not last month's export.",
  },
  {
    icon: FileBarChart,
    title: "Reporting",
    desc: "Reports that build themselves and arrive on schedule, as polished PDFs — no late nights in spreadsheets.",
  },
  {
    icon: Compass,
    title: "Decision support",
    desc: "Every chart answers a question you actually ask, with the recommendation written next to it.",
  },
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

/** One-shot in-view gate so entrance animations only play when seen. */
function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

export function DataExperience() {
  const reduced = usePrefersReducedMotion();
  const [dashRef, dashInView] = useInView<HTMLDivElement>(0.25);
  const [hover, setHover] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  // Live activity ticker — the newest row slides in at the top
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setTick((n) => n + 1), 2800);
    return () => clearInterval(t);
  }, [reduced]);

  const rows = [0, 1, 2].map((k) => ACTIVITY[(tick + k) % ACTIVITY.length]);

  const onChartMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xUnits = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    const frac = (xUnits - X0) / ((MONTHS.length - 1) * X_STEP);
    if (frac < -0.06 || frac > 1.06) {
      setHover(null);
      return;
    }
    setHover(Math.max(0, Math.min(MONTHS.length - 1, Math.round(frac))));
  };

  const diff = hover !== null ? REVENUE[hover] - TARGET[hover] : 0;

  return (
    <section
      id="data"
      aria-label="The analytics edge — data experience"
      className="section-pad relative scroll-mt-20 overflow-hidden bg-background"
    >
      {/* ambience — faint dots + warm radial (paper feel) */}
      <div
        className="bg-dots pointer-events-none absolute inset-0 opacity-25 [mask-image:radial-gradient(46%_40%_at_50%_30%,black,transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(201,145,10,0.06),transparent)]"
        aria-hidden="true"
      />

      <div className="container-xl relative">
        <SectionHeading
          eyebrow="The analytics edge"
          title={
            <>
              We don&apos;t just collect data. We help you{" "}
              <span className="text-gradient-gold">understand what it means.</span>
            </>
          }
          desc="Analytics is built into every system we ship — dashboards, reporting and decision support that turn daily operations into clear next moves."
        />

        <div className="mt-4 grid items-center gap-10 lg:grid-cols-[1fr_1.45fr] lg:gap-12">
          {/* ── Value props column ──────────────────────────── */}
          <div className="order-2 lg:order-1">
            <div className="space-y-7">
              {VALUE_PROPS.map((v, i) => {
                const Icon = v.icon;
                return (
                  <Reveal key={v.title} delay={i * 90}>
                    <div className="flex gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/[0.07] bg-white text-gold shadow-[0_2px_10px_rgba(20,25,38,0.05)]">
                        <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-display text-[16.5px] font-bold text-foreground">{v.title}</h3>
                        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{v.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
            <Reveal delay={280} className="mt-8">
              <p className="border-l-2 border-gold/40 pl-3.5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-muted-foreground/70">
                Analytics ships with every system we build — it&apos;s how we prove the work works.
              </p>
            </Reveal>
          </div>

          {/* ── Dashboard hero card ──────────────────────────── */}
          <Reveal delay={60} className="relative order-1 lg:order-2">
            <div ref={dashRef} className="surface-card shadow-float relative mt-6 p-4 md:p-6 lg:mt-0">
              {/* header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/25 bg-gold-dim text-gold">
                    <LineChart size={16} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">Operations overview</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70">
                      Revenue attainment · last 7 months
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-black/[0.08] bg-black/[0.03] px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  Sample data
                </span>
              </div>

              {/* KPI chips */}
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {KPIS.map((k, i) => (
                  <div
                    key={k.label}
                    className={cn(
                      "rounded-lg border border-black/[0.07] bg-[#fafbfd] p-2.5 md:p-3",
                      dashInView && "animate-panel-in"
                    )}
                    style={dashInView ? { animationDelay: `${120 + i * 140}ms` } : undefined}
                  >
                    <p className="truncate font-mono text-[8.5px] uppercase tracking-wider text-muted-foreground">
                      {k.label}
                    </p>
                    <p className="mt-1 font-display text-[19px] font-bold leading-none text-foreground md:text-[22px]">
                      <AnimatedNumber value={k.value} suffix={k.suffix} />
                    </p>
                    <p className="mt-1.5 font-mono text-[8.5px] text-muted-foreground/70">{k.note}</p>
                  </div>
                ))}
              </div>

              {/* legend + delta */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-[3px] w-5 rounded-full bg-gold" aria-hidden="true" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                    Revenue · actual
                  </span>
                  <span className="ml-1.5 inline-block w-5 border-t-2 border-dashed border-teal" aria-hidden="true" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Target</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-teal/25 bg-teal-dim px-2.5 py-1 font-mono text-[9.5px] font-semibold text-teal">
                  <TrendingUp size={11} strokeWidth={2.4} aria-hidden="true" />
                  +27 pts since Jan
                </span>
              </div>

              {/* main chart with hover crosshair */}
              <div className="mt-3 rounded-xl border border-black/[0.06] bg-[#fafbfd] p-3.5 md:p-4">
                {/* tight wrapper — pointer hits + bubble % map 1:1 to the SVG box */}
                <div
                  className="relative cursor-crosshair"
                  onPointerMove={onChartMove}
                  onPointerLeave={() => setHover(null)}
                >
                <svg
                  viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                  className="block h-auto w-full"
                  role="img"
                  aria-label="Line chart: revenue climbing from 58 to 85 percent of target between January and July, tracking above a rising target line (illustrative data)"
                >
                  <defs>
                    <linearGradient id="okx-rev-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9910A" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#C9910A" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* gridlines */}
                  {[100, 75, 50, 25].map((v) => (
                    <line
                      key={v}
                      x1={X0}
                      x2={xOf(MONTHS.length - 1)}
                      y1={yOf(v)}
                      y2={yOf(v)}
                      stroke="rgba(20,25,38,0.055)"
                      strokeWidth="1"
                    />
                  ))}
                  <line x1={X0} x2={xOf(MONTHS.length - 1)} y1={yOf(0)} y2={yOf(0)} stroke="rgba(20,25,38,0.12)" strokeWidth="1" />

                  {/* axis labels */}
                  {[100, 75, 50, 25, 0].map((v) => (
                    <text
                      key={v}
                      x={X0 - 10}
                      y={yOf(v) + 3}
                      textAnchor="end"
                      fontSize="10"
                      className="fill-muted-foreground/60 font-mono"
                    >
                      {v}
                    </text>
                  ))}
                  {MONTHS.map((m, i) => (
                    <text
                      key={m}
                      x={xOf(i)}
                      y={222}
                      textAnchor="middle"
                      fontSize="10.5"
                      letterSpacing="0.04em"
                      className="fill-muted-foreground/70 font-mono"
                    >
                      {m}
                    </text>
                  ))}

                  {/* area fill under revenue */}
                  <path
                    d={AREA_PATH}
                    fill="url(#okx-rev-area)"
                    className={dashInView ? "animate-panel-in" : undefined}
                    style={dashInView ? { animationDelay: "0.9s" } : undefined}
                  />

                  {/* target — dashed teal benchmark */}
                  <path
                    d={TARGET_PATH}
                    fill="none"
                    stroke="#0a9d84"
                    strokeWidth="2"
                    strokeDasharray="5 7"
                    strokeLinecap="round"
                    opacity="0.75"
                    className={dashInView ? "animate-panel-in" : undefined}
                    style={dashInView ? { animationDelay: "0.5s" } : undefined}
                  />

                  {/* revenue — self-drawing gold line */}
                  <path
                    d={REVENUE_PATH}
                    fill="none"
                    stroke="#C9910A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className={dashInView ? "animate-chart-draw" : undefined}
                    style={{ ["--dash" as string]: "580" }}
                  />

                  {/* endpoint marker */}
                  <circle
                    cx={xOf(MONTHS.length - 1)}
                    cy={yOf(REVENUE[REVENUE.length - 1])}
                    r="3.5"
                    fill="#C9910A"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />

                  {/* hover crosshair */}
                  {hover !== null && (
                    <g aria-hidden="true">
                      <line
                        x1={xOf(hover)}
                        x2={xOf(hover)}
                        y1={18}
                        y2={208}
                        stroke="#141926"
                        strokeOpacity="0.25"
                        strokeWidth="1"
                        strokeDasharray="3 4"
                      />
                      <circle cx={xOf(hover)} cy={yOf(REVENUE[hover])} r="4.5" fill="#C9910A" stroke="#ffffff" strokeWidth="2" />
                    </g>
                  )}
                </svg>

                {/* value bubble */}
                {hover !== null && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute z-10 rounded-lg border border-black/[0.08] bg-white px-2.5 py-1.5 shadow-float"
                    style={{
                      left: `${Math.min(86, Math.max(14, (xOf(hover) / VIEW_W) * 100))}%`,
                      top: `${(yOf(REVENUE[hover]) / VIEW_H) * 100}%`,
                      transform: "translate(-50%, calc(-100% - 12px))",
                    }}
                  >
                    <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">
                      {MONTHS[hover]}
                    </p>
                    <p className="mt-0.5 text-[11.5px] font-semibold leading-none text-foreground">
                      {REVENUE[hover]}% of target
                    </p>
                    <p
                      className={cn(
                        "mt-1 font-mono text-[9px] leading-none",
                        diff >= 0 ? "text-teal" : "text-muted-foreground"
                      )}
                    >
                      {diff >= 0 ? "+" : ""}
                      {diff} pts vs target
                    </p>
                  </div>
                )}
                </div>
              </div>

              {/* bars + live activity */}
              <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
                <div className="rounded-xl border border-black/[0.06] bg-[#fafbfd] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">
                      Revenue by channel
                    </p>
                    <p className="font-mono text-[7.5px] uppercase tracking-[0.1em] text-muted-foreground/50">
                      share · illustrative
                    </p>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {CHANNELS.map((c, i) => (
                      <div key={c.label} className="flex items-center gap-2.5">
                        <span className="w-[84px] shrink-0 truncate font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground">
                          {c.label}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06]" aria-hidden="true">
                          <div className="h-full" style={{ width: `${c.pct}%` }}>
                            <div
                              className={cn("h-full w-full rounded-full", c.bar)}
                              style={
                                dashInView
                                  ? { animation: `fill-bar 1.2s cubic-bezier(0.16,1,0.3,1) ${0.5 + i * 0.15}s both` }
                                  : undefined
                              }
                            />
                          </div>
                        </div>
                        <span className="w-8 shrink-0 text-right font-mono text-[9.5px] font-semibold text-foreground/80">
                          {c.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-black/[0.06] bg-[#fafbfd] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">
                      Latest activity
                    </p>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-teal">
                      <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-teal" aria-hidden="true" />
                      Live
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {rows.map((r, k) => (
                      <div
                        key={k === 0 ? `${r.id}-${tick}` : r.id}
                        className={cn(
                          "flex h-9 items-center gap-2.5 rounded-lg border border-black/[0.05] bg-white px-2.5",
                          k === 0 && "animate-panel-in"
                        )}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-dim text-teal">
                          <ArrowDownLeft size={12} strokeWidth={2.2} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-foreground">
                          {r.label}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] font-semibold text-foreground/80">
                          {r.amount}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-1.5 py-0.5 font-mono text-[7.5px] font-semibold uppercase tracking-[0.1em]",
                            r.status === "Settled"
                              ? "border-teal/25 bg-teal-dim text-teal"
                              : "border-gold/25 bg-gold-dim text-gold"
                          )}
                        >
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* framing footer */}
              <div className="mt-4 flex items-start gap-2 border-t border-black/[0.06] pt-3.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" aria-hidden="true" />
                <p className="font-mono text-[9px] leading-relaxed text-muted-foreground/80">
                  Illustrative interface · what a typical Okomba dashboard tracks — yours is built around your real
                  data and questions.
                </p>
              </div>
            </div>

            {/* report toast — floats over the card edge */}
            <div
              aria-hidden="true"
              className={cn(
                "absolute -top-5 right-4 z-20 flex items-center gap-2.5 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 shadow-float md:-right-4",
                dashInView && "animate-panel-in"
              )}
              style={dashInView ? { animationDelay: "1.7s" } : undefined}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-dim text-teal">
                <FileCheck2 size={15} aria-hidden="true" />
              </span>
              <div>
                <p className="text-[12px] font-semibold leading-tight text-foreground">Report generated</p>
                <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">monthly-summary.pdf · ready</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
