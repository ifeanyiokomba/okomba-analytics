import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { jsonLoose } from "@/lib/db";
import { brandedEmailHtml, type EmailBlock } from "@/lib/email-template";
import { deliverWithFailover } from "@/lib/email-failover";
import { aiAudit } from "@/lib/ai-chat-monitor";
import { allowedPriceFigures } from "@/lib/ai-knowledge";
import {
  evaluateAction,
  recordAction,
  aiEmailsToday,
} from "@/lib/ai-autonomy";

/* ─────────────────────────────────────────────────────────────
   BATCH 12 (§55) — SERVER-ONLY AI email autonomy.

   deliverAiEmail(): the AI-side equivalent of notify.ts deliverOne
   (EmailLog row FIRST → provider failover → provider/status written
   back; stub-ok when nothing is configured; honors
   NOTIFICATIONS_ENABLED). Used for EmailLog types "ai.followup"
   and "ai.campaign" — the notify.ts NotificationPayload union is
   closed over the legacy types, so AI emails follow the exact
   notifyAiHandoffRequested pattern instead.

   generateFollowupEmail(): LLM-composed {subject, body} grounded
   on the REAL invoice state, figure-guarded (§51 — only configured
   figures may appear), deterministic fallback template.

   runAiFollowupScan(): processes EventRecord rows of type
   "ai.followup" through the §53 policy gate — bounded (≤20/run),
   idempotent (lastSentAt guard), never throws.
   ───────────────────────────────────────────────────────────── */

const NOTIFICATIONS_ON = process.env.NOTIFICATIONS_ENABLED !== "false";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://okomba.com";

/* ── Shared AI email delivery (§55 delivery result) ───────── */

export type AiEmailDelivery = {
  ok: boolean;
  skipped?: boolean;
  emailLogId?: string;
  provider?: string;
  error?: string;
};

export async function deliverAiEmail(input: {
  type: "ai.followup" | "ai.campaign";
  to: string;
  subject: string;
  bodyText: string;
  ctaText?: string | null;
  ctaUrl?: string | null;
  footerNote?: string;
}): Promise<AiEmailDelivery> {
  if (!NOTIFICATIONS_ON) {
    // Mirrors notify.ts `enabled`: no log row, no delivery attempt.
    return { ok: true, skipped: true, provider: "disabled", error: "notifications disabled" };
  }

  const blocks: EmailBlock[] = [{ kind: "text", text: input.bodyText }];
  const html = brandedEmailHtml({
    title: input.subject,
    preheader: input.bodyText.split("\n").find((l) => l.trim().length > 20) ?? input.subject,
    blocks,
    ...(input.ctaText && input.ctaUrl ? { ctaText: input.ctaText, ctaUrl: input.ctaUrl } : {}),
    footerNote: input.footerNote ?? "Sent by the Okomba Analytics platform.",
  });

  // EmailLog row FIRST (audit trail even when delivery later fails).
  let logId: string | null = null;
  try {
    const created = await db.emailLog.create({
      data: {
        type: input.type,
        recipientEmail: input.to,
        subject: input.subject,
        status: "sent",
        bodyText: input.bodyText,
        bodyHtml: html,
      },
      select: { id: true },
    });
    logId = created.id;
  } catch (err) {
    console.error("[ai-email] EmailLog persist failed:", err);
  }

  try {
    const result = await deliverWithFailover({
      to: input.to,
      subject: input.subject,
      bodyHtml: html,
      bodyText: input.bodyText,
      attachments: [],
      type: input.type,
      legacyAction: "sendEmail",
    });
    if (logId) {
      await db.emailLog
        .updateMany({
          where: { id: logId },
          data: {
            provider: result.provider,
            ...(result.ok ? {} : { status: "failed", error: result.error ?? "delivery failed" }),
          },
        })
        .catch(() => {});
    }
    if (!result.ok) {
      return { ok: false, emailLogId: logId ?? undefined, provider: result.provider, error: result.error };
    }
    return { ok: true, emailLogId: logId ?? undefined, provider: result.provider };
  } catch (err) {
    console.error("[ai-email] delivery threw:", err);
    return {
      ok: false,
      emailLogId: logId ?? undefined,
      error: err instanceof Error ? err.message : "delivery failed",
    };
  }
}

/* ── LLM plumbing (house pattern from src/lib/proposal.ts) ── */

function extractJson(text: string): unknown | null {
  if (!text) return null;
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

/* §51 figure guard: any ₦/NGN figure outside the configured set is
 * rewritten to the house "custom proposal" wording. */
const FIGURE_RE = /(?:₦|NGN\s?)([\d,]+(?:\.\d+)?)/gi;

export function guardFigures(text: string, allowed: Set<number>): string {
  return text.replace(FIGURE_RE, (match, raw: string) => {
    const n = Number(String(raw).replace(/,/g, ""));
    if (Number.isFinite(n) && allowed.has(n)) return match;
    return "custom (in your proposal)";
  });
}

/* ── §55 follow-up email generation ───────────────────────── */

export type FollowupEmailInput = {
  customer: { firstName: string; email: string };
  invoice: { invoiceNumber: string; status: string; dueDate?: string | null } | null;
  service: string;
};

export type GeneratedEmail = {
  subject: string;
  body: string;
  usedFallback: boolean;
};

function fallbackFollowupEmail(input: FollowupEmailInput): { subject: string; body: string } {
  const first = input.customer.firstName || "there";
  const svc = input.service || "your project";
  return {
    subject: input.invoice
      ? `Following up on your ${svc} proposal (${input.invoice.invoiceNumber})`
      : `Following up on your ${svc} proposal`,
    body: [
      `Hi ${first},`,
      ``,
      `Following up on your ${svc} proposal${
        input.invoice ? ` (invoice ${input.invoice.invoiceNumber})` : ""
      }. We'd love to answer any questions and get the engagement moving whenever you're ready.`,
      ``,
      `Reply to this email or reach out through the contact page and we'll take it from there.`,
      ``,
      `— Okomba Analytics`,
    ].join("\n"),
  };
}

export async function generateFollowupEmail(input: FollowupEmailInput): Promise<GeneratedEmail> {
  const allowed = await allowedPriceFigures();
  try {
    const prompt = [
      `You write short, warm, professional follow-up emails for Okomba Analytics (a Nigerian digital products & analytics studio).`,
      ``,
      `Recipient first name: ${input.customer.firstName || "there"}`,
      `Service: ${input.service || "an Okomba Analytics engagement"}`,
      input.invoice
        ? [
            `Invoice state (REAL data — ground the email on it):`,
            `- Invoice number: ${input.invoice.invoiceNumber}`,
            `- Status: ${input.invoice.status}`,
            input.invoice.dueDate ? `- Due date: ${input.invoice.dueDate}` : "",
            ``,
          ]
            .filter(Boolean)
            .join("\n")
        : `No invoice is open for this customer yet — a proposal discussion is still pending.`,
      ``,
      `Write a follow-up email. Return STRICT JSON with exactly these keys:`,
      `{ "subject": "3-8 words, no pricing", "body": "plain text, 3-6 short lines, greeting 'Hi {firstName}' … sign-off '— Okomba Analytics'" }`,
      ``,
      `RULES:`,
      `- NEVER mention price, cost, fees, amounts, naira figures or NGN — commercial terms are human-owned.`,
      `- Never reference other customers or invent project details.`,
      `- One clear next step (reply / book a call). JSON only, no markdown fences.`,
    ]
      .filter(Boolean)
      .join("\n");

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content:
            "You are a courteous consultant at Okomba Analytics who writes concise follow-up emails. You output strict JSON only.",
        },
        { role: "user", content: prompt },
      ],
      thinking: { type: "disabled" },
    });
    const raw = extractJson(completion.choices[0]?.message?.content ?? "");
    if (raw && typeof raw === "object") {
      const r = raw as Record<string, unknown>;
      const subject = typeof r.subject === "string" ? r.subject.trim().slice(0, 120) : "";
      const body = typeof r.body === "string" ? r.body.trim().slice(0, 4000) : "";
      if (subject.length >= 3 && body.length >= 20) {
        return {
          subject: guardFigures(subject, allowed),
          body: guardFigures(body, allowed),
          usedFallback: false,
        };
      }
    }
    const fb = fallbackFollowupEmail(input);
    return { ...fb, usedFallback: true };
  } catch (err) {
    console.error("[ai-email] followup generation failed, using fallback:", err);
    const fb = fallbackFollowupEmail(input);
    return { ...fb, usedFallback: true };
  }
}

/* ── §55 follow-up scan (cron + manual) ───────────────────── */

export type FollowupScanReport = {
  trigger: string;
  ranAt: string;
  scanned: number;
  sent: number;
  parked: number;
  blocked: number;
  skipped: number;
  failed: number;
  budgetUsed: number;
};

const MAX_FOLLOWUPS_PER_RUN = 20;
/** Events older than this are considered stale and skipped. */
const FOLLOWUP_LOOKBACK_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

export async function runAiFollowupScan(opts?: { trigger?: string }): Promise<FollowupScanReport> {
  const trigger = opts?.trigger ?? "manual";
  const now = new Date();
  const report: FollowupScanReport = {
    trigger,
    ranAt: now.toISOString(),
    scanned: 0,
    sent: 0,
    parked: 0,
    blocked: 0,
    skipped: 0,
    failed: 0,
    budgetUsed: 0,
  };

  try {
    const events = await db.eventRecord.findMany({
      where: {
        type: "ai.followup",
        status: "scheduled",
        eventDate: { lte: now, gte: new Date(now.getTime() - FOLLOWUP_LOOKBACK_MS) },
      },
      orderBy: { eventDate: "asc" },
      take: MAX_FOLLOWUPS_PER_RUN,
    });
    report.scanned = events.length;
    report.budgetUsed = await aiEmailsToday();

    for (const ev of events) {
      try {
        const payload = (jsonLoose(ev.payload ?? {}) ?? {}) as Record<string, unknown>;
        const customerEmail = (typeof payload.customerEmail === "string" && payload.customerEmail) || ev.customerEmail;
        if (!customerEmail) {
          await db.eventRecord.update({
            where: { id: ev.id },
            data: { status: "skipped", processedAt: new Date() },
          }).catch(() => {});
          report.skipped += 1;
          continue;
        }

        const customer = await db.customer.findUnique({ where: { email: customerEmail } });
        const invoice = await db.invoice.findFirst({
          where: { customerEmail },
          orderBy: { createdAt: "desc" },
          select: { invoiceNumber: true, status: true, dueDate: true, service: true },
        });
        const service =
          (typeof payload.service === "string" && payload.service) ||
          invoice?.service ||
          (customer ? "their engagement" : "your project");

        const gate = await evaluateAction("email.followup", { customerEmail, service });
        report.budgetUsed = await aiEmailsToday();

        const generated = await generateFollowupEmail({
          customer: { firstName: customer?.firstName ?? "there", email: customerEmail },
          invoice: invoice
            ? {
                invoiceNumber: invoice.invoiceNumber,
                status: invoice.status,
                dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
              }
            : null,
          service,
        });

        const draftJson = {
          to: customerEmail,
          subject: generated.subject,
          body: generated.body,
          service,
          invoiceNumber: invoice?.invoiceNumber ?? null,
          purpose: payload.purpose ?? "proposal_followup",
          eventId: ev.id,
        };

        if (gate.decision === "block") {
          // Budget / allowlist / prohibited — never send, record why.
          await recordAction({
            action: "email.followup",
            trigger: trigger === "cron" ? "cron" : "admin",
            level: gate.level,
            status: "blocked",
            customerEmail,
            draftJson,
            model: generated.usedFallback ? "fallback-template" : "zai-chat",
            error: gate.reasons.join("; "),
          });
          await db.eventRecord.update({
            where: { id: ev.id },
            data: { status: "skipped", processedAt: new Date() },
          }).catch(() => {});
          report.blocked += 1;
          continue;
        }

        if (gate.decision === "needs_approval") {
          // Content generated + parked for the admin approval queue.
          // The EventRecord is consumed so the scan never duplicates
          // the parked content; approving re-sends from AiActionLog.
          await recordAction({
            action: "email.followup",
            trigger: trigger === "cron" ? "cron" : "admin",
            level: gate.level,
            status: gate.level === "suggest" ? "suggested" : "pending_approval",
            customerEmail,
            draftJson,
            model: generated.usedFallback ? "fallback-template" : "zai-chat",
            error: gate.reasons.join("; "),
          });
          await db.eventRecord.update({
            where: { id: ev.id },
            data: { status: "processed", processedAt: new Date() },
          }).catch(() => {});
          report.parked += 1;
          continue;
        }

        // allow → send
        const delivery = await deliverAiEmail({
          type: "ai.followup",
          to: customerEmail,
          subject: generated.subject,
          bodyText: generated.body,
        });

        await recordAction({
          action: "email.followup",
          trigger: trigger === "cron" ? "cron" : "admin",
          level: gate.level,
          status: delivery.ok && !delivery.skipped ? "executed" : "failed",
          customerEmail,
          draftJson,
          resultJson: {
            emailLogId: delivery.emailLogId ?? null,
            provider: delivery.provider ?? null,
            ok: delivery.ok,
            skipped: delivery.skipped ?? false,
            error: delivery.error ?? null,
          },
          model: generated.usedFallback ? "fallback-template" : "zai-chat",
          error: delivery.ok ? null : delivery.error ?? "delivery failed",
        });

        if (delivery.ok) {
          await db.eventRecord.update({
            where: { id: ev.id },
            data: { status: "processed", processedAt: new Date(), lastSentAt: new Date() },
          }).catch(() => {});
          await aiAudit("ai.workflow.followup_sent", {
            targetId: ev.id,
            meta: { customerEmail, emailLogId: delivery.emailLogId ?? null, provider: delivery.provider ?? null },
          });
          report.sent += 1;
        } else {
          // Delivery failed — leave scheduled for a retry on the next scan.
          report.failed += 1;
        }
      } catch (err) {
        console.error("[ai-email] followup event failed:", err);
        report.failed += 1;
      }
    }
  } catch (err) {
    console.error("[ai-email] runAiFollowupScan failed:", err);
  }

  return report;
}
