"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  FileSignature,
  History,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  Paperclip,
  Pause,
  Play,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adPlacementLabel, adTypeLabel } from "@/lib/ads-shared";
import { formatDate, formatTimestamp } from "./types";
import type { AdRequestRow } from "./ads-tab";

/* ── BATCH 6 (§38/§39/§40/§41) — ad request management dialog ──
   Carries the full admin workflow: review → approve + pricing →
   payment → schedule → live → complete, plus creative upload,
   campaign copy, internal notes, and outbound decision emails. */

type Patch = Record<string, unknown>;

type AdDetailDialogProps = {
  ad: AdRequestRow | null;
  busy: boolean;
  onClose: () => void;
  onUpdate: (id: string, patch: Patch) => Promise<boolean>;
  onUploadCreative: (id: string, file: File) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
};

const TERMINAL = new Set(["completed", "expired", "rejected"]);

export function AdDetailDialog({
  ad,
  busy,
  onClose,
  onUpdate,
  onUploadCreative,
  onDelete,
}: AdDetailDialogProps) {
  /* Local editable campaign state — initialized at mount and re-synced
     by the PARENT via a key remount (key={`${ad.id}:${ad.updatedAt}`})
     whenever a refresh delivers a changed row. No sync effect needed
     (the React-blessed alternative to setState-in-effect cascades). */
  const [amount, setAmount] = useState(ad?.amount ?? "");
  const [currency, setCurrency] = useState(ad?.currency ?? "NGN");
  const [startAt, setStartAt] = useState(ad?.startAt ? ad.startAt.slice(0, 10) : "");
  const [durationDays, setDurationDays] = useState(ad?.durationDays ? String(ad.durationDays) : "");
  const [headline, setHeadline] = useState(ad?.headline ?? "");
  const [bodyCopy, setBodyCopy] = useState(ad?.bodyCopy ?? "");
  const [ctaLabel, setCtaLabel] = useState(ad?.ctaLabel ?? "");
  const [ctaUrl, setCtaUrl] = useState(ad?.ctaUrl ?? "");
  const [creativeUrl, setCreativeUrl] = useState(ad?.creativeUrl ?? "");
  const [adminNotes, setAdminNotes] = useState(ad?.adminNotes ?? "");
  const [outboundNote, setOutboundNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  /* §14 a11y: Escape + scroll lock + focus trap */
  useEffect(() => {
    if (!ad) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [ad, busy, onClose]);

  const campaignPatch = useMemo<Patch>(
    () => ({
      ...(amount.trim() !== (ad?.amount ?? "") ? { amount: amount.trim() === "" ? null : Number(amount) } : {}),
      ...(currency !== (ad?.currency ?? "NGN") ? { currency } : {}),
      ...(startAt ? { startAt: new Date(`${startAt}T00:00:00`).toISOString() } : {}),
      ...(durationDays.trim() ? { durationDays: Number(durationDays) } : {}),
      ...(headline !== (ad?.headline ?? "") ? { headline } : {}),
      ...(bodyCopy !== (ad?.bodyCopy ?? "") ? { bodyCopy } : {}),
      ...(ctaLabel !== (ad?.ctaLabel ?? "") ? { ctaLabel } : {}),
      ...(ctaUrl !== (ad?.ctaUrl ?? "") ? { ctaUrl } : {}),
      ...(creativeUrl !== (ad?.creativeUrl ?? "") ? { creativeUrl } : {}),
      ...(adminNotes !== (ad?.adminNotes ?? "") ? { adminNotes } : {}),
      ...(outboundNote.trim() ? { outboundNote: outboundNote.trim() } : {}),
    }),
    [amount, currency, startAt, durationDays, headline, bodyCopy, ctaLabel, ctaUrl, creativeUrl, adminNotes, outboundNote, ad]
  );

  if (!ad) return null;

  const doTransition = async (patch: Patch) => {
    await onUpdate(ad.id, { ...campaignPatch, ...patch });
  };

  const saveCampaign = async () => {
    await onUpdate(ad.id, campaignPatch);
  };

  const uploadCreative = async (file: File) => {
    await onUploadCreative(ad.id, file);
  };

  const inputCls =
    "w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-gold/60 focus:bg-gold/[0.04]";
  const labelCls = "mb-1.5 block text-[11.5px] font-medium text-muted-foreground";

  const timeline = Array.isArray(ad.statusHistory) ? ad.statusHistory : [];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Manage advertising request from ${ad.firstName} ${ad.lastName}`}
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        ref={dialogRef}
        className="section-dark relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)] sm:rounded-3xl"
      >
        {/* Header */}
        <header className="relative border-b border-white/[0.06] p-6 md:px-7">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/[0.1] blur-2xl"
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow text-[9px] text-gold">Advertising request</p>
              <h2 className="mt-2 truncate font-display text-[20px] font-bold leading-snug text-foreground">
                {ad.firstName} {ad.lastName}
                {ad.company ? ` — ${ad.company}` : ""}
              </h2>
              <p className="mt-1.5 truncate text-[12.5px] text-muted-foreground">
                {ad.email}
                {ad.countryCode ? ` · ${ad.countryCode}` : ""} · {formatTimestamp(ad.createdAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              disabled={busy}
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-6 md:px-7">
          <div className="space-y-6" style={{ display: "grid", gap: "1.4rem" }}>
            {/* §40 status summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Status", value: ad.status },
                { label: "Payment", value: ad.paymentStatus },
                { label: "Placement", value: adPlacementLabel(ad.placement) },
                { label: "Format", value: adTypeLabel(ad.adType) },
              ].map((f) => (
                <div key={f.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{f.label}</p>
                  <p className="mt-1 truncate text-[13px] font-semibold capitalize text-foreground">{f.value}</p>
                </div>
              ))}
            </div>

            {/* Campaign brief (intake) */}
            <section aria-label="Campaign brief" className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <FileSignature size={14} className="text-gold" aria-hidden="true" /> Campaign brief
              </h3>
              <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-3 text-[12.5px] sm:grid-cols-3">
                <div>
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground/70">Preferred start</p>
                  <p className="mt-0.5 text-foreground">{ad.startDate ? formatDate(ad.startDate, { withYear: true }) : "—"}</p>
                </div>
                <div>
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground/70">Duration</p>
                  <p className="mt-0.5 text-foreground">{ad.durationDays ? `${ad.durationDays} days` : "—"}</p>
                </div>
                <div>
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground/70">Budget signal</p>
                  <p className="mt-0.5 text-foreground">{ad.budget ?? "—"}</p>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground/70">Description</p>
                  <p className="mt-1 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed text-muted-foreground">
                    {ad.description}
                  </p>
                </div>
              </div>
              {ad.attachment && (
                <a
                  href={ad.attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3.5 inline-flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 text-[12px] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                >
                  <Paperclip size={13} aria-hidden="true" />
                  Intake attachment: {ad.attachment.originalName}
                </a>
              )}
              {ad.websiteUrl && (
                <a
                  href={ad.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-0 mt-2 inline-flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 text-[12px] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold sm:ml-2.5"
                >
                  <ArrowRight size={13} aria-hidden="true" />
                  {ad.websiteUrl.replace(/^https?:\/\//, "").slice(0, 42)}
                </a>
              )}
            </section>

            {/* §38 workflow actions */}
            <section aria-label="Workflow actions" className="rounded-2xl border border-gold/20 bg-gold/[0.03] p-5">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <Megaphone size={14} className="text-gold" aria-hidden="true" /> Workflow
              </h3>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                Status changes send the matching advertiser email (§39). Edits in the campaign
                section below are saved with the action.
              </p>

              <div className="mt-4 flex flex-wrap gap-2.5">
                {ad.status === "new" && (
                  <>
                    <WorkflowBtn onClick={() => doTransition({ status: "reviewing" })} busy={busy}>
                      <History size={13} /> Start review
                    </WorkflowBtn>
                    <WorkflowBtn onClick={() => doTransition({ status: "rejected" })} busy={busy} danger>
                      <X size={13} /> Reject
                    </WorkflowBtn>
                  </>
                )}

                {(ad.status === "reviewing" || ad.status === "awaiting_customer") && (
                  <>
                    <WorkflowBtn onClick={() => doTransition({ status: "approved" })} busy={busy} primary>
                      <CheckCircle2 size={13} /> Approve + send pricing
                    </WorkflowBtn>
                    <WorkflowBtn onClick={() => doTransition({ status: "awaiting_customer" })} busy={busy}>
                      <AlertCircle size={13} /> Request clarification
                    </WorkflowBtn>
                    <WorkflowBtn onClick={() => doTransition({ status: "rejected" })} busy={busy} danger>
                      <X size={13} /> Reject
                    </WorkflowBtn>
                  </>
                )}

                {(ad.status === "approved" || ad.status === "payment_pending") && (
                  <>
                    <WorkflowBtn onClick={() => doTransition({ paymentStatus: "paid" })} busy={busy} primary>
                      <Banknote size={13} /> Mark paid
                    </WorkflowBtn>
                    <WorkflowBtn onClick={() => doTransition({ paymentStatus: "waived" })} busy={busy}>
                      <ShieldAlert size={13} /> Waive payment
                    </WorkflowBtn>
                    <WorkflowBtn onClick={() => doTransition({ status: "awaiting_customer" })} busy={busy}>
                      <AlertCircle size={13} /> Ask customer
                    </WorkflowBtn>
                    <WorkflowBtn onClick={() => doTransition({ status: "rejected" })} busy={busy} danger>
                      <X size={13} /> Reject
                    </WorkflowBtn>
                  </>
                )}

                {ad.status === "paid" && (
                  <>
                    <WorkflowBtn onClick={() => doTransition({ status: "scheduled" })} busy={busy} primary>
                      <CalendarClock size={13} /> Schedule campaign
                    </WorkflowBtn>
                  </>
                )}

                {ad.status === "scheduled" && (
                  <WorkflowBtn onClick={() => doTransition({ status: "reviewing" })} busy={busy}>
                    <History size={13} /> Un-schedule (back to review)
                  </WorkflowBtn>
                )}

                {ad.status === "active" && (
                  <WorkflowBtn onClick={() => doTransition({ status: "paused" })} busy={busy}>
                    <Pause size={13} /> Pause
                  </WorkflowBtn>
                )}
                {ad.status === "paused" && (
                  <WorkflowBtn onClick={() => doTransition({ status: "active" })} busy={busy} primary>
                    <Play size={13} /> Resume
                  </WorkflowBtn>
                )}

                {TERMINAL.has(ad.status) && (
                  <WorkflowBtn onClick={() => doTransition({ status: "reviewing" })} busy={busy}>
                    <History size={13} /> Re-open as reviewing
                  </WorkflowBtn>
                )}
              </div>

              {/* Outbound note for the decision email */}
              <div className="mt-4">
                <label htmlFor="ad-outbound" className={labelCls}>
                  Outbound note (included in the next decision email — advertisers never see internal notes)
                </label>
                <textarea
                  id="ad-outbound"
                  rows={2}
                  value={outboundNote}
                  onChange={(e) => setOutboundNote(e.target.value)}
                  placeholder="e.g. We can offer the home banner for 30 days at ₦250,000 — creative due by Friday."
                  className={cn(inputCls, "resize-none")}
                />
              </div>
            </section>

            {/* §41 campaign + pricing + schedule + creative */}
            <section aria-label="Campaign settings" className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <ImageIcon size={14} className="text-gold" aria-hidden="true" /> Campaign, pricing &amp; schedule
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                <div>
                  <label htmlFor="ad-amount" className={labelCls}>Amount</label>
                  <input id="ad-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="250000" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="ad-currency" className={labelCls}>Currency</label>
                  <select id="ad-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className={cn(inputCls, "appearance-none")}>
                    {["NGN", "USD", "GBP", "EUR"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="ad-startAt" className={labelCls}>Live from</label>
                  <input id="ad-startAt" type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="ad-duration" className={labelCls}>Duration (days)</label>
                  <input id="ad-duration" type="number" min={1} max={365} value={durationDays} onChange={(e) => setDurationDays(e.target.value)} placeholder="30" className={inputCls} />
                </div>
              </div>
              {ad.endAt && (
                <p className="mt-2 text-[11.5px] text-muted-foreground">
                  Ends {formatDate(ad.endAt, { withYear: true })}
                  {ad.publishedAt ? ` · live since ${formatDate(ad.publishedAt)}` : ""}
                  {ad.status === "active" ? ` · ${ad.clicks} clicks` : ""}
                </p>
              )}

              <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label htmlFor="ad-headline" className={labelCls}>Ad headline</label>
                  <input id="ad-headline" type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Scale your data ops in 30 days" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="ad-body" className={labelCls}>Ad body</label>
                  <input id="ad-body" type="text" value={bodyCopy} onChange={(e) => setBodyCopy(e.target.value)} placeholder="One sentence that sells the click." className={inputCls} />
                </div>
                <div>
                  <label htmlFor="ad-ctalabel" className={labelCls}>CTA label</label>
                  <input id="ad-ctalabel" type="text" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Book a demo" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="ad-ctaurl" className={labelCls}>CTA URL</label>
                  <input id="ad-ctaurl" type="url" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://…" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="ad-creativeurl" className={labelCls}>Creative URL (alternative to upload)</label>
                  <input id="ad-creativeurl" type="url" value={creativeUrl} onChange={(e) => setCreativeUrl(e.target.value)} placeholder="https://…/banner.png" className={inputCls} />
                </div>
              </div>

              {/* Creative upload + preview */}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/mp4,video/webm,application/pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadCreative(f);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.03] px-4 py-2.5 text-[12.5px] font-medium text-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
                >
                  <ImageIcon size={13} aria-hidden="true" /> Upload creative
                </button>
                {ad.creative && (
                  <span className="flex items-center gap-3">
                    {ad.creative.thumbUrl && (
                      <img src={ad.creative.thumbUrl} alt="" className="h-11 w-20 rounded-lg border border-white/[0.08] object-cover" />
                    )}
                    <span className="text-[12px] text-muted-foreground">
                      {ad.creative.originalName}
                    </span>
                  </span>
                )}
                {!ad.creative && !ad.creativeUrl && (
                  <span className="text-[11.5px] text-muted-foreground/70">
                    No creative yet — required before scheduling.
                  </span>
                )}
              </div>

              {/* Internal notes (§39 — never emailed) */}
              <div className="mt-4">
                <label htmlFor="ad-notes" className={labelCls}>
                  Internal notes (never shown or emailed to the advertiser)
                </label>
                <textarea
                  id="ad-notes"
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Negotiation history, inventory conflicts, waivers…"
                  className={cn(inputCls, "resize-none")}
                />
              </div>

              <button
                type="button"
                onClick={saveCampaign}
                disabled={busy}
                className="btn-gold group mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-ink disabled:opacity-60"
              >
                {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <CheckCircle2 size={14} aria-hidden="true" />}
                Save campaign settings
              </button>
            </section>

            {/* Timeline */}
            {timeline.length > 0 && (
              <section aria-label="Status timeline" className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <h3 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                  <History size={14} className="text-gold" aria-hidden="true" /> Timeline
                </h3>
                <ol className="mt-3.5 space-y-2.5">
                  {timeline.map((t, i) => (
                    <li key={`${t.status}-${t.at}-${i}`} className="flex items-baseline gap-3 text-[12px]">
                      <span
                        className={cn(
                          "mt-1 h-2 w-2 shrink-0 rounded-full",
                          i === timeline.length - 1 ? "bg-gold" : "bg-white/20"
                        )}
                        aria-hidden="true"
                      />
                      <span className="font-semibold capitalize text-foreground">{t.status.replace(/_/g, " ")}</span>
                      <span className="text-muted-foreground/70">{formatTimestamp(t.at)}</span>
                      {t.note && <span className="truncate text-muted-foreground">— {t.note}</span>}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Delete */}
            <section aria-label="Danger zone" className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-red-300">
                <Trash2 size={14} aria-hidden="true" /> Delete request
              </h3>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                Permanently removes the request and its history. Prefer rejecting for an audit trail.
              </p>
              {confirmDelete ? (
                <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => void onDelete(ad.id)}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2.5 text-[12.5px] font-semibold text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Trash2 size={13} aria-hidden="true" />}
                    Confirm permanent delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-xl border border-white/[0.12] px-4 py-2.5 text-[12.5px] text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="mt-3.5 inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-[12.5px] font-medium text-red-300/90 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 size={13} aria-hidden="true" /> Delete this request…
                </button>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowBtn({
  children,
  onClick,
  busy,
  primary,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[12.5px] font-semibold transition-all disabled:opacity-50",
        primary
          ? "btn-gold text-ink"
          : danger
            ? "border-red-500/30 bg-red-500/[0.06] text-red-300 hover:bg-red-500/15"
            : "border-white/[0.12] bg-white/[0.03] text-foreground hover:border-gold/40 hover:text-gold"
      )}
    >
      {busy ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
