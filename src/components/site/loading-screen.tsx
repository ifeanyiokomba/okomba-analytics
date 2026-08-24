"use client";

import { useEffect, useState } from "react";
import { OkombaLogo } from "./logo";

/**
 * Entrance load screen — brief, professional brand reveal.
 * Logo scale-fades in with a gold sweep shimmer, then hands off.
 * Total duration ≈ 1.15s (kept deliberately short for snappy UX).
 */
export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 900);
    const doneTimer = setTimeout(onDone, 1250);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      aria-label="Loading Okomba Analytics"
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#05070d] transition-opacity duration-350 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* ambient backdrop */}
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(40%_40%_at_50%_50%,black,transparent)]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.08] blur-[90px]"
        style={{ animation: "glow-breathe 1.8s ease-in-out infinite" }}
        aria-hidden="true"
      />

      {/* logo reveal: rise + settle + soft glow pulse */}
      <div className="relative" style={{ animation: "logo-reveal 0.7s cubic-bezier(0.22,1,0.36,1) both" }}>
        <OkombaLogo height={52} priority />
        {/* gold sweep across the badge */}
        <span
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[22%/100%]"
          aria-hidden="true"
        >
          <span
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-gold/25 to-transparent"
            style={{ animation: "sweep-across 0.9s 0.25s ease-in-out both" }}
          />
        </span>
      </div>

      {/* tagline + progress hairline */}
      <p
        className="eyebrow relative mt-6 text-[10px] tracking-[0.28em] text-muted-foreground/80"
        style={{ animation: "fade-up-soft 0.5s 0.35s ease-out both" }}
      >
        Digital Services &amp; Technology
      </p>
      <div
        className="relative mt-6 h-[2px] w-40 overflow-hidden rounded-full bg-white/[0.07]"
        style={{ animation: "fade-up-soft 0.5s 0.45s ease-out both" }}
        role="progressbar"
        aria-label="Loading"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-light to-gold"
          style={{ animation: "fill-bar 0.85s 0.15s cubic-bezier(0.4,0,0.2,1) both" }}
        />
      </div>
    </div>
  );
}
