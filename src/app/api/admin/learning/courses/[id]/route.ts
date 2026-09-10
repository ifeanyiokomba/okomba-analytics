import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { auditAdmin, rbacClientIp } from "@/lib/admin-rbac";
import { COURSE_UPDATE_SCHEMA, normalizeLessonKind, normalizeResourceKind, toCourseCardDto } from "@/lib/learning";
import type { AdminCourseDetailDto } from "@/lib/learning-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* /api/admin/learning/courses/[id] — §64 course detail + lifecycle.   */
/*                                                                     */
/* GET    → full authoring view: modules + lessons WITH content,      */
/*          resources, quiz summaries + counts.                       */
/* PUT    → partial update (title/summary/description/level/cover/    */
/*          price/published/sortOrder).                               */
/* DELETE → remove the course; cascades wipe modules, lessons,        */
/*          resources, quizzes, attempts, enrollments, progress and   */
/*          its course-scoped announcements.                          */
/* ------------------------------------------------------------------ */

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await ctx.params;
    const course = await db.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            lessons: {
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
              include: {
                resources: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
                quiz: { select: { id: true, title: true, passScore: true, questions: { select: { id: true } } } },
              },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) {
      return NextResponse.json({ ok: false, error: "Course not found" }, { status: 404 });
    }

    const dto: AdminCourseDetailDto = {
      ...toCourseCardDto(course),
      description: course.description,
      published: course.published,
      sortOrder: course.sortOrder,
      enrollmentCount: course._count.enrollments,
      createdAt: course.createdAt.toISOString(),
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        summary: m.summary,
        sortOrder: m.sortOrder,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          kind: normalizeLessonKind(l.kind),
          content: l.content,
          videoUrl: l.videoUrl,
          durationMinutes: l.durationMinutes,
          isPreview: l.isPreview,
          sortOrder: l.sortOrder,
          resources: l.resources.map((r) => ({
            id: r.id,
            title: r.title,
            url: r.url,
            kind: normalizeResourceKind(r.kind),
            sortOrder: r.sortOrder,
          })),
          quiz: l.quiz
            ? {
                id: l.quiz.id,
                title: l.quiz.title,
                passScore: l.quiz.passScore,
                questionCount: l.quiz.questions.length,
              }
            : null,
        })),
      })),
    };

    return NextResponse.json({ ok: true, course: dto });
  } catch (err) {
    console.error("[GET /api/admin/learning/courses/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not load the course" }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await ctx.params;
    const course = await db.course.findUnique({ where: { id }, select: { id: true } });
    if (!course) {
      return NextResponse.json({ ok: false, error: "Course not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = COURSE_UPDATE_SCHEMA.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid course update" },
        { status: 422 }
      );
    }

    const data = parsed.data;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 422 });
    }

    await db.course.update({ where: { id }, data });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "learning.course.updated",
      targetType: "course",
      targetId: id,
      meta: { fields: Object.keys(data) },
      ip: rbacClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PUT /api/admin/learning/courses/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not update the course" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await ctx.params;
    const course = await db.course.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!course) {
      return NextResponse.json({ ok: false, error: "Course not found" }, { status: 404 });
    }

    await db.course.delete({ where: { id } });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "learning.course.deleted",
      targetType: "course",
      targetId: id,
      meta: { title: course.title },
      ip: rbacClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/learning/courses/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not delete the course" }, { status: 500 });
  }
}
