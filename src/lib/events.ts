import { z } from "zod";
import { db } from "@/lib/db";
import { COUNTRY_CODES } from "@/lib/countries";
import { lagosInputValueToUtc, lagosDateKey, LAGOS_TZ } from "./events-shared";

/* ─────────────────────────────────────────────────────────────
   BATCH 10 (§33–36) — SERVER-ONLY calendar/event engine.

   Re-exports the client-safe vocabulary from events-shared.ts and
   adds the Prisma-backed pieces: zod schemas, CRUD helpers, the
   §34 public registration flow, the reminder scanner (same lazy +
   dedup'd pattern as runReminderScan / runAdLifecycle), the lazy
   lifecycle auto-complete, and the seed.
   ───────────────────────────────────────────────────────────── */

export * from "./events-shared";

/* ── Zod schemas ─────────────────────────────────────────── */

export const eventCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title must be 120 characters or fewer"),
  type: z.enum(["appointment", "meeting", "webinar", "event", "deadline", "task"]),
  startAt: z.iso.datetime({ message: "startAt must be an ISO datetime" }),
  endAt: z
    .string()
    .optional()
    .refine((v) => v === undefined || v === "" || !Number.isNaN(Date.parse(v)), "endAt must be a valid date"),
  allDay: z.boolean().default(false),
  location: z.string().trim().max(200, "Location must be 200 characters or fewer").optional(),
  meetingUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https:\/\//.test(v), "Meeting URL must start with https://")
    .optional(),
  isPublic: z.boolean().default(false),
  capacity: z
    .number({ message: "Capacity must be a number" })
    .int("Capacity must be a whole number")
    .positive("Capacity must be a positive number")
    .nullable()
    .default(null),
  customerId: z.string().trim().optional(),
  invoiceId: z.string().trim().optional(),
  description: z.string().trim().max(4000, "Description must be 4000 characters or fewer").optional(),
  reminderOffsets: z
    .array(z.number().int())
    .refine(
      (arr) => arr.every((o) => o >= -10080 && o <= 10080),
      "Reminder offsets must be within ±7 days (±10080 minutes)"
    )
    .default([1440, 0, -1440]),
  status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"),
});

/* Update schema is written EXPLICITLY (not .partial() of the create
   schema) — zod applies `.default()` even through `.partial()`, which
   would silently reset untouched fields on every PATCH. Here every
   field is genuinely optional with NO defaults. */
export const eventUpdateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title must be 120 characters or fewer").optional(),
  type: z.enum(["appointment", "meeting", "webinar", "event", "deadline", "task"]).optional(),
  startAt: z.iso.datetime({ message: "startAt must be an ISO datetime" }).optional(),
  endAt: z
    .string()
    .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "endAt must be a valid date")
    .optional(),
  allDay: z.boolean().optional(),
  location: z.string().trim().max(200, "Location must be 200 characters or fewer").optional(),
  meetingUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https:\/\//.test(v), "Meeting URL must start with https://")
    .optional(),
  isPublic: z.boolean().optional(),
  capacity: z
    .number({ message: "Capacity must be a number" })
    .int("Capacity must be a whole number")
    .positive("Capacity must be a positive number")
    .nullable()
    .optional(),
  customerId: z.string().trim().optional(),
  invoiceId: z.string().trim().optional(),
  description: z.string().trim().max(4000, "Description must be 4000 characters or fewer").optional(),
  reminderOffsets: z
    .array(z.number().int())
    .refine(
      (arr) => arr.every((o) => o >= -10080 && o <= 10080),
      "Reminder offsets must be within ±7 days (±10080 minutes)"
    )
    .optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
});

export const eventRegistrationSchema = z.object({
  eventId: z.string().trim().min(1),
  firstName: z.string().trim().min(1, "First name is required").max(80, "First name must be 80 characters or fewer"),
  lastName: z.string().trim().min(1, "Last name is required").max(80, "Last name must be 80 characters or fewer"),
  email: z.email("A valid email address is required").max(200),
  phone: z.string().trim().max(40, "Phone must be 40 characters or fewer").optional(),
  countryCode: z.enum(COUNTRY_CODES as [string, ...string[]]).optional(),
  consent: z.literal(true, { message: "Consent is required to register" }),
});

export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>;

/* ── Row mapping helpers ─────────────────────────────────── */

type EventRowWithCount = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  location: string | null;
  meetingUrl: string | null;
  isPublic: boolean;
  capacity: number | null;
  customerId: string | null;
  invoiceId: string | null;
  status: string;
  reminderOffsets: unknown;
  remindersSent: unknown;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  registrationsCount?: number;
};

function asOffsets(v: unknown): number[] {
  return Array.isArray(v) ? v.filter((o): o is number => typeof o === "number") : [];
}
function asStates(v: unknown): Record<string, string> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, string>) : {};
}

export function toCalendarEventRow(r: EventRowWithCount) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    type: r.type,
    startAt: r.startAt.toISOString(),
    endAt: r.endAt ? r.endAt.toISOString() : null,
    allDay: r.allDay,
    location: r.location,
    meetingUrl: r.meetingUrl,
    isPublic: r.isPublic,
    capacity: r.capacity,
    customerId: r.customerId,
    invoiceId: r.invoiceId,
    status: r.status,
    reminderOffsets: asOffsets(r.reminderOffsets),
    remindersSent: asStates(r.remindersSent),
    createdBy: r.createdBy,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    registrationsCount: r.registrationsCount ?? 0,
  };
}

export function toRegistrationRow(r: {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  countryCode: string | null;
  consent: boolean;
  consentAt: Date | null;
  status: string;
  reminderStates: unknown;
  createdAt: Date;
}) {
  return {
    id: r.id,
    eventId: r.eventId,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    phone: r.phone,
    countryCode: r.countryCode,
    consent: r.consent,
    consentAt: r.consentAt ? r.consentAt.toISOString() : null,
    status: r.status,
    reminderStates: asStates(r.reminderStates),
    createdAt: r.createdAt.toISOString(),
  };
}

/* ── CRUD helpers ────────────────────────────────────────── */

export async function listAdminEvents(opts?: {
  from?: Date;
  to?: Date;
  type?: string;
  status?: string;
}) {
  const where: Record<string, unknown> = {};
  if (opts?.from || opts?.to) {
    where.startAt = {
      ...(opts?.from ? { gte: opts.from } : {}),
      ...(opts?.to ? { lte: opts.to } : {}),
    };
  }
  if (opts?.type) where.type = opts.type;
  if (opts?.status) where.status = opts.status;

  const rows = await db.calendarEvent.findMany({
    where,
    orderBy: { startAt: "asc" },
    include: { registrations: { select: { status: true } } },
  });

  const mapped = rows.map((r) =>
    toCalendarEventRow({
      ...r,
      registrationsCount: r.registrations.filter((g) => g.status === "registered").length,
    })
  );

  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingWindow = await db.calendarEvent.count({
    where: { status: "scheduled", startAt: { gte: now, lte: in7d } },
  });
  const registrationsTotal = await db.eventRegistration.count({
    where: { status: "registered" },
  });
  const liveWebinars = await db.calendarEvent.count({
    where: { status: "scheduled", type: "webinar", isPublic: true, startAt: { gte: now } },
  });

  const stats = {
    upcoming7d: upcomingWindow,
    registrationsTotal,
    liveWebinars,
  };

  return { events: mapped, stats };
}

export async function getEventWithRegistrations(id: string) {
  const ev = await db.calendarEvent.findUnique({
    where: { id },
    include: { registrations: { orderBy: { createdAt: "asc" } } },
  });
  if (!ev) return null;
  return {
    event: toCalendarEventRow({
      ...ev,
      registrationsCount: ev.registrations.filter((g) => g.status === "registered").length,
    }),
    registrations: ev.registrations.map(toRegistrationRow),
  };
}

/* ── §34 — public registration ──────────────────────────── */

export async function registerForEvent(
  eventId: string,
  input: EventRegistrationInput,
  meta?: { ip?: string }
): Promise<
  | { ok: false; reason: "not_found" | "closed" | "full" | "past"; capacity?: number }
  | { ok: true; duplicate: boolean; registration: ReturnType<typeof toRegistrationRow> }
> {
  const ev = await db.calendarEvent.findUnique({
    where: { id: eventId },
    include: { registrations: true },
  });
  if (!ev) return { ok: false, reason: "not_found" };
  if (!ev.isPublic) return { ok: false, reason: "closed" };
  if (ev.status !== "scheduled") return { ok: false, reason: "closed" };
  if (ev.startAt.getTime() <= Date.now()) return { ok: false, reason: "past" };

  const active = ev.registrations.filter((r) => r.status === "registered");
  const existing = ev.registrations.find((r) => r.email === input.email);

  if (!existing && ev.capacity !== null && active.length >= ev.capacity) {
    return { ok: false, reason: "full", capacity: ev.capacity };
  }

  if (existing) {
    if (existing.status === "cancelled") {
      // Reactivate — fresh reminderStates so cancelled-era sends
      // don't suppress the re-registration reminders (§34).
      const updated = await db.eventRegistration.update({
        where: { id: existing.id },
        data: {
          status: "registered",
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone ?? null,
          countryCode: input.countryCode ?? null,
          consent: true,
          consentAt: new Date(),
          reminderStates: {},
        },
      });
      fireRegistrationEmails(ev, updated, meta).catch((err) =>
        console.error("[events] registration email failed:", err)
      );
      return { ok: true, duplicate: false, registration: toRegistrationRow(updated) };
    }
    // Already registered — idempotent success, no new email
    return { ok: true, duplicate: true, registration: toRegistrationRow(existing) };
  }

  const created = await db.eventRegistration.create({
    data: {
      eventId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone ?? null,
      countryCode: input.countryCode ?? null,
      consent: true,
      consentAt: new Date(),
    },
  });

  fireRegistrationEmails(ev, created, meta).catch((err) =>
    console.error("[events] registration email failed:", err)
  );
  return { ok: true, duplicate: false, registration: toRegistrationRow(created) };
}

/* Confirmation + admin alert — fire-and-forget; email failure
   NEVER blocks a successful registration (§34). */
async function fireRegistrationEmails(
  ev: { id: string; title: string; startAt: Date; location: string | null; meetingUrl: string | null; type: string },
  reg: { firstName: string; lastName: string; email: string; countryCode: string | null; phone: string | null },
  meta?: { ip?: string }
) {
  const { notifyEventRegistration, notifyEventRegistrationAdmin } = await import("@/lib/notify");
  await Promise.allSettled([
    notifyEventRegistration({
      eventId: ev.id,
      eventTitle: ev.title,
      eventType: ev.type,
      startAt: ev.startAt.toISOString(),
      location: ev.location,
      meetingUrl: ev.meetingUrl,
      firstName: reg.firstName,
      email: reg.email,
    }),
    notifyEventRegistrationAdmin({
      eventId: ev.id,
      eventTitle: ev.title,
      startAt: ev.startAt.toISOString(),
      firstName: reg.firstName,
      lastName: reg.lastName,
      email: reg.email,
      countryCode: reg.countryCode,
      phone: reg.phone,
      ip: meta?.ip,
    }),
  ]);
}

/* ── §33/§36 — lazy lifecycle ───────────────────────────── */

/** scheduled → completed when the event ended > 24h ago (lazy,
 *  idempotent, bounded — the same pattern as runAdLifecycle). */
export async function runEventLifecycle(): Promise<number> {
  const now = Date.now();
  const cutoff = new Date(now - 24 * 60 * 60 * 1000);
  const rows = await db.calendarEvent.findMany({
    where: {
      status: "scheduled",
      OR: [{ endAt: { lt: cutoff } }, { endAt: null, startAt: { lt: new Date(cutoff.getTime() - 60 * 60 * 1000) } }],
    },
    select: { id: true, endAt: true, startAt: true },
  });
  let flipped = 0;
  for (const r of rows) {
    const res = await db.calendarEvent.updateMany({
      where: { id: r.id, status: "scheduled" },
      data: { status: "completed" },
    });
    flipped += res.count;
  }
  return flipped;
}

/* ── §34/§36 — event reminder scan ──────────────────────── */

export type EventReminderRunReport = {
  trigger: string;
  ranAt: string;
  lagosToday: string;
  scanned: number;
  eventsTouched: number;
  sentCount: number;
  failed: number;
  skipped: number;
  dryRun: boolean;
};

const SCAN_WINDOW_PAST_DAYS = 3;
const SCAN_WINDOW_FUTURE_DAYS = 30;
const MAX_REGISTRANTS_PER_EVENT = 500;

/**
 * For every scheduled event in [now−3d, now+30d], walk its
 * reminderOffsets. fireAt = startAt − offset minutes (offset 0 =
 * at start; negative offset = AFTER start → post-event follow-up).
 * When fireAt has passed and the offset hasn't been sent to a
 * registrant yet (per-registrant reminderStates), send the §34
 * reminder email, then stamp both the registrant map and the
 * event-level batch marker (remindersSent).
 *
 * Idempotent (dedup maps), bounded (window + 500 registrants),
 * observable (report + EmailLog rows), retryable (failed sends are
 * never marked sent).
 */
export async function runEventReminderScan(opts?: {
  dryRun?: boolean;
  trigger?: string;
}): Promise<EventReminderRunReport> {
  const trigger = opts?.trigger ?? "manual";
  const dryRun = opts?.dryRun ?? false;
  const now = new Date();

  const report: EventReminderRunReport = {
    trigger,
    ranAt: now.toISOString(),
    lagosToday: lagosDateKey(now),
    scanned: 0,
    eventsTouched: 0,
    sentCount: 0,
    failed: 0,
    skipped: 0,
    dryRun,
  };

  const events = await db.calendarEvent.findMany({
    where: {
      status: "scheduled", // cancelled → never fire future reminders (§34)
      startAt: {
        gte: new Date(now.getTime() - SCAN_WINDOW_PAST_DAYS * 24 * 60 * 60 * 1000),
        lte: new Date(now.getTime() + SCAN_WINDOW_FUTURE_DAYS * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { startAt: "asc" },
  });
  report.scanned = events.length;

  const { sendEventReminderEmail } = await import("@/lib/notify");

  for (const ev of events) {
    const offsets = asOffsets(ev.reminderOffsets);
    if (offsets.length === 0) continue;
    const batchSent = asStates(ev.remindersSent);

    // Registrants: only status=registered, bounded
    const registrants = await db.eventRegistration.findMany({
      where: { eventId: ev.id, status: "registered" },
      take: MAX_REGISTRANTS_PER_EVENT,
      orderBy: { createdAt: "asc" },
    });
    if (registrants.length === 0) continue;

    let touchedThisEvent = false;
    let batchChanged = false;

    for (const offset of offsets) {
      const key = String(offset);
      const fireAt = new Date(ev.startAt.getTime() - offset * 60_000);
      if (fireAt.getTime() > now.getTime()) continue; // not due yet
      if (batchSent[key]) continue; // batch-level already marked (pre-dedup fast path)

      let anySent = false;

      for (const reg of registrants) {
        const states = asStates(reg.reminderStates);
        if (states[key]) {
          report.skipped += 1;
          continue; // per-registrant dedup
        }

        if (dryRun) {
          report.sentCount += 1;
          anySent = true;
          continue;
        }

        try {
          const kind: "pre" | "sameday" | "followup" = offset > 0 ? "pre" : offset === 0 ? "sameday" : "followup";
          const res = await sendEventReminderEmail({
            eventId: ev.id,
            eventTitle: ev.title,
            startAt: ev.startAt.toISOString(),
            location: ev.location,
            meetingUrl: ev.meetingUrl,
            firstName: reg.firstName,
            email: reg.email,
            kind,
            offsetMinutes: offset,
          });
          if (res.ok) {
            anySent = true;
            report.sentCount += 1;
            // Stamp per-registrant AFTER a successful (or logged) send
            await db.eventRegistration.update({
              where: { id: reg.id },
              data: { reminderStates: { ...states, [key]: now.toISOString() } },
            }).catch(() => {});
          } else {
            report.failed += 1;
          }
        } catch (err) {
          report.failed += 1;
          console.error(`[event-reminders] ${ev.id} offset ${offset} → ${reg.email} failed:`, err);
        }
      }

      if (anySent) {
        touchedThisEvent = true;
        batchSent[key] = now.toISOString();
        batchChanged = true;
      }
    }

    if (batchChanged && !dryRun) {
      await db.calendarEvent
        .update({ where: { id: ev.id }, data: { remindersSent: batchSent } })
        .catch((err) => console.error("[event-reminders] batch marker failed:", err));
    }
    if (touchedThisEvent) report.eventsTouched += 1;
  }

  return report;
}

/* ── Seed (demo data — idempotent, only when the table is empty) ── */

export async function seedEventsIfEmpty(): Promise<boolean> {
  const count = await db.calendarEvent.count();
  if (count > 0) return false;

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const at = (daysFromNow: number, lagosHH: number, lagosMM = 0): Date =>
    lagosInputValueToUtc(
      `${new Date(now + daysFromNow * DAY).toISOString().slice(0, 10)}T${String(lagosHH).padStart(2, "0")}:${String(lagosMM).padStart(2, "0")}`
    );

  await db.calendarEvent.createMany({
    data: [
      {
        title: "Nigeria Data Analytics Outlook 2026",
        description:
          "Public webinar — our annual read on Nigeria's data landscape: tooling shifts, hiring patterns, and where analytics budgets are moving next year. Live Q&A at the end.",
        type: "webinar",
        startAt: at(3, 10),
        endAt: new Date(at(3, 10).getTime() + 90 * 60_000),
        allDay: false,
        isPublic: true,
        capacity: 500,
        meetingUrl: "https://meet.google.com/okomba-analytics-demo",
        reminderOffsets: [1440, 0, -1440],
        createdBy: "seed",
      },
      {
        title: "Free Data Clinic: Fix Your Spreadsheet",
        description:
          "Bring your broken spreadsheet — formulas, pivots, dirty data, anything. We fix it live and show you how to keep it fixed. Free and open to everyone.",
        type: "event",
        startAt: at(10, 14),
        endAt: new Date(at(10, 14).getTime() + 2 * 60 * 60_000),
        allDay: false,
        isPublic: true,
        location: "Online",
        reminderOffsets: [1440, 0],
        createdBy: "seed",
      },
      {
        title: "Q3 tax filing deadline",
        description: "Internal deadline — company filings due. Gather statements by the previous Friday.",
        type: "deadline",
        startAt: at(6, 0),
        endAt: null,
        allDay: true,
        isPublic: false,
        reminderOffsets: [1440, 0],
        createdBy: "seed",
      },
      {
        title: "Pipeline review",
        description: "Weekly pipeline review with the CRM board: new leads, stuck proposals, follow-ups owed.",
        type: "meeting",
        startAt: at(2, 9),
        endAt: new Date(at(2, 9).getTime() + 45 * 60_000),
        allDay: false,
        isPublic: false,
        location: "Internal — meet.google.com",
        reminderOffsets: [0],
        createdBy: "seed",
      },
    ],
  });
  return true;
}
