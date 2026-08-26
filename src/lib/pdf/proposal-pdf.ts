/**
 * Branded Proposal + Invoice PDF — Ink + Honey Gold (user-approved
 * live brand, Phase 2 decision 1).
 *
 * Layout: cover/summary → scope & timeline → invoice & payment.
 * Brand tokens come from @/lib/brand so a rebrand is a 2-line change.
 *
 * Fonts: Noto Sans (public/fonts) embedded for full Unicode support
 * (incl. the ₦ naira sign). Falls back to Helvetica + "NGN" if the
 * font files are unavailable.
 */

import PDFDocument from "pdfkit";
import path from "node:path";
import fs from "node:fs";
import { BRAND, CONTACT, DVA_ACCOUNT_NAME } from "@/lib/brand";
import type { ProposalDraft } from "@/lib/proposal";

/* ── Types ─────────────────────────────────────────────────── */

export type ProposalPdfDva = {
  accountNumber: string;
  bankName: string;
  accountName: string;
  sandbox: boolean;
};

export type ProposalPdfData = {
  invoiceNumber: string;
  date: Date;
  dueDate: Date | null;
  durationLabel: string | null;
  client: { name: string; email: string; phone?: string | null };
  service: string;
  description?: string | null;
  amountNaira: number;
  currency?: string;
  proposal: ProposalDraft;
  dva: ProposalPdfDva | null;
};

/* ── Page geometry (A4 595×842) ────────────────────────────── */

const MARGIN = 52;
const PAGE_W = 595.28;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_ZONE = 86; // reserved at the bottom of every page

/* ── Fonts with graceful fallback ──────────────────────────── */

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

/* ── Generator ─────────────────────────────────────────────── */

export async function generateProposalPdf(data: ProposalPdfData): Promise<Buffer> {
  const fonts = resolveFonts();
  const F = { r: fonts.regular, b: fonts.bold };
  const LOGO = path.join(process.cwd(), "public", "images", "logo.png");
  const hasLogo = fs.existsSync(LOGO);
  const money = (n: number) => naira(n, fonts.unicode);

  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    bufferPages: true,
    info: {
      Title: `Proposal ${data.invoiceNumber} — ${BRAND.name}`,
      Author: BRAND.name,
      Subject: `${data.service} — proposal & invoice`,
      Creator: `${BRAND.name} proposal engine`,
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const p = data.proposal;
  const currencyNote = data.currency && data.currency !== "NGN" ? ` (${data.currency})` : "";

  /* ── Layout helpers ── */

  const topY = () => MARGIN;
  const ensure = (h: number) => {
    if (doc.y + h > doc.page.height - FOOTER_ZONE) {
      doc.addPage();
      doc.y = topY();
      return true;
    }
    return false;
  };

  const sectionHeader = (num: string, title: string) => {
    ensure(64);
    const y = doc.y;
    doc.font(F.b).fontSize(9).fillColor(BRAND.accent)
      .text(num.toUpperCase(), MARGIN, y, { characterSpacing: 2.5, lineGap: 0 });
    doc.font(F.b).fontSize(15.5).fillColor(BRAND.primary)
      .text(title, MARGIN, y + 14, { lineGap: 0 });
    const underlineY = y + 40;
    doc.moveTo(MARGIN, underlineY).lineTo(MARGIN + 34, underlineY)
      .lineWidth(2.4).strokeColor(BRAND.accent).stroke();
    doc.moveTo(MARGIN + 34, underlineY).lineTo(PAGE_W - MARGIN, underlineY)
      .lineWidth(0.7).strokeColor(BRAND.border).stroke();
    doc.y = underlineY + 16;
  };

  const bullets = (items: string[], gap = 6) => {
    for (const item of items) {
      const cleaned = item.replace(/\s+/g, " ").trim();
      if (!cleaned) continue;
      doc.font(F.r).fontSize(10.5).fillColor(BRAND.text);
      const h = doc.heightOfString(cleaned, { width: CONTENT_W - 22 });
      ensure(h + gap);
      const y = doc.y;
      doc.save().fillColor(BRAND.accent).rect(MARGIN + 2, y + 4.4, 5.5, 5.5).fill().restore();
      doc.font(F.r).fontSize(10.5).fillColor(BRAND.text)
        .text(cleaned, MARGIN + 22, y, { width: CONTENT_W - 22, lineGap: 2.6 });
      doc.y = y + h + gap;
    }
  };

  const paragraph = (text: string, size = 10.5) => {
    const h = doc.heightOfString(text, { width: CONTENT_W, lineGap: 3 });
    ensure(h + 8);
    doc.font(F.r).fontSize(size).fillColor(BRAND.text)
      .text(text, MARGIN, doc.y, { width: CONTENT_W, lineGap: 3 });
    doc.y += 8;
  };

  /* ═════════ PAGE 1 — COVER ═════════ */
  {
    // Ink header band
    const bandH = 168;
    doc.rect(0, 0, PAGE_W, bandH).fill(BRAND.primary);

    // Gold rule across the band bottom
    doc.rect(0, bandH, PAGE_W, 3).fill(BRAND.accent);

    // Logo badge on a white chip so the black badge stays crisp on ink
    if (hasLogo) {
      const lw = 128;
      const lh = Math.round((lw * 428) / 1308);
      const lx = MARGIN;
      const ly = 34;
      const pad = 10;
      doc.save().opacity(0.97);
      doc.roundedRect(lx - pad, ly - pad, lw + pad * 2, lh + pad * 2, 12).fill(BRAND.card);
      doc.restore();
      doc.roundedRect(lx - pad, ly - pad, lw + pad * 2, lh + pad * 2, 12)
        .lineWidth(0.8).strokeColor(BRAND.accent).stroke();
      doc.image(LOGO, lx, ly, { width: lw, height: lh });
    }

    // Eyebrow + title
    doc.font(F.b).fontSize(9.5).fillColor(BRAND.accentSoft)
      .text("PROPOSAL  &  INVOICE", MARGIN, 126, { characterSpacing: 3.2 });
    doc.font(F.b).fontSize(23).fillColor(BRAND.primaryText)
      .text(data.service, MARGIN, 142, { width: CONTENT_W - 150, lineGap: 2 });

    // Invoice chip (top-right of the band)
    const chipW = 142;
    const chipX = PAGE_W - MARGIN - chipW;
    doc.save().opacity(0.12).roundedRect(chipX, 118, chipW, 40, 9).fill("#FFFFFF").restore();
    doc.roundedRect(chipX, 118, chipW, 40, 9).lineWidth(1).strokeColor(BRAND.accent).stroke();
    doc.font(F.r).fontSize(8).fillColor(BRAND.accentSoft)
      .text("INVOICE", chipX, 126, { width: chipW, align: "center", characterSpacing: 2 });
    doc.font(F.b).fontSize(12.5).fillColor(BRAND.primaryText)
      .text(data.invoiceNumber, chipX, 137, { width: chipW, align: "center" });

    doc.y = bandH + 26;

    // Prepared-for card + meta
    const cardH = 118;
    ensure(cardH + 18);
    const cy = doc.y;
    doc.fillColor(BRAND.card).rect(MARGIN, cy, CONTENT_W, cardH).fill();
    doc.rect(MARGIN, cy, CONTENT_W, cardH).lineWidth(0.8).strokeColor(BRAND.border).stroke();
    // gold left edge
    doc.rect(MARGIN, cy, 3.5, cardH).fill(BRAND.accent);

    const colL = MARGIN + 24;
    doc.font(F.r).fontSize(8).fillColor(BRAND.muted)
      .text("PREPARED FOR", colL, cy + 16, { characterSpacing: 1.8 });
    doc.font(F.b).fontSize(14).fillColor(BRAND.primary)
      .text(data.client.name, colL, cy + 30);
    doc.font(F.r).fontSize(10).fillColor(BRAND.muted)
      .text(data.client.email, colL, cy + 50);
    if (data.client.phone) {
      doc.font(F.r).fontSize(10).fillColor(BRAND.muted)
        .text(data.client.phone, colL, cy + 65);
    }
    doc.font(F.r).fontSize(10).fillColor(BRAND.muted)
      .text(`${BRAND.name} — ${BRAND.tagline}`, colL, cy + 88);

    const colR = MARGIN + 330;
    const metaRow = (label: string, value: string, dy: number) => {
      doc.font(F.r).fontSize(8).fillColor(BRAND.muted)
        .text(label.toUpperCase(), colR, cy + 16 + dy, { characterSpacing: 1.4 });
      doc.font(F.b).fontSize(10.5).fillColor(BRAND.primary)
        .text(value, colR, cy + 27 + dy);
    };
    metaRow("Invoice date", fmtDate(data.date), 0);
    metaRow("Valid until", data.dueDate ? fmtDate(data.dueDate) : "30 days from invoice date", 26);
    if (data.durationLabel) metaRow("Duration", data.durationLabel, 52);
    metaRow("Prepared by", "Okomba Analytics", data.durationLabel ? 78 : 52);

    doc.y = cy + cardH + 24;

    // Executive summary
    sectionHeader("01", "Executive summary");
    paragraph(p.executiveSummary);

    // Objectives
    sectionHeader("02", "Objectives");
    bullets(p.objectives);
  }

  /* ═════════ SCOPE & TIMELINE ═════════ */
  {
    sectionHeader("03", "Scope of work");
    p.scope.forEach((section, i) => {
      ensure(52);
      doc.font(F.b).fontSize(11.5).fillColor(BRAND.primary)
        .text(`${i + 1}.  ${section.title}`, MARGIN, doc.y);
      doc.y += 8;
      bullets(section.items);
      doc.y += 4;
    });

    sectionHeader("04", "Deliverables");
    bullets(p.deliverables);

    // Timeline table
    sectionHeader("05", "Timeline");
    const colPhase = MARGIN + 8;
    const colDur = MARGIN + 250;
    const colFocus = MARGIN + 330;
    const rowH = 34;

    ensure(rowH + 4);
    const headY = doc.y;
    doc.rect(MARGIN, headY, CONTENT_W, rowH).fill(BRAND.primary);
    doc.font(F.b).fontSize(9).fillColor(BRAND.primaryText)
      .text("PHASE", colPhase, headY + 12, { characterSpacing: 1.4 });
    doc.font(F.b).fontSize(9).fillColor(BRAND.accentSoft)
      .text("DURATION", colDur, headY + 12, { characterSpacing: 1.4 });
    doc.font(F.b).fontSize(9).fillColor(BRAND.primaryText)
      .text("FOCUS", colFocus, headY + 12, { characterSpacing: 1.4 });
    doc.y = headY + rowH;

    p.timeline.forEach((phaseRow, i) => {
      const focus = phaseRow.focus.replace(/\s+/g, " ").trim();
      const focusH = doc.heightOfString(focus, { width: PAGE_W - MARGIN - colFocus - 10, lineGap: 2 });
      const rh = Math.max(rowH, focusH + 18);
      ensure(rh);
      const ry = doc.y;
      if (i % 2 === 1) {
        doc.save().opacity(0.5).rect(MARGIN, ry, CONTENT_W, rh).fill(BRAND.bg).restore();
      }
      doc.rect(MARGIN, ry, CONTENT_W, rh).lineWidth(0.6).strokeColor(BRAND.border).stroke();
      doc.font(F.b).fontSize(10).fillColor(BRAND.primary)
        .text(phaseRow.phase, colPhase, ry + 12, { width: 230 });
      doc.font(F.b).fontSize(10).fillColor(BRAND.accent)
        .text(phaseRow.duration, colDur, ry + 12, { width: 74 });
      doc.font(F.r).fontSize(9.5).fillColor(BRAND.text)
        .text(focus, colFocus, ry + 12, { width: PAGE_W - MARGIN - colFocus - 10, lineGap: 2 });
      doc.y = ry + rh;
    });
    doc.y += 18;
  }

  /* ═════════ INVOICE & PAYMENT ═════════ */
  {
    sectionHeader("06", "Invoice");

    const amt = money(data.amountNaira) + currencyNote;
    const desc =
      (data.description?.replace(/\s+/g, " ").trim() || "") ||
      `${data.service} — professional services as detailed in this proposal`;

    // line item
    const itemH = 40;
    ensure(itemH + 52);
    const iy = doc.y;
    doc.rect(MARGIN, iy, CONTENT_W, itemH).lineWidth(0.7).strokeColor(BRAND.border).stroke();
    doc.font(F.r).fontSize(10.5).fillColor(BRAND.text)
      .text(desc, MARGIN + 14, iy + 13, { width: CONTENT_W - 190 });
    doc.font(F.b).fontSize(11).fillColor(BRAND.primary)
      .text(amt, MARGIN + CONTENT_W - 160, iy + 13, { width: 146, align: "right" });

    // total band (gold)
    const ty = iy + itemH;
    doc.rect(MARGIN, ty, CONTENT_W, 44).fill(BRAND.accent);
    doc.font(F.b).fontSize(10).fillColor(BRAND.accentText)
      .text("TOTAL DUE", MARGIN + 14, ty + 9, { characterSpacing: 1.8 });
    doc.font(F.b).fontSize(14.5).fillColor(BRAND.accentText)
      .text(amt, MARGIN + CONTENT_W - 190, ty + 8, { width: 176, align: "right" });
    if (data.dueDate) {
      doc.font(F.r).fontSize(8.5).fillColor(BRAND.accentText)
        .text(`Due ${fmtDate(data.dueDate)}`, MARGIN + 14, ty + 28, { characterSpacing: 0.6 });
    }
    doc.y = ty + 44 + 26;

    // Payment details (DVA)
    if (data.dva) {
      ensure(128);
      const py = doc.y;
      const ph = 108;
      doc.rect(MARGIN, py, CONTENT_W, ph).fill(BRAND.primary);
      doc.font(F.r).fontSize(8).fillColor(BRAND.accentSoft)
        .text("PAYMENT — PAYSTACK DEDICATED VIRTUAL ACCOUNT", MARGIN + 20, py + 16, { characterSpacing: 1.6 });
      doc.font(F.r).fontSize(9).fillColor("#B9BfCC")
        .text("Transfer the total due to this account. Payment reflects automatically.", MARGIN + 20, py + 29, { width: CONTENT_W - 40 });

      const label = (t: string, x: number, dy: number, w: number) =>
        doc.font(F.r).fontSize(7.5).fillColor(BRAND.accentSoft)
          .text(t.toUpperCase(), x, py + dy, { width: w, characterSpacing: 1.4 });
      const value = (t: string, x: number, dy: number, w: number) =>
        doc.font(F.b).fontSize(12).fillColor(BRAND.primaryText)
          .text(t, x, py + dy + 11, { width: w });

      label("Bank", MARGIN + 20, 48, 200);
      value(data.dva.bankName, MARGIN + 20, 48, 200);
      label("Account number", MARGIN + 240, 48, 160);
      value(data.dva.accountNumber, MARGIN + 240, 48, 160);
      label("Account name", MARGIN + 240, 76, 240);
      value(data.dva.accountName || DVA_ACCOUNT_NAME, MARGIN + 240, 76, 240);

      doc.y = py + ph + 12;
      if (data.dva.sandbox) {
        doc.font(F.r).fontSize(7.5).fillColor(BRAND.muted)
          .text("Sandbox account shown (PAYSTACK_SECRET_KEY not configured) — live details are used once configured.", MARGIN, doc.y, { width: CONTENT_W });
        doc.y += 14;
      }
      doc.y += 12;
    }

    // Terms
    sectionHeader("07", "Terms of engagement");
    bullets(p.terms);

    // Signature block
    ensure(96);
    const sy = doc.y + 14;
    const half = (CONTENT_W - 28) / 2;
    const sigBox = (x: number, who: string) => {
      doc.roundedRect(x, sy, half, 74, 8).lineWidth(0.8).strokeColor(BRAND.border).stroke();
      doc.moveTo(x + 18, sy + 46).lineTo(x + half - 18, sy + 46)
        .lineWidth(0.8).strokeColor(BRAND.muted).stroke();
      doc.font(F.r).fontSize(8.5).fillColor(BRAND.muted)
        .text(who, x + 18, sy + 52, { characterSpacing: 1.2 });
    };
    sigBox(MARGIN, "FOR OKOMBA ANALYTICS");
    sigBox(MARGIN + half + 28, "CLIENT ACCEPTANCE");
    doc.y = sy + 92;
  }

  /* ── Footers (stamped with correct page numbers) ── */
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const fy = doc.page.height - 58;
    doc.moveTo(MARGIN, fy).lineTo(PAGE_W - MARGIN, fy)
      .lineWidth(0.7).strokeColor(BRAND.border).stroke();
    doc.font(F.r).fontSize(8).fillColor(BRAND.muted)
      .text(`${BRAND.name} · ${CONTACT.email} · ${CONTACT.phone} · ${CONTACT.whatsapp.replace("https://", "")}`, MARGIN, fy + 10, { width: CONTENT_W, lineGap: 1.4 });
    doc.font(F.r).fontSize(8).fillColor(BRAND.muted)
      .text(`Page ${i - range.start + 1} of ${range.count}`, MARGIN, fy + 24, { width: CONTENT_W, align: "right" });
    doc.font(F.r).fontSize(8).fillColor(BRAND.accent)
      .text(data.invoiceNumber, MARGIN, fy + 24, { width: CONTENT_W, align: "left" });
  }

  doc.flushPages?.();
  doc.end();
  return done;
}
