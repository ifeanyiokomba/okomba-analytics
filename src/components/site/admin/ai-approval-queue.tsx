"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  History,
  Inbox,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AI_ACTION_LABELS,
  AI_ACTION_STATUSES,
  AI_ACTION_STATUS_LABELS,
  AI_ACTION_STATUS_STYLES,
  AI_ACTIONS,
  AI_LEVEL_META,
  type AiActionSummary,
  type AiLevel,
} from "@/lib/campaigns-shared";
import { formatNaira, timeAgo } from "./types";

/* ─────────────────────────────────────────────────────────────
   BATCH 12 (§53/§55) — approval queue + recent activity log.

   GET /api/admin/ai/actions — pending_approval rows render as
   the review-mode queue (expandable pretty draft preview,
   Approve/Decline executes the parked payload); everything else
   renders as the recent activity ledger with status + action
   filter chips. Auto-refresh every 10s while the sub-tab is
   visible.
   ───────────────────────────────────────────────────────────── */

const POLL_MS = 10_000;

export function AiApprovalQueue({
  notify,
  active,
  onOpenAudit,
  onActionsLoaded,
}: {
  notify: (text: string, type?: "ok" | "err") => void;
  active: boolean;
  onOpenAudit: () => void;
  onActionsLoaded: (actions: AiActionSummary[]) => void;
}) {
  const [queue, setQueue] = useState<AiActionSummary[]>([]);
  const [actions, setActions] = useState<AiActionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Activity-log filters */
  const [statusFilter, setStatusFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const load = useCallback(async () => {
    try {
      const [queueRes, allRes] = await Promise.all([
        fetch("/api/admin/ai/actions?status=pending_approval&limit=50", { cache: "no-store" }),
        fetch("/api/admin/ai/actions?limit=50", { cache: "no-store" }),
      ]);
      if (queueRes.ok) {
        const j = (await queueRes.json()) as { ok: boolean; actions?: AiActionSummary[] };
        if (j.ok) setQueue(j.actions ?? []);
      }
      if (allRes.ok) {
        const j = (await allRes.json()) as { ok: boolean; actions?: AiActionSummary[] };
        if (j.ok) {
          setActions(j.actions ?? []);
          onActionsLoaded(j.actions ?? []);
        }
      }
    } catch {
      /* transient */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onActionsLoaded]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [active, load]);

  const refresh = () => {
    setRefreshing(true);
    void load();
  };

  /* ── Approve / decline (§53 review mode) ── */
  const decide = async (row: AiActionSummary, verb: "approve" | "decline") => {
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/ai/actions/${row.id}/${verb}`, { method: "POST" });
      const j = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string; result?: { invoiceNumber?: string; emailLogId?: string; status?: string } }
        | null;
      if (!res.ok || !j?.ok) {
        notify(j?.error ?? `${verb === "approve" ? "Approval" : "Decline"} failed`, "err");
        return;
      }
      if (verb === "approve") {
        const inv = j.result?.invoiceNumber;
        notify(inv ? `Approved — invoice ${inv} created` : "Approved — parked action executed", "ok");
      } else {
        notify("Declined — the AI will not perform this action", "ok");
      }
      void load();
    } catch {
      notify("Network error — action failed", "err");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(
    () =>
      actions.filter(
        (a) => (!statusFilter || a.status === statusFilter) && (!actionFilter || a.action === actionFilter)
      ),
    [actions, statusFilter, actionFilter]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* ── Approval queue ── */}
      <section className="surface-card overflow-hidden" aria-label="AI approval queue">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10">
              <Inbox size={16} className="text-amber-300" aria-hidden="true" />
              {queue.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 font-mono text-[9.5px] font-bold text-ink">
                  {queue.length}
                </span>
              )}
            </span>
            <div>
              <h2 className="text-[14.5px] font-semibold text-foreground">Approval queue</h2>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                Actions parked for your review (§53 review mode) — approving executes the payload.
              </p>
            </div>
          </div>
          <button
            onClick={refresh}
            aria-label="Refresh approval queue"
            title="Refresh approval queue"
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 self-start rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2 text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
          >
            {refreshing ? (
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw size={13} aria-hidden="true" />
            )}
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={20} className="animate-spin text-gold" aria-label="Loading approval queue" />
          </div>
        ) : queue.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Check size={22} className="mx-auto text-teal/70" aria-hidden="true" />
            <p className="mt-3 text-[12.5px] text-muted-foreground">
              Queue is clear — nothing is waiting for your approval.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {queue.map((row) => (
              <QueueRow
                key={row.id}
                row={row}
                busy={busyId === row.id}
                expanded={expandedId === row.id}
                onToggle={() => setExpandedId((cur) => (cur === row.id ? null : row.id))}
                onApprove={() => void decide(row, "approve")}
                onDecline={() => void decide(row, "decline")}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Recent activity ── */}
      <section className="surface-card overflow-hidden" aria-label="AI action activity log">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal/25 bg-teal-dim">
                <Clock size={16} className="text-teal" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-[14.5px] font-semibold text-foreground">Recent activity</h2>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                  Every autonomous action — executed, parked, declined or blocked.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenAudit}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2 text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              <History size={12} aria-hidden="true" />
              View audit trail
              <ChevronRight size={11} aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by status">
              <span className="mr-1 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">Status</span>
              <FilterChip label="All" on={statusFilter === ""} onClick={() => setStatusFilter("")} />
              {AI_ACTION_STATUSES.map((s) => (
                <FilterChip
                  key={s}
                  label={AI_ACTION_STATUS_LABELS[s] ?? s}
                  on={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by action">
              <span className="mr-1 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">Action</span>
              <FilterChip label="All" on={actionFilter === ""} onClick={() => setActionFilter("")} />
              {AI_ACTIONS.map((a) => (
                <FilterChip
                  key={a}
                  label={AI_ACTION_LABELS[a]}
                  on={actionFilter === a}
                  onClick={() => setActionFilter(a)}
                />
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={20} className="animate-spin text-gold" aria-label="Loading activity" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-[12.5px] text-muted-foreground">No actions recorded yet.</p>
          </div>
        ) : (
          <div className="max-h-96 divide-y divide-white/[0.04] overflow-y-auto [scrollbar-width:thin]">
            {filtered.map((row) => (
              <ActivityRow key={row.id} row={row} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Queue row (expandable draft preview + decisions) ────── */

function QueueRow({
  row,
  busy,
  expanded,
  onToggle,
  onApprove,
  onDecline,
}: {
  row: AiActionSummary;
  busy: boolean;
  expanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const levelMeta = AI_LEVEL_META[(row.level as AiLevel) ?? "review"] ?? AI_LEVEL_META.review;
  return (
    <article className="px-5 py-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold",
              AI_ACTION_STATUS_STYLES.pending_approval
            )}
          >
            {AI_ACTION_STATUS_LABELS.pending_approval}
          </span>
          <span className="text-[13px] font-semibold text-foreground">{actionLabel(row.action)}</span>
          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-medium", levelMeta.chip)}>
            {levelMeta.label}
          </span>
          <span className="ml-auto flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
            <span className="rounded-full bg-white/[0.05] px-2 py-0.5 capitalize">{row.trigger}</span>
            {timeAgo(row.createdAt)}
          </span>
        </div>

        {row.customerEmail && (
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[12px]">
            <span className="font-mono text-muted-foreground/80">{row.customerEmail}</span>
            {typeof row.draftJson?.service === "string" && (
              <span className="text-foreground/90">{String(row.draftJson.service)}</span>
            )}
            {typeof row.draftJson?.amountNaira === "number" && (
              <span className="font-mono font-semibold text-gold">{formatNaira(Number(row.draftJson.amountNaira))}</span>
            )}
          </p>
        )}
        {row.error && (
          <p className="text-[11px] italic text-muted-foreground/80">Why parked: {row.error}</p>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onApprove}
            disabled={busy}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gold/60 bg-gold px-4 py-2.5 text-[12.5px] font-semibold text-ink transition-all hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
            Approve
          </button>
          <button
            onClick={onDecline}
            disabled={busy}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-red-500/40 bg-transparent px-4 py-2.5 text-[12.5px] font-semibold text-red-300 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
            Decline
          </button>
          <button
            onClick={onToggle}
            aria-expanded={expanded}
            className="ml-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 py-2 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-gold"
          >
            {expanded ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronRight size={13} aria-hidden="true" />}
            {expanded ? "Hide preview" : "Preview draft"}
          </button>
        </div>

        {expanded && row.draftJson && <DraftPreview draft={row.draftJson} />}
      </div>
    </article>
  );
}

/* ── Pretty draft preview (known keys rendered, rest folded) ── */

const DRAFT_LABELS: Record<string, string> = {
  service: "Service",
  amountNaira: "Amount",
  durationLabel: "Duration",
  customerName: "Customer",
  customerEmail: "Email",
  paymentMethodPreview: "Payment method",
  proposalSummary: "Summary",
  to: "To",
  subject: "Subject",
  body: "Body",
  name: "Campaign",
  recipientCount: "Recipients",
  subjectTemplate: "Subject template",
};

function DraftPreview({ draft }: { draft: Record<string, unknown> }) {
  const [showDetails, setShowDetails] = useState(false);

  const known: { label: string; value: string; mono?: boolean; block?: boolean }[] = [];
  const rest: [string, unknown][] = [];

  for (const [key, value] of Object.entries(draft)) {
    if (key in DRAFT_LABELS) {
      if (key === "amountNaira" && typeof value === "number") {
        known.push({ label: DRAFT_LABELS[key], value: formatNaira(value), mono: true });
      } else if (typeof value === "string") {
        const block = key === "body" || key === "proposalSummary" || key === "subjectTemplate";
        known.push({ label: DRAFT_LABELS[key], value: value || "—", block });
      } else if (typeof value === "number") {
        known.push({ label: DRAFT_LABELS[key], value: String(value), mono: true });
      }
    } else if (value !== null && value !== undefined && key !== "proposal" && key !== "ctaUrl" && key !== "ctaLabel") {
      rest.push([key, value]);
    }
  }

  return (
    <div className="mt-1 rounded-xl border border-white/[0.07] bg-[#07090f]/60 px-4 py-3.5">
      <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {known.map((k) => (
          <p key={k.label} className={cn("flex min-w-0 flex-col gap-1", k.block && "sm:col-span-2")}>
            <span className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">{k.label}</span>
            <span
              className={cn(
                "min-w-0 break-words text-[12px] leading-relaxed text-foreground",
                k.mono && "font-mono text-[11.5px] text-gold"
              )}
            >
              {k.value}
            </span>
          </p>
        ))}
      </div>

      {(rest.length > 0 || draft.proposal !== undefined) && (
        <div className="mt-3 border-t border-white/[0.06] pt-2.5">
          <button
            onClick={() => setShowDetails((s) => !s)}
            aria-expanded={showDetails}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-gold"
          >
            {showDetails ? <ChevronDown size={11} aria-hidden="true" /> : <ChevronRight size={11} aria-hidden="true" />}
            details
          </button>
          {showDetails && (
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/30 px-3 py-2.5 font-mono text-[10px] leading-relaxed text-muted-foreground [scrollbar-width:thin]">
              {JSON.stringify(
                Object.fromEntries(rest.length > 0 ? rest : [["proposal", draft.proposal]]),
                null,
                2
              )}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Activity row ───────────────────────────────────────── */

function ActivityRow({ row }: { row: AiActionSummary }) {
  const summary = resultSummary(row);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[9.5px] font-semibold",
          AI_ACTION_STATUS_STYLES[row.status] ?? "border-white/15 bg-white/[0.04] text-muted-foreground"
        )}
      >
        {AI_ACTION_STATUS_LABELS[row.status] ?? row.status}
      </span>
      <span className="shrink-0 text-[12.5px] font-medium text-foreground">{actionLabel(row.action)}</span>
      {row.customerEmail && (
        <span className="min-w-0 max-w-full truncate font-mono text-[10.5px] text-muted-foreground">
          {row.customerEmail}
        </span>
      )}
      {summary && (
        <span className="shrink-0 font-mono text-[10.5px] text-teal">{summary}</span>
      )}
      <span className="ml-auto flex shrink-0 items-center gap-2 font-mono text-[9.5px] text-muted-foreground/70">
        {row.actor && <span className="max-w-[140px] truncate capitalize">{row.actor.split("@")[0]}</span>}
        {timeAgo(row.createdAt)}
      </span>
    </div>
  );
}

function actionLabel(action: string): string {
  const known = AI_ACTIONS.find((a) => a === action);
  return known ? AI_ACTION_LABELS[known] : action;
}

function resultSummary(row: AiActionSummary): string | null {
  if (row.status === "executed" && row.resultJson) {
    if (typeof row.resultJson.invoiceNumber === "string") return String(row.resultJson.invoiceNumber);
    if (row.action === "campaign.send") {
      const sent = row.resultJson.sent;
      const failed = row.resultJson.failed;
      if (typeof sent === "number") return `${sent} sent${typeof failed === "number" && failed > 0 ? ` · ${failed} failed` : ""}`;
    }
    if (row.action === "email.followup") return "delivered";
  }
  if (row.status === "blocked" && row.error) return `blocked: ${row.error.slice(0, 60)}`;
  return null;
}

/* ── Filter chip ────────────────────────────────────────── */

function FilterChip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "rounded-full border px-2.5 py-1.5 text-[10.5px] font-medium transition-colors",
        on
          ? "border-gold/45 bg-gold-dim text-gold"
          : "border-white/[0.09] bg-white/[0.03] text-muted-foreground hover:border-gold/35 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
