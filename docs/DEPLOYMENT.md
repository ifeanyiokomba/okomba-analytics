# Okomba Analytics — Deployment Guide

## Why the Cloudflare Pages deploy failed

Your build log shows the Next.js production build **succeeded** (all 20 routes
compiled). It failed at the very last step:

```
Error: Output directory "dist" not found.
```

Two separate things are going on:

1. **Immediate cause** — the Cloudflare Pages project was created for the
   original Vite app, which produced static files in `dist/`. The project
   setting still points there. The Next.js app has no `dist/`.

2. **Root cause (the important one)** — this application is now **full-stack**.
   `next.config.ts` uses `output: "standalone"`, which builds a Node.js
   **server** plus 17 API routes backed by **Prisma + SQLite**:

   - `POST /api/inquiries` — project inquiries
   - `POST /api/subscribe` + confirm/unsubscribe — newsletter double-opt-in
   - `GET /api/posts`, `/api/testimonials` — CMS content
   - `/api/admin/*` — the entire admin portal (auth + CMS)

   Cloudflare Pages is **static hosting** — it can serve files, but it cannot
   run a Node.js server or a SQLite database file. Changing the output
   directory setting will not fix this; the workflows (inquiries, newsletter,
   admin CMS) would simply 404.

> The marketing UI you saw in the sandbox is 100% intact — it just needs a
> host that can run Node.js.

---

## Recommended: Render (fastest path, ~10 minutes)

`render.yaml` in this repo is a ready Blueprint.

1. Create a free account at [render.com](https://render.com)
2. Dashboard → **New → Blueprint** → select this repository
3. Render reads `render.yaml` and provisions:
   - Node web service (auto-deploys on every `git push`)
   - **1 GB persistent disk** at `/data` for the SQLite database
   - Health check on `/api`
4. After the first deploy: open the service → **Environment** → set:
   - `ADMIN_EMAIL` — your admin login email
   - `ADMIN_PASSWORD` — a strong password
   (The app refuses admin logins in production until these are set.)
5. Add your custom domain in **Settings → Custom Domains**.

The database is initialized and seeded automatically on boot
(`prisma db push` + idempotent testimonial seed) — zero manual steps.

---

## Alternative: Docker (any VPS, Fly.io, Railway, etc.)

```bash
docker build -t okomba-analytics .

docker run -d --name okomba \
  -p 3000:3000 \
  -v okomba-data:/data \
  -e ADMIN_EMAIL=you@example.com \
  -e ADMIN_PASSWORD='a-strong-secret' \
  --restart unless-stopped \
  okomba-analytics
```

The entrypoint applies the DB schema, seeds content, and starts the server on
port 3000. Put a reverse proxy (Caddy/Nginx) or a platform edge (Fly.io) in
front for TLS.

Railway: create a project from the repo — it auto-detects the Dockerfile.
Fly.io: `fly launch` (detects Dockerfile) — attach a volume for `/data`.

---

## If Cloudflare is a hard requirement

Two honest options, in order of effort:

### Option A — Keep Cloudflare for the domain, proxy to a Node host
Point the DNS at Render/Railway/VPS (orange-cloud proxy works fine).
This is zero code change and keeps Cloudflare's CDN/SSL in front.
**This is the pragmatic choice.**

### Option B — Full Cloudflare native (significant migration)
Running on Cloudflare Workers requires:
- `@opennextjs/cloudflare` adapter for the Next.js server
- **Migrating SQLite → Cloudflare D1** (Prisma driver adapter)
- Re-testing every workflow on the Workers runtime

Happy to scope this as a follow-up project, but it is not a config flip —
it is a database migration with regression testing across all 7 workflows
(see `docs/WORKFLOWS.md`).

---

## Required environment variables (production)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite path. Use a **persistent volume**: `file:/data/custom.db` |
| `ADMIN_EMAIL` | Admin portal login email (**required in production**) |
| `ADMIN_PASSWORD` | Admin portal password (**required in production**) |
| `HOSTNAME` | `0.0.0.0` (bind correctly on containers) |
| `NODE_ENV` | `production` (set automatically by most hosts) |

Without `ADMIN_EMAIL`/`ADMIN_PASSWORD`, the admin login returns **503 with a
clear message** — the public site works, the portal stays locked. This is an
intentional safety gate (the source repo is public).

---

## Phase 2 · Module 4 — AI Proposal Sender (invoices)

The admin portal now turns any inquiry into a branded proposal + invoice in
three steps: **AI draft → commercial terms → send**. On send, the system
creates the invoice (`INV-YYYY-NNNN`), generates a Paystack Dedicated Virtual
Account, builds a branded PDF (Ink + Honey Gold), emails it as an
**attachment** (subject: `Your Proposal from Okomba Analytics - Invoice
#INV-xxxx`), schedules payment reminders, and queues the WhatsApp caption
`Hi {name}, here is your proposal and invoice from Okomba Analytics`.

| Variable | Purpose |
|---|---|
| `PAYSTACK_SECRET_KEY` | Live DVA creation. **Unset = sandbox DVA** (clearly labelled "Paystack Test Bank (Sandbox)") so the whole pipeline still works pre-launch. Keys: dashboard.paystack.com → Settings → API Keys. |
| `WHATSAPP_SERVICE_URL` | Optional. The WhatsApp mini-service (Module 6) — when set, proposal captions dispatch immediately instead of staying queued. |

Notes:

- **The AI never writes pricing.** Drafts are generated server-side
  (z-ai SDK) with price-leak scrubbing; the admin sets the amount separately.
- The emailed PDF is the only invoice artifact — no Cloudinary needed. The
  admin can re-download the exact PDF any time from the Proposals tab
  (`/api/admin/invoices/[id]/pdf`).
- Google Apps Script v3 `sendInvoiceEmail` action delivers the email with
  the base64 PDF via `MailApp` — no links, per spec.
- Fonts: `public/fonts/NotoSans-*.ttf` ships with the repo (₦ naira glyph
  support in PDFs). The generator falls back to Helvetica + "NGN" if absent.

---

## Post-deploy checklist

- [ ] Visit `/` — hero animations, all 16 sections render
- [ ] Submit a test inquiry → check it appears at `/#/admin` → delete it
- [ ] Subscribe with a test email → confirm the double-opt-in flow
- [ ] Log into `/#/admin` with the env credentials
- [ ] Posts + Testimonials tabs show seeded content
- [ ] Set a real admin password and remove test data

---

## Troubleshooting: "I retried Cloudflare and it failed again"

**Check the commit hash in the first lines of the build log.** If it says:

```
HEAD is now at 221a134 …
```

…you clicked **Retry** on an *old* deployment. Retry re-runs the original
commit — it never picks up newer pushes. The deployment kit (`381f4ad` and
later) was never in that build. Verify the latest commit before drawing
conclusions:

```bash
git ls-remote https://github.com/ifeanyiokomba/okomba-analytics.git main
```

**Important though:** even deploying the *latest* commit to Cloudflare Pages
will still fail with `Output directory "dist" not found` — and if it were
pointed at `.next/standalone` it would deploy a server Pages cannot execute.
This is not fixable by more pushes. Retire the Pages project (Settings →
Delete project, or just stop deploying to it) and use a Node host as above.

---

## Email notifications — Google Apps Script (your original pattern, extended)

The original site sent inquiry emails through a Google Apps Script webhook
(Google Sheets + Gmail). That pattern is **preserved and extended** to every
notification the new system generates:

| Notification | Trigger | What the script does |
|---|---|---|
| `inquiry.created` (admin copy) | Inquiry form submitted | Saves row to **Google Sheets** + emails you the alert |
| `inquiry.created` (submitter copy) | " | Emails the client a confirmation receipt |
| `subscriber.welcome` | Newsletter signup | Emails the **double-opt-in confirmation link** |
| `post.published` | You publish a post | Emails every confirmed subscriber |
| `broadcast` | Admin → Compose broadcast | Emails your free-form message to subscribers |

Every notification is **also recorded in the admin Email log** regardless —
the webhook only adds physical delivery.

### Setup (15 minutes, one time)

1. Open [script.google.com](https://script.google.com) → New project → name it **Okomba Webhook**
2. Paste the contents of **`Google-apps-script/Code.gs`** (in this repo) into the editor
3. Fill the `CONFIG` block: your Google Sheet ID, admin email, site URL
4. Run the `testWebhook` function once → authorize Gmail/Sheets access when prompted
5. **Deploy → New deployment → Web app** — "Execute as: Me", "Who has access: Anyone"
6. Copy the Web App URL
7. On Render (or any host) set the environment variable:

   ```
   NOTIFY_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

8. Redeploy. Test by submitting an inquiry — you should get the admin alert
   and the row should appear in your Google Sheet.

**Without the webhook**, the site still works perfectly — inquiries and
subscribers are saved to the database and visible in the admin portal, and
the Email log shows exactly what *would* have been sent. The webhook simply
turns the log into real Gmail delivery, using your existing Google stack.

> Gmail quota: Apps Script allows ~100 recipient emails/day on free accounts
> (1,500 on Workspace). That comfortably covers a growing subscriber list
> for a long time.

---

## Anti-sleep & uptime monitoring (Phase 1)

Two complementary layers keep the free-tier instance warm and monitored:

**1. Built-in self-ping (node-cron)** — set these env vars on your host:

```
CRON_SELF_PING_ENABLED=true
SELF_PING_URL=https://your-site.onrender.com   # public URL
# CRON_SELF_PING_EXPR=0 */9 * * * *            # default: every 9 min
```

The server pings its own `/api/health` every 9 minutes (no DB touch,
instant 200). Verify registration in the host logs: `[cron] anti-sleep
self-ping scheduled`.

**2. UptimeRobot (external, recommended belt-and-braces)**

1. Create a free account at [uptimerobot.com](https://uptimerobot.com)
2. Add New Monitor → **HTTP(s)**
3. URL: `https://your-site.onrender.com/api/health`
4. Monitoring interval: **5 minutes**
5. Alert contact: your email

UptimeRobot's 5-minute pings also keep the instance awake, and alert you
if the site ever goes down (the self-ping alone can't do that).

---

## Testing the Google Apps Script engine (Postman)

After deploying `Google-apps-script/Code.gs` as a Web App (setup in the
email section above), verify each action with Postman:

**sendInvoiceEmail — branded HTML + PDF attached (no links):**

```json
POST https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
Content-Type: application/json

{
  "action": "sendInvoiceEmail",
  "to": "your-email@example.com",
  "subject": "Invoice OKO-2026-0001",
  "body": "Your invoice is attached.",
  "html": "<p>Your <b>invoice</b> is attached.</p>",
  "base64Pdf": "JVBERi0xLjQK...",   // base64 of any PDF
  "filename": "Okomba_Invoice_OKO-2026-0001.pdf",
  "invoiceSummary": {
    "invoiceNumber": "OKO-2026-0001",
    "customerName": "Test Client",
    "service": "Web Development",
    "amount": "₦250,000",
    "dueDate": "in 14 days"
  }
}
```

Expect `{"success":true}`, an email with the branded template + PDF
attached, and a new row in the **Invoices** tab of your Google Sheet.

**backupToSheet — generic Sheets backup:**

```json
{ "action": "backupToSheet", "tab": "Leads", "data": [{ "Name": "Test", "Email": "t@e.com" }] }
```

Tip: run `testInvoiceEmail` directly in the Apps Script editor for a
zero-setup PDF attachment check.
