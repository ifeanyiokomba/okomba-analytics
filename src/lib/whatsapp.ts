/**
 * Shared WhatsApp dispatch helper (Phase-2 Modules 4/5/6).
 *
 * Every outbound WhatsApp message — proposal caption, payment reminder,
 * or admin widget chat — flows through here so that:
 *   1. the whatsapp_messages table (chat history source) stays complete;
 *   2. delivery status (queued → sent/failed) is tracked;
 *   3. the transport (mini-service on :3004, whatsapp-web.js) is a
 *      single swap point.
 *
 * The mini-service itself never touches the database — persistence is
 * owned by this app, the mini-service only transports bytes.
 */

import { db } from "@/lib/db";

/* ── Mini-service endpoint ────────────────────────────────── */

export const WHATSAPP_SERVICE_URL = (
  process.env.WHATSAPP_SERVICE_URL || "http://localhost:3004"
).replace(/\/$/, "");

/** Shared secret between this app and the mini-service (internal calls). */
export const WHATSAPP_INTERNAL_TOKEN =
  process.env.WHATSAPP_INTERNAL_TOKEN || "okomba-internal-dev";

/* ── Phone normalisation (Nigeria-first) ───────────────────── */

/**
 * Normalise a phone number to MSISDN digits, e.g.
 *   "+234 808 894 8657" → "2348088948657"
 *   "08088948657"       → "2348088948657"
 *   "2348088948657"     → "2348088948657"
 *   "0803..."           → "234803..."
 * Returns null when the input is too short to be a real number.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("234") && digits.length >= 12) return digits;
  if (digits.startsWith("0") && digits.length >= 10) return `234${digits.slice(1)}`;
  if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith("234")) {
    // bare local number without leading 0 — assume NG
    return `234${digits.replace(/^0/, "")}`;
  }
  if (digits.length >= 11) return digits; // other international
  return null;
}

/** Pretty display form: 2348088948657 → +234 808 894 8657 */
export function formatPhoneDisplay(msisdn: string): string {
  const n = normalizePhone(msisdn) ?? msisdn;
  if (n.startsWith("234") && n.length === 13) {
    return `+234 ${n.slice(3, 6)} ${n.slice(6, 9)} ${n.slice(9)}`;
  }
  return `+${n}`;
}

/** Chat grouping key — normalised digits, or a stable fallback. */
export function chatKeyFor(phone: string | null | undefined): string | null {
  return normalizePhone(phone);
}

/* ── Dispatch ──────────────────────────────────────────────── */

export type DispatchWhatsAppInput = {
  to: string; // raw phone (any format)
  messageText?: string | null;
  caption?: string | null; // shown beside media
  pdfBase64?: string | null;
  pdfUrl?: string | null; // Module 8B — Cloudinary link sent as text (no bytes)
  filename?: string | null;
  invoiceId?: string | null;
  source?: "proposal" | "reminder" | "admin" | "flush";
};

export type DispatchWhatsAppResult = {
  ok: boolean;
  recordId: string;
  status: "sent" | "queued" | "failed";
  error?: string;
  to: string; // normalised
};

/**
 * Persist an outbound message and transport it through the WhatsApp
 * mini-service. When the mini-service is unreachable the row stays
 * `queued` — the service flushes queued rows when it (re)connects.
 *
 * Module 8B: when `pdfUrl` (Cloudinary link) is set, the message is
 * sent as text with the link — no base64 bytes travel to the
 * mini-service. `mediaUrl` on the row is set to the Cloudinary link.
 */
export async function dispatchWhatsApp(
  input: DispatchWhatsAppInput
): Promise<DispatchWhatsAppResult> {
  const to = normalizePhone(input.to);
  if (!to) {
    return { ok: false, recordId: "", status: "failed", error: "invalid phone", to: input.to };
  }

  // Module 8B: a Cloudinary link replaces the base64 attachment — the
  // caption stays, the link is appended so the chat shows a tappable URL.
  const linkLine = input.pdfUrl ? `\n${input.pdfUrl}` : "";
  const baseText = input.messageText ?? input.caption ?? null;
  const text = input.pdfUrl ? `${baseText ?? ""}${linkLine}`.trim() : baseText;
  const pdfBase64 = input.pdfUrl ? null : input.pdfBase64 ?? null;
  const mediaUrl = input.pdfUrl ?? null;

  if (!pdfBase64 && !text) {
    return { ok: false, recordId: "", status: "failed", error: "empty message", to: input.to };
  }

  // 1. Persist first — the chat history must show the attempt even if
  //    transport fails.
  const record = await db.whatsAppMessage.create({
    data: {
      direction: "outbound",
      toPhone: to,
      messageText: text,
      mediaFilename: input.filename ?? null,
      mediaUrl,
      relatedInvoiceId: input.invoiceId ?? null,
      status: "queued",
    },
  });

  // 2. Transport
  try {
    const res = await fetch(`${WHATSAPP_SERVICE_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": WHATSAPP_INTERNAL_TOKEN,
      },
      body: JSON.stringify({
        to,
        caption: text,
        pdfBase64,
        pdfUrl: input.pdfUrl ?? null,
        filename: input.filename ?? null,
        invoiceId: input.invoiceId ?? null,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`service responded ${res.status}`);
    await db.whatsAppMessage.update({
      where: { id: record.id },
      data: { status: "sent", sentAt: new Date() },
    });
    return { ok: true, recordId: record.id, status: "sent", to };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "dispatch failed";
    // stays queued — flushed when the mini-service reconnects
    console.warn(`[whatsapp] queued (transport unavailable): ${msg}`);
    return { ok: false, recordId: record.id, status: "queued", error: msg, to };
  }
}

/* ── Service status passthrough ────────────────────────────── */

export type WhatsAppServiceStatus = {
  mode: "real" | "demo" | "unknown";
  status: "connected" | "disconnected" | "connecting" | "unknown";
  phone?: string | null;
  qr?: string | null;
  serviceUp: boolean;
};

export async function getWhatsAppStatus(): Promise<WhatsAppServiceStatus> {
  try {
    const res = await fetch(`${WHATSAPP_SERVICE_URL}/status`, {
      headers: { "X-Internal-Token": WHATSAPP_INTERNAL_TOKEN },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const j = (await res.json()) as {
      mode?: string;
      status?: string;
      phone?: string | null;
      qr?: string | null;
    };
    return {
      mode: j.mode === "real" || j.mode === "demo" ? j.mode : "unknown",
      status:
        j.status === "connected" || j.status === "disconnected" || j.status === "connecting"
          ? j.status
          : "unknown",
      phone: j.phone ?? null,
      qr: j.qr ?? null,
      serviceUp: true,
    };
  } catch {
    return { mode: "unknown", status: "unknown", serviceUp: false };
  }
}
