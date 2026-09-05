/* ─────────────────────────────────────────────────────────────
   BATCH 10 (§33–36) — CLIENT-SAFE calendar/event vocabulary.

   Split from src/lib/events.ts (server-only: imports Prisma) per
   the same Turbopack lesson as ads-shared/ads and media-shared/
   media (Task 41): a client component importing constants from a
   module that transitively imports `db` drags Prisma into the
   browser bundle. Public/admin calendar UI imports THIS file;
   route handlers + the reminder engine import src/lib/events.ts,
   which re-exports it.
   ───────────────────────────────────────────────────────────── */

/* §33 — the six canonical calendar entry kinds. */
export const EVENT_TYPES = [
  {
    key: "appointment",
    label: "Appointment",
    // gold accent — customer-facing 1:1 work
    dot: "bg-gold",
    chip: "border-gold/30 bg-gold-dim text-gold",
    bar: "border-l-gold",
  },
  {
    key: "meeting",
    label: "Meeting",
    dot: "bg-purple-300",
    chip: "border-purple-400/30 bg-purple-400/10 text-purple-300",
    bar: "border-l-purple-300",
  },
  {
    key: "webinar",
    label: "Webinar",
    dot: "bg-teal",
    chip: "border-teal/30 bg-teal-dim text-teal",
    bar: "border-l-teal",
  },
  {
    key: "event",
    label: "Event",
    dot: "bg-gold-light",
    chip: "border-gold-light/30 bg-gold-light/10 text-gold-light",
    bar: "border-l-gold-light",
  },
  {
    key: "deadline",
    label: "Deadline",
    dot: "bg-rose-400",
    chip: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    bar: "border-l-rose-400",
  },
  {
    key: "task",
    label: "Task",
    dot: "bg-white/40",
    chip: "border-white/15 bg-white/[0.04] text-muted-foreground",
    bar: "border-l-white/40",
  },
] as const;
export type EventTypeKey = (typeof EVENT_TYPES)[number]["key"];
export const EVENT_TYPE_KEYS: readonly string[] = EVENT_TYPES.map((t) => t.key);

export function eventTypeMeta(key: string) {
  return EVENT_TYPES.find((t) => t.key === key) ?? EVENT_TYPES[5];
}

export function eventTypeLabel(key: string): string {
  return eventTypeMeta(key).label;
}

/* Event lifecycle (admin-managed + lazy auto-complete). */
export const EVENT_STATUSES = ["scheduled", "completed", "cancelled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_STYLES: Record<string, string> = {
  scheduled: "border-gold/35 bg-gold-dim text-gold",
  completed: "border-teal/35 bg-teal-dim text-teal",
  cancelled: "border-white/15 bg-white/[0.04] text-muted-foreground/70 line-through",
};

/* §34 — registration states (attendance management). */
export const REGISTRATION_STATUSES = ["registered", "attended", "cancelled"] as const;

/* §34 — reminder offset presets offered in the editor
   (multi-select chips). Values are minutes BEFORE start;
   negative values are POST-event follow-ups. */
export const REMINDER_OFFSET_PRESETS: { minutes: number; label: string }[] = [
  { minutes: 1440, label: "1 day before" },
  { minutes: 60, label: "1 hour before" },
  { minutes: 0, label: "At start" },
  { minutes: -1440, label: "1 day after" },
];

/* ── Row types shared by admin + public UI (ISO-string dates) ── */

/** Admin projection (GET /api/admin/events) — full row + counts. */
export type CalendarEventRow = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  location: string | null;
  meetingUrl: string | null;
  isPublic: boolean;
  capacity: number | null;
  customerId: string | null;
  invoiceId: string | null;
  status: string;
  reminderOffsets: number[];
  remindersSent: Record<string, string>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  registrationsCount: number;
};

/** §34 registration row (admin detail dialog + attendance). */
export type EventRegistrationRow = {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  countryCode: string | null;
  consent: boolean;
  consentAt: string | null;
  status: string;
  reminderStates: Record<string, string>;
  createdAt: string;
};

export type EventStats = {
  upcoming7d: number;
  registrationsTotal: number;
  liveWebinars: number;
};

/** §33/§34 — sanitized PUBLIC projection (GET /api/events). */
export type PublicEvent = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  location: string | null;
  hasMeetingUrl: boolean; // NEVER the URL itself — join link ships via email
  capacity: number | null;
  registrationCount: number;
  spotsLeft: number | null;
};

/* ── Calendar view helpers ── */
export type CalendarViewMode = "month" | "week" | "day" | "agenda";

export const VIEW_MODES: { key: CalendarViewMode; label: string }[] = [
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
  { key: "day", label: "Day" },
  { key: "agenda", label: "Agenda" },
];

/* ── Lagos timezone helpers (§33 rule: store UTC, render Lagos) ──
   Nigeria has NO daylight saving (fixed UTC+01:00 year-round), so
   a fixed +60-minute shift is exact. Kept client-safe (pure math —
   no Intl side effects beyond formatting). */

export const LAGOS_TZ = "Africa/Lagos";
const LAGOS_OFFSET_MIN = 60;

/** "2026-02-14" for an instant, as seen in Lagos (day bucketing). */
export function lagosDateKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-CA", { timeZone: LAGOS_TZ });
}

/** datetime-local "2026-02-14T10:00" (Lagos wall time) → UTC Date. */
export function lagosInputValueToUtc(v: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v.trim());
  if (!m) throw new Error("Invalid datetime-local value");
  const [, y, mo, d, h, mi] = m;
  const ms = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  return new Date(ms - LAGOS_OFFSET_MIN * 60_000);
}

/** UTC Date → datetime-local "2026-02-14T10:00" (Lagos wall time). */
export function utcToLagosInputValue(d: Date): string {
  const shifted = new Date(d.getTime() + LAGOS_OFFSET_MIN * 60_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${p(shifted.getUTCMonth() + 1)}-${p(shifted.getUTCDate())}T${p(shifted.getUTCHours())}:${p(shifted.getUTCMinutes())}`;
}

/** "10:00" — Lagos wall-clock time for calendar chips. */
export function lagosTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-NG", {
    timeZone: LAGOS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "Sat 14 Feb 2026 · 10:00 WAT" — Day/Agenda headers + detail views. */
export function lagosEventLabel(iso: string, opts?: { withYear?: boolean; withWeekday?: boolean }): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-NG", {
    timeZone: LAGOS_TZ,
    ...(opts?.withWeekday === false ? {} : { weekday: "short" }),
    day: "numeric",
    month: "short",
    ...(opts?.withYear ? { year: "numeric" } : {}),
  });
  const time = d.toLocaleTimeString("en-NG", {
    timeZone: LAGOS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${day} · ${time} WAT`;
}

/** Long label for emails/detail: "Saturday, 14 February 2026 · 10:00 WAT". */
export function lagosEventLongLabel(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-NG", {
    timeZone: LAGOS_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-NG", {
    timeZone: LAGOS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${day} · ${time} WAT`;
}
