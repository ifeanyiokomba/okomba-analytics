"use client";

/* ─────────────────────────────────────────────────────────────
   BATCH 13 (§66) — Quiz runner (one question per screen).
   Progress dots, option buttons, submit → results screen with
   score ring, per-question review + explanations, retake.
   ───────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  CircleHelp,
  Loader2,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizAttemptResultDto, StudentQuizDto } from "@/lib/learning-shared";
import { ProgressRing, apiFetch } from "./learning-shared-ui";

type QuizProps = {
  quiz: StudentQuizDto;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  onExit: () => void; // back to the lesson
  onGraded: (result: QuizAttemptResultDto) => void;
  showToast: (message: string, tone?: "success" | "error" | "info") => void;
};

export function LearningQuiz({ quiz, lessonTitle, courseTitle, onExit, onGraded, showToast }: QuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizAttemptResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const questions = useMemo(
    () => [...quiz.questions].sort((a, b) => a.sortOrder - b.sortOrder),
    [quiz]
  );
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const q = questions[current];

  const select = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const submit = async () => {
    if (submitting || !allAnswered) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        answers: questions.map((question) => ({
          questionId: question.id,
          optionId: answers[question.id] ?? null,
        })),
      };
      const data = await apiFetch<{ ok: true; attempt: QuizAttemptResultDto }>(
        `/api/learning/quiz/${quiz.id}/attempt`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      setResult(data.attempt);
      onGraded(data.attempt);
      showToast(
        data.attempt.passed
          ? `Quiz passed — ${data.attempt.scorePercent}%! Great work.`
          : `Scored ${data.attempt.scorePercent}% — you need ${data.attempt.passScore}%. Review and retake!`,
        data.attempt.passed ? "success" : "info"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your answers.");
      showToast(err instanceof Error ? err.message : "Could not submit your answers.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const retake = () => {
    setAnswers({});
    setCurrent(0);
    setResult(null);
    setError(null);
  };

  /* ── Results screen ── */
  if (result) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-8 sm:px-6">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-2 rounded-lg text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-gold"
        >
          <ArrowLeft size={15} aria-hidden="true" /> Back to lesson
        </button>

        {/* score header */}
        <section
          aria-labelledby="quiz-result-title"
          className="lp-anim-pop mt-4 rounded-2xl border border-black/[0.07] bg-white p-6 text-center sm:p-8"
        >
          <div className="mx-auto w-fit">
            <ProgressRing
              percent={result.scorePercent}
              size={120}
              stroke={11}
              tone={result.passed ? "teal" : "gold"}
              label={`Quiz score ${result.scorePercent} percent`}
            />
          </div>
          <h1 id="quiz-result-title" className="mt-4 font-display text-[24px] font-bold text-foreground">
            {result.passed ? "You passed! 🎉" : "Almost there — one more try?"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            {result.passed
              ? `You scored ${result.scorePercent}% (${result.correctCount} of ${result.questionCount} correct) — the passing score is ${result.passScore}%.`
              : `You scored ${result.scorePercent}% (${result.correctCount} of ${result.questionCount} correct) — you need ${result.passScore}% to pass. Read the explanations below and retake when you're ready.`}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={retake}
              className="h-11 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 text-[14px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <RotateCcw size={15} aria-hidden="true" /> Retake quiz
            </Button>
            <Button
              variant="outline"
              onClick={onExit}
              className="h-11 rounded-xl border-black/[0.12] px-6 text-[14px] font-medium"
            >
              Back to lesson
            </Button>
          </div>
        </section>

        {/* per-question review */}
        <section aria-label="Answer review" className="mt-6 space-y-4">
          {result.results.map((r, i) => (
            <article
              key={r.questionId}
              className={cn(
                "rounded-2xl border p-5",
                r.correct ? "border-teal/25 bg-teal-dim/30" : "border-amber-400/30 bg-amber-400/[0.06]"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    r.correct ? "bg-teal-dim text-teal" : "bg-amber-400/15 text-amber-600"
                  )}
                  aria-hidden="true"
                >
                  {r.correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">
                    Question {i + 1} · {r.correct ? "Correct" : "Incorrect"}
                  </p>
                  <h3 className="mt-1 text-[14.5px] font-semibold leading-snug text-foreground">{r.prompt}</h3>

                  <div className="mt-3 space-y-1.5">
                    <AnswerReviewLine
                      label="Your answer"
                      text={optionText(quiz, r.questionId, r.selectedOptionId)}
                      correct={r.correct}
                    />
                    {!r.correct && (
                      <AnswerReviewLine
                        label="Correct answer"
                        text={optionText(quiz, r.questionId, r.correctOptionId)}
                        correct
                      />
                    )}
                  </div>

                  {r.explanation ? (
                    <p className="mt-3 rounded-xl border border-black/[0.06] bg-white/70 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground">Why: </span>
                      {r.explanation}
                    </p>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    );
  }

  /* ── Question screen (one per view) ── */
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-20 pt-8 sm:px-6">
      <button
        onClick={onExit}
        className="inline-flex items-center gap-2 rounded-lg text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-gold"
      >
        <ArrowLeft size={15} aria-hidden="true" /> Back to lesson
      </button>

      <header className="mt-4">
        <p className="text-[12px] font-medium text-muted-foreground">
          {courseTitle} <span className="mx-1.5 text-muted-foreground/50">·</span> {lessonTitle}
        </p>
        <h1 className="mt-2 flex items-center gap-3 font-display text-[22px] font-bold text-foreground sm:text-[26px]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple/10 text-purple">
            <CircleHelp size={20} aria-hidden="true" />
          </span>
          <span className="min-w-0 truncate">{quiz.title}</span>
        </h1>
        {/* progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[12px] font-medium text-muted-foreground">
            <span aria-live="polite">
              Question {current + 1} of {questions.length}
            </span>
            <span>
              {answeredCount}/{questions.length} answered
            </span>
          </div>
          <div className="mt-2 flex gap-1.5" role="progressbar" aria-label="Quiz progress" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={questions.length}>
            {questions.map((question, i) => (
              <span
                key={question.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-300",
                  i < current
                    ? answers[question.id]
                      ? "bg-teal"
                      : "bg-gold/50"
                    : i === current
                      ? "bg-gold"
                      : "bg-black/[0.08]",
                )}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </header>

      {/* question card */}
      <section aria-live="polite" className="lp-anim-fade-up mt-6 rounded-2xl border border-black/[0.07] bg-white p-5 sm:p-7">
        <h2 className="text-[16px] font-semibold leading-relaxed text-foreground sm:text-[17px]">{q.prompt}</h2>

        <div className="mt-5 space-y-2.5" role="radiogroup" aria-label="Answer options">
          {q.options.map((opt) => {
            const selected = answers[q.id] === opt.id;
            return (
              <button
                key={opt.id}
                role="radio"
                aria-checked={selected}
                onClick={() => select(q.id, opt.id)}
                className={cn(
                  "flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left text-[14px] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-gold",
                  selected
                    ? "border-gold/60 bg-gold-dim shadow-[0_0_0_1px_rgba(201,145,10,0.25)] font-semibold text-foreground"
                    : "border-black/[0.09] bg-white text-foreground/90 hover:border-gold/35 hover:bg-gold-dim/40"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    selected ? "border-gold bg-gold text-ink" : "border-black/[0.18] text-transparent"
                  )}
                  aria-hidden="true"
                >
                  <Check size={12} strokeWidth={3.5} />
                </span>
                <span className="min-w-0 flex-1">{opt.text}</span>
              </button>
            );
          })}
        </div>
      </section>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-destructive/25 bg-destructive/[0.04] px-4 py-3 text-[13px] font-medium text-destructive">
          {error}
        </p>
      )}

      {/* nav */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrent((i) => Math.max(0, i - 1))}
          disabled={current === 0}
          className="h-11 rounded-xl border-black/[0.12] px-5"
          aria-label="Previous question"
        >
          <ChevronLeft size={16} aria-hidden="true" /> Previous
        </Button>

        {current < questions.length - 1 ? (
          <Button
            onClick={() => setCurrent((i) => Math.min(questions.length - 1, i + 1))}
            className="h-11 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 text-[14px] font-semibold text-ink shadow-gold"
          >
            {answers[q.id] ? "Next question" : "Skip for now"} <ArrowRight size={15} aria-hidden="true" />
          </Button>
        ) : (
          <Button
            onClick={() => void submit()}
            disabled={!allAnswered || submitting}
            className="h-11 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 text-[14px] font-semibold text-ink shadow-gold disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden="true" /> Grading…
              </>
            ) : allAnswered ? (
              <>
                <Trophy size={15} aria-hidden="true" /> Submit answers
              </>
            ) : (
              `Answer all ${questions.length} to submit`
            )}
          </Button>
        )}
      </div>

      {/* jump dots */}
      <nav aria-label="Jump to question" className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {questions.map((question, i) => {
          const answered = Boolean(answers[question.id]);
          return (
            <button
              key={question.id}
              onClick={() => setCurrent(i)}
              aria-label={`Go to question ${i + 1}${answered ? " (answered)" : ""}`}
              aria-current={i === current ? "true" : undefined}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border text-[12px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-gold",
                i === current
                  ? "border-gold/60 bg-gold-dim text-gold-dark"
                  : answered
                    ? "border-teal/35 bg-teal-dim text-teal"
                    : "border-black/[0.1] bg-white text-muted-foreground hover:border-gold/35"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ── helpers ── */

function optionText(quiz: StudentQuizDto, questionId: string, optionId: string | null): string {
  if (!optionId) return "— not answered —";
  const question = quiz.questions.find((q) => q.id === questionId);
  return question?.options.find((o) => o.id === optionId)?.text ?? optionId;
}

function AnswerReviewLine({ label, text, correct }: { label: string; text: string; correct: boolean }) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-baseline gap-x-2 rounded-lg border px-3.5 py-2 text-[13px]",
        correct ? "border-teal/25 bg-white/70 text-foreground" : "border-amber-400/25 bg-white/70 text-foreground"
      )}
    >
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}:</span>
      <span className="font-medium">{text}</span>
    </p>
  );
}
