"use client";

import { useEffect, useState } from "react";

/**
 * Slim gold scroll-progress indicator pinned beneath the navbar.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      setProgress(scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-gold-light via-gold to-gold-light transition-[width] duration-100 ease-out"
        style={{ width: `${progress * 100}%`, boxShadow: "0 0 10px rgba(255, 201, 77, 0.65)" }}
      />
    </div>
  );
}
