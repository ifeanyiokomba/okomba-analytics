import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeAdmin, ensureRbacSeeded } from "@/lib/admin-auth";
import { auditAdmin, INVITE_TTL_MS, newInviteToken, rbacClientIp } from "@/lib/admin-rbac";
import { notifyAdminInvite } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────────────
   BATCH 7 (§44) — Admin user management.

   GET  /api/admin/admins   list administrators (manage_admins)
   POST /api/admin/admins   invite an admin (email + role) — §44
                            workflow: invitation sent (email w/ token)
                            → invite accepted → account activated.
   ───────────────────────────────────────────────────────────────── */

const inviteSchema = z.object({
  email: z.string().trim().email("A valid email is required").max(160),
  name: z.string().trim().max(80).optional(),
  roleKey: z.string().trim().min(1).max(40),
});

export async function GET() {
  const guard = await authorizeAdmin(undefined, "manage_admins");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    await ensureRbacSeeded().catch(() => {});
    const [users, roles] = await Promise.all([
      db.adminUser.findMany({
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          email: true,
          name: true,
          roleKey: true,
          status: true,
          invitedBy: true,
          inviteExpiresAt: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      db.adminRole.findMany({ orderBy: { key: "asc" } }),
    ]);
    return NextResponse.json({ ok: true, users, roles });
  } catch (err) {
    console.error("[GET /api/admin/admins]", err);
    return NextResponse.json({ ok: false, error: "Could not load administrators" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const guard = await authorizeAdmin(req, "manage_admins");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const parsed = inviteSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ ok: false, error: first?.message ?? "Invalid invite" }, { status: 422 });
    }
    const email = parsed.data.email.toLowerCase();
    const roleKey = parsed.data.roleKey;

    const role = await db.adminRole.findUnique({ where: { key: roleKey } });
    if (!role) {
      return NextResponse.json({ ok: false, error: "Unknown role" }, { status: 422 });
    }

    const existing = await db.adminUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: `${email} already exists (${existing.status})` },
        { status: 409 }
      );
    }

    // §44 — invite token, hashed at rest (never stored raw).
    const rawToken = newInviteToken();
    const { createHash } = await import("node:crypto");
    const tokenHash = createHash("sha256").update(rawToken, "utf-8").digest("hex");

    const user = await db.adminUser.create({
      data: {
        email,
        name: parsed.data.name ?? null,
        roleKey,
        status: "invited",
        inviteToken: tokenHash,
        inviteExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
        invitedBy: guard.auth.email,
      },
      select: {
        id: true,
        email: true,
        name: true,
        roleKey: true,
        status: true,
        invitedBy: true,
        inviteExpiresAt: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    await auditAdmin({
      actorEmail: guard.auth.email,
      actorRole: guard.auth.roleKey,
      action: "admin.invite",
      targetType: "admin_user",
      targetId: user.id,
      meta: { email, roleKey },
      ip: rbacClientIp(req),
    });

    // §44 "invitation sent" — email with the accept link. The accept
    // URL carries the RAW token (only the hash is stored).
    const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const acceptUrl = `${base}/#/invite/${rawToken}`;
    await notifyAdminInvite({
      to: email,
      roleLabel: role.label,
      roleDescription: role.description || undefined,
      invitedBy: guard.auth.name ?? guard.auth.email,
      acceptUrl,
    });

    return NextResponse.json({ ok: true, user });
  } catch (err) {
    console.error("[POST /api/admin/admins]", err);
    return NextResponse.json({ ok: false, error: "Could not send invitation" }, { status: 500 });
  }
}
