import { z } from "zod";
import { db } from "@/lib/db";
import { jsonLoose } from "@/lib/db";

/* ─────────────────────────────────────────────────────────────
   BATCH 12 (§52/§53) — SERVER-ONLY AI autonomy policy engine.

   One singleton row (AiAutonomyConfig, id="singleton", the
   AiKnowledge pattern): master switch, per-action approval level,
   daily email budget, recipient/service allowlists, escalation
   rules and the never-do list. evaluateAction() is the single gate
   every autonomous step must pass before executing — block /
   needs_approval / allow — with machine-readable reasons.

   SAFE defaults ship autonomy DARK: enabled=false, every action
   "review" (AI prepares, a human approves) except proposal.draft
   ("suggest" — drafting is always allowed, sending never is).
   ───────────────────────────────────────────────────────────── */

/* ── Vocabulary (§53) ─────────────────────────────────────── */

export const AI_ACTIONS = [
  "proposal.draft",
  "proposal.send",
  "email.followup",
  "campaign.send",
  "followup.schedule",
] as const;
export type AiAction = (typeof AI_ACTIONS)[number];

export const AI_LEVELS = [
  "suggest",
  "review",
  "semi_autonomous",
  "autonomous",
] as const;
export type AiLevel = (typeof AI_LEVELS)[number];

/* Email-bearing actions — the §52 daily budget applies to these. */
const EMAIL_ACTIONS: ReadonlySet<string> = new Set([
  "proposal.send",
  "email.followup",
  "campaign.send",
]);

export type EscalationRules = {
  onFallback: boolean;
  onLowConfidence: boolean;
  campaignsAboveRecipientCount: number;
  pricingMissing: boolean;
};

export const ESCALATION_RULES_SCHEMA = z.object({
  onFallback: z.boolean().optional(),
  onLowConfidence: z.boolean().optional(),
  campaignsAboveRecipientCount: z.number().int().min(0).max(100000).optional(),
  pricingMissing: z.boolean().optional(),
});

/* ── SAFE defaults (§52 hints, self-seeded on first read) ── */

const DEFAULT_LEVELS: Record<AiAction, AiLevel> = {
  "proposal.draft": "suggest", // drafts are always safe to produce
  "proposal.send": "review",
  "email.followup": "review",
  "campaign.send": "review",
  "followup.schedule": "semi_autonomous", // internal EventRecord only — no outbound email
};

export const DEFAULT_ESCALATION_RULES: EscalationRules = {
  onFallback: true,
  onLowConfidence: true,
  campaignsAboveRecipientCount: 10,
  pricingMissing: true,
};

export const DEFAULT_PROHIBITED_ACTIONS = [
  "refund",
  "price_change",
  "data_delete",
  "customer_merge",
] as const;

/* ── Singleton access (AiKnowledge pattern) ──────────────── */

const SINGLETON_ID = "singleton";

export async function getAutonomyConfig() {
  const existing = await db.aiAutonomyConfig.findUnique({ where: { id: SINGLETON_ID } });
  if (existing) return existing;
  return db.aiAutonomyConfig.create({
    data: {
      id: SINGLETON_ID,
      enabled: false,
      levelsJson: DEFAULT_LEVELS as unknown as never,
      maxEmailsPerDay: 50,
      allowedRecipientsJson: [] as unknown as never,
      allowedServicesJson: [] as unknown as never,
      escalationRulesJson: DEFAULT_ESCALATION_RULES as unknown as never,
      prohibitedActionsJson: [...DEFAULT_PROHIBITED_ACTIONS] as unknown as never,
    },
  });
}

/* ── Typed projection (Json columns → validated shapes) ──── */

export type AutonomyConfigDto = {
  enabled: boolean;
  levels: Record<AiAction, AiLevel>;
  maxEmailsPerDay: number;
  allowedRecipients: string[];
  allowedServices: string[];
  escalationRules: EscalationRules;
  prohibitedActions: string[];
  updatedAt: string;
};

type AutonomyRow = {
  enabled: boolean;
  levelsJson: unknown;
  maxEmailsPerDay: number;
  allowedRecipientsJson: unknown;
  allowedServicesJson: unknown;
  escalationRulesJson: unknown;
  prohibitedActionsJson: unknown;
  updatedAt: Date;
};

/** Partial record of action → level: any subset of the known action
 *  keys (zod v4's exhaustive z.record(z.enum…) would force ALL keys). */
const LEVELS_SCHEMA = z
  .record(z.string(), z.enum(AI_LEVELS))
  .refine(
    (rec) => Object.keys(rec).every((k) => (AI_ACTIONS as readonly string[]).includes(k)),
    { message: "levels contains an unknown action key" }
  );

export function toAutonomyDto(row: AutonomyRow): AutonomyConfigDto {
  const storedLevels = LEVELS_SCHEMA.catch({}).parse(jsonLoose(row.levelsJson) ?? {});
  const levels: Record<AiAction, AiLevel> = { ...DEFAULT_LEVELS };
  for (const action of AI_ACTIONS) {
    const v = storedLevels[action];
    if (v) levels[action] = v;
  }
  const rules = ESCALATION_RULES_SCHEMA.catch({}).parse(jsonLoose(row.escalationRulesJson) ?? {});
  return {
    enabled: row.enabled,
    levels,
    maxEmailsPerDay: Number.isFinite(row.maxEmailsPerDay) ? row.maxEmailsPerDay : 50,
    allowedRecipients: z.array(z.string()).catch([]).parse(jsonLoose(row.allowedRecipientsJson) ?? []),
    allowedServices: z.array(z.string()).catch([]).parse(jsonLoose(row.allowedServicesJson) ?? []),
    escalationRules: { ...DEFAULT_ESCALATION_RULES, ...rules },
    prohibitedActions: z.array(z.string()).catch([]).parse(jsonLoose(row.prohibitedActionsJson) ?? []),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getAutonomyConfigDto(): Promise<AutonomyConfigDto> {
  return toAutonomyDto(await getAutonomyConfig());
}

/* ── Partial update (no defaults — untouched sections never reset) ── */

/** PUT /api/admin/ai/autonomy body — every field optional. Levels
 *  and escalationRules MERGE with the stored value (partial PUT,
 *  AiKnowledge pattern); arrays replace wholesale. */
export const AUTONOMY_UPDATE_SCHEMA = z.object({
  enabled: z.boolean().optional(),
  levels: LEVELS_SCHEMA.optional(),
  maxEmailsPerDay: z.number().int().min(0).max(10000).optional(),
  allowedRecipients: z.array(z.string().trim().min(1).max(200)).max(200).optional(),
  allowedServices: z.array(z.string().trim().min(1).max(120)).max(200).optional(),
  escalationRules: ESCALATION_RULES_SCHEMA.optional(),
  prohibitedActions: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
});

export type AutonomyUpdateInput = z.infer<typeof AUTONOMY_UPDATE_SCHEMA>;

export async function updateAutonomyConfig(input: AutonomyUpdateInput): Promise<void> {
  const current = await getAutonomyConfigDto(); // ensure row + typed view
  const mergedLevels = { ...current.levels, ...(input.levels ?? {}) };
  const mergedRules = { ...current.escalationRules, ...(input.escalationRules ?? {}) };
  await db.aiAutonomyConfig.update({
    where: { id: SINGLETON_ID },
    data: {
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.levels !== undefined ? { levelsJson: mergedLevels as unknown as never } : {}),
      ...(input.maxEmailsPerDay !== undefined ? { maxEmailsPerDay: input.maxEmailsPerDay } : {}),
      ...(input.allowedRecipients !== undefined
        ? { allowedRecipientsJson: input.allowedRecipients as unknown as never }
        : {}),
      ...(input.allowedServices !== undefined
        ? { allowedServicesJson: input.allowedServices as unknown as never }
        : {}),
      ...(input.escalationRules !== undefined
        ? { escalationRulesJson: mergedRules as unknown as never }
        : {}),
      ...(input.prohibitedActions !== undefined
        ? { prohibitedActionsJson: input.prohibitedActions as unknown as never }
        : {}),
    },
  });
}

/* ── §52 budget: AI-originated emails sent "today" ─────────── */

const AI_EMAIL_LOG_TYPES = ["ai.followup", "ai.campaign"];
/** Lagos-midnight boundary — the same clock the 09:00 WAT cron runs on. */
function lagosDayStart(now = new Date()): Date {
  const lagos = new Date(now.getTime() + 60 * 60 * 1000); // UTC+1, no DST
  return new Date(
    Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate()) - 60 * 60 * 1000
  );
}

export async function aiEmailsToday(): Promise<number> {
  const dayStart = lagosDayStart();
  try {
    const [emailLogs, actionLogs] = await Promise.all([
      db.emailLog.count({
        where: { type: { in: AI_EMAIL_LOG_TYPES }, sentAt: { gte: dayStart } },
      }),
      db.aiActionLog.findMany({
        where: {
          status: "executed",
          action: { in: ["email.followup", "campaign.send"] },
          createdAt: { gte: dayStart },
          // Rows whose delivery wrote an EmailLog are counted above —
          // only count the ones where the log was NOT written (e.g.
          // notifications disabled) so the budget never double-counts.
        },
        select: { resultJson: true },
        take: 500,
      }),
    ]);
    const unlogged = actionLogs.filter((r) => {
      const res = jsonLoose(r.resultJson ?? {}) as Record<string, unknown>;
      return !res || typeof res !== "object" || res.emailLogId == null;
    }).length;
    return emailLogs + unlogged;
  } catch (err) {
    console.error("[ai-autonomy] aiEmailsToday failed:", err);
    return 0;
  }
}

/* ── Allowlist matching ───────────────────────────────────── */

function recipientAllowed(email: string, allowlist: string[]): boolean {
  if (allowlist.length === 0) return true;
  const target = email.trim().toLowerCase();
  return allowlist.some((entry) => {
    const e = entry.trim().toLowerCase();
    if (!e) return false;
    if (e.startsWith("@")) return target.endsWith(e); // domain rule
    if (e.includes("@")) return target === e; // exact address
    return target.endsWith(`@${e}`) || target === e; // bare domain
  });
}

function serviceAllowed(service: string, allowlist: string[]): boolean {
  if (allowlist.length === 0) return true;
  const target = service.trim().toLowerCase();
  return allowlist.some((entry) => {
    const e = entry.trim().toLowerCase();
    if (!e) return false;
    return target === e || target.includes(e) || e.includes(target);
  });
}

/* ── §53 evaluateAction — THE gate ───────────────────────── */

export type AiDecision = "allow" | "needs_approval" | "block";

export type EvaluateResult = {
  decision: AiDecision;
  level: AiLevel;
  reasons: string[];
  /** Present for email actions so callers can surface the budget state. */
  emailsToday?: number;
};

export async function evaluateAction(
  action: AiAction,
  input?: { customerEmail?: string | null; service?: string | null; emailCount?: number | null }
): Promise<EvaluateResult> {
  const cfg = await getAutonomyConfigDto();
  const level = cfg.levels[action] ?? "review";
  const reasons: string[] = [];

  // §52 master switch OFF → suggest-only semantics: drafts may still
  // be produced (the human always reviews), every outbound action is
  // parked for approval. Nothing executes unattended.
  if (!cfg.enabled && action !== "proposal.draft") {
    return {
      decision: "needs_approval",
      level,
      reasons: ["autonomy disabled — AI actions require human approval"],
    };
  }

  // §52 never-do list: an explicitly prohibited action never runs.
  if (cfg.prohibitedActions.some((p) => p.trim().toLowerCase() === action.toLowerCase())) {
    return { decision: "block", level, reasons: [`action "${action}" is prohibited (never-do list)`] };
  }

  // §52 allowlists (empty = unrestricted).
  if (input?.customerEmail && !recipientAllowed(input.customerEmail, cfg.allowedRecipients)) {
    reasons.push(`recipient ${input.customerEmail} is not in the allowed recipients list`);
  }
  if (input?.service && !serviceAllowed(input.service, cfg.allowedServices)) {
    reasons.push(`service "${input.service}" is not in the allowed services list`);
  }
  if (reasons.length) {
    return { decision: "block", level, reasons };
  }

  // §52 daily email budget — hard stop for outbound email actions.
  if (EMAIL_ACTIONS.has(action)) {
    const emailsToday = await aiEmailsToday();
    const planned = Math.max(1, input?.emailCount ?? 1);
    if (emailsToday + planned > cfg.maxEmailsPerDay) {
      return {
        decision: "block",
        level,
        reasons: [`daily email budget exhausted (${emailsToday}/${cfg.maxEmailsPerDay})`],
        emailsToday,
      };
    }
  }

  // §53 level semantics.
  switch (level) {
    case "suggest":
      if (action === "proposal.draft") {
        return { decision: "allow", level, reasons: ["suggest level — drafting only"] };
      }
      return { decision: "needs_approval", level, reasons: ["suggest level — AI drafts only, execution requires human action"] };
    case "review":
      return { decision: "needs_approval", level, reasons: ["review level — approval required"] };
    case "semi_autonomous":
    case "autonomous": {
      if (level === "semi_autonomous") {
        // §53: "safe actions within configured boundaries" — the
        // boundaries were checked above (allowlists + budget); a
        // campaign above the escalation threshold still escalates.
        if (action === "campaign.send") {
          const count = input?.emailCount ?? 0;
          if (count > cfg.escalationRules.campaignsAboveRecipientCount) {
            return {
              decision: "needs_approval",
              level,
              reasons: [
                `campaign audience (${count}) exceeds the semi-autonomous threshold (${cfg.escalationRules.campaignsAboveRecipientCount}) — approval required`,
              ],
            };
          }
        }
      } else if (action === "campaign.send") {
        // Autonomous mode: the §52 escalation rule still forces
        // approval for large campaigns, even without a human in the loop.
        const count = input?.emailCount ?? 0;
        if (count > cfg.escalationRules.campaignsAboveRecipientCount) {
          return {
            decision: "needs_approval",
            level,
            reasons: [
              `campaign audience (${count}) above escalation threshold (${cfg.escalationRules.campaignsAboveRecipientCount}) — approval required even in autonomous mode`,
            ],
          };
        }
      }
      return {
        decision: "allow",
        level,
        reasons: [`${level} level — within configured boundaries`],
      };
    }
    default:
      return { decision: "needs_approval", level: "review", reasons: ["unknown level — defaulting to review"] };
  }
}

/* ── AiActionLog helpers (shared by every autonomous module) ── */

export type ActionStatus =
  | "suggested"
  | "pending_approval"
  | "executing"
  | "executed"
  | "declined"
  | "blocked"
  | "failed";

export async function recordAction(input: {
  action: AiAction;
  trigger: "inquiry" | "admin" | "cron" | "chat";
  level: AiLevel;
  status: ActionStatus;
  customerEmail?: string | null;
  inquiryId?: string | null;
  draftJson?: Record<string, unknown> | null;
  resultJson?: Record<string, unknown> | null;
  model?: string | null;
  error?: string | null;
  actor?: string | null;
}): Promise<string | null> {
  try {
    const row = await db.aiActionLog.create({
      data: {
        action: input.action,
        trigger: input.trigger,
        level: input.level,
        status: input.status,
        customerEmail: input.customerEmail ?? null,
        inquiryId: input.inquiryId ?? null,
        draftJson: (input.draftJson ?? undefined) as never,
        resultJson: (input.resultJson ?? undefined) as never,
        model: input.model ?? null,
        error: input.error ?? null,
        actor: input.actor ?? null,
      },
      select: { id: true },
    });
    return row.id;
  } catch (err) {
    console.error("[ai-autonomy] recordAction failed:", err);
    return null;
  }
}
