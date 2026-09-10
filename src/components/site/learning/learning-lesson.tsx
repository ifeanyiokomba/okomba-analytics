"use client";

/* ─────────────────────────────────────────────────────────────
   BATCH 13 (§66) — Lesson viewer.
   Desktop: two panes (content + course outline). Mobile: single
   column with collapsible outline. Renders \n\n paragraphs with
   `backtick` inline-code chips, 16:9 video embed, resources,
   mark-complete + auto-advance, quiz section.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileText,
  ListTree,
  Loader2,
  Lock,
  LockKeyhole,
  PartyPopper,
  Play,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CourseDetailDto, LessonDetailDto, LessonProgressStatus, StudentQuizDto } from "@/lib/learning-shared";
import { ApiError, ErrorState, apiFetch, formatMinutes } from "./learning-shared-ui";

export type OpenQuizPayload = {
  quiz: StudentQuizDto;
  lessonId: string;
  lessonTitle: string;
  courseSlug: string;
  courseTitle: string;
};

type LessonProps = {
  lessonId: string;
  isAuthed: boolean;
  onOpenLesson: (lessonId: string) => void;
  onOpenQuiz: (payload: OpenQuizPayload) => void;
  onBackToCourse: (slug: string) => void;
  onRequireAuth: (enrollSlug: string) => void;
  onProgressChanged: () => void; // refresh auth + parent views (progress %)
  showToast: (message: string, tone?: "success" | "error" | "info") => void;
};

type LessonState = { lesson: LessonDetailDto; enrolled: boolean };

export function LearningLesson({
  lessonId,
  isAuthed,
  onOpenLesson,
  onOpenQuiz,
  onBackToCourse,
  onRequireAuth,
  onProgressChanged,
  showToast,
}: LessonProps) {
  const [data, setData] = useState<LessonState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState<string | null>(null); // 403 enroll prompt
  const [reloadKey, setReloadKey] = useState(0);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const openedAt = useRef<number>(Date.now());

  /* ── load lesson (remounted per lessonId via key; reloadKey re-fetches
     after in-page enrollment). Resets happen in event handlers only. ── */
  const reload = useCallback(() => {
    setData(null);
    setError(null);
    setLocked(null);
    setJustCompleted(false);
    openedAt.current = Date.now();
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    openedAt.current = Date.now();
    apiFetch<{ ok: true; lesson: LessonDetailDto; enrolled: boolean }>(`/api/learning/lessons/${lessonId}`)
      .then((res) => {
        if (!alive) return;
        setData({ lesson: res.lesson, enrolled: res.enrolled });
        // fire-and-forget: mark started so dashboards reflect in_progress
        if (res.enrolled && res.lesson.progress?.status !== "completed") {
          apiFetch(`/api/learning/lessons/${lessonId}/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "in_progress" }),
          }).catch(() => undefined);
        }
      })
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 403) {
          setLocked(err.message);
        } else {
          setError(err instanceof Error ? err.message : "Could not load this lesson.");
        }
      });
    return () => {
      alive = false;
    };
  }, [lessonId, reloadKey]);

  // outline follows the loaded lesson's course — keyed by courseSlug so a
  // new course is detected via derived state (no reset-on-effect needed).
  const [outlineRaw, setOutlineRaw] = useState<
    { courseSlug: string; course: CourseDetailDto | null; error: string } | null
  >(null);
  const activeSlug = data?.lesson.courseSlug ?? null;
  useEffect(() => {
    if (!activeSlug) return;
    let alive = true;
    apiFetch<{ ok: true; course: CourseDetailDto }>(`/api/learning/courses/${activeSlug}`)
      .then((res) => {
        if (alive) setOutlineRaw({ courseSlug: activeSlug, course: res.course, error: "" });
      })
      .catch((err) => {
        if (alive)
          setOutlineRaw({
            courseSlug: activeSlug,
            course: null,
            error: err instanceof Error ? err.message : "Outline unavailable.",
          });
      });
    return () => {
      alive = false;
    };
  }, [activeSlug]);
  const outline =
    outlineRaw && outlineRaw.courseSlug === activeSlug ? { course: outlineRaw.course, error: outlineRaw.error } : null;

  /* ── flat lesson order for next/prev + outline ── */
  const flat = useMemo(() => {
    type Row = { lessonId: string; title: string; done: boolean; current: boolean; moduleTitle: string };
    const rows: Row[] = [];
    if (outline?.course) {
      for (const mod of outline.course.modules) {
        for (const l of mod.lessons) {
          rows.push({
            lessonId: l.id,
            title: l.title,
            done: l.progress?.status === "completed",
            current: l.id === lessonId,
            moduleTitle: mod.title,
          });
        }
      }
    }
    return rows;
  }, [outline, lessonId]);

  const currentIdx = flat.findIndex((r) => r.current);
  const nextLesson = currentIdx >= 0 ? flat[currentIdx + 1] : undefined;

  /* ── mark complete ── */
  const markComplete = useCallback(async () => {
    if (!data || completing) return;
    setCompleting(true);
    const secondsSpent = Math.max(5, Math.round((Date.now() - openedAt.current) / 1000));
    try {
      const res = await apiFetch<{
        ok: true;
        progress: { status: LessonProgressStatus; secondsSpent: number; completedAt: string | null };
        courseCompleted: boolean;
      }>(`/api/learning/lessons/${lessonId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", secondsSpent }),
      });
      setJustCompleted(true);
      setData((prev) =>
        prev ? { ...prev, lesson: { ...prev.lesson, progress: { ...res.progress } } } : prev
      );
      if (res.courseCompleted) {
        showToast("Course complete — every lesson done. Congratulations! 🎉", "success");
      } else {
        showToast("Lesson complete — nicely done!", "success");
      }
      onProgressChanged();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save your progress.", "error");
    } finally {
      setCompleting(false);
    }
  }, [data, completing, lessonId, onProgressChanged, showToast]);

  /* ── states ── */
  if (locked) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 sm:px-6">
        <BackToCourse slug={data?.lesson.courseSlug ?? ""} label="Back to course" onBackToCourse={onBackToCourse} />
        <div className="lp-anim-fade-up mt-6 flex flex-col items-center rounded-2xl border border-gold/25 bg-gold-dim/40 px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-dim text-gold">
            <LockKeyhole size={24} aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-display text-[20px] font-bold text-foreground">This lesson is locked</h1>
          <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
            {locked}. Lessons marked <span className="font-semibold text-gold">Preview</span> are free to explore
            without an account.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {isAuthed ? (
              <EnrollInline
                slug={data?.lesson.courseSlug}
                onDone={reload}
                showToast={showToast}
                onEnrolled={onProgressChanged}
              />
            ) : (
              <Button
                onClick={() => onRequireAuth(data?.lesson.courseSlug ?? "")}
                className="h-11 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 text-[14px] font-semibold text-ink shadow-gold"
              >
                <Sparkles size={15} aria-hidden="true" /> Sign in to enroll — free
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 sm:px-6">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:px-6" aria-label="Loading lesson">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
          <div>
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="mt-4 h-8 w-3/4 rounded-lg" />
            <Skeleton className="mt-6 h-4 w-full rounded-md" />
            <Skeleton className="mt-3 h-4 w-full rounded-md" />
            <Skeleton className="mt-3 h-4 w-5/6 rounded-md" />
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const { lesson, enrolled } = data;
  const isDone = lesson.progress?.status === "completed" || justCompleted;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackToCourse slug={lesson.courseSlug} label={`Course: ${lesson.courseTitle}`} onBackToCourse={onBackToCourse} />
        <button
          onClick={() => setOutlineOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-black/[0.1] bg-white px-3.5 py-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground lg:hidden"
          aria-expanded={outlineOpen}
          aria-controls="lesson-outline"
        >
          <ListTree size={14} aria-hidden="true" /> Course outline
          <ChevronDown size={13} className={cn("transition-transform", outlineOpen && "rotate-180")} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* ── Content pane ── */}
        <article className="lp-anim-fade-up min-w-0">
          {/* breadcrumb / meta */}
          <p className="text-[12px] font-medium text-muted-foreground">
            {lesson.moduleTitle} <span className="mx-1.5 text-muted-foreground/50">·</span>
            <span className="capitalize">{lesson.kind === "video" ? "Video lesson" : "Reading lesson"}</span>
            <span className="mx-1.5 text-muted-foreground/50">·</span> {lesson.durationMinutes} min
          </p>

          <h1 className="mt-2 font-display text-[26px] font-bold leading-tight text-foreground sm:text-[30px]">
            {lesson.title}
          </h1>

          {lesson.isPreview && !enrolled && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-gold-dim px-3 py-1 text-[11.5px] font-bold text-gold">
              <Sparkles size={11} aria-hidden="true" /> Free preview — no account needed
            </span>
          )}

          {/* video */}
          {lesson.kind === "video" && lesson.videoUrl ? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.08] bg-black shadow-[0_20px_48px_-24px_rgba(20,25,38,0.35)]">
              <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                <iframe
                  src={toEmbedUrl(lesson.videoUrl)}
                  title={`Video: ${lesson.title}`}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : null}

          {/* body */}
          {lesson.content ? (
            <div className="mt-6 space-y-5">
              {lesson.content
                .split(/\n{2,}/)
                .filter((p) => p.trim().length > 0)
                .map((para, i) => (
                  <p key={i} className="text-[15px] leading-[1.85] text-foreground/90">
                    {renderInlineCode(para)}
                  </p>
                ))}
            </div>
          ) : (
            <p className="mt-6 text-[14px] italic text-muted-foreground">
              This lesson has no written content yet.
            </p>
          )}

          {/* resources */}
          {lesson.resources.length > 0 && (
            <section aria-label="Lesson resources" className="mt-8 rounded-2xl border border-black/[0.07] bg-white p-5">
              <h2 className="font-display text-[15px] font-bold text-foreground">Resources &amp; downloads</h2>
              <ul className="mt-3 space-y-2">
                {lesson.resources.map((r) => (
                  <li key={r.id}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-xl border border-black/[0.06] bg-black/[0.02] px-4 py-3 transition-colors hover:border-gold/40 hover:bg-gold-dim/40 focus-visible:outline-2 focus-visible:outline-gold"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-dim text-gold">
                        {r.kind === "pdf" ? <FileText size={14} aria-hidden="true" /> : <ExternalLink size={14} aria-hidden="true" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold text-foreground">{r.title}</span>
                        <span className="text-[11.5px] uppercase tracking-wide text-muted-foreground">{r.kind}</span>
                      </span>
                      <ExternalLink
                        size={13}
                        className="shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-gold"
                        aria-hidden="true"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* quiz teaser */}
          {lesson.quiz ? <QuizTeaser lesson={lesson} enrolled={enrolled} onOpenQuiz={onOpenQuiz} /> : null}

          {/* mark complete / next lesson */}
          <div className="mt-8 border-t border-black/[0.07] pt-6">
            {isDone ? (
              <div className="lp-anim-pop flex flex-col items-center gap-4 rounded-2xl border border-teal/25 bg-teal-dim/40 px-6 py-7 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-dim text-teal">
                  <PartyPopper size={22} aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-[16px] font-bold text-foreground">Lesson complete</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Your progress is saved. {nextLesson ? "Ready for the next one?" : "That was the last lesson!"}
                  </p>
                </div>
                {nextLesson ? (
                  <Button
                    onClick={() => onOpenLesson(nextLesson.lessonId)}
                    className="h-11 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 text-[14px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    Next: {nextLesson.title} <ArrowRight size={15} aria-hidden="true" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => onBackToCourse(lesson.courseSlug)}
                    className="h-11 rounded-xl border-black/[0.12] px-6 text-[14px] font-medium"
                  >
                    Back to course
                  </Button>
                )}
              </div>
            ) : enrolled ? (
              <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-black/[0.07] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <CheckCircle2 size={15} className="text-teal/70" aria-hidden="true" />
                  Finished reading? Mark this lesson complete to track your progress.
                </p>
                <Button
                  onClick={() => void markComplete()}
                  disabled={completing}
                  className="h-11 shrink-0 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 text-[14px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 active:scale-[0.98] sm:min-w-[200px]"
                >
                  {completing ? (
                    <>
                      <Loader2 size={15} className="animate-spin" aria-hidden="true" /> Saving…
                    </>
                  ) : (
                    <>
                      <Check size={15} strokeWidth={2.5} aria-hidden="true" /> Mark as complete
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-gold/25 bg-gold-dim/40 p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] text-muted-foreground">
                  Enjoying the preview? Enroll to unlock every lesson, quizzes and progress tracking.
                </p>
                {isAuthed ? (
                  <EnrollInline
                    slug={lesson.courseSlug}
                    onDone={reload}
                    showToast={showToast}
                    onEnrolled={onProgressChanged}
                  />
                ) : (
                  <Button
                    onClick={() => onRequireAuth(lesson.courseSlug)}
                    className="h-11 shrink-0 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 text-[14px] font-semibold text-ink shadow-gold"
                  >
                    <Lock size={14} aria-hidden="true" /> Sign in to enroll
                  </Button>
                )}
              </div>
            )}
          </div>
        </article>

        {/* ── Outline pane ── */}
        <aside
          id="lesson-outline"
          aria-label="Course outline"
          className={cn(
            "lg:sticky lg:top-20 lg:block lg:self-start lg:rounded-2xl lg:border lg:border-black/[0.07] lg:bg-white lg:p-4",
            outlineOpen ? "block" : "hidden"
          )}
        >
          <p className="mb-3 hidden px-1 font-display text-[13.5px] font-bold text-foreground lg:block">
            Course outline
          </p>
          {outline ? (
            outline.course ? (
              <nav aria-label="Lessons">
                <ol className="max-h-[70vh] space-y-1 overflow-y-auto pr-1">
                  {outline.course.modules.map((mod) => (
                    <li key={mod.id}>
                      <p className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/70">
                        {mod.title}
                      </p>
                      <ul>
                        {mod.lessons.map((l) => (
                          <li key={l.id}>
                            <button
                              onClick={() => onOpenLesson(l.id)}
                              aria-current={l.id === lessonId ? "true" : undefined}
                              className={cn(
                                "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[12.5px] transition-colors focus-visible:outline-2 focus-visible:outline-gold",
                                l.id === lessonId
                                  ? "bg-gold-dim font-semibold text-gold-dark"
                                  : l.progress?.status === "completed"
                                    ? "text-muted-foreground hover:bg-black/[0.03]"
                                    : "text-foreground/85 hover:bg-black/[0.03]"
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                                  l.progress?.status === "completed"
                                    ? "border-teal/40 bg-teal-dim text-teal"
                                    : "border-black/[0.12] text-muted-foreground/60"
                                )}
                                aria-hidden="true"
                              >
                                {l.progress?.status === "completed" ? (
                                  <Check size={10} strokeWidth={3} />
                                ) : l.kind === "video" ? (
                                  <Play size={9} />
                                ) : (
                                  <FileText size={9} />
                                )}
                              </span>
                              <span className="min-w-0 flex-1 truncate">{l.title}</span>
                              {l.id !== lessonId && !l.isPreview && !outline.course?.enrolled ? (
                                <Lock size={10} className="shrink-0 text-muted-foreground/40" aria-hidden="true" />
                              ) : null}
                              <span className="shrink-0 text-[10.5px] text-muted-foreground/60">
                                {l.durationMinutes}m
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : (
              <p className="px-2 py-4 text-[12.5px] text-muted-foreground">{outline.error}</p>
            )
          ) : (
            <div className="space-y-2 px-1" aria-label="Loading outline">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-4/5 rounded-lg" />
            </div>
          )}
          <p className="mt-3 hidden items-center gap-1.5 px-2 text-[11.5px] text-muted-foreground lg:flex">
            <Clock3 size={11} aria-hidden="true" />
            {formatMinutes(outline?.course?.totalMinutes ?? 0)} total
          </p>
        </aside>
      </div>
    </div>
  );
}

/* ── helpers ── */

/** Quiz call-to-action at the bottom of a lesson (narrowed non-null quiz). */
function QuizTeaser({
  lesson,
  enrolled,
  onOpenQuiz,
}: {
  lesson: LessonDetailDto;
  enrolled: boolean;
  onOpenQuiz: (payload: OpenQuizPayload) => void;
}) {
  const quiz = lesson.quiz; // non-null — guarded by the caller's ternary
  if (!quiz) return null;
  return (
    <section aria-label="Lesson quiz" className="mt-6 overflow-hidden rounded-2xl border border-purple/25 bg-purple/[0.04] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple/10 text-purple">
            <CircleHelp size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-[15.5px] font-bold text-foreground">{quiz.title}</h2>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              {quiz.questionCount} question{quiz.questionCount === 1 ? "" : "s"} · pass at {quiz.passScore}% · retakes
              allowed
            </p>
          </div>
        </div>
        <Button
          onClick={() =>
            onOpenQuiz({
              quiz,
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              courseSlug: lesson.courseSlug,
              courseTitle: lesson.courseTitle,
            })
          }
          className="h-11 rounded-xl bg-purple px-5 text-[13.5px] font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <PlayCircle size={15} aria-hidden="true" /> {enrolled ? "Take quiz" : "Try the quiz"}
        </Button>
      </div>
    </section>
  );
}

function BackToCourse({
  slug,
  label,
  onBackToCourse,
}: {
  slug: string;
  label: string;
  onBackToCourse: (slug: string) => void;
}) {
  return (
    <button
      onClick={() => slug && onBackToCourse(slug)}
      className="inline-flex items-center gap-2 rounded-lg text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-gold"
    >
      <ArrowLeft size={15} aria-hidden="true" /> <span className="max-w-[220px] truncate sm:max-w-none">{label}</span>
    </button>
  );
}

/** Inline enroll button for locked/preview lessons (authed students). */
function EnrollInline({
  slug,
  onDone,
  showToast,
  onEnrolled,
}: {
  slug: string | undefined;
  onDone: () => void;
  showToast: (message: string, tone?: "success" | "error" | "info") => void;
  onEnrolled: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const enroll = async () => {
    if (!slug || busy) return;
    setBusy(true);
    try {
      const data = await apiFetch<{ ok: true; alreadyEnrolled: boolean; courseTitle: string }>(
        `/api/learning/courses/${slug}/enroll`,
        { method: "POST" }
      );
      showToast(data.alreadyEnrolled ? `You're already enrolled in ${data.courseTitle}.` : `Enrolled in ${data.courseTitle} — dive in!`, data.alreadyEnrolled ? "info" : "success");
      onEnrolled();
      onDone();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Enrollment failed.", "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button
      onClick={() => void enroll()}
      disabled={busy}
      className="h-11 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 text-[14px] font-semibold text-ink shadow-gold"
    >
      {busy ? (
        <>
          <Loader2 size={15} className="animate-spin" aria-hidden="true" /> Enrolling…
        </>
      ) : (
        <>
          <PlayCircle size={15} aria-hidden="true" /> Enroll now — free
        </>
      )}
    </Button>
  );
}

/** `` `code` `` spans → inline code chips; everything else stays plain. */
export function renderInlineCode(text: string): React.ReactNode[] {
  const parts = text.split(/`([^`\n]+)`/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <code
        key={i}
        className="mx-0.5 rounded-md border border-gold/25 bg-gold-dim px-1.5 py-0.5 font-mono text-[13px] font-medium text-gold-dark dark:text-gold"
      >
        {part}
      </code>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/** YouTube watch/short links → embed URLs; everything else passes through. */
export function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if ((u.hostname === "www.youtube.com" || u.hostname === "youtube.com") && u.pathname === "/watch") {
      return `https://www.youtube.com/embed/${u.searchParams.get("v") ?? ""}`;
    }
    if ((u.hostname === "www.youtube.com" || u.hostname === "youtube.com") && u.pathname.startsWith("/shorts/")) {
      return `https://www.youtube.com/embed/${u.pathname.split("/")[2] ?? ""}`;
    }
    return url;
  } catch {
    return url;
  }
}
