import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  processPaystackEvent,
  verifyPaystackSignature,
  type PaystackEvent,
} from "@/lib/payment-webhook";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/paystack/webhook                                          */
/*                                                                     */
/* Paystack → Okomba Analytics money hook.                             */
/*   1. Reads the RAW body (signature is computed over exact bytes).   */
/*   2. Verifies x-paystack-signature (HMAC-SHA512, timing-safe).      */
/*   3. Persists a webhook_logs row + processes the event              */
/*      asynchronously (charge.success → invoice paid, reminders       */
/*      stopped, AI thank-you email + WhatsApp with receipt PDF,       */
/*      kickoff event) and answers 200 fast so Paystack never          */
/*      retries a processed payment.                                   */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  const rawBody = await req.text();

  const signature = req.headers.get("x-paystack-signature");
  const { valid, configured } = verifyPaystackSignature(rawBody, signature);

  if (!configured) {
    console.error("[paystack-webhook] no secret configured — rejecting");
    return NextResponse.json(
      { ok: false, error: "webhook secret not configured" },
      { status: 503 }
    );
  }
  if (!valid) {
    console.warn("[paystack-webhook] invalid signature — rejecting");
    // Log the rejected attempt for the audit trail
    await db.webhookLog
      .create({
        data: {
          event: "signature.rejected",
          signatureValid: false,
          status: "failed",
          error: "invalid x-paystack-signature",
          payload: rawBody.slice(0, 2000),
        },
      })
      .catch(() => {});
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  let evt: PaystackEvent;
  try {
    evt = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }
  if (!evt?.event || typeof evt.event !== "string") {
    return NextResponse.json({ ok: false, error: "missing event" }, { status: 400 });
  }

  const paystackId = evt.data?.id != null ? String(evt.data.id) : null;

  // Fast path: Paystack retries already-processed events — answer 200
  // immediately without touching the unique (provider, event, id) triple.
  if (paystackId) {
    try {
      const existing = await db.webhookLog.findUnique({
        where: {
          provider_event_paystackId: { provider: "paystack", event: evt.event, paystackId },
        },
      });
      if (existing) {
        if (existing.status === "received") {
          // Still processing an earlier delivery of this same event
          return NextResponse.json({ ok: true, inFlight: true, logId: existing.id });
        }
        return NextResponse.json({ ok: true, duplicate: true, logId: existing.id });
      }
    } catch {
      /* fall through to normal flow */
    }
  }

  // Pre-create the received row so the admin sees it instantly
  // (unique-violation race with a concurrent retry → treat as duplicate)
  let log;
  try {
    log = await db.webhookLog.create({
      data: {
        event: evt.event,
        paystackId,
        reference: typeof evt.data?.reference === "string" ? evt.data.reference : null,
        amountKobo: typeof evt.data?.amount === "number" ? evt.data.amount : null,
        currency: typeof evt.data?.currency === "string" ? evt.data.currency : null,
        signatureValid: true,
        source: "webhook",
        status: "received",
        payload: rawBody.length > 6000 ? `${rawBody.slice(0, 6000)}…[truncated]` : rawBody,
      },
    });
  } catch {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // Process in the background; the row flips to processed/failed/ignored
  void processPaystackEvent(evt, {
    rawBody,
    signatureValid: true,
    source: "webhook",
    logId: log.id,
  }).catch((err) => {
    console.error("[paystack-webhook] background processing crashed:", err);
    db.webhookLog
      .update({
        where: { id: log.id },
        data: {
          status: "failed",
          error: err instanceof Error ? err.message : "processing crashed",
          processedAt: new Date(),
        },
      })
      .catch(() => {});
  });

  // Fast 200 — Paystack retries anything slower/errored, and our
  // processing is idempotent anyway (dedup on event id).
  return NextResponse.json({ ok: true, received: true, logId: log.id });
}

export async function GET() {
  // Health probe for the hook (does not leak secrets)
  return NextResponse.json({ ok: true, endpoint: "/api/paystack/webhook" });
}
