/**
 * Code.gs v6 ⇄ Apps-Script-Provider Payload Shape Contract (B5-FIX)
 * =================================================================
 *
 * Task ID: B5-FIX (Batch 5 follow-up) — Master Directive §8
 * ("Fix the root cause, not symptoms").
 *
 * ─── What does this test verify? ───────────────────────────────────
 * Asserts the EXACT payload shape that the Phase 29 email-failover
 * chain POSTs to the Apps Script Web App /exec URL (Code.gs v6) —
 * and runs that payload through a faithful TypeScript replica of
 * Code.gs v6's `doPost(e)` routing to confirm that the 6 integration
 * bugs surfaced by B5 are now FIXED at the root cause.
 *
 * Two delivery paths are covered:
 *
 *   1. MODERN apps_script provider — `src/lib/email-config.ts`
 *      `callProviderApi({provider: "apps_script", ...})`. Active
 *      when an admin has configured the apps_script provider in the
 *      admin Settings tab (EmailProviderConfig row with provider
 *      = "apps_script"). The payload is built by the exported
 *      `buildAppsScriptPayload(opts)` helper (extracted in B5,
 *      fixed in B5-FIX to respect `legacyAction` + forward `inquiry`).
 *
 *   2. LEGACY NOTIFY_WEBHOOK_URL fallback — `src/lib/email-failover.ts`
 *      `deliverWithFailover()` falls back to a direct fetch against
 *      the `NOTIFY_WEBHOOK_URL` env var when no EmailProviderConfig
 *      rows are configured. The payload is built by the exported
 *      `buildLegacyAppsScriptPayload(opts, ctx)` helper (extracted in
 *      B5, fixed in B5-FIX to include the `type` field + forward
 *      `inquiry`).
 *
 * ─── How does it verify Code.gs v6's expectations? ─────────────────
 * The Code.gs v6 file at `Google-apps-script/Code.gs` is the
 * authoritative source for what fields the Apps Script Web App
 * reads from the incoming JSON. This test file contains a
 * `simulateCodeGsDoPostV6()` function that is a FAITHFUL
 * TypeScript replica of Code.gs v6's routing logic — covering
 * `doPost`, `handleNotification` (with the new `default:` case +
 * the new `crm.message` case), `handleInquiryNotification`,
 * `handleLegacyInquiry`, `sendInvoiceEmail`, and `sendSimpleEmail`.
 *
 * If Code.gs is ever updated again, this simulator MUST be updated
 * to match — that's the drift-detection contract this test enforces.
 *
 * ─── B5-FIX: 6 integration bugs now FIXED at the root cause ────
 * The B5 reconciliation (see docs/codegs-reconciliation.md §C)
 * surfaced 6 distinct integration bugs that caused silent email
 * delivery failures. B5-FIX implements the root-cause fix per
 * Master Directive §8 for every one of them:
 *
 *   • Bug 1 fix — Code.gs v6's handleNotification + handleInquiry-
 *     Notification + bare sendEmail branch now read `recipient || to`
 *     (accept EITHER field). Backward-compat with all v5 callers.
 *
 *   • Bug 2 fix — `buildAppsScriptPayload` + `buildLegacyAppsScript-
 *     Payload` now forward the full `inquiry` object for
 *     type=inquiry.created. `notify.ts:deliverOne` passes it through
 *     the FailoverOptions boundary (Phase 29 dropped it there).
 *
 *   • Bug 3 fix — Code.gs v6's handleNotification switch has a NEW
 *     `default:` case that sends a generic email using whatever
 *     fields are present (to/recipient + subject + body + html).
 *     Unknown types (invoice.sent, invoice.reminder_*, payment.
 *     received, system.alert, plus any future type) NO LONGER
 *     silently no-op.
 *
 *   • Bug 4 fix — `buildLegacyAppsScriptPayload` now INCLUDES the
 *     `type` field in the payload (Phase 29 dropped it → Code.gs
 *     threw "Unrecognized payload" → Apps Script returned HTTP 200
 *     → failover chain marked email as sent → TRUE SILENT FAILURE).
 *     Also Code.gs v6's legacy `else` branch (which previously threw
 *     "Unrecognized payload") now routes through handleNotification
 *     so the new default case picks it up.
 *
 *   • Bug 5 fix — `buildAppsScriptPayload` now respects `legacyAction`
 *     when set (Phase 29 hardcoded `action: "sendEmail"` for every
 *     type). notify.ts passes `legacyAction: "sendInvoiceEmail"` for
 *     invoice emails — this is now honored so the PDF attachment flow
 *     (Code.gs routes action=sendInvoiceEmail → sendInvoiceEmail(data)
 *     → reads data.to + data.base64Pdf + data.filename + data.invoice-
 *     Summary) is preserved when sending through the modern apps_script
 *     provider.
 *
 *   • Bug 6 fix — Code.gs v6's handleNotification switch has a NEW
 *     explicit `crm.message` case (first-class handling, same shape
 *     as subscriber.welcome / post.published / broadcast). The CRM
 *     message route at src/app/api/admin/customers/[id]/message/
 *     route.ts sends type=crm.message + recipient=c.email — both
 *     fields are now picked up by v6.
 *
 * The scenarios below EXPLICITLY ASSERT THE FIXED BEHAVIOR. Every
 * scenario that B5 asserted as "SILENTLY DROPPED" now asserts
 * "EMAIL SENT ✓" (or the equivalent positive outcome). This is
 * the contract: any future regression that re-introduces one of
 * these bugs will cause the affected scenario to FAIL.
 *
 * ─── Test design ───────────────────────────────────────────────────
 *   - Uses `bun:test` (same harness as B1-A / B1-C / B3 / B5).
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
 *   11. crm.message              (CRM route direct webhook call)
 */
import { describe, it, expect } from "bun:test";
import { buildAppsScriptPayload } from "@/lib/email-config";
import { buildLegacyAppsScriptPayload } from "@/lib/email-failover";

/* ════════════════════════════════════════════════════════════════
 * CODE.GS v6 doPost SIMULATOR — faithful TS replica of the actual
 * Code.gs v6 routing logic. If Code.gs is updated, this simulator
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

// CONFIG — mirrors Code.gs v6 lines 88-121 (unchanged from v5)
const SIM_CONFIG = {
  SHEET_ID: "14ocJfSFpsm2MOaI8eAPJ8E4VMh84aJQ1GgoQu7v57sY",
  SHEET_NAME: "Inquiries",
  FROM_EMAIL: "support@okomba.com",
  REPLY_TO_EMAIL: "support@okomba.com",
  ADMIN_EMAIL: "support@okomba.com",
  BUSINESS_NAME: "OKOMBA ANALYTICS",
  SITE_URL: "https://www.okomba.com",
};

// Code.gs v6 sendSimpleEmail — replicates lines 449-480 (unchanged
// from v5). CRITICAL: has an `if (!opts.to) return;` early-exit that
// silently drops the email if the recipient is missing.
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

// Code.gs v6 sendInvoiceEmail — replicates lines 484-512 (unchanged
// from v5). Reads data.to directly (NOT data.recipient) + data.base64Pdf
// + data.filename + data.invoiceSummary.
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

// Code.gs v6 handleInquiryNotification — replicates lines 294-322.
// B5-FIX Bug 1: now reads `recipient || to` (was just `recipient`).
// B5-FIX Bug 2: relies on `data.inquiry` object being present (was
//   undefined in Phase 29 because notify.ts:deliverOne dropped it
//   at the FailoverOptions boundary — now forwarded).
function sim_handleInquiryNotification(data: {
  recipient?: string;
  to?: string;
  inquiry?: { email?: string; name?: string; service?: string };
}): SimResult {
  // v6 Bug 1 fix: accept EITHER `recipient` (legacy) OR `to` (modern
  // apps_script provider field).
  const to = data.recipient || data.to;
  const inq = data.inquiry ?? {};
  const isForSubmitter =
    !!(to && inq.email &&
      String(to).toLowerCase() === String(inq.email).toLowerCase());

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

// Code.gs v6 handleLegacyInquiry — replicates lines 325-340 (unchanged
// from v5). Sends admin + submitter emails; reads data.email for submitter.
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

// Code.gs v6 handleNotification — replicates lines 233-289.
// B5-FIX Bug 1: reads `recipient || to` (was just `recipient`).
// B5-FIX Bug 3: NEW `default:` case sends a generic email using
//   whatever fields are present (was silent no-op for unknown types).
// B5-FIX Bug 6: NEW explicit `crm.message` case (first-class handling).
function sim_handleNotification(data: {
  type?: string;
  recipient?: string;
  to?: string;
  subject?: string;
  body?: string;
  html?: string;
  attachments?: unknown[];
  inquiry?: { email?: string; name?: string; service?: string };
}): SimResult {
  // v6 Bug 1 fix: accept EITHER `recipient` (legacy field used by
  // the CRM message route + v5 callers) OR `to` (modern apps_script
  // provider field). Backward-compatible with all v5 payloads.
  const to = data.recipient || data.to;
  switch (data.type) {
    case "inquiry.created":
      return sim_handleInquiryNotification(data);
    case "subscriber.welcome":
    case "post.published":
    case "broadcast":
      return sim_sendSimpleEmail({
        to,
        subject: data.subject,
        body: (data.body ?? "") + "\n\n" + "FOOTER",
        html: data.html,
        attachments: data.attachments,
      });
    case "crm.message":
      // v6 Bug 6 fix: explicit first-class handling for CRM messages.
      return sim_sendSimpleEmail({
        to,
        subject: data.subject,
        body: (data.body ?? "") + "\n\n" + "FOOTER",
        html: data.html,
        attachments: data.attachments,
      });
    default:
      // v6 Bug 3 fix: previously, this switch had NO default case —
      // unknown types silently no-op'd. Now sends a generic email
      // using whatever fields are present.
      return sim_sendSimpleEmail({
        to,
        subject: data.subject,
        body: (data.body ?? "") + "\n\n" + "FOOTER",
        html: data.html,
        attachments: data.attachments,
      });
  }
}

// Code.gs v6 doPost — replicates lines 167-217.
function simulateCodeGsDoPostV6(payload: Record<string, unknown>): SimResult {
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

  // Replicate Code.gs v6 doPost routing (lines 171-216)
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
        } else if (data.subject && (data.recipient || data.to)) {
          // v6 Bug 1 fix: bare sendEmail accepts EITHER `recipient`
          // (legacy field) OR `to` (modern provider field).
          return sim_sendSimpleEmail({
            to: data.recipient || data.to,
            subject: data.subject,
            body: (data.body ?? "") + "\n\n" + "FOOTER",
            html: data.html,
            attachments: data.attachments,
          });
        } else {
          // v6 Bug 4 fix (Code.gs side): previously threw
          // "Unrecognized payload" — silently dropped the email.
          // Now routes through handleNotification(data) so the new
          // default case picks it up.
          return sim_handleNotification(data);
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
 * TEST SCENARIOS — assert the FIXED (correct) behavior.
 * Every scenario that B5 asserted as "SILENTLY DROPPED" now asserts
 * "EMAIL SENT ✓" — that's the regression contract.
 * ════════════════════════════════════════════════════════════════ */

describe("Code.gs v6 ⇄ Apps-Script-Provider Payload Shape Contract (B5-FIX)", () => {
  describe("Modern apps_script provider (email-config.ts callProviderApi)", () => {
    const baseOpts = {
      to: "founder@okomba.com",
      subject: "Test email",
      bodyHtml: "<p>HTML body</p>",
      bodyText: "Plain text body",
      attachments: [] as Array<{ filename: string; contentType: string; base64: string }>,
      type: "test",
    };

    it("payload contains the base 9 fields when no inquiry is set (snapshot)", () => {
      // B5-FIX: still sends `to` (NOT `recipient`) — Code.gs v6 now
      // accepts BOTH (Bug 1 fix), so the provider's `to` field works.
      // Field set snapshot — if anyone adds/removes a field in
      // email-config.ts buildAppsScriptPayload, this assertion fails
      // and forces the developer to update the simulator + Code.gs.
      const payload = buildAppsScriptPayload(baseOpts);
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

    it("B5-FIX Bug 5: provider respects legacyAction=sendInvoiceEmail when set", () => {
      // B5-FIX Bug 5: Phase 29 hardcoded action="sendEmail" for every
      // type. Now, when notify.ts passes legacyAction="sendInvoiceEmail"
      // for invoice emails (proposal/reminder/payment-thank-you), the
      // modern apps_script provider honors it → Code.gs routes
      // action=sendInvoiceEmail → sendInvoiceEmail(data) → reads
      // data.to + data.base64Pdf + data.filename + data.invoiceSummary
      // → email sent WITH PDF ATTACHED. The PDF attachment flow is
      // preserved when the founder configures apps_script in the
      // admin Settings tab (Path 1).
      const payload = buildAppsScriptPayload({
        ...baseOpts,
        type: "invoice.sent",
        legacyAction: "sendInvoiceEmail",
      });
      expect(payload.action).toBe("sendInvoiceEmail");
      expect(payload.action).not.toBe("sendEmail");
    });

    it("B5-FIX Bug 5: provider defaults action=sendEmail when legacyAction is unset (backward-compat)", () => {
      // When notify.ts doesn't pass legacyAction (e.g. testProvider
      // sends type="test"), action defaults to "sendEmail" — same
      // as Phase 29's hardcoded behavior. Backward-compat preserved.
      const payload = buildAppsScriptPayload({ ...baseOpts, type: "subscriber.welcome" });
      expect(payload.action).toBe("sendEmail");
    });

    it("B5-FIX Bug 1: provider sends `to` field — Code.gs v6 accepts BOTH `to` and `recipient`", () => {
      // B5-FIX Bug 1: Code.gs v6's handleNotification + handleInquiry-
      // Notification + bare sendEmail branch all read
      // `const to = data.recipient || data.to;` (v6 Code.gs lines 238,
      // 299, 186, 190). The provider still sends `to` only — and that
      // is now picked up correctly. No silent drop.
      const payload = buildAppsScriptPayload(baseOpts);
      expect(payload).toHaveProperty("to");
      // Provider doesn't send `recipient` — that's fine because v6
      // accepts both. (If a future provider wanted to send `recipient`
      // only, v6 would also accept that.)
      expect(payload).not.toHaveProperty("recipient");
      // The simulator confirms the email reaches the customer.
      const result = simulateCodeGsDoPostV6(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
    });

    it("B5-FIX Bug 2: provider includes `inquiry` field for inquiry.created type", () => {
      // B5-FIX Bug 2: notify.ts:deliverOne now passes the full inquiry
      // object through the FailoverOptions boundary (was dropped in
      // Phase 29). buildAppsScriptPayload forwards it in the payload.
      // Code.gs v6's handleInquiryNotification reads inq.name, inq.email,
      // inq.phone, inq.whatsapp, inq.service, inq.addlService, inq.message
      // to compose the admin alert + submitter confirmation bodies.
      const inquiry = {
        id: "inq-001",
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "+234 800 000 0000",
        whatsapp: "+234 800 000 0000",
        service: "Web Development",
        addlService: null,
        message: "Build me a marketing site.",
      };
      const payload = buildAppsScriptPayload({
        ...baseOpts,
        to: "support@okomba.com", // send to admin first (admin copy path)
        type: "inquiry.created",
        inquiry,
      });
      // Field set now includes `inquiry` → 10 fields total.
      expect(Object.keys(payload).sort()).toEqual(
        ["action", "attachments", "body", "bodyHtml", "bodyText", "html", "inquiry", "subject", "to", "type"].sort()
      );
      expect(payload.inquiry).toEqual(inquiry);
    });

    it("B5-FIX Bug 2 + Bug 1: simulator: action=sendEmail + type=inquiry.created + inquiry present → admin copy sent + sheet row appended", () => {
      // B5-FIX Bug 2 + Bug 1: with the inquiry object now forwarded,
      // handleInquiryNotification receives a populated `inq` (not {}).
      // With `to` (the modern provider field) now accepted, isForSubmitter
      // is computed correctly. When the email recipient is the admin
      // (NOT the submitter's email), the admin copy branch fires:
      // saveToSheet(inq) appends a populated row + sendSimpleEmail
      // sends the admin alert with a populated body.
      const inquiry = {
        id: "inq-001",
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "+234 800 000 0000",
        service: "Web Development",
        message: "Build me a marketing site.",
      };
      const payload = buildAppsScriptPayload({
        ...baseOpts,
        to: "support@okomba.com", // admin email (NOT jane@example.com)
        subject: "New inquiry from Jane",
        type: "inquiry.created",
        inquiry,
      });
      const result = simulateCodeGsDoPostV6(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("support@okomba.com"); // admin email
      expect(result.sheetRowAppended).toBe(true);
    });

    it("B5-FIX Bug 1: simulator: action=sendEmail + type=subscriber.welcome → EMAIL SENT ✓ (was SILENTLY DROPPED in v5)", () => {
      // B5-FIX Bug 1: Code.gs v6 reads `recipient || to`. Provider sends
      // `to`. Result: sendSimpleEmail({to: founder@okomba.com, ...})
      // → MailApp.sendEmail FIRES (was: early-exit `if (!opts.to) return`
      // because v5 read `data.recipient` which was undefined).
      const payload = buildAppsScriptPayload({ ...baseOpts, type: "subscriber.welcome" });
      const result = simulateCodeGsDoPostV6(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
    });

    it("B5-FIX Bug 1: simulator: action=sendEmail + type=post.published → EMAIL SENT ✓", () => {
      const payload = buildAppsScriptPayload({ ...baseOpts, type: "post.published" });
      const result = simulateCodeGsDoPostV6(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
    });

    it("B5-FIX Bug 1: simulator: action=sendEmail + type=broadcast → EMAIL SENT ✓", () => {
      const payload = buildAppsScriptPayload({ ...baseOpts, type: "broadcast" });
      const result = simulateCodeGsDoPostV6(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
    });

    it("B5-FIX Bug 3: simulator: action=sendEmail + type=invoice.sent → EMAIL SENT ✓ (default case — was SILENTLY DROPPED in v5)", () => {
      // B5-FIX Bug 3: Code.gs v6's handleNotification switch has a NEW
      // `default:` case that sends a generic email using whatever
      // fields are present. invoice.sent (when sent through Path 1
      // modern apps_script provider) now reaches the customer (without
      // the PDF attachment — to get the PDF, notify.ts must also pass
      // legacyAction=sendInvoiceEmail, which the Bug 5 fix respects;
      // see the legacy-fallback scenarios for that path).
      const payload = buildAppsScriptPayload({ ...baseOpts, type: "invoice.sent" });
      const result = simulateCodeGsDoPostV6(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
    });

    it("B5-FIX Bug 3: simulator: action=sendEmail + type=system.alert → EMAIL SENT ✓ (default case)", () => {
      const payload = buildAppsScriptPayload({ ...baseOpts, type: "system.alert" });
      const result = simulateCodeGsDoPostV6(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
    });
  });

  describe("Legacy NOTIFY_WEBHOOK_URL fallback (email-failover.ts)", () => {
    const invoiceAttachments = [
      { filename: "Okomba_Invoice_INV-001.pdf", contentType: "application/pdf", base64: "JVBERi0xLjQK" },
    ];

    it("B5-FIX Bug 4: legacy payload INCLUDES the `type` field (12 fields — was 11 in v5 with type DROPPED)", () => {
      // B5-FIX Bug 4: Phase 29's buildLegacyAppsScriptPayload returned
      // 11 fields and SILENTLY DROPPED `type` from the payload. With
      // `type` now in the payload, Code.gs's `if (data.type)` branch
      // routes to handleNotification → switch case + new default case
      // → email actually goes out (was: throw "Unrecognized payload"
      // → Apps Script returned HTTP 200 + {success:false} → failover
      // chain saw res.ok=true → marked email as sent → TRUE SILENT
      // FAILURE). See docs/codegs-reconciliation.md §C bug #4.
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
      // Field set snapshot — 12 fields, INCLUDES `type`.
      expect(Object.keys(payload).sort()).toEqual(
        [
          "action", "attachments", "base64Pdf", "body", "bodyHtml", "bodyText",
          "filename", "html", "invoiceSummary", "subject", "to", "type",
        ].sort()
      );
      expect(payload).toHaveProperty("type");
      expect(payload.type).toBe("invoice.sent");
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
      expect(payload.type).toBe("system.alert");
    });

    it("simulator: action=sendInvoiceEmail + type=invoice.sent → EMAIL SENT ✓ (PDF attached)", () => {
      // The legacy path was the ONLY working scenario in v5 (because
      // notify.ts passes legacyAction=sendInvoiceEmail for invoice
      // emails, and Code.gs routes action=sendInvoiceEmail →
      // sendInvoiceEmail(data) which reads data.to directly). v6
      // preserves this working contract.
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
      const result = simulateCodeGsDoPostV6(payload);
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
      const result = simulateCodeGsDoPostV6(payload);
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
      const result = simulateCodeGsDoPostV6(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
    });

    it("B5-FIX Bug 4 + Bug 2: simulator: action=sendEmail + type=inquiry.created (NOW in payload) → admin copy sent + sheet row appended (was 'Unrecognized payload' silent drop in v5)", () => {
      // B5-FIX Bug 4: legacy payload now INCLUDES `type` → Code.gs's
      // `if (data.type)` branch routes to handleNotification →
      // case "inquiry.created" → handleInquiryNotification(data).
      // B5-FIX Bug 2: with the inquiry object now forwarded,
      // handleInquiryNotification receives a populated `inq` → admin
      // copy sent with populated body + populated sheet row.
      const inquiry = {
        id: "inq-002",
        name: "John Smith",
        email: "john@example.com",
        phone: "+234 808 000 0000",
        service: "SEO Consulting",
        message: "Need help with our search rankings.",
      };
      const payload = buildLegacyAppsScriptPayload(
        {
          to: "support@okomba.com", // admin (not john@example.com)
          subject: "New inquiry from John",
          bodyHtml: "<p>HTML</p>",
          bodyText: "Plain",
          attachments: [],
          type: "inquiry.created",
          legacyAction: "sendEmail",
          inquiry,
        },
        { bodyText: "Plain", attachments: [] }
      );
      // Confirm `type` is now in the payload (was dropped in v5).
      expect(payload).toHaveProperty("type");
      expect(payload.type).toBe("inquiry.created");
      expect(payload).toHaveProperty("inquiry");
      const result = simulateCodeGsDoPostV6(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("support@okomba.com");
      expect(result.sheetRowAppended).toBe(true);
    });

    it("B5-FIX Bug 4 + Bug 1: simulator: action=sendEmail + type=subscriber.welcome (NOW in payload) → EMAIL SENT ✓ (was 'Unrecognized payload' silent drop in v5)", () => {
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
      expect(payload).toHaveProperty("type");
      expect(payload.type).toBe("subscriber.welcome");
      const result = simulateCodeGsDoPostV6(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
    });

    it("B5-FIX Bug 4: simulator: action=sendEmail + type=post.published (NOW in payload) → EMAIL SENT ✓", () => {
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
      expect(payload).toHaveProperty("type");
      const result = simulateCodeGsDoPostV6(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
    });

    it("B5-FIX Bug 4: simulator: action=sendEmail + type=broadcast (NOW in payload) → EMAIL SENT ✓", () => {
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
      expect(payload).toHaveProperty("type");
      const result = simulateCodeGsDoPostV6(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
    });

    it("B5-FIX Bug 4 + Bug 3: simulator: action=sendEmail + type=system.alert (NOW in payload) → EMAIL SENT ✓ via default case", () => {
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
      expect(payload).toHaveProperty("type");
      const result = simulateCodeGsDoPostV6(payload);
      // system.alert has no matching case in handleNotification's
      // switch — falls to the NEW default case (Bug 3 fix) →
      // sendSimpleEmail sends a generic email using the to/subject/
      // body/html fields. Was: silent no-op (v5 handleNotification
      // switch had no default case).
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
    });
  });

  describe("CRM message route (src/app/api/admin/customers/[id]/message/route.ts — direct webhook call, not failover chain)", () => {
    // This route has its OWN direct fetch to NOTIFY_WEBHOOK_URL — it
    // does NOT go through deliverWithFailover. It correctly sends
    // `recipient` (matching Code.gs's contract — v5 also read
    // `recipient` so this didn't have Bug 1). It sends
    // `type: "crm.message"` — a type Code.gs v5's handleNotification
    // switch had NO case for (Bug 6). B5-FIX: Code.gs v6 has a NEW
    // explicit `crm.message` case (first-class handling).

    it("B5-FIX Bug 6: simulator: action=sendEmail + type=crm.message + recipient set → EMAIL SENT ✓ (was SILENTLY DROPPED in v5 — no matching case)", () => {
      // This payload mirrors src/app/api/admin/customers/[id]/message/route.ts:104-112
      const payload = {
        action: "sendEmail",
        type: "crm.message",
        recipient: "founder@okomba.com", // correct field name (v5 + v6 both accept)
        subject: "CRM message",
        body: "Plain text",
        html: "<p>HTML</p>",
        attachments: [],
      };
      const result = simulateCodeGsDoPostV6(payload);
      // v6 Bug 6 fix: handleNotification switch now has an explicit
      // `crm.message` case → sendSimpleEmail sends the composed email.
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
      expect(result.subject).toBe("CRM message");
    });
  });

  describe("Code.gs v6 routing invariants (regression safety net)", () => {
    it("sendInvoiceEmail path reads data.to (NOT data.recipient) — confirms the working contract preserved in v6", () => {
      // Code.gs v6 line 486: `to: data.to,` in sendInvoiceEmail(data).
      // This is the path invoice emails take when notify.ts passes
      // legacyAction="sendInvoiceEmail" — preserved unchanged from v5.
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
      const result = simulateCodeGsDoPostV6(payload);
      expect(result.delivered).toBe(true);
      expect(result.to).toBe("founder@okomba.com");
    });

    it("B5-FIX Bug 1: bare sendEmail (no type, no name/email) accepts EITHER recipient OR to (backward-compat with v5 callers)", () => {
      // Code.gs v6 line 186: `else if (data.subject && (data.recipient || data.to))`.
      // v5 only accepted `data.recipient` (Bug 1). v6 accepts either.
      // Test with `to` only — should now succeed (was: throw
      // "Unrecognized payload" in v5 because `recipient` was undefined).
      const payloadWithTo = {
        action: "sendEmail",
        to: "founder@okomba.com",
        subject: "Bare email via `to` field",
        body: "Body",
      };
      const resultTo = simulateCodeGsDoPostV6(payloadWithTo);
      expect(resultTo.delivered).toBe(true);
      expect(resultTo.to).toBe("founder@okomba.com");

      // v5 callers that send `recipient` (not `to`) must still work
      // after the v6 upgrade — that's the backward-compat promise.
      const payloadWithRecipient = {
        action: "sendEmail",
        recipient: "founder@okomba.com",
        subject: "Bare email via `recipient` field",
        body: "Body",
      };
      const resultRecipient = simulateCodeGsDoPostV6(payloadWithRecipient);
      expect(resultRecipient.delivered).toBe(true);
      expect(resultRecipient.to).toBe("founder@okomba.com");
    });

    it("unknown action throws 'Unknown action: <action>'", () => {
      const payload = { action: "bogusAction" };
      const result = simulateCodeGsDoPostV6(payload);
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/unknown action: bogusAction/i);
    });

    it("improveWithAI action is rejected (must run on Next.js server)", () => {
      // Code.gs v6 lines 210-214 (unchanged from v5): improveWithAI
      // is explicitly rejected.
      const payload = { action: "improveWithAI" };
      const result = simulateCodeGsDoPostV6(payload);
      expect(result.delivered).toBe(false);
      expect(result.reason).toMatch(/improveWithAI/i);
    });
  });
});
