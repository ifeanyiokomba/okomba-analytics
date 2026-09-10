import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { parseQuizOptions } from "@/lib/learning";
import type { AdminQuizDto } from "@/lib/learning-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/admin/learning/quiz/[id] — §64 quiz editor view.           */
/* WITH correctOptionId + explanations (unlike the student view,      */
/* which never sees them before grading) + attempt stats.             */
/* manage_students-gated.                                              */
/* ------------------------------------------------------------------ */

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await ctx.params;
    const quiz = await db.quiz.findUnique({
      where: { id },
      include: {
        questions: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        lesson: { select: { id: true, title: true } },
        _count: { select: { attempts: true } },
      },
    });
    if (!quiz) {
      return NextResponse.json({ ok: false, error: "Quiz not found" }, { status: 404 });
    }

    const passed = await db.quizAttempt.count({ where: { quizId: id, passed: true } });

    const dto: AdminQuizDto = {
      id: quiz.id,
      lessonId: quiz.lessonId,
      lessonTitle: quiz.lesson.title,
      title: quiz.title,
      passScore: quiz.passScore,
      questionCount: quiz.questions.length,
      attemptCount: quiz._count.attempts,
      passRate: quiz._count.attempts === 0 ? null : Math.round((passed / quiz._count.attempts) * 100),
      questions: quiz.questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: parseQuizOptions(q.options),
        correctOptionId: q.correctOptionId,
        explanation: q.explanation,
        sortOrder: q.sortOrder,
      })),
    };

    return NextResponse.json({ ok: true, quiz: dto });
  } catch (err) {
    console.error("[GET /api/admin/learning/quiz/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not load the quiz" }, { status: 500 });
  }
}
