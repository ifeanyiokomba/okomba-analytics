# Okomba Analytics — Official Website

Premium, modern, highly interactive digital-services platform. Termii-level product design quality with Okomba Analytics identity, services, and business model.

> **We build digital systems.** Web applications, payment integrations, automation, data solutions — one team from idea to launch and beyond.

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui conventions
- **Database:** Prisma ORM (SQLite) — inquiries, subscribers, posts, testimonials, email audit log
- **Fonts:** Space Grotesk (display) · Inter (body) · JetBrains Mono (labels)
- **Motion:** Unified motion system (micro/standard/dramatic tokens), scroll reveals, count-up proof metrics, live-UI product demonstrations

## Features

### Marketing site (single-page story)
- **Hero** — animated typing headline, live-UI cards cycling through real service workflows (deploy pipeline with `Designed → Built → Tested → LIVE` badges), metrics pill, micro-trust line
- **Problem-first narrative** — 6 struggle cards → "We build the systems that bring everything together."
- **Service Explorer** — interactive BUILD / DATA / AUTOMATE / CONNECT pillars, each with a live mini product-UI
- **Delivery pipeline** — auto-advancing 7-step workflow (Idea → … → Launch) with realistic stage cards
- **Data experience** — self-drawing charts, count-up KPIs, hover crosshair
- **Tech architecture** — 5 connected layers with animated data-flow links
- **Case studies** — Problem → Approach → Result framing with live product previews
- **Process timeline** — scroll-driven active phase (PHASE 0X/06)
- **Testimonials, insights (blog), newsletter** — all served from the database

### Admin portal (`/#/admin`)
Env-credential login → 6-tab management dashboard:
- **Overview** — KPIs + activity streams
- **Inquiries** — status pipeline, detail dialogs
- **Subscribers** — double-opt-in list, status management, CSV export, broadcasts
- **Posts** — full CMS: Markdown editor (write/preview), tags, drafts, publish → automatic subscriber email blast
- **Testimonials** — create/edit/publish/delete with live preview + star picker
- **Email log** — full audit trail of every automated email

## Getting Started

```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env    # set ADMIN_EMAIL / ADMIN_PASSWORD (required for production)

# Push the database schema
bun run db:push

# Seed initial content (3 testimonials)
bun run scripts/seed-testimonials.ts

# Start the dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). The admin portal lives at `/#/admin`.

## Project Structure

```
src/
  app/               # App Router: page.tsx, API routes (inquiries, posts, subscribers, testimonials, admin/*)
  components/site/   # All marketing sections + admin portal components
  lib/               # Content library, Prisma client, posts/testimonials helpers, admin auth, email notifications
prisma/              # Schema (Inquiry, Subscriber, Post, Testimonial, EmailLog, AdminSession)
public/images/       # Brand assets, project previews, avatars
```

## Deployment Notes

- Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` environment variables — never rely on source defaults in production
- The SQLite database is a local file (`db/custom.db`, git-ignored); run `bun run db:push` on fresh deploys
- All animations respect `prefers-reduced-motion`
- SEO: metadata, Open Graph, sitemap.xml, robots.txt included

## Legacy

The original Vite/React implementation is preserved on the [`legacy/original-vite-app`](https://github.com/ifeanyiokomba/okomba-analytics/tree/legacy/original-vite-app) branch.
