import { PrismaClient } from "../src/generated/prisma/client.js";
const db = new PrismaClient();
async function main() {
  const logs = await db.emailLog.findMany({
    where: { type: { startsWith: "invoice.reminder_" } },
    orderBy: { sentAt: "desc" },
  });
  console.log("── Reminder emails in EmailLog ──");
  for (const l of logs) {
    const att = JSON.parse(l.attachments || "[]");
    console.log(`  [${l.type}] ${l.subject} → ${l.recipientEmail} | attach: ${att.map(a=>a.filename).join(",")} | status=${l.status}`);
  }
  const wam = await db.whatsAppMessage.findMany({ orderBy: { sentAt: "asc" } });
  console.log("── WhatsApp messages ──");
  for (const m of wam) {
    console.log(`  [${m.direction}] to=${m.toPhone} media=${m.mediaFilename ?? "-"} status=${m.status} | ${(m.messageText ?? "").slice(0, 70)}`);
  }
  await db.$disconnect();
}
main();
