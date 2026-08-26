import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  WHATSAPP_INTERNAL_TOKEN,
  WHATSAPP_SERVICE_URL,
} from "@/lib/whatsapp";
import { regenerateInvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";
export const maxDuration = 120;

/* ------------------------------------------------------------------ */
/* POST /api/whatsapp/service-event  (INTERNAL — mini-service only)    */
/* Lifecycle hook from the WhatsApp mini-service:                      */
/*   ready        → flush queued outbound messages (proposal captions  */
/*                  and reminders that piled up while disconnected)    */
/*   disconnected → audit only for now (admin UI toasts via socket)    */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  if (req.headers.get("X-Internal-Token") !== WHATSAPP_INTERNAL_TOKEN) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json().catch(() => null)) as {
      event?: string;
      reason?: string;
    } | null;

    if (body?.event === "ready") {
      const flushed = await flushQueuedOutbound();
      return NextResponse.json({ ok: true, flushed });
    }
    if (body?.event === "disconnected") {
      console.warn(`[whatsapp] service reported disconnect (${body.reason ?? "unknown"})`);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: "unknown event" }, { status: 400 });
  } catch (err) {
    console.error("[POST /api/whatsapp/service-event]", err);
    return NextResponse.json({ ok: false, error: "Event handling failed" }, { status: 500 });
  }
}

/** Retry every queued outbound message through the live session. */
async function flushQueuedOutbound(): Promise<{
  attempted: number;
  sent: number;
  stillQueued: number;
}> {
  const queued = await db.whatsAppMessage.findMany({
    where: { direction: "outbound", status: "queued" },
    orderBy: { sentAt: "asc" },
    take: 25,
  });

  let sent = 0;
  let stillQueued = 0;

  for (const m of queued) {
    const to = m.toPhone;
    if (!to) continue;
    try {
      let pdfBase64: string | null = null;
      if (m.relatedInvoiceId && m.mediaFilename) {
        const invoice = await db.invoice.findUnique({ where: { id: m.relatedInvoiceId } });
        if (invoice) {
          pdfBase64 = (await regenerateInvoicePdf(invoice)).toString("base64");
        }
      }
      const res = await fetch(`${WHATSAPP_SERVICE_URL}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": WHATSAPP_INTERNAL_TOKEN,
        },
        body: JSON.stringify({
          to,
          caption: m.messageText,
          pdfBase64,
          filename: m.mediaFilename,
          invoiceId: m.relatedInvoiceId,
        }),
        signal: AbortSignal.timeout(25_000),
      });
      if (res.ok) {
        await db.whatsAppMessage.update({
          where: { id: m.id },
          data: { status: "sent", sentAt: new Date() },
        });
        sent += 1;
      } else {
        stillQueued += 1;
      }
    } catch {
      stillQueued += 1;
    }
  }

  console.log(`[whatsapp] flush — ${sent}/${queued.length} queued messages delivered`);
  return { attempted: queued.length, sent, stillQueued };
}
