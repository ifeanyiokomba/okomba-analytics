/**
 * OKOMBA ANALYTICS — Google Apps Script Webhook (v2)
 * ------------------------------------------------
 * Receives notifications from the Next.js app, saves inquiries to
 * Google Sheets, and sends every email type through Gmail:
 *
 *   • inquiry.created     → Sheets row + admin alert + user confirmation
 *   • subscriber.welcome  → double-opt-in email with confirm link
 *   • post.published      → new-post blast to confirmed subscribers
 *   • broadcast           → free-form admin broadcast
 *
 * Backward compatible with the original v1 inquiry format.
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

    // v2 format: { type, recipient, subject, body, ...payload }
    if (data.type) {
      handleNotification(data);
    } else if (data.name || data.email) {
      // v1 legacy format: raw inquiry from the original Vite app
      handleLegacyInquiry(data);
    } else {
      throw new Error("Unrecognized payload");
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

// ─── GMAIL SENDER ────────────────────────────────────────────
function sendSimpleEmail(opts) {
  if (!opts.to) return;
  const mail = { to: opts.to, subject: opts.subject, body: opts.body };
  if (opts.replyTo) mail.replyTo = opts.replyTo;
  MailApp.sendEmail(mail);
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
