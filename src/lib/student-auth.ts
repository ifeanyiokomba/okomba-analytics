/* ─────────────────────────────────────────────────────────────
   BATCH 13 (§64–§67) — STUDENT AUTH (SERVER-ONLY).

   Okomba Learning accounts are SEPARATE from admin auth (§65):
   their own session table, own httpOnly cookie and own guard.
   Passwords reuse the platform-wide scrypt helpers from
   admin-rbac.ts (one crypto convention — hash + salt columns).

   Session convention mirrors the audit-hardened AdminSession:
   the DB stores the SHA-256 hash of the token; the cookie (or
   Bearer header) carries the raw 256-bit hex token, so a DB
   leak can't be replayed.
   ───────────────────────────────────────────────────────────── */

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/admin-rbac";

export const STUDENT_COOKIE_NAME = "okomba_student_session";

/** §65 — 30-day student sessions. */
export const STUDENT_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const STUDENT_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // seconds

export { hashPassword, verifyPassword };

/** Raw token: 64 hex chars (256-bit). */
export function newStudentToken(): string {
  return randomBytes(32).toString("hex");
}

/** DB stores only the SHA-256 digest (AdminSession convention). */
export function hashStudentToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export type StudentRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string;
  avatarUrl: string | null;
  status: string;
  linkedCustomerEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Creates a session row + returns the RAW token to place in the
 * httpOnly cookie. Caller sets the cookie via setStudentCookie().
 */
export async function createStudentSession(studentId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = newStudentToken();
  const expiresAt = new Date(Date.now() + STUDENT_SESSION_TTL_MS);
  await db.studentSession.create({
    data: { token: hashStudentToken(token), studentId, expiresAt },
  });
  return { token, expiresAt };
}

/** Sets the httpOnly cookie on a NextResponse (signup/login). */
export function setStudentCookie(response: Response, token: string): void {
  response.headers.append(
    "set-cookie",
    [
      `${STUDENT_COOKIE_NAME}=${token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${STUDENT_COOKIE_MAX_AGE}`,
      process.env.NODE_ENV === "production" ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ")
  );
}

/** Clears the cookie (logout) — expires immediately. */
export function clearStudentCookie(response: Response): void {
  response.headers.append(
    "set-cookie",
    `${STUDENT_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

/**
 * Reads the student session token from the request: cookie first
 * (next/headers store, then manual Cookie-header parse), then the
 * `Authorization: Bearer <token>` header. Returns the RAW token.
 */
export async function getStudentToken(req?: Request): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(STUDENT_COOKIE_NAME)?.value;
    if (token && token.length > 0) return token;
  } catch {
    // Fall through to the manual header parse below.
  }

  if (req) {
    try {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.toLowerCase().startsWith("bearer ")) {
        const bearer = authHeader.slice(7).trim();
        if (bearer.length > 0) return bearer;
      }
      const header = req.headers.get("cookie");
      if (header) {
        const match = header
          .split(";")
          .map((part) => part.trim())
          .find((part) => part.startsWith(`${STUDENT_COOKIE_NAME}=`));
        if (match) {
          const token = decodeURIComponent(match.slice(STUDENT_COOKIE_NAME.length + 1));
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
 * Resolves the authenticated, ACTIVE student for a request.
 * Returns null for: no token, unknown/expired session, or a
 * suspended account (§65 status gate — suspended students lose
 * portal access immediately).
 */
export async function getStudentAuth(req?: Request): Promise<StudentRow | null> {
  try {
    const token = await getStudentToken(req);
    if (!token) return null;

    // Opportunistic purge of expired sessions.
    await db.studentSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });

    const session = await db.studentSession.findUnique({
      where: { token: hashStudentToken(token) },
    });
    if (!session || session.expiresAt.getTime() <= Date.now()) return null;

    const student = await db.student.findUnique({ where: { id: session.studentId } });
    if (!student || student.status !== "active") return null;

    return student;
  } catch {
    return null;
  }
}

export type StudentGuard =
  | { ok: true; student: StudentRow }
  | { ok: false; status: 401 | 403; error: string };

/** 401 = not signed in · 403 = signed in but suspended. */
export async function requireStudent(req: Request | undefined): Promise<StudentGuard> {
  const token = await getStudentToken(req);
  if (!token) return { ok: false, status: 401, error: "Unauthorized — sign in to continue" };

  try {
    await db.studentSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    const session = await db.studentSession.findUnique({
      where: { token: hashStudentToken(token) },
    });
    if (!session || session.expiresAt.getTime() <= Date.now()) {
      return { ok: false, status: 401, error: "Unauthorized — sign in to continue" };
    }
    const student = await db.student.findUnique({ where: { id: session.studentId } });
    if (!student) return { ok: false, status: 401, error: "Unauthorized — sign in to continue" };
    if (student.status !== "active") {
      return { ok: false, status: 403, error: "Your student account is suspended — contact support@okomba.com" };
    }
    return { ok: true, student };
  } catch {
    return { ok: false, status: 401, error: "Unauthorized — sign in to continue" };
  }
}

/** Logout: best-effort delete of the session row (never throws). */
export async function destroyStudentSession(req?: Request): Promise<void> {
  try {
    const token = await getStudentToken(req);
    if (!token) return;
    await db.studentSession.deleteMany({ where: { token: hashStudentToken(token) } });
  } catch {
    // Logging out with an already-dead session is still a success.
  }
}
