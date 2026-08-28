/**
 * OKOMBA ANALYTICS — Google Apps Script Engine (v6)
 *
 * v6 change (B5-FIX — 6 integration bug fixes):
 *   • Bug 1 fix: handleNotification + handleInquiryNotification +
 *     bare sendEmail branch now accept EITHER `data.recipient`
 *     (legacy field) OR `data.to` (modern provider field) — read
 *     via `const to = data.recipient || data.to;`. This is
 *     backward-compatible: existing v5 callers that send
 *     `recipient` keep working; the Phase 29 apps_script provider
 *     that sends `to` now also works.
 *   • Bug 3 fix: handleNotification switch has a NEW `default:`
 *     case that sends a generic email using whatever fields are
 *     present (to/recipient + subject + body + html). Unknown
 *     email types (invoice.sent, invoice.reminder_*, payment.
 *     received, system.alert, etc.) NO LONGER silently no-op —
 *     they now send the composed email body the provider passes.
 *   • Bug 4 fix (Code.gs side): the legacy `else` branch that
 *     previously threw "Unrecognized payload" now routes through
 *     handleNotification(data) so the new default case picks it
 *     up. (Combined with the provider-side Bug 4 fix in
 *     email-failover.ts that now INCLUDES the `type` field in
 *     the legacy payload, non-invoice emails reach the customer.)
 *   • Bug 6 fix: handleNotification switch has a NEW explicit
 *     `crm.message` case (first-class handling, same shape as
 *     subscriber.welcome / post.published / broadcast).
 *   • All v5 functionality PRESERVED (sendEmail, sendInvoiceEmail,
 *     backupToSheet, smart saveToSheet, syncSheetColumns,
 *     ensureInquiryHeaders_, verifySetup, listSheetTabs).
 *   • No v5 payload is broken — v6 is fully backward-compatible.
 * v5 change: saveToSheet() + backupToSheet() now AUTO-ADD any
 * missing standard columns to the RIGHT of your existing sheet
 * headers. Your existing rows + data are NEVER touched — the
 * header row is just extended (blank cells fill the new columns
 * in old rows). New rows from this point fill every column.
 * Run syncSheetColumns() from the editor to preview the upgrade
 * before deploying.
 * ------------------------------------------------
 * The email + backup engine. The Next.js app POSTs here; this script
 * sends branded HTML email through your Gmail and backs data up to
 * Google Sheets.
 *
 * ACTIONS (Phase-1 Module 3 contract):
 *   action: "sendEmail"        → generic branded email (html + optional attachments)
 *   action: "sendInvoiceEmail" → branded invoice email with base64 PDF ATTACHED
 *                                (MailApp attachment — never a link)
 *   action: "backupToSheet"    → append JSON rows to any named Sheet tab
 *
 * Legacy notification format (no action field) still routes exactly as
 * v2 did — inquiry.created gets the Sheets row + dual emails, and the
 * v1 raw-inquiry format from the original Vite app still works.
 *
 * NOTE on "improveWithAI": AI refinement runs on the Next.js server
 * (z-ai SDK) BEFORE anything is sent here — the script only delivers.
 *
 * AUTO-BACKUP: every new enquiry adds a row to the "Inquiries" tab;
 * every invoice email adds a row to the "Invoices" tab.
 *
 * SETUP (multi-account architecture — read this carefully):
 *
 * The Okomba email setup uses THREE accounts (deliberately):
 *   • SENDER ALIAS  = support@okomba.com  (custom-domain address,
 *                     NOT a Workspace account; receives mail via
 *                     forwarding to the inbox you actually read)
 *   • SENDER HOST    = a Gmail account where support@okomba.com is
 *                     configured as a "Send mail as" alias using
 *                     Google SMTP (smtp.gmail.com + the support@
 *                     okomba.com credentials). THIS is the account
 *                     that should RUN this Apps Script.
 *   • SHEET OWNER    = a different Google account that owns the
 *                     Google Sheet. Share the sheet with the SENDER
 *                     HOST account as Editor.
 *
 * Steps:
 * 1. In the SENDER HOST Gmail account → Settings → Accounts and
 *    Import → Send mail as → confirm support@okomba.com is listed.
 *    (If missing: "Add another email address" → SMTP server
 *    smtp.gmail.com:465 → support@okomba.com username + a Google
 *    App Password for that account.)
 * 2. In the SHEET OWNER account → open the Sheet → Share → add the
 *    SENDER HOST email as Editor.
 * 3. Log into https://script.google.com as the SENDER HOST account
 *    → New project → name it "Okomba Webhook".
 * 4. Paste this entire file into the editor.
 * 5. CONFIG is pre-filled for the Okomba setup. The only thing to
 *    verify is that SHEET_ID matches your Sheet URL.
 * 6. Run listSheetTabs() to see what tabs + headers already exist
 *    on your Sheet (so you know which tab inquiries will land in).
 * 7. Run syncSheetColumns() — adds any missing standard Okomba
 *    columns to your EXISTING Inquiries tab by extending the
 *    header row to the right. Your existing rows + data are
 *    NEVER touched (they just have blank cells in the new
 *    columns). New inquiries from this point fill every column.
 * 8. Run verifySetup() from the function dropdown — confirm all
 *    checks pass (Sheet access OK + FROM_EMAIL alias OK + test
 *    email delivered to support@okomba.com → forwarded to your
 *    reading inbox). DO NOT deploy until verifySetup() is green.
 * 9. Deploy → New deployment → Web app
 *      Execute as:  Me
 *      Who has access:  Anyone
 * 10. Copy the Web App URL (/exec).
 * 11. Set it as NOTIFY_WEBHOOK_URL on Render (Render dashboard →
 *    okomba-analytics → Environment).
 *
 * Quota ceiling: the SENDER HOST account's daily MailApp quota is
 * what counts. Personal Gmail = 100/day; Workspace = 1500/day.
 * If you exceed, emails silently fail past the cap (no customer-
 * facing error). See verifySetup() output for the active account.
 */

// ─── CONFIG — pre-filled for the Okomba setup ─────────────────
// Every value is already set for production. The only field you
// might need to change is SHEET_ID (if you swap Sheets later).
// Run verifySetup() to confirm everything is wired before deploying.
const CONFIG = {
  // Google Sheet ID (from /spreadsheets/d/YOUR_ID_HERE/edit).
  // This is the Sheet owned by the SHEET OWNER account; share it
  // as Editor with the SENDER HOST account running this script.
  SHEET_ID: "14ocJfSFpsm2MOaI8eAPJ8E4VMh84aJQ1GgoQu7v57sY",

  // Sheet tab name for inquiries. If a tab with this name already
  // exists in your Sheet, the script appends new rows to it (matching
  // whatever headers that tab has — your existing records are never
  // touched). If the tab doesn't exist, it's created with the
  // standard Okomba header layout.
  SHEET_NAME: "Inquiries",

  // The address every email is SENT FROM. Must be a "Send mail as"
  // alias of the account running this script — otherwise MailApp will
  // throw "Invalid argument: from". Run verifySetup() to confirm.
  FROM_EMAIL: "support@okomba.com",

  // Where replies should land. Defaults to support@okomba.com, which
  // forwards to the inbox you actually read. Set to the same value
  // unless you want replies routed elsewhere.
  REPLY_TO_EMAIL: "support@okomba.com",

  // Destination for admin alerts (inquiry notifications, system
  // alerts). Same as FROM_EMAIL by default — your forwarder delivers
  // it to the inbox you actually read.
  ADMIN_EMAIL: "support@okomba.com",

  // Business identity for email templates
  BUSINESS_NAME: "OKOMBA ANALYTICS",

  // Your live site URL (used in email footers)
  SITE_URL: "https://www.okomba.com",
};

// ─── STANDARD INQUIRIES HEADER LAYOUT ───────────────────────
// The canonical Okomba Inquiries tab columns, in order. New columns
// added in later versions are appended to the END so existing sheet
// layouts are never reordered (reordering would shift your old data
// into the wrong columns).
//
// When the Inquiries tab already has data, saveToSheet() and
// syncSheetColumns() auto-ADD any of these that are missing to the
// RIGHT of your existing headers (your existing rows + data are
// NEVER touched — they just have blank cells in the new columns).
// New inquiries then fill every column going forward.
const STANDARD_INQUIRY_HEADERS = [
  "Timestamp", "Name", "Email", "Phone", "WhatsApp",
  "Service", "Additional Service", "Message", "Source"
];

// ─── MAIN HANDLER ────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    switch (data.action) {
      case "sendInvoiceEmail":
        sendInvoiceEmail(data);
        break;
      case "backupToSheet":
        backupToSheet(data.tab, data.data || data.rows || []);
        break;
      case "sendEmail":
      case undefined:
      case null:
        // v2 notification format (or v1 legacy inquiry)
        if (data.type) {
          handleNotification(data);
        } else if (data.name || data.email) {
          handleLegacyInquiry(data);
        } else if (data.subject && (data.recipient || data.to)) {
          // v6 Bug 1 fix: bare sendEmail accepts EITHER `recipient`
          // (legacy field) OR `to` (modern provider field).
          sendSimpleEmail({
            to: data.recipient || data.to,
            subject: data.subject,
            body: (data.body || "") + "\n\n" + footerBlock(),
            html: data.html,
            attachments: data.attachments,
          });
        } else {
          // v6 Bug 4 fix (Code.gs side): previously threw
          // "Unrecognized payload" — silently dropped the email
          // (Apps Script returned HTTP 200 + {success:false} → the
          // failover chain saw res.ok=true and marked it as sent,
          // a TRUE SILENT FAILURE). Now route through handleNoti-
          // fication(data) so the new `default:` case (Bug 3 fix)
          // picks it up and sends a generic email using whatever
          // fields are present (or no-ops gracefully if no
          // recipient is set — sendSimpleEmail's `if (!opts.to)
          // return` early-exit fires safely).
          handleNotification(data);
        }
        break;
      case "improveWithAI":
        throw new Error(
          "improveWithAI runs on the Next.js server before delivery " +
          "— POST the refined content with action:sendEmail instead."
        );
      default:
        throw new Error("Unknown action: " + data.action);
    }

    return ok();
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function ok() {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── v2 NOTIFICATION ROUTER ──────────────────────────────────
function handleNotification(data) {
  // v6 Bug 1 fix: accept EITHER `recipient` (legacy field used by
  // the CRM message route + v5 callers) OR `to` (modern apps_script
  // provider field). Backward-compatible with all v5 payloads.
  const to = data.recipient || data.to;
  switch (data.type) {
    case "inquiry.created":
      handleInquiryNotification(data);
      break;
    case "subscriber.welcome":
    case "post.published":
    case "broadcast":
      sendSimpleEmail({
        to: to,
        subject: data.subject,
        body: (data.body || "") + "\n\n" + footerBlock(),
        html: data.html, // branded HTML from the Next.js template
        attachments: data.attachments, // [{filename, contentType, base64}]
      });
      break;
    case "crm.message":
      // v6 Bug 6 fix: explicit first-class handling for CRM messages
      // composed in src/app/api/admin/customers/[id]/message/route.ts.
      // Same shape as subscriber.welcome etc. — sends the composed
      // subject/body/html that the CRM route already constructs.
      sendSimpleEmail({
        to: to,
        subject: data.subject,
        body: (data.body || "") + "\n\n" + footerBlock(),
        html: data.html,
        attachments: data.attachments,
      });
      break;
    default:
      // v6 Bug 3 fix: previously, this switch had NO default case —
      // unknown types (invoice.sent, invoice.reminder_3d/_due/_overdue,
      // payment.received, system.alert, plus any future type the
      // Next.js app adds) SILENTLY no-op'd. Now we send a generic
      // email using the to/subject/body/html fields the provider
      // already passes for every email type. If neither `to` nor
      // `recipient` is set, sendSimpleEmail's `if (!opts.to) return`
      // early-exit fires safely (no silent Gmail send).
      Logger.log(
        "handleNotification: unmatched type '" + data.type +
        "' — sending generic email via default case"
      );
      sendSimpleEmail({
        to: to,
        subject: data.subject,
        body: (data.body || "") + "\n\n" + footerBlock(),
        html: data.html,
        attachments: data.attachments,
      });
      break;
  }
}

// Inquiry notification — full original treatment.
// The app sends this twice: once to the admin, once to the submitter
// (the recipient field distinguishes them).
function handleInquiryNotification(data) {
  // v6 Bug 1 fix: accept EITHER `recipient` (legacy) OR `to`
  // (modern apps_script provider field). Backward-compatible with
  // all v5 callers — `to` is the field the Phase 29 failover chain
  // actually sends.
  const to = data.recipient || data.to;
  const inq = data.inquiry || {};
  const isForSubmitter = to && inq.email &&
    String(to).toLowerCase() === String(inq.email).toLowerCase();

  if (isForSubmitter) {
    sendSimpleEmail({
      to: inq.email,
      subject: "✅ We received your inquiry — " + CONFIG.BUSINESS_NAME,
      body: userConfirmationBody(inq),
      replyTo: CONFIG.ADMIN_EMAIL,
    });
  } else {
    // Admin copy → also persists to Google Sheets once (the submitter
    // copy skips Sheets so we don't double-row).
    saveToSheet(inq);
    sendSimpleEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: "🔔 New Inquiry: " + (inq.service || "General") + " — " + inq.name,
      body: adminAlertBody(inq),
      replyTo: inq.email,
    });
  }
}

// ─── v1 LEGACY FORMAT (original app compatibility) ───────────
function handleLegacyInquiry(data) {
  saveToSheet(data);
  sendSimpleEmail({
    to: CONFIG.ADMIN_EMAIL,
    subject: "🔔 New Inquiry: " + (data.service || "General") + " — " + data.name,
    body: adminAlertBody(data),
    replyTo: data.email,
  });
  sendSimpleEmail({
    to: data.email,
    subject: "✅ We received your inquiry — " + CONFIG.BUSINESS_NAME,
    body: userConfirmationBody(data),
    replyTo: CONFIG.ADMIN_EMAIL,
  });
}

// ─── GOOGLE SHEETS — SMART INQUIRY PERSISTENCE ───────────────
// Detects your existing tab + headers and APPENDS any missing standard
// columns to the RIGHT of your existing layout (your existing rows +
// data are NEVER touched — the header row is just extended). New
// inquiries are then appended below, mapping each field to its column
// (case-insensitive). Columns the script doesn't recognize (e.g., your
// custom "Company" or "Budget" columns) are preserved untouched.
//
// Scenarios handled:
//   A) "Inquiries" tab exists with your custom headers → read them,
//      auto-add any missing STANDARD_INQUIRY_HEADERS to the right
//      (styled gold-on-ink), then append each new inquiry mapped to
//      the full header set. Your old rows stay where they are with
//      blank cells in the new columns.
//   B) "Inquiries" tab doesn't exist yet → create it with the standard
//      Okomba header layout (bold gold-on-ink header + frozen first
//      row), then append.
//
// Run syncSheetColumns() from the editor to preview exactly which
// columns will be added without writing any new rows.
function saveToSheet(data) {
  if (!CONFIG.SHEET_ID || CONFIG.SHEET_ID.indexOf("YOUR_") === 0) return;
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);

  // Ensure all standard headers exist (auto-adds missing ones to the
  // right of any existing custom headers — old data untouched).
  const headers = ensureInquiryHeaders_(sheet);

  // Map inquiry payload to the existing headers (case-insensitive).
  // Includes common header variants so this works whether your
  // existing tab uses "Name", "Full Name", "Client Name", etc.
  const fields = {
    "timestamp": new Date(),
    "date": new Date(),
    "time": new Date(),
    "submitted": new Date(),
    "submitted at": new Date(),
    "name": data.name || "",
    "full name": data.name || "",
    "client name": data.name || "",
    "customer name": data.name || "",
    "email": data.email || "",
    "email address": data.email || "",
    "phone": data.phone || "",
    "phone number": data.phone || "",
    "tel": data.phone || "",
    "whatsapp": data.whatsapp || "",
    "whatsapp number": data.whatsapp || "",
    "service": data.service || "",
    "service requested": data.service || "",
    "service type": data.service || "",
    "additional service": data.addlService || data.additionalService || "",
    "addl service": data.addlService || data.additionalService || "",
    "extra service": data.addlService || data.additionalService || "",
    "message": data.message || "",
    "comments": data.message || "",
    "notes": data.message || "",
    "details": data.message || "",
    "source": "okomba.com",
    "referrer": "okomba.com",
    "site": "okomba.com",
  };

  // Build the row: for each existing header column, find the matching
  // field in the inquiry payload; leave unrecognised columns blank so
  // your existing custom columns (e.g., "Company", "Budget") are
  // preserved without corruption.
  const row = headers.map(function (h) {
    const key = String(h || "").toLowerCase().trim();
    return fields[key] !== undefined ? fields[key] : "";
  });

  sheet.appendRow(row);
}

// Helper — ensures the Inquiries tab has all STANDARD_INQUIRY_HEADERS.
// Missing columns are appended to the RIGHT of the existing header row
// (your old rows + data are NEVER touched — they just have blank cells
// in the new columns). Returns the final header array in use.
function ensureInquiryHeaders_(sheet) {
  let headers = [];
  if (sheet.getLastRow() > 0 && sheet.getLastColumn() > 0) {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(function (h) { return String(h || "").trim(); });
  }
  if (headers.length === 0) {
    // Empty tab → seed with the standard layout
    headers = STANDARD_INQUIRY_HEADERS.slice();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#F0A500")
      .setFontColor("#0B0F1A");
    sheet.setFrozenRows(1);
  } else {
    // Existing tab — auto-add any missing standard columns (to the
    // right). Old rows remain as-is (blank cells in the new columns);
    // new rows will fill both old and new columns.
    const existingLower = headers.map(function (h) {
      return String(h || "").toLowerCase().trim();
    });
    const missing = STANDARD_INQUIRY_HEADERS.filter(function (h) {
      return existingLower.indexOf(h.toLowerCase()) === -1;
    });
    if (missing.length > 0) {
      const startCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
      sheet.getRange(1, startCol, 1, missing.length)
        .setFontWeight("bold")
        .setBackground("#F0A500")
        .setFontColor("#0B0F1A");
      headers = headers.concat(missing);
    }
  }
  return headers;
}

// ─── EMAIL BODIES ────────────────────────────────────────────
function adminAlertBody(d) {
  return [
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "NEW SERVICE INQUIRY",
    CONFIG.BUSINESS_NAME,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "NAME:     " + (d.name || ""),
    "EMAIL:    " + (d.email || ""),
    "PHONE:    " + (d.phone || ""),
    "WHATSAPP: " + (d.whatsapp || "Not provided"),
    "",
    "SERVICE REQUESTED:",
    d.service || "",
    "",
    "ADDITIONAL SERVICE:",
    d.addlService || "None",
    "",
    "MESSAGE:",
    d.message || "",
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "Submitted: " + new Date().toLocaleString(),
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "Reply directly to this email or:",
    "📧 " + (d.email || ""),
    "📞 " + (d.phone || ""),
  ].join("\n");
}

function userConfirmationBody(d) {
  return [
    "Hi " + (d.name || "there") + ",",
    "",
    "Thank you for reaching out to " + CONFIG.BUSINESS_NAME + "!",
    "",
    "We have received your inquiry for:",
    "▸ " + (d.service || "General consultation"),
    "",
    "Our team will review your request and get back to you within 24 hours.",
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "YOUR SUBMISSION SUMMARY",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "Service:  " + (d.service || ""),
    "Message:  " + (d.message || ""),
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "Need urgent help? Contact us directly:",
    "📧 support@okomba.com",
    "📞 +234 808 894 8657",
    "💬 https://wa.me/2348088948657",
    "",
    "Best regards,",
    CONFIG.BUSINESS_NAME + " Team",
    CONFIG.SITE_URL,
  ].join("\n");
}

function footerBlock() {
  return [
    "—",
    CONFIG.BUSINESS_NAME,
    CONFIG.SITE_URL,
    "Unsubscribe anytime: " + CONFIG.SITE_URL + "/#newsletter",
  ].join("\n");
}

function sendSimpleEmail(opts) {
  if (!opts.to) return;
  const mail = {
    to: opts.to,
    subject: opts.subject,
    body: opts.body,
    // Send FROM the configured business address. This requires
    // CONFIG.FROM_EMAIL to be a registered "Send mail as" alias of
    // the account running this script — verify with MailApp.getAliases()
    // (or run verifySetup()) before deploying.
    from: CONFIG.FROM_EMAIL,
  };
  // replyTo: explicit per-call value wins; otherwise fall back to
  // CONFIG.REPLY_TO_EMAIL so replies route to support@okomba.com
  // (which forwards to your reading inbox).
  if (opts.replyTo) {
    mail.replyTo = opts.replyTo;
  } else if (CONFIG.REPLY_TO_EMAIL) {
    mail.replyTo = CONFIG.REPLY_TO_EMAIL;
  }
  if (opts.html) mail.htmlBody = opts.html;
  if (opts.attachments && opts.attachments.length) {
    mail.attachments = opts.attachments.map(function (a) {
      return Utilities.newBlob(
        Utilities.base64Decode(a.base64),
        a.contentType || "application/octet-stream",
        a.filename
      );
    });
  }
  MailApp.sendEmail(mail);
}

// INVOICE EMAIL (action: sendInvoiceEmail) — branded HTML + base64 PDF
// ATTACHED via MailApp. No links, per spec.
function sendInvoiceEmail(data) {
  sendSimpleEmail({
    to: data.to,
    subject: data.subject,
    body: data.body,
    html: data.html,
    attachments: [
      {
        base64: data.base64Pdf,
        contentType: "application/pdf",
        filename: data.filename || "Okomba_Invoice.pdf",
      },
    ],
  });

  // Auto-backup: every invoice email gets a row in the "Invoices" tab
  const s = data.invoiceSummary || {};
  backupToSheet("Invoices", [
    {
      SentAt: new Date().toLocaleString(),
      InvoiceNumber: s.invoiceNumber || "",
      Customer: s.customerName || "",
      Service: s.service || "",
      Amount: s.amount || "",
      DueDate: s.dueDate || "",
      Recipient: data.to || "",
    },
  ]);
}

// GENERIC SHEET BACKUP (action: backupToSheet) — backupToSheet(tab, rows)
// Smart-matches existing tab headers if the tab already exists, otherwise
// creates it with the row's keys as headers. AUTO-ADDS any columns from
// the incoming rows that aren't already in the header (extended to the
// right — existing rows + data are never touched). Idempotent and safe
// with existing data — never touches prior rows.
function backupToSheet(tab, rows) {
  if (!tab || !rows || !rows.length) return;
  if (!CONFIG.SHEET_ID || CONFIG.SHEET_ID.indexOf("YOUR_") === 0) return;
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(tab);
  let headers = [];

  // Read existing headers if the tab already has data
  if (sheet && sheet.getLastRow() > 0 && sheet.getLastColumn() > 0) {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(function (h) { return String(h || "").trim(); });
  }

  // Tab doesn't exist → create it
  if (!sheet) {
    sheet = ss.insertSheet(tab);
  }

  // Normalise keys for matching (lowercase + strip spaces/underscores/hyphens)
  // so "InvoiceNumber" matches "Invoice Number" / "invoice_number" / "INVOICE-NUMBER".
  const normalize = function (s) {
    return String(s || "").toLowerCase().replace(/[\s_\-]+/g, "");
  };

  // Empty tab → write headers from the first row's keys (styled)
  if (headers.length === 0) {
    headers = Object.keys(rows[0]);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#F0A500")
      .setFontColor("#0B0F1A");
    sheet.setFrozenRows(1);
  } else {
    // Existing tab — auto-add any columns from the incoming rows that
    // aren't already in the header (to the right). Existing rows are
    // untouched (blank cells in the new columns); new rows fill every
    // column.
    const existingNorm = headers.map(normalize);
    const seen = {};
    existingNorm.forEach(function (n) { seen[n] = true; });
    const missing = [];
    rows.forEach(function (r) {
      Object.keys(r).forEach(function (k) {
        const n = normalize(k);
        if (!seen[n]) {
          seen[n] = true;
          missing.push(k);
        }
      });
    });
    if (missing.length > 0) {
      const startCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
      sheet.getRange(1, startCol, 1, missing.length)
        .setFontWeight("bold")
        .setBackground("#F0A500")
        .setFontColor("#0B0F1A");
      headers = headers.concat(missing);
    }
  }

  const headerNorm = headers.map(normalize);

  const values = rows.map(function (r) {
    // Pre-build a normalized → value lookup from the row's keys
    const rowByNorm = {};
    Object.keys(r).forEach(function (k) {
      rowByNorm[normalize(k)] = (r[k] === undefined || r[k] === null) ? "" : r[k];
    });
    // For each existing header column, pull the matching value (or blank)
    return headerNorm.map(function (hn) {
      return rowByNorm[hn] !== undefined ? rowByNorm[hn] : "";
    });
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, headers.length).setValues(values);
}

// ─── DEBUG: list all tabs + their headers (run from editor) ─────
// Diagnostic helper — run BEFORE verifySetup() if you want to see
// what tabs exist on the Sheet and what header row each one has.
// Useful for confirming your existing data layout matches what the
// smart saveToSheet() will append to.
function listSheetTabs() {
  if (!CONFIG.SHEET_ID || CONFIG.SHEET_ID.indexOf("YOUR_") === 0) {
    Logger.log("SHEET_ID not configured.");
    return;
  }
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheets = ss.getSheets();
  Logger.log("Sheet: " + ss.getName());
  Logger.log("Tabs (" + sheets.length + "):");
  sheets.forEach(function (s) {
    const rows = s.getLastRow();
    const cols = s.getLastColumn();
    let headers = [];
    if (rows > 0 && cols > 0) {
      headers = s.getRange(1, 1, 1, cols).getValues()[0]
        .map(function (h) { return String(h || "").trim(); });
    }
    Logger.log("  • " + s.getSheetName() +
      " — " + rows + " rows × " + cols + " cols" +
      (headers.length ? "\n    headers: " + JSON.stringify(headers) : ""));
  });
  Logger.log("\nCONFIG.SHEET_NAME = '" + CONFIG.SHEET_NAME +
    "' — inquiries will be appended to this tab if it exists, " +
    "or a new one created with the standard header layout.");
}

// ─── PRE-DEPLOY COLUMN SYNC (run from the editor) ───────────
// Manually triggers the column auto-add on the Inquiries tab. Run this
// BEFORE deploying to see exactly which standard columns will be added
// to your existing sheet — extends the header row to the right, your
// existing rows + data are NEVER touched (blank cells fill the new
// columns in old rows). New rows from this point fill both old and
// new columns. Useful for previewing the upgrade without waiting for
// the first live inquiry to trigger it.
function syncSheetColumns() {
  if (!CONFIG.SHEET_ID || CONFIG.SHEET_ID.indexOf("YOUR_") === 0) {
    Logger.log("SHEET_ID not configured.");
    return;
  }
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);

  // Inquiries tab (auto-creates if missing)
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);

  const before = (sheet.getLastRow() > 0 && sheet.getLastColumn() > 0)
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
        .map(function (h) { return String(h || "").trim(); })
    : [];
  const after = ensureInquiryHeaders_(sheet);

  Logger.log("── INQUIRIES TAB (CONFIG.SHEET_NAME = '" + CONFIG.SHEET_NAME + "') ──");
  Logger.log("Header BEFORE: " + (before.length ? JSON.stringify(before) : "(empty/none)"));
  Logger.log("Header AFTER:  " + JSON.stringify(after));

  if (before.length === 0) {
    Logger.log("  ✓ Tab was empty → seeded with standard Okomba header layout.");
    return;
  }

  const beforeLower = before.map(function (h) {
    return String(h || "").toLowerCase().trim();
  });
  const added = after.filter(function (h) {
    return beforeLower.indexOf(h.toLowerCase()) === -1;
  });

  if (added.length > 0) {
    Logger.log("  ✓ Added " + added.length + " new column(s) to the RIGHT: " + JSON.stringify(added));
    Logger.log("  ✓ Your existing rows + data are untouched (blank cells in the new columns).");
    Logger.log("  ✓ New inquiries will fill every column going forward.");
  } else {
    Logger.log("  ✓ No new columns needed — sheet already has every standard header.");
  }
}

// ─── SETUP VERIFICATION (run once after CONFIG is filled) ─────
// Probes every dependency before going live. Run from the editor
// function dropdown after pasting this file + filling SHEET_ID.
// DO NOT deploy as a Web App until all checks are green.
function verifySetup() {
  const results = {
    runningAs: Session.getActiveUser().getEmail(),
    sheetAccessible: false,
    aliases: [],
    fromIsAlias: false,
    testEmailSent: false,
    errors: [],
  };

  // 1. Sheet access (must be shared with the running account)
  try {
    if (!CONFIG.SHEET_ID || CONFIG.SHEET_ID.indexOf("YOUR_") === 0) {
      results.errors.push(
        "SHEET_ID not configured — still 'YOUR_GOOGLE_SHEET_ID_HERE'. " +
        "Get it from the Sheet URL: /spreadsheets/d/THIS_PART/edit"
      );
    } else {
      const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
      ss.getRange("A1").getValue(); // probe read
      results.sheetAccessible = true;
    }
  } catch (e) {
    results.errors.push(
      "Sheet access failed: " + e.message + " — Share the Sheet (owned by " +
      "the SHEET OWNER account) with the running account " + results.runningAs +
      " as Editor."
    );
  }

  // 2. List configured "Send mail as" aliases
  try {
    results.aliases = MailApp.getAliases();
  } catch (e) {
    results.errors.push("MailApp.getAliases() failed: " + e.message);
  }

  // 3. Is CONFIG.FROM_EMAIL a registered alias of this account?
  results.fromIsAlias =
    results.aliases.indexOf(CONFIG.FROM_EMAIL) >= 0 ||
    results.runningAs.toLowerCase() === CONFIG.FROM_EMAIL.toLowerCase();
  if (!results.fromIsAlias) {
    results.errors.push(
      "FROM_EMAIL ('" + CONFIG.FROM_EMAIL + "') is NOT a registered alias of " +
      results.runningAs + ". Configure it under Gmail Settings → Accounts and " +
      "Import → Send mail as (use SMTP smtp.gmail.com:465 + support@okomba.com " +
      "credentials + a Google App Password). Available aliases on this account: [" +
      (results.aliases.length ? results.aliases.join(", ") : "none — primary only") + "]"
    );
  }

  // 4. Send a real test email to confirm the full send path works.
  if (results.fromIsAlias) {
    try {
      MailApp.sendEmail({
        to: CONFIG.ADMIN_EMAIL,
        from: CONFIG.FROM_EMAIL,
        replyTo: CONFIG.REPLY_TO_EMAIL,
        subject: "✓ Okomba Webhook — verifySetup() passed",
        body:
          "All checks passed — you are ready to receive live POSTs from " +
          "the Next.js app.\n\n" +
          "Running as:  " + results.runningAs + "\n" +
          "FROM:        " + CONFIG.FROM_EMAIL + "\n" +
          "REPLY-TO:    " + CONFIG.REPLY_TO_EMAIL + "\n" +
          "ADMIN:       " + CONFIG.ADMIN_EMAIL + "\n" +
          "SHEET_ID:    " + CONFIG.SHEET_ID + "\n\n" +
          "Aliases on this account (" + results.aliases.length + " total):\n" +
          (results.aliases.length ? results.aliases.map(function (a) { return "  • " + a; }).join("\n") : "  (primary only)") + "\n\n" +
          "Next: Deploy → New deployment → Web app (Execute as: Me, Access: Anyone) " +
          "→ copy the /exec URL → paste into Render as NOTIFY_WEBHOOK_URL.",
      });
      results.testEmailSent = true;
    } catch (e) {
      results.errors.push("Test email send failed: " + e.message);
    }
  }

  Logger.log("verifySetup() results:\n" + JSON.stringify(results, null, 2));
  if (results.errors.length === 0) {
    Logger.log("\n✓ ALL CHECKS PASSED — safe to deploy.");
  } else {
    Logger.log("\n✗ " + results.errors.length + " issue(s) to fix:");
    results.errors.forEach(function (err) { Logger.log("  - " + err); });
  }
  return results;
}

// ─── TEST (run manually in the editor) ───────────────────────
function testWebhook() {
  const sample = {
    type: "inquiry.created",
    recipient: CONFIG.ADMIN_EMAIL,
    subject: "Test inquiry",
    inquiry: {
      name: "Test User",
      email: "test@example.com",
      phone: "+234 000 000 0000",
      service: "Web Development",
      message: "This is a test from the Apps Script editor.",
    },
  };
  handleNotification(sample);
  Logger.log("Test sent to " + CONFIG.ADMIN_EMAIL);
}

// Test the invoice path from the editor (PDF attached check).
function testInvoiceEmail() {
  const pdfBlob = Utilities.newBlob("OKOMBA TEST INVOICE", "application/pdf", "test.pdf");
  sendInvoiceEmail({
    to: CONFIG.ADMIN_EMAIL,
    subject: "Test invoice — PDF attachment check",
    body: "Test invoice body. A PDF should be attached to this email.",
    html: "<p>Test <b>invoice</b> body. A PDF should be attached.</p>",
    base64Pdf: Utilities.base64Encode(pdfBlob.getBytes()),
    filename: "Okomba_Invoice_TEST.pdf",
    invoiceSummary: {
      invoiceNumber: "OKO-TEST-0001",
      customerName: "Test User",
      service: "Web Development",
      amount: "₦250,000",
      dueDate: "in 14 days",
    },
  });
  Logger.log("Test invoice sent to " + CONFIG.ADMIN_EMAIL);
}
