import { db } from "@/lib/db";

/* ─────────────────────────────────────────────────────────────
   BATCH 6 (§37–42) — SERVER-ONLY ad engine.

   Re-exports the client-safe vocabulary from ads-shared.ts and
   adds the Prisma-backed pieces: the §42 lazy lifecycle engine
   and the sanitized public projection. Client components must
   import from ads-shared.ts (Turbopack pulls Prisma into the
   browser bundle otherwise — see the media/media-shared split).
   ───────────────────────────────────────────────────────────── */

export * from "./ads-shared";
import { AD_LIVE_STATUSES, type PublicAd } from "./ads-shared";

/* ─────────────────────────────────────────────────────────────
   §42 — lifecycle engine. Lazy, idempotent, race-safe (each
   transition is a conditional updateMany, never a blind write).
   Returns the number of rows flipped in this pass.

   scheduled → active   when startAt ≤ now and the window is open
   active    → completed|expired when endAt < now (paid → completed)
   scheduled → expired  when the whole window is already past
   ───────────────────────────────────────────────────────────── */
export async function runAdLifecycle(): Promise<number> {
  const now = new Date();
  let flipped = 0;

  // scheduled → active when the window opens
  const goActive = await db.adRequest.updateMany({
    where: {
      status: "scheduled",
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gt: now } }],
    },
    data: { status: "active", publishedAt: now },
  });
  flipped += goActive.count;

  // active → completed (paid/waived) | expired (unpaid) when window closes
  const closedActive = await db.adRequest.findMany({
    where: { status: "active", endAt: { lte: now } },
    select: { id: true, paymentStatus: true },
  });
  for (const row of closedActive) {
    const next: string =
      row.paymentStatus === "paid" || row.paymentStatus === "waived" ? "completed" : "expired";
    const r = await db.adRequest.updateMany({
      where: { id: row.id, status: "active" },
      data: { status: next },
    });
    flipped += r.count;
  }

  // scheduled but window already fully past → expired (never went live)
  const neverStarted = await db.adRequest.updateMany({
    where: { status: "scheduled", endAt: { lte: now } },
    data: { status: "expired" },
  });
  flipped += neverStarted.count;

  return flipped;
}

/* ─────────────────────────────────────────────────────────────
   Public projection — never leaks identity/payment/internal data.
   ───────────────────────────────────────────────────────────── */
type AdRow = {
  id: string;
  placement: string;
  adType: string;
  headline: string | null;
  bodyCopy: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  creativeUrl: string | null;
  company: string | null;
  creative?: { url: string; thumbUrl: string | null } | null;
};

export function toPublicAd(row: AdRow): PublicAd {
  const imageUrl = row.creative?.url ?? row.creativeUrl ?? null;
  return {
    id: row.id,
    placement: row.placement,
    adType: row.adType,
    headline: row.headline,
    bodyCopy: row.bodyCopy,
    ctaLabel: row.ctaLabel,
    ctaUrl: row.ctaUrl,
    imageUrl,
    company: row.company,
    sponsored: true,
  };
}

/* Active ads for a placement, newest published first, capped so a
   single placement can never overpower primary content (§41). */
export async function activeAdsForPlacement(placement: string, cap = 5): Promise<PublicAd[]> {
  const rows = await db.adRequest.findMany({
    where: { status: { in: AD_LIVE_STATUSES }, placement },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: cap,
    select: {
      id: true,
      placement: true,
      adType: true,
      headline: true,
      bodyCopy: true,
      ctaLabel: true,
      ctaUrl: true,
      creativeUrl: true,
      company: true,
      creative: { select: { url: true, thumbUrl: true } },
    },
  });
  return rows.map(toPublicAd);
}
