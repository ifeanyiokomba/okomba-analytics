import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentAuth } from "@/lib/student-auth";
import { courseProgressPercent, toCourseDetailDto, type CourseDetailRow } from "@/lib/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/learning/courses/[slug] — §64/§66 PUBLIC course detail.    */
/*                                                                     */
/* Modules + lessons with §66 CONTENT GATING: a lesson's `content` /   */
/* `videoUrl` fields are included ONLY when the caller is enrolled OR */
/* the lesson is flagged isPreview (free preview). Anonymous callers  */
/* see titles / duration / kind / isPreview / quiz counts only.       */
/* Enrolled callers also get their own per-lesson progress rows + a   */
/* course-level progressPercent. The ?preview=1 param is accepted and */
/* simply re-affirms preview-lesson visibility for non-enrolled hits. */
/* ------------------------------------------------------------------ */

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const course = (await db.course.findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            lessons: {
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
              include: { quiz: { select: { id: true, questions: { select: { id: true } } } } },
            },
          },
        },
      },
    })) as CourseDetailRow | null;

    if (!course || !course.published) {
      return NextResponse.json({ ok: false, error: "Course not found" }, { status: 404 });
    }

    // Optional auth: enrolled students unlock full content + progress.
    const student = await getStudentAuth(req);
    let enrollment: { status: string } | null = null;
    if (student) {
      enrollment = await db.enrollment.findUnique({
        where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
        select: { status: true },
      });
    }

    const progressByLessonId = new Map<string, { status: string; secondsSpent: number; completedAt: Date | null }>();
    let progressPercent: number | null = null;
    if (student && enrollment) {
      const rows = await db.lessonProgress.findMany({
        where: {
          studentId: student.id,
          lesson: { module: { courseId: course.id } },
        },
        select: { lessonId: true, status: true, secondsSpent: true, completedAt: true },
      });
      for (const row of rows) {
        progressByLessonId.set(row.lessonId, {
          status: row.status,
          secondsSpent: row.secondsSpent,
          completedAt: row.completedAt,
        });
      }
      const p = await courseProgressPercent(student.id, course.id);
      progressPercent = p.percent;
    }

    const dto = toCourseDetailDto(course, {
      enrolled: !!enrollment,
      enrollmentStatus: enrollment?.status ?? null,
      progressPercent,
      progressByLessonId,
    });

    return NextResponse.json({ ok: true, course: dto });
  } catch (err) {
    console.error("[GET /api/learning/courses/[slug]]", err);
    return NextResponse.json({ ok: false, error: "Could not load this course" }, { status: 500 });
  }
}
