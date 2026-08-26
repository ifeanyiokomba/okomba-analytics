import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getWhatsAppStatus } from "@/lib/whatsapp";

export const runtime = "nodejs";

/* GET /api/admin/whatsapp/status — connection state of the WhatsApp
   mini-service (Module 6). Polled by the admin dashboard for the live
   status badge + disconnect toast. */

export async function GET() {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const status = await getWhatsAppStatus();
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error("[GET /api/admin/whatsapp/status]", err);
    return NextResponse.json({ ok: false, error: "Status check failed" }, { status: 500 });
  }
}
