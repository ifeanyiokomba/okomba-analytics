import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminAuth, ensureRbacSeeded } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/admin/me — §44 identity probe for the admin UI.
   Returns the signed-in admin's email, name, role label and effective
   permission set so tabs can hide/show (server still enforces). */

export async function GET() {
  const auth = await getAdminAuth();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  await ensureRbacSeeded().catch(() => {});
  return NextResponse.json({ ok: true, me: auth });
}
