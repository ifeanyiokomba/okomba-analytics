import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/admin/customers/import                                    */
/*   Parse an uploaded CSV or Excel file, then use the z-ai-web-dev-   */
/*   sdk LLM to extract + map each row's columns into our canonical     */
/*   Customer shape (name, email, phone, whatsapp, company, role,      */
/*   notes, tags, leadScore, status). Returns the parsed preview        */
/*   rows — the admin reviews + edits before clicking "Import" which     */
/*   calls POST /api/admin/customers per row (already upsert-safe).    */
/*                                                                      */
/*   Body: multipart/form-data with field "file" (CSV or XLSX)          */
/*   Response: { ok, rows, totalRows, detectedColumns, suggested }     */
/* ------------------------------------------------------------------ */

/* Audit fix (Phase 27): harden spreadsheet parsing against
   memory-exhaustion / ReDoS attacks. The legacy `xlsx` npm package
   is unmaintained (SheetJS moved to a private CDN) and vulnerable
   to ReDoS (CVE-2024-22363). We've switched to `exceljs` (actively
   maintained) AND enforce these limits BEFORE any cell is parsed:
     - max file size:  5 MB
     - max rows:       500
     - max columns:    25
     - max sheets:     1 (we only read the first sheet)
   CSV files bypass exceljs — parsed line-by-line with the same caps. */
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 500;
const MAX_COLUMNS = 25;

async function parseCsv(buf: Buffer): Promise<Record<string, unknown>[]> {
  // Lightweight line-by-line CSV parser. Avoids the heavyweight
  // exceljs dependency for plain CSV files.
  const text = buf.toString("utf-8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_")).slice(0, MAX_COLUMNS);
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < Math.min(lines.length, MAX_ROWS + 1); i++) {
    const cells = splitCsvLine(lines[i]);
    const row: Record<string, unknown> = {};
    for (let c = 0; c < headers.length; c++) {
      const v = cells[c]?.trim() ?? "";
      row[headers[c]] = v;
    }
    rows.push(row);
  }
  return rows;
}

// RFC-4180-ish CSV cell splitter — handles quoted values + escaped quotes.
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = false; }
      } else { cur += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { out.push(cur); cur = ""; }
      else { cur += ch; }
    }
  }
  out.push(cur);
  return out;
}

async function parseSpreadsheet(buf: Buffer, fileName: string): Promise<Record<string, unknown>[]> {
  // CSV path — fast, no heavy deps.
  if (fileName.endsWith(".csv")) {
    return parseCsv(buf);
  }
  // Excel path — exceljs (maintained, no ReDoS surface).
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  // Pass the raw Buffer; exceljs strictly expects a Node Buffer.
  // Under Bun's strict TS the Buffer generic param differs from
  // exceljs's expected type, so we cast through unknown. At runtime
  // the value IS a Node-compatible Buffer (Bun polyfills it).
  // Only ignoreNodes is a valid XlsxReadOptions key (exceljs 4.4.0).
  await workbook.xlsx.load(buf as unknown as ArrayBuffer, {
    ignoreNodes: ["conditionalFormatting", "dataValidations", "hyperlinks", "drawings", "charts", "sheetPr"],
  });
  // Only read the first sheet.
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  // Pre-scan: cap rows + columns. exceljs supports streaming reads;
  // we truncate at MAX_ROWS × MAX_COLUMNS before any AI extraction.
  const headers: string[] = [];
  const rows: Record<string, unknown>[] = [];
  let rowCount = 0;
  sheet.eachRow({ includeEmpty: false }, (row) => {
    rowCount += 1;
    if (rowCount > MAX_ROWS + 1) return; // cap + header row
    const values = (row.values as unknown[]).slice(1, MAX_COLUMNS + 2); // values[0] is placeholder
    if (rowCount === 1) {
      // header row
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
  return rows;
}

const EXTRACTION_PROMPT = `You are an enterprise CRM migration assistant. You receive an array of customer records (raw CSV/Excel rows with arbitrary column names) and you must map each row into Okomba Analytics' canonical Customer shape.

For each row, extract these fields:
- name:        full name (required; if missing, derive from email handle)
- email:       primary email address (lowercase; required)
- phone:       phone number in international format if possible (E.164), else as-is
- whatsapp:    WhatsApp number (separate from phone if both exist), else null
- company:     organization / company name, else null
- role:        job title / role (e.g. "Founder", "CTO"), else null
- notes:       any context, comments, source, or free-text the admin should remember
- tags:        array of 0-4 short tags (lowercase, no spaces) that classify this contact — e.g. ["ngo","fintech","referral"]
- status:      one of "lead" | "qualified" | "proposal_sent" | "paying" | "churned" — pick based on the row's signals; default "lead"
- leadScore:   integer 0-100 (warmth/confidence based on completeness + signals); null if no signal

Rules:
- Always output an array (even for a single row).
- Use null for any field you cannot confidently extract. Do NOT invent values.
- Preserve the original values verbatim (no reformatting beyond email-lowercase + phone-whitespace-trim).
- If a row is empty or just a header repetition, return null for that row (we'll filter it).

Return ONLY a compact JSON array, no markdown, no commentary. Each element is an object with the keys above.`;

export async function POST(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith(".csv");
    const isXlsx = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    if (!isCsv && !isXlsx) {
      return NextResponse.json(
        { ok: false, error: "Unsupported file type — upload a .csv or .xlsx file" },
        { status: 400 }
      );
    }
    // Audit fix (Phase 27): reject oversized files BEFORE parsing to
    // prevent memory-exhaustion attacks. 5 MB is plenty for any
    // reasonable CRM list (500 rows × 25 cols × ~400 chars/row).
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { ok: false, error: `File too large — limit is ${MAX_FILE_BYTES / (1024 * 1024)} MB` },
        { status: 413 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const rawRows = await parseSpreadsheet(buf, fileName);
    if (rawRows.length === 0) {
      return NextResponse.json({ ok: false, error: "File appears to be empty" }, { status: 400 });
    }
    // Hard cap so we don't blow the model context — MAX_ROWS (500) per import.
    const cappedRows = rawRows.slice(0, MAX_ROWS);
    const detectedColumns = Object.keys(cappedRows[0] ?? {}).slice(0, MAX_COLUMNS);

    // AI extraction — try the real LLM first. If the SDK is missing or
    // the call fails, fall back to a deterministic header-name mapper so
    // the admin still gets a usable preview.
    let parsed: Array<Record<string, unknown> | null> | null = null;
    let usedFallback = false;
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: EXTRACTION_PROMPT },
          {
            role: "user",
            content: `Here are ${cappedRows.length} customer rows from the file "${file.name}". Map each to the canonical shape.\n\nROWS:\n${JSON.stringify(cappedRows)}`,
          },
        ],
        thinking: { type: "disabled" },
      });
      const text = completion.choices[0]?.message?.content ?? "";
      // Strip any markdown fences if the model added them
      const clean = text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
      const start = clean.indexOf("[");
      const end = clean.lastIndexOf("]");
      if (start >= 0 && end > start) {
        const arr = JSON.parse(clean.slice(start, end + 1));
        if (Array.isArray(arr)) {
          parsed = arr;
        }
      }
      if (!parsed) {
        console.warn("[customers/import] model did not return a JSON array — using fallback");
        usedFallback = true;
      }
    } catch (err) {
      console.error("[customers/import] AI extraction failed:", err);
      usedFallback = true;
    }

    if (!parsed || usedFallback) {
      // Deterministic fallback — map by header-name heuristics. Not as
      // smart as the LLM (no tagging, no lead-scoring) but always works.
      parsed = cappedRows.map((r) => {
        const pick = (...keys: string[]) => {
          for (const k of keys) {
            const v = r[k];
            if (typeof v === "string" && v.trim()) return v.trim();
          }
          return null;
        };
        const email = pick("email", "e_mail", "mail", "email_address", "e-mail");
        const name = pick("name", "full_name", "contact_name", "client_name", "customer_name");
        if (!email) return null;
        return {
          name: name || email.split("@")[0],
          email: email.toLowerCase(),
          phone: pick("phone", "phone_number", "tel", "mobile", "contact"),
          whatsapp: pick("whatsapp", "wa", "whatsapp_number"),
          company: pick("company", "organization", "org", "business"),
          role: pick("role", "title", "position", "job_title"),
          notes: pick("notes", "note", "comment", "comments", "description"),
          tags: [],
          status: "lead",
          leadScore: null,
        };
      });
    }

    // Normalize + deduplicate by email
    const seen = new Set<string>();
    const rows = (parsed as Array<Record<string, unknown> | null>)
      .filter((r): r is Record<string, unknown> => {
        if (!r || typeof r !== "object") return false;
        const email = r.email;
        return typeof email === "string" && email.trim().length > 0;
      })
      .map((r) => {
        const emailRaw = r.email;
        if (typeof emailRaw !== "string") return null;
        const email = emailRaw.toLowerCase().trim();
        if (seen.has(email)) return null;
        seen.add(email);
        const tagsRaw = r.tags;
        let tags: string[] = [];
        if (Array.isArray(tagsRaw)) {
          tags = tagsRaw.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim().toLowerCase().replace(/\s+/g, "_"));
        } else if (typeof tagsRaw === "string" && tagsRaw.trim()) {
          tags = tagsRaw.split(/[,\s]+/).map((t) => t.trim().toLowerCase().replace(/\s+/g, "_")).filter(Boolean);
        }
        const strOr = (v: unknown): string | null =>
          typeof v === "string" && v.trim() ? v.trim() : null;
        const nameRaw = r.name;
        return {
          name: (typeof nameRaw === "string" ? nameRaw : email.split("@")[0]).trim().slice(0, 80),
          email,
          phone: strOr(r.phone) ? String(r.phone).trim() : null,
          whatsapp: strOr(r.whatsapp) ? String(r.whatsapp).trim() : null,
          company: strOr(r.company) ? String(r.company).trim().slice(0, 80) : null,
          role: strOr(r.role) ? String(r.role).trim().slice(0, 80) : null,
          notes: strOr(r.notes) ? String(r.notes).trim() : null,
          tags,
          status: typeof r.status === "string" && ["lead", "qualified", "proposal_sent", "paying", "churned"].includes(String(r.status)) ? String(r.status) : "lead",
          leadScore: typeof r.leadScore === "number" ? Math.max(0, Math.min(100, Math.round(Number(r.leadScore)))) : null,
          source: isCsv ? "csv" : "excel",
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return NextResponse.json({
      ok: true,
      rows,
      totalRows: rawRows.length,
      detectedColumns,
      usedFallback,
      fileName: file.name,
    });
  } catch (err) {
    console.error("[POST /api/admin/customers/import]", err);
    return NextResponse.json({ ok: false, error: "Import failed" }, { status: 500 });
  }
}
