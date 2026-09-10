import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createStudentSession, hashPassword, setStudentCookie } from "@/lib/student-auth";
import { toStudentPublicDto } from "@/lib/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/learning/auth/signup — §64/§65 student self-signup.       */
/* Validates, hashes the password (platform scrypt helper), creates   */
/* the account + a 30-day session, auto-login (httpOnly cookie) and   */
/* returns the public DTO — passwordHash never leaves the server.     */
/* ------------------------------------------------------------------ */

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("A valid email address is required").max(160),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+\d][\d\s()+-]*$/, "Phone must contain only digits and + ( ) - characters")
    .optional(),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .length(2, "Country must be a 2-letter ISO code (e.g. NG)")
    .optional(),
});

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid signup details" },
        { status: 422 }
      );
    }

    const { name, email, password, phone, country } = parsed.data;

    const existing = await db.student.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "An account with this email already exists — try signing in instead" },
        { status: 409 }
      );
    }

    const { hash, salt } = hashPassword(password);
    const student = await db.student.create({
      data: {
        name,
        email,
        phone: phone?.length ? phone : null,
        country: country ?? "NG",
        passwordHash: hash,
        passwordSalt: salt,
        status: "active",
      },
    });

    const session = await createStudentSession(student.id);

    const response = NextResponse.json(
      { ok: true, student: toStudentPublicDto(student) },
      { status: 201 }
    );
    setStudentCookie(response, session.token);
    return response;
  } catch (err) {
    console.error("[POST /api/learning/auth/signup]", err);
    return NextResponse.json({ ok: false, error: "Could not create your account" }, { status: 500 });
  }
}
