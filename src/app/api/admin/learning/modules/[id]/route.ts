import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { auditAdmin, rbacClientIp } from "@/lib/admin-rbac";
import { MODULE_UPDATE_SCHEMA } from "@/lib/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* /api/admin/learning/modules/[id] — §66 module lifecycle.            */
/* PUT    → partial update (title/summary/sortOrder).                  */
/* DELETE → remove the module; cascades wipe its lessons, resources,  */
/*          quizzes, attempts and progress rows.                       */
/* ------------------------------------------------------------------ */

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
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

    const parsed = MODULE_UPDATE_SCHEMA.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid module update" },
        { status: 422 }
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 422 });
    }

    await db.module.update({ where: { id }, data: parsed.data });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "learning.module.updated",
      targetType: "module",
      targetId: id,
      meta: { fields: Object.keys(parsed.data) },
      ip: rbacClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PUT /api/admin/learning/modules/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not update the module" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "manage_students");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await ctx.params;
    const moduleRow = await db.module.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!moduleRow) {
      return NextResponse.json({ ok: false, error: "Module not found" }, { status: 404 });
    }

    await db.module.delete({ where: { id } });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "learning.module.deleted",
      targetType: "module",
      targetId: id,
      meta: { title: moduleRow.title },
      ip: rbacClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/learning/modules/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not delete the module" }, { status: 500 });
  }
}
