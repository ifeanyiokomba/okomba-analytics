/**
 * Code.gs v5 ⇄ Apps-Script-Provider Payload Shape Contract (Batch 5)
 * =================================================================
 *
 * Task ID: B5 (Batch 5) — Master Directive §3.A + §5 Batch 5.
 *
 * ─── What does this test verify? ───────────────────────────────────
 * Asserts the EXACT payload shape that the Phase 29 email-failover
 * chain POSTs to the Apps Script Web App /exec URL (Code.gs v5) —
 * and runs that payload through a faithful TypeScript replica of
 * Code.gs v5's `doPost(e)` routing to surface any field-name
 * mismatch that would silently break email delivery.
 *
 * Two delivery paths are covered:
 *
 *   1. MODERN apps_script provider — `src/lib/email-config.ts`
 *      `callProviderApi({provider: "apps_script", ...})`. Active
 *      when an admin has configured the apps_script provider in the
 *      admin Settings tab (EmailProviderConfig row with provider
 *      = "apps_script"). The payload is built by the exported
 *      `buildAppsScriptPayload(opts)` helper (extracted in B5).
 *
 *   2. LEGACY NOTIFY_WEBHOOK_URL fallback — `src/lib/email-failover.ts`
 *      `deliverWithFailover()` falls back to a direct fetch against
 *      the `NOTIFY_WEBHOOK_URL` env var when no EmailProviderConfig
 *      rows are configured. The payload is built by the exported
 *      `buildLegacyAppsScriptPayload(opts, ctx)` helper (extracted
 *      in B5).
 *
 * ─── How does it verify Code.gs v5's expectations? ─────────────────
 * The Code.gs v5 file at `Google-apps-script/Code.gs` is the
 * authoritative source for what fields the Apps Script Web App
 * reads from the incoming JSON. This test file contains a
 * `simulateCodeGsDoPostV5()` function that is a FAITHFUL
 * TypeScript replica of Code.gs v5's routing logic — covering
 * `doPost`, `handleNotification`, `handleInquiryNotification`,
 * `handleLegacyInquiry`, `sendInvoiceEmail`, and `sendSimpleEmail`.
 *
 * If Code.gs is ever updated, this simulator MUST be updated to
 * match — that's the drift-detection contract this test enforces.
 *
 * ─── Critical integration finding (B5 — see docs/codegs-reconciliation.md §C) ───
 * The Phase 29 failover chain sends `to` as the recipient field
 * name. Code.gs v5's `handleNotification` path reads `recipient`
 * (NOT `to`). Result: every non-invoice email sent through either
 * path is SILENTLY DROPPED (MailApp.sendEmail's `if (!opts.to)
 * return` early-exit fires because `data.recipient` is undefined).
 *
 * The scenarios below EXPLICITLY ASSERT the broken behavior as a
 * snapshot — the test PASSES today by asserting the bug exists.
 * If anyone fixes the bug (either by changing the provider to send
 * `recipient` OR by changing Code.gs to read `to`), the affected
 * scenario's assertion will FAIL — surfacing the contract change.
 *
 * The invoice-email scenarios via the LEGACY fallback path are the
 * ONLY working scenarios today: notify.ts passes
 * `legacyAction: "sendInvoiceEmail"` for invoice.sent /
 * invoice.reminder_* / payment.received, and Code.gs routes
 * `action: "sendInvoiceEmail"` → `sendInvoiceEmail(data)` which
 * reads `data.to` (and `data.base64Pdf` + `data.filename` +
 * `data.invoiceSummary` for the PDF attachment + Sheets backup).
 *
 * ─── Test design ───────────────────────────────────────────────────
 *   - Uses `bun:test` (same harness as B1-A / B1-C / B3).
 *   - Zero DB / zero network / zero env vars required — pure
 *     string assertions on the simulated routing outcome.
 *   - Each email type gets its own describe block so a failure in
 *     one type doesn't cascade.
 *   - The simulator returns a `SimResult` discriminated union:
 *       { delivered: true,  to, subject }  → MailApp.sendEmail would fire
 *       { delivered: false, reason }       → email silently dropped
 *
 * Email types covered (10):
 *   1.  inquiry.created          (notify.ts deliverOne, type=inquiry.created)
 *   2.  subscriber.welcome      (notify.ts deliverOne, type=subscriber.welcome)
 *   3.  post.published           (notify.ts deliverOne, type=post.published)
 *   4.  broadcast                (notify.ts deliverOne, type=broadcast)
 *   5.  invoice.sent             (notify.ts sendProposalEmail, legacyAction=sendInvoiceEmail)
 *   6.  invoice.reminder_3d      (notify.ts sendReminderEmail, legacyAction=sendInvoiceEmail)
 *   7.  invoice.reminder_due     (same as 6, type variant)
 *   8.  invoice.reminder_overdue (same as 6, type variant)
 *   9.  payment.received         (notify.ts sendPaymentThankYouEmail, legacyAction=sendInvoiceEmail)
 *   10. system.alert             (notify.ts sendAdminAlertEmail, legacyAction=sendEmail)
 */
import { describe, it, expect } from "bun:test";
import { buildAppsScriptPayload } from "@/lib/email-config";
import { buildLegacyAppsScriptPayload } from "@/lib/email-failover";

/* ════════════════════════════════════════════════════════════════
 * CODE.GS v5 doPost SIMULATOR — faithful TS replica of the actual
 * Code.gs v5 routing logic. If Code.gs is updated, this simulator
 * MUST be updated to match (that's the drift-detection contract).
 * ════════════════════════════════════════════════════════════════ */

type SimResult = {
  delivered: boolean;
  to?: string;
  subject?: string;
  reason?: string;
  // Mirrors Code.gs's `saveToSheet(inq)` side-effect — when an
  // inquiry is processed, a row is appended to the Inquiries tab.
  // This flag tracks whether saveToSheet would have been called.
  sheetRowAppended?: boolean;
};

// CONFIG — mirrors Code.gs v5 lines 88-121
const SIM_CONFIG = {
  SHEET_ID: "14ocJfSFpsm2MOaI8eAPJ8E4VMh84aJQ1GgoQu7v57sY",
  SHEET_NAME: "Inquiries",
  FROM_EMAIL: "support@okomba.com",
  REPLY_TO_EMAIL: "support@okomba.com",
  ADMIN_EMAIL: "support@okomba.com",
  BUSINESS_NAME: "OKOMBA ANALYTICS",
  SITE_URL: "https://www.okomba.com",
};

// Code.gs v5 sendSimpleEmail — replicates lines 449-480.
// CRITICAL: has an `if (!opts.to) return;` early-exit that silently
// drops the email if the recipient is missing.
function sim_sendSimpleEmail(opts: {
  to?: string;
  subject?: string;
  body?: string;
  html?: string;
  attachments?: unknown[];
  replyTo?: string;
}): SimResult {
  if (!opts.to) {
    return { delivered: false, reason: "no recipient (sendSimpleEmail `if (!opts.to) return` early-exit fired)" };
  }
  return {
    delivered: true,
    to: opts.to,
    subject: opts.subject,
  };
}

// Code.gs v5 sendInvoiceEmail — replicates lines 484-512.
function sim_sendInvoiceEmail(data: {
  to?: string;
  subject?: string;
  body?: string;
  html?: string;
  base64Pdf?: string;
  filename?: string;
  invoiceSummary?: Record<string, unknown>;
  attachments?: unknown[];
}): SimResult {
  // Code.gs builds the attachment array from data.base64Pdf directly
  // (NOT from data.attachments). If base64Pdf is missing, no
  // attachment is added — but the email itself still goes out.
  const attachment = data.base64Pdf
    ? { base64: data.base64Pdf, contentType: "application/pdf", filename: data.filename || "Okomba_Invoice.pdf" }
    : null;
  return sim_sendSimpleEmail({
    to: data.to,
    subject: data.subject,
    body: data.body,
    html: data.html,
    attachments: attachment ? [attachment] : [],
  });
}

// Code.gs v5 handleInquiryNotification — replicates lines 218-241.
// Reads `data.recipient` (NOT data.to) and `data.inquiry` (an object).
function sim_handleInquiryNotification(data: {
  recipient?: string;
  inquiry?: { email?: string; name?: string; service?: string };
}): SimResult {
  const inq = data.inquiry ?? {};
  const isForSubmitter =
    !!(data.recipient && inq.email &&
      String(data.recipient).toLowerCase() === String(inq.email).toLowerCase());

  if (isForSubmitter) {
    // Submitter copy
    return sim_sendSimpleEmail({
      to: inq.email,
      subject: "✅ We received your inquiry — OKOMBA ANALYTICS",
      body: "userConfirmationBody(inq)",
    });
  }
  // Admin copy — also calls saveToSheet(inq)
  const adminResult = sim_sendSimpleEmail({
    to: SIM_CONFIG.ADMIN_EMAIL,
    subject: `🔔 New Inquiry: ${inq.service || "General"} — ${inq.name || ""}`,
    body: "adminAlertBody(inq)",
    replyTo: inq.email,
  });
  return {
    ...adminResult,
    sheetRowAppended: true, // saveToSheet(inq) was called
  };
}

// Code.gs v5 handleLegacyInquiry — replicates lines 244-258.
// Sends admin + submitter emails; reads data.email for submitter.
function sim_handleLegacyInquiry(data: {
  name?: string;
  email?: string;
}): SimResult {
  // Admin copy
  const adminResult = sim_sendSimpleEmail({
    to: SIM_CONFIG.ADMIN_EMAIL,
    subject: `🔔 New Inquiry: General — ${data.name || ""}`,
    body: "adminAlertBody(data)",
    replyTo: data.email,
  });
  // Submitter copy
  if (data.email) {
    const submitterResult = sim_sendSimpleEmail({
      to: data.email,
      subject: "✅ We received your inquiry — OKOMBA ANALYTICS",
      body: "userConfirmationBody(data)",
    });
    if (submitterResult.delivered) return { ...submitterResult, sheetRowAppended: true };
  }
  return { ...adminResult, sheetRowAppended: true };
}

// Code.gs v5 handleNotification — replicates lines 196-213.
// Routes by `data.type`. Reads `data.recipient` (NOT data.to).
// CRITICAL: switch has NO default case — unknown types silently no-op.
function sim_handleNotification(data: {
  type?: string;
  recipient?: string;
  subject?: string;
  body?: string;
  html?: string;
  attachments?: unknown[];
  inquiry?: { email?: string; name?: string; service?: string };
}): SimResult {
  switch (data.type) {
    case "inquiry.created":
      return sim_handleInquiryNotification(data);
    case "subscriber.welcome":
    case "post.published":
    case "broadcast":
      return sim_sendSimpleEmail({
        to: data.recipient,
        subject: data.subject,
        body: (data.body ?? "") + "\n\n" + "FOOTER",
        html: data.html,
        attachments: data.attachments,
      });
    default:
      // Code.gs v5 handleNotification switch has NO default case —
      // unknown types silently no-op (no email sent, no error).
      return { delivered: false, reason: `unmatched type "${data.type}" — handleNotification switch silently no-ops` };
  }
}

// Code.gs v5 doPost — replicates lines 140-187.
function simulateCodeGsDoPostV5(payload: Record<string, unknown>): SimResult {
  const data = payload as {
    action?: string;
    type?: string;
    recipient?: string;
    to?: string;
    subject?: string;
    body?: string;
    html?: string;
    attachments?: unknown[];
    inquiry?: { email?: string; name?: string; service?: string };
    base64Pdf?: string;
    filename?: string;
    invoiceSummary?: Record<string, unknown>;
    name?: string;
    email?: string;
  };

  // Replicate Code.gs v5 doPost routing (lines 144-179)
  try {
    switch (data.action) {
      case "sendInvoiceEmail":
        return sim_sendInvoiceEmail(data);
      case "backupToSheet":
        return { delivered: false, reason: "backupToSheet (no email sent)" };
      case "sendEmail":
      case undefined:
      case null:
        if (data.type) {
          return sim_handleNotification(data);
        } else if (data.name || data.email) {
          return sim_handleLegacyInquiry(data);
        } else if (data.subject && data.recipient) {
          // Bare sendEmail without a type
          return sim_sendSimpleEmail({
            to: data.recipient,
            subject: data.subject,
            body: (data.body ?? "") + "\n\n" + "FOOTER",
            html: data.html,
            attachments: data.attachments,
          });
        } else {
          return { delivered: false, reason: "Unrecognized payload" };
        }
      case "improveWithAI":
        return { delivered: false, reason: "improveWithAI rejected (runs on Next.js server)" };
      default:
        return { delivered: false, reason: `Unknown action: ${data.action}` };
    }
  } catch (err) {
    return { delivered: false, reason: String(err) };
  }
}

/* ════════════════════════════════════════════════════════════════
 * TEST SCENARIOS
 * ════════════════════════════════════════════════════════════════ */

describe("Code.gs v5 ⇄ Apps-Script-Provider Payload Shape Contract (B5)", () => {
  describe("Modern apps_script provider (email-config.ts callProviderApi)", () => {
    const baseOpts = {
      to: "founder@okomba.com",
      subject: "Test email",
      bodyHtml: "<p>HTML body</p>",
      bodyText: "Plain text body",
      attachments: [] as Array<{ filename: string; contentType: string; base64: string }>,
      type: "test",
    };

    it("payload contains exactly the 9 fields the provider sends today (snapshot)", () => {
      const payload = buildAppsScriptPayload(baseOpts);
      // Field set snapshot — if anyone adds/removes a field in
      // email-config.ts buildAppsScriptPayload, this assertion fails
      // and forces the developer to update the simulator + Code.gs.
      expect(Object.keys(payload).sort()).toEqual(
        ["action", "attachments", "body", "bodyHtml", "bodyText", "html", "subject", "to", "type"].sort()
      );
      expect(payload.action).toBe("sendEmail");
      expect(payload.to).toBe("founder@okomba.com");
      expect(payload.subject).toBe("Test email");
      expect(payload.body).toBe("Plain text body");
      expect(payload.html).toBe("<p>HTML body</p>");
      expect(payload.bodyText).toBe("Plain text body");
      expect(payload.bodyHtml).toBe("<p>HTML body</p>");
      expect(payload.attachments).toEqual([]);
      expect(payload.type).toBe("test");
    });

    it("provider NEVER sends action=sendInvoiceEmail (hardcoded sendEmail)", () => {
      // Documenting the contract: the modern apps_script provider
      // hardcodes action="sendEmail" — it ignores notify.ts's
      // `legacyAction` option. This is bug #4 in §C of the
      // reconciliation doc.
      const payload = buildAppsScriptPayload({ ...baseOpts, type: "invoice.sent" });
      expect(payload.action).toBe("sendEmail");
      expect(payload.action).not.toBe("sendInvoiceEmail");
    });

    it("provider does NOT send the `recipient` field (Code.gs v5 reads recipient for handleNotification path)", () => {
      // Documenting the critical mismatch (§C bug #1).
      const payload = buildAppsScriptPayload(baseOpts);
      expect(payload).not.toHaveProperty("recipient");
      expect(payload).toHaveProperty("to");
    });

    it("simulator: action=sendEmail + type=inquiry.created → admin copy sent (to ADMIN_EMAIL), submitter copy NOT sent, sheet row appended with empty inquiry", () => {
      // BUG #1 + #2: provider sends `to` not `recipient` + no `inquiry` field.
      // Result: handleInquiryNotification reads data.recipient=undefined + data.inquiry=undefined
      // → isForSubmitter=false → admin copy sent (with empty body) + blank sheet row.
      // NO submitter confirmation email is sent.
      const payload = buildAppsScriptPayload({ ...baseOpts, type: "inquiry.created" });
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("support@okomba.com"); // admin email, NOT the customer
      expect(result.sheetRowAppended).toBe(true);
    });

    it("simulator: action=sendEmail + type=subscriber.welcome → SILENTLY DROPPED (recipient missing)", () => {
      // BUG #1: provider sends `to`, Code.gs reads `recipient`.
      // Result: sendSimpleEmail({to: undefined, ...}) → early-exit → no email sent.
      const payload = buildAppsScriptPayload({ ...baseOpts, type: "subscriber.welcome" });
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/no recipient/i);
    });

    it("simulator: action=sendEmail + type=post.published → SILENTLY DROPPED (recipient missing)", () => {
      const payload = buildAppsScriptPayload({ ...baseOpts, type: "post.published" });
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/no recipient/i);
    });

    it("simulator: action=sendEmail + type=broadcast → SILENTLY DROPPED (recipient missing)", () => {
      const payload = buildAppsScriptPayload({ ...baseOpts, type: "broadcast" });
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/no recipient/i);
    });

    it("simulator: action=sendEmail + type=invoice.sent → SILENTLY DROPPED (no matching case in handleNotification switch)", () => {
      // BUG #4: provider hardcodes action=sendEmail, so invoice
      // emails sent through the modern apps_script provider go
      // through handleNotification → switch has no case for
      // invoice.sent → silent no-op.
      const payload = buildAppsScriptPayload({ ...baseOpts, type: "invoice.sent" });
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/unmatched type/i);
    });

    it("simulator: action=sendEmail + type=invoice.reminder_3d → SILENTLY DROPPED (no matching case)", () => {
      const payload = buildAppsScriptPayload({ ...baseOpts, type: "invoice.reminder_3d" });
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/unmatched type/i);
    });

    it("simulator: action=sendEmail + type=payment.received → SILENTLY DROPPED (no matching case)", () => {
      const payload = buildAppsScriptPayload({ ...baseOpts, type: "payment.received" });
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/unmatched type/i);
    });

    it("simulator: action=sendEmail + type=system.alert → SILENTLY DROPPED (no matching case)", () => {
      const payload = buildAppsScriptPayload({ ...baseOpts, type: "system.alert" });
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/unmatched type/i);
    });
  });

  describe("Legacy NOTIFY_WEBHOOK_URL fallback (email-failover.ts)", () => {
    const invoiceAttachments = [
      { filename: "Okomba_Invoice_INV-001.pdf", contentType: "application/pdf", base64: "JVBERi0xLjQK" },
    ];

    it("payload contains the 11 legacy fields (snapshot — NO `type` field)", () => {
      // CRITICAL (B5 bug #4): the legacy fallback path does NOT
      // include `type` in the payload — only the modern apps_script
      // provider does. So when notify.ts's deliverOne sends a
      // subscriber.welcome / post.published / broadcast / inquiry.created
      // email through the legacy fallback, the `type` field is dropped
      // and Code.gs's doPost can't route — it falls to the `else` branch
      // and throws "Unrecognized payload". The HTTP layer still sees
      // 200 (Apps Script always returns 200 from doPost) so the
      // failover chain thinks the call succeeded — a TRUE silent failure.
      // See docs/codegs-reconciliation.md §C bug #4 for full detail.
      const payload = buildLegacyAppsScriptPayload(
        {
          to: "founder@okomba.com",
          subject: "Invoice INV-001",
          bodyHtml: "<p>HTML body</p>",
          bodyText: "Plain text body",
          attachments: invoiceAttachments,
          type: "invoice.sent",
          legacyAction: "sendInvoiceEmail",
          invoiceSummary: { invoiceNumber: "INV-001", customerName: "Test", amount: "₦100,000" },
        },
        { bodyText: "Plain text body", attachments: invoiceAttachments }
      );
      // Field set snapshot — 11 fields, NO `type`.
      expect(Object.keys(payload).sort()).toEqual(
        [
          "action", "attachments", "base64Pdf", "body", "bodyHtml", "bodyText",
          "filename", "html", "invoiceSummary", "subject", "to",
        ].sort()
      );
      expect(payload).not.toHaveProperty("type");
      expect(payload).not.toHaveProperty("recipient");
      expect(payload.action).toBe("sendInvoiceEmail");
      expect(payload.to).toBe("founder@okomba.com");
      expect(payload.base64Pdf).toBe("JVBERi0xLjQK");
      expect(payload.filename).toBe("Okomba_Invoice_INV-001.pdf");
      expect(payload.invoiceSummary).toEqual({ invoiceNumber: "INV-001", customerName: "Test", amount: "₦100,000" });
    });

    it("default legacyAction is sendEmail when notify.ts doesn't override", () => {
      const payload = buildLegacyAppsScriptPayload(
        {
          to: "founder@okomba.com",
          subject: "Test",
          bodyHtml: "<p>x</p>",
          bodyText: "x",
          attachments: [],
          type: "system.alert",
        },
        { bodyText: "x", attachments: [] }
      );
      expect(payload.action).toBe("sendEmail");
    });

    it("simulator: action=sendInvoiceEmail + type=invoice.sent → EMAIL SENT ✓", () => {
      // The ONE working scenario today. Code.gs routes action=sendInvoiceEmail
      // → sendInvoiceEmail(data) which reads data.to directly.
      const payload = buildLegacyAppsScriptPayload(
        {
          to: "founder@okomba.com",
          subject: "Proposal INV-001",
          bodyHtml: "<p>HTML</p>",
          bodyText: "Plain",
          attachments: invoiceAttachments,
          type: "invoice.sent",
          legacyAction: "sendInvoiceEmail",
          invoiceSummary: { invoiceNumber: "INV-001", customerName: "Test" },
        },
        { bodyText: "Plain", attachments: invoiceAttachments }
      );
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
      expect(result.subject).toBe("Proposal INV-001");
    });

    it("simulator: action=sendInvoiceEmail + type=invoice.reminder_3d → EMAIL SENT ✓", () => {
      const payload = buildLegacyAppsScriptPayload(
        {
          to: "founder@okomba.com",
          subject: "Reminder — INV-001 due in 3 days",
          bodyHtml: "<p>HTML</p>",
          bodyText: "Plain",
          attachments: invoiceAttachments,
          type: "invoice.reminder_3d",
          legacyAction: "sendInvoiceEmail",
          invoiceSummary: { invoiceNumber: "INV-001" },
        },
        { bodyText: "Plain", attachments: invoiceAttachments }
      );
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
    });

    it("simulator: action=sendInvoiceEmail + type=payment.received → EMAIL SENT ✓", () => {
      const payload = buildLegacyAppsScriptPayload(
        {
          to: "founder@okomba.com",
          subject: "Payment received — INV-001",
          bodyHtml: "<p>Thank you</p>",
          bodyText: "Plain thanks",
          attachments: invoiceAttachments,
          type: "payment.received",
          legacyAction: "sendInvoiceEmail",
          invoiceSummary: { invoiceNumber: "INV-001" },
        },
        { bodyText: "Plain thanks", attachments: invoiceAttachments }
      );
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
    });

    it("simulator: action=sendEmail + type=inquiry.created (BUT type is NOT in legacy payload) → 'Unrecognized payload' silent drop", () => {
      // BUG #4: legacy fallback payload does NOT include `type`.
      // Even though notify.ts passes type=inquiry.created, the
      // buildLegacyAppsScriptPayload helper DROPS the type field.
      // Result: Code.gs's doPost receives no `type`, no `name`/`email`,
      // no `recipient` → falls to `throw new Error('Unrecognized payload')`.
      // Apps Script catches and returns {success:false, error:'Unrecognized payload'}
      // with HTTP 200 — the failover chain sees res.ok=true → thinks delivery succeeded.
      // TRUE SILENT FAILURE.
      const payload = buildLegacyAppsScriptPayload(
        {
          to: "founder@okomba.com",
          subject: "New inquiry from X",
          bodyHtml: "<p>HTML</p>",
          bodyText: "Plain",
          attachments: [],
          type: "inquiry.created",
          legacyAction: "sendEmail",
        },
        { bodyText: "Plain", attachments: [] }
      );
      // Confirm `type` is missing from the actual payload
      expect(payload).not.toHaveProperty("type");
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/unrecognized payload/i);
    });

    it("simulator: action=sendEmail + type=subscriber.welcome (BUT type dropped) → 'Unrecognized payload' silent drop", () => {
      const payload = buildLegacyAppsScriptPayload(
        {
          to: "founder@okomba.com",
          subject: "Confirm subscription",
          bodyHtml: "<p>HTML</p>",
          bodyText: "Plain",
          attachments: [],
          type: "subscriber.welcome",
          legacyAction: "sendEmail",
        },
        { bodyText: "Plain", attachments: [] }
      );
      expect(payload).not.toHaveProperty("type");
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/unrecognized payload/i);
    });

    it("simulator: action=sendEmail + type=post.published (BUT type dropped) → 'Unrecognized payload' silent drop", () => {
      const payload = buildLegacyAppsScriptPayload(
        {
          to: "founder@okomba.com",
          subject: "New post",
          bodyHtml: "<p>HTML</p>",
          bodyText: "Plain",
          attachments: [],
          type: "post.published",
          legacyAction: "sendEmail",
        },
        { bodyText: "Plain", attachments: [] }
      );
      expect(payload).not.toHaveProperty("type");
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/unrecognized payload/i);
    });

    it("simulator: action=sendEmail + type=broadcast (BUT type dropped) → 'Unrecognized payload' silent drop", () => {
      const payload = buildLegacyAppsScriptPayload(
        {
          to: "founder@okomba.com",
          subject: "Broadcast",
          bodyHtml: "<p>HTML</p>",
          bodyText: "Plain",
          attachments: [],
          type: "broadcast",
          legacyAction: "sendEmail",
        },
        { bodyText: "Plain", attachments: [] }
      );
      expect(payload).not.toHaveProperty("type");
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/unrecognized payload/i);
    });

    it("simulator: action=sendEmail + type=system.alert (BUT type dropped) → 'Unrecognized payload' silent drop", () => {
      const payload = buildLegacyAppsScriptPayload(
        {
          to: "founder@okomba.com",
          subject: "System alert",
          bodyHtml: "<p>HTML</p>",
          bodyText: "Plain",
          attachments: [],
          type: "system.alert",
          legacyAction: "sendEmail",
        },
        { bodyText: "Plain", attachments: [] }
      );
      expect(payload).not.toHaveProperty("type");
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/unrecognized payload/i);
    });
  });

  describe("CRM message route (src/app/api/admin/customers/[id]/message/route.ts — direct webhook call, not failover chain)", () => {
    // This route has its OWN direct fetch to NOTIFY_WEBHOOK_URL — it
    // does NOT go through deliverWithFailover. It correctly sends
    // `recipient` (matching Code.gs's contract), but it sends
    // `type: "crm.message"` — a type Code.gs v5's handleNotification
    // switch has NO case for. Result: silent no-op.

    it("simulator: action=sendEmail + type=crm.message + recipient set → SILENTLY DROPPED (unmatched type)", () => {
      // This payload mirrors src/app/api/admin/customers/[id]/message/route.ts:104-112
      const payload = {
        action: "sendEmail",
        type: "crm.message",
        recipient: "founder@okomba.com", // correct field name!
        subject: "CRM message",
        body: "Plain text",
        html: "<p>HTML</p>",
        attachments: [],
      };
      const result = simulateCodeGsDoPostV5(payload);
      // Even though `recipient` is correctly set, the type doesn't
      // match any case in handleNotification's switch → silent no-op.
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/unmatched type.*crm\.message/i);
    });
  });

  describe("Code.gs v5 routing invariants (regression safety net)", () => {
    it("sendInvoiceEmail path reads data.to (NOT data.recipient) — confirms the working contract", () => {
      // Code.gs v5 line 486: `to: data.to,` in sendInvoiceEmail(data).
      // This is the ONLY path that uses `to` directly — all other
      // paths read `recipient`.
      const payload = {
        action: "sendInvoiceEmail",
        to: "founder@okomba.com",
        subject: "Invoice",
        body: "Body",
        html: "<p>HTML</p>",
        base64Pdf: "JVBERi0xLjQK",
        filename: "Okomba_Invoice.pdf",
        invoiceSummary: { invoiceNumber: "INV-001" },
      };
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
    });

    it("bare sendEmail (no type, no name/email) requires data.recipient — would throw 'Unrecognized payload' if missing", () => {
      // Code.gs v5 line 159: `else if (data.subject && data.recipient)`.
      // If `recipient` is missing, the branch is skipped and the
      // final `throw new Error("Unrecognized payload")` fires.
      const payload = {
        action: "sendEmail",
        to: "founder@okomba.com",
        subject: "Bare email",
        body: "Body",
      };
      const result = simulateCodeGsDoPostV5(payload);
      // No `type`, no `name`/`email`, no `recipient` → "Unrecognized payload".
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/unrecognized payload/i);
    });

    it("unknown action throws 'Unknown action: <action>'", () => {
      const payload = { action: "bogusAction" };
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/unknown action: bogusAction/i);
    });

    it("improveWithAI action is rejected (must run on Next.js server)", () => {
      // Code.gs v5 lines 172-176: improveWithAI is explicitly rejected.
      const payload = { action: "improveWithAI" };
      const result = simulateCodeGsDoPostV5(payload);
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/improveWithAI/i);
    });
  });
});
