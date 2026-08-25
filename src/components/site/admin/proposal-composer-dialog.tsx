"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CircleAlert,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira, type Inquiry, type ProposalDraft } from "./types";

/* ─────────────────────────────────────────────────────────────
   Proposal Composer — 3-step flow:
   1. AI draft (editable)
   2. Commercial details (amount / duration / due date)
   3. Review & send → invoice + DVA + branded PDF email
   ───────────────────────────────────────────────────────────── */

type Step = 1 | 2 | 3;

const EMPTY_DRAFT: ProposalDraft = {
  executiveSummary: "",
  objectives: [],
  scope: [],
  deliverables: [],
  timeline: [],
  terms: [],
};

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const unlines = (arr: string[]) => arr.join("\n");

export function ProposalComposerDialog({
  inquiry,
  onClose,
  onSent,
}: {
  inquiry: Inquiry | null;
  onClose: () => void;
  onSent: (result: { invoiceNumber: string; emailSent: boolean }) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<ProposalDraft>(EMPTY_DRAFT);
  const [hasDraft, setHasDraft] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genNote, setGenNote] = useState<string | null>(null);

  // commercial
  const [amountRaw, setAmountRaw] = useState("");
  const [duration, setDuration] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lineItem, setLineItem] = useState("");

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentResult, setSentResult] = useState<{
    invoiceNumber: string;
    dva?: { accountNumber: string; bankName: string; sandbox: boolean };
    emailSent?: boolean;
    whatsappQueued?: boolean;
    invoiceId?: string;
  } | null>(null);

  useEffect(() => {
    if (!inquiry) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [inquiry, onClose]);

  // Reset when opening for a different inquiry
  useEffect(() => {
    if (inquiry) {
      setStep(1);
      setDraft(EMPTY_DRAFT);
      setHasDraft(false);
      setGenNote(null);
      setAmountRaw("");
      setDuration("");
      setDueDate("");
      setLineItem("");
      setSending(false);
      setSendError(null);
      setSentResult(null);
    }
  }, [inquiry]);

  const generate = useCallback(async () => {
    if (!inquiry) return;
    setGenerating(true);
    setGenNote(null);
    try {
      const res = await fetch("/api/admin/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId: inquiry.id }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? "Generation failed");
      setDraft(j.proposal as ProposalDraft);
      setHasDraft(true);
      setGenNote(
        j.usedFallback
          ? "AI unavailable — a structured template was loaded. Edit freely."
          : "AI draft ready — review and edit every section before sending."
      );
    } catch (err) {
      setGenNote(err instanceof Error ? err.message : "Generation failed — try again.");
    } finally {
      setGenerating(false);
    }
  }, [inquiry]);

  const amountNaira = useMemo(() => {
    const digits = amountRaw.replace(/[^0-9]/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }, [amountRaw]);

  const draftReady =
    draft.executiveSummary.trim().length > 10 &&
    draft.objectives.length > 0 &&
    draft.deliverables.length > 0;

  const canSend = amountNaira > 0 && draftReady && !sending;

  const send = useCallback(async () => {
    if (!inquiry || !canSend) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/admin/proposals/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryId: inquiry.id,
          proposal: draft,
          amountNaira,
          durationLabel: duration.trim() || undefined,
          dueDate: dueDate || undefined,
          description: lineItem.trim() || undefined,
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? "Send failed");
      setSentResult(j);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }, [inquiry, canSend, draft, amountNaira, duration, dueDate, lineItem]);

  if (!inquiry) return null;

  const firstName = inquiry.name.split(" ")[0];
  const emailSubject = `Your Proposal from Okomba Analytics - Invoice #INV-…`;
  const waCaption = `Hi ${firstName}, here is your proposal and invoice from Okomba Analytics`;

  /* ── Small field components ── */

  const Field = ({
    label,
    hint,
    children,
  }: {
    label: string;
    hint?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label className="eyebrow text-[9.5px] text-muted-foreground">{label}</label>
        {hint && <span className="font-mono text-[9.5px] text-muted-foreground/60">{hint}</span>}
      </div>
      {children}
    </div>
  );

  const inputCls =
    "w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-gold/60";
  const areaCls = cn(inputCls, "min-h-[84px] resize-y leading-relaxed");

  /* ── Render ── */

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#03050a]/88 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Compose proposal for ${inquiry.name}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <article className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float sm:rounded-3xl [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
        {/* Header */}
        <header className="relative border-b border-white/[0.06] p-6 md:px-8">
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-gold/[0.09] blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-[9.5px] text-gold">Proposal composer</p>
              <h2 className="mt-1.5 font-display text-[21px] font-bold text-foreground">
                {inquiry.name}
              </h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {inquiry.service} · {inquiry.email}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close proposal composer"
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>

          {/* Stepper */}
          <ol className="relative mt-5 flex items-center gap-2" aria-label="Composer progress">
            {[
              { n: 1, label: "AI draft" },
              { n: 2, label: "Commercial" },
              { n: 3, label: "Review & send" },
            ].map((s, i) => (
              <li key={s.n} className="flex flex-1 items-center gap-2">
                <button
                  onClick={() => sentResult ? undefined : s.n < step && setStep(s.n as Step)}
                  disabled={!!sentResult}
                  aria-current={step === s.n ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors",
                    step === s.n
                      ? "border-gold/50 bg-gold-dim text-gold"
                      : step > s.n
                        ? "border-teal/35 bg-teal-dim text-teal cursor-pointer"
                        : "border-white/[0.08] bg-white/[0.02] text-muted-foreground/60"
                  )}
                >
                  <span>{step > s.n ? <BadgeCheck size={12} aria-hidden="true" /> : `0${s.n}`}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < 2 && <span className="h-px flex-1 bg-white/[0.07]" aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </header>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-6 md:px-8">
          {sentResult ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-teal/35 bg-teal-dim">
                <BadgeCheck size={30} className="text-teal" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-[20px] font-bold text-foreground">
                  Proposal sent — {sentResult.invoiceNumber}
                </h3>
                <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-muted-foreground">
                  {sentResult.emailSent
                    ? `The branded PDF is on its way to ${inquiry.email} with the payment account attached.`
                    : "The email delivery failed — check the Email log tab for the error; the invoice row is saved."}
                </p>
              </div>
              <div className="grid w-full max-w-md grid-cols-1 gap-2.5 sm:grid-cols-2">
                {sentResult.dva && (
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-left">
                    <p className="eyebrow text-[8.5px] text-muted-foreground">Paystack DVA</p>
                    <p className="mt-1 font-mono text-[12.5px] font-semibold text-foreground">
                      {sentResult.dva.accountNumber}
                    </p>
                    <p className="text-[10.5px] text-muted-foreground">
                      {sentResult.dva.bankName}
                      {sentResult.dva.sandbox ? " · sandbox" : ""}
                    </p>
                  </div>
                )}
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-left">
                  <p className="eyebrow text-[8.5px] text-muted-foreground">Amount</p>
                  <p className="mt-1 font-mono text-[12.5px] font-semibold text-gold">
                    {formatNaira(amountNaira)}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground">
                    {dueDate ? `due ${new Date(dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}` : "no due date"}
                  </p>
                </div>
                {sentResult.whatsappQueued && (
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-left sm:col-span-2">
                    <p className="eyebrow flex items-center gap-1.5 text-[8.5px] text-muted-foreground">
                      <MessageCircle size={10} aria-hidden="true" /> WhatsApp queued
                    </p>
                    <p className="mt-1 text-[11.5px] italic text-muted-foreground">&ldquo;{waCaption}&rdquo;</p>
                  </div>
                )}
              </div>
              {sentResult.invoiceId && (
                <a
                  href={`/api/admin/invoices/${sentResult.invoiceId}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-gold-dim px-4 py-2.5 text-[12.5px] font-semibold text-gold transition-colors hover:bg-gold/20"
                >
                  <FileText size={14} aria-hidden="true" />
                  View the branded PDF
                </a>
              )}
            </div>
          ) : step === 1 ? (
            /* ── Step 1: AI draft ── */
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 rounded-2xl border border-gold/15 bg-gold/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Sparkles size={17} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">
                      {hasDraft ? "AI draft loaded — edit below" : "Draft the proposal with AI"}
                    </p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
                      Reads the inquiry and writes summary, scope, deliverables & timeline.
                      The AI never writes pricing — you set that next.
                    </p>
                  </div>
                </div>
                <button
                  onClick={generate}
                  disabled={generating}
                  className="btn-shine inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-4 py-2.5 text-[12.5px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
                >
                  {generating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Drafting…
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} aria-hidden="true" /> {hasDraft ? "Redraft with AI" : "Generate draft"}
                    </>
                  )}
                </button>
              </div>

              {genNote && (
                <p
                  role="status"
                  className={cn(
                    "flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[12px] leading-relaxed",
                    genNote.startsWith("AI unavailable") || genNote.includes("failed")
                      ? "border-red-500/25 bg-red-500/[0.07] text-red-300"
                      : "border-teal/25 bg-teal-dim text-teal"
                  )}
                >
                  <CircleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {genNote}
                </p>
              )}

              {hasDraft ? (
                <div className="flex flex-col gap-5">
                  <Field label="Executive summary">
                    <textarea
                      value={draft.executiveSummary}
                      onChange={(e) => setDraft({ ...draft, executiveSummary: e.target.value })}
                      className={cn(areaCls, "min-h-[96px]")}
                      aria-label="Executive summary"
                    />
                  </Field>

                  <Field label="Objectives" hint="one per line">
                    <textarea
                      value={unlines(draft.objectives)}
                      onChange={(e) => setDraft({ ...draft, objectives: lines(e.target.value) })}
                      className={areaCls}
                      aria-label="Objectives, one per line"
                    />
                  </Field>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="eyebrow text-[9.5px] text-muted-foreground">
                        Scope of work — workstreams
                      </label>
                      <button
                        onClick={() =>
                          setDraft({
                            ...draft,
                            scope: [...draft.scope, { title: "New workstream", items: [""] }],
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] px-2.5 py-1.5 text-[10.5px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                      >
                        <Plus size={11} aria-hidden="true" /> Add workstream
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {draft.scope.map((sec, si) => (
                        <div key={si} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5">
                          <div className="flex items-center gap-2">
                            <input
                              value={sec.title}
                              onChange={(e) => {
                                const scope = [...draft.scope];
                                scope[si] = { ...sec, title: e.target.value };
                                setDraft({ ...draft, scope });
                              }}
                              aria-label={`Workstream ${si + 1} title`}
                              className={cn(inputCls, "flex-1 font-semibold")}
                            />
                            <button
                              onClick={() =>
                                setDraft({ ...draft, scope: draft.scope.filter((_, x) => x !== si) })
                              }
                              aria-label={`Remove workstream ${si + 1}`}
                              className="shrink-0 rounded-lg border border-red-500/25 bg-red-500/[0.07] p-2 text-red-300 transition-colors hover:bg-red-500/15"
                            >
                              <Trash2 size={13} aria-hidden="true" />
                            </button>
                          </div>
                          <textarea
                            value={unlines(sec.items)}
                            onChange={(e) => {
                              const scope = [...draft.scope];
                              scope[si] = { ...sec, items: lines(e.target.value) };
                              setDraft({ ...draft, scope });
                            }}
                            aria-label={`Workstream ${si + 1} activities, one per line`}
                            placeholder="Activities — one per line"
                            className={cn(areaCls, "mt-2 min-h-[64px]")}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Field label="Deliverables" hint="one per line">
                    <textarea
                      value={unlines(draft.deliverables)}
                      onChange={(e) => setDraft({ ...draft, deliverables: lines(e.target.value) })}
                      className={areaCls}
                      aria-label="Deliverables, one per line"
                    />
                  </Field>

                  <Field label="Timeline phases" hint="phase | duration | focus — one per line">
                    <textarea
                      value={draft.timeline.map((p) => `${p.phase} | ${p.duration} | ${p.focus}`).join("\n")}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          timeline: lines(e.target.value).map((l) => {
                            const [phase = "Phase", duration = "", focus = ""] = l.split("|").map((x) => x.trim());
                            return { phase, duration, focus };
                          }),
                        })
                      }
                      className={cn(areaCls, "font-mono text-[12px]")}
                      aria-label="Timeline phases, one per line, pipe separated"
                    />
                  </Field>

                  <Field label="Terms of engagement" hint="one per line">
                    <textarea
                      value={unlines(draft.terms)}
                      onChange={(e) => setDraft({ ...draft, terms: lines(e.target.value) })}
                      className={areaCls}
                      aria-label="Terms, one per line"
                    />
                  </Field>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/[0.1] px-6 py-10 text-center">
                  <FileText size={26} className="mx-auto text-muted-foreground/40" aria-hidden="true" />
                  <p className="mt-3 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
                    Generate an AI draft from this inquiry, or skip ahead — every section is
                    fully editable before anything is sent.
                  </p>
                </div>
              )}
            </div>
          ) : step === 2 ? (
            /* ── Step 2: Commercial ── */
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="eyebrow text-[9px] text-muted-foreground">Inquiry</p>
                <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground/85">
                  {inquiry.message.slice(0, 400)}
                  {inquiry.message.length > 400 ? "…" : ""}
                </p>
                {inquiry.budget && (
                  <p className="mt-2.5 inline-block rounded-md bg-gold/10 px-2.5 py-1 font-mono text-[10px] font-medium text-gold">
                    Stated budget: {inquiry.budget}
                  </p>
                )}
              </div>

              <Field label="Amount (₦)" hint={amountNaira > 0 ? formatNaira(amountNaira) : undefined}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountRaw}
                  onChange={(e) => setAmountRaw(e.target.value.replace(/[^0-9,]/g, ""))}
                  placeholder="e.g. 450,000"
                  aria-label="Invoice amount in naira"
                  className={cn(inputCls, "font-mono text-[15px] font-semibold text-gold")}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Duration" hint="optional">
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder='e.g. "3 weeks"'
                    aria-label="Engagement duration"
                    className={inputCls}
                  />
                </Field>
                <Field label="Due date" hint="optional">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    aria-label="Payment due date"
                    className={cn(inputCls, "[color-scheme:dark]")}
                  />
                </Field>
              </div>

              <Field label="Invoice line-item description" hint="optional — shown above the total">
                <input
                  type="text"
                  value={lineItem}
                  onChange={(e) => setLineItem(e.target.value)}
                  placeholder={`${inquiry.service} — professional services as detailed in this proposal`}
                  aria-label="Invoice line item description"
                  className={inputCls}
                />
              </Field>

              <p className="flex items-start gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-[11.5px] leading-relaxed text-muted-foreground">
                <Banknote size={14} className="mt-0.5 shrink-0 text-gold/70" aria-hidden="true" />
                A Paystack Dedicated Virtual Account (account name: Okomba Analytics) is
                generated for the client when you send. Reminders are scheduled automatically.
              </p>
            </div>
          ) : (
            /* ── Step 3: Review & send ── */
            <div className="flex flex-col gap-4">
              {sendError && (
                <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/[0.08] px-3.5 py-3 text-[12.5px] text-red-300">
                  <CircleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {sendError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Client", value: inquiry.name },
                  { label: "Amount", value: amountNaira > 0 ? formatNaira(amountNaira) : "—", gold: true },
                  { label: "Duration", value: duration.trim() || "—" },
                  {
                    label: "Due",
                    value: dueDate
                      ? new Date(dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short" })
                      : "—",
                  },
                ].map((cell) => (
                  <div key={cell.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
                    <p className="eyebrow text-[8.5px] text-muted-foreground">{cell.label}</p>
                    <p className={cn("mt-1 truncate text-[13px] font-semibold", cell.gold ? "text-gold" : "text-foreground")}>
                      {cell.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="eyebrow text-[9px] text-muted-foreground">Proposal content</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    `Summary (${draft.executiveSummary.split(/\s+/).length} words)`,
                    `${draft.objectives.length} objectives`,
                    `${draft.scope.length} workstreams`,
                    `${draft.deliverables.length} deliverables`,
                    `${draft.timeline.length} phases`,
                    `${draft.terms.length} terms`,
                  ].map((t) => (
                    <li key={t} className="rounded-md bg-white/[0.05] px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-2.5 rounded-2xl border border-gold/15 bg-gold/[0.04] p-4">
                <p className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
                  <Mail size={13} className="text-gold" aria-hidden="true" /> Email to {inquiry.email}
                </p>
                <p className="rounded-lg bg-[#05070d]/60 px-3.5 py-2.5 font-mono text-[11.5px] text-foreground/85">
                  {emailSubject}
                </p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Branded PDF attached — never a link. Paystack payment account printed on page 3.
                </p>
              </div>

              {(inquiry.whatsapp || inquiry.phone) && (
                <div className="flex flex-col gap-2 rounded-2xl border border-teal/15 bg-teal/[0.05] p-4">
                  <p className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
                    <MessageCircle size={13} className="text-teal" aria-hidden="true" /> WhatsApp caption queued
                  </p>
                  <p className="rounded-lg bg-[#05070d]/60 px-3.5 py-2.5 text-[11.5px] italic text-foreground/85">
                    &ldquo;{waCaption}&rdquo;
                  </p>
                </div>
              )}

              {dueDate && (
                <p className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 text-[11.5px] text-muted-foreground">
                  <CalendarDays size={13} className="shrink-0 text-gold/70" aria-hidden="true" />
                  Reminders scheduled: 3 days before due, on the due date, and after overdue.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!sentResult && (
          <footer className="flex items-center justify-between gap-3 border-t border-white/[0.06] bg-white/[0.015] px-6 py-5 md:px-8">
            <button
              onClick={() => (step === 1 ? onClose() : setStep((s) => (s - 1) as Step))}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              {step === 1 ? "Cancel" : "Back"}
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={step === 2 && amountNaira <= 0}
                className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
              >
                Continue <ArrowRight size={14} aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={send}
                disabled={!canSend}
                className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
              >
                {sending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Building PDF & sending…
                  </>
                ) : (
                  <>
                    <Send size={14} aria-hidden="true" /> Send proposal
                  </>
                )}
              </button>
            )}
          </footer>
        )}

        {sentResult && (
          <footer className="flex items-center justify-end gap-3 border-t border-white/[0.06] bg-white/[0.015] px-6 py-5 md:px-8">
            <button
              onClick={() => onSent({ invoiceNumber: sentResult.invoiceNumber, emailSent: !!sentResult.emailSent })}
              className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5"
            >
              Done
            </button>
          </footer>
        )}
      </article>
    </div>
  );
}
