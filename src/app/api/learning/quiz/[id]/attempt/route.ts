import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/student-auth";
import { parseQuizOptions } from "@/lib/learning";
import type { QuizAttemptResultDto } from "@/lib/learning-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/learning/quiz/[id]/attempt — §64 server-side grading.     */
/* AUTH + ENROLLED (in the course owning the quiz's lesson).          */
/*                                                                     */
/* Body { answers: [{questionId, optionId}] } → graded against the    */
/* stored correctOptionId values. scorePercent = correct/total*100    */
/* (rounded), passed = score ≥ quiz.passScore. The attempt row keeps  */
/* the submitted answer sheet; ALL attempts are retained.             */
/* correctOptionId + explanation are revealed ONLY in this response   */
/* (after grading) — never in the lesson detail payload.              */
/* ------------------------------------------------------------------ */

const attemptSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().trim().min(1),
        optionId: z.string().trim().min(1),
      })
    )
    .max(200),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireStudent(req);
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  const student = guard.student;

  try {
    const { id } = await ctx.params;
    const quiz = await db.quiz.findUnique({
      where: { id },
      include: {
        questions: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        lesson: { select: { id: true, title: true, module: { select: { courseId: true } } } },
      },
    });
    if (!quiz) {
      return NextResponse.json({ ok: false, error: "Quiz not found" }, { status: 404 });
    }

    const enrollment = await db.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId: student.id, courseId: quiz.lesson.module.courseId },
      },
    });
    if (!enrollment) {
      return NextResponse.json(
        { ok: false, error: "Enroll in this course to take this quiz" },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = attemptSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid quiz submission" },
        { status: 422 }
      );
    }

    if (quiz.questions.length === 0) {
      return NextResponse.json(
        { ok: false, error: "This quiz has no questions yet" },
        { status: 400 }
      );
    }

    // Latest answer per question wins (defensive against duplicates).
    const selectedByQuestion = new Map<string, string>();
    for (const answer of parsed.data.answers) {
      selectedByQuestion.set(answer.questionId, answer.optionId);
    }

    const results: QuizAttemptResultDto["results"] = quiz.questions.map((q) => {
      const options = parseQuizOptions(q.options);
      const selected = selectedByQuestion.get(q.id) ?? null;
      const correct = selected !== null && selected === q.correctOptionId;
      return {
        questionId: q.id,
        prompt: q.prompt,
        selectedOptionId: selected !== null && options.some((o) => o.id === selected) ? selected : null,
        correct,
        correctOptionId: q.correctOptionId,
        explanation: q.explanation,
      };
    });

    const correctCount = results.filter((r) => r.correct).length;
    const questionCount = quiz.questions.length;
    const scorePercent = Math.round((correctCount / questionCount) * 100);
    const passed = scorePercent >= quiz.passScore;

    const attempt = await db.quizAttempt.create({
      data: {
        quizId: quiz.id,
        studentId: student.id,
        answers: parsed.data.answers,
        scorePercent,
        passed,
      },
    });

    const dto: QuizAttemptResultDto = {
      attemptId: attempt.id,
      quizId: quiz.id,
      quizTitle: quiz.title,
      scorePercent,
      passScore: quiz.passScore,
      passed,
      correctCount,
      questionCount,
      results,
    };

    return NextResponse.json({ ok: true, attempt: dto }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/learning/quiz/[id]/attempt]", err);
    return NextResponse.json({ ok: false, error: "Could not submit your quiz attempt" }, { status: 500 });
  }
}
