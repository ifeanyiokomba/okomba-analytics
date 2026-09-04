import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/admin/audit?limit=100&offset=0 — §44 audit log feed
   (manage_admins). Newest first. */

export async function GET(req: Request) {
  const guard = await authorizeAdmin(req, "manage_admins");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 100) || 100, 1), 500);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0) || 0, 0);
    const [entries, total] = await Promise.all([
      db.adminAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.adminAuditLog.count(),
    ]);
    return NextResponse.json({ ok: true, entries, total });
  } catch (err) {
    console.error("[GET /api/admin/audit]", err);
    return NextResponse.json({ ok: false, error: "Could not load audit log" }, { status: 500 });
  }
}
