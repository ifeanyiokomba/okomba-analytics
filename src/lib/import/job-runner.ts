/* ─────────────────────────────────────────────────────────────
   Import job runner — Directive §17 "Large Import Support"
   "The AI/import system should handle thousands of records.
    Do not process huge files inside a single blocking HTTP
    request."

   Pipeline:  create → fetch (url/sheets/drive) → extract →
   map (LLM chunks w/ deterministic fallback) → validate →
   AWAITING_APPROVAL (preview gate §16) → [admin approves] →
   import in CHUNKS (upsert by email; count created/updated/
   failed per chunk) → completed.

   Retry (§17): failed chunks are recorded individually in
   ImportJob.chunkStates; POST /import-v2/retry re-runs ONLY
   failed chunks.

   Execution model: fire-and-forget async loop IN-PROCESS (the
   single-instance runtime this platform runs on), with ALL state
   persisted to the ImportJob DB row so progress survives page
   reloads, and a run-registry prevents double-execution.
   ───────────────────────────────────────────────────────────── */

import { db } from "@/lib/db";
import {
  extractRows,
  type ImportFormat,
  MAX_IMPORT_ROWS,
} from "./extract";
import {
  fetchGoogleSheetCsv,
  fetchGoogleDriveFile,
  fetchUrlFile,
  ImportFetchError,
} from "./fetch-source";
import {
  mapDeterministic,
  mapRowsWithLlm,
  mapTextWithLlm,
  normalizeMappedRows,
  isNoLlmOptOut,
  type CanonicalRow,
} from "./map-fields";

const IMPORT_CHUNK_SIZE = 200;

/* Status vocabulary (see prisma/schema.prisma ImportJob) */
export type ImportStatus =
  | "created"
  | "fetching"
  | "extracting"
  | "mapping"
  | "awaiting_approval"
  | "importing"
  | "completed"
  | "failed"
  | "cancelled";

/** In-process run registry — prevents double-execution of a job. */
const running = new Set<string>();

async function patch(id: string, data: Record<string, unknown>) {
  await db.importJob.update({ where: { id }, data });
}

/* ── Stage 1: acquire bytes from any source ────────────────── */

async function fetchSource(job: { id: string; source: string; sourceUrl: string | null; fileName: string }) {
  await patch(job.id, { status: "fetching", stage: "Downloading source…", startedAt: new Date() });
  if (job.source === "upload" || !job.sourceUrl) {
    throw new Error("Upload jobs receive bytes with the request; nothing to fetch");
  }
  if (job.source === "google_sheets") {
    const { buf, fileName } = await fetchGoogleSheetCsv(job.sourceUrl);
    return { buf, fileName, contentType: "text/csv" as string | null };
  }
  if (job.source === "google_drive") {
    const { buf, fileName, contentType } = await fetchGoogleDriveFile(job.sourceUrl);
    return { buf, fileName, contentType };
  }
  // generic url
  const { buf, fileName, contentType } = await fetchUrlFile(job.sourceUrl);
  return { buf, fileName, contentType };
}

/* ── Stage 2+3: extract + map + validate ───────────────────── */

async function extractAndMap(
  jobId: string,
  buf: Buffer,
  format: ImportFormat,
  fileName: string
): Promise<{ usedFallback: boolean }> {
  await patch(jobId, { status: "extracting", stage: `Extracting rows from ${format.toUpperCase()}…` });
  const extracted = await extractRows(buf, format, fileName);

  let mapped: Array<Record<string, unknown> | null> | null = null;
  let usedFallback = false;

  if (extracted.rawText !== undefined) {
    // PDF / DOCX / TXT — LLM reads the text (deterministic impossible)
    await patch(jobId, { status: "mapping", stage: "AI is reading the document…" });
    mapped = await mapTextWithLlm(extracted.rawText);
    if (!mapped) {
      if (isNoLlmOptOut()) {
        throw new Error(
          "Document-format imports need AI extraction, but CRM_IMPORT_NO_LLM is set. Use CSV/Excel or enable AI mapping."
        );
      }
      throw new Error("Could not identify any customer records in the document text");
    }
  } else {
    await patch(jobId, {
      status: "mapping",
      stage: `AI is mapping ${extracted.rows.length.toLocaleString()} rows…`,
      recordsFound: extracted.rows.length,
      columnsDetected: extracted.headers,
    });
    const result = await mapRowsWithLlm(
      extracted.rows,
      `Source file: "${fileName}" (${extracted.rows.length} rows, columns: ${extracted.headers.join(", ")})`
    );
    mapped = result.mapped;
    usedFallback = result.usedFallback;
    if (!mapped) {
      mapped = mapDeterministic(extracted.rows);
      usedFallback = true;
    }
  }

  // Validate + normalize (§16 "Validate" + duplicate resolution within file)
  const { rows, stats } = normalizeMappedRows(mapped);
  if (rows.length === 0) {
    throw new Error(
      `No valid customer records found (valid: ${stats.valid}, duplicates: ${stats.duplicates}, invalid: ${stats.invalid})`
    );
  }

  await patch(jobId, {
    status: "awaiting_approval",
    stage: `Preview ready — ${rows.length.toLocaleString()} valid record(s) awaiting approval`,
    rows: rows as unknown[],
    recordsFound: stats.total,
    validCount: stats.valid,
    duplicateCount: stats.duplicates,
    invalidCount: stats.invalid,
    usedFallback,
  });
  return { usedFallback };
}

/* ── Stage 4: chunked import (after admin approval) ─────────── */

export async function runImportPhase(jobId: string): Promise<void> {
  const job = await db.importJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  const rows = (job.rows as unknown as CanonicalRow[]) ?? [];
  const totalChunks = Math.max(1, Math.ceil(rows.length / IMPORT_CHUNK_SIZE));

  // Initialize chunk state if this is the first import pass
  let chunkStates = (job.chunkStates as unknown as string[]) ?? [];
  if (chunkStates.length !== totalChunks) {
    chunkStates = Array.from({ length: totalChunks }, () => "pending");
  }

  await patch(jobId, {
    status: "importing",
    stage: `Importing ${rows.length.toLocaleString()} customers in ${totalChunks} chunk(s)…`,
    totalChunks,
    chunkStates,
    approvedAt: job.approvedAt ?? new Date(),
  });

  let imported = job.importedCount;
  let existing = job.existingCount;
  let failed = job.failedCount;

  for (let c = 0; c < totalChunks; c++) {
    // Re-read state each chunk (retry endpoint may have reset it)
    const current = await db.importJob.findUnique({ where: { id: jobId } });
    if (!current) return;
    if (current.status === "cancelled") return; // §16 approval gate — admin cancelled
    const states = (current.chunkStates as unknown as string[]) ?? [];
    if (states[c] === "done") {
      continue; // already imported (idempotent resume)
    }

    const chunk = rows.slice(c * IMPORT_CHUNK_SIZE, (c + 1) * IMPORT_CHUNK_SIZE);
    try {
      for (const row of chunk) {
        // Upsert by email — duplicate resolution against EXISTING DB
        // customers (§16 "Resolve duplicates"): existing rows are
        // UPDATED (never duplicated), counted separately.
        const fullName = [row.firstName, row.lastName].filter(Boolean).join(" ") || row.email.split("@")[0];
        const existingCustomer = await db.customer.findUnique({
          where: { email: row.email },
          select: { id: true },
        });
        await db.customer.upsert({
          where: { email: row.email },
          create: {
            name: fullName.slice(0, 120),
            firstName: row.firstName,
            lastName: row.lastName,
            countryCode: row.countryCode,
            email: row.email,
            phone: row.phone,
            whatsapp: row.whatsapp,
            company: row.company,
            role: row.role,
            status: row.status,
            tags: row.tags,
            notes: row.notes ? `[import] ${row.notes}` : null,
            source: "import",
            leadScore: row.leadScore,
          },
          update: {
            firstName: row.firstName ?? undefined,
            lastName: row.lastName ?? undefined,
            countryCode: row.countryCode ?? undefined,
            phone: row.phone ?? undefined,
            whatsapp: row.whatsapp ?? undefined,
            company: row.company ?? undefined,
            role: row.role ?? undefined,
            tags: row.tags.length ? (row.tags as string[]) : undefined,
            leadScore: row.leadScore ?? undefined,
          },
        });
        if (existingCustomer) existing++;
        else imported++;
      }
      states[c] = "done";
    } catch (err) {
      console.error(`[import-job ${jobId}] chunk ${c} failed:`, err);
      states[c] = "failed";
      failed += chunk.filter(() => true).length; // rows in this failed chunk
      // On retry, failed rows will be recounted — reset counters below
    }

    await patch(jobId, {
      chunkStates: states as unknown[],
      importedCount: imported,
      existingCount: existing,
      failedCount: 0, // recomputed below
    });

    // Recompute failed from chunk states (source of truth)
    const failedRows = states.reduce(
      (acc, s, idx) =>
        s === "failed"
          ? acc + rows.slice(idx * IMPORT_CHUNK_SIZE, (idx + 1) * IMPORT_CHUNK_SIZE).length
          : acc,
      0
    );
    await patch(jobId, {
      chunkStates: states as unknown[],
      importedCount: imported,
      existingCount: existing,
      failedCount: failedRows,
      stage: `Importing… ${Math.min((c + 1) * IMPORT_CHUNK_SIZE, rows.length).toLocaleString()}/${rows.length.toLocaleString()}`,
    });
  }

  // Final state
  const finalStates = (await db.importJob.findUnique({ where: { id: jobId } }))?.chunkStates as unknown as string[];
  const hasFailed = finalStates?.some((s) => s === "failed");
  await patch(jobId, {
    status: "completed",
    stage: hasFailed
      ? `Completed with ${job.failedCount} failed row(s) — retry available`
      : "Import completed successfully",
    finishedAt: new Date(),
  });
}

/** Retry ONLY failed chunks (§17 "support retrying failed chunks"). */
export async function retryFailedChunks(jobId: string): Promise<{ ok: boolean; error?: string }> {
  const job = await db.importJob.findUnique({ where: { id: jobId } });
  if (!job) return { ok: false, error: "Import job not found" };
  if (job.status !== "completed" && job.status !== "failed") {
    return { ok: false, error: "Only completed/failed jobs can retry chunks" };
  }
  const states = (job.chunkStates as unknown as string[]) ?? [];
  if (!states.some((s) => s === "failed")) {
    return { ok: false, error: "No failed chunks to retry" };
  }
  // Reset failed chunks to pending + zero the failed counter
  const reset = states.map((s) => (s === "failed" ? "pending" : s));
  await patch(jobId, {
    chunkStates: reset as unknown[],
    failedCount: 0,
    status: "importing",
    stage: "Retrying failed chunks…",
    finishedAt: null,
  });
  void runImportPhase(jobId).catch(async (err) => {
    await patch(jobId, { status: "failed", error: String(err), finishedAt: new Date() });
  });
  return { ok: true };
}

/* ── Full pipeline starter (create → … → awaiting_approval) ── */

export async function startImportJob(jobId: string): Promise<void> {
  if (running.has(jobId)) return; // already executing in-process
  running.add(jobId);
  try {
    const job = await db.importJob.findUnique({ where: { id: jobId } });
    if (!job) return;
    if (job.status !== "created") return; // resumed/foreign job

    let buf: Buffer | null = null;
    let fileName = job.fileName;
    let format = job.format as ImportFormat;

    if (job.source !== "upload") {
      const fetched = await fetchSource(job);
      buf = fetched.buf;
      fileName = fetched.fileName;
      // Re-detect format for extensionless downloads (Drive/URL)
      const { detectImportFormat } = await import("./extract");
      const detected = detectImportFormat(fileName, fetched.contentType);
      if (detected) format = detected;
      await patch(jobId, { fileName, format, fileSize: buf.length });
    } else {
      throw new Error("Upload jobs must deliver their file buffer at creation");
    }

    await extractAndMap(jobId, buf, format, fileName);
  } catch (err) {
    const message =
      err instanceof ImportFetchError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Import failed";
    console.error(`[import-job ${jobId}] failed:`, err);
    await patch(jobId, {
      status: "failed",
      error: message,
      stage: "Failed",
      finishedAt: new Date(),
    }).catch(() => undefined);
  } finally {
    running.delete(jobId);
  }
}

/**
 * Run the full pipeline SYNCHRONOUSLY for upload jobs whose buffer
 * arrived with the request (avoids storing the raw file in DB).
 * Used by POST /api/admin/customers/import-v2 for device uploads.
 */
export async function runUploadPipeline(
  jobId: string,
  buf: Buffer,
  format: ImportFormat,
  fileName: string
): Promise<void> {
  if (running.has(jobId)) return;
  running.add(jobId);
  try {
    await patch(jobId, { fileSize: buf.length, startedAt: new Date(), stage: "Extracting rows…" });
    await extractAndMap(jobId, buf, format, fileName);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    console.error(`[import-job ${jobId}] failed:`, err);
    await patch(jobId, {
      status: "failed",
      error: message,
      stage: "Failed",
      finishedAt: new Date(),
    }).catch(() => undefined);
    throw err; // re-throw so the HTTP caller can surface the error immediately
  } finally {
    running.delete(jobId);
  }
}

/** Approve → kick off the chunked import phase (fire-and-forget). */
export function approveAndImport(jobId: string): void {
  void runImportPhase(jobId).catch(async (err) => {
    await patch(jobId, { status: "failed", error: String(err), finishedAt: new Date() }).catch(
      () => undefined
    );
  });
}

export { IMPORT_CHUNK_SIZE, MAX_IMPORT_ROWS };
