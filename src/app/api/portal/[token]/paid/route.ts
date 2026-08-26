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
    const type = file.type || "application/octet-stream";
    if (!ALLOWED.has(type)) {
      return NextResponse.json({ ok: false, error: "Only PNG, JPG, WEBP, HEIC images or PDF proofs are accepted" }, { status: 415 });
    }

    // Persist under data/uploads/proofs/{invoiceId}/
    const dir = path.join(process.cwd(), "data", "uploads", "proofs", invoice.id);
    await mkdir(dir, { recursive: true });
    const safeName = sanitizeName(file.name || "proof");
    const stamped = `${Date.now()}-${safeName}`;
    const fullPath = path.join(dir, stamped);
    const bytes = Buffer.from(await file.arrayBuffer());
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
