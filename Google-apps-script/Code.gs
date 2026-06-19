/**
 * OKOMBA ANALYTICS — Google Apps Script Webhook
 * ------------------------------------------------
 * Receives form submissions from okomba.com,
 * saves them to Google Sheets, and sends email alerts.
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Create a new project — name it "Okomba Webhook"
 * 3. Paste this entire file into the editor
 * 4. Update the CONFIG section below with your values
 * 5. Click Deploy → New Deployment → Web App
 * 6. Set "Execute as" → Me
 * 7. Set "Who has access" → Anyone
 * 8. Click Deploy → copy the Web App URL
 * 9. Paste that URL into Cloudflare Pages environment variables
 *    as: VITE_SHEETS_WEBHOOK_URL
 */

// ─── CONFIG — UPDATE THESE VALUES ───────────────────────────
const CONFIG = {
  // Your Google Sheet ID (from the URL: /spreadsheets/d/YOUR_ID_HERE/edit)
  SHEET_ID: "YOUR_GOOGLE_SHEET_ID_HERE",

  // Sheet tab name (bottom tab in Google Sheets)
  SHEET_NAME: "Inquiries",

  // Admin email — receives notification for every new inquiry
  ADMIN_EMAIL: "support@okomba.com",

  // Your business name (used in email templates)
  BUSINESS_NAME: "OKOMBA ANALYTICS",

  // Your website URL
  SITE_URL: "https://www.okomba.com",
};

// ─── MAIN HANDLER ────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Save to Google Sheets
    saveToSheet(data);

    // Send admin notification email
    sendAdminEmail(data);

    // Send user confirmation email
    sendUserEmail(data);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── SAVE TO GOOGLE SHEETS ───────────────────────────────────
function saveToSheet(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  // Create sheet and headers if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.getRange(1, 1, 1, 9).setValues([[
      "Timestamp", "Name", "Email", "Phone",
      "WhatsApp", "Service", "Additional Service",
      "Message", "Source"
    ]]);
    sheet.getRange(1, 1, 1, 9)
      .setFontWeight("bold")
      .setBackground("#F0A500")
      .setFontColor("#0B0F1A");
    sheet.setFrozenRows(1);
  }

  // Append the new inquiry row
  sheet.appendRow([
    new Date(data.timestamp || new Date()),
    data.name        || "",
    data.email       || "",
    data.phone       || "",
    data.whatsapp    || "",
    data.service     || "",
    data.addlService || "",
    data.message     || "",
    data.source      || "okomba.com",
  ]);
}

// ─── ADMIN NOTIFICATION EMAIL ─────────────────────────────────
function sendAdminEmail(data) {
  const subject = `🔔 New Inquiry: ${data.service || "General"} — ${data.name}`;

  const body = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEW SERVICE INQUIRY
${CONFIG.BUSINESS_NAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NAME:     ${data.name}
EMAIL:    ${data.email}
PHONE:    ${data.phone}
WHATSAPP: ${data.whatsapp || "Not provided"}

SERVICE REQUESTED:
${data.service}

ADDITIONAL SERVICE:
${data.addlService || "None"}

MESSAGE:
${data.message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Submitted: ${new Date().toLocaleString()}
Source: ${data.source || CONFIG.SITE_URL}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reply directly to this email or:
📧 ${data.email}
📞 ${data.phone}
💬 https://wa.me/${(data.whatsapp || data.phone).replace(/\D/g, "")}
  `.trim();

  MailApp.sendEmail({
    to: CONFIG.ADMIN_EMAIL,
    replyTo: data.email,
    subject: subject,
    body: body,
  });
}

// ─── USER CONFIRMATION EMAIL ──────────────────────────────────
function sendUserEmail(data) {
  const subject = `✅ We received your inquiry — ${CONFIG.BUSINESS_NAME}`;

  const body = `
Hi ${data.name},

Thank you for reaching out to ${CONFIG.BUSINESS_NAME}!

We have received your inquiry for:
▸ ${data.service}

Our team will review your request and get back to you within 24 hours.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR SUBMISSION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service:  ${data.service}
Message:  ${data.message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need urgent help? Contact us directly:
📧 support@okomba.com
📞 +234 808 894 8657
💬 https://wa.me/2348088948657

Best regards,
${CONFIG.BUSINESS_NAME} Team
${CONFIG.SITE_URL}
  `.trim();

  MailApp.sendEmail({
    to: data.email,
    replyTo: CONFIG.ADMIN_EMAIL,
    subject: subject,
    body: body,
  });
}

// ─── TEST FUNCTION (run manually to verify) ──────────────────
function testWebhook() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        phone: "+2348000000000",
        whatsapp: "+2348000000000",
        service: "Web & Mobile App Development",
        addlService: "",
        message: "This is a test submission from the Apps Script editor.",
        timestamp: new Date().toISOString(),
        source: "script-test",
      })
    }
  };
  const result = doPost(testData);
  Logger.log(result.getContent());
}
