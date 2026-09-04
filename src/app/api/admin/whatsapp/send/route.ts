import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { dispatchWhatsApp, normalizePhone } from "@/lib/whatsapp";
import { regenerateInvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/* POST /api/admin/whatsapp/send                                       */
/* Send from the Module-6 widget.                                      */
/*   { to, text }                      → plain chat message            */
/*   { to, kind: "invoice", invoiceId? } → latest unpaid invoice PDF   */
/*        (pdf re-generated from the stored snapshot, caption auto)    */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  try {
    const guard = await authorizeAdmin(req, "edit_customers");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    const body = (await req.json().catch(() => null)) as {
      to?: string;
      text?: string;
      kind?: "text" | "invoice";
      invoiceId?: string;
    } | null;

    const to = normalizePhone(body?.to);
    if (!to) {
      return NextResponse.json({ ok: false, error: "A valid phone number is required" }, { status: 400 });
    }
    const kind = body?.kind === "invoice" ? "invoice" : "text";
    const text = (body?.text ?? "").trim();

    if (kind === "text") {
      if (!text) {
        return NextResponse.json({ ok: false, error: "Message text is empty" }, { status: 400 });
      }
      const result = await dispatchWhatsApp({ to, messageText: text, source: "admin" });
      return NextResponse.json({ ok: result.ok, result });
    }

    /* ── Attach Invoice ──
       Phones are stored raw (e.g. "+234 812 345 6789"), so matching is
       done in JS against normalised MSISDN digits — SQL LIKE would miss
       spaced/formatted numbers. */
    const unpaid = await db.invoice.findMany({
      where: { status: { in: ["sent", "pending", "overdue"] } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const candidates = unpaid.filter(
      (inv) => normalizePhone(inv.customerPhone) === to
    );
    const invoice =
      (body?.invoiceId ? candidates.find((c) => c.id === body.invoiceId) : undefined) ??
      candidates[0];

    if (!invoice) {
      return NextResponse.json(
        { ok: false, error: "No pending invoice found for this customer" },
        { status: 404 }
      );
    }

    const pdf = await regenerateInvoicePdf(invoice);
    const amountNaira = Math.round(invoice.amountKobo / 100);
    const firstName = invoice.customerName.split(" ")[0];
    const due = invoice.dueDate
      ? ` due ${invoice.dueDate.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}`
      : "";
    const caption =
      text ||
      `Hi ${firstName}, here is invoice ${invoice.invoiceNumber} (\u20A6${amountNaira.toLocaleString(
        "en-NG"
      )})${due} from Okomba Analytics.${
        invoice.dvaAccountNumber ? ` Pay to ${invoice.dvaAccountNumber}.` : ""
      }`;

    const result = await dispatchWhatsApp({
      to,
      caption,
      pdfBase64: pdf.toString("base64"),
      filename: `Okomba_Proposal_${invoice.invoiceNumber}.pdf`,
      invoiceId: invoice.id,
      source: "admin",
    });

    return NextResponse.json({ ok: result.ok, result, invoiceNumber: invoice.invoiceNumber });
  } catch (err) {
    console.error("[POST /api/admin/whatsapp/send]", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Send failed" },
      { status: 500 }
    );
  }
}
