"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Flag,
  Heart,
  Lightbulb,
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  Star,
  Tag,
  ThumbsUp,
  Video as VideoIcon,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { SponsoredSlot } from "./sponsored-slot";
import type { Post } from "@/lib/posts";

/* ── BATCH 5 public article view (§23 comments, §24 reactions,
   §25 media, §26 rich content, §43 author profiles) ─────────── */

type PublicComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  replies: PublicComment[];
};

type ReactionType = "like" | "helpful" | "insightful" | "interested";
type ReactionSummary = { counts: Record<ReactionType, number>; mine: ReactionType[] };

const REACTIONS: { type: ReactionType; label: string; icon: typeof ThumbsUp }[] = [
  { type: "like", label: "Like", icon: ThumbsUp },
  { type: "helpful", label: "Helpful", icon: Heart },
  { type: "insightful", label: "Insightful", icon: Lightbulb },
  { type: "interested", label: "Interested", icon: Star },
];

const VIDEO_EXT = /\.(mp4|webm)(\?|$)/i;

/** Estimate reading time from content length (≈200 wpm). */
function readTimeFor(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function BlogArticleDialog({ post, onClose }: { post: Post | null; onClose: () => void }) {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [reactions, setReactions] = useState<ReactionSummary | null>(null);
  const [reactBusy, setReactBusy] = useState(false);

  // Comment form (§23) with §92 anti-bot fields
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cBody, setCBody] = useState("");
  const [cHoneypot, setCHoneypot] = useState(""); // must stay empty
  const [cSubmitting, setCSubmitting] = useState(false);
  const [cStatus, setCStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const replyToRef = useRef<string | null>(null);
  const formTsRef = useRef<number>(Date.now());

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

  /* ── Load comments + reactions when a post opens ────────── */
  const loadComments = useCallback(async (postId: string) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      const j = await res.json().catch(() => null);
      if (res.ok && j?.ok) setComments(j.comments ?? []);
    } catch {
      /* non-fatal */
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!post) return;
    replyToRef.current = null;
    formTsRef.current = Date.now();
    setCStatus(null);
    setComments([]);
    setReactions(null);
    void loadComments(post.id);
    (async () => {
      try {
        const res = await fetch(`/api/posts/reactions?postId=${post.id}`);
        const j = await res.json().catch(() => null);
        if (res.ok && j?.ok) {
          setReactions({ counts: j.counts, mine: j.mine });
        }
      } catch {
        /* reactions just show zeros */
      }
    })();
  }, [post, loadComments]);

  /* ── Reaction toggle (§24) ───────────────────────────────── */
  const toggleReaction = async (type: ReactionType) => {
    if (!post || reactBusy) return;
    setReactBusy(true);
    try {
      const res = await fetch("/api/posts/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, type }),
      });
      const j = await res.json().catch(() => null);
      if (res.ok && j?.ok) {
        setReactions({ counts: j.counts, mine: j.mine });
      }
    } catch {
      /* keep previous state */
    } finally {
      setReactBusy(false);
    }
  };

  /* ── Comment submit (§23) ────────────────────────────────── */
  const submitComment = async () => {
    if (!post || cSubmitting) return;
    setCStatus(null);
    if (cName.trim().length < 2) return setCStatus({ ok: false, text: "Please enter your name." });
    if (cBody.trim().length < 10) return setCStatus({ ok: false, text: "Comments need at least 10 characters." });
    setCSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          parentId: replyToRef.current ?? undefined,
          authorName: cName.trim(),
          authorEmail: cEmail.trim() || undefined,
          body: cBody.trim(),
          company: cHoneypot, // §92 honeypot — must stay empty
          ts: formTsRef.current, // §92 time-trap
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) {
        throw new Error(j?.error ?? "Could not submit your comment.");
      }
      setCBody("");
      replyToRef.current = null;
      setCStatus({
        ok: true,
        text: "Thank you — your comment is awaiting moderation and will appear once approved.",
      });
      void loadComments(post.id);
    } catch (err) {
      setCStatus({ ok: false, text: err instanceof Error ? err.message : "Could not submit your comment." });
    } finally {
      setCSubmitting(false);
    }
  };

  /* ── Report a comment (§92) ──────────────────────────────── */
  const reportComment = async (id: string) => {
    try {
      await fetch("/api/comments/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: id, reason: "Reported from article view" }),
      });
      setCStatus({ ok: true, text: "Thanks — a moderator will review this comment." });
    } catch {
      /* silent */
    }
  };

  const totalComments = useMemo(
    () => comments.reduce((n, c) => n + 1 + c.replies.length, 0),
    [comments]
  );

  const galleryImages = useMemo(
    () => (post?.attachments ?? []).filter((a) => a.kind === "image"),
    [post]
  );
  const galleryVideos = useMemo(
    () => (post?.attachments ?? []).filter((a) => a.kind === "video"),
    [post]
  );
  const galleryDocs = useMemo(
    () => (post?.attachments ?? []).filter((a) => a.kind === "document"),
    [post]
  );

  if (!post) return null;

  const author = post.authorProfile;
  const displayName = author?.name ?? post.author;
  const dateLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
    : new Date(post.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

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
                {dateLabel}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground">
                <Clock size={11} aria-hidden="true" /> {readTimeFor(post.content)}
              </span>
            </div>
            <h2 className="mt-3.5 text-balance font-display text-xl font-bold leading-snug text-foreground md:text-[26px]">
              {post.title}
            </h2>

            {/* §43 author block */}
            <div className="mt-4 flex items-center gap-3">
              {author?.avatarUrl ? (
                 
                <img
                  src={author.avatarUrl}
                  alt={`Avatar of ${author.name}`}
                  className="h-10 w-10 rounded-full border border-gold/25 object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] font-display text-[12px] font-bold text-gold">
                  {initials(displayName)}
                </span>
              )}
              <div>
                <p className="text-[13px] font-semibold text-foreground">By {displayName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {author?.role ?? "Okomba Analytics"}
                </p>
              </div>
            </div>
            {author?.bio && (
              <p className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground/80">{author.bio}</p>
            )}
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
          {/* §25 cover image */}
          {post.coverImageUrl && (
             
            <img
              src={post.coverImageUrl}
              alt={`Cover image for ${post.title}`}
              loading="lazy"
              className="mb-7 h-52 w-full rounded-2xl border border-white/[0.08] object-cover md:h-64"
            />
          )}

          <div className="prose-okomba">
            <ReactMarkdown
              components={{
                h2: (props) => <h2 className="mt-8 font-display text-[19px] font-bold text-foreground first:mt-0" {...props} />,
                h3: (props) => <h3 className="mt-6 font-display text-[16px] font-bold text-foreground" {...props} />,
                p: (props) => <p className="mt-3.5 text-[14.5px] leading-[1.75] text-muted-foreground" {...props} />,
                strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
                a: (props) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-gold underline decoration-gold/40 underline-offset-2 transition-colors hover:decoration-gold"
                  />
                ),
                ul: (props) => <ul className="mt-3.5 space-y-2 pl-1" {...props} />,
                ol: (props) => <ol className="mt-3.5 list-decimal space-y-2 pl-5 text-[14.5px] text-muted-foreground" {...props} />,
                li: (props) => (
                  <li className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-muted-foreground" {...props} />
                ),
                blockquote: (props) => (
                  <blockquote
                    {...props}
                    className="mt-5 rounded-xl border-l-2 border-gold/50 bg-gold/[0.05] px-4 py-3 text-[14px] italic leading-relaxed text-muted-foreground"
                  />
                ),
                code: (props) => (
                  <code {...props} className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12.5px] text-gold/90" />
                ),
                pre: (props) => (
                  <pre {...props} className="mt-4 overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 font-mono text-[12px] leading-relaxed text-muted-foreground" />
                ),
                img: ({ src, alt }) => {
                  const url = typeof src === "string" ? src : "";
                  if (VIDEO_EXT.test(url)) {
                    return (
                      <video
                        controls
                        preload="metadata"
                        src={url}
                        aria-label={alt ?? "Embedded video"}
                        className="mt-5 w-full rounded-2xl border border-white/[0.08]"
                      />
                    );
                  }
                  return (
                     
                    <img
                      src={url}
                      alt={alt ?? ""}
                      loading="lazy"
                      className="mt-5 w-full rounded-2xl border border-white/[0.08]"
                    />
                  );
                },
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* §41 article-inline sponsored unit — end-of-content native
              placement; renders nothing without live inventory. */}
          <SponsoredSlot variant="inline" placement="article-inline" />

          {/* §25 attachments: gallery + video + downloads */}
          {(galleryImages.length > 0 || galleryVideos.length > 0 || galleryDocs.length > 0) && (
            <section aria-label="Post media and attachments" className="mt-8 border-t border-white/[0.06] pt-6">
              <h3 className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <Paperclip size={13} className="text-gold" aria-hidden="true" />
                Media & attachments
              </h3>

              {galleryImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {galleryImages.map((a, i) => (
                    <a
                      key={`${a.url}-${i}`}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open image: ${a.name}`}
                      className="group block overflow-hidden rounded-xl border border-white/[0.08]"
                    >
                      { }
                      <img
                        src={a.url}
                        alt={a.name}
                        loading="lazy"
                        className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              )}

              {galleryVideos.map((a, i) => (
                <video
                  key={`${a.url}-${i}`}
                  controls
                  preload="metadata"
                  src={a.url}
                  aria-label={a.name}
                  className="mt-3 w-full rounded-2xl border border-white/[0.08]"
                />
              ))}

              {galleryDocs.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {galleryDocs.map((a, i) => (
                    <li key={`${a.url}-${i}`}>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 transition-colors hover:border-gold/30"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.04] text-muted-foreground">
                          <Paperclip size={12} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-medium text-foreground">{a.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground/60">
                            PDF · {Math.max(1, Math.round(a.bytes / 1024))} KB
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* tags */}
          {post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-6">
              <Tag size={13} className="text-muted-foreground" aria-hidden="true" />
              {post.tags.map((t) => (
                <span key={t} className="rounded-md bg-white/[0.05] px-2.5 py-1 font-mono text-[10.5px] text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* §24 reactions */}
          <section aria-label="Reactions" className="mt-7 flex flex-wrap items-center gap-2">
            {REACTIONS.map(({ type, label, icon: Icon }) => {
              const count = reactions?.counts[type] ?? 0;
              const active = reactions?.mine.includes(type) ?? false;
              return (
                <button
                  key={type}
                  onClick={() => void toggleReaction(type)}
                  disabled={reactBusy}
                  aria-pressed={active}
                  aria-label={`${label} reaction${active ? " — active" : ""}`}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-medium transition-all disabled:opacity-60",
                    active
                      ? "border-gold/50 bg-gold/15 text-gold shadow-gold"
                      : "border-white/[0.09] bg-white/[0.03] text-muted-foreground hover:border-gold/30 hover:text-foreground"
                  )}
                >
                  <Icon size={14} aria-hidden="true" className={active ? "fill-gold/20" : ""} />
                  {label}
                  {count > 0 && <span className="font-mono text-[10.5px] opacity-80">{count}</span>}
                </button>
              );
            })}
          </section>

          {/* §23 comments */}
          <section aria-label="Comments" className="mt-8 border-t border-white/[0.06] pt-6">
            <h3 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
              <MessageSquare size={13} className="text-gold" aria-hidden="true" />
              Comments
              <span className="font-mono text-[11px] font-normal text-muted-foreground">({totalComments})</span>
            </h3>
            <p className="mt-1 text-[11.5px] text-muted-foreground/70">
              Every comment is reviewed by a moderator before it appears — no spam, no abuse.
            </p>

            {/* comment list */}
            {commentsLoading ? (
              <div className="flex items-center justify-center py-8" aria-label="Loading comments">
                <Loader2 size={18} className="animate-spin text-gold" />
              </div>
            ) : comments.length === 0 ? (
              <p className="py-8 text-center text-[12.5px] text-muted-foreground/60">
                No comments yet — be the first to share your perspective.
              </p>
            ) : (
              <ul className="mt-5 space-y-5">
                {comments.map((c) => (
                  <li key={c.id}>
                    <CommentItem c={c} onReply={() => {
                      replyToRef.current = c.id;
                      setCStatus({ ok: false, text: `Replying to ${c.authorName} — write your reply below.` });
                    }} onReport={() => void reportComment(c.id)} />
                    {c.replies.length > 0 && (
                      <ul className="mt-4 space-y-4 border-l-2 border-white/[0.06] pl-4">
                        {c.replies.map((r) => (
                          <li key={r.id}>
                            <CommentItem c={r} onReport={() => void reportComment(r.id)} onReply={undefined} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* comment form */}
            <form
              className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
              onSubmit={(e) => {
                e.preventDefault();
                void submitComment();
              }}
            >
              <h4 className="text-[12.5px] font-semibold text-foreground" id="comment-form-title">
                {replyToRef.current ? "Write a reply" : "Leave a comment"}
              </h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="sr-only">Your name</span>
                  <input
                    type="text"
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="Your name"
                    maxLength={60}
                    autoComplete="name"
                    className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
                  />
                </label>
                <label className="block">
                  <span className="sr-only">Email (optional, never shown publicly)</span>
                  <input
                    type="email"
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    placeholder="Email (optional, private)"
                    maxLength={254}
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
                  />
                </label>
              </div>
              <label className="mt-3 block">
                <span className="sr-only">Your comment</span>
                <textarea
                  value={cBody}
                  onChange={(e) => setCBody(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Share your perspective — be respectful and specific."
                  aria-labelledby="comment-form-title"
                  className="w-full resize-none rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
                />
              </label>

              {/* §92 honeypot — visually hidden, bots fill it */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Company
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={cHoneypot}
                    onChange={(e) => setCHoneypot(e.target.value)}
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                {cStatus && (
                  <p
                    role="status"
                    aria-live="polite"
                    className={cn(
                      "text-[11.5px] leading-snug",
                      cStatus.ok ? "text-teal" : "text-red-300"
                    )}
                  >
                    {cStatus.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={cSubmitting}
                  className="btn-shine ml-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-4 py-2.5 text-[12.5px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {cSubmitting ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Send size={12} aria-hidden="true" />}
                  {replyToRef.current ? "Post reply" : "Post comment"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </article>
    </div>
  );
}

/* ── Single comment (top-level or reply) ───────────────────── */

function CommentItem({
  c,
  onReply,
  onReport,
}: {
  c: PublicComment;
  onReply?: () => void;
  onReport: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold-dim font-display text-[10.5px] font-bold text-gold">
            {initials(c.authorName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold text-foreground">{c.authorName}</p>
            <p className="font-mono text-[10px] text-muted-foreground/60">{timeAgo(c.createdAt)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {onReply && (
            <button
              type="button"
              onClick={onReply}
              className="rounded-md border border-white/[0.1] bg-white/[0.03] px-2 py-1 font-mono text-[9.5px] font-semibold text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              Reply
            </button>
          )}
          <button
            type="button"
            onClick={onReport}
            aria-label={`Report comment by ${c.authorName}`}
            title="Report comment"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:text-red-300"
          >
            <Flag size={10} aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="mt-2.5 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">{c.body}</p>
    </div>
  );
}

