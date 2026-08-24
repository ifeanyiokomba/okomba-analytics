"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Pencil,
  Send,
  Tag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post, PostStatus } from "@/lib/posts";
import { POST_STATUS_STYLES } from "./types";
import { slugify } from "@/lib/posts";

/* Post editor dialog — compose new or edit existing post.
   Draft (save) vs Publish (save + blast subscribers). */
export function PostEditorDialog({
  post,
  mode,
  onClose,
  onSave,
}: {
  post: Post | null;            // null = new post
  mode: "create" | "edit";
  onClose: () => void;
  onSave: (data: {
    id?: string;
    title: string;
    slug?: string;
    excerpt: string;
    content: string;
    category: string;
    tags: string[];
    author: string;
    status: PostStatus;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(post !== null);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [category, setCategory] = useState(post?.category ?? "Business");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [author, setAuthor] = useState(post?.author ?? "OKOMBA ANALYTICS");
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "draft");
  const [saving, setSaving] = useState<null | "draft" | "published">(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");

  // Lock body scroll while open
  useEffect(() => {
    if (!post && mode === "create") {
      // creating — still lock
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mode, post, onClose]);

  // Auto-sync slug from title (until editor touches slug field)
  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(title));
    }
  }, [title, slugTouched]);

  const addTag = () => {
    const t = tagInput.trim().replace(/,/g, " ").trim();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter((x) => x !== t));
  };

  const previewWordCount = useMemo(
    () => content.trim().split(/\s+/).filter(Boolean).length,
    [content]
  );

  const handleSave = async (targetStatus: PostStatus) => {
    setError(null);
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (excerpt.trim().length < 10) {
      setError("Excerpt must be at least 10 characters.");
      return;
    }
    if (content.trim().length < 20) {
      setError("Content must be at least 20 characters.");
      return;
    }
    setSaving(targetStatus === "draft" ? "draft" : "published");
    try {
      await onSave({
        ...(post ? { id: post.id } : {}),
        title: title.trim(),
        slug: slug.trim() ? slugify(slug) : undefined,
        excerpt: excerpt.trim(),
        content: content.trim(),
        category: category.trim(),
        tags,
        author: author.trim() || "OKOMBA ANALYTICS",
        status: targetStatus,
      });
      setStatus(targetStatus);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(null);
    }
  };

  // Hide the dialog if we just closed (transition graceful)
  const isEditingExisting = mode === "edit" && post !== null;
  const willPublish = isEditingExisting
    ? post!.status === "draft"
    : false;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Compose new post" : `Edit post: ${post?.title ?? ""}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="section-dark relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float sm:rounded-3xl [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
        {/* Header */}
        <header className="relative border-b border-white/[0.06] p-6 md:p-7">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/[0.12] blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim text-gold">
                {mode === "create" ? <Pencil size={16} aria-hidden="true" /> : <FileText size={16} aria-hidden="true" />}
              </span>
              <div>
                <h2 className="font-display text-[20px] font-bold text-foreground">
                  {mode === "create" ? "Compose new post" : "Edit post"}
                </h2>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {isEditingExisting
                    ? `Last updated ${new Date(post!.updatedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`
                    : "Drafts are private. Publishing emails all confirmed subscribers."}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close editor"
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Body — write/preview toggle */}
        <div className="overflow-y-auto px-6 py-6 md:px-7">
          {/* Title + slug */}
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A practical title that earns the click"
                maxLength={180}
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[14.5px] font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 placeholder:font-normal focus:border-gold/60 focus:bg-white/[0.05]"
              />
            </label>
            <label className="block md:w-[210px]">
              <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
                Slug{" "}
                <span className="font-mono text-[10px] text-muted-foreground/60">(auto)</span>
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="auto-from-title"
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 font-mono text-[12px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 focus:bg-white/[0.05]"
              />
            </label>
          </div>

          {/* Category + author */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[13.5px] text-foreground outline-none transition-colors focus:border-gold/60"
              >
                {["Business", "Operations", "Technology", "Finance", "Education"].map((c) => (
                  <option key={c} value={c} className="bg-[#0b101c] text-foreground">
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Author</span>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                maxLength={120}
                placeholder="OKOMBA ANALYTICS"
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[13.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 focus:bg-white/[0.05]"
              />
            </label>
          </div>

          {/* Excerpt */}
          <label className="mt-4 block">
            <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Excerpt</span>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              maxLength={400}
              placeholder="A one-line summary that shows on the insights card list."
              className="w-full resize-none rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[13.5px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 focus:bg-white/[0.05]"
            />
            <span className="mt-1 inline-block font-mono text-[10px] text-muted-foreground/60">
              {excerpt.length}/400
            </span>
          </label>

          {/* Tags */}
          <div className="mt-4">
            <label className="mb-1.5 flex items-center gap-2 text-[12px] font-medium text-muted-foreground">
              <Tag size={12} aria-hidden="true" /> Tags
              <span className="font-mono text-[10px] text-muted-foreground/60">({tags.length}/10)</span>
            </label>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 py-2.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gold/25 bg-gold-dim px-2 py-1 font-mono text-[10.5px] text-gold"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    aria-label={`Remove tag ${t}`}
                    className="text-gold/70 transition-colors hover:text-gold"
                  >
                    <X size={10} aria-hidden="true" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
                    setTags(tags.slice(0, -1));
                  }
                }}
                placeholder={tags.length === 0 ? "Type a tag, press Enter" : ""}
                className="min-w-[140px] flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Content — write/preview tabs */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted-foreground">Content</span>
              <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-white/[0.02] p-0.5">
                <button
                  type="button"
                  onClick={() => setTab("write")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10px] transition-colors",
                    tab === "write"
                      ? "bg-gold/15 text-gold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Pencil size={10} aria-hidden="true" /> Write
                </button>
                <button
                  type="button"
                  onClick={() => setTab("preview")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10px] transition-colors",
                    tab === "preview"
                      ? "bg-gold/15 text-gold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Eye size={10} aria-hidden="true" /> Preview
                </button>
              </div>
            </div>

            {tab === "write" ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                placeholder={"## Section heading\n\nWrite in Markdown. **Bold**, *italic*, lists, headings.\n\nEach H2 becomes a section in the reading view."}
                className="w-full resize-y rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 focus:bg-white/[0.05]"
              />
            ) : (
              <div className="min-h-[260px] max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/[0.09] bg-white/[0.02] px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
                {content || <span className="text-muted-foreground/40">Nothing to preview yet.</span>}
              </div>
            )}
            <span className="mt-1 inline-block font-mono text-[10px] text-muted-foreground/60">
              {previewWordCount} words · ≈{Math.max(1, Math.round(previewWordCount / 200))} min read
            </span>
          </div>

          {/* Status pill (if editing existing post) */}
          {isEditingExisting && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[12px] font-medium text-muted-foreground">Current status:</span>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider",
                  POST_STATUS_STYLES[post!.status] ?? "border-white/15 bg-white/5 text-muted-foreground"
                )}
              >
                {post!.status}
              </span>
              {post!.notifySentAt && (
                <span className="inline-flex items-center gap-1 rounded-full border border-teal/30 bg-teal-dim px-2.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-teal">
                  <CheckCircle2 size={9} aria-hidden="true" /> Subscribers notified
                </span>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-red-500/25 bg-red-500/[0.08] px-3.5 py-2.5 text-[12.5px] text-red-300">
              {error}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <footer className="flex flex-col gap-2.5 border-t border-white/[0.06] bg-white/[0.015] px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-7">
          <p className="text-[11.5px] text-muted-foreground">
            {willPublish
              ? "Publishing will email all confirmed subscribers."
              : isEditingExisting
                ? "Save changes — subscribers won't be re-notified."
                : "Publishing will email all confirmed subscribers."}
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSave("draft")}
              disabled={saving !== null}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
            >
              {saving === "draft" ? (
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              ) : (
                <FileText size={13} aria-hidden="true" />
              )}
              Save draft
            </button>
            <button
              type="button"
              onClick={() => handleSave("published")}
              disabled={saving !== null}
              className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {saving === "published" ? (
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              ) : (
                <Send size={13} aria-hidden="true" />
              )}
              {isEditingExisting && post!.status === "published"
                ? "Update published post"
                : "Publish & notify"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
