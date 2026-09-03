"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicAd } from "@/lib/ads-shared";

/* ── BATCH 6 (§41/§42) — public sponsored slot ────────────────
   One component, three presentations (banner / card / inline).
   • Fetches live ads for its placement from GET /api/ads.
   • Renders NOTHING when a placement has no live campaign —
     public pages stay exactly as they were with zero inventory.
   • Multiple campaigns rotate automatically (campaign carousel).
   • Every impression is clearly labelled "Sponsored" (§41) and
     sized to complement — never overpower — primary content.
   • CTA clicks are tracked (fire-and-forget) then open in a new
     tab with rel="sponsored noopener".                         */

type Variant = "banner" | "card" | "inline";

type SponsoredSlotProps = {
  placement: string;
  variant: Variant;
  /** banner: per-session dismissal key (localStorage). */
  dismissKey?: string;
};

const ROTATE_MS = 7000;

export function SponsoredSlot({ placement, variant, dismissKey }: SponsoredSlotProps) {
  const [ads, setAds] = useState<PublicAd[]>([]);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const rotateTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/ads?placement=${encodeURIComponent(placement)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { ads?: PublicAd[] };
        if (alive && Array.isArray(data.ads)) setAds(data.ads);
      } catch {
        /* no inventory — stay silent */
      }
    })();
    return () => {
      alive = false;
    };
  }, [placement]);

  // Session dismissal (banner only) — read in a microtask so the effect
  // body stays free of synchronous setState (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!dismissKey) return;
    let alive = true;
    queueMicrotask(() => {
      if (!alive) return;
      try {
        if (sessionStorage.getItem(`adDismissed:${dismissKey}`) === "1") setDismissed(true);
      } catch {}
    });
    return () => {
      alive = false;
    };
  }, [dismissKey]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    if (dismissKey) {
      try {
        sessionStorage.setItem(`adDismissed:${dismissKey}`, "1");
      } catch {}
    }
  }, [dismissKey]);

  // Campaign carousel rotation when multiple live ads share a slot
  useEffect(() => {
    if (ads.length <= 1) return;
    rotateTimer.current = setInterval(() => {
      setIndex((i) => (i + 1) % ads.length);
    }, ROTATE_MS);
    return () => {
      if (rotateTimer.current) clearInterval(rotateTimer.current);
    };
  }, [ads.length]);

  if (dismissed || ads.length === 0) return null;

  const ad = ads[Math.min(index, ads.length - 1)];

  const trackClick = () => {
    try {
      void fetch("/api/ads/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ad.id }),
        keepalive: true,
      });
    } catch {
      /* tracking is best-effort */
    }
  };

  const ctaHref = ad.ctaUrl ?? ad.headline ? (ad.ctaUrl ?? undefined) : undefined;
  const cta = (
    <a
      href={ctaHref ?? "#advertise"}
      target={ctaHref ? "_blank" : undefined}
      rel={ctaHref ? "sponsored noopener noreferrer" : undefined}
      onClick={trackClick}
      className={cn(
        "group/cta inline-flex shrink-0 items-center gap-1.5 rounded-lg font-semibold transition-all",
        variant === "banner"
          ? "btn-gold px-4 py-2 text-[12.5px] text-ink"
          : "btn-gold px-5 py-2.5 text-[13px] text-ink"
      )}
    >
      {ad.ctaLabel ?? "Learn more"}
      <ArrowRight size={13} className="transition-transform group-hover/cta:translate-x-0.5" aria-hidden="true" />
    </a>
  );

  const image = ad.imageUrl ? (
    <img
      src={ad.imageUrl}
      alt={ad.company ? `${ad.company} — sponsored campaign` : "Sponsored campaign"}
      className="object-cover"
      loading="lazy"
      decoding="async"
    />
  ) : null;

  const sponsoredChip = (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold-dim px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gold"
      title="This placement is paid for by an advertiser"
    >
      Sponsored
    </span>
  );

  /* ── Banner: slim strip, dismissible, never covers content ── */
  if (variant === "banner") {
    return (
      <div
        className="relative border-y border-gold/20 bg-gradient-to-r from-gold/[0.06] via-transparent to-gold/[0.06]"
        role="complementary"
        aria-label="Sponsored banner"
      >
        <div className="container-xl flex min-h-[64px] flex-wrap items-center gap-x-5 gap-y-3 py-3">
          {ad.imageUrl && (
            <span className="hidden h-11 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 sm:block">
              {image}
            </span>
          )}
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
            {sponsoredChip}
            <span className="truncate text-[14px] font-semibold text-foreground">
              {ad.headline ?? ad.company ?? "Sponsored"}
            </span>
            {ad.bodyCopy && (
              <span className="hidden max-w-xl truncate text-[12.5px] text-muted-foreground md:block">
                {ad.bodyCopy}
              </span>
            )}
          </span>
          {cta}
          {ads.length > 1 && (
            <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex" aria-hidden="true">
              <button
                onClick={() => setIndex((i) => (i - 1 + ads.length) % ads.length)}
                aria-label="Previous sponsored campaign"
                className="rounded-md p-1 transition-colors hover:text-foreground"
              >
                <ChevronLeft size={14} />
              </button>
              {index + 1}/{ads.length}
              <button
                onClick={() => setIndex((i) => (i + 1) % ads.length)}
                aria-label="Next sponsored campaign"
                className="rounded-md p-1 transition-colors hover:text-foreground"
              >
                <ChevronRight size={14} />
              </button>
            </span>
          )}
          <button
            onClick={dismiss}
            aria-label="Hide sponsored banner for this session"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  /* ── Card: sponsored tile matching the insights card rhythm ── */
  if (variant === "card") {
    return (
      <article
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-b from-gold/[0.05] to-transparent"
        aria-label="Sponsored card"
      >
        {ad.imageUrl && (
          <span className="block h-[150px] w-full overflow-hidden">
            {image}
          </span>
        )}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-3">
            {sponsoredChip}
            {ad.company && (
              <span className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {ad.company}
              </span>
            )}
          </div>
          <h3 className="text-[16px] font-semibold leading-snug text-foreground">
            {ad.headline ?? "Sponsored"}
          </h3>
          {ad.bodyCopy && (
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">{ad.bodyCopy}</p>
          )}
          <div className="mt-auto pt-2">{cta}</div>
        </div>
      </article>
    );
  }

  /* ── Inline: end-of-article native unit ── */
  return (
    <aside
      className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-gold/25 bg-gold/[0.04] p-5"
      aria-label="Sponsored placement"
    >
      {ad.imageUrl && (
        <span className="h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10">
          {image}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-center gap-2.5">
          {sponsoredChip}
          {ad.company && (
            <span className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {ad.company}
            </span>
          )}
        </span>
        <span className="text-[14.5px] font-semibold leading-snug text-foreground">
          {ad.headline ?? "Sponsored"}
        </span>
        {ad.bodyCopy && (
          <span className="text-[12.5px] leading-relaxed text-muted-foreground">{ad.bodyCopy}</span>
        )}
      </span>
      {cta}
    </aside>
  );
}
