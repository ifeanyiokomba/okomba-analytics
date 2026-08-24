"use client";

import { useId } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Okomba Analytics brand system.
 *
 * OkombaMark — the badge: deep-ink squircle, bold serif "O" monogram,
 * honey-gold gradient sparkle (the "insight spark") at the top right.
 * Pure SVG, crisp at any size, light & dark backgrounds.
 *
 * OkombaLockup — the full lockup: badge + serif "Okomba" wordmark +
 * letterspaced gold "ANALYTICS" strapline. Rendered as real typography
 * so the brand reads loud and clear at every size.
 */

const GOLD_STOPS = ["#FFE5A8", "#FFD580", "#F5C451", "#E3A81C", "#C98F0F"];

export function OkombaMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gold = `okGold${uid}`;
  const goldSoft = `okGoldSoft${uid}`;
  const badge = `okBadge${uid}`;
  const sheen = `okSheen${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Okomba Analytics logo mark"
    >
      <defs>
        <linearGradient id={gold} x1="12" y1="8" x2="84" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={GOLD_STOPS[0]} />
          <stop offset="0.42" stopColor={GOLD_STOPS[2]} />
          <stop offset="1" stopColor={GOLD_STOPS[4]} />
        </linearGradient>
        <linearGradient id={goldSoft} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFD580" />
          <stop offset="1" stopColor="#D4A017" />
        </linearGradient>
        <linearGradient id={badge} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#151C30" />
          <stop offset="0.55" stopColor="#0B101F" />
          <stop offset="1" stopColor="#060910" />
        </linearGradient>
        <linearGradient id={sheen} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.14" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* badge */}
      <rect width="96" height="96" rx="27" fill={`url(#${badge})`} />
      <rect width="96" height="96" rx="27" fill={`url(#${sheen})`} />
      {/* gold rim */}
      <rect
        x="1.25"
        y="1.25"
        width="93.5"
        height="93.5"
        rx="25.9"
        stroke={`url(#${goldSoft})`}
        strokeWidth="1.6"
        opacity="0.65"
      />

      {/* serif O monogram */}
      <text
        x="45"
        y="52"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="56"
        fontWeight="700"
        fill="#FFFFFF"
      >
        O
      </text>
      {/* hairline gold baseline under the O */}
      <rect x="26" y="66" width="38" height="2.6" rx="1.3" fill={`url(#${gold})`} opacity="0.9" />

      {/* the insight spark — 4-point gold star */}
      <path
        d="M74.5 12.5 L77.3 21.2 L86 24 L77.3 26.8 L74.5 35.5 L71.7 26.8 L63 24 L71.7 21.2 Z"
        fill={`url(#${gold})`}
      />
      <circle cx="74.5" cy="24" r="12.5" stroke={`url(#${goldSoft})`} strokeWidth="1.1" opacity="0.35" />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────── */

type LockupSize = "sm" | "md" | "lg";
type LockupTone = "light" | "dark";

const LOCKUP_SCALE: Record<
  LockupSize,
  { badge: number; name: number; strap: number; gap: number; strapOffset: number }
> = {
  sm: { badge: 33, name: 18, strap: 7.5, gap: 9, strapOffset: 3.5 },
  md: { badge: 40, name: 22, strap: 9, gap: 11, strapOffset: 4.5 },
  lg: { badge: 50, name: 28, strap: 11, gap: 13, strapOffset: 5.5 },
};

export function OkombaLockup({
  size = "md",
  tone = "light",
  className,
  priority = false,
}: {
  size?: LockupSize;
  tone?: LockupTone;
  className?: string;
  priority?: boolean;
}) {
  const s = LOCKUP_SCALE[size];
  return (
    <span className={cn("inline-flex select-none items-center", className)} style={{ gap: s.gap }}>
      <OkombaMark size={s.badge} />
      <span className="flex min-w-0 flex-col" style={{ gap: s.strapOffset }}>
        <span
          className={cn(
            "font-serif leading-[0.95] tracking-[-0.015em]",
            tone === "dark" ? "text-white" : "text-ink"
          )}
          style={{ fontSize: s.name, fontWeight: 700 }}
        >
          Okomba
        </span>
        <span
          className={cn(
            "font-mono font-semibold uppercase leading-none",
            tone === "dark" ? "text-gold-light" : "text-gold"
          )}
          style={{ fontSize: s.strap, letterSpacing: "0.36em", paddingLeft: "0.08em" }}
        >
          Analytics
        </span>
      </span>
    </span>
  );
}

/* ──────────────────────────────────────────────────────────── */

/**
 * Navbar lockup — the brand, front and centre. Light tone on the
 * translucent white bar; tone flips automatically inside dark sections.
 */
export function OkombaNavLogo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <OkombaLockup
      size="md"
      tone="light"
      priority={priority}
      className={cn("transition-transform duration-300 hover:scale-[1.02]", className)}
    />
  );
}

/**
 * Legacy PNG badge — kept for contexts that still reference the original
 * raster asset (OG image, print exports). Prefer the lockup.
 */
export function OkombaLogo({
  height = 34,
  className,
  priority = false,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const width = Math.round(height * (1308 / 428));
  return (
    <span
      className={cn("inline-flex overflow-hidden rounded-[22%/100%] ring-1 ring-white/15", className)}
      style={{ boxShadow: "0 2px 14px rgba(240,165,0,0.14)" }}
    >
      <Image
        src="/images/logo.png"
        alt="Okomba Analytics"
        width={width}
        height={height}
        priority={priority}
        className="block h-auto w-auto"
        sizes={`${width}px`}
      />
    </span>
  );
}
