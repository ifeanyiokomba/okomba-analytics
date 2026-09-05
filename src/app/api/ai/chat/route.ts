import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, runAiChatTurn, type ChatMessage } from "@/lib/ai-chat";
import { recordAnalyticsEvent, hasSessionEvent } from "@/lib/analytics-server";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/ai/chat — BATCH 11 §48–§51 + §58–§63 turn engine.         */
/*                                                                     */
/* Body (UNCHANGED from Module 7 — the widget is the only consumer):   */
/*   { sessionId, messages: [{role, content}, ...] }                    */
/*                                                                     */
/* BACKWARD-COMPAT PERSISTENCE RULE: the widget sends the FULL         */
/* history for LLM context, but the server already stored every        */
/* earlier user/assistant turn on the requests that produced them.     */
/* The engine therefore persists ONLY the LAST user message of the     */
/* payload (the new tail) — never re-inserts history it already has.   */
/*                                                                     */
/* Engine (src/lib/ai-chat.ts): §49 reasoning order (conversation →    */
/* customer context → configured knowledge → catalog → actions), §51   */
/* figure guard (only configured prices), §58 ChatConversation/        */
/* ChatMessage persistence, §60 escalation (model flag + keyword +     */
/* low-confidence) → requestHandover, §61 human-owned queue (the       */
/* engine returns humanOwned:true with reply "" — the visitor's        */
/* message is stored for the agent, no model call, no assistant row),  */
/* §60 holding text while a handover is pending. Rate-limited per IP.  */
/* Module 8C: records an `ai_chat_start` analytics event on the first  */
/* turn of a session (deduped by sessionId).                           */
/* ------------------------------------------------------------------ */

const schema = z.object({
  sessionId: z.string().min(6).max(64),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(40),
});

export async function POST(req: Request) {
  try {
    // Rate limit per IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { ok: false, error: "Too many messages — please slow down." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "sessionId and messages are required" },
        { status: 400 }
      );
    }

    // Module 8C: ai_chat_start — first user message of a session, deduped.
    if (parsed.data.messages.length === 1 && parsed.data.messages[0].role === "user") {
      const sid = parsed.data.sessionId;
      const already = await hasSessionEvent("ai_chat_start", sid);
      if (!already) {
        void recordAnalyticsEvent({
          type: "ai_chat_start",
          sessionId: sid,
          meta: { ip, firstMessageLen: parsed.data.messages[0].content.length },
        });
      }
    }

    const result = await runAiChatTurn({
      sessionId: parsed.data.sessionId,
      messages: parsed.data.messages as ChatMessage[],
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[POST /api/ai/chat]", err);
    return NextResponse.json(
      { ok: false, error: "Chat is unavailable right now — please try again." },
      { status: 500 }
    );
  }
}
