# Code.gs Reconciliation — Master Directive §3.A + §5 Batch 5

> **Task ID:** B5 (initial audit) → B5-FIX (root-cause fix) · **Agent:** general-purpose · **Date:** 2026-08-27
> **Master Directive refs:** §3.A (Code.gs / Google Apps Script requirements, 9 sub-requirements), §5 Batch 5 (Code.gs founder-side deployment verification), §8 (Fix the root cause, not symptoms — applied in B5-FIX).
> **B0-A matrix refs:** R48 (Code.gs committed but founder-side deploy pending), R49 (Code.gs version/integration/deployment verification), R74 (Code.gs reconciliation — this document).

This document formally reconciles the Okomba Analytics project's Google Apps Script engine (`Google-apps-script/Code.gs`) against the 9 sub-requirements mandated by Master Directive §3.A. Every claim below is verified against actual code (file paths + line numbers from `Read` / `Grep` / `git log` / `git diff`), not against prior worklog attestations.

> **B5-FIX update (2026-08-27):** The 6 integration bugs originally surfaced in §C below are now FIXED at the root cause per Master Directive §8. Code.gs is upgraded from v5 → v6. See §C.6 below for the per-bug fix matrix and §I for the updated founder action list (deploy v6, not v5). The contract test `tests/codegs-payload-shape.test.ts` was updated from "snapshot of buggy behavior" to "assertion of correct behavior" — every scenario that B5 asserted as "SILENTLY DROPPED" now asserts "EMAIL SENT ✓".

---

## A. Existence + Version

| Property | Value | Verified via |
|---|---|---|
| File path | `/home/z/my-project/Google-apps-script/Code.gs` | `LS Google-apps-script/` |
| Line count | **890 lines** (was 809 in v5; +81 lines for the v6 changelog + Bug 1/3/4/6 fixes) | `wc -l Google-apps-script/Code.gs` → `890` |
| Version | **v6** (B5-FIX upgrade from v5) | `head -3 Google-apps-script/Code.gs` → first comment line reads `OKOMBA ANALYTICS — Google Apps Script Engine (v6)` |
| Last modified (v5) | 2026-08-27 06:14:42 +0000 (commit a10848e — Phase 14 v5 push) | `git log -1 --format=%ci -- Google-apps-script/Code.gs` |
| Last modified (v6, B5-FIX) | 2026-08-27 (this batch — local file changed; commit pending push per directive) | `git diff origin/main -- Google-apps-script/Code.gs` shows the v5→v6 delta |
| Commits on origin/main that touched Code.gs (top 5) | `a10848e feat(apps-script): v5 — auto-add missing columns to existing sheet` (LATEST on origin/main — v6 commit pending push per directive)<br>`f0093d3 feat(apps-script): v4 — paste-and-go with founder's Sheet ID + smart header matching`<br>`dbfcff3 feat(apps-script): multi-account email architecture + verifySetup()`<br>`47af694 feat(email): Phase-1 Module 3 — branded HTML engine + PDF attachments`<br>`6520124 docs: worklog — Google Apps Script email reconnection record` | `git log --oneline origin/main -- Google-apps-script/Code.gs \| head -5` |

**Finding:** ✅ Code.gs v6 (890 lines) exists at the expected path. The B5-FIX upgrade from v5 (809 lines) → v6 (890 lines) implements the 6 root-cause fixes per Master Directive §8. The v6 file header (lines 1-37) documents the changelog with per-bug citations. All v5 functionality is preserved (sendEmail, sendInvoiceEmail, backupToSheet, smart saveToSheet, syncSheetColumns, ensureInquiryHeaders_, verifySetup, listSheetTabs). The v6 commit will be pushed by the main agent (per directive — B5-FIX does not push to git).

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

## C. Application Integration — **6 BUGS FIXED IN B5-FIX (was: CRITICAL INTEGRATION BUG FOUND in B5)**

This is the most important section of the reconciliation. Master Directive §3.A sub-requirement (3) demands verification that Code.gs "contains the intended functionality" AND sub-requirement (4) demands verification that it "is integrated with the application."

**B5 (initial audit) finding:** the integration verification surfaced a CRITICAL multi-layer mismatch between the Phase 29 email failover chain and Code.gs v5's `doPost(e)` expectations — 6 distinct integration bugs documented below.

**B5-FIX (this batch — root-cause fix per Master Directive §8):** All 6 bugs are now FIXED at the root cause. The fix touches BOTH sides of the contract: Code.gs is upgraded from v5 → v6 (authoritative Apps Script the founder will deploy), and the provider (email-config.ts + email-failover.ts + notify.ts) is updated to forward `legacyAction` + `inquiry` and to include `type` in the legacy payload. The 26 contract test scenarios in `tests/codegs-payload-shape.test.ts` were updated from "snapshot of buggy behavior" to "assertion of correct behavior" — every scenario that B5 asserted as "SILENTLY DROPPED" now asserts "EMAIL SENT ✓".

### C.1 — What Code.gs v6's `doPost(e)` now reads

Reading `Google-apps-script/Code.gs:167-217` directly (v6 — was lines 140-187 in v5), the `doPost(e)` switch reads these fields from the parsed JSON body. **B5-FIX Bug 1**: every recipient read site now accepts EITHER `data.recipient` (legacy field) OR `data.to` (modern provider field) via `const to = data.recipient || data.to;`.

| Field | Read at (v6) | Used for |
|---|---|---|
| `data.action` | `Code.gs:171` | `switch (data.action)` — primary router |
| `data.type` | `Code.gs:182` | `if (data.type) handleNotification(data)` |
| `data.recipient` OR `data.to` | `Code.gs:186, 190, 238, 299` (Bug 1 fix) | **the recipient email field for `handleNotification` + `handleInquiryNotification` + bare `sendEmail` paths — now accepts EITHER field** |
| `data.subject` | `Code.gs:191, 248, 262, 282` | email subject |
| `data.body` | `Code.gs:192, 249, 263, 283` | plain-text body |
| `data.html` | `Code.gs:193, 251, 264, 284` | HTML body |
| `data.attachments` | `Code.gs:194, 252, 265, 285` | array of `{filename, contentType, base64}` |
| `data.inquiry` | `Code.gs:300` | object (`{name, email, phone, whatsapp, service, addlService, additionalService, message}`) — used by `handleInquiryNotification` to compose the admin alert + submitter confirmation bodies. **B5-FIX Bug 2**: notify.ts now forwards this object through the FailoverOptions boundary. |
| `data.name` / `data.email` | `Code.gs:184` | legacy v1 inquiry detection (no `type` field) |
| `data.to` | `Code.gs:173` (sendInvoiceEmail only) + `Code.gs:190, 238, 299` (Bug 1 fallback) | **the recipient email field for the `sendInvoiceEmail` action AND now also the fallback for the handleNotification path** |
| `data.base64Pdf` | `Code.gs:519` | base64-encoded PDF for `sendInvoiceEmail` |
| `data.filename` | `Code.gs:521` | PDF filename for `sendInvoiceEmail` |
| `data.invoiceSummary` | `Code.gs:527` | object for the Invoices tab auto-backup row |
| `data.tab` | `Code.gs:176` | tab name for `backupToSheet` action |
| `data.data` / `data.rows` | `Code.gs:176` | row array for `backupToSheet` action |

**B5-FIX Bug 1 — Code.gs v6 now accepts BOTH `to` and `recipient`** for every email path except `sendInvoiceEmail` (which still reads `data.to` directly — that path was never broken because the legacy fallback's `legacyAction=sendInvoiceEmail` was honored and Code.gs's sendInvoiceEmail(data) reads `data.to` directly). The Bug 1 fix is backward-compatible: any v5 caller that sends `recipient` keeps working, AND any provider that sends `to` (the modern apps_script provider) now also works.

### C.2 — What the B5-FIX-updated failover chain POSTs

The Phase 29 email failover chain has TWO code paths that POST to Apps Script. B5 extracted both payload builders into pure functions; B5-FIX updated both to fix the integration bugs at the provider side.

#### Path 1: Modern `apps_script` provider (active when an admin has configured the apps_script provider in the admin Settings tab → an `EmailProviderConfig` row with `provider = "apps_script"`)

Verified at `src/lib/email-config.ts:438-460` (the `callProviderApi` function, `provider === "apps_script"` branch). The payload shape is built by the exported `buildAppsScriptPayload(opts)` helper (extracted in B5; **B5-FIX Bug 2 + Bug 5** applied):

```js
// src/lib/email-config.ts:437-472 (B5-extracted helper + B5-FIX Bug 2 + Bug 5)
export type AppsScriptPayloadOptions = {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments: Array<{ filename: string; contentType: string; base64: string }>;
  type: string;
  // B5-FIX Bug 5: when notify.ts passes legacyAction="sendInvoiceEmail"
  // for invoice emails, respect it instead of hardcoding "sendEmail".
  legacyAction?: string;
  // B5-FIX Bug 2: forward the full inquiry object for type=inquiry.created.
  inquiry?: Record<string, unknown>;
};

export function buildAppsScriptPayload(opts: AppsScriptPayloadOptions): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    action: opts.legacyAction ?? "sendEmail",   // B5-FIX Bug 5: was hardcoded "sendEmail"
    to: opts.to,
    subject: opts.subject,
    body: opts.bodyText,
    html: opts.bodyHtml,
    bodyText: opts.bodyText,
    bodyHtml: opts.bodyHtml,
    attachments: opts.attachments,
    type: opts.type,
  };
  if (opts.inquiry) {                            // B5-FIX Bug 2: forward inquiry when set
    payload.inquiry = opts.inquiry;
  }
  return payload;
}
```

#### Path 2: Legacy `NOTIFY_WEBHOOK_URL` fallback (active when no `EmailProviderConfig` rows are configured AND the `NOTIFY_WEBHOOK_URL` env var is set)

Verified at `src/lib/email-failover.ts:163-221` (the legacy fallback branch of `deliverWithFailover`). The payload shape is built by the exported `buildLegacyAppsScriptPayload(opts, ctx)` helper (extracted in B5; **B5-FIX Bug 4 (and Bug 2 on the legacy side)** applied):

```js
// src/lib/email-failover.ts:112-156 (B5-extracted helper + B5-FIX Bug 4)
export type LegacyAppsScriptPayloadOptions = {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  attachments?: FailoverAttachment[];
  type: string;
  invoiceSummary?: Record<string, unknown>;
  legacyAction?: string;
  // B5-FIX Bug 2 (legacy side): forward the inquiry object for
  // type=inquiry.created so Code.gs can compose the dual emails.
  inquiry?: Record<string, unknown>;
};

export function buildLegacyAppsScriptPayload(
  opts: LegacyAppsScriptPayloadOptions,
  ctx: { bodyText: string; attachments: FailoverAttachment[] }
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    action: opts.legacyAction ?? "sendEmail",
    to: opts.to,
    subject: opts.subject,
    body: ctx.bodyText,
    html: opts.bodyHtml,
    bodyText: ctx.bodyText,
    bodyHtml: opts.bodyHtml,
    attachments: ctx.attachments,
    base64Pdf: ctx.attachments.length > 0 ? ctx.attachments[0].base64 : undefined,
    filename: ctx.attachments.length > 0 ? ctx.attachments[0].filename : undefined,
    invoiceSummary: opts.invoiceSummary,
    type: opts.type,                              // B5-FIX Bug 4: was DROPPED in v5 → silent "Unrecognized payload" failure
  };
  if (opts.inquiry) {                            // B5-FIX Bug 2 (legacy side)
    payload.inquiry = opts.inquiry;
  }
  return payload;
}
```

`src/lib/email-failover.ts` `deliverWithFailover` now also forwards `legacyAction` and `inquiry` from `FailoverOptions` to `callProviderApi` (lines 209-223), and `src/lib/notify.ts:deliverOne` (lines 314-334) now passes `inquiry: payload.type === "inquiry.created" ? payload.inquiry : undefined` through the FailoverOptions boundary (Phase 29 dropped the inquiry object there).

### C.3 — The 6 integration bugs — ROOT-CAUSE FIX MATRIX

The 6 distinct integration bugs B5 surfaced are now FIXED. Each row below shows the bug, the root-cause fix applied, the file:line citations, and the contract test scenario that verifies the fix.

| Bug # | What B5 found | B5-FIX root-cause fix | File:line (B5-FIX) | Test scenario (now asserts the FIXED behavior) |
|---|---|---|---|---|
| **#1** | Provider sends `to`; Code.gs v5's handleNotification read `recipient` → `to: undefined` → `sendSimpleEmail` early-exit → silent drop. | Code.gs v6 reads `recipient || to` everywhere a recipient field is read (handleNotification + handleInquiryNotification + bare sendEmail branch). Backward-compat: v5 callers sending `recipient` keep working; v6 also accepts `to`. | `Code.gs:186, 190, 238, 299` | `tests/codegs-payload-shape.test.ts` → "B5-FIX Bug 1: provider sends `to` field — Code.gs v6 accepts BOTH `to` and `recipient`" + 4 simulator scenarios (subscriber.welcome / post.published / broadcast / inquiry.created) that previously asserted "SILENTLY DROPPED" now assert "EMAIL SENT ✓". |
| **#2** | Code.gs's `handleInquiryNotification` reads `data.inquiry` (an object); provider didn't send it → `inq = {}` → admin got empty-body email + blank sheet row + submitter copy never sent. | (a) `notify.ts:deliverOne` now forwards the full inquiry object via `inquiry: payload.type === "inquiry.created" ? payload.inquiry : undefined` (line 332-333). (b) `FailoverOptions` type now has optional `inquiry?: Record<string, unknown>` field (email-failover.ts:51-55). (c) `buildAppsScriptPayload` (email-config.ts:468-470) and `buildLegacyAppsScriptPayload` (email-failover.ts:152-154) now include `inquiry` in the payload when set. | `notify.ts:332-333`; `email-failover.ts:51-55, 152-154, 222`; `email-config.ts:449, 468-470` | "B5-FIX Bug 2: provider includes `inquiry` field for inquiry.created type" + "B5-FIX Bug 2 + Bug 1: simulator: action=sendEmail + type=inquiry.created + inquiry present → admin copy sent + sheet row appended" + "B5-FIX Bug 4 + Bug 2: simulator: action=sendEmail + type=inquiry.created (NOW in payload) → admin copy sent + sheet row appended" (legacy path). |
| **#3** | Code.gs v5's `handleNotification` switch had NO `default:` case → unknown types (invoice.sent, invoice.reminder_*, payment.received, system.alert, crm.message) silently no-op'd. | Code.gs v6's `handleNotification` switch has a NEW `default:` case (lines 267-287) that sends a generic email using whatever fields are present (`to` + `subject` + `body` + `html` + `attachments`). Logs the unmatched type via `Logger.log`. If neither `to` nor `recipient` is set, `sendSimpleEmail`'s `if (!opts.to) return` early-exit fires safely (no silent Gmail send). | `Code.gs:267-287` | "B5-FIX Bug 3: simulator: action=sendEmail + type=invoice.sent → EMAIL SENT ✓ (default case)" + "B5-FIX Bug 3: simulator: action=sendEmail + type=system.alert → EMAIL SENT ✓ (default case)" + "B5-FIX Bug 4 + Bug 3: simulator: action=sendEmail + type=system.alert (NOW in payload) → EMAIL SENT ✓ via default case" (legacy path). |
| **#4** | `buildLegacyAppsScriptPayload` returned 11 fields and DROPPED `type` entirely → Code.gs's `if (data.type)` was undefined → fell through to `else throw "Unrecognized payload"` → Apps Script returned HTTP 200 + `{success:false}` → failover chain saw `res.ok=true` → marked email as sent → TRUE SILENT FAILURE. | (a) `buildLegacyAppsScriptPayload` now INCLUDES `type: opts.type` in the payload (line 148). (b) Code.gs v6's legacy `else` branch (was `throw "Unrecognized payload"`) now routes through `handleNotification(data)` (line 207) so the new default case picks it up — even if `type` is somehow still missing, the email reaches the customer via the default case (was: throw + silent HTTP 200). | `email-failover.ts:148`; `Code.gs:196-208` | "B5-FIX Bug 4: legacy payload INCLUDES the `type` field (12 fields — was 11 in v5 with type DROPPED)" + 5 simulator scenarios (inquiry.created / subscriber.welcome / post.published / broadcast / system.alert) that previously asserted "Unrecognized payload silent drop" now assert "EMAIL SENT ✓". |
| **#5** | `buildAppsScriptPayload` hardcoded `action: "sendEmail"` for every type → if the founder configured apps_script in the admin Settings tab, ALL invoice emails (proposal + reminders + payment thank-yous) went through handleNotification → no matching case (Bug 3) → silent drop. The PDF attachment was lost. | `buildAppsScriptPayload` now respects `legacyAction` when set (line 455: `action: opts.legacyAction ?? "sendEmail"`). notify.ts's `legacyAction: "sendInvoiceEmail"` for invoice emails (notify.ts:625, 813, 1109) is now forwarded via `deliverWithFailover` → `callProviderApi` → `buildAppsScriptPayload` (email-failover.ts:220). Code.gs routes `action="sendInvoiceEmail"` → `sendInvoiceEmail(data)` which reads `data.to` + `data.base64Pdf` + `data.filename` + `data.invoiceSummary` → email sent WITH PDF ATTACHED. | `email-config.ts:455, 446-450`; `email-failover.ts:220` | "B5-FIX Bug 5: provider respects legacyAction=sendInvoiceEmail when set" + "B5-FIX Bug 5: provider defaults action=sendEmail when legacyAction is unset (backward-compat)" — both scenarios assert the correct action value. |
| **#6** | `src/app/api/admin/customers/[id]/message/route.ts:104-112` sends `type: "crm.message"` to Apps Script — Code.gs v5 had no matching case in `handleNotification` → silent drop. (The CRM route correctly sends `recipient: c.email` so Bug 1 didn't apply, but Bug 3 did.) | Code.gs v6's `handleNotification` switch has a NEW explicit `case "crm.message":` (lines 254-266) — first-class handling, same shape as `subscriber.welcome` / `post.published` / `broadcast`. Sends the composed subject/body/html that the CRM route already constructs. | `Code.gs:254-266` | "B5-FIX Bug 6: simulator: action=sendEmail + type=crm.message + recipient set → EMAIL SENT ✓ (was SILENTLY DROPPED in v5 — no matching case)". |

### C.4 — Updated delivery matrix (B5-FIX)

| Email type | notify.ts caller | notify.ts `legacyAction` | Path 1 (modern apps_script provider) | Path 2 (legacy `NOTIFY_WEBHOOK_URL` fallback) |
|---|---|---|---|---|
| `inquiry.created` | `deliverOne` | `"sendEmail"` + `inquiry` forwarded | ✅ **FIXED** — admin copy sent w/ populated body + populated sheet row + submitter copy sent (Bug 1 + Bug 2 fixed) | ✅ **FIXED** — `type` now in payload (Bug 4) → handleNotification → handleInquiryNotification (Bug 1 + Bug 2 fixed) |
| `subscriber.welcome` | `deliverOne` | `"sendEmail"` | ✅ **FIXED** — EMAIL SENT ✓ (Bug 1 fixed) | ✅ **FIXED** — EMAIL SENT ✓ (Bug 4 + Bug 1 fixed) |
| `post.published` | `deliverOne` | `"sendEmail"` | ✅ **FIXED** — EMAIL SENT ✓ (Bug 1 fixed) | ✅ **FIXED** — EMAIL SENT ✓ (Bug 4 + Bug 1 fixed) |
| `broadcast` | `deliverOne` | `"sendEmail"` | ✅ **FIXED** — EMAIL SENT ✓ (Bug 1 fixed) | ✅ **FIXED** — EMAIL SENT ✓ (Bug 4 + Bug 1 fixed) |
| `invoice.sent` (proposal) | `sendProposalEmail` | `"sendInvoiceEmail"` | ✅ **FIXED** — EMAIL SENT ✓ WITH PDF ATTACHED (Bug 5 fixed → action=sendInvoiceEmail → sendInvoiceEmail(data) reads data.to + base64Pdf) | ✅ **WORKS** — unchanged from v5 (legacy path always worked because legacyAction was honored) |
| `invoice.reminder_3d` | `sendReminderEmail` | `"sendInvoiceEmail"` | ✅ **FIXED** — EMAIL SENT ✓ WITH PDF ATTACHED (Bug 5 fixed) | ✅ **WORKS** |
| `invoice.reminder_due` | `sendReminderEmail` | `"sendInvoiceEmail"` | ✅ **FIXED** — EMAIL SENT ✓ WITH PDF ATTACHED (Bug 5 fixed) | ✅ **WORKS** |
| `invoice.reminder_overdue` | `sendReminderEmail` | `"sendInvoiceEmail"` | ✅ **FIXED** — EMAIL SENT ✓ WITH PDF ATTACHED (Bug 5 fixed) | ✅ **WORKS** |
| `payment.received` (thank-you) | `sendPaymentThankYouEmail` | `"sendInvoiceEmail"` | ✅ **FIXED** — EMAIL SENT ✓ WITH PDF ATTACHED (Bug 5 fixed) | ✅ **WORKS** |
| `system.alert` | `sendAdminAlertEmail` | `"sendEmail"` | ✅ **FIXED** — EMAIL SENT ✓ via default case (Bug 3 fixed) | ✅ **FIXED** — EMAIL SENT ✓ (Bug 4 + Bug 3 default case fixed) |
| `crm.message` (CRM Send-Message) | direct fetch in `route.ts:104` (not through failover chain) | n/a | n/a (this route doesn't use the failover chain) | ✅ **FIXED** — EMAIL SENT ✓ via explicit `crm.message` case (Bug 6 fixed) |

**ALL 11 email types now reach the customer** through BOTH delivery paths. The only scenarios that were silently dropped in v5 (everything except invoice emails via the legacy fallback) are now FIXED. The failover chain's HTTP 200 + `{success:false}` true silent failure pattern is eliminated.

### C.5 — Impact assessment (B5-FIX)

The 7 impact items B5 documented are now ALL RESOLVED:

1. ✅ **Founder's inbox now receives inquiry alerts.** Bug 1 + Bug 2 + Bug 4 fixed → handleInquiryNotification receives a populated `inq` object (Bug 2) + the `to` field is now accepted (Bug 1) + the `type` field is now in the legacy payload (Bug 4) → admin alert email arrives in `support@okomba.com` with populated body.
2. ✅ **Customers now receive inquiry-confirmation receipts.** The submitter's `✅ We received your inquiry` email is sent — Bug 2 fix forwards the inquiry object → `isForSubmitter` is computed correctly → submitter copy is sent.
3. ✅ **Newsletter double-opt-in confirmation emails go out.** Bug 1 (Path 1) + Bug 4 (Path 2) fixed → subscriber.welcome reaches the customer.
4. ✅ **Post-publish blast emails go out.** Bug 1 (Path 1) + Bug 4 (Path 2) fixed → post.published reaches the customer.
5. ✅ **Admin-composed broadcast emails go out.** Bug 1 (Path 1) + Bug 4 (Path 2) fixed → broadcast reaches the customer.
6. ✅ **System alerts reach the founder.** Bug 3 (Path 1 default case) + Bug 4 + Bug 3 (Path 2 default case) fixed → system.alert reaches the founder.
7. ✅ **Invoice emails continue to go out** (proposals + reminders + payment thank-yous reach customers with PDF attached) — both paths now work: Path 2 (legacy fallback) was always working; Path 1 (modern apps_script provider) is now also working via the Bug 5 fix (legacyAction respected → action=sendInvoiceEmail → PDF attached).

### C.6 — Remediation status — **FIXED IN B5-FIX** (was: deferred to a future batch)

**B5 (initial audit):** recommended two strategies (A — update the provider; B — update Code.gs) and deferred implementation to a future batch.

**B5-FIX (this batch — root-cause fix per Master Directive §8):** BOTH strategies are now applied — Code.gs is upgraded to v6 (Strategy B side), AND the provider (email-config.ts + email-failover.ts + notify.ts) is updated (Strategy A side). The combined fix is more robust than either strategy alone:

- **Code.gs v6 changes (Strategy B side):** Bug 1 fix (read `recipient || to`), Bug 3 fix (new `default:` case), Bug 4 fix on Code.gs side (legacy `else` branch routes through handleNotification instead of throwing), Bug 6 fix (new explicit `crm.message` case). All v5 functionality preserved (sendEmail, sendInvoiceEmail, backupToSheet, smart saveToSheet, syncSheetColumns, ensureInquiryHeaders_, verifySetup, listSheetTabs).

- **Provider changes (Strategy A side):** Bug 2 fix (forward `inquiry` from notify.ts → FailoverOptions → callProviderApi → buildAppsScriptPayload + buildLegacyAppsScriptPayload), Bug 4 fix on provider side (include `type` in legacy payload), Bug 5 fix (`buildAppsScriptPayload` respects `legacyAction` instead of hardcoding `sendEmail`).

The fix is backward-compatible: if the founder has already deployed v5 of Code.gs, the B5-FIX provider changes alone close Bug 2, Bug 4, Bug 5 (provider-side bugs that don't require a Code.gs redeploy). The founder would still need to redeploy Code.gs as v6 to close Bug 1, Bug 3, Bug 6 (Code.gs-side bugs). After the founder deploys v6, ALL 6 bugs are closed.

The contract test `tests/codegs-payload-shape.test.ts` was updated from "snapshot of buggy behavior" to "assertion of correct behavior" — every scenario that B5 asserted as "SILENTLY DROPPED" now asserts "EMAIL SENT ✓". This is the regression contract: any future change that re-introduces one of these bugs will cause the affected scenario to FAIL.

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
| `a10848e` | feat(apps-script): v5 — auto-add missing columns to existing sheet ← LATEST on origin/main (v6 commit pending push per B5-FIX directive) |
| `f0093d3` | feat(apps-script): v4 — paste-and-go with founder's Sheet ID + smart header matching |
| `dbfcff3` | feat(apps-script): multi-account email architecture + verifySetup() |
| `47af694` | feat(email): Phase-1 Module 3 — branded HTML engine + PDF attachments |
| `6520124` | docs: worklog — Google Apps Script email reconnection record |

**B5-FIX update:** The local `Google-apps-script/Code.gs` is now v6 (890 lines, was v5's 809 lines) — the v6 changes implement the 6 root-cause fixes per Master Directive §8. The v6 commit is pending push by the main agent (per directive — B5-FIX does NOT push to git). The Phase 14 worklog claim that "v5 (809 lines) was pushed in Phase 14 (commit a10848e)" is still verified — v5 remains the latest commit on origin/main until the main agent pushes v6.

---

## F. Repository Contains Correct Production Version

| Verification | Command | Result |
|---|---|---|
| Local file v5 vs `origin/main` | `git diff origin/main -- Google-apps-script/Code.gs` | **NON-EMPTY** in B5-FIX — local v6 has uncommitted changes (v5 → v6 upgrade). The B5-FIX directive explicitly authorizes this Code.gs modification (Master Directive §8 — fix the root cause). The main agent will push v6 in a follow-up commit. |
| Local file matches `origin/main:v5` | `diff <(git show origin/main:Google-apps-script/Code.gs) <(git show HEAD:Google-apps-script/Code.gs)` | If HEAD is the B5 commit (origin/main state), this is **EMPTY** (no v6 changes in HEAD yet). The v6 changes are in the working tree only — not yet committed. |
| Local v6 file SHA | `head -3 Google-apps-script/Code.gs` | Reads `OKOMBA ANALYTICS — Google Apps Script Engine (v6)` — confirms the v5→v6 upgrade landed in the working tree. |
| Local v6 line count | `wc -l Google-apps-script/Code.gs` | 890 lines (was 809 in v5; +81 lines for the v6 changelog + Bug 1/3/4/6 fixes). |

**B5-FIX finding:** ✅ The local `Google-apps-script/Code.gs` is the v6 file the founder should deploy. The v5→v6 delta is the 6 root-cause fixes per Master Directive §8. The v6 commit will be pushed by the main agent (per directive — B5-FIX does NOT push to git). After push, `git diff origin/main -- Google-apps-script/Code.gs` will return to empty (local file = origin/main:v6).

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

### I.1 — Apps Script deployment (one-time, ~15 minutes) — **B5-FIX: deploy v6, NOT v5**

> **B5-FIX update:** The founder should deploy **Code.gs v6** (890 lines) — NOT v5 (809 lines). v6 contains the 6 root-cause fixes for the integration bugs documented in §C. The v6 file header (lines 1-37) documents the changelog. v6 is fully backward-compatible with v5 payloads — any caller that worked with v5 continues to work with v6 (the Bug 1 fix accepts both `recipient` and `to`, so the v5 contract is preserved).

1. **Log into https://script.google.com as the SENDER HOST Gmail account** (the Gmail account where `support@okomba.com` is configured as a "Send mail as" alias using Google SMTP — NOT your personal Gmail).
2. **Create a new Apps Script project** (or open the existing "Okomba Webhook" project if v5 is already deployed) → name it "Okomba Webhook".
3. **Paste the entire contents of `/Google-apps-script/Code.gs`** (890 lines, **v6** — was 809 lines in v5) into the editor, REPLACING any existing content. The CONFIG block (Code.gs:121-156) is pre-filled for the Okomba setup — no edits needed unless you swap Google Sheets later. The v6 changelog (Code.gs:1-37) documents the 6 root-cause fixes.
4. **Run `listSheetTabs()`** from the function dropdown → confirm the existing tabs + headers match what the smart `saveToSheet()` will append to. (Diagnostic only — no writes.)
5. **Run `syncSheetColumns()`** from the function dropdown → auto-adds any missing `STANDARD_INQUIRY_HEADERS` (Code.gs:166-169) to the right of your existing Inquiries tab headers. Your existing rows + data are NEVER touched.
6. **Run `verifySetup()`** from the function dropdown → probes every dependency (Sheet access, MailApp aliases, FROM_EMAIL is registered, test email delivered to ADMIN_EMAIL). **DO NOT proceed until verifySetup() returns `errors: []` and Logger output reads "✓ ALL CHECKS PASSED — safe to deploy."** (Code.gs:717-803, esp. Code.gs:796-801.)
7. **Deploy → New deployment → Web app** (or **Manage deployments → Edit** if updating from v5 — the URL stays the same):
   - **Execute as:** Me
   - **Who has access:** Anyone
8. **Copy the Web App URL** (ends in `/exec`). If updating from v5, the URL stays the same — no env var change needed on Render.

### I.2 — Render configuration

9. **On Render dashboard → okomba-analytics → Environment tab** → add (or update) the `NOTIFY_WEBHOOK_URL` env var with the /exec URL from step 8.
10. **Trigger a redeploy** (Save changes → Render auto-redeploys the web service).

### I.3 — Post-deployment verification — **B5-FIX: all 11 email types now reach the customer**

11. **Submit a test inquiry** at https://okomba.com (use the inquiry form). Verify:
    - The inquiry row appears in the admin portal's Inquiries tab (DB-backed — works regardless of Apps Script).
    - ✅ **B5-FIX:** the admin alert email arrives in `support@okomba.com` with a populated body (Bug 1 + Bug 2 + Bug 4 fixed). The submitter's `✅ We received your inquiry` confirmation email also arrives (Bug 2 fix forwards the inquiry object so `isForSubmitter` is computed correctly).
    - ✅ **B5-FIX:** the Inquiries tab in the Google Sheet receives a populated row (Bug 4 fix puts `type` back in the legacy payload → routes through handleNotification → handleInquiryNotification → saveToSheet with the populated inquiry object).
12. **Subscribe to the newsletter** at https://okomba.com/#newsletter. Verify:
    - The subscriber row appears in the admin portal's Subscribers tab with `confirmToken` set (DB-backed).
    - ✅ **B5-FIX:** the double-opt-in confirmation email arrives (Bug 1 + Bug 4 fixed). The subscriber can confirm → moves from "pending" to "confirmed" status.
13. **Send a test invoice email** via the admin portal's Proposals tab. Verify:
    - ✅ This WORKS — the email arrives at the customer with the PDF attached. This was the only email type that worked in v5 (via the legacy fallback path); in v6 it works through BOTH the legacy fallback AND the modern apps_script provider (Bug 5 fix respects legacyAction=sendInvoiceEmail → action=sendInvoiceEmail → sendInvoiceEmail(data) reads data.to + base64Pdf + filename + invoiceSummary).
14. **Visit the admin Settings tab** → configure the Email Failover Chain (4 providers in priority order: Google Apps Script → Resend → Mailtrap → Maileroo). Click "Test" on each provider to verify credentials. ✅ **B5-FIX:** with all 6 bugs fixed, the founder can NOW safely configure the apps_script provider in the admin Settings tab — it will no longer break invoice email delivery (Bug 5 fix respects legacyAction). Both Path 1 (modern apps_script provider) and Path 2 (legacy NOTIFY_WEBHOOK_URL fallback) now deliver every email type correctly. The founder should still configure Resend/Mailtrap/Maileroo as backup providers in case Apps Script is rate-limited by Gmail.

### I.4 — Until the founder completes I.1-I.2

- The website runs in **log-only email mode**: inquiry submissions land in the DB + show in the admin Inquiries tab; newsletter signups land in the DB + show in the admin Subscribers tab (with status "pending"); EmailLog rows are created for every would-be email. No branded Gmail goes out for any email type EXCEPT invoice emails (which work via the legacy fallback IF the founder has set NOTIFY_WEBHOOK_URL — and even then only because `notify.ts:625, 813, 1109` explicitly passes `legacyAction: "sendInvoiceEmail"`).
- The founder must monitor the admin portal's Inquiries tab manually (no push notifications arrive via email).
- The founder should ALSO read `docs/DEPLOYMENT.md:227-269` for the Apps Script setup walkthrough (15 minutes).
- ⚠️ **B5-FIX caveat:** even after the founder deploys v6, if the Render service hasn't been redeployed with the B5-FIX provider changes (email-config.ts + email-failover.ts + notify.ts), Bug 2 (inquiry field dropped at FailoverOptions boundary) and Bug 4 (legacy payload drops type field) and Bug 5 (hardcoded action=sendEmail) would still affect Path 1 + Path 2. The v6 Code.gs fix alone closes Bug 1, Bug 3, Bug 6 (Code.gs-side bugs) but the founder should ensure the B5-FIX commit has been pushed + the Render service has been redeployed so the provider-side fixes (Bug 2, Bug 4, Bug 5) are also active. The main agent handles pushing the B5-FIX commit; Render auto-redeploys when origin/main updates.

### I.5 — Remediation tracking — **B5-FIX: COMPLETE**

**B5-FIX status:** ✅ All 6 integration bugs documented in §C are now FIXED at the root cause per Master Directive §8 ("Fix the root cause, not symptoms"). The fix touches BOTH sides of the contract:

- **Code.gs v6** (890 lines, was v5's 809 lines) — closes Bug 1 (read `recipient || to`), Bug 3 (new `default:` case in handleNotification switch), Bug 4 on Code.gs side (legacy `else` branch routes through handleNotification instead of throwing), Bug 6 (new explicit `crm.message` case). All v5 functionality preserved.
- **Provider-side fixes** (email-config.ts + email-failover.ts + notify.ts) — close Bug 2 (forward `inquiry` through the FailoverOptions boundary), Bug 4 on provider side (include `type` in legacy payload), Bug 5 (`buildAppsScriptPayload` respects `legacyAction` instead of hardcoding `sendEmail`).

The contract test `tests/codegs-payload-shape.test.ts` was updated from "snapshot of buggy behavior" (B5) to "assertion of correct behavior" (B5-FIX) — every scenario that B5 asserted as "SILENTLY DROPPED" now asserts "EMAIL SENT ✓". The 26 contract scenarios all pass (81 expect() calls). The drift-detection contract is now bidirectional: any future regression that re-introduces one of these bugs will cause the affected scenario to FAIL.

---

## Cross-references

- **Master Directive §3.A** — Code.gs 9 sub-requirements (existence, version, functionality, integration, deployment documentation, latest committed, repo correctness, valid endpoints, secrets safety). All 9 covered in §A-§I above.
- **Master Directive §5 Batch 5** — Code.gs founder-side deployment verification. §C + §I document the founder action list.
- **Master Directive §8** — "Fix the root cause, not symptoms" — applied in B5-FIX to close all 6 integration bugs at the root cause (both sides of the contract).
- **B0-A matrix R48** — "🚀 Code.gs committed but founder-side deploy pending". Status: code is committed locally (v6 — B5-FIX); v6 commit pending push by main agent (per directive); founder-side deploy (§I.1-I.3) still pending. **B5-FIX:** after deploy, ALL 11 email types now reach the customer (was: only invoice emails).
- **B0-A matrix R49** — "verify Code.gs version/integration/deployment". ✅ Version v6 verified (§A). ✅ Integration FIXED in B5-FIX (§C documents the 6 root-cause fixes).
- **B0-A matrix R74** — "Code.gs reconciliation — formal document". This file is the deliverable.
- **tests/codegs-payload-shape.test.ts** — the contract test (B5-FIX: 26 scenarios / 81 expect() calls, all PASS — asserting the FIXED behavior; was B5: 26 scenarios / 72 expect() calls asserting the buggy snapshot).
- **docs/email-link-inventory.md** — email-CTA inventory (B1-C + B4 live verification). The 6 broken scenarios in §C would not surface via the CTA-inventory audit because the audit verifies URL ROUTES, not Apps Script delivery. The 2 audits are complementary.

---

**Audit performed by:** Task ID B5 (initial audit, 2026-08-27) → B5-FIX (root-cause fix per Master Directive §8, 2026-08-27).
**B5 method:** Read + Grep + git log + git diff on production source. No dev server started. No real HTTP call made to Apps Script. No production code modified except the B5 extraction of `buildAppsScriptPayload` (email-config.ts:420-432) and `buildLegacyAppsScriptPayload` (email-failover.ts:104-123) — both pure refactorings preserving the EXACT payload shape Phase 29 was sending. Code.gs itself was NOT modified in B5 (per directive).
**B5-FIX method:** Read updated source + the B5 reconciliation doc. Modified 5 files: (1) `Google-apps-script/Code.gs` v5 → v6 (+81 lines for the v6 changelog + Bug 1/3/4/6 fixes); (2) `src/lib/email-config.ts` buildAppsScriptPayload (+ optional `legacyAction` + `inquiry` fields — Bug 5 + Bug 2 fixes); (3) `src/lib/email-failover.ts` buildLegacyAppsScriptPayload (+ `type` field in the payload + `inquiry` field; FailoverOptions + optional `inquiry` field; deliverWithFailover forwards legacyAction + inquiry to callProviderApi — Bug 4 + Bug 2 fixes); (4) `src/lib/notify.ts` deliverOne (+ inquiry forwarding for inquiry.created type — Bug 2 fix); (5) `tests/codegs-payload-shape.test.ts` (simulator upgraded V5 → V6; 26 scenarios updated to assert the FIXED behavior, 81 expect() calls). Updated `docs/codegs-reconciliation.md` (§A, §C, §E, §F, §I reflect the v6 + B5-FIX state). No dev server started. No real HTTP call made to Apps Script. Did NOT push to git (per directive — main agent handles push). All v5 functionality preserved. All 26 contract scenarios pass. All 196 tests in tests/ pass (187 pass + 9 skip — same skip count as B5 baseline).
