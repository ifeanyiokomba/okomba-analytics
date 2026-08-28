import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { recordAnalyticsEvent } from "@/lib/analytics-server";
import { notifyPaymentProofUploaded } from "@/lib/notify";
import { portalUrlFor } from "@/lib/portal";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/portal/[token]/paid — "I've Paid" proof upload (8A)        */
/* Public (token-auth). Accepts image/* or application/pdf up to 10 MB. */
/* Stores under data/uploads/proofs/{invoiceId}/, stamps the invoice,   */
/* records analytics + alerts the admin by email.                       */
/* ------------------------------------------------------------------ */

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

/* ── Audit fix (Phase 27): magic-byte signatures ──
   The browser-supplied file.type is client-controlled and can be
   spoofed. We verify the first bytes of the actual file content
   match a known signature for the claimed type before persisting. */
const MAGIC_BYTES: Array<{ ext: "png" | "jpg" | "webp" | "pdf"; mime: string; sig: number[] }> = [
  { ext: "png", mime: "image/png", sig: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }, // \x89PNG\r\n\x1A\n
  { ext: "jpg", mime: "image/jpeg", sig: [0xff, 0xd8, 0xff] }, // SOI + JFIF/EXIF marker
  { ext: "webp", mime: "image/webp", sig: [0x52, 0x49, 0x46, 0x46] }, // RIFF....
  { ext: "pdf", mime: "application/pdf", sig: [0x25, 0x50, 0x44, 0x46] }, // %PDF
];

function detectByMagicBytes(buf: Buffer): { mime: string; ext: string } | null {
  for (const sig of MAGIC_BYTES) {
    if (buf.length < sig.sig.length) continue;
    const slice = buf.subarray(0, sig.sig.length);
    let ok = true;
    for (let i = 0; i < sig.sig.length; i++) {
      if (slice[i] !== sig.sig[i]) { ok = false; break; }
    }
    if (ok) return { mime: sig.mime, ext: sig.ext };
  }
  return null;
}

/* ── Audit fix (Phase 27): per-token upload rate limit ──
   Prevents a single compromised portal link from flooding
   persistent storage with 10 MB payloads. 5 uploads per token
   per 30 minutes. In-memory (process-local) — for multi-instance
   deployments, swap for Redis/Upstash. */
const UPLOAD_RATE_LIMIT = 5;
const UPLOAD_WINDOW_MS = 30 * 60 * 1000;
const uploadBuckets = new Map<string, { count: number; resetAt: number }>();
function uploadRateLimited(token: string): boolean {
  const now = Date.now();
  const bucket = uploadBuckets.get(token);
  if (!bucket || now > bucket.resetAt) {
    uploadBuckets.set(token, { count: 1, resetAt: now + UPLOAD_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > UPLOAD_RATE_LIMIT;
}

function sanitizeName(name: string): string {
  return (
    name
      .replace(/[^A-Za-z0-9._-]+/g, "_")
      .replace(/_{2,}/g, "_")
      .slice(-80) || "proof"
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token || token.length < 16 || token.length > 128 || !/^[A-Za-z0-9_-]+$/.test(token)) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const invoice = await db.invoice.findUnique({ where: { secureToken: token } });
    if (!invoice) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    if (invoice.status === "paid") {
      return NextResponse.json(
        { ok: false, error: "This invoice is already marked paid — thank you!" },
        { status: 409 }
      );
    }

    const form = await req.formData().catch(() => null);
    const file = form?.get("proof");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Attach a screenshot or PDF of your payment" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "File must be between 1 byte and 10 MB" }, { status: 400 });
    }
    // Audit fix (Phase 27): per-token upload rate limit (5 / 30 min).
    if (uploadRateLimited(token)) {
      return NextResponse.json({ ok: false, error: "Too many uploads for this invoice. Please try again later." }, { status: 429 });
    }
    // Audit fix (Phase 27): validate by actual file content (magic bytes),
    // NOT the client-supplied file.type. Defeats MIME-spoofing attacks.
    const bytes = Buffer.from(await file.arrayBuffer());
    const detected = detectByMagicBytes(bytes);
    if (!detected) {
      return NextResponse.json(
        { ok: false, error: "File content does not match an accepted type (PNG, JPG, WEBP, PDF)" },
        { status: 415 }
      );
    }
    const type = detected.mime;

    // Persist under data/uploads/proofs/{invoiceId}/
    const dir = path.join(process.cwd(), "data", "uploads", "proofs", invoice.id);
    await mkdir(dir, { recursive: true });
    const safeName = sanitizeName(file.name || "proof");
    const stamped = `${Date.now()}-${safeName}`;
    const fullPath = path.join(dir, stamped);
    // bytes already read above for magic-byte validation
    await writeFile(fullPath, bytes);

    // Stamp the invoice row
    await db.invoice.update({
      where: { id: invoice.id },
      data: {
        paymentProofUrl: fullPath,
        paymentProofName: safeName,
        paymentProofUploadedAt: new Date(),
      },
    });

    // Analytics: bonus funnel step beyond the spec's five
    void recordAnalyticsEvent({
      type: "payment_proof_uploaded",
      invoiceId: invoice.id,
      secureToken: token,
      meta: { invoiceNumber: invoice.invoiceNumber, fileName: safeName, sizeBytes: file.size },
    });

    // Admin alert (rate-limited per invoice, logged in EmailLog)
    void notifyPaymentProofUploaded({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      amountNaira: Math.round(invoice.amountKobo / 100),
      fileName: safeName,
      sizeBytes: file.size,
      portalUrl: portalUrlFor(token),
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      proof: {
        fileName: safeName,
        uploadedAt: new Date().toISOString(),
        sizeBytes: file.size,
      },
      message:
        "Thank you! Your payment proof has been received — we'll confirm within a few hours and your project kickoff begins.",
    });
  } catch (err) {
    console.error("[POST /api/portal/[token]/paid]", err);
    return NextResponse.json({ ok: false, error: "Upload failed — please try again" }, { status: 500 });
  }
}
