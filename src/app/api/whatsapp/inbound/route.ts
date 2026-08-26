import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { WHATSAPP_INTERNAL_TOKEN, normalizePhone } from "@/lib/whatsapp";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/whatsapp/inbound  (INTERNAL — WhatsApp mini-service only) */
/* Persists an inbound customer message into whatsapp_messages so it   */
/* shows in the admin chat widget. Guarded by X-Internal-Token.        */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  if (req.headers.get("X-Internal-Token") !== WHATSAPP_INTERNAL_TOKEN) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json().catch(() => null)) as {
      from?: string;
      text?: string;
      timestamp?: string;
    } | null;

    const from = normalizePhone(body?.from);
    const text = (body?.text ?? "").trim();
    if (!from || !text) {
      return NextResponse.json({ ok: false, error: "from and text required" }, { status: 400 });
    }

    const record = await db.whatsAppMessage.create({
      data: {
        direction: "inbound",
        fromPhone: from,
        messageText: text.slice(0, 4000),
        sentAt: body?.timestamp ? new Date(body.timestamp) : new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      record: {
        id: record.id,
        direction: record.direction,
        fromPhone: record.fromPhone,
        messageText: record.messageText,
        sentAt: record.sentAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[POST /api/whatsapp/inbound]", err);
    return NextResponse.json({ ok: false, error: "Persist failed" }, { status: 500 });
  }
}
