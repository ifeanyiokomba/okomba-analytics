import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeAdmin, ensureRbacSeeded } from "@/lib/admin-auth";
import { ADMIN_PERMISSIONS, auditAdmin, rbacClientIp } from "@/lib/admin-rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────────────
   BATCH 7 (§44/§45) — Role management.

   GET  /api/admin/roles          list roles (manage_admins)
   POST /api/admin/roles          create a custom role (manage_admins)
   PATCH /api/admin/roles/[key]   edit capabilities / label (§44
                                  "configurable capabilities")
   ───────────────────────────────────────────────────────────────── */

const createSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_]+$/, "Key must be lowercase letters, numbers and underscores"),
  label: z.string().trim().min(2).max(60),
  description: z.string().trim().max(200).optional(),
  permissions: z.array(z.enum(ADMIN_PERMISSIONS)).min(1, "Grant at least one capability"),
});

export async function GET() {
  const guard = await authorizeAdmin(undefined, "manage_admins");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    await ensureRbacSeeded().catch(() => {});
    const roles = await db.adminRole.findMany({ orderBy: { key: "asc" } });
    const permissionLabels = Object.fromEntries(
      ADMIN_PERMISSIONS.map((p) => [p, p])
    );
    return NextResponse.json({ ok: true, roles, permissions: permissionLabels });
  } catch (err) {
    console.error("[GET /api/admin/roles]", err);
    return NextResponse.json({ ok: false, error: "Could not load roles" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const guard = await authorizeAdmin(req, "manage_admins");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ ok: false, error: first?.message ?? "Invalid role" }, { status: 422 });
    }
    const existing = await db.adminRole.findUnique({ where: { key: parsed.data.key } });
    if (existing) {
      return NextResponse.json({ ok: false, error: `Role "${parsed.data.key}" already exists` }, { status: 409 });
    }
    const role = await db.adminRole.create({
      data: {
        key: parsed.data.key,
        label: parsed.data.label,
        description: parsed.data.description ?? "",
        permissions: parsed.data.permissions,
        isSystem: false,
      },
    });
    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "role.create",
      targetType: "admin_role",
      targetId: role.key,
      meta: { label: role.label, permissions: role.permissions },
      ip: rbacClientIp(req),
    });
    return NextResponse.json({ ok: true, role });
  } catch (err) {
    console.error("[POST /api/admin/roles]", err);
    return NextResponse.json({ ok: false, error: "Could not create role" }, { status: 500 });
  }
}
