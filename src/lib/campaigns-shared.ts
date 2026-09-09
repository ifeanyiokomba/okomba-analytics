/* ─────────────────────────────────────────────────────────────
   BATCH 12 (§52–§57) — CLIENT-SAFE autonomy/campaign vocabulary.

   Client mirror of the server-only src/lib/ai-autonomy.ts +
   src/lib/ai-campaigns.ts + src/lib/ai-workflow.ts projections
   (same Turbopack lesson as chat-shared: a client component
   importing a module that transitively pulls Prisma drags the
   engine into the browser bundle). Admin tabs import THIS file;
   route handlers keep their server-side definitions.
   ───────────────────────────────────────────────────────────── */

/* ── §52/§53 Autonomy config vocabulary ───────────────────── */

export const AI_ACTIONS = [
  "proposal.draft",
  "proposal.send",
  "email.followup",
  "campaign.send",
  "followup.schedule",
] as const;
export type AiAction = (typeof AI_ACTIONS)[number];

export const AI_LEVELS = ["suggest", "review", "semi_autonomous", "autonomous"] as const;
export type AiLevel = (typeof AI_LEVELS)[number];

export type EscalationRules = {
  onFallback: boolean;
  onLowConfidence: boolean;
  campaignsAboveRecipientCount: number;
  pricingMissing: boolean;
};

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

/** §52 SAFE defaults — the "SAFE DEFAULTS" restore button PUTs this. */
export const DEFAULT_AUTONOMY: Omit<AutonomyConfigDto, "updatedAt"> = {
  enabled: false,
  levels: {
    "proposal.draft": "suggest",
    "proposal.send": "review",
    "email.followup": "review",
    "campaign.send": "review",
    "followup.schedule": "semi_autonomous",
  },
  maxEmailsPerDay: 50,
  allowedRecipients: [],
  allowedServices: [],
  escalationRules: {
    onFallback: true,
    onLowConfidence: true,
    campaignsAboveRecipientCount: 10,
    pricingMissing: true,
  },
  prohibitedActions: ["refund", "price_change", "data_delete", "customer_merge"],
};

/** Level chips (§53): suggest=gray · review=amber · semi=teal · autonomous=gold. */
export const AI_LEVEL_META: Record<AiLevel, { label: string; chip: string; dot: string; hint: string }> = {
  suggest: {
    label: "Suggest",
    chip: "border-white/15 bg-white/[0.04] text-muted-foreground",
    dot: "bg-white/40",
    hint: "AI prepares the work — a human does the action",
  },
  review: {
    label: "Review",
    chip: "border-amber-400/35 bg-amber-400/10 text-amber-300",
    dot: "bg-amber-400",
    hint: "AI prepares and waits in the approval queue",
  },
  semi_autonomous: {
    label: "Semi-auto",
    chip: "border-teal/35 bg-teal-dim text-teal",
    dot: "bg-teal",
    hint: "AI acts — edge cases escalate to a human",
  },
  autonomous: {
    label: "Autonomous",
    chip: "border-gold/45 bg-gold-dim text-gold",
    dot: "bg-gold",
    hint: "AI acts without asking (within the guardrails)",
  },
};

export const AI_ACTION_LABELS: Record<AiAction, string> = {
  "proposal.draft": "Proposal draft",
  "proposal.send": "Proposal send",
  "email.followup": "Follow-up email",
  "campaign.send": "Campaign send",
  "followup.schedule": "Follow-up scheduling",
};

/* ── §53/§55 AI action ledger (approval queue + activity) ── */

export const AI_ACTION_STATUSES = [
  "suggested",
  "pending_approval",
  "executing",
  "executed",
  "declined",
  "blocked",
  "failed",
] as const;
export type AiActionStatus = (typeof AI_ACTION_STATUSES)[number];

export type AiActionSummary = {
  id: string;
  action: string;
  trigger: string;
  level: string;
  status: string;
  customerEmail: string | null;
  inquiryId: string | null;
  draftJson: Record<string, unknown> | null;
  resultJson: Record<string, unknown> | null;
  model: string | null;
  error: string | null;
  actor: string | null;
  createdAt: string;
  updatedAt: string;
};

export const AI_ACTION_STATUS_STYLES: Record<string, string> = {
  executed: "border-teal/35 bg-teal-dim text-teal",
  pending_approval: "border-amber-400/35 bg-amber-400/10 text-amber-300",
  executing: "border-gold/45 bg-gold-dim text-gold",
  suggested: "border-white/15 bg-white/[0.04] text-muted-foreground",
  declined: "border-red-500/30 bg-red-500/10 text-red-300",
  blocked: "border-red-500/30 bg-red-500/10 text-red-300",
  failed: "border-red-500/30 bg-red-500/10 text-red-300",
};

export const AI_ACTION_STATUS_LABELS: Record<string, string> = {
  executed: "Executed",
  pending_approval: "Awaiting approval",
  executing: "Executing",
  suggested: "Suggested",
  declined: "Declined",
  blocked: "Blocked",
  failed: "Failed",
};

/* ── §54 Workflow report (manual run dialog) ─────────────── */

export type WorkflowStepStatus =
  | "ok"
  | "skipped"
  | "failed"
  | "suggested"
  | "pending_approval"
  | "executing"
  | "executed"
  | "blocked"
  | "parked";

export type WorkflowStep = {
  step: string;
  status: WorkflowStepStatus;
  detail: string;
  data?: Record<string, unknown>;
};

export type WorkflowReport = {
  ok: boolean;
  inquiryId: string;
  trigger: string;
  workflowRunId: string;
  steps: WorkflowStep[];
  outcome: string;
  draftProposalId?: string;
  actionLogId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
};

export const WORKFLOW_STEP_STYLES: Record<string, { dot: string; label: string }> = {
  ok: { dot: "bg-teal", label: "ok" },
  executed: { dot: "bg-teal", label: "executed" },
  skipped: { dot: "bg-white/35", label: "skipped" },
  suggested: { dot: "bg-white/35", label: "suggested" },
  pending_approval: { dot: "bg-amber-400", label: "parked for approval" },
  parked: { dot: "bg-amber-400", label: "parked" },
  executing: { dot: "bg-gold animate-pulse", label: "executing" },
  failed: { dot: "bg-red-400", label: "failed" },
  blocked: { dot: "bg-red-400", label: "blocked" },
};

/** The §54 chain — compact explainer strip in the Autonomy sub-tab. */
export const WORKFLOW_CHAIN: { key: string; label: string }[] = [
  { key: "crm_context", label: "Understand need + CRM" },
  { key: "service_match", label: "Service match" },
  { key: "pricing", label: "Pricing check" },
  { key: "proposal_draft", label: "Draft" },
  { key: "proposal_send", label: "Send (per policy)" },
  { key: "followup_schedule", label: "Follow-up" },
  { key: "audit", label: "Audit" },
];

/* ── §56 Campaigns ───────────────────────────────────────── */

export const CAMPAIGN_AUDIENCE_MODES = [
  "all",
  "status",
  "tag",
  "country",
  "service",
  "custom",
] as const;
export type CampaignAudienceMode = (typeof CAMPAIGN_AUDIENCE_MODES)[number];

export type CampaignAudienceFilter = {
  mode: CampaignAudienceMode;
  status?: string;
  tag?: string;
  country?: string;
  service?: string;
  q?: string;
};

export const CAMPAIGN_MODE_LABELS: Record<CampaignAudienceMode, string> = {
  all: "All customers",
  status: "By lifecycle status",
  tag: "By tag",
  country: "By country",
  service: "By service",
  custom: "Custom search",
};

export type AudienceOption = { value: string; count: number };

export type AudienceOptions = {
  statuses: AudienceOption[];
  tags: AudienceOption[];
  countries: AudienceOption[];
  services: AudienceOption[];
  customerTotal?: number;
};

export type AudienceSampleRow = {
  firstName: string | null;
  status: string;
  countryCode: string | null;
};

export type AudiencePreview = {
  ok: boolean;
  count: number;
  sample: AudienceSampleRow[];
};

export type CampaignSummary = {
  id: string;
  name: string;
  goal: string | null;
  audience: Record<string, unknown>;
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
  approvedAt: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type CampaignContent = {
  subject: string;
  body: string;
  ctaLabel: string | null;
  usedFallback: boolean;
};

export type CampaignPreviewRow = { email: string; subject: string; body: string };

export type CampaignRecipientRow = {
  id: string;
  email: string;
  firstName: string | null;
  status: string;
  emailLogId: string | null;
  error: string | null;
  sentAt: string | null;
  subjectRendered: string | null;
  bodyRendered: string | null;
};

export type CampaignSendReport = {
  ok: boolean;
  campaignId: string;
  status: "sent" | "partial" | "failed" | "not_sent" | string;
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  stoppedReason?: string | null;
  gate?: { decision: string; level: string; reasons: string[] };
};

export const CAMPAIGN_STATUS_STYLES: Record<string, string> = {
  draft: "border-white/15 bg-white/[0.04] text-muted-foreground",
  pending_approval: "border-amber-400/35 bg-amber-400/10 text-amber-300",
  approved: "border-teal/35 bg-teal-dim text-teal",
  sending: "border-gold/45 bg-gold-dim text-gold",
  sent: "border-gold/45 bg-gold-dim text-gold",
  partial: "border-orange-400/35 bg-orange-400/10 text-orange-300",
  failed: "border-red-500/30 bg-red-500/10 text-red-300",
};

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Awaiting approval",
  approved: "Approved",
  sending: "Sending",
  sent: "Sent",
  partial: "Partially sent",
  failed: "Failed",
};

/* ── §57 personalization tokens ──────────────────────────── */

/** Client mirror of the server maskEmail (§56 previews/§57 privacy). */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  return `${local.slice(0, 1) || "*"}***@${domain}`;
}

/** Audience summary label for list rows + detail meta. */
export function campaignAudienceSummary(audience: Record<string, unknown>): string {
  const mode = String(audience.mode ?? "all") as CampaignAudienceMode;
  const detail = audience.status ?? audience.tag ?? audience.country ?? audience.service ?? audience.q;
  const label = CAMPAIGN_MODE_LABELS[mode] ?? mode;
  return typeof detail === "string" && detail ? `${label} · ${detail}` : label;
}

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

export const CAMPAIGN_TOKEN_HELP: Record<CampaignToken, string> = {
  firstName: "The recipient's own first name",
  service: "Their latest service (from their invoices/inquiries)",
  invoiceState: "Their open/paid/overdue invoice picture",
  lastInteraction: "How long since your last contact",
  event: "The next public Okomba event",
  course: "The next education program",
  proposal: "How many proposals they've had",
};
