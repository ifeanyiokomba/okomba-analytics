# Okomba Analytics V2 — Stage 9 Launch Runbook

> The founder's launch-day playbook. Read once before deploy, then keep open in a tab through the first 48 hours. Every step has a verification curl or screenshot at the end.

## 0. Pre-flight checklist (do BEFORE touching Render)

- [ ] Domain `okomba.com` purchased + DNS editable (Namecheap/Cloudflare/GoDaddy).
- [ ] Paystack business account approved for LIVE mode (KYC done).
- [ ] Cloudinary account created (free tier is fine — 25 GB credits/month).
- [ ] Google Cloud project + service account created (free).
- [ ] Google Apps Script Web App deployed (see `Google-apps-script/Code.gs`).
- [ ] GA4 property created at https://analytics.google.com.
- [ ] UptimeRobot account created (free tier).
- [ ] Render account + GitHub repo connected.

---

## 1. First deploy (Render Blueprint)

1. Render Dashboard → New → Blueprint → select this repo.
2. Both services (`okomba-analytics` + `okomba-whatsapp`) deploy. The web service auto-runs `prisma db push --skip-generate --accept-data-loss` + `node scripts/seed-testimonials.mjs` on boot.
3. Wait for the deploy to finish. The preview URL is `https://okomba-analytics.onrender.com` (or whatever Render assigns).
4. **Verify**: `curl https://okomba-analytics.onrender.com/api/health` → `{"ok":true,"service":"okomba-analytics","time":"…"}`.

> If `seed-testimonials.mjs` fails on boot (race condition with disk mount), SSH into the shell and run it manually: `node scripts/seed-testimonials.mjs`.

## 2. Set the secrets (Render → Environment)

For BOTH services, set every `sync: false` env var from `render.yaml`. Use the production values (no `sk_test_`, no `G-XXXX` placeholders):

| Key | Value | Service |
|---|---|---|
| `ADMIN_EMAIL` | `founder@okomba.com` (or your preferred) | web only |
| `ADMIN_PASSWORD` | 32-char strong secret (use a password manager) | web only |
| `WHATSAPP_INTERNAL_TOKEN` | 32-char shared secret (generate with `openssl rand -hex 16`) | BOTH (must match) |
| `PAYSTACK_SECRET_KEY` | `sk_live_…` (Paystack dashboard → Settings → API & Webhooks → LIVE tab) | web only |
| `PAYSTACK_PUBLIC_KEY` | `pk_live_…` | web only |
| `PAYSTACK_WEBHOOK_SECRET` | same value as `PAYSTACK_SECRET_KEY` | web only |
| `CLOUDINARY_URL` | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` | web only |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | full JSON (single line, escape quotes) OR use `GOOGLE_SERVICE_ACCOUNT_B64` | web only |
| `GOOGLE_DRIVE_FOLDER_ID` | the Drive folder ID (share with the service account email as Editor) | web only |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | `G-XXXXXXXXXX` | web only |
| `NOTIFY_WEBHOOK_URL` | `https://script.google.com/macros/s/…/exec` | web only |

Also set the non-secret values:
- `NEXT_PUBLIC_SITE_URL=https://okomba.com`
- `PORTAL_BASE_URL=https://okomba.com`
- `BACKUP_CRON_ENABLED=true` (default)
- `WHATSAPP_SERVICE_URL=http://okomba-whatsapp:3004` (Render internal network)
- `WHATSAPP_MODE=auto` (whatsapp service — `auto` falls back to demo on no-scan)

3. Trigger a redeploy (Settings → Manual Deploy → Clear build cache + deploy).
4. **Verify**: `curl https://okomba-analytics.onrender.com/api/health` returns 200.

## 3. Connect the domain + SSL

1. Render Dashboard → `okomba-analytics` service → Settings → Custom Domains → Add → `okomba.com`.
2. Render shows a CNAME target (e.g. `okomba-analytics.onrender.com.`). Add a CNAME record at your DNS provider:
   - `@` → `okomba-analytics.onrender.com.` (or use ALIAS/ANAME if your DNS supports it)
   - `www` → `okomba-analytics.onrender.com.` (CNAME)
3. Add `www.okomba.com` as a second custom domain in Render.
4. Render issues free Let's Encrypt SSL automatically (status flips to `Verified` within ~5 min of DNS propagation).
5. **Verify**: `curl -I https://okomba.com/api/health` → 200 + `server: cloudflare`/`server: render`/TLS 1.3. Open `https://okomba.com` in a browser → padlock icon → certificate valid.
6. **Screenshot**: 📸 Live site on `okomba.com` with SSL padlock — **DELIVERY PROOF #1**.

## 4. Paystack → LIVE mode + webhook URL

1. Paystack Dashboard → Settings → Webhooks → Add endpoint:
   - URL: `https://okomba.com/api/paystack/webhook`
   - Events: `charge.success`, `transfer.success`
   - Mode: **LIVE**
2. Paystack Dashboard → Settings → API & Webhooks → API Keys → LIVE tab → copy `sk_live_…` and `pk_live_…`.
3. Set those keys in Render (already done in step 2 — verify they're `sk_live_*` not `sk_test_*`).
4. **Verify**: trigger a ₦100 test charge with a real card. The webhook fires → `EmailLog` gets a `charge.success` row → the invoice flips to `paid` → receipt email dispatched.
5. **Screenshot**: 📸 Paystack dashboard → Webhooks page showing the live URL + 200 response — **DELIVERY PROOF #2**.

> **LIVE mode is a one-way switch** (non-negotiable #16). Once switched, test cards stop working. Verify the webhook URL returns 200 BEFORE switching; verify the first ₦50 test charge clears BEFORE bulk-sending proposals.

## 5. UptimeRobot monitoring

1. UptimeRobot Dashboard → Add Monitor → HTTP(s).
2. Friendly name: `Okomba Analytics`.
3. URL: `https://okomba.com/api/health`.
4. Monitoring interval: `5 minutes`.
5. Alert contact: your email + WhatsApp (via integration).
6. **Verify**: wait 5 min → status flips to `Up`. The monitor pings `/api/health` every 5 min — this also keeps the Render free-tier web service warm (no cold-start delay).

> `/api/health` is dependency-free (no DB, no auth) — returns instant 200. Adding a DB touch would risk false-negatives on transient slowness.

## 6. GA4 verification

1. `https://analytics.google.com` → your property (`G-XXXXXXXXXX`).
2. Realtime report → open `https://okomba.com` in an incognito tab → confirm 1 visitor shows up within ~30s.
3. Click the AI widget "Talk through your ideas" → send a message → confirm `ai_chat_start` appears in Events (may take 5–10 min for non-realtime events).
4. Open a portal link in incognito → confirm `portal_visit` + `proposal_view` events fire.
5. Click "Download proposal PDF" → confirm `pdf_download` fires.
6. **Screenshot**: 📸 GA4 Realtime report showing ≥1 visitor — **DELIVERY PROOF #3**.

> The first-party `AnalyticsEvent` table is the source of truth. GA4 is a mirror. The Admin Analytics dashboard at `/#/admin` → Analytics tab renders real data with or without GA4 configured.

## 7. Data wipe + seed (BEFORE first real customer)

> **⚠️ This step deletes all test data. Do it ONCE, after deploy + domain + Paystack LIVE are verified, and BEFORE you send the first real proposal.**

```bash
# SSH into the Render web service Shell, OR run locally against a prod-mirror DB:
bun run scripts/wipe-test-data.ts --force
```

What gets deleted: every test `Invoice`, `Inquiry`, `DraftProposal`, `ReceivedEmail`, `EventRecord`, `WhatsAppMessage`, `WebhookLog`, `EmailLog`, `AnalyticsEvent`, `BackupLog`, `AdminSession`. Plus local PDFs (`data/uploads/proposals/*`), proofs (`data/uploads/proofs/*`), and backups (`data/backups/*`).

What is KEPT: `Post` (blog), `Testimonial`, `Subscriber` (newsletter). Services + Portfolio + Email Templates are code, never DB.

After wipe:
- The invoice counter is reset → the next `nextInvoiceNumber()` returns `INV-{year}-0001`.
- Admin login requires fresh credentials (`AdminSession` wiped) — log in with the production `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- The Admin dashboard renders empty (KPIs all 0, no chart data, no funnel events). This is correct — production starts on a clean slate.

## 8. WhatsApp QR scan

1. Login at `https://okomba.com/#/admin`.
2. Open the **WhatsApp** tab. Status badge: `Disconnected` (red).
3. Click **Show QR code**. A real WhatsApp QR renders (refreshes every ~30s).
4. Open WhatsApp on the production phone → Settings → Linked Devices → Link a device → scan the QR.
5. Within ~10s the badge flips to `Connected` (green). The mini-service POSTs `/api/whatsapp/service-event` → the main app flushes the queued outbound messages (none on a fresh wipe, but the flush path is exercised).
6. **Verify**: send a test WhatsApp to the production number from your personal phone → the message appears in the admin inbox within 10s (socket.io push) or 20s (polling fallback).

> The session persists across deploys/restarts (dedicated `okomba-whatsapp-session` disk). Re-scan only if the linked device is removed or the session disk is wiped.

## 9. First real proposal (smoke test)

1. Submit a real inquiry via the public site (`/` → "Get Started" → form) OR via the AI chat widget.
2. Login → Inquiries tab → find the inquiry → "Create proposal" → set amount + duration → "Send proposal".
3. **Verify**:
   - The customer receives the branded email with the PDF attached + a "View your proposal online" CTA.
   - The customer receives a WhatsApp caption with the Cloudinary PDF link.
   - The proposal appears in the Proposals tab with status `sent`.
   - The "Copy portal link" button on the row copies `https://okomba.com/portal/{token}` (or `/#/portal/{token}` if accessed via the hash route in the admin preview).
4. Open the portal link in an incognito tab → confirm the proposal renders (cover, total due, DVA, timeline, scope, actions).
5. Click "Download proposal PDF" → the file downloads (`Okomba_Proposal_INV-YYYY-0001.pdf`).
6. Click "I've Paid" → upload a payment proof image → confirm the success card renders + a `system.alert` email lands in `ADMIN_EMAIL`.
7. Pay the real amount to the Paystack DVA → within ~60s the webhook fires → the invoice flips to `paid` → receipt email dispatched → reminders stopped.
8. **Video**: 📹 Full customer journey on live domain (Chat → Proposal → Portal → Pay) — **DELIVERY PROOF #4**. Use Loom (2 min walkthrough).

## 10. Google Drive backup verification

1. After the first 02:00 WAT cron runs (next day), open the Analytics tab → Backups strip.
2. The last backup row shows: `success`, file name `okomba-db-YYYY-MM-DD_HH-MM-SS.db`, size, duration.
3. Open the Drive folder (`GOOGLE_DRIVE_FOLDER_ID`) → confirm the `okomba-db-…db` file is present.
4. Click "Run backup now" → confirm a fresh backup row appears + the new file shows in Drive within ~10s.
5. **Screenshot**: 📸 Google Drive folder with the latest backup file — **DELIVERY PROOF #5**.

> If Drive is unconfigured, the Backups strip shows `LOCAL ONLY · DRIVE NOT CONFIGURED` (red pill) and a `system.alert` email fires. Local rotation keeps 14 daily snapshots under `data/backups/`. Set the Drive creds in Render → Environment + redeploy to enable Drive.

## 11. Final delivery

- [ ] 📸 Live site on `okomba.com` with SSL padlock (step 3)
- [ ] 📸 Paystack dashboard showing LIVE mode + webhook 200 (step 4)
- [ ] 📸 GA4 Realtime showing 1 visitor (step 6)
- [ ] 📹 Full customer journey on live domain: Chat → Proposal → Portal → Pay (step 9)
- [ ] 📸 Google Drive with latest backup file (step 10)
- [ ] 📦 ZIP of docs (`docs/` folder) + 2-min Loom walkthrough for the team

Upload the ZIP + Loom link to the team's shared drive. Schedule a 30-min handover call to walk through W16.1–W16.4 (Daily Ops).

---

## Post-launch monitoring (48h)

1. **Hourly** for the first 4 hours: check UptimeRobot for any downtime alerts. Check the admin Email log for `system.alert` entries (Cloudinary fallbacks, backup failures, payment-proof uploads).
2. **Daily** for the first week:
   - Login → Overview tab → check KPIs are tracking.
   - Analytics tab → confirm events flowing (funnel strip counts incrementing).
   - Payments tab → confirm the webhook log shows `charge.success` events as customers pay.
   - Backups strip → confirm the daily 02:00 WAT run is logging.
3. **The `webDevReview` cron** runs every 15 minutes and independently QAs the site via agent-browser — it'll auto-detect regressions and append findings to `/home/z/my-project/worklog.md`.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/api/health` 502 | Render cold-start or service crashed | Render Dashboard → Logs → check for unhandled exceptions. Trigger manual redeploy. |
| Admin login 503 | `ADMIN_EMAIL` / `ADMIN_PASSWORD` not set in prod | Render → Environment → set both → redeploy. |
| Paystack webhook 401 | Signature mismatch (test secret set on live mode, or vice versa) | Confirm `PAYSTACK_WEBHOOK_SECRET` matches `PAYSTACK_SECRET_KEY` (same mode). |
| Cloudinary fallback email | `CLOUDINARY_URL` unset or invalid | Render → Environment → confirm `cloudinary://KEY:SECRET@CLOUD_NAME` → redeploy. |
| WhatsApp QR won't scan | Stale session on disk | Render → whatsapp service → Shell → `rm -rf data/session/*` → restart → fresh QR. |
| Backup fails with "JWT" error | Service account JSON malformed | Render → Environment → re-paste `GOOGLE_SERVICE_ACCOUNT_JSON` (single line, escaped quotes) OR use `GOOGLE_SERVICE_ACCOUNT_B64`. |
| GA4 events not showing | `NEXT_PUBLIC_GA4_MEASUREMENT_ID` not set, or ad-blocker on the visitor's browser | Confirm the ID in Render; check Realtime in incognito without ad-blocker. |
| Invoice counter starts at 0007 | Pre-wipe test data still in DB | Run `bun run scripts/wipe-test-data.ts --force` → counter resets. |
| Portal 404 | Token rotated or invoice deleted | Admin → Proposals tab → "Generate portal link" (or `?regenerate=1`) → fresh token. |

## Rollback

If a deploy breaks the funnel:
1. Render Dashboard → `okomba-analytics` → Deploys → click the last known-good commit → **Roll back to this deploy**.
2. If the DB is corrupted, restore from the latest `data/backups/*.db` file (or the Drive folder) — see `docs/WORKFLOWS.md` W16.4 for the restore SOP.
3. If Paystack LIVE mode is misbehaving, switch the dashboard back to TEST mode temporarily (this pauses real money flow but keeps the webhook pipeline exercised).
4. Page the founder — the alert contact in UptimeRobot.

## Contacts

- **Founder**: ifeanyiokomba@okomba.com · +234 808 894 8657
- **Support**: support@okomba.com
- **Status page**: UptimeRobot public status page (configure at https://status.uptimerobot.com)
