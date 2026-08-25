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

## Post-deploy checklist

- [ ] Visit `/` — hero animations, all 16 sections render
- [ ] Submit a test inquiry → check it appears at `/#/admin` → delete it
- [ ] Subscribe with a test email → confirm the double-opt-in flow
- [ ] Log into `/#/admin` with the env credentials
- [ ] Posts + Testimonials tabs show seeded content
- [ ] Set a real admin password and remove test data
