# TrustScore — Research Brief (Task 19-B)

> **Sourced from the Okomba.com homepage (https://www.okomba.com) on 2026-08-28.**
> Captured via z-ai `web_search` + `page_reader` + `agent-browser` (DOM eval + screenshots).
> Every quoted string below is verbatim from the rendered live Okomba.com page.
>
> **CRITICAL FINDING:** No standalone live TrustScore product website was found.
> All 7 candidate URLs were probed (see §1); none resolve to an Okomba-owned TrustScore site.
> The only Okomba-owned TrustScore content lives **on the Okomba.com homepage itself**
> — in two places: the "Solutions" product card and the "Selected work" case-study block.
> Per task instructions ("If a site is unreachable after 3 attempts, note that explicitly
> and provide best-effort content from any web-search snippet you found"), this brief
> compiles that best-effort content verbatim.

## 1. Real URL that resolves

**NONE of the candidate URLs resolve to an Okomba-owned TrustScore site.** All 7 were probed with curl + DNS lookup on 2026-08-28:

| Candidate URL | HTTP | Notes |
|---|---|---|
| `https://trustscore.okomba.com` | **404** | Subdomain configured on okomba.com but no app deployed — returns the okomba.com 404 page (15 KB HTML) |
| `https://trustscore.ng` | **000** | DNS does not resolve (no A record) |
| `https://www.trustscore.com.ng` | **000** | DNS does not resolve |
| `https://trustscore.com` | **200** but body is a single-line parked-domain redirect to `/lander` — NOT a real product site; it's a domain-parking page (likely a GoDaddy/Bodis landing) |
| `https://trustscore.com.ng` | **000** | DNS does not resolve |
| `https://trust-score.okomba.com` | **000** | DNS does not resolve |
| `https://ts.okomba.com` | **000** | DNS does not resolve |
| `https://trustscore.app` | **200** | **Different company** — a Danish "TrustScore" review-collection SaaS (operated by TrustScore ApS, Copenhagen). NOT an Okomba product. Confirmed different org. |
| `https://trustscore.io` | **000** | DNS does not resolve |
| `https://trustscore.africa` | **000** | DNS does not resolve |
| `https://trustscore.cloud` | **000** | DNS does not resolve |

**Wayback Machine CDX / availability API** was also probed for `trustscore.okomba.com`, `trustscore.ng`, `www.trustscore.com.ng` — archive.org API timed out from this sandbox (network), but web search returned zero snapshots. There's no historical capture of an Okomba-owned TrustScore site either.

**Contrast with sibling Okomba products:** Okomba.com DOES link out to two live product sites in its Solutions / Selected Work sections — `https://turbopay.okomba.com` (Turbopay) and `https://votewise.com.ng` (Votewise) — both render a "VISIT SITE" pill on their case-study cards. The TrustScore card has only a "View project" modal trigger and **no "Visit site" link**, mirroring BillSwift, Omniscore CPaaS, and Sanctum Multipurpose — i.e. TrustScore is one of four Okomba products that are described on okomba.com but not (yet) deployed as standalone live sites.

**Action item for the founder:** the Okomba Solutions/Products card for TrustScore must NOT link to a non-existent domain. Either:
- (a) Leave it as a "View project" case-study modal trigger only (current behavior), OR
- (b) Use the Okomba.com anchor `https://www.okomba.com#work` (Selected Work section) as the TrustScore card's outbound link, OR
- (c) Wait until `trustscore.okomba.com` is actually deployed before adding a "Visit site" link.

## 2. Product name as displayed on the site

- Rendered in the **Solutions** product card: **"TrustScore"** (single word, capital T + capital S, camelCase)
- Rendered in the **Selected Work** case-study card: **"TrustScore"** (single word, camelCase)
- Footer "Products" link list: **"TrustScore"** (single word, camelCase)
- Page `<meta og:description>` (search-result snippet from the Okomba.com page): references "TrustScore — Know who you're dealing with"

⚠️ The Okomba site consistently renders the brand as **"TrustScore"** (one word, camelCase). This is consistent across Solutions, Selected Work, and footer. (Note: there are many third-party "TrustScore"-named products globally — see §1 — but the Okomba TrustScore brand follows the Okomba house style of camelCase product names: BillSwift, Turbopay, Omniscore, TrustScore.)

## 3. Hero tagline / headline (verbatim, from the Okomba.com Solutions + Selected Work cards)

**Tagline (shown below the product name on both the Solutions card and Selected Work card):**

> **Know who you're dealing with**

This is the only TrustScore tagline that appears on Okomba.com. It's used twice:
1. As the `<p>` directly below the `<h3>TrustScore</h3>` in the Solutions product card.
2. As the `<p>` directly below the `<h2>TrustScore</h2>` in the Selected Work case-study card.

There is no separate hero tagline for TrustScore on its own page (because no standalone page exists).

## 4. Hero subhead / value-prop (verbatim, from the Okomba.com Solutions card)

> **Identity verification and trust scoring for businesses that need to validate customers quickly and confidently.**

This is the longer-form value-prop paragraph shown on the TrustScore Solutions card, directly below the tagline.

The Selected Work case-study card uses a different copy structure — a 3-part Problem / Approach / Result narrative (see §5 below), not a single subhead.

## 5. Feature bullets / capabilities (verbatim, from the Okomba.com Solutions card)

Three capability bullets are listed below the subhead, each with a gold dot bullet and a short label:

1. **Identity verification**
2. **Trust scoring**
3. **Fraud-aware checks**

(Each rendered with a small gold dot prefix `•` and a 1-sentence-style label — they are NOT full sentences, just noun-phrase labels.)

**Companion copy** from the Selected Work case-study card's Problem → Approach → Result structure (verbatim):

> **PROBLEM**
> **Businesses can't quickly tell who they're dealing with.**
>
> **APPROACH**
> **Identity verification engine with trust scoring and fraud-aware checks.**
>
> **RESULT**
> **Customers validated fast, with confidence behind every check.**

Tags rendered on the Selected Work card (verbatim, as pill labels): **KYC** · **Identity** · **Trust**

## 6. Who it's for

The Solutions card subhead is explicit about the audience:

> "Identity verification and trust scoring for **businesses** that need to **validate customers** quickly and confidently."

So the target audience is:

- **Businesses that need to verify customer identity** (KYC, onboarding)
- Implied sectors (from the Problem statement "Businesses can't quickly tell who they're dealing with"): fintechs, lenders, marketplaces, gig platforms, property/rental platforms, e-commerce — anywhere a business needs to confirm a counterparty's identity at scale.
- Implicit: organizations subject to KYC/AML regulation (the **KYC** tag explicitly signals this).

No industry list is given on the Okomba site for TrustScore (unlike the BillSwift card which names "airtime, data, utilities"). The audience framing is horizontal — "businesses that need to validate customers".

## 7. Design language

### Source of design tokens

TrustScore has no standalone product site, so its design language is whatever Okomba.com itself uses — i.e. the premium dark navy/gold Okomba Analytics house style (see Okomba's own globals.css + layout.tsx). The Solutions card on Okomba.com is rendered using these tokens:

| Token | Value | Use on TrustScore card |
|---|---|---|
| Background | `#05070d` / `#0A0E17` (deep navy-black gradient) | Page background |
| Gold accent | `#F0A500` (Okomba gold) | Tagline color, capability bullet dots, eyebrow pill, top hairline gradient |
| Teal accent | `#00C9A7` (Okomba teal) | Secondary accent (case-study tags / "View project" hover) |
| Text foreground | `#E8F4FD`-ish pale ice blue (from `text-foreground`) | Body copy |
| Muted foreground | Okomba muted-foreground | Subhead + tag labels |
| Surface card | `surface-card-light` class — translucent white-ish over navy | Card surface |

### Typography (Okomba house style — applies to the TrustScore card)

- Display font: **Space Grotesk** (via next/font) — used for the `TrustScore` H3 and tagline `<p>`
- Body font: **Inter** (via next/font) — used for the subhead paragraph
- Eyebrow / mono labels: **JetBrains Mono** (via next/font) — used for the "IDENTITY VERIFICATION" eyebrow above the card title

### Layout patterns (confirmed from the live Okomba.com Solutions section)

- The Solutions section is titled **"Products & platforms"** (gold eyebrow pill) with H2 **"Not just services — real products we run"** (with "real products" in a gold gradient text fill).
- Section subhead: **"Okomba Analytics builds and operates its own technology platforms. The same engineering discipline behind them is what we deploy on every client engagement."**
- Product cards (Turbopay, BillSwift, **TrustScore**, Omniscore CPaaS, Votewise, Sanctum Multipurpose) are rendered in two marquee tracks scrolling opposite directions (`animate-marquee` + `animate-marquee-reverse`), masked at the edges with `mask-fade-x`. Card width 300px on mobile, 340px on ≥sm.
- Each card structure:
  - Top: 3px gold gradient hairline (`from-gold-light via-gold to-gold-light opacity-70`)
  - Row 1: 12×12 gold-dim rounded-2xl icon container with a Lucide SVG icon (TrustScore uses a shield-check-style icon) + an eyebrow pill ("Identity Verification" for TrustScore, gold border + gold-dim bg + gold text, text-[9px])
  - H3 product name (font-display, 21px, bold)
  - Tagline `<p>` (12.5px, medium, gold)
  - Subhead paragraph (13px, muted-foreground, line-clamp-3)
  - Capabilities `<ul>` (3 items, 12.5px, gold-dot bullet + muted-foreground text)
  - CTA button: **"Discuss this solution"** (text-only link with arrow-up-right Lucide icon, hover gold)
- The Selected Work section uses a different layout: large editorial case-study cards stacked vertically. Each has eyebrow ("IDENTITY VERIFICATION" for TrustScore), H2 product name ("TrustScore"), tagline `<p>` ("Know who you're dealing with"), Problem/Approach/Result block, tag pills, "View project" button.

### Distinctive visual notes

- The TrustScore card is **visually identical in structure** to the BillSwift, Turbopay, Omniscore, Votewise, and Sanctum cards — only the icon, eyebrow, name, tagline, subhead, and 3 bullets differ. This is a deliberate Okomba house pattern.
- The card uses a 3px gold gradient hairline across the top — a subtle brand accent that catches the eye without overpowering.
- The tagline (gold) and bullets (gold-dot + muted) are deliberately understated so the H3 product name is the visual anchor.
- Unlike Turbopay + Votewise, TrustScore has **no "Visit site" link** in the Selected Work card (because there's no live site) — only "View project" (case-study modal trigger).

## 8. Visual / hero image

There is **no standalone TrustScore hero image** on its own page (because no standalone page exists). However, Okomba.com ships a 1344×768 PNG asset specifically used as the Solutions-section preview image for TrustScore:

- **`https://www.okomba.com/images/project-trustscore.png`** → HTTP 200, 108 KB, **1344×768** (file extension is `.png` but the actual bytes are JPEG/JFIF — the file is misnamed; still renders fine in browsers).
- This is the asset the Okomba Solutions section uses (via next/image with srcset widths 384/640/750/828/1080/1200/1920/2048/3840) as the card preview image.
- Downloaded locally to `/home/z/my-project/research-assets/trustscore-okomba-card.png` (108 KB).
- Copied to `/home/z/my-project/public/images/projects/trustscore-preview.png` (108 KB · 1344×768) — ready to drop into the Okomba Solutions card as-is.

Note: this image is the Okomba-designed premium dark navy/gold banner with the Okomba wordmark (it was AI-generated by the Okomba team — see worklog Task R3). It's NOT a screenshot of a live TrustScore product UI (because none exists). It's a brand-style banner.

## 9. OG image URL

There is **no standalone OG image for TrustScore** — only Okomba.com's own OG image applies:

- `<meta property="og:image">` on Okomba.com = **`https://okomba.com/og-image.png`** (1344×768 PNG, 111 KB — the Okomba brand banner, also generated in worklog Task R3)

OG metadata (from Okomba.com's `<head>`):
- `og:title` = "Okomba Analytics — Digital Products, Systems & Experiences"
- `og:description` = "Web development, fintech solutions, payment systems, automation and digital operations — engineered to move your business forward."
- `og:url` = "https://okomba.com"
- `og:site_name` = "Okomba Analytics"
- `og:locale` = "en_NG"
- `og:image` = "https://okomba.com/og-image.png"
- `og:image:width` = 1344 / `og:image:height` = 768
- `og:image:alt` = "Okomba Analytics — Digital Products, Systems & Experiences"
- `og:type` = "website"
- `twitter:card` = "summary_large_image", `twitter:image` = same as `og:image`

When the Okomba Solutions card links out to a TrustScore URL (once `trustscore.okomba.com` is live), social-card previews will inherit whatever OG tags that future site sets. Until then, there is no TrustScore-specific OG image to fetch.

## 10. Testimonial / quote

**No testimonial / customer quote for TrustScore exists on the Okomba.com site.**

Okomba.com does have a "Client Voices" testimonials section with real quotes (e.g. Chukwuemeka Obi · Founder, TechStartNG; Seyi Akinwale · Operations Director, EduBridge; Chinwe Eze · MD, FinFlow Microfinance Bank), but none of these testimonials reference TrustScore specifically — they describe general Okomba engagements. There is no TrustScore case-study testimonial.

## 11. CTA copy

On the Okomba.com Solutions product card for TrustScore, the CTA is:

- **Card CTA (text + arrow icon):** **"Discuss this solution"** — opens the inquiry modal (Okomba's general "Tell us about your project" form)

On the Okomba.com Selected Work case-study card for TrustScore, the CTA is:

- **Card CTA:** **"View project"** — opens a case-study modal with the Problem / Approach / Result narrative (no separate detail page exists; the modal is the entire content)
- **No "Visit site" link** (unlike the Turbopay and Votewise cards, which DO link out to live product sites).

## 12. Pricing model

**No pricing is mentioned for TrustScore on Okomba.com.** The Okomba Solutions section is intentionally non-transactional — every product card uses the same "Discuss this solution" CTA, funneling inquiries into a discovery call rather than surfacing a price.

TrustScore pricing is presumably enterprise-quote / engagement-based (consistent with how Okomba prices its other custom-built product engagements — BillSwift, Omniscore CPaaS, Sanctum Multipurpose also have no public pricing).

## 13. Unique / copy-worthy phrases (verbatim from Okomba.com)

- **"Know who you're dealing with"** (tagline, used twice — Solutions card + Selected Work card)
- **"Identity verification and trust scoring for businesses that need to validate customers quickly and confidently."** (Solutions subhead)
- **"Identity verification engine with trust scoring and fraud-aware checks."** (Selected Work APPROACH)
- **"Customers validated fast, with confidence behind every check."** (Selected Work RESULT)
- **"Businesses can't quickly tell who they're dealing with."** (Selected Work PROBLEM)
- **Capability labels:** "Identity verification" · "Trust scoring" · "Fraud-aware checks"
- **Case-study tags:** "KYC" · "Identity" · "Trust"
- **Eyebrow:** "IDENTITY VERIFICATION" (Selected Work) / "Identity Verification" (Solutions card)

## Assets saved (TrustScore)

| Asset | Path | Size |
|---|---|---|
| Okomba project-trustscore.png (card preview) | `/home/z/my-project/research-assets/trustscore-okomba-card.png` | 108 KB · 1344×768 |
| **OKOMBA-READY preview image** | `/home/z/my-project/public/images/projects/trustscore-preview.png` | 108 KB · 1344×768 |
| Okomba Solutions section screenshot | `/home/z/my-project/research-assets/okomba-current-solutions-section.png` | 281 KB · 1440×900 |
| Okomba Selected Work screenshot | `/home/z/my-project/research-assets/okomba-current-selected-work.png` | 275 KB · 1440×900 |
| Page reader JSON for okomba.com | `/tmp/okomba.html` (per-session tmp) | 323 KB |

No CSS for TrustScore standalone site exists (none needed — TrustScore uses Okomba's own house CSS).

## Founder action items (for the Okomba Solutions/Products rebuild)

1. **Do NOT add a "Visit site" link** to the TrustScore card — there is no live TrustScore product website to link to. Leave the card as a "View project" / "Discuss this solution" funnel only. (Or alternatively wire it to `https://www.okomba.com#work` — the Selected Work anchor — as the internal anchor.)
2. **Keep the existing Okomba-coined copy** — it's actually well-written and on-brand. The tagline "Know who you're dealing with" and the Problem/Approach/Result narrative ("Businesses can't quickly tell who they're dealing with." → "Identity verification engine with trust scoring and fraud-aware checks." → "Customers validated fast, with confidence behind every check.") are all brand-aligned, factually honest, and match Okomba's editorial voice. They don't need to be replaced with invented claims (which the founder explicitly asked us NOT to do).
3. **Enrich the 3 capability bullets** if the founder wants more depth. The current 3 ("Identity verification" / "Trust scoring" / "Fraud-aware checks") are noun-phrase labels. To bring them in line with BillSwift's slightly longer bullets, they could be expanded to e.g. "Identity verification (KYC)" / "Real-time trust scoring" / "Fraud-aware risk checks" — but only with founder sign-off, since these are not currently verbatim from any live site.
4. **Use the existing `project-trustscore.png`** as the card preview image — it's already in the repo (worklog Task R3 generated it). It's an Okomba-designed premium banner, not a real product UI screenshot. **Do not** generate an AI mockup of a "TrustScore dashboard" and pass it off as a real screenshot — the founder explicitly said no AI-generated content.
5. **Consider a "Coming soon" / "In development" status pill** on the TrustScore card (and on BillSwift, Omniscore, Sanctum — all of which also lack live product sites) so the Okomba site is honest about which products are live (Turbopay + Votewise have "LIVE" pills) vs. which are roadmap items. This is a UX/credibility call for the founder to make.
6. **No logo SVG to fetch.** Unlike Turbopay and Votewise (which have their own favicon SVGs), TrustScore has no deployed standalone site and therefore no separate brand favicon. The Okomba wordmark serves as the de-facto brand mark for the TrustScore card.
