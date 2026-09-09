import ZAI from "z-ai-web-dev-sdk";
import { z } from "zod";
import { db } from "@/lib/db";
import { jsonLoose } from "@/lib/db";
import { aiAudit } from "@/lib/ai-chat-monitor";
import { getAiKnowledgeDto, allowedPriceFigures } from "@/lib/ai-knowledge";
import { evaluateAction, recordAction, aiEmailsToday, getAutonomyConfigDto } from "@/lib/ai-autonomy";
import { deliverAiEmail, guardFigures } from "@/lib/ai-email";
import { lagosEventLabel } from "@/lib/events-shared";

/* ─────────────────────────────────────────────────────────────
   BATCH 12 (§56/§57) — SERVER-ONLY AI mass-email campaign engine.

   §56: admin selects an audience (All / status / tag / country /
   service / custom search), briefs a goal; the AI drafts the
   subject/body/CTA; the admin PREVIEWS per-recipient renders,
   edits, approves, then sends — batched, 150ms-spaced, budget-
   gated, never throwing.

   §57: every recipient's copy is rendered ONLY from that
   recipient's own CRM data ({{firstName}} {{service}}
   {{invoiceState}} {{lastInteraction}} {{event}} {{course}}
   {{proposal}}) — one recipient's values NEVER feed another's
   render. Unknown {{tokens}} are stripped (nothing leaks).
   ───────────────────────────────────────────────────────────── */

/* ── §56 audience selector ────────────────────────────────── */

export const CAMPAIGN_AUDIENCE_SCHEMA = z.object({
  mode: z.enum(["all", "status", "tag", "country", "service", "custom"]),
  status: z.string().trim().max(60).optional(),
  tag: z.string().trim().max(60).optional(),
  country: z.string().trim().max(2).optional(),
  service: z.string().trim().max(200).optional(),
  q: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(500).optional(),
});
export type CampaignAudienceFilter = z.infer<typeof CAMPAIGN_AUDIENCE_SCHEMA>;

export type CampaignAudienceMember = {
  id: string;
  email: string;
  firstName: string | null;
  status: string;
  countryCode: string | null;
  lastContactAt: Date | null;
};

const AUDIENCE_CAP = 500;
/** Tag mode scans at most this many customer rows in JS (sqlite has
 *  no Json-array filtering — the twin stores tags as a JSON string). */
const TAG_SCAN_CEILING = 5000;

export async function selectCampaignAudience(
  filter: CampaignAudienceFilter
): Promise<CampaignAudienceMember[]> {
  const cap = Math.min(filter.limit ?? AUDIENCE_CAP, AUDIENCE_CAP);
  const select = {
    id: true,
    email: true,
    firstName: true,
    status: true,
    countryCode: true,
    lastContactAt: true,
  } as const;

  if (filter.mode === "status" && filter.status) {
    return db.customer.findMany({
      where: { status: filter.status },
      orderBy: { lastContactAt: "desc" },
      take: cap,
      select,
    });
  }

  if (filter.mode === "country" && filter.country) {
    return db.customer.findMany({
      where: { countryCode: filter.country.toUpperCase() },
      orderBy: { lastContactAt: "desc" },
      take: cap,
      select,
    });
  }

  if (filter.mode === "tag" && filter.tag) {
    const wanted = filter.tag.toLowerCase();
    const rows = await db.customer.findMany({
      orderBy: { lastContactAt: "desc" },
      take: TAG_SCAN_CEILING,
      select: { ...select, tags: true },
    });
    return rows
      .filter((r) => {
        const tags = z.array(z.string()).catch([]).parse(jsonLoose(r.tags) ?? []);
        return tags.some((t) => t.toLowerCase() === wanted);
      })
      .slice(0, cap)
      .map((r) => ({
        id: r.id,
        email: r.email,
        firstName: r.firstName,
        status: r.status,
        countryCode: r.countryCode,
        lastContactAt: r.lastContactAt,
      }));
  }

  if (filter.mode === "service" && filter.service) {
    // Customers with an Invoice OR Inquiry for that service.
    const [invoiceEmails, inquiryCustomerIds] = await Promise.all([
      db.invoice.findMany({
        where: { service: filter.service },
        select: { customerId: true, customerEmail: true },
        take: 1000,
      }),
      db.inquiry.findMany({
        where: { service: filter.service },
        select: { customerId: true, email: true },
        take: 1000,
      }),
    ]);
    const ids = new Set<string>();
    const emails = new Set<string>();
    for (const i of invoiceEmails) {
      if (i.customerId) ids.add(i.customerId);
      if (i.customerEmail) emails.add(i.customerEmail);
    }
    for (const i of inquiryCustomerIds) {
      if (i.customerId) ids.add(i.customerId);
      if (i.email) emails.add(i.email);
    }
    if (ids.size === 0 && emails.size === 0) return [];
    return db.customer.findMany({
      where: { OR: [{ id: { in: [...ids] } }, { email: { in: [...emails] } }] },
      orderBy: { lastContactAt: "desc" },
      take: cap,
      select,
    });
  }

  if (filter.mode === "custom" && filter.q) {
    const q = filter.q;
    return db.customer.findMany({
      where: {
        OR: [
          { email: { contains: q } },
          { name: { contains: q } },
          { firstName: { contains: q } },
          { company: { contains: q } },
        ],
      },
      orderBy: { lastContactAt: "desc" },
      take: cap,
      select,
    });
  }

  // mode "all" (or a filter missing its key field — safest fallback)
  return db.customer.findMany({
    orderBy: { lastContactAt: "desc" },
    take: cap,
    select,
  });
}

/** §56 builder helper: the distinct statuses / tags / countries /
 *  services the audience picker offers, with counts. */
export async function listAudienceOptions() {
  const [statusGroups, countryGroups, invoiceServiceGroups, inquiryServiceGroups, tagRows] =
    await Promise.all([
      db.customer.groupBy({ by: ["status"], _count: { _all: true } }).catch(() => []),
      db.customer.groupBy({ by: ["countryCode"], _count: { _all: true } }).catch(() => []),
      db.invoice.groupBy({ by: ["service"], _count: { _all: true } }).catch(() => []),
      db.inquiry.groupBy({ by: ["service"], _count: { _all: true } }).catch(() => []),
      db.customer
        .findMany({ take: TAG_SCAN_CEILING, select: { tags: true } })
        .catch(() => [] as { tags: unknown }[]),
    ]);

  const serviceCounts = new Map<string, number>();
  for (const g of invoiceServiceGroups) {
    serviceCounts.set(g.service, (serviceCounts.get(g.service) ?? 0) + g._count._all);
  }
  for (const g of inquiryServiceGroups) {
    serviceCounts.set(g.service, (serviceCounts.get(g.service) ?? 0) + g._count._all);
  }

  const tagCounts = new Map<string, number>();
  for (const row of tagRows) {
    const tags = z.array(z.string()).catch([]).parse(jsonLoose(row.tags) ?? []);
    for (const t of tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }

  return {
    statuses: statusGroups
      .filter((g) => g.status)
      .map((g) => ({ value: g.status, count: g._count._all }))
      .sort((a, b) => b.count - a.count),
    tags: [...tagCounts.entries()]
      .filter(([t]) => t.trim().length > 0)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100),
    countries: countryGroups
      .filter((g) => g.countryCode)
      .map((g) => ({ value: g.countryCode as string, count: g._count._all }))
      .sort((a, b) => b.count - a.count),
    services: [...serviceCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100),
    customerTotal: await db.customer.count().catch(() => 0),
  };
}

/* ── §56 AI content generation ────────────────────────────── */

export type CampaignContent = {
  subject: string;
  body: string;
  ctaLabel: string | null;
  usedFallback: boolean;
};

export const CAMPAIGN_TOKENS = [
  "firstName",
  "service",
  "invoiceState",
  "lastInteraction",
  "event",
  "course",
  "proposal",
] as const;
export type CampaignToken = (typeof CAMPAIGN_TOKENS)[number];

function fallbackCampaignContent(name: string, goal: string | null): CampaignContent {
  return {
    subject: `A quick update from Okomba Analytics`,
    body: [
      `Hi {{firstName}},`,
      ``,
      `We've been building things we think you'll find useful${
        goal ? ` — ${goal.replace(/\.$/, "")}` : ""
      }. ${name} is about keeping you in the loop on what Okomba Analytics is shipping and how it can help your work.`,
      ``,
      `If now is a good time to talk about {{service}}, just reply to this email — we'll take it from there.`,
      ``,
      `— Okomba Analytics`,
    ].join("\n"),
    ctaLabel: null,
    usedFallback: true,
  };
}

export async function generateCampaignContent(input: {
  name: string;
  goal: string | null;
  audienceCount: number;
  /** §57 privacy: anonymized profile SHAPES only — first names and
   *  statuses; NEVER emails, phones or other identifiers. */
  audienceSample: { firstName: string | null; status: string }[];
}): Promise<CampaignContent> {
  try {
    const knowledge = await getAiKnowledgeDto();
    const allowed = await allowedPriceFigures();
    const sampleLines = input.audienceSample
      .slice(0, 8)
      .map((s) => `- first name "${s.firstName ?? "unknown"}", lifecycle stage ${s.status}`);
    const knowledgeBits = [
      knowledge.businessProfile ? `Business context: ${knowledge.businessProfile.slice(0, 600)}` : "",
      knowledge.services.length
        ? `Services we offer: ${knowledge.services.map((s) => s.name).join(", ")}`
        : "",
      knowledge.education.length
        ? `Education programs: ${knowledge.education.map((e) => e.course).join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = [
      `You write marketing emails for Okomba Analytics (a Nigerian digital products & analytics studio).`,
      ``,
      `Campaign name: ${input.name}`,
      input.goal ? `Campaign goal (the admin's brief): ${input.goal}` : "",
      `Audience: ${input.audienceCount} existing customers. Anonymized audience shapes (first names + lifecycle stages only — NO emails, NO phones):`,
      ...(sampleLines.length ? sampleLines : ["- (no sample available)"]),
      ``,
      knowledgeBits,
      ``,
      `Available personalization tokens (double-brace placeholders the system replaces per recipient):`,
      CAMPAIGN_TOKENS.map((t) => `{{${t}}}`).join(" "),
      ``,
      `Return STRICT JSON with exactly these keys:`,
      `{`,
      `  "subject": "3-80 characters, may include {{firstName}}",`,
      `  "body": "plain text, 4-10 short lines, greeting 'Hi {{firstName}},' … sign-off '— Okomba Analytics'. Use the tokens above where they fit naturally.",`,
      `  "ctaLabel": "optional short button label, max 28 chars, or null"`,
      `}`,
      ``,
      `RULES:`,
      `- NEVER mention prices, costs, fees, amounts, naira figures or NGN — commercial terms are human-owned.`,
      `- NEVER invent facts about the company, customers or other people's data.`,
      `- Tone: warm, professional, specific to the goal. JSON only, no markdown fences.`,
    ]
      .filter(Boolean)
      .join("\n");

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content:
            "You are a senior email marketer at Okomba Analytics. You write concise, warm campaign emails. You output strict JSON only.",
        },
        { role: "user", content: prompt },
      ],
      thinking: { type: "disabled" },
    });
    const text = completion.choices[0]?.message?.content ?? "";
    const cleaned = text.replace(/```(?:json)?/gi, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        const raw = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
        const subject =
          typeof raw.subject === "string" ? raw.subject.trim().slice(0, 80) : "";
        const body = typeof raw.body === "string" ? raw.body.trim().slice(0, 6000) : "";
        const cta = typeof raw.ctaLabel === "string" ? raw.ctaLabel.trim().slice(0, 28) : null;
        if (subject.length >= 3 && body.length >= 40) {
          return {
            subject: guardFigures(subject, allowed),
            body: guardFigures(body, allowed),
            ctaLabel: cta && cta.length > 0 ? cta : null,
            usedFallback: false,
          };
        }
      } catch {
        /* fall through to the fallback below */
      }
    }
    return fallbackCampaignContent(input.name, input.goal);
  } catch (err) {
    console.error("[ai-campaigns] content generation failed, using fallback:", err);
    return fallbackCampaignContent(input.name, input.goal);
  }
}

/* ── §57 per-recipient renderer ───────────────────────────── */

export type RenderContext = {
  /** Global (non-personal) values resolved once per batch. */
  event: string;
  course: string;
};

/** Resolve the global context: next upcoming public CalendarEvent +
 *  the first configured education course. Shared by every recipient
 *  (public/config data — never per-recipient). */
export async function buildRenderContext(): Promise<RenderContext> {
  let event = "";
  try {
    const ev = await db.calendarEvent.findFirst({
      where: { isPublic: true, status: "scheduled", startAt: { gte: new Date() } },
      orderBy: { startAt: "asc" },
      select: { title: true, startAt: true },
    });
    if (ev) event = `${ev.title} (${lagosEventLabel(ev.startAt.toISOString(), { withYear: true })})`;
  } catch {
    /* neutral fallback below */
  }

  let course = "";
  try {
    const knowledge = await getAiKnowledgeDto();
    if (knowledge.education.length) course = knowledge.education[0].course;
  } catch {
    /* neutral fallback below */
  }

  return { event, course };
}

/** "last week" / "3 months ago" / "a while" style label. */
function relativeTime(date: Date | null): string {
  if (!date) return "a while";
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return "this week";
  if (days < 14) return "last week";
  if (days < 31) return "this month";
  if (days < 60) return "last month";
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`.replace(/^1 months/, "1 month");
  return "over a year ago";
}

/** Per-recipient token values — queried ONLY from this customer's own
 *  CRM rows (§57 privacy rule). Each call is its own query scope. */
async function tokenValuesFor(
  customer: { id: string; email: string; firstName: string | null; lastContactAt: Date | null },
  ctx: RenderContext
): Promise<Record<CampaignToken, string>> {
  const [lastInvoice, invoiceAgg, draftCount] = await Promise.all([
    db.invoice
      .findFirst({
        where: { OR: [{ customerId: customer.id }, { customerEmail: customer.email }] },
        orderBy: { createdAt: "desc" },
        select: { service: true },
      })
      .catch(() => null),
    db.invoice
      .groupBy({
        by: ["status"],
        _count: { _all: true },
        where: { OR: [{ customerId: customer.id }, { customerEmail: customer.email }] },
      })
      .catch(() => [] as { status: string; _count: { _all: number } }[]),
    db.draftProposal
      .count({
        where: { customerEmail: customer.email, status: { in: ["draft", "sent"] } },
      })
      .catch(() => 0),
  ]);

  let service = lastInvoice?.service ?? "";
  if (!service) {
    const inquiry = await db.inquiry
      .findFirst({
        where: { OR: [{ customerId: customer.id }, { email: customer.email }] },
        orderBy: { createdAt: "desc" },
        select: { service: true },
      })
      .catch(() => null);
    service = inquiry?.service ?? "";
  }

  const open = invoiceAgg
    .filter((g) => ["sent", "pending", "draft"].includes(g.status))
    .reduce((n, g) => n + g._count._all, 0);
  const paid = invoiceAgg
    .filter((g) => g.status === "paid")
    .reduce((n, g) => n + g._count._all, 0);
  const overdue = invoiceAgg
    .filter((g) => g.status === "overdue")
    .reduce((n, g) => n + g._count._all, 0);
  const total = open + paid + overdue;
  const invoiceState =
    total === 0
      ? "no invoices yet"
      : `${total} invoice${total > 1 ? "s" : ""} (${open} open, ${paid} paid${
          overdue ? `, ${overdue} overdue` : ""
        })`;

  return {
    firstName: customer.firstName?.trim() || "there",
    service: service.trim() || "your project",
    invoiceState,
    lastInteraction: relativeTime(customer.lastContactAt),
    event: ctx.event || "an upcoming Okomba session",
    course: ctx.course || "our training programs",
    proposal:
      draftCount === 0 ? "no proposals yet" : `${draftCount} proposal${draftCount > 1 ? "s" : ""}`,
  };
}

/** Replace known tokens with the recipient's own values; STRIP any
 *  other {{...}} placeholder so nothing unrendered leaks. */
function applyTokens(template: string, values: Record<CampaignToken, string>): string {
  let out = template;
  for (const token of CAMPAIGN_TOKENS) {
    out = out.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), values[token]);
  }
  // Unknown {{tokens}} — strip (privacy: never echo raw placeholders).
  return out.replace(/\{\{[^{}]{0,80}\}\}/g, "").replace(/[ \t]{2,}/g, " ");
}

export async function renderPersonalized(
  template: string,
  customer: { id: string; email: string; firstName: string | null; lastContactAt: Date | null },
  ctx: RenderContext
): Promise<string> {
  const values = await tokenValuesFor(customer, ctx);
  return applyTokens(template, values);
}

/* ── Masked preview (§56 "generates a preview before sending") ── */

export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  return `${local.slice(0, 1) || "*"}***@${domain}`;
}

export type CampaignPreviewRow = { email: string; subject: string; body: string };

export async function getCampaignPreviews(
  campaignId: string,
  n = 3
): Promise<CampaignPreviewRow[]> {
  const campaign = await db.aiCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return [];
  const ctx = await buildRenderContext();

  const materialized = await db.aiCampaignRecipient.findMany({
    where: { campaignId },
    orderBy: { createdAt: "asc" },
    take: n,
  });
  if (materialized.length > 0) {
    return materialized.map((r) => ({
      email: maskEmail(r.email),
      subject: r.subjectRendered ?? campaign.subjectTemplate,
      body: r.bodyRendered ?? campaign.bodyTemplate,
    }));
  }

  // Not materialized yet — render from the LIVE audience.
  const filter = CAMPAIGN_AUDIENCE_SCHEMA.catch({ mode: "all" }).parse(
    jsonLoose(campaign.audienceJson) ?? { mode: "all" }
  );
  const audience = await selectCampaignAudience(filter);
  const rows: CampaignPreviewRow[] = [];
  for (const c of audience.slice(0, Math.max(1, n))) {
    rows.push({
      email: maskEmail(c.email),
      subject: await renderPersonalized(campaign.subjectTemplate, c, ctx),
      body: await renderPersonalized(campaign.bodyTemplate, c, ctx),
    });
  }
  return rows;
}

/* ── Campaign CRUD helpers used by the routes ─────────────── */

export type CampaignRow = {
  id: string;
  name: string;
  goal: string | null;
  audienceJson: unknown;
  subjectTemplate: string;
  bodyTemplate: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  status: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  usedFallback: boolean;
  approvedBy: string | null;
  approvedAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
};

export function toCampaignDto(row: CampaignRow) {
  return {
    id: row.id,
    name: row.name,
    goal: row.goal,
    audience: jsonLoose(row.audienceJson ?? {}) ?? {},
    subjectTemplate: row.subjectTemplate,
    bodyTemplate: row.bodyTemplate,
    ctaLabel: row.ctaLabel,
    ctaUrl: row.ctaUrl,
    status: row.status,
    recipientCount: row.recipientCount,
    sentCount: row.sentCount,
    failedCount: row.failedCount,
    skippedCount: row.skippedCount,
    usedFallback: row.usedFallback,
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    sentAt: row.sentAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createCampaign(input: {
  name: string;
  goal: string | null;
  audience: CampaignAudienceFilter;
  generate: boolean;
}): Promise<{ campaign: ReturnType<typeof toCampaignDto>; content: CampaignContent }> {
  const audience = await selectCampaignAudience(input.audience);
  const content = input.generate
    ? await generateCampaignContent({
        name: input.name,
        goal: input.goal,
        audienceCount: audience.length,
        audienceSample: audience.map((a) => ({ firstName: a.firstName, status: a.status })),
      })
    : { subject: "", body: "", ctaLabel: null, usedFallback: true };

  const row = await db.aiCampaign.create({
    data: {
      name: input.name,
      goal: input.goal,
      audienceJson: input.audience as unknown as never,
      subjectTemplate: content.subject,
      bodyTemplate: content.body,
      ctaLabel: content.ctaLabel,
      status: "draft",
      recipientCount: audience.length,
      generatedBy: input.generate ? "ai" : "manual",
      usedFallback: input.generate ? content.usedFallback : false,
    },
  });
  return { campaign: toCampaignDto(row), content };
}

export async function regenerateCampaignContent(id: string): Promise<ReturnType<typeof toCampaignDto> | null> {
  const campaign = await db.aiCampaign.findUnique({ where: { id } });
  if (!campaign) return null;
  const filter = CAMPAIGN_AUDIENCE_SCHEMA.catch({ mode: "all" }).parse(
    jsonLoose(campaign.audienceJson) ?? { mode: "all" }
  );
  const audience = await selectCampaignAudience(filter);
  const content = await generateCampaignContent({
    name: campaign.name,
    goal: campaign.goal,
    audienceCount: audience.length,
    audienceSample: audience.map((a) => ({ firstName: a.firstName, status: a.status })),
  });
  const updated = await db.aiCampaign.update({
    where: { id },
    data: {
      subjectTemplate: content.subject,
      bodyTemplate: content.body,
      ctaLabel: content.ctaLabel,
      usedFallback: content.usedFallback,
      generatedBy: "ai",
      recipientCount: audience.length,
    },
  });
  return toCampaignDto(updated);
}

export async function approveCampaign(id: string, adminEmail: string): Promise<boolean> {
  const campaign = await db.aiCampaign.findUnique({ where: { id } });
  if (!campaign) return false;
  if (campaign.status !== "draft" && campaign.status !== "pending_approval") return true;
  await db.aiCampaign.update({
    where: { id },
    data: { status: "approved", approvedBy: adminEmail, approvedAt: new Date() },
  });
  await aiAudit("ai.campaign.approved", {
    actor: adminEmail,
    targetId: id,
    meta: { name: campaign.name, recipientCount: campaign.recipientCount },
  });
  return true;
}

/* ── §56 batch send ───────────────────────────────────────── */

export type CampaignSendReport = {
  ok: boolean;
  campaignId: string;
  status: "sent" | "partial" | "failed" | "not_sent";
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  stoppedReason?: string;
  gate: { decision: string; level: string; reasons: string[] };
};

const SEND_SPACING_MS = 150; // §56 rate limit

export async function sendCampaign(
  id: string,
  opts?: { trigger?: "admin" | "cron" | "inquiry" | "chat"; triggerActor?: string }
): Promise<CampaignSendReport> {
  const trigger = opts?.trigger ?? "admin";
  const campaign = await db.aiCampaign.findUnique({ where: { id } });

  const emptyReport = (status: CampaignSendReport["status"], reason: string): CampaignSendReport => ({
    ok: false,
    campaignId: id,
    status,
    total: campaign?.recipientCount ?? 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    stoppedReason: reason,
    gate: { decision: "block", level: "-", reasons: [reason] },
  });

  if (!campaign) return emptyReport("not_sent", "campaign not found");

  // §53/§52 gate — campaign.send with the audience size.
  const gate = await evaluateAction("campaign.send", { emailCount: campaign.recipientCount });

  if (gate.decision === "block") {
    await db.aiCampaign.update({ where: { id }, data: { status: "failed" } }).catch(() => {});
    await recordAction({
      action: "campaign.send",
      trigger,
      level: gate.level,
      status: "blocked",
      draftJson: { campaignId: id, name: campaign.name, recipientCount: campaign.recipientCount },
      error: gate.reasons.join("; "),
    });
    return {
      ...emptyReport("not_sent", gate.reasons.join("; ")),
      gate: { decision: gate.decision, level: gate.level, reasons: gate.reasons },
    };
  }

  if (gate.decision === "needs_approval" && campaign.status !== "approved") {
    // Large campaign in autonomous mode without explicit approval —
    // park it in the action queue for the admin.
    await db.aiCampaign.update({ where: { id }, data: { status: "pending_approval" } }).catch(() => {});
    await recordAction({
      action: "campaign.send",
      trigger,
      level: gate.level,
      status: "pending_approval",
      draftJson: {
        campaignId: id,
        name: campaign.name,
        recipientCount: campaign.recipientCount,
        subjectTemplate: campaign.subjectTemplate,
      },
      error: gate.reasons.join("; "),
    });
    return {
      ...emptyReport("not_sent", gate.reasons.join("; ")),
      gate: { decision: gate.decision, level: gate.level, reasons: gate.reasons },
    };
  }

  // needs_approval + status approved → the admin's explicit approval
  // (approveCampaign) satisfies the requirement; allow → proceed.

  try {
    await db.aiCampaign.update({ where: { id }, data: { status: "sending" } });

    /* ── §57 materialization: per-recipient renders ── */
    let recipients = await db.aiCampaignRecipient.findMany({
      where: { campaignId: id },
      orderBy: { createdAt: "asc" },
    });

    if (recipients.length === 0) {
      const filter = CAMPAIGN_AUDIENCE_SCHEMA.catch({ mode: "all" }).parse(
        jsonLoose(campaign.audienceJson) ?? { mode: "all" }
      );
      const audience = await selectCampaignAudience(filter);
      const ctx = await buildRenderContext();
      for (const c of audience) {
        try {
          const subjectRendered = await renderPersonalized(campaign.subjectTemplate, c, ctx);
          const bodyRendered = await renderPersonalized(campaign.bodyTemplate, c, ctx);
          await db.aiCampaignRecipient.create({
            data: {
              campaignId: id,
              customerId: c.id,
              email: c.email,
              firstName: c.firstName,
              subjectRendered,
              bodyRendered,
              status: "queued",
            },
          }).catch(() => {}); // unique(campaignId,email) — tolerate races
        } catch (err) {
          console.error("[ai-campaigns] recipient render failed:", err);
        }
      }
      recipients = await db.aiCampaignRecipient.findMany({
        where: { campaignId: id },
        orderBy: { createdAt: "asc" },
      });
    }

    const total = recipients.length;
    let sent = 0;
    let failed = 0;
    let skipped = 0;
    let stoppedReason: string | undefined;

    for (const r of recipients) {
      if (r.status !== "queued") {
        if (r.status === "sent") sent += 1;
        else if (r.status === "failed") failed += 1;
        else skipped += 1;
        continue;
      }

      // §52 budget check per batch — stop → partial, remaining queued.
      const budgetUsed = await aiEmailsToday();
      if (budgetUsed + 1 > (await getAutonomyConfigDto()).maxEmailsPerDay) {
        stoppedReason = `daily email budget exhausted (${budgetUsed}) — remaining recipients stay queued`;
        break;
      }

      // §56 rate limit: ≥150ms between sends.
      await new Promise((resolve) => setTimeout(resolve, SEND_SPACING_MS));

      const delivery = await deliverAiEmail({
        type: "ai.campaign",
        to: r.email,
        subject: r.subjectRendered ?? campaign.subjectTemplate,
        bodyText: r.bodyRendered ?? campaign.bodyTemplate,
        ctaText: campaign.ctaLabel,
        ctaUrl: campaign.ctaUrl,
        footerNote: "You're receiving this because you're an Okomba Analytics customer.",
      });

      if (delivery.skipped) {
        await db.aiCampaignRecipient
          .update({ where: { id: r.id }, data: { status: "skipped", error: delivery.error ?? "skipped" } })
          .catch(() => {});
        skipped += 1;
      } else if (delivery.ok) {
        await db.aiCampaignRecipient
          .update({
            where: { id: r.id },
            data: { status: "sent", emailLogId: delivery.emailLogId ?? null, sentAt: new Date() },
          })
          .catch(() => {});
        sent += 1;
      } else {
        await db.aiCampaignRecipient
          .update({
            where: { id: r.id },
            data: { status: "failed", error: delivery.error ?? "delivery failed" },
          })
          .catch(() => {});
        failed += 1;
      }
    }

    const status: CampaignSendReport["status"] =
      stoppedReason || sent + failed + skipped < total
        ? sent > 0
          ? "partial"
          : "failed"
        : failed > 0 && sent === 0
          ? "failed"
          : "sent";

    await db.aiCampaign.update({
      where: { id },
      data: {
        status,
        sentCount: sent,
        failedCount: failed,
        skippedCount: skipped,
        recipientCount: total,
        sentAt: sent > 0 ? new Date() : campaign.sentAt,
      },
    });

    await recordAction({
      action: "campaign.send",
      trigger,
      level: gate.level,
      status: status === "failed" ? "failed" : "executed",
      draftJson: { campaignId: id, name: campaign.name, recipientCount: total },
      resultJson: { sent, failed, skipped, total, status, stoppedReason: stoppedReason ?? null },
      error: status === "failed" ? "no recipients were sent" : null,
    });
    await aiAudit("ai.campaign.sent", {
      actor: opts?.triggerActor ?? "system",
      targetId: id,
      meta: { name: campaign.name, sent, failed, skipped, total, status },
    });

    return {
      ok: status !== "failed",
      campaignId: id,
      status,
      total,
      sent,
      failed,
      skipped,
      stoppedReason,
      gate: { decision: gate.decision, level: gate.level, reasons: gate.reasons },
    };
  } catch (err) {
    console.error("[ai-campaigns] sendCampaign failed:", err);
    await db.aiCampaign.update({ where: { id }, data: { status: "failed" } }).catch(() => {});
    return emptyReport("failed", err instanceof Error ? err.message : "send threw");
  }
}
