import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ADMIN_COOKIE_NAME, hashSessionToken, masterAdminEmail } from "@/lib/admin-auth";
import { auditAdmin, hashInviteToken, hashPassword, rbacClientIp } from "@/lib/admin-rbac";
import { notifyAdminInviteAccepted } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────────────
   BATCH 7 (§44) — PUBLIC invite acceptance.

   POST /api/admin/admins/accept { token, name, password }
   §44 workflow tail: invite accepted → account activated → signed
   in (session cookie set immediately). The token is matched against
   the SHA-256 hash stored on the AdminUser row and must be unexpired.
   ───────────────────────────────────────────────────────────────── */

const acceptSchema = z.object({
  token: z.string().trim().min(16).max(128),
  name: z.string().trim().min(1, "Your name is required").max(80),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(128)
    .regex(/[a-zA-Z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
});

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const COOKIE_MAX_AGE = 86400;

export async function POST(req: Request) {
  try {
    const ip = rbacClientIp(req);
    const parsed = acceptSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ ok: false, error: first?.message ?? "Invalid request" }, { status: 422 });
    }

    const tokenHash = hashInviteToken(parsed.data.token);
    const user = await db.adminUser.findFirst({
      where: { inviteToken: tokenHash, status: "invited" },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Invitation not found — it may have already been used. Ask for a new invite." },
        { status: 404 }
      );
    }
    if (!user.inviteExpiresAt || user.inviteExpiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, error: "This invitation has expired. Ask for a new one." },
        { status: 410 }
      );
    }

    const masterEmail = masterAdminEmail();
    if (masterEmail && user.email === masterEmail.toLowerCase()) {
      return NextResponse.json(
        { ok: false, error: "This account is managed by the platform owner" },
        { status: 403 }
      );
    }

    const { hash, salt } = hashPassword(parsed.data.password);
    await db.adminUser.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        passwordHash: hash,
        passwordSalt: salt,
        status: "active", // §44 "account activated"
        inviteToken: null, // one-time use
        inviteExpiresAt: null,
        lastLoginAt: new Date(),
      },
    });

    const role = await db.adminRole.findUnique({ where: { key: user.roleKey } });

    // Sign the new admin straight in (§44: activated → can act).
    const token = crypto.randomUUID();
    await db.adminSession.create({
      data: {
        token: hashSessionToken(token),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        userEmail: user.email,
        isMaster: false,
      },
    });

    await auditAdmin({
      actorEmail: user.email,
      actorRole: user.roleKey,
      action: "admin.activated",
      targetType: "admin_user",
      targetId: user.id,
      meta: { name: parsed.data.name },
      ip,
    });

    await notifyAdminInviteAccepted({
      name: parsed.data.name,
      email: user.email,
      roleLabel: role?.label ?? user.roleKey,
    });

    const res = NextResponse.json({ ok: true, email: user.email, roleLabel: role?.label ?? user.roleKey });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error("[POST /api/admin/admins/accept]", err);
    return NextResponse.json({ ok: false, error: "Could not activate the account" }, { status: 500 });
  }
}
