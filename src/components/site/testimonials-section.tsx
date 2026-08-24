"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { TESTIMONIALS } from "@/lib/content";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

const AVATAR_COLORS = ["#F0A500", "#00C9A7", "#5B9EFF"];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="section-pad relative scroll-mt-20" aria-label="Client testimonials">
      <div className="container-xl relative">
        <SectionHeading
          eyebrow="Client voices"
          title={
            <>
              Trusted by founders, <span className="text-gradient-gold">directors &amp; CEOs</span>
            </>
          }
          desc="Authentic words from real engagements — reproduced exactly as our clients wrote them."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.id} delay={i * 90}>
              <figure className="surface-card relative flex h-full flex-col p-7">
                {/* quote mark */}
                <span className="pointer-events-none absolute right-6 top-5 select-none font-display text-6xl leading-none text-gold/10" aria-hidden="true">
                  ”
                </span>

                <div className="flex gap-1" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} size={15} className="fill-gold text-gold" aria-hidden="true" />
                  ))}
                </div>

                <blockquote className="mt-5 flex-1 text-[14px] leading-relaxed text-foreground/90">
                  {t.text}
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3.5 border-t border-black/[0.07] pt-5">
                  {t.avatar ? (
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-gold/30">
                      <Image
                        src={t.avatar}
                        alt={`Portrait of ${t.name}`}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-ink"
                      style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                      aria-hidden="true"
                    >
                      {t.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-foreground">{t.name}</p>
                    <p className="truncate text-[12px] text-muted-foreground">{t.role}</p>
                  </div>
                  <span className="ml-auto max-w-[140px] shrink-0 truncate rounded-full bg-black/[0.05] px-2.5 py-1 font-mono text-[9.5px] text-muted-foreground">
                    {t.service}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
