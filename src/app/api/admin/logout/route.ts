import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_COOKIE_NAME, getAdminSessionToken, hashSessionToken } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const token = await getAdminSessionToken(req);

    if (token) {
      // Batch 8 E2E fix: the cookie carries the RAW token, but the
      // AdminSession table stores the SHA-256 hash (Phase 27 audit fix).
      // Hash before deleting — otherwise the lookup silently no-ops and
      // the session row lingers for 24h (a stolen cookie could be replayed
      // within that window even after the user "logged out").
      const tokenHash = hashSessionToken(token);
      await db.adminSession.deleteMany({ where: { token: tokenHash } });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (err) {
    console.error("[POST /api/admin/logout]", err);
    return NextResponse.json(
      { ok: false, error: "Logout failed. Please try again later." },
      { status: 500 }
    );
  }
}
