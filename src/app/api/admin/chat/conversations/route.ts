import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import { listConversations } from "@/lib/ai-chat-monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/admin/chat/conversations — §58 AI conversation monitoring. */
/*                                                                     */
/* Query: ?status=ai|takeover_requested|human  ?q=<search by           */
/* sessionId / customerEmail / customerName>  ?limit (≤200, default    */
/* 100). Ordered lastMessageAt desc. Each row carries the message      */
/* count + a trimmed last-message preview so the monitor list can      */
/* render without the detail fetch. access_ai-gated (server-side).     */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  const guard = await authorizeAdmin(req, "access_ai");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const q = url.searchParams.get("q") ?? undefined;
    const limitParam = Number(url.searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined;

    const conversations = await listConversations({
      ...(status ? { status } : {}),
      ...(q ? { q } : {}),
      ...(limit ? { limit } : {}),
    });

    return NextResponse.json({ ok: true, conversations });
  } catch (err) {
    console.error("[GET /api/admin/chat/conversations]", err);
    return NextResponse.json({ ok: false, error: "Could not load conversations" }, { status: 500 });
  }
}
