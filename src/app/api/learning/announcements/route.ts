import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/student-auth";
import { toAnnouncementDto } from "@/lib/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/learning/announcements — §64 student announcement feed.    */
/* AUTH. Latest 20 visible to this student: audience=all + any        */
/* announcement scoped to a course the student is enrolled in.        */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  const guard = await requireStudent(req);
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const enrollments = await db.enrollment.findMany({
      where: { studentId: guard.student.id },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e) => e.courseId);

    const announcements = await db.announcement.findMany({
      where: {
        OR: [{ audience: "all" }, { courseId: { in: courseIds.length ? courseIds : ["__none__"] } }],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { course: { select: { title: true } } },
    });

    return NextResponse.json({
      ok: true,
      announcements: announcements.map((a) => toAnnouncementDto(a, a.course?.title ?? null)),
    });
  } catch (err) {
    console.error("[GET /api/learning/announcements]", err);
    return NextResponse.json({ ok: false, error: "Could not load announcements" }, { status: 500 });
  }
}
