import { z } from "zod";
import { db } from "@/lib/db";
import { jsonLoose } from "@/lib/db";
import { CONTACT } from "@/lib/brand";
import { lagosEventLabel } from "@/lib/events-shared";

/* ─────────────────────────────────────────────────────────────
   BATCH 11 (§50/§51) — SERVER-ONLY AI knowledge base.

   The controlled business-knowledge layer the chat AI reasons
   from (§49 step 3 "Configured company knowledge"). One singleton
   row (AiKnowledge, id="singleton"), admin-editable via
   GET/PUT /api/admin/ai/knowledge (access_ai).

   The AI may state ONLY the pricing figures present here —
   allowedPriceFigures() feeds the figure guard in ai-chat.ts;
   anything unpriced is answered with "a custom proposal will
   include investment details" (§51: AI must not invent pricing).
   ───────────────────────────────────────────────────────────── */

/* ── Typed shapes + zod schemas ──────────────────────────── */

export type ContactConfig = {
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  hours?: string;
  callbackEnabled?: boolean;
};

export const CONTACT_CONFIG_SCHEMA = z.object({
  phone: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(200).optional(),
  email: z.email().max(200).optional(),
  address: z.string().trim().max(200).optional(),
  hours: z.string().trim().max(120).optional(),
  callbackEnabled: z.boolean().optional(),
});

export type ServicePriceConfig = {
  name: string;
  description?: string;
  duration?: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
};

export const SERVICE_PRICE_SCHEMA = z.object({
  name: z.string().trim().min(1, "Service name is required").max(120),
  description: z.string().trim().max(400).optional(),
  duration: z.string().trim().max(80).optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  currency: z.string().trim().max(8).optional(),
});

export type FaqItem = { q: string; a: string };

export const FAQ_ITEM_SCHEMA = z.object({
  q: z.string().trim().min(1, "Question is required").max(300),
  a: z.string().trim().min(1, "Answer is required").max(2000),
});

export type EducationItem = {
  course: string;
  description?: string;
  duration?: string;
};

export const EDUCATION_ITEM_SCHEMA = z.object({
  course: z.string().trim().min(1, "Course name is required").max(160),
  description: z.string().trim().max(600).optional(),
  duration: z.string().trim().max(80).optional(),
});

export type PoliciesConfig = {
  paymentPolicy?: string;
  cancellationPolicy?: string;
  depositPolicy?: string;
  invoiceTerms?: string;
  discounts?: string;
};

export const POLICIES_SCHEMA = z.object({
  paymentPolicy: z.string().trim().max(2000).optional(),
  cancellationPolicy: z.string().trim().max(2000).optional(),
  depositPolicy: z.string().trim().max(2000).optional(),
  invoiceTerms: z.string().trim().max(2000).optional(),
  discounts: z.string().trim().max(2000).optional(),
});

/** PUT /api/admin/ai/knowledge body — every field optional, no
 *  defaults, so a partial update never resets untouched sections. */
export const AI_KNOWLEDGE_UPDATE_SCHEMA = z.object({
  businessProfile: z.string().trim().max(8000).optional(),
  contact: CONTACT_CONFIG_SCHEMA.optional(),
  faq: z.array(FAQ_ITEM_SCHEMA).max(50).optional(),
  services: z.array(SERVICE_PRICE_SCHEMA).max(50).optional(),
  education: z.array(EDUCATION_ITEM_SCHEMA).max(50).optional(),
  policies: POLICIES_SCHEMA.optional(),
});

export type AiKnowledgeUpdateInput = z.infer<typeof AI_KNOWLEDGE_UPDATE_SCHEMA>;

/* ── Typed projection (Json columns → parsed, validated shapes) ── */

export type AiKnowledgeDto = {
  businessProfile: string | null;
  contact: ContactConfig;
  faq: FaqItem[];
  services: ServicePriceConfig[];
  education: EducationItem[];
  policies: PoliciesConfig;
  updatedAt: string;
};

type KnowledgeRow = {
  id: string;
  businessProfile: string | null;
  contactJson: unknown;
  faqJson: unknown;
  policiesJson: unknown;
  servicesJson: unknown;
  educationJson: unknown;
  updatedAt: Date;
};

export function toAiKnowledgeDto(row: KnowledgeRow): AiKnowledgeDto {
  const contact = CONTACT_CONFIG_SCHEMA.catch({}).parse(jsonLoose(row.contactJson) ?? {});
  const faq = z.array(FAQ_ITEM_SCHEMA).catch([]).parse(jsonLoose(row.faqJson) ?? []);
  const services = z.array(SERVICE_PRICE_SCHEMA).catch([]).parse(jsonLoose(row.servicesJson) ?? []);
  const education = z.array(EDUCATION_ITEM_SCHEMA).catch([]).parse(jsonLoose(row.educationJson) ?? []);
  const policies = POLICIES_SCHEMA.catch({}).parse(jsonLoose(row.policiesJson) ?? {});
  return {
    businessProfile: row.businessProfile,
    contact,
    faq,
    services,
    education,
    policies,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/* ── Singleton access (self-seeding defaults from brand.ts) ── */

const SINGLETON_ID = "singleton";

/** First-read defaults mirror what the live site already shows:
 *  brand.ts CONTACT (single source of truth) + the footer's phone
 *  hours ("Mon–Sat · 8:00–18:00 WAT"). Empty catalog arrays — the
 *  master admin fills them in (§50/§51). */
const DEFAULT_CONTACT: ContactConfig = {
  phone: CONTACT.phone,
  whatsapp: CONTACT.whatsapp,
  email: CONTACT.email,
  address: CONTACT.address,
  hours: "Mon–Sat, 8:00–18:00 WAT",
  callbackEnabled: true,
};

export async function getAiKnowledge() {
  const existing = await db.aiKnowledge.findUnique({ where: { id: SINGLETON_ID } });
  if (existing) return existing;
  return db.aiKnowledge.create({
    data: {
      id: SINGLETON_ID,
      businessProfile: null,
      contactJson: DEFAULT_CONTACT as unknown as never,
      faqJson: [] as unknown as never,
      policiesJson: {} as unknown as never,
      servicesJson: [] as unknown as never,
      educationJson: [] as unknown as never,
    },
  });
}

/** Typed read (parsed + zod-validated projection). */
export async function getAiKnowledgeDto(): Promise<AiKnowledgeDto> {
  const row = await getAiKnowledge();
  return toAiKnowledgeDto(row);
}

/** Apply a validated partial update to the singleton. */
export async function updateAiKnowledge(input: AiKnowledgeUpdateInput) {
  await getAiKnowledge(); // ensure the row exists
  return db.aiKnowledge.update({
    where: { id: SINGLETON_ID },
    data: {
      ...(input.businessProfile !== undefined ? { businessProfile: input.businessProfile || null } : {}),
      ...(input.contact !== undefined ? { contactJson: input.contact as unknown as never } : {}),
      ...(input.faq !== undefined ? { faqJson: input.faq as unknown as never } : {}),
      ...(input.services !== undefined ? { servicesJson: input.services as unknown as never } : {}),
      ...(input.education !== undefined ? { educationJson: input.education as unknown as never } : {}),
      ...(input.policies !== undefined ? { policiesJson: input.policies as unknown as never } : {}),
    },
  });
}

/* ── LLM context builder (§49 step 3) ───────────────────── */

/** "₦350,000" | "₦350,000–₦1,200,000" | "from ₦350,000" | "custom". */
function formatServicePrice(s: ServicePriceConfig): string {
  const sym = s.currency && s.currency.toUpperCase() !== "NGN" ? `${s.currency} ` : "₦";
  const fmt = (n: number) => n.toLocaleString("en-NG");
  const min = typeof s.priceMin === "number" && Number.isFinite(s.priceMin) ? s.priceMin : null;
  const max = typeof s.priceMax === "number" && Number.isFinite(s.priceMax) ? s.priceMax : null;
  if (min != null && max != null && min !== max) return `${sym}${fmt(min)}–${sym}${fmt(max)}`;
  if (min != null && max != null && min === max) return `${sym}${fmt(min)}`;
  if (min != null) return `from ${sym}${fmt(min)}`;
  if (max != null) return `from ${sym}${fmt(max)}`;
  return "custom (in your proposal)";
}

/** Next 5 public scheduled events (startAt >= now − 24h so an
 *  in-flight session still counts), rendered in Lagos time. */
async function upcomingPublicEvents(now: Date): Promise<string[]> {
  const rows = await db.calendarEvent.findMany({
    where: {
      isPublic: true,
      status: "scheduled",
      startAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { startAt: "asc" },
    take: 5,
    select: { title: true, type: true, startAt: true },
  }).catch(() => []);
  return rows.map((r) => `- ${r.title} — ${lagosEventLabel(r.startAt.toISOString(), { withYear: true })} (${r.type})`);
}

/**
 * Compact text block injected into the chat system prompt:
 * business profile, contact & hours, FAQ, policies, services &
 * pricing (§51), education, LIVE upcoming public events, and the
 * closing "AVAILABLE ACTIONS" list. Empty sections are omitted —
 * the model is never shown placeholders it might paraphrase as facts.
 */
export async function buildKnowledgeContext(): Promise<string> {
  const dto = await getAiKnowledgeDto().catch(() => null);
  if (!dto) return "";

  const sections: string[] = [];

  if (dto.businessProfile && dto.businessProfile.trim()) {
    sections.push(`BUSINESS PROFILE:\n${dto.businessProfile.trim()}`);
  }

  const c = dto.contact;
  const contactLines = [
    c.phone ? `- Phone: ${c.phone}` : null,
    c.whatsapp ? `- WhatsApp: ${c.whatsapp}` : null,
    c.email ? `- Email: ${c.email}` : null,
    c.address ? `- Address: ${c.address}` : null,
    c.hours ? `- Business hours: ${c.hours}` : null,
  ].filter((l): l is string => l !== null);
  if (contactLines.length) sections.push(`CONTACT & HOURS:\n${contactLines.join("\n")}`);

  if (dto.faq.length) {
    sections.push(
      `FAQ:\n${dto.faq.map((f) => `- Q: ${f.q}\n  A: ${f.a}`).join("\n")}`
    );
  }

  const p = dto.policies;
  const policyLines = [
    p.paymentPolicy ? `- Payment policy: ${p.paymentPolicy}` : null,
    p.cancellationPolicy ? `- Cancellation policy: ${p.cancellationPolicy}` : null,
    p.depositPolicy ? `- Deposit policy: ${p.depositPolicy}` : null,
    p.invoiceTerms ? `- Invoice terms: ${p.invoiceTerms}` : null,
    p.discounts ? `- Discounts: ${p.discounts}` : null,
  ].filter((l): l is string => l !== null);
  if (policyLines.length) sections.push(`POLICIES:\n${policyLines.join("\n")}`);

  if (dto.services.length) {
    sections.push(
      `SERVICES & PRICING (configured figures — the ONLY prices you may state):\n${dto.services
        .map((s) => {
          const bits = [s.name];
          if (s.description) bits.push(s.description);
          if (s.duration) bits.push(`duration: ${s.duration}`);
          bits.push(formatServicePrice(s));
          return `- ${bits.join(" | ")}`;
        })
        .join("\n")}`
    );
  }

  if (dto.education.length) {
    sections.push(
      `EDUCATION:\n${dto.education
        .map((e) => {
          const bits = [e.course];
          if (e.description) bits.push(e.description);
          if (e.duration) bits.push(`duration: ${e.duration}`);
          return `- ${bits.join(" | ")}`;
        })
        .join("\n")}`
    );
  }

  const events = await upcomingPublicEvents(new Date());
  if (events.length) sections.push(`UPCOMING PUBLIC EVENTS:\n${events.join("\n")}`);

  sections.push(
    `AVAILABLE ACTIONS (things you can offer to do for the visitor): submit an inquiry, subscribe to the newsletter, register for an event/webinar, request a callback, or request a custom email proposal.`
  );

  return sections.join("\n\n");
}

/* ── Figure guard support (§51) ─────────────────────────── */

const POLICY_FIGURE_RE = /(?:₦|NGN\s?)([\d,]+(?:\.\d+)?)/gi;

/**
 * Every naira/NGN figure the AI is ALLOWED to state: all
 * servicesJson priceMin/priceMax values + any figures written in
 * the policies text (e.g. "deposits from ₦50,000"). The figure
 * guard in ai-chat.ts replaces anything outside this set.
 */
export async function allowedPriceFigures(): Promise<Set<number>> {
  const out = new Set<number>();
  const dto = await getAiKnowledgeDto().catch(() => null);
  if (!dto) return out;

  for (const s of dto.services) {
    for (const v of [s.priceMin, s.priceMax]) {
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) out.add(v);
    }
  }

  const policyTexts = [
    dto.policies.paymentPolicy,
    dto.policies.cancellationPolicy,
    dto.policies.depositPolicy,
    dto.policies.invoiceTerms,
    dto.policies.discounts,
  ].filter((t): t is string => typeof t === "string" && t.length > 0);

  for (const text of policyTexts) {
    for (const match of text.matchAll(POLICY_FIGURE_RE)) {
      const raw = match[1]?.replace(/,/g, "");
      if (!raw) continue;
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) out.add(n);
    }
  }

  return out;
}
