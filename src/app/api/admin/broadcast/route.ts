import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { notifyBroadcast } from "@/lib/notify";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */
const broadcastSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(180, "Subject is too long"),
  body: z
    .string()
    .trim()
    .min(10, "Body must be at least 10 characters")
    .max(10000, "Body is too long"),
  /* Optional audience filter — defaults to all confirmed subscribers */
  audience: z.enum(["confirmed", "all"]).optional(),
});

/**
 * POST /api/admin/broadcast — send a free-form email to all (confirmed)
 * subscribers. Records each send in EmailLog. Returns the count sent.
 */
export async function POST(req: Request) {
  try {
    const guard = await authorizeAdmin(req, "broadcast_subscribers");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Request body must be valid JSON" },
        { status: 400 }
      );
    }

    const parsed = broadcastSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid broadcast" },
        { status: 400 }
      );
    }

    const { subject, body: text, audience } = parsed.data;
    const where = audience === "all" ? undefined : { status: "confirmed" as const };

    const subscribers = await db.subscriber.findMany({
      where,
      select: { id: true, email: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No subscribers in the selected audience to send to.",
        },
        { status: 400 }
      );
    }

    // Send + log (sequentially in the same process for now)
    const sent = await notifyBroadcast(
      subject,
      text,
      subscribers.map((s) => ({ email: s.email, id: s.id }))
    );

    return NextResponse.json({ ok: true, sent, total: subscribers.length });
  } catch (err) {
    console.error("[POST /api/admin/broadcast]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to send broadcast" },
      { status: 500 }
    );
  }
}
