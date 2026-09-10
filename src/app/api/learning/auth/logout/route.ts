import { NextResponse } from "next/server";
import { clearStudentCookie, destroyStudentSession } from "@/lib/student-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/learning/auth/logout — §64 sign out.                      */
/* Auth OPTIONAL: works even with an expired/dead session (always 200,*/
/* idempotent). Deletes the session row when one exists + expires the */
/* httpOnly cookie.                                                   */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  try {
    await destroyStudentSession(req);
    const response = NextResponse.json({ ok: true });
    clearStudentCookie(response);
    return response;
  } catch (err) {
    console.error("[POST /api/learning/auth/logout]", err);
    return NextResponse.json({ ok: false, error: "Could not sign you out" }, { status: 500 });
  }
}
