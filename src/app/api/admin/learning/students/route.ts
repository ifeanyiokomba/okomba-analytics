import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import type { AdminStudentRowDto } from "@/lib/learning-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/admin/learning/students — §64/§65 student roster.          */
/* ?q= search (name/email contains), ?limit= (≤200, default 100).     */
/* Each row: enrolled course count, average progress percent across  */
/* enrolled courses, last activity (latest progress/quiz event).      */
/* manage_students-gated.                                              */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const limitRaw = Number(url.searchParams.get("limit") ?? "100");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 200) : 100;

    const students = await db.student.findMany({
      where: q
        ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        status: true,
        createdAt: true,
        enrollments: {
          select: {
            courseId: true,
            course: { select: { modules: { select: { lessons: { select: { id: true } } } } } },
          },
        },
      },
    });

    if (students.length === 0) {
      return NextResponse.json({ ok: true, students: [] });
    }

    const studentIds = students.map((s) => s.id);

    const [progressRows, lastProgress, lastAttempt] = await Promise.all([
      db.lessonProgress.findMany({
        where: { studentId: { in: studentIds } },
        select: { studentId: true, lessonId: true, status: true },
      }),
      db.lessonProgress.groupBy({
        by: ["studentId"],
        where: { studentId: { in: studentIds } },
        _max: { updatedAt: true },
      }),
      db.quizAttempt.groupBy({
        by: ["studentId"],
        where: { studentId: { in: studentIds } },
        _max: { submittedAt: true },
      }),
    ]);

    const completedByStudent = new Map<string, Set<string>>();
    for (const row of progressRows) {
      if (row.status !== "completed") continue;
      const set = completedByStudent.get(row.studentId) ?? new Set<string>();
      set.add(row.lessonId);
      completedByStudent.set(row.studentId, set);
    }
    const lastProgressByStudent = new Map(lastProgress.map((g) => [g.studentId, g._max.updatedAt]));
    const lastAttemptByStudent = new Map(lastAttempt.map((g) => [g.studentId, g._max.submittedAt]));

    const dtos: AdminStudentRowDto[] = students.map((s) => {
      const completed = completedByStudent.get(s.id) ?? new Set<string>();
      let totalLessons = 0;
      for (const enrollment of s.enrollments) {
        totalLessons += enrollment.course.modules.flatMap((m) => m.lessons.map((l) => l.id)).length;
      }
      const avgProgress =
        totalLessons === 0
          ? 0
          : Math.round((Math.min(completed.size, totalLessons) / totalLessons) * 100);

      const candidates = [
        lastProgressByStudent.get(s.id) ?? null,
        lastAttemptByStudent.get(s.id) ?? null,
      ].filter((d): d is Date => d instanceof Date);
      const lastActivityAt = candidates.length
        ? new Date(Math.max(...candidates.map((d) => d.getTime()))).toISOString()
        : null;

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        country: s.country,
        status: s.status === "suspended" ? "suspended" : "active",
        enrolledCourseCount: s.enrollments.length,
        avgProgressPercent: avgProgress,
        lastActivityAt,
        createdAt: s.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ ok: true, students: dtos });
  } catch (err) {
    console.error("[GET /api/admin/learning/students]", err);
    return NextResponse.json({ ok: false, error: "Could not load the student roster" }, { status: 500 });
  }
}
