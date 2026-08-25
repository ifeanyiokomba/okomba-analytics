/**
 * AI Proposal generator — server-side only (z-ai-web-dev-sdk).
 *
 * ARCHITECTURE (user-approved, Phase 2 decision 3):
 *   • Refinement/generation happens HERE, inside the Next.js backend.
 *   • Google Apps Script only DELIVERS email. It never calls AI.
 *
 * HARD RULE (CTO directive): the AI NEVER mentions price, cost, fee,
 * rate, budget figures or payment amounts. Commercial terms are set
 * by the admin in the composer and rendered separately — the model
 * output is filtered defensively below regardless of prompt compliance.
 */

import ZAI from "z-ai-web-dev-sdk";

export type ProposalSection = {
  title: string;
  items: string[];
};

export type ProposalTimelinePhase = {
  phase: string;
  duration: string;
  focus: string;
};

export type ProposalDraft = {
  executiveSummary: string;
  objectives: string[];
  scope: ProposalSection[];
  deliverables: string[];
  timeline: ProposalTimelinePhase[];
  terms: string[];
};

export type ProposalSource = {
  name: string;
  service: string;
  addlService?: string | null;
  message: string;
  budget?: string | null;
};

/* Words that leak commercial figures — scrubbed from AI output. */
const PRICE_LEAK =
  /(₦|\bnaira\b|\bNGN\b|\b[Nn]\s?\d[\d,.]{2,}\b|\bprice\b|\bpricing\b|\bcost\b|\bfee\b|\brates?\b|\bpayment\b|\bpay\b|\bcharged?\b|\bdiscount\b|\bquote\b|\bamount\b|\bdeposit\b)/g;

function scrubPriceLeaks(text: string): string {
  // Remove any sentence that references money — the admin sets price,
  // the AI must never state or hint at it.
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .filter((sentence) => !PRICE_LEAK.test(sentence))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function scrubList(items: string[]): string[] {
  return items.map(scrubPriceLeaks).filter((s) => s.length > 2).slice(0, 8);
}

function coerceDraft(raw: unknown, serviceLabel: string): ProposalDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const summary = typeof r.executiveSummary === "string" ? scrubPriceLeaks(r.executiveSummary) : "";
  const objectives = Array.isArray(r.objectives)
    ? scrubList(r.objectives.filter((x): x is string => typeof x === "string"))
    : [];
  const scope = Array.isArray(r.scope)
    ? r.scope
        .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
        .map((s) => ({
          title: String(s.title ?? "Scope").slice(0, 90),
          items: scrubList(Array.isArray(s.items) ? s.items.filter((x): x is string => typeof x === "string") : []),
        }))
        .filter((s) => s.items.length > 0)
    : [];
  const deliverables = Array.isArray(r.deliverables)
    ? scrubList(r.deliverables.filter((x): x is string => typeof x === "string"))
    : [];
  const timeline = Array.isArray(r.timeline)
    ? r.timeline
        .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
        .map((p) => ({
          phase: String(p.phase ?? "Phase").slice(0, 60),
          duration: String(p.duration ?? "").slice(0, 40),
          focus: scrubPriceLeaks(String(p.focus ?? "")).slice(0, 160),
        }))
        .filter((p) => p.phase && p.duration)
    : [];
  const terms = Array.isArray(r.terms)
    ? scrubList(r.terms.filter((x): x is string => typeof x === "string"))
    : [];

  if (!summary && objectives.length === 0) return null;

  // Sensible defaults if the model under-delivered a section
  return {
    executiveSummary:
      summary ||
      `A structured engagement covering the requested ${serviceLabel} deliverables, delivered in phases with clear checkpoints.`,
    objectives: objectives.length ? objectives : ["Deliver the requested service to a production standard."],
    scope: scope.length ? scope : [{ title: "Scope of work", items: ["To be finalised with the client."] }],
    deliverables: deliverables.length ? deliverables : ["Final deliverable handover."],
    timeline: timeline.length
      ? timeline
      : [{ phase: "Phase 1", duration: "TBC", focus: "Discovery and delivery." }],
    terms: terms.length
      ? terms
      : [
          "50% mobilisation to begin work; balance on final delivery.",
          "Two revision rounds included per deliverable.",
          "Timeline starts from the mobilisation date.",
        ],
  };
}

function extractJson(text: string): unknown | null {
  if (!text) return null;
  // Strip markdown fences if present, then find the outermost JSON object
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

function buildPrompt(src: ProposalSource): string {
  return [
    `A potential client submitted this inquiry to Okomba Analytics (a Nigerian digital products & analytics studio):`,
    ``,
    `Client name: ${src.name}`,
    `Service requested: ${src.service}${src.addlService ? ` (+ ${src.addlService})` : ""}`,
    src.budget ? `Client budget signal (context only — DO NOT reference it): ${src.budget}` : "",
    `Their message: "${src.message}"`,
    ``,
    `Write the substance of a professional project proposal for this engagement.`,
    `Return STRICT JSON with exactly these keys:`,
    `{`,
    `  "executiveSummary": "3-4 sentence overview of the engagement and its value",`,
    `  "objectives": ["3-5 outcome-focused objectives"],`,
    `  "scope": [{"title": "Workstream name", "items": ["2-4 concrete activities"]}],`,
    `  "deliverables": ["4-7 tangible deliverables the client receives"],`,
    `  "timeline": [{"phase": "Phase name", "duration": "e.g. 1 week", "focus": "what happens in this phase"}],`,
    `  "terms": ["3-4 engagement terms about process, revisions, communication — NEVER money"]`,
    `}`,
    ``,
    `RULES:`,
    `- NEVER mention price, cost, fees, rates, payment amounts, naira, NGN or the client's budget — commercial terms are handled separately.`,
    `- 2-4 scope workstreams, 3-4 timeline phases max.`,
    `- Confident consultancy tone; specific to the requested service; no fluff like "we are passionate".`,
    `- JSON only, no markdown fences.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Generate a proposal draft from an inquiry using the z-ai LLM.
 * Retries once on parse failure; falls back to a minimal structured
 * draft so the composer always opens with something editable.
 */
export async function generateProposalDraft(
  src: ProposalSource
): Promise<{ draft: ProposalDraft; usedFallback: boolean }> {
  const fallback: ProposalDraft = {
    executiveSummary: `This proposal outlines an engagement for ${src.service}, tailored to the needs described in your inquiry. Okomba Analytics will scope, build and deliver the work in structured phases with clear checkpoints.`,
    objectives: [
      `Deliver ${src.service} to a production standard`,
      "Keep the client informed with weekly progress checkpoints",
      "Hand over documented, maintainable outputs",
    ],
    scope: [
      {
        title: "Discovery & Planning",
        items: ["Requirements workshop with the client", "Success criteria and delivery plan"],
      },
      {
        title: "Design & Build",
        items: ["Core build of the requested service", "Iterative review with the client"],
      },
      {
        title: "Delivery & Handover",
        items: ["Final QA and launch", "Documentation and handover session"],
      },
    ],
    deliverables: [
      "Discovery summary and delivery plan",
      `${src.service} — final build`,
      "Documentation pack",
      "Handover session",
    ],
    timeline: [
      { phase: "Phase 1 — Discovery", duration: "1 week", focus: "Requirements and planning." },
      { phase: "Phase 2 — Build", duration: "2-4 weeks", focus: "Design, build and reviews." },
      { phase: "Phase 3 — Handover", duration: "1 week", focus: "QA, launch, documentation." },
    ],
    terms: [
      "Two revision rounds included per deliverable.",
      "Weekly progress updates throughout the engagement.",
      "Timeline starts from the kick-off date.",
    ],
  };

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content:
            "You are a senior consultant at Okomba Analytics who writes precise, high-signal project proposals. You output strict JSON only.",
        },
        { role: "user", content: buildPrompt(src) },
      ],
      thinking: { type: "disabled" },
    });

    let text = completion.choices[0]?.message?.content ?? "";
    let parsed = coerceDraft(extractJson(text), src.service);

    // One retry if the first attempt was unparseable
    if (!parsed) {
      const retry = await zai.chat.completions.create({
        messages: [
          {
            role: "assistant",
            content:
              "You are a senior consultant who writes project proposals. You output strict JSON only — no prose, no markdown fences.",
          },
          { role: "user", content: buildPrompt(src) },
        ],
        thinking: { type: "disabled" },
      });
      text = retry.choices[0]?.message?.content ?? "";
      parsed = coerceDraft(extractJson(text), src.service);
    }

    if (parsed) return { draft: parsed, usedFallback: false };
    return { draft: fallback, usedFallback: true };
  } catch (err) {
    console.error("[proposal] AI generation failed, using fallback draft:", err);
    return { draft: fallback, usedFallback: true };
  }
}

export function isProposalDraftValid(d: unknown): d is ProposalDraft {
  if (!d || typeof d !== "object") return false;
  const r = d as Record<string, unknown>;
  return (
    typeof r.executiveSummary === "string" &&
    Array.isArray(r.objectives) &&
    Array.isArray(r.scope) &&
    Array.isArray(r.deliverables) &&
    Array.isArray(r.timeline) &&
    Array.isArray(r.terms)
  );
}
