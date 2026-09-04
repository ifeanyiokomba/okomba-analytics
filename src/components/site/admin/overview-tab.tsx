"use client";

import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  CalendarDays,
  CreditCard,
  FileSignature,
  FileText,
  Inbox,
  Mail,
  Megaphone,
  MessageSquare,
  Send,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stats } from "./types";
import { timeAgo } from "./types";

/* Overview tab — at-a-glance KPIs + activity highlights.
   Reads from the dashboard-level stats refetch.

   BATCH 7 (§46): every KPI card is now ACTIONABLE — a shortcut into
   the matching workspace (New Inquiries → filtered inquiry list,
   Revenue → payments, Outstanding Invoices → unpaid invoices, CRM,
   posts, moderation, ads…). Cards are buttons, not decoration.
   BATCH 7 (§47): Quick actions row — the ten canonical admin
   shortcuts (new customer/inquiry/proposal/invoice/post, broadcast,
   new ad campaign, new event, invite admin, review AI drafts). */

type OverviewMe = {
  email: string;
  name: string | null;
  roleLabel: string;
  isMaster: boolean;
};

type QuickActionId =
  | "new-customer"
  | "new-inquiry"
  | "new-proposal"
  | "new-invoice"
  | "new-post"
  | "broadcast"
  | "new-ad"
  | "new-event"
  | "invite-admin"
  | "review-drafts";

export function OverviewTab({
  stats,
  recentInquiries,
  recentPosts,
  recentEmails,
  me,
  outstandingInvoices,
  liveAds,
  pendingComments,
  can,
  onNavigate,
  onQuickAction,
}: {
  stats: Stats | null;
  recentInquiries: { id: string; name: string; service: string; createdAt: string; status: string }[];
  recentPosts: { id: string; title: string; status: string; updatedAt: string }[];
  recentEmails: { id: string; type: string; subject: string; recipientEmail: string; sentAt: string }[];
  me: OverviewMe | null;
  outstandingInvoices: number;
  liveAds: number;
  pendingComments: number;
  can: (perm: string) => boolean;
  onNavigate: (tab: "inquiries" | "customers" | "payments" | "posts" | "comments" | "ads" | "subscribers" | "email", filter?: string) => void;
  onQuickAction: (action: QuickActionId) => void;
}) {
  const cards: {
    label: string;
    value: number;
    sub: string;
    icon: typeof Inbox;
    accent: string;
    bg: string;
    target: "inquiries" | "customers" | "payments" | "posts" | "comments" | "ads" | "subscribers" | "email";
    filter?: string;
  }[] = stats
    ? [
        { label: "New inquiries", value: stats.new, sub: "Needs first reply", icon: Inbox, accent: "text-gold", bg: "border-gold/25 bg-gold-dim", target: "inquiries", filter: "new" },
        { label: "In progress", value: stats.in_progress, sub: "Awaiting reply", icon: Clock3, accent: "text-purple-300", bg: "border-purple-400/25 bg-purple-400/10", target: "inquiries", filter: "in_progress" },
        { label: "Total inquiries", value: stats.total, sub: "All time", icon: TrendingUp, accent: "text-gold-light", bg: "border-gold-light/25 bg-gold-light/10", target: "inquiries" },
        { label: "Closed", value: stats.closed, sub: "Resolved", icon: CheckCircle2, accent: "text-teal", bg: "border-teal/25 bg-teal-dim", target: "inquiries", filter: "closed" },
        { label: "Outstanding invoices", value: outstandingInvoices, sub: "Unpaid / pending", icon: Wallet, accent: "text-gold", bg: "border-gold/25 bg-gold-dim", target: "payments" },
        { label: "Confirmed subscribers", value: stats.confirmedSubscribers, sub: `${stats.subscribers} total`, icon: Users, accent: "text-teal", bg: "border-teal/25 bg-teal-dim", target: "subscribers" },
        { label: "Pending comments", value: pendingComments, sub: "Awaiting moderation", icon: MessageSquare, accent: "text-gold-light", bg: "border-gold-light/25 bg-gold-light/10", target: "comments" },
        { label: "Published posts", value: stats.postsPublished, sub: `${stats.postsDraft} drafts`, icon: FileText, accent: "text-gold", bg: "border-gold/25 bg-gold-dim", target: "posts" },
        { label: "Live campaigns", value: liveAds, sub: "Ads running now", icon: Megaphone, accent: "text-gold-light", bg: "border-gold-light/25 bg-gold-light/10", target: "ads" },
        { label: "Emails sent", value: stats.emailsSent, sub: `${stats.emailsLast7Days} this week`, icon: Mail, accent: "text-gold", bg: "border-gold/25 bg-gold-dim", target: "email" },
      ]
    : [];

  const quickActions: { id: QuickActionId; label: string; icon: typeof Inbox; primary?: boolean; enabled: boolean; note?: string }[] = [
    { id: "new-customer", label: "New customer", icon: UserPlus, primary: true, enabled: can("edit_customers") },
    { id: "new-inquiry", label: "Log inquiry", icon: Inbox, enabled: can("edit_customers") },
    { id: "new-proposal", label: "New proposal", icon: FileSignature, enabled: can("create_invoices") },
    { id: "new-invoice", label: "New invoice", icon: CreditCard, enabled: can("create_invoices") },
    { id: "new-post", label: "New post", icon: FileText, enabled: can("manage_posts") },
    { id: "broadcast", label: "Broadcast", icon: Send, enabled: can("broadcast_subscribers") },
    { id: "new-ad", label: "New ad campaign", icon: Megaphone, enabled: can("manage_ads") },
    { id: "new-event", label: "New event", icon: CalendarDays, enabled: false, note: "Calendar ships in Batch 10" },
    { id: "invite-admin", label: "Invite admin", icon: UserPlus, enabled: can("manage_admins") },
    { id: "review-drafts", label: "Review AI drafts", icon: Sparkles, enabled: can("create_invoices") },
  ];

  return (
    <div className="space-y-4">
      {/* §47 — Quick actions */}
      <section aria-label="Quick actions" className="surface-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[14.5px] font-semibold text-foreground">Quick actions</h2>
          {me && (
            <p className="text-[11.5px] text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{me.name ?? me.email}</span> ·{" "}
              <span className="text-gold">{me.roleLabel}</span>
              {me.isMaster && <span className="ml-1 rounded-full border border-gold/30 bg-gold-dim px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-gold">master</span>}
            </p>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {quickActions.map((a) => {
            const Icon = a.icon;
            if (!a.enabled) {
              return (
                <button
                  key={a.id}
                  disabled
                  title={a.note}
                  aria-label={`${a.label} — ${a.note ?? "unavailable"}`}
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left text-[12.5px] font-medium text-muted-foreground/40"
                >
                  <Icon size={14} aria-hidden="true" />
                  <span className="truncate">{a.label}</span>
                </button>
              );
            }
            return (
              <button
                key={a.id}
                onClick={() => onQuickAction(a.id)}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[12.5px] font-medium transition-all",
                  a.primary
                    ? "border-gold/40 bg-gold-dim text-gold hover:border-gold/60 hover:-translate-y-0.5"
                    : "border-white/[0.09] bg-white/[0.03] text-foreground hover:border-gold/40 hover:text-gold hover:-translate-y-0.5"
                )}
              >
                <Icon size={14} className={a.primary ? "text-gold" : "text-muted-foreground group-hover:text-gold"} aria-hidden="true" />
                <span className="truncate">{a.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* KPI grid — §46: every card is a shortcut */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.label}
              onClick={() => onNavigate(c.target, c.filter)}
              aria-label={`${c.label}: ${c.value} — open ${c.target}${c.filter ? ` filtered to ${c.filter.replace("_", " ")}` : ""}`}
              className="surface-card group p-5 text-left transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${c.bg} ${c.accent}`}>
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60 transition-colors group-hover:text-gold">
                  {c.sub}
                  <ArrowRight size={10} className="opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3.5 font-display text-[28px] font-bold leading-none text-foreground">{c.value}</p>
              <p className="mt-1.5 text-[11.5px] font-medium text-muted-foreground group-hover:text-foreground">{c.label}</p>
            </button>
          );
        })}
      </div>

      {/* Top services (mini bars) */}
      {stats && stats.byService.length > 0 && (
        <div className="surface-card p-6">
          <h2 className="text-[14.5px] font-semibold text-foreground">Most requested services</h2>
          <div className="mt-5 space-y-3.5">
            {stats.byService.slice(0, 5).map((s) => {
              const max = stats.byService[0]?.count ?? 1;
              return (
                <div key={s.service} className="flex items-center gap-4">
                  <span className="w-40 shrink-0 truncate text-[12.5px] text-muted-foreground md:w-56">{s.service}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-light to-gold transition-[width] duration-700"
                      style={{ width: `${Math.max((s.count / max) * 100, 4)}%` }}
                    />
                  </div>
                  <span className="w-7 shrink-0 text-right font-mono text-[12px] font-semibold text-gold">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Three-column activity stream */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ActivityCard
          title="Recent inquiries"
          emptyText="No inquiries yet."
          items={recentInquiries.map((i) => ({
            id: i.id,
            primary: i.name,
            secondary: i.service,
            right: timeAgo(i.createdAt),
          }))}
        />
        <ActivityCard
          title="Recent posts"
          emptyText="No posts yet."
          items={recentPosts.map((p) => ({
            id: p.id,
            primary: p.title,
            secondary: p.status === "published" ? "Published" : "Draft",
            right: timeAgo(p.updatedAt),
          }))}
        />
        <ActivityCard
          title="Recent emails"
          emptyText="No emails sent yet."
          items={recentEmails.map((e) => ({
            id: e.id,
            primary: e.subject,
            secondary: e.recipientEmail,
            right: timeAgo(e.sentAt),
          }))}
        />
      </div>
    </div>
  );
}

function ActivityCard({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: { id: string; primary: string; secondary: string; right: string }[];
  emptyText: string;
}) {
  return (
    <div className="surface-card p-5">
      <h3 className="text-[13.5px] font-semibold text-foreground">{title}</h3>
      <ul className="mt-3.5 space-y-2.5">
        {items.length === 0 ? (
          <li className="py-6 text-center text-[12px] text-muted-foreground/70">{emptyText}</li>
        ) : (
          items.slice(0, 6).map((i) => (
            <li
              key={i.id}
              className="flex items-start justify-between gap-3 border-b border-white/[0.04] pb-2.5 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-medium text-foreground">{i.primary}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{i.secondary}</p>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">{i.right}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
