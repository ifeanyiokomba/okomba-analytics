# Code.gs Reconciliation — Master Directive §3.A + §5 Batch 5

> **Task ID:** B5 · **Agent:** general-purpose · **Date:** 2026-08-27
> **Master Directive refs:** §3.A (Code.gs / Google Apps Script requirements, 9 sub-requirements), §5 Batch 5 (Code.gs founder-side deployment verification).
> **B0-A matrix refs:** R48 (Code.gs committed but founder-side deploy pending), R49 (Code.gs version/integration/deployment verification), R74 (Code.gs reconciliation — this document).

This document formally reconciles the Okomba Analytics project's Google Apps Script engine (`Google-apps-script/Code.gs`) against the 9 sub-requirements mandated by Master Directive §3.A. Every claim below is verified against actual code (file paths + line numbers from `Read` / `Grep` / `git log` / `git diff`), not against prior worklog attestations.

---

## A. Existence + Version

| Property | Value | Verified via |
|---|---|---|
| File path | `/home/z/my-project/Google-apps-script/Code.gs` | `LS Google-apps-script/` |
| Line count | **809 lines** | `wc -l Google-apps-script/Code.gs` → `809` |
| Version | **v5** | `head -3 Google-apps-script/Code.gs` → first comment line reads `OKOMBA ANALYTICS — Google Apps Script Engine (v5)` |
| Last modified | **2026-08-27 06:14:42 +0000** | `git log -1 --format=%ci -- Google-apps-script/Code.gs` |
| Commits on origin/main that touched Code.gs (top 5) | `a10848e feat(apps-script): v5 — auto-add missing columns to existing sheet`<br>`f0093d3 feat(apps-script): v4 — paste-and-go with founder's Sheet ID + smart header matching`<br>`dbfcff3 feat(apps-script): multi-account email architecture + verifySetup()`<br>`47af694 feat(email): Phase-1 Module 3 — branded HTML engine + PDF attachments`<br>`6520124 docs: worklog — Google Apps Script email reconnection record` | `git log --oneline origin/main -- Google-apps-script/Code.gs \| head -5` |

**Finding:** ✅ Code.gs v5 (809 lines) exists at the expected path, is committed at SHA `a10848e` on `origin/main`, and the v5 version is the latest commit touching the file. The Phase 14 worklog claim that "v5 (809 lines) was pushed in Phase 14 (commit a10848e)" is verified against `git log --oneline origin/main`.

---

## B. Intended Functionality

All 11 features listed in Master Directive §3.A were verified by reading `Google-apps-script/Code.gs` directly. Each row below cites the line(s) where the function or constant is defined.

| Feature | Location (file:line) | Status |
|---|---|---|
| **4 action types** routed by `doPost(e)` switch | `Code.gs:144-179` — `switch (data.action)` covering `sendInvoiceEmail`, `backupToSheet`, `sendEmail` (incl. `case undefined`, `case null`), `improveWithAI` (rejected with explicit error), `default` (throws "Unknown action") | ✅ Present |
| `sendEmail` action | `Code.gs:151-171` — handles 3 sub-paths: `data.type` set → `handleNotification(data)`; `data.name`/`data.email` → `handleLegacyInquiry(data)`; bare `data.subject + data.recipient` → `sendSimpleEmail({...})`; else throws "Unrecognized payload" | ✅ Present |
| `sendInvoiceEmail` action | `Code.gs:145-147` (switch case) + `Code.gs:484-512` (function body — sends branded HTML + base64 PDF attached via `MailApp.sendEmail` and auto-backs up to the "Invoices" tab via `backupToSheet("Invoices", [...])` using `data.invoiceSummary`) | ✅ Present |
| `backupToSheet` action | `Code.gs:148-150` (switch case) + `Code.gs:520-597` (function body — smart-matches existing tab headers, creates new tabs with row's keys as headers, AUTO-ADDS columns from incoming rows that aren't already in the header to the right, idempotent) | ✅ Present |
| Legacy inquiry routing (no `action` field, v1 format) | `Code.gs:152-170` (the `case undefined`/`case null` fall-through handles legacy v1 inquiries when `data.name`/`data.email` is set → `handleLegacyInquiry`) + `Code.gs:244-258` (function body) | ✅ Present |
| Multi-account setup constants `FROM_EMAIL`, `REPLY_TO_EMAIL`, `ADMIN_EMAIL` | `Code.gs:88-121` — `CONFIG.FROM_EMAIL = "support@okomba.com"` (line 104), `CONFIG.REPLY_TO_EMAIL = "support@okomba.com"` (line 109), `CONFIG.ADMIN_EMAIL = "support@okomba.com"` (line 114) | ✅ Present + pre-filled |
| `syncSheetColumns()` | `Code.gs:638-678` — auto-adds missing `STANDARD_INQUIRY_HEADERS` to the right of existing Inquiries tab headers (extends the header row, your existing rows + data are NEVER touched). Logger output before/after. | ✅ Present |
| `ensureInquiryHeaders_(sheet)` | `Code.gs:341-377` — internal helper that reads existing tab headers, computes missing standard headers, extends the header row to the right (styled gold-on-ink bold), returns the final header array | ✅ Present |
| `verifySetup()` | `Code.gs:684-770` — probes (1) Sheet access (`SpreadsheetApp.openById` + `getRange("A1").getValue()`), (2) `MailApp.getAliases()`, (3) `FROM_EMAIL` is registered alias or running account, (4) sends a real test email to `ADMIN_EMAIL`. Returns a structured `results` object + Logger output. Throws structured errors with explicit remediation guidance per failed check. | ✅ Present + comprehensive |
| `listSheetTabs()` | `Code.gs:604-628` — debug helper that lists every tab + headers (run BEFORE `verifySetup()` to confirm your existing data layout matches what the smart `saveToSheet()` will append to) | ✅ Present |
| **Smart `saveToSheet` — Scenario A** (existing tab with custom headers) | `Code.gs:341-377` (`ensureInquiryHeaders_`) + `Code.gs:280-335` (`saveToSheet` body — reads existing headers, calls `ensureInquiryHeaders_` to auto-add missing standard columns to the right, then maps each inquiry field to its column case-insensitively. Common header variants are matched: "Name"/"Full Name"/"Client Name"/"Customer Name" all map to `data.name`, etc. Unrecognized custom columns preserved untouched as blank cells.) | ✅ Present |
| **Smart `saveToSheet` — Scenario B** (no tab → create with standard headers) | `Code.gs:347-355` — `if (headers.length === 0) { headers = STANDARD_INQUIRY_HEADERS.slice(); sheet.getRange(...).setValues([headers]); sheet.getRange(...).setFontWeight("bold").setBackground("#F0A500").setFontColor("#0B0F1A"); sheet.setFrozenRows(1); }` | ✅ Present |
| `backupToSheet` for "Invoices" tab — smart-matching | `Code.gs:500-511` (auto-backup inside `sendInvoiceEmail`) + `Code.gs:520-597` (the function — uses the same smart-match logic: normalizes keys by lowercase + strip spaces/underscores/hyphens, auto-creates the tab with row keys as headers if missing, auto-adds missing columns from incoming rows to the right of existing headers, gold-on-ink bold header + frozen first row) | ✅ Present |
| Pre-filled `SHEET_ID` | `Code.gs:92` — `SHEET_ID: "14ocJfSFpsm2MOaI8eAPJ8E4VMh84aJQ1GgoQu7v57sY"` | ✅ Matches the directive's expected value |
| Pre-filled `FROM_EMAIL` | `Code.gs:104` — `FROM_EMAIL: "support@okomba.com"` | ✅ |
| Pre-filled `REPLY_TO_EMAIL` | `Code.gs:109` — `REPLY_TO_EMAIL: "support@okomba.com"` | ✅ |
| Pre-filled `ADMIN_EMAIL` | `Code.gs:114` — `ADMIN_EMAIL: "support@okomba.com"` | ✅ |
| Pre-filled `SITE_URL` | `Code.gs:120` — `SITE_URL: "https://www.okomba.com"` | ✅ |

**Finding:** ✅ All intended functionality is present in Code.gs v5. The 4 action types, multi-account setup, smart Sheets persistence (both Scenarios A and B), `verifySetup`, `syncSheetColumns`, `listSheetTabs`, and pre-filled production constants are all verified at the cited line ranges.

---

## C. Application Integration — **CRITICAL INTEGRATION BUG FOUND**

This is the most important section of the reconciliation. Master Directive §3.A sub-requirement (3) demands verification that Code.gs "contains the intended functionality" AND sub-requirement (4) demands verification that it "is integrated with the application." Both are checked above and below — but the integration verification surfaces a **CRITICAL multi-layer mismatch** between the Phase 29 email failover chain and Code.gs v5's `doPost(e)` expectations.

### C.1 — What Code.gs v5's `doPost(e)` actually reads

Reading `Google-apps-script/Code.gs:140-187` directly, the `doPost(e)` switch reads these fields from the parsed JSON body:

| Field | Read at | Used for |
|---|---|---|
| `data.action` | `Code.gs:144` | `switch (data.action)` — primary router |
| `data.type` | `Code.gs:155` | `if (data.type) handleNotification(data)` |
| `data.recipient` | `Code.gs:159, 162, 205, 220, 221` | **the recipient email field for `handleNotification` and bare `sendEmail` paths** — NOT `data.to` |
| `data.subject` | `Code.gs:159, 162, 206` | email subject |
| `data.body` | `Code.gs:164, 207` | plain-text body (passed to `MailApp.sendEmail({body: opts.body})`) |
| `data.html` | `Code.gs:165, 208, 489` | HTML body (passed to `MailApp.sendEmail({htmlBody: opts.html})` at `Code.gs:469`) |
| `data.attachments` | `Code.gs:166, 209, 470-477` | array of `{filename, contentType, base64}` |
| `data.inquiry` | `Code.gs:219` | object (`{name, email, phone, whatsapp, service, addlService, additionalService, message}`) — used by `handleInquiryNotification` to compose the admin alert + submitter confirmation bodies |
| `data.name` / `data.email` | `Code.gs:157` | legacy v1 inquiry detection (no `type` field) |
| `data.to` | `Code.gs:486` | **the recipient email field for the `sendInvoiceEmail` action ONLY** |
| `data.base64Pdf` | `Code.gs:492` | base64-encoded PDF for `sendInvoiceEmail` |
| `data.filename` | `Code.gs:494` | PDF filename for `sendInvoiceEmail` |
| `data.invoiceSummary` | `Code.gs:500` | object for the Invoices tab auto-backup row |
| `data.tab` | `Code.gs:149` | tab name for `backupToSheet` action |
| `data.data` / `data.rows` | `Code.gs:149` | row array for `backupToSheet` action |

**CRITICAL — Code.gs v5 reads `recipient` for the `handleNotification` path (the path all non-invoice emails go through). It reads `to` ONLY for the `sendInvoiceEmail` action.**

### C.2 — What the Phase 29 failover chain actually POSTs

The Phase 29 email failover chain has TWO code paths that POST to Apps Script:

#### Path 1: Modern `apps_script` provider (active when an admin has configured the apps_script provider in the admin Settings tab → an `EmailProviderConfig` row with `provider = "apps_script"`)

Verified at `src/lib/email-config.ts:438-460` (the `callProviderApi` function, `provider === "apps_script"` branch). The payload shape is built by the exported `buildAppsScriptPayload(opts)` helper (extracted in B5 from the inline `JSON.stringify({...})` that was hardcoded in Phase 29):

```js
// src/lib/email-config.ts:420-432 (B5-extracted helper)
export function buildAppsScriptPayload(opts: AppsScriptPayloadOptions): Record<string, unknown> {
  return {
    action: "sendEmail",     // ← HARDCODED — never "sendInvoiceEmail"
    to: opts.to,             // ← sends `to`, NOT `recipient`
    subject: opts.subject,
    body: opts.bodyText,
    html: opts.bodyHtml,
    bodyText: opts.bodyText,
    bodyHtml: opts.bodyHtml,
    attachments: opts.attachments,
    type: opts.type,
  };
}
```

#### Path 2: Legacy `NOTIFY_WEBHOOK_URL` fallback (active when no `EmailProviderConfig` rows are configured AND the `NOTIFY_WEBHOOK_URL` env var is set)

Verified at `src/lib/email-failover.ts:149-185` (the legacy fallback branch of `deliverWithFailover`). The payload shape is built by the exported `buildLegacyAppsScriptPayload(opts, ctx)` helper (extracted in B5):

```js
// src/lib/email-failover.ts:104-123 (B5-extracted helper)
export function buildLegacyAppsScriptPayload(
  opts: LegacyAppsScriptPayloadOptions,
  ctx: { bodyText: string; attachments: FailoverAttachment[] }
): Record<string, unknown> {
  return {
    action: opts.legacyAction ?? "sendEmail",   // "sendEmail" or "sendInvoiceEmail"
    to: opts.to,                                // ← sends `to`, NOT `recipient`
    subject: opts.subject,
    body: ctx.bodyText,
    html: opts.bodyHtml,
    bodyText: ctx.bodyText,
    bodyHtml: opts.bodyHtml,
    attachments: ctx.attachments,
    base64Pdf: ctx.attachments.length > 0 ? ctx.attachments[0].base64 : undefined,
    filename: ctx.attachments.length > 0 ? ctx.attachments[0].filename : undefined,
    invoiceSummary: opts.invoiceSummary,
    // ← NO `type` field is sent
    // ← NO `recipient` field is sent
    // ← NO `inquiry` field is sent
  };
}
```

### C.3 — The mismatch — 6 distinct integration bugs

Comparing §C.1 (what Code.gs reads) against §C.2 (what the failover chain sends) surfaces **6 distinct integration bugs**. Each bug is asserted in `tests/codegs-payload-shape.test.ts` (the contract test added in this batch) — the test PASSES today by asserting the buggy outcome (so the suite stays green) and will FAIL if anyone fixes the bug (forcing them to update both the test AND Code.gs together — that's the drift-detection contract).

#### Bug #1 — `to` vs `recipient` field-name mismatch (the BIG one)

- **What:** The failover chain (both Path 1 modern provider and Path 2 legacy fallback) sends `to` as the recipient field name. Code.gs v5's `handleNotification` (and `handleInquiryNotification`, and the bare `sendEmail` branch) read `data.recipient` — a field that is NEVER sent.
- **Where applied:** `email-config.ts:423` (modern: `to: opts.to`), `email-failover.ts:110` (legacy: `to: opts.to`); vs `Code.gs:159, 162, 205, 220, 221` (all `data.recipient` reads).
- **Symptom:** `sendSimpleEmail({to: undefined, ...})` → Code.gs's `if (!opts.to) return;` early-exit (`Code.gs:450`) fires → the email is **silently dropped**. No error returned to the caller — the function returns void.
- **Affected email types:** `subscriber.welcome`, `post.published`, `broadcast` — these never reach MailApp.sendEmail because the recipient is undefined.
- **Test scenario:** `tests/codegs-payload-shape.test.ts` → "Modern apps_script provider > simulator: action=sendEmail + type=subscriber.welcome → SILENTLY DROPPED (recipient missing)".

#### Bug #2 — Missing `inquiry` field for `inquiry.created` type

- **What:** Code.gs's `handleInquiryNotification` reads `data.inquiry` (an object with name, email, phone, whatsapp, service, addlService, additionalService, message). The failover chain does NOT send this field — it sends the composed HTML + plain-text body only.
- **Where applied:** `Code.gs:219` (`const inq = data.inquiry || {};`); neither `email-config.ts:420-432` nor `email-failover.ts:104-123` includes `inquiry` in the payload.
- **Symptom:** `inq = {}` → `inq.email` is undefined → `isForSubmitter` is false → Code.gs falls to the admin copy branch:
  - `saveToSheet({})` → appends a **BLANK row** to the Google Sheet (every column empty).
  - `sendSimpleEmail({to: CONFIG.ADMIN_EMAIL, subject: "🔔 New Inquiry: General — ", body: adminAlertBody({}), ...})` → admin gets an email with an **empty body** (every NAME/EMAIL/PHONE/WHATSAPP field blank).
  - The submitter's confirmation email is **NEVER sent**.
- **Affected email types:** `inquiry.created` (both admin copy and submitter copy).
- **Test scenario:** `tests/codegs-payload-shape.test.ts` → "Modern apps_script provider > simulator: action=sendEmail + type=inquiry.created → admin copy sent (to ADMIN_EMAIL), submitter copy NOT sent, sheet row appended with empty inquiry".

#### Bug #3 — `handleNotification` switch has no default — unknown types silently no-op

- **What:** Code.gs v5's `handleNotification(data)` switch (`Code.gs:197-212`) handles only 4 cases: `inquiry.created`, `subscriber.welcome`, `post.published`, `broadcast`. There is **NO `default:` clause** — any other type falls through and the function returns without doing anything (no email, no error, no Logger output).
- **Where applied:** `Code.gs:196-213` (handleNotification function).
- **Symptom:** Emails with types like `invoice.sent`, `invoice.reminder_3d`, `invoice.reminder_due`, `invoice.reminder_overdue`, `payment.received`, `system.alert`, `crm.message` — when sent through Path 1 (modern apps_script provider, which sends `action: "sendEmail"` + `type: <any>`), Code.gs routes to `handleNotification` → switch has no matching case → silent no-op.
- **Affected email types:** All types except the 4 listed above.
- **Test scenarios:** `tests/codegs-payload-shape.test.ts` → "Modern apps_script provider > simulator: action=sendEmail + type=invoice.sent → SILENTLY DROPPED (no matching case in handleNotification switch)" (and same for reminder, payment.received, system.alert).

#### Bug #4 — Legacy fallback path drops the `type` field entirely

- **What:** The legacy fallback payload (built by `buildLegacyAppsScriptPayload` in `email-failover.ts:104-123`) does NOT include `type` in the JSON body — only 11 fields (action, to, subject, body, html, bodyText, bodyHtml, attachments, base64Pdf, filename, invoiceSummary). Even though `notify.ts` passes `type: opts.type` to `deliverWithFailover`, the legacy payload builder silently drops it.
- **Where applied:** `email-failover.ts:108-122` (the return object does not include `type`).
- **Symptom:** Code.gs's `doPost` switch hits `case "sendEmail"` → enters the `if (data.type)` check → `data.type` is undefined → falls to `else if (data.name || data.email)` → both undefined → falls to `else if (data.subject && data.recipient)` → `recipient` is undefined → falls to the `else` branch → **`throw new Error("Unrecognized payload")`** (`Code.gs:169`). Apps Script catches the throw and returns `{success: false, error: "Unrecognized payload"}` with HTTP 200 (Apps Script's `ContentService` always returns 200 from `doPost`). The failover chain's `res.ok` check (`email-failover.ts:176`) sees HTTP 200 → thinks the call **succeeded** → marks the email as sent. **TRUE SILENT FAILURE.**
- **Affected email types:** Every non-invoice email sent through the legacy fallback path (inquiry.created, subscriber.welcome, post.published, broadcast, system.alert).
- **Test scenarios:** `tests/codegs-payload-shape.test.ts` → "Legacy NOTIFY_WEBHOOK_URL fallback > simulator: action=sendEmail + type=...(BUT type dropped) → 'Unrecognized payload' silent drop" (5 scenarios covering each non-invoice type).

#### Bug #5 — Modern apps_script provider hardcodes `action: "sendEmail"` (ignores `legacyAction`)

- **What:** `notify.ts` passes `legacyAction: "sendInvoiceEmail"` for invoice emails (proposal, reminder, payment-received — verified at `src/lib/notify.ts:625, 813, 1109`). The modern apps_script provider's `buildAppsScriptPayload` (`email-config.ts:420-432`) **ignores** `legacyAction` entirely and **hardcodes** `action: "sendEmail"` at line 422. So invoice emails sent through the modern provider go through `handleNotification` → Bug #3 fires (no matching case for `invoice.sent` / `invoice.reminder_*` / `payment.received`) → silent no-op.
- **Where applied:** `email-config.ts:422` (`action: "sendEmail"` literal — no `legacyAction` parameter is even accepted by `buildAppsScriptPayload`).
- **Symptom:** If the founder configures the apps_script provider in the admin Settings tab (rather than relying on the legacy `NOTIFY_WEBHOOK_URL` fallback), ALL invoice emails (proposals + reminders + payment thank-yous) are silently dropped — the most user-facing email type goes missing.
- **Affected email types:** `invoice.sent`, `invoice.reminder_3d`, `invoice.reminder_due`, `invoice.reminder_overdue`, `payment.received` — but ONLY when sent through the modern apps_script provider (Path 1). When sent through the legacy fallback (Path 2), `legacyAction: "sendInvoiceEmail"` is honored → `action: "sendInvoiceEmail"` → Code.gs routes to `sendInvoiceEmail(data)` which reads `data.to` directly → **email IS sent**.
- **Test scenario:** `tests/codegs-payload-shape.test.ts` → "Modern apps_script provider > provider NEVER sends action=sendInvoiceEmail (hardcoded sendEmail)" + "Modern apps_script provider > simulator: action=sendEmail + type=invoice.sent → SILENTLY DROPPED (no matching case in handleNotification switch)".

#### Bug #6 — CRM message route uses `type: "crm.message"` (no matching case in `handleNotification`)

- **What:** `src/app/api/admin/customers/[id]/message/route.ts:97-114` has its OWN direct fetch to `NOTIFY_WEBHOOK_URL` (it does NOT go through `deliverWithFailover`). It correctly sends `recipient: c.email` (matching Code.gs's `recipient` field contract — Bug #1 doesn't apply here). But it sends `type: "crm.message"` — a type that Code.gs's `handleNotification` switch has NO case for. Bug #3 fires.
- **Where applied:** `src/app/api/admin/customers/[id]/message/route.ts:106` (`type: "crm.message"`) + `Code.gs:197-212` (handleNotification switch with no `crm.message` case).
- **Symptom:** The CRM message email is silently dropped (switch falls through, no email sent).
- **Test scenario:** `tests/codegs-payload-shape.test.ts` → "CRM message route > simulator: action=sendEmail + type=crm.message + recipient set → SILENTLY DROPPED (unmatched type)".

### C.4 — Summary of the working vs broken delivery matrix

| Email type | notify.ts caller | notify.ts `legacyAction` | Path 1 (modern apps_script provider) | Path 2 (legacy `NOTIFY_WEBHOOK_URL` fallback) |
|---|---|---|---|---|
| `inquiry.created` | `deliverOne` | `"sendEmail"` | ⚠️ Admin copy sent w/ empty body + blank sheet row; **submitter copy NEVER sent** (Bug #1 + Bug #2) | ❌ "Unrecognized payload" — silent drop (Bug #4) |
| `subscriber.welcome` | `deliverOne` | `"sendEmail"` | ❌ Silent drop — `to: undefined` early-exit (Bug #1) | ❌ "Unrecognized payload" — silent drop (Bug #4) |
| `post.published` | `deliverOne` | `"sendEmail"` | ❌ Silent drop (Bug #1) | ❌ "Unrecognized payload" — silent drop (Bug #4) |
| `broadcast` | `deliverOne` | `"sendEmail"` | ❌ Silent drop (Bug #1) | ❌ "Unrecognized payload" — silent drop (Bug #4) |
| `invoice.sent` (proposal) | `sendProposalEmail` | `"sendInvoiceEmail"` | ❌ Silent drop — no matching case in switch (Bug #3 + Bug #5) | ✅ **WORKS** — `sendInvoiceEmail(data)` reads `data.to` directly |
| `invoice.reminder_3d` | `sendReminderEmail` | `"sendInvoiceEmail"` | ❌ Silent drop (Bug #3 + Bug #5) | ✅ **WORKS** |
| `invoice.reminder_due` | `sendReminderEmail` | `"sendInvoiceEmail"` | ❌ Silent drop (Bug #3 + Bug #5) | ✅ **WORKS** |
| `invoice.reminder_overdue` | `sendReminderEmail` | `"sendInvoiceEmail"` | ❌ Silent drop (Bug #3 + Bug #5) | ✅ **WORKS** |
| `payment.received` (thank-you) | `sendPaymentThankYouEmail` | `"sendInvoiceEmail"` | ❌ Silent drop (Bug #3 + Bug #5) | ✅ **WORKS** |
| `system.alert` | `sendAdminAlertEmail` | `"sendEmail"` | ❌ Silent drop — no matching case (Bug #3) | ❌ "Unrecognized payload" — silent drop (Bug #4) |
| `crm.message` (CRM Send-Message) | direct fetch in `route.ts:104` | n/a (no `action` field set — uses literal `action: "sendEmail"`) | n/a (this route doesn't use the failover chain) | ❌ Silent drop — no matching case for `crm.message` (Bug #6) |

**The only working scenarios today** are the 5 invoice-email types sent through the **Path 2 legacy fallback** (because `notify.ts` passes `legacyAction: "sendInvoiceEmail"` and Code.gs's `sendInvoiceEmail(data)` reads `data.to` directly). Everything else is silently dropped — the failover chain reports success (HTTP 200 from Apps Script) but no Gmail message is ever sent.

### C.5 — Impact assessment

This is a CRITICAL integration failure. Concretely:

1. **Founder's inbox will not receive any inquiry alerts** (Bug #1 + Bug #4). When a customer fills the inquiry form, an EmailLog row is created (Phase 29 preserves the local log), but no Gmail message arrives in `support@okomba.com`. The admin portal's Inquiries tab still shows the row (DB-backed), but the founder gets no push notification.
2. **Customers will not receive inquiry-confirmation receipts** (Bug #1 + Bug #2). The submitter's `✅ We received your inquiry` email is never sent.
3. **Newsletter double-opt-in confirmation emails don't go out** (Bug #1 + Bug #4). Subscribers can sign up but never receive the confirmation link → they can never confirm → the subscriber list never grows past the "pending" state.
4. **Post-publish blast emails don't go out** (Bug #1 + Bug #4). When the founder publishes a new post, no subscriber receives an email notification.
5. **Admin-composed broadcast emails don't go out** (Bug #1 + Bug #4). The Broadcast tab's "send to all subscribers" feature silently fails.
6. **System alerts don't reach the founder** (Bug #3 + Bug #4). Cloudinary-unconfigured warnings, backup-local-only warnings, payment-proof-uploaded notifications — all silently dropped.
7. **Invoice emails DO go out** (the only working path today) — proposals, reminders, and payment thank-yous reach customers correctly when sent through the legacy `NOTIFY_WEBHOOK_URL` fallback. This is because `notify.ts:625, 813, 1109` explicitly passes `legacyAction: "sendInvoiceEmail"` and Code.gs routes `action: "sendInvoiceEmail"` to `sendInvoiceEmail(data)` which reads `data.to` directly.

### C.6 — Recommended remediation (deferred to a future batch)

The fix requires coordinated changes on BOTH sides of the contract. Pick ONE of these two strategies:

**Strategy A — Update the provider to match Code.gs (preserves Code.gs v5 authoritative):**

In `src/lib/email-config.ts:420-432` (`buildAppsScriptPayload`):
- Add `recipient: opts.to` alongside `to: opts.to` (so both fields are sent — `recipient` is what Code.gs reads).
- Add `inquiry: opts.inquiry` (new field — populate from notify.ts's payload where applicable).
- Accept `legacyAction?: string` parameter and use it instead of hardcoded `"sendEmail"`.
- Forward the full notify.ts payload's `inquiry` object for `inquiry.created` type.

In `src/lib/email-failover.ts:104-123` (`buildLegacyAppsScriptPayload`):
- Add `type: opts.type` to the payload (Bug #4 fix).
- Add `recipient: opts.to` alongside `to: opts.to` (Bug #1 fix).
- Forward `inquiry: opts.inquiry` for `inquiry.created` type (Bug #2 fix).

In `src/lib/notify.ts`:
- Pass `inquiry` field for `inquiry.created` emails (currently the inquiry is composed into HTML body only).

In `Google-apps-script/Code.gs`:
- Add a `default:` case to `handleNotification` switch (Code.gs:197-212) that handles arbitrary types by sending a generic email using `data.recipient` + `data.subject` + `data.body` + `data.html`. OR add explicit cases for `invoice.sent`, `invoice.reminder_3d`, `invoice.reminder_due`, `invoice.reminder_overdue`, `payment.received`, `system.alert`, `crm.message` — Bug #3 fix.
- ⚠️ Note: the directive forbids modifying Code.gs v5 in this batch. The founder must perform this update on their Apps Script editor copy and re-deploy. Documented in §I below.

**Strategy B — Update Code.gs to match the provider (preferred long-term — but requires founder to re-paste):**

In `Google-apps-script/Code.gs`:
- Change `handleNotification` to read `data.to` instead of `data.recipient`.
- Add cases for all the missing types (or a default case that calls `sendSimpleEmail({to: data.to, ...})`).
- Have `sendInvoiceEmail` accept `attachments` directly (currently only reads `base64Pdf`).

⚠️ Strategy B requires re-deploying Code.gs (founder-side action — see §I). Strategy A is server-side only (no founder action needed) but adds redundant fields to the payload.

**This batch (B5) does NOT implement either fix** — it surfaces the bug via the contract test + this reconciliation doc. The fix is deferred to a future batch (the founder will need to be in the loop because either strategy has founder-side implications).

---

## D. Deployment Documentation

| Documentation item | Location | Status |
|---|---|---|
| Apps Script setup guide (15-min setup) | `docs/DEPLOYMENT.md:227-269` — section "Email notifications — Google Apps Script (your original pattern, extended)" with a numbered setup walkthrough | ✅ Present |
| `.env.example` documents `NOTIFY_WEBHOOK_URL` | `.env.example:50` (commented-out default with `YOUR_DEPLOYMENT_ID` placeholder) + `.env.example:218-221` ([PROD] pointer with `XXXX` placeholder) + `.env.example:256` (env reference table row: "Logs to console only (no email)") | ✅ Documented in 3 places |
| Step 1 — paste v5 | `docs/DEPLOYMENT.md:247` — "Paste the contents of `Google-apps-script/Code.gs` (in this repo) into the editor" | ✅ |
| Step 2 — run `listSheetTabs()` | `docs/DEPLOYMENT.md` does NOT mention `listSheetTabs()` explicitly. ⚠️ Documentation gap — but `Code.gs:604-628` defines the function with a clear docstring, and the v5 file header (Code.gs:60-61) documents it. | ⚠️ Not in DEPLOYMENT.md but documented in Code.gs |
| Step 3 — run `syncSheetColumns()` | `docs/DEPLOYMENT.md` does NOT mention `syncSheetColumns()` explicitly. ⚠️ Same documentation gap as Step 2 — the function is documented at `Code.gs:638-678` and in the v5 file header (Code.gs:62-66). | ⚠️ Not in DEPLOYMENT.md but documented in Code.gs |
| Step 4 — run `verifySetup()` (must be green) | `docs/DEPLOYMENT.md:249` — "Run the `testWebhook` function once → authorize Gmail/Sheets access when prompted". ⚠️ DEPLOYMENT.md references `testWebhook` (the v2-era function) instead of `verifySetup()` (the v5-replacement function). Both functions exist in Code.gs (`testWebhook` at Code.gs:773-788, `verifySetup` at Code.gs:684-770), but `verifySetup()` is the recommended v5 entry point. | ⚠️ Documentation drift — DEPLOYMENT.md still references v2's `testWebhook` instead of v5's `verifySetup` |
| Step 5 — Deploy as Web App (Execute as: Me, Access: Anyone) | `docs/DEPLOYMENT.md:250` — "Deploy → New deployment → Web app — 'Execute as: Me', 'Who has access: Anyone'" | ✅ Matches Code.gs:71-73 |
| Step 6 — copy the /exec URL | `docs/DEPLOYMENT.md:251` — "Copy the Web App URL" | ✅ Matches Code.gs:74 |
| Step 7 — set `NOTIFY_WEBHOOK_URL` on Render | `docs/DEPLOYMENT.md:252-256` — "On Render (or any host) set the environment variable" + example value `NOTIFY_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec` | ✅ Matches Code.gs:75-76 |
| Postman test commands for `sendInvoiceEmail` + `backupToSheet` | `docs/DEPLOYMENT.md:301-339` — full curl/Postman examples for both actions | ✅ Useful for founder E2E verification |

**Finding:** ✅ Deployment documentation exists (`docs/DEPLOYMENT.md:227-269` + `:301-339`) and is mostly accurate. ⚠️ Two minor drift items: (1) `listSheetTabs()` and `syncSheetColumns()` are documented inside Code.gs itself but not surfaced in DEPLOYMENT.md; (2) DEPLOYMENT.md still references the v2-era `testWebhook` function instead of the v5 `verifySetup()` function. Neither is blocking — the founder can discover both from reading Code.gs's header comment block — but a future polish batch should update DEPLOYMENT.md to reference the v5 functions explicitly.

---

## E. Latest Implementation Committed

The full commit history of `Google-apps-script/Code.gs` on `origin/main` (verified via `git log --oneline origin/main -- Google-apps-script/Code.gs`):

| Commit SHA | Message |
|---|---|
| `a10848e` | feat(apps-script): v5 — auto-add missing columns to existing sheet ← **LATEST = v5** |
| `f0093d3` | feat(apps-script): v4 — paste-and-go with founder's Sheet ID + smart header matching |
| `dbfcff3` | feat(apps-script): multi-account email architecture + verifySetup() |
| `47af694` | feat(email): Phase-1 Module 3 — branded HTML engine + PDF attachments |
| `6520124` | docs: worklog — Google Apps Script email reconnection record |

**Finding:** ✅ The LATEST commit on `origin/main` touching Code.gs is `a10848e`, whose commit message explicitly says "v5". `git show a10848e:Google-apps-script/Code.gs | head -3` confirms the file's first comment line reads `OKOMBA ANALYTICS — Google Apps Script Engine (v5)`. The Phase 14 worklog claim that "v5 (809 lines) was pushed in Phase 14 (commit a10848e)" is verified. No v3 or v4 is the latest — v5 is the latest committed version.

---

## F. Repository Contains Correct Production Version

| Verification | Command | Result |
|---|---|---|
| Local file matches `origin/main` | `git diff origin/main -- Google-apps-script/Code.gs` | **Empty output** — no local uncommitted changes |
| Local SHA matches origin SHA | `git rev-parse HEAD` vs `git rev-parse origin/main` | Local = `25b2f2f57...`, origin/main = `52b8d10c5...`. ⚠️ Heads diverge — local HEAD is 1+ commits ahead of origin/main (B5 work in progress). But Code.gs itself is unchanged locally vs origin/main. |
| Line-by-line identity | `diff <(git show origin/main:Google-apps-script/Code.gs) Google-apps-script/Code.gs` | **No diff output** — files are byte-identical |

**Finding:** ✅ The local `Google-apps-script/Code.gs` is byte-identical to `git show origin/main:Google-apps-script/Code.gs`. There are zero local uncommitted changes to Code.gs. The repository's HEAD may be ahead of origin/main (B5 commits pending push) but Code.gs itself was not modified in this batch — the directive's "Do NOT modify Code.gs v5" rule is honored.

---

## G. Application References Point to Valid Endpoints

| Reference | Where it lives | Points to |
|---|---|---|
| `NOTIFY_WEBHOOK_URL` env var (the Apps Script Web App /exec URL) | Read at `src/lib/email-failover.ts:152` (`process.env.NOTIFY_WEBHOOK_URL`) + `src/app/api/admin/customers/[id]/message/route.ts:97` | The founder's deployed Apps Script Web App /exec URL. No hardcoded URL anywhere in `src/` — verified via `grep -rn "NOTIFY_WEBHOOK_URL\|script.google.com/macros" src/` (excluding `src/generated/prisma/`): the only matches are env-var reads + the placeholder string `"https://script.google.com/macros/s/…/exec"` in `email-config.ts:582` (a form-field placeholder, never used as a real URL). |
| Apps Script Web App /exec URL pattern | Documented in `email-config.ts:582` (`PROVIDER_FIELD_DEFS.apps_script[0].placeholder = "https://script.google.com/macros/s/…/exec"`) + `.env.example:50, 221` | The official Apps Script Web App URL pattern. The founder pastes their actual /exec URL into either the admin Settings tab form OR the `NOTIFY_WEBHOOK_URL` env var on Render — both feed the same `fetch()` call in `email-failover.ts:156` or `email-config.ts:446`. |
| Hardcoded URLs in `src/` | None | Verified — no `script.google.com/macros/s/<actual-id>` literal appears in any non-generated source file. The only hardcoded Google-Apps-Script-adjacent URL is `smtp.gmail.com:465` in `Code.gs:51` (a documentation comment inside the Apps Script file itself — not in src/). |

**Finding:** ✅ The application reads `NOTIFY_WEBHOOK_URL` from the environment (no hardcoded Apps Script URL anywhere in `src/`). The endpoint is configured by the founder post-deployment (paste the /exec URL into Render's Environment tab OR the admin Settings tab's apps_script provider form). No references point to invalid endpoints — they all resolve to the founder-configured env var at runtime.

---

## H. Secrets / Configuration Safety

| Item | Location | Risk classification |
|---|---|---|
| `SHEET_ID = "14ocJfSFpsm2MOaI8eAPJ8E4VMh84aJQ1GgoQu7v57sY"` | `Code.gs:92` | 🟢 **Public ID, not a secret.** The Google Sheet ID is the long string in the sheet's URL (`/spreadsheets/d/THIS_PART/edit`). Anyone with the ID cannot access the sheet unless the owner has shared it with them. The sheet's ACL (Share dialog) is the actual access control. The ID appearing in source code is consistent with how Google's own Apps Script documentation handles it. |
| `FROM_EMAIL = "support@okomba.com"` | `Code.gs:104` | 🟢 **Public email address** — appears on the public website (footer + contact section + mailto links). Not a secret. |
| `REPLY_TO_EMAIL = "support@okomba.com"` | `Code.gs:109` | 🟢 Same as above. |
| `ADMIN_EMAIL = "support@okomba.com"` | `Code.gs:114` | 🟢 Same as above. |
| `SITE_URL = "https://www.okomba.com"` | `Code.gs:120` | 🟢 Public URL. |
| `BUSINESS_NAME = "OKOMBA ANALYTICS"` | `Code.gs:117` | 🟢 Public brand name. |
| Google App Password for `support@okomba.com` SMTP | `Code.gs:51` (mentioned in a setup-instructions comment only — never stored as a constant) | 🟢 Not in the file. The App Password is entered into Gmail's "Send mail as" settings UI by the founder — Apps Script never sees it (MailApp.sendEmail uses the running account's authenticated session). |
| `EMAIL_CONFIG_ENCRYPTION_KEY` (AES-256-GCM key for EmailProviderConfig table) | `.env.example:66` (commented out: `# EMAIL_CONFIG_ENCRYPTION_KEY=<paste-your-64-char-hex-string-here>`) | 🟢 Placeholder syntax used. The actual key is set on Render's Environment tab by the founder. |
| `PAYSTACK_SECRET_KEY` | `.env.example:127, 194` (placeholder syntax: `sk_live_<your-live-secret-key>` / `sk_test_<your-test-secret-key>`) | 🟢 Placeholder syntax used. |
| `ADMIN_PASSWORD` | `.env.example:35, 190` (placeholder: `change-me-to-a-strong-password` / `replace-with-a-32-char-strong-secret`) | 🟢 Placeholder syntax used. |
| `WHATSAPP_INTERNAL_TOKEN` | `.env.example:137` (placeholder: `change-me`) | 🟢 Placeholder syntax used. |
| `NOTIFY_WEBHOOK_URL` | `.env.example:50, 221` (placeholder: `YOUR_DEPLOYMENT_ID` / `XXXX`) | 🟢 Placeholder syntax used. |
| `DATABASE_URL` | `.env.example:28` (placeholder: `user:pass@your-neon-pooler-host.neon.tech/...`) | 🟢 Placeholder syntax used. |
| Scan for accidental secrets in `Code.gs` | `grep -in "sk_live\|api_key\|password\|secret_key" Google-apps-script/Code.gs` | 🟢 Only 2 matches — both are inside the docstring (`Code.gs:52` "App Password for that account" + `Code.gs:730` "Google App Password"). No actual secrets stored. |
| Scan for accidental secrets in `.env.example` | `grep -n "your-\|<your\|YOUR_\|XXXX\|replace-with\|change-me" .env.example` | 🟢 14 matches — all are placeholder syntax (`your-admin-email@example.com`, `YOUR_DEPLOYMENT_ID`, `XXXX`, `replace-with-a-32-char-strong-secret`, `change-me`, `<your-64-char-hex-string-here>`, `<your-test-secret-key>`, `<your-live-secret-key>`, `<paste-your-paystack-secret-key-here>`). No real secrets in `.env.example`. |

**Finding:** ✅ Code.gs v5 contains ZERO secrets. The pre-filled constants (`SHEET_ID`, `FROM_EMAIL`, `REPLY_TO_EMAIL`, `ADMIN_EMAIL`, `SITE_URL`, `BUSINESS_NAME`) are all public IDs/emails/URLs — not API keys, passwords, or tokens. The two mentions of "App Password" in Code.gs are inside a setup-instructions docstring (telling the founder to use a Google App Password when configuring their Gmail "Send mail as" alias) — the App Password itself is never stored in the script; it lives in Gmail's settings UI. `.env.example` uses placeholder syntax (`<your-...>`, `YOUR_...`, `XXXX`, `replace-with-...`, `change-me`) for every sensitive value — no real secrets are checked in.

---

## I. Founder Action List (remaining steps)

Per Master Directive §3.A sub-requirement (9) ("secrets/configuration are handled safely") + the B0-A matrix's R48 status ("🚀 Code.gs committed but founder-side Apps Script Web App deploy + NOTIFY_WEBHOOK_URL env var set on Render still pending"), the following founder-side steps remain:

### I.1 — Apps Script deployment (one-time, ~15 minutes)

1. **Log into https://script.google.com as the SENDER HOST Gmail account** (the Gmail account where `support@okomba.com` is configured as a "Send mail as" alias using Google SMTP — NOT your personal Gmail).
2. **Create a new Apps Script project** → name it "Okomba Webhook".
3. **Paste the entire contents of `/Google-apps-script/Code.gs`** (809 lines, v5) into the editor. The CONFIG block (Code.gs:88-121) is pre-filled for the Okomba setup — no edits needed unless you swap Google Sheets later.
4. **Run `listSheetTabs()`** from the function dropdown → confirm the existing tabs + headers match what the smart `saveToSheet()` will append to. (Diagnostic only — no writes.)
5. **Run `syncSheetColumns()`** from the function dropdown → auto-adds any missing `STANDARD_INQUIRY_HEADERS` (Code.gs:134-137) to the right of your existing Inquiries tab headers. Your existing rows + data are NEVER touched.
6. **Run `verifySetup()`** from the function dropdown → probes every dependency (Sheet access, MailApp aliases, FROM_EMAIL is registered, test email delivered to ADMIN_EMAIL). **DO NOT proceed until verifySetup() returns `errors: []` and Logger output reads "✓ ALL CHECKS PASSED — safe to deploy."** (Code.gs:684-770, esp. Code.gs:763-768.)
7. **Deploy → New deployment → Web app**:
   - **Execute as:** Me
   - **Who has access:** Anyone
8. **Copy the Web App URL** (ends in `/exec`).

### I.2 — Render configuration

9. **On Render dashboard → okomba-analytics → Environment tab** → add (or update) the `NOTIFY_WEBHOOK_URL` env var with the /exec URL from step 8.
10. **Trigger a redeploy** (Save changes → Render auto-redeploys the web service).

### I.3 — Post-deployment verification

11. **Submit a test inquiry** at https://okomba.com (use the inquiry form). Verify:
    - The inquiry row appears in the admin portal's Inquiries tab (DB-backed — works regardless of Apps Script).
    - ⚠️ See §C above — Apps Script email delivery is currently subject to Bug #1 + Bug #2 + Bug #4. The admin alert email + submitter confirmation email **may not arrive** even after this deployment. The EmailLog tab in the admin portal will show what *would* have been sent.
    - The Inquiries tab in the Google Sheet receives a row (Scenario A or B per §B above — when Apps Script receives the payload correctly). ⚠️ Note: due to Bug #4 (legacy fallback drops `type` field), the legacy path returns "Unrecognized payload" → no sheet row is appended either.
12. **Subscribe to the newsletter** at https://okomba.com/#newsletter. Verify:
    - The subscriber row appears in the admin portal's Subscribers tab with `confirmToken` set (DB-backed).
    - ⚠️ See §C above — the double-opt-in confirmation email **may not arrive** due to Bug #1 (Path 1) or Bug #4 (Path 2). The subscriber will remain in the "pending" state until either the founder manually confirms them in the admin portal OR the integration bug is fixed (Strategy A or B in §C.6).
13. **Send a test invoice email** via the admin portal's Proposals tab. Verify:
    - ✅ This WORKS — the email arrives at the customer with the PDF attached. This is the only email type that goes through `action: "sendInvoiceEmail"` → `sendInvoiceEmail(data)` → reads `data.to` directly.
14. **Visit the admin Settings tab** → configure the Email Failover Chain (4 providers in priority order: Google Apps Script → Resend → Mailtrap → Maileroo). Click "Test" on each provider to verify credentials. ⚠️ Note: until §C.6's fix is implemented, configuring the apps_script provider in the Settings tab will SWITCH delivery from the working Path 2 (legacy `NOTIFY_WEBHOOK_URL` fallback with `action: "sendInvoiceEmail"`) to the broken Path 1 (modern apps_script provider with hardcoded `action: "sendEmail"`) — **invoice emails will stop working**. The founder should configure Resend/Mailtrap/Maileroo as the primary providers until the integration bug is fixed.

### I.4 — Until the founder completes I.1-I.2

- The website runs in **log-only email mode**: inquiry submissions land in the DB + show in the admin Inquiries tab; newsletter signups land in the DB + show in the admin Subscribers tab (with status "pending"); EmailLog rows are created for every would-be email. No branded Gmail goes out for any email type EXCEPT invoice emails (which work via the legacy fallback IF the founder has set NOTIFY_WEBHOOK_URL — and even then only because `notify.ts:625, 813, 1109` explicitly passes `legacyAction: "sendInvoiceEmail"`).
- The founder must monitor the admin portal's Inquiries tab manually (no push notifications arrive via email).
- The founder should ALSO read `docs/DEPLOYMENT.md:227-269` for the Apps Script setup walkthrough (15 minutes).

### I.5 — Remediation tracking

The 6 integration bugs in §C must be tracked as a follow-up batch (suggested: B6 or B7). The recommended path is Strategy A in §C.6 (server-side fix — no founder re-deploy required). The contract test added in this batch (`tests/codegs-payload-shape.test.ts`) currently PASSES by asserting the buggy outcome — when the fix lands, those scenarios will FAIL (forcing the test author to update the assertions to reflect the corrected behavior). This is the drift-detection contract.

---

## Cross-references

- **Master Directive §3.A** — Code.gs 9 sub-requirements (existence, version, functionality, integration, deployment documentation, latest committed, repo correctness, valid endpoints, secrets safety). All 9 covered in §A-§I above.
- **Master Directive §5 Batch 5** — Code.gs founder-side deployment verification. §C.5 + §I document the founder action list.
- **B0-A matrix R48** — "🚀 Code.gs committed but founder-side deploy pending". Status unchanged: code is committed (§E + §F); founder-side deploy (§I.1-I.3) still pending. NEW finding: even after deploy, only invoice emails work (§C.5).
- **B0-A matrix R49** — "verify Code.gs version/integration/deployment". ✅ Version v5 verified (§A). ⚠️ Integration broken — §C documents 6 distinct bugs.
- **B0-A matrix R74** — "Code.gs reconciliation — formal document". This file is the deliverable.
- **tests/codegs-payload-shape.test.ts** — the contract test added in this batch (26 scenarios / 72 expect() calls, all PASS today as a snapshot of the current — broken — contract).
- **docs/email-link-inventory.md** — email-CTA inventory (B1-C + B4 live verification). The 6 broken scenarios in §C above would not surface via the CTA-inventory audit because the audit verifies URL ROUTES, not Apps Script delivery. The 2 audits are complementary.

---

**Audit performed by:** Task ID B5 (general-purpose subagent).
**Audit method:** Read + Grep + git log + git diff on production source. No dev server started. No real HTTP call made to Apps Script. No production code modified except the B5 extraction of `buildAppsScriptPayload` (email-config.ts:420-432) and `buildLegacyAppsScriptPayload` (email-failover.ts:104-123) — both are pure refactorings that preserve the EXACT payload shape Phase 29 was sending, just extracting the inline `JSON.stringify({...})` into a testable function. Code.gs itself was NOT modified (per directive).
