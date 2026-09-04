import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import {
  detectImportFormat,
  extractRows,
  IMPORT_FORMATS,
} from "@/lib/import/extract";
import {
  mapDeterministic,
  mapRowsWithLlm,
  normalizeMappedRows,
  isNoLlmOptOut,
} from "@/lib/import/map-fields";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/admin/customers/import (LEGACY small-file path)           */
/*   Synchronous CSV/Excel/TXT/JSON parse + AI mapping → preview      */
/*   rows. Response contract preserved (worklog Batch audits +        */
/*   PII governance flag). Extraction + mapping now live in the       */
/*   SHARED libs (src/lib/import/*), also used by the job-based      */
/*   import-v2 route — no duplicated logic (directive §3-F).          */
/*                                                                     */
/*   Body: multipart/form-data { file }                                */
/*   Response: { ok, rows, totalRows, detectedColumns, usedFallback }  */
/*                                                                     */
/*   For LARGE imports (thousands of rows, PDF/DOCX, Google           */
/*   Sheets/Drive, chunked retry) use import-v2 + the wizard UI.      */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  try {
    const guard = await authorizeAdmin(req, "import_customers");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
    }

    const format = detectImportFormat(file.name, file.type);
    if (!format || !IMPORT_FORMATS.includes(format)) {
      return NextResponse.json(
        { ok: false, error: "Unsupported file type — upload a .csv or .xlsx file" },
        { status: 400 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());

    // Shared extractor (has its own byte/row/column caps)
    const extracted = await extractRows(buf, format, file.name.toLowerCase());

    let mapped: Array<Record<string, unknown> | null> | null = null;
    let usedFallback = false;

    if (extracted.rawText !== undefined) {
      // txt/json-free text on the legacy path — deterministic parse
      // cannot interpret free text; require the v2 AI pipeline.
      return NextResponse.json(
        {
          ok: false,
          error:
            "Document-format files need the AI import wizard — use the new Import dialog (Upload → any format).",
        },
        { status: 400 }
      );
    }

    const noLlm = isNoLlmOptOut();
    if (noLlm) {
      console.info(
        "[customers/import] CRM_IMPORT_NO_LLM is set — deterministic header-name mapper only (PII governance opt-out)."
      );
      usedFallback = true;
    } else {
      const result = await mapRowsWithLlm(
        extracted.rows,
        `Here are customer rows from the file "${file.name}".`
      );
      mapped = result.mapped;
      usedFallback = result.usedFallback;
    }
    if (!mapped) {
      mapped = mapDeterministic(extracted.rows);
      usedFallback = true;
    }

    // Shared validator/normalizer (dedupe by email, clamp, ISO-2)
    const { rows, stats } = normalizeMappedRows(mapped);

    return NextResponse.json({
      ok: true,
      rows: rows.map((r) => ({
        name: [r.firstName, r.lastName].filter(Boolean).join(" ") || r.email.split("@")[0],
        firstName: r.firstName,
        lastName: r.lastName,
        countryCode: r.countryCode,
        email: r.email,
        phone: r.phone,
        whatsapp: r.whatsapp,
        company: r.company,
        role: r.role,
        notes: r.notes,
        tags: r.tags,
        status: r.status,
        leadScore: r.leadScore,
        source: format === "csv" ? "csv" : "excel",
      })),
      totalRows: stats.total,
      detectedColumns: extracted.headers,
      usedFallback,
      duplicatesInFile: stats.duplicates,
      invalidRows: stats.invalid,
      fileName: file.name,
    });
  } catch (err) {
    console.error("[POST /api/admin/customers/import]", err);
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
