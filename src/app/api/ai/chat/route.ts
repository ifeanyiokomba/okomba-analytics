import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, runAiChatTurn, type ChatMessage } from "@/lib/ai-chat";
import { recordAnalyticsEvent, hasSessionEvent } from "@/lib/analytics-server";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/ai/chat                                                   */
/*                                                                     */
/* AI Service Finder (Module 7). Body: { sessionId, messages:[...] }.  */
/* Before calling z-ai the engine re-reads the live Services +         */
/* Portfolio catalog so the AI only ever recommends what the site      */
/* sells. Email capture → received_emails + inquiry + draft            */
/* proposal (background). Rate-limited per IP.                          */
/* Module 8C: records an `ai_chat_start` analytics event on the first  */
/* turn of a session (deduped by sessionId).                            */
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

