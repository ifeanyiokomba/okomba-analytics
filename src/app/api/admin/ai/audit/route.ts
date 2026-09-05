import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/admin/ai/audit?conversationId=… — §63 AI action trail.      */
/* Last 200 AiAuditLog rows, newest first; optional conversationId     */
/* filter. access_ai-gated.                                            */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  const guard = await authorizeAdmin(req, "access_ai");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    const url = new URL(req.url);
    const conversationId = url.searchParams.get("conversationId");

    const entries = await db.aiAuditLog.findMany({
      where: conversationId ? { conversationId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({
      ok: true,
      entries: entries.map((e) => ({
        id: e.id,
        action: e.action,
        actor: e.actor,
        conversationId: e.conversationId,
        targetId: e.targetId,
        meta: e.meta,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/ai/audit]", err);
    return NextResponse.json({ ok: false, error: "Could not load AI audit log" }, { status: 500 });
  }
}
