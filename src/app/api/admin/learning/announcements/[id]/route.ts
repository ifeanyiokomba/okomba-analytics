import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { auditAdmin, rbacClientIp } from "@/lib/admin-rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* DELETE /api/admin/learning/announcements/[id] — §64 remove a        */
/* notice. manage_students-gated + audited.                            */
/* ------------------------------------------------------------------ */

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await ctx.params;
    const announcement = await db.announcement.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!announcement) {
      return NextResponse.json({ ok: false, error: "Announcement not found" }, { status: 404 });
    }

    await db.announcement.delete({ where: { id } });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "learning.announcement.deleted",
      targetType: "announcement",
      targetId: id,
      meta: { title: announcement.title },
      ip: rbacClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/learning/announcements/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not delete the announcement" }, { status: 500 });
  }
}
