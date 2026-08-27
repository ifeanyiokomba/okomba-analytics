/**
 * OKOMBA ANALYTICS — Google Apps Script Engine (v3)
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
 * 5. Fill the CONFIG section below (only SHEET_ID needs changing).
 * 6. Run verifySetup() from the function dropdown — confirm all
 *    checks pass (Sheet access OK + FROM_EMAIL alias OK + test
 *    email delivered to support@okomba.com → forwarded to your
 *    reading inbox). DO NOT deploy until verifySetup() is green.
 * 7. Deploy → New deployment → Web app
 *      Execute as:  Me
 *      Who has access:  Anyone
 * 8. Copy the Web App URL (/exec).
 * 9. Set it as NOTIFY_WEBHOOK_URL on Render (Render dashboard →
 *    okomba-analytics → Environment).
 *
 * Quota ceiling: the SENDER HOST account's daily MailApp quota is
 * what counts. Personal Gmail = 100/day; Workspace = 1500/day.
 * If you exceed, emails silently fail past the cap (no customer-
 * facing error). See verifySetup() output for the active account.
 */

// ─── CONFIG — UPDATE THESE VALUES ───────────────────────────
// Only SHEET_ID needs to change in the common case. The other fields
// are pre-filled for the Okomba setup. Run verifySetup() to confirm
// everything is wired before deploying.
const CONFIG = {
  // Google Sheet ID (from /spreadsheets/d/YOUR_ID_HERE/edit).
  // The Sheet is owned by a different account; share it as Editor with
  // the account running this script (the SENDER HOST) before deploying.
  SHEET_ID: "YOUR_GOOGLE_SHEET_ID_HERE",

  // Sheet tab name for inquiries (auto-created on first use).
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
        } else if (data.subject && data.recipient) {
          // bare sendEmail without a type
          sendSimpleEmail({
            to: data.recipient,
            subject: data.subject,
            body: (data.body || "") + "\n\n" + footerBlock(),
            html: data.html,
            attachments: data.attachments,
          });
        } else {
          throw new Error("Unrecognized payload");
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
  switch (data.type) {
    case "inquiry.created":
      handleInquiryNotification(data);
      break;
    case "subscriber.welcome":
    case "post.published":
    case "broadcast":
      sendSimpleEmail({
        to: data.recipient,
        subject: data.subject,
        body: data.body + "\n\n" + footerBlock(),
        html: data.html, // branded HTML from the Next.js template
        attachments: data.attachments, // [{filename, contentType, base64}]
      });
      break;
  }
}

// Inquiry notification — full original treatment.
// The app sends this twice: once to the admin, once to the submitter
// (the recipient field distinguishes them).
function handleInquiryNotification(data) {
  const inq = data.inquiry || {};
  const isForSubmitter = data.recipient && inq.email &&
    String(data.recipient).toLowerCase() === String(inq.email).toLowerCase();

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

// ─── GOOGLE SHEETS ───────────────────────────────────────────
function saveToSheet(data) {
  if (!CONFIG.SHEET_ID || CONFIG.SHEET_ID.indexOf("YOUR_") === 0) return; // not configured
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.getRange(1, 1, 1, 9).setValues([[
      "Timestamp", "Name", "Email", "Phone",
      "WhatsApp", "Service", "Additional Service",
      "Message", "Source",
    ]]);
    sheet.getRange(1, 1, 1, 9)
      .setFontWeight("bold")
      .setBackground("#F0A500")
      .setFontColor("#0B0F1A");
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    new Date(),
    data.name || "",
    data.email || "",
    data.phone || "",
    data.whatsapp || "",
    data.service || "",
    data.addlService || "",
    data.message || "",
    "okomba.com",
  ]);
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
// Creates the tab on first use with headers from the first row's keys,
// then appends. Idempotent and schema-free.
function backupToSheet(tab, rows) {
  if (!tab || !rows || !rows.length) return;
  if (!CONFIG.SHEET_ID || CONFIG.SHEET_ID.indexOf("YOUR_") === 0) return; // not configured
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(tab);
  if (!sheet) {
    sheet = ss.insertSheet(tab);
  }
  if (sheet.getLastRow() === 0) {
    const headers = Object.keys(rows[0]);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#F0A500")
      .setFontColor("#0B0F1A");
    sheet.setFrozenRows(1);
  }
  const values = rows.map(function (r) {
    return Object.keys(rows[0]).map(function (k) {
      return r[k] === undefined || r[k] === null ? "" : r[k];
    });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, values[0].length).setValues(values);
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
          (results.aliases.length ? results.aliases.map(a => "  • " + a).join("\n") : "  (primary only)") + "\n\n" +
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
