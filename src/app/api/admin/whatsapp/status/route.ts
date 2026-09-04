import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import { getWhatsAppStatus } from "@/lib/whatsapp";

export const runtime = "nodejs";

/* GET /api/admin/whatsapp/status — connection state of the WhatsApp
   mini-service (Module 6). Polled by the admin dashboard for the live
   status badge + disconnect toast. */

export async function GET() {
  try {
    const guard = await authorizeAdmin(undefined, "manage_settings");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }
    const status = await getWhatsAppStatus();
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error("[GET /api/admin/whatsapp/status]", err);
    return NextResponse.json({ ok: false, error: "Status check failed" }, { status: 500 });
  }
}
