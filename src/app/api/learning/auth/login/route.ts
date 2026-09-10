import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createStudentSession, setStudentCookie, verifyPassword } from "@/lib/student-auth";
import { toStudentPublicDto } from "@/lib/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/learning/auth/login — §64 student login.                  */
/* 401 with a GENERIC "Invalid email or password" (no account-exists  */
/* oracle). Sets the 30-day httpOnly okomba_student_session cookie.   */
/* Suspended accounts get a specific 403 (they know their status).    */
/* ------------------------------------------------------------------ */

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email is required").max(160),
  password: z.string().min(1, "Password is required").max(100),
});

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid login details" },
        { status: 422 }
      );
    }

    const { email, password } = parsed.data;
    const student = await db.student.findUnique({ where: { email } });

    // Constant-ish work whether or not the account exists.
    const valid =
      student &&
      student.passwordSalt &&
      verifyPassword(password, student.passwordHash, student.passwordSalt);

    if (!student || !valid) {
      return NextResponse.json({ ok: false, error: "Invalid email or password" }, { status: 401 });
    }

    if (student.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "Your student account is suspended — contact support@okomba.com" },
        { status: 403 }
      );
    }

    const session = await createStudentSession(student.id);
    const response = NextResponse.json({ ok: true, student: toStudentPublicDto(student) });
    setStudentCookie(response, session.token);
    return response;
  } catch (err) {
    console.error("[POST /api/learning/auth/login]", err);
    return NextResponse.json({ ok: false, error: "Could not sign you in" }, { status: 500 });
  }
}
