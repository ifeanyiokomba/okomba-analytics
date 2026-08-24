"use client";

import {
  CheckCircle2,
  CircleDot,
  Clock3,
  FileText,
  Inbox,
  Mail,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Stats } from "./types";
import { timeAgo } from "./types";

/* Overview tab — at-a-glance KPIs + activity highlights.
   Reads from the dashboard-level stats refetch. */
export function OverviewTab({
  stats,
  recentInquiries,
  recentPosts,
  recentEmails,
}: {
  stats: Stats | null;
  recentInquiries: { id: string; name: string; service: string; createdAt: string; status: string }[];
  recentPosts: { id: string; title: string; status: string; updatedAt: string }[];
  recentEmails: { id: string; type: string; subject: string; recipientEmail: string; sentAt: string }[];
}) {
  const cards: {
    label: string;
    value: number;
    sub: string;
    icon: typeof Inbox;
    accent: string;
    bg: string;
  }[] = stats
    ? [
        { label: "Total inquiries", value: stats.total, sub: "All time", icon: Inbox, accent: "text-gold", bg: "border-gold/25 bg-gold-dim" },
        { label: "New this week", value: stats.last7Days, sub: "Last 7 days", icon: TrendingUp, accent: "text-gold-light", bg: "border-gold-light/25 bg-gold-light/10" },
        { label: "In progress", value: stats.in_progress, sub: "Awaiting reply", icon: Clock3, accent: "text-purple-300", bg: "border-purple-400/25 bg-purple-400/10" },
        { label: "Closed", value: stats.closed, sub: "Resolved", icon: CheckCircle2, accent: "text-teal", bg: "border-teal/25 bg-teal-dim" },
        { label: "Confirmed subscribers", value: stats.confirmedSubscribers, sub: `${stats.subscribers} total`, icon: Users, accent: "text-teal", bg: "border-teal/25 bg-teal-dim" },
        { label: "Published posts", value: stats.postsPublished, sub: `${stats.postsDraft} drafts`, icon: FileText, accent: "text-gold", bg: "border-gold/25 bg-gold-dim" },
        { label: "Emails sent", value: stats.emailsSent, sub: `${stats.emailsLast7Days} this week`, icon: Mail, accent: "text-gold-light", bg: "border-gold-light/25 bg-gold-light/10" },
        { label: "Open inquiries", value: stats.new + stats.contacted, sub: `${stats.new} new`, icon: CircleDot, accent: "text-gold", bg: "border-gold/25 bg-gold-dim" },
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="surface-card p-5">
            <div className="flex items-start justify-between">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${c.bg} ${c.accent}`}>
                <c.icon size={16} aria-hidden="true" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                {c.sub}
              </span>
            </div>
            <p className="mt-3.5 font-display text-[28px] font-bold leading-none text-foreground">{c.value}</p>
            <p className="mt-1.5 text-[11.5px] font-medium text-muted-foreground">{c.label}</p>
          </div>
        ))}
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
  emptyText: string;
  items: { id: string; primary: string; secondary: string; right: string }[];
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
