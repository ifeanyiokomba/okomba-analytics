"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQS } from "@/lib/content";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

/**
 * FAQ section — accordion + JSON-LD structured data for SEO.
 */
export function FaqSection() {
  return (
    <section id="faq" className="section-pad relative scroll-mt-20" aria-label="Frequently asked questions">
      <div className="pointer-events-none absolute right-0 top-20 h-[280px] w-[280px] rounded-full bg-gold/[0.05] blur-[100px]" aria-hidden="true" />

      <div className="container-xl relative">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          {/* Sticky heading column */}
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <span className="eyebrow inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-gold-dim px-4 py-1.5 text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" aria-hidden="true" />
                FAQ
              </span>
              <h2 className="mt-6 text-balance font-display text-3xl font-bold leading-[1.12] text-foreground sm:text-4xl">
                Answers before <span className="text-gradient-gold">you even ask</span>
              </h2>
              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
                The questions clients ask most — answered straight. Anything else, WhatsApp us
                and a human replies.
              </p>
              <a
                href="https://wa.me/2348088948657"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-xl border border-teal/30 bg-teal-dim px-5 py-3 text-[13.5px] font-medium text-teal transition-colors hover:bg-teal/15"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                Ask on WhatsApp
              </a>
            </div>
          </Reveal>

          {/* Accordion column */}
          <Reveal delay={120}>
            <Accordion type="single" collapsible className="flex flex-col gap-3">
              {FAQS.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="surface-card overflow-hidden rounded-2xl border-white/[0.07] px-6 transition-colors data-[state=open]:border-gold/30"
                >
                  <AccordionTrigger className="py-5 text-left text-[15px] font-semibold text-foreground hover:no-underline hover:text-gold [&>svg]:text-gold">
                    <span className="flex items-baseline gap-3.5">
                      <span className="font-mono text-[11px] font-semibold text-gold">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {f.q}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 pl-[2.6rem] pr-2 text-[14px] leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </div>

      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </section>
  );
}
