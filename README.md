# Okomba Analytics V2 — Runbook

> **We build digital systems.** Web applications, payment integrations, automation, data solutions — one team from idea to launch and beyond.

Production-ready, fully-featured SaaS-style platform. Modules 1–8 E2E verified. Stage 9 launch-hardened.

## What this is

A single-page marketing site + admin portal + AI service finder + proposal-to-cash pipeline + client portal + analytics dashboard, deployed as a full-stack Next.js 16 app on Render with persistent SQLite.

**Full funnel**: Visitor → AI chat (utm-tagged) → email lead → admin draft → send INV (Cloudinary PDF + portal link + WhatsApp link) → customer opens `/portal/{token}` → DVA copy + PDF download + "I've Paid" proof → admin alerted → Paystack webhook → receipt PDF + AI thank-you → Analytics dashboard reflects every step.

## Stack

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui conventions (New York style)
- **Database**: Prisma ORM + SQLite (persistent Render disk)
- **Fonts**: Space Grotesk (display) · Inter (body) · JetBrains Mono (labels)
- **AI**: z-ai-web-dev-sdk (LLM chat + service recommendations)
- **Payments**: Paystack (Dedicated Virtual Accounts + webhook)
- **Storage**: Cloudinary (proposal PDFs, raw resource)
- **Backups**: hand-rolled Google Drive JWT + Drive v3 (daily 02:00 WAT)
- **Analytics**: GA4 (mirror) + first-party `AnalyticsEvent` table (source of truth)
- **WhatsApp**: whatsapp-web.js mini-service (Express :3004 + socket.io :3005)

## Features

### Public site (`/`)

- **Hero** — animated typing headline, live-UI cards cycling real service workflows
- **Service Explorer** — BUILD / DATA / AUTOMATE / CONNECT pillars, each with a live mini product-UI
- **AI Service Finder** (W11) — floating "Talk through your ideas" widget, qualifies leads in ≤3 messages, captures email → auto-drafts a proposal
- **Insights** (blog) — Markdown CMS, double-opt-in subscribers, publish → email blast
- **Testimonials, newsletter, contact** — all DB-driven

### Admin portal (`/#/admin`)

Env-credential login → 9-tab management dashboard:

| Tab | Purpose |
|---|---|
| **Overview** | KPIs + activity streams |
| **Inquiries** | Status pipeline (new → contacted → in_progress → closed) + "Create proposal" |
| **Proposals** | Invoices (draft/sent/paid/overdue) + AI chat drafts strip + "Run reminders" + "Copy portal link" |
| **Payments** | Paystack webhook log + paid invoices + kickoff schedule + "Fire test webhook" |
| **WhatsApp** | Chat inbox + composer + QR modal + reconnect flush |
| **Posts** | Blog CMS (Markdown editor, tags, drafts, publish → email blast) |
| **Testimonials** | Create/edit/publish/delete with star picker + live preview |
| **Analytics** | KPIs (Revenue MTD, Paid count, AI conversion %, Avg deal) + 90-day SVG chart + Revenue-by-Service table + funnel strip + backups strip + "Run backup now" |
| **Email log** | Full audit trail of every automated email + `system.alert` alerts |

### Client portal (`/portal/{secureToken}`) — W13

Auth-free (192-bit token IS the access). Mobile-first 375px, branded Ink + Honey-Gold:

- Ink cover with "Prepared for {name}" + status pill (PAID/overdue)
- Gold-accented TOTAL DUE card
- DVA box with 1-click clipboard copy
- Vertical timeline stepper
- Scope & deliverables cards
- Sticky actions row: Download PDF (Cloudinary redirect or deterministic regeneration) + "I've Paid" proof upload
- GA4 events: `portal_visit`, `proposal_view`, `pdf_download`, `payment_click`

## Quickstart (local dev)

```bash
# 1. Install dependencies
bun install

# 2. Configure environment
cp .env.example .env
# Edit .env: set ADMIN_EMAIL + ADMIN_PASSWORD (required in production)

# 3. Push the database schema
bun run db:push

# 4. Seed initial content (3 testimonials, 5 posts)
bun run scripts/seed-testimonials.ts

# 5. Start the dev server
bun run dev
```

Open `http://localhost:3000` (admin at `/#/admin`).

> **Note** — for the WhatsApp widget to dispatch in real mode, also start the mini-service: `cd mini-services/whatsapp-service && bun run dev` (Express :3004 + socket.io :3005). In demo mode it accepts messages without sending.

## Production deployment (Render)

The repo ships a `render.yaml` blueprint with two services (web + whatsapp). See **`docs/RUNBOOK.md`** for the full launch checklist.

### Fast path

1. **Render Dashboard → New → Blueprint → select this repo.** Both services deploy. The web service auto-runs `prisma db push` + `seed-testimonials` on boot.
2. **Set the secrets** in Render → Environment (see `render.yaml` for the full list — `sync: false` keys are secrets):
   - `ADMIN_EMAIL` + `ADMIN_PASSWORD` (login identity)
   - `WHATSAPP_INTERNAL_TOKEN` (shared secret between web + whatsapp services — set BOTH to the same value)
   - `PAYSTACK_SECRET_KEY` + `PAYSTACK_PUBLIC_KEY` + `PAYSTACK_WEBHOOK_SECRET` (LIVE mode keys)
   - `CLOUDINARY_URL` (proposal PDF storage)
   - `GOOGLE_SERVICE_ACCOUNT_JSON` + `GOOGLE_DRIVE_FOLDER_ID` (daily backups)
   - `NEXT_PUBLIC_GA4_MEASUREMENT_ID` (GA4 property ID)
   - `NOTIFY_WEBHOOK_URL` (Google Apps Script Web App URL — outbound email pipeline)
3. **Add the custom domain** (Settings → Custom Domains → `okomba.com` + `www.okomba.com`). Render issues free Let's Encrypt SSL automatically.
4. **Verify the launch** — see `docs/RUNBOOK.md` § Launch checklist.

### Required env vars (production)

| Var | Purpose | Default in dev |
|---|---|---|
| `DATABASE_URL` | SQLite path | `file:/home/z/my-project/db/custom.db` |
| `ADMIN_EMAIL` | Login + alert recipient | dev default `admin@okomba.com` (503 in prod if unset) |
| `ADMIN_PASSWORD` | Login | dev default `okomba-admin-2025` (503 in prod if unset) |
| `NEXT_PUBLIC_SITE_URL` | Public host for links | `https://www.okomba.com` |
| `PORTAL_BASE_URL` | Public host for `/portal/{token}` | `https://app.okomba.com` |
| `PAYSTACK_SECRET_KEY` | DVA + webhook signing | unset → sandbox DVA fallback |
| `PAYSTACK_PUBLIC_KEY` | Frontend Paystack inline | unset |
| `PAYSTACK_WEBHOOK_SECRET` | Webhook signature verify | falls back to `PAYSTACK_SECRET_KEY` |
| `CLOUDINARY_URL` | PDF storage | unset → local fallback + admin alert |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Drive backup auth | unset → local rotation + admin alert |
| `GOOGLE_DRIVE_FOLDER_ID` | Drive target folder | unset → local rotation |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4 property ID | unset → first-party table only |
| `NOTIFY_WEBHOOK_URL` | Email pipeline (GAS Web App) | unset → log-only |
| `WHATSAPP_SERVICE_URL` | Mini-service internal URL | `http://localhost:3004` |
| `WHATSAPP_INTERNAL_TOKEN` | Service-to-service secret | unset → no auth header |
| `BACKUP_CRON_ENABLED` | Daily 02:00 WAT backup | `true` |
| `REMINDER_CRON_ENABLED` | Daily 09:00 WAT reminders | `true` |

> See `.env.example` for the complete annotated list, and `docs/RUNBOOK.md` for the launch-day runbook.

## Project structure

```
src/
  app/                          # App Router: page.tsx, layout.tsx, API routes
    api/                        # inquiries, posts, subscribers, testimonials, admin/*, portal/*, analytics/track, paystack/webhook, ai/chat, health
    portal/[secureToken]/       # Real Next route for production domain
  components/
    site/                       # Marketing sections + admin portal (9 tabs)
      admin/                    # overview, inquiries, proposals, payments, whatsapp, posts, testimonials, analytics, email-log
    portal/                     # ClientPortal (mobile-first 375px)
  lib/                          # brand, content, db, notify, cloudinary, backup, portal, analytics, analytics-server, cron, invoice-service, reminders, whatsapp, brand
prisma/                         # schema.prisma (13 models)
mini-services/whatsapp-service/ # Express :3004 + socket.io :3005
scripts/                        # seed-*, wipe-test-data, backfill-portal-tokens, generate-portal-pdfs
docs/                           # WORKFLOWS.md, DEPLOYMENT.md, RUNBOOK.md
Google-apps-script/             # Code.gs Web App for outbound email
render.yaml                     # Render blueprint (web + whatsapp)
```

## Daily operations

See **`docs/WORKFLOWS.md` W16** for the four daily SOPs:

- **W16.1** — How to send a proposal (Inquiries → Create proposal → send pipeline)
- **W16.2** — How to check payments (Payments tab → webhook log → reconciliation)
- **W16.3** — How to scan the WhatsApp QR if disconnected
- **W16.4** — How to restore from a Drive backup

## Architecture decisions

- **No external DB** — SQLite on a persistent Render disk. Sufficient for the volume (one founder, hundreds of invoices/year). Migrating to Postgres is a `schema.prisma` one-liner if needed.
- **Auth-free portal** — the 192-bit `secureToken` IS the access control. No login, no session, no expiry. Rotating a token invalidates the previous link instantly.
- **Cloudinary-first PDF storage** — every proposal PDF is uploaded to `okomba/proposals/{invoiceNumber}.pdf` (raw resource, overwrite). Portal downloads 302-redirect to Cloudinary with `fl_attachment` (cached, fast). Local fallback + admin alert if Cloudinary fails — the pipeline never breaks.
- **First-party analytics** — `AnalyticsEvent` table is the source of truth. GA4 is a mirror via `dataLayer`/`gtag`. The dashboard renders real data with zero third-party config (works in the sandbox with no GA4 / Cloudinary / Drive creds).
- **Hand-rolled Google Drive backup** — no `googleapis` dependency. RSA-SHA256 JWT + Drive v3 media upload + PATCH metadata. Daily 02:00 WAT, 14-day local rotation fallback.
- **WhatsApp link-mode** — when a Cloudinary URL exists, the WhatsApp message is sent as caption + link text (no base64 bytes travel to the mini-service). Local fallback keeps the base64 attachment.

## Non-negotiables

The 17 contracts that must keep working through any future change — see `docs/WORKFLOWS.md` § Non-negotiables. Highlights:

1. `#/admin` hash route must keep working (bookmarked by the owner).
2. The client portal token (`Invoice.secureToken`) is the ONLY access control — never weaken the 192-bit entropy.
3. Cloudinary failure must NEVER break the send pipeline.
4. `charge.success` must always: flip status → stop reminders → thank-you email + WhatsApp with receipt PDF → schedule the +24h kickoff.
5. The AI chat NEVER mentions price.
6. `AnalyticsEvent` is the source of truth; GA4 is a mirror.
7. LIVE Paystack mode is a one-way switch — verify webhook 200 before switching.
8. Backup retention ≥ 14 days.

## Documentation index

- **`docs/WORKFLOWS.md`** — every workflow contract (W1–W16) + 17 non-negotiables
- **`docs/DEPLOYMENT.md`** — Render/Docker/Domain-SSL deployment guide
- **`docs/RUNBOOK.md`** — Stage-9 launch-day runbook (env checklist, UptimeRobot, Paystack LIVE, GA4 verify, restore-from-backup SOP)

## Legacy

The original Vite/React implementation is preserved on the [`legacy/original-vite-app`](https://github.com/ifeanyiokomba/okomba-analytics/tree/legacy/original-vite-app) branch.
