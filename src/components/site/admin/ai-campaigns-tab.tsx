"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Loader2,
  Megaphone,
  PenLine,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_STYLES,
  campaignAudienceSummary,
  maskEmail,
  type CampaignPreviewRow,
  type CampaignRecipientRow,
  type CampaignSendReport,
  type CampaignSummary,
} from "@/lib/campaigns-shared";
import { formatTimestamp, timeAgo } from "./types";
import { CampaignBuilderDialog } from "./campaign-builder-dialog";
import { PreviewCard } from "./campaign-preview-card";

/* ─────────────────────────────────────────────────────────────
   BATCH 12 (§56/§57) — Campaigns top-level admin tab.

   Self-fetching (whatsapp-tab pattern — no dashboard load()
   changes): GET /api/admin/ai/campaigns list + stat mini-cards;
   desktop list|detail split, mobile stacks with a back button.
   Detail: template + masked per-recipient previews (§56
   preview-before-send), recipient ledger, approve (confirm —
   it arms sending) + batch send (§56 gate, progress, toast).
   ───────────────────────────────────────────────────────────── */

const RECIPIENT_STATUS_STYLES: Record<string, string> = {
  queued: "border-white/15 bg-white/[0.04] text-muted-foreground",
  sent: "border-teal/35 bg-teal-dim text-teal",
  failed: "border-red-500/30 bg-red-500/10 text-red-300",
  skipped: "border-amber-400/35 bg-amber-400/10 text-amber-300",
};

export function AiCampaignsTab({ notify }: { notify: (text: string, type?: "ok" | "err") => void }) {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    campaign: CampaignSummary;
    recipients: CampaignRecipientRow[];
    previews: CampaignPreviewRow[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<CampaignSummary | null>(null);

  const [busy, setBusy] = useState<"approve" | "send" | "regenerate" | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);

  /* ── List loader ── */
  const loadList = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai/campaigns", { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as { ok: boolean; campaigns?: CampaignSummary[] };
      if (j.ok) setCampaigns(j.campaigns ?? []);
    } catch {
      /* transient */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  /* ── Detail loader (recipients + previews re-fetch) ── */
  const loadDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ai/campaigns/${id}`, { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as {
        ok: boolean;
        campaign?: CampaignSummary;
        recipients?: CampaignRecipientRow[];
        previews?: CampaignPreviewRow[];
      };
      if (j.ok && j.campaign) {
        setDetail({ campaign: j.campaign, recipients: j.recipients ?? [], previews: j.previews ?? [] });
      }
    } catch {
      /* transient */
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (activeId) {
      setLoadingDetail(true);
      void loadDetail(activeId);
    } else {
      setDetail(null);
    }
  }, [activeId, loadDetail]);

  const openCampaign = (id: string) => {
    setActiveId(id);
    setConfirmApprove(false);
    setMobileView("detail");
  };

  const refresh = () => {
    setRefreshing(true);
    void loadList();
    if (activeId) void loadDetail(activeId);
  };

  /* ── §56 approve (arms sending — confirm popover) ── */
  const approve = async () => {
    if (!detail) return;
    setBusy("approve");
    try {
      const res = await fetch(`/api/admin/ai/campaigns/${detail.campaign.id}/approve`, { method: "POST" });
      const j = (await res.json().catch(() => null)) as { ok: boolean; campaign?: CampaignSummary; error?: string } | null;
      if (!res.ok || !j?.ok) {
        notify(j?.error ?? "Approval failed", "err");
        return;
      }
      notify("Campaign approved — sending is armed", "ok");
      setConfirmApprove(false);
      void loadDetail(detail.campaign.id);
      void loadList();
    } catch {
      notify("Network error — approval failed", "err");
    } finally {
      setBusy(null);
    }
  };

  /* ── §56 batch send (progress state + result toast) ── */
  const send = async () => {
    if (!detail || detail.campaign.status !== "approved") return;
    setSending(true);
    setBusy("send");
    try {
      const res = await fetch(`/api/admin/ai/campaigns/${detail.campaign.id}/send`, { method: "POST" });
      const j = (await res.json().catch(() => null)) as
        | { ok: boolean; report?: CampaignSendReport; error?: string }
        | null;
      if (!res.ok || !j?.report) {
        notify(j?.error ?? "Send failed", "err");
        return;
      }
      const r = j.report;
      if (r.sent > 0 || r.status === "sent" || r.status === "partial") {
        notify(
          `Campaign ${r.status === "partial" ? "partially " : ""}sent — ${r.sent} delivered${r.failed > 0 ? ` · ${r.failed} failed` : ""}${r.skipped > 0 ? ` · ${r.skipped} skipped` : ""}`,
          r.failed > 0 && r.sent === 0 ? "err" : "ok"
        );
      } else if (r.stoppedReason) {
        notify(r.stoppedReason, "err");
      } else {
        notify(j.ok ? "Send completed" : `Send failed — ${r.status}`, j.ok ? "ok" : "err");
      }
      void loadDetail(detail.campaign.id);
      void loadList();
    } catch {
      notify("Network error — send failed", "err");
    } finally {
      setSending(false);
      setBusy(null);
    }
  };

  /* ── Regenerate (draft only) ── */
  const regenerate = async () => {
    if (!detail) return;
    setBusy("regenerate");
    try {
      const res = await fetch(`/api/admin/ai/campaigns/${detail.campaign.id}/generate`, { method: "POST" });
      const j = (await res.json().catch(() => null)) as { ok: boolean; campaign?: CampaignSummary; error?: string } | null;
      if (!res.ok || !j?.ok) {
        notify(j?.error ?? "Regeneration failed", "err");
        return;
      }
      notify("Templates regenerated with AI", "ok");
      void loadDetail(detail.campaign.id);
    } catch {
      notify("Network error — regeneration failed", "err");
    } finally {
      setBusy(null);
    }
  };

  /* ── Stat mini-cards ── */
  const stats = useMemo(
    () => ({
      drafts: campaigns.filter((c) => c.status === "draft").length,
      pending: campaigns.filter((c) => c.status === "pending_approval").length,
      sentCampaigns: campaigns.filter((c) => c.status === "sent" || c.status === "partial").length,
      emailsSent: campaigns.reduce((sum, c) => sum + c.sentCount, 0),
    }),
    [campaigns]
  );

  const activeRow = useMemo(() => campaigns.find((c) => c.id === activeId) ?? null, [campaigns, activeId]);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="surface-card flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim">
            <Megaphone size={16} className="text-gold" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[14.5px] font-semibold text-foreground">Campaigns</h2>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              AI-generated, per-recipient personalized email campaigns (§56/§57)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            aria-label="Refresh campaigns"
            title="Refresh campaigns"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-white/[0.09] bg-white/[0.03] px-2.5 py-2 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
          >
            {refreshing ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={13} aria-hidden="true" />}
          </button>
          <button
            onClick={() => {
              setEditCampaign(null);
              setBuilderOpen(true);
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gold/60 bg-gold px-4 py-2.5 text-[12.5px] font-semibold text-ink transition-all hover:bg-gold-light"
          >
            <Plus size={14} aria-hidden="true" />
            New campaign
          </button>
        </div>
      </div>

      {/* ── Stat mini-cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Drafts" value={stats.drafts} icon={<PenLine size={14} className="text-muted-foreground" aria-hidden="true" />} tone="text-muted-foreground" />
        <StatCard label="Awaiting approval" value={stats.pending} icon={<Clock size={14} className="text-amber-300" aria-hidden="true" />} tone="text-amber-300" />
        <StatCard label="Sent campaigns" value={stats.sentCampaigns} icon={<Check size={14} className="text-teal" aria-hidden="true" />} tone="text-teal" />
        <StatCard label="Emails sent" value={stats.emailsSent} icon={<Send size={14} className="text-gold" aria-hidden="true" />} tone="text-gold" />
      </div>

      {/* ── List | detail split ── */}
      <div className="surface-card grid overflow-hidden md:grid-cols-[320px_1fr]" style={{ minHeight: "480px" }}>
        {/* Left — campaign list */}
        <aside
          className={cn("flex flex-col border-white/[0.06] md:border-r", mobileView === "detail" && "hidden md:flex")}
          aria-label="Campaign list"
        >
          <div className="max-h-[560px] flex-1 overflow-y-auto [scrollbar-width:thin]">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={20} className="animate-spin text-gold" aria-label="Loading campaigns" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Megaphone size={22} className="mx-auto text-muted-foreground/40" aria-hidden="true" />
                <p className="mt-3 text-[12px] text-muted-foreground">
                  No campaigns yet — build your first AI campaign.
                </p>
              </div>
            ) : (
              campaigns.map((c) => {
                const isActive = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => openCampaign(c.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "flex w-full flex-col gap-1.5 border-b border-white/[0.04] px-4 py-3.5 text-left transition-colors",
                      isActive ? "bg-gold/[0.08]" : "hover:bg-white/[0.03]"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{c.name}</span>
                      <span className="shrink-0 font-mono text-[9.5px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-semibold",
                          CAMPAIGN_STATUS_STYLES[c.status] ?? "border-white/15 bg-white/[0.04] text-muted-foreground"
                        )}
                      >
                        {CAMPAIGN_STATUS_LABELS[c.status] ?? c.status}
                      </span>
                      <span className="font-mono text-[9.5px] text-muted-foreground">
                        {c.status === "sent" || c.status === "partial"
                          ? `${c.sentCount}/${c.recipientCount} sent`
                          : `${c.recipientCount} recipients`}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right — detail */}
        <section
          className={cn("flex min-h-[420px] flex-col", mobileView === "list" && "hidden md:flex")}
          aria-label="Campaign detail"
        >
          {detail && activeRow ? (
            <>
              {/* Detail header */}
              <header className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
                <button
                  onClick={() => setMobileView("list")}
                  aria-label="Back to campaign list"
                  className="rounded-lg border border-white/[0.09] bg-white/[0.03] p-1.5 text-muted-foreground transition-colors hover:text-foreground md:hidden"
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                </button>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[13.5px] font-semibold text-foreground">{detail.campaign.name}</h3>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10.5px] text-muted-foreground">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 font-semibold",
                        CAMPAIGN_STATUS_STYLES[detail.campaign.status] ?? "border-white/15 bg-white/[0.04] text-muted-foreground"
                      )}
                    >
                      {CAMPAIGN_STATUS_LABELS[detail.campaign.status] ?? detail.campaign.status}
                    </span>
                    <span>{campaignAudienceSummary(detail.campaign.audience)}</span>
                    <span className="font-mono">
                      {detail.campaign.status === "sent" || detail.campaign.status === "partial"
                        ? `${detail.campaign.sentCount}/${detail.campaign.recipientCount} sent`
                        : `${detail.campaign.recipientCount} recipients`}
                    </span>
                  </p>
                </div>
                {detail.campaign.usedFallback && (
                  <span className="hidden shrink-0 items-center rounded-full border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[9.5px] font-semibold text-amber-300 sm:inline-flex">
                    fallback template
                  </span>
                )}
              </header>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
                {loadingDetail ? (
                  <div className="flex justify-center py-10">
                    <Loader2 size={18} className="animate-spin text-gold" aria-label="Loading campaign detail" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-5 px-4 py-5">
                    {/* Meta */}
                    <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-2">
                      <MetaRow label="Created" value={formatTimestamp(detail.campaign.createdAt)} mono />
                      {detail.campaign.goal && <MetaRow label="Goal" value={detail.campaign.goal} />}
                      {detail.campaign.approvedBy && (
                        <MetaRow label="Approved by" value={detail.campaign.approvedBy} mono />
                      )}
                      {detail.campaign.sentAt && <MetaRow label="Sent at" value={formatTimestamp(detail.campaign.sentAt)} mono />}
                      {detail.campaign.failedCount > 0 && (
                        <MetaRow label="Failed" value={String(detail.campaign.failedCount)} mono />
                      )}
                    </div>

                    {/* Template (§57 tokens visible) */}
                    <div>
                      <p className="mb-2 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">
                        Template
                      </p>
                      <div className="rounded-xl border border-white/[0.07] bg-[#07090f]/60 px-4 py-3.5">
                        <p className="break-words text-[13px] font-semibold text-foreground">
                          {detail.campaign.subjectTemplate || "—"}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap break-words font-mono text-[11.5px] leading-relaxed text-muted-foreground">
                          {detail.campaign.bodyTemplate || "—"}
                        </p>
                        {detail.campaign.ctaLabel && (
                          <span className="mt-3 inline-flex items-center rounded-lg border border-gold/40 bg-gold-dim px-3 py-1.5 text-[11px] font-semibold text-gold">
                            {detail.campaign.ctaLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Masked previews (§56) */}
                    <div>
                      <p className="mb-2 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">
                        Per-recipient previews (masked)
                      </p>
                      {detail.previews.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {detail.previews.map((p, i) => (
                            <PreviewCard
                              key={i}
                              email={p.email}
                              subject={p.subject}
                              body={p.body}
                              subjectTemplate={detail.campaign.subjectTemplate}
                              bodyTemplate={detail.campaign.bodyTemplate}
                              ctaLabel={detail.campaign.ctaLabel}
                            />
                          ))}
                          <p className="text-[10.5px] text-muted-foreground/70">
                            §57 privacy — each email is rendered per-recipient from their own record only.
                          </p>
                        </div>
                      ) : (
                        <p className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[12px] text-muted-foreground">
                          No previews (empty audience).
                        </p>
                      )}
                    </div>

                    {/* Recipient ledger */}
                    <div>
                      <p className="mb-2 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">
                        Recipients ({detail.recipients.length}
                        {detail.campaign.recipientCount > detail.recipients.length
                          ? ` of ${detail.campaign.recipientCount}`
                          : ""}
                        )
                      </p>
                      {detail.recipients.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto overflow-x-auto rounded-xl border border-white/[0.07] [scrollbar-width:thin]">
                          <table className="w-full min-w-[420px] text-left">
                            <thead className="sticky top-0 bg-[#0b101c]">
                              <tr className="border-b border-white/[0.06]">
                                <th className="px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                                <th className="px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                                <th className="px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                <th className="px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">Sent</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detail.recipients.map((r) => (
                                <tr key={r.id} className="border-b border-white/[0.04]">
                                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">{maskEmail(r.email)}</td>
                                  <td className="px-4 py-2.5 text-[12px] text-foreground">{r.firstName ?? "—"}</td>
                                  <td className="px-4 py-2.5">
                                    <span
                                      title={r.error ?? undefined}
                                      className={cn(
                                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-semibold capitalize",
                                        RECIPIENT_STATUS_STYLES[r.status] ?? "border-white/15 bg-white/[0.04] text-muted-foreground"
                                      )}
                                    >
                                      {r.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-[11px] text-muted-foreground">
                                    {r.sentAt ? timeAgo(r.sentAt) : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[12px] text-muted-foreground">
                          Recipients are materialized per-recipient at send time (§57).
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action footer (§56 approve + send) */}
              <footer className="border-t border-white/[0.06] px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  {(detail.campaign.status === "draft" || detail.campaign.status === "pending_approval") && (
                    <div className="relative">
                      <button
                        onClick={() => setConfirmApprove((s) => !s)}
                        disabled={busy !== null || sending}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-teal/50 bg-teal-dim px-4 py-2.5 text-[12.5px] font-semibold text-teal transition-colors hover:bg-teal/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busy === "approve" ? (
                          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                        ) : (
                          <ShieldCheck size={14} aria-hidden="true" />
                        )}
                        Approve
                      </button>
                      {confirmApprove && (
                        <div
                          role="alertdialog"
                          aria-label="Confirm campaign approval"
                          className="absolute bottom-full left-0 z-30 mb-2 w-72 rounded-2xl border border-teal/30 bg-[#0b101c] p-4 shadow-float"
                        >
                          <p className="text-[12.5px] font-semibold text-foreground">Approve this campaign?</p>
                          <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                            Approving arms sending — {detail.campaign.recipientCount} recipient
                            {detail.campaign.recipientCount === 1 ? "" : "s"} will be emailed when you press Send.
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              onClick={() => void approve()}
                              disabled={busy !== null}
                              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-teal/60 bg-teal px-3.5 py-2 text-[12px] font-semibold text-ink transition-colors hover:bg-teal/80"
                            >
                              {busy === "approve" ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Check size={13} aria-hidden="true" />}
                              Approve campaign
                            </button>
                            <button
                              onClick={() => setConfirmApprove(false)}
                              className="inline-flex min-h-[44px] items-center rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => void send()}
                    disabled={busy !== null || sending || detail.campaign.status !== "approved"}
                    title={detail.campaign.status !== "approved" ? "Approve first" : "Send to all recipients"}
                    className={cn(
                      "inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-2.5 text-[12.5px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50",
                      detail.campaign.status === "approved"
                        ? "border-gold/60 bg-gold text-ink hover:bg-gold-light"
                        : "border-white/[0.12] bg-white/[0.03] text-muted-foreground"
                    )}
                  >
                    {sending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                        sending…
                      </>
                    ) : (
                      <Send size={14} aria-hidden="true" />
                    )}
                    Send campaign
                  </button>

                  {detail.campaign.status === "draft" && (
                    <button
                      onClick={() => void regenerate()}
                      disabled={busy !== null || sending}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-purple-400/35 bg-purple-400/10 px-4 py-2.5 text-[12px] font-semibold text-purple-300 transition-colors hover:bg-purple-400/20 disabled:opacity-50"
                    >
                      {busy === "regenerate" ? (
                        <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Sparkles size={13} aria-hidden="true" />
                      )}
                      Regenerate
                    </button>
                  )}

                  {(detail.campaign.status === "draft" || detail.campaign.status === "pending_approval") && (
                    <button
                      onClick={() => {
                        setEditCampaign(detail.campaign);
                        setBuilderOpen(true);
                      }}
                      disabled={busy !== null || sending}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                    >
                      <PenLine size={13} aria-hidden="true" />
                      Edit
                    </button>
                  )}
                </div>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <Megaphone size={26} className="text-muted-foreground/40" aria-hidden="true" />
              <p className="text-[13px] font-medium text-foreground">Select a campaign</p>
              <p className="max-w-xs text-[12px] leading-relaxed text-muted-foreground">
                Review the audience, AI templates and masked per-recipient previews — approve, then send.
              </p>
              <button
                onClick={() => {
                  setEditCampaign(null);
                  setBuilderOpen(true);
                }}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold-dim px-3.5 py-2 text-[12px] font-medium text-gold transition-colors hover:bg-gold/20"
              >
                <Plus size={13} aria-hidden="true" /> New campaign
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ── Builder dialog ── */}
      {builderOpen && (
        <CampaignBuilderDialog
          notify={notify}
          editCampaign={editCampaign}
          onClose={() => {
            setBuilderOpen(false);
            setEditCampaign(null);
            void loadList();
          }}
          onSaved={(c) => {
            setBuilderOpen(false);
            setEditCampaign(null);
            void loadList();
            openCampaign(c.id);
          }}
        />
      )}
    </div>
  );
}

/* ── Stat mini-card ─────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className="surface-card flex items-center gap-3 px-4 py-3.5">
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]", tone)}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className={cn("font-mono text-[16px] font-bold leading-none", tone)}>{value}</p>
        <p className="mt-1 truncate text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/* ── Meta row ───────────────────────────────────────────── */

function MetaRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <p className="flex min-w-0 items-baseline gap-2">
      <span className="w-[110px] shrink-0 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
      <span
        className={cn("min-w-0 flex-1 break-words text-[11.5px] text-foreground", mono && "font-mono text-[10.5px] text-muted-foreground")}
        title={value}
      >
        {value}
      </span>
    </p>
  );
}
