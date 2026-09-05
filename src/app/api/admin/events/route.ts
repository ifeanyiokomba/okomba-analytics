import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { auditAdmin } from "@/lib/admin-rbac";
import {
  eventCreateSchema,
  listAdminEvents,
  runEventLifecycle,
  runEventReminderScan,
  toCalendarEventRow,
} from "@/lib/events";
import { EVENT_TYPE_KEYS } from "@/lib/events-shared";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/admin/events — §33 calendar data + §36 lazy engines.      */
/*                                                                     */
/* ?from&to (ISO dates, default = current month ± 35 days) · ?type ·  */
/* ?status filters. Also computes stats (upcoming7d,                  */
/* registrationsTotal, liveWebinars). The lazy reminder scan +        */
/* lifecycle keep rows fresh even if the 09:00 cron missed (§36).     */
/* ------------------------------------------------------------------ */
export async function GET(req: Request) {
  try {
    const guard = await authorizeAdmin(req, "manage_events");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    // §36 — lazy engines (bounded ±3d window, fire-and-forget-ish
    // but awaited so the response reflects fresh remindersSent)
    try {
      await runEventLifecycle();
    } catch (err) {
      console.error("[GET /api/admin/events] lifecycle failed:", err);
    }
    try {
      await runEventReminderScan({ trigger: "lazy-admin-list" });
    } catch (err) {
      console.error("[GET /api/admin/events] reminder scan failed:", err);
    }

    const url = new URL(req.url);
    const now = new Date();

    let from: Date | undefined;
    let to: Date | undefined;
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    if (fromParam && !Number.isNaN(Date.parse(fromParam))) from = new Date(fromParam);
    if (toParam && !Number.isNaN(Date.parse(toParam))) to = new Date(toParam);
    if (!from || !to) {
      // Default: current month ± 35 days
      const base = new Date(now.getFullYear(), now.getMonth(), 1);
      from = new Date(base.getTime() - 35 * 24 * 60 * 60 * 1000);
      to = new Date(base.getTime() + 65 * 24 * 60 * 60 * 1000);
    }

    const typeParam = url.searchParams.get("type");
    const statusParam = url.searchParams.get("status");

    const { events, stats } = await listAdminEvents({
      from,
      to,
      ...(typeParam && EVENT_TYPE_KEYS.includes(typeParam) ? { type: typeParam } : {}),
      ...(statusParam && ["scheduled", "completed", "cancelled"].includes(statusParam)
        ? { status: statusParam }
        : {}),
    });

    return NextResponse.json({ ok: true, events, stats, range: { from: from.toISOString(), to: to.toISOString() } });
  } catch (err) {
    console.error("[GET /api/admin/events]", err);
    return NextResponse.json({ ok: false, error: "Could not load events" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* POST /api/admin/events — §33 create. createdBy = guard email.      */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  try {
    const guard = await authorizeAdmin(req, "manage_events");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    // datetime-local strings ("2026-02-14T10:00" = LAGOS local) are
    // accepted and converted to UTC; plain ISO strings pass through.
    const normalized = normalizeDateFields(body);
    const parsed = eventCreateSchema.safeParse(normalized);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid event" },
        { status: 422 }
      );
    }
    const d = parsed.data;

    const startAt = toDate(d.startAt)!;
    const endAt = d.endAt && d.endAt !== "" ? toDate(d.endAt) : null;
    if (endAt && endAt.getTime() < startAt.getTime()) {
      return NextResponse.json(
        { ok: false, error: "End time must be after the start time" },
        { status: 422 }
      );
    }

    const created = await db.calendarEvent.create({
      data: {
        title: d.title,
        description: d.description || null,
        type: d.type,
        startAt,
        endAt,
        allDay: d.allDay,
        location: d.location || null,
        meetingUrl: d.meetingUrl || null,
        isPublic: d.isPublic,
        capacity: d.isPublic ? d.capacity ?? null : null,
        customerId: d.customerId || null,
        invoiceId: d.invoiceId || null,
        status: d.status,
        reminderOffsets: d.reminderOffsets,
        createdBy: guard.auth.email,
      },
    });

    auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "event.create",
      targetType: "CalendarEvent",
      targetId: created.id,
      meta: { title: created.title, type: created.type, isPublic: created.isPublic },
    }).catch(() => {});

    const row = await db.calendarEvent.findUnique({
      where: { id: created.id },
      include: { registrations: { select: { status: true } } },
    });
    return NextResponse.json(
      {
        ok: true,
        event: row
          ? toCalendarEventRow({
              ...row,
              registrationsCount: row.registrations.filter((g) => g.status === "registered").length,
            })
          : null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/events]", err);
    return NextResponse.json({ ok: false, error: "Could not create event" }, { status: 500 });
  }
}

/* ── helpers ── */

/** Accept "YYYY-MM-DDTHH:mm" (Lagos) or full ISO; returns ISO-UTC. */
function normalizeDateFields(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  const b = body as Record<string, unknown>;
  const out: Record<string, unknown> = { ...b };
  for (const key of ["startAt", "endAt"]) {
    const v = out[key];
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v.trim())) {
      try {
        out[key] = lagosLocalToUtc(v.trim());
      } catch {
        /* let zod report it */
      }
    }
  }
  return out;
}

function lagosLocalToUtc(v: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!m) throw new Error("bad datetime");
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  return new Date(ms - 60 * 60_000).toISOString();
}

function toDate(v: string): Date | null {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
