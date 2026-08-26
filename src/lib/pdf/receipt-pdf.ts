/**
 * Branded Payment Receipt PDF — Ink + Honey Gold (Module 7).
 *
 * Generated when a Paystack `charge.success` webhook lands and the
 * invoice flips to `paid`. Attached to BOTH the "Thanks for payment"
 * email and the WhatsApp thank-you message.
 *
 * Single page: ink header + PAID badge → receipt details card →
 * amount paid band (gold) → payment method (DVA / Paystack ref) →
 * next steps → footer.
 */

import PDFDocument from "pdfkit";
import path from "node:path";
import fs from "node:fs";
import { BRAND, CONTACT } from "@/lib/brand";
import type { Invoice } from "@/generated/prisma";

/* ── Page geometry (A4 595×842) ────────────────────────────── */

const MARGIN = 52;
const PAGE_W = 595.28;
const CONTENT_W = PAGE_W - MARGIN * 2;

/* ── Fonts (same graceful fallback as the proposal PDF) ────── */

let fontState: { regular: string; bold: string; unicode: boolean } | null = null;

function resolveFonts(): { regular: string; bold: string; unicode: boolean } {
  if (fontState) return fontState;
  const reg = path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf");
  const bold = path.join(process.cwd(), "public", "fonts", "NotoSans-Bold.ttf");
  if (fs.existsSync(reg) && fs.existsSync(bold)) {
    fontState = { regular: reg, bold, unicode: true };
  } else {
    fontState = { regular: "Helvetica", bold: "Helvetica-Bold", unicode: false };
  }
  return fontState;
}

function naira(amount: number, unicode: boolean): string {
  const num = amount.toLocaleString("en-NG", { maximumFractionDigits: 0 });
  return unicode ? `\u20A6${num}` : `NGN ${num}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

export type ReceiptPdfData = {
  invoice: Invoice;
  receiptNumber: string; // RCT-xxxxxx
  paidAt: Date;
  paystackReference?: string | null;
  channelLabel?: string | null; // e.g. "Bank transfer — Wema Bank"
};

/** Receipt number derived from the invoice: INV-2026-0001 → RCT-2026-0001 */
export function receiptNumberFor(invoiceNumber: string): string {
  const m = invoiceNumber.match(/(\d{4})-(\d+)/);
  return m ? `RCT-${m[1]}-${m[2]}` : `RCT-${Date.now().toString().slice(-6)}`;
}

export async function generateReceiptPdf(data: ReceiptPdfData): Promise<Buffer> {
  const fonts = resolveFonts();
  const F = { r: fonts.regular, b: fonts.bold };
  const LOGO = path.join(process.cwd(), "public", "images", "logo.png");
  const hasLogo = fs.existsSync(LOGO);
  const money = (n: number) => naira(n, fonts.unicode);
  const inv = data.invoice;
  const amountNaira = Math.round(inv.amountKobo / 100);

  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    bufferPages: true,
    info: {
      Title: `Receipt ${data.receiptNumber} — ${BRAND.name}`,
      Author: BRAND.name,
      Subject: `Payment receipt for invoice ${inv.invoiceNumber}`,
      Creator: `${BRAND.name} payments engine`,
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  /* ═══ Header: ink band + gold rule ═══ */
  const bandH = 150;
  doc.rect(0, 0, PAGE_W, bandH).fill(BRAND.primary);
  doc.rect(0, bandH, PAGE_W, 3).fill(BRAND.accent);

  // Logo on white chip (keeps the black badge crisp on ink)
  if (hasLogo) {
    const lw = 118;
    const lh = Math.round((lw * 428) / 1308);
    const lx = MARGIN;
    const ly = 30;
    const pad = 10;
    doc.roundedRect(lx - pad, ly - pad, lw + pad * 2, lh + pad * 2, 12).fill(BRAND.card);
    doc.roundedRect(lx - pad, ly - pad, lw + pad * 2, lh + pad * 2, 12)
      .lineWidth(0.8).strokeColor(BRAND.accent).stroke();
    doc.image(LOGO, lx, ly, { width: lw, height: lh });
  }

  doc.font(F.b).fontSize(9.5).fillColor(BRAND.accentSoft)
    .text("OFFICIAL  PAYMENT  RECEIPT", MARGIN, 104, { characterSpacing: 3.2 });
  doc.font(F.b).fontSize(21).fillColor(BRAND.primaryText)
    .text(`Payment for ${inv.invoiceNumber}`, MARGIN, 119, { width: CONTENT_W - 170 });

  // PAID badge (top-right, gold)
  const badgeW = 118;
  const badgeH = 44;
  const bx = PAGE_W - MARGIN - badgeW;
  doc.roundedRect(bx, 96, badgeW, badgeH, 10).fill(BRAND.accent);
  doc.font(F.b).fontSize(16).fillColor(BRAND.accentText)
    .text("PAID", bx, 96 + 13, { width: badgeW, align: "center", characterSpacing: 3 });

  doc.y = bandH + 30;

  /* ═══ Thank-you line ═══ */
  doc.font(F.r).fontSize(11).fillColor(BRAND.text)
    .text(
      `Confirmed with thanks — this receipt acknowledges full payment of invoice ${inv.invoiceNumber}.`,
      MARGIN,
      doc.y,
      { width: CONTENT_W, lineGap: 3 }
    );
  doc.y += 22;

  /* ═══ Receipt details card ═══ */
  const rows: [string, string][] = [
    ["Receipt no.", data.receiptNumber],
    ["Date paid", fmtDate(data.paidAt)],
    ["Invoice", `${inv.invoiceNumber} — ${inv.service}`],
    ["Billed to", `${inv.customerName} (${inv.customerEmail})`],
    ["Engagement", inv.durationLabel ? `${inv.service} · ${inv.durationLabel}` : inv.service],
  ];
  if (data.paystackReference) rows.push(["Paystack reference", data.paystackReference]);

  const cardH = rows.length * 27 + 26;
  const cy = doc.y;
  doc.fillColor(BRAND.card).rect(MARGIN, cy, CONTENT_W, cardH).fill();
  doc.rect(MARGIN, cy, CONTENT_W, cardH).lineWidth(0.8).strokeColor(BRAND.border).stroke();
  doc.rect(MARGIN, cy, 3.5, cardH).fill(BRAND.accent);

  rows.forEach(([label, value], i) => {
    const ry = cy + 18 + i * 27;
    doc.font(F.r).fontSize(8).fillColor(BRAND.muted)
      .text(label.toUpperCase(), MARGIN + 24, ry + 3, { characterSpacing: 1.6 });
    doc.font(F.b).fontSize(11).fillColor(BRAND.primary)
      .text(value, MARGIN + 190, ry, { width: CONTENT_W - 214, lineGap: 1.5 });
  });

  doc.y = cy + cardH + 24;

  /* ═══ Amount paid band (gold) ═══ */
  const bandY = doc.y;
  const bandHeight = 64;
  doc.roundedRect(MARGIN, bandY, CONTENT_W, bandHeight, 10).fill(BRAND.accent);
  doc.font(F.r).fontSize(9).fillColor(BRAND.accentText)
    .text("AMOUNT  PAID", MARGIN + 26, bandY + 15, { characterSpacing: 2.4 });
  doc.font(F.b).fontSize(24).fillColor(BRAND.accentText)
    .text(money(amountNaira), MARGIN + 26, bandY + 28);
  doc.font(F.r).fontSize(9.5).fillColor(BRAND.accentText)
    .text(`Full settlement — ${fmtDate(data.paidAt)}`, MARGIN + 240, bandY + 34, {
      width: CONTENT_W - 266,
      align: "right",
    });

  doc.y = bandY + bandHeight + 26;

  /* ═══ Payment method box ═══ */
  const payY = doc.y;
  const payH = 104;
  doc.fillColor(BRAND.primary).rect(MARGIN, payY, CONTENT_W, payH).fill();
  doc.font(F.r).fontSize(8).fillColor(BRAND.accentSoft)
    .text("PAYMENT  METHOD", MARGIN + 26, payY + 16, { characterSpacing: 2.2 });
  doc.font(F.b).fontSize(11.5).fillColor(BRAND.primaryText)
    .text(
      data.channelLabel ?? "Bank transfer to dedicated virtual account",
      MARGIN + 26,
      payY + 32,
      { width: CONTENT_W - 52 }
    );
  doc.font(F.r).fontSize(9.5).fillColor("#c9cedb")
    .text(
      [
        inv.dvaAccountNumber ? `Account: ${inv.dvaAccountNumber} · ${inv.dvaBankName ?? ""}` : null,
        "Account name: Okomba Analytics",
        data.paystackReference ? `Reference: ${data.paystackReference}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      MARGIN + 26,
      payY + 52,
      { width: CONTENT_W - 52, lineGap: 3 }
    );

  doc.y = payY + payH + 26;

  /* ═══ Next steps ═══ */
  doc.font(F.b).fontSize(9).fillColor(BRAND.accent)
    .text("WHAT  HAPPENS  NEXT", MARGIN, doc.y, { characterSpacing: 2.4 });
  doc.y += 16;
  const steps = [
    "Your project kickoff is scheduled within 24 hours — you will receive a start confirmation.",
    "All deliverables and timelines in your proposal now proceed on the agreed schedule.",
    "Keep this receipt for your records; it is your proof of full settlement.",
  ];
  for (const step of steps) {
    const y = doc.y;
    doc.save().fillColor(BRAND.accent).rect(MARGIN + 2, y + 4.4, 5.5, 5.5).fill().restore();
    doc.font(F.r).fontSize(10.5).fillColor(BRAND.text)
      .text(step, MARGIN + 22, y, { width: CONTENT_W - 22, lineGap: 2.6 });
    doc.y = y + doc.heightOfString(step, { width: CONTENT_W - 22, lineGap: 2.6 }) + 7;
  }

  /* ═══ Footer ═══ */
  const footerY = doc.page.height - 64;
  doc.rect(0, footerY, PAGE_W, 2).fill(BRAND.accent);
  doc.font(F.r).fontSize(8.5).fillColor(BRAND.muted)
    .text(
      `${BRAND.name} — ${BRAND.tagline}   ·   ${CONTACT.email}   ·   ${CONTACT.phone}`,
      MARGIN,
      footerY + 14,
      { width: CONTENT_W, align: "center" }
    );
  doc.font(F.r).fontSize(8).fillColor(BRAND.muted)
    .text(
      `Receipt ${data.receiptNumber} · generated ${new Date().toLocaleString("en-NG")}`,
      MARGIN,
      footerY + 30,
      { width: CONTENT_W, align: "center" }
    );

  doc.end();
  return done;
}
