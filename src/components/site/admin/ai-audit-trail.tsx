"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Copy, History, Loader2, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AI_AUDIT_FAMILY_LABELS,
  AI_AUDIT_FAMILY_STYLES,
  aiAuditFamily,
  shortId,
  type AiAuditEntry,
} from "@/lib/chat-shared";
import { timeAgo } from "./types";

/* ─────────────────────────────────────────────────────────────
   BATCH 11 (§63) — AI action audit trail.

   GET /api/admin/ai/audit?conversationId=… — last 200 rows, newest
   first. Action chips are color-coded by family:
   handoff.*=gold · chat.*=teal · knowledge.*=purple · proposal.*=
   gold-light. Rows with meta JSON expand in place; conversationId
   is copy-to-clipboard. A conversation filter chip arrives from
   the Conversations sub-tab ("View audit").
   ───────────────────────────────────────────────────────────── */

const MAX_SNIPPET = 120;

function metaText(entry: AiAuditEntry): string {
  if (entry.meta == null) return "";
  try {
    return typeof entry.meta === "string" ? entry.meta : JSON.stringify(entry.meta);
  } catch {
    return String(entry.meta);
  }
}

export function AiAuditTrail({
  notify,
  conversationFilter,
  onClearFilter,
  refreshSignal,
}: {
  notify: (text: string, type?: "ok" | "err") => void;
  conversationFilter: string | null;
  onClearFilter: () => void;
  refreshSignal: number;
}) {
  const [entries, setEntries] = useState<AiAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copiedFor, setCopiedFor] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (conversationId: string | null) => {
      try {
        const url = conversationId
          ? `/api/admin/ai/audit?conversationId=${encodeURIComponent(conversationId)}`
          : "/api/admin/ai/audit";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const j = (await res.json()) as { ok: boolean; entries?: AiAuditEntry[] };
        if (j.ok) setEntries(j.entries ?? []);
      } catch {
        /* transient */
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load(conversationFilter);
  }, [load, conversationFilter, refreshSignal]);

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyConversationId = async (entry: AiAuditEntry) => {
    if (!entry.conversationId) return;
    try {
      await navigator.clipboard.writeText(entry.conversationId);
      setCopiedFor(entry.id);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopiedFor(null), 1500);
    } catch {
      notify("Copy failed — clipboard unavailable", "err");
    }
  };

  return (
    <div className="surface-card overflow-hidden">
      {/* Header strip */}
      <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim">
            <History size={16} className="text-gold" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[14.5px] font-semibold text-foreground">AI audit trail</h2>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              Every handover, agent reply, knowledge edit and proposal event — newest first.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversationFilter && (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-gold/35 bg-gold-dim px-3 py-1.5 font-mono text-[10px] text-gold">
              <span className="truncate">conv {shortId(conversationFilter, 10)}</span>
              <button
                onClick={onClearFilter}
                aria-label="Clear conversation filter"
                className="shrink-0 rounded-full p-0.5 transition-colors hover:text-foreground"
              >
                <X size={11} aria-hidden="true" />
              </button>
            </span>
          )}
          <button
            onClick={() => void load(conversationFilter)}
            aria-label="Refresh AI audit trail"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
          >
            <RefreshCw size={13} aria-hidden="true" /> Refresh
          </button>
        </div>
      </div>

      {/* Column labels (desktop) */}
      <div className="hidden grid-cols-[130px_170px_minmax(120px,1fr)_150px_minmax(80px,1.2fr)] gap-3 border-b border-white/[0.05] px-5 py-2 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground/70 md:grid">
        <span>Time</span>
        <span>Action</span>
        <span>Actor</span>
        <span>Conversation</span>
        <span>Meta</span>
      </div>

      {/* Rows */}
      <div className="max-h-[560px] overflow-y-auto [scrollbar-width:thin]" aria-live="polite" aria-label="AI audit entries">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={20} className="animate-spin text-gold" aria-label="Loading audit trail" />
          </div>
        ) : entries.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <History size={22} className="mx-auto text-muted-foreground/40" aria-hidden="true" />
            <p className="mt-3 text-[12px] text-muted-foreground">
              No AI actions yet — entries appear when a chat escalates, an agent replies, or knowledge changes.
            </p>
          </div>
        ) : (
          entries.map((e) => {
            const family = aiAuditFamily(e.action);
            const snippet = metaText(e);
            const isOpen = expanded.has(e.id);
            return (
              <div
                key={e.id}
                className="border-b border-white/[0.04] px-5 py-3 transition-colors last:border-b-0 hover:bg-white/[0.02]"
              >
                <div className="grid gap-2 md:grid-cols-[130px_170px_minmax(120px,1fr)_150px_minmax(80px,1.2fr)] md:items-center md:gap-3">
                  {/* Time */}
                  <span className="font-mono text-[10.5px] text-muted-foreground" title={e.createdAt}>
                    {timeAgo(e.createdAt)}
                  </span>
                  {/* Action chip */}
                  <span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold",
                        AI_AUDIT_FAMILY_STYLES[family]
                      )}
                      title={`${AI_AUDIT_FAMILY_LABELS[family]} · ${e.action}`}
                    >
                      {e.action}
                    </span>
                  </span>
                  {/* Actor */}
                  <span className="truncate text-[12px] text-foreground" title={e.actor ?? undefined}>
                    {e.actor ?? "system"}
                  </span>
                  {/* Conversation (copy) */}
                  <span>
                    {e.conversationId ? (
                      <button
                        onClick={() => void copyConversationId(e)}
                        aria-label={`Copy conversation id ${e.conversationId}`}
                        title={e.conversationId}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                      >
                        <span className="truncate">{shortId(e.conversationId, 10)}</span>
                        {copiedFor === e.id ? (
                          <span className="shrink-0 text-teal">copied</span>
                        ) : (
                          <Copy size={10} className="shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      <span className="font-mono text-[10px] text-muted-foreground/50">—</span>
                    )}
                  </span>
                  {/* Meta snippet / expandable */}
                  <span className="min-w-0">
                    {snippet ? (
                      <button
                        onClick={() => toggleExpanded(e.id)}
                        aria-expanded={isOpen}
                        aria-label={isOpen ? "Collapse metadata" : "Expand metadata"}
                        className="flex w-full items-start gap-1.5 text-left"
                      >
                        {isOpen ? (
                          <ChevronDown size={11} className="mt-0.5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
                        ) : (
                          <ChevronRight size={11} className="mt-0.5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
                        )}
                        {isOpen ? (
                          <code className="block min-w-0 break-all whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-muted-foreground">
                            {JSON.stringify(e.meta, null, 2)}
                          </code>
                        ) : (
                          <code className="block min-w-0 truncate font-mono text-[10px] text-muted-foreground/80">
                            {snippet.length > MAX_SNIPPET ? `${snippet.slice(0, MAX_SNIPPET)}…` : snippet}
                          </code>
                        )}
                      </button>
                    ) : (
                      <span className="font-mono text-[10px] text-muted-foreground/50">—</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
