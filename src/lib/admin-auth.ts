import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const ADMIN_COOKIE_NAME = "okomba_admin";

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
 */
export async function isAdminAuthorized(): Promise<boolean> {
  try {
    const token = await getAdminSessionToken();
    if (!token) return false;

    // Opportunistically purge expired sessions.
    await db.adminSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    const session = await db.adminSession.findUnique({ where: { token } });
    if (!session) return false;

    return session.expiresAt.getTime() > Date.now();
  } catch {
    return false;
  }
}
