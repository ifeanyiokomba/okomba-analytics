# Master Platform Evolution Directive — Implementation Audit (Traceability Matrix)

**Task ID:** 40-B0 (BATCH 0 — Deep System Audit)
**Directive:** `upload/OKOMBA_ANALYTICS_MASTER_PLATFORM_EVOLUTION_DIRECTIVE.md` (108 §s, Batches 0–15)
**Method:** Cross-referenced every § against the reconciled codebase (merge 03dd05d + Task 39) using the existing audit corpus (`docs/final-requirements-matrix-batch10.md` — 128/132 verified) plus a fresh direct audit of the CRM/import/ads/RBAC/AI areas.

**Legend:** ✅ Complete · 🟡 Partial · ❌ Missing · 🚀 Founder action · ⏭️ Deferred (planned batch)

| § | Requirement | Status | Implementation | Notes / Next batch |
|---|---|---|---|---|
| 5 | Branded preload/loading experience | ✅ | `src/components/site/loading-screen.tsx` + skeletons | Initial-load only (by design) |
| 6 | Stable hero CTAs | ✅ | `hero.tsx` — no float/wobble; hover-only motion | Verified Task 39 E2E |
| 7 | Termii-inspired typography research | ✅ | Executed in Termii directive Batches 0–10 | docs/termii-ux-benchmark.md |
| 8 | Mobile CTA rules | ✅ | 390×844 verified: 52–55px targets, no overlap | Task 39 E2E |
| 9 | Compact enquiry modal | ✅ | `inquiry-modal.tsx` (compact floating dialog) | |
| 10 | First/Last/Country fields | ✅ | Phase-36 identity contract | E2E verified Task 39 |
| 11 | ISO-2 country codes | ✅ | `countries.ts` + backend authority | |
| 12 | Phone normalization | ✅ | `map-fields.ts` normalizePhone (E.164-ish, country dial-code) | Done with import v2 (Task 40) |
| 13 | Customer-centric CRM model | ✅ | `Customer` model: identity/lifecycle/sales/payment/DVA | 19 models total |
| 14 | Customer creation from inquiry | ✅ | `findOrCreateCustomer` in inquiries route | E2E verified |
| 15 | Quick manual customer creation | ✅ | `quick-add-customer-dialog.tsx` + extended POST /customers | **Batch 4 done (Task 40)** — E2E verified (Testimony/NG) |
| 16 | AI data import (CSV/Excel/PDF/Word/Sheets) | ✅ | `src/lib/import/*` + import-v2 routes + wizard | **Batch 4 done (Task 40)** — any-format pipeline |
| 17 | Large import support (thousands, chunks, retry) | ✅ | `ImportJob` model + `job-runner.ts` (200-row chunks, retry, progress) | **Task 40 E2E: 2,500 rows → 13 chunks → completed** |
| 18 | Google Sheets import | ✅ | `fetch-source.ts` (export CSV + gviz fallback, share-error guidance) | **Task 40 E2E vs real public sheet** |
| 19 | AI field-variant recognition | ✅ | `map-fields.ts` (§19 variants + country→ISO-2 + phone norm) | E2E: Given/Family Name mapped; Nigeria→NG, Canada→CA |
| 20 | Media storage audit | ✅ | Phase 20/27 audit + upload hardening | |
| 21 | Photo upload (crop etc.) | 🟡 | Upload works; no crop UI | Batch 3 (deferred) |
| 22 | Public ratings | ✅ | `Testimonial` model + moderation status | |
| 23 | Post comments | ✅ | `Comment` model + `/api/comments` (GET+POST) + article comments section + admin Comments tab | **Batch 5 (Task 41)** — moderation-first; E2E: submit→pending→approve→public; nested replies verified (Chidi→Ada) |
| 24 | Post reactions | ✅ | `Reaction` model + `/api/posts/reactions` + 4-button bar (like/helpful/insightful/interested) | **Task 41 E2E** — toggle on/off, one-per-visitor unique constraint, two visitors both counted |
| 25 | Post attachments | ✅ | `MediaAsset` model + `/api/admin/media` upload (magic-byte validation + sharp 1920px/WebP + thumb) + `/api/media/[id]` streaming + cover/gallery/video/PDF in editor & article | **Task 41 E2E** — 90KB 2400px JPG → 20KB 1920px WebP (−78%); fake-jpeg + oversize rejected |
| 26 | Professional post editor | ✅ | `post-editor-dialog.tsx` rewrite: 10-button markdown toolbar, cover upload, attachments manager, SEO tab w/ social preview + email preview, scheduled publishing, live preview | **Task 41 E2E** — scheduler flipped a post scheduled +8s to published automatically |
| 27 | AI post assistant | ✅ | `post-ai.ts` + `/api/admin/posts/ai-assist` + editor AI panel (headlines/excerpts/structure/grammar/SEO/captions/announcement/CTA w/ Apply+Copy) | **Task 41 E2E** — real LLM run: 6 sections rendered; grounded-to-draft prompt; POST_AI_NO_LLM opt-out |
| 28 | Subscriber notifications on publish | ✅ | `Post.notifyPlanned` + `notifySegment` (all/recent90/none) + editor notify select + email preview before send | **Task 41** — segments in `notifyPostPublished`; default `all` preserves §120 compat |
| 29 | Subscriber broadcast AI | ✅ | `broadcast-dialog.tsx` + LLM assist | |
| 30 | AI email quality grounding | ✅ | notify.ts templates use real invoice/customer data | |
| 31 | Branded email templates | ✅ | 15+ templates via Apps Script pipeline | |
| 32 | Email provider failover | ✅ | `email-failover.ts` (priority chain) + settings tab | 🚀 founder credentials |
| 33 | Appointment calendar | ✅ | `CalendarEvent` model (6 §33 types: appointment/meeting/webinar/event/deadline/task; UTC storage, Africa/Lagos render) + admin Events tab (`events-tab.tsx`): Month (Mon–Sun 6×7 grid, today gold-ring, ≤3 chips + “+N more”, cell-click→create prefilled) / Week (7 columns stacked) / Day (chronological detail list) / Agenda (60-day grouped) views + type filter chips + prev/Today/next nav + `event-dialog.tsx` (create/edit: type, datetime-local WAT + duration/custom end, all-day, location, https join link, public switch→capacity, customer link, description, §34 reminder-offset chips) + `event-detail-dialog.tsx` (full fields, registrations table w/ attendance, cancel/delete confirms) + invoice DUE-DATE entries derived client-side from unpaid invoices (all-day deadline rows w/ ₦ amount — §33 “Invoice due dates” + §35, always in sync with Payments) + lazy `runEventLifecycle` (ended >24h → completed) + `GET/PATCH/DELETE /api/admin/events[/id]` + `[id]/registrations` (manage_events-guarded) | **Batch 10 done (Task 45)** — E2E: month grid w/ 4 seeded events, dialog create→grid, detail registrations→Mark attended, invoice deadline chips |
| 34 | Event registration + reminders | ✅ | `EventRegistration` model (unique eventId+email, consent+consentAt, reactivate-on-reregister w/ fresh reminderStates) + `POST /api/events/register` (IP rate-limited §92-style, zod §34 contract w/ literal consent) + public `events-section.tsx` + `event-registration-dialog.tsx` (§34 fields incl. COUNTRIES select; success/duplicate/429/422 states; aria-live) + emails via `notify.ts` (registrant confirmation w/ join link, admin alert, pre/same-day/post reminders by kind) + `runEventReminderScan` (§36: ±3d/+30d window, per-registrant + batch dedup, 500-cap, dryRun, report; fired by 09:00 WAT cron chained after invoice scan AND lazily on GET /api/admin/events) + attendance tracking (PATCH registrations → attended/registered/cancelled) + capacity/full/close guards | **Batch 10 done (Task 45)** — E2E: 2 registrations→201×2 + duplicate:true + EmailLog event.registration×2 + event.reminder + reminderStates stamped; capacity 2; Mark attended |
| 35 | Invoice expiration reminders | ✅ | Reminder logic + stop-when-paid | **Calendar integration (Batch 10/Task 45):** unpaid-invoice due dates now render as all-day `deadline` entries in every calendar view (§33) |
| 36 | Cron/background job architecture | ✅ | See the **Background jobs audit table** below — every job idempotent / retryable / observable / bounded, with its trigger location | §36 audit table added Batch 10 (Task 45) |
| 37–42 | Advertising system | ✅ | `AdRequest` model (§37 intake w/ identity + campaign + attachment + consent; §40 12 statuses + payment state + amount; §42 startAt/endAt/publishedAt) + `/api/ads/request` (public intake, rate-limited 5/10min, §39 advertiser receipt + admin alert emails) + `/api/admin/ads` CRUD + `[id]` PATCH (status trail, terminal-state guard, §39 decision emails w/ outboundNote vs internal adminNotes) + `[id]/creative` upload (§93 media validation) + `/api/ads?placement=` (lazy lifecycle engine §42: scheduled→active→completed/expired) + `/api/ads/click` tracking + public UI (ad-request-dialog, advertise-section, sponsored-slot: SPONSORED label §41, 5 placements, dismissible banner) + admin Ads tab (stats, pipeline filters, detail dialog w/ status timeline + campaign settings) | **Batch 6 done (Task 42 + Task 43 re-verify)** — E2E: request→201→admin list→reviewing→approved(₦250k)→paid→scheduled→lifecycle flip→public feed w/ sponsored:true→click tracked; Ads tab stats LIVE=1 REVENUE=₦250,000 |
| 43 | Author profiles on posts | ✅ | `PostAuthor` model + authors CRUD + AuthorsDialog + editor author picker + article author block (avatar/initials, name, role, bio) + card byline | **Task 41 E2E** — "Ifeanyi Okomba / Founder & Lead Analyst" + bio rendered on article + card |
| 44–47 | Multi-admin RBAC + dashboard actions | ✅ | §44: `AdminUser` + `AdminRole` + `AdminAuditLog` models (25→28) + invite workflow (POST /api/admin/admins → email w/ hashed-at-rest 7-day token → #/invite/<token> activation form (portal+page.tsx hash routing) → account activated + session issued) + master mirror (env ADMIN_EMAIL auto-synced to super_admin row; master can never be disabled/deleted/edited) + 8 directive roles seeded. §45: 16 permissions (15 directive + view_dashboard baseline) enforced SERVER-SIDE in all 46 admin routes via authorizeAdmin/authorizeAdminAny (401 session vs 403 capability); super_admin unrestricted in code (role edits can't de-permission); disabled accounts lose sessions instantly. §46: every Overview KPI card is an actionable button → target tab (+ inquiries deep-link filter, heading reflects active filter). §47: Quick actions row (10 buttons: new customer/log inquiry → quick-add dialog, new proposal/invoice → flows, new post → editor, broadcast, new ad campaign, new event (ENABLED Batch 10 → Events tab + create dialog), invite admin, review AI drafts) gated by `can()`. Role editor (checkbox capability matrix, custom roles, super_admin locked). Audit log tab (admin.login/invite/activate/update/delete + role changes) | **Batch 7 done (Task 44)** — E2E: invite Ngozi (finance) via UI → token from email log → activation → auto-signed-in; finance GET invoices 200 / GET posts, admins, ads, comments 403 / POST customers 403; marketing (Tunde) → 14 tabs (Admins hidden), 7 quick actions disabled by role; §46 card → inquiries w/ "new" filter applied; audit trail rendered (login→invite→activated); admin identity chip; mobile 390×844 no-overflow |
| 48–51 | AI customer chat + knowledge config | 🟡 | `ai-chat-widget` + `ai-chat.ts` knowledge layer | Batch 11 |
| 52–57 | AI autonomy + mass email AI | 🟡 | Draft proposal auto-create from AI chat | Batch 12 |
| 58–63 | AI monitoring/handover/escalation | 🟡 | Conversation log exists | Batch 11 |
| 64–67 | Student portal | ❌ | Not present | Batch 13 |
| 68 | Cookie/privacy categories | ✅ | `cookie-consent.tsx` (4 categories + manage) | |
| 69–76 | Paystack + DVA architecture | ✅ | payment module (customer/dva/reconciliation) | 🚀 prod keys |
| 77–80 | Invoice OKM numbering + design | ✅ | OKM-{year}-{seq} + world-class template | |
| 81 | Payment webhooks | ✅ | Signature + idempotency + audit | |
| 82–84 | Reconciliation + Payment model/status | ✅ | reference→DVA→invoice chain + Payment states | |
| 85 | Payment emails | ✅ | Branded payment email set | |
| 86 | Code.gs audit | ✅ | v6 reconciled | 🚀 founder deploy |
| 87 | Analytics events | ✅ | `AnalyticsEvent` model + track route | |
| 88–89 | Performance + DB indexes | ✅ | Batch audits + indexed query patterns | |
| 90–93 | Security (uploads/SSRF/spam) | ✅ | Phase 27 hardening + import SSRF guard + §93 media validation (magic bytes/MIME/size/sanitized name/generated keys/local non-exec storage) + §92 comment defenses (rate limit 5/10min, honeypot, time-trap, link budget, shortener blocklist, profanity blocklist, duplicate guard, report auto-hide ×3) | **Task 41 E2E** — profanity→spam w/ flagged trail; 3-link→422; 7th comment→429; 3 reports→auto-hidden |
| 94–95 | Observability + admin notifications | 🟡 | Email log + diagnostic logging + §23 new-comment admin alerts (notifyNewComment) + §92 report alerts | Notification center UI Batch 14 |
| 96 | Global admin search | ❌ | Per-tab search only | Batch 14 |
| 97 | Audit trail | ✅ | WebhookLog/EmailLog/AuditLog patterns | |
| 98–100 | Configuration center | 🟡 | Settings tab (email providers) | Extended Batch 14 |
| 101–103 | Admin AI copilot + tool permissions | ❌ | Not present | Batch 12 |
| 104 | Batch sequence | — | Following directive order | CRM import now (user priority) |
| 105–107 | Testing + full regression + re-audit | ✅/🟡 | Gates pass; regression via agent-browser | Per-batch |
| 108 | This traceability matrix | ✅ | This document | Updated per batch |
| 109 | Partial-implementation search | ✅ | Task 39 §39 scan | Re-run after this batch |
| 110–121 | GitHub/release standards/compat | ✅ | Committed per batch; extend→migrate→deprecate | |
| 122 | First action = Batch 0 only | ✅ | This audit precedes code | |

## §36 Background jobs audit (added Batch 10 — Task 45)

Every background / scheduled job in the platform, audited against the §36 requirements
(idempotent · retryable · observable · bounded) with its trigger location:

| Job | Where it runs | Idempotent | Retryable | Observable | Bounded |
|---|---|---|---|---|---|
| Invoice reminder scan (`runReminderScan`) | cron 09:00 WAT (`cron.ts`) + manual POST `/api/admin/reminders/run` | ✅ EventRecord dedup per (invoice, kind) — same window never fires twice | ✅ failed send marks event `failed`, next scan re-tries | ✅ ReminderRunReport + EmailLog rows + dev.log | ✅ all unpaid invoices w/ dueDate; 3 fixed windows (−3d / due / +1d); reminders stop when paid |
| Event reminder scan (`runEventReminderScan`, Batch 10) | cron 09:00 WAT (chained AFTER invoice scan) + lazy on GET `/api/admin/events` | ✅ per-registrant `reminderStates[offset]` + event-level `remindersSent[offset]` dedup | ✅ failed sends never marked sent → next scan retries | ✅ EventReminderRunReport (scanned/touched/sent/failed/skipped) + EmailLog `event.reminder` rows + dev.log | ✅ window [now−3d, now+30d], status=scheduled only (cancelled stops reminders), ≤500 registrants/event/scan, dryRun mode |
| Event lifecycle (`runEventLifecycle`, Batch 10) | lazy on GET `/api/events` + GET `/api/admin/events` | ✅ conditional updateMany (status=scheduled guard) — no double flips | ✅ stateless; safe to re-run | ✅ returns flip count; dev.log | ✅ only scheduled events ended >24h ago |
| Post auto-publish (`publishDuePosts`) | internal 60s scheduler (posts.ts, Batch 5) | ✅ status guard + notifySentAt once | ✅ per-post try/catch; failed publish retried next tick | ✅ dev.log + Post.status flips | ✅ due posts only; notify blast once (notifySentAt) |
| Ad lifecycle (`runAdLifecycle`, Batch 6) | lazy on GET `/api/ads` + GET `/api/admin/ads` | ✅ conditional updateMany per transition | ✅ stateless; safe to re-run | ✅ returns flip count; dev.log | ✅ scheduled/active rows only |
| Bulk import job-runner (`import/job-runner.ts`, Batch 4) | fire-and-forget per ImportJob + resume-on-boot | ✅ chunkStates trail; processed chunks skipped | ✅ per-chunk retry counter; job re-queued on restart | ✅ ImportJob stage/status/counts surfaced in UI | ✅ 200-row chunks; per-chunk try/catch; no parallel jobs per file |
| Queued emails (failover chain `deliverWithFailover`) | inline at each notify call-site | ✅ EmailLog row per send; admin alerts key+cooldown dedup | ✅ apps_script → resend → mailtrap → maileroo chain; failed rows flagged `failed` w/ error | ✅ EmailLog (provider, status, error) + Email log tab | ✅ per-callsite lists (subscribers, registrants ≤500) + 1h alert cooldown |
| DB backup (`runDbBackup`) | cron 02:00 WAT | ✅ dated file names | ✅ failure → system.alert email | ✅ log line + Backup records | ✅ single dump/night, size logged |
| Anti-sleep self-ping (`pingHealthOnce`) | cron every 9 min (opt-in env) | ✅ stateless GET | ✅ next tick retries | ✅ dev.log status per ping | ✅ 10s timeout (AbortSignal) |

## Priority order (directive + founder emphasis)

1. **BATCH 4-CRM-IMPORT (DONE — Task 40)** — §15 quick-add + §16/§17/§18/§19 import pipeline: any-format extraction (CSV/TSV/XLSX/XLS/PDF/DOCX/TXT/JSON), sources (device/URL/Google Sheets/Google Drive), background job + chunks + progress + retry, AI field mapping with firstName/lastName/countryCode canonical output, preview + approval gate, duplicate resolution. Founder: *"import large data… google drive, sheets, etc… regardless of what format, means, location."* — E2E verified: 2,500-row import in 13 chunks; URL import; Google Sheets fetch; SSRF block; quick-add.
2. **BATCH 5-PUBLISHING (DONE — Task 41)** — §23 comments (moderation-first, nested replies, rate/spam/honeypot/report defenses) · §24 reactions (like/helpful/insightful/interested, one-per-visitor) · §25 attachments (MediaAsset + optimized upload + cover/gallery/video/PDF) · §26 pro editor (markdown toolbar, SEO + social preview, scheduling w/ auto-publish scheduler) · §27 AI post assistant (grounded) · §28 notify segments (all/recent90/none + email preview) · §43 author profiles. All E2E-verified; DB restored to pre-test state.
3. **BATCH 6-ADVERTISING (DONE — Task 42, committed within 2425d36; re-verified Task 43 after sandbox reset)** — §37 intake (ad-request-dialog) · §38 workflow (new→reviewing→approved→paid→scheduled→active→completed/expired) · §39 emails (advertiser receipt + admin alert + decision emails, adminNotes never disclosed) · §40 admin Ads tab (12 statuses, payment state, stats, detail dialog) · §41 public display (sponsored-slot: 5 placements, SPONSORED label, dismissible) · §42 lifecycle engine + click tracking.
4. **BATCH 7-RBAC (DONE — Task 44)** — §44 multi-admin (invite→email→accept→activate, master mirror, 8 roles) · §45 server-side-enforced permissions across all 46 admin routes · §46 actionable KPI cards · §47 quick actions row + role editor + audit log.
5. **BATCH 10-CALENDAR (DONE — Task 45)** — §33 full calendar UI (month/week/day/agenda, 6 event types, invoice due-date integration) · §34 public event/webinar registration w/ consent + confirmation + configurable pre/same-day/post reminders + attendance tracking · §35 calendar integration note · §36 background-jobs audit table. 2 new models (30 total).
6. Batches 11–15 per directive sequence (next: Batch 11 AI chat grounding §48–51, then Batch 12 AI autonomy §52–57).
