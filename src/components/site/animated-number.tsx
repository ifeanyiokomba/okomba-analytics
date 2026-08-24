"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * AnimatedNumber — counts up from 0 to `value` when the element enters
 * the viewport. Respects prefers-reduced-motion (renders final value
 * immediately). Shared proof-metric primitive (Termii-style spec numbers).
 */
export function AnimatedNumber({
  value,
  suffix = "",
  prefix = "",
  duration = 1600,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || started.current) return;
        started.current = true;

        // Reduced motion — settle immediately
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setDisplay(value);
          obs.disconnect();
          return;
        }

        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / duration, 1);
          // ease-out cubic for a decisive settle
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(Math.round(eased * value));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
