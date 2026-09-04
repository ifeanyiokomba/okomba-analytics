import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { ADMIN_PERMISSIONS, auditAdmin, MASTER_ROLE_KEY, rbacClientIp } from "@/lib/admin-rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* PATCH /api/admin/roles/[key] — edit a role's capabilities (§44).
   super_admin is enforced unrestricted in code and cannot be edited. */

const patchSchema = z.object({
  label: z.string().trim().min(2).max(60).optional(),
  description: z.string().trim().max(200).optional(),
  permissions: z.array(z.enum(ADMIN_PERMISSIONS)).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ key: string }> }) {
  const guard = await authorizeAdmin(req, "manage_admins");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    const { key } = await ctx.params;
    if (key === MASTER_ROLE_KEY) {
      return NextResponse.json(
        { ok: false, error: "The Super Admin role is unrestricted by design and cannot be edited" },
        { status: 403 }
      );
    }
    const role = await db.adminRole.findUnique({ where: { key } });
    if (!role) {
      return NextResponse.json({ ok: false, error: "Role not found" }, { status: 404 });
    }

    const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ ok: false, error: first?.message ?? "Invalid update" }, { status: 422 });
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.label !== undefined) data.label = parsed.data.label;
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.permissions !== undefined) {
      if (parsed.data.permissions.length === 0) {
        return NextResponse.json({ ok: false, error: "Grant at least one capability" }, { status: 422 });
      }
      data.permissions = parsed.data.permissions;
    }

    const updated = await db.adminRole.update({ where: { key }, data });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "role.update",
      targetType: "admin_role",
      targetId: key,
      meta: { permissions: updated.permissions },
      ip: rbacClientIp(req),
    });

    return NextResponse.json({ ok: true, role: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/roles/[key]]", err);
    return NextResponse.json({ ok: false, error: "Could not update role" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ key: string }> }) {
  const guard = await authorizeAdmin(req, "manage_admins");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    const { key } = await ctx.params;
    if (key === MASTER_ROLE_KEY) {
      return NextResponse.json({ ok: false, error: "The Super Admin role cannot be deleted" }, { status: 403 });
    }
    const role = await db.adminRole.findUnique({ where: { key } });
    if (!role) {
      return NextResponse.json({ ok: false, error: "Role not found" }, { status: 404 });
    }
    const inUse = await db.adminUser.count({ where: { roleKey: key } });
    if (inUse > 0) {
      return NextResponse.json(
        { ok: false, error: `${inUse} admin(s) still use this role — reassign them first` },
        { status: 409 }
      );
    }
    // System roles are never hard-deleted (they re-seed anyway) — custom
    // roles can be removed.
    if (role.isSystem) {
      return NextResponse.json({ ok: false, error: "System roles cannot be deleted" }, { status: 403 });
    }
    await db.adminRole.delete({ where: { key } });
    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "role.delete",
      targetType: "admin_role",
      targetId: key,
      ip: rbacClientIp(req),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/roles/[key]]", err);
    return NextResponse.json({ ok: false, error: "Could not delete role" }, { status: 500 });
  }
}
