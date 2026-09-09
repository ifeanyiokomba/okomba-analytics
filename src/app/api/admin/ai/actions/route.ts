import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { jsonLoose } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/admin/ai/actions — §54/§55 AI action ledger.               */
/* ?status= &action= &limit= (≤200), newest first. Includes the        */
/* generated-content snapshot (draftJson), the delivery result        */
/* (resultJson), evaluated level, trigger, actor + error.             */
/* access_ai-gated.                                                   */
/* ------------------------------------------------------------------ */

const KNOWN_STATUSES = [
  "suggested",
  "pending_approval",
  "executing",
  "executed",
  "declined",
  "blocked",
  "failed",
];

export async function GET(req: Request) {
  const guard = await authorizeAdmin(req, "access_ai");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status")?.trim() ?? "";
    const action = url.searchParams.get("action")?.trim() ?? "";
    const limitRaw = Number(url.searchParams.get("limit") ?? "100");
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(Math.trunc(limitRaw), 1), 200)
      : 100;

    const rows = await db.aiActionLog.findMany({
      where: {
        ...(status && KNOWN_STATUSES.includes(status) ? { status } : {}),
        ...(action ? { action } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      ok: true,
      actions: rows.map((r) => ({
        id: r.id,
        action: r.action,
        trigger: r.trigger,
        level: r.level,
        status: r.status,
        customerEmail: r.customerEmail,
        inquiryId: r.inquiryId,
        draftJson: jsonLoose(r.draftJson ?? null) ?? null,
        resultJson: jsonLoose(r.resultJson ?? null) ?? null,
        model: r.model,
        error: r.error,
        actor: r.actor,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/ai/actions]", err);
    return NextResponse.json({ ok: false, error: "Could not load AI actions" }, { status: 500 });
  }
}
