# Okomba Analytics — Workflow Map

Preservation-first documentation of every user-facing workflow in the application.
The presentation layer (UI) may evolve; these contracts must keep working.

Last audited: after the Termii-inspired rebuild + GitHub push.

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
| **Tabs** | Overview (KPIs) · Inquiries · Subscribers · Posts · Testimonials · Email log |
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
