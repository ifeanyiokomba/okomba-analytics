import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { auditAdmin } from "@/lib/admin-rbac";
import { eventUpdateSchema, getEventWithRegistrations, toCalendarEventRow } from "@/lib/events";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/admin/events/[id] — full row + registrations[] (detail    */
/* dialog: §34 attendance management table).                          */
/* ------------------------------------------------------------------ */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const guard = await authorizeAdmin(req, "manage_events");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }
    const { id } = await ctx.params;

    const found = await getEventWithRegistrations(id);
    if (!found) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    const registered = found.registrations.filter((r) => r.status === "registered");
    const summary = {
      total: found.registrations.length,
      registered: registered.length,
      attended: found.registrations.filter((r) => r.status === "attended").length,
      cancelled: found.registrations.filter((r) => r.status === "cancelled").length,
      consented: found.registrations.filter((r) => r.consent).length,
    };

    return NextResponse.json({ ok: true, ...found, summary });
  } catch (err) {
    console.error("[GET /api/admin/events/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not load event" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* PATCH /api/admin/events/[id] — field updates + status transitions. */
/* scheduled|completed|cancelled; re-opening (completed/cancelled →   */
/* scheduled) is allowed. cancelled stops all future reminders.       */
/* ------------------------------------------------------------------ */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const guard = await authorizeAdmin(req, "manage_events");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }
    const { id } = await ctx.params;

    const existing = await db.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const normalized = normalizeDateFields(body);
    const parsed = eventUpdateSchema.safeParse(normalized);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid event update" },
        { status: 422 }
      );
    }
    const d = parsed.data;

    const startAt = d.startAt !== undefined ? toDate(d.startAt) : existing.startAt;
    const endAt = d.endAt === undefined ? existing.endAt : d.endAt === "" ? null : toDate(d.endAt);
    if (endAt && startAt && endAt.getTime() < startAt.getTime()) {
      return NextResponse.json(
        { ok: false, error: "End time must be after the start time" },
        { status: 422 }
      );
    }

    const updated = await db.calendarEvent.update({
      where: { id },
      data: {
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.description !== undefined ? { description: d.description || null } : {}),
        ...(d.type !== undefined ? { type: d.type } : {}),
        ...(startAt ? { startAt } : {}),
        ...(d.endAt !== undefined ? { endAt } : {}),
        ...(d.allDay !== undefined ? { allDay: d.allDay } : {}),
        ...(d.location !== undefined ? { location: d.location || null } : {}),
        ...(d.meetingUrl !== undefined ? { meetingUrl: d.meetingUrl || null } : {}),
        ...(d.isPublic !== undefined ? { isPublic: d.isPublic } : {}),
        ...(d.capacity !== undefined ? { capacity: d.isPublic === false ? null : d.capacity } : {}),
        ...(d.customerId !== undefined ? { customerId: d.customerId || null } : {}),
        ...(d.invoiceId !== undefined ? { invoiceId: d.invoiceId || null } : {}),
        ...(d.status !== undefined ? { status: d.status } : {}),
        ...(d.reminderOffsets !== undefined ? { reminderOffsets: d.reminderOffsets } : {}),
      },
    });

    auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "event.update",
      targetType: "CalendarEvent",
      targetId: updated.id,
      meta: {
        ...(d.status !== undefined ? { status: d.status } : {}),
        ...(d.title !== undefined ? { title: d.title } : {}),
      },
    }).catch(() => {});

    const row = await db.calendarEvent.findUnique({
      where: { id: updated.id },
      include: { registrations: { select: { status: true } } },
    });
    return NextResponse.json({
      ok: true,
      event: row
        ? toCalendarEventRow({
            ...row,
            registrationsCount: row.registrations.filter((g) => g.status === "registered").length,
          })
        : null,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/events/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not update event" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* DELETE /api/admin/events/[id] — remove (registrations cascade).    */
/* ------------------------------------------------------------------ */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const guard = await authorizeAdmin(req, "manage_events");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }
    const { id } = await ctx.params;

    const existing = await db.calendarEvent.findUnique({
      where: { id },
      select: { id: true, title: true, isPublic: true },
    });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    await db.calendarEvent.delete({ where: { id } });

    auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "event.delete",
      targetType: "CalendarEvent",
      targetId: existing.id,
      meta: { title: existing.title, isPublic: existing.isPublic },
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/events/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not delete event" }, { status: 500 });
  }
}

/* ── helpers (same datetime-local convention as the collection route) ── */

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
    } else if (key === "endAt" && v === null) {
      out[key] = undefined; // never allow clearing via this path (use "")
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
