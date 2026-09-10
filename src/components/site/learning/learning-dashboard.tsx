"use client";

/* ─────────────────────────────────────────────────────────────
   BATCH 13 (§67) — Student dashboard.
   Continue learning · overall progress ring + per-course bars ·
   recent activity timeline · announcements · quiz stats.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import {
  Activity,
  BookMarked,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers,
  LibraryBig,
  ListChecks,
  Megaphone,
  PlayCircle,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardDto } from "@/lib/learning-shared";
import {
  EmptyState,
  ErrorState,
  LevelBadge,
  ProgressBar,
  ProgressRing,
  SkeletonRows,
  StatCard,
  apiFetch,
  relativeTime,
} from "./learning-shared-ui";

type DashboardProps = {
  onOpenLesson: (lessonId: string) => void;
  onOpenCourse: (slug: string) => void;
  onBrowse: () => void;
  studentName: string;
};

export function LearningDashboard({ onOpenLesson, onOpenCourse, onBrowse, studentName }: DashboardProps) {
  const [data, setData] = useState<DashboardDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    apiFetch<{ ok: true; dashboard: DashboardDto }>("/api/learning/me/dashboard")
      .then((res) => {
        if (alive) setData(res.dashboard);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "Could not load your dashboard.");
      });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const retry = () => {
    setData(null);
    setError(null);
    setReloadKey((k) => k + 1);
  };
  const firstName = studentName.split(/\s+/)[0] || "there";

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:px-6">
        <ErrorState message={error} onRetry={retry} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:px-6" aria-label="Loading your dashboard">
        <SkeletonRows rows={6} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:px-6">
      {/* ── Greeting ── */}
      <header className="lp-anim-fade-up">
        <p className="text-[13px] font-medium text-muted-foreground">
          <Clock3 size={13} className="mr-1.5 -mt-0.5 inline text-gold/70" aria-hidden="true" />
          {greeting()}
        </p>
        <h1 className="mt-1 font-display text-[28px] font-bold leading-tight text-foreground sm:text-[34px]">
          Welcome back, {firstName} 👋
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          {data.enrolledCourses.length === 0
            ? "You haven't enrolled in a course yet — the catalogue is one click away."
            : data.continueLearning.length > 0
              ? "You have lessons waiting — pick up where you left off."
              : "All your enrolled lessons are complete. Browse for your next challenge!"}
        </p>
      </header>

      {/* ── Quiz + progress mini stats ── */}
      <section aria-label="Your learning stats" className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<BookMarked size={18} aria-hidden="true" />} value={data.enrolledCourses.length} label="Courses enrolled" tone="gold" />
        <StatCard icon={<ListChecks size={18} aria-hidden="true" />} value={`${data.overallProgressPercent}%`} label="Overall progress" tone="teal" />
        <StatCard icon={<Target size={18} aria-hidden="true" />} value={data.quizStats.attempts} label="Quiz attempts" tone="purple" />
        <StatCard icon={<Trophy size={18} aria-hidden="true" />} value={data.quizStats.passed} label="Quizzes passed" tone="gold" />
      </section>

      {/* ── Continue learning ── */}
      <section aria-labelledby="continue-learning-title" className="mt-10">
        <div className="flex items-center justify-between">
          <h2 id="continue-learning-title" className="flex items-center gap-2.5 font-display text-[19px] font-bold text-foreground">
            <Sparkles size={17} className="text-gold" aria-hidden="true" /> Continue learning
          </h2>
        </div>

        {data.continueLearning.length === 0 ? (
          <div className="mt-4">
            {data.enrolledCourses.length === 0 ? (
              <EmptyState
                icon={<LibraryBig size={24} aria-hidden="true" />}
                title="Start your first course"
                body="Web Development Foundations is a great place to begin — the first lesson is a free preview."
                action={
                  <Button
                    onClick={onBrowse}
                    className="h-11 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 text-[14px] font-semibold text-ink shadow-gold"
                  >
                    Browse courses
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<GraduationCap size={24} aria-hidden="true" />}
                title="Everything's finished"
                body="You've completed every lesson in your enrolled courses. Browse the catalogue for your next one."
                action={
                  <Button
                    onClick={onBrowse}
                    variant="outline"
                    className="h-11 rounded-xl border-black/[0.12] px-6 text-[14px] font-medium"
                  >
                    Browse courses
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.continueLearning.map((row, i) => (
              <li
                key={`${row.courseId}-${row.lessonId}`}
                className="lp-anim-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex h-full flex-col rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_1px_2px_rgba(20,25,38,0.04)] transition-all duration-300 hover:border-gold/40 hover:shadow-[0_20px_44px_-24px_rgba(20,25,38,0.3)]">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => onOpenCourse(row.courseSlug)}
                      aria-label={`Open course: ${row.courseTitle}`}
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold-dim text-[28px] leading-none transition-transform hover:scale-105"
                    >
                      <span aria-hidden="true">{row.coverEmoji}</span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => onOpenCourse(row.courseSlug)}
                        className="block truncate text-left text-[12.5px] font-semibold text-gold-dark transition-colors hover:text-gold"
                      >
                        {row.courseTitle}
                      </button>
                      <p className="mt-1 line-clamp-2 text-[14.5px] font-semibold leading-snug text-foreground">
                        {row.courseCompleted ? "Course complete — review any lesson" : `Up next: ${row.lessonTitle}`}
                      </p>
                      <p className="mt-1.5 text-[12px] text-muted-foreground">
                        {row.lessonKind === "video" ? "Video" : "Reading"} · {row.durationMinutes}m
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <ProgressBar percent={row.progressPercent} className="flex-1" />
                    <span className="shrink-0 text-[11.5px] font-semibold text-muted-foreground">{row.progressPercent}%</span>
                  </div>
                  <Button
                    onClick={() => onOpenLesson(row.lessonId)}
                    className="mt-4 h-11 w-full rounded-xl bg-gradient-to-r from-gold-light to-gold text-[13.5px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    <PlayCircle size={15} aria-hidden="true" /> {row.courseCompleted ? "Review" : "Resume lesson"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Your progress ── */}
      {data.enrolledCourses.length > 0 && (
        <section aria-labelledby="your-progress-title" className="mt-10">
          <h2 id="your-progress-title" className="flex items-center gap-2.5 font-display text-[19px] font-bold text-foreground">
            <Activity size={17} className="text-teal" aria-hidden="true" /> Your progress
          </h2>
          <div className="mt-4 rounded-2xl border border-black/[0.07] bg-white p-5 sm:p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
              <div className="shrink-0 text-center">
                <ProgressRing percent={data.overallProgressPercent} size={104} stroke={10} tone="teal" />
                <p className="mt-2 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Overall
                </p>
              </div>
              <ul className="w-full flex-1 space-y-4">
                {data.enrolledCourses.map((course) => (
                  <li key={course.id}>
                    <button
                      onClick={() => onOpenCourse(course.slug)}
                      className="group flex w-full items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-gold"
                      aria-label={`Open ${course.title}, ${course.progressPercent} percent complete`}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/[0.07] bg-black/[0.02] text-[20px] leading-none"
                        aria-hidden="true"
                      >
                        {course.coverEmoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <span className="truncate text-[13.5px] font-semibold text-foreground transition-colors group-hover:text-gold-dark">
                            {course.title}
                          </span>
                          <span className="shrink-0 text-[11.5px] font-medium text-muted-foreground">
                            {course.completedLessons}/{course.lessonCount} lessons · {course.progressPercent}%
                          </span>
                        </span>
                        <ProgressBar
                          percent={course.progressPercent}
                          className="mt-1.5"
                          barClassName={course.enrollmentStatus === "completed" ? "from-teal to-teal bg-teal" : undefined}
                        />
                        <span className="mt-1.5 flex flex-wrap items-center gap-2">
                          <LevelBadge level={course.level} />
                          {course.enrollmentStatus === "completed" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-teal/30 bg-teal-dim px-2 py-0.5 text-[10.5px] font-bold text-teal">
                              <CheckCircle2 size={10} aria-hidden="true" /> Completed
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              {course.completedLessons}/{course.lessonCount} lessons done
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ── Activity + announcements ── */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* recent activity */}
        <section aria-labelledby="recent-activity-title">
          <h2 id="recent-activity-title" className="flex items-center gap-2.5 font-display text-[19px] font-bold text-foreground">
            <BookOpen size={17} className="text-gold" aria-hidden="true" /> Recent activity
          </h2>
          <div className="mt-4 rounded-2xl border border-black/[0.07] bg-white p-5">
            {data.recentActivity.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-muted-foreground">
                Nothing yet — complete a lesson or take a quiz and it will show up here.
              </p>
            ) : (
              <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-black/[0.07]" aria-hidden="true">
                {data.recentActivity.slice(0, 8).map((act, i) => (
                  <li key={`${act.at}-${i}`} className="relative flex items-start gap-3.5 pl-0">
                    <span
                      className={cn(
                        "z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white",
                        act.type === "quiz_attempt"
                          ? "border-purple/30 text-purple"
                          : act.type === "lesson_completed"
                            ? "border-teal/30 text-teal"
                            : "border-gold/30 text-gold"
                      )}
                    >
                      {act.type === "quiz_attempt" ? (
                        <Target size={14} aria-hidden="true" />
                      ) : act.type === "lesson_completed" ? (
                        <CheckCircle2 size={14} aria-hidden="true" />
                      ) : (
                        <BookOpen size={14} aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-[13px] font-medium leading-snug text-foreground">{act.label}</p>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                        {act.courseTitle ?? ""} {act.courseTitle ? "· " : ""}
                        {relativeTime(act.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        {/* announcements */}
        <section aria-labelledby="announcements-title">
          <h2 id="announcements-title" className="flex items-center gap-2.5 font-display text-[19px] font-bold text-foreground">
            <Megaphone size={17} className="text-gold" aria-hidden="true" /> Announcements
          </h2>
          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {data.announcements.length === 0 ? (
              <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
                <p className="py-4 text-center text-[13px] text-muted-foreground">
                  No announcements yet — new course drops and updates will appear here.
                </p>
              </div>
            ) : (
              data.announcements.map((ann) => (
                <article key={ann.id} className="rounded-2xl border border-black/[0.07] bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[14.5px] font-bold text-foreground">{ann.title}</h3>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold",
                        ann.audience === "all"
                          ? "border-gold/30 bg-gold-dim text-gold"
                          : "border-purple/25 bg-purple/10 text-purple"
                      )}
                    >
                      {ann.audience === "all" ? (
                        "All students"
                      ) : (
                        <>
                          <Layers size={10} aria-hidden="true" /> {ann.courseTitle ?? "Course"}
                        </>
                      )}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{ann.body}</p>
                  <p className="mt-3 text-[11.5px] text-muted-foreground/80">{relativeTime(ann.createdAt)}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ── Browse more ── */}
      <section aria-label="Keep exploring" className="mt-10">
        <button
          onClick={onBrowse}
          className="group flex w-full items-center justify-between rounded-2xl border border-gold/25 bg-gradient-to-r from-gold-dim/60 to-teal-dim/40 px-6 py-5 text-left transition-all hover:border-gold/50 focus-visible:outline-2 focus-visible:outline-gold"
        >
          <span>
            <span className="block font-display text-[16px] font-bold text-foreground">
              Explore the full catalogue
            </span>
            <span className="mt-0.5 block text-[12.5px] text-muted-foreground">
              New courses land regularly — from your first website to digital operations.
            </span>
          </span>
          <PlayCircle size={22} className="shrink-0 text-gold transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
