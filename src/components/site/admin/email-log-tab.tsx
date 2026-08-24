"use client";

import { useMemo, useState } from "react";
import { Mail, Search, Send, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EMAIL_TYPE_LABELS,
  type EmailLog,
  formatDate,
} from "./types";

/* Email log tab — audit trail of every outbound email.
   Filter by type + search by recipient/subject. */
export function EmailLogTab({
  logs,
  loading,
  total,
}: {
  logs: EmailLog[];
  loading: boolean;
  total: number;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const types = useMemo(
    () => Array.from(new Set(logs.map((l) => l.type))),
    [logs]
  );

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const matchesType = typeFilter === "all" || l.type === typeFilter;
      if (!matchesType) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        l.subject.toLowerCase().includes(q) ||
        l.recipientEmail.toLowerCase().includes(q)
      );
    });
  }, [logs, search, typeFilter]);

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] px-6 py-5 md:flex-row md:items-center md:justify-between">
        <h2 className="text-[14.5px] font-semibold text-foreground">
          Email audit log{" "}
          <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
            ({filtered.length}
            {filtered.length !== logs.length ? ` of ${logs.length}` : ""})
          </span>
        </h2>

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
              placeholder="Search subject or recipient…"
              aria-label="Search email log"
              className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-2.5 pl-9 pr-3.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 sm:w-72"
            />
          </div>
          {types.length > 0 && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
              <button
                onClick={() => setTypeFilter("all")}
                aria-pressed={typeFilter === "all"}
                className={cn(
                  "rounded-full border px-3 py-1.5 font-mono text-[10.5px] font-medium transition-colors",
                  typeFilter === "all"
                    ? "border-gold/50 bg-gold-dim text-gold"
                    : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground"
                )}
              >
                All
              </button>
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  aria-pressed={typeFilter === t}
                  className={cn(
                    "rounded-full border px-3 py-1.5 font-mono text-[10.5px] font-medium transition-colors",
                    typeFilter === t
                      ? "border-gold/50 bg-gold-dim text-gold"
                      : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground"
                  )}
                >
                  {EMAIL_TYPE_LABELS[t] ?? t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Mail size={22} className="animate-pulse text-gold" aria-label="Loading email log" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Mail size={28} className="text-muted-foreground/40" aria-hidden="true" />
          <p className="text-[13px] text-muted-foreground">
            No emails sent yet — they appear here the moment subscribers are notified.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Search size={24} className="text-muted-foreground/40" aria-hidden="true" />
          <p className="text-[13px] text-muted-foreground">No emails match your search.</p>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.04]">
          {filtered.map((l) => {
            const icon = l.type === "broadcast" ? Send : l.type === "subscriber.welcome" ? Users : Mail;
            const Icon = icon;
            const label = EMAIL_TYPE_LABELS[l.type] ?? l.type;
            return (
              <li
                key={l.id}
                className="flex flex-col gap-2 px-6 py-4 transition-colors hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-muted-foreground">
                    <Icon size={14} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-gold/25 bg-gold-dim px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-gold">
                        {label}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                          l.status === "sent"
                            ? "border-teal/30 bg-teal-dim text-teal"
                            : "border-red-500/30 bg-red-500/10 text-red-300"
                        )}
                      >
                        {l.status}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-[13px] font-medium text-foreground">{l.subject}</p>
                    <a
                      href={`mailto:${l.recipientEmail}`}
                      className="mt-0.5 inline-block truncate text-[11.5px] text-muted-foreground transition-colors hover:text-gold"
                    >
                      → {l.recipientEmail}
                    </a>
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">
                  {formatDate(l.sentAt, { withYear: true, withTime: true })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
