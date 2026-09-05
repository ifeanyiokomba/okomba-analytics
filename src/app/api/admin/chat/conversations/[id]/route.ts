import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import { getConversationDetail } from "@/lib/ai-chat-monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/admin/chat/conversations/[id] — §58 full transcript.       */
/* Conversation header (status, sentiment/urgency, escalation reason,  */
/* assigned agent) + ALL messages ordered asc (visitor, Okomba AI,     */
/* agent, system notices). access_ai-gated.                            */
/* ------------------------------------------------------------------ */

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "access_ai");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    const { id } = await ctx.params;
    const detail = await getConversationDetail(id);
    if (!detail) {
      return NextResponse.json({ ok: false, error: "Conversation not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...detail });
  } catch (err) {
    console.error("[GET /api/admin/chat/conversations/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not load conversation" }, { status: 500 });
  }
}
