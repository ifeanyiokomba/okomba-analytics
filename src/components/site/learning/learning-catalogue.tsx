"use client";

/* ─────────────────────────────────────────────────────────────
   BATCH 13 (§66) — Okomba Learning course catalogue.
   Public grid of course cards (works logged-out).
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Clock3, Layers, LibraryBig, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CourseCardDto } from "@/lib/learning-shared";
import {
  EmptyState,
  ErrorState,
  LevelBadge,
  SkeletonCard,
  apiFetch,
  formatMinutes,
  formatPrice,
} from "./learning-shared-ui";

type CatalogueProps = {
  isAuthed: boolean;
  onOpenCourse: (slug: string) => void;
  onSignIn: () => void;
  onOpenDashboard: () => void;
};

export function LearningCatalogue({ isAuthed, onOpenCourse, onSignIn, onOpenDashboard }: CatalogueProps) {
  const [courses, setCourses] = useState<CourseCardDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    apiFetch<{ ok: true; courses: CourseCardDto[] }>("/api/learning/courses")
      .then((data) => {
        if (alive) setCourses(data.courses);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "Could not load courses.");
      });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const retry = () => {
    setCourses(null);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:pt-14">
      {/* ── Header ── */}
      <header className="lp-anim-fade-up text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold-dim px-4 py-1.5 text-[12px] font-semibold text-gold">
          <Sparkles size={13} aria-hidden="true" /> Okomba Learning
        </span>
        <h1 className="mt-5 font-display text-[32px] font-bold leading-tight text-foreground sm:text-[40px]">
          Learn skills that move
          <br className="hidden sm:block" /> your business forward
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          Practical, hands-on courses on web development and digital operations — built by the team that ships
          them every day. Free while we're in beta.
        </p>

        {!isAuthed && (
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={onSignIn}
              className="h-11 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 text-[14px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Create a free account <ArrowRight size={15} aria-hidden="true" />
            </Button>
            <span className="text-[12.5px] text-muted-foreground">No card needed · learn at your pace</span>
          </div>
        )}
        {isAuthed && (
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={onOpenDashboard}
              className="h-11 rounded-xl border-black/[0.12] px-6 text-[14px] font-medium"
            >
              <BookOpen size={15} aria-hidden="true" /> Go to My Learning
            </Button>
          </div>
        )}
      </header>

      {/* ── Course grid ── */}
      <section aria-label="Course catalogue" className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[19px] font-bold text-foreground">All courses</h2>
          {courses ? (
            <span className="text-[12.5px] text-muted-foreground">
              {courses.length} course{courses.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        {error ? (
          <div className="mt-5">
            <ErrorState message={error} onRetry={retry} />
          </div>
        ) : !courses ? (
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2" aria-label="Loading courses">
            <SkeletonCard className="h-[220px]" />
            <SkeletonCard className="h-[220px]" />
          </div>
        ) : courses.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={<LibraryBig size={24} aria-hidden="true" />}
              title="Courses are on the way"
              body="Our team is putting the finishing touches on the first batch of courses. Check back soon!"
            />
          </div>
        ) : (
          <ul className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            {courses.map((course, i) => (
              <li key={course.slug} className="lp-anim-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
                <CourseCard course={course} onOpen={() => onOpenCourse(course.slug)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Reassurance strip ── */}
      <section aria-label="Why learn with us" className="mt-14">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: <Layers size={15} aria-hidden="true" />, text: "Structured modules, lesson by lesson" },
            { icon: <Clock3 size={15} aria-hidden="true" />, text: "Learn at your own pace, on any device" },
            { icon: <BookOpen size={15} aria-hidden="true" />, text: "Quizzes with instant feedback" },
          ].map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white/70 px-4 py-3.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-dim text-teal">
                {item.icon}
              </span>
              <span className="text-[13px] font-medium text-muted-foreground">{item.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CourseCard({ course, onOpen }: { course: CourseCardDto; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      aria-label={`Open course: ${course.title}`}
      className="group flex h-full w-full flex-col rounded-2xl border border-black/[0.07] bg-white p-6 text-left shadow-[0_1px_2px_rgba(20,25,38,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_24px_48px_-24px_rgba(20,25,38,0.3)] focus-visible:outline-2 focus-visible:outline-gold"
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold-dim text-[32px] leading-none"
          aria-hidden="true"
        >
          {course.coverEmoji}
        </span>
        <LevelBadge level={course.level} />
      </div>

      <h3 className="mt-5 font-display text-[19px] font-bold leading-snug text-foreground transition-colors group-hover:text-gold-dark">
        {course.title}
      </h3>
      {course.summary ? (
        <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-muted-foreground">{course.summary}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Layers size={13} className="text-gold/70" aria-hidden="true" />
          {course.moduleCount} module{course.moduleCount === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BookOpen size={13} className="text-gold/70" aria-hidden="true" />
          {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 size={13} className="text-gold/70" aria-hidden="true" />
          {formatMinutes(course.totalMinutes)}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-black/[0.06] pt-4">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-bold",
            course.priceNgn === 0
              ? "border-teal/30 bg-teal-dim text-teal"
              : "border-gold/30 bg-gold-dim text-gold"
          )}
        >
          {formatPrice(course.priceNgn)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gold transition-transform duration-300 group-hover:translate-x-1">
          View course <ArrowRight size={14} aria-hidden="true" />
        </span>
      </div>
    </button>
  );
}
