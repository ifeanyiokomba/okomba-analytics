import { db } from "@/lib/db";
import { jsonLoose } from "@/lib/db";
import { aiAudit } from "@/lib/ai-chat-monitor";
import { getAiKnowledgeDto, type ServicePriceConfig } from "@/lib/ai-knowledge";
import {
  evaluateAction,
  getAutonomyConfig,
  recordAction,
} from "@/lib/ai-autonomy";
import { generateProposalDraft, type ProposalDraft } from "@/lib/proposal";
import { sendProposal } from "@/lib/invoice-service";
import { resolvePaymentEligibility } from "@/lib/payment";
import { deliverAiEmail } from "@/lib/ai-email";

/* ─────────────────────────────────────────────────────────────
   BATCH 12 (§54) — SERVER-ONLY AI autonomous workflow engine.

   Inquiry → understand need → check CRM → identify service →
   check pricing (§51 — configured figures only) → draft response
   + proposal → send decision through the §53 policy gate →
   (on allow) generate PDF / prepare invoice / choose payment
   method / prepare email / send via sendProposal() → schedule
   follow-up → record EVERYTHING (AiActionLog + aiAudit).

   Every step is isolated (try/catch per step): one failing step
   records `failed` and the chain continues where sensible. The
   function NEVER throws — it returns a step-by-step report.
   ───────────────────────────────────────────────────────────── */

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

const FOLLOWUP_DELAY_DAYS = 5;

export async function runAutonomousWorkflow(input: {
  inquiryId: string;
  trigger: "inquiry" | "admin" | "cron" | "chat";
}): Promise<WorkflowReport> {
  const steps: WorkflowStep[] = [];
  const workflowRunId = `wf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const report: WorkflowReport = {
    ok: true,
    inquiryId: input.inquiryId,
    trigger: input.trigger,
    workflowRunId,
    steps,
    outcome: "workflow started",
  };

  /* ── Step 1: CRM context (§54 "Checks CRM") ────────────── */
  let inquiry: {
    id: string;
    name: string;
    email: string;
    service: string;
    message: string;
    phone: string | null;
    whatsapp: string | null;
    customerId: string | null;
    countryCode: string | null;
  } | null = null;
  let openInvoices = 0;
  let leadScore: number | null = null;

  try {
    const row = await db.inquiry.findUnique({ where: { id: input.inquiryId } });
    if (!row) {
      return {
        ...report,
        ok: false,
        outcome: "inquiry not found",
        steps: [{ step: "crm_context", status: "failed", detail: "inquiry not found" }],
      };
    }
    inquiry = {
      id: row.id,
      name: row.name,
      email: row.email,
      service: row.service,
      message: row.message,
      phone: row.phone,
      whatsapp: row.whatsapp,
      customerId: row.customerId,
      countryCode: row.countryCode,
    };

    let customer: { id: string; leadScore: number | null } | null = null;
    if (row.customerId) {
      customer = await db.customer.findUnique({
        where: { id: row.customerId },
        select: { id: true, leadScore: true },
      });
    }
    if (!customer) {
      customer = await db.customer.findUnique({
        where: { email: row.email },
        select: { id: true, leadScore: true },
      });
    }
    if (customer) {
      leadScore = customer.leadScore;
      openInvoices = await db.invoice.count({
        where: { customerId: customer.id, status: { in: ["sent", "pending", "overdue"] } },
      });
    }

    steps.push({
      step: "crm_context",
      status: "ok",
      detail: `Inquiry loaded; ${customer ? "existing CRM customer" : "no CRM customer yet"}${
        openInvoices ? `, ${openInvoices} open invoice(s)` : ""
      }${leadScore != null ? `, lead score ${leadScore}` : ""}.`,
      data: {
        service: inquiry.service,
        email: inquiry.email,
        existingCustomer: !!customer,
        openInvoices,
        leadScore,
      },
    });
  } catch (err) {
    console.error("[ai-workflow] crm context failed:", err);
    steps.push({ step: "crm_context", status: "failed", detail: String(err) });
    report.ok = false;
    report.outcome = "crm context step failed";
    return report;
  }

  /* ── Step 2/3: identify service + check pricing (§51) ──── */
  let matchedService: ServicePriceConfig | null = null;
  let amountNaira: number | null = null;

  try {
    const knowledge = await getAiKnowledgeDto();
    const wanted = inquiry.service.trim().toLowerCase();
    matchedService =
      knowledge.services.find((s) => s.name.trim().toLowerCase() === wanted) ??
      knowledge.services.find(
        (s) =>
          s.name.trim().toLowerCase().includes(wanted) ||
          wanted.includes(s.name.trim().toLowerCase())
      ) ??
      null;

    if (matchedService) {
      const min = typeof matchedService.priceMin === "number" ? matchedService.priceMin : null;
      const max = typeof matchedService.priceMax === "number" ? matchedService.priceMax : null;
      // Conservative floor — NEVER an invented figure (§51).
      amountNaira = min ?? max;
      steps.push({
        step: "service_match",
        status: "ok",
        detail: `Matched configured service "${matchedService.name}"${
          amountNaira != null ? ` with configured pricing (floor ₦${amountNaira.toLocaleString("en-NG")})` : " (no configured figure)"
        }.`,
        data: { service: matchedService.name, amountNaira, duration: matchedService.duration ?? null },
      });
    } else {
      steps.push({
        step: "service_match",
        status: "ok",
        detail: `No configured service matches "${inquiry.service}" — pricing stays human-owned.`,
        data: { service: inquiry.service, matched: false },
      });
    }
  } catch (err) {
    console.error("[ai-workflow] service match failed:", err);
    steps.push({ step: "service_match", status: "failed", detail: String(err) });
  }

  /* ── Step 4: draft response + proposal (§54) ───────────── */
  let proposal: ProposalDraft | null = null;
  let usedFallback = false;
  let draftProposalId: string | null = null;

  try {
    const generated = await generateProposalDraft({
      name: inquiry.name,
      service: matchedService?.name ?? inquiry.service,
      message: inquiry.message,
    });
    proposal = generated.draft;
    usedFallback = generated.usedFallback;

    // DraftProposal.inquiryId is UNIQUE — reuse an existing row when
    // the workflow re-runs on the same inquiry (idempotent).
    const existing = await db.draftProposal.findUnique({ where: { inquiryId: inquiry.id } });
    if (existing) {
      draftProposalId = existing.id;
      steps.push({
        step: "proposal_draft",
        status: "ok",
        detail: `Proposal draft already exists for this inquiry (id ${existing.id}) — reused; new draft kept in the action log only.`,
      });
    } else {
      const created = await db.draftProposal.create({
        data: {
          source: "workflow", // free-string column: ai_chat | admin | workflow (§54)
          customerName: inquiry.name,
          customerEmail: inquiry.email,
          service: matchedService?.name ?? inquiry.service,
          draftJson: proposal as unknown as never,
          inquiryId: inquiry.id,
          status: "draft",
        },
        select: { id: true },
      });
      draftProposalId = created.id;
      steps.push({
        step: "proposal_draft",
        status: "ok",
        detail: `Proposal draft generated${usedFallback ? " (fallback template — model unavailable)" : ""} and saved (id ${created.id}).`,
      });
    }
    report.draftProposalId = draftProposalId ?? undefined;

    // §54 "Records everything": the draft step is always executed
    // (drafting is safe — §53 suggest semantics).
    await recordAction({
      action: "proposal.draft",
      trigger: input.trigger,
      level: "suggest",
      status: "executed",
      customerEmail: inquiry.email,
      inquiryId: inquiry.id,
      draftJson: {
        draftProposalId,
        service: matchedService?.name ?? inquiry.service,
        proposalSummary: proposal.executiveSummary,
        usedFallback,
      },
      model: usedFallback ? "fallback-template" : "zai-chat",
    });
    await aiAudit("ai.workflow.draft_created", {
      targetId: inquiry.id,
      meta: { draftProposalId, usedFallback, service: matchedService?.name ?? inquiry.service },
    });
  } catch (err) {
    console.error("[ai-workflow] proposal draft failed:", err);
    steps.push({ step: "proposal_draft", status: "failed", detail: String(err) });
    report.outcome = "draft step failed";
    return report;
  }

  /* ── Step 5: send decision (§53 gate → §54 send chain) ── */
  const sendGate = await evaluateAction("proposal.send", {
    customerEmail: inquiry.email,
    service: matchedService?.name ?? inquiry.service,
  });

  const proposalPreview = {
    inquiryId: inquiry.id,
    draftProposalId,
    service: matchedService?.name ?? inquiry.service,
    amountNaira,
    durationLabel: matchedService?.duration ?? null,
    customerEmail: inquiry.email,
    customerName: inquiry.name,
    paymentMethodPreview:
      resolvePaymentEligibility(inquiry.countryCode) === "eligible"
        ? "Dedicated Virtual Account (NG/GH bank transfer)"
        : "Standard Paystack checkout link",
    proposalSummary: proposal.executiveSummary,
    proposal: proposal as unknown as Record<string, unknown>,
    workflowRunId,
  };

  if (matchedService && amountNaira == null) {
    // Configured service but NO figure — §51: never invent. Park.
    steps.push({
      step: "proposal_send",
      status: "parked",
      detail: `Service matched but no configured price figure — send parked ("no configured price for service", escalationRules.pricingMissing).`,
    });
    await recordAction({
      action: "proposal.send",
      trigger: input.trigger,
      level: sendGate.level,
      status: "suggested",
      customerEmail: inquiry.email,
      inquiryId: inquiry.id,
      draftJson: { ...proposalPreview, amountNaira: null },
      model: usedFallback ? "fallback-template" : "zai-chat",
      error: "no configured price for service",
    });
  } else if (sendGate.decision === "allow" && amountNaira != null) {
    // ── §54 full send chain: sendProposal() atomically generates the
    //    PDF, creates the invoice (INV-YYYY-NNNN), resolves the payment
    //    method (NG/GH → DVA, else Paystack), emails the customer with
    //    the PDF attached, schedules invoice reminders + WhatsApp. ──
    try {
      steps.push({
        step: "proposal_send",
        status: "executing",
        detail: `Autonomy gate allowed proposal.send (${sendGate.level}); sending…`,
      });
      const result = await sendProposal({
        inquiryId: inquiry.id,
        proposal: proposal as ProposalDraft,
        amountNaira,
        durationLabel: matchedService?.duration ?? null,
        description: `Proposal for ${matchedService?.name ?? inquiry.service}`,
      });
      if (result.ok) {
        report.invoiceId = result.invoiceId;
        report.invoiceNumber = result.invoiceNumber;
        report.actionLogId = (await recordAction({
          action: "proposal.send",
          trigger: input.trigger,
          level: sendGate.level,
          status: "executed",
          customerEmail: inquiry.email,
          inquiryId: inquiry.id,
          draftJson: proposalPreview,
          resultJson: {
            invoiceId: result.invoiceId ?? null,
            invoiceNumber: result.invoiceNumber ?? null,
            emailSent: result.emailSent ?? false,
            whatsappQueued: result.whatsappQueued ?? false,
            customerId: result.customerId ?? null,
            dvaStatus: result.dvaStatus ?? null,
          },
          model: usedFallback ? "fallback-template" : "zai-chat",
        })) ?? undefined;
        steps[steps.length - 1] = {
          step: "proposal_send",
          status: "executed",
          detail: `Proposal sent autonomously — invoice ${result.invoiceNumber} created, email ${
            result.emailSent ? "delivered" : "failed"
          }.`,
          data: { invoiceNumber: result.invoiceNumber, invoiceId: result.invoiceId },
        };
        await aiAudit("ai.workflow.proposal_sent", {
          targetId: result.invoiceId ?? null,
          meta: {
            inquiryId: inquiry.id,
            invoiceNumber: result.invoiceNumber,
            amountNaira,
            level: sendGate.level,
            emailSent: result.emailSent ?? false,
          },
        });
      } else {
        await recordAction({
          action: "proposal.send",
          trigger: input.trigger,
          level: sendGate.level,
          status: "failed",
          customerEmail: inquiry.email,
          inquiryId: inquiry.id,
          draftJson: proposalPreview,
          resultJson: { error: result.error ?? "send failed" },
          model: usedFallback ? "fallback-template" : "zai-chat",
          error: result.error ?? "send failed",
        });
        steps[steps.length - 1] = {
          step: "proposal_send",
          status: "failed",
          detail: `sendProposal failed: ${result.error ?? "unknown error"}`,
        };
      }
    } catch (err) {
      console.error("[ai-workflow] proposal send failed:", err);
      await recordAction({
        action: "proposal.send",
        trigger: input.trigger,
        level: sendGate.level,
        status: "failed",
        customerEmail: inquiry.email,
        inquiryId: inquiry.id,
        draftJson: proposalPreview,
        error: err instanceof Error ? err.message : "send threw",
        model: usedFallback ? "fallback-template" : "zai-chat",
      });
      steps.push({ step: "proposal_send", status: "failed", detail: String(err) });
    }
  } else if (sendGate.decision === "block") {
    steps.push({
      step: "proposal_send",
      status: "blocked",
      detail: `Autonomy gate blocked proposal.send: ${sendGate.reasons.join("; ")}`,
    });
    await recordAction({
      action: "proposal.send",
      trigger: input.trigger,
      level: sendGate.level,
      status: "blocked",
      customerEmail: inquiry.email,
      inquiryId: inquiry.id,
      draftJson: proposalPreview,
      error: sendGate.reasons.join("; "),
      model: usedFallback ? "fallback-template" : "zai-chat",
    });
  } else {
    // needs_approval — park with the full preview for the admin queue.
    const suggested = sendGate.level === "suggest" || amountNaira == null;
    report.actionLogId = (await recordAction({
      action: "proposal.send",
      trigger: input.trigger,
      level: sendGate.level,
      status: suggested ? "suggested" : "pending_approval",
      customerEmail: inquiry.email,
      inquiryId: inquiry.id,
      draftJson: proposalPreview,
      model: usedFallback ? "fallback-template" : "zai-chat",
      error: sendGate.reasons.join("; "),
    })) ?? undefined;
    steps.push({
      step: "proposal_send",
      status: suggested ? "suggested" : "pending_approval",
      detail:
        amountNaira == null
          ? `Send parked — no configured price for service (§51: commercial terms are human-owned). Draft left for the admin Proposals tab.`
          : `Autonomy gate requires approval (${sendGate.reasons.join("; ")}) — full preview parked in the AI action queue.`,
      data: { amountNaira, actionLogId: report.actionLogId },
    });
    if (!suggested) {
      await aiAudit("ai.workflow.awaiting_approval", {
        targetId: inquiry.id,
        meta: {
          action: "proposal.send",
          amountNaira,
          service: matchedService?.name ?? inquiry.service,
          reasons: sendGate.reasons,
        },
      });
    }
  }

  /* ── Step 6: schedule follow-up (§54 "Schedules follow-up") ── */
  try {
    const cfg = await getAutonomyConfig();
    if (!cfg.enabled) {
      steps.push({
        step: "followup_schedule",
        status: "skipped",
        detail: "Autonomy disabled — follow-up scheduling skipped (nothing executes unattended).",
      });
    } else {
      const gate = await evaluateAction("followup.schedule", { customerEmail: inquiry.email });
      if (gate.decision === "allow") {
        const eventDate = new Date(Date.now() + FOLLOWUP_DELAY_DAYS * 24 * 60 * 60 * 1000);
        const created = await db.eventRecord.create({
          data: {
            type: "ai.followup",
            customerEmail: inquiry.email,
            customerPhone: inquiry.phone ?? inquiry.whatsapp ?? null,
            eventDate,
            payload: {
              inquiryId: inquiry.id,
              customerEmail: inquiry.email,
              purpose: "proposal_followup",
              workflowRunId,
              invoiceNumber: report.invoiceNumber ?? null,
            } as never,
            status: "scheduled",
          },
          select: { id: true },
        });
        await recordAction({
          action: "followup.schedule",
          trigger: input.trigger,
          level: gate.level,
          status: "executed",
          customerEmail: inquiry.email,
          inquiryId: inquiry.id,
          resultJson: { eventRecordId: created.id, eventDate: eventDate.toISOString() },
        });
        await aiAudit("ai.workflow.followup_scheduled", {
          targetId: created.id,
          meta: { inquiryId: inquiry.id, eventDate: eventDate.toISOString() },
        });
        steps.push({
          step: "followup_schedule",
          status: "executed",
          detail: `Follow-up scheduled in ${FOLLOWUP_DELAY_DAYS} days (EventRecord ${created.id}).`,
        });
      } else {
        steps.push({
          step: "followup_schedule",
          status: "skipped",
          detail: `Follow-up scheduling not allowed: ${gate.reasons.join("; ")}`,
        });
      }
    }
  } catch (err) {
    console.error("[ai-workflow] followup schedule failed:", err);
    steps.push({ step: "followup_schedule", status: "failed", detail: String(err) });
  }

  /* ── Outcome roll-up ─────────────────────────────────── */
  const sendStep = steps.find((s) => s.step === "proposal_send");
  report.outcome = report.invoiceNumber
    ? `Proposal sent autonomously — invoice ${report.invoiceNumber}.`
    : sendStep?.status === "pending_approval"
      ? "Proposal parked pending admin approval."
      : sendStep?.status === "suggested"
        ? "Draft left for the admin (suggest semantics / missing price)."
        : sendStep?.status === "blocked"
          ? `Send blocked: ${sendStep.detail}`
          : sendStep?.status === "failed"
            ? "Send attempt failed — see action log."
            : "Draft created; no send executed.";

  return report;
}

/* ─────────────────────────────────────────────────────────────
   Approval execution — shared by POST /api/admin/ai/actions/[id]/approve.
   Executes a PARKED payload from AiActionLog.draftJson:
     proposal.send  → sendProposal() with the parked params
     email.followup → deliverAiEmail() with the parked content
     campaign.send  → approveCampaign() on the parked campaign
   Marks the row executed (or failed) + actor + audit row.
   ───────────────────────────────────────────────────────────── */

export type ApproveResult = {
  ok: boolean;
  status: "executed" | "failed";
  error?: string;
  invoiceNumber?: string;
  emailLogId?: string;
};

export async function executeParkedAction(
  row: {
    id: string;
    action: string;
    level: string;
    customerEmail: string | null;
    inquiryId: string | null;
    draftJson: unknown;
  },
  adminEmail: string
): Promise<ApproveResult> {
  const draft = (jsonLoose(row.draftJson ?? {}) ?? {}) as Record<string, unknown>;

  if (row.action === "proposal.send") {
    const proposal = draft.proposal as ProposalDraft | undefined;
    const inquiryId = typeof draft.inquiryId === "string" ? draft.inquiryId : row.inquiryId;
    const amount = typeof draft.amountNaira === "number" ? draft.amountNaira : null;
    if (!inquiryId || !proposal || amount == null || amount <= 0) {
      await markAction(row.id, "failed", adminEmail, {
        error: "parked payload incomplete (inquiry/proposal/amount)",
      });
      return { ok: false, status: "failed", error: "parked payload incomplete" };
    }
    const result = await sendProposal({
      inquiryId,
      proposal,
      amountNaira: amount,
      durationLabel: typeof draft.durationLabel === "string" ? draft.durationLabel : null,
      description: typeof draft.service === "string" ? `Proposal for ${draft.service}` : null,
    });
    await markAction(row.id, result.ok ? "executed" : "failed", adminEmail, {
      resultJson: {
        invoiceId: result.invoiceId ?? null,
        invoiceNumber: result.invoiceNumber ?? null,
        emailSent: result.emailSent ?? false,
        approvedBy: adminEmail,
      },
      error: result.ok ? null : result.error ?? "send failed",
    });
    if (result.ok) {
      await aiAudit("ai.action.approved", {
        actor: adminEmail,
        targetId: result.invoiceId ?? null,
        meta: { action: row.action, actionLogId: row.id, invoiceNumber: result.invoiceNumber },
      });
      await aiAudit("ai.workflow.proposal_sent", {
        actor: adminEmail,
        targetId: result.invoiceId ?? null,
        meta: {
          inquiryId,
          invoiceNumber: result.invoiceNumber,
          approvedVia: "action_queue",
        },
      });
    }
    return {
      ok: result.ok,
      status: result.ok ? "executed" : "failed",
      error: result.error,
      invoiceNumber: result.invoiceNumber,
    };
  }

  if (row.action === "email.followup") {
    const to = typeof draft.to === "string" ? draft.to : row.customerEmail;
    const subject = typeof draft.subject === "string" ? draft.subject : "";
    const body = typeof draft.body === "string" ? draft.body : "";
    if (!to || !subject || !body) {
      await markAction(row.id, "failed", adminEmail, { error: "parked content incomplete" });
      return { ok: false, status: "failed", error: "parked content incomplete" };
    }
    const delivery = await deliverAiEmail({ type: "ai.followup", to, subject, bodyText: body });
    await markAction(row.id, delivery.ok ? "executed" : "failed", adminEmail, {
      resultJson: {
        emailLogId: delivery.emailLogId ?? null,
        provider: delivery.provider ?? null,
        ok: delivery.ok,
        approvedBy: adminEmail,
      },
      error: delivery.ok ? null : delivery.error ?? "delivery failed",
    });
    await aiAudit("ai.action.approved", {
      actor: adminEmail,
      meta: { action: row.action, actionLogId: row.id, emailLogId: delivery.emailLogId ?? null },
    });
    return {
      ok: delivery.ok,
      status: delivery.ok ? "executed" : "failed",
      emailLogId: delivery.emailLogId,
    };
  }

  if (row.action === "campaign.send") {
    const campaignId = typeof draft.campaignId === "string" ? draft.campaignId : null;
    if (!campaignId) {
      await markAction(row.id, "failed", adminEmail, { error: "parked payload has no campaignId" });
      return { ok: false, status: "failed", error: "parked payload has no campaignId" };
    }
    const { approveCampaign } = await import("@/lib/ai-campaigns");
    const approved = await approveCampaign(campaignId, adminEmail);
    if (!approved) {
      await markAction(row.id, "failed", adminEmail, { error: "campaign not found" });
      return { ok: false, status: "failed", error: "campaign not found" };
    }
    await markAction(row.id, "executed", adminEmail, {
      resultJson: { campaignId, approvedBy: adminEmail },
    });
    await aiAudit("ai.action.approved", {
      actor: adminEmail,
      targetId: campaignId,
      meta: { action: row.action, actionLogId: row.id },
    });
    return { ok: true, status: "executed" };
  }

  await markAction(row.id, "failed", adminEmail, {
    error: `action "${row.action}" is not executable from the approval queue`,
  });
  return { ok: false, status: "failed", error: `action "${row.action}" is not approvable` };
}

async function markAction(
  id: string,
  status: "executed" | "failed",
  actor: string,
  extra?: { resultJson?: Record<string, unknown>; error?: string | null }
): Promise<void> {
  try {
    await db.aiActionLog.update({
      where: { id },
      data: {
        status,
        actor,
        updatedAt: new Date(),
        ...(extra?.resultJson ? { resultJson: extra.resultJson as never } : {}),
        ...(extra?.error !== undefined ? { error: extra.error } : {}),
      },
    });
  } catch (err) {
    console.error("[ai-workflow] markAction failed:", err);
  }
}
