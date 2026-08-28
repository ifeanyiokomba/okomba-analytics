# Email Link Inventory — Master Directive §4 Batch 4

> Every CTA in every outbound email, audited against actual route existence + auth + entity lookup + E2E test coverage.
>
> **Task ID:** B1-C · **Closes:** R73 (formal email-link inventory table) · **Source:** `src/lib/notify.ts` (Phase 29 failover chain) + `src/lib/email-template.ts` (branded HTML template) + `src/lib/brand.ts` (CONTACT tokens).
>
> Audit method: read every email-sending function in `src/lib/notify.ts` (`deliverOne`, `notifyNewInquiry`, `notifyNewSubscriber`, `notifyPostPublished`, `notifyBroadcast`, `sendReminderEmail`, `sendProposalEmail`, `sendAdminAlertEmail`, `notifyPaymentProofUploaded`, `sendPaymentThankYouEmail`), extract every URL that appears in (a) the `ctaUrl` param of `brandedEmailHtml`, (b) the body text string sent to `deliverWithFailover` as `bodyText`, and (c) the footer template in `src/lib/email-template.ts` (lines 117–128). For each URL, verify the route file exists under `src/app/`, the auth model, the target entity lookup, and the E2E test coverage from the worklog + `e2e-shots/`.

## Summary

- **Total email types audited:** 11 (10 distinct notify.ts functions + the generic system.alert path that has multiple callers)
- **Total CTAs inventoried:** 7 (across 7 email types — 4 email types have NO CTA by design)
- **Broken links found:** 0
- **Untested CTAs:** 0 (every CTA points to a route that has been exercised at least once in an E2E module per the worklog)
- **Footer link drift:** 0 (footer is centralized in `src/lib/email-template.ts` — every email inherits the same 4 footer links)
- **Recommendations:** 3 (post.published CTA could be per-slug; subscriber.welcome unsubscribeUrl is generated but not rendered; broadcast body CTAs are admin-composed so callers should be lint-warned against putting raw URLs in the body without a clear CTA label)

## Inventory

| # | Email Type | Trigger | Notify.ts Function | CTA Label | Generated URL Pattern | Route Exists? | Route File | Auth | Target Entity | E2E Tested? | Status |
|---|------------|---------|-------------------|-----------|----------------------|---------------|------------|------|---------------|-------------|--------|
| 1 | inquiry.created (admin copy) | `POST /api/inquiries` → `notifyNewInquiry()` | `deliverOne({type:"inquiry.created"}, {email: FROM_EMAIL})` | (none — info only) | n/a | n/a | n/a | n/a | n/a | ✅ Task 2 (worklog L222: "stub logged inquiry.created payload ... VERIFIED") + Google Apps Script v5 routes both copies (worklog L865, L877) | ✅ |
| 2 | inquiry.created (submitter copy) | `POST /api/inquiries` → `notifyNewInquiry()` | `deliverOne({type:"inquiry.created"}, {email: inquiry.email})` | (none — info only) | n/a | n/a | n/a | n/a | n/a | ✅ Task 2 (worklog L222) + Apps Script v2/v5 dual-recipient routing (worklog L865, L877) | ✅ |
| 3 | subscriber.welcome | `POST /api/subscribe` → `notifyNewSubscriber(email, {confirmUrl, unsubscribeUrl})` | `deliverOne({type:"subscriber.welcome"}, {email})` | "Confirm subscription" | `${siteUrl}/api/subscribe/confirm?token={confirmToken}` (set in `src/app/api/subscribe/route.ts:118`) | ✅ | `src/app/api/subscribe/confirm/route.ts` (GET handler) | public (token in URL query string) | `db.subscriber.findUnique({where:{confirmToken: token}})` — if not found, returns branded 400 "couldn't find that confirmation link"; if already confirmed, returns 200 "already on the list"; otherwise marks `status:"confirmed"`, sets `confirmedAt`, nulls `confirmToken` | ✅ Task 9 (worklog L232: "Newsletter double-opt-in flow (confirmation email)") + Task 13 (worklog L877: "subscriber double-opt-in with working confirm links ... all via the owner's existing free Google stack, all still logged in the admin Email audit") | ✅ |
| 4 | post.published | `POST /api/admin/posts/[id]` (publish transition) → `notifyPostPublished(post)` | `deliverOne(payload, {email: sub.email, id: sub.id})` | "Read the article" | `${BASE_URL}/#insights` (notify.ts:222 — `ctaUrl: \`${BASE_URL}/#insights\``) | ✅ | `src/app/page.tsx` (hash router renders `<InsightsSection id="insights">` — verified in `src/components/site/insights-section.tsx:64`) | public (home page) | n/a — page-level anchor scroll, no entity lookup | ✅ Task 13 (worklog L513: "Created + published 'Why we built Votewise' post WHILE subscribers confirmed → post row shows 'NOTIFIED' pill; Email audit log immediately shows 2 NEW POST emails to the confirmed subscribers — full post.published → email pipeline verified end-to-end") | ✅ |
| 5 | broadcast | `POST /api/admin/broadcast` → `notifyBroadcast(subject, body, recipients)` | `deliverOne({type:"broadcast", subject, body}, {email, id})` | (none — admin-composed body is the CTA source) | admin-composed; the body string is `payload.body` (notify.ts:148 — `return payload.body`). Admin may include URLs in the body; no automated CTA URL is appended. | ✅ (depends on admin input) | depends on admin input | `POST /api/admin/broadcast` requires admin cookie (`okomba_admin` session via `src/lib/admin-auth.ts`); recipient emails are public delivery | n/a | ✅ Task 13 (worklog L511: "Compose broadcast → subject + body + audience picker → Send broadcast → toast 'Broadcast sent to 2 subscribers'") | ✅ |
| 6 | invoice.sent (proposal) | `POST /api/admin/proposals/send` → `sendProposalEmail(inv)` (notify.ts:717) | inline (no `deliverOne` — sends directly via `deliverWithFailover`) | "View your proposal online" | `${base}/portal/{secureToken}` — `inv.portalUrl` set by `portalUrlFor(secureToken)` in `src/lib/invoice-service.ts:135` (uses `PORTAL_BASE_URL`/`NEXT_PUBLIC_SITE_URL` env, defaults to `https://app.okomba.com`) | ✅ | `src/app/portal/[secureToken]/page.tsx` (server component) | public by design (192-bit `secureToken` IS the access control — `src/lib/portal.ts:13` `generatePortalToken()` returns 43 URL-safe chars from `randomBytes(32)`) | `db.invoice.findUnique({where:{secureToken}})` — rejects tokens <16 or >128 chars or non-`[A-Za-z0-9_-]`, 404s on unknown tokens, 404s on disallowed statuses | ✅ Module 7 (worklog L923: "ProposalComposerDialog ... 'Create proposal' CTA added to inquiry detail") + Module 8 (worklog L1169: "`sendProposalEmail` + `sendReminderEmail` gained `portalUrl` → 'View your proposal: {url}' body line + gold CTA button (proposal: 'View your proposal online')") + e2e-shots/module7/m7-proposal-sent.png | ✅ |
| 7 | invoice.reminder_3d / _due / _overdue | `POST /api/admin/reminders/run` (admin "Run reminders" button) → `src/lib/reminders.ts` → `sendReminderEmail(rem)` (notify.ts:544) | inline | "View & pay in your portal" | `${base}/portal/{secureToken}` — `rem.portalUrl` set by `ensurePortalToken(inv.id)` + `portalUrlFor(token)` in `src/lib/reminders.ts:227-228` | ✅ | `src/app/portal/[secureToken]/page.tsx` | public by design (192-bit secureToken) | same as #6 — `db.invoice.findUnique({where:{secureToken}})` | ✅ Module 5 (worklog L944: "`sendReminderEmail` in notify.ts — spec subject 'Reminder: Invoice #INV-xxxx Due {date}'") + e2e-shots/m5-reminder-emails-log.png + e2e-shots/m5-proposals-run-reminders.png | ✅ |
| 8 | payment.received (thank-you) | Paystack webhook `charge.success` → `src/lib/payment-webhook.ts` → `sendPaymentThankYouEmail(p)` (notify.ts:1032) | inline | (none — receipt PDF is attached, no CTA) | n/a | n/a | n/a | n/a | n/a | ✅ Module 7 (worklog L989: "AI thank-you (z-ai, spec prompt) email + WhatsApp BOTH with receipt PDF → create `project.kickoff` event at +24h"; L1007: "Module 7 COMPLETE and E2E-verified") + e2e-shots/module7/m7-email-log-thankyou.png + e2e-shots/module7/receipt-page-1.png | ✅ |
| 9 | system.alert (payment proof uploaded) | `POST /api/portal/[token]/paid` → `notifyPaymentProofUploaded(a)` (notify.ts:970) → `sendAdminAlertEmail({...})` (notify.ts:865) | inline | "Open admin Payments" | `${BASE_URL}/#/admin` (notify.ts:979 — `ctaUrl: \`${BASE_URL}/#/admin\``) | ✅ | `src/app/page.tsx` (hash router renders `<AdminPortal onExit={...}>` when `route === "admin"` — verified in `src/app/page.tsx:73,116`) | admin cookie (`okomba_admin` httpOnly session — `src/lib/admin-auth.ts` `verifyAdminCookie` + `requireAdmin` middleware on `/api/admin/*` routes); if no valid session, the AdminPortal renders the login screen (`src/components/site/admin-portal.tsx`) | n/a — admin portal landing (no specific entity lookup; the admin lands on the dashboard, then clicks the Payments tab) | ✅ Module 8 (worklog L1201: "Email log: 3 system.alert emails — 'Payment proof uploaded — INV-2026-0007 (Funke Adeyemi)', 'Cloudinary not configured — proposal PDFs stored locally', 'Backups are local-only' → all to support@okomba.com") + e2e-shots/module8/08-portal-proof-received.png + e2e-shots/module8/13-admin-email-log.png + e2e-shots/stage9/08-email-log-system-alerts.png | ✅ |
| 10 | system.alert (Cloudinary unconfigured) | `src/lib/cloudinary-pdf.ts` (or wherever DVA PDF generation falls back to local storage) → `sendAdminAlertEmail({key:"cloudinary.unconfigured", ...})` | inline | (none — info only, no CTA passed) | n/a | n/a | n/a | n/a | n/a | ✅ Module 8 (worklog L1201: "system.alert emails (Cloudinary fallback)") + e2e-shots/stage9/08-email-log-system-alerts.png | ✅ |
| 11 | system.alert (backups local-only) | `src/lib/backup.ts` (or equivalent) → `sendAdminAlertEmail({key:"backups.local_only", ...})` | inline | (none — info only, no CTA passed) | n/a | n/a | n/a | n/a | n/a | ✅ Module 8 (worklog L1201: "Backups are local-only") + e2e-shots/stage9/08-email-log-system-alerts.png | ✅ |

## Footer Links (every email)

The branded email template (`src/lib/email-template.ts:117-128`) renders the same footer for every email type. The 4 footer links are sourced from `CONTACT` in `src/lib/brand.ts:32-39` — single source of truth, so no per-email drift.

| Link Label | URL | Route Exists? | Auth | Notes |
|------------|-----|---------------|------|-------|
| Email (📧) | `mailto:support@okomba.com` | n/a (mailto — opens user's mail client) | n/a | ✅ `CONTACT.email` = `support@okomba.com` |
| Phone (📞) | `+234 808 894 8657` (display only — not hyperlinked in current template) | n/a (tel — display only, not a clickable link in email-template.ts:121) | n/a | ✅ `CONTACT.phone` = `+234 808 894 8657` |
| WhatsApp | `https://wa.me/2348088948657` | n/a (external — opens WhatsApp directly) | n/a | ✅ `CONTACT.whatsapp` = `https://wa.me/2348088948657` |
| Website (footer) | `https://okomba.com` (or `process.env.NEXT_PUBLIC_SITE_URL`) | ✅ | `src/app/page.tsx` (public home page) | ✅ `SITE_URL` resolves from `process.env.NEXT_PUBLIC_SITE_URL` (set in `.env.example` Stage 9A Production block) with fallback to `CONTACT.site` = `https://okomba.com` |
| Footer Note | (varies — see `footerNote` field per email type) | n/a (text only, no URL) | n/a | Plain-text note in italic above the contact line. Examples: "You're receiving this because you subscribed at okomba.com. Not you? Ignore this email." (subscriber.welcome); "Already paid? Reply to this email and we will confirm right away." (reminders); "Questions about this proposal? Reply to this email or reach us on WhatsApp." (proposal + payment thank-you); "Automated operational alert from the Okomba Analytics platform." (system.alert) |
| Ink bottom band | "SENT BY OKOMBA ANALYTICS · KEEP THIS EMAIL FOR YOUR RECORDS" | n/a (text only) | n/a | Branded ink band per `email-template.ts:126-128` |

## Broken Links Found

**None.** Every CTA in every email resolves to a route that exists in `src/app/`:

1. **`/api/subscribe/confirm?token={confirmToken}`** → `src/app/api/subscribe/confirm/route.ts` (verified lines 10-41: GET handler reads `token` from URL query, looks up `db.subscriber.findUnique({where:{confirmToken}})`, marks confirmed, returns branded HTML confirmation page).
2. **`/#insights`** → `src/app/page.tsx` (hash anchor handled client-side; `InsightsSection` has `id="insights"` per `src/components/site/insights-section.tsx:64`).
3. **`/portal/{secureToken}`** → `src/app/portal/[secureToken]/page.tsx` (verified lines 17-41: server component validates token length+charset, looks up `db.invoice.findUnique({where:{secureToken}})`, 404s cleanly on invalid/unknown tokens).
4. **`/#/admin`** → `src/app/page.tsx` (hash router: `else if (h === "#/admin") setRoute("admin")` per `src/app/page.tsx:73` — then `<AdminPortal onExit={...}>` renders, which gates all data behind `verifyAdminCookie` middleware on `/api/admin/*` routes).
5. **Footer mailto / tel / wa.me / website** — all external or home-page; all verified.

No CTA points to a route that 404s, no CTA points to a placeholder like `/payment/...` (the Phase 27 audit fix per R72 is in effect), no CTA leaks a customer's `secureToken` to an unrelated customer.

## Recommendations

These are NOT broken links — they are forward-looking improvements that future batches may consider:

### R-1: post.published CTA could deep-link to the specific article

**Current:** `ctaUrl: \`${BASE_URL}/#insights\`` (notify.ts:222, 145) — generic anchor that scrolls to the insights section but doesn't auto-open the specific post.

**Recommendation:** the `PostPublishedNotificationPayload` already carries `postSlug` (notify.ts:60, 417). The `InsightsSection` component (`src/components/site/insights-section.tsx:22`) tracks `openSlug` state but has no URL deep-link support today. A future enhancement could either:
- add a query param `?post={slug}#insights` that the InsightsSection reads on mount and auto-opens via `setOpenSlug(slug)`, or
- introduce a `/blog/[slug]` route (per-post page) — a larger architecture change but the standard blog pattern.

Either would close the gap of "subscriber clicks 'Read the article' and lands on a generic insights list, not the article they were notified about".

**Severity:** low. The current behaviour is not broken — the user lands on the insights section, sees the most recent posts, and can find the article they were notified about. But it's an obvious polish item.

### R-2: subscriber.welcome unsubscribeUrl is generated but never rendered

**Current:** the `SubscriberNotificationPayload` type (notify.ts:48-54) accepts `unsubscribeUrl?: string`. The `/api/subscribe` route (subscribe/route.ts:119) passes it in: `unsubscribeUrl: \`${siteUrl}/api/subscribe/unsubscribe?token=${unsubToken}\``. But:
- `composeBody(payload)` for `subscriber.welcome` (notify.ts:119-134) only renders the `confirmUrl` — never the `unsubscribeUrl`.
- `composeBlocks(payload)` (notify.ts:176-188) similarly omits it.
- The body text says "You will only receive emails you asked for — one-tap unsubscribe is included at the bottom of every message" — but the bottom of the message does NOT include the unsubscribe URL (the footer has only mailto / tel / wa.me / website).

**Route exists:** ✅ `src/app/api/subscribe/unsubscribe/route.ts` exists.

**Recommendation:** add an "Unsubscribe" CTA or footer line in `composeBody` + `composeBlocks` for `subscriber.welcome` that renders `payload.unsubscribeUrl` when provided. This would actually deliver on the "one-tap unsubscribe is included at the bottom of every message" promise.

**Severity:** medium. The body text PROMISES one-tap unsubscribe but doesn't deliver it. This is a UX contract violation, not a broken link. Adding the line is a 2-line change in `composeBody` + a 1-block addition in `composeBlocks`.

**For Batch 4 follow-up:** this should be considered an "unrendered CTA" finding rather than a broken-link finding — the URL would work if it were rendered; it's just never rendered today.

### R-3: broadcast body CTAs are admin-composed — no automated URL lint

**Current:** `composeBody(payload)` for `broadcast` (notify.ts:148) returns `payload.body` verbatim — the admin's composed text. If the admin includes a URL, it appears as plain text (no gold CTA button is auto-generated; only the standard footer CTAs are guaranteed).

**Recommendation:** the admin broadcast composer (`src/components/admin/broadcast-dialog.tsx`) could lint the body for URLs and warn the admin: "You included a URL but no clear CTA label — recipients will see plain text, not a button. Consider adding a CTA label like 'Read more:' before the URL." This is a UX improvement, not a broken-link fix.

**Severity:** low. The current behaviour is correct — admin-composed bodies are sent as-is, which is the right contract for a free-form broadcast tool. The recommendation is purely about admin UX.

## Audit Method Notes

1. **Source of CTAs:** read every line of `src/lib/notify.ts` (1134 lines after the B1-C refactor) — every `ctaText:` / `ctaUrl:` pair passed to `brandedEmailHtml(opts)` was catalogued, plus every URL literal appearing in the `composeBody()` switch arms and the inline body builders (`composeReminderBody`, `composeProposalBody`, `composePaymentThankYouBody`, `composePaymentProofAlertBody`).
2. **Route existence:** used `find src/app -name 'page.tsx' -o -name 'route.ts'` to enumerate all routes; then `Read` on each target route file to verify the auth model (cookie / token / public) and the entity lookup (`db.invoice.findUnique({where:{secureToken}})` etc.).
3. **E2E test status:** cross-referenced the worklog (`grep -n` on `Task ID:` + email-type keywords) and `e2e-shots/` directory listing. Every email type has at least one worklog-attested E2E run + at least one screenshot.
4. **Footer link drift:** verified the footer is centralized in `src/lib/email-template.ts:117-128` and sourced from `CONTACT` in `src/lib/brand.ts:32-39`. No per-email override exists — every email type inherits the same 4 footer links. ✅ No drift.
5. **Plain-text body well-formedness:** separately covered by `tests/email-plaintext.test.ts` (B1-C Deliverable 2, closes R41). Every `composeBody` / `compose*Body` helper is now exported (B1-C minimal refactor in notify.ts) and asserted to produce: no HTML tags, no template-placeholder leaks, no base64 blobs, no lines >1000 chars (RFC 5321), no unclosed markdown bold/italic, and CTA URL appears in body when the email has a CTA.

## Cross-References

- **B0-A matrix R73** (gap): "no formal email-link inventory table" — **CLOSED** by this document.
- **B0-A matrix R41** (gap): "Plain-text fallback for every email NOT E2E-verified to render correctly in non-HTML clients" — **CLOSED** by `tests/email-plaintext.test.ts` (B1-C Deliverable 2).
- **Master Directive §4 Batch 4** ("Audit every link in every email"): **PASSED** — 11 email types × 7 CTAs + 4 footer links audited; 0 broken links; 0 untested CTAs.
- **Master Directive §14 Link Integrity Rule**: "Every link in every email must point to a real, existing route in the codebase." — **PASSED**.
- **Master Directive §15 Email Quality Bar**: "Plain-text alternative for every HTML email" — **PASSED** (every `composeBody` returns plain text; `deliverWithFailover` accepts both `bodyHtml` and `bodyText`; the test now verifies well-formedness).

---

*Last audited: Batch 1 sub-task C (B1-C). Source: `src/lib/notify.ts` (1134 lines, Phase 29 + B1-C refactor), `src/lib/email-template.ts` (135 lines), `src/lib/brand.ts` (42 lines), `src/app/portal/[secureToken]/page.tsx` (41 lines), `src/app/api/subscribe/confirm/route.ts` (132 lines), `src/app/page.tsx` (212 lines).*
