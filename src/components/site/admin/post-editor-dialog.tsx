"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Copy,
  Eye,
  FileText,
  Image as ImageIcon,
  ImagePlus,
  Loader2,
  Mail,
  MessageSquare,
  Paperclip,
  Pencil,
  Search,
  Send,
  Sparkles,
  Trash2,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post, PostStatus } from "@/lib/posts";
import type { AttachmentMeta } from "@/lib/media-shared";
import type { PostAssistance } from "@/lib/post-ai";
import { POST_STATUS_STYLES } from "./types";
import { slugify } from "@/lib/posts";

/* ── Author option (§43) ─────────────────────────────────── */
type AuthorOption = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
};

/* ── Draft attachment (§25) — mirrors AttachmentMeta ─────── */

const CUSTOM_AUTHOR = "__custom__";

export function PostEditorDialog({
  post,
  mode,
  onClose,
  onSave,
}: {
  post: Post | null; // null = new post
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
    authorId?: string | null;
    coverImageUrl?: string | null;
    attachments?: AttachmentMeta[];
    seoTitle?: string | null;
    seoDescription?: string | null;
    socialImageUrl?: string | null;
    scheduledAt?: string | null;
    notifyPlanned?: boolean;
    notifySegment?: "all" | "recent90";
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
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "draft");
  const [saving, setSaving] = useState<null | "draft" | "scheduled" | "published">(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"write" | "preview" | "seo">("write");

  // ── BATCH 5 state ──
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [authorId, setAuthorId] = useState<string>(post?.authorId ?? CUSTOM_AUTHOR);
  const [authorCustom, setAuthorCustom] = useState(
    post && !post.authorId ? post.author : ""
  );
  const [cover, setCover] = useState<string | null>(post?.coverImageUrl ?? null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentMeta[]>(post?.attachments ?? []);
  const [attUploading, setAttUploading] = useState(false);
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? "");
  const [socialImage, setSocialImage] = useState(post?.socialImageUrl ?? "");
  const [scheduledLocal, setScheduledLocal] = useState(
    post?.scheduledAt ? toLocalInput(post.scheduledAt) : ""
  );
  const [notifyChoice, setNotifyChoice] = useState<"all" | "recent90" | "none">(
    post ? (post.notifyPlanned ? post.notifySegment : "none") : "all"
  );

  // AI assist (§27)
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<PostAssistance | null>(null);
  const [aiApplied, setAiApplied] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Lock body scroll + Escape close (§14)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Auto-sync slug from title (until editor touches slug field)
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  // §43: load author profiles for the picker
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/posts/authors");
        if (!res.ok) return;
        const j = await res.json();
        if (alive && Array.isArray(j.authors)) {
          setAuthors(
            j.authors
              .filter((a: { active?: boolean }) => a.active !== false)
              .map((a: AuthorOption) => ({
                id: a.id,
                name: a.name,
                role: a.role,
                avatarUrl: a.avatarUrl,
              }))
          );
        }
      } catch {
        /* picker falls back to custom author input */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* ── Markdown toolbar (§26 rich content) ────────────────── */
  const insertMarkdown = (before: string, after = "", placeholder = "") => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? start;
    const selected = content.slice(start, end);
    const insert = `${before}${selected || placeholder}${after}`;
    const next = content.slice(0, start) + insert + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + before.length + (selected || placeholder).length + after.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const toolbar: { label: string; action: () => void; hint: string }[] = [
    { label: "H2", action: () => insertMarkdown("\n## ", "", "Section heading"), hint: "heading" },
    { label: "B", action: () => insertMarkdown("**", "**", "bold"), hint: "bold" },
    { label: "I", action: () => insertMarkdown("*", "*", "italic"), hint: "italic" },
    { label: "List", action: () => insertMarkdown("\n- ", "", "list item"), hint: "bullet list" },
    { label: "Quote", action: () => insertMarkdown("\n> ", "", "quoted line"), hint: "quote" },
    { label: "Code", action: () => insertMarkdown("`", "`", "code"), hint: "inline code" },
    { label: "Link", action: () => insertMarkdown("[", "](https://)", "link text"), hint: "link" },
    { label: "Image", action: () => insertMarkdown("\n![", "](https://)", "image description"), hint: "image (markdown)" },
    { label: "Callout", action: () => insertMarkdown("\n> **Note:** ", "", "an important aside"), hint: "callout" },
    { label: "—", action: () => insertMarkdown("\n\n---\n\n"), hint: "divider" },
  ];

  /* ── Media upload (§20/§21/§25/§93 via /api/admin/media) ── */
  const uploadFile = async (file: File): Promise<AttachmentMeta | null> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      setError(j?.error ?? "Upload failed");
      return null;
    }
    return {
      name: j.asset.originalName,
      url: j.asset.url,
      bytes: j.asset.bytes,
      mime: j.asset.mime,
      kind: j.asset.kind,
    };
  };

  const handleCoverUpload = async (file: File) => {
    setCoverUploading(true);
    setError(null);
    try {
      const asset = await uploadFile(file);
      if (asset) {
        setCover(asset.url);
        setSocialImage((s) => s || asset.url);
      }
    } finally {
      setCoverUploading(false);
    }
  };

  const handleAttachmentUpload = async (files: FileList) => {
    setAttUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files).slice(0, 5)) {
        if (attachments.length >= 20) break;
        const asset = await uploadFile(file);
        if (asset) setAttachments((prev) => [...prev, asset]);
      }
    } finally {
      setAttUploading(false);
    }
  };

  const insertAttachmentInline = (a: AttachmentMeta) => {
    if (a.kind === "image") {
      insertMarkdown(`\n![${a.name}](${a.url})\n`);
    } else if (a.kind === "video") {
      insertMarkdown(`\n![${a.name}](${a.url})\n`); // video URLs render as <video> in the article view
    } else {
      insertMarkdown(`\n[${a.name}](${a.url})\n`);
    }
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/,/g, " ").trim();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const previewWordCount = useMemo(
    () => content.trim().split(/\s+/).filter(Boolean).length,
    [content]
  );

  /* ── AI assist (§27) ────────────────────────────────────── */
  const runAiAssist = async () => {
    if (title.trim().length < 3 || content.trim().length < 40) {
      setAiError("Write a title and at least 40 characters of content first — the assistant works only from your draft.");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const res = await fetch("/api/admin/posts/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim(),
          content: content.trim(),
          category,
          tags,
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? "AI assistance failed");
      setAiResult(j.assistance as PostAssistance);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI assistance failed");
    } finally {
      setAiLoading(false);
    }
  };

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setAiApplied(key);
      setTimeout(() => setAiApplied((k) => (k === key ? null : k)), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  /* ── Save ───────────────────────────────────────────────── */
  const buildPayload = (targetStatus: PostStatus) => {
    const resolvedAuthor =
      authorId === CUSTOM_AUTHOR
        ? authorCustom.trim() || "OKOMBA ANALYTICS"
        : authors.find((a) => a.id === authorId)?.name ?? "OKOMBA ANALYTICS";
    const scheduledIso =
      targetStatus === "scheduled" && scheduledLocal
        ? new Date(scheduledLocal).toISOString()
        : targetStatus === "scheduled"
          ? null
          : null;
    return {
      ...(post ? { id: post.id } : {}),
      title: title.trim(),
      slug: slug.trim() ? slugify(slug) : undefined,
      excerpt: excerpt.trim(),
      content: content.trim(),
      category: category.trim(),
      tags,
      author: resolvedAuthor,
      status: targetStatus,
      authorId: authorId === CUSTOM_AUTHOR ? null : authorId,
      coverImageUrl: cover,
      attachments,
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
      socialImageUrl: socialImage.trim() || cover,
      scheduledAt: scheduledIso,
      notifyPlanned: notifyChoice !== "none",
      notifySegment: notifyChoice === "recent90" ? ("recent90" as const) : ("all" as const),
    };
  };

  const handleSave = async (targetStatus: PostStatus) => {
    setError(null);
    if (title.trim().length < 3) return setError("Title must be at least 3 characters.");
    if (excerpt.trim().length < 10) return setError("Excerpt must be at least 10 characters.");
    if (content.trim().length < 20) return setError("Content must be at least 20 characters.");
    if (targetStatus === "scheduled" && !scheduledLocal) {
      return setError("Pick a date and time to schedule this post.");
    }
    setSaving(targetStatus === "draft" ? "draft" : targetStatus);
    try {
      await onSave(buildPayload(targetStatus));
      setStatus(targetStatus);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(null);
    }
  };

  const isEditingExisting = mode === "edit" && post !== null;
  const effectiveSeoTitle = seoTitle.trim() || title;
  const effectiveSeoDesc = seoDescription.trim() || excerpt;
  const effectiveSocialImage = socialImage.trim() || cover;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Compose new post" : `Edit post: ${post?.title ?? ""}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="section-dark relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float sm:rounded-3xl [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
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
                    : "Full publishing editor — media, SEO, scheduling and AI assistance."}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setAiOpen((o) => !o)}
                aria-pressed={aiOpen}
                aria-label="Toggle AI assistant"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-[12px] font-medium transition-colors",
                  aiOpen
                    ? "border-gold/50 bg-gold/20 text-gold"
                    : "border-white/[0.09] bg-white/[0.04] text-muted-foreground hover:border-gold/40 hover:text-gold"
                )}
              >
                <Sparkles size={13} aria-hidden="true" /> AI assist
              </button>
              <button
                onClick={onClose}
                aria-label="Close editor"
                className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-6 md:px-7">
          {/* AI assist panel (§27) */}
          {aiOpen && (
            <section
              aria-label="AI post assistant"
              className="mb-6 rounded-2xl border border-gold/20 bg-gold/[0.04] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/30 bg-gold-dim text-gold">
                    <Sparkles size={14} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-[13.5px] font-semibold text-foreground">AI post assistant</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Works only from your draft — never invents claims, numbers or clients.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={runAiAssist}
                  disabled={aiLoading}
                  className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-4 py-2 text-[12.5px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Sparkles size={12} aria-hidden="true" />}
                  {aiResult ? "Regenerate suggestions" : "Generate suggestions"}
                </button>
              </div>

              {aiError && (
                <p role="alert" className="mt-3 rounded-lg border border-red-500/25 bg-red-500/[0.08] px-3 py-2 text-[12px] text-red-300">
                  {aiError}
                </p>
              )}

              {aiLoading && (
                <div className="mt-4 space-y-2.5" aria-label="Generating suggestions">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-9 animate-pulse rounded-lg bg-white/[0.04]" />
                  ))}
                </div>
              )}

              {aiResult && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {aiResult.headlineSuggestions.length > 0 && (
                    <AiSection title="Headline upgrades" onApplyAll={null}>
                      {aiResult.headlineSuggestions.map((h) => (
                        <div key={h} className="flex items-start justify-between gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                          <p className="text-[12.5px] leading-snug text-foreground">{h}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setTitle(h);
                              setSlugTouched(false);
                            }}
                            className="shrink-0 rounded-md border border-gold/30 bg-gold-dim px-2 py-1 font-mono text-[9.5px] font-semibold text-gold transition-colors hover:bg-gold/20"
                          >
                            Use
                          </button>
                        </div>
                      ))}
                    </AiSection>
                  )}
                  {aiResult.excerptSuggestions.length > 0 && (
                    <AiSection title="Excerpt upgrades">
                      {aiResult.excerptSuggestions.map((e) => (
                        <div key={e} className="flex items-start justify-between gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                          <p className="text-[12.5px] leading-snug text-muted-foreground">{e}</p>
                          <button
                            type="button"
                            onClick={() => setExcerpt(e.slice(0, 400))}
                            className="shrink-0 rounded-md border border-gold/30 bg-gold-dim px-2 py-1 font-mono text-[9.5px] font-semibold text-gold transition-colors hover:bg-gold/20"
                          >
                            Use
                          </button>
                        </div>
                      ))}
                    </AiSection>
                  )}
                  {aiResult.structureNotes.length > 0 && (
                    <AiSection title="Structure & clarity">
                      <ul className="space-y-1.5">
                        {aiResult.structureNotes.map((n) => (
                          <li key={n} className="flex items-start gap-2 text-[12.5px] leading-snug text-muted-foreground">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold/60" aria-hidden="true" />
                            {n}
                          </li>
                        ))}
                      </ul>
                    </AiSection>
                  )}
                  {aiResult.grammarNotes.length > 0 && (
                    <AiSection title="Grammar fixes">
                      <ul className="space-y-1.5">
                        {aiResult.grammarNotes.map((n) => (
                          <li key={n} className="flex items-start gap-2 text-[12.5px] leading-snug text-muted-foreground">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal/60" aria-hidden="true" />
                            {n}
                          </li>
                        ))}
                      </ul>
                    </AiSection>
                  )}
                  <AiSection title="SEO metadata">
                    <div className="space-y-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                      <p className="text-[12.5px] text-foreground">{aiResult.seoTitle}</p>
                      <p className="text-[11.5px] leading-snug text-muted-foreground">{aiResult.seoDescription}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSeoTitle(aiResult.seoTitle);
                          setSeoDescription(aiResult.seoDescription);
                        }}
                        className="mt-1 rounded-md border border-gold/30 bg-gold-dim px-2 py-1 font-mono text-[9.5px] font-semibold text-gold transition-colors hover:bg-gold/20"
                      >
                        Apply both
                      </button>
                    </div>
                  </AiSection>
                  <AiSection title="Share & announce">
                    <div className="space-y-2">
                      <CopyRow label="Social caption" text={aiResult.socialCaption} copied={aiApplied === "social"} onCopy={() => copyText(aiResult.socialCaption, "social")} />
                      <CopyRow label="Subscriber subject" text={aiResult.subscriberSubject} copied={aiApplied === "subject"} onCopy={() => copyText(aiResult.subscriberSubject, "subject")} />
                      <CopyRow label="Announcement" text={aiResult.subscriberAnnouncement} copied={aiApplied === "announce"} onCopy={() => copyText(aiResult.subscriberAnnouncement, "announce")} />
                      <CopyRow label="CTA" text={aiResult.ctaSuggestion} copied={aiApplied === "cta"} onCopy={() => copyText(aiResult.ctaSuggestion, "cta")} />
                    </div>
                  </AiSection>
                </div>
              )}
            </section>
          )}

          {/* Tabs */}
          <div className="mb-5 flex items-center gap-1 rounded-lg border border-white/[0.07] bg-white/[0.02] p-0.5" role="tablist" aria-label="Editor sections">
            {(
              [
                { id: "write", label: "Write", icon: Pencil },
                { id: "preview", label: "Preview", icon: Eye },
                { id: "seo", label: "SEO & sharing", icon: Search },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                  tab === t.id ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <t.icon size={12} aria-hidden="true" /> {t.label}
              </button>
            ))}
          </div>

          {tab === "write" && (
            <>
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
                    Slug <span className="font-mono text-[10px] text-muted-foreground/60">(auto)</span>
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

              {/* Category + author (§43) */}
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
                <div>
                  <label htmlFor="post-author-select" className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
                    Author profile
                  </label>
                  <select
                    id="post-author-select"
                    value={authorId}
                    onChange={(e) => setAuthorId(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[13.5px] text-foreground outline-none transition-colors focus:border-gold/60"
                  >
                    <option value={CUSTOM_AUTHOR} className="bg-[#0b101c] text-foreground">
                      Custom name…
                    </option>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id} className="bg-[#0b101c] text-foreground">
                        {a.name} — {a.role}
                      </option>
                    ))}
                  </select>
                  {authorId === CUSTOM_AUTHOR && (
                    <input
                      type="text"
                      value={authorCustom}
                      onChange={(e) => setAuthorCustom(e.target.value)}
                      maxLength={120}
                      placeholder="OKOMBA ANALYTICS"
                      aria-label="Custom author name"
                      className="mt-2 w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
                    />
                  )}
                </div>
              </div>

              {/* Cover image (§25 featured) */}
              <div className="mt-4">
                <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
                  Cover image <span className="text-[10px] text-muted-foreground/60">(optimized automatically — max 10 MB)</span>
                </span>
                {cover ? (
                  <div className="flex items-center gap-4 rounded-xl border border-white/[0.09] bg-white/[0.02] p-3">
                    { }
                    <img
                      src={cover}
                      alt="Cover preview"
                      className="h-16 w-28 rounded-lg border border-white/[0.08] object-cover"
                    />
                    <p className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">{cover}</p>
                    <button
                      type="button"
                      onClick={() => setCover(null)}
                      aria-label="Remove cover image"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-300"
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-dashed border-white/[0.14] bg-white/[0.015] px-4 py-6 text-[12.5px] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold">
                    {coverUploading ? (
                      <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <ImagePlus size={15} aria-hidden="true" />
                    )}
                    {coverUploading ? "Uploading & optimizing…" : "Upload cover image (JPG, PNG, WebP, GIF)"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      className="sr-only"
                      disabled={coverUploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleCoverUpload(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
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
                  Tags <span className="font-mono text-[10px] text-muted-foreground/60">({tags.length}/10)</span>
                </label>
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 py-2.5">
                  {tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5 rounded-md border border-gold/25 bg-gold-dim px-2 py-1 font-mono text-[10.5px] text-gold">
                      {t}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((x) => x !== t))}
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

              {/* Content + toolbar */}
              <div className="mt-4">
                <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Content</span>
                <div className="mb-2 flex flex-wrap items-center gap-1 rounded-lg border border-white/[0.07] bg-white/[0.02] p-1" role="toolbar" aria-label="Formatting">
                  {toolbar.map((b) => (
                    <button
                      key={b.label}
                      type="button"
                      onClick={b.action}
                      title={b.hint}
                      aria-label={`Insert ${b.hint}`}
                      className="inline-flex h-7 items-center gap-1 rounded-md px-2 font-mono text-[10.5px] font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
                <textarea
                  ref={contentRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  placeholder={"## Section heading\n\nWrite in Markdown. **Bold**, *italic*, lists, quotes, code.\n\nInsert images inline — `![](url)` — or upload attachments below."}
                  className="w-full resize-y rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 focus:bg-white/[0.05]"
                />
                <span className="mt-1 inline-block font-mono text-[10px] text-muted-foreground/60">
                  {previewWordCount} words · ≈{Math.max(1, Math.round(previewWordCount / 200))} min read
                </span>
              </div>

              {/* Attachments (§25) */}
              <div className="mt-4">
                <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
                  Media & attachments <span className="text-[10px] text-muted-foreground/60">(images, video, PDF — {attachments.length}/20)</span>
                </span>
                {attachments.length > 0 && (
                  <ul className="mb-2 space-y-1.5">
                    {attachments.map((a, i) => (
                      <li
                        key={`${a.url}-${i}`}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2"
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                            a.kind === "image" && "border-gold/25 bg-gold-dim text-gold",
                            a.kind === "video" && "border-teal/25 bg-teal-dim text-teal",
                            a.kind === "document" && "border-white/[0.1] bg-white/[0.04] text-muted-foreground"
                          )}
                        >
                          {a.kind === "image" ? <ImageIcon size={12} aria-hidden="true" /> : a.kind === "video" ? <VideoIcon size={12} aria-hidden="true" /> : <Paperclip size={12} aria-hidden="true" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-medium text-foreground">{a.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground/60">
                            {a.kind} · {Math.max(1, Math.round(a.bytes / 1024))} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => insertAttachmentInline(a)}
                          className="shrink-0 rounded-md border border-gold/30 bg-gold-dim px-2 py-1 font-mono text-[9.5px] font-semibold text-gold transition-colors hover:bg-gold/20"
                        >
                          Insert
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}
                          aria-label={`Remove attachment ${a.name}`}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-300"
                        >
                          <X size={11} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <label className="flex cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-dashed border-white/[0.14] bg-white/[0.015] px-4 py-4 text-[12px] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold">
                  {attUploading ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Paperclip size={14} aria-hidden="true" />
                  )}
                  {attUploading ? "Uploading…" : "Add images / video / PDF attachments"}
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,application/pdf"
                    className="sr-only"
                    disabled={attUploading}
                    onChange={(e) => {
                      if (e.target.files?.length) void handleAttachmentUpload(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </>
          )}

          {tab === "preview" && (
            <div>
              {cover && (
                 
                <img src={cover} alt="" className="mb-5 h-44 w-full rounded-2xl border border-white/[0.08] object-cover" />
              )}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="eyebrow rounded-full border border-gold/25 bg-gold-dim px-3 py-1 text-[9px] text-gold">
                  {category}
                </span>
                <span className="font-mono text-[10.5px] text-muted-foreground">
                  {authorId === CUSTOM_AUTHOR ? authorCustom.trim() || "OKOMBA ANALYTICS" : authors.find((a) => a.id === authorId)?.name}
                </span>
              </div>
              <h3 className="mt-3 text-balance font-display text-xl font-bold leading-snug text-foreground">{title || "Untitled"}</h3>
              <p className="mt-2 text-[12.5px] text-muted-foreground">{excerpt || "No excerpt yet."}</p>
              <div className="prose-okomba mt-5">
                <pre className="whitespace-pre-wrap break-words rounded-xl border border-white/[0.09] bg-white/[0.02] px-4 py-3 font-mono text-[12.5px] leading-relaxed text-muted-foreground">
                  {content || "Nothing to preview yet — write in the Write tab."}
                </pre>
              </div>
              {attachments.length > 0 && (
                <p className="mt-4 font-mono text-[10.5px] text-muted-foreground/70">
                  + {attachments.length} attachment{attachments.length === 1 ? "" : "s"} (gallery renders in the public article)
                </p>
              )}
            </div>
          )}

          {tab === "seo" && (
            <div className="space-y-6">
              {/* SEO metadata (§26) */}
              <div>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
                    SEO title <span className="font-mono text-[10px] text-muted-foreground/60">({effectiveSeoTitle.length}/60 recommended)</span>
                  </span>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    maxLength={180}
                    placeholder={`Falls back to: ${title || "post title"}`}
                    className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[13.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
                  />
                </label>
                <label className="mt-3 block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
                    SEO description <span className="font-mono text-[10px] text-muted-foreground/60">({effectiveSeoDesc.length}/155 recommended)</span>
                  </span>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={2}
                    maxLength={320}
                    placeholder={`Falls back to: ${excerpt || "post excerpt"}`}
                    className="w-full resize-none rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[13px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
                  />
                </label>
              </div>

              {/* Social preview (§26) */}
              <div>
                <span className="mb-2 block text-[12px] font-medium text-muted-foreground">Social share preview</span>
                <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0e1420]">
                  {effectiveSocialImage && (
                     
                    <img src={effectiveSocialImage} alt="" className="h-40 w-full object-cover" />
                  )}
                  <div className="p-4">
                    <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">okomba.com</p>
                    <p className="mt-1 text-[14px] font-semibold leading-snug text-foreground">{effectiveSeoTitle || "Post title"}</p>
                    <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">{effectiveSeoDesc || "Post description"}</p>
                  </div>
                </div>
                <label className="mt-2 block">
                  <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Social image URL (defaults to cover)</span>
                  <input
                    type="text"
                    value={socialImage}
                    onChange={(e) => setSocialImage(e.target.value)}
                    placeholder={cover ?? "https://…"}
                    className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 font-mono text-[11px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
                  />
                </label>
              </div>

              {/* Subscriber email preview (§28) */}
              <div>
                <span className="mb-2 block text-[12px] font-medium text-muted-foreground">
                  Subscriber email preview <span className="text-[10px] text-muted-foreground/60">(what the notification blast will look like)</span>
                </span>
                <div className="rounded-2xl border border-white/[0.1] bg-[#0e1420] p-5">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-gold/80">
                    <Mail size={10} className="mr-1 inline" aria-hidden="true" /> Email preview
                  </p>
                  <p className="mt-2 text-[14px] font-semibold text-foreground">
                    New from Okomba Insights — {title || "Post title"}
                  </p>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{excerpt || "Post excerpt appears here."}</p>
                  <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-4 py-2 text-[12px] font-semibold text-ink">
                    Read the article
                  </span>
                  <p className="mt-3 font-mono text-[9.5px] text-muted-foreground/50">
                    {notifyChoice === "none"
                      ? "Notification disabled — this email will not be sent"
                      : notifyChoice === "recent90"
                        ? "Recipients: subscribers confirmed in the last 90 days"
                        : "Recipients: all confirmed subscribers"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status pill (existing posts) */}
          {isEditingExisting && (
            <div className="mt-5 flex items-center gap-2">
              <span className="text-[12px] font-medium text-muted-foreground">Current status:</span>
              <span className={cn("rounded-full border px-2.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider", POST_STATUS_STYLES[post!.status] ?? "border-white/15 bg-white/5 text-muted-foreground")}>
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
        <footer className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-5 md:px-7">
          {/* Schedule + notify controls (§26/§28) */}
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-2.5">
              <CalendarClock size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              <label className="min-w-0 flex-1">
                <span className="sr-only">Scheduled publish date and time</span>
                <input
                  type="datetime-local"
                  value={scheduledLocal}
                  onChange={(e) => setScheduledLocal(e.target.value)}
                  aria-label="Schedule publish date and time"
                  className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] text-foreground outline-none transition-colors focus:border-gold/60"
                />
              </label>
            </div>
            <div className="flex items-center gap-2.5">
              <MessageSquare size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              <label className="min-w-0 flex-1">
                <span className="sr-only">Notify subscribers on publish</span>
                <select
                  value={notifyChoice}
                  onChange={(e) => setNotifyChoice(e.target.value as "all" | "recent90" | "none")}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] text-foreground outline-none transition-colors focus:border-gold/60"
                >
                  <option value="all" className="bg-[#0b101c]">Notify: all confirmed subscribers</option>
                  <option value="recent90" className="bg-[#0b101c]">Notify: new subscribers (last 90 days)</option>
                  <option value="none" className="bg-[#0b101c]">Don&apos;t notify subscribers</option>
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11.5px] text-muted-foreground">
              {status === "scheduled"
                ? "Scheduled posts publish automatically at their time."
                : notifyChoice === "none"
                  ? "Publishing without a subscriber notification."
                  : "Publishing emails the selected subscriber segment."}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleSave("draft")}
                disabled={saving !== null}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
              >
                {saving === "draft" ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <FileText size={13} aria-hidden="true" />}
                Save draft
              </button>
              <button
                type="button"
                onClick={() => handleSave("scheduled")}
                disabled={saving !== null}
                className="inline-flex items-center gap-2 rounded-xl border border-[#5b9eff]/30 bg-[#5b9eff]/10 px-4 py-2.5 text-[13px] font-medium text-[#5b9eff] transition-colors hover:bg-[#5b9eff]/20 disabled:opacity-50"
              >
                {saving === "scheduled" ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <CalendarClock size={13} aria-hidden="true" />}
                Schedule
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
                  : notifyChoice === "none"
                    ? "Publish"
                    : "Publish & notify"}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

/** ISO string → datetime-local input value. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AiSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
  onApplyAll?: null;
}) {
  return (
    <div>
      <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-gold/80">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CopyRow({
  label,
  text,
  copied,
  onCopy,
}: {
  label: string;
  text: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
      <div className="min-w-0">
        <p className="font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground/70">{label}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-foreground">{text}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copy ${label}`}
        className="shrink-0 rounded-md border border-white/[0.1] bg-white/[0.03] p-1.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
      >
        {copied ? <CheckCircle2 size={11} className="text-teal" aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
      </button>
    </div>
  );
}

