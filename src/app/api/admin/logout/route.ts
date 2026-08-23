import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_COOKIE_NAME, getAdminSessionToken } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const token = await getAdminSessionToken(req);

    if (token) {
      // Delete the session row (no-op if it was already removed/expired).
      await db.adminSession.deleteMany({ where: { token } });
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
