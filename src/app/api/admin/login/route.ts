import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export const runtime = "nodejs";

const DEFAULT_ADMIN_EMAIL = "admin@okomba.com";
const DEFAULT_ADMIN_PASSWORD = "okomba-admin-2025";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const COOKIE_MAX_AGE = 86400; // 24 hours, in seconds
const BRUTE_FORCE_DELAY_MS = 400;

const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  try {
    // Small artificial delay to slow down brute-force attempts.
    await sleep(BRUTE_FORCE_DELAY_MS);

    const adminEmail = process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const emailMatches =
      parsed.data.email.toLowerCase() === adminEmail.toLowerCase();
    const passwordMatches = parsed.data.password === adminPassword;

    if (!emailMatches || !passwordMatches) {
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await db.adminSession.create({
      data: { token, expiresAt },
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error("[POST /api/admin/login]", err);
    return NextResponse.json(
      { ok: false, error: "Login failed. Please try again later." },
      { status: 500 }
    );
  }
}
