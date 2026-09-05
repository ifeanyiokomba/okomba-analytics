import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedEventsIfEmpty, runEventLifecycle } from "@/lib/events";
import type { PublicEvent } from "@/lib/events-shared";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/events — §34 public upcoming events + webinars.           */
/*                                                                     */
/* Runs the lazy seed + lifecycle first (both non-blocking), then     */
/* returns upcoming PUBLIC scheduled events (startAt >= now − 24h)    */
/* ordered by startAt. The projection is SANITIZED: meetingUrl is     */
/* never exposed — only hasMeetingUrl (the join link ships with the  */
/* registration confirmation + reminders by email).                   */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    try {
      await seedEventsIfEmpty();
    } catch (err) {
      console.error("[GET /api/events] seed failed:", err);
    }
    try {
      await runEventLifecycle();
    } catch (err) {
      console.error("[GET /api/events] lifecycle failed:", err);
    }

    const rows = await db.calendarEvent.findMany({
      where: {
        isPublic: true,
        status: "scheduled",
        startAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { startAt: "asc" },
      take: 20,
      include: { registrations: { select: { status: true } } },
    });

    const events: PublicEvent[] = rows.map((r) => {
      const registrationCount = r.registrations.filter((g) => g.status === "registered").length;
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        type: r.type,
        startAt: r.startAt.toISOString(),
        endAt: r.endAt ? r.endAt.toISOString() : null,
        allDay: r.allDay,
        location: r.location,
        hasMeetingUrl: Boolean(r.meetingUrl),
        capacity: r.capacity,
        registrationCount,
        spotsLeft: r.capacity === null ? null : Math.max(0, r.capacity - registrationCount),
      };
    });

    return NextResponse.json({ ok: true, events });
  } catch (err) {
    console.error("[GET /api/events]", err);
    return NextResponse.json({ ok: false, error: "Failed to load events" }, { status: 500 });
  }
}
