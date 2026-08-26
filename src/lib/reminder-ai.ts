/**
 * AI Reminder refiner — server-side (z-ai-web-dev-sdk), same
 * architecture decision as the proposal generator: AI runs HERE,
 * Google Apps Script only delivers.
 *
 * Spec prompt (user, Module 5):
 *   "Write reminder for {customer}. Invoice {id} ₦{amount} due {date}.
 *    Tone: professional, urgent. Mention PDF attached."
 *
 * Unlike proposals, reminders are ALLOWED to reference the invoice
 * amount (the customer already has it) — the no-price rule from the
 * proposal directive applies to pre-sale AI content only.
 *
 * Falls back to a deterministic template so the reminder pipeline
 * never hard-fails on an AI outage.
 */

import ZAI from "z-ai-web-dev-sdk";

export type ReminderKind = "friendly" | "due" | "overdue";

export type ReminderContext = {
  kind: ReminderKind;
  customerName: string;
  invoiceNumber: string;
  amountNaira: number;
  dueLabel: string; // "14 February 2026"
  service?: string | null;
  accountNumber?: string | null;
};

const KIND_BRIEF: Record<ReminderKind, string> = {
  friendly:
    "This is a COURTEOUS HEADS-UP sent 3 days before the due date. Warm but crisp.",
  due: "This is the DUE TODAY reminder. Calm urgency — payment is expected today.",
  overdue:
    "This is the OVERDUE notice (1 day past due). Firm, urgent and professional — never rude or threatening.",
};

const FALLBACKS: Record<ReminderKind, (c: ReminderContext) => string> = {
  friendly: (c) =>
    `Dear ${c.customerName}, a quick heads-up: invoice ${c.invoiceNumber} for \u20A6${c.amountNaira.toLocaleString(
      "en-NG"
    )} is due on ${c.dueLabel}. The PDF with your payment details is attached to this email and message for your records.`,
  due: (c) =>
    `Dear ${c.customerName}, invoice ${c.invoiceNumber} (\u20A6${c.amountNaira.toLocaleString(
      "en-NG"
    )}) is due today, ${c.dueLabel}. Please find the PDF attached — it contains the dedicated account details for your transfer.`,
  overdue: (c) =>
    `Dear ${c.customerName}, invoice ${c.invoiceNumber} (\u20A6${c.amountNaira.toLocaleString(
      "en-NG"
    )}) was due on ${c.dueLabel} and remains outstanding. The attached PDF shows the payment account; kindly settle today to keep the engagement on schedule.`,
};

function buildPrompt(c: ReminderContext): string {
  return [
    `Write reminder for ${c.customerName}. Invoice ${c.invoiceNumber} \u20A6${c.amountNaira.toLocaleString(
      "en-NG"
    )} due ${c.dueLabel}. Tone: professional, urgent. Mention PDF attached.`,
    ``,
    `Context: Okomba Analytics (a Nigerian digital products & analytics studio) is nudging a client to pay an invoice.`,
    KIND_BRIEF[c.kind],
    c.service ? `Service: ${c.service}.` : "",
    c.accountNumber ? `Payment goes to account ${c.accountNumber} (details are in the PDF).` : "",
    ``,
    `Return STRICT JSON only: { "body": "..." }`,
    `Rules for "body":`,
    `- 2-4 sentences, plain professional English, no emojis, no markdown.`,
    `- Address the client by name, reference the invoice number and due date.`,
    `- Explicitly mention that the PDF (proposal & invoice) is attached.`,
    `- End with a clear ask to settle or reply if they need help.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Refine the reminder body copy. On any AI failure the deterministic
 * fallback is returned — the cron job must never die on AI downtime.
 */
export async function refineReminderBody(
  c: ReminderContext
): Promise<{ body: string; usedFallback: boolean }> {
  const fallback = FALLBACKS[c.kind](c);
  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content:
            "You are the billing assistant of Okomba Analytics. You write short, professional payment reminders. You output strict JSON only.",
        },
        { role: "user", content: buildPrompt(c) },
      ],
      thinking: { type: "disabled" },
    });
    const text = completion.choices[0]?.message?.content ?? "";
    const cleaned = text.replace(/```(?:json)?/gi, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      const parsed = JSON.parse(cleaned.slice(start, end + 1)) as { body?: unknown };
      if (typeof parsed.body === "string" && parsed.body.trim().length > 40) {
        return { body: parsed.body.trim(), usedFallback: false };
      }
    }
    return { body: fallback, usedFallback: true };
  } catch (err) {
    console.error("[reminder-ai] refinement failed, using fallback:", err);
    return { body: fallback, usedFallback: true };
  }
}
