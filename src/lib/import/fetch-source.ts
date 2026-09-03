/* ─────────────────────────────────────────────────────────────
   Import source fetching — Directive §18 + founder requirement:
   "import from like, google drive, sheets, etc … regardless of
   … location the file is".

   Supported sources:
     • device upload (multipart — handled by the route)
     • direct https:// URL (any host)
     • Google Sheets link (public / link-shared) → export CSV
     • Google Drive link (shared file) → direct-download endpoint

   Security (§90 SSRF): only public http(s) hosts are fetched.
   DNS is resolved and private/loopback/link-local IPs blocked
   BEFORE the request. Redirects are followed manually with the
   same guard applied to every hop. Response size is capped.
   ───────────────────────────────────────────────────────────── */

import * as dns from "node:dns/promises";
import { MAX_IMPORT_BYTES } from "./extract";

const FETCH_TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 5;

class ImportFetchError extends Error {}

/* ── SSRF guard ────────────────────────────────────────────── */

function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip === "0.0.0.0") return true;
  if (/^127\./.test(ip)) return true; // loopback
  if (/^10\./.test(ip)) return true; // private A
  if (/^192\.168\./.test(ip)) return true; // private C
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true; // private B
  if (/^169\.254\./.test(ip)) return true; // link-local
  if (/^fe[89ab]/i.test(ip) && ip.includes(":")) return true; // link-local v6
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true; // ULA v6
  return false;
}

async function assertSafeHost(hostname: string): Promise<void> {
  if (!hostname) throw new ImportFetchError("Missing hostname");
  // Literal IP in the URL
  const literal = /^\[?([0-9a-fA-F:.]+)\]?$/.exec(hostname)?.[1];
  if (literal) {
    if (isPrivateIp(literal)) {
      throw new ImportFetchError("Refusing to fetch private/internal address");
    }
    return;
  }
  try {
    const addrs = await dns.lookup(hostname, { all: true });
    if (addrs.length === 0) throw new ImportFetchError("Host does not resolve");
    for (const a of addrs) {
      if (isPrivateIp(a.address)) {
        throw new ImportFetchError("Refusing to fetch private/internal address");
      }
    }
  } catch (err) {
    if (err instanceof ImportFetchError) throw err;
    throw new ImportFetchError(`Cannot resolve host "${hostname}"`);
  }
}

/* ── Public fetch with manual redirect guarding ────────────── */

async function fetchPublic(
  url: string,
  redirectsLeft = MAX_REDIRECTS
): Promise<{ buf: Buffer; contentType: string | null; finalUrl: string }> {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ImportFetchError("Only http(s) URLs are supported");
  }
  await assertSafeHost(parsed.hostname);

  const res = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      // Google export endpoints behave better with a browser-ish UA
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      Accept: "*/*",
    },
  });

  // Follow redirects manually (re-guarding every hop)
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("location");
    if (loc && redirectsLeft > 0) {
      const next = new URL(loc, url).toString();
      return fetchPublic(next, redirectsLeft - 1);
    }
    throw new ImportFetchError("Too many redirects");
  }
  if (!res.ok) {
    throw new ImportFetchError(`Source responded ${res.status}`);
  }
  // Cap download size while streaming
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared && declared > MAX_IMPORT_BYTES) {
    throw new ImportFetchError(
      `Source file exceeds the ${MAX_IMPORT_BYTES / (1024 * 1024)} MB import limit`
    );
  }
  const reader = res.body?.getReader();
  if (!reader) throw new ImportFetchError("Empty response body");
  const chunks: Buffer[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_IMPORT_BYTES) {
      await reader.cancel();
      throw new ImportFetchError(
        `Source file exceeds the ${MAX_IMPORT_BYTES / (1024 * 1024)} MB import limit`
      );
    }
    chunks.push(Buffer.from(value));
  }
  return {
    buf: Buffer.concat(chunks),
    contentType: res.headers.get("content-type"),
    finalUrl: url,
  };
}

/* ── Google Sheets (§18) ───────────────────────────────────── */

export function extractSheetsId(url: string): string | null {
  const m =
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(url) ??
    /[?&]id=([a-zA-Z0-9-_]+)/.exec(url);
  return m?.[1] ?? null;
}

/**
 * Fetch a Google Sheet as CSV. Works when the sheet is public or
 * shared "anyone with the link — viewer". Private sheets require
 * an OAuth integration we deliberately do not request (§18:
 * "Never request or expose credentials unnecessarily") — the error
 * tells the admin exactly how to fix sharing.
 */
export async function fetchGoogleSheetCsv(
  sheetsUrl: string
): Promise<{ buf: Buffer; fileName: string }> {
  const id = extractSheetsId(sheetsUrl);
  if (!id) {
    throw new ImportFetchError(
      "That doesn't look like a Google Sheets link — expected https://docs.google.com/spreadsheets/d/…"
    );
  }
  const candidates = [
    `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`,
    `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`,
  ];
  let lastErr: unknown = null;
  for (const candidate of candidates) {
    try {
      const { buf, contentType } = await fetchPublic(candidate);
      const looksHtml = (contentType ?? "").includes("text/html");
      const looksLogin = buf.subarray(0, 4000).toString("utf-8").includes("accounts.google.com");
      if (looksHtml || looksLogin) {
        lastErr = new ImportFetchError(
          "The sheet is not publicly readable. In Google Sheets: Share → General access → “Anyone with the link” (Viewer), then retry."
        );
        continue;
      }
      if (buf.length === 0) {
        lastErr = new ImportFetchError("The sheet export returned an empty file");
        continue;
      }
      return { buf, fileName: `google-sheet-${id}.csv` };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new ImportFetchError("Could not fetch the Google Sheet");
}

/* ── Google Drive ──────────────────────────────────────────── */

export function extractDriveFileId(url: string): string | null {
  const m =
    /\/file\/d\/([a-zA-Z0-9-_]+)/.exec(url) ??
    /[?&]id=([a-zA-Z0-9-_]+)/.exec(url) ??
    /^([a-zA-Z0-9-_]{20,})$/.exec(url.trim()); // bare ID
  return m?.[1] ?? null;
}

/**
 * Fetch a file from a Google Drive share link. Converts to the
 * direct-download endpoint and follows the confirm-token redirect
 * Google inserts for large files.
 */
export async function fetchGoogleDriveFile(
  driveUrl: string
): Promise<{ buf: Buffer; fileName: string; contentType: string | null }> {
  const id = extractDriveFileId(driveUrl);
  if (!id) {
    throw new ImportFetchError(
      "That doesn't look like a Google Drive file link — expected https://drive.google.com/file/d/…"
    );
  }
  const direct = `https://drive.google.com/uc?export=download&id=${id}`;
  try {
    const { buf, contentType } = await fetchPublic(direct);
    const head = buf.subarray(0, 4000).toString("utf-8");
    // Google login wall or virus-scan interstitial
    if ((contentType ?? "").includes("text/html") || head.includes("accounts.google.com")) {
      if (head.includes("accounts.google.com")) {
        throw new ImportFetchError(
          "The Drive file is not publicly downloadable. In Google Drive: Share → General access → “Anyone with the link”, then retry."
        );
      }
      // Virus-scan interstitial → extract confirm token + retry
      const token =
        /name="confirm"\s+value="([^"]+)"/.exec(head)?.[1] ??
        /confirm=([0-9a-zA-Z_-]+)/.exec(head)?.[1];
      if (token) {
        const confirmed = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=${token}`;
        const r2 = await fetchPublic(confirmed);
        const h2 = r2.buf.subarray(0, 4000).toString("utf-8");
        if ((r2.contentType ?? "").includes("text/html") && h2.includes("accounts.google.com")) {
          throw new ImportFetchError(
            "The Drive file requires sign-in. Share it as “Anyone with the link” and retry."
          );
        }
        return { buf: r2.buf, fileName: `drive-file-${id}`, contentType: r2.contentType };
      }
      throw new ImportFetchError(
        "Google Drive returned an HTML page instead of a file — check sharing settings."
      );
    }
    return { buf, fileName: `drive-file-${id}`, contentType };
  } catch (err) {
    if (err instanceof ImportFetchError) throw err;
    throw new ImportFetchError(
      "Could not download the Google Drive file — check the link and sharing settings."
    );
  }
}

/* ── Any direct URL ────────────────────────────────────────── */

export async function fetchUrlFile(
  url: string
): Promise<{ buf: Buffer; fileName: string; contentType: string | null }> {
  const parsed = new URL(url); // throws on invalid
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ImportFetchError("Only http(s) URLs are supported");
  }
  const { buf, contentType } = await fetchPublic(url);
  const fileName = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() ?? "import");
  return { buf, fileName: fileName || "import", contentType };
}

export { ImportFetchError };
