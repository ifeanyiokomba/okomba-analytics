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
 * SETUP (first time):
 * 1. Go to https://script.google.com → New project → "Okomba Webhook"
 * 2. Paste this entire file into the editor
 * 3. Fill the CONFIG section below
 * 4. Deploy → New deployment → Web app
 *      Execute as:  Me
 *      Who has access:  Anyone
 * 5. Copy the Web App URL
 * 6. Set it as the NOTIFY_WEBHOOK_URL environment variable on your
 *    Next.js host (Render dashboard → Environment).
 *
 * The app then forwards every notification here automatically.
 */

// ─── CONFIG — UPDATE THESE VALUES ───────────────────────────
const CONFIG = {
  // Google Sheet ID (from /spreadsheets/d/YOUR_ID_HERE/edit)
  SHEET_ID: "YOUR_GOOGLE_SHEET_ID_HERE",

  // Sheet tab name for inquiries
  SHEET_NAME: "Inquiries",

  // Admin email — receives inquiry alerts
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
  const mail = { to: opts.to, subject: opts.subject, body: opts.body };
  if (opts.replyTo) mail.replyTo = opts.replyTo;
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
