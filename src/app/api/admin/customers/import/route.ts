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

// Avoid bundling the xlsx library on the edge path — only loaded when
// an admin actually imports. Same for z-ai-web-dev-sdk.
async function parseSpreadsheet(buf: Buffer, fileName: string): Promise<Record<string, unknown>[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  // raw:false → coerces cells to formatted strings (so phone numbers
  // don't come back as scientific notation). defval → empty cells
  // become "" instead of being skipped.
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    raw: false,
    defval: "",
    blankrows: false,
  });
  if (!rows.length) return [];
  // Lowercase + trim column keys so the AI sees clean headers
  return rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) {
      const key = String(k).trim().toLowerCase().replace(/\s+/g, "_");
      out[key] = typeof v === "string" ? v.trim() : v;
    }
    return out;
  });
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

    const buf = Buffer.from(await file.arrayBuffer());
    const rawRows = await parseSpreadsheet(buf, fileName);
    if (rawRows.length === 0) {
      return NextResponse.json({ ok: false, error: "File appears to be empty" }, { status: 400 });
    }
    // Hard cap so we don't blow the model context — 100 rows per import.
    const cappedRows = rawRows.slice(0, 100);
    const detectedColumns = Object.keys(cappedRows[0] ?? {}).slice(0, 25);

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
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object" && typeof (r as Record<string, unknown>).email === "string" && (r as Record<string, unknown>).email.trim().length > 0)
      .map((r) => {
        const email = String((r as Record<string, unknown>).email).toLowerCase().trim();
        if (seen.has(email)) return null;
        seen.add(email);
        const tagsRaw = (r as Record<string, unknown>).tags;
        let tags: string[] = [];
        if (Array.isArray(tagsRaw)) {
          tags = tagsRaw.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim().toLowerCase().replace(/\s+/g, "_"));
        } else if (typeof tagsRaw === "string" && tagsRaw.trim()) {
          tags = tagsRaw.split(/[,\s]+/).map((t) => t.trim().toLowerCase().replace(/\s+/g, "_")).filter(Boolean);
        }
        return {
          name: String((r as Record<string, unknown>).name ?? email.split("@")[0]).trim().slice(0, 80),
          email,
          phone: typeof (r as Record<string, unknown>).phone === "string" && (r as Record<string, unknown>).phone.trim() ? String((r as Record<string, unknown>).phone).trim() : null,
          whatsapp: typeof (r as Record<string, unknown>).whatsapp === "string" && (r as Record<string, unknown>).whatsapp.trim() ? String((r as Record<string, unknown>).whatsapp).trim() : null,
          company: typeof (r as Record<string, unknown>).company === "string" && (r as Record<string, unknown>).company.trim() ? String((r as Record<string, unknown>).company).trim().slice(0, 80) : null,
          role: typeof (r as Record<string, unknown>).role === "string" && (r as Record<string, unknown>).role.trim() ? String((r as Record<string, unknown>).role).trim().slice(0, 80) : null,
          notes: typeof (r as Record<string, unknown>).notes === "string" && (r as Record<string, unknown>).notes.trim() ? String((r as Record<string, unknown>).notes).trim() : null,
          tags,
          status: typeof (r as Record<string, unknown>).status === "string" && ["lead", "qualified", "proposal_sent", "paying", "churned"].includes(String((r as Record<string, unknown>).status)) ? String((r as Record<string, unknown>).status) : "lead",
          leadScore: typeof (r as Record<string, unknown>).leadScore === "number" ? Math.max(0, Math.min(100, Math.round(Number((r as Record<string, unknown>).leadScore)))) : null,
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
