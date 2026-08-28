/**
 * Email Render Audit Test (Batch 3, Deliverable 2)
 * =================================================
 *
 * Task ID: B3 (Batch 3) — Master Directive §4 (Design — branded
 * email architecture) + §6 (payment CTA) + §15 (Email Quality Bar).
 *
 * ─── What does this test verify? ───────────────────────────────────
 * For every email type Okomba Analytics sends, the test verifies
 * the END-TO-END rendering of the branded HTML + plain-text body.
 * Specifically, for each email type it asserts:
 *
 *   HTML body (brandedEmailHtml output):
 *     H1  Has the ink header band (background #0B0F1A) with the
 *         Okomba Analytics logo image
 *     H2  Has the title in Georgia serif
 *         (font-family: Georgia, 'Times New Roman', serif)
 *     H3  Has the gold CTA button (background #C9910A) when the
 *         email type carries a CTA — and the href is the EXACT
 *         URL production would set (portalUrl for invoices,
 *         confirmUrl for subscriber.welcome, /#insights for
 *         post.published, /#/admin for payment-proof)
 *     H4  Has the gold divider (border-top:1px solid)
 *     H5  Has the footer with mailto: + tel + wa.me + website
 *     H6  Has the bottom ink band
 *         ("SENT BY OKOMBA ANALYTICS · KEEP THIS EMAIL FOR YOUR
 *         RECORDS")
 *     H7  Is responsive — table-based HTML, 600px max-width
 *     H8  No `/payment/...` placeholder URLs leak into the HTML
 *     H9  No `{name}` or `${var}` template-placeholder leakage
 *
 *   Plain-text body (composeBody / composeProposalBody / etc.):
 *     P1  Contains the customer's name (where applicable —
 *         inquiry.created, invoice.sent, reminder, payment.received,
 *         payment_proof_uploaded)
 *     P2  Contains the CTA URL (where applicable — subscriber.welcome,
 *         post.published, invoice.sent, reminder, payment_proof)
 *     P3  Contains the amount in Naira (where applicable —
 *         invoice.sent, reminder, payment.received, payment_proof)
 *     P4  Is faithful to the HTML body (the same customer name,
 *         same invoice number, same amount, same URL — the
 *         plain-text is the text-only mail client's view of the
 *         same email)
 *
 *   Data correctness (Master Directive §6 "must be tied to correct data"):
 *     D1  The email is tied to the RIGHT customer (the customer's
 *         name appears in the body, not a generic "Dear Customer")
 *     D2  The email is tied to the RIGHT invoice (the invoice number
 *         appears in the body, not a placeholder)
 *     D3  The email is tied to the RIGHT amount (the amount in Naira
 *         appears in the body, not a placeholder)
 *     D4  The email is tied to the RIGHT CTA URL (the per-invoice
 *         /portal/{secureToken} URL appears, not a generic /payment
 *         URL or a hardcoded link)
 *
 * ─── How does it verify the REAL production output? ────────────────
 * The composer helpers (subjectFor, composeBody, reminderSubject,
 * composeReminderBody, proposalSubject, composeProposalBody,
 * paymentThankYouSubject, composePaymentThankYouBody,
 * paymentProofAlertSubject, composePaymentProofAlertBody) are
 * EXTRACTED from the production `deliverOne` / `sendReminderEmail`
 * / `sendProposalEmail` / `sendPaymentThankYouEmail` /
 * `notifyPaymentProofUploaded` functions (B1-C extraction).  They
 * ARE the production code — calling them returns the EXACT strings
 * the production code emits.  The HTML composition calls
 * `brandedEmailHtml({...})` with the SAME options production uses
 * (title / preheader / blocks / ctaText / ctaUrl / footerNote) —
 * for the 4 generic types the test uses the exported
 * `composeBlocks(payload)`, for reminder/proposal/payment/proof
 * the test recreates the inline block arrays (mirroring production
 * verbatim) since they're inlined in the send* functions.
 *
 * If production drifts (e.g., a developer accidentally removes the
 * bottom band, or hardcodes a `/payment/...` placeholder, or
 * leaks a `{name}` template literal), this test fails — forcing
 * the developer to fix the regression before merging.
 *
 * ─── Test design ───────────────────────────────────────────────────
 *   - Uses `bun:test` (same harness as B1-A + B1-C).
 *   - Zero DB / zero network / zero env vars required — pure
 *     string assertions on the composed bodies.
 *   - Each email type gets its own describe block so a failure in
 *     one type's rendering doesn't cascade.
 *   - Sample payloads mirror B1-C's realistic data (real-looking
 *     invoice numbers INV-2026-0001, real customer names, real
 *     Paystack reference format, real portal URL pattern) so
 *     placeholder leakage that a synthetic "TEST" payload would
 *     mask is caught.
 *
 * Email types covered (11+ per Master Directive §4 Batch 3):
 *   1.  inquiry.created — admin copy (recipient: FROM_EMAIL)
 *   2.  inquiry.created — submitter confirmation (recipient: inquiry.email)
 *   3.  subscriber.welcome
 *   4.  post.published
 *   5.  broadcast
 *   6.  invoice.sent (proposal email)
 *   7.  invoice.reminder_3d (friendly)
 *   8.  invoice.reminder_due
 *   9.  invoice.reminder_overdue
 *   10. payment.received (thank-you email)
 *   11. payment_proof_uploaded (system.alert subtype)
 *   12. system.alert (generic admin alert — also covered via the
 *       payment_proof path since notifyPaymentProofUploaded wraps
 *       sendAdminAlertEmail)
 *
 * (1 and 2 share the SAME body — only the recipient differs. 7/8/9
 * share the SAME composer — only the EmailLog.type + AI bodyText
 * differ. 11 and 12 share the SAME alert infrastructure — only
 * the alert key + subject + blocks differ.)
 */
import { describe, it, expect } from "bun:test";
import { brandedEmailHtml, type EmailBlock } from "@/lib/email-template";
import { BRAND, CONTACT } from "@/lib/brand";
import {
  // 4-payload-type composers (subscriber / inquiry / post / broadcast)
  composeBody,
  composeBlocks,
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
 *  Constants + helpers
 * ────────────────────────────────────────────────────────────────── */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || CONTACT.site;
const LOGO_URL = `${SITE_URL}/images/logo.png`;
const PORTAL_URL = "https://app.okomba.com/portal/AbC123_XyZ789-pQr456";

// Format mirrors notify.ts fmtNaira() — used to assert amounts render.
const fmtNaira = (n: number): string =>
  `\u20A6${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

/* ── Branded-element assertions (applied uniformly to every HTML body) ──
 * These are H1-H9 from the file-header docstring. Each rule is a
 * single expectation with a descriptive failure message. */
function assertBrandedHtml(html: string, label: string, opts?: { ctaUrl?: string }): void {
  // H1 — ink header band + Okomba logo
  expect(
    html,
    `${label}: H1 — header band must use BRAND.primary (#${BRAND.primary.replace("#", "")}) background`
  ).toContain(`background:${BRAND.primary}`);
  expect(
    html,
    `${label}: H1 — Okomba Analytics logo <img> must be present`
  ).toContain(`<img src="${LOGO_URL}"`);
  expect(
    html,
    `${label}: H1 — logo alt text must be "Okomba Analytics"`
  ).toContain(`alt="Okomba Analytics"`);

  // H2 — title in Georgia serif
  expect(
    html,
    `${label}: H2 — title must use Georgia serif font-family`
  ).toContain(`font-family:Georgia,'Times New Roman',serif`);

  // H3 — CTA button (when applicable) is gold with the correct href
  if (opts?.ctaUrl) {
    expect(
      html,
      `${label}: H3 — CTA button must use BRAND.accent (gold) background`
    ).toContain(`background:${BRAND.accent}`);
    // The href must be the exact URL (esc() escapes & → &amp; etc.,
    // but our test URLs have no such chars so they appear verbatim).
    expect(
      html,
      `${label}: H3 — CTA href must be the per-invoice / per-subscriber URL`
    ).toContain(`href="${opts.ctaUrl}"`);
  }

  // H4 — gold divider (border-top in a styled div)
  expect(
    html,
    `${label}: H4 — divider must be a border-top styled div`
  ).toContain(`border-top:1px solid`);

  // H5 — footer with mailto + tel + WhatsApp + site
  expect(
    html,
    `${label}: H5 — footer must contain the mailto: link`
  ).toContain(`mailto:${CONTACT.email}`);
  expect(
    html,
    `${label}: H5 — footer must contain the phone number`
  ).toContain(CONTACT.phone);
  expect(
    html,
    `${label}: H5 — footer must contain the wa.me WhatsApp link`
  ).toContain(CONTACT.whatsapp);
  expect(
    html,
    `${label}: H5 — footer must contain the website URL`
  ).toContain(SITE_URL);
  expect(
    html,
    `${label}: H5 — footer must contain the OKOMBA ANALYTICS wordmark`
  ).toContain("OKOMBA ANALYTICS");

  // H6 — bottom ink band with the spec tagline
  expect(
    html,
    `${label}: H6 — bottom band must use BRAND.primary background`
  ).toContain(`background:${BRAND.primary}`);
  expect(
    html,
    `${label}: H6 — bottom band must carry the spec tagline`
  ).toContain("SENT BY OKOMBA ANALYTICS · KEEP THIS EMAIL FOR YOUR RECORDS");

  // H7 — responsive — 600px-wide table-based HTML
  expect(
    html,
    `${label}: H7 — body must be a table-based HTML email`
  ).toContain("<table");
  expect(
    html,
    `${label}: H7 — inner table must be 600px max-width`
  ).toContain('width="600"');
  expect(
    html,
    `${label}: H7 — viewport meta tag must be present (responsive)`
  ).toContain(`name="viewport"`);

  // H8 — no /payment/... placeholder URLs
  expect(
    html,
    `${label}: H8 — HTML must not contain /payment/ placeholder URLs`
  ).not.toContain("/payment/");

  // H9 — no {name} / ${var} template-placeholder leakage
  expect(
    html,
    `${label}: H9 — HTML must not contain {placeholder} style template leaks`
  ).not.toMatch(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/);
  expect(
    html,
    `${label}: H9 — HTML must not contain \${placeholder} style template-literal leaks`
  ).not.toMatch(/\$\{[a-zA-Z_][a-zA-Z0-9_.]*\}/);
}

/* ── Plain-text well-formedness + content (P1-P4) ──────────────────
 * Reuse the B1-C well-formedness rules (R1 no HTML tags, R3 no
 * placeholder leaks) + add the B3 content assertions. */
const HTML_TAG_RE =
  /<\/?(br|p|div|span|a|img|b|i|strong|em|u|s|table|thead|tbody|tr|td|th|ul|ol|li|h[1-6]|hr|meta|html|head|title|link|style|script|font|center|small|sub|sup|mark|code|pre|blockquote|figure|figcaption|article|section|header|footer|nav|aside|main|form|input|button|label|textarea|select|option|fieldset|legend|datalist|optgroup|output|progress|meter|details|summary|dialog|canvas|svg|video|audio|source|track|iframe|object|embed|param|picture|map|area|col|colgroup|caption|abbr|address|cite|q|dfn|kbd|samp|var|time|ins|del|wbr|ruby|rt|rp|bdi|bdo)\b[^>]*>/i;
const CURLY_PLACEHOLDER_RE = /\{[a-zA-Z_][a-zA-Z0-9_]*\}/;
const TEMPLATE_LITERAL_LEAK_RE = /\$\{[a-zA-Z_][a-zA-Z0-9_.]*\}/;

function assertPlainTextWellFormed(body: string, label: string): void {
  expect(
    body,
    `${label}: P — plain-text body must not contain HTML tags`
  ).not.toMatch(HTML_TAG_RE);
  expect(
    body,
    `${label}: P — plain-text body must not contain {placeholder} leaks`
  ).not.toMatch(CURLY_PLACEHOLDER_RE);
  expect(
    body,
    `${label}: P — plain-text body must not contain \${placeholder} leaks`
  ).not.toMatch(TEMPLATE_LITERAL_LEAK_RE);
}

/* ──────────────────────────────────────────────────────────────────
 *  Sample payloads — realistic data so placeholder leakage that
 *  a synthetic "TEST" payload would mask is caught.
 * ────────────────────────────────────────────────────────────────── */

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

// Helper to build a reminder payload for any of the 3 kinds (so the
// 3 reminder describe blocks share a single source of truth).
function buildReminderPayload(kind: ReminderEmailPayload["kind"]): ReminderEmailPayload {
  return {
    invoiceId: "inv_abc123",
    invoiceNumber: "INV-2026-0001",
    kind,
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
    pdfBase64: "JVBERi0xLjQK", // tiny synthetic PDF base64
    pdfFilename: "Okomba_Proposal_INV-2026-0001.pdf",
    portalUrl: PORTAL_URL,
  };
}

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
  pdfBase64: "JVBERi0xLjQK", // tiny synthetic PDF base64
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
  paystackReference: "OKM-INV-2026-0001-1739500000000",
  bodyText:
    "Hi Ada — payment confirmed. Thanks for choosing Okomba Analytics. Your project kickoff is scheduled within 24 hours.",
  pdfBase64: "JVBERi0xLjQK", // tiny synthetic PDF base64
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
 *  HTML composition helpers — mirror the EXACT brandedEmailHtml
 *  call each production function makes. (For inquiry/subscriber/
 *  post/broadcast the test calls the exported composeBlocks();
 *  for reminder/proposal/payment/proof the test recreates the
 *  inline block arrays — copied verbatim from src/lib/notify.ts.)
 * ────────────────────────────────────────────────────────────────── */

// inquiry.created / subscriber.welcome / post.published / broadcast
// share the SAME composition in deliverOne() — only the payload +
// CTA + footerNote differ. This helper mirrors deliverOne's HTML call.
function composeGenericHtml(payload: InquiryNotificationPayload | SubscriberNotificationPayload | PostPublishedNotificationPayload | BroadcastNotificationPayload): string {
  const subject = subjectFor(payload);
  const body = composeBody(payload);
  return brandedEmailHtml({
    title: subject,
    preheader: body.split("\n").find((l) => l.trim().length > 20) ?? subject,
    blocks: composeBlocks(payload),
    ...(payload.type === "post.published"
      ? { ctaText: "Read the article", ctaUrl: `${SITE_URL}/#insights` }
      : {}),
    ...(payload.type === "subscriber.welcome" && payload.confirmUrl
      ? { ctaText: "Confirm subscription", ctaUrl: payload.confirmUrl }
      : {}),
    footerNote:
      payload.type === "subscriber.welcome"
        ? "You're receiving this because you subscribed at okomba.com. Not you? Ignore this email."
        : undefined,
  });
}

// invoice.reminder_* — mirrors sendReminderEmail's inline HTML call.
function composeReminderHtml(rem: ReminderEmailPayload): string {
  const subject = reminderSubject(rem);
  const body = composeReminderBody(rem);
  return brandedEmailHtml({
    title: `Reminder — ${rem.invoiceNumber}`,
    preheader: `${fmtNaira(rem.amountNaira)} · due ${rem.dueLabel}`,
    blocks: [
      { kind: "text", text: rem.bodyText },
      {
        kind: "kv",
        rows: [
          ["Invoice", rem.invoiceNumber],
          ["Amount", fmtNaira(rem.amountNaira)],
          ["Due date", rem.dueLabel],
        ],
      },
      ...(rem.dvaAccountNumber
        ? ([
            {
              kind: "text",
              text: `Pay by bank transfer:\nBank: ${rem.dvaBankName ?? ""}\nAccount: ${rem.dvaAccountNumber}\nAccount name: ${rem.dvaAccountName ?? "Okomba Analytics"}`,
            },
          ] as EmailBlock[])
        : []),
      { kind: "text", text: "The PDF attached to this email contains the full proposal, invoice and payment details." },
    ],
    ...(rem.portalUrl ? { ctaText: "View & pay in your portal", ctaUrl: rem.portalUrl } : {}),
    footerNote: "Already paid? Reply to this email and we will confirm right away.",
  });
}

// invoice.sent — mirrors sendProposalEmail's inline HTML call.
function composeProposalHtml(inv: InvoiceEmailPayload): string {
  const subject = proposalSubject(inv);
  const body = composeProposalBody(inv);
  const due = inv.dueDate
    ? new Date(inv.dueDate).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  return brandedEmailHtml({
    title: `Your Proposal — ${inv.invoiceNumber}`,
    preheader: `${inv.service} — ${fmtNaira(inv.amountNaira)}${due ? ` · due ${due}` : ""}`,
    blocks: [
      {
        kind: "text",
        text: `Dear ${inv.customerName},\nThank you for choosing Okomba Analytics. Your proposal and invoice are attached to this email as a single PDF document.`,
      },
      {
        kind: "kv",
        rows: [
          ["Invoice", inv.invoiceNumber],
          ["Service", inv.service],
          ["Amount", fmtNaira(inv.amountNaira)],
          ...(inv.durationLabel
            ? ([["Duration", inv.durationLabel]] as [string, string][])
            : []),
          ...(due ? ([["Due date", due]] as [string, string][]) : []),
        ],
      },
      ...(inv.dvaAccountNumber
        ? ([
            {
              kind: "text",
              text: `Payment account (Paystack Dedicated Virtual Account):\nBank: ${inv.dvaBankName ?? ""}\nAccount: ${inv.dvaAccountNumber}\nAccount name: ${inv.dvaAccountName ?? "Okomba Analytics"}`,
            },
          ] as EmailBlock[])
        : []),
      ...(inv.description ? ([{ kind: "text", text: inv.description }] as EmailBlock[]) : []),
      { kind: "text", text: "The PDF attached to this email is your official proposal and invoice." },
    ],
    ...(inv.portalUrl
      ? { ctaText: "View your proposal online", ctaUrl: inv.portalUrl }
      : {}),
    footerNote: "Questions about this proposal? Reply to this email or reach us on WhatsApp.",
  });
}

// payment.received — mirrors sendPaymentThankYouEmail's inline HTML call.
function composePaymentThankYouHtml(p: PaymentEmailPayload): string {
  const subject = paymentThankYouSubject(p);
  const body = composePaymentThankYouBody(p);
  return brandedEmailHtml({
    title: `Payment Received — ${p.receiptNumber}`,
    preheader: `${fmtNaira(p.amountNaira)} · invoice ${p.invoiceNumber} settled`,
    blocks: [
      { kind: "text", text: p.bodyText },
      {
        kind: "kv",
        rows: [
          ["Receipt", p.receiptNumber],
          ["Invoice", p.invoiceNumber],
          ["Amount paid", fmtNaira(p.amountNaira)],
          ["Date paid", p.paidLabel],
          ...(p.paystackReference
            ? ([["Paystack ref", p.paystackReference]] as [string, string][])
            : []),
        ],
      },
      {
        kind: "text",
        text: "The PDF attached to this email is your official receipt. Your project kickoff is scheduled within 24 hours — a start confirmation is on its way.",
      },
    ],
    footerNote: "Questions about this payment? Reply to this email or reach us on WhatsApp.",
  });
}

// payment_proof_uploaded — mirrors notifyPaymentProofUploaded's
// sendAdminAlertEmail call (which carries a CTA to /#/admin).
function composePaymentProofAlertHtml(a: PaymentProofAlertPayload): string {
  const subject = paymentProofAlertSubject(a);
  const body = composePaymentProofAlertBody(a);
  return brandedEmailHtml({
    title: subject,
    preheader: body.split("\n")[0]?.slice(0, 120) ?? subject,
    blocks: [
      { kind: "text", text: `${a.customerName} just uploaded a payment proof via the client portal.` },
      {
        kind: "kv",
        rows: [
          ["Invoice", a.invoiceNumber],
          ["Amount", fmtNaira(a.amountNaira)],
          ["Customer email", a.customerEmail],
          ["Proof file", `${a.fileName} (${Math.max(1, Math.round(a.sizeBytes / 1024))} KB)`],
        ],
      },
    ],
    ctaText: "Open admin Payments",
    ctaUrl: `${SITE_URL}/#/admin`,
    footerNote: "Automated operational alert from the Okomba Analytics platform.",
  });
}

/* ──────────────────────────────────────────────────────────────────
 *  Test cases — one describe block per email type. Each block runs
 *  H1-H9 on the HTML + P1-P4 on the plain text + D1-D4 on the data.
 * ────────────────────────────────────────────────────────────────── */

describe("Email render audit (B3 / Master Directive §4 + §6 + §15)", () => {
  /* ── 1. inquiry.created — admin copy ────────────────────────── */
  describe("inquiry.created (admin copy)", () => {
    const html = composeGenericHtml(inquiryPayload);
    const body = composeBody(inquiryPayload);

    it("H1-H9: HTML is well-formed branded (header, title, divider, footer, bottom band, 600px, no leaks)", () => {
      assertBrandedHtml(html, "inquiry.created (admin)");
    });

    it("P: plain-text is well-formed (no HTML, no leaks)", () => {
      assertPlainTextWellFormed(body, "inquiry.created (admin)");
    });

    it("D1-D4: body contains the customer's name + service + email + message (no placeholders)", () => {
      expect(body).toContain(inquiryPayload.inquiry.name);
      expect(body).toContain(inquiryPayload.inquiry.service);
      expect(body).toContain(inquiryPayload.inquiry.email);
      expect(body).toContain(inquiryPayload.inquiry.message);
      expect(body).not.toContain("{name}");
      expect(body).not.toContain("/payment/");
    });

    it("H3: HTML has NO CTA button (info-only email — by design)", () => {
      expect(html).not.toContain('href="https://app.okomba.com/portal/');
      expect(html).not.toContain(">View your proposal<");
    });
  });

  /* ── 2. inquiry.created — submitter confirmation ────────────── */
  describe("inquiry.created (submitter confirmation)", () => {
    // The body is the SAME as the admin copy — only the recipient
    // differs. (Production: deliverOne is called twice with the
    // same payload; once to FROM_EMAIL, once to inquiry.email.)
    const html = composeGenericHtml(inquiryPayload);
    const body = composeBody(inquiryPayload);

    it("H1-H9: HTML is well-formed branded (admin + submitter share the same body)", () => {
      assertBrandedHtml(html, "inquiry.created (submitter)");
    });

    it("P: plain-text is well-formed", () => {
      assertPlainTextWellFormed(body, "inquiry.created (submitter)");
    });

    it("D1: the submitter's name appears in the body (not a generic 'Dear Customer')", () => {
      expect(body).toContain(inquiryPayload.inquiry.name);
    });
  });

  /* ── 3. subscriber.welcome ───────────────────────────────────── */
  describe("subscriber.welcome (double opt-in confirmation)", () => {
    const html = composeGenericHtml(subscriberWelcomePayload);
    const body = composeBody(subscriberWelcomePayload);

    it("H1-H9: HTML is well-formed branded + H3 CTA points to confirmUrl", () => {
      assertBrandedHtml(html, "subscriber.welcome", {
        ctaUrl: subscriberWelcomePayload.confirmUrl,
      });
    });

    it("P: plain-text is well-formed", () => {
      assertPlainTextWellFormed(body, "subscriber.welcome");
    });

    it("P2 + D4: plain-text body contains the confirmUrl (text-only mail clients can copy-paste)", () => {
      expect(body).toContain(subscriberWelcomePayload.confirmUrl as string);
      expect(body).toMatch(/Confirm your subscription:\s+https?:\/\//);
    });
  });

  /* ── 4. post.published ──────────────────────────────────────── */
  describe("post.published (new article notification)", () => {
    const html = composeGenericHtml(postPublishedPayload);
    const body = composeBody(postPublishedPayload);

    it("H1-H9: HTML is well-formed branded + H3 CTA points to /#insights", () => {
      assertBrandedHtml(html, "post.published", {
        ctaUrl: `${SITE_URL}/#insights`,
      });
    });

    it("P: plain-text is well-formed", () => {
      assertPlainTextWellFormed(body, "post.published");
    });

    it("P2 + D1: plain-text contains the article URL + post title + author", () => {
      expect(body).toContain("/#insights");
      expect(body).toMatch(/Read the full article:\s+https?:\/\//);
      expect(body).toContain(postPublishedPayload.postTitle);
      expect(body).toContain(postPublishedPayload.author);
    });
  });

  /* ── 5. broadcast ───────────────────────────────────────────── */
  describe("broadcast (admin-composed body)", () => {
    const html = composeGenericHtml(broadcastPayload);
    const body = composeBody(broadcastPayload);

    it("H1-H9: HTML is well-formed branded (no CTA by design — admin-composed body)", () => {
      assertBrandedHtml(html, "broadcast");
    });

    it("P: plain-text is the admin-composed text verbatim", () => {
      assertPlainTextWellFormed(body, "broadcast");
      expect(body).toBe(broadcastPayload.body);
    });

    it("D: body carries the admin-composed subject (not a generic placeholder)", () => {
      expect(subjectFor(broadcastPayload)).toBe(broadcastPayload.subject);
    });
  });

  /* ── 6. invoice.sent (proposal email) ───────────────────────── */
  describe("invoice.sent (proposal email — Master Directive §6 payment CTA)", () => {
    const html = composeProposalHtml(proposalPayload);
    const body = composeProposalBody(proposalPayload);
    const subject = proposalSubject(proposalPayload);

    it("H1-H9: HTML is well-formed branded + H3 CTA points to the per-invoice portalUrl", () => {
      assertBrandedHtml(html, "invoice.sent", {
        ctaUrl: proposalPayload.portalUrl as string,
      });
    });

    it("P: plain-text is well-formed", () => {
      assertPlainTextWellFormed(body, "invoice.sent");
    });

    it("subject matches the spec 'Your Proposal from Okomba Analytics - Invoice #INV-xxx'", () => {
      expect(subject).toBe(
        `Your Proposal from Okomba Analytics - Invoice #${proposalPayload.invoiceNumber}`
      );
    });

    it("D1: customer's name appears (greeting 'Dear Ada Okonkwo,')", () => {
      expect(body).toContain(`Dear ${proposalPayload.customerName}`);
    });

    it("D2: invoice number appears (no placeholder)", () => {
      expect(body).toContain(proposalPayload.invoiceNumber);
    });

    it("D3: amount in Naira appears (₦950,000)", () => {
      expect(body).toContain(fmtNaira(proposalPayload.amountNaira));
    });

    it("D4: CTA URL (portalUrl) appears in the plain text (R7-equivalent for B3)", () => {
      expect(body).toContain(PORTAL_URL);
      expect(body).toMatch(/View your proposal:\s+https?:\/\//);
    });

    it("D: DVA account details appear in the body (so the customer can pay by bank transfer)", () => {
      expect(body).toContain(proposalPayload.dvaAccountNumber as string);
      expect(body).toContain(proposalPayload.dvaBankName as string);
    });
  });

  /* ── 7. invoice.reminder_3d (friendly) ──────────────────────── */
  describe("invoice.reminder_3d (friendly reminder — Master Directive §6 payment CTA)", () => {
    const rem = buildReminderPayload("friendly");
    const html = composeReminderHtml(rem);
    const body = composeReminderBody(rem);

    it("H1-H9: HTML is well-formed branded + H3 CTA points to the per-invoice portalUrl", () => {
      assertBrandedHtml(html, "invoice.reminder_3d", { ctaUrl: rem.portalUrl as string });
    });

    it("P: plain-text is well-formed", () => {
      assertPlainTextWellFormed(body, "invoice.reminder_3d");
    });

    it("D1-D3: body contains customer name (in bodyText) + invoice + amount + due date", () => {
      expect(body).toContain(rem.invoiceNumber);
      expect(body).toContain(fmtNaira(rem.amountNaira));
      expect(body).toContain(rem.dueLabel);
      expect(body).toContain(rem.dvaAccountNumber as string);
      // The bodyText contains the customer's first name (Hi Ada)
      expect(body).toContain("Ada");
    });

    it("D4: CTA URL (portalUrl) appears in the plain text", () => {
      expect(body).toContain(PORTAL_URL);
      expect(body).toMatch(/View your proposal:\s+https?:\/\//);
    });
  });

  /* ── 8. invoice.reminder_due ────────────────────────────────── */
  describe("invoice.reminder_due (due-date reminder)", () => {
    const rem = buildReminderPayload("due");
    const html = composeReminderHtml(rem);
    const body = composeReminderBody(rem);

    it("H1-H9: HTML is well-formed branded + H3 CTA points to portalUrl", () => {
      assertBrandedHtml(html, "invoice.reminder_due", { ctaUrl: rem.portalUrl as string });
    });

    it("P: plain-text is well-formed", () => {
      assertPlainTextWellFormed(body, "invoice.reminder_due");
    });

    it("D2-D3: body contains invoice + amount + due date + DVA account", () => {
      expect(body).toContain(rem.invoiceNumber);
      expect(body).toContain(fmtNaira(rem.amountNaira));
      expect(body).toContain(rem.dueLabel);
      expect(body).toContain(rem.dvaAccountNumber as string);
    });
  });

  /* ── 9. invoice.reminder_overdue ────────────────────────────── */
  describe("invoice.reminder_overdue (post-due reminder)", () => {
    const rem = buildReminderPayload("overdue");
    const html = composeReminderHtml(rem);
    const body = composeReminderBody(rem);

    it("H1-H9: HTML is well-formed branded + H3 CTA points to portalUrl", () => {
      assertBrandedHtml(html, "invoice.reminder_overdue", { ctaUrl: rem.portalUrl as string });
    });

    it("P: plain-text is well-formed", () => {
      assertPlainTextWellFormed(body, "invoice.reminder_overdue");
    });

    it("D2-D3: body contains invoice + amount + due date + DVA account", () => {
      expect(body).toContain(rem.invoiceNumber);
      expect(body).toContain(fmtNaira(rem.amountNaira));
      expect(body).toContain(rem.dueLabel);
      expect(body).toContain(rem.dvaAccountNumber as string);
    });
  });

  /* ── 10. payment.received (thank-you email) ─────────────────── */
  describe("payment.received (thank-you email)", () => {
    const html = composePaymentThankYouHtml(paymentPayload);
    const body = composePaymentThankYouBody(paymentPayload);
    const subject = paymentThankYouSubject(paymentPayload);

    it("H1-H9: HTML is well-formed branded (NO CTA — receipt PDF is attached, not linked)", () => {
      assertBrandedHtml(html, "payment.received");
      // By design: no ctaUrl is set in sendPaymentThankYouEmail.
      expect(html).not.toContain('href="https://app.okomba.com/portal/');
    });

    it("P: plain-text is well-formed", () => {
      assertPlainTextWellFormed(body, "payment.received");
    });

    it("subject matches the spec 'Thank You — Payment Received for Invoice #INV-xxx'", () => {
      expect(subject).toBe(
        `Thank You — Payment Received for Invoice #${paymentPayload.invoiceNumber}`
      );
    });

    it("D1-D3: body contains receipt number + invoice + amount paid + paid label + Paystack ref", () => {
      expect(body).toContain(paymentPayload.receiptNumber);
      expect(body).toContain(paymentPayload.invoiceNumber);
      expect(body).toContain(fmtNaira(paymentPayload.amountNaira));
      expect(body).toContain(paymentPayload.paidLabel);
      expect(body).toContain(paymentPayload.paystackReference as string);
      // The bodyText contains the customer's first name
      expect(body).toContain("Ada");
    });
  });

  /* ── 11. payment_proof_uploaded (system.alert subtype) ─────── */
  describe("payment_proof_uploaded (admin alert — payment proof uploaded)", () => {
    const html = composePaymentProofAlertHtml(paymentProofPayload);
    const body = composePaymentProofAlertBody(paymentProofPayload);
    const subject = paymentProofAlertSubject(paymentProofPayload);

    it("H1-H9: HTML is well-formed branded + H3 CTA points to /#/admin (Payments tab)", () => {
      assertBrandedHtml(html, "payment_proof_uploaded", {
        ctaUrl: `${SITE_URL}/#/admin`,
      });
    });

    it("P: plain-text is well-formed", () => {
      assertPlainTextWellFormed(body, "payment_proof_uploaded");
    });

    it("subject carries the invoice number + customer name", () => {
      expect(subject).toContain(paymentProofPayload.invoiceNumber);
      expect(subject).toContain(paymentProofPayload.customerName);
    });

    it("D1-D3: body contains customer name + invoice + email + amount + proof file name", () => {
      expect(body).toContain(paymentProofPayload.customerName);
      expect(body).toContain(paymentProofPayload.invoiceNumber);
      expect(body).toContain(paymentProofPayload.customerEmail);
      expect(body).toContain(fmtNaira(paymentProofPayload.amountNaira));
      expect(body).toContain(paymentProofPayload.fileName);
    });

    it("D4: body carries the customer's portalUrl (admin needs both portal + Payments tab)", () => {
      expect(body).toContain(PORTAL_URL);
      expect(body).toMatch(/Portal:\s+https?:\/\//);
    });
  });

  /* ── 12. system.alert (generic admin alert) ──────────────────
   * The payment_proof_uploaded path IS the system.alert path
   * (notifyPaymentProofUploaded wraps sendAdminAlertEmail which is
   * the generic admin-alert sender). This block exercises a bare
   * admin alert without the payment-proof wrapper — directly via
   * brandedEmailHtml + the same blocks pattern — to ensure generic
   * alerts also meet the brand bar. */
  describe("system.alert (generic operational alert)", () => {
    const alertSubject = "Cloudinary unconfigured — PDF storage falling back to local";
    const alertBodyText =
      "Cloudinary cloud name + API key are not set. PDF storage is falling back to local. Configure Cloudinary to enable CDN-hosted proposal attachments.";
    const html = brandedEmailHtml({
      title: alertSubject,
      preheader: alertBodyText.split("\n")[0]?.slice(0, 120) ?? alertSubject,
      blocks: [{ kind: "text", text: alertBodyText }],
      ctaText: "Configure Cloudinary",
      ctaUrl: `${SITE_URL}/#/admin/settings`,
      footerNote: "Automated operational alert from the Okomba Analytics platform.",
    });

    it("H1-H9: HTML is well-formed branded + H3 CTA points to /#/admin/settings", () => {
      assertBrandedHtml(html, "system.alert", {
        ctaUrl: `${SITE_URL}/#/admin/settings`,
      });
    });

    it("H8: no /payment/ placeholder URLs (admin alert — payment-agnostic)", () => {
      expect(html).not.toContain("/payment/");
    });

    it("D: alert subject appears in the title (not a generic 'Alert')", () => {
      expect(html).toContain(alertSubject);
      expect(html).toContain("Cloudinary");
    });
  });

  /* ── Cross-email: every HTML body contains the bottom band +
   * footer + logo + 600px width. */
  describe("Cross-email invariants (every HTML body meets the brand bar)", () => {
    const allHtml: [string, string][] = [
      ["inquiry.created (admin)", composeGenericHtml(inquiryPayload)],
      ["inquiry.created (submitter)", composeGenericHtml(inquiryPayload)],
      ["subscriber.welcome", composeGenericHtml(subscriberWelcomePayload)],
      ["post.published", composeGenericHtml(postPublishedPayload)],
      ["broadcast", composeGenericHtml(broadcastPayload)],
      ["invoice.sent", composeProposalHtml(proposalPayload)],
      ["invoice.reminder_3d", composeReminderHtml(buildReminderPayload("friendly"))],
      ["invoice.reminder_due", composeReminderHtml(buildReminderPayload("due"))],
      ["invoice.reminder_overdue", composeReminderHtml(buildReminderPayload("overdue"))],
      ["payment.received", composePaymentThankYouHtml(paymentPayload)],
      ["payment_proof_uploaded", composePaymentProofAlertHtml(paymentProofPayload)],
    ];

    for (const [label, html] of allHtml) {
      it(`${label}: HTML contains the bottom ink band ("SENT BY OKOMBA ANALYTICS · KEEP THIS EMAIL FOR YOUR RECORDS")`, () => {
        expect(html).toContain("SENT BY OKOMBA ANALYTICS · KEEP THIS EMAIL FOR YOUR RECORDS");
      });

      it(`${label}: HTML contains the Okomba logo image (header band)`, () => {
        expect(html).toContain(`<img src="${LOGO_URL}"`);
        expect(html).toContain('alt="Okomba Analytics"');
      });

      it(`${label}: HTML contains the mailto: + tel + wa.me footer`, () => {
        expect(html).toContain(`mailto:${CONTACT.email}`);
        expect(html).toContain(CONTACT.phone);
        expect(html).toContain(CONTACT.whatsapp);
      });

      it(`${label}: HTML is 600px-wide table-based + responsive`, () => {
        expect(html).toContain('width="600"');
        expect(html).toContain(`name="viewport"`);
        expect(html).toContain("<table");
      });

      it(`${label}: HTML has NO /payment/ placeholder URLs (Master Directive §6 — CTA goes to /portal/[secureToken] not /payment/...)`, () => {
        expect(html).not.toContain("/payment/");
      });

      it(`${label}: HTML has NO {placeholder} or \${placeholder} leakage`, () => {
        expect(html).not.toMatch(CURLY_PLACEHOLDER_RE);
        expect(html).not.toMatch(TEMPLATE_LITERAL_LEAK_RE);
      });
    }
  });
});
