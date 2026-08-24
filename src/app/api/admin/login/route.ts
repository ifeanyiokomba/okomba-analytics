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

/* ------------------------------------------------------------------ */
/* In-memory brute-force protection:                                   */
/* 5 failed attempts per IP per 15 min → 429 lockout. Successful       */
/* logins reset the counter. Resets on server restart (dev-acceptable).*/
/* ------------------------------------------------------------------ */
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const loginAttempts = new Map<string, { failures: number; lastAttempt: number }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function isLockedOut(ip: string): boolean {
  const entry = loginAttempts.get(ip);
  if (!entry) return false;
  // Window expired → clear stale entry
  if (Date.now() - entry.lastAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(ip);
    return false;
  }
  return entry.failures >= LOGIN_ATTEMPT_LIMIT;
}

function recordFailure(ip: string): void {
  const entry = loginAttempts.get(ip);
  if (entry && Date.now() - entry.lastAttempt <= LOGIN_WINDOW_MS) {
    entry.failures += 1;
    entry.lastAttempt = Date.now();
  } else {
    loginAttempts.set(ip, { failures: 1, lastAttempt: Date.now() });
  }
}

function resetAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    // Lockout check before burning cycles on the attempt
    if (isLockedOut(ip)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Too many failed attempts. Try again in 15 minutes.",
        },
        { status: 429 }
      );
    }

    // Small artificial delay to slow down brute-force attempts.
    await sleep(BRUTE_FORCE_DELAY_MS);

    // Credentials come from env. Source-level defaults are DEV-ONLY:
    // production deployments MUST set ADMIN_EMAIL / ADMIN_PASSWORD
    // (the defaults are public in the repository by design).
    const isProduction = process.env.NODE_ENV === "production";
    const adminEmail = process.env.ADMIN_EMAIL ?? (isProduction ? null : DEFAULT_ADMIN_EMAIL);
    const adminPassword = process.env.ADMIN_PASSWORD ?? (isProduction ? null : DEFAULT_ADMIN_PASSWORD);

    if (!adminEmail || !adminPassword) {
      console.error("[admin/login] ADMIN_EMAIL / ADMIN_PASSWORD env vars are not set — refusing production login.");
      return NextResponse.json(
        { ok: false, error: "Server not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables." },
        { status: 503 }
      );
    }

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
      recordFailure(ip);
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const emailMatches =
      parsed.data.email.toLowerCase() === adminEmail.toLowerCase();
    const passwordMatches = parsed.data.password === adminPassword;

    if (!emailMatches || !passwordMatches) {
      recordFailure(ip);
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    resetAttempts(ip);

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
