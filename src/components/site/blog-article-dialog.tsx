"use client";

import { useEffect } from "react";
import { CalendarDays, Clock, Tag, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { BlogPost } from "@/lib/content";

type BlogArticleDialogProps = {
  post: BlogPost | null;
  onClose: () => void;
};

/** Accessible full-article reading dialog for insight posts. */
export function BlogArticleDialog({ post, onClose }: BlogArticleDialogProps) {
  useEffect(() => {
    if (!post) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [post, onClose]);

  if (!post) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[#03050a]/85 p-0 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Article: ${post.title}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <article className="section-dark relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.08] bg-[#0b101c] shadow-float sm:rounded-3xl">
        {/* header */}
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.06] p-6 md:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="eyebrow rounded-full border border-gold/25 bg-gold-dim px-3 py-1 text-[9px] text-gold">
                {post.category}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground">
                <CalendarDays size={11} aria-hidden="true" />
                {new Date(post.date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground">
                <Clock size={11} aria-hidden="true" /> {post.readTime}
              </span>
            </div>
            <h2 className="mt-3.5 text-balance font-display text-xl font-bold leading-snug text-foreground md:text-[26px]">
              {post.title}
            </h2>
            <p className="mt-2 text-[12.5px] text-muted-foreground">By {post.author}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close article"
            className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </header>

        {/* body */}
        <div className="overflow-y-auto px-6 py-7 md:px-8 md:py-8" tabIndex={-1}>
          <div className="prose-okomba">
            <ReactMarkdown
              components={{
                h2: (props) => <h2 className="mt-8 font-display text-[19px] font-bold text-foreground first:mt-0" {...props} />,
                h3: (props) => <h3 className="mt-6 font-display text-[16px] font-bold text-foreground" {...props} />,
                p: (props) => <p className="mt-3.5 text-[14.5px] leading-[1.75] text-muted-foreground" {...props} />,
                strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
                ul: (props) => <ul className="mt-3.5 space-y-2 pl-1" {...props} />,
                li: (props) => (
                  <li className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-muted-foreground" {...props} />
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* tags */}
          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-6">
            <Tag size={13} className="text-muted-foreground" aria-hidden="true" />
            {post.tags.map((t) => (
              <span key={t} className="rounded-md bg-white/[0.05] px-2.5 py-1 font-mono text-[10.5px] text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
