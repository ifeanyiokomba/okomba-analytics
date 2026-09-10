import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { auditAdmin, rbacClientIp } from "@/lib/admin-rbac";
import { ANNOUNCEMENT_CREATE_SCHEMA, toAnnouncementDto } from "@/lib/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* /api/admin/learning/announcements — §64 admin-posted notices.       */
/*                                                                     */
/* GET  → latest 100 with course titles.                               */
/* POST → { title, body, audience?: all|course, courseId? } — course  */
/*        audience REQUIRES an existing courseId (422/404).           */
/* manage_students-gated + audited.                                    */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const announcements = await db.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { course: { select: { title: true } } },
    });

    return NextResponse.json({
      ok: true,
      announcements: announcements.map((a) => toAnnouncementDto(a, a.course?.title ?? null)),
    });
  } catch (err) {
    console.error("[GET /api/admin/learning/announcements]", err);
    return NextResponse.json({ ok: false, error: "Could not load announcements" }, { status: 500 });
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

    const parsed = ANNOUNCEMENT_CREATE_SCHEMA.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid announcement payload" },
        { status: 422 }
      );
    }

    const { title, body: text, audience, courseId } = parsed.data;
    const resolvedAudience = audience ?? "all";

    if (resolvedAudience === "course") {
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { id: true },
      });
      if (!course) {
        return NextResponse.json({ ok: false, error: "Course not found for this announcement" }, { status: 404 });
      }
    }

    const announcement = await db.announcement.create({
      data: {
        title,
        body: text,
        audience: resolvedAudience,
        courseId: resolvedAudience === "course" ? courseId : null,
      },
    });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "learning.announcement.created",
      targetType: "announcement",
      targetId: announcement.id,
      meta: { title, audience: resolvedAudience, courseId: announcement.courseId },
      ip: rbacClientIp(req),
    });

    return NextResponse.json(
      { ok: true, announcementId: announcement.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/learning/announcements]", err);
    return NextResponse.json({ ok: false, error: "Could not post the announcement" }, { status: 500 });
  }
}
