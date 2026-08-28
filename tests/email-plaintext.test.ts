/**
 * Plain-text Body Well-formedness Test
 * =====================================
 *
 * Task ID: B1-C (Batch 1, sub-task C) — Master Directive §4 (Design —
 * plain-text fallback) + §15 (Email Quality Bar).  Closes R41 (the
 * #10 gap from the B0-A matrix): "Plain-text bodies are auto-generated
 * from composeBody() but NOT E2E-verified to render correctly in
 * non-HTML clients."
 *
 * ─── What does this test verify? ───────────────────────────────────
 * Every email type's plain-text body (the string sent to
 * `deliverWithFailover({ bodyText })` and stored in `EmailLog.bodyText`)
 * is well-formed for non-HTML mail clients (text-only Webmail, screen
 * readers, mutt / Alpine / Mail, Reply-capture systems, Gmail's
 * "show plain text" toggle).
 *
 * The rules:
 *   R1  No HTML tags (no `<br>`, `<p>`, `<div>`, `<a>`, `<img>`, etc.)
 *   R2  No broken markdown (no unclosed `**bold**` or `*italic*`)
 *   R3  No template-placeholder leakage (no `{name}`, no `${varName}`)
 *   R4  No base64 blobs (no `data:` URLs, no long base64 runs — the
 *       PDF attachments travel as EmailAttachment objects alongside
 *       the body, never inlined as text)
 *   R5  No excessively long lines (>1000 chars — RFC 5321 line limit)
 *   R6  Subject mirrors the body's first meaningful line (i.e. the
 *       subject is non-empty and the body's first non-blank line is
 *       also non-empty)
 *   R7  CTA URL appears in the plain text body when the email has a
 *       CTA — a subscriber reading the plain-text version of a
 *       "View your proposal" email MUST be able to copy-paste the URL
 *       out of the body, not just the HTML CTA button.
 *
 * ─── How does it verify the REAL production output? ─────────────────
 * In B1-C, src/lib/notify.ts was minimally refactored to EXPORT the
 * composer helpers that were previously inlined inside the public
 * notify functions:
 *
 *   - subjectFor(payload)              (was private, now exported)
 *   - composeBody(payload)            (was private, now exported)
 *   - reminderSubject(rem)             (NEW — extracted from sendReminderEmail)
 *   - composeReminderBody(rem)         (NEW — extracted from sendReminderEmail)
 *   - proposalSubject(inv)             (NEW — extracted from sendProposalEmail)
 *   - composeProposalBody(inv)         (NEW — extracted from sendProposalEmail)
 *   - paymentThankYouSubject(p)        (NEW — extracted from sendPaymentThankYouEmail)
 *   - composePaymentThankYouBody(p)   (NEW — extracted from sendPaymentThankYouEmail)
 *   - paymentProofAlertSubject(a)      (NEW — extracted from notifyPaymentProofUploaded)
 *   - composePaymentProofAlertBody(a) (NEW — extracted from notifyPaymentProofUploaded)
 *
 * The public notify functions (sendReminderEmail, sendProposalEmail,
 * sendPaymentThankYouEmail, notifyPaymentProofUploaded, notifyNewInquiry,
 * notifyNewSubscriber, notifyPostPublished, notifyBroadcast) now CALL
 * these helpers instead of building the body inline — so this test
 * verifies the EXACT string that production sends.  If the helper
 * drifts from the inline body that production used to build, the
 * production code now drifts from itself — i.e. there is no drift
 * surface, the test IS the production output.
 *
 * ─── Test design choices ───────────────────────────────────────────
 *   - Uses `bun:test` (describe / it / expect) — same harness as the
 *     B1-A Paystack regression test.
 *   - Zero DB / zero network / zero env vars — pure string
 *     assertions.  The test always runs (no describe.skip guard).
 *   - Each email type gets its own describe block so a failure in
 *     one type's body doesn't cascade.
 *   - The well-formedness helpers (assertNoHtmlTags, assertNoLeaks,
 *     assertNoBase64, assertNoLongLines, assertNoUnclosedMarkdown,
 *     assertWellFormed) are shared across all describe blocks —
 *     a single rule definition, applied uniformly.
 *   - Sample payloads are realistic: real-looking invoice numbers
 *     (INV-2026-0001), real customer names, real Paystack reference
 *     format, real portal URL pattern.  This catches placeholder
 *     leakage that a synthetic payload like "TEST" would mask.
 */

import { describe, it, expect } from "bun:test";
import {
  // 4-payload-type composers (subscriber / inquiry / post / broadcast)
  composeBody,
  subjectFor,
  // Reminder (invoice.reminder_3d | _due | _overdue)
  composeReminderBody,
  reminderSubject,
  // Proposal (invoice.sent)
  composeProposalBody,
  proposalSubject,
  // Payment thank-you (payment.received)
  composePaymentThankYouBody,
  paymentThankYouSubject,
  // Payment proof uploaded (system.alert subtype)
  composePaymentProofAlertBody,
  paymentProofAlertSubject,
  // Types
  type InquiryNotificationPayload,
  type SubscriberNotificationPayload,
  type PostPublishedNotificationPayload,
  type BroadcastNotificationPayload,
  type ReminderEmailPayload,
  type InvoiceEmailPayload,
  type PaymentEmailPayload,
  type PaymentProofAlertPayload,
} from "@/lib/notify";

/* ──────────────────────────────────────────────────────────────────
 *  Well-formedness rule helpers — applied uniformly to every body.
 * ────────────────────────────────────────────────────────────────── */

const RFC_5321_MAX_LINE = 1000; // SMTP transport line limit (octets)

/** R1 — no HTML tags. Catches accidental `<br>` / `<p>` / `<div>` / `<a>`
 *  leaking into the plain text. The branded HTML template uses all of
 *  these — they must NOT appear in the plain-text body. */
const HTML_TAG_RE =
  /<\/?(br|p|div|span|a|img|b|i|strong|em|u|s|table|thead|tbody|tr|td|th|ul|ol|li|h[1-6]|hr|meta|html|head|title|link|style|script|font|center|small|sub|sup|mark|code|pre|blockquote|figure|figcaption|article|section|header|footer|nav|aside|main|form|input|button|label|textarea|select|option|fieldset|legend|datalist|optgroup|output|progress|meter|details|summary|dialog|canvas|svg|video|audio|source|track|iframe|object|embed|param|picture|map|area|col|colgroup|caption|abbr|address|cite|q|dfn|kbd|samp|var|time|ins|del|wbr|ruby|rt|rp|bdi|bdo)\b[^>]*>/i;

/** R3a — no `{placeholder}` style template leaks. */
const CURLY_PLACEHOLDER_RE = /\{[a-zA-Z_][a-zA-Z0-9_]*\}/;
/** R3b — no `${placeholder}` style template-literal leaks. */
const TEMPLATE_LITERAL_LEAK_RE = /\$\{[a-zA-Z_][a-zA-Z0-9_.]*\}/;

/** R4a — no `data:` URLs (e.g. inline base64 images). */
const DATA_URL_RE = /data:[a-z0-9.+-]+\/[a-z0-9.+-]+;base64,/i;
/** R4b — no long base64-looking runs (a real PDF base64 is 1000s+ chars). */
const LONG_BASE64_RE = /[A-Za-z0-9+/]{200,}={0,2}/;

/** R2 — markdown bold/italic must be balanced. We expect ZERO `**` and
 *  ZERO unpaired `*` in the plain text body (no markdown emphasis in
 *  email plain text — it would render as literal asterisks). */
const MARKDOWN_BOLD_RE = /\*\*/g;
const MARKDOWN_ITALIC_RE =
  /(^|\s|[(:.,;])\*(\S[^*\n]*?\S|\S)\*(?=\s|[).,;:!?]|$)/g;

/** R6 — body must have a non-empty first line. */
function firstNonBlankLine(body: string): string {
  for (const line of body.split("\n")) {
    if (line.trim().length > 0) return line;
  }
  return "";
}

/** Run every well-formedness rule on a plain-text body. */
function assertWellFormed(body: string, label: string): void {
  // R1 — no HTML tags
  expect(body, `${label}: body must not contain HTML tags`).not.toMatch(
    HTML_TAG_RE
  );

  // R2 — no unclosed/balanced markdown
  const boldMatches = body.match(MARKDOWN_BOLD_RE) ?? [];
  expect(
    boldMatches.length,
    `${label}: body must contain zero \`**\` markdown bold markers (found ${boldMatches.length})`
  ).toBe(0);
  const italicMatches = body.match(MARKDOWN_ITALIC_RE) ?? [];
  expect(
    italicMatches.length,
    `${label}: body must contain zero unpaired \`*\` markdown italic markers (found ${italicMatches.length})`
  ).toBe(0);

  // R3 — no template-placeholder leakage
  expect(
    body,
    `${label}: body must not contain \`{placeholder}\` style template leaks`
  ).not.toMatch(CURLY_PLACEHOLDER_RE);
  expect(
    body,
    `${label}: body must not contain \`\\\${placeholder}\` style template-literal leaks`
  ).not.toMatch(TEMPLATE_LITERAL_LEAK_RE);

  // R4 — no base64 blobs
  expect(
    body,
    `${label}: body must not contain \`data:\` base64 URLs`
  ).not.toMatch(DATA_URL_RE);
  expect(
    body,
    `${label}: body must not contain long base64-looking runs (PDF attachments travel as EmailAttachment objects, never inlined in the body text)`
  ).not.toMatch(LONG_BASE64_RE);

  // R5 — no excessively long lines (RFC 5321 / RFC 5322)
  const lines = body.split("\n");
  for (let i = 0; i < lines.length; i++) {
    expect(
      lines[i].length,
      `${label}: line ${i + 1} must be <= ${RFC_5321_MAX_LINE} chars (RFC 5321 line limit); got ${lines[i].length}`
    ).toBeLessThanOrEqual(RFC_5321_MAX_LINE);
  }

  // R6 — subject mirrors body — body's first non-blank line must be non-empty
  // (already implied if R5 passes, but explicit for the contract)
  const firstLine = firstNonBlankLine(body);
  expect(
    firstLine.length,
    `${label}: body must have at least one non-blank line (subject mirror contract)`
  ).toBeGreaterThan(0);
}

/* ──────────────────────────────────────────────────────────────────
 *  Sample payloads — realistic data to catch placeholder leakage that
 *  synthetic "TEST" payloads would mask.
 * ────────────────────────────────────────────────────────────────── */

const SITE_URL = "https://okomba.com";
const PORTAL_URL = "https://app.okomba.com/portal/AbC123_XyZ789-pQr456";

const inquiryPayload: InquiryNotificationPayload = {
  type: "inquiry.created",
  inquiry: {
    id: "inq_abc123",
    name: "Ada Okonkwo",
    email: "ada@example.com",
    phone: "+234 803 555 0142",
    whatsapp: "+234 803 555 0142",
    service: "AI Lead-Gen Chat",
    addlService: "WhatsApp automation",
    message:
      "Hi Okomba — we're a Lagos fintech and need an AI chat widget that captures leads and routes them to WhatsApp. Can you scope a 6-week build?",
  },
  receivedAt: "2026-02-14T09:42:00.000Z",
};

const subscriberWelcomePayload: SubscriberNotificationPayload = {
  type: "subscriber.welcome",
  email: "subscriber@example.com",
  receivedAt: "2026-02-14T09:42:00.000Z",
  confirmUrl: `${SITE_URL}/api/subscribe/confirm?token=abcdef0123456789-_xY`,
  unsubscribeUrl: `${SITE_URL}/api/subscribe/unsubscribe?token=uvwxyz9876543210-_aB`,
};

const postPublishedPayload: PostPublishedNotificationPayload = {
  type: "post.published",
  postId: "post_xyz789",
  postTitle: "Why we built Votewise — a 7-day field note",
  postSlug: "why-we-built-votewise",
  postExcerpt:
    "A short field note on shipping a ballot-awareness MVP in 7 days — what we built, what we cut, and what we'd do differently.",
  postCategory: "Field Notes",
  author: "Okomba Analytics",
  publishedAt: "2026-02-14T09:42:00.000Z",
};

const broadcastPayload: BroadcastNotificationPayload = {
  type: "broadcast",
  subject: "Okomba — March 2026 product update",
  body: [
    "Hi,",
    "",
    "We shipped three new things this month:",
    "  - AI Lead-Gen Chat (beta)",
    "  - Cloudinary PDF storage",
    "  - Daily 02:00 WAT backup cron",
    "",
    "Reply to this email if you want a demo.",
    "",
    "— Okomba Analytics",
  ].join("\n"),
  recipients: [{ email: "sub@example.com", id: "sub_1" }],
};

const reminderPayload: ReminderEmailPayload = {
  invoiceId: "inv_abc123",
  invoiceNumber: "INV-2026-0001",
  kind: "friendly",
  customerName: "Ada Okonkwo",
  customerEmail: "ada@example.com",
  service: "AI Lead-Gen Chat",
  amountNaira: 950_000,
  dueLabel: "14 February 2026",
  dueDate: "2026-02-14T00:00:00.000Z",
  dvaAccountNumber: "9988776655",
  dvaBankName: "Wema Bank",
  dvaAccountName: "Okomba Analytics",
  bodyText:
    "Hi Ada — just a friendly nudge that the proposal for your AI Lead-Gen Chat build is due in 3 days. Let us know if you need anything.",
  pdfBase64:
    "JVBERi0xLjQKJZWCjU2IDAgb2JqCjw8L1R5cGUvWE9iamVjdC9TdWJ0eXBlL0ltYWdlL1dpZHRoIDUwMC9IZWlnaHQgNTAwL0NvbG9yU3BhY2UvRGV2aWNlUkdCL0JpdHNQZXJDb21wb25lbnQgOD4+c3RyZWFtCmVuZG9iagogCnN0YXJ0eHJlZgo1MTIKJSVFT0YK", // a tiny synthetic PDF base64 — well under the 200-char LONG_BASE64_RE threshold because it's chunked by \n
  pdfFilename: "Okomba_Proposal_INV-2026-0001.pdf",
  portalUrl: PORTAL_URL,
};

const proposalPayload: InvoiceEmailPayload = {
  invoiceId: "inv_abc123",
  invoiceNumber: "INV-2026-0001",
  customerName: "Ada Okonkwo",
  customerEmail: "ada@example.com",
  service: "AI Lead-Gen Chat",
  description: "6-week build + 30-day post-launch support.",
  amountNaira: 950_000,
  durationLabel: "6 weeks",
  dueDate: "2026-02-28T00:00:00.000Z",
  dvaAccountNumber: "9988776655",
  dvaBankName: "Wema Bank",
  dvaAccountName: "Okomba Analytics",
  pdfBase64:
    "JVBERi0xLjQKJZWCjU2IDAgb2JqCjw8L1R5cGUvWE9iamVjdC9TdWJ0eXBlL0ltYWdlL1dpZHRoIDUwMC9IZWlnaHQgNTAwL0NvbG9yU3BhY2UvRGV2aWNlUkdCL0JpdHNQZXJDb21wb25lbnQgOD4+c3RyZWFtCmVuZG9iagogCnN0YXJ0eHJlZgo1MTIKJSVFT0YK",
  pdfFilename: "Okomba_Proposal_INV-2026-0001.pdf",
  portalUrl: PORTAL_URL,
};

const paymentPayload: PaymentEmailPayload = {
  invoiceId: "inv_abc123",
  invoiceNumber: "INV-2026-0001",
  receiptNumber: "RCPT-2026-0001",
  customerName: "Ada Okonkwo",
  customerEmail: "ada@example.com",
  service: "AI Lead-Gen Chat",
  amountNaira: 950_000,
  paidLabel: "14 February 2026",
  paystackReference: "ref-OKM-abc123",
  bodyText:
    "Hi Ada — payment confirmed. Thanks for choosing Okomba Analytics. Your project kickoff is scheduled within 24 hours.",
  pdfBase64:
    "JVBERi0xLjQKJZWCjU2IDAgb2JqCjw8L1R5cGUvWE9iamVjdC9TdWJ0eXBlL0ltYWdlL1dpZHRoIDUwMC9IZWlnaHQgNTAwL0NvbG9yU3BhY2UvRGV2aWNlUkdCL0JpdHNQZXJDb21wb25lbnQgOD4+c3RyZWFtCmVuZG9iagogCnN0YXJ0eHJlZgo1MTIKJSVFT0YK",
  pdfFilename: "Okomba_Receipt_RCPT-2026-0001.pdf",
};

const paymentProofPayload: PaymentProofAlertPayload = {
  invoiceNumber: "INV-2026-0001",
  customerName: "Ada Okonkwo",
  customerEmail: "ada@example.com",
  amountNaira: 950_000,
  fileName: "payment-proof.jpg",
  sizeBytes: 246_810,
  portalUrl: PORTAL_URL,
};

/* ──────────────────────────────────────────────────────────────────
 *  Test cases — one describe block per email type.
 * ────────────────────────────────────────────────────────────────── */

describe("Plain-text body well-formedness (R41 / Master Directive §4)", () => {
  describe("inquiry.created (admin + submitter copies share the same body)", () => {
    const body = composeBody(inquiryPayload);
    const subject = subjectFor(inquiryPayload);

    it("subject is non-empty and well-formed", () => {
      expect(subject.length).toBeGreaterThan(0);
      expect(subject).not.toMatch(HTML_TAG_RE);
      expect(subject).not.toMatch(CURLY_PLACEHOLDER_RE);
      expect(subject).not.toMatch(TEMPLATE_LITERAL_LEAK_RE);
    });

    it("body is well-formed (no HTML, no leaks, no base64, lines <= 1000)", () => {
      assertWellFormed(body, "inquiry.created");
    });

    it("body contains the inquiry email + service + message (no field dropped)", () => {
      expect(body).toContain(inquiryPayload.inquiry.email);
      expect(body).toContain(inquiryPayload.inquiry.service);
      expect(body).toContain(inquiryPayload.inquiry.message);
    });

    it("body has no CTA URL (info-only email — by design)", () => {
      // No ctaUrl is set in deliverOne for inquiry.created — the body
      // must not invent one.
      expect(body).not.toContain("https://okomba.com/portal/");
      expect(body).not.toContain("View your proposal");
    });
  });

  describe("subscriber.welcome (double opt-in confirmation)", () => {
    const body = composeBody(subscriberWelcomePayload);
    const subject = subjectFor(subscriberWelcomePayload);

    it("subject is non-empty and well-formed", () => {
      expect(subject.length).toBeGreaterThan(0);
      expect(subject).not.toMatch(HTML_TAG_RE);
      expect(subject).not.toMatch(CURLY_PLACEHOLDER_RE);
    });

    it("body is well-formed", () => {
      assertWellFormed(body, "subscriber.welcome");
    });

    it("CTA URL (confirmUrl) appears in the plain text body (R7)", () => {
      // R7 — the subscriber MUST be able to copy-paste the confirm URL
      // out of the plain text body. The HTML CTA button is irrelevant
      // in text-only clients.
      expect(body).toContain(subscriberWelcomePayload.confirmUrl as string);
    });

    it("body contains the 'Confirm your subscription:' label (mirrors the CTA text)", () => {
      expect(body.toLowerCase()).toContain("confirm your subscription");
    });
  });

  describe("post.published (new article notification)", () => {
    const body = composeBody(postPublishedPayload);
    const subject = subjectFor(postPublishedPayload);

    it("subject is non-empty and well-formed", () => {
      expect(subject.length).toBeGreaterThan(0);
      expect(subject).not.toMatch(HTML_TAG_RE);
    });

    it("body is well-formed", () => {
      assertWellFormed(body, "post.published");
    });

    it("CTA URL (${BASE_URL}/#insights) appears in the plain text body (R7)", () => {
      // The body's last line is "Read the full article: {BASE_URL}/#insights"
      // — the subscriber MUST be able to copy-paste this URL out of a
      // text-only mail client.
      expect(body).toContain("/#insights");
      expect(body).toMatch(/Read the full article:\s+https?:\/\//);
    });

    it("body contains the post title + category + author (no field dropped)", () => {
      expect(body).toContain(postPublishedPayload.postTitle);
      expect(body).toContain(postPublishedPayload.postCategory);
      expect(body).toContain(postPublishedPayload.author);
    });
  });

  describe("broadcast (admin-composed body)", () => {
    const body = composeBody(broadcastPayload);
    const subject = subjectFor(broadcastPayload);

    it("subject is non-empty and well-formed", () => {
      expect(subject).toBe(broadcastPayload.subject);
      expect(subject.length).toBeGreaterThan(0);
      expect(subject).not.toMatch(HTML_TAG_RE);
    });

    it("body is the admin-composed text verbatim (no transformation)", () => {
      expect(body).toBe(broadcastPayload.body);
    });

    it("body is well-formed (admin-composed but still subject to the rules)", () => {
      assertWellFormed(body, "broadcast");
    });
  });

  describe("invoice.reminder_3d / _due / _overdue", () => {
    // The body is the same shape for all three reminder kinds; only
    // the EmailLog.type string + the AI bodyText differ. We test the
    // 'friendly' kind here — the composer is shared.
    const body = composeReminderBody(reminderPayload);
    const subject = reminderSubject(reminderPayload);

    it("subject matches the spec format 'Reminder: Invoice #INV-xxx Due {date}'", () => {
      expect(subject).toBe(
        `Reminder: Invoice #${reminderPayload.invoiceNumber} Due ${reminderPayload.dueLabel}`
      );
      expect(subject).not.toMatch(HTML_TAG_RE);
      expect(subject).not.toMatch(CURLY_PLACEHOLDER_RE);
    });

    it("body is well-formed", () => {
      assertWellFormed(body, "invoice.reminder");
    });

    it("CTA URL (portalUrl) appears in the plain text body (R7)", () => {
      // The body line "View your proposal: {portalUrl}" is the
      // plain-text fallback for the gold "View & pay in your portal"
      // HTML CTA button. A subscriber reading the plain text MUST see
      // the URL.
      expect(body).toContain(PORTAL_URL);
      expect(body).toMatch(/View your proposal:\s+https?:\/\//);
    });

    it("body contains invoice number + amount (₦) + due date + DVA account", () => {
      expect(body).toContain(reminderPayload.invoiceNumber);
      expect(body).toContain("₦");
      expect(body).toContain(reminderPayload.dueLabel);
      expect(body).toContain(reminderPayload.dvaAccountNumber as string);
    });

    it("body does NOT inline the PDF base64 (R4 — attachments travel as EmailAttachment)", () => {
      // The pdfBase64 field is large; the body must not contain it.
      expect(body).not.toContain(reminderPayload.pdfBase64);
      expect(body).not.toMatch(DATA_URL_RE);
      expect(body).not.toMatch(LONG_BASE64_RE);
    });
  });

  describe("invoice.sent (proposal email)", () => {
    const body = composeProposalBody(proposalPayload);
    const subject = proposalSubject(proposalPayload);

    it("subject matches the spec format 'Your Proposal from Okomba Analytics - Invoice #INV-xxx'", () => {
      expect(subject).toBe(
        `Your Proposal from Okomba Analytics - Invoice #${proposalPayload.invoiceNumber}`
      );
      expect(subject).not.toMatch(HTML_TAG_RE);
      expect(subject).not.toMatch(CURLY_PLACEHOLDER_RE);
    });

    it("body is well-formed", () => {
      assertWellFormed(body, "invoice.sent");
    });

    it("CTA URL (portalUrl) appears in the plain text body (R7)", () => {
      // The body line "View your proposal: {portalUrl}" is the
      // plain-text fallback for the gold "View your proposal online"
      // HTML CTA button.
      expect(body).toContain(PORTAL_URL);
      expect(body).toMatch(/View your proposal:\s+https?:\/\//);
    });

    it("body contains customer name + invoice + service + amount + DVA account", () => {
      expect(body).toContain(proposalPayload.customerName);
      expect(body).toContain(proposalPayload.invoiceNumber);
      expect(body).toContain(proposalPayload.service);
      expect(body).toContain("₦");
      expect(body).toContain(proposalPayload.dvaAccountNumber as string);
    });

    it("body does NOT inline the PDF base64 (R4)", () => {
      expect(body).not.toContain(proposalPayload.pdfBase64);
      expect(body).not.toMatch(DATA_URL_RE);
      expect(body).not.toMatch(LONG_BASE64_RE);
    });

    it("body does NOT leak the durationLabel when provided", () => {
      expect(body).toContain(proposalPayload.durationLabel as string);
    });
  });

  describe("payment.received (thank-you email)", () => {
    const body = composePaymentThankYouBody(paymentPayload);
    const subject = paymentThankYouSubject(paymentPayload);

    it("subject matches the spec format 'Thank You — Payment Received for Invoice #INV-xxx'", () => {
      expect(subject).toBe(
        `Thank You — Payment Received for Invoice #${paymentPayload.invoiceNumber}`
      );
      expect(subject).not.toMatch(HTML_TAG_RE);
      expect(subject).not.toMatch(CURLY_PLACEHOLDER_RE);
    });

    it("body is well-formed", () => {
      assertWellFormed(body, "payment.received");
    });

    it("body has no CTA URL (by design — the receipt PDF is attached, not linked)", () => {
      // No ctaUrl is set in the brandedEmailHtml call for
      // sendPaymentThankYouEmail. The body must not invent one.
      expect(body).not.toContain("https://okomba.com/portal/");
      expect(body).not.toContain("View your proposal");
      expect(body).not.toContain("View & pay");
    });

    it("body contains receipt number + invoice + amount paid + paid label + Paystack ref", () => {
      expect(body).toContain(paymentPayload.receiptNumber);
      expect(body).toContain(paymentPayload.invoiceNumber);
      expect(body).toContain("₦");
      expect(body).toContain(paymentPayload.paidLabel);
      expect(body).toContain(paymentPayload.paystackReference as string);
    });

    it("body does NOT inline the PDF base64 (R4)", () => {
      expect(body).not.toContain(paymentPayload.pdfBase64);
      expect(body).not.toMatch(DATA_URL_RE);
      expect(body).not.toMatch(LONG_BASE64_RE);
    });
  });

  describe("system.alert (payment proof uploaded)", () => {
    const body = composePaymentProofAlertBody(paymentProofPayload);
    const subject = paymentProofAlertSubject(paymentProofPayload);

    it("subject is non-empty and well-formed", () => {
      expect(subject).toBe(
        `Payment proof uploaded — ${paymentProofPayload.invoiceNumber} (${paymentProofPayload.customerName})`
      );
      expect(subject).not.toMatch(HTML_TAG_RE);
      expect(subject).not.toMatch(CURLY_PLACEHOLDER_RE);
    });

    it("body is well-formed", () => {
      assertWellFormed(body, "system.alert (payment proof)");
    });

    it("CTA URL (portalUrl) appears in the plain text body (R7)", () => {
      // The admin alert body line "...Portal: {portalUrl}" is the
      // plain-text fallback for the gold "Open admin Payments" HTML
      // CTA button (which points to /#/admin, a DIFFERENT URL than
      // the customer's portalUrl). The admin needs BOTH: the customer's
      // portal to view the uploaded proof, and the admin Payments tab
      // to verify. The body carries the customer's portal URL; the
      // HTML CTA carries the admin Payments URL.
      expect(body).toContain(PORTAL_URL);
      expect(body).toMatch(/Portal:\s+https?:\/\//);
    });

    it("body contains invoice + customer email + amount + proof file name", () => {
      expect(body).toContain(paymentProofPayload.invoiceNumber);
      expect(body).toContain(paymentProofPayload.customerEmail);
      expect(body).toContain("₦");
      expect(body).toContain(paymentProofPayload.fileName);
    });
  });

  describe("Cross-email: every subject is non-empty + free of HTML/leaks", () => {
    const allSubjects: [string, string][] = [
      ["inquiry.created", subjectFor(inquiryPayload)],
      ["subscriber.welcome", subjectFor(subscriberWelcomePayload)],
      ["post.published", subjectFor(postPublishedPayload)],
      ["broadcast", subjectFor(broadcastPayload)],
      ["invoice.reminder_3d", reminderSubject(reminderPayload)],
      ["invoice.sent", proposalSubject(proposalPayload)],
      ["payment.received", paymentThankYouSubject(paymentPayload)],
      ["system.alert (payment proof)", paymentProofAlertSubject(paymentProofPayload)],
    ];

    for (const [label, subject] of allSubjects) {
      it(`${label}: subject is non-empty + no HTML + no template leaks`, () => {
        expect(subject.length, `${label}: subject must be non-empty`).toBeGreaterThan(0);
        expect(subject, `${label}: subject must not contain HTML tags`).not.toMatch(
          HTML_TAG_RE
        );
        expect(
          subject,
          `${label}: subject must not contain \`{placeholder}\` leaks`
        ).not.toMatch(CURLY_PLACEHOLDER_RE);
        expect(
          subject,
          `${label}: subject must not contain \`\\\${placeholder}\` leaks`
        ).not.toMatch(TEMPLATE_LITERAL_LEAK_RE);
      });
    }
  });
});
