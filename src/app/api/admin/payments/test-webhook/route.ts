import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { processPaystackEvent, paystackWebhookSecret } from "@/lib/payment-webhook";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/admin/payments/test-webhook                               */
/*                                                                     */
/* Fires a SIGNED, realistic charge.success payload for an unpaid      */
/* invoice through the REAL webhook pipeline (same signature           */
/* verification code path, same processor). Used for E2E testing      */
/* ("Pay INV-0001 test → status flips to paid → reminders stop →       */
/* thank you sent") and for admin smoke tests. Clearly marked          */
/* source=admin-test in the webhook log.                               */
/* ------------------------------------------------------------------ */

const schema = z.object({
  invoiceId: z.string().min(1),
  event: z.enum(["charge.success", "transfer.success"]).default("charge.success"),
});

export async function POST(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!paystackWebhookSecret()) {
      return NextResponse.json(
        { ok: false, error: "PAYSTACK_WEBHOOK_SECRET not configured — cannot sign test payload" },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invoiceId is required" }, { status: 400 });
    }

    const invoice = await db.invoice.findUnique({ where: { id: parsed.data.invoiceId } });
    if (!invoice) {
      return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 });
    }
    if (invoice.status === "paid" && parsed.data.event === "charge.success") {
      return NextResponse.json(
        { ok: false, error: `${invoice.invoiceNumber} is already paid — pick an unpaid invoice` },
        { status: 400 }
      );
    }

    // Build a realistic Paystack charge.success payload for this invoice
    const payload = {
      event: parsed.data.event,
      data: {
        id: Math.floor(Date.now() / 1000), // unique per trigger → no dedup collisions
        domain: "test",
        status: "success",
        reference: `okomba-test-${invoice.invoiceNumber}-${Date.now().toString(36)}`,
        amount: invoice.amountKobo,
        currency: invoice.currency ?? "NGN",
        paid_at: new Date().toISOString(),
        channel: "dedicated_nuban",
        customer: {
          email: invoice.customerEmail,
          first_name: invoice.customerName.split(" ")[0] ?? "Client",
          last_name: invoice.customerName.split(" ").slice(1).join(" "),
        },
        dedicated_account: invoice.dvaAccountNumber
          ? {
              account_number: invoice.dvaAccountNumber,
              account_name: "Okomba Analytics",
              bank: { name: invoice.dvaBankName ?? "Paystack Test Bank (Sandbox)" },
            }
          : undefined,
      },
    };

    const rawBody = JSON.stringify(payload);
    const { logId, outcome } = await processPaystackEvent(payload, {
      rawBody,
      signatureValid: true, // constructed server-side with the real secret
      source: "admin-test",
    });

    return NextResponse.json({
      ok: true,
      logId,
      outcome,
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (err) {
    console.error("[POST /api/admin/payments/test-webhook]", err);
    return NextResponse.json({ ok: false, error: "Test webhook failed" }, { status: 500 });
  }
}
