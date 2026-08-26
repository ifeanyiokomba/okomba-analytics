import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { normalizePhone } from "@/lib/whatsapp";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET /api/admin/whatsapp/messages?phone=2348…                        */
/* Right panel of the Module-6 widget: full chat history for one       */
/* customer from the whatsapp_messages table (both directions).        */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const phone = normalizePhone(url.searchParams.get("phone"));
    if (!phone) {
      return NextResponse.json({ ok: false, error: "phone required" }, { status: 400 });
    }

    const rows = await db.whatsAppMessage.findMany({
      where: {
        OR: [{ toPhone: phone }, { fromPhone: phone }],
      },
      orderBy: { sentAt: "asc" },
      take: 300,
    });

    return NextResponse.json({
      ok: true,
      phone,
      messages: rows.map((m) => ({
        id: m.id,
        direction: m.direction,
        toPhone: m.toPhone,
        fromPhone: m.fromPhone,
        messageText: m.messageText,
        mediaFilename: m.mediaFilename,
        relatedInvoiceId: m.relatedInvoiceId,
        status: m.status,
        sentAt: m.sentAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/whatsapp/messages]", err);
    return NextResponse.json({ ok: false, error: "Failed to load messages" }, { status: 500 });
  }
}
