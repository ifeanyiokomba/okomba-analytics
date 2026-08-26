# Okomba Analytics — Workflow Map

Preservation-first documentation of every user-facing workflow in the application.
The presentation layer (UI) may evolve; these contracts must keep working.

Last audited: after Phase-2 Modules 5+6 (reminder engine + WhatsApp widget).

---

## W1 — Project Inquiry (primary conversion)

| Aspect | Detail |
|---|---|
| **Entry points** | Navbar "Get Started" · Hero "Start a Project" · Explorer "Request this service" (pre-selects service) · Process CTA · Contact CTA · Footer "Start a Project" |
| **Trigger** | User clicks any CTA → `openInquiry(service?)` in `page.tsx` |
| **Processing** | `InquiryModal` (dynamically imported) → form state (React) → client validation |
| **Fields** | `name*`, `email*`, `phone`, `whatsapp`, `service*` (select), `addlService`, `budget`, `message*` |
| **Validation layers** | 1) Native HTML5 (email format, required) 2) client-side messages 3) server-side zod (`/api/inquiries` POST) |
| **API contract** | `POST /api/inquiries` — JSON body, same fields as above |
| **Duplicate protection** | `submitting` state disables submit + backdrop click while in flight |
| **Success** | Modal closes → toast `role=status` ("Thank you {name}…") · DB row created (`status: "new"`) · email receipt logged in `EmailLog` (`inquiry.created`) |
| **Failure** | Inline `[role=alert]` messages; invalid input → form stays open |
| **Persistence** | Prisma `Inquiry` table |
| **Admin visibility** | Dashboard → Inquiries tab (status pipeline new → contacted → in_progress → closed) |

## W2 — Newsletter Subscription (double opt-in)

| Aspect | Detail |
|---|---|
| **Entry** | `#newsletter` section form |
| **Processing** | `POST /api/subscribe` `{email}` → creates `Subscriber` (`status: "pending"`) + `confirmToken` |
| **Confirmation** | Email link → `GET /api/subscribe/confirm?token=…` → HTML page → status `"confirmed"`, `confirmedAt` set |
| **Unsubscribe** | Email link → `GET /api/subscribe/unsubscribe?token=…` → HTML page → status `"unsubscribed"` |
| **Emails logged** | `subscriber.welcome` entries in `EmailLog` |
| **Admin** | Subscribers tab: status management, delete, CSV export, broadcast composer |

## W3 — Blog / Insights (CMS)

| Aspect | Detail |
|---|---|
| **Public read** | `GET /api/posts` (published only) → Insights section card grid → `BlogArticleDialog` reading view |
| **Admin create/edit** | Posts tab → `PostEditorDialog` (Markdown, write/preview, tags, slug auto-sync) |
| **APIs** | `GET/POST /api/admin/posts`, `PATCH /api/admin/posts` (update), `DELETE /api/admin/posts/[id]` — all admin-auth gated |
| **Publish pipeline** | status → `published` fires `notifyPostPublished()`: emails every **confirmed** subscriber, sets `notifySentAt`, logs `post.published` per recipient |
| **Broadcast** | Subscribers tab → `BroadcastDialog` → `POST /api/admin/broadcast` → free-form email to confirmed subscribers, logged as `broadcast` |

## W4 — Testimonials (CMS)

| Aspect | Detail |
|---|---|
| **Public read** | `GET /api/testimonials` (published only, `sortOrder` asc) → Testimonials section; falls back to static `TESTIMONIALS` constant on failure |
| **Admin** | Testimonials tab → create/edit/delete, star picker, live preview, draft/publish |
| **APIs** | `GET/POST /api/admin/testimonials`, `PATCH/DELETE /api/admin/testimonials/[id]` |

## W5 — Admin Portal (auth)

| Aspect | Detail |
|---|---|
| **Route** | `/#/admin` hash route (preserved from original app) |
| **Login** | `POST /api/admin/login` — `ADMIN_EMAIL`/`ADMIN_PASSWORD` env; dev defaults work only when `NODE_ENV !== "production"` (503 in prod if unset) |
| **Session** | `AdminSession` token → httpOnly cookie `okomba_admin` (24h) |
| **Hardening** | Brute-force limiter + artificial delay; all `/api/admin/*` routes verify via `isAdminAuthorized()` |
| **Tabs** | Overview (KPIs) · Inquiries · Proposals · Subscribers · Posts · Testimonials · WhatsApp · Email log |
| **Exit** | "Site" button clears hash → marketing site |

## W6 — Navigation & Anchors

| Aspect | Detail |
|---|---|
| **Nav links** | Services → `#services` · Solutions → `#solutions` · Work → `#work` · Process → `#process` · About → `#about` · FAQ → `#faq` |
| **Footer links** | same set + `#newsletter`, `#contact`, `#insights` |
| **Mobile** | Hamburger → full-screen drawer (body scroll locked) |
| **External** | WhatsApp `wa.me/2348088948657` · `mailto:support@okomba.com` · `tel:+2348088948657` |

## W7 — Cookie Consent

| Aspect | Detail |
|---|---|
| **Behavior** | Slides up after 1.4s on first visit; "Accept all" or "Essential only" both persist in `localStorage` (`okomba_cookie_consent`) |
| **Reopen** | Footer "Cookies" button → `okomba:open-cookie-settings` window event → settings mode |

## W8 — AI Proposal → Invoice Pipeline (Module 4)

| Aspect | Detail |
|---|---|
| **Entry** | Admin → Inquiries tab → "Create proposal" → `ProposalComposerDialog` |
| **AI generation** | `POST /api/admin/proposals/generate` — z-ai SDK refines inquiry → `ProposalDraft` JSON (server-side only; Google Script never calls AI). AI NEVER mentions price |
| **Send pipeline** | `POST /api/admin/proposals/send` → invoice number `INV-YYYY-NNNN` → Paystack DVA (account name **"Okomba Analytics"**) → branded Ink+Honey-Gold PDF (pdfkit, regenerated deterministically from `proposalJson`) → email with PDF **attached** |
| **Email subject (fixed)** | `Your Proposal from Okomba Analytics - Invoice #INV-xxx` |
| **WhatsApp caption (fixed)** | `Hi {firstName}, here is your proposal and invoice from Okomba Analytics` |
| **Audit** | `EmailLog` type `invoice.sent`; invoice row (`status: sent`); reminder `EventRecord`s scheduled; WhatsApp caption queued in `whatsapp_messages` |

## W9 — Payment Reminder Engine (Module 5)

| Aspect | Detail |
|---|---|
| **Schedule** | node-cron `0 9 * * *` **Africa/Lagos** (`REMINDER_CRON_ENABLED`/`REMINDER_CRON_EXPR` env) |
| **Manual trigger** | Admin → Proposals tab → "Run reminders" → `POST /api/admin/reminders/run` (preview via GET) |
| **Scan logic** | unpaid invoices (`sent`/`pending`/`overdue` with a due date): due − 3 days → *Friendly* · due today → *Due Today* · due + 1 day → *Overdue* |
| **Dedup** | one `EventRecord` per invoice+type (`invoice.reminder_3d|_due|_overdue`); once `processed`, the same window never refires |
| **Each reminder** | AI refiner (z-ai, spec prompt; deterministic fallback) → branded PDF **re-attached** (regenerated from snapshot) → email + WhatsApp |
| **Email subject (fixed)** | `Reminder: Invoice #INV-xxxx Due {date}` |
| **WhatsApp caption (fixed)** | `Hi {firstName}, quick reminder: Invoice {INV} ₦{amount} due {date}. Pay to {DVA accountNumber}` |
| **Post-send** | `EventRecord.status=processed`, `lastSentAt` stamped; past-due invoices flip to `overdue` |
| **Queued WhatsApp** | rows stay `queued` while the WhatsApp service is down; flushed automatically on reconnect (W10) |

## W10 — WhatsApp Widget & Transport (Module 6)

| Aspect | Detail |
|---|---|
| **Entry** | Admin → WhatsApp tab (`/admin` dashboard) |
| **Service** | `mini-services/whatsapp-service` — REST `:3004` (server-to-server), socket.io `:3005` at path `/` (browser via `/?XTransformPort=3005`) |
| **Engine** | whatsapp-web.js + puppeteer, LocalAuth session in `mini-services/whatsapp-service/data/session`. Modes: `auto` (real, demo fallback) / `real` / `demo` (`WHATSAPP_MODE` env) |
| **Left panel** | unified customer list (invoices + enquiries + chat traffic) with last message, unread badge, latest unpaid invoice (`GET /api/admin/whatsapp/chats`) |
| **Right panel** | chat history from `whatsapp_messages` (`GET /api/admin/whatsapp/messages?phone=`) |
| **Composer** | text send · **Attach Invoice** (re-generates latest pending invoice PDF, attaches with caption) · quick replies ("Thanks for payment", "Invoice attached", "Need more info?") |
| **Status badge** | Connected / Connecting / Disconnected; nav-tab live dot (20s poll) + socket events; disconnect → toast `"WhatsApp disconnected. Scan QR again"` |
| **QR modal** | shown when disconnected — real WhatsApp QR (or demo QR in demo mode with "Simulate scan") |
| **Reconnect flush** | on `ready`, the service POSTs `/api/whatsapp/service-event` → main app flushes queued outbound rows (up to 25) with regenerated PDFs |
| **Inbound** | service → `POST /api/whatsapp/inbound` (X-Internal-Token guarded) → `whatsapp_messages` row → live socket update + 10s polling fallback |
| **Integration** | every Module 4/5 outbound WhatsApp lands in `whatsapp_messages` → visible in the chat widget |

---

## W11 — AI Service Finder / Lead Qualifier (Module 7)

| Aspect | Detail |
|---|---|
| **Entry** | Floating widget bottom-right on the public site — "Talk Through Your Ideas 💡" (hidden on `#/admin`) |
| **Engine** | `POST /api/ai/chat` (z-ai server-side). Before every model call the endpoint re-reads the LIVE Services + Portfolio catalog (`src/lib/content.ts` — the same source the public site renders), so the AI only ever recommends what Okomba actually sells |
| **System prompt rules (spec-fixed)** | 1. NEVER mention price. 2. Qualify in max 3 messages. 3. Then ask exactly: "Can I get your email to send a custom proposal?" 4. Expert, Nigerian context, Ink+Honey tone |
| **Output contract** | model returns `{ reply, recommendedServiceIds, leadScore, customerName }`; prose replies accepted + price-figure scrub applied server-side |
| **Email capture** | server-side regex (authoritative) on user messages; dedup per session (sessionId in `received_emails.meta`) |
| **On capture** | `received_emails` row (source `ai_chat`, leadScore 1–10, full transcript in message/meta) → `inquiries` row (source `ai_chat`) → **auto-created draft proposal** (`draft_proposals`, generated in background via the same price-scrubbed proposal engine) |
| **Admin visibility** | Proposals tab → "AI chat drafts" strip (lead score chip, Review & send → composer opens with the draft pre-loaded, no AI wait); Inquiries tab → purple "AI chat" badge |
| **UX** | typing dots (min 600 ms), mobile-first bottom-sheet panel, suggestion chips, localStorage chat history (`okomba-ai-chat-v1`), gold confirmation card once the email is captured |
| **Safety** | per-IP rate limit (20 msg/min), history cap (24 messages), 2000-char message cap, deterministic keyword fallback keeps the funnel alive on AI outage |

## W12 — Paystack Payment Flow (Module 7 — money hook)

| Aspect | Detail |
|---|---|
| **Endpoint** | `POST /api/paystack/webhook` — verify `x-paystack-signature` (HMAC-SHA512 over the RAW body, timing-safe) → persist `webhook_logs` row → answer **200 fast**, process in background |
| **Secret** | `PAYSTACK_WEBHOOK_SECRET` (falls back to `PAYSTACK_SECRET_KEY`). Paystack signs webhooks with the secret key of the mode (test/live) |
| **Idempotency** | unique `(provider, event, paystackId)` — replays resolve as `duplicate` with HTTP 200 (Paystack retries must always get 200s) |
| **charge.success** | find invoice by `dedicated_account.account_number` (fallback: customer email + amount among unpaid) → `status="paid"` + `paidAt` → **stop all scheduled reminders** (`invoice.reminder_*` events → `skipped`) → AI "Thanks for payment" email + WhatsApp, BOTH with the official **receipt PDF** attached → create `project.kickoff` event at +24h |
| **Receipt PDF** | `src/lib/pdf/receipt-pdf.ts` — 1-page branded receipt (PAID badge, RCT-number, payment method, Paystack reference, next steps) |
| **Thank-you email** | subject `Thank You — Payment Received for Invoice #INV-xxxx`, EmailLog type `payment.received`, receipt attached via the GAS engine (never a link) |
| **transfer.success** | logged for accounting only (no invoice mutation) |
| **Unknown events** | logged as `ignored`; bad signatures → 401 + `signature.rejected` log row |
| **Admin visibility** | Payments tab — webhook log (status/sig chips, expandable result JSON), revenue roll-up, paid invoices, kickoff schedule, "Fire test webhook" console (signed charge.success through the real pipeline) |
| **Test tooling** | `bun run scripts/test-paystack-webhook.ts INV-xxxx [--replay|--list]` — builds + HMAC-signs a realistic payload and POSTs it over HTTP like Paystack does |

---

## Content sources (single source of truth)

| Data | Source | Consumers |
|---|---|---|
| Services (14) | `src/lib/content.ts` `SERVICES` | ServiceExplorer, InquiryModal select, Admin dialogs |
| Products | `PRODUCTS` | ProductsSection |
| Projects | `PROJECTS` | CaseStudies + ProjectDialog |
| Testimonials | DB (`/api/testimonials`) w/ static fallback | TestimonialsSection, Admin |
| Posts | DB (`/api/posts`) | InsightsSection, Admin |
| Contact info | `CONTACT` constant | Footer, Contact, Navbar, email templates |

## Non-negotiables for future changes

1. Never alter API payload shapes without updating all consumers
2. `#/admin` hash route must keep working (bookmarked by the owner)
3. Publish → subscriber email pipeline must remain atomic (fire-and-forget, never blocks response)
4. All admin routes must stay behind `isAdminAuthorized()`
5. Double-opt-in must not be bypassed for subscribers
6. Reminder subjects/captions (W9) and proposal subject/caption (W8) are spec-fixed — never reword
7. The WhatsApp mini-service never writes the database directly — persistence stays in the Next.js app
8. `whatsapp_messages` is the single source of chat truth for the widget (all outbound flows write through `dispatchWhatsApp`)
9. The AI chat NEVER mentions price (W11) — server-side scrub is the last line of defence, keep it
10. The Paystack webhook must stay idempotent + signature-verified (W12): every event lands in `webhook_logs`, replays answer 200 as `duplicate`, and `charge.success` processing must never run twice for the same invoice
11. `charge.success` must always: flip status → stop reminders → thank-you email + WhatsApp with receipt PDF → schedule the +24h kickoff. If any step fails it must surface in the Payments tab (failed log row), never silently

## W13 — Client Portal (Module 8A)

| Aspect | Detail |
|---|---|
| **Entry** | Email CTA "View your proposal online" (`{PORTAL_BASE_URL}/portal/{secureToken}`) · Admin "Copy client portal link" button (`/#/portal/{token}` sandbox hash route) · Real Next route `GET /portal/[secureToken]` |
| **Auth model** | None — the 192-bit unguessable `secureToken` IS the access control. Generated by `crypto.randomBytes(32)` in `src/lib/portal.ts`, persisted on `Invoice.secureToken` (unique) at send time. Backfilled for legacy invoices via `POST /api/admin/invoices/[id]/portal-token` (`?regenerate=1` rotates). |
| **Public API** | `GET /api/portal/[token]` (no auth) → invoice + proposal + DVA + pdf meta + paymentProof; records `portal_visit` analytics + stamps `portalViewedAt` on first load. `GET /api/portal/[token]/pdf` → Cloudinary redirect (fl_attachment) OR deterministic regeneration from `proposalJson`; records `pdf_download`. `POST /api/portal/[token]/paid` (multipart `proof`) → saves under `data/uploads/proofs/{invoiceId}/`, stamps `paymentProof*` fields, alerts admin, records `payment_proof_uploaded` analytics. |
| **UI** | `src/components/portal/client-portal.tsx` (`ClientPortal` + `ClientPortalView`). Ink cover with "Prepared for {name}" + status pill (PAID/overdue), gold-accented Total Due card, DVA box with 1-click clipboard copy, vertical timeline stepper, scope/deliverables/terms cards, sticky actions row (Download PDF + "I've Paid" file upload), sticky ink footer. Mobile-first 375px. |
| **States** | loading · not-found (invalid token) · error · ready · paid (thank-you banner + PAID badge, DVA greyed, download still works) · proof-received ("Proof received — verifying" card replaces the button). |
| **Analytics** | `portal_visit` + `pdf_download` recorded server-side (deduped by session for `ai_chat_start`); `proposal_view` via IntersectionObserver (server + GA4); `payment_click` on the I've Paid button (GA4). All flow into `AnalyticsEvent` (W15). |
| **Persistence** | `Invoice.secureToken` · `Invoice.portalViewedAt` · `Invoice.paymentProofUrl/Name/UploadedAt` · `AnalyticsEvent`. |
| **Email contract** | Every `invoice.sent` (W8) and reminder (W9) email now carries `portalUrl` → "View your proposal: {url}" body line + gold "View your proposal online" / "View & pay in your portal" CTA button. `PORTAL_BASE_URL` env sets the public host (default `https://app.okomba.com`). |

## W14 — Cloudinary PDF Storage + Daily Backup (Module 8B)

| Aspect | Detail |
|---|---|
| **Cloudinary upload** | `src/lib/cloudinary.ts` `uploadProposalPdf(invoiceNumber, buffer)` → uploads to `resource_type:"raw"`, folder `okomba/proposals`, `public_id:{invoiceNumber}`, `overwrite:true`. Returns `{ ok, url, storage:"cloudinary"\|"local" }`. Wired into `sendProposal` (`invoice-service.ts`) AFTER PDF generation, BEFORE invoice persist — `pdfUrl` + `pdfStorage` saved on the row. |
| **Fallback contract** | If `CLOUDINARY_URL` (or `CLOUDINARY_CLOUD_NAME`+KEY+SECRET) is unset OR the upload throws → PDF stored under `data/uploads/proposals/{invoiceNumber}.pdf`, `pdfStorage="local"`, and `sendAdminAlertEmail({key:"cloudinary.*"})` fires (rate-limited 1h). The send pipeline NEVER breaks. |
| **WhatsApp link mode** | `dispatchWhatsApp({pdfUrl})` (Module 8B): when the invoice has a Cloudinary URL, the WhatsApp message is sent as caption + Cloudinary link TEXT (no base64 bytes travel to the mini-service), and `whatsapp_messages.mediaUrl` is set to the Cloudinary URL. Reminder (W9) + proposal (W8) sends both use it. Local fallback keeps the base64 attachment behaviour. |
| **Portal PDF download** | `GET /api/portal/[token]/pdf`: `pdfStorage==="cloudinary"` → 302 redirect with `fl_attachment` (cached, fast); else `regenerateInvoicePdf(invoice)` streams a deterministic copy identical to the original. |
| **Backup cron** | `src/lib/cron.ts` schedules `0 2 * * *` Africa/Lagos (env `BACKUP_CRON_ENABLED`, `BACKUP_CRON_EXPR`). `runDbBackup()` in `src/lib/backup.ts`: snapshots the SQLite DB via `sqlite3 … VACUUM INTO` (online-safe) when the CLI exists, else `fs.copyFile`; uploads to Google Drive (hand-rolled JWT + Drive v3 `uploadType=media` then PATCH metadata w/ `parents:[folderId]`) when `GOOGLE_SERVICE_ACCOUNT_JSON`/`_B64` + `GOOGLE_DRIVE_FOLDER_ID` are set; else local rotation under `data/backups/` (14-day retention). Every run recorded in `BackupLog`; failures + first-local-only-run alert the admin. |
| **Manual trigger** | `POST /api/admin/backups` (admin-gated) → `runDbBackup({trigger:"manual"})` + returns refreshed `backupStatus()`. UI button in the Analytics tab (W15). |
| **Persistence** | `Invoice.pdfUrl` · `Invoice.pdfStorage` · `WhatsAppMessage.mediaUrl` · `BackupLog` · `EmailLog` (`type:"system.alert"` for fallback/failure alerts). |

## W15 — GA4 + First-party Analytics (Module 8C)

| Aspect | Detail |
|---|---|
| **GA4 script** | `src/app/layout.tsx` loads gtag.js (strategy `afterInteractive`) only when `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is set. `src/lib/analytics.ts` `trackEvent(name, params)` pushes to `window.dataLayer` + calls `gtag('event', …)` when GA4 is live; in the dev sandbox (no ID) it `console.debug`s the event — harmless + inspectable. |
| **Event names (shared with GA4)** | `ai_chat_start` · `portal_visit` · `proposal_view` · `pdf_download` · `payment_click` · `payment_proof_uploaded` (bonus funnel step). |
| **Server-side truth** | `src/lib/analytics-server.ts` `recordAnalyticsEvent({type, invoiceId?, secureToken?, sessionId?, meta})` writes `AnalyticsEvent` (the dashboard source of truth — works with or without GA4). `POST /api/analytics/track` (public, whitelisted types, 60/min/IP rate limit) ingests client-only events (`proposal_view`, `payment_click`, `ai_chat_start` client mirror). `portal_visit` + `pdf_download` are recorded server-side by the portal API (never re-posted by the client to avoid double-count). `ai_chat_start` is recorded by `/api/ai/chat` on the first turn of a session, deduped by `sessionId`. |
| **UTM tagging** | AI chat recommended-service chips link via `aiChatServiceHref("services")` → `/?utm_source=ai_chat&utm_medium=ai_chat&utm_campaign=service_finder#services`. |
| **Admin Analytics tab** | `src/components/site/admin/analytics-tab.tsx` `AnalyticsTab()` self-fetches `GET /api/admin/analytics`: KPIs (Revenue MTD · Paid count · AI conversion % · Avg deal size, plus revenue total / outstanding / AI leads / AI won / drafts / invoices total), hand-rolled SVG 90-day revenue bar chart (`viewBox 0 0 900 200`, `preserveAspectRatio="none"`, hover tooltips via `<title>`), Revenue-by-Service table with gold total row, 6-chip funnel strip (last 30d), and the Module-8B backups strip (Drive/Cloudinary status pills + last backup + "Run backup now"). |
| **KPI math** | Paid revenue uses `paidAt` in Africa/Lagos (UTC+1, no DST). AI conversion = `inquiries.source="ai_chat"` that ended in a PAID invoice ÷ all ai_chat inquiries. Avg deal = mean `amountKobo` of paid invoices. |
| **Persistence** | `AnalyticsEvent` (per-event rows) · reads `Invoice` (paid/revenue) · `Inquiry` (ai_chat source) · `BackupLog` (W14 strip). |

## Non-negotiables (Module 8 additions)

12. The client portal token (`Invoice.secureToken`) is the ONLY access control for `/portal/[token]` and `/api/portal/[token]/*` — never weaken the 192-bit entropy, and never add an auth wall (spec: "No auth"). Rotating a token invalidates the previous link instantly.
13. Cloudinary failure must NEVER break the send pipeline: local fallback + admin alert are mandatory; `pdfStorage` reflects the actual storage so portal downloads route correctly.
14. `AnalyticsEvent` is the analytics source of truth — GA4 is a mirror. The Admin Analytics dashboard must render real data with zero third-party configuration (works in the sandbox with no GA4 / Cloudinary / Drive creds).

---

## W16 — Daily Operations SOP (Stage 9C — Runbook)

The four procedures the founder runs every working day. Each is end-to-end against the live admin dashboard at `https://okomba.com/#/admin`.

### W16.1 — How to send a proposal

| Step | Action |
|---|---|
| 1 | Login at `/#/admin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. |
| 2 | Open the **Inquiries** tab. Find the lead (status `new` or `contacted`). Click the row to open the detail dialog. |
| 3 | Click **Create proposal** (opens `ProposalComposerDialog`). The AI pre-drafts the scope from the inquiry message; edit the service/duration/amount — the AI never mentions price. |
| 4 | Set the amount (₦) and duration (e.g. "3 weeks"). Due date auto-defaults to today + duration. |
| 5 | Click **Send proposal**. The pipeline runs atomically: invoice number minted (`INV-YYYY-NNNN`) → Paystack DVA issued → branded PDF generated → uploaded to Cloudinary → email sent with PDF attached + portal link → WhatsApp caption dispatched (Cloudinary link mode) → reminders scheduled. |
| 6 | Verify in the **Proposals** tab — the new invoice appears with status `sent`, a teal "portal" link button, and the customer's row in **WhatsApp** shows the outbound caption. |
| 7 | If WhatsApp is `disconnected`: the caption is queued. Scan the QR (W16.3) — the queue flushes automatically on reconnect. |
| 8 | The customer receives: (a) branded email with PDF attached + "View your proposal online" CTA, (b) WhatsApp caption with the Cloudinary PDF link. Both link to `https://okomba.com/portal/{secureToken}`. |

### W16.2 — How to check payments

| Step | Action |
|---|---|
| 1 | Login at `/#/admin`. Open the **Payments** tab. |
| 2 | The **Webhook log** strip shows every Paystack event (status chips: `processed` teal / `duplicate` grey / `failed` red / `signature.rejected` red). Click a row to expand the JSON payload. |
| 3 | The **Paid invoices** list shows every paid invoice with `paidAt`, amount, and customer. |
| 4 | The **Revenue** roll-up shows total paid revenue + outstanding (sent + overdue). |
| 5 | The **Kickoff schedule** lists `project.kickoff` events auto-scheduled +24h after each `charge.success`. |
| 6 | Cross-check with the Paystack dashboard → Transactions for the bank reconciliation. The Paystack reference on the receipt PDF (RCT-YYYY-NNNN) matches the `data.reference` in the webhook log. |
| 7 | If a customer paid but the invoice isn't marked paid: the webhook didn't fire (Paystack dashboard → Settings → Webhooks → ensure URL = `https://okomba.com/api/paystack/webhook` + LIVE mode). Or use the **Fire test webhook** console to re-send the event. |
| 8 | If a customer uploaded a payment proof via the portal "I've Paid" button: a `system.alert` email lands in `ADMIN_EMAIL`. Mark the invoice paid manually after verifying the proof, then use the **Payments** tab → "Mark paid" action (creates a `webhook_logs` row of source `admin-test`). |

### W16.3 — How to scan the WhatsApp QR if disconnected

| Step | Action |
|---|---|
| 1 | Login at `/#/admin`. Open the **WhatsApp** tab. |
| 2 | If the status badge reads `Disconnected` (red dot in the nav): click **Show QR code**. |
| 3 | A modal opens with a real WhatsApp QR (refreshes every ~30s). |
| 4 | Open WhatsApp on the production phone → Settings → Linked devices → Link a device → scan the QR. |
| 5 | Within ~10s the badge flips to `Connected` (green dot). The mini-service POSTs `/api/whatsapp/service-event` → the main app flushes the queued outbound messages (up to 25, with regenerated PDFs for the local-fallback case). |
| 6 | If the QR won't scan: clear the session disk on Render (whatsapp service → Shell → `rm -rf data/session/*` → restart). The next boot shows a fresh QR. |
| 7 | Inbound messages from customers land in the WhatsApp tab inbox; the right panel shows the conversation. Replies use the composer (text or **Attach Invoice** for the latest pending invoice PDF). |
| 8 | The session persists across deploys/restarts (dedicated `okomba-whatsapp-session` disk) — re-scan only if the linked device is removed or the session disk is wiped. |

### W16.4 — How to restore from a Drive backup

| Step | Action |
|---|---|
| 1 | Open the **Analytics** tab. The **Backups** strip shows the last 8 backup runs (status, file name, size, duration, relative time). |
| 2 | To run an immediate backup: click **Run backup now** (POST `/api/admin/backups` — admin-gated). The file lands in `data/backups/` locally AND in the Google Drive folder when `GOOGLE_DRIVE_FOLDER_ID` is configured. |
| 3 | To restore from a Drive backup: open the Drive folder, download the `okomba-db-YYYY-MM-DD_HH-MM-SS.db` file you want. |
| 4 | On Render: put the app in maintenance mode (Settings → Suspend web service). |
| 5 | Open the web service Shell. Stop the running server (`pkill -f standalone` or restart with a different startCommand). |
| 6 | Replace the live DB: `cp /path/to/downloaded.db /data/dev.db` (the `DATABASE_URL` points at `file:/data/dev.db` per `render.yaml`). |
| 7 | Re-run migrations if needed: `npx prisma db push --skip-generate --accept-data-loss`. |
| 8 | Resume the web service (Settings → Resume). Verify with `curl https://okomba.com/api/health` → `{"ok":true,…}`. |
| 9 | The 14-day local rotation under `data/backups/` is the fast-restore option when Drive is unreachable. Use the same Shell-copy flow with a local file name. |
| 10 | Backups run automatically every day at 02:00 WAT (`BACKUP_CRON_EXPR=0 2 * * *`). Verify the last run is <24h old in the Analytics strip; if it's older, check `BACKUP_CRON_ENABLED` and the WhatsApp service status (cron runs in the Next.js process). |

## Non-negotiables (Stage 9 additions)

15. **Production separation** — the live DB must never be polluted with test inquiries, draft proposals, or seeded analytics events. Run `bun run scripts/wipe-test-data.ts` BEFORE the first real customer is sent a proposal; never run it on a production DB with real customers. The first invoice after wipe is `INV-{year}-0001`.
16. **LIVE mode is a one-way switch** — once Paystack is switched to LIVE and `PAYSTACK_SECRET_KEY` is `sk_live_*`, test cards stop working and real money moves. Verify the webhook URL (`https://okomba.com/api/paystack/webhook`) returns 200 BEFORE switching; verify the first ₦50 test charge clears before bulk-sending proposals.
17. **Backup retention ≥ 14 days** — the local rotation must keep at least 14 daily snapshots; the Google Drive target keeps them indefinitely (no auto-purge). Never delete a backup file older than the last `charge.success` you might need to reconcile.
