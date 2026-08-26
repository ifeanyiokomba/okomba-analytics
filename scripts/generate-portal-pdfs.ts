/**
 * Generate 3 proposal PDFs through the Cloudinary fallback path so
 * data/uploads/proposals/ holds real files (the "3+ PDFs" screenshot
 * when Cloudinary is unconfigured). Also stamps each invoice with
 * pdfStorage="local" + the local file path on pdfUrl.
 *
 *   bun run scripts/generate-portal-pdfs.ts
 */
import { db } from "../src/lib/db";
import { regenerateInvoicePdf } from "../src/lib/invoice-pdf";
import { uploadProposalPdf } from "../src/lib/cloudinary";

async function main() {
  const invoices = await db.invoice.findMany({
    where: { status: { in: ["sent", "paid", "overdue"] } },
    take: 5,
    orderBy: { createdAt: "asc" },
    select: { id: true, invoiceNumber: true },
  });
  let done = 0;
  for (const inv of invoices.slice(0, 4)) {
    try {
      const full = await db.invoice.findUnique({ where: { id: inv.id } });
      if (!full) continue;
      const pdf = await regenerateInvoicePdf(full);
      const up = await uploadProposalPdf(inv.invoiceNumber, pdf);
      await db.invoice.update({
        where: { id: inv.id },
        data: { pdfUrl: up.url, pdfStorage: up.storage },
      });
      console.log(`  ✓ ${inv.invoiceNumber} → ${up.storage} (${up.url})`);
      done += 1;
    } catch (err) {
      console.error(`  ✗ ${inv.invoiceNumber}:`, err);
    }
  }
  console.log(`[portal-pdfs] ${done} PDF(s) generated + stored`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
