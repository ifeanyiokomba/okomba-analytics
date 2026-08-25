/**
 * Notification service — integration point for outbound notifications.
 *
 * Currently implements a console-based "email stub" that logs structured
 * notification payloads and records each delivery in the EmailLog table so
 * the admin dashboard can show what was sent, when, and to whom.
 *
 * When a real email provider (Resend, SendGrid, AWS SES, etc.) is wired,
 * swap the body of `deliver()` — no other code needs to change.
 *
 * Set `NOTIFICATIONS_ENABLED=false` to silence entirely.
 */

import { db } from "@/lib/db";
import { brandedEmailHtml, type EmailBlock } from "@/lib/email-template";

/* Attachment contract shared with the Google Apps Script engine.
   `base64` is only transported over the webhook (never stored in the
   EmailLog — only filename + size are persisted). */
export type EmailAttachment = {
  filename: string;
  contentType: string;
  base64: string;
};

export type InquiryNotificationPayload = {
  type: "inquiry.created";
  inquiry: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    whatsapp?: string | null;
    service: string;
    addlService?: string | null;
    message: string;
  };
  receivedAt: string;
};

export type SubscriberNotificationPayload = {
  type: "subscriber.welcome";
  email: string;
  receivedAt: string;
  confirmUrl?: string;
  unsubscribeUrl?: string;
};

export type PostPublishedNotificationPayload = {
  type: "post.published";
  postId: string;
  postTitle: string;
  postSlug: string;
  postExcerpt: string;
  postCategory: string;
  author: string;
  publishedAt: string;
};

export type BroadcastNotificationPayload = {
  type: "broadcast";
  subject: string;
  body: string;
  recipients: { email: string; id: string }[];
};

export type NotificationPayload =
  | InquiryNotificationPayload
  | SubscriberNotificationPayload
  | PostPublishedNotificationPayload
  | BroadcastNotificationPayload;

const enabled = process.env.NOTIFICATIONS_ENABLED !== "false";

const FROM_NAME = "Okomba Analytics";
const FROM_EMAIL = "insights@okomba.com";
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://okomba.com";

/* ── Subject line generators ──────────────────────────────── */
function subjectFor(payload: NotificationPayload): string {
  switch (payload.type) {
    case "inquiry.created":
      return `New inquiry from ${payload.inquiry.name} — ${payload.inquiry.service}`;
    case "subscriber.welcome":
      return "Welcome to Okomba Insights — please confirm your subscription";
    case "post.published":
      return `New from Okomba Insights — ${payload.postTitle}`;
    case "broadcast":
      return payload.subject;
  }
}

/* ── Body composer for each notification type ────────────── */
function composeBody(payload: NotificationPayload): string {
  switch (payload.type) {
    case "inquiry.created":
      return [
        `New inquiry received from ${payload.inquiry.name}.`,
        ``,
        `Service:  ${payload.inquiry.service}`,
        payload.inquiry.addlService ? `Additional: ${payload.inquiry.addlService}` : "",
        `Email:    ${payload.inquiry.email}`,
        payload.inquiry.phone ? `Phone:    ${payload.inquiry.phone}` : "",
        payload.inquiry.whatsapp ? `WhatsApp: ${payload.inquiry.whatsapp}` : "",
        ``,
        `Message:`,
        payload.inquiry.message,
        ``,
        `Received: ${payload.receivedAt}`,
      ].filter(Boolean).join("\n");
    case "subscriber.welcome":
      return [
        `Thanks for subscribing to Okomba Insights.`,
        ``,
        `Please confirm your subscription to start receiving our latest posts,`,
        `product updates and field notes from our digital operations work.`,
        ``,
        payload.confirmUrl
          ? `Confirm your subscription:\n${payload.confirmUrl}`
          : `Use the confirmation link sent to this address.`,
        ``,
        `You will only receive emails you asked for — one-tap unsubscribe is`,
        `included at the bottom of every message.`,
        ``,
        `— Okomba Analytics`,
      ].join("\n");
    case "post.published":
      return [
        `A new article was just published on Okomba Insights.`,
        ``,
        `Title:    ${payload.postTitle}`,
        `Category: ${payload.postCategory}`,
        `Author:   ${payload.author}`,
        ``,
        payload.postExcerpt,
        ``,
        `Read the full article: ${BASE_URL}/#insights`,
      ].join("\n");
    case "broadcast":
      return payload.body;
  }
}

/* ── HTML body composer (branded template) ────────────── */
function composeBlocks(payload: NotificationPayload): EmailBlock[] {
  switch (payload.type) {
    case "inquiry.created":
      return [
        { kind: "text", text: `New inquiry received from ${payload.inquiry.name}.` },
        {
          kind: "kv",
          rows: [
            ["Service", payload.inquiry.service],
            ...(payload.inquiry.addlService
              ? ([["Additional", payload.inquiry.addlService]] as [string, string][])
              : []),
            ["Email", payload.inquiry.email],
            ...(payload.inquiry.phone
              ? ([["Phone", payload.inquiry.phone]] as [string, string][])
              : []),
            ...(payload.inquiry.whatsapp
              ? ([["WhatsApp", payload.inquiry.whatsapp]] as [string, string][])
              : []),
          ],
        },
        { kind: "text", text: payload.inquiry.message },
      ];
    case "subscriber.welcome":
      return [
        { kind: "text", text: "Thanks for subscribing to Okomba Insights." },
        {
          kind: "text",
          text: "Please confirm your subscription to start receiving our latest posts, product updates and field notes from our digital operations work.",
        },
        ...(payload.confirmUrl
          ? ([
              { kind: "text", text: `Confirm your subscription:\n${payload.confirmUrl}` },
            ] as EmailBlock[])
          : []),
      ];
    case "post.published":
      return [
        { kind: "text", text: "A new article was just published on Okomba Insights." },
        {
          kind: "kv",
          rows: [
            ["Title", payload.postTitle],
            ["Category", payload.postCategory],
            ["Author", payload.author],
          ],
        },
        { kind: "text", text: payload.postExcerpt },
      ];
    case "broadcast":
      return [{ kind: "text", text: payload.body }];
  }
}

/* ── Internal: send a single message + record the log ───── */
async function deliverOne(
  payload: NotificationPayload,
  recipient: { email: string; id?: string },
  opts?: { attachments?: EmailAttachment[]; invoiceId?: string }
): Promise<void> {
  if (!enabled) return;

  const subject = subjectFor(payload);
  const body = composeBody(payload);
  const html = brandedEmailHtml({
    title: subject,
    preheader: body.split("\n").find((l) => l.trim().length > 20) ?? subject,
    blocks: composeBlocks(payload),
    ...(payload.type === "post.published"
      ? { ctaText: "Read the article", ctaUrl: `${BASE_URL}/#insights` }
      : {}),
    ...(payload.type === "subscriber.welcome" && payload.confirmUrl
      ? { ctaText: "Confirm subscription", ctaUrl: payload.confirmUrl }
      : {}),
    footerNote:
      payload.type === "subscriber.welcome"
        ? "You're receiving this because you subscribed at okomba.com. Not you? Ignore this email."
        : undefined,
  });
  const channel = payload.type;
  const attachments = opts?.attachments ?? [];

  // ── EMAIL STUB (console) ────────────────────
  // The Google Apps Script webhook (NOTIFY_WEBHOOK_URL) is the real
  // delivery path — this stub keeps a server-side trace in dev.
  console.info(
    `[notify:email-stub] → ${channel}\n` +
      `to: ${recipient.email}\n` +
      `from: ${FROM_NAME} <${FROM_EMAIL}>\n` +
      `subject: ${subject}\n` +
      `html: ${html.length} bytes${
        attachments.length
          ? `, attachments: ${attachments.map((a) => a.filename).join(", ")}`
          : ""
      }\n` +
      `────────────────────────────\n` +
      `${body}\n` +
      `────────────────────────────\n`
  );

  // ── Record in EmailLog (sent_emails audit) ──────────
  try {
    await db.emailLog.create({
      data: {
        type: channel,
        recipientEmail: recipient.email,
        subject,
        status: "sent",
        postId:
          payload.type === "post.published" ? payload.postId : null,
        subscriberId: recipient.id ?? null,
        bodyText: body,
        bodyHtml: html,
        attachments: JSON.stringify(
          attachments.map((a) => ({ filename: a.filename, size: a.base64.length }))
        ),
        invoiceId: opts?.invoiceId ?? null,
      },
    });
  } catch (err) {
    console.error("[notify:email-log] persist failed:", err);
  }

  // ── Google Apps Script forward (real delivery) ───────
  const webhookUrl = process.env.NOTIFY_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendEmail",
          ...payload,
          recipient: recipient.email,
          subject,
          body,
          html,
          attachments,
        }),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      console.error("[notify:webhook] delivery failed:", err);
    }
  }
}

/* ── Public: per-event helpers ────────────────────────────── */
export async function notifyNewInquiry(
  inquiry: InquiryNotificationPayload["inquiry"]
): Promise<void> {
  try {
    await deliverOne(
      { type: "inquiry.created", inquiry, receivedAt: new Date().toISOString() },
      { email: FROM_EMAIL }
    );
    // Also notify the submitter with a receipt confirmation
    await deliverOne(
      {
        type: "inquiry.created",
        inquiry,
        receivedAt: new Date().toISOString(),
      },
      { email: inquiry.email }
    );
  } catch (err) {
    console.error("[notify] inquiry notification failed:", err);
  }
}

export async function notifyNewSubscriber(
  email: string,
  links?: { confirmUrl?: string; unsubscribeUrl?: string }
): Promise<void> {
  try {
    await deliverOne(
      {
        type: "subscriber.welcome",
        email,
        receivedAt: new Date().toISOString(),
        ...links,
      },
      { email }
    );
  } catch (err) {
    console.error("[notify] subscriber notification failed:", err);
  }
}

/**
 * Notify all confirmed subscribers about a newly published post.
 * Returns the count of recipients actually queued.
 *
 * @param post The post that was just published
 * @returns number of confirmed subscribers notified
 */
export async function notifyPostPublished(post: {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
}): Promise<number> {
  if (!enabled) return 0;

  try {
    const subscribers = await db.subscriber.findMany({
      where: { status: "confirmed" },
      select: { id: true, email: true },
    });

    if (subscribers.length === 0) {
      console.info("[notify:post.published] no confirmed subscribers — skipping");
      return 0;
    }

    const payload: PostPublishedNotificationPayload = {
      type: "post.published",
      postId: post.id,
      postTitle: post.title,
      postSlug: post.slug,
      postExcerpt: post.excerpt,
      postCategory: post.category,
      author: post.author,
      publishedAt: post.publishedAt,
    };

    // Send sequentially (lightweight stub) — fine for moderate lists.
    // For large lists, queue each send through a background worker.
    for (const sub of subscribers) {
      try {
        await deliverOne(payload, { email: sub.email, id: sub.id });
      } catch (err) {
        console.error(
          `[notify:post.published] failed for ${sub.email}:`,
          err
        );
      }
    }

    // Mark the post as having had its notification blast sent
    await db.post.update({
      where: { id: post.id },
      data: { notifySentAt: new Date() },
    });

    return subscribers.length;
  } catch (err) {
    console.error("[notify] post notification failed:", err);
    return 0;
  }
}

/**
 * Send a free-form broadcast to all confirmed subscribers.
 * Used by the admin "Compose Broadcast" feature.
 */
export async function notifyBroadcast(
  subject: string,
  body: string,
  recipients: { email: string; id: string }[]
): Promise<number> {
  if (!enabled) return 0;
  if (recipients.length === 0) return 0;

  const payload: BroadcastNotificationPayload = {
    type: "broadcast",
    subject,
    body,
    recipients,
  };

  let sent = 0;
  for (const r of recipients) {
    try {
      await deliverOne(payload, { email: r.email, id: r.id });
      sent += 1;
    } catch (err) {
      console.error(`[notify:broadcast] failed for ${r.email}:`, err);
    }
  }
  return sent;
}

/* ─────────────────────────────────────────────────────────────
   Invoice email (Phase-1 Module 3 plumbing; the admin Proposal
   UI that calls this lands in Phase 2). Sends a branded HTML
   email with the PDF ATTACHED (never a link) via the Google
   Apps Script engine.
   ───────────────────────────────────────────────────────────── */
export type InvoiceEmailPayload = {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  service: string;
  description?: string | null;
  amountNaira: number; // display naira; kobo math stays integer elsewhere
  currency?: string;
  durationLabel?: string | null;
  dueDate?: string | null;
  dvaAccountNumber?: string | null;
  dvaBankName?: string | null;
  pdfBase64: string; // raw PDF bytes, base64-encoded
  pdfFilename: string; // Okomba_Invoice_{invoiceNumber}.pdf
};

export async function sendInvoiceEmail(
  inv: InvoiceEmailPayload
): Promise<{ ok: boolean; error?: string }> {
  if (!enabled) return { ok: false, error: "notifications disabled" };

  const fmtNaira = (n: number) =>
    `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
  const due = inv.dueDate
    ? new Date(inv.dueDate).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const subject = `Invoice ${inv.invoiceNumber} from Okomba Analytics — ${fmtNaira(
    inv.amountNaira
  )}`;

  const body = [
    `Dear ${inv.customerName},`,
    ``,
    `Thank you for choosing Okomba Analytics. Your invoice is attached as a PDF.`,
    ``,
    `Invoice:  ${inv.invoiceNumber}`,
    `Service:  ${inv.service}`,
    `Amount:   ${fmtNaira(inv.amountNaira)}`,
    ...(inv.durationLabel ? [`Duration: ${inv.durationLabel}`] : []),
    ...(due ? [`Due date: ${due}`] : []),
    ...(inv.dvaAccountNumber
      ? [
          ``,
          `Payment account (Paystack Dedicated Virtual Account):`,
          `  Bank:    ${inv.dvaBankName ?? ""}`,
          `  Account: ${inv.dvaAccountNumber}`,
          `  Name:    OKOMBA ANALYTICS`,
        ]
      : []),
    ``,
    `The PDF attached to this email is your official invoice.`,
  ].join("\n");

  const html = brandedEmailHtml({
    title: `Invoice ${inv.invoiceNumber}`,
    preheader: `${inv.service} — ${fmtNaira(inv.amountNaira)}${due ? ` · due ${due}` : ""}`,
    blocks: [
      { kind: "text", text: `Dear ${inv.customerName},\nThank you for choosing Okomba Analytics. Your invoice is attached to this email as a PDF.` },
      {
        kind: "kv",
        rows: [
          ["Invoice", inv.invoiceNumber],
          ["Service", inv.service],
          ["Amount", fmtNaira(inv.amountNaira)],
          ...(inv.durationLabel
            ? ([["Duration", inv.durationLabel]] as [string, string][])
            : []),
          ...(due ? ([["Due date", due]] as [string, string][]) : []),
        ],
      },
      ...(inv.dvaAccountNumber
        ? ([
            {
              kind: "text",
              text: `Payment account (Paystack Dedicated Virtual Account):\nBank: ${inv.dvaBankName ?? ""}\nAccount: ${inv.dvaAccountNumber}\nAccount name: OKOMBA ANALYTICS`,
            },
          ] as EmailBlock[])
        : []),
      ...(inv.description ? ([{ kind: "text", text: inv.description }] as EmailBlock[]) : []),
      { kind: "text", text: "The PDF attached to this email is your official invoice." },
    ],
    footerNote: "Questions about this invoice? Reply to this email or reach us on WhatsApp.",
  });

  const attachment: EmailAttachment = {
    filename: inv.pdfFilename,
    contentType: "application/pdf",
    base64: inv.pdfBase64,
  };

  // Audit row (sent_emails contract)
  try {
    await db.emailLog.create({
      data: {
        type: "invoice.sent",
        recipientEmail: inv.customerEmail,
        subject,
        status: "sent",
        bodyText: body,
        bodyHtml: html,
        attachments: JSON.stringify([
          { filename: inv.pdfFilename, size: inv.pdfBase64.length },
        ]),
        invoiceId: inv.invoiceId,
      },
    });
  } catch (err) {
    console.error("[notify:invoice] log persist failed:", err);
  }

  // Real delivery via Google Apps Script — action: sendInvoiceEmail
  // attaches the base64 PDF via MailApp (no links, per spec).
  const webhookUrl = process.env.NOTIFY_WEBHOOK_URL;
  if (!webhookUrl) {
    console.info(
      `[notify:invoice] stub — ${inv.invoiceNumber} to ${inv.customerEmail} (${inv.pdfFilename}, ${inv.pdfBase64.length} b64 chars)`
    );
    return { ok: true };
  }
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendInvoiceEmail",
        to: inv.customerEmail,
        subject,
        body,
        html,
        base64Pdf: inv.pdfBase64,
        filename: inv.pdfFilename,
        invoiceSummary: {
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
          service: inv.service,
          amount: fmtNaira(inv.amountNaira),
          dueDate: due,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`webhook responded ${res.status}`);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "webhook delivery failed";
    console.error("[notify:invoice] delivery failed:", msg);
    try {
      await db.emailLog.updateMany({
        where: { invoiceId: inv.invoiceId, type: "invoice.sent", status: "sent" },
        data: { status: "failed", error: msg },
      });
    } catch {}
    return { ok: false, error: msg };
  }
}
