/**
 * AI Service Finder engine (Phase-2 Module 7 → BATCH 11 §48–§51/§58–§63).
 *
 * Runs server-side via z-ai-web-dev-sdk (same architecture decision
 * as proposals/reminders: AI lives HERE).
 *
 * Original spec (user):
 *   System Prompt: "You are Okomba AI. ONLY recommend services from
 *   this DB: {services}. RULES: 1. Qualify in max 3 messages.
 *   2. Then ask: 'Can I get your email to send a custom proposal?'
 *   3. Be expert, Nigerian context, use Ink+Honey tone"
 *   After email collected: save to received_emails with
 *   source:"ai_chat", leadScore 1-10, and auto-create a draft
 *   proposal that appears in the admin Proposals tab.
 *
 * Catalog source: the service + portfolio library in content.ts —
 * the single source of truth that renders the public Services and
 * Case Studies sections. The endpoint re-reads it on every request,
 * so the AI always recommends exactly what the site sells.
 *
 * ── BATCH 11 (§48–51 + §58–63) ────────────────────────────────────
 * The engine is upgraded to a monitored, knowledge-grounded chat:
 *   • §49 reasoning order: conversation → customer context →
 *     configured knowledge (ai-knowledge.ts) → catalog → actions.
 *   • §51 pricing: the model may quote ONLY figures configured in
 *     AiKnowledge.services/policies; a deterministic figure guard
 *     rewrites anything else to "custom (in your proposal)". (The
 *     old blanket price-scrub is retired now that pricing is a
 *     controlled layer.)
 *   • §58 persistence: every turn is stored (ChatConversation +
 *     ChatMessage) — the widget sends full history for context, the
 *     server persists only the NEW user tail.
 *   • §60 escalation: LLM flag + deterministic keyword trigger +
 *     low-confidence trigger → requestHandover (honest notice,
 *     AiAuditLog trail, email only when an admin is online §62).
 *     Statuses: ai → takeover_requested (AI holds with a fixed
 *     honest text) → human (AI silent, messages queue for the
 *     agent). §61 decline returns to "ai" with alternatives.
 *   • §63: ai.proposal.created audited when the draft is created.
 *
 * Kept intact: lead-capture funnel (received_emails + inquiry +
 * draft proposal), per-IP rate limiting, keyword fallback on model
 * outage.
 */

import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import type { InputJsonValue } from "@prisma/client/runtime/library";
import { SERVICES, PROJECTS } from "@/lib/content";
import { generateProposalDraft } from "@/lib/proposal";
import { buildKnowledgeContext, allowedPriceFigures } from "@/lib/ai-knowledge";
import {
  getOrCreateConversation,
  appendMessage,
  requestHandover,
  aiAudit,
  HOLDING_TEXT,
} from "@/lib/ai-chat-monitor";

/* ── Types ─────────────────────────────────────────────────── */

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type AiChatStage = "qualifying" | "awaiting_email" | "captured";

export type AiChatResult = {
  reply: string;
  stage: AiChatStage;
  recommendedServices: string[]; // service TITLES (real, from catalog)
  leadScore: number | null; // 1-10 once assessable
  leadCaptured: boolean;
  email?: string | null;
  draftProposal?: "generating" | "created" | "failed";
  usedFallback: boolean;
  /* ── Batch 11 additions (additive — the widget keys off these) ── */
  humanOwned?: boolean; // true → reply is "" and the message queued for the human agent
  escalate?: boolean; // this turn triggered a §60 handover request
  status?: string; // conversation status after the turn (ai | takeover_requested | human)
  agentName?: string | null; // assigned human agent display name
  conversationId?: string;
};

/* ── Guards ────────────────────────────────────────────────── */

const MAX_MESSAGES = 24; // history cap sent to the model
const MAX_MESSAGE_CHARS = 2000;

/* ── §60 deterministic escalation triggers ─────────────────── */

const ESCALATION_KEYWORD_RE =
  /human|agent|real person|speak to someone|talk to someone|manager|complaint|refund|dispute|chargeback|lawyer|legal|scam|fraud/i;

/* ── §51 figure guard ──────────────────────────────────────── */

/* Capture ₦/NGN figures: "₦350,000", "NGN 25,000", "₦1,200,000.50". */
const FIGURE_RE = /₦\s?([\d,]+(?:\.\d+)?)|NGN\s?([\d,]+(?:\.\d+)?)/gi;

/**
 * Rewrite any ₦/NGN figure that is NOT in the configured set to
 * "custom (in your proposal)" (§51: AI must not invent pricing).
 * Whole-match replacement keeps the sentence readable. Simple and
 * safe by design — callers wrap in try/catch.
 */
function guardFigures(text: string, allowed: Set<number>): string {
  if (allowed.size === 0 && !/₦|NGN/i.test(text)) return text;
  return text.replace(FIGURE_RE, (match) => {
    const digits = match
      .replace(/^[₦]\s?/i, "")
      .replace(/^NGN\s?/i, "")
      .replace(/,/g, "");
    const n = Number(digits);
    if (Number.isFinite(n) && allowed.has(n)) return match;
    return "custom (in your proposal)";
  });
}

/** Chat-UI cleanup: strip markdown bold/italic, collapse whitespace. */
function cleanReplyText(text: string): string {
  return text
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/* ── Email + name extraction (server-side, authoritative) ───── */

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

export function extractEmail(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const match = m.content.match(EMAIL_RE);
    if (match) return match[0].toLowerCase();
  }
  return null;
}

function extractName(messages: ChatMessage[]): string | null {
  for (const m of messages) {
    if (m.role !== "user") continue;
    const patterns = [
      /(?:my name is|this is|i am|i'm)\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){0,2})/,
      /(?:i'm|im)\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){0,2})/,
    ];
    for (const p of patterns) {
      const match = m.content.match(p);
      if (match?.[1] && match[1].length > 1 && !/^(interested|looking|here|writing|reach)$/i.test(match[1])) {
        return match[1].trim();
      }
    }
  }
  return null;
}

/* ── §49 step 2: customer context (HIGH-LEVEL ONLY) ────────── */

async function buildCustomerContext(email: string | null, name: string | null): Promise<string> {
  const lines: string[] = [];
  if (name) lines.push(`- Visitor name (from chat): ${name}`);
  if (email) lines.push(`- Visitor email (from chat): ${email}`);
  if (email) {
    const customer = await db.customer
      .findFirst({
        where: { email },
        select: { id: true, createdAt: true, countryCode: true, status: true },
      })
      .catch(() => null);
    if (customer) {
      lines.push(`- Known customer since ${customer.createdAt.getFullYear()}`);
      if (customer.countryCode) lines.push(`- Country: ${customer.countryCode}`);
      lines.push(`- CRM status: ${customer.status}`);
      try {
        const counts = await db.invoice.groupBy({
          by: ["status"],
          where: { customerId: customer.id },
          _count: { id: true },
        });
        const open = counts.filter((c) => ["sent", "pending", "overdue"].includes(c.status));
        if (open.length) {
          lines.push(`- Open invoices (counts only): ${open.map((c) => `${c._count.id} ${c.status}`).join(", ")}`);
        }
      } catch {
        /* counts are best-effort context */
      }
    }
  }
  if (!lines.length) return "";
  return [
    `CUSTOMER CONTEXT (high-level only — NEVER quote invoice amounts; payment disputes → set escalate=true):`,
    ...lines,
  ].join("\n");
}

/* ── Catalog context (fetched fresh on every request) ───────── */

function buildCatalogContext(): string {
  const services = SERVICES.map(
    (s) =>
      `- id:${s.id} | ${s.title} — ${s.desc} | Sub-services: ${s.subs.slice(0, 5).join("; ")} | Ideal for: ${s.idealFor.join(", ")}`
  ).join("\n");
  const portfolio = PROJECTS.map(
    (p) => `- ${p.name} (${p.category}): ${p.tagline}. ${p.overview.slice(0, 140)}`
  ).join("\n");
  return `SERVICES CATALOG:\n${services}\n\nPORTFOLIO (delivered work):\n${portfolio}`;
}

/* ── System prompt (§49 reasoning order, spec-fixed rules) ──── */

function buildSystemPrompt(userTurns: number, customerContext: string, knowledgeContext: string): string {
  const sections: string[] = [
    `You are Okomba AI — the service finder for Okomba Analytics, a Nigerian digital products, systems & analytics studio.`,
    ``,
    `REASONING ORDER (§49) — before answering, reason from these sources IN THIS ORDER:`,
    `1. The current conversation (the message history you are replying to).`,
    `2. Customer context (below, when known).`,
    `3. Configured company knowledge (below — the controlled business knowledge layer).`,
    `4. Products/services (the SERVICES CATALOG below — what the site actually sells).`,
    `5. Pricing/settings and policies (in the knowledge block below).`,
    `6. Relevant database information (the customer context below).`,
    `7. Available actions (listed at the end of the knowledge block).`,
    ``,
    customerContext,
    ``,
    `=== CONFIGURED BUSINESS KNOWLEDGE ===`,
    knowledgeContext || "(no additional knowledge configured yet — rely on the catalog and the rules below)",
    ``,
    `=== SERVICES CATALOG (what you may recommend) ===`,
    buildCatalogContext(),
    ``,
    `RULES (non-negotiable):`,
    `1. PRICING (§51): You may state ONLY the exact pricing figures listed in SERVICES & PRICING above. For anything without a configured price, never invent figures — say a custom proposal will include investment details.`,
    `2. Qualify the visitor in a MAXIMUM of 3 of your messages: understand what they need (1), recommend the right 1-2 real services from the catalog with a concrete reason (2), then ask for their email (3).`,
    `3. This is user turn ${userTurns}. ${
      userTurns >= 2
        ? "You MUST now ask (or ask again, politely): \"Can I get your email to send a custom proposal?\" — exactly this question or very close to it."
        : "Plan to ask by your next reply: \"Can I get your email to send a custom proposal?\""
    }`,
    `4. Be an expert with Nigerian context (Lagos/Abuja business reality, schools, SMEs, NGOs, fintech regs) and use the Ink+Honey tone: confident, premium, warm, crisp — never fluffy, never pushy.`,
    `5. ONLY recommend services from the catalog above — use their exact titles. Reference portfolio projects when they strengthen the recommendation. Never invent services, policies or capabilities.`,
    `6. Keep replies SHORT (2-4 sentences, max ~60 words). Chat format. No markdown headings.`,
    `7. If the visitor gives their email, thank them warmly and confirm a custom proposal (with investment details) is being prepared and will arrive shortly.`,
    `8. ESCALATION (§60): Set escalate=true when: payment dispute, sensitive account issue, complaint, complex pricing negotiation, legal/compliance question, the visitor explicitly asks for a human, or you are not confident you can answer correctly. When escalate=true, your reply MUST honestly tell the visitor you're flagging this for a team member — never pretend a human already took over.`,
    ``,
    `OUTPUT — return STRICT JSON only, no markdown fences:`,
    `{ "reply": "your chat reply", "recommendedServiceIds": ["catalog ids"], "leadScore": 1-10, "customerName": "name if the visitor mentioned one, else null", "escalate": false, "escalationReason": "short reason when escalate is true, else null", "sentiment": "positive|neutral|negative", "urgency": "low|normal|high", "confidence": 0.0-1.0 }`,
    ``,
    `leadScore: rate the lead 1-10 from chat signals (clear need + urgency + org details = high; vague browsing = low).`,
    `sentiment/urgency: the visitor's latest message only. confidence: how sure you are your answer is correct.`,
  ];
  return sections.filter((s) => s !== null).join("\n");
}

/* ── Model call ─────────────────────────────────────────────── */

type ModelJson = {
  reply?: unknown;
  recommendedServiceIds?: unknown;
  leadScore?: unknown;
  customerName?: unknown;
  escalate?: unknown;
  escalationReason?: unknown;
  sentiment?: unknown;
  urgency?: unknown;
  confidence?: unknown;
};

function parseModelJson(text: string): ModelJson | null {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as ModelJson;
  } catch {
    return null;
  }
}

/* ── Deterministic fallback (AI outage must not kill the funnel) */

function keywordServiceMatch(text: string): string[] {
  const t = text.toLowerCase();
  const scored = SERVICES.map((s) => {
    let score = 0;
    if (t.includes(s.title.toLowerCase().split(" ")[0])) score += 2;
    for (const sub of s.subs) {
      const words = sub.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3);
      for (const w of words) if (t.includes(w)) score += 1;
    }
    for (const tag of s.tags) if (t.includes(tag.toLowerCase())) score += 2;
    return { title: s.title, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 2).map((s) => s.title);
}

function fallbackReply(messages: ChatMessage[], emailCaptured: boolean): { reply: string; services: string[] } {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const services = keywordServiceMatch(lastUser);
  if (emailCaptured) {
    return {
      reply:
        "Thank you! Your custom proposal is being prepared right now and will arrive in your inbox shortly — including the investment details and a delivery timeline. — Okomba Analytics",
      services,
    };
  }
  if (services.length) {
    return {
      reply: `Got it. Based on what you've described, I'd recommend ${services.join(
        " and "
      )} — we deliver exactly this for Nigerian organisations. Can I get your email to send a custom proposal?`,
      services,
    };
  }
  return {
    reply:
      "Hello! I'm Okomba AI — tell me what you're trying to build or fix for your organisation, and I'll point you to the right service. Can I get your email to send a custom proposal?",
    services,
  };
}

/* ── Lead capture (received_emails + inquiry + draft proposal) ─ */

async function captureLead(input: {
  sessionId: string;
  conversationId?: string;
  email: string;
  name: string | null;
  leadScore: number | null;
  recommendedServices: string[];
  transcript: ChatMessage[];
}): Promise<{ receivedEmailId: string; inquiryId: string; draftStatus: "generating" | "created" | "failed" }> {
  const service = input.recommendedServices[0] ?? "General consultation";
  const transcriptText = input.transcript
    .slice(-14)
    .map((m) => `${m.role === "user" ? "Visitor" : "Okomba AI"}: ${m.content}`)
    .join("\n")
    .slice(0, 4000);

  // 1. received_emails row (spec: source "ai_chat", leadScore 1-10)
  const received = await db.receivedEmail.create({
    data: {
      source: "ai_chat",
      name: input.name,
      email: input.email,
      subject: "AI chat lead — service finder",
      message: transcriptText,
      leadScore: input.leadScore,
      meta: {
        sessionId: input.sessionId,
        recommendedServices: input.recommendedServices,
        capturedAt: new Date().toISOString(),
      } as InputJsonValue,
    },
  });

  // 2. Inquiry row so the lead flows into the existing admin workflow
  const inquiry = await db.inquiry.create({
    data: {
      name: input.name ?? "AI chat visitor",
      email: input.email,
      service,
      message: `AI Service Finder lead (session ${input.sessionId}).\n\nRecommended: ${
        input.recommendedServices.join(", ") || "catalog consultation"
      }.\n\nChat transcript:\n${transcriptText}`,
      status: "new",
      source: "ai_chat",
    },
  });
  await db.receivedEmail.update({
    where: { id: received.id },
    data: { inquiryId: inquiry.id },
  });

  // 3. Auto-create the draft proposal (background — never blocks the chat)
  let draftStatus: "generating" | "created" | "failed" = "generating";
  void (async () => {
    try {
      const { draft } = await generateProposalDraft({
        name: inquiry.name,
        service,
        message: transcriptText || "AI chat lead — see transcript.",
      });
      const draftRow = await db.draftProposal.create({
        data: {
          source: "ai_chat",
          customerName: inquiry.name,
          customerEmail: inquiry.email,
          service,
          draftJson: draft as InputJsonValue,
          leadScore: input.leadScore,
          inquiryId: inquiry.id,
          receivedEmailId: received.id,
          status: "draft",
        },
      });
      // §63: every autonomous AI action is audited.
      await aiAudit("ai.proposal.created", {
        conversationId: input.conversationId ?? null,
        targetId: draftRow.id,
        meta: { email: inquiry.email, service, inquiryId: inquiry.id },
      });
      console.info(`[ai-chat] draft proposal created for ${inquiry.email} (${service})`);
    } catch (err) {
      console.error("[ai-chat] draft proposal generation failed:", err);
    }
  })();

  return { receivedEmailId: received.id, inquiryId: inquiry.id, draftStatus };
}

/* ── Rate limiting (in-memory, per IP) ──────────────────────── */

const rateBuckets = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = (rateBuckets.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (bucket.length >= RATE_MAX) {
    rateBuckets.set(ip, bucket);
    return false;
  }
  bucket.push(now);
  rateBuckets.set(ip, bucket);
  if (rateBuckets.size > 5000) rateBuckets.clear(); // hard cap
  return true;
}

/* ── Main entry: one chat turn ──────────────────────────────── */

export async function runAiChatTurn(input: {
  sessionId: string;
  messages: ChatMessage[];
}): Promise<AiChatResult> {
  // Sanitize history (full payload — used as MODEL context only)
  const history = input.messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

  const userTurns = history.filter((m) => m.role === "user").length;
  const email = extractEmail(history);
  const customerName = extractName(history);

  // §58 — conversation row for this session (created on first turn).
  const conversation = await getOrCreateConversation(input.sessionId);

  // The widget sends FULL history for context; the server already
  // persisted earlier turns on the requests that produced them, so
  // persist ONLY the new tail: the LAST user message in the payload.
  const lastUserMessage = [...history].reverse().find((m) => m.role === "user") ?? null;

  // Already captured this session? (dedupe — session key in meta)
  let alreadyCaptured = false;
  if (email) {
    const existing = await db.receivedEmail.findFirst({
      where: { source: "ai_chat", email },
      orderBy: { createdAt: "desc" },
    });
    if (existing && existing.meta && typeof existing.meta === "object" && !Array.isArray(existing.meta)) {
      const meta = existing.meta as { sessionId?: string };
      alreadyCaptured = meta.sessionId === input.sessionId;
    }
  }

  // ── §61 Accept: human-owned conversation — AI stays silent.
  // The visitor's message is queued for the agent; NO model call,
  // NO assistant message. The route tells the widget it queued.
  if (conversation.status === "human") {
    if (lastUserMessage) {
      await appendMessage(conversation.id, {
        role: "user",
        content: lastUserMessage.content,
      });
    }
    return {
      reply: "",
      stage: "captured",
      recommendedServices: [],
      leadScore: null,
      leadCaptured: alreadyCaptured,
      email: email ?? null,
      usedFallback: false,
      humanOwned: true,
      status: "human",
      agentName: conversation.agentName,
      conversationId: conversation.id,
      escalate: false,
    };
  }

  // Persist the new user turn BEFORE the model call (§58).
  if (lastUserMessage) {
    await appendMessage(conversation.id, {
      role: "user",
      content: lastUserMessage.content,
    });
  }

  // ── §60 requested-but-not-accepted: the AI pauses. Instead of
  // answering new questions (and risking contradicting the pending
  // handover), reply with the fixed honest holding text. No model
  // call — the customer is kept informed without pretending.
  if (conversation.status === "takeover_requested") {
    await appendMessage(conversation.id, {
      role: "assistant",
      content: HOLDING_TEXT,
      authorLabel: "Okomba AI",
    });
    const stage: AiChatStage = alreadyCaptured ? "captured" : userTurns >= 2 ? "awaiting_email" : "qualifying";
    return {
      reply: HOLDING_TEXT,
      stage,
      recommendedServices: [],
      leadScore: null,
      leadCaptured: alreadyCaptured,
      email: email ?? null,
      usedFallback: false,
      status: "takeover_requested",
      agentName: conversation.agentName,
      conversationId: conversation.id,
      escalate: true, // an escalation is pending on this conversation
    };
  }

  // Link the visitor identity to the conversation when first seen.
  if ((email || customerName) && (!conversation.customerEmail || !conversation.customerName)) {
    await db.chatConversation
      .update({
        where: { id: conversation.id },
        data: {
          ...(email && !conversation.customerEmail ? { customerEmail: email } : {}),
          ...(customerName && !conversation.customerName ? { customerName } : {}),
        },
      })
      .catch((err) => console.error("[ai-chat] identity link failed:", err));
  }

  // §49 context blocks — built BEFORE the model call (fresh reads).
  const [knowledgeContext, customerContext, allowedFigures] = await Promise.all([
    buildKnowledgeContext().catch(() => ""),
    buildCustomerContext(email, customerName).catch(() => ""),
    allowedPriceFigures().catch(() => new Set<number>()),
  ]);

  let reply = "";
  let recommendedServices: string[] = [];
  let leadScore: number | null = null;
  let resolvedName: string | null = customerName;
  let usedFallback = false;

  // Model-labelled signals (§58 monitoring + §60 escalation).
  let modelEscalate = false;
  let escalationReason: string | null = null;
  let sentiment: "positive" | "neutral" | "negative" | null = null;
  let urgency: "low" | "normal" | "high" | null = null;
  let confidence: number | undefined;

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: buildSystemPrompt(userTurns, customerContext, knowledgeContext) },
        ...history,
      ],
      thinking: { type: "disabled" },
    });
    const text = completion.choices[0]?.message?.content ?? "";
    const parsed = parseModelJson(text);
    if (parsed && typeof parsed.reply === "string" && parsed.reply.trim().length > 0) {
      let candidate = cleanReplyText(parsed.reply.trim());
      try {
        candidate = guardFigures(candidate, allowedFigures); // §51
      } catch {
        /* guard must never kill a valid reply */
      }
      reply = candidate;
      if (Array.isArray(parsed.recommendedServiceIds)) {
        recommendedServices = parsed.recommendedServiceIds
          .filter((x): x is string => typeof x === "string")
          .map((id) => SERVICES.find((s) => s.id === id)?.title ?? "")
          .filter(Boolean)
          .slice(0, 3);
      }
      if (typeof parsed.leadScore === "number" && parsed.leadScore >= 1 && parsed.leadScore <= 10) {
        leadScore = Math.round(parsed.leadScore);
      }
      if (typeof parsed.customerName === "string" && parsed.customerName.trim().length > 1) {
        resolvedName = parsed.customerName.trim().slice(0, 60);
      }
      // If the model omits escalate → false (spec).
      modelEscalate = parsed.escalate === true;
      if (typeof parsed.escalationReason === "string" && parsed.escalationReason.trim()) {
        escalationReason = parsed.escalationReason.trim().slice(0, 120);
      }
      if (parsed.sentiment === "positive" || parsed.sentiment === "neutral" || parsed.sentiment === "negative") {
        sentiment = parsed.sentiment;
      }
      if (parsed.urgency === "low" || parsed.urgency === "normal" || parsed.urgency === "high") {
        urgency = parsed.urgency;
      }
      if (typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)) {
        confidence = Math.min(1, Math.max(0, parsed.confidence));
      }
    } else if (text.trim().length >= 10) {
      // Model replied in plain prose (skipped the JSON wrapper) — the
      // prose is still a valid, model-written reply. Use it directly,
      // figure-guarded, minus stray JSON fragments.
      let cleaned = cleanReplyText(text.replace(/\{[\s\S]*?\}/g, " ").replace(/\s{2,}/g, " ").trim());
      try {
        cleaned = guardFigures(cleaned, allowedFigures); // §51
      } catch {
        /* guard must never kill a valid reply */
      }
      if (cleaned.length >= 10) {
        reply = cleaned;
        console.info("[ai-chat] model replied in prose (no JSON) — using as-is");
      } else {
        usedFallback = true;
      }
    } else {
      console.warn("[ai-chat] empty model output — using fallback");
      usedFallback = true;
    }
  } catch (err) {
    console.error("[ai-chat] model call failed, using fallback:", err);
    usedFallback = true;
  }

  if (!reply) {
    const fb = fallbackReply(history, !!email);
    reply = fb.reply;
    recommendedServices = recommendedServices.length ? recommendedServices : fb.services;
    usedFallback = true;
  }

  // ── §60 escalation decision (model flag + deterministic triggers) ──
  const lastUserContent = lastUserMessage?.content ?? "";
  let escalate = modelEscalate;
  if (ESCALATION_KEYWORD_RE.test(lastUserContent)) {
    escalate = true;
    escalationReason = escalationReason ?? "explicit-or-keyword";
  }
  if (usedFallback && userTurns >= 2) {
    escalate = true;
    escalationReason = escalationReason ?? "low-confidence";
  }
  if (typeof confidence === "number" && confidence < 0.4) {
    escalate = true;
    escalationReason = escalationReason ?? "low-confidence";
  }
  if (escalate && !escalationReason) {
    escalationReason = "model-flagged";
  }

  // ── §58 persistence: assistant turn + monitoring fields ──
  await appendMessage(conversation.id, {
    role: "assistant",
    content: reply,
    authorLabel: "Okomba AI",
  });

  await db.chatConversation
    .update({
      where: { id: conversation.id },
      data: {
        ...(sentiment ? { sentiment } : {}),
        ...(urgency ? { urgency } : {}),
        ...(email && !conversation.customerEmail ? { customerEmail: email } : {}),
        ...(resolvedName && !conversation.customerName ? { customerName: resolvedName } : {}),
      },
    })
    .catch((err) => console.error("[ai-chat] conversation update failed:", err));

  // ── §60: flag for a human (system notice + audit + conditional email) ──
  let conversationStatus = conversation.status;
  if (escalate && conversation.status === "ai") {
    const updated = await requestHandover(conversation, escalationReason ?? "model-flagged", {
      sentiment: sentiment ?? null,
      urgency: urgency ?? null,
      confidence: confidence ?? null,
      trigger: modelEscalate && !usedFallback ? "model" : "deterministic",
    }).catch((err) => {
      console.error("[ai-chat] requestHandover failed:", err);
      return conversation;
    });
    conversationStatus = updated.status;
    await aiAudit("ai.chat.escalated", {
      conversationId: conversation.id,
      meta: {
        reason: escalationReason,
        trigger: modelEscalate && !usedFallback ? "model" : "deterministic",
        sentiment: sentiment ?? null,
        urgency: urgency ?? null,
        confidence: confidence ?? null,
      },
    });
  }

  // Lead capture on first email sighting for this session
  let leadCaptured = false;
  let draftStatus: AiChatResult["draftProposal"];
  if (email && !alreadyCaptured) {
    // Default lead score if the model didn't rate: warm lead (gave email)
    if (leadScore == null) leadScore = 6;
    try {
      const res = await captureLead({
        sessionId: input.sessionId,
        conversationId: conversation.id,
        email,
        name: resolvedName,
        leadScore,
        recommendedServices: recommendedServices.length
          ? recommendedServices
          : keywordServiceMatch(history.map((m) => m.content).join(" ")),
        transcript: history,
      });
      leadCaptured = true;
      draftStatus = res.draftStatus;
    } catch (err) {
      console.error("[ai-chat] lead capture failed:", err);
      draftStatus = "failed";
    }
  } else if (email && alreadyCaptured) {
    leadCaptured = true;
  }

  const stage: AiChatStage = leadCaptured ? "captured" : userTurns >= 2 ? "awaiting_email" : "qualifying";

  return {
    reply,
    stage,
    recommendedServices,
    leadScore,
    leadCaptured,
    email: email ?? null,
    draftProposal: draftStatus,
    usedFallback,
    humanOwned: false,
    escalate,
    status: conversationStatus,
    agentName: conversation.agentName,
    conversationId: conversation.id,
  };
}
