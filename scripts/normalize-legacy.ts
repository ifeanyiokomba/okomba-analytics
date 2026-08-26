import { PrismaClient } from "../src/generated/prisma/client.js";
const db = new PrismaClient();
async function main() {
  const rows = await db.whatsAppMessage.findMany({ where: { toPhone: { contains: " " } } });
  for (const r of rows) {
    const digits = (r.toPhone ?? "").replace(/\D/g, "");
    if (digits) {
      await db.whatsAppMessage.update({ where: { id: r.id }, data: { toPhone: digits } });
      console.log(`normalized ${r.toPhone} → ${digits}`);
    }
  }
  await db.$disconnect();
}
main();
