# Task 5-c — full-stack-developer (section upgrades)

## Scope
Upgraded 4 existing sections in-place to Termii-inspired premium quality (directive batches: proof bar animation, process timeline #17, case-study reframing #12, final CTA #20). Component names + props kept identical so page.tsx wiring stays stable. This file is the /agent-ctx work record; the full log is appended to /home/z/my-project/worklog.md under "Task ID: 5-c".

## Files changed (ONLY these 4)
1. `src/components/site/trust.tsx` — StatsBand → AnimatedNumber count-ups (200+/14+/50+/5+), Termii spec-card layout (mono label top, clamp(2.2rem→3rem) tabular number, hairline + "STAT / 0X" footer). CapabilityTicker unchanged.
2. `src/components/site/process-section.tsx` — scroll-driven vertical timeline. LOCAL 6 steps (Discover→Design→Build→Integrate→Launch→Improve — content.ts sequence mismatched, so steps live in the component; content.ts untouched). IntersectionObserver middle-20% band + max-of-set reducer; gold fill measured in px against real node positions; desktop alternating cards around centre rail; mobile left rail; active node pulses (animate-status-pulse); reduced-motion = full rail, no pulse. Bottom CTA preserved → onGetStarted.
3. `src/components/site/case-studies-section.tsx` — heading "Built for real problems." / eyebrow "Selected work"; P/A/R mini-structure on every card (gold Result highlight row); 2 alternating full-width featured rows + 4-card grid; ProjectDialog wiring fully preserved. Data source is PROJECTS (there is no CASE_STUDIES export in content.ts — mission brief was slightly off; images case-*.png are used by PROJECTS entries).
4. `src/components/site/contact-section.tsx` — final-CTA reframing ("Have a problem worth solving?" / "Tell us what you're trying to achieve." / supporting line); blue email accent → neutral ink (no blue/indigo rule); panels + id="contact" preserved.

## Verification
- `bun run lint` CLEAN; `bunx tsc --noEmit` clean for project src/ (only pre-existing examples/ + skills/ errors)
- agent-browser (desktop 1280×720, mobile 390×844): count-ups settle correctly; timeline readout/fill track scroll (Phase 01→06, fill 458px→1116px); all 6 nodes centred on rail; alternating layouts confirmed both sections; ProjectDialog open/close works; no horizontal overflow; VLM screenshot QA pass
- dev.log clean after page hits — no new errors

## Cascade trap for future agents (extends 5-a's finding)
The unlayered `.eyebrow` rule in globals.css also beats layered Tailwind `tracking-*` utilities — to override letter-spacing on eyebrow-classed elements, use inline `style={{ letterSpacing: ... }}` (same pattern as animation-delay). Verified live.

## Copy decisions
- Timeline step copy sharpened locally (blueprint-first Design, integration-pressure-test Integrate, "Launch is the beginning" Improve)
- P/A/R lines derived strictly from existing content.ts project data (overview/built/tagline) — zero invented metrics; live links only cited where PROJECTS declares them
- Contact supporting line is the directive's exact conclusion framing
