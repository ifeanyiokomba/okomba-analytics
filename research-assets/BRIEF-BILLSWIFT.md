# BillSwift — Research Brief (Task 19-B)

> Sourced live from **https://www.billswift.com.ng/** on 2026-08-28.
> Captured via z-ai `web_search` + `page_reader` + `agent-browser` (DOM eval + screenshots + CSS scrape).
> Every quoted string below is verbatim from the rendered live site — no paraphrasing.

## 1. Real URL that resolves

- **Primary (works):** `https://www.billswift.com.ng/` → HTTP 200, 33 KB HTML, canonical `https://billswift.com.ng/` (note: `www.` is canonical-redirected, the bare apex is what their `<link rel="canonical">` declares, but both `www.` and apex resolve).
- `https://billswift.okomba.com` → **HTTP 404** (subdomain not configured on okomba.com).
- `https://billswift.com` → returns 200 but body is a single-line parked-domain redirect to `/lander` (NOT the real BillSwift product; it's a domain-parking page).
- `https://billswift.ng` → **DNS does not resolve** (HTTP 000).
- The Okomba Solutions/Products section currently shows BillSwift with NO external "Visit site" link — only a "View project" case-study modal trigger. **Action item:** wire the Okomba BillSwift card to `https://www.billswift.com.ng/` (the actual live product site).

## 2. Product name as displayed on the site

- `<title>`: **"Bill Swift - Buy Airtime, Data, and Pay Bills Instantly in Nigeria"**
- `<meta author>`: **"Bill Swift Team"**
- Wordmark in nav (top-left) + footer: **"Bill Swift"** (two words, capital B + capital S, with a space).
- JSON-LD `LocalBusiness.name`: "Bill Swift"
- Footer legal line: **"© 2025 Bill Swift. All rights reserved. Powered by innovation."**
- Page-reader `og:site_name`: **"Bill Swift"**

⚠️ The Okomba site currently renders the brand as **"BillSwift"** (one word, camelCase) in both its Solutions card and Selected Work / case-study block. The live product site itself renders the brand as **"Bill Swift"** (two words). Founder should pick which to use on okomba.com — recommend matching the live product site's "Bill Swift" for consistency across properties.

## 3. Hero tagline / headline (verbatim)

The hero is a single centered H1 with a gradient text-fill (see §7). Verbatim:

> **Instant Airtime & Data Top-Up**

There is no eyebrow above the H1 on the hero. (The page does have a top-bar working-hours strip: "Working Hours: 8:00 AM - 7:00 PM" + a live digital clock — but that's a chrome strip, not hero copy.)

## 4. Hero subhead / value-prop (verbatim)

> **Nigeria's most reliable VTU platform. Recharge airtime, buy data bundles, pay bills and more - all in seconds with our automated system.**

(Meta `description`, slightly expanded for SEO: "Bill Swift is Nigeria's trusted VTU platform for instant airtime top-up, data bundle purchase, and bill payments. Start your VTU business and earn daily profits with unbeatable prices.")

## 5. Feature bullets / capabilities (verbatim)

Section heading: **"Our Services"** with subhead **"Complete digital services for all your mobile and utility needs"**

7 service cards (verbatim titles + body copy from each card):

1. **📱 Airtime Recharge** — "Instant airtime top-up for all Nigerian networks - MTN, Glo, Airtel, and 9Mobile. Quick, reliable, and available 24/7."
2. **🌐 Data Bundles** — "Buy affordable data plans for all networks. From daily plans to monthly subscriptions, we have the best rates in Nigeria."
3. **📺 Cable TV Subscription** — "Pay for DSTV, GOTV, and Startimes subscriptions instantly. Never miss your favorite shows again."
4. **💡 Electricity Bills** — "Pay electricity bills for all DISCO companies across Nigeria. Instant token delivery to your phone."
5. **🎓 Education Payments** — "Purchase exam pins for WAEC, NECO, JAMB and other educational services with ease."
6. **🔧 Developer API** — "Integrate our services into your platform with our robust API. Perfect for developers and businesses."
7. **🏢 CAC Registration** — "Register your business with Corporate Affairs Commission. Fast, reliable business name and company registration services." (note: "This services only available for Deskstop view only. We are working on mobile transformation.")

Secondary "Why Choose Bill Swift?" list (verbatim, from the About section):

- **Fast Transactions:** "Enjoy instant delivery on all services, from airtime top-up to data bundles."
- **Affordable Pricing:** "Competitive rates designed to help you save more with every transaction."
- **Secure & Reliable:** "Advanced technology to keep your transactions safe and secure."
- **24/7 Support:** "Our dedicated support team is always available to assist you."
- **Business-Friendly API:** "Seamless integration for entrepreneurs and resellers."

Developer API section (verbatim, 4 sub-pillars):

- **🚀 Fast & Reliable** — "Lightning-fast API responses with 99.9% uptime guarantee"
- **🔐 Secure** — "Bank-level security with encrypted API keys and HTTPS"
- **📖 Well Documented** — "Comprehensive documentation with code examples"
- **💰 Competitive Rates** — "Best wholesale rates for developers and resellers"

Trust badges below the partners grid (verbatim):

- **🔒 Secure Transactions** — "Bank-level encryption"
- **⚡ Instant Processing** — "Real-time delivery"
- **🏆 Certified Partner** — "Official partnerships"
- **📞 24/7 Support** — "Always available"

## 6. Who it's for

BillSwift targets three audiences explicitly (drawn from the About + Developer API sections):

- **Everyday Nigerian retail users** — airtime/data/utility/cable-TV bill payers needing instant delivery ("thousands of satisfied users", "individual users")
- **Resellers and VTU business operators** — "Start your VTU business and earn daily profits with unbeatable prices." (meta description) + "Business-Friendly API: Seamless integration for entrepreneurs and resellers."
- **Developers & businesses integrating bill payments** — "Integrate our services into your platform with our robust API. Perfect for developers and businesses." + Developer API section ("Best wholesale rates for developers and resellers")

Industry surfaces via the partner grid: **telecoms (MTN, Glo, Airtel, 9mobile), pay-TV (DSTV, GOTV, StarTimes, ShowMax), electricity DISCOs (EKEDC, IKEDC, AEDC, PHEDC), education/exam boards (WAEC, NECO, JAMB, NABTEB), corporate registration (CAC)**.

## 7. Design language

### Color tokens (verbatim from `:root` in `/css/swift.css`)

| Token | Value | Use |
|---|---|---|
| `--primary-color` | **`#00C896`** | Mint/teal — particle dots, links hover, clock, primary accent |
| `--secondary-color` | **`#1E3A5F`** | Deep navy blue — header theme, gradient stops |
| `--accent-color` | **`#FF6B6B`** | Coral/red — accent (rare on hero) |
| `--dark-bg` | **`#0A0E1A`** | Page background — deep near-black navy |
| `--card-bg` | `rgba(255, 255, 255, 0.1)` | Card surfaces (translucent) |
| `--glass-bg` | `rgba(255, 255, 255, 0.08)` | Glass overlay surfaces |
| `--text-light` | **`#E8F4FD`** | Body text on dark — pale ice blue |
| `--text-dark` | `#2D3748` | Body text on light (rare) |
| `--gradient-1` | `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` | CTA buttons (purple→indigo) |
| `--gradient-2` | `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)` | H1 text gradient (pink→coral) |
| `--gradient-3` | `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)` | Logo wordmark gradient (blue→cyan) |

**`<meta name="theme-color">`: `#1E3A5F`** (mobile chrome tab — secondary navy)

### Background animation

- Body has a fixed full-screen `bg-animation` div with an animated 4-stop gradient: `linear-gradient(-45deg, #0A0E1A, #1A1F3A, #0F1419, #1E3A5F)` shifting over 15s ease infinite — gives the hero a slowly drifting deep-space feel.
- Floating particles: ~16 fixed-position 3px mint dots (`--primary-color` `#00C896`) drifting upward with `float 20s infinite linear`.

### Typography

- Primary font family: **`'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`** — no custom web fonts, no Google Fonts (the page preconnects to `fonts.googleapis.com` / `fonts.gstatic.com` but doesn't actually load any CSS from them; the only loaded stylesheet is `/css/swift.css` + `/css/pre.css` + `/css/popup.css`).
- Mono usage: **`'Courier New', monospace`** for the live digital clock only (top-bar).
- Hero H1: `font-size: 3.5rem` (56px) / `font-weight: 700` / gradient text fill via `--gradient-2` (pink→coral) / `-webkit-background-clip: text` / `-webkit-text-fill-color: transparent`.
- Hero subhead `<p>`: `font-size: 1.3rem` (≈21px) / `opacity: 0.9`.
- Nav links: `color: var(--text-light)` → hover `color: var(--primary-color)` + translateY(-2px) + animated underline (`::after` width 0→100% on hover).
- Logo wordmark: `font-size: 1.8rem` / `font-weight: bold` / gradient text fill via `--gradient-3` (blue→cyan).

### Layout patterns (confirmed from the screenshot + DOM)

- **Single-page site** — all content on `/`. Sub-pages (`/about`, `/services`, `/developer-api`, `/contact`, `/privacy-policy`) all return **HTTP 403 (nginx hot-link protection)** — only `/` renders.
- **Top chrome strip** (`top-bar`): split row with a live digital clock ("01:28:02") on the left + working hours ("Working Hours: 8:00 AM - 7:00 PM") on the right. Background `rgba(0,0,0,0.3)` over the navy hero.
- **Fixed translucent header**: `position: fixed` / `backdrop-filter: blur(20px)` / `background: rgba(10,14,26,0.8)` / 1px hairline `border-bottom`. Nav: logo wordmark + 7-link nav (Home, Services, About Us, Partners, Developer API, privacy-policy, Contact) + a "Get Started" CTA button on the right.
- **Hero**: centered single-column (`text-align: center`), `min-height: 100vh` flex-centered, `max-width: 800px`. H1 (gradient pink-coral) + subhead + two CTAs side-by-side ("Start Recharging" primary, "Create Account" secondary) + below: "📱 Download Bill Swift App" link.
- **Quick Recharge widget** inside the Services section: a small inline form (Select Network dropdown: MTN/Glo/Airtel/9Mobile + Phone Number input + Amount ₦ input + "Recharge Now" button).
- **Services**: 7-card feature grid (icon + title + paragraph). Card surface uses `--card-bg` translucent white.
- **About**: full-width copy block with `Your Trusted Digital Partner` subhead, 4-stat band (`500K+ Happy Customers` · `10M+ Transactions` · `99.9% Success Rate` · `24/7 Support`).
- **Trusted Partners**: 5 sub-sections, each a 4-card horizontal grid (Telecoms: MTN/Airtel/Glo/9mobile; Entertainment: DSTV/GOTV/StarTimes/ShowMax; Utilities: EKEDC/IKEDC/AEDC/PHEDC; Education: WAEC/NECO/JAMB/NABTEB). Each card = name + tagline ("Leading network provider", "Smart choice network", etc.).
- **Trust badge strip** below partners: 4 icon + title + subtext pills (Secure Transactions / Instant Processing / Certified Partner / 24/7 Support).
- **Developer API**: section with 4-pillar grid + a literal `Sample API Request - Airtime Purchase` code block (`POST https://api.billswift.com.ng/v1/airtime/purchase` + JSON request/response) + "Get API Access" / "View Documentation" buttons.
- **Contact**: 2-column (left: 4 contact-info cards with emoji icons Address/Phone/Email/Hours; right: contact form Name/Email/Subject/Message + Send Message button) + line "💡 Or email us directly at: support@billswift.com.ng".
- **Footer**: 3-column (Bill Swift brand + tagline / Quick Links / Services / Support) + bottom strip "© 2025 Bill Swift. All rights reserved. Powered by innovation."
- **Floating elements**: bottom-right "📱 Download Bill Swift App" pill + bottom-left "👋 Chat with us!" pill.

### Distinctive visual notes

- The hero has **no actual hero image** — it's pure CSS + a particles layer (no `<img>` in the hero, no hero illustration). The only raster images on the entire site are the favicon (`/images/icon.PNG`) and the play-store download button. Hero visual interest comes entirely from the animated gradient background + floating particle field + gradient-text H1.
- Heavy use of **translucent layered surfaces** (`backdrop-filter: blur(20px)` header + `rgba(255,255,255,0.1)` cards) — a glass-morphism aesthetic.
- The hero CTA "Start Recharging" uses `--gradient-1` (purple→indigo) — *different* from the H1's pink-coral `--gradient-2` and the logo's blue-cyan `--gradient-3`. Three different gradients on the same hero gives a slightly busy but cohesive rainbow-navy look.
- The page loads a "Download Our App" pop-up modal on every page-load (`#appPopup` with `display: block` by default, auto-shown via `window.onload`) prompting visitors to download the BillSwift Android APK at `https://billswift.com.ng/downloads/billswift.apk`.

## 8. Visual / hero image

**No `<img>` elements exist on the page in the hero** — confirmed via DOM eval (`document.querySelectorAll('.hero img, header img, .hero-section img')` returns an empty array). The hero "visual" is the **animated gradient background + floating particles + gradient-text H1**.

Only raster images on the page:
- Favicon/logo PNG: `https://billswift.com.ng/images/icon.PNG` (258×272 RGBA PNG, 68 KB) — used as the favicon AND the OpenGraph image AND the apple-touch icon (single asset for all). See §9.
- An app-download graphic for the Play-Store link (path not in DOM as `<img>`, used as a CSS background or button label only).

Screenshots captured:
- Hero screenshot (1440×900 PNG, 203 KB) at `/home/z/my-project/research-assets/billswift-hero.png`
- Full-page screenshot (1440×~3200 PNG, 305 KB) at `/home/z/my-project/research-assets/billswift-full.png`
- **OKOMBA-READY preview image** (1440×900 PNG, 203 KB) at `/home/z/my-project/public/images/projects/billswift-preview.png`
- **OKOMBA-READY logo/icon** (258×272 PNG, 68 KB) at `/home/z/my-project/public/images/projects/billswift-logo.png`

## 9. OG image URL

- `<meta property="og:image">` = **`https://billswift.com.ng/images/icon.PNG`** (258×272 PNG, 68 KB)
- `<meta property="og:title">` = "Bill Swift - Buy Airtime, Data, and Pay Bills Instantly"
- `<meta property="og:description">` = "Top up airtime, buy data bundles, and pay bills instantly with Bill Swift. Start your VTU business today and earn daily!"
- `<meta property="og:url">` = "https://billswift.com.ng"
- `<meta property="og:type">` = "website"
- `<meta property="og:site_name">` = "Bill Swift"
- Twitter card: `<meta name="twitter:card">` = "summary_large_image", `twitter:title` = "Bill Swift - Instant Airtime & Data Top-up", `twitter:description` = "Buy cheap airtime, data, and pay bills instantly with Bill Swift.", `twitter:image` = same `https://billswift.com.ng/images/icon.PNG`

The OG image is the same 258×272 PNG icon used as favicon. It is a transparent-background brand icon (downloaded locally and saved to `/home/z/my-project/research-assets/billswift-icon.png` and copied to `/home/z/my-project/public/images/projects/billswift-logo.png`).

## 10. Testimonial / quote

**No testimonial section exists on the live BillSwift site.** The page has:
- An "About Bill Swift" narrative block
- A partners grid
- A trust-badge strip
- A "Why Choose Bill Swift?" value-prop list
- An implicit social proof stat band ("500K+ Happy Customers", "10M+ Transactions", "99.9% Success Rate", "24/7 Support")

But **no customer quote / testimonial card** anywhere on the page. Best-effort "social proof" copy available is the stats band:
> **500K+ Happy Customers** · **10M+ Transactions** · **99.9% Success Rate** · **24/7 Support**

…and the line from the About copy: *"Join the thousands of satisfied users who trust Bill Swift as their go-to platform for all digital services."*

## 11. CTA copy

- **Primary hero CTA (button, gradient-1):** **"Start Recharging"**
- **Secondary hero CTA (button, transparent border):** **"Create Account"**
- **Below-hero app CTA (pill link):** "📱 Download Bill Swift App" — appears twice (once below hero CTAs, once as a floating bottom-right pill)
- **Top-nav CTA (button, top-right):** **"Get Started"**
- **Quick Recharge widget button:** "Recharge Now"
- **Developer API section buttons:** "Get API Access" + "View Documentation"
- **Contact form button:** "Send Message"
- **Floating bottom-left pill:** "👋 Chat with us!"

## 12. Pricing model

**Free wallet / retail-pricing model** — no paid SaaS tiers surfaced on the homepage. Pricing is implicit:

- **"Affordable Pricing"** + **"Competitive rates designed to help you save more with every transaction."** (Why-Choose list)
- **"Best wholesale rates for developers and resellers"** (Developer API section)
- **"Start your VTU business and earn daily profits with unbeatable prices."** (meta description — implies a reseller/wholesale channel)

No pricing page in nav. Revenue model is implicit: spread/discount on airtime/data/utility sales (user pays ₦1000 airtime, BillSwift bills the network ₦990 + their margin), bill-pay convenience fees, and wholesale API tiering for resellers.

The Quick Recharge widget accepts a numeric ₦ amount — but no fee is shown on the homepage; that's calculated at checkout (the actual `/recharge` POST endpoint is not reachable as a static page).

## 13. Unique / copy-worthy phrases (brand voice, verbatim)

- **"Instant Airtime & Data Top-Up"** (hero H1)
- **"Nigeria's most reliable VTU platform."** (hero subhead opener)
- **"Recharge airtime, buy data bundles, pay bills and more - all in seconds with our automated system."**
- **"Complete digital services for all your mobile and utility needs"** (services subhead)
- **"Leading the digital transformation of Nigeria's telecom services"** (about eyebrow)
- **"Your Trusted Digital Partner"** (about subhead)
- **"Bill Swift has been at the forefront of digital telecommunications services in Nigeria since 2018."** (founding year)
- **"a highly reliable system with a 99.9% success rate and 24/7 customer support to ensure you never face downtime"**
- **"We've grown into a trusted household name by prioritizing transparency, affordability, and innovation."**
- **"Our mission is simple: to empower Nigerians with the convenience of instant digital solutions, bridging the gap between technology and everyday needs."**
- **"Bill Swift – Instant, Reliable, and Affordable Digital Solutions."** (about closer — could double as a tagline)
- **"Nigeria's most trusted VTU platform for instant airtime, data, and bill payments."** (footer brand line)
- **"© 2025 Bill Swift. All rights reserved. Powered by innovation."** (footer legal)
- **"Lightning-fast API responses with 99.9% uptime guarantee"** (Developer API pillar)
- **"Bank-level security with encrypted API keys and HTTPS"** (Developer API pillar)
- **"Best wholesale rates for developers and resellers"** (Developer API pillar)

## Brand logo (favicon + OG image)

Single 258×272 RGBA PNG icon used as favicon, OG image, and apple-touch icon — saved to:
- `/home/z/my-project/research-assets/billswift-icon.png`
- `/home/z/my-project/public/images/projects/billswift-logo.png`

(JSON-LD `LocalBusiness.image` = same `https://billswift.com.ng/images/icon.PNG`)

Note: the icon is a transparent-background PNG of the brand mark — a stylized BS monogram / motion-arc mark (no separate SVG favicon exists; the page only ships the PNG).

## Contact & business info (JSON-LD `LocalBusiness`)

- **Address:** Delta State, Nigeria (footer), but JSON-LD declares `streetAddress: "Lagos"`, `addressLocality: "Lagos"`, `addressRegion: "LA"`, `postalCode: "100001"`, `addressCountry: "NG"` — there's a contradiction between the visible Delta State copy and the JSON-LD Lagos address. Treat Lagos as the registered address, Delta State as the operating base.
- **Phone:** +234 8051849045 (visible on Contact section + JSON-LD `telephone`)
- **Email:** support@billswift.com.ng (visible on Contact section + footer)
- **Hours:** 24/7 Online Support (visible) vs. top-bar "Working Hours: 8:00 AM - 7:00 PM" — slight inconsistency between the marketing claim of 24/7 and the displayed working-hours strip
- **Price range:** `$` (JSON-LD `priceRange`)
- **Social:** JSON-LD `sameAs` lists facebook.com/billswift, twitter.com/billswift, instagram.com/billswift (note: these profiles were not verified to exist — they're declared in structured data only)

## Developer API endpoint (verbatim from the page's code sample)

```
POST https://api.billswift.com.ng/v1/airtime/purchase
Authorization: Bearer your-api-key
Content-Type: application/json

{
  "network": "MTN",
  "phone": "08012345678",
  "amount": 1000,
  "reference": "unique-ref-123"
}

Response:
{
  "status": "success",
  "message": "Airtime purchase successful",
  "reference": "unique-ref-123",
  "balance": 45000.00
}
```

(Note: `api.billswift.com.ng` did NOT resolve to a live host when probed from this sandbox — HTTP 000. The API endpoint may exist but be DNS-firewalled, geo-restricted, or simply not yet deployed. The code sample on the site demonstrates intent.)

## Assets saved (BillSwift)

| Asset | Path | Size |
|---|---|---|
| Hero screenshot (above-the-fold) | `/home/z/my-project/research-assets/billswift-hero.png` | 203 KB · 1440×900 |
| Full-page screenshot | `/home/z/my-project/research-assets/billswift-full.png` | 305 KB · 1440×~3200 |
| Brand icon PNG (favicon + OG) | `/home/z/my-project/research-assets/billswift-icon.png` | 68 KB · 258×272 |
| Page reader JSON (raw HTML + meta) | `/tmp/billswift-page.json` (per-session tmp) | 47 KB |
| swift.css (main stylesheet) | `/home/z/my-project/research-assets/css/billswift-swift.css` | 19 KB |
| pre.css (preloader styles) | `/home/z/my-project/research-assets/css/billswift-pre.css` | 1 KB |
| popup.css (app-popup modal) | `/home/z/my-project/research-assets/css/billswift-popup.css` | 1 KB |
| **OKOMBA-READY preview image** | `/home/z/my-project/public/images/projects/billswift-preview.png` | 203 KB · 1440×900 |
| **OKOMBA-READY brand logo** | `/home/z/my-project/public/images/projects/billswift-logo.png` | 68 KB · 258×272 |

## Founder action items (for the Okomba Solutions/Products rebuild)

1. **Wire the BillSwift card's "Visit site" link to `https://www.billswift.com.ng/`** (the Okomba site currently has no Visit-site link on the BillSwift card).
2. **Reconcile the brand-name rendering.** The Okomba site currently writes "BillSwift" (camelCase, one word); the live product site writes "Bill Swift" (two words, both capitalized). Recommend matching the product site ("Bill Swift") on okomba.com for cross-property consistency.
3. **Replace the placeholder tagline.** The current Okomba Solutions card tagline for BillSwift is "Bills paid in seconds" (a short headline coined by Okomba). The live BillSwift site's actual H1 is "Instant Airtime & Data Top-Up" with subhead "Nigeria's most reliable VTU platform. Recharge airtime, buy data bundles, pay bills and more - all in seconds with our automated system." Recommend keeping Okomba's tighter "Bills paid in seconds" as the card tagline (it's well-written) but enriching the subhead with the live site's "Nigeria's most reliable VTU platform" framing.
4. **Lift the 3 capabilities bullets** from the live site instead of the current Okomba placeholders. Current Okomba bullets are "Airtime, data & utilities" / "Instant confirmation" / "Clean transaction records" — these match the live product's narrative ("instant delivery", "fast, secure, and hassle-free", "every transaction is fast, secure"). Consider expanding to include the 99.9% success rate claim or the 24/7 support.
5. **Add the stats band** (500K+ Happy Customers, 10M+ Transactions, 99.9% Success Rate, 24/7 Support) to the BillSwift project detail / case-study modal — this is the strongest social-proof signal on the live site.
6. **Mention the Developer API surface** in the Okomba BillSwift card — it's a real differentiator for the reseller/developer audience the Okomba Solutions section targets.
7. **Brand asset.** Use `/public/images/projects/billswift-logo.png` (258×272 brand icon) or `/public/images/projects/billswift-preview.png` (1440×900 hero screenshot) as the Okomba Solutions card image — both are already saved in the right path.
