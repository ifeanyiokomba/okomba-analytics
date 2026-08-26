/**
 * Payment thank-you generator — server-side (z-ai-web-dev-sdk),
 * same architecture as reminder-ai.ts: AI runs HERE, Google Apps
 * Script only delivers.
 *
 * Spec prompt (user, Module 7 — Paystack webhook):
 *   Call AI: "Write 'Thanks for payment' Email + WhatsApp"
 *
 * Produces BOTH:
 *   • emailBody — 2-4 sentences for the branded thank-you email
 *     (receipt PDF attached by the caller)
 *   • whatsappText — a short WhatsApp caption for the receipt
 *
 * Deterministic fallbacks so the webhook pipeline never dies on
 * an AI outage — money flows must not block on a model.
 */

import ZAI from "z-ai-web-dev-sdk";

export type PaymentThanksContext = {
  customerName: string;
  invoiceNumber: string;
  amountNaira: number;
  service: string;
  paidLabel: string; // "17 February 2026"
};

export type PaymentThanksResult = {
  emailBody: string;
  whatsappText: string;
  usedFallback: boolean;
};

function fallback(c: PaymentThanksContext): PaymentThanksResult {
  const first = c.customerName.split(" ")[0];
  const amt = `\u20A6${c.amountNaira.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
  return {
    emailBody: [
      `Dear ${c.customerName}, thank you — we have confirmed your payment of ${amt} for invoice ${c.invoiceNumber} (${c.service}), received on ${c.paidLabel}.`,
      `Your official receipt is attached to this email for your records.`,
      `Your project kickoff is scheduled within 24 hours, and we will send a start confirmation shortly.`,
      `Thank you for choosing Okomba Analytics — we are glad to get to work.`,
    ].join(" "),
    whatsappText: `Hi ${first}, payment confirmed with thanks! ${c.invoiceNumber} (${amt}) is fully settled — receipt attached. Your project kickoff is scheduled within 24 hours. — Okomba Analytics`,
    usedFallback: true,
  };
}

function buildPrompt(c: PaymentThanksContext): string {
  return [
    `Write "Thanks for payment" message for ${c.customerName}. Invoice ${c.invoiceNumber} \u20A6${c.amountNaira.toLocaleString(
      "en-NG"
    )} for ${c.service}, paid ${c.paidLabel}.`,
    ``,
    `Context: Okomba Analytics (a Nigerian digital products & analytics studio) has just received the client's payment via Paystack bank transfer.`,
    `The official receipt PDF is ATTACHED to both the email and the WhatsApp message.`,
    `A project kickoff is scheduled within 24 hours.`,
    ``,
    `Return STRICT JSON only:`,
    `{ "emailBody": "...", "whatsappText": "..." }`,
    `Rules:`,
    `- emailBody: 3-4 sentences, warm professional English, no emojis, no markdown. Confirm the payment, mention the receipt PDF attached, mention the kickoff within 24 hours.`,
    `- whatsappText: max 2 sentences, warm and crisp, starts with the client's first name. Mention receipt attached.`,
    `- Reference the invoice number and the amount.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generatePaymentThanks(
  c: PaymentThanksContext
): Promise<PaymentThanksResult> {
  const fb = fallback(c);
  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content:
            "You are the client-success assistant of Okomba Analytics. You write short, warm, professional payment thank-you messages. You output strict JSON only.",
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
      const parsed = JSON.parse(cleaned.slice(start, end + 1)) as {
        emailBody?: unknown;
        whatsappText?: unknown;
      };
      if (typeof parsed.emailBody === "string" && parsed.emailBody.trim().length > 60) {
        return {
          emailBody: parsed.emailBody.trim(),
          whatsappText:
            typeof parsed.whatsappText === "string" && parsed.whatsappText.trim().length > 20
              ? parsed.whatsappText.trim()
              : fb.whatsappText,
          usedFallback: false,
        };
      }
    }
    return fb;
  } catch (err) {
    console.error("[payment-ai] thank-you generation failed, using fallback:", err);
    return fb;
  }
}
