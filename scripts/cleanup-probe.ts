import { PrismaClient } from "../src/generated/prisma/client.js";
const db = new PrismaClient();
async function main() {
  const del = await db.whatsAppMessage.deleteMany({ where: { messageText: "probe" } });
  console.log("probe messages removed:", del.count);
  await db.$disconnect();
}
main();
