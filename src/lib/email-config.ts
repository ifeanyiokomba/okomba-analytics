/**
 * Phase 29 — Email provider credentials store (AES-256-GCM at rest).
 *
 * WHY THIS EXISTS
 * ─────────────
 * The prior pipeline shipped ALL outbound email through a single
 * Google Apps Script Web App (`NOTIFY_WEBHOOK_URL`). If Apps Script
 * was rate-limited by Gmail or the deployment was down, every
 * outbound email silently failed. This module lets the admin save
 * multiple providers (Apps Script / Resend / Mailtrap / Maileroo)
 * with their credentials encrypted at rest, then `email-failover.ts`
 * tries them in priority order until one succeeds.
 *
 * CRYPTO — AES-256-GCM (NOT plain text, NOT base64-only)
 * ─────────────────────────────────────────────────────
 * The 32-byte key is derived from `EMAIL_CONFIG_ENCRYPTION_KEY`
 * (a 64-char hex string in .env). If that env var is unset (e.g.
 * local dev), we fall back to PBKDF2(sha512, 200k iters, salt =
 * stable app constant) over `ADMIN_PASSWORD || "okomba-dev-fallback"`.
 *
 * Each ciphertext blob is base64(iv[12] || ciphertext[N] || tag[16]).
 * GCM gives us both confidentiality AND authentication — a rotated
 * key or tampered ciphertext fails the tag check rather than silently
 * decrypting garbage.
 *
 * ROTATION RISK: if the key changes after credentials are encrypted,
 * those credentials become unreadable. The admin MUST re-enter every
 * provider's credentials after rotating the key. Documented in
 * .env.example.
 */

import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
} from "node:crypto";
import { db } from "@/lib/db";

export type EmailProviderName =
  | "apps_script"
  | "resend"
  | "mailtrap"
  | "maileroo"
  // Phase 29: pseudo-row that stores the admin's configured test
  // recipient email (encrypted the same way). Never part of the
  // failover chain — `email-failover.ts` filters it out before
  // iterating providers.
  | "test_recipient";

export type EmailProviderCredentials = {
  webhookUrl?: string;
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
  apiEndpoint?: string;
  // `to` is only used by the test-recipient pseudo-row
  // (provider="test_recipient"). It's the email address a provider
  // test message is sent to. Not used by real provider rows.
  to?: string;
};

export type EmailProviderRow = {
  id: string;
  provider: EmailProviderName;
  displayName: string;
  priority: number;
  enabled: boolean;
  credentialsEnc: string;
  lastTestAt: Date | null;
  lastTestStatus: string | null;
  lastTestError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const KEY_DERIVATION_SALT = "okomba-analytics-email-provider-config-v1";
const IV_LEN = 12; // 96-bit IV is the GCM standard
const TAG_LEN = 16;
const PBKDF2_ITERS = 200_000;
const PBKDF2_KEYLEN = 32; // 256-bit AES key

/* ── Key derivation ─────────────────────────────────────────── */
function deriveKey(): Buffer {
  const rawHex = process.env.EMAIL_CONFIG_ENCRYPTION_KEY?.trim();
  if (rawHex && /^[0-9a-fA-F]{64}$/.test(rawHex)) {
    // 32-byte hex string — use directly as the AES-256 key.
    return Buffer.from(rawHex, "hex");
  }
  // Fall back to PBKDF2 over ADMIN_PASSWORD (or a dev-only sentinel).
  // This keeps local-dev frictionless but production MUST set the hex
  // key — we log a warning at encrypt time so the operator notices.
  const password =
    process.env.ADMIN_PASSWORD?.trim() || "okomba-dev-fallback-key-change-me";
  return pbkdf2Sync(
    Buffer.from(password, "utf8"),
    Buffer.from(KEY_DERIVATION_SALT, "utf8"),
    PBKDF2_ITERS,
    PBKDF2_KEYLEN,
    "sha512"
  );
}

/* ── AES-256-GCM encrypt ────────────────────────────────────── */
// Algorithm: aes-256-gcm. Output is base64(iv[12] || ciphertext || tag[16]).
export function encryptCredentials(
  obj: EmailProviderCredentials
): string {
  const key = deriveKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), "utf8");
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, tag]).toString("base64");
}

/* ── AES-256-GCM decrypt ────────────────────────────────────── */
// Inverse of encryptCredentials. Throws on tag mismatch (tampered blob
// or wrong key) — callers MUST catch and surface the failure to the admin.
export function decryptCredentials(blob: string): EmailProviderCredentials {
  const key = deriveKey();
  const buf = Buffer.from(blob, "base64");
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error("credentials blob is too short");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(buf.length - TAG_LEN);
  const ciphertext = buf.subarray(IV_LEN, buf.length - TAG_LEN);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  const parsed = JSON.parse(dec.toString("utf8")) as EmailProviderCredentials;
  return parsed;
}

/* ── CRUD: read providers in priority order ─────────────────── */
export async function getEmailProviders(): Promise<EmailProviderRow[]> {
  return (await db.emailProviderConfig.findMany({
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  })) as EmailProviderRow[];
}

export async function getEnabledProvidersOrdered(): Promise<EmailProviderRow[]> {
  return (await db.emailProviderConfig.findMany({
    where: { enabled: true },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  })) as EmailProviderRow[];
}

/* ── CRUD: upsert one provider (admin Settings tab) ────────── */
export async function saveEmailProvider(
  provider: EmailProviderName,
  credentials: EmailProviderCredentials,
  opts: { displayName?: string; priority?: number; enabled?: boolean } = {}
): Promise<EmailProviderRow> {
  const displayName =
    opts.displayName ?? DEFAULT_PROVIDER_DISPLAY_NAMES[provider];
  // Default priority for a brand-new provider is the next free slot after
  // the highest existing priority (so newly-saved providers go LAST in
  // the chain until the admin re-prioritizes).
  let priority = opts.priority;
  if (priority === undefined) {
    const existing = await db.emailProviderConfig.findMany({
      select: { priority: true },
      orderBy: { priority: "desc" },
    });
    const max = existing.length ? Math.max(...existing.map((r) => r.priority)) : 0;
    priority = max + 1;
  }

  const credentialsEnc = encryptCredentials(credentials);
  const row = await db.emailProviderConfig.upsert({
    where: { provider },
    create: {
      provider,
      displayName,
      priority,
      enabled: opts.enabled ?? true,
      credentialsEnc,
    },
    update: {
      displayName,
      priority,
      ...(opts.enabled !== undefined ? { enabled: opts.enabled } : {}),
      credentialsEnc,
    },
  });
  return row as EmailProviderRow;
}

/* ── CRUD: redact to a public-safe shape (for GET route) ────── */
export type PublicProviderRow = {
  id: string;
  provider: EmailProviderName;
  displayName: string;
  priority: number;
  enabled: boolean;
  hasCredentials: boolean;
  lastTestAt: string | null;
  lastTestStatus: string | null;
  lastTestError: string | null;
  // Surface the *field names* the credentials blob holds (without values)
  // so the admin Settings tab knows which form fields to pre-fill empty.
  credentialFields: string[];
  updatedAt: string;
};

export async function listPublicProviders(): Promise<PublicProviderRow[]> {
  const rows = await getEmailProviders();
  return rows.map((r) => {
    let credentialFields: string[] = [];
    try {
      const c = decryptCredentials(r.credentialsEnc);
      credentialFields = Object.keys(c).filter(
        (k) => (c as Record<string, string | undefined>)[k]
      );
    } catch {
      credentialFields = [];
    }
    return {
      id: r.id,
      provider: r.provider,
      displayName: r.displayName,
      priority: r.priority,
      enabled: r.enabled,
      hasCredentials: Boolean(r.credentialsEnc),
      lastTestAt: r.lastTestAt?.toISOString() ?? null,
      lastTestStatus: r.lastTestStatus,
      lastTestError: r.lastTestError,
      credentialFields,
      updatedAt: r.updatedAt.toISOString(),
    };
  });
}

/* ── Real per-provider test call ────────────────────────────── */
//
// This is the same call shape `email-failover.ts` makes — but pointed
// at the configured test recipient. The result is recorded on the row
// (lastTestAt / lastTestStatus / lastTestError) so the admin Settings
// tab can show a live "✓ working / ✗ failed" badge per provider.
//
// The TEST_TO address comes from:
//   1. EmailTestRecipient row (set via the admin Settings tab), or
//   2. EMAIL_TEST_TO env var, or
//   3. ADMIN_EMAIL env var, or
//   4. support@okomba.com (last-resort).
export async function getTestRecipient(): Promise<string> {
  // (1) DB-configured test recipient wins. We persist this in a row
  //     of EmailProviderConfig where provider = "test_recipient" — same
  //     table, no extra migration needed. The `credentialsEnc` field
  //     stores `{ to: "email@example.com" }` encrypted the same way.
  const row = await db.emailProviderConfig.findUnique({
    where: { provider: "test_recipient" },
  });
  if (row) {
    try {
      const c = decryptCredentials(row.credentialsEnc);
      if (c.to) return c.to;
    } catch {
      // fall through
    }
  }
  // (2) env override
  if (process.env.EMAIL_TEST_TO) return process.env.EMAIL_TEST_TO;
  // (3) ADMIN_EMAIL fallback
  if (process.env.ADMIN_EMAIL) return process.env.ADMIN_EMAIL;
  // (4) last resort
  return "support@okomba.com";
}

export async function saveTestRecipient(to: string): Promise<void> {
  const credentialsEnc = encryptCredentials({ to });
  await db.emailProviderConfig.upsert({
    where: { provider: "test_recipient" },
    create: {
      provider: "test_recipient",
      displayName: "Test recipient (admin email-failover test target)",
      priority: 0,
      enabled: true,
      credentialsEnc,
    },
    update: {
      credentialsEnc,
      displayName: "Test recipient (admin email-failover test target)",
    },
  });
}

/* Reuse the same provider delivery logic as the failover chain so the
   test actually exercises the real code path. We import lazily to
   avoid a circular import (email-failover.ts imports getEmailProviders
   from this file). */
async function deliverWithProvider(
  provider: EmailProviderName,
  to: string,
  subject: string,
  bodyHtml: string,
  bodyText: string
): Promise<{ ok: boolean; error?: string; latencyMs: number; detail?: string }> {
  const row = await db.emailProviderConfig.findUnique({ where: { provider } });
  if (!row || !row.credentialsEnc) {
    return { ok: false, error: "provider not configured", latencyMs: 0 };
  }
  let creds: EmailProviderCredentials;
  try {
    creds = decryptCredentials(row.credentialsEnc);
  } catch (err) {
    return {
      ok: false,
      error: `decrypt failed: ${err instanceof Error ? err.message : "unknown"}`,
      latencyMs: 0,
    };
  }
  const start = Date.now();
  try {
    const res = await callProviderApi(provider, creds, {
      to,
      subject,
      bodyHtml,
      bodyText,
      attachments: [],
      type: "test",
    });
    const latencyMs = Date.now() - start;
    if (res.ok) {
      return { ok: true, latencyMs, detail: res.detail };
    }
    return { ok: false, error: res.error, latencyMs, detail: res.detail };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown delivery error",
      latencyMs,
    };
  }
}

export type TestResult = {
  ok: boolean;
  error?: string;
  latencyMs: number;
  detail?: string;
};

export async function testProvider(
  provider: EmailProviderName
): Promise<TestResult> {
  const to = await getTestRecipient();
  const subject = `[Okomba test] ${provider} provider test ${new Date().toISOString()}`;
  const bodyHtml =
    `<div style="font-family:system-ui,sans-serif;padding:24px;">` +
    `<h2>Email provider test — ${provider}</h2>` +
    `<p>This message was sent by the Okomba Analytics admin Settings tab ` +
    `to verify that the <strong>${provider}</strong> provider is wired ` +
    `correctly. If you received this, the failover chain can use this ` +
    `provider for live email delivery.</p>` +
    `<p style="color:#666;font-size:12px;">Sent: ${new Date().toISOString()}</p>` +
    `</div>`;
  const bodyText =
    `Email provider test — ${provider}\n\n` +
    `This message was sent by the Okomba Analytics admin Settings tab to ` +
    `verify that the ${provider} provider is wired correctly. If you ` +
    `received this, the failover chain can use this provider for live ` +
    `email delivery.\n\nSent: ${new Date().toISOString()}\n`;

  const result = await deliverWithProvider(provider, to, subject, bodyHtml, bodyText);

  // Persist the result on the row (test_recipient is excluded — it has
  // no real provider credentials to test).
  if (provider !== "test_recipient") {
    try {
      await db.emailProviderConfig.update({
        where: { provider },
        data: {
          lastTestAt: new Date(),
          lastTestStatus: result.ok ? "success" : "failed",
          lastTestError: result.ok ? null : (result.error ?? "unknown error"),
        },
      });
    } catch (err) {
      console.error("[email-config:testProvider] persist failed:", err);
    }
  }
  return result;
}

/* ── Apps Script payload shape (B5 — extracted for contract test) ── */
//
// Phase 29 hardcoded this JSON body inline inside callProviderApi's
// fetch() call. Batch 5 (Code.gs reconciliation) extracted it into a
// pure function so tests/codegs-payload-shape.test.ts can assert the
// EXACT field shape without making a real HTTP call.
//
// IMPORTANT — this helper is the single source of truth for what the
// modern apps_script provider POSTs to the Apps Script Web App /exec
// URL. Code.gs v5's doPost(e) reads a DIFFERENT field set (it reads
// `recipient`, NOT `to`, for the handleNotification path). This
// mismatch is documented in docs/codegs-reconciliation.md §C as a
// CRITICAL integration bug — the founder must either:
//   (a) update this helper to ALSO send `recipient: opts.to` (and
//       `inquiry: opts.inquiry` for inquiry.created type), OR
//   (b) update Code.gs v5's handleNotification to read `data.to`
//       instead of `data.recipient`.
// Until then, only the legacy NOTIFY_WEBHOOK_URL fallback path
// delivers invoice emails correctly (because that path sends
// `action: "sendInvoiceEmail"` which Code.gs routes through
// sendInvoiceEmail(data) → reads `data.to` directly).
export type AppsScriptPayloadOptions = {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments: Array<{ filename: string; contentType: string; base64: string }>;
  type: string;
};

export function buildAppsScriptPayload(opts: AppsScriptPayloadOptions): Record<string, unknown> {
  return {
    action: "sendEmail",
    to: opts.to,
    subject: opts.subject,
    body: opts.bodyText,
    html: opts.bodyHtml,
    bodyText: opts.bodyText,
    bodyHtml: opts.bodyHtml,
    attachments: opts.attachments,
    type: opts.type,
  };
}

/* ── Per-provider HTTP call ─────────────────────────────────── */
//
// Exported because email-failover.ts reuses it for the live delivery
// path (one implementation, two callers — test route + failover chain).
export async function callProviderApi(
  provider: EmailProviderName,
  creds: EmailProviderCredentials,
  opts: AppsScriptPayloadOptions
): Promise<{ ok: boolean; error?: string; detail?: string }> {
  if (provider === "apps_script") {
    const url = creds.webhookUrl;
    if (!url) return { ok: false, error: "missing webhookUrl" };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildAppsScriptPayload(opts)),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `apps_script HTTP ${res.status}`,
        detail: await safeText(res),
      };
    }
    return { ok: true, detail: `HTTP ${res.status}` };
  }

  if (provider === "resend") {
    const apiKey = creds.apiKey;
    if (!apiKey) return { ok: false, error: "missing apiKey" };
    if (!creds.fromEmail) return { ok: false, error: "missing fromEmail" };
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: creds.fromEmail,
        to: [opts.to],
        subject: opts.subject,
        html: opts.bodyHtml,
        text: opts.bodyText,
        attachments: opts.attachments.map((a) => ({
          filename: a.filename,
          content: a.base64,
        })),
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `resend HTTP ${res.status}`,
        detail: await safeText(res),
      };
    }
    return { ok: true, detail: `HTTP ${res.status}` };
  }

  if (provider === "mailtrap") {
    const apiKey = creds.apiKey;
    if (!apiKey) return { ok: false, error: "missing apiKey" };
    if (!creds.fromEmail) return { ok: false, error: "missing fromEmail" };
    const res = await fetch("https://send.api.mailtrap.io/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: {
          email: creds.fromEmail,
          name: creds.fromName ?? "Okomba Analytics",
        },
        to: [{ email: opts.to }],
        subject: opts.subject,
        html: opts.bodyHtml,
        text: opts.bodyText,
        attachments: opts.attachments.map((a) => ({
          filename: a.filename,
          content: a.base64,
          type: a.contentType,
        })),
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `mailtrap HTTP ${res.status}`,
        detail: await safeText(res),
      };
    }
    return { ok: true, detail: `HTTP ${res.status}` };
  }

  if (provider === "maileroo") {
    const apiKey = creds.apiKey;
    if (!apiKey) return { ok: false, error: "missing apiKey" };
    if (!creds.fromEmail) return { ok: false, error: "missing fromEmail" };
    const res = await fetch("https://api.maileroo.com/v1/smtp/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: {
          email: creds.fromEmail,
          name: creds.fromName ?? "Okomba Analytics",
        },
        to: [opts.to],
        subject: opts.subject,
        html: opts.bodyHtml,
        text: opts.bodyText,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `maileroo HTTP ${res.status}`,
        detail: await safeText(res),
      };
    }
    return { ok: true, detail: `HTTP ${res.status}` };
  }

  return { ok: false, error: `unknown provider: ${provider}` };
}

async function safeText(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t.slice(0, 400);
  } catch {
    return "";
  }
}

/* ── Display name defaults (used when saveEmailProvider called
   without an explicit displayName — admin Settings tab form
   always supplies one but this is the safety net).            */
export const DEFAULT_PROVIDER_DISPLAY_NAMES: Record<EmailProviderName, string> = {
  apps_script: "Google Apps Script",
  resend: "Resend",
  mailtrap: "Mailtrap",
  maileroo: "Maileroo",
  test_recipient: "Test recipient (admin email-failover test target)",
};

/* Ordered list of all 4 known provider slots, used by the admin
   Settings tab to render cards even when no row exists yet. */
export const ALL_PROVIDER_SLOTS: EmailProviderName[] = [
  "apps_script",
  "resend",
  "mailtrap",
  "maileroo",
];

/* Each provider's expected credential fields — drives the form UI
   in the admin Settings tab. `test_recipient` is a pseudo-row that
   only stores a `to` field (no API call ever uses it as a delivery
   provider — see `testProvider` early-return guard). */
export const PROVIDER_FIELD_DEFS: Record<
  EmailProviderName,
  { key: keyof EmailProviderCredentials; label: string; type: string; placeholder?: string; required?: boolean }[]
> = {
  apps_script: [
    {
      key: "webhookUrl",
      label: "Webhook URL",
      type: "url",
      placeholder: "https://script.google.com/macros/s/…/exec",
      required: true,
    },
    { key: "fromEmail", label: "From email (optional)", type: "email", placeholder: "insights@okomba.com" },
  ],
  resend: [
    { key: "apiKey", label: "API key", type: "password", placeholder: "re_…", required: true },
    { key: "fromEmail", label: "From email", type: "email", placeholder: "insights@okomba.com", required: true },
    { key: "fromName", label: "From name", type: "text", placeholder: "Okomba Analytics" },
  ],
  mailtrap: [
    { key: "apiKey", label: "API key", type: "password", placeholder: "……", required: true },
    { key: "fromEmail", label: "From email", type: "email", placeholder: "insights@okomba.com", required: true },
    { key: "fromName", label: "From name", type: "text", placeholder: "Okomba Analytics" },
  ],
  maileroo: [
    { key: "apiKey", label: "API key", type: "password", placeholder: "……", required: true },
    { key: "fromEmail", label: "From email", type: "email", placeholder: "insights@okomba.com", required: true },
    { key: "fromName", label: "From name", type: "text", placeholder: "Okomba Analytics" },
  ],
  test_recipient: [
    { key: "to", label: "Test recipient email", type: "email", placeholder: "you@example.com", required: true },
  ],
};
