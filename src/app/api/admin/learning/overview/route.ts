import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import type { AdminOverviewDto } from "@/lib/learning-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/admin/learning/overview — §64 education overview counters  */
/* for the admin education tools: students, active students (session  */
/* or progress within 30d), courses, enrollments, completions, quiz   */
/* pass rate, announcements + the 10 most recent signups.             */
/* manage_students-gated.                                              */
/* ------------------------------------------------------------------ */

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const since = new Date(Date.now() - THIRTY_DAYS_MS);

    const [
      studentCount,
      recentSessionStudents,
      recentProgressStudents,
      publishedCourseCount,
      draftCourseCount,
      enrollmentCount,
      completionCount,
      quizAttemptCount,
      quizPassedCount,
      announcementCount,
      recentSignups,
    ] = await Promise.all([
      db.student.count(),
      db.studentSession.findMany({
        where: { expiresAt: { gte: since } },
        select: { studentId: true },
        distinct: ["studentId"],
      }),
      db.lessonProgress.findMany({
        where: { updatedAt: { gte: since } },
        select: { studentId: true },
        distinct: ["studentId"],
      }),
      db.course.count({ where: { published: true } }),
      db.course.count({ where: { published: false } }),
      db.enrollment.count(),
      db.enrollment.count({ where: { status: "completed" } }),
      db.quizAttempt.count(),
      db.quizAttempt.count({ where: { passed: true } }),
      db.announcement.count(),
      db.student.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
    ]);

    const activeIds = new Set([
      ...recentSessionStudents.map((s) => s.studentId),
      ...recentProgressStudents.map((s) => s.studentId),
    ]);

    const dto: AdminOverviewDto = {
      studentCount,
      activeStudentCount: activeIds.size,
      publishedCourseCount,
      draftCourseCount,
      enrollmentCount,
      completionCount,
      quizAttemptCount,
      quizPassRate: quizAttemptCount === 0 ? null : Math.round((quizPassedCount / quizAttemptCount) * 100),
      announcementCount,
      recentSignups: recentSignups.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        createdAt: s.createdAt.toISOString(),
      })),
    };

    // Reads are not audited (house style: mutations only).

    return NextResponse.json({ ok: true, overview: dto });
  } catch (err) {
    console.error("[GET /api/admin/learning/overview]", err);
    return NextResponse.json({ ok: false, error: "Could not load the learning overview" }, { status: 500 });
  }
}
