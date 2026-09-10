import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentAuth } from "@/lib/student-auth";
import { normalizeProgressStatus, normalizeLessonKind, normalizeResourceKind, parseQuizOptions } from "@/lib/learning";
import type { LessonDetailDto } from "@/lib/learning-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/learning/lessons/[id] — §66 full lesson content.           */
/* Auth is OPTIONAL: preview lessons (isPreview) are free samples —   */
/* their content is already public via the course-detail route, so    */
/* anonymous visitors may open them directly. Non-preview lessons     */
/* require ENROLLMENT (logged-in students only). Returns the body,    */
/* resources, the student's progress row and the lesson's quiz with   */
/* questions — correctOptionId NEVER included (it only appears in     */
/* the POST /api/learning/quiz/[id]/attempt grading response).        */
/* ------------------------------------------------------------------ */

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const lesson = await db.lesson.findUnique({
      where: { id },
      include: {
        module: {
          select: { id: true, title: true, courseId: true, course: { select: { id: true, slug: true, title: true } } },
        },
        resources: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        quiz: {
          include: { questions: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
        },
      },
    });
    if (!lesson) {
      return NextResponse.json({ ok: false, error: "Lesson not found" }, { status: 404 });
    }

    const student = await getStudentAuth(req);
    const enrollment = student
      ? await db.enrollment.findUnique({
          where: {
            studentId_courseId: { studentId: student.id, courseId: lesson.module.courseId },
          },
        })
      : null;
    if (!enrollment && !lesson.isPreview) {
      return NextResponse.json(
        { ok: false, error: student ? "Enroll in this course to open this lesson" : "Sign in and enroll to open this lesson" },
        { status: 403 }
      );
    }

    const progress =
      enrollment && student
        ? await db.lessonProgress.findUnique({
            where: { studentId_lessonId: { studentId: student.id, lessonId: lesson.id } },
          })
        : null;

    const dto: LessonDetailDto = {
      id: lesson.id,
      courseId: lesson.module.course.id,
      courseSlug: lesson.module.course.slug,
      courseTitle: lesson.module.course.title,
      moduleId: lesson.module.id,
      moduleTitle: lesson.module.title,
      title: lesson.title,
      kind: normalizeLessonKind(lesson.kind),
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      durationMinutes: lesson.durationMinutes,
      isPreview: lesson.isPreview,
      resources: lesson.resources.map((r) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        kind: normalizeResourceKind(r.kind),
        sortOrder: r.sortOrder,
      })),
      quiz: lesson.quiz
        ? {
            id: lesson.quiz.id,
            title: lesson.quiz.title,
            passScore: lesson.quiz.passScore,
            questionCount: lesson.quiz.questions.length,
            questions: lesson.quiz.questions.map((q) => ({
              id: q.id,
              prompt: q.prompt,
              options: parseQuizOptions(q.options),
              sortOrder: q.sortOrder,
            })),
          }
        : null,
      progress: progress
        ? {
            status: normalizeProgressStatus(progress.status),
            secondsSpent: progress.secondsSpent,
            completedAt: progress.completedAt?.toISOString() ?? null,
          }
        : null,
    };

    return NextResponse.json({ ok: true, lesson: dto, enrolled: !!enrollment });
  } catch (err) {
    console.error("[GET /api/learning/lessons/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not load this lesson" }, { status: 500 });
  }
}
