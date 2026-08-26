/**
 * Module 7 E2E — Paystack webhook money flow.
 *
 * Simulates EXACTLY what Paystack does: builds a charge.success
 * payload for an unpaid invoice, signs the RAW body with
 * HMAC-SHA512 (PAYSTACK_WEBHOOK_SECRET), and POSTs it to
 * /api/paystack/webhook with the x-paystack-signature header.
 *
 * Then polls the database until the WebhookLog row settles and
 * prints the full outcome:
 *   invoice → paid · reminders stopped · thank-you email +
 *   WhatsApp with receipt PDF · kickoff event scheduled.
 *
 * Usage:
 *   bun run scripts/test-paystack-webhook.ts INV-2026-0003
 *   bun run scripts/test-paystack-webhook.ts INV-2026-0003 --replay   # same event id again (dedup test)
 *   bun run scripts/test-paystack-webhook.ts --list                  # list unpaid invoices
 */

import { createHmac } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SECRET =
  process.env.PAYSTACK_WEBHOOK_SECRET ?? process.env.PAYSTACK_SECRET_KEY ?? "";

function sign(raw: string): string {
  return createHmac("sha512", SECRET).update(raw, "utf8").digest("hex");
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === "--list") {
    const unpaid = await prisma.invoice.findMany({
      where: { status: { in: ["sent", "pending", "overdue"] } },
      orderBy: { createdAt: "asc" },
    });
    console.log(
      unpaid.length
        ? unpaid
            .map(
              (i) =>
                `  ${i.invoiceNumber}  ${i.status.padEnd(8)} ₦${Math.round(
                  i.amountKobo / 100
                ).toLocaleString()}  ${i.customerName}  DVA:${i.dvaAccountNumber ?? "—"}`
            )
            .join("\n")
        : "  (no unpaid invoices)"
    );
    return;
  }

  const invoiceNumber = args[0];
  const replay = args.includes("--replay");
  if (!invoiceNumber) {
    console.error("Usage: bun run scripts/test-paystack-webhook.ts INV-2026-0003 [--replay|--list]");
    process.exit(1);
  }
  if (!SECRET) {
    console.error("PAYSTACK_WEBHOOK_SECRET not set — cannot sign. Add it to .env first.");
    process.exit(1);
  }

  const invoice = await prisma.invoice.findFirst({
    where: { invoiceNumber },
  });
  if (!invoice) {
    console.error(`Invoice ${invoiceNumber} not found`);
    process.exit(1);
  }
  if (invoice.status === "paid") {
    console.error(`Invoice ${invoiceNumber} is already paid — pick an unpaid invoice (--list).`);
    process.exit(1);
  }

  // Count scheduled reminders before the hit (they must be stopped)
  const remindersBefore = await prisma.eventRecord.count({
    where: {
      relatedInvoiceId: invoice.id,
      type: { startsWith: "invoice.reminder" },
      status: "scheduled",
    },
  });

  const eventId = replay
    ? Number(invoice.invoiceNumber.replace(/\D/g, "").slice(-10)) // stable id for replay dedup test
    : Math.floor(Date.now() / 1000);

  const payload = {
    event: "charge.success",
    data: {
      id: eventId,
      domain: "test",
      status: "success",
      reference: `okomba-e2e-${invoice.invoiceNumber}-${Date.now().toString(36)}`,
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
  const signature = sign(rawBody);

  console.log(`\n▶ POSTing signed charge.success for ${invoice.invoiceNumber} (event id ${eventId})`);
  console.log(`  amount ₦${Math.round(invoice.amountKobo / 100).toLocaleString()} · DVA ${invoice.dvaAccountNumber ?? "—"}`);
  console.log(`  signature ${signature.slice(0, 16)}…`);

  const res = await fetch(`${BASE}/api/paystack/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-paystack-signature": signature,
    },
    body: rawBody,
  });
  const j = (await res.json().catch(() => null)) as { ok?: boolean; logId?: string; error?: string } | null;
  console.log(`◀ HTTP ${res.status} → ${JSON.stringify(j)}`);
  if (!res.ok || !j?.ok) process.exit(1);

  const logId = j.logId!;
  console.log(`\n⏳ Polling webhook log ${logId} until processing settles…`);

  const deadline = Date.now() + 90000;
  let row: Awaited<ReturnType<typeof prisma.webhookLog.findUnique>> = null;
  while (Date.now() < deadline) {
    row = await prisma.webhookLog.findUnique({ where: { id: logId } });
    if (row && !["received"].includes(row.status)) break;
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (!row) {
    console.error("Log row disappeared?!");
    process.exit(1);
  }

  const detail = JSON.parse(row.result || "{}") as Record<string, unknown>;
  const invoiceAfter = await prisma.invoice.findUnique({ where: { id: invoice.id } });
  const remindersAfter = await prisma.eventRecord.count({
    where: {
      relatedInvoiceId: invoice.id,
      type: { startsWith: "invoice.reminder" },
      status: "scheduled",
    },
  });
  const kickoff = await prisma.eventRecord.findFirst({
    where: { relatedInvoiceId: invoice.id, type: "project.kickoff" },
    orderBy: { createdAt: "desc" },
  });
  const thankYouEmail = await prisma.emailLog.findFirst({
    where: { invoiceId: invoice.id, type: "payment.received" },
    orderBy: { sentAt: "desc" },
  });
  const thankYouWa = await prisma.whatsAppMessage.findFirst({
    where: { relatedInvoiceId: invoice.id, direction: "outbound" },
    orderBy: { sentAt: "desc" },
  });

  console.log(`\n════════ WEBHOOK OUTCOME ════════`);
  console.log(`  status           : ${row.status}`);
  console.log(`  signatureValid   : ${row.signatureValid}`);
  console.log(`  detail           : ${JSON.stringify(detail)}`);
  console.log(`\n── Money flow assertions ──`);
  console.log(`  invoice.status   : ${invoice?.status} → ${invoiceAfter?.status} ${invoiceAfter?.status === "paid" ? "✅" : "❌"}`);
  console.log(`  paidAt           : ${invoiceAfter?.paidAt?.toISOString() ?? "—"}`);
  console.log(
    `  reminders        : ${remindersBefore} scheduled → ${remindersAfter} ${remindersAfter === 0 ? "✅ (all stopped)" : "❌ (still scheduled!)"}`
  );
  console.log(
    `  kickoff event    : ${kickoff ? `${new Date(kickoff.eventDate).toISOString()} ✅` : "❌ missing"}`
  );
  console.log(
    `  thank-you email  : ${thankYouEmail ? `"${thankYouEmail.subject}" (status ${thankYouEmail.status}) ✅` : "❌ missing"}`
  );
  if (thankYouEmail) {
    const att = JSON.parse(thankYouEmail.attachments || "[]") as { filename: string }[];
    console.log(`     attachments   : ${att.map((a) => a.filename).join(", ")}`);
  }
  console.log(
    `  thank-you WA     : ${thankYouWa ? `"${(thankYouWa.messageText ?? "").slice(0, 80)}…" (${thankYouWa.status}, file ${thankYouWa.mediaFilename ?? "—"}) ✅` : "— (no phone on invoice, skipped)"}`
  );

  const pass =
    row.status === "processed" &&
    invoiceAfter?.status === "paid" &&
    remindersAfter === 0 &&
    !!kickoff &&
    !!thankYouEmail;

  console.log(`\n${pass ? "✅ E2E PASS — money flow complete" : "❌ E2E FAIL — see above"}`);
  process.exit(pass ? 0 : 1);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
