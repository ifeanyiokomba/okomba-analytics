"use client";

/**
 * Hero visual composition — an analytics dashboard card with floating
 * metric cards around it, layered depth + colored shadows.
 * Pure SVG/CSS, no imagery. Inspired by premium SaaS reference layouts.
 */

const SPARK_POINTS = "0,26 12,22 24,24 36,17 48,19 60,12 72,14 84,7 96,9 108,3";
const BARS = [38, 62, 45, 78, 55, 92, 70, 84, 60, 98, 74, 88];

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]" aria-hidden="true">
      {/* Gold glow backdrop */}
      <div className="absolute -top-16 right-[-10%] h-[380px] w-[380px] rounded-full bg-gold/[0.13] blur-[110px] animate-glow-breathe" />
      <div className="absolute -bottom-10 left-[-8%] h-[300px] w-[300px] rounded-full bg-teal/[0.1] blur-[100px] animate-glow-breathe [animation-delay:1.6s]" />
      {/* Thin orbit ring */}
      <div className="absolute inset-x-[-6%] top-[8%] -z-0 aspect-square rounded-full border border-white/[0.05] animate-spin-slow" />
      <div className="absolute inset-x-[4%] top-[16%] aspect-square rounded-full border border-dashed border-gold/[0.08]" />

      {/* ── Main dashboard card ── */}
      <div className="surface-glass relative z-10 rounded-3xl p-5 shadow-float sm:p-6 animate-float-slow">
        {/* window chrome */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
          </div>
          <span className="eyebrow rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[9px] text-muted-foreground">
            okomba / dashboard
          </span>
        </div>

        {/* KPI row */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "Revenue", value: "₦24.7M", delta: "+18.4%", up: true },
            { label: "Active users", value: "8,540", delta: "+23.1%", up: true },
            { label: "Avg. uptime", value: "99.9%", delta: "stable", up: true },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className="mt-1.5 font-display text-[15px] font-bold text-foreground sm:text-[17px]">{k.value}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[10.5px] font-medium text-teal">
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1v8M5 1l3 3M5 1L2 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {k.delta}
              </p>
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="rounded-xl border border-white/[0.06] bg-[#070b14] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-foreground">Transaction volume</p>
              <p className="text-[10px] text-muted-foreground">Last 12 weeks · Remita + gateway</p>
            </div>
            <span className="rounded-full bg-gold-dim px-2.5 py-1 text-[9.5px] font-semibold text-gold">LIVE</span>
          </div>

          {/* bar chart */}
          <div className="flex h-[92px] items-end gap-[7px] sm:h-[110px]">
            {BARS.map((h, i) => (
              <div key={i} className="flex-1 rounded-t-[4px]" style={{ height: `${h}%`, animation: `bar-grow 0.9s ${i * 60}ms cubic-bezier(0.22,1,0.36,1) both`, transformOrigin: "bottom" }}>
                <div
                  className={`h-full w-full rounded-t-[4px] ${
                    i === BARS.length - 1
                      ? "bg-gradient-to-t from-gold/50 to-gold"
                      : i % 3 === 0
                        ? "bg-gradient-to-t from-teal/25 to-teal/70"
                        : "bg-gradient-to-t from-[#5b9eff]/15 to-[#5b9eff]/45"
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[8.5px] font-medium text-muted-foreground/70">
            <span>W1</span><span>W4</span><span>W8</span><span>W12</span>
          </div>
        </div>
      </div>

      {/* ── Floating card: revenue sparkline (left) ── */}
      <div className="surface-glass absolute -left-[6%] top-[22%] z-20 hidden w-[210px] rounded-2xl p-4 shadow-float animate-float-med sm:block [animation-delay:0.8s]">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium text-muted-foreground">Collections</p>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-dim">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" />
          </span>
        </div>
        <p className="mt-1 font-display text-[20px] font-bold text-foreground">₦4.82M</p>
        <svg viewBox="0 0 108 30" className="mt-2 w-full">
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F0A500" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F0A500" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`${SPARK_POINTS} 108,30 0,30`} fill="url(#sparkFill)" />
          <polyline
            points={SPARK_POINTS}
            fill="none"
            stroke="#F0A500"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ strokeDasharray: 300, animation: "dash-draw 2.2s 0.5s ease-out both" }}
          />
          <circle cx="108" cy="3" r="3" fill="#F7C24A" />
        </svg>
      </div>

      {/* ── Floating card: automation status (right) ── */}
      <div className="surface-glass absolute -right-[4%] top-[8%] z-20 hidden w-[196px] rounded-2xl p-4 shadow-float animate-float-med sm:block [animation-delay:1.9s]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-dim">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00C9A7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </span>
          <div>
            <p className="text-[12px] font-semibold text-foreground">Automations</p>
            <p className="text-[10px] text-muted-foreground">Running</p>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {[
            { label: "Reconciliation", pct: "86%", w: "86%", c: "bg-teal" },
            { label: "Onboarding flow", pct: "64%", w: "64%", c: "bg-gold" },
          ].map((r) => (
            <div key={r.label}>
              <div className="mb-1 flex justify-between text-[9.5px] text-muted-foreground">
                <span>{r.label}</span>
                <span className="font-semibold text-foreground">{r.pct}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div className={`h-full rounded-full ${r.c}`} style={{ width: r.w }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Floating card: team (bottom-left) ── */}
      <div className="surface-glass absolute -bottom-6 -left-[3%] z-20 hidden items-center gap-3 rounded-2xl p-4 shadow-float animate-float-slow [animation-delay:1.2s] md:flex">
        <div className="flex -space-x-2.5">
          {["#F0A500", "#00C9A7", "#5B9EFF", "#F43F5E"].map((c, i) => (
            <span
              key={i}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0b101c] text-[10px] font-bold text-ink"
              style={{ background: c }}
            >
              {["CO", "AN", "NW", "IS"][i]}
            </span>
          ))}
        </div>
        <div>
          <p className="text-[12px] font-semibold text-foreground">12 members online</p>
          <p className="text-[10px] text-muted-foreground">Ops · Engineering · Support</p>
        </div>
      </div>

      {/* ── Floating badge: uptime (bottom-right) ── */}
      <div className="surface-glass absolute -bottom-4 right-[2%] z-20 hidden rounded-2xl px-4 py-3 shadow-float animate-float-med [animation-delay:2.6s] sm:flex sm:items-center sm:gap-2.5">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C9A7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <div>
          <p className="font-display text-[14px] font-bold leading-tight text-foreground">98%</p>
          <p className="text-[9.5px] text-muted-foreground">Client satisfaction</p>
        </div>
      </div>
    </div>
  );
}
