"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CalendarDays, Globe2, Loader2, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EVENT_TYPES,
  REMINDER_OFFSET_PRESETS,
  lagosInputValueToUtc,
  utcToLagosInputValue,
  type CalendarEventRow,
} from "@/lib/events-shared";

/* ── BATCH 10 (§33) — event create / edit dialog ───────────────
   Fields follow the CalendarEvent contract: type, Lagos-local
   start (datetime-local) + duration / all-day, location + join
   link, public switch → capacity, customer link, description,
   and the §34 reminder-offset chips.                                 */

export type EventSavePayload = {
  title: string;
  type: string;
  startAt: string; // ISO-UTC
  endAt: string | null;
  allDay: boolean;
  location: string;
  meetingUrl: string;
  isPublic: boolean;
  capacity: number | null;
  customerId: string;
  description: string;
  reminderOffsets: number[];
  status: string;
};

type CustomerOption = { id: string; name: string; email: string };

const DURATIONS: { key: string; label: string; minutes: number }[] = [
  { key: "30", label: "30 minutes", minutes: 30 },
  { key: "60", label: "1 hour", minutes: 60 },
  { key: "120", label: "2 hours", minutes: 120 },
  { key: "180", label: "3 hours", minutes: 180 },
  { key: "custom", label: "Custom end…", minutes: -1 },
];

function durationKeyFor(start: string | null, end: string | null): string {
  if (!start || !end) return "60";
  const diffMin = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000);
  const hit = DURATIONS.find((d) => d.minutes === diffMin);
  return hit ? hit.key : "custom";
}

export function EventDialog({
  event,
  initialStartLagos,
  customers,
  busy,
  onClose,
  onSave,
}: {
  event: CalendarEventRow | null; // null → create mode
  initialStartLagos?: string | null; // "YYYY-MM-DDTHH:mm" (Lagos) — from calendar cell click
  customers: CustomerOption[];
  busy: boolean;
  onClose: () => void;
  onSave: (payload: EventSavePayload, id?: string) => Promise<void>;
}) {
  const isEdit = !!event;

  /* State is seeded from props at MOUNT (the parent conditionally
     mounts this dialog — `{editing && <EventDialog …>}` — so a fresh
     open is always a fresh mount: no sync effect, no cascades; the
     React-blessed alternative to setState-in-effect). */
  const [title, setTitle] = useState(event?.title ?? "");
  const [type, setType] = useState(event?.type ?? "appointment");
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [startLagos, setStartLagos] = useState(
    event ? utcToLagosInputValue(new Date(event.startAt)) : (initialStartLagos ?? defaultStartLagos())
  );
  const [duration, setDuration] = useState(
    event ? durationKeyFor(event.startAt, event.endAt) : "60"
  );
  const [endLagos, setEndLagos] = useState(
    event?.endAt ? utcToLagosInputValue(new Date(event.endAt)) : ""
  );
  const [location, setLocation] = useState(event?.location ?? "");
  const [meetingUrl, setMeetingUrl] = useState(event?.meetingUrl ?? "");
  const [isPublic, setIsPublic] = useState(event?.isPublic ?? false);
  const [capacity, setCapacity] = useState(event?.capacity !== null && event?.capacity !== undefined ? String(event.capacity) : "");
  const [customerId, setCustomerId] = useState(event?.customerId ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [offsets, setOffsets] = useState<number[]>(
    event ? (Array.isArray(event.reminderOffsets) ? [...event.reminderOffsets] : []) : [1440, 0]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  /* Focus the first field shortly after mount */
  useEffect(() => {
    const t = setTimeout(() => firstFieldRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

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

  const toggleOffset = (minutes: number) => {
    setOffsets((prev) =>
      prev.includes(minutes) ? prev.filter((o) => o !== minutes) : [...prev, minutes]
    );
  };

  const validate = (): boolean => {
    const er: Record<string, string> = {};
    if (title.trim().length < 1) er.title = "Title is required";
    if (title.trim().length > 120) er.title = "Title must be 120 characters or fewer";
    if (!allDay && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startLagos)) er.startAt = "Pick a date and start time";
    if (allDay && !/^\d{4}-\d{2}-\d{2}$/.test(startLagos.slice(0, 10))) er.startAt = "Pick a date";
    if (duration === "custom" && !allDay && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(endLagos))
      er.endAt = "Pick a custom end time";
    if (meetingUrl.trim() && !/^https:\/\//.test(meetingUrl.trim()))
      er.meetingUrl = "Join link must start with https://";
    if (isPublic && capacity.trim() && (!/^\d+$/.test(capacity.trim()) || Number(capacity.trim()) < 1))
      er.capacity = "Capacity must be a whole number ≥ 1";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const startDate = allDay
        ? lagosInputValueToUtc(`${startLagos.slice(0, 10)}T00:00`)
        : lagosInputValueToUtc(startLagos);
      let endDate: Date | null = null;
      if (!allDay) {
        if (duration === "custom") endDate = lagosInputValueToUtc(endLagos);
        else {
          const mins = DURATIONS.find((d) => d.key === duration)?.minutes ?? 60;
          endDate = new Date(startDate.getTime() + mins * 60_000);
        }
      }
      await onSave(
        {
          title: title.trim(),
          type,
          startAt: startDate.toISOString(),
          endAt: endDate ? endDate.toISOString() : null,
          allDay,
          location: location.trim(),
          meetingUrl: meetingUrl.trim(),
          isPublic,
          capacity: isPublic && capacity.trim() ? Number(capacity.trim()) : null,
          customerId,
          description: description.trim(),
          reminderOffsets: [...offsets].sort((a, b) => b - a),
          status: event?.status ?? "scheduled",
        },
        event?.id
      );
    } catch {
      /* onSave surfaces its own error toast */
    }
  };

  const inputCls = (key?: string) =>
    cn(
      "w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors",
      key && errors[key]
        ? "border-red-500/60 focus:border-red-500"
        : "border-white/[0.09] focus:border-gold/60 focus:bg-gold/[0.04]"
    );
  const labelCls = "mb-1.5 block text-[11.5px] font-medium text-muted-foreground";
  const errorCls = "mt-1.5 flex items-center gap-1.5 text-[11.5px] text-red-400";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? `Edit event: ${event?.title}` : "Create calendar event"}
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        ref={dialogRef}
        className="section-dark relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)] sm:rounded-3xl"
      >
        {/* Header */}
        <header className="relative border-b border-white/[0.06] p-6 md:px-7">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/[0.1] blur-2xl"
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-[9px] text-gold">Calendar · {isEdit ? "Edit" : "New"} event</p>
              <h2 className="mt-2 font-display text-[20px] font-bold leading-snug text-foreground">
                {isEdit ? "Edit event" : "Create an event"}
              </h2>
              <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                Times are West Africa Time (WAT) — stored UTC, shown in Lagos.
              </p>
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
        <form onSubmit={submit} noValidate className="flex flex-col overflow-y-auto">
          <div className="grid gap-4 px-6 py-6 md:px-7" style={{ display: "grid", gap: "1.05rem" }}>
            {/* Title + type */}
            <div>
              <label htmlFor="ev-title" className={labelCls}>
                Title *
              </label>
              <input
                ref={firstFieldRef}
                id="ev-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls("title")}
                placeholder="e.g. Pipeline review with client"
                maxLength={140}
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className={errorCls}>
                  <AlertCircle size={12} aria-hidden="true" /> {errors.title}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ev-type" className={labelCls}>
                  Type *
                </label>
                <select id="ev-type" value={type} onChange={(e) => setType(e.target.value)} className={inputCls()}>
                  {EVENT_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ev-customer" className={labelCls}>
                  Linked customer
                </label>
                <select
                  id="ev-customer"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className={inputCls()}
                >
                  <option value="">— none —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* All-day + start + duration */}
            <div className="surface-card p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="h-4 w-4 accent-[#C9910A]"
                  aria-label="All-day event"
                />
                <span className="text-[12.5px] font-medium text-foreground">All-day (no start time)</span>
              </label>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ev-start" className={labelCls}>
                    {allDay ? "Date *" : "Date & start time *"}
                  </label>
                  {allDay ? (
                    <input
                      id="ev-start"
                      type="date"
                      value={startLagos.slice(0, 10)}
                      onChange={(e) => setStartLagos(`${e.target.value}T00:00`)}
                      className={inputCls("startAt")}
                      aria-invalid={!!errors.startAt}
                    />
                  ) : (
                    <input
                      id="ev-start"
                      type="datetime-local"
                      value={startLagos}
                      onChange={(e) => setStartLagos(e.target.value)}
                      className={inputCls("startAt")}
                      aria-invalid={!!errors.startAt}
                    />
                  )}
                  {errors.startAt && (
                    <p className={errorCls}>
                      <AlertCircle size={12} aria-hidden="true" /> {errors.startAt}
                    </p>
                  )}
                </div>
                {!allDay && (
                  <div>
                    <label htmlFor="ev-duration" className={labelCls}>
                      Duration
                    </label>
                    <select
                      id="ev-duration"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className={inputCls()}
                    >
                      {DURATIONS.map((d) => (
                        <option key={d.key} value={d.key}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {duration === "custom" && !allDay && (
                <div className="mt-4">
                  <label htmlFor="ev-end" className={labelCls}>
                    Ends at *
                  </label>
                  <input
                    id="ev-end"
                    type="datetime-local"
                    value={endLagos}
                    onChange={(e) => setEndLagos(e.target.value)}
                    className={inputCls("endAt")}
                    aria-invalid={!!errors.endAt}
                  />
                  {errors.endAt && (
                    <p className={errorCls}>
                      <AlertCircle size={12} aria-hidden="true" /> {errors.endAt}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Location + join link */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ev-location" className={labelCls}>
                  Location
                </label>
                <input
                  id="ev-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={inputCls()}
                  placeholder="e.g. Online · Zoom · client office"
                  maxLength={200}
                />
              </div>
              <div>
                <label htmlFor="ev-meeting" className={labelCls}>
                  Join link (https)
                </label>
                <input
                  id="ev-meeting"
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className={inputCls("meetingUrl")}
                  placeholder="https://meet.google.com/…"
                  aria-invalid={!!errors.meetingUrl}
                />
                {errors.meetingUrl && (
                  <p className={errorCls}>
                    <AlertCircle size={12} aria-hidden="true" /> {errors.meetingUrl}
                  </p>
                )}
              </div>
            </div>

            {/* Public registration */}
            <div className="surface-card p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#C9910A]"
                  aria-label="Public registration"
                />
                <span>
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-foreground">
                    <Globe2 size={13} className="text-gold" aria-hidden="true" /> Public event — open registration
                  </span>
                  <span className="mt-1 block text-[11.5px] leading-relaxed text-muted-foreground">
                    Public events appear on the website with an open registration form (§34) and
                    capture name, email, phone, country + consent.
                  </span>
                </span>
              </label>

              {isPublic && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ev-capacity" className={labelCls}>
                      Capacity (optional)
                    </label>
                    <div className="relative">
                      <Users
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <input
                        id="ev-capacity"
                        type="number"
                        min={1}
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        className={cn(inputCls("capacity"), "pl-8")}
                        placeholder="e.g. 500"
                        aria-invalid={!!errors.capacity}
                      />
                    </div>
                    {errors.capacity && (
                      <p className={errorCls}>
                        <AlertCircle size={12} aria-hidden="true" /> {errors.capacity}
                      </p>
                    )}
                  </div>
                  <p className="self-end text-[11px] leading-relaxed text-muted-foreground">
                    Leave empty for unlimited spots. Registration closes automatically when the
                    capacity is reached.
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="ev-desc" className={labelCls}>
                Description
              </label>
              <textarea
                id="ev-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={cn(inputCls(), "resize-y")}
                placeholder="Agenda, notes, prep work…"
                maxLength={4000}
              />
            </div>

            {/* Reminder offsets (§34) */}
            <div>
              <p className={labelCls}>
                <CalendarDays size={12} className="mr-1 inline text-gold" aria-hidden="true" /> Reminder
                schedule — emails to registrants
              </p>
              <div className="flex flex-wrap gap-2">
                {REMINDER_OFFSET_PRESETS.map((p) => {
                  const active = offsets.includes(p.minutes);
                  return (
                    <button
                      key={p.minutes}
                      type="button"
                      onClick={() => toggleOffset(p.minutes)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                        active
                          ? "border-gold/45 bg-gold-dim text-gold"
                          : "border-white/[0.09] bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground"
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/80">
                Pre-event, same-day and post-event follow-up emails — de-duplicated per registrant
                and fired by the daily 09:00 WAT scan.
              </p>
            </div>
          </div>

          {/* Footer */}
          <footer className="flex items-center justify-end gap-2.5 border-t border-white/[0.06] px-6 py-4 md:px-7">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-gold/45 bg-gold-dim px-4 py-2.5 text-[12.5px] font-semibold text-gold transition-colors hover:border-gold/70 hover:bg-gold/20 disabled:opacity-60"
            >
              {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <CalendarDays size={14} aria-hidden="true" />}
              {isEdit ? "Save changes" : "Create event"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function defaultStartLagos(): string {
  // Next top-of-hour in Lagos
  const now = new Date();
  const shifted = new Date(now.getTime() + 60 * 60_000);
  const p = (n: number) => String(n).padStart(2, "0");
  const hours = shifted.getUTCHours() + 1;
  return `${shifted.getUTCFullYear()}-${p(shifted.getUTCMonth() + 1)}-${p(shifted.getUTCDate())}T${p(Math.min(hours, 23))}:00`;
}
