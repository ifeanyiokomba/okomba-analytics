import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";

/**
 * GET /api/subscribers — admin-guarded newsletter subscriber list.
 * Returns newest first with a total count.
 */
export async function GET() {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const [subscribers, total] = await Promise.all([
      db.subscriber.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, email: true, createdAt: true },
      }),
      db.subscriber.count(),
    ]);

    return NextResponse.json({ ok: true, subscribers, total });
  } catch (err) {
    console.error("[GET /api/subscribers]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load subscribers" },
      { status: 500 }
    );
  }
}
