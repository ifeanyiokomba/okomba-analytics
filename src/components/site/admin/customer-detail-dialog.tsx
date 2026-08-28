"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Building2,
  FileText,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  Plus,
  Send,
  StickyNote,
  Tag as TagIcon,
  User as UserIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CUSTOMER_STATUSES,
  CUSTOMER_STATUS_STYLES,
  formatNaira,
  formatTimestamp,
  timeAgo,
  type CustomerDetail,
  type TimelineItem,
} from "./types";

/* ─────────────────────────────────────────────────────────────
   CustomerDetailDialog — world-class CRM detail view.
   Opens when the admin clicks any customer in the Customers tab.
   Renders a 3-column layout (mobile-first → stacked):
     1. Left rail: contact card + status/tags + stats KPIs
     2. Center column: chronological timeline (inquiries, invoices,
        emails, whatsapp, notes, outbound messages)
     3. Right rail: Send message panel (email + WhatsApp) + Add note
   The timeline is the soul of the CRM — it surfaces EVERY interaction
   with the customer across the whole system in one chronological
   thread so the admin never has to hop between tabs.
   ───────────────────────────────────────────────────────────── */

export function CustomerDetailDialog({
  customerId,
  onClose,
  onSaved,
}: {
  customerId: string | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Message composer state
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendToast, setSendToast] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  // Note composer state
  const [noteBody, setNoteBody] = useState("");
  const [noteContext, setNoteContext] = useState("misc");
  const [addingNote, setAddingNote] = useState(false);

  // Editable status + tags
  const [statusDraft, setStatusDraft] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);

  // ── Load customer detail on open ──
  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    setData(null);
    (async () => {
      try {
        const res = await fetch(`/api/admin/customers/${customerId}`);
        if (!res.ok) throw new Error("Failed to load customer");
        const j = (await res.json()) as CustomerDetail;
        setData(j);
        setStatusDraft(j.customer.status);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [customerId]);

  // ── Esc + scroll lock ──
  useEffect(() => {
    if (!customerId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [customerId, onClose]);

  // Auto-dismiss send toast
  useEffect(() => {
    if (!sendToast) return;
    const t = setTimeout(() => setSendToast(null), 3500);
    return () => clearTimeout(t);
  }, [sendToast]);

  if (!customerId) return null;

  const send = async () => {
    if (!data) return;
    setSending(true);
    setSendToast(null);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, subject, body }),
      });
      const j = (await res.json()) as { ok: boolean; error?: string; note?: string; status?: string };
      if (!res.ok) throw new Error(j.error ?? "Send failed");
      setSendToast({
        text: j.note ?? `${channel === "email" ? "Email" : "WhatsApp message"} ${j.status === "queued" ? "queued" : "sent"} to ${data.customer.name}`,
        type: "ok",
      });
      setSubject("");
      setBody("");
      // Refresh timeline
      const fresh = await fetch(`/api/admin/customers/${customerId}`);
      if (fresh.ok) setData((await fresh.json()) as CustomerDetail);
      onSaved?.();
    } catch (err) {
      setSendToast({
        text: err instanceof Error ? err.message : "Send failed",
        type: "err",
      });
    } finally {
      setSending(false);
    }
  };

  const addNote = async () => {
    if (!data || noteBody.trim().length < 2) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteBody, context: noteContext }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      setNoteBody("");
      const fresh = await fetch(`/api/admin/customers/${customerId}`);
      if (fresh.ok) setData((await fresh.json()) as CustomerDetail);
      onSaved?.();
    } catch {
      /* non-fatal */
    } finally {
      setAddingNote(false);
    }
  };

  const saveStatus = async () => {
    if (!data || !statusDraft || statusDraft === data.customer.status) return;
    setSavingStatus(true);
    try {
      await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusDraft }),
      });
      const fresh = await fetch(`/api/admin/customers/${customerId}`);
      if (fresh.ok) setData((await fresh.json()) as CustomerDetail);
      onSaved?.();
    } finally {
      setSavingStatus(false);
    }
  };

  const addTag = async () => {
    if (!data || !tagDraft.trim()) return;
    const newTags = Array.from(new Set([...data.customer.tags, tagDraft.trim().toLowerCase()]));
    setTagDraft("");
    try {
      await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: newTags }),
      });
      const fresh = await fetch(`/api/admin/customers/${customerId}`);
      if (fresh.ok) setData((await fresh.json()) as CustomerDetail);
      onSaved?.();
    } catch {
      /* non-fatal */
    }
  };

  const removeTag = async (t: string) => {
    if (!data) return;
    const newTags = data.customer.tags.filter((x) => x !== t);
    try {
      await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: newTags }),
      });
      const fresh = await fetch(`/api/admin/customers/${customerId}`);
      if (fresh.ok) setData((await fresh.json()) as CustomerDetail);
      onSaved?.();
    } catch {
      /* non-fatal */
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-stretch justify-center bg-[#03050a]/88 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Customer CRM detail"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        className="section-dark relative flex w-full max-w-6xl flex-col overflow-hidden border-x border-white/[0.07] bg-[#0b101c] shadow-float [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]"
      >
        {/* Header bar */}
        <header className="relative shrink-0 border-b border-white/[0.07] bg-gradient-to-r from-[#0b101c] via-[#0e1424] to-[#0b101c] px-5 py-4 md:px-7 md:py-5">
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gold/[0.08] blur-2xl" aria-hidden="true" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={onClose}
                aria-label="Close customer detail"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.04] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
              >
                <ArrowLeft size={16} aria-hidden="true" />
              </button>
              {data && (
                <div className="min-w-0">
                  <p className="eyebrow text-[9px] text-gold">CRM · Customer</p>
                  <h2 className="mt-0.5 truncate font-display text-[18px] font-bold leading-tight text-foreground sm:text-[20px]">
                    {data.customer.name}
                  </h2>
                  <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                    {data.customer.email}
                    {data.customer.company ? ` · ${data.customer.company}` : ""}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Body — 3-column on desktop, stacked on mobile */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[280px_1fr_300px]">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center gap-3 py-24">
              <Loader2 size={26} className="animate-spin text-gold" aria-label="Loading customer" />
              <p className="text-[12.5px] text-muted-foreground">Loading CRM timeline…</p>
            </div>
          ) : error ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-24 text-center">
              <p className="text-[13px] text-red-300">{error}</p>
              <button
                onClick={onClose}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] font-medium text-foreground transition-colors hover:border-gold/30"
              >
                Close
              </button>
            </div>
          ) : data ? (
            <>
              {/* ── LEFT RAIL — contact card + status + tags + KPIs ── */}
              <aside className="border-b border-white/[0.06] p-5 lg:border-b-0 lg:border-r">
                <ContactCard data={data} />
                <StatusEditor
                  data={data}
                  statusDraft={statusDraft}
                  setStatusDraft={setStatusDraft}
                  saveStatus={saveStatus}
                  savingStatus={savingStatus}
                />
                <TagsEditor
                  data={data}
                  tagDraft={tagDraft}
                  setTagDraft={setTagDraft}
                  addTag={addTag}
                  removeTag={removeTag}
                />
                <StatsStrip data={data} />
              </aside>

              {/* ── CENTER — Timeline ── */}
              <section className="border-b border-white/[0.06] p-5 lg:border-b-0 lg:border-r">
                <Timeline data={data} />
              </section>

              {/* ── RIGHT RAIL — Send message + Add note ── */}
              <aside className="p-5">
                <MessageComposer
                  data={data}
                  channel={channel}
                  setChannel={setChannel}
                  subject={subject}
                  setSubject={setSubject}
                  body={body}
                  setBody={setBody}
                  sending={sending}
                  onSend={send}
                  toast={sendToast}
                />
                <NoteComposer
                  body={noteBody}
                  setBody={setNoteBody}
                  context={noteContext}
                  setContext={setNoteContext}
                  adding={addingNote}
                  onAdd={addNote}
                />
              </aside>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────── */

function ContactCard({ data }: { data: CustomerDetail }) {
  const c = data.customer;
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-light to-gold font-display text-[15px] font-bold text-ink">
          {c.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-foreground">{c.name}</p>
          {c.role && <p className="truncate text-[11px] text-muted-foreground">{c.role}</p>}
        </div>
      </div>
      <div className="mt-4 space-y-2 text-[12px]">
        <ContactRow icon={Mail} label={c.email} href={`mailto:${c.email}`} />
        {c.phone && <ContactRow icon={UserIcon} label={c.phone} href={`tel:${c.phone}`} />}
        {c.whatsapp && (
          <ContactRow icon={MessageCircle} label={c.whatsapp} href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} />
        )}
        {c.company && <ContactRow icon={Building2} label={c.company} />}
        <ContactRow icon={TagIcon} label={`source: ${c.source}`} />
        {c.lastContactAt && (
          <p className="pt-1 font-mono text-[10px] text-muted-foreground/70">
            Last contact: {timeAgo(c.lastContactAt)}
          </p>
        )}
      </div>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof Mail;
  label: string;
  href?: string;
}) {
  const inner = (
    <>
      <Icon size={12} className="shrink-0 text-muted-foreground/60" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </>
  );
  return href ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-gold"
    >
      {inner}
    </a>
  ) : (
    <div className="flex items-center gap-2 text-muted-foreground">{inner}</div>
  );
}

function StatusEditor({
  data,
  statusDraft,
  setStatusDraft,
  saveStatus,
  savingStatus,
}: {
  data: CustomerDetail;
  statusDraft: string | null;
  setStatusDraft: (v: string) => void;
  saveStatus: () => void;
  savingStatus: boolean;
}) {
  const dirty = statusDraft !== null && statusDraft !== data.customer.status;
  return (
    <div className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <p className="eyebrow mb-2 text-[9px] text-muted-foreground">Stage</p>
      <div className="flex flex-wrap gap-1.5">
        {CUSTOMER_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusDraft(s)}
            disabled={savingStatus}
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-wider transition-colors disabled:opacity-50",
              statusDraft === s
                ? CUSTOMER_STATUS_STYLES[s]
                : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground"
            )}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>
      {dirty && (
        <button
          onClick={saveStatus}
          disabled={savingStatus}
          className="btn-shine mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-gold-light to-gold px-3 py-1.5 text-[11px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          {savingStatus ? <Loader2 size={11} className="animate-spin" /> : null}
          Save stage
        </button>
      )}
    </div>
  );
}

function TagsEditor({
  data,
  tagDraft,
  setTagDraft,
  addTag,
  removeTag,
}: {
  data: CustomerDetail;
  tagDraft: string;
  setTagDraft: (v: string) => void;
  addTag: () => void;
  removeTag: (t: string) => void;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <p className="eyebrow mb-2 text-[9px] text-muted-foreground">Tags</p>
      <div className="flex flex-wrap gap-1.5">
        {data.customer.tags.length === 0 ? (
          <span className="text-[11px] text-muted-foreground/70">No tags yet.</span>
        ) : (
          data.customer.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full border border-teal/25 bg-teal-dim px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-teal"
            >
              {t}
              <button
                onClick={() => removeTag(t)}
                aria-label={`Remove tag ${t}`}
                className="text-teal/60 transition-colors hover:text-teal"
              >
                <X size={9} aria-hidden="true" />
              </button>
            </span>
          ))
        )}
      </div>
      <div className="mt-2.5 flex gap-1.5">
        <input
          type="text"
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          placeholder="Add tag…"
          className="w-full rounded-lg border border-white/[0.09] bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
        />
        <button
          onClick={addTag}
          aria-label="Add tag"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold-dim text-gold transition-colors hover:bg-gold/20"
        >
          <Plus size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function StatsStrip({ data }: { data: CustomerDetail }) {
  const s = data.stats;
  const cells: { label: string; value: string | number; tone?: string }[] = [
    { label: "Inquiries", value: s.inquiries },
    { label: "Invoices", value: s.invoices },
    { label: "Paid", value: s.paidInvoices, tone: "text-teal" },
    { label: "Emails", value: s.emails },
    { label: "WhatsApp", value: s.whatsapp },
    { label: "Pipeline", value: formatNaira(s.totalPipelineNaira), tone: "text-gold" },
  ];
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {cells.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-2.5 py-2"
        >
          <p className="font-mono text-[8.5px] uppercase tracking-wider text-muted-foreground">
            {c.label}
          </p>
          <p className={cn("mt-1 font-mono text-[12px] font-bold", c.tone ?? "text-foreground")}>
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function Timeline({ data }: { data: CustomerDetail }) {
  if (!data.timeline.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Inbox size={28} className="text-muted-foreground/40" aria-hidden="true" />
        <p className="max-w-md text-[13px] leading-relaxed text-muted-foreground">
          No interactions yet. Send this customer a message or add a note — it&apos;ll appear here.
        </p>
      </div>
    );
  }
  return (
    <ol className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-gold/40 before:via-white/[0.08] before:to-transparent">
      {data.timeline.map((item) => (
        <TimelineRow key={`${item.kind}-${item.id}`} item={item} />
      ))}
    </ol>
  );
}

function TimelineRow({ item }: { item: TimelineItem }) {
  const iconAndTone = (() => {
    switch (item.kind) {
      case "inquiry":
        return { Icon: Inbox, tone: "text-gold border-gold/30 bg-gold-dim" };
      case "invoice":
        return { Icon: FileText, tone: "text-teal border-teal/30 bg-teal-dim" };
      case "email":
        return { Icon: Mail, tone: "text-[#5b9eff] border-[#5b9eff]/30 bg-[#5b9eff]/10" };
      case "whatsapp":
        return { Icon: MessageCircle, tone: "text-[#1E8C5E] border-[#1E8C5E]/30 bg-[#1E8C5E]/10" };
      case "note":
        return { Icon: StickyNote, tone: "text-purple-300 border-purple-400/30 bg-purple-400/10" };
      case "message":
        return { Icon: Send, tone: "text-gold border-gold/30 bg-gold-dim" };
    }
  })();
  const Icon = iconAndTone.Icon;
  const isInbound = item.direction === "inbound";
  return (
    <li className="relative flex gap-3.5 pl-0">
      <span
        className={cn(
          "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
          iconAndTone.tone
        )}
      >
        <Icon size={14} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition-colors hover:bg-white/[0.035]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="text-[13px] font-semibold text-foreground">
            {item.title}
            {isInbound && (
              <span className="ml-1.5 rounded-full border border-gold/25 bg-gold-dim px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-gold">
                inbound
              </span>
            )}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {formatTimestamp(item.at)}
          </p>
        </div>
        {item.subtitle && (
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">{item.subtitle}</p>
        )}
        {item.body && (
          <p className="mt-1.5 whitespace-pre-line text-[12.5px] leading-relaxed text-muted-foreground">
            {item.body}
          </p>
        )}
        {item.meta && Object.keys(item.meta).length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {Object.entries(item.meta).map(([k, v]) => {
              if (v === null || v === undefined || v === "") return null;
              const isNum = typeof v === "number";
              const str = isNum && k === "amountNaira" ? formatNaira(Number(v)) : String(v);
              return (
                <span
                  key={k}
                  className="rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 font-mono text-[9.5px] text-muted-foreground"
                >
                  <span className="text-muted-foreground/70">{k}:</span>{" "}
                  <span className="text-foreground">{str}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </li>
  );
}

function MessageComposer({
  data,
  channel,
  setChannel,
  subject,
  setSubject,
  body,
  setBody,
  sending,
  onSend,
  toast,
}: {
  data: CustomerDetail;
  channel: "email" | "whatsapp";
  setChannel: (v: "email" | "whatsapp") => void;
  subject: string;
  setSubject: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  sending: boolean;
  onSend: () => void;
  toast: { text: string; type: "ok" | "err" } | null;
}) {
  const c = data.customer;
  return (
    <div className="rounded-2xl border border-gold/15 bg-gradient-to-br from-gold/[0.07] to-transparent p-4">
      <p className="eyebrow mb-2 text-[9px] text-gold">Send a message</p>
      <div className="mb-3 inline-flex rounded-lg border border-white/[0.08] bg-white/[0.02] p-0.5">
        <button
          onClick={() => setChannel("email")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors",
            channel === "email" ? "bg-gold-dim text-gold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Mail size={11} aria-hidden="true" /> Email
        </button>
        <button
          onClick={() => setChannel("whatsapp")}
          disabled={!c.whatsapp && !c.phone}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            channel === "whatsapp" ? "bg-[#1E8C5E]/15 text-[#1E8C5E]" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageCircle size={11} aria-hidden="true" /> WhatsApp
        </button>
      </div>

      {channel === "email" && (
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject…"
          className="mb-2 w-full rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
        />
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        placeholder={
          channel === "email"
            ? `Hi ${c.name.split(" ")[0]},\nthank you for your interest in Okomba Analytics…`
            : `Hi ${c.name.split(" ")[0]} — following up on your project inquiry…`
        }
        className="w-full resize-none rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2 text-[12.5px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
      />
      <button
        onClick={onSend}
        disabled={sending || body.trim().length < 2 || (channel === "email" && !subject.trim())}
        className="btn-shine mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold-light to-gold px-4 py-2.5 text-[12.5px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
      >
        {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} strokeWidth={2.4} />}
        {sending ? "Sending…" : `Send ${channel === "email" ? "email" : "WhatsApp"}`}
      </button>
      {toast && (
        <p
          role="status"
          className={cn(
            "mt-2.5 rounded-md border px-2.5 py-1.5 text-[11px]",
            toast.type === "ok"
              ? "border-teal/30 bg-teal-dim text-teal"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          )}
        >
          {toast.text}
        </p>
      )}
    </div>
  );
}

function NoteComposer({
  body,
  setBody,
  context,
  setContext,
  adding,
  onAdd,
}: {
  body: string;
  setBody: (v: string) => void;
  context: string;
  setContext: (v: string) => void;
  adding: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <p className="eyebrow mb-2 text-[9px] text-muted-foreground">Add internal note</p>
      <select
        value={context}
        onChange={(e) => setContext(e.target.value)}
        className="mb-2 w-full cursor-pointer rounded-lg border border-white/[0.09] bg-[#0b101c] px-2.5 py-1.5 text-[11.5px] text-foreground outline-none focus:border-gold/60"
      >
        {["call", "email", "whatsapp", "meeting", "referral", "misc"].map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="e.g. Called Adaeze — she confirmed ₦850k budget for the wallet project, decision by Friday."
        className="w-full resize-none rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2 text-[12px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
      />
      <button
        onClick={onAdd}
        disabled={adding || body.trim().length < 2}
        className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-[12px] font-medium text-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
      >
        {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        Save note
      </button>
    </div>
  );
}
