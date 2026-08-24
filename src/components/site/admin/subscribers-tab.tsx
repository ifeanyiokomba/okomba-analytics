"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Loader2,
  Mail,
  Search,
  Send,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportSubscribersCsv } from "@/lib/csv-export";
import {
  SUBSCRIBER_STATUSES,
  SUBSCRIBER_STATUS_STYLES,
  type Subscriber,
  formatDate,
} from "./types";

/* Subscribers tab — full management.
   Status change (inline select), delete (with confirm), search,
   status filter, CSV export, and a "Compose broadcast" entry point. */
export function SubscribersTab({
  subscribers,
  loading,
  onUpdateStatus,
  onDelete,
  onComposeBroadcast,
  updatingId,
}: {
  subscribers: Subscriber[];
  loading: boolean;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onComposeBroadcast: () => void;
  updatingId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return subscribers.filter((s) => {
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      if (!matchesStatus) return false;
      if (!search.trim()) return true;
      return s.email.toLowerCase().includes(search.trim().toLowerCase());
    });
  }, [subscribers, search, statusFilter]);

  const exportable = filtered.map((s) => ({
    email: s.email,
    status: s.status,
    createdAt: s.createdAt,
  }));

  const confirmedCount = subscribers.filter((s) => s.status === "confirmed").length;
  const pendingCount = subscribers.filter((s) => s.status === "pending").length;
  const unsubCount = subscribers.filter((s) => s.status === "unsubscribed").length;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SubscriberStatCard
          label="Total"
          value={subscribers.length}
          icon={Users}
          accent="text-gold"
          bg="border-gold/25 bg-gold-dim"
        />
        <SubscriberStatCard
          label="Confirmed"
          value={confirmedCount}
          icon={CheckCircle2}
          accent="text-teal"
          bg="border-teal/25 bg-teal-dim"
        />
        <SubscriberStatCard
          label="Pending"
          value={pendingCount}
          icon={Loader2}
          accent="text-gold-light"
          bg="border-gold-light/25 bg-gold-light/10"
        />
        <SubscriberStatCard
          label="Unsubscribed"
          value={unsubCount}
          icon={UserMinus}
          accent="text-red-300"
          bg="border-red-500/25 bg-red-500/10"
        />
      </div>

      {/* Broadcast banner */}
      <div className="surface-card relative flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold/[0.08] blur-3xl" aria-hidden="true" />
        <div className="relative flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim text-gold shadow-gold">
            <Send size={16} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[14.5px] font-semibold text-foreground">Send a broadcast</h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Email every confirmed subscriber with an announcement, product update or insight.
              Each send is logged in the email audit trail.
            </p>
          </div>
        </div>
        <button
          onClick={onComposeBroadcast}
          disabled={confirmedCount === 0}
          className="btn-shine inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={13} aria-hidden="true" />
          Compose broadcast
          {confirmedCount > 0 && (
            <span className="rounded-full bg-black/15 px-1.5 py-0.5 font-mono text-[10px]">
              {confirmedCount}
            </span>
          )}
        </button>
      </div>

      {/* Subscribers list card */}
      <div className="surface-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-white/[0.06] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <h2 className="text-[14.5px] font-semibold text-foreground">
            All subscribers{" "}
            <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
              ({filtered.length}
              {filtered.length !== subscribers.length ? ` of ${subscribers.length}` : ""})
            </span>
          </h2>

          <button
            onClick={() => exportSubscribersCsv(exportable)}
            disabled={filtered.length === 0}
            aria-label="Export subscribers as CSV"
            title="Export subscribers as CSV"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-teal/40 hover:text-teal disabled:pointer-events-none disabled:opacity-40"
          >
            <Download size={13} aria-hidden="true" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email…"
                aria-label="Search subscribers"
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-2.5 pl-9 pr-3.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-teal/60 sm:w-64"
              />
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
              {["all", ...SUBSCRIBER_STATUSES].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={statusFilter === s}
                  className={cn(
                    "rounded-full border px-3 py-1.5 font-mono text-[10.5px] font-medium capitalize transition-colors",
                    statusFilter === s
                      ? "border-teal/50 bg-teal-dim text-teal"
                      : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-teal" aria-label="Loading subscribers" />
          </div>
        ) : subscribers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Users size={28} className="text-muted-foreground/40" aria-hidden="true" />
            <p className="text-[13px] text-muted-foreground">
              No subscribers yet — newsletter signups from the website will appear here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Search size={24} className="text-muted-foreground/40" aria-hidden="true" />
            <p className="text-[13px] text-muted-foreground">No subscribers match your search.</p>
          </div>
        ) : (
          <ul className="max-h-[560px] divide-y divide-white/[0.04] overflow-y-auto">
            {filtered.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-muted-foreground">
                    <Mail size={14} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <a
                      href={`mailto:${s.email}`}
                      className="block truncate text-[13px] font-medium text-foreground transition-colors hover:text-gold"
                    >
                      {s.email}
                    </a>
                    <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground/70">
                      Joined {formatDate(s.confirmedAt ?? s.createdAt, { withYear: true })}
                      {s.confirmedAt && s.confirmedAt !== s.createdAt
                        ? ` · confirmed ${formatDate(s.confirmedAt)}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Status select */}
                  <select
                    value={s.status}
                    disabled={updatingId === s.id}
                    onChange={(e) => onUpdateStatus(s.id, e.target.value)}
                    aria-label={`Status for ${s.email}`}
                    className={cn(
                      "cursor-pointer appearance-none rounded-full border px-3 py-1.5 text-[10.5px] font-semibold capitalize outline-none transition-colors disabled:opacity-50",
                      SUBSCRIBER_STATUS_STYLES[s.status] ?? SUBSCRIBER_STATUS_STYLES.pending
                    )}
                  >
                    {SUBSCRIBER_STATUSES.map((st) => (
                      <option key={st} value={st} className="bg-[#0b101c] text-foreground">
                        {st}
                      </option>
                    ))}
                  </select>

                  {/* Delete / confirm */}
                  {confirmDeleteId === s.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={async () => {
                          await onDelete(s.id);
                          setConfirmDeleteId(null);
                        }}
                        aria-label={`Confirm delete ${s.email}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/15 px-2.5 py-1.5 text-[11px] font-medium text-red-300 transition-colors hover:bg-red-500/25"
                      >
                        <Trash2 size={11} aria-hidden="true" /> Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        aria-label="Cancel delete"
                        className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(s.id)}
                      disabled={updatingId === s.id}
                      aria-label={`Remove ${s.email}`}
                      title="Remove subscriber"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
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

function SubscriberStatCard({
  label,
  value,
  icon: Icon,
  accent,
  bg,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  accent: string;
  bg: string;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${bg} ${accent}`}>
          <Icon size={16} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3.5 font-display text-[26px] font-bold leading-none text-foreground">{value}</p>
      <p className="mt-1.5 text-[11.5px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
