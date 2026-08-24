"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Bell,
  Check,
  Code2,
  CreditCard,
  FileSpreadsheet,
  Lightbulb,
  ListChecks,
  Lock,
  Mail,
  Network,
  PenTool,
  Rocket,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

/* ─────────────────────────────────────────────────────────────
   WorkflowDemo — Termii directive #13: "See how we turn an
   idea into a working system." Dark engineering anchor with an
   auto-advancing 7-step pipeline. Nodes are buttons (click to
   jump); the stage card below shows a realistic mini-UI for the
   active step. Auto-advance pauses on hover/focus and only runs
   while the section is in view. Reduced motion: no auto-advance,
   all steps rendered completed, first card static.
   ───────────────────────────────────────────────────────────── */

const STEP_MS = 2600;

const STEPS: { icon: LucideIcon; label: string }[] = [
  { icon: Lightbulb, label: "Idea submitted" },
  { icon: ListChecks, label: "Requirements analyzed" },
  { icon: PenTool, label: "Design created" },
  { icon: Code2, label: "System developed" },
  { icon: Network, label: "Integrations connected" },
  { icon: ShieldCheck, label: "Testing completed" },
  { icon: Rocket, label: "Product launched" },
];

type NodeState = "done" | "active" | "next";

function nodeState(index: number, active: number, reduced: boolean): NodeState {
  if (reduced || index < active) return "done";
  if (index === active) return "active";
  return "next";
}

const NODE_STYLES: Record<NodeState, string> = {
  done: "border-teal/40 bg-teal-dim text-teal",
  active: "border-gold/50 bg-gold text-ink shadow-[0_8px_28px_-8px_rgba(245,196,81,0.55)]",
  next: "border-white/10 bg-white/[0.04] text-muted-foreground/60",
};

const H_LABEL_STYLES: Record<NodeState, string> = {
  done: "text-foreground/60",
  active: "font-semibold text-foreground",
  next: "text-muted-foreground/45",
};

const V_LABEL_STYLES: Record<NodeState, string> = {
  done: "font-medium text-foreground/70",
  active: "font-semibold text-foreground",
  next: "font-medium text-muted-foreground/60",
};

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

export function WorkflowDemo() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const inView = useRef(true);

  // Auto-advance only while the section is on screen
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reduced) return;
    const obs = new IntersectionObserver(
      (entries) => {
        inView.current = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (reduced || paused) return;
    const t = setInterval(() => {
      if (inView.current) setActive((i) => (i + 1) % STEPS.length);
    }, STEP_MS);
    return () => clearInterval(t);
  }, [reduced, paused]);

  const pauseAuto = () => setPaused(true);
  const resumeAuto = () => setPaused(false);

  return (
    <section
      ref={sectionRef}
      id="how-we-work"
      aria-label="How we work — the delivery pipeline"
      className="section-dark section-pad relative scroll-mt-20 overflow-hidden bg-background"
    >
      {/* ambience — grid + soft gold glow from the top */}
      <div
        className="bg-grid-on-dark pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(72%_62%_at_50%_30%,black,transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(50%_60%_at_50%_0%,rgba(245,196,81,0.07),transparent)]"
        aria-hidden="true"
      />

      <div className="container-xl relative">
        <SectionHeading
          eyebrow="The delivery pipeline"
          title={
            <>
              From idea to <span className="text-gradient-gold">working system.</span>
            </>
          }
          desc="See how we turn an idea into a working system — the same disciplined pipeline behind every engagement, with a deliverable you can see, click and approve at each stage."
        />

        {/* ── Step track ─────────────────────────────────────── */}
        <Reveal delay={80} className="mt-2 md:mt-4">
          {/* Mobile — vertical track */}
          <div
            className="relative md:hidden"
            aria-label="Delivery pipeline steps"
            onMouseEnter={pauseAuto}
            onMouseLeave={resumeAuto}
            onFocus={pauseAuto}
            onBlur={resumeAuto}
          >
            <span
              className="absolute bottom-[22px] left-[21px] top-[22px] w-0.5 rounded-full bg-white/[0.08]"
              aria-hidden="true"
            >
              <span
                className="absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-gold-light to-gold transition-[height] duration-700 ease-out"
                style={{ height: `${(active / (STEPS.length - 1)) * 100}%` }}
              />
            </span>
            <ol className="relative space-y-2">
              {STEPS.map((step, i) => {
                const st = nodeState(i, active, reduced);
                const Icon = step.icon;
                return (
                  <li key={step.label} className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-current={st === "active" ? "step" : undefined}
                      aria-label={`${step.label} — step ${i + 1} of 7${st === "done" ? " (completed)" : st === "active" ? " (current)" : ""}`}
                      className={cn(
                        "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                        NODE_STYLES[st]
                      )}
                    >
                      {st === "done" ? (
                        <Check size={16} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
                      )}
                      {st === "active" && (
                        <span className="animate-status-pulse pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p className={cn("text-[13.5px] leading-tight", V_LABEL_STYLES[st])}>{step.label}</p>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/40">
                        Step {String(i + 1).padStart(2, "0")} / 07
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Desktop — horizontal track */}
          <div
            className="relative hidden md:block"
            aria-label="Delivery pipeline steps"
            onMouseEnter={pauseAuto}
            onMouseLeave={resumeAuto}
            onFocus={pauseAuto}
            onBlur={resumeAuto}
          >
            <span
              className="absolute inset-x-[7.1429%] top-[21px] h-0.5 rounded-full bg-white/[0.08]"
              aria-hidden="true"
            >
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-light to-gold transition-[width] duration-700 ease-out"
                style={{ width: `${(active / (STEPS.length - 1)) * 100}%` }}
              />
            </span>
            <ol className="relative grid grid-cols-7">
              {STEPS.map((step, i) => {
                const st = nodeState(i, active, reduced);
                const Icon = step.icon;
                return (
                  <li key={step.label} className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-current={st === "active" ? "step" : undefined}
                      aria-label={`${step.label} — step ${i + 1} of 7${st === "done" ? " (completed)" : st === "active" ? " (current)" : ""}`}
                      className={cn(
                        "relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                        NODE_STYLES[st]
                      )}
                    >
                      {st === "done" ? (
                        <Check size={16} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
                      )}
                      {st === "active" && (
                        <span className="animate-status-pulse pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />
                      )}
                    </button>
                    <span
                      className={cn(
                        "mt-3 px-1 text-center font-mono text-[9.5px] uppercase leading-[1.45] tracking-[0.1em]",
                        H_LABEL_STYLES[st]
                      )}
                    >
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </Reveal>

        {/* ── Stage detail card ──────────────────────────────── */}
        <Reveal delay={150} className="mx-auto mt-12 max-w-xl">
          <div key={active} className="animate-panel-in">
            <div role="region" aria-label={`Stage ${active + 1} of 7 — ${STEPS[active].label}`}>
              <StepDetail index={active} />
            </div>
          </div>
        </Reveal>

        <Reveal delay={100} className="mt-10">
          <p className="text-center font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.14em] text-muted-foreground/70">
            Every engagement runs through the same disciplined pipeline —{" "}
            <span className="text-gold/80">no mystery, no surprises.</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Stage card shell + rows ───────────────────────────────── */

function DetailShell({
  step,
  title,
  pill,
  pillTone = "gold",
  pulse = false,
  glowing = false,
  footer,
  children,
}: {
  step: number;
  title: string;
  pill: string;
  pillTone?: "gold" | "teal";
  pulse?: boolean;
  glowing?: boolean;
  footer: string;
  children: ReactNode;
}) {
  return (
    <article className="surface-card relative overflow-hidden p-5 md:p-6">
      {glowing && (
        <span
          className="animate-glow-breathe pointer-events-none absolute -top-10 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl"
          aria-hidden="true"
        />
      )}
      <header className="relative flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 font-mono text-[9.5px] font-medium tracking-[0.14em] text-muted-foreground">
            STEP {String(step + 1).padStart(2, "0")}/07
          </span>
          <h3 className="truncate font-display text-[16px] font-bold text-foreground">{title}</h3>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em]",
            pillTone === "gold" ? "border-gold/30 bg-gold-dim text-gold" : "border-teal/30 bg-teal-dim text-teal"
          )}
        >
          {pulse && <span className="animate-status-pulse h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
          {pill}
        </span>
      </header>
      <div className="relative mt-4 min-h-[196px]">{children}</div>
      <p className="relative mt-4 border-t border-white/[0.06] pt-3 font-mono text-[9.5px] leading-relaxed text-muted-foreground/70">
        {footer}
      </p>
    </article>
  );
}

function DetailRow({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "animate-panel-in flex h-[42px] items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function CheckChip() {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-dim text-teal">
      <Check size={12} strokeWidth={3} aria-hidden="true" />
    </span>
  );
}

/* ── The seven stage cards ─────────────────────────────────── */

function BriefCard() {
  const fields = [
    { label: "FROM", value: "Ada O. · Fashion retail" },
    { label: "SERVICE", value: "Web platform + payment integration" },
    { label: "BRIEF", value: "\u201COne system for orders, payments and stock.\u201D" },
  ];
  return (
    <DetailShell step={0} title="New project brief" pill="Received" footer="Brief acknowledged · Response sent in 3h">
      <div className="space-y-2">
        {fields.map((f, i) => (
          <DetailRow key={f.label} delay={60 + i * 70}>
            <span className="w-14 shrink-0 font-mono text-[9px] tracking-[0.14em] text-muted-foreground/60">
              {f.label}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{f.value}</span>
          </DetailRow>
        ))}
        <DetailRow delay={60 + 3 * 70}>
          <CheckChip />
          <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-foreground">
            Brief submitted — acknowledged
          </span>
          <span className="shrink-0 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-teal">
            3h response
          </span>
        </DetailRow>
      </div>
    </DetailShell>
  );
}

function ScopeCard() {
  const reqs = [
    { name: "Auth & user roles", pri: "P0" },
    { name: "Payment capture", pri: "P0" },
    { name: "Inventory sync", pri: "P1" },
    { name: "Reports & exports", pri: "P1" },
  ];
  return (
    <DetailShell
      step={1}
      title="Scope document v1.2"
      pill="Analyzed"
      pillTone="teal"
      footer="14 requirements · 3 risks flagged · Estimate updated"
    >
      <div className="space-y-2">
        {reqs.map((r, i) => (
          <DetailRow key={r.name} delay={60 + i * 70}>
            <CheckChip />
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{r.name}</span>
            <span
              className={cn(
                "shrink-0 rounded border px-1.5 py-0.5 font-mono text-[8.5px] font-semibold tracking-[0.12em]",
                r.pri === "P0" ? "border-gold/30 bg-gold-dim text-gold" : "border-white/10 bg-white/[0.04] text-muted-foreground"
              )}
            >
              {r.pri}
            </span>
          </DetailRow>
        ))}
      </div>
    </DetailShell>
  );
}

function DesignCard() {
  return (
    <DetailShell
      step={2}
      title="Design review — Concept B"
      pill="Approved"
      pillTone="teal"
      footer="2 concepts · Approved in round 1 · 12 screens"
    >
      <div className="space-y-2">
        {/* browser-frame wireframe */}
        <div
          className="animate-panel-in overflow-hidden rounded-lg border border-white/[0.08] bg-[#0d1322]"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
            <span className="flex gap-1" aria-hidden="true">
              <i className="h-1.5 w-1.5 rounded-full bg-white/20" />
              <i className="h-1.5 w-1.5 rounded-full bg-white/20" />
              <i className="h-1.5 w-1.5 rounded-full bg-white/20" />
            </span>
            <span className="ml-1 flex-1 truncate rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] text-muted-foreground/60">
              concept-b · desktop + mobile
            </span>
          </div>
          <div className="space-y-2 p-3">
            <div className="animate-panel-in h-2 w-1/3 rounded-full bg-white/15" style={{ animationDelay: "180ms" }} />
            <div
              className="animate-panel-in h-5 w-3/4 rounded bg-gradient-to-r from-gold/50 to-gold/20"
              style={{ animationDelay: "260ms" }}
            />
            <div className="animate-panel-in h-2 w-1/2 rounded-full bg-white/10" style={{ animationDelay: "340ms" }} />
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[0, 1, 2].map((k) => (
                <div
                  key={k}
                  className="animate-panel-in flex h-12 flex-col justify-end gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] p-1.5"
                  style={{ animationDelay: `${420 + k * 90}ms` }}
                >
                  <span className="h-1 w-3 rounded-full bg-gold/60" />
                  <span className="h-1 w-full rounded-full bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* palette row */}
        <div className="animate-panel-in flex h-[38px] items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5" style={{ animationDelay: "700ms" }}>
          <span className="flex gap-1.5" aria-hidden="true">
            <i className="h-3.5 w-3.5 rounded-full border border-white/25 bg-ink" />
            <i className="h-3.5 w-3.5 rounded-full bg-gold" />
            <i className="h-3.5 w-3.5 rounded-full bg-teal" />
          </span>
          <span className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground/70">INK · GOLD · TEAL</span>
          <span className="ml-auto font-mono text-[9.5px] text-muted-foreground/60">12 screens</span>
        </div>
      </div>
    </DetailShell>
  );
}

function BuildCard() {
  const commits = [
    { msg: "feat: checkout flow", add: "+412", del: "−38" },
    { msg: "fix: webhook retries", add: "+86", del: "−12" },
    { msg: "chore: seed reports", add: "+314", del: "−4" },
    { msg: "refactor: auth guard", add: "+118", del: "−52" },
  ];
  return (
    <DetailShell
      step={3}
      title="Build log"
      pill="In progress"
      pulse
      footer="Sprint 4 of 5 · Staging preview live for your review"
    >
      <div className="space-y-2">
        {commits.map((c, i) => (
          <DetailRow key={c.msg} delay={60 + i * 70}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground/90">{c.msg}</span>
            <span className="shrink-0 font-mono text-[9.5px] font-semibold text-teal">{c.add}</span>
            <span className="shrink-0 font-mono text-[9.5px] text-muted-foreground/50">{c.del}</span>
          </DetailRow>
        ))}
      </div>
    </DetailShell>
  );
}

function IntegrationsCard() {
  const rows = [
    { icon: CreditCard, name: "Paystack", meta: "payments", status: "Verified", done: true },
    { icon: FileSpreadsheet, name: "Google Sheets", meta: "data sync", status: "Synced", done: true },
    { icon: Mail, name: "Email · SMTP", meta: "transactional", status: "Connected", done: true },
    { icon: Bell, name: "WhatsApp alerts", meta: "notifications", status: "Queued", done: false },
  ];
  return (
    <DetailShell
      step={4}
      title="Integrations"
      pill="3 connected"
      pillTone="teal"
      footer="Webhook ACK 240ms · Automatic retries enabled"
    >
      <div className="space-y-2">
        {rows.map((r, i) => {
          const Icon = r.icon;
          return (
            <DetailRow key={r.name} delay={60 + i * 70}>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                  r.done ? "border-teal/25 bg-teal-dim text-teal" : "border-white/10 bg-white/[0.04] text-muted-foreground/60"
                )}
              >
                <Icon size={13} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                {r.name}
                <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50">
                  {r.meta}
                </span>
              </span>
              {r.done ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-teal/30 bg-teal-dim px-2 py-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.12em] text-teal">
                  <Check size={9} strokeWidth={3} aria-hidden="true" />
                  {r.status}
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gold/25 bg-gold-dim px-2 py-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.12em] text-gold">
                  <span className="animate-pulse-dot h-1 w-1 rounded-full bg-current" aria-hidden="true" />
                  {r.status}
                </span>
              )}
            </DetailRow>
          );
        })}
      </div>
    </DetailShell>
  );
}

function TestCard() {
  const tests = [
    { name: "Checkout E2E", meta: "812ms" },
    { name: "Payment webhook", meta: "240ms" },
    { name: "Accessibility", meta: "WCAG AA" },
  ];
  return (
    <DetailShell
      step={5}
      title="Test run #12"
      pill="42 passed"
      pillTone="teal"
      footer="0 failures · Green build · Ready to ship"
    >
      <div className="space-y-2">
        {tests.map((t, i) => (
          <DetailRow key={t.name} delay={60 + i * 70}>
            <CheckChip />
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{t.name}</span>
            <span className="shrink-0 font-mono text-[9.5px] text-muted-foreground/60">{t.meta}</span>
          </DetailRow>
        ))}
        {/* pass-rate bar */}
        <div className="animate-panel-in flex h-[38px] items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5" style={{ animationDelay: "300ms" }}>
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
            Pass rate
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden="true">
            <span
              className="block h-full w-full rounded-full bg-gradient-to-r from-teal/70 to-teal"
              style={{ animation: "fill-bar 1.1s cubic-bezier(0.16,1,0.3,1) 350ms both" }}
            />
          </div>
          <span className="shrink-0 font-mono text-[10px] font-semibold text-teal">42/42</span>
        </div>
      </div>
    </DetailShell>
  );
}

function LaunchCard() {
  const checks = ["SSL active", "Web Vitals passed", "Monitored 24/7"];
  return (
    <DetailShell
      step={6}
      title="Launch day"
      pill="Live"
      pulse
      glowing
      footer="Handover docs delivered · Support continues"
    >
      <div className="animate-panel-in flex min-h-[196px] flex-col items-center justify-center gap-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-6" style={{ animationDelay: "60ms" }}>
        <span className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-1.5 font-mono text-[11px] font-bold tracking-[0.22em] text-ink">
          <span className="animate-status-pulse h-1.5 w-1.5 rounded-full bg-ink/70" aria-hidden="true" />
          LIVE
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 font-mono text-[10.5px] text-foreground/80">
          <Lock size={10} className="text-teal" aria-hidden="true" />
          shop.ada-retail.ng
        </span>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          {checks.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-teal"
            >
              <Check size={11} strokeWidth={3} aria-hidden="true" />
              {c}
            </span>
          ))}
        </div>
      </div>
    </DetailShell>
  );
}

function StepDetail({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <BriefCard />;
    case 1:
      return <ScopeCard />;
    case 2:
      return <DesignCard />;
    case 3:
      return <BuildCard />;
    case 4:
      return <IntegrationsCard />;
    case 5:
      return <TestCard />;
    default:
      return <LaunchCard />;
  }
}
