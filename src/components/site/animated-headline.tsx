"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * AnimatedHeadline — sophisticated typing rotation for the hero.
 * Cycles through phrases: types character-by-character at a natural
 * cadence, pauses, deletes gracefully, pauses, next phrase.
 * Reduced-motion: renders the first phrase statically.
 */
export function AnimatedHeadline({
  phrases,
  className,
  typeInterval = 65,
  deleteInterval = 34,
  pauseAfterType = 2100,
  pauseAfterDelete = 420,
}: {
  phrases: string[];
  className?: string;
  typeInterval?: number;
  deleteInterval?: number;
  pauseAfterType?: number;
  pauseAfterDelete?: number;
}) {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting" | "waiting">("typing");
  const idx = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      if (cancelled) return;

      // Reduced motion — static first phrase, no churn
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setText(phrases[0] ?? "");
        setPhase("waiting");
        return;
      }

      const current = phrases[idx.current % phrases.length];

      if (phase === "typing") {
        const next = current.slice(0, text.length + 1);
        setText(next);
        if (next.length >= current.length) {
          setPhase("pausing");
          timer = setTimeout(step, pauseAfterType);
        } else {
          // slight human rhythm variance
          const jitter = Math.random() > 0.88 ? typeInterval * 2.1 : typeInterval;
          timer = setTimeout(step, jitter);
        }
      } else if (phase === "pausing") {
        setPhase("deleting");
        timer = setTimeout(step, pauseAfterDelete);
      } else if (phase === "deleting") {
        const next = current.slice(0, Math.max(text.length - 1, 0));
        setText(next);
        if (next.length === 0) {
          idx.current += 1;
          setPhase("typing");
          timer = setTimeout(step, 260);
        } else {
          timer = setTimeout(step, deleteInterval);
        }
      }
    };

    timer = setTimeout(step, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, phase, phrases, typeInterval, deleteInterval, pauseAfterType, pauseAfterDelete]);

  return (
    <span className={cn("inline-block text-gradient-gold", className)}>
      {text}
      <span
        aria-hidden="true"
        className={cn(
          "ml-1 inline-block h-[0.82em] w-[3px] translate-y-[0.08em] rounded-full bg-gold",
          phase === "pausing" ? "caret-blink" : "opacity-95"
        )}
      />
      <span className="sr-only">{phrases.join(", ")}</span>
    </span>
  );
}
