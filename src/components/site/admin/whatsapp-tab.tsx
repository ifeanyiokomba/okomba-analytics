"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  FileText,
  Loader2,
  MessageCircle,
  Paperclip,
  Phone,
  QrCode,
  Search,
  Send,
  SendHorizontal,
  User,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatPhoneDisplay,
  formatNaira,
  timeAgo,
  type WhatsAppChat,
  type WhatsAppMessage,
  type WhatsAppServiceStatus,
} from "./types";

/* ─────────────────────────────────────────────────────────────
   WhatsApp widget (Module 6) — send/receive customer messages
   without leaving the admin.

   • Left panel: customer list (invoices + enquiries + chat traffic)
   • Right panel: chat history from whatsapp_messages
   • Input + "Attach Invoice" (latest pending invoice PDF re-generated)
   • Quick replies: Thanks for payment · Invoice attached · Need more info?
   • Live status badge + QR modal when disconnected
   • Live updates via socket.io → /?XTransformPort=3005
   ───────────────────────────────────────────────────────────── */

const QUICK_REPLIES = [
  "Thanks for payment",
  "Invoice attached",
  "Need more info?",
] as const;

const STATUS_STYLES: Record<string, string> = {
  connected: "border-teal/40 bg-teal-dim text-teal",
  connecting: "border-gold/40 bg-gold-dim text-gold",
  disconnected: "border-red-500/40 bg-red-500/10 text-red-300",
  unknown: "border-white/15 bg-white/[0.04] text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  connected: "Connected",
  connecting: "Connecting…",
  disconnected: "Disconnected",
  unknown: "No service",
};

export function WhatsAppTab({
  notify,
  onMessagesChanged,
}: {
  notify: (text: string, type?: "ok" | "err") => void;
  onMessagesChanged?: () => void;
}) {
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [status, setStatus] = useState<WhatsAppServiceStatus | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [attachInvoice, setAttachInvoice] = useState<WhatsAppChat["latestInvoice"]>(null);
  const [sending, setSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const scrollRef = useRef<HTMLDivElement>(null);
  const activePhoneRef = useRef<string | null>(null);
  activePhoneRef.current = activePhone;
  const prevStatusRef = useRef<string | null>(null);

  const activeChat = useMemo(
    () => chats.find((c) => c.phone === activePhone) ?? null,
    [chats, activePhone]
  );

  /* ── Data loaders ─────────────────────────────────────────── */
  const loadChats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/chats");
      if (res.ok) {
        const j = await res.json();
        setChats(j.chats ?? []);
      }
    } catch {
      /* transient */
    } finally {
      setLoadingChats(false);
    }
  }, []);

  const loadMessages = useCallback(async (phone: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/whatsapp/messages?phone=${encodeURIComponent(phone)}`);
      if (res.ok) {
        const j = await res.json();
        setMessages(j.messages ?? []);
      }
    } catch {
      /* transient */
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/status");
      if (res.ok) {
        const j = await res.json();
        setStatus(j.status ?? null);
        setQr(j.status?.qr ?? null);
      }
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    loadChats();
    loadStatus();
  }, [loadChats, loadStatus]);

  useEffect(() => {
    if (activePhone) loadMessages(activePhone);
  }, [activePhone, loadMessages]);

  /* ── Live updates (socket.io via the gateway) ─────────────── */
  useEffect(() => {
    // Path must stay "/" — the Caddy gateway routes /?XTransformPort=3005
    const socket: Socket = io("/?XTransformPort=3005", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socket.on("status", (s: { mode?: string; status?: string; phone?: string | null }) => {
      const nextStatus = s.status ?? "unknown";
      // Toast on transitions (spec): "WhatsApp disconnected. Scan QR again"
      // NOTE: notify() must run OUTSIDE the setState updater — calling it
      // during the render phase triggers "update while rendering" errors.
      if (prevStatusRef.current === "connected" && nextStatus === "disconnected") {
        notify("WhatsApp disconnected. Scan QR again", "err");
      }
      if (prevStatusRef.current !== "connected" && nextStatus === "connected") {
        notify("WhatsApp connected", "ok");
      }
      prevStatusRef.current = nextStatus;
      setStatus({
        mode: s.mode ?? "unknown",
        status: nextStatus,
        phone: s.phone ?? null,
        serviceUp: true,
      });
      if (nextStatus !== "disconnected") setQr(null);
    });

    socket.on("qr", (payload: { qr?: string }) => {
      if (payload.qr) {
        setQr(payload.qr);
        setStatus((prev) =>
          prev ? { ...prev, status: "connecting", qr: payload.qr! } : prev
        );
      }
    });

    socket.on("message", (payload: { direction?: string; phone?: string }) => {
      loadChats();
      if (payload.phone && payload.phone === activePhoneRef.current) {
        loadMessages(payload.phone);
      }
      if (payload.direction === "inbound") {
        onMessagesChanged?.();
      }
    });

    socket.on("connect", () => loadStatus());

    return () => {
      socket.disconnect();
    };
  }, [loadChats, loadMessages, loadStatus, notify, onMessagesChanged]);

  /* ── Polling fallback — keeps the inbox fresh even when the
     websocket can't connect (blocked ports, strict proxies). ── */
  useEffect(() => {
    const t = setInterval(() => {
      loadChats();
      if (activePhoneRef.current) loadMessages(activePhoneRef.current);
    }, 10_000);
    return () => clearInterval(t);
  }, [loadChats, loadMessages]);

  /* Auto-scroll the transcript */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  /* ── Actions ──────────────────────────────────────────────── */
  const openChat = (phone: string) => {
    setActivePhone(phone);
    setAttachInvoice(null);
    setInput("");
    setMobileView("chat");
    setChats((prev) => prev.map((c) => (c.phone === phone ? { ...c, unread: 0 } : c)));
  };

  const send = async (opts?: { forceInvoice?: boolean }) => {
    const phone = activePhone;
    if (!phone) return;
    const wantsInvoice = opts?.forceInvoice || !!attachInvoice;
    const text = input.trim();

    if (!wantsInvoice && !text) return;
    if (wantsInvoice && !attachInvoice && !activeChat?.latestInvoice) {
      notify("No pending invoice for this customer", "err");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: phone,
          text: text || undefined,
          kind: wantsInvoice ? "invoice" : "text",
          invoiceId: attachInvoice?.id,
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) {
        const err = j?.error ?? j?.result?.error ?? "Send failed";
        if (String(err).includes("disconnected")) {
          setShowQr(true);
          notify("WhatsApp is disconnected — scan the QR first", "err");
        } else {
          notify(String(err), "err");
        }
        return;
      }
      setInput("");
      setAttachInvoice(null);
      await Promise.all([loadMessages(phone), loadChats()]);
      onMessagesChanged?.();
      notify(
        wantsInvoice
          ? `Invoice sent on WhatsApp${j.invoiceNumber ? ` (${j.invoiceNumber})` : ""}`
          : "Message sent",
        "ok"
      );
    } catch {
      notify("Send failed — check the WhatsApp service", "err");
    } finally {
      setSending(false);
    }
  };

  const startAttachInvoice = () => {
    const inv = activeChat?.latestInvoice;
    if (!inv) {
      notify("No pending invoice for this customer", "err");
      return;
    }
    setAttachInvoice(inv);
  };

  const runDemoAction = async (action: "scan" | "reply") => {
    try {
      if (action === "scan") {
        await fetch("/api/admin/whatsapp/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "scan" }),
        });
      } else {
        const phone = activePhone;
        if (!phone) {
          notify("Open a chat first", "err");
          return;
        }
        await fetch("/api/admin/whatsapp/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "inbound", from: phone }),
        });
      }
    } catch {
      notify("Demo action failed", "err");
    }
  };

  /* ── Derived ──────────────────────────────────────────────── */
  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q.replace(/\D/g, "")) ||
        (c.service ?? "").toLowerCase().includes(q)
    );
  }, [chats, search]);

  const statusKey = status?.status ?? "unknown";
  const isDemo = status?.mode === "demo";

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header strip ── */}
      <div className="surface-card flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim">
            <MessageCircle size={16} className="text-gold" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[14.5px] font-semibold text-foreground">WhatsApp inbox</h2>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {status?.phone
                ? `Business line ${formatPhoneDisplay(status.phone)}`
                : "Send proposals & chat with customers"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/35 bg-purple-400/10 px-3 py-1.5 font-mono text-[10px] font-medium text-purple-300">
              <Zap size={11} aria-hidden="true" /> DEMO
            </span>
          )}
          <button
            onClick={() => (statusKey === "connected" ? loadStatus() : setShowQr(true))}
            aria-label="WhatsApp connection status"
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-wide transition-colors",
              STATUS_STYLES[statusKey] ?? STATUS_STYLES.unknown
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                statusKey === "connected" ? "bg-teal" : statusKey === "connecting" ? "animate-pulse bg-gold" : "bg-red-400"
              )}
              aria-hidden="true"
            />
            {STATUS_LABELS[statusKey] ?? "No service"}
          </button>
        </div>
      </div>

      {/* ── Widget body ── */}
      <div className="surface-card grid overflow-hidden md:grid-cols-[300px_1fr]" style={{ minHeight: "560px" }}>
        {/* Left — customer list */}
        <aside
          className={cn(
            "flex flex-col border-white/[0.06] md:border-r",
            mobileView === "chat" && "hidden md:flex"
          )}
        >
          <div className="border-b border-white/[0.06] p-3.5">
            <div className="relative">
              <Search
                size={13}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers…"
                aria-label="Search chats"
                className="w-full rounded-lg border border-white/[0.09] bg-white/[0.03] py-2.5 pl-8 pr-3 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
              />
            </div>
          </div>

          <div className="max-h-[560px] flex-1 overflow-y-auto" aria-label="Customer chats">
            {loadingChats ? (
              <div className="flex justify-center py-12">
                <Loader2 size={20} className="animate-spin text-gold" aria-label="Loading chats" />
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <User size={22} className="mx-auto text-muted-foreground/40" aria-hidden="true" />
                <p className="mt-3 text-[12px] text-muted-foreground">
                  No customers yet — chats appear once enquiries or invoices exist.
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isActive = chat.phone === activePhone;
                return (
                  <button
                    key={chat.phone}
                    onClick={() => openChat(chat.phone)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-white/[0.04] px-4 py-3.5 text-left transition-colors",
                      isActive ? "bg-gold/[0.08]" : "hover:bg-white/[0.03]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                        isActive
                          ? "border-gold/40 bg-gold-dim text-gold"
                          : "border-white/[0.09] bg-white/[0.04] text-muted-foreground"
                      )}
                    >
                      {chat.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[13px] font-medium text-foreground">
                          {chat.name}
                        </span>
                        {chat.lastMessage && (
                          <span className="shrink-0 font-mono text-[9.5px] text-muted-foreground">
                            {timeAgo(chat.lastMessage.sentAt)}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className="truncate text-[11.5px] text-muted-foreground">
                          {chat.lastMessage?.media
                            ? "📎 PDF"
                            : chat.lastMessage?.text ?? formatPhoneDisplay(chat.phone)}
                        </span>
                        {chat.unread > 0 && (
                          <span className="ml-auto shrink-0 rounded-full bg-gold px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-ink">
                            {chat.unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right — chat panel */}
        <section
          className={cn(
            "flex min-h-[420px] flex-col",
            mobileView === "list" && "hidden md:flex"
          )}
        >
          {activeChat ? (
            <>
              {/* Chat header */}
              <header className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
                <button
                  onClick={() => setMobileView("list")}
                  aria-label="Back to chat list"
                  className="rounded-lg border border-white/[0.09] bg-white/[0.03] p-1.5 text-muted-foreground transition-colors hover:text-foreground md:hidden"
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                </button>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[13.5px] font-semibold text-foreground">
                    {activeChat.name}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                    <Phone size={10} aria-hidden="true" />
                    {formatPhoneDisplay(activeChat.phone)}
                    {activeChat.service ? ` · ${activeChat.service}` : ""}
                  </p>
                </div>
                {isDemo && (
                  <button
                    onClick={() => void runDemoAction("reply")}
                    aria-label="Simulate a customer reply (demo)"
                    title="Simulate a customer reply (demo)"
                    className="shrink-0 rounded-full border border-purple-400/35 bg-purple-400/10 px-2.5 py-1 font-mono text-[9.5px] font-medium text-purple-300 transition-colors hover:bg-purple-400/20"
                  >
                    SIMULATE REPLY
                  </button>
                )}
                {activeChat.latestInvoice && (
                  <span className="hidden shrink-0 rounded-full border border-gold/30 bg-gold-dim px-2.5 py-1 font-mono text-[9.5px] text-gold sm:inline-block">
                    {activeChat.latestInvoice.invoiceNumber} ·{" "}
                    {formatNaira(activeChat.latestInvoice.amountNaira)}
                  </span>
                )}
              </header>

              {/* Transcript */}
              <div
                ref={scrollRef}
                className="flex-1 space-y-3 overflow-y-auto bg-[#07090f]/60 px-4 py-5"
                role="log"
                aria-label="Chat history"
              >
                {loadingMessages ? (
                  <div className="flex justify-center py-10">
                    <Loader2 size={18} className="animate-spin text-gold" aria-label="Loading messages" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-12 text-center text-[12px] text-muted-foreground">
                    No messages yet — say hello or attach an invoice.
                  </p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex",
                        m.direction === "outbound" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[78%] rounded-2xl border px-3.5 py-2.5",
                          m.direction === "outbound"
                            ? "rounded-br-md border-gold/25 bg-gold/[0.10]"
                            : "rounded-bl-md border-white/[0.08] bg-white/[0.05]"
                        )}
                      >
                        {m.mediaFilename && (
                          <a
                            href={`/api/admin/invoices/${m.relatedInvoiceId}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="mb-2 flex items-center gap-2.5 rounded-xl border border-white/[0.09] bg-[#0B0F1A]/80 px-3 py-2.5 transition-colors hover:border-gold/40"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-dim">
                              <FileText size={14} className="text-gold" aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[11.5px] font-medium text-foreground">
                                {m.mediaFilename}
                              </span>
                              <span className="font-mono text-[9px] text-muted-foreground">
                                PDF · tap to open
                              </span>
                            </span>
                          </a>
                        )}
                        {m.messageText && (
                          <p className="whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-foreground">
                            {m.messageText}
                          </p>
                        )}
                        <p className="mt-1.5 flex items-center justify-end gap-1.5 font-mono text-[9px] text-muted-foreground">
                          {timeAgo(m.sentAt)}
                          {m.direction === "outbound" &&
                            (m.status === "sent" ? (
                              <BadgeCheck size={11} className="text-teal" aria-label="Sent" />
                            ) : m.status === "queued" ? (
                              <Clock3 size={11} className="text-gold" aria-label="Queued" />
                            ) : null)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Composer */}
              <footer className="border-t border-white/[0.06] px-4 py-3.5">
                {/* Quick replies */}
                <div className="mb-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Quick replies">
                  {QUICK_REPLIES.map((qr2) => (
                    <button
                      key={qr2}
                      onClick={() => setInput(qr2)}
                      className="rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                    >
                      {qr2}
                    </button>
                  ))}
                </div>

                {/* Pending invoice attachment chip */}
                {attachInvoice && (
                  <div className="mb-2.5 flex items-center gap-2.5 rounded-xl border border-gold/30 bg-gold-dim px-3 py-2.5">
                    <FileText size={15} className="shrink-0 text-gold" aria-hidden="true" />
                    <p className="min-w-0 flex-1 truncate text-[11.5px] text-foreground">
                      <span className="font-semibold">{attachInvoice.invoiceNumber}</span>
                      {" · "}
                      {formatNaira(attachInvoice.amountNaira)}
                      {attachInvoice.dueDate
                        ? ` · due ${new Date(attachInvoice.dueDate).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                          })}`
                        : ""}
                    </p>
                    <button
                      onClick={() => setAttachInvoice(null)}
                      aria-label="Remove attachment"
                      className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <button
                    onClick={startAttachInvoice}
                    aria-label="Attach latest pending invoice PDF"
                    title="Attach latest pending invoice PDF"
                    className={cn(
                      "shrink-0 rounded-xl border p-2.5 transition-colors",
                      attachInvoice
                        ? "border-gold/50 bg-gold-dim text-gold"
                        : "border-white/[0.09] bg-white/[0.03] text-muted-foreground hover:border-gold/40 hover:text-gold"
                    )}
                  >
                    <Paperclip size={15} aria-hidden="true" />
                  </button>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    rows={1}
                    placeholder="Type a message…"
                    aria-label="Message text"
                    className="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
                  />
                  <button
                    onClick={() => void send()}
                    disabled={sending || (!input.trim() && !attachInvoice)}
                    aria-label="Send message"
                    className="shrink-0 rounded-xl border border-gold/45 bg-gold-dim p-2.5 text-gold transition-all hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? (
                      <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <SendHorizontal size={15} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <Send size={26} className="text-muted-foreground/40" aria-hidden="true" />
              <p className="text-[13px] font-medium text-foreground">Select a conversation</p>
              <p className="max-w-xs text-[12px] leading-relaxed text-muted-foreground">
                Pick a customer on the left. You can chat, attach their pending invoice as a
                PDF, or use a quick reply.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ── QR modal ── */}
      {showQr && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Connect WhatsApp"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowQr(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/[0.09] bg-[#0B0F1A] p-6 shadow-float"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim">
                <QrCode size={18} className="text-gold" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">Connect WhatsApp</h3>
                <p className="text-[11.5px] text-muted-foreground">
                  {isDemo ? "Demo session — simulate a scan" : "Scan with your WhatsApp phone"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-center rounded-xl border border-white/[0.07] bg-white p-3">
              {qr ? (
                <img src={qr} alt="WhatsApp QR code" className="h-56 w-56" />
              ) : (
                <div className="flex h-56 w-56 flex-col items-center justify-center gap-2 text-center">
                  <Loader2 size={22} className="animate-spin text-gold" aria-label="Generating QR" />
                  <p className="px-6 text-[11px] text-muted-foreground">
                    Waiting for a QR code from the WhatsApp engine…
                  </p>
                </div>
              )}
            </div>

            <ol className="mt-4 space-y-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
              <li>1. Open WhatsApp on your phone</li>
              <li>2. Settings → Linked devices → Link a device</li>
              <li>3. Point the camera at this QR code</li>
            </ol>

            <div className="mt-4 flex flex-col gap-2">
              {isDemo && (
                <button
                  onClick={() => {
                    void runDemoAction("scan");
                    setShowQr(false);
                  }}
                  className="rounded-xl border border-gold/45 bg-gold-dim px-4 py-2.5 text-[12.5px] font-semibold text-gold transition-colors hover:bg-gold/20"
                >
                  Simulate scan (demo)
                </button>
              )}
              <button
                onClick={() => setShowQr(false)}
                className="rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
