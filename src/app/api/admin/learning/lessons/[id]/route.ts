import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { auditAdmin, rbacClientIp } from "@/lib/admin-rbac";
import { LESSON_UPDATE_SCHEMA } from "@/lib/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* /api/admin/learning/lessons/[id] — §66 lesson lifecycle.            */
/* PUT    → partial update (title/kind/content/videoUrl/duration/      */
/*          isPreview/sortOrder).                                      */
/* DELETE → remove the lesson; cascades wipe resources, quiz,         */
/*          questions, attempts and progress rows.                     */
/* ------------------------------------------------------------------ */

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await ctx.params;
    const lesson = await db.lesson.findUnique({ where: { id }, select: { id: true } });
    if (!lesson) {
      return NextResponse.json({ ok: false, error: "Lesson not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = LESSON_UPDATE_SCHEMA.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid lesson update" },
        { status: 422 }
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 422 });
    }

    await db.lesson.update({ where: { id }, data: parsed.data });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "learning.lesson.updated",
      targetType: "lesson",
      targetId: id,
      meta: { fields: Object.keys(parsed.data) },
      ip: rbacClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PUT /api/admin/learning/lessons/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not update the lesson" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await ctx.params;
    const lesson = await db.lesson.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!lesson) {
      return NextResponse.json({ ok: false, error: "Lesson not found" }, { status: 404 });
    }

    await db.lesson.delete({ where: { id } });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "learning.lesson.deleted",
      targetType: "lesson",
      targetId: id,
      meta: { title: lesson.title },
      ip: rbacClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/learning/lessons/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not delete the lesson" }, { status: 500 });
  }
}
