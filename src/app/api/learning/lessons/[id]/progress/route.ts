import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/student-auth";
import { maybeAutoCompleteEnrollment } from "@/lib/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/learning/lessons/[id]/progress — §64 progress tracking.   */
/* AUTH + ENROLLED. Body {status?, secondsSpent?} → upsert            */
/* LessonProgress (unique studentId+lessonId).                        */
/*   • status=completed stamps completedAt                            */
/*   • secondsSpent accumulates (watch-time pings send deltas)        */
/*   • when EVERY lesson in the course is completed → the enrollment  */
/*     flips to completed automatically (§67 progress).               */
/* ------------------------------------------------------------------ */

const progressSchema = z
  .object({
    status: z.enum(["not_started", "in_progress", "completed"]).optional(),
    secondsSpent: z.number().int().min(0).max(3600).optional(),
  })
  .refine((b) => b.status !== undefined || b.secondsSpent !== undefined, {
    message: "Provide a status or secondsSpent",
  });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireStudent(req);
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  const student = guard.student;

  try {
    const { id } = await ctx.params;
    const lesson = await db.lesson.findUnique({
      where: { id },
      select: { id: true, module: { select: { courseId: true } } },
    });
    if (!lesson) {
      return NextResponse.json({ ok: false, error: "Lesson not found" }, { status: 404 });
    }

    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: student.id, courseId: lesson.module.courseId } },
    });
    if (!enrollment) {
      return NextResponse.json(
        { ok: false, error: "Enroll in this course to track your progress" },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = progressSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid progress update" },
        { status: 422 }
      );
    }

    const { status, secondsSpent } = parsed.data;
    const now = new Date();

    const progress = await db.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId: student.id, lessonId: lesson.id } },
      create: {
        studentId: student.id,
        lessonId: lesson.id,
        status: status ?? "in_progress",
        secondsSpent: secondsSpent ?? 0,
        completedAt: status === "completed" ? now : null,
      },
      update: {
        ...(status !== undefined ? { status } : {}),
        ...(secondsSpent !== undefined ? { secondsSpent: { increment: secondsSpent } } : {}),
        ...(status === "completed"
          ? { completedAt: now }
          : status !== undefined
            ? { completedAt: null } // leaving "completed" clears the stamp
            : {}),
      },
    });

    // §64 auto-completion: all lessons completed → enrollment completed.
    const courseCompleted =
      status === "completed"
        ? await maybeAutoCompleteEnrollment(student.id, lesson.module.courseId)
        : false;

    return NextResponse.json({
      ok: true,
      progress: {
        lessonId: lesson.id,
        status: progress.status,
        secondsSpent: progress.secondsSpent,
        completedAt: progress.completedAt?.toISOString() ?? null,
      },
      courseCompleted,
    });
  } catch (err) {
    console.error("[POST /api/learning/lessons/[id]/progress]", err);
    return NextResponse.json({ ok: false, error: "Could not save your progress" }, { status: 500 });
  }
}
