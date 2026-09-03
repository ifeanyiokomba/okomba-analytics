/* ─────────────────────────────────────────────────────────────
   Import extraction — Master Platform Evolution Directive §16
   "The CRM import system must support: CSV, Excel, PDF, Word,
   Documents, supported spreadsheet formats, Google Sheets,
   text-based structured documents."

   This module turns ANY supported file (Buffer) into raw rows
   (array of Record<string, unknown>) so the mapping stage can
   normalize them into the canonical Customer shape.

   Formats:
     csv / tsv — line-by-line RFC-4180-ish parser (streamed logic,
                 no external deps)
     xlsx / xls — exceljs (maintained; no ReDoS surface — Phase 27)
     pdf      — pdf-parse text extraction → LLM mapping stage
     docx     — mammoth raw-text extraction → LLM mapping stage
     txt      — raw text → LLM mapping stage
     json     — JSON.parse → array of objects (direct rows)

   Large-file safety (§17 + Phase 27 hardening):
     - hard byte cap BEFORE any parse (default 50 MB)
     - hard row cap (default 50,000) applied while streaming
     - hard column cap (default 64)
   ───────────────────────────────────────────────────────────── */

export const IMPORT_FORMATS = [
  "csv",
  "tsv",
  "xlsx",
  "xls",
  "pdf",
  "docx",
  "txt",
  "json",
] as const;
export type ImportFormat = (typeof IMPORT_FORMATS)[number];

export const MAX_IMPORT_BYTES = 50 * 1024 * 1024; // §17 large imports
export const MAX_IMPORT_ROWS = 50_000;
export const MAX_IMPORT_COLUMNS = 64;

export type ExtractResult = {
  format: ImportFormat;
  headers: string[];
  rows: Record<string, unknown>[];
  /** For pdf/docx/txt: the raw text is carried for the LLM stage. */
  rawText?: string;
  truncated: boolean;
};

/** Detect format from filename + optional content-type. */
export function detectImportFormat(
  fileName: string,
  contentType?: string | null
): ImportFormat | null {
  const name = fileName.toLowerCase().trim();
  const byExt = name.match(/\.(csv|tsv|xlsx|xls|pdf|docx|txt|json)$/);
  if (byExt) return byExt[1] as ImportFormat;
  // No/unknown extension — sniff from content-type
  const ct = (contentType ?? "").toLowerCase();
  if (ct.includes("csv")) return "csv";
  if (ct.includes("tab-separated")) return "tsv";
  if (ct.includes("spreadsheet") || ct.includes("excel"))
    return name.includes("xls") ? "xlsx" : "csv";
  if (ct.includes("pdf")) return "pdf";
  if (ct.includes("wordprocessing")) return "docx";
  if (ct.includes("json")) return "json";
  if (ct.startsWith("text/")) return "txt";
  return null;
}

/* ── CSV / TSV ─────────────────────────────────────────────── */

export function parseDelimited(
  text: string,
  delimiter: "," | "\t" = ",",
  maxRows = MAX_IMPORT_ROWS,
  maxColumns = MAX_IMPORT_COLUMNS
): { headers: string[]; rows: Record<string, unknown>[]; truncated: boolean } {
  const lines = text.split(/\r?\n/);
  // skip fully-empty lines
  const contentLines = lines.filter((l) => l.trim().length > 0);
  if (contentLines.length === 0) return { headers: [], rows: [], truncated: false };

  const headers = splitDelimitedLine(contentLines[0], delimiter)
    .map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"))
    .slice(0, maxColumns);
  // Guard: a single-column "header" that isn't a plausible label means
  // the file probably has no header row — synthesize col_1..N.
  const synth = headers.length === 1 && !/name|email|phone|company/.test(headers[0]);

  const rows: Record<string, unknown>[] = [];
  const limit = Math.min(contentLines.length, synth ? maxRows : maxRows + 1);
  for (let i = 1; i < limit; i++) {
    const cells = splitDelimitedLine(contentLines[i], delimiter);
    const row: Record<string, unknown> = {};
    for (let c = 0; c < Math.min(headers.length, maxColumns); c++) {
      row[synth ? `col_${c + 1}` : headers[c]] = cells[c]?.trim() ?? "";
    }
    rows.push(row);
  }
  return {
    headers: synth ? headers.map((_, i) => `col_${i + 1}`) : headers,
    rows,
    truncated: contentLines.length > limit,
  };
}

/** RFC-4180-ish splitter — handles quoted values + escaped quotes. */
function splitDelimitedLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === delimiter) {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/* ── XLSX / XLS (exceljs) ──────────────────────────────────── */

export async function parseSpreadsheet(
  buf: Buffer,
  maxRows = MAX_IMPORT_ROWS,
  maxColumns = MAX_IMPORT_COLUMNS
): Promise<{ headers: string[]; rows: Record<string, unknown>[]; truncated: boolean }> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buf as unknown as ArrayBuffer, {
    ignoreNodes: [
      "conditionalFormatting",
      "dataValidations",
      "hyperlinks",
      "drawings",
      "charts",
      "sheetPr",
    ],
  });
  const sheet = workbook.worksheets[0];
  if (!sheet) return { headers: [], rows: [], truncated: false };

  const headers: string[] = [];
  const rows: Record<string, unknown>[] = [];
  let rowCount = 0;
  let truncated = false;
  sheet.eachRow({ includeEmpty: false }, (row) => {
    rowCount += 1;
    if (rowCount > maxRows + 1) {
      truncated = true;
      return;
    }
    const values = (row.values as unknown[]).slice(1, maxColumns + 2);
    if (rowCount === 1) {
      for (const v of values) {
        if (typeof v === "string" && v.trim()) {
          headers.push(v.trim().toLowerCase().replace(/\s+/g, "_"));
        } else {
          headers.push(`col_${headers.length + 1}`);
        }
      }
      return;
    }
    const obj: Record<string, unknown> = {};
    for (let c = 0; c < headers.length; c++) {
      const v = values[c];
      obj[headers[c]] = typeof v === "string" ? v.trim() : v ?? "";
    }
    rows.push(obj);
  });
  return { headers, rows, truncated };
}

/* ── PDF (pdf-parse — use the internal build to dodge the
      module.parent debug-file trap in the package root) ─────── */

export async function parsePdfText(buf: Buffer): Promise<string> {
  const mod = (await import("pdf-parse/lib/pdf-parse.js" as any)) as {
    default: (b: Buffer) => Promise<{ text: string }>;
  };
  const fn = mod.default ?? (mod as unknown as typeof mod.default);
  const result = await fn(buf);
  return result.text ?? "";
}

/* ── DOCX (mammoth raw text) ───────────────────────────────── */

export async function parseDocxText(buf: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: buf });
  return result.value ?? "";
}

/* ── Main entry ────────────────────────────────────────────── */

export async function extractRows(
  buf: Buffer,
  format: ImportFormat,
  fileName: string
): Promise<ExtractResult> {
  if (buf.length > MAX_IMPORT_BYTES) {
    throw new Error(
      `File exceeds the ${MAX_IMPORT_BYTES / (1024 * 1024)} MB import limit`
    );
  }

  switch (format) {
    case "csv":
    case "tsv": {
      const text = buf.toString("utf-8").replace(/^\uFEFF/, "");
      const { headers, rows, truncated } = parseDelimited(
        text,
        format === "tsv" ? "\t" : ","
      );
      return { format, headers, rows, truncated };
    }
    case "xlsx":
    case "xls": {
      const { headers, rows, truncated } = await parseSpreadsheet(buf);
      return { format, headers, rows, truncated };
    }
    case "pdf": {
      const rawText = await parsePdfText(buf);
      if (!rawText.trim()) throw new Error("PDF contains no extractable text");
      return { format, headers: [], rows: [], rawText, truncated: false };
    }
    case "docx": {
      const rawText = await parseDocxText(buf);
      if (!rawText.trim()) throw new Error("Document contains no extractable text");
      return { format, headers: [], rows: [], rawText, truncated: false };
    }
    case "txt": {
      const rawText = buf.toString("utf-8").replace(/^\uFEFF/, "");
      if (!rawText.trim()) throw new Error("File is empty");
      return { format, headers: [], rows: [], rawText, truncated: false };
    }
    case "json": {
      const parsed = JSON.parse(buf.toString("utf-8"));
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      if (arr.length === 0) throw new Error("JSON contains no records");
      const capped = arr.slice(0, MAX_IMPORT_ROWS);
      const headers = Object.keys(capped[0] as object).slice(0, MAX_IMPORT_COLUMNS);
      return {
        format,
        headers,
        rows: capped as Record<string, unknown>[],
        truncated: arr.length > capped.length,
      };
    }
    default:
      throw new Error(`Unsupported import format for "${fileName}"`);
  }
}
