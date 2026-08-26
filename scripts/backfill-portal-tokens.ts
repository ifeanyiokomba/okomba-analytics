/**
 * Module 8A backfill — generates secure portal tokens for every
 * invoice created before Module 8 (INV-2026-0001..0006 in the test
 * dataset). Run once after the schema push:
 *   bun run scripts/backfill-portal-tokens.ts
 */
import { db } from "../src/lib/db";
import { generatePortalToken } from "../src/lib/portal";

async function main() {
  const invoices = await db.invoice.findMany({
    where: { secureToken: null },
    select: { id: true, invoiceNumber: true },
  });
  console.log(`[backfill] ${invoices.length} invoice(s) without a portal token`);
  let done = 0;
  for (const inv of invoices) {
    try {
      await db.invoice.update({
        where: { id: inv.id },
        data: { secureToken: generatePortalToken() },
      });
      done += 1;
      console.log(`  ✓ ${inv.invoiceNumber}`);
    } catch (err) {
      console.error(`  ✗ ${inv.invoiceNumber}:`, err);
    }
  }
  console.log(`[backfill] done — ${done} token(s) minted`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
