import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

/**
 * GET /api/admin/email-log — admin notification history.
 * Query params:
 *   ?limit=<n>   → cap returned rows (default 100, max 500)
 *   ?type=<t>    → filter by type (post.published | broadcast | inquiry.created | subscriber.welcome)
 */
export async function GET(req: Request) {
  try {
    const guard = await authorizeAdmin(req, "view_dashboard");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    const url = new URL(req.url);
    const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 500)
        : 100;
    const type = url.searchParams.get("type");

    const where: { type?: string } = {};
    if (type) where.type = type;

    const [logs, total] = await Promise.all([
      db.emailLog.findMany({
        where,
        orderBy: { sentAt: "desc" },
        take: limit,
        select: {
          id: true,
          type: true,
          recipientEmail: true,
          subject: true,
          status: true,
          postId: true,
          subscriberId: true,
          sentAt: true,
        },
      }),
      db.emailLog.count({ where }),
    ]);

    return NextResponse.json({ ok: true, logs, total });
  } catch (err) {
    console.error("[GET /api/admin/email-log]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load email log" },
      { status: 500 }
    );
  }
}
