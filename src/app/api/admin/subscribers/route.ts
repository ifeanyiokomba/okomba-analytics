import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/admin/subscribers — already implemented at /api/subscribers */
/* (kept there for backward compatibility). This route handles the    */
/* mutation endpoints (PATCH + DELETE).                                */
/* ------------------------------------------------------------------ */

const patchSchema = z.object({
  id: z.string().trim().min(1, "Subscriber id is required"),
  status: z.enum(["pending", "confirmed", "unsubscribed"], {
    error: "Status must be one of: pending, confirmed, unsubscribed",
  }),
});

/**
 * PATCH /api/admin/subscribers — admin manually change a subscriber's status.
 * Useful for confirming a pending subscriber who can't find the email, or
 * unsubscribing a request received via support.
 */
export async function PATCH(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false }, { status: 401 });
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

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { id, status } = parsed.data;

    const updated = await db.subscriber.update({
      where: { id },
      data: {
        status,
        ...(status === "confirmed" ? { confirmedAt: new Date() } : {}),
      },
      select: {
        id: true,
        email: true,
        status: true,
        confirmedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, subscriber: updated });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "Subscriber not found" },
        { status: 404 }
      );
    }
    console.error("[PATCH /api/admin/subscribers]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update subscriber" },
      { status: 500 }
    );
  }
}
