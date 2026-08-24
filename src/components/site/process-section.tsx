"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

/**
 * Scroll-driven delivery timeline (directive #17). The gold progress rail
 * fills as the user scrolls; the step crossing the viewport's focus band
 * becomes the active step (pulsing node + gold-bordered, lifted card).
 * Desktop: alternating cards around a centre rail. Mobile: left rail.
 */

/* Local step set — deliberately sharper than the shared copy so the six
   phases read Discover → Design → Build → Integrate → Launch → Improve. */
const STEPS = [
  {
    step: "01",
    title: "Discover",
    desc: "We sit with your team, map the real problem and define the outcome that matters — before a single line of code.",
  },
  {
    step: "02",
    title: "Design",
    desc: "Interface concepts, data structure and system architecture — blueprints you review and approve before build begins.",
  },
  {
    step: "03",
    title: "Build",
    desc: "Disciplined iterations you can see and click — working software early, not one big reveal at the end.",
  },
  {
    step: "04",
    title: "Integrate",
    desc: "Payments, messaging and third-party systems wired in and pressure-tested until every part talks to the whole.",
  },
  {
    step: "05",
    title: "Launch",
    desc: "We deploy, verify every flow under real conditions and go live without drama — then we watch it run.",
  },
  {
    step: "06",
    title: "Improve",
    desc: "Launch is the beginning. We monitor, maintain and sharpen the system as your operation grows.",
  },
] as const;

type ProcessSectionProps = {
  onGetStarted: () => void;
};

export function ProcessSection({ onGetStarted }: ProcessSectionProps) {
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [fill, setFill] = useState("0px");

  const railRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const visibleSteps = useRef<Set<number>>(new Set());

  /* Track reduced-motion preference live */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /* Observe each step: whichever crosses the viewport's focus band
     (middle 20%) drives the active step + progress rail. */
  useEffect(() => {
    if (reduced) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const i = Number((entry.target as HTMLElement).dataset.index ?? 0);
          if (entry.isIntersecting) visibleSteps.current.add(i);
          else visibleSteps.current.delete(i);
        });
        if (visibleSteps.current.size > 0) {
          setActive(Math.max(...visibleSteps.current));
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );
    stepRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [reduced]);

  /* Measure the gold fill against the real node positions (robust to
     uneven step heights); re-measure on resize. Reduced motion: full rail. */
  useEffect(() => {
    const measure = () => {
      const rail = railRef.current;
      if (!rail) return;
      if (reduced) {
        setFill("100%");
        return;
      }
      const node = nodeRefs.current[active];
      if (!node) return;
      const r = rail.getBoundingClientRect();
      const n = node.getBoundingClientRect();
      setFill(`${Math.max(0, n.top - r.top + n.height / 2)}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active, reduced]);

  return (
    <section
      id="process"
      className="section-light scroll-mt-20 border-y border-border bg-background"
      aria-label="Our process"
    >
      <div className="container-xl relative">
        <SectionHeading
          eyebrow="How we work"
          title={
            <>
              A disciplined path from <span className="text-gradient-gold">idea to impact</span>
            </>
          }
          desc="Six phases, each with a clear output — scroll through the exact path your project takes, from first conversation to live system."
        />

        {/* live phase readout (technical, decorative) */}
        <p
          aria-hidden="true"
          className="mb-10 text-center font-mono text-[10.5px] font-medium uppercase tracking-[0.24em] text-muted-foreground"
        >
          Phase{" "}
          <span className="tabular-nums text-gold">
            {String((reduced ? STEPS.length : active + 1)).padStart(2, "0")}
          </span>{" "}
          / {String(STEPS.length).padStart(2, "0")}
        </p>

        <Reveal>
          <div className="relative">
            {/* progress rail: base hairline + gold fill */}
            <div
              ref={railRef}
              aria-hidden="true"
              className="absolute bottom-4 left-6 top-4 w-px bg-black/[0.08] md:left-1/2"
            >
              <div
                className="w-px bg-gradient-to-b from-gold-light via-gold to-gold-light transition-[height] duration-700 ease-out"
                style={{ height: fill }}
              />
            </div>

            <ol className="space-y-8 md:space-y-12">
              {STEPS.map((s, i) => {
                const isActive = !reduced && i === active;
                const isPassed = reduced || i < active;
                const onLeft = i % 2 === 0;
                return (
                  <li
                    key={s.step}
                    ref={(el) => {
                      stepRefs.current[i] = el;
                    }}
                    data-index={i}
                    className="relative pl-16 md:grid md:grid-cols-2 md:gap-x-20 md:pl-0"
                  >
                    {/* connector from rail to card (desktop only) */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-9 hidden h-px w-10 transition-colors duration-500 md:block",
                        onLeft ? "right-1/2 mr-3" : "left-1/2 ml-3",
                        isActive ? "bg-gold/60" : "bg-black/[0.1]"
                      )}
                    />
                    {/* timeline node */}
                    <span
                      ref={(el) => {
                        nodeRefs.current[i] = el;
                      }}
                      aria-hidden="true"
                      className={cn(
                        "absolute left-6 top-7 z-10 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border-2 transition-colors duration-500 md:left-1/2",
                        isActive
                          ? "border-gold bg-gold animate-status-pulse"
                          : isPassed
                            ? "border-gold/50 bg-gold-dim"
                            : "border-black/[0.18] bg-[#f7f4ec]"
                      )}
                    >
                      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>

                    {/* step card */}
                    <Reveal
                      delay={Math.min(i * 70, 350)}
                      className={cn(onLeft ? "md:col-start-1" : "md:col-start-2")}
                    >
                      <article
                        className={cn(
                          "h-full rounded-2xl border bg-white p-6 transition-all duration-500 md:p-7",
                          isActive
                            ? "-translate-y-1 border-gold/70 shadow-gold"
                            : "border-black/[0.08] shadow-[0_1px_2px_rgba(20,25,38,0.04),0_8px_24px_-18px_rgba(20,25,38,0.16)]"
                        )}
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="font-mono text-[12px] font-semibold tabular-nums tracking-[0.14em] text-gold">
                            {s.step}
                          </span>
                          <span
                            className={cn(
                              "h-px flex-1 transition-colors duration-500",
                              isActive ? "bg-gold/50" : "bg-black/[0.08]"
                            )}
                            aria-hidden="true"
                          />
                          {isActive && (
                            <span className="font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-gold">
                              Active
                            </span>
                          )}
                        </div>
                        <h3 className="mt-4 text-[17px] font-semibold text-foreground">{s.title}</h3>
                        <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">{s.desc}</p>
                      </article>
                    </Reveal>
                  </li>
                );
              })}
            </ol>
          </div>
        </Reveal>

        <Reveal delay={140} className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="max-w-md text-[14.5px] text-muted-foreground">
            Most projects move from discovery to launch in weeks, not quarters — without cutting
            corners on quality or security.
          </p>
          <button
            onClick={onGetStarted}
            className="btn-shine group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-gold-light to-gold px-7 py-3.5 text-[14.5px] font-semibold text-[#141926] shadow-gold-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Begin with step 01 — Discovery
            <ArrowRight size={16} strokeWidth={2.4} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </button>
        </Reveal>
      </div>
    </section>
  );
}
