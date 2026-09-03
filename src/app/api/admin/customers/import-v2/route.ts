import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { detectImportFormat, IMPORT_FORMATS, type ImportFormat } from "@/lib/import/extract";
import { runUploadPipeline, startImportJob } from "@/lib/import/job-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────────
   POST /api/admin/customers/import-v2
   Directive §16/§17 — job-based large import pipeline.

   Two request shapes:
     1. multipart/form-data { file }        — device upload
        → job runs extraction synchronously (fast, no raw file in
          DB), then awaits admin approval.
     2. application/json { source, url }    — url | google_sheets |
        google_drive → job created, background runner fetches.
   Response: { ok, jobId }
   ───────────────────────────────────────────────────────────── */

const MAX_PREVIEW_ROWS_RETURNED = 200;

export async function POST(req: Request) {
  try {
    if (!(await isAdminAuthorized(req))) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") ?? "";
    let source = "upload";
    let sourceUrl: string | null = null;
    let fileName = "import";
    let format: ImportFormat | null = null;
    let fileSize = 0;
    let uploadBuf: Buffer | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
      }
      fileName = file.name || "upload";
      format = detectImportFormat(fileName, file.type);
      if (!format || !IMPORT_FORMATS.includes(format)) {
        return NextResponse.json(
          {
            ok: false,
            error: `Unsupported file type "${fileName}". Supported: CSV, TSV, XLSX, XLS, PDF, DOCX, TXT, JSON.`,
          },
          { status: 400 }
        );
      }
      fileSize = file.size;
      uploadBuf = Buffer.from(await file.arrayBuffer());
    } else {
      const body = (await req.json().catch(() => null)) as {
        source?: string;
        url?: string;
      } | null;
      if (!body?.url || !body.source) {
        return NextResponse.json(
          { ok: false, error: "Provide { source: 'url'|'google_sheets'|'google_drive', url }" },
          { status: 400 }
        );
      }
      const allowed = ["url", "google_sheets", "google_drive"];
      if (!allowed.includes(body.source)) {
        return NextResponse.json({ ok: false, error: "Invalid source" }, { status: 400 });
      }
      source = body.source;
      sourceUrl = body.url.trim();
      if (!/^https?:\/\//i.test(sourceUrl)) {
        return NextResponse.json({ ok: false, error: "URL must start with http(s)://" }, { status: 400 });
      }
      fileName = source === "google_sheets" ? "Google Sheet" : source === "google_drive" ? "Google Drive file" : sourceUrl;
      format = "csv"; // provisional — runner re-detects after download
    }

    // Create the job record FIRST (progress is DB-tracked §17)
    const job = await db.importJob.create({
      data: {
        source,
        sourceUrl,
        fileName,
        format: format ?? "csv",
        fileSize,
        status: "created",
        stage: "Queued",
      },
    });

    if (source === "upload" && uploadBuf) {
      // Run extraction synchronously so the admin immediately gets
      // either a preview-ready job or a surfaced error. Mapping of
      // very large row sets still runs in chunks inside.
      try {
        await runUploadPipeline(job.id, uploadBuf, format as ImportFormat, fileName);
      } catch {
        // job row already marked failed with error message
        const failed = await db.importJob.findUnique({ where: { id: job.id } });
        return NextResponse.json(
          { ok: false, error: failed?.error ?? "Extraction failed", jobId: job.id },
          { status: 400 }
        );
      }
    } else {
      // Background fetch + extract + map (fire-and-forget §17)
      void startImportJob(job.id);
    }

    return NextResponse.json({ ok: true, jobId: job.id });
  } catch (err) {
    console.error("[POST /api/admin/customers/import-v2]", err);
    return NextResponse.json({ ok: false, error: "Import failed" }, { status: 500 });
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/admin/customers/import-v2?id=…
   Progress polling + preview (§17 admin sees: found / processed /
   valid / duplicates / invalid / imported / failed).
   Also supports ?history=1 for the recent-jobs list.
   ───────────────────────────────────────────────────────────── */

const PREVIEW_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "whatsapp",
  "countryCode",
  "company",
  "role",
  "notes",
  "tags",
  "status",
  "leadScore",
];

export async function GET(req: Request) {
  try {
    if (!(await isAdminAuthorized(req))) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);

    if (searchParams.get("history")) {
      const jobs = await db.importJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          source: true,
          fileName: true,
          format: true,
          status: true,
          stage: true,
          recordsFound: true,
          validCount: true,
          importedCount: true,
          existingCount: true,
          failedCount: true,
          duplicateCount: true,
          invalidCount: true,
          usedFallback: true,
          createdAt: true,
          finishedAt: true,
        },
      });
      return NextResponse.json({ ok: true, jobs });
    }

    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing ?id" }, { status: 400 });
    }
    const job = await db.importJob.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ ok: false, error: "Import job not found" }, { status: 404 });
    }

    const allRows = (job.rows as unknown as Record<string, unknown>[]) ?? [];
    const previewRows = allRows.slice(0, MAX_PREVIEW_ROWS_RETURNED).map((r) => {
      const trimmed: Record<string, unknown> = {};
      for (const f of PREVIEW_FIELDS) trimmed[f] = r[f] ?? null;
      return trimmed;
    });

    return NextResponse.json({
      ok: true,
      job: {
        id: job.id,
        source: job.source,
        sourceUrl: job.sourceUrl,
        fileName: job.fileName,
        format: job.format,
        fileSize: job.fileSize,
        status: job.status,
        stage: job.stage,
        error: job.error,
        recordsFound: job.recordsFound,
        validCount: job.validCount,
        duplicateCount: job.duplicateCount,
        invalidCount: job.invalidCount,
        importedCount: job.importedCount,
        existingCount: job.existingCount,
        failedCount: job.failedCount,
        totalChunks: job.totalChunks,
        chunkStates: job.chunkStates,
        usedFallback: job.usedFallback,
        createdAt: job.createdAt,
        approvedAt: job.approvedAt,
        finishedAt: job.finishedAt,
      },
      previewRows,
      previewTruncated: allRows.length > MAX_PREVIEW_ROWS_RETURNED,
      totalRows: allRows.length,
    });
  } catch (err) {
    console.error("[GET /api/admin/customers/import-v2]", err);
    return NextResponse.json({ ok: false, error: "Lookup failed" }, { status: 500 });
  }
}
