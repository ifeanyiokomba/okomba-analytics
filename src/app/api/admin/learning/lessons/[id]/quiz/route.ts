import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { auditAdmin, rbacClientIp } from "@/lib/admin-rbac";
import { QUIZ_UPSERT_SCHEMA } from "@/lib/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/admin/learning/lessons/[id]/quiz — §64 create-or-replace  */
/* a lesson's quiz (one per lesson — lessonId is unique).              */
/*                                                                     */
/* Body { title, passScore?, questions: [{ prompt, options:[{id,text}],*/
/* correctOptionId, explanation?, sortOrder? }] }. Runs in a          */
/* TRANSACTION: the old quiz (and its questions + attempts) is        */
/* deleted, then the full question list is inserted atomically.       */
/* manage_students-gated + audited.                                    */
/* ------------------------------------------------------------------ */

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await ctx.params;
    const lesson = await db.lesson.findUnique({ where: { id }, select: { id: true } });
    if (!lesson) {
      return NextResponse.json({ ok: false, error: "Lesson not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = QUIZ_UPSERT_SCHEMA.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid quiz payload" },
        { status: 422 }
      );
    }

    const { title, passScore, questions } = parsed.data;

    const quizId = await db.$transaction(async (tx) => {
      // Replace semantics: drop the previous quiz (cascades questions
      // + attempts) then insert the new full question list.
      await tx.quiz.deleteMany({ where: { lessonId: id } });
      const quiz = await tx.quiz.create({
        data: {
          lessonId: id,
          title,
          passScore: passScore ?? 70,
        },
      });
      for (const [index, q] of questions.entries()) {
        await tx.quizQuestion.create({
          data: {
            quizId: quiz.id,
            prompt: q.prompt,
            options: q.options,
            correctOptionId: q.correctOptionId,
            explanation: q.explanation,
            sortOrder: q.sortOrder ?? index + 1,
          },
        });
      }
      return quiz.id;
    });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "learning.quiz.saved",
      targetType: "quiz",
      targetId: quizId,
      meta: { lessonId: id, title, questionCount: questions.length, passScore: passScore ?? 70 },
      ip: rbacClientIp(req),
    });

    return NextResponse.json({ ok: true, quizId }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/learning/lessons/[id]/quiz]", err);
    return NextResponse.json({ ok: false, error: "Could not save the quiz" }, { status: 500 });
  }
}
