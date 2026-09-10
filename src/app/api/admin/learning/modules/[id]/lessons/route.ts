import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { auditAdmin, rbacClientIp } from "@/lib/admin-rbac";
import { LESSON_CREATE_SCHEMA } from "@/lib/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/admin/learning/modules/[id]/lessons — §66 add a lesson.   */
/* sortOrder defaults to "append to end" (count of existing lessons   */
/* in the module). manage_students-gated + audited.                    */
/* ------------------------------------------------------------------ */

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await ctx.params;
    const moduleRow = await db.module.findUnique({ where: { id }, select: { id: true } });
    if (!moduleRow) {
      return NextResponse.json({ ok: false, error: "Module not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = LESSON_CREATE_SCHEMA.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid lesson payload" },
        { status: 422 }
      );
    }

    const count = await db.lesson.count({ where: { moduleId: id } });

    const lesson = await db.lesson.create({
      data: {
        moduleId: id,
        title: parsed.data.title,
        kind: parsed.data.kind ?? "text",
        content: parsed.data.content,
        videoUrl: parsed.data.videoUrl,
        durationMinutes: parsed.data.durationMinutes ?? 10,
        isPreview: parsed.data.isPreview ?? false,
        sortOrder: parsed.data.sortOrder ?? count + 1,
      },
    });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "learning.lesson.created",
      targetType: "lesson",
      targetId: lesson.id,
      meta: { moduleId: id, title: lesson.title, kind: lesson.kind },
      ip: rbacClientIp(req),
    });

    return NextResponse.json({ ok: true, lessonId: lesson.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/learning/modules/[id]/lessons]", err);
    return NextResponse.json({ ok: false, error: "Could not create the lesson" }, { status: 500 });
  }
}
