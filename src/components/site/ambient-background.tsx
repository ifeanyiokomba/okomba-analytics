"use client";

/**
 * AmbientBackground (Stage 10 — Termii-inspired motion design).
 *
 * A single, lightweight, site-wide decorative layer mounted once
 * behind the page content. Combines three drifting aurora blobs
 * (gold/teal/warm), a faint slow grid sweep, and a top-down
 * radial glow. Purely decorative: aria-hidden + pointer-events-none
 * + negative z-index so it never blocks interaction or readability.
 *
 * Performance: uses transform/opacity-only animations (GPU-friendly),
 * respects prefers-reduced-motion (animations disabled in globals.css
 * @media block), and renders at most ~4 absolutely-positioned divs —
 * no canvas, no particles, no JS per-frame work.
 *
 * Design rationale (Termii research): the best SaaS backgrounds use
 * slow, large, blurred colour fields that imply "alive" without
 * distracting. Fast-moving particles feel gimmicky and hurt perceived
 * load time. This layer delivers the same premium "live" feel as
 * termii.com at near-zero runtime cost.
 */

export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
      aria-hidden="true"
    >
      {/* Top radial gold wash — draws the eye up to the hero */}
      <div className="absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(70%_100%_at_50%_0%,rgba(201,145,10,0.08),transparent)]" />

      {/* Aurora blob A — gold, top-left drift */}
      <div className="animate-aurora-a absolute -left-32 top-[12%] h-[460px] w-[460px] rounded-full bg-gold/[0.07] blur-[120px]" />

      {/* Aurora blob B — teal, mid-right drift */}
      <div className="animate-aurora-b absolute -right-24 top-[42%] h-[420px] w-[420px] rounded-full bg-teal/[0.06] blur-[120px]" />

      {/* Aurora blob C — warm honey, lower-left drift + scale */}
      <div className="animate-aurora-c absolute left-[18%] top-[72%] h-[380px] w-[380px] rounded-full bg-gold-light/[0.05] blur-[110px]" />

      {/* Faint grid with slow sweep overlay */}
      <div className="bg-grid mask-fade-y absolute inset-0 opacity-[0.18]" />
      <div className="animate-grid-sweep absolute -inset-1/4 bg-[radial-gradient(closest-side,rgba(201,145,10,0.05),transparent)]" />

      {/* Bottom fade to background for a grounded finish */}
      <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.6))]" />
    </div>
  );
}
