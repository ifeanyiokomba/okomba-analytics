/**
 * Branded HTML email template — email-client-safe (tables + inline styles).
 *
 * Brand tokens live in @/lib/brand (shared with the PDF engine) so a
 * rebrand is a two-line change: edit BRAND there and every email,
 * invoice PDF and attachment follows.
 */

import { BRAND, CONTACT } from "@/lib/brand";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || CONTACT.site;
const LOGO_URL = `${SITE_URL}/images/logo.png`;

const CONTACT_FOOTER = {
  email: CONTACT.email,
  phone: CONTACT.phone,
  whatsapp: CONTACT.whatsapp,
  address: CONTACT.address,
};

export type EmailBlock =
  | { kind: "text"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "kv"; rows: [string, string][] };

export type BrandedEmailOptions = {
  title: string; // rendered in the header bar area
  preheader?: string; // inbox preview line
  blocks: EmailBlock[];
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string; // e.g. "You're receiving this because…"
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Convert plain text lines (with \n) to <br>-separated safe HTML. */
function textToHtml(s: string): string {
  return esc(s).replace(/\n/g, "<br />\n");
}

function renderBlock(b: EmailBlock): string {
  switch (b.kind) {
    case "heading":
      return `<tr><td style="padding:6px 36px 0 36px;font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:700;color:${BRAND.primary};line-height:1.35;">${esc(b.text)}</td></tr>`;
    case "text":
      return `<tr><td style="padding:10px 36px 0 36px;font-family:Arial,Helvetica,sans-serif;font-size:14.5px;color:${BRAND.text};line-height:1.65;">${textToHtml(b.text)}</td></tr>`;
    case "list":
      return `<tr><td style="padding:10px 36px 0 36px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0">${b.items
        .map(
          (i) =>
            `<tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.text};line-height:1.6;padding:3px 0;">&nbsp;&nbsp;▸&nbsp;&nbsp;${esc(i)}</td></tr>`
        )
        .join("")}</table></td></tr>`;
    case "kv":
      return `<tr><td style="padding:14px 36px 0 36px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:10px;" width="100%">${b.rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:9px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${BRAND.muted};">${esc(k)}</td><td style="padding:9px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.text};font-weight:600;text-align:right;">${esc(v)}</td></tr>`
        )
        .join("")}</table></td></tr>`;
  }
}

/**
 * Build the full branded HTML email. Structure:
 *   [ink header: logo] → [title + blocks] → [gold CTA] → [footer w/ contact]
 */
export function brandedEmailHtml(opts: BrandedEmailOptions): string {
  const { title, preheader, blocks, ctaText, ctaUrl, footerNote } = opts;

  const cta =
    ctaText && ctaUrl
      ? `<tr><td style="padding:26px 36px 6px 36px;" align="center"><a href="${esc(ctaUrl)}" style="display:inline-block;background:${BRAND.accent};color:${BRAND.accentText};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:13px 34px;border-radius:9px;">${esc(ctaText)}</a></td></tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg};">
<tr><td align="center" style="padding:28px 12px 40px 12px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:${BRAND.card};border-radius:14px;overflow:hidden;border:1px solid ${BRAND.border};">

  <!-- Header -->
  <tr><td style="background:${BRAND.primary};padding:22px 36px;" align="left">
    <img src="${LOGO_URL}" alt="Okomba Analytics" width="132" height="43" style="display:block;border:0;border-radius:8px;" />
  </td></tr>

  <!-- Title -->
  <tr><td style="padding:28px 36px 0 36px;font-family:Georgia,'Times New Roman',serif;font-size:23px;font-weight:700;color:${BRAND.primary};line-height:1.3;">${esc(title)}</td></tr>

  <!-- Blocks -->
  ${blocks.map(renderBlock).join("\n")}

  <!-- CTA -->
  ${cta}

  <!-- Divider -->
  <tr><td style="padding:28px 36px 0 36px;"><div style="border-top:1px solid ${BRAND.border};"></div></td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 36px 30px 36px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${BRAND.muted};line-height:1.7;">
    ${footerNote ? `<p style="margin:0 0 10px 0;">${esc(footerNote)}</p>` : ""}
    <strong style="color:${BRAND.primary};">OKOMBA ANALYTICS</strong> — digital products, systems &amp; experiences<br />
    📧 <a href="mailto:${CONTACT_FOOTER.email}" style="color:${BRAND.accent};text-decoration:none;">${CONTACT_FOOTER.email}</a>
    &nbsp;·&nbsp; 📞 ${CONTACT_FOOTER.phone}
    &nbsp;·&nbsp; <a href="${CONTACT_FOOTER.whatsapp}" style="color:${BRAND.accent};text-decoration:none;">WhatsApp</a><br />
    ${CONTACT_FOOTER.address} · <a href="${SITE_URL}" style="color:${BRAND.accent};text-decoration:none;">${SITE_URL.replace(/^https?:\/\//, "")}</a>
  </td></tr>

  <tr><td style="background:${BRAND.primary};padding:12px 36px;font-family:Arial,Helvetica,sans-serif;font-size:10.5px;color:rgba(255,255,255,.55);letter-spacing:.06em;">
    SENT BY OKOMBA ANALYTICS · KEEP THIS EMAIL FOR YOUR RECORDS
  </td></tr>
</table>

</td></tr>
</table>
</body>
</html>`;
}
