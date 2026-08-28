/**
 * AI Service Finder engine (Phase-2 Module 7).
 *
 * Replaces "scroll the products page" with a lead-qualifying chat.
 * Runs server-side via z-ai-web-dev-sdk (same architecture decision
 * as proposals/reminders: AI lives HERE).
 *
 * Spec (user):
 *   System Prompt: "You are Okomba AI. ONLY recommend services from
 *   this DB: {services}. RULES: 1. NEVER mention price. 2. Qualify in
 *   max 3 messages. 3. Then ask: 'Can I get your email to send a
 *   custom proposal?' 4. Be expert, Nigerian context, use Ink+Honey
 *   tone"
 *
 *   After email collected: save to received_emails with
 *   source:"ai_chat", leadScore 1-10, and auto-create a draft
 *   proposal that appears in the admin Proposals tab.
 *
 * Catalog source: the service + portfolio library in content.ts —
 * the same single source of truth that renders the public Services
 * and Case Studies sections (there is no separate Service table;
 * recommending from a DB copy would drift from what the site
 * actually sells). The endpoint re-reads it on every request, so
 * the AI always recommends exactly what's on the site.
 */

import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import type { InputJsonValue } from "@prisma/client/runtime/library";
import { SERVICES, PROJECTS } from "@/lib/content";
import { generateProposalDraft } from "@/lib/proposal";

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
};

/* ── Guards ────────────────────────────────────────────────── */

const MAX_MESSAGES = 24; // history cap sent to the model
const MAX_MESSAGE_CHARS = 2000;

/* Currency-figure scrub — the AI must NEVER state prices in chat. */
const PRICE_FIGURE =
  /(₦|\bNGN\b|\b[Nn]\s?\d[\d,.]{2,}\b|\d[\d,.]{2,}\s?(naira|kobo)|\b(?:price|pricing|cost|fee|rate)s?\s*(?:is|are|at|of)?\s*[:#]?\s*\d)/i;

function scrubPrice(text: string): string {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .filter((sentence) => !PRICE_FIGURE.test(sentence))
    .join(" ")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1") // strip markdown bold/italic
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

/* ── System prompt (spec-fixed rules) ───────────────────────── */

function buildSystemPrompt(userTurns: number): string {
  return [
    `You are Okomba AI — the service finder for Okomba Analytics, a Nigerian digital products, systems & analytics studio.`,
    ``,
    buildCatalogContext(),
    ``,
    `RULES (non-negotiable):`,
    `1. NEVER mention price, cost, fees, rates or any naira/NGN figures. If asked about pricing, say a custom proposal with investment details will be prepared for them.`,
    `2. Qualify the visitor in a MAXIMUM of 3 of your messages: understand what they need (1), recommend the right 1-2 real services from the catalog with a concrete reason (2), then ask for their email (3).`,
    `3. This is user turn ${userTurns}. ${
      userTurns >= 2
        ? "You MUST now ask (or ask again, politely): \"Can I get your email to send a custom proposal?\" — exactly this question or very close to it."
        : "Plan to ask by your next reply: \"Can I get your email to send a custom proposal?\""
    }`,
    `4. Be an expert with Nigerian context (Lagos/Abuja business reality, schools, SMEs, NGOs, fintech regs) and use the Ink+Honey tone: confident, premium, warm, crisp — never fluffy, never pushy.`,
    `5. ONLY recommend services from the catalog above — use their exact titles. Reference portfolio projects when they strengthen the recommendation. Never invent services.`,
    `6. Keep replies SHORT (2-4 sentences, max ~60 words). Chat format. No markdown headings.`,
    `7. If the visitor gives their email, thank them warmly and confirm a custom proposal (with investment details) is being prepared and will arrive shortly.`,
    ``,
    `OUTPUT — return STRICT JSON only, no markdown fences:`,
    `{ "reply": "your chat reply", "recommendedServiceIds": ["catalog ids"], "leadScore": 1-10, "customerName": "name if the visitor mentioned one, else null" }`,
    ``,
    `leadScore: rate the lead 1-10 from chat signals (clear need + urgency + org details = high; vague browsing = low).`,
  ].join("\n");
}

/* ── Model call ─────────────────────────────────────────────── */

type ModelJson = {
  reply?: unknown;
  recommendedServiceIds?: unknown;
  leadScore?: unknown;
  customerName?: unknown;
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
      await db.draftProposal.create({
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
  // Sanitize history
  const history = input.messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

  const userTurns = history.filter((m) => m.role === "user").length;
  const email = extractEmail(history);

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

  let reply = "";
  let recommendedServices: string[] = [];
  let leadScore: number | null = null;
  let customerName: string | null = extractName(history);
  let usedFallback = false;

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: buildSystemPrompt(userTurns) },
        ...history,
      ],
      thinking: { type: "disabled" },
    });
    const text = completion.choices[0]?.message?.content ?? "";
    const parsed = parseModelJson(text);
    if (parsed && typeof parsed.reply === "string" && parsed.reply.trim().length > 0) {
      reply = scrubPrice(parsed.reply.trim());
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
        customerName = parsed.customerName.trim().slice(0, 60);
      }
    } else if (text.trim().length >= 10) {
      // Model replied in plain prose (skipped the JSON wrapper) — the
      // prose is still a valid, model-written reply. Use it directly,
      // scrubbed of any price figures, minus stray JSON fragments.
      const cleaned = scrubPrice(
        text.replace(/\{[\s\S]*?\}/g, " ").replace(/\s{2,}/g, " ").trim()
      );
      if (cleaned.length >= 10) {
        reply = cleaned;
        console.info("[ai-chat] model replied in prose (no JSON) — using as-is");
      } else {
        usedFallback = true;
      }
    } else {
      console.warn(
        "[ai-chat] empty model output — using fallback"
      );
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

  // Lead capture on first email sighting for this session
  let leadCaptured = false;
  let draftStatus: AiChatResult["draftProposal"];
  if (email && !alreadyCaptured) {
    // Default lead score if the model didn't rate: warm lead (gave email)
    if (leadScore == null) leadScore = 6;
    try {
      const res = await captureLead({
        sessionId: input.sessionId,
        email,
        name: customerName,
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
  };
}
