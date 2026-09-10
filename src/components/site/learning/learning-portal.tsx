"use client";

/* ─────────────────────────────────────────────────────────────
   BATCH 13 (§64–§67) — Okomba Learning student portal shell.
   Entry: #/learning (hash-routed from the marketing site).
   Manages auth state, internal view routing, top bar, toast.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { QuizAttemptResultDto, StudentMeDto, StudentPublicDto, StudentQuizDto } from "@/lib/learning-shared";
import { ApiError, LearningToast, apiFetch, initials, type ToastTone } from "./learning-shared-ui";
import { LearningAuth } from "./learning-auth";
import { LearningCatalogue } from "./learning-catalogue";
import { LearningCourseDetail } from "./learning-course-detail";
import { LearningDashboard } from "./learning-dashboard";
import { LearningLesson, type OpenQuizPayload } from "./learning-lesson";
import { LearningQuiz } from "./learning-quiz";

type View =
  | { name: "catalogue" }
  | { name: "auth"; mode: "login" | "signup"; pendingEnrollSlug?: string }
  | { name: "course"; slug: string }
  | { name: "lesson"; lessonId: string }
  | { name: "quiz"; ctx: OpenQuizPayload }
  | { name: "dashboard" };

export function LearningPortal({ onExit }: { onExit: () => void }) {
  /* student: undefined = checking session, null = anonymous */
  const [student, setStudent] = useState<StudentMeDto | null | undefined>(undefined);
  const [view, setView] = useState<View>({ name: "catalogue" });
  const [toast, setToast] = useState<{ tone: ToastTone; message: string } | null>(null);
  const [quizScores, setQuizScores] = useState<Map<string, { scorePercent: number; passed: boolean }>>(new Map());
  const prevTitle = useRef<string>("");

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    setToast({ tone, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5200);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── session bootstrap (setState only in async continuations) ── */
  const refreshMe = useCallback(async () => {
    try {
      const data = await apiFetch<{ ok: true; student: StudentMeDto }>("/api/learning/auth/me");
      setStudent(data.student);
    } catch {
      setStudent(null);
    }
  }, []);

  useEffect(() => {
    apiFetch<{ ok: true; student: StudentMeDto }>("/api/learning/auth/me")
      .then((data) => setStudent(data.student))
      .catch(() => setStudent(null));
  }, []);

  /* ── document title while the portal is open ── */
  useEffect(() => {
    prevTitle.current = document.title;
    document.title = "Okomba Learning — learn free, forever";
    return () => {
      document.title = prevTitle.current;
    };
  }, []);

  /* ── scroll to top on view change ── */
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  /* ── actions ── */
  const goCatalogue = useCallback(() => setView({ name: "catalogue" }), []);
  const goDashboard = useCallback(() => setView({ name: "dashboard" }), []);
  const openCourse = useCallback((slug: string) => setView({ name: "course", slug }), []);
  const openLesson = useCallback((lessonId: string) => setView({ name: "lesson", lessonId }), []);

  const requireAuth = useCallback((enrollSlug: string) => {
    setView({ name: "auth", mode: "login", pendingEnrollSlug: enrollSlug });
  }, []);

  const onAuthSuccess = useCallback(
    async (signedIn: StudentPublicDto, pendingEnrollSlug?: string) => {
      void refreshMe();
      if (pendingEnrollSlug) {
        // "Sign in to enroll" flow: enroll immediately, then open the course.
        try {
          const data = await apiFetch<{
            ok: true;
            alreadyEnrolled: boolean;
            courseTitle: string;
          }>(`/api/learning/courses/${pendingEnrollSlug}/enroll`, { method: "POST" });
          showToast(
            data.alreadyEnrolled
              ? `Welcome back, ${signedIn.name.split(/\s+/)[0]}! You're already enrolled in ${data.courseTitle}.`
              : `You're in! Enrolled in ${data.courseTitle} — your first lesson awaits.`,
            "success"
          );
        } catch {
          /* course view will show the enroll button if this failed */
        }
        setView({ name: "course", slug: pendingEnrollSlug });
      } else {
        showToast(`Welcome, ${signedIn.name.split(/\s+/)[0]}! You're signed in.`, "success");
        setView({ name: "dashboard" });
      }
    },
    [refreshMe, showToast]
  );

  const signOut = useCallback(async () => {
    try {
      await apiFetch<{ ok: true }>("/api/learning/auth/logout", { method: "POST" });
    } catch {
      /* session is cleared client-side regardless */
    }
    setStudent(null);
    setQuizScores(new Map());
    setView({ name: "catalogue" });
    showToast("You've been signed out. See you soon!", "info");
  }, [showToast]);

  const openQuiz = useCallback((ctx: OpenQuizPayload) => {
    setView({ name: "quiz", ctx });
  }, []);

  const onQuizGraded = useCallback((lessonId: string, result: QuizAttemptResultDto) => {
    setQuizScores((prev) => {
      const next = new Map(prev);
      next.set(result.quizId, { scorePercent: result.scorePercent, passed: result.passed });
      next.set(`lesson:${lessonId}`, { scorePercent: result.scorePercent, passed: result.passed });
      return next;
    });
  }, []);

  const exitQuizToLesson = useCallback(
    (lessonId: string) => setView({ name: "lesson", lessonId }),
    []
  );

  const isAuthed = student !== null && student !== undefined;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 border-b border-black/[0.07] bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6" aria-label="Learning portal navigation">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={goCatalogue}
              className="flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-gold"
              aria-label="Okomba Learning — course catalogue"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-light to-gold text-ink shadow-gold">
                <GraduationCap size={19} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-[16px] font-bold leading-tight text-foreground">
                  Okomba <span className="text-gold">Learning</span>
                </span>
                <span className="hidden text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70 sm:block">
                  Learn · Build · Grow
                </span>
              </span>
            </button>
          </div>

          {/* centre nav */}
          <ul className="hidden items-center gap-1 md:flex" role="menubar" aria-label="Portal sections">
            <li role="none">
              <button
                role="menuitem"
                onClick={goCatalogue}
                aria-current={view.name === "catalogue" ? "page" : undefined}
                className={cn(
                  "rounded-xl px-4 py-2 text-[13.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-gold",
                  view.name === "catalogue" || view.name === "course" || view.name === "lesson" || view.name === "quiz"
                    ? "bg-gold-dim font-semibold text-gold-dark"
                    : "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground"
                )}
              >
                Catalogue
              </button>
            </li>
            {isAuthed && (
              <li role="none">
                <button
                  role="menuitem"
                  onClick={goDashboard}
                  aria-current={view.name === "dashboard" ? "page" : undefined}
                  className={cn(
                    "rounded-xl px-4 py-2 text-[13.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-gold",
                    view.name === "dashboard"
                      ? "bg-gold-dim font-semibold text-gold-dark"
                      : "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground"
                  )}
                >
                  My Learning
                </button>
              </li>
            )}
          </ul>

          {/* right side */}
          <div className="flex shrink-0 items-center gap-2">
            {student === undefined ? (
              <span className="flex h-9 w-9 items-center justify-center" aria-label="Checking your session">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              </span>
            ) : student ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white py-1.5 pl-1.5 pr-2.5 transition-colors hover:border-gold/40 focus-visible:outline-2 focus-visible:outline-gold"
                    aria-label="Account menu"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold-light to-gold font-display text-[12.5px] font-bold text-ink">
                      {initials(student.name)}
                    </span>
                    <span className="hidden max-w-[120px] truncate text-[13px] font-semibold text-foreground sm:block">
                      {student.name.split(/\s+/)[0]}
                    </span>
                    <ChevronDown size={14} className="text-muted-foreground" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-xl">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-[13.5px] font-semibold text-foreground">{student.name}</p>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{student.email}</p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground/80">
                      {student.enrolledCourseCount} enrolled · {student.overallProgressPercent}% overall
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={goDashboard} className="gap-2.5 rounded-lg text-[13px]">
                    <LayoutDashboard size={14} aria-hidden="true" /> My Learning dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={goCatalogue} className="gap-2.5 rounded-lg text-[13px]">
                    <BookOpen size={14} aria-hidden="true" /> Browse catalogue
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onExit} className="gap-2.5 rounded-lg text-[13px]">
                    <UserRound size={14} aria-hidden="true" /> Back to okomba.com
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => void signOut()}
                    className="gap-2.5 rounded-lg text-[13px] text-destructive focus:text-destructive"
                  >
                    <LogOut size={14} aria-hidden="true" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setView({ name: "auth", mode: "login" })}
                className="h-9 rounded-xl bg-gradient-to-r from-gold-light to-gold px-4 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Sign in
              </Button>
            )}
          </div>
        </nav>
      </header>

      {/* ── Views ── */}
      <main className="flex-1">
        {view.name === "catalogue" && (
          <LearningCatalogue
            isAuthed={isAuthed}
            onOpenCourse={openCourse}
            onSignIn={() => setView({ name: "auth", mode: "signup" })}
            onOpenDashboard={goDashboard}
          />
        )}

        {view.name === "auth" && (
          <LearningAuth
            initialMode={view.mode}
            onSuccess={(s) => {
              void onAuthSuccess(s, view.pendingEnrollSlug);
            }}
            onBack={goCatalogue}
          />
        )}

        {view.name === "course" && (
          <LearningCourseDetail
            key={view.slug}
            slug={view.slug}
            isAuthed={isAuthed}
            quizScores={quizScores}
            onOpenLesson={openLesson}
            onRequireAuth={requireAuth}
            onEnrolled={() => void refreshMe()}
            onBack={goCatalogue}
            showToast={showToast}
          />
        )}

        {view.name === "lesson" && (
          <LearningLesson
            key={view.lessonId}
            lessonId={view.lessonId}
            isAuthed={isAuthed}
            onOpenLesson={openLesson}
            onOpenQuiz={openQuiz}
            onBackToCourse={openCourse}
            onRequireAuth={requireAuth}
            onProgressChanged={() => void refreshMe()}
            showToast={showToast}
          />
        )}

        {view.name === "quiz" && (
          <LearningQuiz
            key={view.ctx.quiz.id}
            quiz={view.ctx.quiz}
            lessonId={view.ctx.lessonId}
            lessonTitle={view.ctx.lessonTitle}
            courseTitle={view.ctx.courseTitle}
            onExit={() => exitQuizToLesson(view.ctx.lessonId)}
            onGraded={(result) => onQuizGraded(view.ctx.lessonId, result)}
            showToast={showToast}
          />
        )}

        {view.name === "dashboard" && (
          <LearningDashboard
            onOpenLesson={openLesson}
            onOpenCourse={openCourse}
            onBrowse={goCatalogue}
            studentName={student?.name ?? ""}
          />
        )}
      </main>

      {/* ── Portal footer (sticky bottom) ── */}
      <footer className="mt-auto border-t border-black/[0.06] bg-white/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6">
          <p className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <Sparkles size={13} className="text-gold" aria-hidden="true" />
            Okomba Learning — practical courses, free while in beta.
          </p>
          <button
            onClick={onExit}
            className="text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
          >
            ← Back to okomba.com
          </button>
        </div>
      </footer>

      {toast && (
        <LearningToast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
