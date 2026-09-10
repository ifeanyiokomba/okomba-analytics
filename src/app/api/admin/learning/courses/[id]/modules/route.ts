import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { auditAdmin, rbacClientIp } from "@/lib/admin-rbac";
import { MODULE_CREATE_SCHEMA } from "@/lib/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/admin/learning/courses/[id]/modules — §66 add a module.   */
/* sortOrder defaults to "append to end" (count of existing modules). */
/* manage_students-gated + audited.                                    */
/* ------------------------------------------------------------------ */

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
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

    const parsed = MODULE_CREATE_SCHEMA.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid module payload" },
        { status: 422 }
      );
    }

    const count = await db.module.count({ where: { courseId: id } });

    const moduleRow = await db.module.create({
      data: {
        courseId: id,
        title: parsed.data.title,
        summary: parsed.data.summary,
        sortOrder: parsed.data.sortOrder ?? count + 1,
      },
    });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "learning.module.created",
      targetType: "module",
      targetId: moduleRow.id,
      meta: { courseId: id, title: moduleRow.title },
      ip: rbacClientIp(req),
    });

    return NextResponse.json({ ok: true, moduleId: moduleRow.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/learning/courses/[id]/modules]", err);
    return NextResponse.json({ ok: false, error: "Could not create the module" }, { status: 500 });
  }
}
