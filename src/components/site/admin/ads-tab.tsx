"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CalendarClock,
  CircleDollarSign,
  Inbox,
  Loader2,
  Megaphone,
  MousePointerClick,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AD_STATUS_STYLES, AD_PAYMENT_STYLES, adPlacementLabel, adTypeLabel } from "@/lib/ads-shared";
import { formatDate, formatNaira, timeAgo } from "./types";

/* ── BATCH 6 (§40) — Ads management tab ───────────────────────
   Queue + pipeline for advertising requests. The detail dialog
   (ad-detail-dialog.tsx) carries the §38 workflow actions.      */

export type AdStatusEntry = { status: string; at: string; note?: string };

export type AdAssetPreview = {
  id: string;
  url: string;
  thumbUrl: string | null;
  originalName: string;
  mime: string;
} | null;

export type AdRequestRow = {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  countryCode: string | null;
  websiteUrl: string | null;
  adType: string;
  placement: string;
  startDate: string | null;
  durationDays: number | null;
  budget: string | null;
  description: string;
  termsConsent: boolean;
  attachment: AdAssetPreview;
  status: string;
  statusHistory: AdStatusEntry[] | null;
  paymentStatus: string;
  amount: string | null;
  currency: string;
  paidAt: string | null;
  startAt: string | null;
  endAt: string | null;
  publishedAt: string | null;
  creative: AdAssetPreview;
  creativeUrl: string | null;
  headline: string | null;
  bodyCopy: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  adminNotes: string | null;
  reviewedAt: string | null;
  clicks: number;
  views: number;
  createdAt: string;
  updatedAt: string;
};

export type AdStats = {
  total: number;
  new: number;
  awaitingAdmin: number;
  active: number;
  scheduled: number;
  awaitingPayment: number;
  paidRevenue: number;
};

const FILTERS: { key: string; label: string }[] = [
  { key: "inbox", label: "Needs action" },
  { key: "pipeline", label: "Pipeline" },
  { key: "live", label: "Live" },
  { key: "done", label: "Archive" },
  { key: "all", label: "All" },
];

const INBOX = new Set(["new", "reviewing", "awaiting_customer"]);
const PIPELINE = new Set(["approved", "payment_pending", "paid", "scheduled"]);
const LIVE = new Set(["active", "paused"]);
const DONE = new Set(["completed", "expired", "rejected"]);

function statusPill(status: string): string {
  return cn(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold",
    AD_STATUS_STYLES[status] ?? "border-white/15 bg-white/[0.04] text-muted-foreground"
  );
}
function paymentPill(payment: string): string {
  return cn(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold",
    AD_PAYMENT_STYLES[payment] ?? "border-white/15 bg-white/[0.04] text-muted-foreground"
  );
}

export function AdsTab({
  ads,
  stats,
  loading,
  onOpen,
}: {
  ads: AdRequestRow[];
  stats: AdStats | null;
  loading: boolean;
  onOpen: (ad: AdRequestRow) => void;
}) {
  const [filter, setFilter] = useState("inbox");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ads.filter((a) => {
      if (filter === "inbox" && !INBOX.has(a.status)) return false;
      if (filter === "pipeline" && !PIPELINE.has(a.status)) return false;
      if (filter === "live" && !LIVE.has(a.status)) return false;
      if (filter === "done" && !DONE.has(a.status)) return false;
      if (!q) return true;
      return [a.firstName, a.lastName, a.company, a.email, a.headline, a.budget]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [ads, filter, query]);

  const cards = [
    {
      icon: Inbox,
      label: "Needs action",
      value: stats ? String(stats.awaitingAdmin) : "—",
      hint: "New + reviewing + awaiting customer",
      accent: "border-gold/25 bg-gold-dim text-gold",
    },
    {
      icon: Banknote,
      label: "Awaiting payment",
      value: stats ? String(stats.awaitingPayment) : "—",
      hint: "Approved, not yet paid",
      accent: "border-orange-400/25 bg-orange-400/10 text-orange-300",
    },
    {
      icon: Megaphone,
      label: "Live campaigns",
      value: stats ? String(stats.active) : "—",
      hint: `${stats?.scheduled ?? 0} scheduled`,
      accent: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    },
    {
      icon: CircleDollarSign,
      label: "Paid revenue",
      value: stats ? formatNaira(stats.paidRevenue) : "—",
      hint: "Sum of paid campaigns",
      accent: "border-teal/25 bg-teal-dim text-teal",
    },
  ];

  return (
    <div className="space-y-5">
      {/* §40 stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="flex items-start gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
          >
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", c.accent)}>
              <c.icon size={17} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-[22px] font-bold leading-tight text-foreground">{c.value}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">{c.hint}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
              filter === f.key
                ? "border-gold/45 bg-gold-dim text-gold"
                : "border-white/[0.09] bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground"
            )}
            aria-pressed={filter === f.key}
          >
            {f.label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search advertiser, company…"
            aria-label="Search ad requests"
            className="w-56 rounded-xl border border-white/[0.09] bg-white/[0.03] py-2 pl-8.5 pr-3 text-[12.5px] text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-gold/50"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] py-14 text-[13px] text-muted-foreground">
          <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Loading ad requests…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-6 py-14 text-center">
          <Sparkles size={22} className="text-muted-foreground/40" aria-hidden="true" />
          <p className="text-[13.5px] text-muted-foreground">
            {filter === "inbox"
              ? "No ad requests waiting — the queue is clear."
              : "No ad requests in this view."}
          </p>
          <p className="max-w-sm text-[11.5px] text-muted-foreground/70">
            Public requests arrive from the “Advertise With Us” section on the website.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => onOpen(a)}
              className="group flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-left transition-all hover:border-gold/30 hover:bg-gold/[0.03] focus-visible:outline-2 focus-visible:outline-gold"
            >
              {/* creative / advertiser */}
              {a.creative?.thumbUrl ? (
                <img
                  src={a.creative.thumbUrl}
                  alt=""
                  className="h-12 w-20 shrink-0 rounded-lg border border-white/[0.08] object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.03] text-muted-foreground">
                  <Megaphone size={16} aria-hidden="true" />
                </span>
              )}

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="truncate text-[14px] font-semibold text-foreground group-hover:text-gold">
                    {a.firstName} {a.lastName}
                  </span>
                  {a.company && (
                    <span className="truncate text-[12px] text-muted-foreground">{a.company}</span>
                  )}
                  <span className="font-mono text-[10.5px] text-muted-foreground/60">
                    {timeAgo(a.createdAt)}
                  </span>
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                  <span>{adPlacementLabel(a.placement)}</span>
                  <span className="text-muted-foreground/50">·</span>
                  <span>{adTypeLabel(a.adType)}</span>
                  {a.durationDays && (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock size={11} aria-hidden="true" /> {a.durationDays}d
                      </span>
                    </>
                  )}
                  {a.status === "active" && (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="inline-flex items-center gap-1 font-mono">
                        <MousePointerClick size={11} aria-hidden="true" /> {a.clicks} clicks
                      </span>
                    </>
                  )}
                </span>
              </span>

              {/* amount + pills */}
              <span className="flex flex-wrap items-center gap-2">
                {a.amount && (
                  <span className="rounded-lg border border-teal/25 bg-teal-dim px-2.5 py-1 font-mono text-[12px] font-semibold text-teal">
                    {a.currency === "NGN" ? formatNaira(Number(a.amount)) : `${a.currency} ${Number(a.amount).toLocaleString()}`}
                  </span>
                )}
                {!a.amount && a.budget && (
                  <span className="rounded-lg border border-white/[0.09] bg-white/[0.03] px-2.5 py-1 text-[11.5px] text-muted-foreground">
                    Budget: {a.budget}
                  </span>
                )}
                <span className={paymentPill(a.paymentStatus)} title="Payment status">
                  {a.paymentStatus}
                </span>
                <span className={statusPill(a.status)} title="Approval status">
                  {a.status}
                </span>
              </span>

              {/* window */}
              <span className="hidden shrink-0 text-right text-[11px] text-muted-foreground lg:block">
                {a.startAt || a.endAt ? (
                  <>
                    {a.startAt ? formatDate(a.startAt) : "?"} → {a.endAt ? formatDate(a.endAt, { withYear: true }) : "?"}
                  </>
                ) : (
                  <span className="text-muted-foreground/50">no window yet</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
