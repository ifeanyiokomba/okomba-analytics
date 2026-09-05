import { db } from "@/lib/db";
import type { ChatConversation, ChatMessage } from "@/generated/prisma";
import { getAiKnowledgeDto, type ContactConfig } from "@/lib/ai-knowledge";
import { notifyAiHandoffRequested } from "@/lib/notify";

/* ─────────────────────────────────────────────────────────────
   BATCH 11 (§58–§63) — SERVER-ONLY AI conversation monitor +
   human-handover lifecycle.

   Conversation state machine (one ChatConversation per widget
   sessionId):

     ai ──escalate──▶ takeover_requested ──accept──▶ human
                       (AI holds: honest §60     (AI silent: visitor
                        notice, model not called)  messages queue)
                          │
                          └──decline──▶ ai  (+ §61 contact
                                             alternatives notice)

   Every state change appends an honest System ChatMessage and an
   AiAuditLog row (§63) — the visitor is NEVER told a human took
   over before one actually did (§60 "keep customer informed
   without pretending").
   ───────────────────────────────────────────────────────────── */

export type ConversationStatus = "ai" | "takeover_requested" | "human";

const ONLINE_WINDOW_MS = 90 * 1000; // heartbeat freshness (§62)
const DECLINE_ALTERNATIVES_WINDOW_MS = 10 * 60 * 1000;

export const HOLDING_TEXT =
  "Our team has been notified and will take over this chat shortly. — Okomba AI";

/* §60 — honest notification while the request is pending (the §59
   exact text "A member of our team is taking over this conversation."
   is only used at ACCEPT time). */
const HANDOFF_REQUESTED_NOTICE = "A member of our team has been flagged to take over this conversation.";

/* §59 — EXACT spec text, emitted when an admin accepts. */
export const TAKEOVER_NOTICE = "A member of our team is taking over this conversation.";

/* §61 — decline notice; alternativesText from configured channels. */
const DECLINE_PREFIX = "Our team isn't available to take this chat right now.";

/* ── Conversation CRUD ──────────────────────────────────── */

export async function getOrCreateConversation(sessionId: string): Promise<ChatConversation> {
  const existing = await db.chatConversation.findUnique({ where: { sessionId } });
  if (existing) return existing;
  // Unique sessionId — tolerate a concurrent create racing us.
  try {
    return await db.chatConversation.create({ data: { sessionId } });
  } catch {
    const raced = await db.chatConversation.findUnique({ where: { sessionId } });
    if (raced) return raced;
    throw new Error("Could not create conversation");
  }
}

export async function appendMessage(
  conversationId: string,
  input: { role: "user" | "assistant" | "agent" | "system"; content: string; authorLabel?: string | null }
): Promise<ChatMessage> {
  const message = await db.chatMessage.create({
    data: {
      conversationId,
      role: input.role,
      content: input.content,
      authorLabel: input.authorLabel ?? null,
    },
  });
  await db.chatConversation
    .update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } })
    .catch((err) => console.error("[ai-monitor] lastMessageAt update failed:", err));
  return message;
}

/* ── §63 AI audit trail (never throws) ──────────────────── */

export async function aiAudit(
  action: string,
  opts?: { actor?: string | null; conversationId?: string | null; targetId?: string | null; meta?: Record<string, unknown> }
): Promise<void> {
  try {
    await db.aiAuditLog.create({
      data: {
        action,
        actor: opts?.actor ?? "system",
        conversationId: opts?.conversationId ?? null,
        targetId: opts?.targetId ?? null,
        meta: (opts?.meta ?? {}) as never,
      },
    });
  } catch (err) {
    // The audit trail must never break the action it observes.
    console.error(`[aiAudit] ${action} failed:`, err);
  }
}

/* ── §62 presence ───────────────────────────────────────── */

/** True when any admin session heartbeated "online" within 90s. */
export async function anyAdminOnline(): Promise<boolean> {
  try {
    const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS);
    const count = await db.adminSession.count({
      where: { presenceStatus: "online", presenceSeenAt: { gt: cutoff } },
    });
    return count > 0;
  } catch (err) {
    console.error("[ai-monitor] anyAdminOnline failed:", err);
    return false;
  }
}

/* ── §61 contact alternatives ───────────────────────────── */

/** §61 "faster alternative" sentence built from the CONFIGURED
 *  contact channels (AiKnowledge.contactJson) — only channels that
 *  exist are offered. */
export async function contactAlternativesText(): Promise<string> {
  const dto = await getAiKnowledgeDto().catch(() => null);
  const c: ContactConfig | null = dto?.contact ?? null;
  const parts: string[] = [];
  if (c?.whatsapp) parts.push(`on WhatsApp at ${c.whatsapp}`);
  if (c?.phone) parts.push(c.whatsapp ? `call ${c.phone}` : `call ${c.phone}`);
  if (c?.email) parts.push(`email ${c.email}`);
  const lead = parts.length ? `You can reach us ${parts.join(", ")}.` : "";
  const tail = c?.callbackEnabled !== false ? " You can also leave a callback request." : "";
  return `${lead}${tail}`.trim() || "You can also reach us through the contact form on the site.";
}

/* ── Handover lifecycle ─────────────────────────────────── */

/**
 * §60 — flag the conversation for a human. Idempotent: once
 * requested (or already human-owned) a repeat call is a no-op.
 * Appends the honest pending notice + audit row; emails the admin
 * alert ONLY when somebody is actually online (§62 — never promise
 * an immediate response when nobody is available).
 */
export async function requestHandover(
  conversation: ChatConversation,
  reason: string,
  meta?: Record<string, unknown>
): Promise<ChatConversation> {
  if (conversation.status === "takeover_requested" || conversation.status === "human") {
    return conversation; // already requested / owned
  }

  const updated = await db.chatConversation.update({
    where: { id: conversation.id },
    data: {
      status: "takeover_requested",
      escalationReason: reason,
      escalationNotifiedAt: new Date(),
    },
  });

  await appendMessage(conversation.id, {
    role: "system",
    content: HANDOFF_REQUESTED_NOTICE,
    authorLabel: "System",
  });

  await aiAudit("ai.handoff.requested", {
    conversationId: conversation.id,
    meta: { reason, sessionId: conversation.sessionId, ...(meta ?? {}) },
  });

  // §60: notify only if an admin is online; fire-and-forget, never blocks.
  if (await anyAdminOnline()) {
    const [lastVisitor, adminOnline] = await Promise.all([
      db.chatMessage.findFirst({
        where: { conversationId: conversation.id, role: "user" },
        orderBy: { createdAt: "desc" },
        select: { content: true },
      }),
      Promise.resolve(true),
    ]);
    void notifyAiHandoffRequested({
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
      sessionId: updated.sessionId,
      conversationId: updated.id,
      reason,
      lastMessage: lastVisitor?.content ?? "",
    }).catch((err) => console.error("[ai-monitor] handover email failed:", err));
  }

  return updated;
}

/** §59/§61 Accept — AI stops; conversation becomes human-owned. */
export async function acceptHandover(
  conversation: ChatConversation,
  admin: { email: string; name: string | null }
): Promise<ChatConversation> {
  const updated = await db.chatConversation.update({
    where: { id: conversation.id },
    data: {
      status: "human",
      agentEmail: admin.email,
      agentName: admin.name ?? admin.email,
    },
  });

  await appendMessage(conversation.id, {
    role: "system",
    content: TAKEOVER_NOTICE, // §59 EXACT text
    authorLabel: "System",
  });

  await aiAudit("ai.handoff.accepted", {
    actor: admin.email,
    conversationId: conversation.id,
    meta: { agentName: updated.agentName },
  });

  return updated;
}

/** §61 Decline — AI continues + faster contact alternatives. */
export async function declineHandover(
  conversation: ChatConversation,
  admin: { email: string; name: string | null },
  alternativesText: string
): Promise<ChatConversation> {
  const updated = await db.chatConversation.update({
    where: { id: conversation.id },
    data: { status: "ai", agentEmail: null, agentName: null },
  });

  await appendMessage(conversation.id, {
    role: "system",
    content: `${DECLINE_PREFIX} ${alternativesText}`.trim(),
    authorLabel: "System",
  });

  await aiAudit("ai.handoff.declined", {
    actor: admin.email,
    conversationId: conversation.id,
    meta: { alternatives: alternativesText },
  });

  return updated;
}

/* ── Public widget projection (GET /api/chat/session) ───── */

export type PublicChatSession = {
  ok: true;
  status: ConversationStatus;
  agentName: string | null;
  adminOnline: boolean;
  newMessages: { id: string; role: string; content: string; authorLabel: string | null; createdAt: string }[];
  alternatives?: string;
};

/**
 * The widget polls this after every AI turn (and while a handover
 * is pending). `after` (ISO) lets it fetch only messages it hasn't
 * rendered. Unknown sessions answer the idle default — 404-safe.
 * `alternatives` (§61) surfaces while the recent decline notice is
 * still the freshest system message.
 */
export async function getConversationForPublic(sessionId: string, afterISO?: string | null): Promise<PublicChatSession> {
  const conversation = await db.chatConversation.findUnique({ where: { sessionId } });
  if (!conversation) {
    return { ok: true, status: "ai", agentName: null, adminOnline: false, newMessages: [] };
  }

  const after = afterISO && !Number.isNaN(Date.parse(afterISO)) ? new Date(afterISO) : null;
  const where = {
    conversationId: conversation.id,
    role: { in: ["agent", "system", "assistant"] as string[] },
    ...(after ? { createdAt: { gt: after } } : {}),
  };
  const messages = await db.chatMessage.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  let alternatives: string | undefined;
  if (conversation.status === "ai") {
    const lastSystem = await db.chatMessage.findFirst({
      where: { conversationId: conversation.id, role: "system" },
      orderBy: { createdAt: "desc" },
    });
    if (
      lastSystem &&
      lastSystem.content.startsWith(DECLINE_PREFIX) &&
      Date.now() - lastSystem.createdAt.getTime() < DECLINE_ALTERNATIVES_WINDOW_MS
    ) {
      alternatives = await contactAlternativesText();
    }
  }

  return {
    ok: true,
    status: conversation.status as ConversationStatus,
    agentName: conversation.agentName,
    adminOnline: await anyAdminOnline(),
    newMessages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      authorLabel: m.authorLabel,
      createdAt: m.createdAt.toISOString(),
    })),
    ...(alternatives ? { alternatives } : {}),
  };
}

/* ── Admin projections (§58 monitoring) ─────────────────── */

export type AdminConversationListItem = {
  id: string;
  sessionId: string;
  customerName: string | null;
  customerEmail: string | null;
  status: string;
  sentiment: string | null;
  urgency: string | null;
  escalationReason: string | null;
  agentEmail: string | null;
  agentName: string | null;
  lastMessageAt: string;
  createdAt: string;
  messageCount: number;
  lastMessagePreview: string;
};

export async function listConversations(filter?: {
  status?: string;
  q?: string;
  limit?: number;
}): Promise<AdminConversationListItem[]> {
  const q = filter?.q?.trim().toLowerCase();
  const rows = await db.chatConversation.findMany({
    where: {
      ...(filter?.status && ["ai", "takeover_requested", "human"].includes(filter.status)
        ? { status: filter.status }
        : {}),
      ...(q
        ? {
            OR: [
              { sessionId: { contains: q } },
              { customerEmail: { contains: q } },
              { customerName: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { lastMessageAt: "desc" },
    take: Math.min(Math.max(filter?.limit ?? 100, 1), 200),
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true } },
      _count: { select: { messages: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    sessionId: r.sessionId,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    status: r.status,
    sentiment: r.sentiment,
    urgency: r.urgency,
    escalationReason: r.escalationReason,
    agentEmail: r.agentEmail,
    agentName: r.agentName,
    lastMessageAt: r.lastMessageAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
    messageCount: r._count.messages,
    lastMessagePreview: (r.messages[0]?.content ?? "").slice(0, 80),
  }));
}

export async function getConversationDetail(id: string) {
  const conversation = await db.chatConversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return null;
  return {
    conversation: {
      id: conversation.id,
      sessionId: conversation.sessionId,
      customerName: conversation.customerName,
      customerEmail: conversation.customerEmail,
      status: conversation.status,
      agentEmail: conversation.agentEmail,
      agentName: conversation.agentName,
      sentiment: conversation.sentiment,
      urgency: conversation.urgency,
      escalationReason: conversation.escalationReason,
      escalationNotifiedAt: conversation.escalationNotifiedAt?.toISOString() ?? null,
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      createdAt: conversation.createdAt.toISOString(),
      messageCount: conversation.messages.length,
    },
    messages: conversation.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      authorLabel: m.authorLabel,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}
