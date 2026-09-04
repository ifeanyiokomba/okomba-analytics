import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { permissionsForRole, seedAdminRbac, type AdminRoleRecord } from "@/lib/admin-rbac";

export const ADMIN_COOKIE_NAME = "okomba_admin";

/** Master email from env (the founder). Null in prod when unset. */
export function masterAdminEmail(): string | null {
  const isProduction = process.env.NODE_ENV === "production";
  return process.env.ADMIN_EMAIL ?? (isProduction ? null : "admin@okomba.com");
}

/**
 * Audit fix (Phase 27): never persist the raw session token in the DB.
 * If SQLite is ever exfiltrated, raw tokens would grant admin access
 * until they expire. We store the SHA-256 hash; the cookie carries the
 * raw token (128-bit random UUID) so a DB compromise can't be replayed.
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Reads the admin session token from the request.
 *
 * In App Router route handlers the cookie store from `next/headers` is the
 * source of truth; if it is unavailable (e.g. called outside a request scope)
 * we fall back to manually parsing the `cookie` header of the given Request.
 */
export async function getAdminSessionToken(req?: Request): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (token && token.length > 0) return token;
  } catch {
    // Fall through to the manual header parse below.
  }

  if (req) {
    try {
      const header = req.headers.get("cookie");
      if (header) {
        const match = header
          .split(";")
          .map((part) => part.trim())
          .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`));
        if (match) {
          const token = decodeURIComponent(match.slice(ADMIN_COOKIE_NAME.length + 1));
          if (token.length > 0) return token;
        }
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Validates that the current request carries a valid, unexpired admin
 * session token. Expired sessions are deleted opportunistically.
 *
 * Audit fix (Phase 27): the cookie carries the RAW token, but the DB
 * stores only the SHA-256 hash. Lookups hash the submitted token first.
 *
 * Batch 8 E2E fix: an optional `req` parameter is threaded through to
 * `getAdminSessionToken(req)` so the fallback manual-Cookie-header
 * parse branch (which was already implemented but unreachable from
 * this caller) becomes active when `next/headers`'s `cookies()` store
 * is unavailable — i.e. when the route handler is invoked outside a
 * real Next.js request scope (such as the bun:test integration harness).
 * In production the parameter is simply not passed and the existing
 * `cookies()` path is used, byte-identical to the pre-B8 behaviour.
 */
export async function isAdminAuthorized(req?: Request): Promise<boolean> {
  try {
    const token = await getAdminSessionToken(req);
    if (!token) return false;

    // Opportunistically purge expired sessions.
    await db.adminSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    const tokenHash = hashSessionToken(token);
    const session = await db.adminSession.findUnique({ where: { token: tokenHash } });
    if (!session) return false;

    return session.expiresAt.getTime() > Date.now();
  } catch {
    return false;
  }
}

/* ─────────────────────────────────────────────────────────────────
   BATCH 7 (§44/§45) — identity-aware authorization.

   getAdminAuth resolves WHO is calling (master env admin or an
   AdminUser) and their effective permission set. authorizeAdmin /
   authorizeAdminAny are the server-side enforcement used by every
   admin route (401 = not signed in; 403 = signed in but not
   permitted — the distinction lets the UI redirect expired
   sessions to login while surfacing genuine denials).
   ───────────────────────────────────────────────────────────────── */

export type AdminAuth = {
  email: string;
  name: string | null;
  roleKey: string;
  roleLabel: string;
  isMaster: boolean;
  permissions: string[];
};

export async function getAdminAuth(req?: Request): Promise<AdminAuth | null> {
  try {
    const token = await getAdminSessionToken(req);
    if (!token) return null;

    await db.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });

    const tokenHash = hashSessionToken(token);
    const session = await db.adminSession.findUnique({ where: { token: tokenHash } });
    if (!session || session.expiresAt.getTime() <= Date.now()) return null;

    const masterEmail = masterAdminEmail();
    // Legacy pre-Batch-7 sessions (userEmail null) were created only by
    // the env master login — treat them as the master identity.
    const email = (session.userEmail ?? masterEmail ?? "").toLowerCase();
    if (!email) return null;
    const isMaster = masterEmail ? email === masterEmail.toLowerCase() : false;

    const user = await db.adminUser.findUnique({ where: { email } });
    const roleRow = user
      ? await db.adminRole.findUnique({ where: { key: user.roleKey } })
      : null;
    const role = roleRow
      ? ({
          key: roleRow.key,
          label: roleRow.label,
          description: roleRow.description,
          permissions: (Array.isArray(roleRow.permissions) ? (roleRow.permissions as unknown as string[]) : []),
          isSystem: roleRow.isSystem,
        } satisfies AdminRoleRecord)
      : null;

    // Disabled accounts lose access immediately, EXCEPT the master env
    // identity (the founder can never lock themselves out).
    if (user && user.status === "disabled" && !isMaster) return null;

    const permissions = permissionsForRole(role, masterEmail, email);
    return {
      email,
      name: user?.name ?? null,
      roleKey: role?.key ?? (isMaster ? "super_admin" : "unknown"),
      roleLabel: role?.label ?? (isMaster ? "Super Admin" : "Unknown"),
      isMaster,
      permissions,
    };
  } catch {
    return null;
  }
}

export type GuardResult =
  | { ok: true; auth: AdminAuth }
  | { ok: false; status: 401 | 403; error: string };

/** §45 server-side enforcement: require ONE permission. */
export async function authorizeAdmin(req: Request | undefined, permission: string): Promise<GuardResult> {
  const auth = await getAdminAuth(req);
  if (!auth) return { ok: false, status: 401, error: "Unauthorized" };
  if (auth.isMaster || auth.permissions.includes(permission)) {
    return { ok: true, auth };
  }
  return { ok: false, status: 403, error: "Forbidden — your role lacks this capability" };
}

/** Server-side enforcement: ANY of the given permissions suffices. */
export async function authorizeAdminAny(req: Request | undefined, permissions: string[]): Promise<GuardResult> {
  const auth = await getAdminAuth(req);
  if (!auth) return { ok: false, status: 401, error: "Unauthorized" };
  if (auth.isMaster || permissions.some((p) => auth.permissions.includes(p))) {
    return { ok: true, auth };
  }
  return { ok: false, status: 403, error: "Forbidden — your role lacks this capability" };
}

/**
 * Ensures the RBAC seed (roles + master AdminUser) exists. Cheap after
 * the first call (in-process flag); called from login + the /api/admin/me
 * probe so a fresh deployment self-seeds on first admin visit.
 */
export async function ensureRbacSeeded(): Promise<void> {
  const masterEmail = masterAdminEmail();
  if (!masterEmail) return;
  await seedAdminRbac(masterEmail, "Master Admin");
}
