import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { auditAdmin, rbacClientIp } from "@/lib/admin-rbac";
import { COURSE_CREATE_SCHEMA, slugify, toCourseCardDto } from "@/lib/learning";
import type { AdminCourseDto } from "@/lib/learning-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* /api/admin/learning/courses — §64 course management (admin).        */
/*                                                                     */
/* GET  → ALL courses (incl. drafts) with counts + enrollmentCount.    */
/* POST → create a course (published defaults to false = draft;       */
/*        slug auto-derived from the title when omitted, 409 when     */
/*        the slug is taken). manage_students-gated + audited.        */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const courses = await db.course.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        modules: { select: { lessons: { select: { durationMinutes: true } } } },
        _count: { select: { enrollments: true } },
      },
    });

    const dtos: AdminCourseDto[] = courses.map((c) => ({
      ...toCourseCardDto(c),
      description: c.description,
      published: c.published,
      sortOrder: c.sortOrder,
      enrollmentCount: c._count.enrollments,
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({ ok: true, courses: dtos });
  } catch (err) {
    console.error("[GET /api/admin/learning/courses]", err);
    return NextResponse.json({ ok: false, error: "Could not load courses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = COURSE_CREATE_SCHEMA.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid course payload" },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const slug = data.slug ?? slugify(data.title);
    const clash = await db.course.findUnique({ where: { slug } });
    if (clash) {
      return NextResponse.json(
        { ok: false, error: `A course with the slug “${slug}” already exists` },
        { status: 409 }
      );
    }

    const maxSort = await db.course.aggregate({ _max: { sortOrder: true } });

    const course = await db.course.create({
      data: {
        title: data.title,
        slug,
        summary: data.summary,
        description: data.description,
        level: data.level,
        coverEmoji: data.coverEmoji,
        coverUrl: data.coverUrl,
        priceNgn: data.priceNgn,
        published: data.published ?? false,
        sortOrder: data.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "learning.course.created",
      targetType: "course",
      targetId: course.id,
      meta: { title: course.title, slug: course.slug, published: course.published },
      ip: rbacClientIp(req),
    });

    return NextResponse.json({ ok: true, courseId: course.id, slug: course.slug }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/learning/courses]", err);
    return NextResponse.json({ ok: false, error: "Could not create the course" }, { status: 500 });
  }
}
