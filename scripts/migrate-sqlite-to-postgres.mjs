/**
 * SQLite → PostgreSQL data migration script (Phase 28)
 *
 * Reads every row from the old SQLite DB (the persistent disk file on
 * Render — typically /data/dev.db) and inserts them into the new Neon
 * PostgreSQL DB (via Prisma).
 *
 * USAGE (run locally after cloning the repo, NOT on Render directly):
 *
 *   # 1. Set DATABASE_URL + DIRECT_URL in .env to your Neon connection
 *   #    (already done in dev — but for production migration, set both
 *   #    to your Neon URL).
 *
 *   # 2. Either:
 *   #    A) Download the Render SQLite file (render shell → scp, or
 *   #       download the persistent disk file via the Backups tab)
 *   #       and place it at ./db/render-export.db
 *   #    B) OR set SQLITE_SOURCE_URL=file:/path/to/your/render/dev.db
 *
 *   # 3. Run:
 *   bun run scripts/migrate-sqlite-to-postgres.mjs
 *
 * The script is IDEMPOTENT — it checks if a row with the same primary
 * key already exists in PostgreSQL before inserting. Safe to run multiple
 * times. Pass --dry-run to preview without writing.
 */

import { PrismaClient } from "../src/generated/prisma/index.js";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";

// ────────────────────────────────────────────────────────────
// CONFIG
// ────────────────────────────────────────────────────────────
const SQLITE_PATH = process.env.SQLITE_SOURCE_URL?.replace(/^file:/, "") || "./db/render-export.db";
const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

console.log(`\n━ SQLite → PostgreSQL migration ━`);
console.log(`  SQLite source : ${SQLITE_PATH}`);
console.log(`  PostgreSQL    : ${process.env.DATABASE_URL?.replace(/\/\/([^:]+):[^@]+@/, "//$1:***@")}`);
console.log(`  Mode          : ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE (will write)"}`);
console.log("");

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────

/** Parse a SQLite TEXT-stored JSON field into a real object/array. */
function parseJsonField(raw, fallback) {
  if (raw == null) return fallback;
  // Already an object/array (SQLite stored as native JSON via Buffers? unlikely)
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Convert SQLite ISO timestamp string to a JS Date. */
function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  // SQLite stores DateTime as ISO strings ("2026-08-28 09:23:45" or ".000Z")
  // Handle the "YYYY-MM-DD HH:MM:SS.SSS" format (no Z) by treating as UTC.
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(s) && !s.endsWith("Z")) {
    return new Date(s.replace(" ", "T") + "Z");
  }
  return new Date(s);
}

function log(...args) {
  if (VERBOSE) console.log(...args);
}

// ────────────────────────────────────────────────────────────
// TABLE MIGRATIONS
// ────────────────────────────────────────────────────────────

const TABLES = [
  // Order matters — parents before children (no enforced FKs in our schema,
  // but it keeps the timeline cleaner to insert in chronological order).
  "Inquiry",
  "DraftProposal",
  "WebhookLog",
  "AdminSession",
  "Subscriber",
  "Post",
  "Testimonial",
  "EmailLog",
  "ReceivedEmail",
  "Invoice",
  "EventRecord",
  "WhatsAppMessage",
  "AnalyticsEvent",
  "BackupLog",
  "Customer",
  "CustomerNote",
  "CustomerMessage",
];

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

let sqlite;
try {
  sqlite = new Database(SQLITE_PATH, { readonly: true, fileMustExist: true });
} catch (err) {
  console.error(`Could not open SQLite file at ${SQLITE_PATH}: ${err.message}`);
  console.error(`\nIf you haven't downloaded your Render SQLite DB yet:`);
  console.error(`  1. SSH into your Render service shell:`);
  console.error(`     Render Dashboard → Service → Shell (or use the Render CLI)`);
  console.error(`  2. Copy the file out: 'cat /data/dev.db | base64' → decode locally`);
  console.error(`     (Render doesn't expose the disk via SCP on the free tier, but`);
  console.error(`      you can use sqlite3 .dump or pgloader from inside the shell).`);
  console.error(`  3. Place the file at ./db/render-export.db (or set SQLITE_SOURCE_URL)`);
  process.exit(1);
}

// Stats
const stats = {};
for (const t of TABLES) stats[t] = { read: 0, written: 0, skipped: 0, error: 0 };

// ────────────────────────────────────────────────────────────
// Per-table row mappers + inserters
// ────────────────────────────────────────────────────────────

const mappers = {
  Inquiry: (r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone ?? null,
    whatsapp: r.whatsapp ?? null,
    service: r.service,
    addlService: r.addlService ?? null,
    budget: r.budget ?? null,
    message: r.message,
    status: r.status ?? "new",
    source: r.source ?? "website",
    createdAt: toDate(r.createdAt) ?? new Date(),
    updatedAt: toDate(r.updatedAt) ?? new Date(),
  }),
  DraftProposal: (r) => ({
    id: r.id,
    source: r.source ?? "ai_chat",
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    service: r.service,
    draftJson: parseJsonField(r.draftJson, {}),
    leadScore: r.leadScore ?? null,
    inquiryId: r.inquiryId ?? null,
    receivedEmailId: r.receivedEmailId ?? null,
    status: r.status ?? "draft",
    createdAt: toDate(r.createdAt) ?? new Date(),
    updatedAt: toDate(r.updatedAt) ?? new Date(),
  }),
  WebhookLog: (r) => ({
    id: r.id,
    provider: r.provider ?? "paystack",
    event: r.event,
    paystackId: r.paystackId ?? null,
    reference: r.reference ?? null,
    invoiceId: r.invoiceId ?? null,
    invoiceNumber: r.invoiceNumber ?? null,
    amountKobo: r.amountKobo ?? null,
    currency: r.currency ?? null,
    signatureValid: !!r.signatureValid,
    source: r.source ?? "webhook",
    status: r.status ?? "received",
    result: parseJsonField(r.result, {}),
    payload: parseJsonField(r.payload, {}),
    error: r.error ?? null,
    receivedAt: toDate(r.receivedAt) ?? new Date(),
    processedAt: toDate(r.processedAt),
  }),
  AdminSession: (r) => ({
    id: r.id,
    token: r.token,
    expiresAt: toDate(r.expiresAt) ?? new Date(),
    createdAt: toDate(r.createdAt) ?? new Date(),
  }),
  Subscriber: (r) => ({
    id: r.id,
    email: r.email,
    status: r.status ?? "pending",
    confirmToken: r.confirmToken ?? null,
    unsubscribeToken: r.unsubscribeToken ?? null,
    confirmedAt: toDate(r.confirmedAt),
    createdAt: toDate(r.createdAt) ?? new Date(),
    updatedAt: toDate(r.updatedAt) ?? new Date(),
  }),
  Post: (r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    content: r.content,
    category: r.category,
    tags: parseJsonField(r.tags, []),
    author: r.author ?? "OKOMBA ANALYTICS",
    status: r.status ?? "draft",
    publishedAt: toDate(r.publishedAt),
    notifySentAt: toDate(r.notifySentAt),
    createdAt: toDate(r.createdAt) ?? new Date(),
    updatedAt: toDate(r.updatedAt) ?? new Date(),
  }),
  Testimonial: (r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    service: r.service,
    text: r.text,
    rating: r.rating ?? 5,
    avatar: r.avatar ?? null,
    status: r.status ?? "published",
    sortOrder: r.sortOrder ?? 0,
    createdAt: toDate(r.createdAt) ?? new Date(),
    updatedAt: toDate(r.updatedAt) ?? new Date(),
  }),
  EmailLog: (r) => ({
    id: r.id,
    type: r.type,
    recipientEmail: r.recipientEmail,
    subject: r.subject,
    postId: r.postId ?? null,
    subscriberId: r.subscriberId ?? null,
    status: r.status ?? "sent",
    error: r.error ?? null,
    sentAt: toDate(r.sentAt) ?? new Date(),
    bodyText: r.bodyText ?? null,
    bodyHtml: r.bodyHtml ?? null,
    attachments: parseJsonField(r.attachments, []),
    invoiceId: r.invoiceId ?? null,
  }),
  ReceivedEmail: (r) => ({
    id: r.id,
    source: r.source ?? "contact",
    name: r.name ?? null,
    email: r.email ?? null,
    phone: r.phone ?? null,
    subject: r.subject ?? null,
    message: r.message,
    leadScore: r.leadScore ?? null,
    meta: parseJsonField(r.meta, {}),
    inquiryId: r.inquiryId ?? null,
    createdAt: toDate(r.createdAt) ?? new Date(),
  }),
  Invoice: (r) => ({
    id: r.id,
    invoiceNumber: r.invoiceNumber,
    inquiryId: r.inquiryId ?? null,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    customerPhone: r.customerPhone ?? null,
    service: r.service,
    description: r.description ?? null,
    proposalJson: r.proposalJson ? parseJsonField(r.proposalJson, null) : null,
    amountKobo: r.amountKobo,
    currency: r.currency ?? "NGN",
    durationLabel: r.durationLabel ?? null,
    dueDate: toDate(r.dueDate),
    status: r.status ?? "draft",
    dvaAccountNumber: r.dvaAccountNumber ?? null,
    dvaBankName: r.dvaBankName ?? null,
    dvaBankCode: r.dvaBankCode ?? null,
    paystackReference: r.paystackReference ?? null,
    pdfUrl: r.pdfUrl ?? null,
    pdfStorage: r.pdfStorage ?? null,
    secureToken: r.secureToken ?? null,
    portalViewedAt: toDate(r.portalViewedAt),
    paymentProofUrl: r.paymentProofUrl ?? null,
    paymentProofName: r.paymentProofName ?? null,
    paymentProofUploadedAt: toDate(r.paymentProofUploadedAt),
    paidAt: toDate(r.paidAt),
    sentAt: toDate(r.sentAt),
    createdAt: toDate(r.createdAt) ?? new Date(),
    updatedAt: toDate(r.updatedAt) ?? new Date(),
  }),
  EventRecord: (r) => ({
    id: r.id,
    type: r.type,
    customerEmail: r.customerEmail ?? null,
    customerPhone: r.customerPhone ?? null,
    eventDate: toDate(r.eventDate) ?? new Date(),
    relatedInvoiceId: r.relatedInvoiceId ?? null,
    payload: parseJsonField(r.payload, {}),
    status: r.status ?? "scheduled",
    processedAt: toDate(r.processedAt),
    lastSentAt: toDate(r.lastSentAt),
    createdAt: toDate(r.createdAt) ?? new Date(),
  }),
  WhatsAppMessage: (r) => ({
    id: r.id,
    direction: r.direction,
    toPhone: r.toPhone ?? null,
    fromPhone: r.fromPhone ?? null,
    messageText: r.messageText ?? null,
    mediaUrl: r.mediaUrl ?? null,
    mediaFilename: r.mediaFilename ?? null,
    relatedInvoiceId: r.relatedInvoiceId ?? null,
    status: r.status ?? "queued",
    sentAt: toDate(r.sentAt) ?? new Date(),
  }),
  AnalyticsEvent: (r) => ({
    id: r.id,
    type: r.type,
    invoiceId: r.invoiceId ?? null,
    secureToken: r.secureToken ?? null,
    sessionId: r.sessionId ?? null,
    meta: parseJsonField(r.meta, {}),
    createdAt: toDate(r.createdAt) ?? new Date(),
  }),
  BackupLog: (r) => ({
    id: r.id,
    kind: r.kind ?? "db",
    target: r.target ?? "gdrive",
    status: r.status ?? "success",
    fileName: r.fileName ?? null,
    sizeBytes: r.sizeBytes ?? null,
    durationMs: r.durationMs ?? null,
    error: r.error ?? null,
    createdAt: toDate(r.createdAt) ?? new Date(),
  }),
  Customer: (r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone ?? null,
    whatsapp: r.whatsapp ?? null,
    company: r.company ?? null,
    role: r.role ?? null,
    status: r.status ?? "lead",
    tags: parseJsonField(r.tags, []),
    notes: r.notes ?? null,
    source: r.source ?? "manual",
    leadScore: r.leadScore ?? null,
    createdAt: toDate(r.createdAt) ?? new Date(),
    updatedAt: toDate(r.updatedAt) ?? new Date(),
    lastContactAt: toDate(r.lastContactAt),
  }),
  CustomerNote: (r) => ({
    id: r.id,
    customerId: r.customerId,
    author: r.author ?? "admin",
    body: r.body,
    context: r.context ?? null,
    createdAt: toDate(r.createdAt) ?? new Date(),
  }),
  CustomerMessage: (r) => ({
    id: r.id,
    customerId: r.customerId ?? null,
    toEmail: r.toEmail,
    toPhone: r.toPhone ?? null,
    channel: r.channel,
    subject: r.subject ?? null,
    body: r.body,
    status: r.status ?? "queued",
    error: r.error ?? null,
    sentAt: toDate(r.sentAt) ?? new Date(),
  }),
};

// Map of table name → Prisma delegate
const prismaDelegate = {
  Inquiry: "inquiry",
  DraftProposal: "draftProposal",
  WebhookLog: "webhookLog",
  AdminSession: "adminSession",
  Subscriber: "subscriber",
  Post: "post",
  Testimonial: "testimonial",
  EmailLog: "emailLog",
  ReceivedEmail: "receivedEmail",
  Invoice: "invoice",
  EventRecord: "eventRecord",
  WhatsAppMessage: "whatsAppMessage",
  AnalyticsEvent: "analyticsEvent",
  BackupLog: "backupLog",
  Customer: "customer",
  CustomerNote: "customerNote",
  CustomerMessage: "customerMessage",
};

// ────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────

async function main() {
  for (const table of TABLES) {
    const delegate = prismaDelegate[table];
    const mapper = mappers[table];
    if (!delegate || !mapper) {
      console.warn(`No mapper for table ${table} — skipping.`);
      continue;
    }

    console.log(`\n▸ ${table}`);
    let rows;
    try {
      rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
    } catch (err) {
      console.warn(`  ↳ table missing in SQLite — skipping (${err.message})`);
      continue;
    }
    console.log(`  Read ${rows.length} rows from SQLite`);
    stats[table].read = rows.length;
    if (rows.length === 0) continue;

    // Check existing rows in PostgreSQL by id
    const ids = rows.map((r) => r.id).filter(Boolean);
    let existing = new Set();
    if (ids.length > 0) {
      try {
        const found = await prisma[delegate].findMany({
          where: { id: { in: ids } },
          select: { id: true },
        });
        existing = new Set(found.map((r) => r.id));
      } catch (err) {
        console.warn(`  ↳ could not query existing ids (${err.message}) — proceeding to insert all`);
      }
    }

    let written = 0;
    let skipped = 0;
    let errored = 0;

    for (const row of rows) {
      try {
        if (existing.has(row.id)) {
          skipped++;
          continue;
        }
        const mapped = mapper(row);
        if (DRY_RUN) {
          log(`  → would insert ${delegate} ${row.id}`);
          written++;
          continue;
        }
        await prisma[delegate].create({ data: mapped });
        written++;
      } catch (err) {
        errored++;
        if (VERBOSE) console.error(`  ! ${delegate} ${row.id}: ${err.message}`);
      }
    }

    stats[table].written = written;
    stats[table].skipped = skipped;
    stats[table].error = errored;
    console.log(`  ${DRY_RUN ? "(dry-run) " : ""}Inserted ${written}, skipped ${skipped} (already present), errors ${errored}`);
  }

  // Summary
  console.log(`\n━ Migration ${DRY_RUN ? "(DRY RUN)" : "COMPLETE"} ━`);
  console.log("Table              | Read | Written | Skipped | Errors");
  console.log("-------------------+------+---------+--------+-------");
  let totalR = 0, totalW = 0, totalS = 0, totalE = 0;
  for (const t of TABLES) {
    const s = stats[t];
    console.log(`${t.padEnd(18)} | ${String(s.read).padStart(4)} | ${String(s.written).padStart(7)} | ${String(s.skipped).padStart(6)} | ${String(s.error).padStart(6)}`);
    totalR += s.read;
    totalW += s.written;
    totalS += s.skipped;
    totalE += s.error;
  }
  console.log("-------------------+------+---------+--------+-------");
  console.log(`${"TOTAL".padEnd(18)} | ${String(totalR).padStart(4)} | ${String(totalW).padStart(7)} | ${String(totalS).padStart(6)} | ${String(totalE).padStart(6)}`);
  if (totalE > 0) {
    console.log(`\n⚠ ${totalE} rows errored. Re-run with --verbose to see details.`);
  }
}

main()
  .catch((err) => {
    console.error("FATAL:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      sqlite?.close();
    } catch {}
    await prisma.$disconnect();
  });
