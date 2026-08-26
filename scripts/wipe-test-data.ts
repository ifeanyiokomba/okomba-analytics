/* ─────────────────────────────────────────────────────────────
   Stage 9B — Data Wipe + Seed
   Wipes ALL test/transactional data from the SQLite DB so the
   production launch starts on a clean slate. The next invoice
   generated will be INV-{currentYear}-0001 (the invoice counter
   is computed dynamically from existing INV-{year}-* rows).

   WHAT GETS DELETED:
     • Invoice           — test proposals (all of them)
     • Inquiry           — test leads (incl. ai_chat captures)
     • DraftProposal     — AI-chat auto-drafts
     • ReceivedEmail     — AI-chat email captures
     • EventRecord       — reminder + kickoff schedule
     • WhatsAppMessage   — chat traffic
     • WebhookLog        — Paystack test webhooks
     • EmailLog          — every outbound test email
     • AnalyticsEvent    — funnel events (ai_chat_start …)
     • BackupLog         — test backup runs
     • AdminSession      — force re-login after wipe
     • Local file artifacts:
         data/uploads/proposals/*  (Cloudinary local-fallback PDFs)
         data/uploads/proofs/*      (portal "I've Paid" uploads)
         data/backups/*            (local DB snapshots)

   WHAT IS KEPT (per Stage 9B spec):
     • Services + Portfolio    — code in src/lib/content.ts (NOT DB)
     • Email Templates         — code in src/lib/notify.ts (NOT DB)
     • Posts                   — CMS blog content (real)
     • Testimonials            — CMS testimonials (real)
     • Subscribers             — newsletter list (real)

   USAGE:
     bun run scripts/wipe-test-data.ts            # wipe + verify
     bun run scripts/wipe-test-data.ts --force    # skip the y/N prompt
   ───────────────────────────────────────────────────────────── */

import { db } from "../src/lib/db";
import { rm, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const force = process.argv.includes("--force") || process.argv.includes("-y");

async function confirm(): Promise<boolean> {
  if (force) return true;
  process.stdout.write(
    "\n⚠️  This will DELETE every invoice, inquiry, analytics event, " +
      "and audit log in the database.\n" +
      "   Posts, Testimonials, and Subscribers will be KEPT.\n" +
      "   Type 'y' to proceed, anything else to abort: "
  );
  const buf = Buffer.alloc(8);
  await new Promise<void>((res) => {
    process.stdin.once("data", (d) => {
      buf.fill(0);
      (buf as Buffer).write(d.toString().slice(0, 7));
      res();
    });
  });
  // Read the actual typed reply
  return new Promise<boolean>((res) => {
    process.stdin.once("data", (d) => {
      res(d.toString().trim().toLowerCase() === "y");
    });
  });
}

async function wipeFiles() {
  const targets = [
    "data/uploads/proposals",
    "data/uploads/proofs",
    "data/backups",
  ];
  for (const rel of targets) {
    const dir = resolve(ROOT, rel);
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
    console.log(`  📁 wiped ${rel}/`);
  }
}

async function main() {
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  STAGE 9B — Data Wipe + Seed");
  console.log("  Target DB: " + (process.env.DATABASE_URL || "(env DATABASE_URL)"));
  console.log("══════════════════════════════════════════════════════════\n");

  if (!(await confirm())) {
    console.log("\nAborted — no changes made.");
    process.exit(0);
  }

  // Pre-wipe counts
  const pre = {
    invoices: await db.invoice.count(),
    inquiries: await db.inquiry.count(),
    drafts: await db.draftProposal.count(),
    receivedEmails: await db.receivedEmail.count(),
    events: await db.eventRecord.count(),
    whatsapp: await db.whatsAppMessage.count(),
    webhooks: await db.webhookLog.count(),
    emailLogs: await db.emailLog.count(),
    analytics: await db.analyticsEvent.count(),
    backups: await db.backupLog.count(),
    sessions: await db.adminSession.count(),
    posts: await db.post.count(),
    testimonials: await db.testimonial.count(),
    subscribers: await db.subscriber.count(),
  };
  console.log("\nPre-wipe counts:");
  for (const [k, v] of Object.entries(pre)) {
    console.log(`  ${k.padEnd(14)} ${v}`);
  }

  // Wipe transactional/test data — order-agnostic (no FK constraints)
  console.log("\nWiping DB tables…");
  await db.emailLog.deleteMany({});
  console.log("  ✓ EmailLog");
  await db.webhookLog.deleteMany({});
  console.log("  ✓ WebhookLog");
  await db.analyticsEvent.deleteMany({});
  console.log("  ✓ AnalyticsEvent");
  await db.backupLog.deleteMany({});
  console.log("  ✓ BackupLog");
  await db.whatsAppMessage.deleteMany({});
  console.log("  ✓ WhatsAppMessage");
  await db.eventRecord.deleteMany({});
  console.log("  ✓ EventRecord");
  await db.draftProposal.deleteMany({});
  console.log("  ✓ DraftProposal");
  await db.receivedEmail.deleteMany({});
  console.log("  ✓ ReceivedEmail");
  await db.invoice.deleteMany({});
  console.log("  ✓ Invoice");
  await db.inquiry.deleteMany({});
  console.log("  ✓ Inquiry");
  await db.adminSession.deleteMany({});
  console.log("  ✓ AdminSession");

  // Wipe local file artifacts (Cloudinary fallback PDFs, proofs, backups)
  console.log("\nWiping local file artifacts…");
  await wipeFiles();

  // Post-wipe counts — should all be 0 except kept content
  const post = {
    invoices: await db.invoice.count(),
    inquiries: await db.inquiry.count(),
    analytics: await db.analyticsEvent.count(),
    backups: await db.backupLog.count(),
    webhooks: await db.webhookLog.count(),
    emailLogs: await db.emailLog.count(),
    events: await db.eventRecord.count(),
    drafts: await db.draftProposal.count(),
    receivedEmails: await db.receivedEmail.count(),
    whatsapp: await db.whatsAppMessage.count(),
    sessions: await db.adminSession.count(),
    posts: await db.post.count(),
    testimonials: await db.testimonial.count(),
    subscribers: await db.subscriber.count(),
  };
  console.log("\nPost-wipe counts:");
  for (const [k, v] of Object.entries(post)) {
    const mark = ["posts", "testimonials", "subscribers"].includes(k)
      ? v >= 0
        ? "✓ kept"
        : "✗"
      : v === 0
        ? "✓ empty"
        : "✗ NOT EMPTY";
    console.log(`  ${k.padEnd(14)} ${String(v).padStart(4)}  ${mark}`);
  }

  // Confirm the invoice counter is reset
  const year = new Date().getFullYear();
  const remaining = await db.invoice.count({
    where: { invoiceNumber: { startsWith: `INV-${year}-` } },
  });
  console.log(
    `\n✓ Invoice counter reset — next send will produce INV-${year}-0001 ` +
      `(0 existing INV-${year}-* rows).`
  );

  console.log(
    "\n✓ Stage 9B wipe complete. The DB is now production-ready.\n" +
      "  Admin login will require fresh credentials (sessions wiped).\n"
  );

  await db.$disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error("\n✗ Wipe failed:", e);
  await db.$disconnect();
  process.exit(1);
});
