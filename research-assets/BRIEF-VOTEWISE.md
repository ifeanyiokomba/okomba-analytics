# Votewise — Research Brief (Task 19-A)

> Sourced live from https://votewise.com.ng on 2026-08-28.
> Captured via z-ai web_search + page_reader + agent-browser (DOM eval + screenshots + CSS scrape).
> Every quoted string below is verbatim from the rendered live site.

## 1. Real URL that resolves

- **Primary (works):** `https://votewise.com.ng/` → HTTP 308 redirect → `https://www.votewise.com.ng/`
- The non-www apex (`votewise.com.ng`) 308-redirects to `www.votewise.com.ng` — both work, but `www.` is the canonical.
- `https://votewise.ng` — did NOT resolve.
- The existing Okomba Solutions card link `https://votewise.com.ng` (currently in `src/lib/content.ts` line 334) is correct; the redirect to www will resolve transparently.
- Web search returned ZERO third-party mentions of "Votewise Okomba" or "votewise.com.ng" — the brand is not yet indexed in Google (just launched). Only Okomba's own main site (okomba.com) mentions it.

## 2. Product name as displayed on the site

- `<title>`: **"Votewise — Secure Election Management"**
- `<meta author>`: "Votewise"
- `<meta og:site_name>`: "Votewise"
- Wordmark in nav (top-left): "Votewise" — single word, capital V, lowercase rest
- Footer brand line: **"Votewise — A product of Okomba Analytics"**

## 3. Hero tagline / headline (verbatim)

Three-line hero (eyebrow → H1 → subhead):

**Eyebrow** (three words, separated by emojis per the original — 🗳️ ✓ 🔒 ⚡ 🛡️ 📊 used as decoration above):
> **Secure. Transparent. Trusted.**

**H1 (the actual hero headline):**
> **Election Management Built for Organizations**

## 4. Hero subhead / value-prop (verbatim)

> Run secure, auditable elections for universities, unions, associations and institutions. Voter verification, real-time monitoring and tamper-proof results — all in one platform.

(Meta `description`: "Conduct secure, transparent elections for universities, unions, associations, cooperatives and organizations. Voter verification, real-time monitoring and auditable results.")

## 5. Feature bullets / capabilities (verbatim from the "Why Votewise — Everything an organization needs to run a trusted election" section)

Section subhead: "From voter verification to tamper-proof results, Votewise handles the full lifecycle — so your committee can focus on governance, not logistics."

1. **Tamper-proof ballots** — "Every ballot is sealed with an anonymous token and a verifiable hash. No one — not even admins — can alter a cast vote."
2. **Verified voters only** — "Voters confirm identity with OTP via email or SMS before voting. Duplicate and spoof ballots are stopped at the door."
3. **Live results & analytics** — "Watch turnout, verification rates and results stream in real time. Publish with one click when polls close."
4. **Built for every scale** — "From a 40-person club election to a 50,000-voter faculty vote — Votewise scales without breaking a sweat."
5. **Ballot secrecy by design** — "Votes are dissociated from voter identity the moment they are cast. Receipts verify without revealing choices."
6. **Sub-3-second voting** — "A fast, accessible ballot interface means voters finish in seconds — on any device, even on slow networks."

### Security guarantees (six — from the "Elections you can defend, results nobody can contest" section)

1. **End-to-end verification** — "OTP-based identity confirmation via email or SMS, with attempt limits and lockout protection."
2. **Tamper-proof ballots** — "Anonymous voting tokens plus a cryptographic ballot hash make every vote verifiable and immutable."
3. **Ballot secrecy model** — "Voter identity is dissociated from ballot choices at cast time. Receipts prove participation, never selections."
4. **Full audit trails** — "Every action — from configuration to result publication — is logged and attributable to a named operator."
5. **Adaptive rate limiting** — "OTP, vote and auth endpoints are throttled to stop brute-force, scripting and flooding attacks."
6. **Anti-enumeration** — "Login and verification responses are uniform — attackers cannot probe for valid emails or voter IDs."

### How it works — 4 steps (from "From setup to published results in four steps")

Section subhead: "A guided workflow that takes you from a blank election to an audited, public result — without spreadsheets, paper or disputes."

- **01 Create election** — "Set up your election, positions and candidates in minutes. Import voters from a spreadsheet."
- **02 Verify voters** — "Each voter confirms identity with an OTP. The system blocks duplicates and ineligible voters automatically."
- **03 Cast votes** — "Voters select candidates in a clean, accessible interface and receive a signed receipt they can audit."
- **04 Publish results** — "Results are tallied automatically and tamper-proof. Publish publicly with a verifiable audit trail."

## 6. Who it's for

Explicit "Trusted by organizations of every kind" strip with 8 logos/labels:

1. **Universities & Faculties**
2. **Student Unions**
3. **Professional Associations**
4. **Churches**
5. **Cooperatives & NGOs**
6. **Corporate Organizations**
7. **Clubs & Societies**
8. **Government Institutions**

Pricing tiers reinforce the same audience ladder: Starter (departments, small faculties), Professional (universities, large associations), Enterprise (large institutions & government).

## 7. Design language

### Default mode: LIGHT (`<html>` has no `class` — pure light mode, respects OS but defaults to light)

**Votewise light theme tokens (`:root` block in CSS, ACTIVE on page load):**

| Token | Value (light mode) | Use |
|---|---|---|
| `--background` | `#fafcfe` | Page bg — off-white blue-tinted |
| `--foreground` | `#131922` | Body text — deep navy-black |
| `--card` | `#fff` | Card surface |
| `--primary` | `#2249b7` | Royal blue — buttons, links, accent text |
| `--primary-foreground` | `#fafcff` | Text on primary |
| `--secondary` | `#ebf3fc` | Secondary surfaces (pale blue) |
| `--secondary-foreground` | `#262e3d` | Secondary text |
| `--muted` | `#f0f4f7` | Muted surfaces |
| `--muted-foreground` | `#5e646c` | Muted text |
| `--accent` | `#d2eef0` | Pale cyan accent surface |
| `--accent-foreground` | `#113436` | Deep teal text on accent |
| `--border` | `#dadee3` | Hairline |
| `--input` | `#e1e5ea` | Form input border |
| `--success` | `#359658` | Success green |
| `--warning` | `#e49e22` | Amber/gold |
| `--destructive` | `#df2225` | Red |
| `--chart-1..5` | `#2249b7`, `#00949b`, `#7e4ed7`, `#00a792`, `#df911a` | Royal blue, teal, purple, mint, amber |
| `--radius` | `.625rem` (10px) | Border radius |
| `--sidebar` | `#f6f9fd` | Sidebar (very pale blue) |

There is **no `.dark` block** in Votewise's CSS — the site is light-only.

### Typography

- Primary font: **Geist** (Geist Sans) via `var(--font-geist-sans)`
- Mono: **Geist Mono** (likely used for hashes / receipts / counters)
- Also: `var(--font-serif)` is defined — used somewhere on the site (probably for testimonial pull-quotes or the legal footer to add gravitas)
- Two woff2 fonts preloaded: `797e433ab948586e-s.p.woff2` + `caa3a2e1cccd8315-s.p.woff2`
- Fallback chain: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif`

### Layout patterns (confirmed from the screenshot + DOM)

- **Hero**: two-column. Left: eyebrow (`Secure. Transparent. Trusted.`) → H1 (`Election Management Built for Organizations`) → subhead paragraph → two CTAs (`Start Free Election` primary + `Book a Demo` secondary) + a "Voters supported 0 +" animated counter. Right: floating mock "Election Command Center" dashboard card with live turnout (`68.4%`), votes cast (`4,210`), candidate bar chart (Adebayo Okafor 42% / Chinwe Eze 31% / Ibrahim Bello 18%) — looks like a real product screenshot, not a stock image.
- **"Trusted by organizations of every kind"**: 8-up logos strip (Universities & Faculties, Student Unions, Professional Associations, Churches, Cooperatives & NGOs, Corporate Organizations, Clubs & Societies, Government Institutions) — text labels, not images.
- **"Why Votewise"**: 6-up feature grid (Tamper-proof ballots / Verified voters only / Live results & analytics / Built for every scale / Ballot secrecy by design / Sub-3-second voting).
- **"How it works"**: 4-step numbered horizontal pipeline (01 Create election → 02 Verify voters → 03 Cast votes → 04 Publish results).
- **"Security & trust — Elections you can defend, results nobody can contest"**: 6-up security guarantee grid with CTAs (`Start a secure election` + `Talk to security team`).
- **"Real-time monitoring — An election command center, live"**: full-width feature with bullet list (live turnout, active sessions, position-by-position results, observer/auditor roles) + a rendered dashboard mockup showing turnout `68.4%`, verified voters `4,210 (99.2%)`, active sessions `312 voting right now`, system health `99.98% uptime`.
- **"Analytics & results — Results that publish themselves"**: bullet list (position-by-position results with live progress bars, server-side vote counts, public results page with verifiable receipt lookup, exportable analytics).
- **"Case studies — Trusted by institutions that cannot afford a dispute"**: 3-up testimonial cards (real ones — see §10).
- **"Pricing — Plans that scale with your electorate"**: 3-tier pricing cards (Starter / Professional [marked "Most popular"] / Enterprise). See §12.
- **"FAQ — Answers to the questions institutions ask first"**: 6-item accordion.
- **Final CTA section**: "Ready to run a secure election?" → "Set up your organization, import voters and go live in under an hour. No credit card required to start." → CTAs `Get Started free` + `View pricing`.
- **Footer**: 4-column (Product / Company / Resources / Legal) + bottom strip **"© 2026 Votewise — A product of Okomba Analytics. Built for organizations across Africa and beyond."**

### Distinctive visual notes

- The hero dashboard mockup is a striking "election command center" UI — emerald/mint progress bars, candidate initials in colored chips (AO/CE/IB/NO), live vote percentages, "Ballot hash verified" pill — looks like a real product screenshot, NOT a stock illustration. This is the strongest candidate image for the Okomba Solutions card.
- No raster images anywhere on the page — the entire UI is SVG icons + Tailwind-styled divs + live animated counters.
- The light-mode palette (#fafcfe cream-blue bg + #2249b7 royal blue accents + #d2eef0 pale cyan surfaces) gives it an institutional/credible/serious feel — clearly aimed at university administrators and electoral committee chairs, not consumers.

## 8. Visual / hero image

**No `<img>` elements exist on the page** — same pattern as Turbopay. The "hero image" is a CSS/SVG-rendered Election Command Center dashboard mockup (not a raster image).

- Hero screenshot captured (1280×577 PNG, 243 KB) at `/home/z/my-project/research-assets/votewise-hero.png`
- Full-page screenshot (1280×8692 PNG, 829 KB) at `/home/z/my-project/research-assets/votewise-full.png`
- Copied for Okomba Solutions card use: `/home/z/my-project/public/images/projects/votewise-preview.png`

## 9. OG image URL

**There is NO `<meta property="og:image">` tag on the page.** Confirmed by:
- `page_reader` metadata extraction (no `og:image` key)
- Direct DOM eval (`document.querySelector('meta[property="og:image"]')` returns null)
- HTTP probes on common OG asset paths: `/og.png`, `/opengraph.png`, `/og-image.png`, `/og-image` all return **404** (the last one redirects to `/login` because it's a catch-all auth route).

Other OG tags present:
- `og:title` = "Votewise — Secure Election Management"
- `og:description` = "Secure, transparent election management platform for organizations."
- `og:site_name` = "Votewise"
- `og:type` = "website"
- `twitter:card` = "summary_large_image" (but no `twitter:image` either)

**Action item for the founder:** Votewise has no OG image — recommend using the captured `votewise-preview.png` as the Okomba Solutions card image, OR the `votewise-logo.svg` for a smaller card.

## 10. Testimonial / quote — THREE REAL ONES

> "We moved our Student Union election online after years of paper-ballot disputes. Votewise gave us a turnout record and a result nobody could contest."
> — **Dr. Adebayo Ogunleye**, Dean of Student Affairs · University of Lagos

> "The audit trail is what sold our board. Every action is logged, every ballot is verifiable. For the first time, observers had nothing to question."
> — **Mrs. Funmilayo Adeyemi**, Electoral Committee Chair · Lagos Chamber of Commerce

> "We ran 14 faculty elections in one week. The real-time monitoring meant we caught and resolved issues before they became disputes."
> — **Prof. Nwankwo Ibezim**, Registrar · Nnamdi Azikiwe University

(Section heading: "Case studies — Trusted by institutions that cannot afford a dispute")

## 11. CTA copy

**Primary hero CTA (button):** "Start Free Election" → `/register`
**Secondary hero CTA:** "Book a Demo" → `/support`
**Top-nav CTAs:** "Sign In" → `/login`, "Get Started" → `/register`
**Security section CTA:** "Start a secure election" → `/register` (primary) + "Talk to security team" → `/support` (secondary)
**Pricing tier CTAs:** "Get started" (Starter) / "Get started" (Professional, "Most popular") / "Contact sales" (Enterprise)
**Pricing section bottom:** "See full pricing & comparison" → `/pricing`
**Final CTA section:** "Ready to run a secure election?" with two buttons: "Get Started free" → `/register` and "View pricing" → `/pricing`

## 12. Pricing model

**Per-election-cycle subscription**, in Nigerian Naira (₦):

| Tier | Price | Voters | Active elections | Notes |
|---|---|---|---|---|
| **Starter** (For departments and small faculties) | ₦25,000 /election cycle | Up to 1,000 | 5 | Email + SMS verification, Real-time monitoring, Audit logs |
| **Professional** (For universities and large associations) — **"Most popular"** | ₦150,000 /election cycle | Up to 10,000 | 25 | All verification channels, Advanced analytics, Observers & audit access |
| **Enterprise** (For large institutions & government) | Custom (Contact sales) | Unlimited | Unlimited | Custom domains, Dedicated infrastructure, SLA & onboarding |

Section subhead: "Start free, then pay per election as you grow. Every plan includes the full security stack — you only pay for more voters and elections."

## 13. Unique / copy-worthy phrases (brand voice, verbatim)

- **"Secure. Transparent. Trusted."** (hero eyebrow)
- **"Election Management Built for Organizations"** (hero H1)
- **"From voter verification to tamper-proof results, Votewise handles the full lifecycle — so your committee can focus on governance, not logistics."**
- **"From a 40-person club election to a 50,000-voter faculty vote — Votewise scales without breaking a sweat."**
- **"Sub-3-second voting — A fast, accessible ballot interface means voters finish in seconds — on any device, even on slow networks."** (signals Nigeria-first — slow-network aware)
- **"From setup to published results in four steps — A guided workflow that takes you from a blank election to an audited, public result — without spreadsheets, paper or disputes."**
- **"Elections you can defend, results nobody can contest."** (security section headline — strongest single line)
- **"An election command center, live — Watch turnout climb, verification rates hold, and active sessions pulse — the moment they happen. Spot anomalies before they become disputes."**
- **"Results that publish themselves — Tallying is automatic and tamper-proof. The moment polls close, your committee has a complete, auditable breakdown — ready to publish publicly with one click."**
- **"Trusted by institutions that cannot afford a dispute."** (case studies section headline)
- **"Plans that scale with your electorate — Start free, then pay per election as you grow."** (pricing section)
- **"Set up your organization, import voters and go live in under an hour. No credit card required to start."** (final CTA)
- **"Votewise — A product of Okomba Analytics. Built for organizations across Africa and beyond."** (footer brand line — explicitly attributes the product to Okomba Analytics)

## Brand logo (favicon SVG)

Captured to `/home/z/my-project/research-assets/votewise-favicon.svg` and copied to `/home/z/my-project/public/images/projects/votewise-logo.svg`.

SVG content (32×32, no role label):
- Rounded square 32×32, `rx=8`, background `#4f46e5` (indigo — slight discrepancy from the deployed `--primary` `#2249b7` royal blue; favicon uses indigo, body uses royal blue. The founder may want to align these.)
- White "V" formed by a stroke path from `(8,8)` to `(16,24)` to `(24,8)` (downward V, stroke-width 2.5, round caps)
- White secondary checkmark overlay from `(11,14)` → `(14,17)` → `(19,11)`, stroke-width 2, opacity 0.7 — overlays a "verified" checkmark on the V

**Brand concept:** V (for Votewise) + checkmark (a verified, audited vote). Reinforces the "tamper-proof / verified voters" value prop.

## Assets saved (Votewise)

| Asset | Path | Size |
|---|---|---|
| Hero screenshot (above-the-fold) | `/home/z/my-project/research-assets/votewise-hero.png` | 243 KB · 1280×577 |
| Full-page screenshot | `/home/z/my-project/research-assets/votewise-full.png` | 829 KB · 1280×8692 |
| Brand logo SVG | `/home/z/my-project/research-assets/votewise-favicon.svg` | 399 B |
| Page reader JSON (raw HTML+meta) | `/home/z/my-project/research-assets/page-votewise-1.json` | 274 KB |
| Page reader JSON (www variant) | `/home/z/my-project/research-assets/page-votewise-2.json` | 291 KB |
| Light CSS (compressed) | `/home/z/my-project/research-assets/css/votewise-a.css` + `votewise-b.css` | 4 KB + 210 KB |
| Web search results (×4 queries) | `/home/z/my-project/research-assets/search-votewise-{1,2,3,4}.json` | 8 KB total |
| **OKOMBA-READY preview image** | `/home/z/my-project/public/images/projects/votewise-preview.png` | 243 KB · 1280×577 |
| **OKOMBA-READY logo SVG** | `/home/z/my-project/public/images/projects/votewise-logo.svg` | 399 B |
