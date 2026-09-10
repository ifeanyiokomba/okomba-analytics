import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/student-auth";
import { toStudentPublicDto } from "@/lib/learning";
import type { StudentMeDto } from "@/lib/learning-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/learning/auth/me — §65 "who am I" probe for the portal.    */
/* Returns the public DTO + enrolledCourseCount + completed lessons   */
/* + overall progress percent across all enrolled courses.            */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  const guard = await requireStudent(req);
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  const student = guard.student;

  try {
    const enrollments = await db.enrollment.findMany({
      where: { studentId: student.id },
      select: {
        courseId: true,
        course: { select: { modules: { select: { lessons: { select: { id: true } } } } } },
      },
    });

    const lessonIds = enrollments.flatMap((e) => e.course.modules.flatMap((m) => m.lessons.map((l) => l.id)));
    const completedLessons =
      lessonIds.length === 0
        ? 0
        : await db.lessonProgress.count({
            where: { studentId: student.id, lessonId: { in: lessonIds }, status: "completed" },
          });

    const overall =
      lessonIds.length === 0 ? 0 : Math.round((completedLessons / lessonIds.length) * 100);

    const dto: StudentMeDto = {
      ...toStudentPublicDto(student),
      enrolledCourseCount: enrollments.length,
      completedLessonCount: completedLessons,
      overallProgressPercent: overall,
    };

    return NextResponse.json({ ok: true, student: dto });
  } catch (err) {
    console.error("[GET /api/learning/auth/me]", err);
    return NextResponse.json({ ok: false, error: "Could not load your profile" }, { status: 500 });
  }
}
