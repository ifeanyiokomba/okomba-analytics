import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { auditAdmin, rbacClientIp } from "@/lib/admin-rbac";
import { toStudentPublicDto } from "@/lib/learning";
import type { AdminStudentDetailDto, AdminStudentEnrollmentDto } from "@/lib/learning-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* /api/admin/learning/students/[id] — §64 student detail + lifecycle. */
/*                                                                     */
/* GET → full profile: public fields, linkedCustomerEmail,            */
/*      enrollments (with per-course progress percent), ALL quiz      */
/*      attempts, progress rows summary. passwordHash NEVER included. */
/* PUT → { status: "active" | "suspended" } suspend/reactivate.       */
/*      Suspending revokes live sessions immediately.                 */
/* ------------------------------------------------------------------ */

const statusSchema = z.object({
  status: z.enum(["active", "suspended"]),
});

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await ctx.params;
    const student = await db.student.findUnique({
      where: { id },
      include: {
        enrollments: {
          orderBy: { enrolledAt: "asc" },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                modules: { select: { lessons: { select: { id: true } } } },
              },
            },
          },
        },
        quizAttempts: {
          orderBy: { submittedAt: "desc" },
          take: 100,
          include: {
            quiz: {
              select: { title: true, lesson: { select: { title: true } } },
            },
          },
        },
        progress: { orderBy: { updatedAt: "desc" }, take: 200 },
      },
    });
    if (!student) {
      return NextResponse.json({ ok: false, error: "Student not found" }, { status: 404 });
    }

    const completedLessonIds = new Set(
      student.progress.filter((p) => p.status === "completed").map((p) => p.lessonId)
    );

    const enrollments: AdminStudentEnrollmentDto[] = student.enrollments.map((e) => {
      const lessonIds = e.course.modules.flatMap((m) => m.lessons.map((l) => l.id));
      const completed = lessonIds.filter((lessonId) => completedLessonIds.has(lessonId)).length;
      return {
        courseId: e.course.id,
        courseTitle: e.course.title,
        courseSlug: e.course.slug,
        status: e.status === "completed" ? "completed" : "active",
        enrolledAt: e.enrolledAt.toISOString(),
        completedAt: e.completedAt?.toISOString() ?? null,
        progressPercent: lessonIds.length === 0 ? 0 : Math.round((completed / lessonIds.length) * 100),
      };
    });

    // Row-level aggregates (AdminStudentRowDto contract shared with the
    // list endpoint): count, average progress, last touch timestamp.
    const avgProgressPercent =
      enrollments.length === 0
        ? 0
        : Math.round(enrollments.reduce((sum, e) => sum + e.progressPercent, 0) / enrollments.length);
    const lastActivityCandidates: Date[] = [];
    if (student.progress.length > 0) lastActivityCandidates.push(student.progress[0].updatedAt);
    if (student.quizAttempts.length > 0) lastActivityCandidates.push(student.quizAttempts[0].submittedAt);
    const lastActivityAt = lastActivityCandidates.length
      ? new Date(Math.max(...lastActivityCandidates.map((d) => d.getTime()))).toISOString()
      : null;

    const dto: AdminStudentDetailDto = {
      ...toStudentPublicDto(student),
      avatarUrl: student.avatarUrl,
      linkedCustomerEmail: student.linkedCustomerEmail,
      enrolledCourseCount: enrollments.length,
      avgProgressPercent,
      lastActivityAt,
      enrollments,
      attempts: student.quizAttempts.map((a) => ({
        id: a.id,
        quizTitle: a.quiz.title,
        lessonTitle: a.quiz.lesson.title,
        scorePercent: a.scorePercent,
        passed: a.passed,
        submittedAt: a.submittedAt.toISOString(),
      })),
    };

    return NextResponse.json({
      ok: true,
      student: dto,
      progressCount: student.progress.length,
    });
  } catch (err) {
    console.error("[GET /api/admin/learning/students/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not load the student" }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await ctx.params;
    const student = await db.student.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!student) {
      return NextResponse.json({ ok: false, error: "Student not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid status update" },
        { status: 422 }
      );
    }

    await db.student.update({ where: { id }, data: { status: parsed.data.status } });

    // Suspending revokes every live session immediately (§65).
    if (parsed.data.status === "suspended") {
      await db.studentSession.deleteMany({ where: { studentId: id } });
    }

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: parsed.data.status === "suspended" ? "learning.student.suspended" : "learning.student.reactivated",
      targetType: "student",
      targetId: id,
      ip: rbacClientIp(req),
    });

    return NextResponse.json({ ok: true, status: parsed.data.status });
  } catch (err) {
    console.error("[PUT /api/admin/learning/students/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not update the student" }, { status: 500 });
  }
}
