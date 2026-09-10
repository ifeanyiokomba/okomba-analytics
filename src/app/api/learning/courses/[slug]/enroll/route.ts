import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/student-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/learning/courses/[slug]/enroll — §64 enrollment.          */
/* AUTH required. IDEMPOTENT: re-enrolling returns the existing row   */
/* with 200 (not 409). Unpublished courses 404; drafts can't be       */
/* enrolled into even with a valid slug.                              */
/* ------------------------------------------------------------------ */

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const guard = await requireStudent(req);
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  const student = guard.student;

  try {
    const { slug } = await ctx.params;
    const course = await db.course.findUnique({ where: { slug }, select: { id: true, published: true, title: true } });
    if (!course || !course.published) {
      return NextResponse.json({ ok: false, error: "Course not found" }, { status: 404 });
    }

    const existing = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
    });
    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyEnrolled: true,
        enrollment: {
          id: existing.id,
          status: existing.status,
          enrolledAt: existing.enrolledAt.toISOString(),
          completedAt: existing.completedAt?.toISOString() ?? null,
        },
        courseTitle: course.title,
      });
    }

    const enrollment = await db.enrollment.create({
      data: { studentId: student.id, courseId: course.id, status: "active" },
    });

    return NextResponse.json(
      {
        ok: true,
        alreadyEnrolled: false,
        enrollment: {
          id: enrollment.id,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt.toISOString(),
          completedAt: null,
        },
        courseTitle: course.title,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/learning/courses/[slug]/enroll]", err);
    return NextResponse.json({ ok: false, error: "Could not enroll in this course" }, { status: 500 });
  }
}
