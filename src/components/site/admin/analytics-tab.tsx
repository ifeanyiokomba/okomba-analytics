"use client";

/**
 * Analytics tab — Module 8C.
 *
 * Self-fetches GET /api/admin/analytics on mount and renders:
 *   - KPI grid (revenue MTD, paid count, AI conversion %, avg deal size)
 *   - 90-day revenue bar chart (hand-rolled SVG, no chart library)
 *   - Revenue-by-service table with totals
 *   - 30-day funnel events strip (ai_chat_start -> ... -> payment_proof_uploaded)
 *   - Module-8B backup trail + manual "Run backup now" action (POST /api/admin/backups)
 *
 * Light "paper" surface (section-light) sitting inside the dark admin
 * chrome -- readable report aesthetic with honey-gold accents. Matches
 * the payments-tab container rhythm (eyebrow / heading / muted sub)
 * but renders on the cream/white brand tokens instead of the dark ones.
 */

import { Fragment, useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Cloud,
  Database,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────── */

type BackupLog = {
  id: string;
  kind: string;
  target: string;
  status: string;
  fileName: string;
  sizeBytes: number;
  durationMs: number;
  error: string | null;
  createdAt: string;
};

type AnalyticsData = {
  ok: boolean;
  kpis: {
    revenueMtdNaira: number;
    revenueTotalNaira: number;
    outstandingNaira: number;
    paidCount: number;
    avgDealNaira: number;
    aiLeads: number;
    aiWon: number;
    aiConversionPct: number;
    draftsCount: number;
    invoicesTotal: number;
  };
  revenueByDay: { date: string; amountNaira: number }[];
  revenueByService: { service: string; amountNaira: number; paidCount: number }[];
  eventCounts: Record<string, number>;
  backups: {
    configured: boolean;
    cloudinary: boolean;
    retentionDays: number;
    logs: BackupLog[];
  };
  generatedAt: string;
};

type BackupRunResponse = {
  ok: boolean;
  backup: {
    ok: boolean;
    target?: string;
    fileName?: string;
    sizeBytes?: number;
    durationMs?: number;
    driveUrl?: string;
    error?: string;
  };
  configured?: boolean;
  cloudinary?: boolean;
  retentionDays?: number;
  logs?: BackupLog[];
};

/* ── Helpers ───────────────────────────────────────────── */

const fmtNaira = (n: number) => `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

function fmtBytes(n: number): string {
  if (!n || n <= 0) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDuration(ms: number): string {
  if (!ms || ms <= 0) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const diff = Date.now() - t;
  if (diff < 0) return "just now";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

const FUNNEL_ORDER = [
  "ai_chat_start",
  "portal_visit",
  "proposal_view",
  "pdf_download",
  "payment_click",
  "payment_proof_uploaded",
] as const;

const FUNNEL_LABELS: Record<string, string> = {
  ai_chat_start: "AI chat start",
  portal_visit: "Portal visit",
  proposal_view: "Proposal view",
  pdf_download: "PDF download",
  payment_click: "Payment click",
  payment_proof_uploaded: "Proof uploaded",
};

const EYEBROW = "font-mono text-[10px] uppercase tracking-[0.14em] text-[#C9910A]";
const CARD =
  "rounded-2xl border border-[#e4e1d8] bg-white p-5 transition-shadow hover:shadow-[0_14px_34px_-16px_rgba(201,145,10,0.24)]";

/* ── Component ─────────────────────────────────────────── */

export function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backing, setBacking] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  // auto-dismiss the inline toast after 3.5s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async (silent: boolean) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `HTTP ${res.status}`);
      }
      const j = (await res.json()) as AnalyticsData;
      if (!j.ok) throw new Error("Failed to load analytics");
      setData(j);
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const runBackup = useCallback(async () => {
    if (backing) return;
    setBacking(true);
    let ok = false;
    let msg = "Backup run failed";
    try {
      const res = await fetch("/api/admin/backups", { method: "POST" });
      const j = (await res.json().catch(() => null)) as BackupRunResponse | null;
      if (!res.ok || !j?.ok) {
        throw new Error(j?.backup?.error ?? "Backup run failed");
      }
      ok = true;
      const fn = j.backup.fileName ?? "backup";
      const sz = j.backup.sizeBytes ? ` · ${fmtBytes(j.backup.sizeBytes)}` : "";
      msg = `Backup saved → ${fn}${sz}`;
    } catch (err) {
      ok = false;
      msg = err instanceof Error ? err.message : "Backup run failed";
    } finally {
      setBacking(false);
      setToast({ text: msg, type: ok ? "ok" : "err" });
      // silently refresh the trail regardless of outcome
      void load(true);
    }
  }, [backing, load]);

  return (
    <section
      aria-label="Analytics dashboard"
      className="section-light relative rounded-3xl bg-[#f7f5ef] p-4 text-[#1c2333] sm:p-6 lg:p-8"
    >
      {/* Inline toast (relative to this tab, not window-fixed) */}
      {toast && (
        <div
          role="status"
          className={cn(
            "absolute right-4 top-4 z-50 max-w-xs rounded-xl border px-3.5 py-2.5 text-[12px] font-medium shadow-[0_12px_32px_-14px_rgba(20,25,38,0.3)]",
            toast.type === "ok"
              ? "border-[#00C9A7]/40 bg-[#00C9A7]/10 text-[#007a66]"
              : "border-red-500/40 bg-red-50 text-red-700",
          )}
        >
          {toast.text}
        </div>
      )}

      {/* Header strip */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className={EYEBROW}>MODULE 8C · ANALYTICS</p>
          <h1 className="mt-2 font-display text-[26px] font-bold leading-tight text-[#0B0F1A] sm:text-[30px]">
            {"Analytics & revenue"}
          </h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[#5a6373]">
            Revenue, conversion and funnel performance — pulled live from the first-party event store.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void load(true)}
            aria-label="Refresh analytics"
            className="inline-flex items-center gap-2 rounded-xl border border-[#e4e1d8] bg-white px-3.5 py-2.5 text-[12.5px] font-medium text-[#1c2333] transition-colors hover:border-[#C9910A]/45 hover:text-[#C9910A]"
          >
            <RefreshCw size={13} className={cn(refreshing && "animate-spin")} aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void runBackup()}
            disabled={backing}
            className="inline-flex items-center gap-2 rounded-xl bg-[#C9910A] px-4 py-2.5 text-[12.5px] font-semibold text-[#141926] transition-colors hover:bg-[#FFC94D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {backing ? (
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            ) : (
              <Database size={13} aria-hidden="true" />
            )}
            {backing ? "Backing up…" : "Run backup now"}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="mt-6 space-y-6">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load(false)} />
        ) : data ? (
          <>
            <KpiGrid kpis={data.kpis} />
            <RevenueChart days={data.revenueByDay} />
            <ServiceTable rows={data.revenueByService} />
            <FunnelStrip counts={data.eventCounts} />
            <BackupsCard backups={data.backups} />
          </>
        ) : null}
      </div>
    </section>
  );
}

/* ── KPI grid ──────────────────────────────────────────── */

type KpiCardDef = {
  eyebrow: string;
  value: string;
  sub: string;
  valueClass: string;
  icon?: typeof TrendingUp;
};

function KpiGrid({ kpis }: { kpis: AnalyticsData["kpis"] }) {
  const cards: KpiCardDef[] = [
    {
      eyebrow: "Revenue MTD",
      value: fmtNaira(kpis.revenueMtdNaira),
      sub: `Month-to-date · ${kpis.paidCount} paid`,
      valueClass: "text-[#C9910A]",
      icon: TrendingUp,
    },
    {
      eyebrow: "Paid invoices",
      value: String(kpis.paidCount),
      sub: `invoices settled · ${kpis.invoicesTotal} total`,
      valueClass: "text-[#0B0F1A]",
    },
    {
      eyebrow: "AI conversion",
      value: `${kpis.aiConversionPct}%`,
      sub: `${kpis.aiWon} won of ${kpis.aiLeads} AI leads`,
      valueClass: "text-[#00C9A7]",
    },
    {
      eyebrow: "Avg deal size",
      value: fmtNaira(kpis.avgDealNaira),
      sub: "per paid invoice",
      valueClass: "text-[#0B0F1A]",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.eyebrow} className={CARD}>
            <div className="flex items-start justify-between">
              <p className={EYEBROW}>{c.eyebrow}</p>
              {Icon ? <Icon size={15} className="text-[#C9910A]" aria-hidden="true" /> : null}
            </div>
            <p className={cn("mt-3 font-mono text-[26px] font-bold leading-none", c.valueClass)}>
              {c.value}
            </p>
            <p className="mt-2 text-[11.5px] text-[#5a6373]">{c.sub}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ── Revenue 90-day chart (hand-rolled SVG) ────────────── */

function RevenueChart({ days }: { days: AnalyticsData["revenueByDay"] }) {
  const sum = days.reduce((s, d) => s + d.amountNaira, 0);
  const max = days.reduce((m, d) => (d.amountNaira > m ? d.amountNaira : m), 0);
  const allZero = sum === 0;

  // viewBox 0 0 900 200, preserveAspectRatio="none" -> responsive, no JS measure.
  const VB_W = 900;
  const VB_H = 200;
  const PAD_TOP = 14;
  const BASE_Y = 182;
  const CHART_H = BASE_Y - PAD_TOP; // 168
  const GAP = 2;
  const n = days.length || 1;
  const barW = (VB_W - (n - 1) * GAP) / n;
  const y100 = PAD_TOP;
  const y50 = PAD_TOP + CHART_H / 2;

  return (
    <div className={cn(CARD, "sm:p-6")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0B0F1A]">{"Revenue · last 90 days"}</h2>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#5a6373]">
            ₦ per day
          </p>
        </div>
        <p className="font-mono text-[14px] font-semibold text-[#C9910A]">{fmtNaira(sum)}</p>
      </div>

      <div className="mt-5 overflow-x-auto">
        {allZero ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <TrendingUp size={26} className="text-[#C9910A]/35" aria-hidden="true" />
            <p className="max-w-md text-[13px] text-[#5a6373]">
              No paid revenue in this window yet — send your first proposal!
            </p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Revenue per day for the last 90 days"
            className="h-48 w-full"
          >
            {/* baseline grid: 100% (top), 50% (mid, dashed), 0% baseline */}
            <line
              x1={0}
              y1={y100}
              x2={VB_W}
              y2={y100}
              stroke="#e4e1d8"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={0}
              y1={y50}
              x2={VB_W}
              y2={y50}
              stroke="#e4e1d8"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              strokeDasharray="3 5"
            />
            <line
              x1={0}
              y1={BASE_Y}
              x2={VB_W}
              y2={BASE_Y}
              stroke="#c9c4b5"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            {days.map((d, i) => {
              const h =
                d.amountNaira > 0 ? Math.max(2, (d.amountNaira / (max || 1)) * CHART_H) : 0;
              const x = i * (barW + GAP);
              const y = BASE_Y - h;
              return (
                <rect
                  key={d.date}
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  fill="#C9910A"
                  rx={barW > 4 ? 1 : 0}
                  className="transition-[fill] duration-150 hover:fill-[#FFC94D]"
                >
                  <title>{`${d.date}: ${fmtNaira(d.amountNaira)}`}</title>
                </rect>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}

/* ── Revenue by service table ──────────────────────────── */

function ServiceTable({ rows }: { rows: AnalyticsData["revenueByService"] }) {
  const totalCount = rows.reduce((s, r) => s + r.paidCount, 0);
  const totalAmount = rows.reduce((s, r) => s + r.amountNaira, 0);

  return (
    <div className={cn(CARD, "sm:p-6")}>
      <h2 className="text-[15px] font-semibold text-[#0B0F1A]">Revenue by service</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#e4e1d8]">
              <th
                scope="col"
                className="py-2.5 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#5a6373]"
              >
                Service
              </th>
              <th
                scope="col"
                className="py-2.5 px-4 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-[#5a6373]"
              >
                Paid
              </th>
              <th
                scope="col"
                className="py-2.5 pl-4 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-[#5a6373]"
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-[12.5px] text-[#5a6373]">
                  No paid revenue yet.
                </td>
              </tr>
            ) : (
              <>
                {rows.map((r) => (
                  <tr key={r.service} className="border-b border-[#e4e1d8]/70">
                    <td className="py-3 pr-4 text-[#1c2333]">{r.service}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#1c2333]">{r.paidCount}</td>
                    <td className="py-3 pl-4 text-right font-mono font-semibold text-[#C9910A]">
                      {fmtNaira(r.amountNaira)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-[#C9910A]/30">
                  <td className="py-3 pr-4 font-semibold text-[#0B0F1A]">Total</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-[#0B0F1A]">
                    {totalCount}
                  </td>
                  <td className="py-3 pl-4 text-right font-mono font-bold text-[#C9910A]">
                    {fmtNaira(totalAmount)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Funnel events strip ───────────────────────────────── */

function FunnelStrip({ counts }: { counts: Record<string, number> }) {
  const total = FUNNEL_ORDER.reduce((s, k) => s + (counts[k] ?? 0), 0);

  return (
    <div className={cn(CARD, "sm:p-6")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[15px] font-semibold text-[#0B0F1A]">{"Funnel · last 30 days"}</h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5a6373]">
          {total} events
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-stretch gap-2 lg:flex-nowrap lg:gap-1.5">
        {FUNNEL_ORDER.map((key, i) => {
          const v = counts[key] ?? 0;
          return (
            <Fragment key={key}>
              <div className="flex min-w-[130px] flex-1 flex-col rounded-xl border border-[#e4e1d8] bg-[#f7f5ef] px-3.5 py-3">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#5a6373]">
                  {FUNNEL_LABELS[key]}
                </span>
                <span className="mt-1.5 font-mono text-[20px] font-bold leading-none text-[#0B0F1A]">
                  {v}
                </span>
              </div>
              {i < FUNNEL_ORDER.length - 1 && (
                <ArrowRight
                  size={15}
                  className="hidden self-center text-[#C9910A]/55 lg:block"
                  aria-hidden="true"
                />
              )}
            </Fragment>
          );
        })}
      </div>

      {total === 0 && (
        <p className="mt-3 text-[12px] text-[#5a6373]">
          No funnel events recorded yet — publish a proposal link to start the journey.
        </p>
      )}
    </div>
  );
}

/* ── Backups strip (Module 8B) ─────────────────────────── */

function BackupsCard({ backups }: { backups: AnalyticsData["backups"] }) {
  const last = backups.logs[0];

  return (
    <div className={cn(CARD, "sm:p-6")}>
      <div className="flex items-center gap-2">
        <Cloud size={16} className="text-[#C9910A]" aria-hidden="true" />
        <h2 className="text-[15px] font-semibold text-[#0B0F1A]">Backups · Module 8B</h2>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Pill tone={backups.configured ? "ok" : "warn"}>
          {backups.configured ? "Google Drive configured" : "Local only · Drive not configured"}
        </Pill>
        <Pill tone={backups.cloudinary ? "ok" : "warn"}>
          {backups.cloudinary ? "Cloudinary connected" : "Cloudinary not configured"}
        </Pill>
        <span className="font-mono text-[11px] text-[#5a6373]">
          Local rotation: {backups.retentionDays} days
        </span>
      </div>

      {/* Last backup row */}
      <div className="mt-4 rounded-xl border border-[#e4e1d8] bg-[#f7f5ef] p-3.5">
        {last ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <FileText size={14} className="text-[#C9910A]" aria-hidden="true" />
            <span className="font-mono text-[11.5px] text-[#1c2333]">{last.fileName}</span>
            <span className="font-mono text-[10.5px] text-[#5a6373]">
              {fmtBytes(last.sizeBytes)}
            </span>
            <span className="font-mono text-[10.5px] text-[#5a6373]">
              {fmtDuration(last.durationMs)}
            </span>
            <Pill tone={last.status === "success" ? "ok" : "fail"} small>
              {last.status}
            </Pill>
            <span className="font-mono text-[10.5px] text-[#5a6373]">
              {relativeTime(last.createdAt)}
            </span>
            {last.error && (
              <span className="text-[11px] text-red-600">{last.error}</span>
            )}
          </div>
        ) : (
          <p className="text-[12.5px] text-[#5a6373]">No backups yet — run one now.</p>
        )}
      </div>

      {/* Helpers when something is not configured */}
      {(!backups.configured || !backups.cloudinary) && (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-[#e4e1d8] bg-[#f7f5ef] p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] leading-relaxed text-[#5a6373]">
            {!backups.cloudinary && (
              <>
                Set{" "}
                <code className="rounded bg-white px-1 py-0.5 font-mono text-[10.5px] text-[#C9910A]">
                  CLOUDINARY_URL
                </code>{" "}
                to enable media backups.{" "}
              </>
            )}
            {!backups.configured && (
              <>
                Set{" "}
                <code className="rounded bg-white px-1 py-0.5 font-mono text-[10.5px] text-[#C9910A]">
                  GOOGLE_SERVICE_ACCOUNT_JSON
                </code>{" "}
                +{" "}
                <code className="rounded bg-white px-1 py-0.5 font-mono text-[10.5px] text-[#C9910A]">
                  GOOGLE_DRIVE_FOLDER_ID
                </code>{" "}
                to enable Drive uploads.
              </>
            )}
          </p>
          {!backups.cloudinary && (
            <a
              href="https://cloudinary.com/console"
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#e4e1d8] bg-white px-3 py-1.5 text-[11.5px] font-medium text-[#1c2333] transition-colors hover:border-[#C9910A]/45 hover:text-[#C9910A]"
            >
              <ExternalLink size={12} aria-hidden="true" /> Configure Cloudinary
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Pill ──────────────────────────────────────────────── */

function Pill({
  tone,
  children,
  small,
}: {
  tone: "ok" | "warn" | "fail";
  children: ReactNode;
  small?: boolean;
}) {
  const styles: Record<"ok" | "warn" | "fail", string> = {
    ok: "border-[#00C9A7]/35 bg-[#00C9A7]/10 text-[#007a66]",
    warn: "border-amber-500/40 bg-amber-50 text-amber-700",
    fail: "border-red-500/40 bg-red-50 text-red-700",
  };
  const Icon = tone === "ok" ? ShieldCheck : AlertTriangle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-mono uppercase tracking-wider",
        small ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[9.5px]",
        styles[tone],
      )}
    >
      <Icon size={10} aria-hidden="true" />
      {children}
    </span>
  );
}

/* ── Loading + error states ────────────────────────────── */

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-[#e4e1d8] bg-white/70"
          />
        ))}
      </div>
      <div className="rounded-2xl border border-[#e4e1d8] bg-white p-5 sm:p-6">
        <div className="h-4 w-40 animate-pulse rounded bg-[#e4e1d8]/60" />
        <div className="mt-6 flex h-48 items-center justify-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#5a6373]">
            Loading analytics…
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-40 animate-pulse rounded-2xl border border-[#e4e1d8] bg-white/70" />
        <div className="h-40 animate-pulse rounded-2xl border border-[#e4e1d8] bg-white/70" />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-red-500/30 bg-red-50 p-8 text-center"
    >
      <AlertTriangle size={26} className="text-red-500" aria-hidden="true" />
      <p className="max-w-md text-[13px] text-red-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-white px-4 py-2 text-[12.5px] font-medium text-red-700 transition-colors hover:bg-red-500/10"
      >
        <RefreshCw size={13} aria-hidden="true" /> Retry
      </button>
    </div>
  );
}
