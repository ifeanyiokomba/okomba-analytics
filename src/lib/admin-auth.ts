import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";

export const ADMIN_COOKIE_NAME = "okomba_admin";

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
