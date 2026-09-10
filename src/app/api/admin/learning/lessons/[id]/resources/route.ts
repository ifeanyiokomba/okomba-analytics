import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { auditAdmin, rbacClientIp } from "@/lib/admin-rbac";
import { RESOURCE_CREATE_SCHEMA } from "@/lib/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/admin/learning/lessons/[id]/resources — §64 downloadable  */
/* material. sortOrder defaults to "append to end".                    */
/* manage_students-gated + audited.                                    */
/* ------------------------------------------------------------------ */

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
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

    const parsed = RESOURCE_CREATE_SCHEMA.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid resource payload" },
        { status: 422 }
      );
    }

    const count = await db.lessonResource.count({ where: { lessonId: id } });

    const resource = await db.lessonResource.create({
      data: {
        lessonId: id,
        title: parsed.data.title,
        url: parsed.data.url,
        kind: parsed.data.kind ?? "link",
        sortOrder: parsed.data.sortOrder ?? count + 1,
      },
    });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "learning.resource.created",
      targetType: "lesson_resource",
      targetId: resource.id,
      meta: { lessonId: id, title: resource.title, kind: resource.kind },
      ip: rbacClientIp(req),
    });

    return NextResponse.json({ ok: true, resourceId: resource.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/learning/lessons/[id]/resources]", err);
    return NextResponse.json({ ok: false, error: "Could not add the resource" }, { status: 500 });
  }
}
