"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Flag,
  Inbox,
  Loader2,
  MessageSquare,
  Search,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── BATCH 5 (§23 admin management + §92 moderation) ───────
   Moderation queue for post comments: approve / reject / mark
   spam / delete, with the spam-check trail + report flags. */

export type AdminComment = {
  id: string;
  postId: string;
  postTitle: string;
  postSlug: string;
  parentId: string | null;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: string;
  reportedCount: number;
  reporterNote: string | null;
  flagged: { checks?: string[]; score?: number };
  createdAt: string;
  moderatedAt: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "border-gold/35 bg-gold-dim text-gold",
  approved: "border-teal/35 bg-teal-dim text-teal",
  rejected: "border-red-500/30 bg-red-500/10 text-red-300",
  spam: "border-purple-400/35 bg-purple-400/10 text-purple-300",
};

export function CommentsTab({
  comments,
  loading,
  onModerate,
  onDelete,
  busyId,
}: {
  comments: AdminComment[];
  loading: boolean;
  onModerate: (id: string, action: "approve" | "reject" | "spam" | "pending") => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  busyId: string | null;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, spam: 0, all: comments.length };
    for (const cm of comments) {
      if (cm.status in c) c[cm.status as "pending" | "approved" | "rejected" | "spam"] += 1;
    }
    return c;
  }, [comments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return comments.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.authorName.toLowerCase().includes(q) ||
        (c.authorEmail ?? "").toLowerCase().includes(q) ||
        c.body.toLowerCase().includes(q) ||
        c.postTitle.toLowerCase().includes(q)
      );
    });
  }, [comments, statusFilter, search]);

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Pending review" value={counts.pending} icon={Clock} accent="text-gold" bg="border-gold/25 bg-gold-dim" />
        <StatCard label="Approved" value={counts.approved} icon={CheckCircle2} accent="text-teal" bg="border-teal/25 bg-teal-dim" />
        <StatCard label="Rejected" value={counts.rejected} icon={XCircle} accent="text-red-300" bg="border-red-500/25 bg-red-500/10" />
        <StatCard label="Spam" value={counts.spam} icon={ShieldAlert} accent="text-purple-300" bg="border-purple-400/25 bg-purple-400/10" />
      </div>

      {/* List */}
      <div className="surface-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-white/[0.06] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <h2 className="text-[14.5px] font-semibold text-foreground">
            Comment moderation{" "}
            <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
              ({filtered.length}
              {filtered.length !== comments.length ? ` of ${comments.length}` : ""})
            </span>
          </h2>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search author, body, post…"
                aria-label="Search comments"
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-2.5 pl-9 pr-3.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 sm:w-64"
              />
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
              {["pending", "approved", "rejected", "spam", "all"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={statusFilter === s}
                  className={cn(
                    "rounded-full border px-3 py-1.5 font-mono text-[10.5px] font-medium capitalize transition-colors",
                    statusFilter === s
                      ? "border-gold/50 bg-gold-dim text-gold"
                      : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground"
                  )}
                >
                  {s}
                  {s !== "all" && counts[s as keyof typeof counts] > 0 ? ` ${counts[s as keyof typeof counts]}` : ""}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-gold" aria-label="Loading comments" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Inbox size={28} className="text-muted-foreground/40" aria-hidden="true" />
            <p className="text-[13px] text-muted-foreground">
              No comments yet — they land here the moment readers submit them.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <CheckCircle2 size={24} className="text-teal/60" aria-hidden="true" />
            <p className="text-[13px] text-muted-foreground">
              {statusFilter === "pending" ? "Queue clear — nothing awaiting review." : "No comments match this filter."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {filtered.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider", STATUS_STYLES[c.status] ?? "border-white/15 bg-white/5 text-muted-foreground")}>
                      {c.status}
                    </span>
                    {c.parentId && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        <MessageSquare size={8} aria-hidden="true" /> reply
                      </span>
                    )}
                    {c.reportedCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-red-300">
                        <Flag size={8} aria-hidden="true" /> {c.reportedCount} report{c.reportedCount === 1 ? "" : "s"}
                      </span>
                    )}
                    {(c.flagged?.checks?.length ?? 0) > 0 && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-purple-400/30 bg-purple-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-purple-300"
                        title={`Spam score ${c.flagged?.score ?? 0}: ${(c.flagged?.checks ?? []).join(", ")}`}
                      >
                        <AlertTriangle size={8} aria-hidden="true" /> {c.flagged?.checks?.join(", ")}
                      </span>
                    )}
                    <span className="font-mono text-[10.5px] text-muted-foreground/70">
                      {new Date(c.createdAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <p className="mt-1.5 text-[13.5px] font-semibold text-foreground">
                    {c.authorName}
                    {c.authorEmail && (
                      <span className="ml-2 font-mono text-[10.5px] font-normal text-muted-foreground/70">{c.authorEmail}</span>
                    )}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{c.body}</p>
                  <p className="mt-1.5 font-mono text-[10.5px] text-muted-foreground/60">
                    on <span className="text-foreground/80">{c.postTitle}</span>
                    {c.reporterNote ? ` · report note: ${c.reporterNote}` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 self-start pt-0.5">
                  {busyId === c.id && <Loader2 size={14} className="animate-spin text-gold" aria-label="Working" />}
                  {c.status !== "approved" && (
                    <button
                      onClick={() => void onModerate(c.id, "approve")}
                      disabled={busyId !== null}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-teal/30 bg-teal-dim px-3 text-[11.5px] font-semibold text-teal transition-colors hover:bg-teal/20 disabled:opacity-50"
                    >
                      <CheckCircle2 size={11} aria-hidden="true" /> Approve
                    </button>
                  )}
                  {c.status !== "rejected" && (
                    <button
                      onClick={() => void onModerate(c.id, "reject")}
                      disabled={busyId !== null}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-[11.5px] font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <XCircle size={11} aria-hidden="true" /> Reject
                    </button>
                  )}
                  {c.status !== "spam" && (
                    <button
                      onClick={() => void onModerate(c.id, "spam")}
                      disabled={busyId !== null}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-purple-400/30 bg-purple-400/10 px-3 text-[11.5px] font-semibold text-purple-300 transition-colors hover:bg-purple-400/20 disabled:opacity-50"
                    >
                      <Ban size={11} aria-hidden="true" /> Spam
                    </button>
                  )}
                  {confirmDeleteId === c.id ? (
                    <span className="flex items-center gap-1.5">
                      <button
                        onClick={async () => {
                          await onDelete(c.id);
                          setConfirmDeleteId(null);
                        }}
                        aria-label="Confirm delete comment"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/25 px-3 text-[11.5px] font-semibold text-red-200 transition-colors hover:bg-red-500/35"
                      >
                        <Trash2 size={11} aria-hidden="true" /> Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="h-8 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(c.id)}
                      disabled={busyId !== null}
                      aria-label="Delete comment"
                      title="Delete comment"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  bg,
}: {
  label: string;
  value: number;
  icon: typeof Clock;
  accent: string;
  bg: string;
}) {
  return (
    <div className="surface-card p-5">
      <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl border", bg, accent)}>
        <Icon size={16} aria-hidden="true" />
      </span>
      <p className="mt-3.5 font-display text-[26px] font-bold leading-none text-foreground">{value}</p>
      <p className="mt-1.5 text-[11.5px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
