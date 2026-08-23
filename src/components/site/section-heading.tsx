"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  desc?: string;
  align?: "left" | "center";
  className?: string;
};

/**
 * Consistent editorial section heading: mono eyebrow + display title + muted description.
 */
export function SectionHeading({ eyebrow, title, desc, align = "center", className }: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <Reveal
      className={cn(
        "mb-12 flex flex-col gap-4 md:mb-16",
        centered ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      <span className="eyebrow inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-gold-dim px-4 py-1.5 text-gold">
        <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" aria-hidden="true" />
        {eyebrow}
      </span>
      <h2 className="max-w-2xl text-balance text-3xl font-bold leading-[1.12] text-foreground sm:text-4xl md:text-[2.75rem]">
        {title}
      </h2>
      {desc ? (
        <p className={cn("max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-base", centered && "mx-auto")}>
          {desc}
        </p>
      ) : null}
    </Reveal>
  );
}
