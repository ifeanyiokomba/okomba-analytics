"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Ban,
  BookOpen,
  Bot,
  Check,
  ChevronRight,
  History,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  SendHorizontal,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CHAT_SENTIMENT_STYLES,
  CHAT_STATUS_FILTERS,
  CHAT_URGENCY_STYLES,
  chatStatusMeta,
  shortId,
  type AdminChatConversationDetail,
  type AdminChatConversationRow,
  type AdminChatMessage,
} from "@/lib/chat-shared";
import { timeAgo, formatTimestamp } from "./types";
import { AiKnowledgeEditor } from "./ai-knowledge-editor";
import { AiAuditTrail } from "./ai-audit-trail";
import { AiAutonomyTab } from "./ai-autonomy-tab";

/* ─────────────────────────────────────────────────────────────
   BATCH 11 (§58–§63) — AI Monitor tab.

   Self-fetching (whatsapp-tab pattern — no dashboard `load()`
   changes): internal sub-tabs Conversations | Knowledge Base |
   Audit Trail, state remembered while the tab is open.

   Conversations: status chips + search (?q=) + 10s auto-refresh;
   desktop list|detail split, mobile stacks with a back button.
   Detail polls every 5s; takeover_requested → Accept/Decline,
   human → agent reply composer (Cmd/Ctrl+Enter to send).
   ───────────────────────────────────────────────────────────── */

type SubTab = "conversations" | "knowledge" | "audit" | "autonomy";

const SUBTABS: { id: SubTab; label: string; icon: typeof Bot }[] = [
  { id: "conversations", label: "Conversations", icon: MessageSquare },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
  { id: "audit", label: "Audit Trail", icon: History },
  { id: "autonomy", label: "Autonomy", icon: SlidersHorizontal },
];

export function AiMonitorTab({ notify }: { notify: (text: string, type?: "ok" | "err") => void }) {
  const [subTab, setSubTab] = useState<SubTab>("conversations");
  const [visited, setVisited] = useState<Record<SubTab, boolean>>({
    conversations: true,
    knowledge: false,
    audit: false,
    autonomy: false,
  });
  /* Audit pre-filter arriving from a conversation's "View audit" */
  const [auditConversationId, setAuditConversationId] = useState<string | null>(null);
  const [auditSignal, setAuditSignal] = useState(0);

  const switchSub = useCallback((next: SubTab) => {
    setSubTab(next);
    setVisited((v) => ({ ...v, [next]: true }));
  }, []);

  const openAuditFor = useCallback(
    (conversationId: string) => {
      setAuditConversationId(conversationId);
      setAuditSignal((s) => s + 1); // refetch with the new filter
      switchSub("audit");
    },
    [switchSub]
  );

  /** After an admin action, the audit trail (if visited) goes stale. */
  const notifyAuditStale = useCallback(() => setAuditSignal((s) => s + 1), []);

  /** Autonomy → audit jump (no conversation filter). */
  const openAuditAll = useCallback(() => {
    setAuditConversationId(null);
    switchSub("audit");
  }, [switchSub]);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header strip ── */}
      <div className="surface-card flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim">
            <Bot size={16} className="text-gold" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[14.5px] font-semibold text-foreground">AI Monitor</h2>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              Chat conversations, knowledge base, audit trail & autonomy policy
            </p>
          </div>
        </div>
      </div>

      {/* ── Sub-tab segmented control (state remembered while open) ── */}
      <div className="surface-card flex flex-wrap items-center gap-1.5 px-2 py-2" role="tablist" aria-label="AI Monitor sections">
        {SUBTABS.map((s) => {
          const isActive = subTab === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => switchSub(s.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[12.5px] font-medium transition-colors",
                isActive
                  ? "bg-gold/15 text-gold"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              )}
            >
              <Icon size={13} aria-hidden="true" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ── Panels (visited panels stay mounted so their state survives) ── */}
      {(subTab === "conversations" || visited.conversations) && (
        <ConversationsPanel
          notify={notify}
          active={subTab === "conversations"}
          onOpenAudit={openAuditFor}
          onAuditStale={notifyAuditStale}
        />
      )}
      {(subTab === "knowledge" || visited.knowledge) && <AiKnowledgeEditor notify={notify} />}
      {(subTab === "audit" || visited.audit) && (
        <AiAuditTrail
          notify={notify}
          conversationFilter={auditConversationId}
          onClearFilter={() => setAuditConversationId(null)}
          refreshSignal={auditSignal}
        />
      )}
      {(subTab === "autonomy" || visited.autonomy) && (
        <AiAutonomyTab notify={notify} active={subTab === "autonomy"} onOpenAudit={openAuditAll} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Conversations sub-tab (§58 monitor + §59/§61 actions)
   ═══════════════════════════════════════════════════════════ */

function ConversationsPanel({
  notify,
  active,
  onOpenAudit,
  onAuditStale,
}: {
  notify: (text: string, type?: "ok" | "err") => void;
  active: boolean;
  onOpenAudit: (conversationId: string) => void;
  onAuditStale: () => void;
}) {
  const [conversations, setConversations] = useState<AdminChatConversationRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminChatConversationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const [reply, setReply] = useState("");
  const [actionBusy, setActionBusy] = useState<"accept" | "decline" | "takeover" | "reply" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);
  const prevActiveIdRef = useRef<string | null>(null);

  /* Debounce the search box into the applied ?q= */
  useEffect(() => {
    const t = setTimeout(() => setSearchApplied(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ── List loader (status chips + ?q= search) ── */
  const loadList = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (searchApplied) params.set("q", searchApplied);
      const qs = params.toString();
      const res = await fetch(`/api/admin/chat/conversations${qs ? `?${qs}` : ""}`, { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as { ok: boolean; conversations?: AdminChatConversationRow[] };
      if (j.ok) setConversations(j.conversations ?? []);
    } catch {
      /* transient */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchApplied]);

  useEffect(() => {
    if (active) void loadList();
  }, [active, loadList]);

  /* Auto-refresh every 10s while the sub-tab is visible */
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => void loadList(), 10_000);
    return () => clearInterval(t);
  }, [active, loadList]);

  const refresh = () => {
    setRefreshing(true);
    void loadList();
  };

  /* ── Detail loader (full transcript) ── */
  const loadDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/chat/conversations/${id}`, { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as AdminChatConversationDetail;
      if (j.ok) setDetail(j);
    } catch {
      /* transient */
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (activeId && active) {
      setLoadingDetail(true);
      void loadDetail(activeId);
    }
  }, [activeId, active, loadDetail]);

  /* Poll the open detail every 5s (paused while an action is in-flight) */
  useEffect(() => {
    if (!activeId || !active || actionBusy) return;
    const t = setInterval(() => void loadDetail(activeId), 5_000);
    return () => clearInterval(t);
  }, [activeId, active, actionBusy, loadDetail]);

  /* Auto-scroll: on conversation switch OR when new messages arrive */
  useEffect(() => {
    const count = detail?.messages.length ?? 0;
    const switched = prevActiveIdRef.current !== activeId;
    const grew = count > prevMsgCountRef.current;
    prevMsgCountRef.current = count;
    prevActiveIdRef.current = activeId;
    if (switched || grew) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [detail, activeId]);

  const openConversation = (id: string) => {
    setActiveId(id);
    setReply("");
    setMobileView("detail");
  };

  /* ── Actions (§59 accept / §61 decline / agent reply) ── */
  const runAction = async (action: "accept" | "decline" | "takeover" | "reply", content?: string) => {
    if (!detail) return;
    setActionBusy(action);
    try {
      const res = await fetch(`/api/admin/chat/conversations/${detail.conversation.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(content !== undefined ? { content } : {}) }),
      });
      const j = (await res.json().catch(() => null)) as AdminChatConversationDetail & { ok: boolean; error?: string } | null;
      if (!res.ok || !j?.ok) {
        notify(j?.error ?? "Action failed", "err");
        return;
      }
      setDetail({ ok: true, conversation: j.conversation, messages: j.messages });
      if (action === "reply") setReply("");
      notify(
        action === "accept" || action === "takeover"
          ? "Takeover accepted — you're now chatting with this visitor"
          : action === "decline"
            ? "Handover declined — the AI continues with contact alternatives"
            : "Reply sent",
        "ok"
      );
      void loadList();
      onAuditStale();
    } catch {
      notify("Action failed — network error", "err");
    } finally {
      setActionBusy(null);
    }
  };

  const activeRow = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  const canReply = reply.trim().length >= 1 && reply.length <= 2000;

  return (
    <div className="surface-card grid overflow-hidden md:grid-cols-[340px_1fr]" style={{ minHeight: "560px" }}>
      {/* ── Left — conversation list ── */}
      <aside
        className={cn(
          "flex flex-col border-white/[0.06] md:border-r",
          mobileView === "detail" && "hidden md:flex"
        )}
        aria-label="AI chat conversations"
      >
        {/* Filters */}
        <div className="flex flex-col gap-2.5 border-b border-white/[0.06] p-3.5">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by status">
            {CHAT_STATUS_FILTERS.map((f) => {
              const isOn = statusFilter === f.key;
              return (
                <button
                  key={f.key || "all"}
                  onClick={() => setStatusFilter(f.key)}
                  aria-pressed={isOn}
                  className={cn(
                    "rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                    isOn
                      ? "border-gold/45 bg-gold-dim text-gold"
                      : "border-white/[0.09] bg-white/[0.03] text-muted-foreground hover:border-gold/35 hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                size={13}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search email, name, session…"
                aria-label="Search conversations"
                className="w-full rounded-lg border border-white/[0.09] bg-white/[0.03] py-2.5 pl-8 pr-3 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
              />
            </div>
            <button
              onClick={refresh}
              aria-label="Refresh conversations"
              title="Refresh conversations"
              className="shrink-0 rounded-lg border border-white/[0.09] bg-white/[0.03] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              {refreshing ? (
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw size={13} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Rows */}
        <div className="max-h-[560px] flex-1 overflow-y-auto [scrollbar-width:thin]" aria-label="Conversation list">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={20} className="animate-spin text-gold" aria-label="Loading conversations" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <User size={22} className="mx-auto text-muted-foreground/40" aria-hidden="true" />
              <p className="mt-3 text-[12px] text-muted-foreground">
                No conversations yet — they appear when a visitor chats or requests a human.
              </p>
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = c.id === activeId;
              const meta = chatStatusMeta(c.status);
              return (
                <button
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex w-full flex-col gap-1.5 border-b border-white/[0.04] px-4 py-3.5 text-left transition-colors",
                    isActive ? "bg-gold/[0.08]" : "hover:bg-white/[0.03]"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                      {c.customerName ?? shortId(c.sessionId, 10)}
                    </span>
                    <span className="shrink-0 font-mono text-[9.5px] text-muted-foreground">
                      {timeAgo(c.lastMessageAt)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 pl-[18px]">
                    <span className="min-w-0 flex-1 truncate text-[11.5px] text-muted-foreground">
                      {c.lastMessagePreview || "—"}
                    </span>
                    <span className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                      {c.messageCount}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5 pl-[18px]">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-medium capitalize",
                        CHAT_SENTIMENT_STYLES[c.sentiment ?? ""] ?? "border-white/15 bg-white/[0.04] text-muted-foreground/70"
                      )}
                    >
                      {c.sentiment ?? "unscored"}
                    </span>
                    {c.urgency && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-medium capitalize",
                          CHAT_URGENCY_STYLES[c.urgency] ?? "border-white/15 bg-white/[0.04] text-muted-foreground/70"
                        )}
                      >
                        {c.urgency}
                      </span>
                    )}
                    {c.status === "human" && c.agentName && (
                      <span className="inline-flex max-w-full items-center truncate rounded-full border border-teal/35 bg-teal-dim px-2 py-0.5 text-[9.5px] font-medium text-teal">
                        {c.agentName}
                      </span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Right — detail ── */}
      <section
        className={cn(
          "flex min-h-[420px] flex-col",
          mobileView === "list" && "hidden md:flex"
        )}
        aria-label="Conversation detail"
      >
        {detail && activeRow ? (
          <>
            {/* Detail header */}
            <header className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
              <button
                onClick={() => setMobileView("list")}
                aria-label="Back to conversation list"
                className="rounded-lg border border-white/[0.09] bg-white/[0.03] p-1.5 text-muted-foreground transition-colors hover:text-foreground md:hidden"
              >
                <ArrowLeft size={14} aria-hidden="true" />
              </button>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[13.5px] font-semibold text-foreground">
                  {detail.conversation.customerName ?? shortId(detail.conversation.sessionId, 12)}
                </h3>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", chatStatusMeta(detail.conversation.status).dot)} aria-hidden="true" />
                    {chatStatusMeta(detail.conversation.status).label}
                  </span>
                  <span className="truncate">session {shortId(detail.conversation.sessionId, 14)}</span>
                </p>
              </div>
              <button
                onClick={() => onOpenAudit(detail.conversation.id)}
                aria-label="View audit trail for this conversation"
                title="View audit trail for this conversation"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.03] px-2.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
              >
                <History size={12} aria-hidden="true" />
                <span className="hidden sm:inline">Audit</span>
                <ChevronRight size={11} aria-hidden="true" />
              </button>
            </header>

            {/* Meta panel (§58) */}
            <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 border-b border-white/[0.06] px-4 py-3 text-[11px] sm:grid-cols-2">
              <MetaRow label="Email" value={detail.conversation.customerEmail ?? "—"} mono />
              <MetaRow label="Session" value={detail.conversation.sessionId} mono />
              <MetaRow label="Status" value={chatStatusMeta(detail.conversation.status).label} />
              <MetaRow
                label="Sentiment"
                value={detail.conversation.sentiment ? detail.conversation.sentiment.replace(/^\w/, (c) => c.toUpperCase()) : "—"}
              />
              <MetaRow label="Urgency" value={detail.conversation.urgency ?? "—"} />
              <MetaRow
                label="Escalation reason"
                value={detail.conversation.escalationReason ?? "—"}
              />
              {detail.conversation.escalationNotifiedAt && (
                <MetaRow label="Notified at" value={formatTimestamp(detail.conversation.escalationNotifiedAt)} mono />
              )}
              {detail.conversation.agentEmail && (
                <MetaRow
                  label="Agent"
                  value={`${detail.conversation.agentName ?? "—"} · ${detail.conversation.agentEmail}`}
                />
              )}
              <MetaRow label="Started" value={formatTimestamp(detail.conversation.createdAt)} mono />
              <MetaRow label="Last message" value={formatTimestamp(detail.conversation.lastMessageAt)} mono />
            </div>

            {/* Transcript */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto bg-[#07090f]/60 px-4 py-5 [scrollbar-width:thin]"
              role="log"
              aria-label="Conversation transcript"
            >
              {loadingDetail && detail.messages.length === 0 ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={18} className="animate-spin text-gold" aria-label="Loading transcript" />
                </div>
              ) : detail.messages.length === 0 ? (
                <p className="py-12 text-center text-[12px] text-muted-foreground">
                  No messages stored for this conversation yet.
                </p>
              ) : (
                detail.messages.map((m) => <TranscriptRow key={m.id} m={m} />)
              )}
            </div>

            {/* Action bar / composer (§59/§61) */}
            {detail.conversation.status === "takeover_requested" ? (
              <footer className="border-t border-white/[0.06] px-4 py-3.5">
                <p className="mb-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
                  Visitor asked for a human — accept to take over this chat, or decline and the AI
                  continues with your contact channels.
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => void runAction("accept")}
                    disabled={actionBusy !== null}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gold/60 bg-gold px-4 py-2.5 text-[12.5px] font-semibold text-ink transition-all hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionBusy === "accept" ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Check size={14} aria-hidden="true" />
                    )}
                    Accept takeover
                  </button>
                  <button
                    onClick={() => void runAction("decline")}
                    disabled={actionBusy !== null}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-red-500/40 bg-transparent px-4 py-2.5 text-[12.5px] font-semibold text-red-300 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionBusy === "decline" ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Ban size={14} aria-hidden="true" />
                    )}
                    Decline
                  </button>
                </div>
              </footer>
            ) : detail.conversation.status === "human" ? (
              <footer className="border-t border-white/[0.06] px-4 py-3.5">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-teal">
                  You&apos;re chatting with this visitor · replies send as {detail.conversation.agentName ?? "the team"}
                </p>
                <div className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        if (canReply) void runAction("reply", reply.trim());
                      }
                    }}
                    rows={2}
                    maxLength={2000}
                    placeholder="Type your reply… (⌘/Ctrl + Enter to send)"
                    aria-label="Reply to the visitor"
                    className="max-h-40 min-h-[44px] flex-1 resize-y rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
                  />
                  <button
                    onClick={() => void runAction("reply", reply.trim())}
                    disabled={!canReply || actionBusy !== null}
                    aria-label="Send reply"
                    title="Send reply (⌘/Ctrl + Enter)"
                    className="shrink-0 rounded-xl border border-gold/45 bg-gold-dim p-2.5 text-gold transition-all hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {actionBusy === "reply" ? (
                      <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <SendHorizontal size={15} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <p className={cn("mt-1.5 text-right font-mono text-[10px]", reply.length > 1900 ? "text-red-300" : "text-muted-foreground/70")}>
                  {reply.length}/2000
                </p>
              </footer>
            ) : (
              <footer className="flex flex-wrap items-center justify-between gap-2.5 border-t border-white/[0.06] px-4 py-3.5">
                <p className="text-[11.5px] text-muted-foreground">
                  AI mode — the chatbot is answering this visitor.
                </p>
                <button
                  onClick={() => void runAction("takeover")}
                  disabled={actionBusy !== null}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gold/45 bg-gold-dim px-4 py-2.5 text-[12px] font-semibold text-gold transition-all hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionBusy === "takeover" ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Bot size={14} aria-hidden="true" />
                  )}
                  Take over
                </button>
              </footer>
            )}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <MessageSquare size={26} className="text-muted-foreground/40" aria-hidden="true" />
            <p className="text-[13px] font-medium text-foreground">Select a conversation</p>
            <p className="max-w-xs text-[12px] leading-relaxed text-muted-foreground">
              Pick a chat on the left to read the full transcript, accept handovers or reply as the
              team.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Meta panel row ─────────────────────────────────────── */

function MetaRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <p className="flex min-w-0 items-baseline gap-2">
      <span className="w-[110px] shrink-0 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 break-words text-[11.5px] text-foreground",
          mono && "font-mono text-[10.5px] text-muted-foreground"
        )}
        title={value}
      >
        {value}
      </span>
    </p>
  );
}

/* ── Transcript rows (§58) ───────────────────────────────── */

function TranscriptRow({ m }: { m: AdminChatMessage }) {
  if (m.role === "system") {
    return (
      <div className="flex justify-center py-1" role="status">
        <div className="max-w-[88%] rounded-xl border border-gold/25 bg-gold-dim px-3 py-2 text-center text-[11px] italic leading-relaxed text-gold">
          {m.content}
        </div>
      </div>
    );
  }
  if (m.role === "agent") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] rounded-2xl rounded-br-md border border-gold/30 bg-gold/[0.10] px-3.5 py-2.5">
          <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-gold">
            {m.authorLabel ?? "Team"}
          </span>
          <p className="whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-foreground">
            {m.content}
          </p>
          <p className="mt-1.5 text-right font-mono text-[9px] text-muted-foreground">
            {timeAgo(m.createdAt)}
          </p>
        </div>
      </div>
    );
  }
  if (m.role === "assistant") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[78%] rounded-2xl rounded-bl-md border border-purple-400/25 bg-purple-400/[0.08] px-3.5 py-2.5">
          <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-purple-300">
            OKOMBA AI
          </span>
          <p className="whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-foreground">
            {m.content}
          </p>
          <p className="mt-1.5 text-right font-mono text-[9px] text-muted-foreground">
            {timeAgo(m.createdAt)}
          </p>
        </div>
      </div>
    );
  }
  /* user (visitor) */
  return (
    <div className="flex justify-start">
      <div className="max-w-[78%] rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.05] px-3.5 py-2.5">
        <p className="whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-foreground">
          {m.content}
        </p>
        <p className="mt-1.5 text-right font-mono text-[9px] text-muted-foreground">
          {timeAgo(m.createdAt)}
        </p>
      </div>
    </div>
  );
}
