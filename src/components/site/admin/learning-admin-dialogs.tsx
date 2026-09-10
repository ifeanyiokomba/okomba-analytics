"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Link2,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Radio,
  Trash2,
  Unlock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  COURSE_LEVELS,
  LESSON_KINDS,
  RESOURCE_KINDS,
  COURSE_LEVEL_LABELS,
  STUDENT_STATUS_LABELS,
  ENROLLMENT_STATUS_LABELS,
  type AdminCourseDetailDto,
  type AdminCourseDto,
  type AdminLessonDto,
  type AdminQuizDto,
  type AdminStudentDetailDto,
  type CourseLevel,
  type LessonKind,
  type ResourceKind,
  type StudentStatus,
} from "@/lib/learning-shared";
import { formatTimestamp, timeAgo } from "./types";

/* ─────────────────────────────────────────────────────────────
   BATCH 13 (§64–§67) part 3 — admin Learning tab dialogs.

   All dialogs mount CONDITIONALLY from the parent (fresh open =
   fresh mount → state seeded at mount, no sync effects — the
   event-dialog house pattern). Radix portals attach to
   document.body, OUTSIDE the dashboard's `.section-dark` var
   scope, so every portaled surface carries the `section-dark`
   class itself + explicit dark colors to stay on-house.
   ───────────────────────────────────────────────────────────── */

export type Notify = (text: string, type?: "ok" | "err") => void;

/* ── helpers ─────────────────────────────────────────────── */

export function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || ""
  );
}

async function jsonFetch(url: string, init?: RequestInit) {
  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    return { res, j } as const;
  } catch {
    return { res: null, j: null } as const;
  }
}

/** Dark classes for portaled radix content (outside .section-dark scope). */
const DARK_DIALOG = "section-dark border-white/[0.09] bg-[#0b101c] text-[#e7eaf2]";

/* ── chips / bits ────────────────────────────────────────── */

const LEVEL_CHIP: Record<CourseLevel, string> = {
  beginner: "border-teal/35 bg-teal-dim text-teal",
  intermediate: "border-gold/35 bg-gold-dim text-gold",
  advanced: "border-rose-400/35 bg-rose-400/10 text-rose-300",
};

function Chip({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-semibold",
        className ?? "border-white/15 bg-white/[0.04] text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </Label>
  );
}

/** Mini progress bar (teal fill on dark track). */
function MiniBar({ percent, className }: { percent: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${pct}% progress`}
      className={cn("h-1.5 w-24 overflow-hidden rounded-full bg-white/10", className)}
    >
      <div className="h-full rounded-full bg-teal/80" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── ConfirmDialog (deletes / suspend) ───────────────────── */

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busy,
  destructive = true,
  onConfirm,
  onClose,
}: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className={cn(DARK_DIALOG, "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px] font-bold text-foreground">
            {destructive && <AlertTriangle size={16} className="text-rose-300" aria-hidden="true" />}
            {title}
          </DialogTitle>
          <DialogDescription className="text-[12.5px] leading-relaxed text-muted-foreground">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2.5">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={busy}
            className="min-h-[44px] border-white/[0.1] bg-white/[0.03]"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={busy}
            className={cn(
              "min-h-[44px]",
              destructive
                ? "bg-rose-500/90 text-white hover:bg-rose-500"
                : "border border-gold/60 bg-gold text-ink hover:bg-gold-light"
            )}
          >
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Course save (create / edit) ─────────────────────────── */

export type CourseSavePayload = {
  title: string;
  slug?: string;
  summary?: string;
  description?: string;
  level?: CourseLevel;
  coverEmoji?: string;
  coverUrl?: string;
  priceNgn?: number;
  published?: boolean;
  sortOrder?: number;
};

export function CourseSaveDialog({
  course,
  onClose,
  onSave,
}: {
  course: AdminCourseDto | null; // null → create
  onClose: () => void;
  onSave: (payload: CourseSavePayload, id?: string) => Promise<boolean>;
}) {
  const isEdit = !!course;
  const [title, setTitle] = useState(course?.title ?? "");
  const [slug, setSlug] = useState(course?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [summary, setSummary] = useState(course?.summary ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [level, setLevel] = useState<CourseLevel>(course?.level ?? "beginner");
  const [coverEmoji, setCoverEmoji] = useState(course?.coverEmoji ?? "📘");
  const [published, setPublished] = useState(course?.published ?? false);
  const [priceNgn, setPriceNgn] = useState(course ? String(course.priceNgn) : "0");
  const [sortOrder, setSortOrder] = useState(course ? String(course.sortOrder) : "0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTitle = (v: string) => {
    setTitle(v);
    if (!slugTouched) setSlug(slugifyTitle(v));
  };

  const submit = async () => {
    if (!title.trim()) return setError("Title is required.");
    if (!slug.trim()) return setError("Slug is required.");
    const price = Number(priceNgn || "0");
    if (!Number.isFinite(price) || price < 0) return setError("Price must be a non-negative number.");
    const order = Number(sortOrder || "0");
    if (!Number.isFinite(order)) return setError("Sort order must be a number.");
    setError(null);
    setBusy(true);
    const okSaved = await onSave(
      {
        title: title.trim(),
        slug: slug.trim(),
        summary: summary.trim() || undefined,
        description: description.trim() || undefined,
        level,
        coverEmoji: coverEmoji.trim() || "📘",
        priceNgn: price,
        published,
        sortOrder: order,
      },
      isEdit ? course.id : undefined
    );
    setBusy(false);
    if (okSaved) onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className={cn(DARK_DIALOG, "max-h-[88vh] overflow-y-auto sm:max-w-xl")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px] font-bold text-foreground">
            <GraduationCap size={16} className="text-gold" aria-hidden="true" />
            {isEdit ? "Edit course" : "New course"}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground">
            {isEdit ? course.title : "Draft courses stay hidden from the student catalogue until published."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="course-title">Title</FieldLabel>
            <Input
              id="course-title"
              value={title}
              onChange={(e) => handleTitle(e.target.value)}
              placeholder="e.g. Google Ads for Small Business"
              maxLength={120}
              className="min-h-[44px]"
            />
          </div>
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="course-slug">Slug (URL)</FieldLabel>
            <Input
              id="course-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugifyTitle(e.target.value));
              }}
              placeholder="auto-suggested from title"
              className="min-h-[44px] font-mono text-[12px]"
            />
          </div>
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="course-summary">Summary</FieldLabel>
            <Input
              id="course-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One-line catalogue teaser"
              maxLength={200}
              className="min-h-[44px]"
            />
          </div>
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="course-description">Description</FieldLabel>
            <Textarea
              id="course-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Full course page description"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="grid gap-1.5">
              <FieldLabel>Level</FieldLabel>
              <Select value={level} onValueChange={(v) => setLevel(v as CourseLevel)}>
                <SelectTrigger className="min-h-[44px] w-full" aria-label="Course level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn(DARK_DIALOG)}>
                  {COURSE_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {COURSE_LEVEL_LABELS[l]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="course-emoji">Cover emoji</FieldLabel>
              <Input
                id="course-emoji"
                value={coverEmoji}
                onChange={(e) => setCoverEmoji(e.target.value)}
                maxLength={8}
                className="min-h-[44px] text-center"
              />
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="course-price">Price (₦)</FieldLabel>
              <Input
                id="course-price"
                inputMode="numeric"
                value={priceNgn}
                onChange={(e) => setPriceNgn(e.target.value.replace(/[^0-9]/g, ""))}
                className="min-h-[44px]"
              />
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="course-order">Sort order</FieldLabel>
              <Input
                id="course-order"
                inputMode="numeric"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value.replace(/[^0-9-]/g, ""))}
                className="min-h-[44px]"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <div>
              <p className="text-[13px] font-semibold text-foreground">Published</p>
              <p className="text-[11px] text-muted-foreground">Visible in the public catalogue when on.</p>
            </div>
            <Switch checked={published} onCheckedChange={setPublished} aria-label="Publish course" />
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-[12px] text-rose-300">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2.5">
          <Button variant="outline" onClick={onClose} disabled={busy} className="min-h-[44px] border-white/[0.1] bg-white/[0.03]">
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy} className="min-h-[44px] border border-gold/60 bg-gold text-ink hover:bg-gold-light">
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {isEdit ? "Save changes" : "Create course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Lesson save (create / edit) ─────────────────────────── */

export type LessonSavePayload = {
  title: string;
  kind?: LessonKind;
  content?: string;
  videoUrl?: string;
  durationMinutes?: number;
  isPreview?: boolean;
  sortOrder?: number;
};

export function LessonDialog({
  moduleId,
  lesson,
  onClose,
  onSave,
}: {
  moduleId: string;
  lesson: AdminLessonDto | null; // null → create
  onClose: () => void;
  onSave: (moduleId: string, payload: LessonSavePayload, lessonId?: string) => Promise<boolean>;
}) {
  const isEdit = !!lesson;
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [kind, setKind] = useState<LessonKind>(lesson?.kind ?? "text");
  const [content, setContent] = useState(lesson?.content ?? "");
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl ?? "");
  const [duration, setDuration] = useState(lesson ? String(lesson.durationMinutes) : "10");
  const [isPreview, setIsPreview] = useState(lesson?.isPreview ?? false);
  const [sortOrder, setSortOrder] = useState(lesson ? String(lesson.sortOrder) : "0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim()) return setError("Title is required.");
    const dur = Number(duration || "0");
    if (!Number.isFinite(dur) || dur < 0) return setError("Duration must be a non-negative number of minutes.");
    if (kind === "video" && videoUrl.trim() && !/^https?:\/\//i.test(videoUrl.trim()))
      return setError("Video URL must start with http:// or https://");
    setError(null);
    setBusy(true);
    const okSaved = await onSave(moduleId, { title: title.trim(), kind, content: content.trim() || undefined, videoUrl: videoUrl.trim() || undefined, durationMinutes: dur, isPreview, sortOrder: Number(sortOrder || "0") }, isEdit ? lesson.id : undefined);
    setBusy(false);
    if (okSaved) onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className={cn(DARK_DIALOG, "max-h-[88vh] overflow-y-auto sm:max-w-xl")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px] font-bold text-foreground">
            <FileText size={15} className="text-gold" aria-hidden="true" />
            {isEdit ? "Edit lesson" : "New lesson"}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground">
            {isEdit ? lesson.title : "Lessons hold the teaching content; quizzes and resources attach to them."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="lesson-title">Title</FieldLabel>
            <Input id="lesson-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} className="min-h-[44px]" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <FieldLabel>Kind</FieldLabel>
              <Select value={kind} onValueChange={(v) => setKind(v as LessonKind)}>
                <SelectTrigger className="min-h-[44px] w-full" aria-label="Lesson kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn(DARK_DIALOG)}>
                  {LESSON_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k === "text" ? "Text" : "Video"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="lesson-duration">Duration (min)</FieldLabel>
              <Input id="lesson-duration" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value.replace(/[^0-9]/g, ""))} className="min-h-[44px]" />
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="lesson-order">Sort order</FieldLabel>
              <Input id="lesson-order" inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value.replace(/[^0-9-]/g, ""))} className="min-h-[44px]" />
            </div>
          </div>
          {kind === "text" ? (
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="lesson-content">Content</FieldLabel>
              <Textarea id="lesson-content" value={content} onChange={(e) => setContent(e.target.value)} rows={7} placeholder="Markdown-ish lesson body (plain text is fine)" />
            </div>
          ) : (
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="lesson-video">Video URL</FieldLabel>
              <Input id="lesson-video" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…" className="min-h-[44px] font-mono text-[12px]" />
            </div>
          )}
          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <div>
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                <Unlock size={13} className="text-teal" aria-hidden="true" /> Free preview
              </p>
              <p className="text-[11px] text-muted-foreground">Anonymous visitors can read this lesson before enrolling (§66).</p>
            </div>
            <Switch checked={isPreview} onCheckedChange={setIsPreview} aria-label="Free preview lesson" />
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-[12px] text-rose-300">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2.5">
          <Button variant="outline" onClick={onClose} disabled={busy} className="min-h-[44px] border-white/[0.1] bg-white/[0.03]">
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy} className="min-h-[44px] border border-gold/60 bg-gold text-ink hover:bg-gold-light">
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {isEdit ? "Save lesson" : "Add lesson"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Resource save (attach to a lesson) ──────────────────── */

export function ResourceDialog({
  lessonId,
  onClose,
  onSave,
}: {
  lessonId: string;
  onClose: () => void;
  onSave: (lessonId: string, payload: { title: string; url: string; kind: ResourceKind; sortOrder?: number }) => Promise<boolean>;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<ResourceKind>("pdf");
  const [sortOrder, setSortOrder] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim()) return setError("Title is required.");
    if (!/^https?:\/\//i.test(url.trim())) return setError("URL must start with http:// or https://");
    setError(null);
    setBusy(true);
    const okSaved = await onSave(lessonId, { title: title.trim(), url: url.trim(), kind, sortOrder: Number(sortOrder || "0") });
    setBusy(false);
    if (okSaved) onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className={cn(DARK_DIALOG, "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px] font-bold text-foreground">
            <Link2 size={15} className="text-gold" aria-hidden="true" />
            Add resource
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground">
            Downloadable companion for the lesson (PDF, link, slides, exercise).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="res-title">Title</FieldLabel>
            <Input id="res-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="min-h-[44px]" />
          </div>
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="res-url">URL</FieldLabel>
            <Input id="res-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="min-h-[44px] font-mono text-[12px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <FieldLabel>Kind</FieldLabel>
              <Select value={kind} onValueChange={(v) => setKind(v as ResourceKind)}>
                <SelectTrigger className="min-h-[44px] w-full" aria-label="Resource kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn(DARK_DIALOG)}>
                  {RESOURCE_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k === "pdf" ? "PDF" : k === "link" ? "Link" : k === "slide" ? "Slides" : "Exercise"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="res-order">Sort order</FieldLabel>
              <Input id="res-order" inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value.replace(/[^0-9-]/g, ""))} className="min-h-[44px]" />
            </div>
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-[12px] text-rose-300">
              {error}
            </p>
          )}
        </div>
        <DialogFooter className="gap-2.5">
          <Button variant="outline" onClick={onClose} disabled={busy} className="min-h-[44px] border-white/[0.1] bg-white/[0.03]">
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy} className="min-h-[44px] border border-gold/60 bg-gold text-ink hover:bg-gold-light">
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            Add resource
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Quiz editor (create-or-replace, §66 server-graded) ──── */

type DraftOption = { id: string; text: string };
type DraftQuestion = { key: string; prompt: string; options: DraftOption[]; correctOptionId: string; explanation: string };

let quizRowSeq = 0;
const newKey = () => `q${Date.now().toString(36)}-${(quizRowSeq += 1)}`;
const newOptionId = () => `o${Math.random().toString(36).slice(2, 8)}`;

function blankQuestion(): DraftQuestion {
  const opts = [newOptionId(), newOptionId()];
  return { key: newKey(), prompt: "", options: opts.map((id) => ({ id, text: "" })), correctOptionId: opts[0], explanation: "" };
}

export function QuizEditorDialog({
  lessonId,
  lessonTitle,
  quiz,
  notify,
  onClose,
  onSaved,
}: {
  lessonId: string;
  lessonTitle: string;
  quiz: { id: string; title: string; passScore: number; questionCount: number } | null;
  notify: Notify;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(quiz?.title ?? `${lessonTitle} — quiz`);
  const [passScore, setPassScore] = useState(quiz ? String(quiz.passScore) : "70");
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [loading, setLoading] = useState(!!quiz);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Prefill from the admin quiz projection (answers included). */
  useEffect(() => {
    if (!quiz) return;
    let alive = true;
    (async () => {
      const { res, j } = await jsonFetch(`/api/admin/learning/quiz/${quiz.id}`);
      const q = (j as { ok?: boolean; quiz?: AdminQuizDto } | null)?.quiz;
      if (!alive) return;
      if (!res?.ok || !q) {
        setLoading(false);
        return;
      }
      setTitle(q.title);
      setPassScore(String(q.passScore));
      setQuestions(
        q.questions.map((question) => ({
          key: newKey(),
          prompt: question.prompt,
          options: question.options.map((o) => ({ id: o.id, text: o.text })),
          correctOptionId: question.correctOptionId,
          explanation: question.explanation ?? "",
        }))
      );
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [quiz]);

  const updateQuestion = (key: string, patch: Partial<DraftQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q)));

  const addOption = (key: string) =>
    setQuestions((qs) =>
      qs.map((q) => {
        if (q.key !== key || q.options.length >= 6) return q;
        const id = newOptionId();
        return { ...q, options: [...q.options, { id, text: "" }] };
      })
    );

  const removeOption = (key: string, optionId: string) =>
    setQuestions((qs) =>
      qs.map((q) => {
        if (q.key !== key || q.options.length <= 2) return q;
        const options = q.options.filter((o) => o.id !== optionId);
        return { ...q, options, correctOptionId: q.correctOptionId === optionId ? options[0].id : q.correctOptionId };
      })
    );

  const submit = async () => {
    if (!title.trim()) return setError("Quiz title is required.");
    const pass = Number(passScore || "0");
    if (!Number.isFinite(pass) || pass < 1 || pass > 100) return setError("Pass score must be 1–100.");
    if (questions.length < 1) return setError("Add at least one question.");
    if (questions.length > 50) return setError("Maximum 50 questions.");
    for (const [i, q] of questions.entries()) {
      if (!q.prompt.trim()) return setError(`Question ${i + 1}: prompt is empty.`);
      if (q.options.length < 2 || q.options.length > 6) return setError(`Question ${i + 1}: needs 2–6 options.`);
      for (const o of q.options) if (!o.text.trim()) return setError(`Question ${i + 1}: an option is empty.`);
      if (!q.options.some((o) => o.id === q.correctOptionId)) return setError(`Question ${i + 1}: pick the correct option.`);
    }
    setError(null);
    setBusy(true);
    const { res, j } = await jsonFetch(`/api/admin/learning/lessons/${lessonId}/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        passScore: pass,
        questions: questions.map((q, i) => ({
          prompt: q.prompt.trim(),
          options: q.options.map((o) => ({ id: o.id, text: o.text.trim() })),
          correctOptionId: q.correctOptionId,
          explanation: q.explanation.trim() || undefined,
          sortOrder: i + 1,
        })),
      }),
    });
    setBusy(false);
    if (!res?.ok || !j?.ok) {
      setError(j?.error ?? "Quiz save failed");
      return;
    }
    notify(quiz ? "Quiz replaced — attempts reset" : "Quiz created", "ok");
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className={cn(DARK_DIALOG, "max-h-[90vh] overflow-y-auto sm:max-w-2xl")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px] font-bold text-foreground">
            <ClipboardCheck size={15} className="text-gold" aria-hidden="true" />
            {quiz ? "Replace quiz" : "New quiz"}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground">
            Lesson: <span className="text-foreground/80">{lessonTitle}</span> — saving replaces the whole quiz (previous
            attempts are cleared). Grading stays server-side (§66).
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="grid gap-3 py-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div className="grid gap-1.5">
                <FieldLabel htmlFor="quiz-title">Quiz title</FieldLabel>
                <Input id="quiz-title" value={title} onChange={(e) => setTitle(e.target.value)} className="min-h-[44px]" />
              </div>
              <div className="grid gap-1.5">
                <FieldLabel htmlFor="quiz-pass">Pass (%)</FieldLabel>
                <Input id="quiz-pass" inputMode="numeric" value={passScore} onChange={(e) => setPassScore(e.target.value.replace(/[^0-9]/g, ""))} className="min-h-[44px]" />
              </div>
            </div>

            {questions.map((q, qi) => (
              <div key={q.key} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">Question {qi + 1}</p>
                  <button
                    type="button"
                    onClick={() => setQuestions((qs) => qs.filter((x) => x.key !== q.key))}
                    aria-label={`Remove question ${qi + 1}`}
                    className="rounded-lg border border-white/[0.1] p-1.5 text-muted-foreground transition-colors hover:border-rose-400/40 hover:text-rose-300"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
                <Textarea
                  value={q.prompt}
                  onChange={(e) => updateQuestion(q.key, { prompt: e.target.value })}
                  placeholder="Question prompt"
                  rows={2}
                  aria-label={`Question ${qi + 1} prompt`}
                  className="mt-1.5"
                />
                <div className="mt-3 grid gap-2">
                  {q.options.map((o, oi) => (
                    <div key={o.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={q.correctOptionId === o.id}
                        aria-label={`Option ${oi + 1} is the correct answer`}
                        title="Mark as correct answer"
                        onClick={() => updateQuestion(q.key, { correctOptionId: o.id })}
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                          q.correctOptionId === o.id
                            ? "border-teal/60 bg-teal-dim text-teal"
                            : "border-white/20 text-transparent hover:border-teal/40"
                        )}
                      >
                        <Check size={12} aria-hidden="true" />
                      </button>
                      <Input
                        value={o.text}
                        onChange={(e) =>
                          updateQuestion(q.key, {
                            options: q.options.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)),
                          })
                        }
                        placeholder={`Option ${oi + 1}`}
                        aria-label={`Question ${qi + 1} option ${oi + 1} text`}
                        className="min-h-[40px]"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(q.key, o.id)}
                        disabled={q.options.length <= 2}
                        aria-label={`Remove option ${oi + 1}`}
                        className="rounded-lg border border-white/[0.1] p-1.5 text-muted-foreground transition-colors hover:border-rose-400/40 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(q.key)}
                    disabled={q.options.length >= 6}
                    className="h-8 border-white/[0.1] bg-white/[0.03] text-[11px]"
                  >
                    <Plus size={12} aria-hidden="true" /> Option
                  </Button>
                  <span className="text-[10.5px] text-muted-foreground/70">{q.options.length}/6 · radio = correct answer</span>
                </div>
                <Input
                  value={q.explanation}
                  onChange={(e) => updateQuestion(q.key, { explanation: e.target.value })}
                  placeholder="Explanation shown after grading (optional)"
                  aria-label={`Question ${qi + 1} explanation`}
                  className="mt-3 min-h-[40px]"
                />
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}
              disabled={questions.length >= 50}
              className="min-h-[44px] border-teal/40 bg-teal-dim text-teal hover:bg-teal/20"
            >
              <Plus size={14} aria-hidden="true" /> Add question ({questions.length})
            </Button>

            {error && (
              <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-[12px] text-rose-300">
                {error}
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2.5">
          <Button variant="outline" onClick={onClose} disabled={busy || loading} className="min-h-[44px] border-white/[0.1] bg-white/[0.03]">
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy || loading} className="min-h-[44px] border border-gold/60 bg-gold text-ink hover:bg-gold-light">
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {quiz ? "Replace quiz" : "Create quiz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Course detail — full authoring view ─────────────────── */

export function CourseDetailDialog({
  courseId,
  notify,
  onClose,
  onChanged,
}: {
  courseId: string;
  notify: Notify;
  onClose: () => void;
  /** parent list/overview refresher (covers publish/publish-adjacent edits) */
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<AdminCourseDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingModule, setSavingModule] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleSummary, setModuleSummary] = useState("");

  /* nested dialogs (conditional mount) */
  const [editCourseOpen, setEditCourseOpen] = useState(false);
  const [lessonTarget, setLessonTarget] = useState<{ moduleId: string; lesson: AdminLessonDto | null } | null>(null);
  const [resourceTarget, setResourceTarget] = useState<string | null>(null);
  const [quizTarget, setQuizTarget] = useState<{ lessonId: string; lessonTitle: string; quiz: AdminLessonDto["quiz"] } | null>(null);
  const [editModule, setEditModule] = useState<{ id: string; title: string; summary: string } | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "module" | "lesson" | "resource"; id: string; label: string; cascade: string } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { res, j } = await jsonFetch(`/api/admin/learning/courses/${courseId}`);
      if (res?.ok && j?.ok) setDetail((j as { course: AdminCourseDetailDto }).course);
    } catch {
      /* transient */
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ── mutations ── */
  const saveModule = async () => {
    if (!moduleTitle.trim()) return;
    setSavingModule(true);
    const { res, j } = await jsonFetch(`/api/admin/learning/courses/${courseId}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: moduleTitle.trim(), summary: moduleSummary.trim() || undefined }),
    });
    setSavingModule(false);
    if (!res?.ok || !j?.ok) return notify(j?.error ?? "Module add failed", "err");
    setModuleTitle("");
    setModuleSummary("");
    notify("Module added", "ok");
    void load();
    onChanged();
  };

  const saveLesson = async (moduleId: string, payload: LessonSavePayload, lessonId?: string) => {
    const { res, j } = await jsonFetch(
      lessonId ? `/api/admin/learning/lessons/${lessonId}` : `/api/admin/learning/modules/${moduleId}/lessons`,
      {
        method: lessonId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res?.ok || !j?.ok) {
      notify(j?.error ?? "Lesson save failed", "err");
      return false;
    }
    notify(lessonId ? "Lesson updated" : "Lesson added", "ok");
    void load();
    onChanged();
    return true;
  };

  const saveResource = async (lessonId: string, payload: { title: string; url: string; kind: ResourceKind; sortOrder?: number }) => {
    const { res, j } = await jsonFetch(`/api/admin/learning/lessons/${lessonId}/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res?.ok || !j?.ok) {
      notify(j?.error ?? "Resource add failed", "err");
      return false;
    }
    notify("Resource added", "ok");
    void load();
    return true;
  };

  const saveCourse = async (payload: CourseSavePayload, id?: string) => {
    const { res, j } = await jsonFetch(`/api/admin/learning/courses/${id ?? courseId}`, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res?.ok || !j?.ok) {
      notify(j?.error ?? "Course save failed", "err");
      return false;
    }
    notify("Course updated", "ok");
    void load();
    onChanged();
    return true;
  };

  const saveModuleEdit = async () => {
    if (!editModule || !editModule.title.trim()) return;
    const { res, j } = await jsonFetch(`/api/admin/learning/modules/${editModule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editModule.title.trim(), summary: editModule.summary.trim() || undefined }),
    });
    if (!res?.ok || !j?.ok) return notify(j?.error ?? "Module update failed", "err");
    notify("Module updated", "ok");
    setEditModule(null);
    void load();
  };

  const runDelete = async () => {
    if (!confirm) return;
    setConfirmBusy(true);
    const { res, j } = await jsonFetch(
      confirm.kind === "module"
        ? `/api/admin/learning/modules/${confirm.id}`
        : confirm.kind === "lesson"
          ? `/api/admin/learning/lessons/${confirm.id}`
          : `/api/admin/learning/resources/${confirm.id}`,
      { method: "DELETE" }
    );
    setConfirmBusy(false);
    if (!res?.ok || !j?.ok) return notify(j?.error ?? "Delete failed", "err");
    notify(`${confirm.kind === "module" ? "Module" : confirm.kind === "lesson" ? "Lesson" : "Resource"} deleted`, "ok");
    setConfirm(null);
    void load();
    onChanged();
  };

  const lessonCount = useMemo(() => detail?.modules.reduce((n, m) => n + m.lessons.length, 0) ?? 0, [detail]);

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className={cn(DARK_DIALOG, "max-h-[90vh] overflow-y-auto sm:max-w-3xl")}>
          {loading || !detail ? (
            <div className="grid gap-3 py-8">
              <DialogTitle className="sr-only">Loading course</DialogTitle>
              <DialogDescription className="sr-only">Fetching course structure…</DialogDescription>
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-start gap-3 text-[15px] font-bold text-foreground">
                  <span className="text-2xl leading-none" aria-hidden="true">
                    {detail.coverEmoji}
                  </span>
                  <span className="flex-1">
                    {detail.title}
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <Chip className={LEVEL_CHIP[detail.level]}>{COURSE_LEVEL_LABELS[detail.level]}</Chip>
                      <Chip className={detail.published ? "border-teal/35 bg-teal-dim text-teal" : "border-amber-400/35 bg-amber-400/10 text-amber-300"}>
                        {detail.published ? "Published" : "Draft"}
                      </Chip>
                      <Chip>{detail.moduleCount} modules · {lessonCount} lessons</Chip>
                      <Chip>{detail.enrollmentCount} enrolled</Chip>
                    </span>
                  </span>
                </DialogTitle>
                <DialogDescription className="text-[12px] leading-relaxed text-muted-foreground">
                  <span className="font-mono text-[11px] text-foreground/60">/{detail.slug}</span>
                  {detail.summary ? ` — ${detail.summary}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button onClick={() => setEditCourseOpen(true)} variant="outline" className="min-h-[44px] border-gold/40 bg-gold-dim text-gold hover:bg-gold/20">
                  <Pencil size={13} aria-hidden="true" /> Edit course
                </Button>
                {detail.description && (
                  <p className="w-full whitespace-pre-wrap rounded-xl border border-white/[0.07] bg-[#07090f]/60 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
                    {detail.description}
                  </p>
                )}
              </div>

              {/* Module accordion (authoring view) */}
              <div className="grid gap-3">
                {detail.modules.map((m, mi) => (
                  <div key={m.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02]">
                    <div className="flex items-start justify-between gap-2 px-4 pt-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-semibold text-foreground">
                          <span className="font-mono text-[10px] text-muted-foreground/70">M{mi + 1} · #{m.sortOrder}</span> {m.title}
                        </p>
                        {m.summary && <p className="mt-0.5 text-[11.5px] text-muted-foreground">{m.summary}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditModule({ id: m.id, title: m.title, summary: m.summary ?? "" })}
                          aria-label={`Edit module ${m.title}`}
                          className="rounded-lg border border-white/[0.1] p-2 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                        >
                          <Pencil size={13} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirm({ kind: "module", id: m.id, label: m.title, cascade: "its lessons, quizzes, attempts and resources" })}
                          aria-label={`Delete module ${m.title}`}
                          className="rounded-lg border border-white/[0.1] p-2 text-muted-foreground transition-colors hover:border-rose-400/40 hover:text-rose-300"
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-2 px-4 pb-3 pt-2">
                      {m.lessons.length === 0 && (
                        <p className="text-[11.5px] text-muted-foreground/70">No lessons yet.</p>
                      )}
                      {m.lessons.map((l, li) => (
                        <div key={l.id} className="rounded-lg border border-white/[0.06] bg-[#07090f]/60 p-3">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="flex min-w-0 flex-1 items-center gap-2 text-[12.5px] font-medium text-foreground">
                              {l.kind === "video" ? <Radio size={12} className="shrink-0 text-gold" aria-hidden="true" /> : <FileText size={12} className="shrink-0 text-muted-foreground" aria-hidden="true" />}
                              <span className="truncate">
                                <span className="font-mono text-[10px] text-muted-foreground/70">L{li + 1}</span> {l.title}
                              </span>
                            </p>
                            <span className="flex items-center gap-1.5">
                              {l.isPreview && (
                                <Chip className="border-teal/35 bg-teal-dim text-teal">
                                  <Unlock size={9} aria-hidden="true" /> Preview
                                </Chip>
                              )}
                              <Chip>{l.durationMinutes} min</Chip>
                              {l.quiz && (
                                <Chip className="border-gold/35 bg-gold-dim text-gold">
                                  <ClipboardCheck size={9} aria-hidden="true" /> {l.quiz.questionCount}q · pass {l.quiz.passScore}%
                                </Chip>
                              )}
                            </span>
                          </div>
                          {l.content && (
                            <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap text-[11.5px] leading-relaxed text-muted-foreground/80">{l.content}</p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {l.resources.map((r) => (
                              <span key={r.id} className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] bg-white/[0.03] px-2 py-0.5 text-[9.5px] text-muted-foreground">
                                <Link2 size={9} aria-hidden="true" /> {r.title}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => setLessonTarget({ moduleId: m.id, lesson: l })}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.03] px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                            >
                              <Pencil size={11} aria-hidden="true" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuizTarget({ lessonId: l.id, lessonTitle: l.title, quiz: l.quiz })}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.03] px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                            >
                              <ClipboardCheck size={11} aria-hidden="true" /> {l.quiz ? "Replace quiz" : "Add quiz"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setResourceTarget(l.id)}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.03] px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-teal/40 hover:text-teal"
                            >
                              <Link2 size={11} aria-hidden="true" /> Resource
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirm({ kind: "lesson", id: l.id, label: l.title, cascade: "its quiz, attempts, resources and progress rows" })}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.03] px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-rose-400/40 hover:text-rose-300"
                            >
                              <Trash2 size={11} aria-hidden="true" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setLessonTarget({ moduleId: m.id, lesson: null })}
                        className="inline-flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/[0.14] text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-teal/40 hover:text-teal"
                      >
                        <Plus size={12} aria-hidden="true" /> Add lesson
                      </button>
                    </div>
                  </div>
                ))}

                {/* add-module inline form */}
                <div className="rounded-xl border border-dashed border-white/[0.14] p-3.5">
                  <p className="mb-2 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">Add module</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={moduleTitle}
                      onChange={(e) => setModuleTitle(e.target.value)}
                      placeholder="Module title"
                      aria-label="New module title"
                      className="min-h-[44px] flex-1"
                    />
                    <Input
                      value={moduleSummary}
                      onChange={(e) => setModuleSummary(e.target.value)}
                      placeholder="Summary (optional)"
                      aria-label="New module summary"
                      className="min-h-[44px] flex-1"
                    />
                    <Button
                      onClick={() => void saveModule()}
                      disabled={savingModule || !moduleTitle.trim()}
                      className="min-h-[44px] border border-teal/50 bg-teal-dim text-teal hover:bg-teal/20 sm:px-5"
                    >
                      {savingModule ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
                      Module
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* nested authoring dialogs (stacked) */}
      {editCourseOpen && detail && (
        <CourseSaveDialog course={detail} onClose={() => setEditCourseOpen(false)} onSave={saveCourse} />
      )}
      {lessonTarget && (
        <LessonDialog
          moduleId={lessonTarget.moduleId}
          lesson={lessonTarget.lesson}
          onClose={() => setLessonTarget(null)}
          onSave={saveLesson}
        />
      )}
      {resourceTarget && (
        <ResourceDialog lessonId={resourceTarget} onClose={() => setResourceTarget(null)} onSave={saveResource} />
      )}
      {quizTarget && (
        <QuizEditorDialog
          lessonId={quizTarget.lessonId}
          lessonTitle={quizTarget.lessonTitle}
          quiz={quizTarget.quiz}
          notify={notify}
          onClose={() => setQuizTarget(null)}
          onSaved={() => void load()}
        />
      )}
      {editModule && (
        <Dialog open onOpenChange={(o) => !o && setEditModule(null)}>
          <DialogContent aria-describedby={undefined} className={cn(DARK_DIALOG, "sm:max-w-md")}>
            <DialogHeader>
              <DialogTitle className="text-[15px] font-bold text-foreground">Edit module</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <FieldLabel htmlFor="mod-title">Title</FieldLabel>
                <Input id="mod-title" value={editModule.title} onChange={(e) => setEditModule({ ...editModule, title: e.target.value })} className="min-h-[44px]" />
              </div>
              <div className="grid gap-1.5">
                <FieldLabel htmlFor="mod-summary">Summary</FieldLabel>
                <Input id="mod-summary" value={editModule.summary} onChange={(e) => setEditModule({ ...editModule, summary: e.target.value })} className="min-h-[44px]" />
              </div>
            </div>
            <DialogFooter className="gap-2.5">
              <Button variant="outline" onClick={() => setEditModule(null)} className="min-h-[44px] border-white/[0.1] bg-white/[0.03]">
                Cancel
              </Button>
              <Button onClick={() => void saveModuleEdit()} className="min-h-[44px] border border-gold/60 bg-gold text-ink hover:bg-gold-light">
                Save module
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {confirm && (
        <ConfirmDialog
          title={`Delete ${confirm.kind}?`}
          message={
            <>
              <span className="font-semibold text-foreground">{confirm.label}</span> will be removed along with{" "}
              {confirm.cascade}. This cannot be undone.
            </>
          }
          confirmLabel="Delete"
          busy={confirmBusy}
          onConfirm={() => void runDelete()}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  );
}

/* ── Student detail ──────────────────────────────────────── */

export function StudentDetailDialog({
  studentId,
  notify,
  onClose,
  onChanged,
}: {
  studentId: string;
  notify: Notify;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [student, setStudent] = useState<AdminStudentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusBusy, setStatusBusy] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(false);

  const load = useCallback(async () => {
    try {
      const { res, j } = await jsonFetch(`/api/admin/learning/students/${studentId}`);
      if (res?.ok && j?.ok) setStudent((j as { student: AdminStudentDetailDto }).student);
    } catch {
      /* transient */
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (status: StudentStatus) => {
    setStatusBusy(true);
    const { res, j } = await jsonFetch(`/api/admin/learning/students/${studentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setStatusBusy(false);
    setConfirmStatus(false);
    if (!res?.ok || !j?.ok) return notify(j?.error ?? "Status change failed", "err");
    notify(status === "suspended" ? "Student suspended — sessions revoked" : "Student reactivated", "ok");
    void load();
    onChanged();
  };

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className={cn(DARK_DIALOG, "max-h-[90vh] overflow-y-auto sm:max-w-2xl")}>
          {loading || !student ? (
            <div className="grid gap-3 py-8">
              <DialogTitle className="sr-only">Loading student</DialogTitle>
              <DialogDescription className="sr-only">Fetching student record…</DialogDescription>
              <Skeleton className="h-12 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-foreground">
                  <GraduationCap size={16} className="text-gold" aria-hidden="true" />
                  {student.name}
                  <Chip
                    className={
                      student.status === "active"
                        ? "border-teal/35 bg-teal-dim text-teal"
                        : "border-rose-400/35 bg-rose-400/10 text-rose-300"
                    }
                  >
                    {STUDENT_STATUS_LABELS[student.status]}
                  </Chip>
                </DialogTitle>
                <DialogDescription className="font-mono text-[11.5px] text-muted-foreground">{student.email}</DialogDescription>
              </DialogHeader>

              {/* profile */}
              <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-[12px] sm:grid-cols-4">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">Country</p>
                  <p className="mt-0.5 text-foreground">{student.country || "—"}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">Phone</p>
                  <p className="mt-0.5 text-foreground">{student.phone ?? "—"}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">Linked CRM</p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-foreground">{student.linkedCustomerEmail ?? "—"}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">Joined</p>
                  <p className="mt-0.5 text-foreground">{formatTimestamp(student.createdAt)}</p>
                </div>
              </div>

              {/* enrollments */}
              <div>
                <p className="mb-2 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">
                  Enrollments ({student.enrollments.length})
                </p>
                {student.enrollments.length === 0 ? (
                  <p className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[12px] text-muted-foreground">
                    Not enrolled in any course yet.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {student.enrollments.map((en) => (
                      <div key={en.courseId} className="rounded-xl border border-white/[0.06] bg-[#07090f]/60 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[12.5px] font-medium text-foreground">{en.courseTitle}</p>
                          <span className="flex items-center gap-2">
                            <Chip className={en.status === "completed" ? "border-teal/35 bg-teal-dim text-teal" : "border-amber-400/35 bg-amber-400/10 text-amber-300"}>
                              {ENROLLMENT_STATUS_LABELS[en.status]}
                            </Chip>
                            <span className="font-mono text-[10.5px] text-muted-foreground">{en.progressPercent}%</span>
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <MiniBar percent={en.progressPercent} className="flex-1" />
                          <span className="font-mono text-[10px] text-muted-foreground/70">
                            {en.completedAt ? `completed ${timeAgo(en.completedAt)}` : `since ${timeAgo(en.enrolledAt)}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* quiz attempts */}
              <div>
                <p className="mb-2 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">
                  Quiz attempts ({student.attempts.length})
                </p>
                {student.attempts.length === 0 ? (
                  <p className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[12px] text-muted-foreground">
                    No quiz attempts yet.
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto overflow-x-auto rounded-xl border border-white/[0.07] [scrollbar-width:thin]">
                    <table className="w-full min-w-[380px] text-left">
                      <thead className="sticky top-0 bg-[#0b101c]">
                        <tr className="border-b border-white/[0.06]">
                          <th className="px-3 py-2 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">Quiz</th>
                          <th className="px-3 py-2 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">Score</th>
                          <th className="px-3 py-2 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.attempts.map((a) => (
                          <tr key={a.id} className="border-b border-white/[0.04]">
                            <td className="px-3 py-2 text-[11.5px] text-foreground">
                              {a.quizTitle}
                              <span className="block text-[10px] text-muted-foreground/70">{a.lessonTitle}</span>
                            </td>
                            <td className="px-3 py-2">
                              <Chip className={a.passed ? "border-teal/35 bg-teal-dim text-teal" : "border-rose-400/35 bg-rose-400/10 text-rose-300"}>
                                {a.scorePercent}% {a.passed ? "pass" : "fail"}
                              </Chip>
                            </td>
                            <td className="px-3 py-2 text-[10.5px] text-muted-foreground">{timeAgo(a.submittedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* suspend / reactivate */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="text-[12.5px] font-semibold text-foreground">
                    {student.status === "active" ? "Suspend access" : "Reactivate access"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {student.status === "active"
                      ? "Blocks login + revokes active sessions (§65)."
                      : "Student can log in and continue learning again."}
                  </p>
                </div>
                <Button
                  onClick={() => setConfirmStatus(true)}
                  disabled={statusBusy}
                  variant="outline"
                  className={cn(
                    "min-h-[44px]",
                    student.status === "active"
                      ? "border-rose-400/40 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20"
                      : "border-teal/40 bg-teal-dim text-teal hover:bg-teal/20"
                  )}
                >
                  {statusBusy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                  {student.status === "active" ? <Lock size={13} aria-hidden="true" /> : <Unlock size={13} aria-hidden="true" />}
                  {student.status === "active" ? "Suspend" : "Reactivate"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {confirmStatus && student && (
        <ConfirmDialog
          title={student.status === "active" ? "Suspend student?" : "Reactivate student?"}
          message={
            student.status === "active" ? (
              <>
                <span className="font-semibold text-foreground">{student.name}</span> will be locked out immediately —
                login blocked and active sessions revoked.
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">{student.name}</span> will be able to log in and resume
                their courses.
              </>
            )
          }
          confirmLabel={student.status === "active" ? "Suspend" : "Reactivate"}
          destructive={student.status === "active"}
          busy={statusBusy}
          onConfirm={() => void setStatus(student.status === "active" ? "suspended" : "active")}
          onClose={() => setConfirmStatus(false)}
        />
      )}
    </>
  );
}

/* ── Announcement composer ───────────────────────────────── */

export type AdminAnnouncementRow = {
  id: string;
  title: string;
  body: string;
  audience: "all" | "course";
  courseId?: string | null;
  courseTitle?: string | null;
  createdAt: string;
};

export function AnnouncementDialog({
  courses,
  onClose,
  onSaved,
}: {
  courses: AdminCourseDto[];
  onClose: () => void;
  onSaved: (payload: { title: string; body: string; audience: "all" | "course"; courseId?: string }) => Promise<boolean>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "course">("all");
  const [courseId, setCourseId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim()) return setError("Title is required.");
    if (!body.trim()) return setError("Body is required.");
    if (audience === "course" && !courseId) return setError("Pick a course for a course-scoped announcement.");
    setError(null);
    setBusy(true);
    const okSaved = await onSaved({ title: title.trim(), body: body.trim(), audience, courseId: audience === "course" ? courseId : undefined });
    setBusy(false);
    if (okSaved) onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className={cn(DARK_DIALOG, "max-h-[88vh] overflow-y-auto sm:max-w-lg")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px] font-bold text-foreground">
            <BookOpen size={15} className="text-gold" aria-hidden="true" />
            New announcement
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground">
            Shows on enrolled students&apos; Learning dashboards (§67).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="ann-title">Title</FieldLabel>
            <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="min-h-[44px]" />
          </div>
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="ann-body">Body</FieldLabel>
            <Textarea id="ann-body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="What should students know?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <FieldLabel>Audience</FieldLabel>
              <Select value={audience} onValueChange={(v) => setAudience(v as "all" | "course")}>
                <SelectTrigger className="min-h-[44px] w-full" aria-label="Announcement audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn(DARK_DIALOG)}>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="course">One course</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {audience === "course" && (
              <div className="grid gap-1.5">
                <FieldLabel>Course</FieldLabel>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger className="min-h-[44px] w-full" aria-label="Course audience">
                    <SelectValue placeholder="Pick a course" />
                  </SelectTrigger>
                  <SelectContent className={cn(DARK_DIALOG)}>
                    {courses.length === 0 && <p className="px-3 py-2 text-[11px] text-muted-foreground">No courses yet.</p>}
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.coverEmoji} {c.title}
                        {!c.published && " (draft)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-[12px] text-rose-300">
              {error}
            </p>
          )}
        </div>
        <DialogFooter className="gap-2.5">
          <Button variant="outline" onClick={onClose} disabled={busy} className="min-h-[44px] border-white/[0.1] bg-white/[0.03]">
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy} className="min-h-[44px] border border-gold/60 bg-gold text-ink hover:bg-gold-light">
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            Publish announcement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
