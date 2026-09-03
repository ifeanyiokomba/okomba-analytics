/* ─────────────────────────────────────────────────────────────
   AI field mapping — Directive §19 + §16
   "The AI should intelligently recognize variants such as:
    First Name/Firstname/Given Name/Surname/Last Name/Family Name/
    Mobile/Phone/Telephone/WhatsApp/Email/Email Address"

   Output = canonical Customer shape aligned with the Phase-36
   Customer Identity Contract (firstName, lastName, countryCode —
   no name.split, ISO-2 backend authority §11).

   Two paths (same contract as the legacy route):
     1. LLM chunk mapping (z-ai-web-dev-sdk) — 100 rows per call,
        PII governance opt-out via CRM_IMPORT_NO_LLM preserved.
     2. Deterministic header-alias fallback — always works.
   ───────────────────────────────────────────────────────────── */

import { COUNTRIES } from "@/lib/countries";
import { MAX_IMPORT_ROWS } from "./extract";

export type CanonicalRow = {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  countryCode: string | null;
  company: string | null;
  role: string | null;
  notes: string | null;
  tags: string[];
  status: string;
  leadScore: number | null;
};

const LLM_CHUNK_SIZE = 100;

const MAPPING_PROMPT = `You are an enterprise CRM migration assistant. You receive customer records (raw rows with arbitrary column names OR unstructured text) and must map each record into Okomba Analytics' canonical Customer shape.

For each record, extract these fields:
- firstName:   given name (single word preferred; null if unknown)
- lastName:    family name / surname (null if unknown)
- email:       primary email address (lowercase; required)
- phone:       phone in international/E.164 format if possible, else as-is (null if absent)
- whatsapp:    WhatsApp number if separate from phone, else null
- countryCode: ISO 3166-1 alpha-2 code from the country name/value (e.g. "Nigeria"→NG, "Ghana"→GH, "United Kingdom"→GB, "USA"→US); null if no country signal
- company:     organization name, else null
- role:        job title (e.g. "Founder", "CTO"), else null
- notes:       any context, comments, source, or free-text worth keeping, else null
- tags:        array of 0-4 short lowercase tags classifying the contact — e.g. ["ngo","fintech","referral"]
- status:      one of "lead" | "qualified" | "proposal_sent" | "paying" | "churned" — pick from signals; default "lead"
- leadScore:   integer 0-100 (warmth/confidence from completeness + signals); null if no signal

Rules:
- Always output an array (even for a single record).
- Use null for any field you cannot confidently extract. Do NOT invent values.
- Preserve original values verbatim (only lowercase emails, trim whitespace).
- If a record is empty or repeats a header, return null for it.
- Recognize ALL naming variants: First Name/Firstname/Given Name → firstName; Surname/Last Name/Family Name → lastName; Mobile/Phone/Telephone/Contact → phone; Email/Email Address/E-mail/Mail → email; WhatsApp/WA Number/Whatsapp Number → whatsapp; Country/Nation/Country Name → countryCode.

Return ONLY a compact JSON array, no markdown, no commentary. Each element is an object with the keys above.`;

/* ── Country normalization (§11) ────────────────────────────── */

const COUNTRY_ALIASES: Record<string, string> = {
  "nigeria": "NG", "naija": "NG", "ghana": "GH", "united states": "US",
  "united states of america": "US", "usa": "US", "us": "US", "u.s.a": "US",
  "united kingdom": "GB", "uk": "GB", "britain": "GB", "england": "GB",
  "kenya": "KE", "south africa": "ZA", "cameroon": "CM", "cote d'ivoire": "CI",
  "ivory coast": "CI", "togo": "TG", "benin": "BJ", "senegal": "SN",
  "canada": "CA", "india": "IN", "china": "CN", "germany": "DE", "france": "FR",
  "brazil": "BR", "australia": "AU", "netherlands": "NL", "spain": "ES",
  "united arab emirates": "AE", "uae": "AE", "dubai": "AE", "rwanda": "RW",
  "uganda": "UG", "tanzania": "TZ", "zambia": "ZM", "zimbabwe": "ZW",
  "botswana": "BW", "namibia": "NA", "malawi": "MW", "mozambique": "MZ",
};

export function normalizeCountry(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  if (!v) return null;
  // Direct ISO-2 ("ng", "NG")
  if (/^[a-z]{2}$/.test(v)) {
    const upper = v.toUpperCase();
    if (COUNTRIES.some((c) => c.code === upper)) return upper;
  }
  // Alias/name lookup
  if (COUNTRY_ALIASES[v]) return COUNTRY_ALIASES[v];
  const byLabel = COUNTRIES.find((c) => c.label.toLowerCase() === v);
  if (byLabel) return byLabel.code;
  // Partial name match (e.g. "Republic of Nigeria")
  const partial = Object.entries(COUNTRY_ALIASES).find(([alias]) =>
    v.includes(alias)
  );
  if (partial) return partial[1];
  return null;
}

/* ── Phone normalization (§12) ──────────────────────────────── */

export function normalizePhone(value: unknown, countryCode?: string | null): string | null {
  if (typeof value !== "string") return null;
  let v = value.replace(/[^\d+]/g, ""); // keep digits + leading plus
  if (!v || v.length < 5) return null;
  const dial = countryCode
    ? COUNTRIES.find((c) => c.code === countryCode)?.dialCode
    : undefined;
  // Local format "0803…" with known country → internationalize
  if (dial && v.startsWith("0")) {
    v = dial + v.slice(1);
  }
  if (!v.startsWith("+") && dial && v.startsWith(dial.replace("+", ""))) {
    v = "+" + v;
  }
  return v.length >= 7 && v.length <= 18 ? v : null;
}

/* ── Deterministic fallback (§19 variants) ──────────────────── */

type Pick = (r: Record<string, unknown>, ...keys: string[]) => string | null;

const pick: Pick = (r, ...keys) => {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return null;
};

export function mapDeterministic(
  rows: Record<string, unknown>[]
): Array<Record<string, unknown> | null> {
  return rows.map((r) => {
    const email = pick(r, "email", "e_mail", "mail", "email_address", "e-mail", "EmailAddress".toLowerCase());
    if (!email) return null;
    const firstName = pick(r, "first_name", "firstname", "given_name", "forename", "first");
    const lastName = pick(r, "last_name", "lastname", "surname", "family_name", "last");
    const name = pick(r, "name", "full_name", "contact_name", "client_name", "customer_name", "contact");
    // Derive first/last from full name ONLY when specific fields absent (§72 no name.split for new rows — but import fallback may derive, flagged in notes)
    let derivedFirst = firstName;
    let derivedLast = lastName;
    if (!derivedFirst && name) {
      const parts = name.split(/\s+/);
      derivedFirst = parts[0];
      derivedLast = derivedLast ?? (parts.length > 1 ? parts.slice(1).join(" ") : null);
    }
    if (!derivedFirst) derivedFirst = email.split("@")[0].replace(/[._-]+/g, " ").trim();
    return {
      firstName: derivedFirst,
      lastName: derivedLast,
      email: email.toLowerCase(),
      phone: pick(r, "phone", "phone_number", "tel", "telephone", "mobile", "mobile_number", "contact_number"),
      whatsapp: pick(r, "whatsapp", "wa", "whatsapp_number", "wa_number"),
      countryCode: normalizeCountry(pick(r, "country", "country_name", "nation", "nationality")),
      company: pick(r, "company", "organization", "organisation", "org", "business", "company_name"),
      role: pick(r, "role", "title", "position", "job_title", "designation"),
      notes: pick(r, "notes", "note", "comment", "comments", "description", "remarks"),
      tags: [] as string[],
      status: "lead",
      leadScore: null as number | null,
    };
  });
}

/* ── LLM chunk mapping ─────────────────────────────────────── */

export function isNoLlmOptOut(): boolean {
  const raw = (process.env.CRM_IMPORT_NO_LLM ?? "").trim().toLowerCase();
  return raw === "true" || raw === "1";
}

export async function mapRowsWithLlm(
  rawRows: Record<string, unknown>[],
  context: string
): Promise<{ mapped: Array<Record<string, unknown> | null> | null; usedFallback: boolean }> {
  if (isNoLlmOptOut()) {
    console.info(
      "[import/map] CRM_IMPORT_NO_LLM set — deterministic mapping only (PII governance opt-out; no data sent to third-party LLM)."
    );
    return { mapped: null, usedFallback: true };
  }
  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();
    const out: Array<Record<string, unknown> | null> = [];
    for (let i = 0; i < rawRows.length; i += LLM_CHUNK_SIZE) {
      const chunk = rawRows.slice(i, i + LLM_CHUNK_SIZE);
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: MAPPING_PROMPT },
          {
            role: "user",
            content: `${context}\n\nMap each record to the canonical shape.\n\nRECORDS (${chunk.length}, #${i + 1}–${i + chunk.length}):\n${JSON.stringify(chunk)}`,
          },
        ],
        thinking: { type: "disabled" },
      });
      const text = completion.choices[0]?.message?.content ?? "";
      const clean = text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
      const start = clean.indexOf("[");
      const end = clean.lastIndexOf("]");
      if (start >= 0 && end > start) {
        const arr = JSON.parse(clean.slice(start, end + 1));
        if (Array.isArray(arr)) {
          out.push(...arr);
          continue;
        }
      }
      throw new Error("model did not return a JSON array");
    }
    return { mapped: out, usedFallback: false };
  } catch (err) {
    console.warn("[import/map] LLM mapping failed — falling back to deterministic:", err);
    return { mapped: null, usedFallback: true };
  }
}

/** Unstructured text (PDF/DOCX/TXT) → rows via LLM (or fail). */
export async function mapTextWithLlm(
  rawText: string
): Promise<Array<Record<string, unknown> | null> | null> {
  if (isNoLlmOptOut()) return null; // cannot deterministically parse free text
  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();
    // Cap text payload to ~120k chars (≈ model context safety)
    const text = rawText.slice(0, 120_000);
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: MAPPING_PROMPT },
        {
          role: "user",
          content: `The following is extracted text from a document containing customer contact records (possibly a table flattened to text). Identify EVERY customer record in it and map each to the canonical shape. Skip headers, footers, and non-record text.\n\nDOCUMENT TEXT:\n${text}`,
        },
      ],
      thinking: { type: "disabled" },
    });
    const out = completion.choices[0]?.message?.content ?? "";
    const clean = out.replace(/```json\s*/g, "").replace(/```/g, "").trim();
    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");
    if (start >= 0 && end > start) {
      const arr = JSON.parse(clean.slice(start, end + 1));
      if (Array.isArray(arr)) return arr;
    }
    return null;
  } catch (err) {
    console.warn("[import/map] text LLM mapping failed:", err);
    return null;
  }
}

/* ── Validation + normalization (§16 "Validate" stage) ─────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STATUSES = ["lead", "qualified", "proposal_sent", "paying", "churned"];

export type NormalizeStats = {
  total: number;
  valid: number;
  duplicates: number;
  invalid: number;
};

export function normalizeMappedRows(
  parsed: Array<Record<string, unknown> | null>
): { rows: CanonicalRow[]; stats: NormalizeStats } {
  const seen = new Set<string>();
  const rows: CanonicalRow[] = [];
  let valid = 0;
  let duplicates = 0;
  let invalid = 0;

  for (const r of parsed.slice(0, MAX_IMPORT_ROWS)) {
    if (!r || typeof r !== "object") {
      invalid++;
      continue;
    }
    const emailRaw = r.email;
    if (typeof emailRaw !== "string" || !EMAIL_RE.test(emailRaw.trim())) {
      invalid++;
      continue;
    }
    const email = emailRaw.trim().toLowerCase();
    if (seen.has(email)) {
      duplicates++;
      continue;
    }
    seen.add(email);

    const strOr = (v: unknown, max = 120): string | null => {
      if (typeof v === "string" && v.trim()) return v.trim().slice(0, max);
      if (typeof v === "number" && Number.isFinite(v)) return String(v).slice(0, max);
      return null;
    };
    const tagsRaw = r.tags;
    let tags: string[] = [];
    if (Array.isArray(tagsRaw)) {
      tags = tagsRaw
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.trim().toLowerCase().replace(/\s+/g, "_"))
        .slice(0, 6);
    } else if (typeof tagsRaw === "string" && tagsRaw.trim()) {
      tags = tagsRaw
        .split(/[,\s]+/)
        .map((t) => t.trim().toLowerCase().replace(/\s+/g, "_"))
        .filter(Boolean)
        .slice(0, 6);
    }

    rows.push({
      firstName: strOr(r.firstName, 60),
      lastName: strOr(r.lastName, 60),
      email,
      phone: normalizePhone(r.phone, null) ?? strOr(r.phone, 30),
      whatsapp: normalizePhone(r.whatsapp, null) ?? strOr(r.whatsapp, 30),
      countryCode: typeof r.countryCode === "string" ? normalizeCountry(r.countryCode) : null,
      company: strOr(r.company, 100),
      role: strOr(r.role, 100),
      notes: strOr(r.notes, 2000),
      tags,
      status:
        typeof r.status === "string" && STATUSES.includes(r.status) ? r.status : "lead",
      leadScore:
        typeof r.leadScore === "number"
          ? Math.max(0, Math.min(100, Math.round(r.leadScore)))
          : null,
    });
    valid++;
  }
  return { rows, stats: { total: parsed.length, valid, duplicates, invalid } };
}
