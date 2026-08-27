"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating back-to-top button — appears after scrolling past the hero,
 * sits above the AI chat FAB in the bottom-right corner (Module 7 +
 * Stage 10 repositioning for the compact chat-icon launcher).
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={cn(
        "fixed bottom-[6.75rem] right-4 z-[70] flex h-10 w-10 items-center justify-center rounded-xl border border-gold/40 bg-white/90 text-gold shadow-gold backdrop-blur-xl transition-all duration-300 sm:bottom-[7.25rem] sm:right-6 sm:h-11 sm:w-11",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <ArrowUp size={16} strokeWidth={2.4} aria-hidden="true" />
    </button>
  );
}
