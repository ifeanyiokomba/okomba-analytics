"use client";

import { useState } from "react";
import { ArrowUpRight, CalendarDays, Clock, Tag, X } from "lucide-react";
import { BLOG_POSTS } from "@/lib/content";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { BlogArticleDialog } from "./blog-article-dialog";

export function InsightsSection() {
  const [openPost, setOpenPost] = useState<string | null>(null);
  const post = BLOG_POSTS.find((p) => p.id === openPost) ?? null;

  return (
    <section id="insights" className="section-pad relative scroll-mt-20" aria-label="Insights">
      <div className="container-xl relative">
        <SectionHeading
          eyebrow="Insights"
          title={
            <>
              Field notes from <span className="text-gradient-gold">digital operations</span>
            </>
          }
          desc="Practical writing on digital strategy, payments and registration — drawn from real client work."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {BLOG_POSTS.map((p, i) => (
            <Reveal key={p.id} delay={i * 90}>
              <article className="surface-card group flex h-full flex-col p-6 md:p-7">
                <div className="flex items-center justify-between gap-3">
                  <span className="eyebrow rounded-full border border-gold/25 bg-gold-dim px-3 py-1 text-[9px] text-gold">
                    {p.category}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground">
                    <CalendarDays size={12} aria-hidden="true" />
                    {new Date(p.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>

                <h3 className="mt-5 text-balance text-[16.5px] font-semibold leading-snug text-foreground transition-colors group-hover:text-gold">
                  {p.title}
                </h3>
                <p className="mt-2.5 flex-1 text-[13.5px] leading-relaxed text-muted-foreground">{p.excerpt}</p>

                <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-5">
                  <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground">
                    <Clock size={12} aria-hidden="true" /> {p.readTime}
                  </span>
                  <button
                    onClick={() => setOpenPost(p.id)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
                    aria-label={`Read article: ${p.title}`}
                  >
                    Read
                    <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>

      <BlogArticleDialog post={post} onClose={() => setOpenPost(null)} />
    </section>
  );
}
