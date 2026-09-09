"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ExternalLink, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WORKFLOW_STEP_STYLES, type WorkflowReport } from "@/lib/campaigns-shared";
import type { Inquiry } from "./types";

/* ─────────────────────────────────────────────────────────────
   BATCH 12 (§54) — "Run AI workflow" report dialog.

   Opened per inquiry from the Inquiries tab: POSTs
   /api/admin/ai/workflow/run {inquiryId} and renders the
   step-by-step report (ok/skipped/parked/failed status dots +
   details). "Open AI Monitor" jumps to the Autonomy approval
   queue where parked sends wait for review.
   ───────────────────────────────────────────────────────────── */

export function AiWorkflowDialog({
  inquiry,
  notify,
  onOpenAiMonitor,
  onClose,
}: {
  inquiry: Inquiry;
  notify: (text: string, type?: "ok" | "err") => void;
  onOpenAiMonitor: () => void;
  onClose: () => void;
}) {
  const [report, setReport] = useState<WorkflowReport | null>(null);
  const [running, setRunning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !running) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [running, onClose]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const run = async () => {
      try {
        const res = await fetch("/api/admin/ai/workflow/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inquiryId: inquiry.id }),
        });
        const j = (await res.json().catch(() => null)) as
          | { ok: boolean; report?: WorkflowReport; error?: string }
          | null;
        if (!res.ok || !j?.ok || !j.report) {
          setError(j?.error ?? "Workflow run failed");
          notify(j?.error ?? "Workflow run failed", "err");
          return;
        }
        setReport(j.report);
      } catch {
        setError("Network error — workflow run failed");
        notify("Network error — workflow run failed", "err");
      } finally {
        setRunning(false);
      }
    };
    void run();
  }, [inquiry.id, notify]);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="AI workflow report"
      onClick={(e) => e.target === e.currentTarget && !running && onClose()}
    >
      <div className="section-dark relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float sm:rounded-3xl [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
        <header className="relative shrink-0 border-b border-white/[0.07] p-5">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gold/[0.1] blur-2xl"
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow flex items-center gap-1.5 text-[9px] text-gold">
                <Sparkles size={11} aria-hidden="true" /> AI · Autonomous workflow
              </p>
              <h2 className="mt-1.5 font-display text-[17px] font-bold text-foreground">
                {inquiry.name}
              </h2>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                {inquiry.service} · {inquiry.email}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={running}
              aria-label="Close"
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 [scrollbar-width:thin]">
          {running ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <Loader2 size={26} className="animate-spin text-gold" aria-label="Running workflow" />
              <p className="text-[13px] font-medium text-foreground">Running the §54 workflow…</p>
              <p className="max-w-xs text-[11.5px] leading-relaxed text-muted-foreground">
                CRM context → service match → pricing check → draft → send per autonomy policy → follow-up.
              </p>
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-[12.5px] text-red-300"
            >
              {error}
            </div>
          ) : report ? (
            <>
              <div
                role="status"
                className={cn(
                  "mb-4 flex items-start gap-2.5 rounded-xl border px-4 py-3",
                  report.invoiceNumber
                    ? "border-teal/30 bg-teal/[0.08] text-teal"
                    : report.steps.some((s) => s.status === "pending_approval")
                      ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                      : "border-white/[0.1] bg-white/[0.03] text-foreground/90"
                )}
              >
                <Check size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p className="text-[12.5px] font-medium leading-relaxed">{report.outcome}</p>
              </div>

              <ol className="flex flex-col gap-2.5" aria-label="Workflow steps">
                {report.steps.map((s, idx) => {
                  const style = WORKFLOW_STEP_STYLES[s.status] ?? { dot: "bg-white/35", label: s.status };
                  return (
                    <li key={`${s.step}-${idx}`} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                      <span className="flex flex-col items-center gap-1 pt-0.5">
                        <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} aria-hidden="true" />
                        {idx < report.steps.length - 1 && (
                          <span className="h-4 w-px bg-white/10" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-baseline gap-x-2.5">
                          <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-foreground">
                            {s.step.replace(/_/g, " ")}
                          </span>
                          <span className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">
                            {style.label}
                          </span>
                        </p>
                        <p className="mt-1 break-words text-[12px] leading-relaxed text-muted-foreground">
                          {s.detail}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-white/[0.07] bg-white/[0.015] p-5">
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              disabled={running}
              className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              Close
            </button>
            <button
              onClick={onOpenAiMonitor}
              disabled={running}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/45 bg-gold-dim px-5 py-2.5 text-[13px] font-semibold text-gold transition-all hover:bg-gold/20 disabled:opacity-50"
            >
              <ExternalLink size={14} aria-hidden="true" />
              Open AI Monitor
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
