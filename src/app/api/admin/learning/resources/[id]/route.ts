import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { auditAdmin, rbacClientIp } from "@/lib/admin-rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* DELETE /api/admin/learning/resources/[id] — §64 remove a download.  */
/* manage_students-gated + audited.                                     */
/* ------------------------------------------------------------------ */

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await ctx.params;
    const resource = await db.lessonResource.findUnique({
      where: { id },
      select: { id: true, title: true, lessonId: true },
    });
    if (!resource) {
      return NextResponse.json({ ok: false, error: "Resource not found" }, { status: 404 });
    }

    await db.lessonResource.delete({ where: { id } });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "learning.resource.deleted",
      targetType: "lesson_resource",
      targetId: id,
      meta: { title: resource.title, lessonId: resource.lessonId },
      ip: rbacClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/learning/resources/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not delete the resource" }, { status: 500 });
  }
}
