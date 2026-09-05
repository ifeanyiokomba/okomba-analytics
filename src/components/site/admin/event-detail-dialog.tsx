"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Ban,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Loader2,
  MapPin,
  Pencil,
  RotateCcw,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EVENT_STATUS_STYLES,
  REMINDER_OFFSET_PRESETS,
  eventTypeLabel,
  eventTypeMeta,
  lagosEventLongLabel,
  lagosTime,
  type CalendarEventRow,
  type EventRegistrationRow,
} from "@/lib/events-shared";
import { countryLabel } from "@/lib/countries";

/* ── BATCH 10 (§33/§34) — event detail dialog ──────────────────
   Full admin view of one CalendarEvent: every field readable,
   the registrations table with attendance actions ("Mark
   attended" / "Undo"), plus Edit / Cancel / Delete. Fetches its
   own detail (GET /api/admin/events/[id]) so the list stays
   cheap; parent refreshes via onRefresh after mutations.        */

type DetailData = {
  event: CalendarEventRow;
  registrations: EventRegistrationRow[];
  summary: {
    total: number;
    registered: number;
    attended: number;
    cancelled: number;
    consented: number;
  };
};

export function EventDetailDialog({
  eventId,
  customers,
  onCancelEvent,
  onDelete,
  onAttendance,
  onEdit,
  onClose,
  onRefresh,
}: {
  eventId: string;
  customers: { id: string; name: string; email: string }[];
  onCancelEvent: (id: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onAttendance: (eventId: string, registrationId: string, status: "attended" | "registered") => Promise<boolean>;
  onEdit: (event: CalendarEventRow) => void;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyRegId, setBusyRegId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}`);
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? "Failed to load event");
      setData({
        event: j.event as CalendarEventRow,
        registrations: (j.registrations ?? []) as EventRegistrationRow[],
        summary: j.summary,
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load event");
    }
  }, [eventId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  /* §14 a11y — Escape + focus trap + scroll lock */
  useEffect(() => {
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
  }, [busy, onClose]);

  const doCancel = async () => {
    setBusy(true);
    try {
      const ok = await onCancelEvent(eventId);
      if (ok) {
        setConfirmCancel(false);
        await fetchDetail();
        onRefresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      const ok = await onDelete(eventId);
      if (ok) onClose();
    } finally {
      setBusy(false);
    }
  };

  const doAttendance = async (regId: string, status: "attended" | "registered") => {
    setBusyRegId(regId);
    try {
      const ok = await onAttendance(eventId, regId, status);
      if (ok) {
        await fetchDetail();
        onRefresh();
      }
    } finally {
      setBusyRegId(null);
    }
  };

  const ev = data?.event;
  const customer = ev?.customerId ? customers.find((c) => c.id === ev.customerId) : null;
  const typeMeta = ev ? eventTypeMeta(ev.type) : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={ev ? `Event details: ${ev.title}` : "Event details"}
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
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold",
                    typeMeta?.chip
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", typeMeta?.dot)} aria-hidden="true" />
                  {ev ? eventTypeLabel(ev.type) : "…"}
                </span>
                {ev && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold",
                      EVENT_STATUS_STYLES[ev.status] ?? "border-white/15 bg-white/[0.04] text-muted-foreground"
                    )}
                  >
                    {ev.status}
                  </span>
                )}
                {ev?.isPublic && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold-dim px-2.5 py-0.5 text-[10.5px] font-semibold text-gold">
                    <Globe2 size={10} aria-hidden="true" /> Public · {ev.registrationsCount}
                    {ev.capacity !== null ? `/${ev.capacity}` : ""} registered
                  </span>
                )}
              </div>
              <h2 className="mt-2.5 truncate font-display text-[20px] font-bold leading-snug text-foreground">
                {ev?.title ?? (loadError ? "Event not found" : "Loading…")}
              </h2>
              {ev && (
                <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                  {ev.allDay
                    ? `All-day · ${new Date(ev.startAt).toLocaleDateString("en-NG", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        timeZone: "Africa/Lagos",
                      })}`
                    : lagosEventLongLabel(ev.startAt)}
                  {ev.endAt && !ev.allDay ? ` → ${lagosTime(ev.endAt)} WAT` : ""}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              disabled={busy}
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-col overflow-y-auto">
          {loadError ? (
            <p className="px-7 py-10 text-center text-[13px] text-red-300">{loadError}</p>
          ) : !ev ? (
            <div className="flex items-center justify-center gap-3 py-14 text-[13px] text-muted-foreground">
              <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Loading event…
            </div>
          ) : (
            <div className="grid gap-4 px-6 py-6 md:px-7" style={{ display: "grid", gap: "1rem" }}>
              {/* Detail grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {ev.location && (
                  <div className="surface-card flex items-start gap-2.5 p-3.5">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">Location</p>
                      <p className="mt-1 truncate text-[12.5px] text-foreground">{ev.location}</p>
                    </div>
                  </div>
                )}
                {ev.meetingUrl && (
                  <div className="surface-card flex items-start gap-2.5 p-3.5">
                    <ExternalLink size={14} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">Join link</p>
                      <a
                        href={ev.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block truncate text-[12.5px] font-medium text-teal underline decoration-teal/40 underline-offset-2 hover:text-teal/80"
                      >
                        {ev.meetingUrl}
                      </a>
                    </div>
                  </div>
                )}
                {customer && (
                  <div className="surface-card flex items-start gap-2.5 p-3.5">
                    <Users size={14} className="mt-0.5 shrink-0 text-purple-300" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">Customer</p>
                      <p className="mt-1 truncate text-[12.5px] text-foreground">{customer.name || customer.email}</p>
                    </div>
                  </div>
                )}
                <div className="surface-card flex items-start gap-2.5 p-3.5">
                  <CalendarDays size={14} className="mt-0.5 shrink-0 text-gold-light" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">Reminders</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">
                      {ev.reminderOffsets.length === 0
                        ? "None configured"
                        : ev.reminderOffsets
                            .map(
                              (o) =>
                                REMINDER_OFFSET_PRESETS.find((p) => p.minutes === o)?.label ??
                                (o > 0 ? `${Math.round(o / 60)}h before` : o === 0 ? "at start" : `${Math.abs(Math.round(o / 1440))}d after`)
                            )
                            .join(" · ")}
                    </p>
                    <p className="mt-1 text-[10.5px] text-muted-foreground/70">
                      {Object.keys(ev.remindersSent).length} batch send{Object.keys(ev.remindersSent).length === 1 ? "" : "s"} recorded
                      {ev.createdBy ? ` · created by ${ev.createdBy}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              {ev.description && (
                <div className="surface-card p-4">
                  <p className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">Description</p>
                  <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-relaxed text-muted-foreground">
                    {ev.description}
                  </p>
                </div>
              )}

              {/* Registrations (§34) */}
              {ev.isPublic && (
                <div className="surface-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[13.5px] font-semibold text-foreground">
                      Registrations · {data?.summary.registered ?? 0} active
                      {ev.capacity !== null ? ` of ${ev.capacity} cap` : ""}
                    </h3>
                    <span className="font-mono text-[10.5px] text-muted-foreground">
                      {data?.summary.attended ?? 0} attended · {data?.summary.cancelled ?? 0} cancelled
                    </span>
                  </div>

                  {(data?.registrations.length ?? 0) === 0 ? (
                    <p className="py-8 text-center text-[12px] text-muted-foreground/70">
                      No registrations yet — the public form feeds this table.
                    </p>
                  ) : (
                    <div className="mt-3.5 max-h-96 overflow-y-auto rounded-xl border border-white/[0.06]">
                      <table className="w-full text-left">
                        <caption className="sr-only">Event registrations with attendance actions</caption>
                        <thead className="sticky top-0 z-[1] bg-[#0e1522]">
                          <tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-wider text-muted-foreground/80">
                            <th scope="col" className="px-3 py-2 font-mono font-medium">Registrant</th>
                            <th scope="col" className="hidden px-3 py-2 font-mono font-medium sm:table-cell">Contact</th>
                            <th scope="col" className="hidden px-3 py-2 font-mono font-medium md:table-cell">Country</th>
                            <th scope="col" className="px-3 py-2 font-mono font-medium">Status</th>
                            <th scope="col" className="px-3 py-2 text-right font-mono font-medium">Attendance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data?.registrations.map((r) => (
                            <tr key={r.id} className="border-b border-white/[0.04] last:border-0">
                              <td className="px-3 py-2.5">
                                <p className="truncate text-[12.5px] font-medium text-foreground">
                                  {r.firstName} {r.lastName}
                                  {r.consent ? (
                                    <CheckCircle2
                                      size={11}
                                      className="ml-1.5 inline text-teal"
                                      aria-label="Consented to reminders"
                                      role="img"
                                    />
                                  ) : null}
                                </p>
                                <p className="truncate text-[10.5px] text-muted-foreground">{r.email}</p>
                              </td>
                              <td className="hidden px-3 py-2.5 sm:table-cell">
                                <p className="truncate text-[11.5px] text-muted-foreground">{r.phone ?? "—"}</p>
                              </td>
                              <td className="hidden px-3 py-2.5 md:table-cell">
                                <p className="truncate text-[11.5px] text-muted-foreground">
                                  {r.countryCode ? countryLabel(r.countryCode) : "—"}
                                </p>
                              </td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                    r.status === "registered"
                                      ? "border-gold/35 bg-gold-dim text-gold"
                                      : r.status === "attended"
                                        ? "border-teal/35 bg-teal-dim text-teal"
                                        : "border-white/15 bg-white/[0.04] text-muted-foreground"
                                  )}
                                >
                                  {r.status}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                {r.status === "registered" ? (
                                  <button
                                    onClick={() => void doAttendance(r.id, "attended")}
                                    disabled={busyRegId !== null}
                                    className="inline-flex items-center gap-1 rounded-lg border border-teal/35 bg-teal-dim px-2.5 py-1 text-[11px] font-medium text-teal transition-colors hover:bg-teal/15 disabled:opacity-50"
                                  >
                                    {busyRegId === r.id ? (
                                      <Loader2 size={11} className="animate-spin" aria-hidden="true" />
                                    ) : (
                                      <CheckCircle2 size={11} aria-hidden="true" />
                                    )}
                                    Mark attended
                                  </button>
                                ) : r.status === "attended" ? (
                                  <button
                                    onClick={() => void doAttendance(r.id, "registered")}
                                    disabled={busyRegId !== null}
                                    className="inline-flex items-center gap-1 rounded-lg border border-white/[0.12] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                                  >
                                    {busyRegId === r.id ? (
                                      <Loader2 size={11} className="animate-spin" aria-hidden="true" />
                                    ) : (
                                      <RotateCcw size={11} aria-hidden="true" />
                                    )}
                                    Undo
                                  </button>
                                ) : (
                                  <span className="text-[10.5px] text-muted-foreground/60">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {ev && (
          <footer className="flex flex-wrap items-center justify-between gap-2.5 border-t border-white/[0.06] px-6 py-4 md:px-7">
            <div className="flex flex-wrap items-center gap-2.5">
              {!confirmCancel && !confirmDelete && ev.status !== "cancelled" && (
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.03] px-3.5 py-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-orange-400/40 hover:text-orange-300 disabled:opacity-50"
                >
                  <CalendarX2 size={13} aria-hidden="true" /> Cancel event
                </button>
              )}
              {confirmCancel && (
                <span className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-orange-400/30 bg-orange-400/10 px-3 py-2 text-[12px] text-orange-300">
                  Cancel this event? Reminders stop immediately.
                  <button
                    type="button"
                    onClick={() => void doCancel()}
                    disabled={busy}
                    className="font-semibold underline underline-offset-2 disabled:opacity-60"
                  >
                    {busy ? "Cancelling…" : "Yes, cancel event"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    disabled={busy}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Keep
                  </button>
                </span>
              )}
              {!confirmDelete && !confirmCancel && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/[0.08] px-3.5 py-2.5 text-[12px] font-medium text-red-300 transition-colors hover:bg-red-500/15 disabled:opacity-50"
                >
                  <Trash2 size={13} aria-hidden="true" /> Delete
                </button>
              )}
              {confirmDelete && (
                <span className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
                  <Ban size={12} aria-hidden="true" /> Delete permanently? Registrations are removed too.
                  <button
                    type="button"
                    onClick={() => void doDelete()}
                    disabled={busy}
                    className="font-semibold underline underline-offset-2 disabled:opacity-60"
                  >
                    {busy ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={busy}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Keep
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onEdit(ev)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gold/45 bg-gold-dim px-4 py-2.5 text-[12.5px] font-semibold text-gold transition-colors hover:border-gold/70 hover:bg-gold/20 disabled:opacity-60"
              >
                <Pencil size={13} aria-hidden="true" /> Edit event
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
