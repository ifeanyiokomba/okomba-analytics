import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeAdmin, masterAdminEmail } from "@/lib/admin-auth";
import { auditAdmin, INVITE_TTL_MS, newInviteToken, rbacClientIp } from "@/lib/admin-rbac";
import { notifyAdminInvite } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────────────
   PATCH  /api/admin/admins/[id]  manage_admins — change role,
        disable/enable, resend invite (new token + email), rename.
   DELETE /api/admin/admins/[id]  manage_admins — remove the account.
        The master admin (env founder) can never be edited/deleted.
   ───────────────────────────────────────────────────────────────── */

const patchSchema = z.object({
  roleKey: z.string().trim().min(1).max(40).optional(),
  name: z.string().trim().max(80).nullable().optional(),
  status: z.enum(["invited", "active", "disabled"]).optional(),
  resendInvite: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "manage_admins");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await ctx.params;
    const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ ok: false, error: first?.message ?? "Invalid update" }, { status: 422 });
    }
    const body = parsed.data;

    const user = await db.adminUser.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "Admin not found" }, { status: 404 });
    }

    const masterEmail = masterAdminEmail();
    const isMaster = masterEmail ? user.email === masterEmail.toLowerCase() : false;
    if (isMaster) {
      return NextResponse.json(
        { ok: false, error: "The master admin account cannot be modified" },
        { status: 403 }
      );
    }

    const data: Record<string, unknown> = {};
    if (body.roleKey !== undefined) {
      const role = await db.adminRole.findUnique({ where: { key: body.roleKey } });
      if (!role) return NextResponse.json({ ok: false, error: "Unknown role" }, { status: 422 });
      data.roleKey = body.roleKey;
    }
    if (body.name !== undefined) data.name = body.name;
    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === "disabled") {
        // Disabling kills live sessions immediately (server-side).
        await db.adminSession.deleteMany({ where: { userEmail: user.email } });
      }
    }

    let plainToken: string | null = null;
    if (body.resendInvite) {
      if (user.status === "active") {
        return NextResponse.json(
          { ok: false, error: "Account is already active — no invite to resend" },
          { status: 422 }
        );
      }
      plainToken = newInviteToken();
      const { createHash } = await import("node:crypto");
      data.inviteToken = createHash("sha256").update(plainToken, "utf-8").digest("hex");
      data.inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);
      data.status = "invited";
    }

    const updated = await db.adminUser.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, roleKey: true, status: true, invitedBy: true, inviteExpiresAt: true, lastLoginAt: true, createdAt: true },
    });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: body.resendInvite ? "admin.invite_resend" : "admin.update",
      targetType: "admin_user",
      targetId: user.id,
      meta: { roleKey: body.roleKey, status: body.status, resend: body.resendInvite ?? false },
      ip: rbacClientIp(req),
    });

    if (plainToken) {
      const role = await db.adminRole.findUnique({ where: { key: updated.roleKey } });
      const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
      await notifyAdminInvite({
        to: user.email,
        roleLabel: role?.label ?? updated.roleKey,
        roleDescription: role?.description || undefined,
        invitedBy: guard.auth.name ?? guard.auth.email,
        acceptUrl: `${base}/#/invite/${plainToken}`,
      });
    }

    return NextResponse.json({ ok: true, user: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/admins/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not update admin" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await authorizeAdmin(req, "manage_admins");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await ctx.params;
    const user = await db.adminUser.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "Admin not found" }, { status: 404 });
    }
    const masterEmail = masterAdminEmail();
    const isMaster = masterEmail ? user.email === masterEmail.toLowerCase() : false;
    if (isMaster) {
      return NextResponse.json(
        { ok: false, error: "The master admin account cannot be deleted" },
        { status: 403 }
      );
    }

    await db.adminSession.deleteMany({ where: { userEmail: user.email } });
    await db.adminUser.delete({ where: { id } });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "admin.delete",
      targetType: "admin_user",
      targetId: user.id,
      meta: { email: user.email },
      ip: rbacClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/admins/[id]]", err);
    return NextResponse.json({ ok: false, error: "Could not delete admin" }, { status: 500 });
  }
}
