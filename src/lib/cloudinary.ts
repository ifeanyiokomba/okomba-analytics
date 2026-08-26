/**
 * Cloudinary PDF storage (Phase-2 Module 8B).
 *
 * Every generated proposal+invoice PDF is uploaded to Cloudinary at
 *   /okomba/proposals/{invoiceNumber}.pdf     (resource_type: raw)
 * and the returned URL is saved on the invoice row (pdfUrl).
 *
 * FALLBACK CONTRACT (spec 8B.4): if Cloudinary is unconfigured or the
 * upload fails, the PDF is stored locally under data/uploads/proposals/
 * and the admin receives an alert email — the flow never breaks.
 */

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { v2 as cloudinarySdk } from "cloudinary";
import { sendAdminAlertEmail } from "@/lib/notify";

/* ── Configuration ────────────────────────────────────────── */

function cloudName(): string | null {
  // CLOUDINARY_URL=cloudinary://key:secret@cloud_name wins when present.
  const url = process.env.CLOUDINARY_URL;
  if (url) {
    const m = url.match(/^cloudinary:\/\/[^@]+@([^/?]+)/);
    if (m?.[1]) return m[1];
  }
  return process.env.CLOUDINARY_CLOUD_NAME || null;
}

export function isCloudinaryConfigured(): boolean {
  return !!cloudName();
}

let cloudinaryConfigured = false;

function cloudinaryClient() {
  // Configure once (idempotent) — the SDK is imported statically so
  // Next.js bundles it for the Node runtime only (server-side lib).
  if (!cloudinaryConfigured) {
    if (process.env.CLOUDINARY_URL) {
      cloudinarySdk.config(true); // parse CLOUDINARY_URL
    } else {
      cloudinarySdk.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }
    cloudinaryConfigured = true;
  }
  return cloudinarySdk;
}

/* ── Local fallback storage ───────────────────────────────── */

const LOCAL_DIR = path.join(process.cwd(), "data", "uploads", "proposals");

async function storeLocal(invoiceNumber: string, buffer: Buffer): Promise<string> {
  await mkdir(LOCAL_DIR, { recursive: true });
  const file = path.join(LOCAL_DIR, `${invoiceNumber}.pdf`);
  await writeFile(file, buffer);
  return file;
}

/* ── Upload API ───────────────────────────────────────────── */

export type ProposalPdfUpload = {
  ok: boolean;
  url: string | null; // Cloudinary secure URL when ok, local path otherwise
  storage: "cloudinary" | "local";
  error?: string;
};

/**
 * Upload the proposal PDF for one invoice. NEVER throws — returns a
 * local-fallback result on any failure so callers can continue the
 * send pipeline.
 */
export async function uploadProposalPdf(
  invoiceNumber: string,
  buffer: Buffer
): Promise<ProposalPdfUpload> {
  if (!isCloudinaryConfigured()) {
    const local = await storeLocal(invoiceNumber, buffer);
    console.warn(`[cloudinary] unconfigured — stored locally: ${local}`);
    await sendAdminAlertEmail({
      key: "cloudinary.unconfigured",
      subject: "Cloudinary not configured — proposal PDFs stored locally",
      bodyText: [
        "A proposal PDF was generated but Cloudinary credentials are not set,",
        "so it was stored on the local disk instead.",
        "",
        `Latest file: ${invoiceNumber}.pdf (data/uploads/proposals/)`,
        "",
        "Set CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY +",
        "CLOUDINARY_API_SECRET) to enable /okomba/proposals/ storage. Client",
        "portal downloads fall back to on-the-fly PDF regeneration meanwhile.",
      ].join("\n"),
      ctaText: "Cloudinary console",
      ctaUrl: "https://cloudinary.com/console",
    });
    return { ok: false, url: local, storage: "local", error: "cloudinary-unconfigured" };
  }

  try {
    const cloudinary = cloudinaryClient();
    const result = await cloudinary.uploader.upload(
      `data:application/pdf;base64,${buffer.toString("base64")}`,
      {
        resource_type: "raw", // PDFs are "raw" assets on Cloudinary
        folder: "okomba/proposals",
        public_id: invoiceNumber, // /okomba/proposals/{invoiceNumber}.pdf
        overwrite: true, // re-sends replace the same deterministic URL
        unique_filename: false,
        use_filename: false,
      }
    );
    console.log(`[cloudinary] uploaded ${invoiceNumber}.pdf → ${result.secure_url}`);
    return { ok: true, url: result.secure_url, storage: "cloudinary" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "upload failed";
    console.error(`[cloudinary] upload failed for ${invoiceNumber}:`, msg);
    const local = await storeLocal(invoiceNumber, buffer);
    await sendAdminAlertEmail({
      key: "cloudinary.upload-failed",
      subject: `Cloudinary upload failed — ${invoiceNumber} stored locally`,
      bodyText: [
        `The Cloudinary upload for ${invoiceNumber}.pdf failed:`,
        "",
        `Reason: ${msg}`,
        "",
        "The PDF was stored locally as a fallback and the customer send",
        "continued. Check Cloudinary status/credentials.",
      ].join("\n"),
      ctaText: "Cloudinary console",
      ctaUrl: "https://cloudinary.com/console",
    });
    return { ok: false, url: local, storage: "local", error: msg };
  }
}

/**
 * Force-download variant of a Cloudinary raw URL (adds fl_attachment
 * so browsers download instead of previewing).
 */
export function withAttachmentFlag(url: string): string {
  if (!url.includes("res.cloudinary.com")) return url;
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const head = url.slice(0, idx + marker.length);
  const tail = url.slice(idx + marker.length);
  if (tail.startsWith("fl_attachment")) return url;
  return `${head}fl_attachment/${tail}`;
}
