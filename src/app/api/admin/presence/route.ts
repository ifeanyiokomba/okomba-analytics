import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeAdmin, getAdminSessionToken, hashSessionToken } from "@/lib/admin-auth";
import { anyAdminOnline } from "@/lib/ai-chat-monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* /api/admin/presence — §62 real-time admin availability.             */
/*                                                                     */
/* POST { status: "online" | "away" } — heartbeat from the admin       */
/* dashboard (Task 47-B wires the interval). Writes the CURRENT        */
/* session's presenceStatus + presenceSeenAt = now.                     */
/*                                                                     */
/* GET — { mine: {status, seenAt}, anyOnline } for the header          */
/* indicator.                                                           */
/*                                                                     */
/* Both handlers lazily flip STALE sessions offline first              */
/* (presenceSeenAt older than 90s) so presence never lies. Any valid   */
/* admin session may use this route (view_dashboard — the §45          */
/* observability baseline).                                             */
/* ------------------------------------------------------------------ */

const presenceSchema = z.object({
  status: z.enum(["online", "away"]),
});

const STALE_MS = 90 * 1000;

async function markStaleSessionsOffline(): Promise<void> {
  try {
    await db.adminSession.updateMany({
      where: {
        presenceStatus: { not: "offline" },
        presenceSeenAt: { lt: new Date(Date.now() - STALE_MS) },
      },
      data: { presenceStatus: "offline" },
    });
  } catch (err) {
    console.error("[presence] stale flip failed:", err);
  }
}

/** Resolve the AdminSession row the caller's cookie points at. */
async function currentSession(req: Request) {
  const token = await getAdminSessionToken(req);
  if (!token) return null;
  return db.adminSession.findUnique({ where: { token: hashSessionToken(token) } });
}

export async function POST(req: Request) {
  const guard = await authorizeAdmin(req, "view_dashboard");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }
    const parsed = presenceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "status must be \"online\" or \"away\"" },
        { status: 422 }
      );
    }

    await markStaleSessionsOffline();

    const session = await currentSession(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Session not found" }, { status: 401 });
    }

    const updated = await db.adminSession.update({
      where: { id: session.id },
      data: { presenceStatus: parsed.data.status, presenceSeenAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      mine: {
        status: updated.presenceStatus,
        seenAt: updated.presenceSeenAt?.toISOString() ?? null,
      },
      anyOnline: await anyAdminOnline(),
    });
  } catch (err) {
    console.error("[POST /api/admin/presence]", err);
    return NextResponse.json({ ok: false, error: "Could not update presence" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const guard = await authorizeAdmin(req, "view_dashboard");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    await markStaleSessionsOffline();

    const session = await currentSession(req);
    const mine = session
      ? {
          status: session.presenceStatus,
          seenAt: session.presenceSeenAt?.toISOString() ?? null,
        }
      : { status: "offline", seenAt: null };

    return NextResponse.json({ ok: true, mine, anyOnline: await anyAdminOnline() });
  } catch (err) {
    console.error("[GET /api/admin/presence]", err);
    return NextResponse.json({ ok: false, error: "Could not read presence" }, { status: 500 });
  }
}
