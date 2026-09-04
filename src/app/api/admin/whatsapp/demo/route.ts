import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import {
  WHATSAPP_INTERNAL_TOKEN,
  WHATSAPP_SERVICE_URL,
  normalizePhone,
} from "@/lib/whatsapp";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/admin/whatsapp/demo — QA controls for the DEMO engine.    */
/*   { action: "scan" }              → simulate scanning the QR        */
/*   { action: "inbound", from }     → simulate a customer reply       */
/*   { action: "disconnect" }        → simulate a dropped session      */
/* Only works while the mini-service runs in demo mode (auto-fallback  */
/* when Chrome/WhatsApp Web is unavailable). No-ops in real mode.      */
/* ------------------------------------------------------------------ */

const DEMO_REPLIES = [
  "Thank you — I received the invoice, I'll make the transfer this week.",
  "Confirmed. Please proceed with the project.",
  "Hi, sorry for the delay — sending payment today.",
  "Can you resend the PDF please?",
];

export async function POST(req: Request) {
  try {
    const guard = await authorizeAdmin(req, "manage_settings");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }
    const body = (await req.json().catch(() => null)) as {
      action?: string;
      from?: string;
      text?: string;
    } | null;

    const action = body?.action;
    if (action === "scan" || action === "disconnect") {
      const res = await fetch(`${WHATSAPP_SERVICE_URL}/demo/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Internal-Token": WHATSAPP_INTERNAL_TOKEN },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        return NextResponse.json({ ok: false, error: j?.error ?? "Demo action failed" }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "inbound") {
      const from = normalizePhone(body?.from);
      if (!from) {
        return NextResponse.json({ ok: false, error: "from required" }, { status: 400 });
      }
      // Prefer a context-aware reply: if we recently sent an invoice,
      // answer like a human customer would.
      let text = body?.text?.trim();
      if (!text) {
        const lastOutbound = await db.whatsAppMessage.findFirst({
          where: { direction: "outbound", toPhone: from },
          orderBy: { sentAt: "desc" },
        });
        if (lastOutbound?.mediaFilename) {
          text = "Got it, thank you! I'll settle this before the due date.";
        } else {
          text = DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)];
        }
      }
      const res = await fetch(`${WHATSAPP_SERVICE_URL}/demo/inbound`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Internal-Token": WHATSAPP_INTERNAL_TOKEN },
        body: JSON.stringify({ from, text }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        return NextResponse.json({ ok: false, error: j?.error ?? "Demo inbound failed" }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[POST /api/admin/whatsapp/demo]", err);
    return NextResponse.json({ ok: false, error: "Demo action failed" }, { status: 500 });
  }
}
