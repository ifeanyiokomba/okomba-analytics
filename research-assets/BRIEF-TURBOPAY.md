# Turbopay — Research Brief (Task 19-A)

> Sourced live from https://turbopay.okomba.com on 2026-08-28.
> Captured via z-ai web_search + page_reader + agent-browser (DOM eval + screenshots + CSS scrape).
> Every quoted string below is verbatim from the rendered live site.

## 1. Real URL that resolves

- **Primary (works):** `https://turbopay.okomba.com/` → HTTP 200, redirects to `https://www.turbopay.okomba.com/`
- `https://turbopay.com` — did NOT resolve (returns to a different TurboPay brand at turbopay.ph — a Philippines BPO payment gateway, unrelated to Okomba).
- `https://www.turbopay.ng` — did NOT resolve.
- `https://turbopay.okomba.com` is the only working URL. Founder should update the Okomba Solutions card link from `https://turbopay.okomba.com` (currently in `src/lib/content.ts` line 293) — it's correct as-is.

## 2. Product name as displayed on the site

- `<title>`: **"Turbopay — Wallet, Payments & Bills"**
- `<meta application-name>`: "Turbopay"
- `<meta author>`: "Turbopay"
- Wordmark in nav (top-left): rendered as "Turbopay" (single word, no space)
- Footer wordmark: rendered as "Turbo pay" (with a space — likely a styling quirk; treat the brand as **"Turbopay"**, one word, capital T, lowercase rest).
- Footer legal line: **"© 2026 Turbopay Technologies · NDPR-aware · CBN-aligned partners"**

## 3. Hero tagline / headline (verbatim)

Two-line H1 with a color split (line 2 is colored emerald `--primary`):

> **Your money,**
> **faster than ever.**

Eyebrow above the H1:

> **The fast lane to your money**

## 4. Hero subhead / value-prop (verbatim)

> Turbopay is Nigeria's modern digital wallet. Fund instantly, transfer for free, buy airtime & data, and pay bills — all from one app.

(Meta `description`, slightly expanded: "Turbopay is a modern Nigerian digital wallet and payments platform. Fund your wallet, transfer money, buy airtime & data, and pay bills — fast, secure, fintech-grade.")

## 5. Feature bullets / capabilities (verbatim from the "Everything you need in one wallet" section)

Section subhead: "Powerful features designed for how Nigerians move money."

1. **Wallet & Virtual Account** — "Get a dedicated Monnify virtual account. Fund your wallet instantly from any Nigerian bank."
2. **Free Transfers** — "Send money to any Turbopay user instantly. No fees, no delays, no hidden charges."
3. **Airtime & Data** — "Buy airtime and data bundles for MTN, Glo, Airtel, and 9mobile at the best prices."
4. **Bill Payments** — "Pay electricity (8 DISCOs), DStv, GOtv, water, internet, Remita, and more — all in one place."
5. **Protected at Every Step** — "Your money is safeguarded with multi-layer security, mandatory transaction PINs, and real-time fraud detection — so you can transact with total confidence."
6. **KYC Tiers** — "Verify with NIN or BVN to unlock higher transaction limits up to ₦5M per transaction."

## 6. Who it's for

Implicit audience (no "Who it's for" section as such, but copy targets):
- Everyday Nigerians moving money ("Built for how Nigerians move money")
- People needing free transfers, airtime/data, bill payments from one app
- KYC-tiered users wanting higher transaction limits (up to ₦5M per transaction)
- "Become a Partner" CTA in the footer + nav (partner/agent program for distributors)

The "Why Nigerians choose Turbopay" section sub-headline:
> Built for speed, designed for trust, priced for everyone.

And its four pillars (verbatim):
- **Lightning Fast** — "Transfers and bill payments complete in seconds — no waiting, no delays."
- **No Hidden Fees** — "Free wallet, free transfers, free airtime. You always know exactly what you pay."
- **Always Protected** — "24/7 fraud monitoring, mandatory PINs, and instant alerts keep your money safe."
- **Made for Nigeria** — "All major banks, DISCOs, and networks supported. Built for how Nigerians move money."

## 7. Design language

### Default mode: DARK (`<html class="dark">` is set explicitly — site is dark-mode-first regardless of OS preference)

**Turbopay dark theme tokens (`.dark` block in CSS):**

| Token | Value (dark mode) | Use |
|---|---|---|
| `--background` | `#070f0c` | Page bg — deep forest-black |
| `--foreground` | `#eef3ef` | Body text — cream |
| `--card` | `#0f1b16` | Card surface |
| `--primary` | `#39bf89` | Mint/emerald — buttons, accents, the "faster than ever." text in H1 |
| `--primary-foreground` | `#01110a` | Text on primary buttons |
| `--secondary` | `#182b23` | Secondary surfaces |
| `--muted` | `#19251f` | Muted surfaces |
| `--muted-foreground` | `#94a29a` | Muted text |
| `--accent` | `#543200` | Warm brown bg |
| `--accent-foreground` | `#ffe0ac` | Cream/gold text on accent |
| `--success` | `#4ebe7d` | Success green |
| `--warning` | `#faab3f` | Amber/gold |
| `--destructive` | `#fc5855` | Red |
| `--border` | `#25312b` | Hairline borders |
| `--chart-1..5` | `#39bf89`, `#faab3f`, `#00aeb6`, `#4ebe7d`, `#fc5855` | Emerald, amber, cyan, mint, red |
| `--radius` | `.75rem` (12px) | Border radius |

**Turbopay light theme tokens (`:root` defaults, NOT active on page load):**
- background `#fafcfa`, foreground `#101b15`, primary `#007149` (deep emerald), accent `#fae1b8` (cream/sand), warning `#e99b2a`, success `#269e5f`, sidebar `#091d15`

**`<meta name="theme-color">`:** `#0b6b4f` (mobile chrome — primary green) and `#0a1f1a` (dark mode mobile chrome — deep forest black)

### Typography

- Primary font family: **Geist** (Vercel's open-source Geist Sans) via `var(--font-geist-sans)`
- Mono font family: **Geist Mono** (for numeric/ledger displays like balances, hashes)
- Also loads **Noto Sans Arabic** for internationalization
- All three are loaded as woff2 from `/_next/static/media/` (preloaded)
- Fallback chain when Geist isn't installed locally: `ui-sans-serif, system-ui, sans-serif` (no Georgia serif — Turbopay is fully sans-serif)

### Layout patterns (confirmed from the screenshot + DOM)

- **Hero**: left-aligned two-column. Left column: eyebrow → H1 (two lines, color-split) → subhead paragraph → two CTAs (primary "Create free account" + secondary "Sign in") → three trust pills (`No hidden fees` · `Bank-grade security` · `Instant transfers`). Right column: floating wallet preview card with balance, tabs (Fund/Transfer/Airtime/Bills), and mini-stats (`₦0 fee`, `Funding speed: Instant`).
- **"Everything you need in one wallet"**: 6-up feature grid (3×2 on desktop, cards with icon + title + paragraph).
- **"Get started in 3 steps"**: 3-step horizontal numbered process (01/02/03 numbered chips).
- **"Trusted & Secure"**: security guarantee grid (SSL/TLS Secured, End-to-End Encryption, Multi-Factor Authentication, …).
- **"Why Nigerians choose Turbopay"**: 4-up value-pillar grid (Lightning Fast / No Hidden Fees / Always Protected / Made for Nigeria).
- **"Frequently asked questions"**: accordion (6 items).
- **"Loved by Nigerians"**: 3-up testimonial cards (currently placeholders — `"Your testimonial here — we're collecting stories from our early users."` `"Coming soon"` `"Early user"`).
- **Final CTA section**: "Ready to move money faster?" + "Join thousands of Nigerians who trust Turbopay with their money." with 3 buttons (`Create your free wallet`, `Sign in`, `Become a Partner`).
- **Footer**: 4-column (Product / Company / Support + brand) + bottom strip `"© 2026 Turbopay Technologies · NDPR-aware · CBN-aligned partners"` + `"All systems operational"` status pill.

### Distinctive visual notes

- Floating wallet preview card uses a green-on-green palette, with a tiny "Ledger reconciled" pill below the balance — conveys a real fintech dashboard, not a stock illustration.
- Logo is a custom SVG (see §8) — emerald gradient rounded square with a stylized "T" + lightning-bolt amber stem + three speed lines on the left.

## 8. Visual / hero image

**No `<img>` elements exist on the page** — the entire site is rendered with SVG icons + Tailwind-styled divs. The "hero image" is actually a **CSS/SVG-rendered wallet preview card** (not a raster image).

- Hero screenshot captured (1280×577 PNG, 103 KB) at `/home/z/my-project/research-assets/turbopay-hero.png`
- Full-page screenshot (1280×5661 PNG, 513 KB) at `/home/z/my-project/research-assets/turbopay-full.png`
- Copied for Okomba Solutions card use: `/home/z/my-project/public/images/projects/turbopay-preview.png`

## 9. OG image URL

**There is NO `<meta property="og:image">` tag on the page.** Confirmed by:
- `page_reader` metadata extraction (no `og:image` key)
- Direct DOM eval (`document.querySelector('meta[property="og:image"]')` returns null)
- HTTP probes on common OG asset paths: `/og.png`, `/opengraph.png`, `/og-image.png`, `/og-image` all return **404**.

Other OG tags present:
- `og:title` = "Turbopay — Wallet, Payments & Bills"
- `og:description` = "A modern Nigerian digital wallet. Fund, transfer, buy airtime & data, pay bills."
- `og:site_name` = "Turbopay"
- `og:type` = "website"
- `twitter:card` = "summary_large_image" (but no `twitter:image` either)

**Action item for the founder:** Turbopay has no OG image — when the Okomba Solutions card links out, social-card previews will be blank. Recommend using the captured `turbopay-preview.png` (or `turbopay-logo.svg`) as the OG fallback for the Okomba Solutions card.

## 10. Testimonial / quote

**No real testimonials yet.** The "Loved by Nigerians" section ships with three placeholder cards:

> "Your testimonial here — we're collecting stories from our early users."
> — Coming soon, Early user

(×3 identical placeholders)

## 11. CTA copy

**Primary hero CTA (button):** "Create free account"
**Secondary hero CTA:** "Sign in"
**Top-nav CTA:** "Get Started" (button, top-right)
**Final CTA section:** "Ready to move money faster?" with three buttons: "Create your free wallet" (primary), "Sign in", "Become a Partner"
**Footer partner CTA:** "Become a Partner"

## 12. Pricing model

**Free wallet model** (no paid tiers surfaced on the homepage):
- "No hidden fees"
- "Free wallet, free transfers, free airtime. You always know exactly what you pay."
- KYC tiering unlocks higher transaction limits (up to ₦5M per transaction with NIN/BVN verification)
- No pricing page visible in nav. Revenue model is implicit: spread on airtime/data sales, bill-pay convenience fees, partner/distributor program ("Become a Partner").

## 13. Unique / copy-worthy phrases (brand voice, verbatim)

- **"The fast lane to your money"** (hero eyebrow)
- **"Your money, faster than ever."** (hero H1)
- **"Nigeria's modern digital wallet"** (hero subhead)
- **"Fund instantly, transfer for free, buy airtime & data, and pay bills — all from one app."**
- **"Powerful features designed for how Nigerians move money."** (features section subhead)
- **"From signup to your first transaction in under 2 minutes."** (3-step section subhead)
- **"Built for speed, designed for trust, priced for everyone."** (Why-choose section subhead)
- **"Made for Nigeria — Built for how Nigerians move money."**
- **"Ready to move money faster? Join thousands of Nigerians who trust Turbopay with their money."**
- **"Turbopay Technologies · NDPR-aware · CBN-aligned partners"** (legal line — signals NDPR/CBN regulatory alignment)
- **"All systems operational"** (footer status pill)
- Support email: support@turbopay.com

## Brand logo (favicon SVG)

Captured to `/home/z/my-project/research-assets/turbopay-favicon.svg` and copied to `/home/z/my-project/public/images/projects/turbopay-logo.svg`.

SVG content (64×64, role=img, aria-label="Turbopay logo"):
- Emerald gradient rounded-square background `#16a37b → #0b7d5e → #06543f` (rx=16, 60×60)
- White "T" crossbar (rect at top)
- Amber lightning-bolt stem forming the T's vertical `#fbbf24 → #f59e0b` — "conveys turbo speed"
- Three white motion/speed lines on the left (decreasing opacity)

## Assets saved (Turbopay)

| Asset | Path | Size |
|---|---|---|
| Hero screenshot (above-the-fold) | `/home/z/my-project/research-assets/turbopay-hero.png` | 103 KB · 1280×577 |
| Full-page screenshot | `/home/z/my-project/research-assets/turbopay-full.png` | 513 KB · 1280×5661 |
| Brand logo SVG | `/home/z/my-project/research-assets/turbopay-favicon.svg` | 1.4 KB |
| Page reader JSON (raw HTML+meta) | `/home/z/my-project/research-assets/page-turbopay-okomba-retry.json` | 96 KB |
| Light+dark CSS (compressed) | `/home/z/my-project/research-assets/css/turbopay-a.css` + `turbopay-b.css` | 8 KB + 149 KB |
| Web search results | `/home/z/my-project/research-assets/search-turbopay-1.json` + `2.json` | 3 KB |
| **OKOMBA-READY preview image** | `/home/z/my-project/public/images/projects/turbopay-preview.png` | 103 KB · 1280×577 |
| **OKOMBA-READY logo SVG** | `/home/z/my-project/public/images/projects/turbopay-logo.svg` | 1.4 KB |
