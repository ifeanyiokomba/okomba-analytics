import { NextResponse } from "next/server";
import { getConversationForPublic } from "@/lib/ai-chat-monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/chat/session — §58/§59/§61 PUBLIC widget poll.             */
/*                                                                     */
/* Query: ?sessionId=<widget session>  (&after=<ISO> — only messages   */
/* created after this instant). The widget calls this after every AI   */
/* turn and while a handover is pending, so it can render: agent/      */
/* system messages (takeover notice, decline alternatives), the        */
/* current status (ai | takeover_requested | human), the assigned      */
/* agentName (§59 "AI Assistant → Human Agent" header switch) and      */
/* adminOnline (§62 — never promise a human when nobody is there).     */
/* Unknown sessions answer the idle default (404-safe).                */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId || sessionId.length < 6 || sessionId.length > 64) {
      return NextResponse.json({ ok: false, error: "sessionId is required" }, { status: 400 });
    }
    const after = url.searchParams.get("after");
    const session = await getConversationForPublic(sessionId, after);
    return NextResponse.json(session);
  } catch (err) {
    console.error("[GET /api/chat/session]", err);
    return NextResponse.json(
      { ok: true, status: "ai", agentName: null, adminOnline: false, newMessages: [] },
      { status: 200 } // degrade gracefully — the widget retries on the next turn
    );
  }
}
