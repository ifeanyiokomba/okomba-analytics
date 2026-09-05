import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { acceptHandover, declineHandover, appendMessage, contactAlternativesText, aiAudit, getConversationDetail } from "@/lib/ai-chat-monitor";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/admin/chat/conversations/[id]/action — §59/§61 handover.  */
/*                                                                     */
/* Body: { action: "accept" | "decline" | "takeover" | "reply",        */
/*         content?: string }                                           */
/*                                                                     */
/*   accept   → §61 Accept: conversation becomes human-owned; the AI   */
/*              engine stops answering this session (its status check) */
/*              and the §59 exact notice is posted.                     */
/*   takeover → alias of accept (§59 "Take over conversation").         */
/*   decline  → §61 Decline: AI continues + the visitor gets the       */
/*              configured contact alternatives.                        */
/*   reply    → agent message (1–2000 chars, role "agent", authorLabel */
/*              = agent display name). Auto-accepts first when the     */
/*              conversation isn't human-owned yet (an agent answering */
/*              IS taking it over).                                      */
/*                                                                     */
/* All paths return the updated conversation + fresh messages.         */
/* access_ai-gated; every action is §63-audited.                        */
/* ------------------------------------------------------------------ */

const actionSchema = z.object({
  action: z.enum(["accept", "decline", "takeover", "reply"]),
  content: z
    .string()
    .trim()
    .min(1, "Reply content is required for the reply action")
    .max(2000, "Reply must be 2000 characters or fewer")
    .optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "access_ai");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    const { id } = await ctx.params;
    const conversation = await db.chatConversation.findUnique({ where: { id } });
    if (!conversation) {
      return NextResponse.json({ ok: false, error: "Conversation not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid action" },
        { status: 422 }
      );
    }
    const { action, content } = parsed.data;
    const admin: { email: string; name: string | null } = {
      email: guard.auth.email,
      name: guard.auth.name ?? guard.auth.email,
    };

    if (action === "accept" || action === "takeover") {
      // §59 "Take over conversation" — AI stops (engine's human check),
      // §59 exact notice, agent identity stamped on the conversation.
      await acceptHandover(conversation, admin);
    } else if (action === "decline") {
      // §61 — AI continues + faster contact alternatives.
      const alternatives = await contactAlternativesText();
      await declineHandover(conversation, admin, alternatives);
    } else {
      // reply — requires content (validated above).
      if (!content) {
        return NextResponse.json({ ok: false, error: "Reply content is required" }, { status: 422 });
      }
      // An agent answering IS taking the conversation over (§59).
      if (conversation.status !== "human") {
        await acceptHandover(conversation, admin);
      }
      await appendMessage(conversation.id, {
        role: "agent",
        content,
        authorLabel: admin.name,
      });
      await aiAudit("ai.chat.agent_reply", {
        actor: admin.email,
        conversationId: conversation.id,
        meta: { length: content.length },
      });
    }

    const detail = await getConversationDetail(conversation.id);
    return NextResponse.json({ ok: true, ...detail });
  } catch (err) {
    console.error("[POST /api/admin/chat/conversations/[id]/action]", err);
    return NextResponse.json({ ok: false, error: "Could not apply action" }, { status: 500 });
  }
}
