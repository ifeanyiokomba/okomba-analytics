/* ─────────────────────────────────────────────────────────────
   BATCH 6 (§37–42) — CLIENT-SAFE ad vocabulary.

   Split from src/lib/ads.ts (server-only: imports Prisma) after
   the same Turbopack lesson as media-shared/media in Task 41:
   a client component importing constants from a module that
   transitively imports `db` drags Prisma into the browser bundle.
   Public/admin UI imports THIS file; the route handlers and
   lifecycle engine import src/lib/ads.ts, which re-exports this.
   ───────────────────────────────────────────────────────────── */

/* §40 — canonical approval statuses */
export const AD_STATUSES = [
  "new",
  "reviewing",
  "awaiting_customer",
  "approved",
  "payment_pending",
  "paid",
  "scheduled",
  "active",
  "paused",
  "completed",
  "rejected",
  "expired",
] as const;
export type AdStatus = (typeof AD_STATUSES)[number];

/* §40 — payment states */
export const AD_PAYMENT_STATUSES = ["unpaid", "pending", "paid", "waived", "refunded"] as const;
export type AdPaymentStatus = (typeof AD_PAYMENT_STATUSES)[number];

/* §41 — ad formats offered to advertisers */
export const AD_TYPES = [
  { key: "banner", label: "Sponsored banner", desc: "Slim full-width banner under the hero band." },
  { key: "card", label: "Sponsored card", desc: "A clearly-labelled card inside the Insights grid." },
  { key: "sidebar", label: "Sidebar unit", desc: "Compact unit in the article side rail." },
  { key: "inline", label: "Inline placement", desc: "In-content unit at the end of an article." },
  { key: "carousel", label: "Campaign carousel", desc: "Rotating slot shared by multiple campaigns." },
] as const;
export type AdType = (typeof AD_TYPES)[number]["key"];

/* §41 — placements (where an ad renders). */
export const AD_PLACEMENTS = [
  {
    key: "home-banner",
    label: "Home banner",
    format: "banner" as AdType,
    desc: "Directly beneath the stats band on the homepage — maximum early visibility without disturbing content.",
  },
  {
    key: "insights-card",
    label: "Insights sponsored card",
    format: "card" as AdType,
    desc: "A sponsored card alongside our latest insights — high-intent readers.",
  },
  {
    key: "insights-sidebar",
    label: "Insights sidebar",
    format: "sidebar" as AdType,
    desc: "Compact sidebar unit beside the insights heading area.",
  },
  {
    key: "article-inline",
    label: "Article inline",
    format: "inline" as AdType,
    desc: "Native in-content unit at the end of every article read.",
  },
] as const;
export type AdPlacementKey = (typeof AD_PLACEMENTS)[number]["key"];

export const AD_PLACEMENT_KEYS: readonly string[] = AD_PLACEMENTS.map((p) => p.key);
export const AD_TYPE_KEYS: readonly string[] = AD_TYPES.map((t) => t.key);

export function adPlacementLabel(key: string): string {
  return AD_PLACEMENTS.find((p) => p.key === key)?.label ?? key;
}
export function adTypeLabel(key: string): string {
  return AD_TYPES.find((t) => t.key === key)?.label ?? key;
}

/* Statuses that render publicly (engine keeps these accurate). */
export const AD_LIVE_STATUSES: AdStatus[] = ["active"];
/* Statuses considered "waiting on admin action" for the queue badge. */
export const AD_INBOX_STATUSES: AdStatus[] = ["new", "reviewing", "awaiting_customer"];

/* ── Status/pill styling shared by the admin UI ── */
export const AD_STATUS_STYLES: Record<string, string> = {
  new: "border-gold/35 bg-gold-dim text-gold",
  reviewing: "border-teal/35 bg-teal-dim text-teal",
  awaiting_customer: "border-orange-400/35 bg-orange-400/10 text-orange-300",
  approved: "border-emerald-400/35 bg-emerald-400/10 text-emerald-300",
  payment_pending: "border-gold/35 bg-gold-dim text-gold",
  paid: "border-teal/35 bg-teal-dim text-teal",
  scheduled: "border-sky-300/35 bg-sky-300/10 text-sky-200",
  active: "border-emerald-400/35 bg-emerald-400/10 text-emerald-300",
  paused: "border-white/20 bg-white/5 text-muted-foreground",
  completed: "border-teal/35 bg-teal-dim text-teal",
  rejected: "border-red-500/30 bg-red-500/10 text-red-300",
  expired: "border-white/20 bg-white/5 text-muted-foreground",
};

export const AD_PAYMENT_STYLES: Record<string, string> = {
  unpaid: "border-white/20 bg-white/5 text-muted-foreground",
  pending: "border-gold/35 bg-gold-dim text-gold",
  paid: "border-teal/35 bg-teal-dim text-teal",
  waived: "border-purple-400/35 bg-purple-400/10 text-purple-300",
  refunded: "border-red-500/30 bg-red-500/10 text-red-300",
};

/* §41 — public ad projection (what the client fetches). */
export type PublicAd = {
  id: string;
  placement: string;
  adType: string;
  headline: string | null;
  bodyCopy: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  company: string | null;
  sponsored: true;
};
