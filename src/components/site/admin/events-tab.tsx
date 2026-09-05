"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Plus,
  Radio,
  Users,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EVENT_STATUS_STYLES,
  EVENT_TYPES,
  VIEW_MODES,
  eventTypeMeta,
  lagosDateKey,
  lagosEventLabel,
  lagosTime,
  type CalendarEventRow,
  type CalendarViewMode,
  type EventStats,
} from "@/lib/events-shared";
import { formatNaira, type Invoice } from "./types";
import { EventDialog, type EventSavePayload } from "./event-dialog";
import { EventDetailDialog } from "./event-detail-dialog";

/* ── BATCH 10 (§33) — Calendar tab ──────────────────────────────
   Month / Week / Day / Agenda views over CalendarEvent rows PLUS
   invoice due-date entries (§33 "Invoice due dates" + §35 —
   derived client-side from unpaid invoices, always in sync with
   Payments). All times render in Africa/Lagos (WAT).            */

type CustomerOption = { id: string; name: string; email: string };

type CalEntry = {
  key: string;
  source: "event" | "invoice";
  id: string;
  title: string;
  type: string;
  startAt: string; // ISO
  allDay: boolean;
  status: string;
  event?: CalendarEventRow;
  invoiceNumber?: string;
  amountNaira?: number;
};

/* ── pure date-key math (UTC-based; keys are plain dates) ── */
const pad = (n: number) => String(n).padStart(2, "0");
const parseKey = (key: string) => new Date(`${key}T00:00:00Z`);
const addDaysKey = (key: string, n: number) => {
  const d = new Date(parseKey(key).getTime() + n * 86_400_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};
/** 0 = Monday … 6 = Sunday */
const dowMon = (key: string) => (parseKey(key).getUTCDay() + 6) % 7;

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthTitle(key: string): string {
  const d = parseKey(key);
  return d.toLocaleDateString("en-NG", { month: "long", year: "numeric", timeZone: "UTC" });
}
function dayTitle(key: string): string {
  return parseKey(key).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
/** date key → UTC "date-only" label ("14 Feb") for agenda headers. */
function shortDay(key: string): string {
  const d = parseKey(key);
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
}
function weekdayOf(key: string): string {
  return WEEKDAYS[dowMon(key)];
}

export function EventsTab({
  events,
  eventStats,
  invoices,
  customers,
  openCreateSignal,
  onSave,
  onCancelEvent,
  onDelete,
  onAttendance,
}: {
  events: CalendarEventRow[];
  eventStats: EventStats | null;
  invoices: Invoice[];
  customers: CustomerOption[];
  openCreateSignal: number;
  onSave: (payload: EventSavePayload, id?: string) => Promise<void>;
  onCancelEvent: (id: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onAttendance: (eventId: string, registrationId: string, status: "attended" | "registered") => Promise<boolean>;
}) {
  const todayKey = lagosDateKey(new Date());

  const [view, setView] = useState<CalendarViewMode>("month");
  const [cursor, setCursor] = useState(todayKey);
  const [typeFilter, setTypeFilter] = useState("all");
  const [editing, setEditing] = useState<{ event: CalendarEventRow | null } | null>(null);
  const [dialogSeq, setDialogSeq] = useState(0); // remount key — fresh state per open
  const [presetStart, setPresetStart] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /* Single open-dialog entry point — bumps the remount key so the
     dialog always seeds fresh state (mount-fresh, no sync effects). */
  const openDialog = (event: CalendarEventRow | null, preset?: string | null) => {
    setDetailId(null);
    setPresetStart(preset ?? null);
    setDialogSeq((s) => s + 1);
    setEditing({ event });
  };

  /* §47 quick action — dashboard bumps openCreateSignal → open the
     create dialog (same coordination as quick-add-customer). */
  useEffect(() => {
    if (openCreateSignal > 0) openDialog(null);
  }, [openCreateSignal]);

  /* ── combined entries (events + invoice deadlines) ── */
  const entries = useMemo<CalEntry[]>(() => {
    const evs: CalEntry[] = events
      .filter((e) => typeFilter === "all" || e.type === typeFilter)
      .map((e) => ({
        key: `ev-${e.id}`,
        source: "event",
        id: e.id,
        title: e.title,
        type: e.type,
        startAt: e.startAt,
        allDay: e.allDay,
        status: e.status,
        event: e,
      }));

    // §33 invoice due dates — derived from UNPAID invoices, all-day
    const showInvoices = typeFilter === "all" || typeFilter === "deadline";
    const invs: CalEntry[] = showInvoices
      ? invoices
          .filter((i) => i.status !== "paid" && i.status !== "void" && i.dueDate)
          .map((i) => ({
            key: `inv-${i.id}`,
            source: "invoice",
            id: i.id,
            title: `Invoice ${i.invoiceNumber} due`,
            type: "deadline",
            startAt: i.dueDate as string,
            allDay: true,
            status: "due",
            invoiceNumber: i.invoiceNumber,
            amountNaira: i.amountNaira,
          }))
      : [];

    return [...evs, ...invs];
  }, [events, invoices, typeFilter]);

  /* bucket by Lagos day */
  const byDay = useMemo(() => {
    const m = new Map<string, CalEntry[]>();
    for (const e of entries) {
      const day = lagosDateKey(e.startAt);
      const list = m.get(day) ?? [];
      list.push(e);
      m.set(day, list);
    }
    for (const list of m.values()) {
      list.sort((a, b) => {
        if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      });
    }
    return m;
  }, [entries]);

  const dayEntries = (dayKey: string): CalEntry[] => byDay.get(dayKey) ?? [];

  /* ── navigation ── */
  const move = (dir: 1 | -1) => {
    if (view === "month") {
      const d = parseKey(cursor);
      const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + dir, 1));
      setCursor(`${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-01`);
    } else if (view === "week") {
      setCursor(addDaysKey(cursor, 7 * dir));
    } else if (view === "day") {
      setCursor(addDaysKey(cursor, dir));
    } else {
      setCursor(addDaysKey(cursor, 30 * dir));
    }
  };
  const goToday = () => setCursor(todayKey);

  /* ── month grid (Mon–Sun, 6×7) ── */
  const monthCells = useMemo(() => {
    const base = parseKey(cursor);
    const firstOfMonth = `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-01`;
    const start = addDaysKey(firstOfMonth, -dowMon(firstOfMonth));
    return Array.from({ length: 42 }, (_, i) => addDaysKey(start, i));
  }, [cursor]);

  const inMonth = (dayKey: string) => dayKey.slice(0, 7) === cursor.slice(0, 7);

  /* ── week grid ── */
  const weekDays = useMemo(() => {
    const start = addDaysKey(cursor, -dowMon(cursor));
    return Array.from({ length: 7 }, (_, i) => addDaysKey(start, i));
  }, [cursor]);

  /* ── agenda range (60 days from cursor; default = today) ── */
  const agendaDays = useMemo(
    () => Array.from({ length: 60 }, (_, i) => addDaysKey(cursor, i)),
    [cursor]
  );

  /* ── open-create helper from a calendar cell ── */
  const openCreateFor = (dayKey: string) => {
    openDialog(null, `${dayKey}T09:00`);
  };

  const save = async (payload: EventSavePayload, id?: string) => {
    setSaving(true);
    try {
      await onSave(payload, id);
      setEditing(null);
      setPresetStart(null);
    } catch {
      /* dashboard surfaces the toast; keep the dialog open */
    } finally {
      setSaving(false);
    }
  };

  const navLabel =
    view === "month"
      ? monthTitle(cursor)
      : view === "week"
        ? `Week of ${shortDay(weekDays[0])} — ${shortDay(weekDays[6])}`
        : view === "day"
          ? dayTitle(cursor)
          : `${shortDay(cursor)} — ${shortDay(addDaysKey(cursor, 59))}`;

  const statCards = [
    {
      icon: CalendarDays,
      label: "Upcoming 7 days",
      value: eventStats ? String(eventStats.upcoming7d) : "—",
      accent: "border-gold/25 bg-gold-dim text-gold",
    },
    {
      icon: Users,
      label: "Total registrations",
      value: eventStats ? String(eventStats.registrationsTotal) : "—",
      accent: "border-teal/25 bg-teal-dim text-teal",
    },
    {
      icon: Radio,
      label: "Live webinars",
      value: eventStats ? String(eventStats.liveWebinars) : "—",
      accent: "border-purple-400/25 bg-purple-400/10 text-purple-300",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="surface-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim text-gold">
              <CalendarDays size={17} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Calendar</h2>
              <p className="text-[11.5px] text-muted-foreground">
                Appointments, meetings, webinars, events, deadlines & tasks — all times WAT.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View switcher */}
            <div
              role="group"
              aria-label="Calendar view"
              className="flex items-center rounded-xl border border-white/[0.09] bg-white/[0.02] p-1"
            >
              {VIEW_MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setView(m.key)}
                  aria-pressed={view === m.key}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
                    view === m.key ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Prev / Today / Next */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => move(-1)}
                aria-label="Previous period"
                className="rounded-lg border border-white/[0.09] bg-white/[0.03] p-2 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
              >
                <ChevronLeft size={14} aria-hidden="true" />
              </button>
              <button
                onClick={goToday}
                className="rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
              >
                Today
              </button>
              <button
                onClick={() => move(1)}
                aria-label="Next period"
                className="rounded-lg border border-white/[0.09] bg-white/[0.03] p-2 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
              >
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>

            <button
              onClick={() => openDialog(null)}
              className="inline-flex items-center gap-2 rounded-xl border border-gold/45 bg-gold-dim px-4 py-2.5 text-[12.5px] font-semibold text-gold transition-all hover:border-gold/70 hover:bg-gold/20"
              aria-label="Create new event"
            >
              <Plus size={14} aria-hidden="true" /> New event
            </button>
          </div>
        </div>

        {/* Period label + mini stats + type filter */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-display text-[18px] font-bold text-foreground">{navLabel}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setTypeFilter("all")}
              aria-pressed={typeFilter === "all"}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors",
                typeFilter === "all"
                  ? "border-gold/45 bg-gold-dim text-gold"
                  : "border-white/[0.09] bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground"
              )}
            >
              All
            </button>
            {EVENT_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key)}
                aria-pressed={typeFilter === t.key}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors",
                  typeFilter === t.key ? t.chip : "border-white/[0.09] bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} aria-hidden="true" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mini stat row */}
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {statCards.map((c) => (
            <div key={c.label} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border", c.accent)}>
                <c.icon size={15} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <p className="text-[19px] font-bold leading-tight text-foreground">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Views ── */}
      {view === "month" && (
        <div className="surface-card overflow-hidden p-0">
          {/* Weekday header */}
          <div className="grid grid-cols-7 border-b border-white/[0.07] bg-white/[0.02]">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-2.5 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                <span className="sm:hidden">{w.slice(0, 1)}</span>
                <span className="hidden sm:inline">{w}</span>
              </div>
            ))}
          </div>
          {/* 6×7 grid */}
          <div className="grid grid-cols-7 gap-px bg-white/[0.04] p-px">
            {monthCells.map((dayKey) => {
              const list = dayEntries(dayKey);
              const isToday = dayKey === todayKey;
              const dim = !inMonth(dayKey);
              const shown = list.slice(0, 3);
              const more = list.length - shown.length;
              return (
                <div
                  key={dayKey}
                  onClick={() => dim ? undefined : openCreateFor(dayKey)}
                  role={dim ? undefined : "button"}
                  tabIndex={dim ? -1 : 0}
                  onKeyDown={(e) => {
                    if (!dim && (e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
                      e.preventDefault();
                      openCreateFor(dayKey);
                    }
                  }}
                  aria-label={`${dayTitle(dayKey)}${list.length ? ` — ${list.length} entr${list.length === 1 ? "y" : "ies"}` : " — create event"}`}
                  className={cn(
                    "min-h-[84px] border-white/[0.03] bg-[#0b101c] p-1.5 transition-colors sm:min-h-[108px] sm:p-2",
                    dim ? "bg-[#080c15] opacity-45" : "cursor-pointer hover:bg-gold/[0.04]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCursor(dayKey);
                        setView("day");
                      }}
                      aria-label={`Open day view for ${dayTitle(dayKey)}`}
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-semibold transition-colors",
                        isToday
                          ? "bg-gold/20 text-gold ring-1 ring-gold/50"
                          : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                      )}
                    >
                      {Number(dayKey.slice(8, 10))}
                    </button>
                    {list.length > 0 && (
                      <span className="font-mono text-[9px] text-muted-foreground/50 sm:hidden">{list.length}</span>
                    )}
                  </div>

                  {/* Desktop chips (up to 3) */}
                  <div className="mt-1 hidden flex-col gap-1 sm:flex">
                    {shown.map((en) => (
                      <EntryChip key={en.key} entry={en} onOpen={() => setDetailId(en.id)} />
                    ))}
                    {more > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCursor(dayKey);
                          setView("day");
                        }}
                        className="w-full rounded-md px-1.5 py-0.5 text-left text-[10px] font-medium text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-gold"
                      >
                        +{more} more
                      </button>
                    )}
                  </div>

                  {/* Mobile dots + badge */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1 sm:hidden">
                    {list.slice(0, 4).map((en) => (
                      <span
                        key={en.key}
                        title={`${en.title}${en.event && !en.allDay ? ` · ${lagosTime(en.startAt)}` : ""}`}
                        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", eventTypeMeta(en.type).dot, en.status === "cancelled" && "opacity-40")}
                        aria-hidden="true"
                      />
                    ))}
                    {list.length > 4 && (
                      <span className="rounded-full bg-white/[0.07] px-1 font-mono text-[8.5px] font-semibold text-muted-foreground">
                        +{list.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "week" && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {weekDays.map((dayKey) => {
            const list = dayEntries(dayKey);
            const isToday = dayKey === todayKey;
            return (
              <div
                key={dayKey}
                className={cn(
                  "surface-card flex min-h-[150px] flex-col p-3.5",
                  isToday && "border-gold/40 bg-gold/[0.04]"
                )}
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setCursor(dayKey);
                      setView("day");
                    }}
                    className={cn(
                      "font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors",
                      isToday ? "text-gold" : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label={`Open day view for ${dayTitle(dayKey)}`}
                  >
                    {weekdayOf(dayKey)} {shortDay(dayKey)}
                  </button>
                  <button
                    onClick={() => openCreateFor(dayKey)}
                    aria-label={`Create event on ${dayTitle(dayKey)}`}
                    className="rounded-lg p-1 text-muted-foreground/50 transition-colors hover:bg-gold/10 hover:text-gold"
                  >
                    <Plus size={12} aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-2.5 flex flex-1 flex-col gap-1.5">
                  {list.length === 0 ? (
                    <p className="flex flex-1 items-center justify-center text-[11px] text-muted-foreground/40">—</p>
                  ) : (
                    list.map((en) => (
                      <button
                        key={en.key}
                        onClick={() => en.event && setDetailId(en.id)}
                        className={cn(
                          "w-full rounded-lg border border-white/[0.05] bg-white/[0.02] border-l-2 p-2 text-left transition-colors",
                          eventTypeMeta(en.type).bar,
                          en.event ? "hover:border-gold/30 hover:bg-gold/[0.05]" : "cursor-default",
                          en.status === "cancelled" && "opacity-45"
                        )}
                        title={`${en.title}${en.invoiceNumber ? ` · ${formatNaira(en.amountNaira ?? 0)}` : ""}`}
                      >
                        <p className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground/70">
                          {en.allDay ? "all-day" : lagosTime(en.startAt)}
                          {en.event?.isPublic && <Globe2 size={9} className="text-gold" aria-hidden="true" />}
                          {en.event?.type === "webinar" && <Video size={9} className="text-teal" aria-hidden="true" />}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] font-medium text-foreground">{en.title}</p>
                        {en.invoiceNumber && (
                          <p className="truncate font-mono text-[10px] text-rose-300/80">{formatNaira(en.amountNaira ?? 0)}</p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "day" && (
        <div className="surface-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <h3 className="font-display text-[16px] font-bold text-foreground">{dayTitle(cursor)}</h3>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                {dayEntries(cursor).length} entr{dayEntries(cursor).length === 1 ? "y" : "ies"} · click an entry for details
              </p>
            </div>
            <button
              onClick={() => openCreateFor(cursor)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gold/45 bg-gold-dim px-3.5 py-2 text-[12px] font-semibold text-gold transition-colors hover:border-gold/70 hover:bg-gold/20"
              aria-label={`Create event on ${dayTitle(cursor)}`}
            >
              <Plus size={13} aria-hidden="true" /> Add
            </button>
          </div>

          <DayList entries={dayEntries(cursor)} onOpen={(id) => setDetailId(id)} />
        </div>
      )}

      {view === "agenda" && (
        <div className="space-y-3">
          {agendaDays.filter((d) => dayEntries(d).length > 0).length === 0 ? (
            <div className="surface-card flex flex-col items-center gap-3 px-6 py-14 text-center">
              <CalendarDays size={22} className="text-muted-foreground/40" aria-hidden="true" />
              <p className="text-[13.5px] text-muted-foreground">Nothing on the agenda for the next 60 days.</p>
            </div>
          ) : (
            agendaDays
              .filter((d) => dayEntries(d).length > 0)
              .map((dayKey) => (
                <div key={dayKey} className="surface-card p-4">
                  <button
                    onClick={() => {
                      setCursor(dayKey);
                      setView("day");
                    }}
                    className={cn(
                      "font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors",
                      dayKey === todayKey ? "text-gold" : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label={`Open day view for ${dayTitle(dayKey)}`}
                  >
                    {weekdayOf(dayKey)} · {shortDay(dayKey)}
                    {dayKey === todayKey ? " · today" : ""}
                  </button>
                  <DayList entries={dayEntries(dayKey)} compact onOpen={(id) => setDetailId(id)} />
                </div>
              ))
          )}
        </div>
      )}

      {/* ── Dialogs ── */}
      {editing && (
        <EventDialog
          key={`ev-dialog-${dialogSeq}`}
          event={editing.event}
          initialStartLagos={presetStart}
          customers={customers}
          busy={saving}
          onClose={() => {
            setEditing(null);
            setPresetStart(null);
          }}
          onSave={save}
        />
      )}

      {detailId && (
        <EventDetailDialog
          eventId={detailId}
          customers={customers}
          onCancelEvent={onCancelEvent}
          onDelete={onDelete}
          onAttendance={onAttendance}
          onEdit={(ev) => openDialog(ev)}
          onClose={() => setDetailId(null)}
          onRefresh={() => void 0 /* parent refetches via dashboard handlers */}
        />
      )}
    </div>
  );
}

/* ── Shared sub-components ─────────────────────────────────── */

function EntryChip({ entry, onOpen }: { entry: CalEntry; onOpen: () => void }) {
  const meta = eventTypeMeta(entry.type);
  if (!entry.event) {
    // Invoice deadline — display-only (title carries number + amount)
    return (
      <div
        title={`${entry.title} · ${formatNaira(entry.amountNaira ?? 0)}`}
        className={cn(
          "w-full cursor-default truncate rounded-md border border-white/[0.05] border-l-2 bg-white/[0.02] px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground",
          meta.bar
        )}
      >
        <span className="font-mono text-[9px] text-muted-foreground/60">due</span>{" "}
        <span className="truncate">{entry.invoiceNumber}</span>
      </div>
    );
  }
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      title={entry.title}
      className={cn(
        "w-full truncate rounded-md border border-white/[0.05] border-l-2 bg-white/[0.02] px-1.5 py-0.5 text-left text-[10.5px] font-medium text-foreground/90 transition-colors hover:border-gold/30 hover:bg-gold/[0.05]",
        meta.bar,
        entry.status === "cancelled" && "opacity-45 line-through"
      )}
    >
      {entry.allDay ? (
        <span className="font-mono text-[9px] text-muted-foreground/60">all-day</span>
      ) : (
        <span className="font-mono text-[9px] text-muted-foreground/70">{lagosTime(entry.startAt)}</span>
      )}{" "}
      <span className="truncate">{entry.title}</span>
    </button>
  );
}

function DayList({ entries, compact, onOpen }: { entries: CalEntry[]; compact?: boolean; onOpen: (id: string) => void }) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-[12px] text-muted-foreground/60">
        Nothing scheduled — click “Add” to create an event.
      </p>
    );
  }
  return (
    <ul className={cn("mt-3.5", compact ? "space-y-1.5" : "space-y-2.5")}>
      {entries.map((en) => {
        const meta = eventTypeMeta(en.type);
        const interactive = !!en.event;
        const inner = (
          <>
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border", compact ? "h-7 w-7" : "", meta.chip)}>
              <span className={cn("h-2 w-2 rounded-full", meta.dot)} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {!en.allDay && (
                  <span className="font-mono text-[11px] font-semibold text-gold-light">{lagosTime(en.startAt)}</span>
                )}
                {en.allDay && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">all-day</span>
                )}
                <span className={cn("truncate text-[13px] font-semibold text-foreground", en.status === "cancelled" && "line-through opacity-60")}>
                  {en.title}
                </span>
                {en.event && en.event.status !== "scheduled" && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-semibold",
                      EVENT_STATUS_STYLES[en.event.status]
                    )}
                  >
                    {en.event.status}
                  </span>
                )}
                {en.event?.isPublic && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold-dim px-2 py-0.5 text-[9.5px] font-semibold text-gold">
                    <Globe2 size={9} aria-hidden="true" /> {en.event.registrationsCount}
                    {en.event.capacity !== null ? `/${en.event.capacity}` : ""}
                  </span>
                )}
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                {en.event?.location && <span className="truncate">{en.event.location}</span>}
                {en.event?.meetingUrl && (
                  <a
                    href={en.event.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 truncate font-medium text-teal underline decoration-teal/40 underline-offset-2 hover:text-teal/80"
                  >
                    join link
                  </a>
                )}
                {en.invoiceNumber && (
                  <span className="font-mono font-semibold text-rose-300">{formatNaira(en.amountNaira ?? 0)}</span>
                )}
                {en.event && !en.event.location && !en.event.meetingUrl && !en.invoiceNumber && (
                  <span className="text-muted-foreground/50">{lagosEventLabel(en.startAt, { withWeekday: false })}</span>
                )}
              </span>
            </span>
          </>
        );
        if (!interactive) {
          return (
            <li
              key={en.key}
              title={`${en.title} · ${formatNaira(en.amountNaira ?? 0)}`}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-white/[0.05] border-l-2 bg-white/[0.02] p-3",
                compact ? "p-2.5" : "",
                meta.bar
              )}
            >
              {inner}
            </li>
          );
        }
        return (
          <li key={en.key}>
            <button
              onClick={() => onOpen(en.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border border-white/[0.05] border-l-2 bg-white/[0.02] p-3 text-left transition-all hover:border-gold/30 hover:bg-gold/[0.04] focus-visible:outline-2 focus-visible:outline-gold",
                compact ? "p-2.5" : "",
                meta.bar
              )}
            >
              {inner}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
