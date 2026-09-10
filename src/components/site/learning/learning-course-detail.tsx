"use client";

/* ─────────────────────────────────────────────────────────────
   BATCH 13 (§66) — Course detail page.
   Hero (cover/level/progress/enroll) + module "chapter"
   accordion with lesson rows (lock / preview / quiz / done).
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Layers,
  Lock,
  Play,
  PlayCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CourseDetailDto, LessonListItemDto } from "@/lib/learning-shared";
import {
  ErrorState,
  LevelBadge,
  ProgressBar,
  apiFetch,
  formatMinutes,
  formatPrice,
} from "./learning-shared-ui";

type CourseDetailProps = {
  slug: string;
  isAuthed: boolean;
  /** Session memory of graded quizzes: quizId → score (for the pass chip). */
  quizScores: Map<string, { scorePercent: number; passed: boolean }>;
  onOpenLesson: (lessonId: string) => void;
  onRequireAuth: (enrollSlug: string) => void;
  onEnrolled: () => void; // student became enrolled (refresh auth state)
  onBack: () => void;
  showToast: (message: string, tone?: "success" | "error" | "info") => void;
};

export function LearningCourseDetail({
  slug,
  isAuthed,
  quizScores,
  onOpenLesson,
  onRequireAuth,
  onEnrolled,
  onBack,
  showToast,
}: CourseDetailProps) {
  const [course, setCourse] = useState<CourseDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    let alive = true;
    apiFetch<{ ok: true; course: CourseDetailDto }>(`/api/learning/courses/${slug}`)
      .then((data) => {
        if (alive) setCourse(data.course);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "Could not load this course.");
      });
    return () => {
      alive = false;
    };
  }, [slug, reloadKey]);

  const doEnroll = useCallback(async () => {
    if (enrolling) return;
    setEnrolling(true);
    try {
      const data = await apiFetch<{
        ok: true;
        alreadyEnrolled: boolean;
        enrollment: { status: string };
        courseTitle: string;
      }>(`/api/learning/courses/${slug}/enroll`, { method: "POST" });
      if (data.alreadyEnrolled) {
        showToast(`You're already enrolled in ${data.courseTitle}.`, "info");
      } else {
        showToast(`You're in! Welcome to ${data.courseTitle} — your first lesson awaits.`, "success");
        onEnrolled();
      }
      setReloadKey((k) => k + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Enrollment failed — please try again.";
      showToast(msg, "error");
    } finally {
      setEnrolling(false);
    }
  }, [slug, enrolling, onEnrolled, showToast]);

  /* ── Loading / error ── */
  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 pb-20 pt-10 sm:px-6">
        <BackButton onBack={onBack} />
        <div className="mt-6">
          <ErrorState
            message={error}
            onRetry={() => {
              setCourse(null);
              setError(null);
              setReloadKey((k) => k + 1);
            }}
          />
        </div>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 pb-20 pt-10 sm:px-6" aria-label="Loading course">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="mt-4 h-36 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-10 w-full rounded-2xl" />
        <Skeleton className="mt-3 h-10 w-full rounded-2xl" />
        <Skeleton className="mt-3 h-10 w-full rounded-2xl" />
      </div>
    );
  }

  const lessonTotal = course.lessonCount;
  const completedLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.progress?.status === "completed").length,
    0
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 pt-8 sm:px-6">
      <BackButton onBack={onBack} />

      {/* ── Hero ── */}
      <section
        aria-labelledby="course-title"
        className="lp-anim-fade-up mt-4 overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(20,25,38,0.04)]"
      >
        <div className="flex flex-col gap-6 border-b border-black/[0.06] bg-gradient-to-br from-gold-dim/40 via-white to-teal-dim/30 p-6 sm:flex-row sm:items-center sm:p-8">
          <span
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-white text-[40px] leading-none shadow-gold"
            aria-hidden="true"
          >
            {course.coverEmoji}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadge level={course.level} />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal-dim px-2.5 py-0.5 text-[11.5px] font-bold text-teal">
                {formatPrice(course.priceNgn)}
              </span>
            </div>
            <h1 id="course-title" className="mt-3 font-display text-[26px] font-bold leading-tight text-foreground sm:text-[30px]">
              {course.title}
            </h1>
            {course.summary ? (
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{course.summary}</p>
            ) : null}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {course.description ? (
            <p className="text-[14px] leading-[1.75] text-muted-foreground">{course.description}</p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Layers size={14} className="text-gold" aria-hidden="true" /> {course.moduleCount} modules
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={14} className="text-gold" aria-hidden="true" /> {lessonTotal} lessons
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={14} className="text-gold" aria-hidden="true" /> {formatMinutes(course.totalMinutes)}
            </span>
          </div>

          {/* Enroll / progress strip */}
          <div className="mt-6">
            {course.enrolled ? (
              <div className="rounded-2xl border border-teal/25 bg-teal-dim/50 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-teal">
                    <BadgeCheck size={16} aria-hidden="true" />
                    {course.enrollmentStatus === "completed"
                      ? "Course completed — well done!"
                      : "You're enrolled in this course"}
                  </span>
                  <span className="text-[12.5px] font-medium text-muted-foreground">
                    {completedLessons}/{lessonTotal} lessons · {course.progressPercent ?? 0}%
                  </span>
                </div>
                <ProgressBar
                  percent={course.progressPercent ?? 0}
                  className="mt-3"
                  barClassName="from-teal to-[color:var(--teal)] bg-teal"
                />
              </div>
            ) : (
              <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-gold/25 bg-gold-dim/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">{formatPrice(course.priceNgn)}</span>{" "}
                  — enroll once, keep the lessons forever. Preview lessons are marked below.
                </p>
                {isAuthed ? (
                  <Button
                    onClick={() => void doEnroll()}
                    disabled={enrolling}
                    className="h-11 shrink-0 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 text-[14px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 active:scale-[0.98] sm:min-w-[190px]"
                  >
                    <PlayCircle size={16} aria-hidden="true" />
                    {enrolling ? "Enrolling…" : "Enroll now — free"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => onRequireAuth(slug)}
                    className="h-11 shrink-0 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 text-[14px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 active:scale-[0.98] sm:min-w-[190px]"
                  >
                    <Lock size={15} aria-hidden="true" /> Sign in to enroll
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Curriculum ── */}
      <section aria-label="Course curriculum" className="mt-8">
        <h2 className="font-display text-[19px] font-bold text-foreground">Course curriculum</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {course.modules.length} module{course.modules.length === 1 ? "" : "s"} · work through them in order or
          jump to what you need.
        </p>

        <Accordion
          type="multiple"
          defaultValue={course.modules.length > 0 ? [course.modules[0].id] : []}
          className="mt-4 space-y-3"
        >
          {course.modules.map((mod, mi) => {
            const moduleDone = mod.lessons.length > 0 && mod.lessons.every((l) => l.progress?.status === "completed");
            return (
              <AccordionItem
                key={mod.id}
                value={mod.id}
                className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(20,25,38,0.03)] data-[state=open]:border-gold/30"
              >
                <AccordionTrigger className="px-5 py-4 text-left hover:no-underline focus-visible:outline-2 focus-visible:outline-gold [&>svg]:hidden">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-display text-[15px] font-bold",
                        moduleDone
                          ? "border-teal/30 bg-teal-dim text-teal"
                          : "border-black/[0.08] bg-black/[0.03] text-muted-foreground"
                      )}
                    >
                      {moduleDone ? <CheckCircle2 size={18} aria-hidden="true" /> : mi + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-[15.5px] font-bold text-foreground">{mod.title}</h3>
                      {mod.summary ? (
                        <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted-foreground">{mod.summary}</p>
                      ) : null}
                      <p className="mt-1 text-[11.5px] text-muted-foreground/80">
                        {mod.lessons.length} lesson{mod.lessons.length === 1 ? "" : "s"}
                        {" · "}
                        {formatMinutes(mod.lessons.reduce((s, l) => s + l.durationMinutes, 0))}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="shrink-0 text-muted-foreground/60 transition-transform duration-200 [[data-state=open]>&]:rotate-90"
                      aria-hidden="true"
                    />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-black/[0.05] px-3 pb-3 pt-2">
                  <ul>
                    {mod.lessons.map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        enrolled={course.enrolled}
                        quizScore={lesson.hasQuiz ? findQuizScore(quizScores, lesson) : undefined}
                        onOpen={() => {
                          const accessible = course.enrolled || lesson.isPreview;
                          if (accessible) onOpenLesson(lesson.id);
                          else if (!isAuthed) onRequireAuth(slug);
                          else void doEnroll(); // authed but not enrolled → enroll prompt via action
                        }}
                      />
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </section>
    </div>
  );
}

/* ── helpers ── */

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="inline-flex items-center gap-2 rounded-lg text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-gold"
    >
      <ArrowLeft size={15} aria-hidden="true" /> All courses
    </button>
  );
}

/** Quiz scores are keyed by quizId — lesson rows only know hasQuiz, so we
 *  match on the lesson id (portal stores both after a graded attempt). */
function findQuizScore(
  quizScores: Map<string, { scorePercent: number; passed: boolean }>,
  lesson: LessonListItemDto
): { scorePercent: number; passed: boolean } | undefined {
  // portal keys by BOTH quizId and `lesson:{lessonId}` for row lookups
  return quizScores.get(`lesson:${lesson.id}`);
}

/* ── lesson row ── */

function LessonRow({
  lesson,
  enrolled,
  quizScore,
  onOpen,
}: {
  lesson: LessonListItemDto;
  enrolled: boolean;
  quizScore: { scorePercent: number; passed: boolean } | undefined;
  onOpen: () => void;
}) {
  const accessible = enrolled || lesson.isPreview;
  const done = lesson.progress?.status === "completed";
  const inProgress = lesson.progress?.status === "in_progress";

  return (
    <li>
      <button
        onClick={onOpen}
        aria-label={`${accessible ? "Open" : "Locked"} lesson: ${lesson.title}`}
        className={cn(
          "group flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-gold",
          accessible ? "hover:bg-gold-dim/50" : "cursor-not-allowed hover:bg-black/[0.02]"
        )}
      >
        {/* status / kind icon */}
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
            done
              ? "border-teal/30 bg-teal-dim text-teal"
              : accessible
                ? "border-black/[0.08] bg-white text-gold"
                : "border-black/[0.06] bg-black/[0.02] text-muted-foreground/50"
          )}
        >
          {done ? (
            <CheckCircle2 size={16} aria-hidden="true" />
          ) : accessible ? (
            lesson.kind === "video" ? (
              <Play size={15} aria-hidden="true" />
            ) : (
              <FileText size={15} aria-hidden="true" />
            )
          ) : (
            <Lock size={14} aria-hidden="true" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-[13.5px] font-semibold",
              done ? "text-muted-foreground" : accessible ? "text-foreground" : "text-muted-foreground/70"
            )}
          >
            {lesson.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-muted-foreground/85">
            <span className="inline-flex items-center gap-1">
              {lesson.kind === "video" ? <Play size={11} aria-hidden="true" /> : <FileText size={11} aria-hidden="true" />}
              {lesson.kind === "video" ? "Video" : "Reading"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 size={11} aria-hidden="true" />
              {lesson.durationMinutes}m
            </span>
            {lesson.isPreview && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gold/35 bg-gold-dim px-2 py-0.5 text-[10.5px] font-bold text-gold">
                <Sparkles size={10} aria-hidden="true" /> Preview
              </span>
            )}
            {lesson.hasQuiz && (
              <span className="inline-flex items-center gap-1 rounded-full border border-purple/25 bg-purple/10 px-2 py-0.5 text-[10.5px] font-bold text-purple">
                <CircleHelp size={10} aria-hidden="true" /> Quiz · {lesson.quizQuestionCount}Q
              </span>
            )}
            {quizScore && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-bold",
                  quizScore.passed
                    ? "border-teal/30 bg-teal-dim text-teal"
                    : "border-amber-400/30 bg-amber-400/10 text-amber-600"
                )}
              >
                <Trophy size={10} aria-hidden="true" /> {quizScore.scorePercent}%
              </span>
            )}
          </div>
        </div>

        {inProgress && !done ? (
          <span className="hidden shrink-0 rounded-full border border-amber-400/35 bg-amber-400/10 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-600 sm:inline-flex">
            In progress
          </span>
        ) : null}

        {accessible ? (
          <ArrowRight
            size={15}
            className="shrink-0 text-gold/60 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        ) : (
          <Lock size={13} className="shrink-0 text-muted-foreground/40" aria-hidden="true" />
        )}
      </button>
    </li>
  );
}
