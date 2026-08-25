"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Check,
  Globe,
  CreditCard,
  LineChart,
  Workflow,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * HeroVisual — live-UI product cards demonstrating actual Okomba workflows.
 * A deploy card cycles through real service types (web platform → payment
 * integration → analytics dashboard → automation), each with a build
 * pipeline of status badges ending in LIVE. Around it: a live brief card,
 * a monitoring bar and an animated sparkline card.
 */

const PIPELINES = [
  {
    icon: Globe,
    ref: "WEB-042",
    name: "Client web platform",
    meta: "Next.js · CMS · SEO",
    kpi: "12 pages",
  },
  {
    icon: CreditCard,
    ref: "PAY-118",
    name: "Payment integration",
    meta: "Paystack · Remita · Webhooks",
    kpi: "99.9% uptime",
  },
  {
    icon: LineChart,
    ref: "DATA-207",
    name: "Analytics dashboard",
    meta: "Reports · KPIs · Alerts",
    kpi: "18 metrics",
  },
  {
    icon: Workflow,
    ref: "AUTO-093",
    name: "Automation workflow",
    meta: "Forms → Email · Sheets",
    kpi: "40 hrs/mo saved",
  },
] as const;

const STAGES = ["Designed", "Built", "Tested"] as const;

export function HeroVisual() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((i) => (i + 1) % PIPELINES.length), 3400);
    return () => clearInterval(t);
  }, []);

  const pipeline = PIPELINES[active];
  const Icon = pipeline.icon;

  return (
    <div className="relative mx-auto w-full max-w-[520px]" aria-hidden="true">
      {/* flowing gradient lines behind (Termii-style abstract motion) */}
      <svg
        className="pointer-events-none absolute -inset-8 h-[calc(100%+64px)] w-[calc(100%+64px)] text-gold/25"
        viewBox="0 0 560 480"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M-20 380 C 120 300, 200 420, 340 330 S 520 160, 600 220"
          stroke="currentColor"
          strokeWidth="1.5"
          className="animate-flow-dash"
        />
        <path
          d="M-20 120 C 100 60, 260 180, 380 110 S 540 40, 610 90"
          stroke="currentColor"
          strokeWidth="1.5"
          className="animate-flow-dash"
          style={{ animationDelay: "-0.7s" }}
        />
        <path
          d="M60 480 C 80 340, 220 300, 300 220 S 420 90, 480 20"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
          className="animate-flow-dash"
          style={{ animationDelay: "-1.2s" }}
        />
      </svg>

      <div className="relative space-y-3.5">
        {/* ── Top: live brief card ─────────────────────────── */}
        <div className="surface-card animate-panel-in flex items-center gap-3.5 p-4" style={{ animationDelay: "200ms" }}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim text-gold">
            <Bell size={16} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground">New project brief received</p>
            <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
              Votewise · secure voting platform · response sent in 3h
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-teal/10 px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-teal">
            New
          </span>
        </div>

        {/* ── Main: deploy pipeline card (cycles services) ── */}
        <div
          key={active}
          className="surface-card shadow-float animate-panel-in overflow-hidden p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-white">
                <Icon size={18} strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-[14.5px] font-semibold text-foreground">{pipeline.name}</p>
                <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
                  {pipeline.ref} · {pipeline.meta}
                </p>
              </div>
            </div>
            <ArrowUpRight size={16} className="text-muted-foreground/50" />
          </div>

          {/* pipeline badges */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {STAGES.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-black/[0.04] px-2.5 py-1 font-mono text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                <Check size={9} strokeWidth={3} className="text-teal" />
                {s}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-wider text-ink">
              <span className="animate-status-pulse h-1.5 w-1.5 rounded-full bg-ink/70" />
              Live
            </span>
          </div>

          {/* progress rail */}
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className="fill-bar-anim h-full w-full rounded-full bg-gradient-to-r from-gold-light to-gold motion-reduce:animate-none"
            />
          </div>
          <p className="mt-2.5 font-mono text-[10px] text-muted-foreground/70">
            {pipeline.kpi} · maintained by Okomba post-launch support
          </p>
        </div>

        {/* ── Bottom row: sparkline + monitoring ───────────── */}
        <div className="grid grid-cols-[1.35fr_1fr] gap-3.5">
          <div className="surface-card p-4">
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Client growth
              </p>
              <p className="font-mono text-[11px] font-semibold text-teal">↗ +18%</p>
            </div>
            <svg viewBox="0 0 200 56" className="mt-2 h-14 w-full" fill="none">
              <path
                d="M0 46 C 20 44, 32 38, 48 40 S 76 30, 92 32 S 122 18, 140 22 S 176 8, 200 6"
                stroke="#C9910A"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-chart-draw"
                style={{ ["--dash" as string]: "260" }}
              />
              <circle cx="200" cy="6" r="3.5" fill="#C9910A" />
            </svg>
          </div>
          <div className="surface-card flex flex-col justify-center gap-2 p-4">
            <div className="flex items-center gap-2">
              <Activity size={13} className="text-teal" />
              <p className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                Monitoring
              </p>
            </div>
            <p className="text-[12px] font-semibold leading-tight text-foreground">
              All systems operational
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
