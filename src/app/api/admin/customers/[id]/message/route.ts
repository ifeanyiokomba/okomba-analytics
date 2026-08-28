import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { dispatchWhatsApp } from "@/lib/whatsapp";
import { brandedEmailHtml } from "@/lib/email-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/admin/customers/[id]/message                              */
/*   Send a personalized email or WhatsApp message to a customer.      */
/*   The body is rendered through the branded Okomba email template     */
/*   (email-channel) and dispatched through the same Apps Script        */
/*   webhook path used by the proposal/broadcast flows. WhatsApp        */
/*   messages go through dispatchWhatsApp (mini-service). Both are      */
/*   logged in CustomerMessage + EmailLog/WhatsAppMessage so they        */
/*   appear in the customer timeline immediately.                       */
/* ------------------------------------------------------------------ */

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = (await req.json()) as {
      channel: "email" | "whatsapp";
      subject?: string;
      body: string;
    };

    if (!body.body || body.body.trim().length < 2) {
      return NextResponse.json({ ok: false, error: "Message body is empty" }, { status: 400 });
    }
    if (body.channel === "email" && !body.subject?.trim()) {
      return NextResponse.json({ ok: false, error: "Email subject is required" }, { status: 400 });
    }

    const c = await db.customer.findUnique({ where: { id } });
    if (!c) {
      return NextResponse.json({ ok: false, error: "Customer not found" }, { status: 404 });
    }

    const SITE_URL =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://okomba.com";

    if (body.channel === "email") {
      if (!c.email) {
        return NextResponse.json({ ok: false, error: "Customer has no email" }, { status: 400 });
      }
      const subject = body.subject!.trim();
      const textBody = body.body.trim();

      const html = brandedEmailHtml({
        title: subject,
        preheader: textBody.split("\n").find((l) => l.trim().length > 20) ?? subject,
        blocks: [
          { kind: "text", text: `Dear ${c.name},\n${textBody}` },
          {
            kind: "kv",
            rows: [
              ["From", "Okomba Analytics"],
              ["Reply to", "support@okomba.com"],
            ],
          },
        ],
        ctaText: "Visit Okomba Analytics",
        ctaUrl: SITE_URL,
        footerNote:
          "You're receiving this message from the Okomba Analytics team. Reply directly to this email and we'll respond within 24 hours.",
      });

      // 1. Persist to EmailLog (audit + the customer timeline reads it)
      let emailLogId: string | null = null;
      try {
        const log = await db.emailLog.create({
          data: {
            type: "crm.message",
            recipientEmail: c.email,
            subject,
            status: "sent",
            bodyText: textBody,
            bodyHtml: html,
            attachments: "[]",
          },
        });
        emailLogId = log.id;
      } catch (err) {
        console.error("[crm:message] email log persist failed:", err);
      }

      // 2. Forward to Apps Script (real delivery path) if configured
      const webhookUrl = process.env.NOTIFY_WEBHOOK_URL;
      let delivered = !webhookUrl; // if no webhook, "delivered" via log only
      if (webhookUrl) {
        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "sendEmail",
              type: "crm.message",
              recipient: c.email,
              subject,
              body: textBody,
              html,
              attachments: [],
            }),
            signal: AbortSignal.timeout(15000),
          });
          delivered = res.ok;
        } catch (err) {
          console.error("[crm:message] webhook delivery failed:", err);
        }
      } else {
        // Dev mode — log so the founder can see what was sent
        console.info(
          `[crm:message] email-stub → ${c.email}\nsubject: ${subject}\n────────\n${textBody}\n────────`
        );
      }

      // 3. CustomerMessage audit row (CRM trail)
      const msg = await db.customerMessage.create({
        data: {
          customerId: c.id,
          toEmail: c.email,
          toPhone: c.whatsapp ?? c.phone ?? null,
          channel: "email",
          subject,
          body: textBody,
          status: delivered ? "sent" : "queued",
        },
      });

      // 4. Refresh the customer's lastContactAt for the list view
      await db.customer.update({
        where: { id: c.id },
        data: { lastContactAt: new Date() },
      });

      return NextResponse.json({
        ok: true,
        messageId: msg.id,
        emailLogId,
        channel: "email",
        status: msg.status,
        note: webhookUrl
          ? undefined
          : "Email logged locally — set NOTIFY_WEBHOOK_URL on Render for branded Gmail delivery.",
      });
    }

    // WhatsApp channel
    if (body.channel === "whatsapp") {
      const to = c.whatsapp ?? c.phone ?? "";
      if (!to) {
        return NextResponse.json(
          { ok: false, error: "Customer has no WhatsApp/phone number" },
          { status: 400 }
        );
      }
      const textBody = body.body.trim();
      const dispatch = await dispatchWhatsApp({
        to,
        messageText: textBody,
        invoiceId: null,
        filename: null,
      });

      // Persist a CRM trail row (the WhatsAppMessage row was already
      // created by dispatchWhatsApp).
      const msg = await db.customerMessage.create({
        data: {
          customerId: c.id,
          toEmail: c.email,
          toPhone: to,
          channel: "whatsapp",
          subject: null,
          body: textBody,
          status: dispatch.status,
          error: dispatch.error ?? null,
        },
      });

      await db.customer.update({
        where: { id: c.id },
        data: { lastContactAt: new Date() },
      });

      return NextResponse.json({
        ok: dispatch.ok || dispatch.status === "queued",
        messageId: msg.id,
        channel: "whatsapp",
        status: dispatch.status,
        error: dispatch.error,
        note:
          dispatch.status === "queued"
            ? "WhatsApp service is offline — message queued and will dispatch when the mini-service reconnects."
            : undefined,
      });
    }

    return NextResponse.json({ ok: false, error: "Invalid channel" }, { status: 400 });
  } catch (err) {
    console.error("[POST /api/admin/customers/[id]/message]", err);
    return NextResponse.json({ ok: false, error: "Message send failed" }, { status: 500 });
  }
}
