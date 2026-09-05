import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { auditAdmin } from "@/lib/admin-rbac";
import { toRegistrationRow } from "@/lib/events";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/admin/events/[id]/registrations — §34 list + summary.     */
/* ------------------------------------------------------------------ */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const guard = await authorizeAdmin(req, "manage_events");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }
    const { id } = await ctx.params;

    const ev = await db.calendarEvent.findUnique({
      where: { id },
      select: { id: true, title: true, isPublic: true, capacity: true, status: true },
    });
    if (!ev) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    const regs = await db.eventRegistration.findMany({
      where: { eventId: id },
      orderBy: { createdAt: "asc" },
    });

    const summary = {
      total: regs.length,
      registered: regs.filter((r) => r.status === "registered").length,
      attended: regs.filter((r) => r.status === "attended").length,
      cancelled: regs.filter((r) => r.status === "cancelled").length,
      consented: regs.filter((r) => r.consent).length,
    };

    return NextResponse.json({
      ok: true,
      registrations: regs.map(toRegistrationRow),
      summary,
      event: ev,
    });
  } catch (err) {
    console.error("[GET /api/admin/events/[id]/registrations]", err);
    return NextResponse.json({ ok: false, error: "Could not load registrations" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* PATCH /api/admin/events/[id]/registrations — §34 attendance.       */
/* Body: { registrationId, status: registered|attended|cancelled }    */
/* ------------------------------------------------------------------ */
const attendanceSchema = z.object({
  registrationId: z.string().trim().min(1),
  status: z.enum(["registered", "attended", "cancelled"]),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const guard = await authorizeAdmin(req, "manage_events");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }
    const { id } = await ctx.params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = attendanceSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid attendance update" },
        { status: 422 }
      );
    }
    const { registrationId, status } = parsed.data;

    const reg = await db.eventRegistration.findUnique({ where: { id: registrationId } });
    if (!reg || reg.eventId !== id) {
      return NextResponse.json({ ok: false, error: "Registration not found" }, { status: 404 });
    }

    // Re-registering after cancellation resets reminder dedup so the
    // reminders keep flowing for the reopened registration (§34).
    const updated = await db.eventRegistration.update({
      where: { id: registrationId },
      data: {
        status,
        ...(status === "registered" && reg.status === "cancelled" ? { reminderStates: {} } : {}),
      },
    });

    auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "event.registration.update",
      targetType: "EventRegistration",
      targetId: registrationId,
      meta: { eventId: id, status },
    }).catch(() => {});

    return NextResponse.json({ ok: true, registration: toRegistrationRow(updated) });
  } catch (err) {
    console.error("[PATCH /api/admin/events/[id]/registrations]", err);
    return NextResponse.json({ ok: false, error: "Could not update registration" }, { status: 500 });
  }
}
