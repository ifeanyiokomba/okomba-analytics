"use client";

import { useEffect, useState } from "react";
import { OkombaLogoFull } from "./logo";

/** Brief brand-reveal loading screen — polished version of the original. */
export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let p = 0;
    const timer = setInterval(() => {
      p = Math.min(p + Math.random() * 22 + 10, 100);
      setProgress(Math.floor(p));
      if (p >= 100) {
        clearInterval(timer);
        setTimeout(() => setFading(true), 250);
        setTimeout(onDone, 750);
      }
    }, 160);
    return () => clearInterval(timer);
  }, [onDone]);

  return (
    <div
      aria-label="Loading Okomba Analytics"
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#05070d] transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(45%_45%_at_50%_50%,black,transparent)]" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.09] blur-[90px]" aria-hidden="true" />

      <div className="relative flex flex-col items-center" style={{ animation: "float-med 4s ease-in-out infinite" }}>
        <OkombaLogoFull height={46} />
      </div>
      <p className="eyebrow mt-7 text-[10px] text-muted-foreground/80">Digital services ecosystem</p>

      <div className="relative mt-8 h-[3px] w-52 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-3.5 font-mono text-[10.5px] text-muted-foreground/60">{progress}%</p>
    </div>
  );
}
