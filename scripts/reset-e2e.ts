import { PrismaClient } from "../src/generated/prisma/client.js";
const db = new PrismaClient();
async function main() {
  // Reset reminder events for the three seeded invoices so the scan re-runs cleanly
  const ev = await db.eventRecord.updateMany({
    where: { type: { startsWith: "invoice.reminder_" } },
    data: { status: "scheduled", processedAt: null, lastSentAt: null },
  });
  // Remove the earlier reminder email logs (they will be recreated by the clean re-run)
  const el = await db.emailLog.deleteMany({
    where: { type: { startsWith: "invoice.reminder_" } },
  });
  console.log(`events reset: ${ev.count}, email logs removed: ${el.count}`);
  await db.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
