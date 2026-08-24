"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BLOG_POSTS } from "@/lib/content";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { BlogArticleDialog } from "./blog-article-dialog";

export function InsightsSection() {
  const [openPost, setOpenPost] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const post = BLOG_POSTS.find((p) => p.id === openPost) ?? null;

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(BLOG_POSTS.map((p) => p.category)))],
    []
  );

  const filtered = useMemo(
    () => (activeCategory === "All" ? BLOG_POSTS : BLOG_POSTS.filter((p) => p.category === activeCategory)),
    [activeCategory]
  );

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
          desc="Practical writing on digital strategy, payments, automation and product building — drawn from real client work."
        />

        {/* Category filter chips */}
        <Reveal delay={80} className="mb-10 flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const count = cat === "All" ? BLOG_POSTS.length : BLOG_POSTS.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={isActive}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-all",
                  isActive
                    ? "border-gold/50 bg-gold-dim text-gold shadow-gold"
                    : "border-black/[0.08] bg-black/[0.03] text-muted-foreground hover:border-black/20 hover:text-foreground"
                )}
              >
                {cat}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 font-mono text-[9.5px] leading-none",
                    isActive ? "bg-gold/20 text-gold" : "bg-black/[0.06] text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </Reveal>

        {/* Posts grid — responsive: 3 cols when showing all, 2 when filtered smaller */}
        <div
          className={cn(
            "grid grid-cols-1 gap-4",
            filtered.length >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"
          )}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <motion.article
                layout
                key={p.id}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
                className="surface-card group flex h-full flex-col p-6 md:p-7"
              >
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

                <div className="mt-6 flex items-center justify-between border-t border-black/[0.07] pt-5">
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
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <BlogArticleDialog post={post} onClose={() => setOpenPost(null)} />
    </section>
  );
}
