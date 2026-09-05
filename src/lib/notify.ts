/**
 * Notification service — integration point for outbound notifications.
 *
 * Phase 29: this module is now backed by the multi-provider failover
 * chain (apps_script → resend → mailtrap → maileroo) implemented in
 * `src/lib/email-failover.ts`. Every public helper here composes a
 * branded HTML + plain-text body and hands it to `deliverWithFailover`,
 * which tries each enabled provider in priority order until one returns
 * HTTP 2xx. The provider that actually delivered the email is
 * persisted on the EmailLog row (new `provider` column, Phase 29).
 *
 * BACKWARD-COMPAT: if no EmailProviderConfig rows exist, the failover
 * chain transparently falls back to the legacy `NOTIFY_WEBHOOK_URL`
 * env var (Google Apps Script). This keeps the existing deployed env
 * working without forcing a reconfiguration before the next deploy.
 *
 * Set `NOTIFICATIONS_ENABLED=false` to silence entirely.
 */

import { db } from "@/lib/db";
import { brandedEmailHtml, type EmailBlock } from "@/lib/email-template";
import { deliverWithFailover } from "@/lib/email-failover";

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

/* ── Shared formatters (extracted for testability, B1-C) ──
   These were previously inlined inside sendReminderEmail,
   sendProposalEmail, sendPaymentThankYouEmail, and
   notifyPaymentProofUploaded. They are now module-level so the
   exported `compose*Body` / `*Subject` helpers (used by
   tests/email-plaintext.test.ts) share the EXACT same formatting
   logic as the production code paths. Behaviour is unchanged. */
const fmtNaira = (n: number): string =>
  `\u20A6${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

/** Format an ISO due date as "14 February 2026" (or null when missing). */
function proposalDueLabel(inv: {
  dueDate?: string | null;
}): string | null {
  return inv.dueDate
    ? new Date(inv.dueDate).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
}

/* ── Subject line generators ──────────────────────────────── */
export function subjectFor(payload: NotificationPayload): string {
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
export function composeBody(payload: NotificationPayload): string {
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
/**
 * Compose the `EmailBlock[]` for the four generic notification types
 * (inquiry.created / subscriber.welcome / post.published / broadcast).
 *
 * Exported in B3 so `tests/email-render.test.ts` can build the EXACT
 * HTML the production `deliverOne()` builds — verifying the rendered
 * output rather than a re-implementation. The production path is
 * unchanged: `deliverOne` still calls this same function.
 */
export function composeBlocks(payload: NotificationPayload): EmailBlock[] {
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
  // Phase 29: also persist the provider that actually delivered.
  let logId: string | null = null;
  try {
    const created = await db.emailLog.create({
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
        attachments: attachments.map((a) => ({ filename: a.filename, size: a.base64.length })),
        invoiceId: opts?.invoiceId ?? null,
      },
      select: { id: true },
    });
    logId = created.id;
  } catch (err) {
    console.error("[notify:email-log] persist failed:", err);
  }

  // ── Real delivery via the failover chain (apps_script →
  //    resend → mailtrap → maileroo). Falls back to the legacy
  //    NOTIFY_WEBHOOK_URL env var when no providers are
  //    configured, so the existing deployed env keeps working. ──
  try {
    const result = await deliverWithFailover({
      to: recipient.email,
      subject,
      bodyHtml: html,
      bodyText: body,
      attachments,
      type: channel,
      legacyAction: "sendEmail",
      // B5-FIX Bug 2: forward the full inquiry object when the
      // type is inquiry.created so Code.gs's handleInquiryNotification
      // can compose the admin alert + submitter confirmation bodies
      // (reading inq.name, inq.email, inq.phone, inq.whatsapp,
      // inq.service, inq.addlService, inq.message). Before this fix,
      // the inquiry was dropped at the FailoverOptions boundary →
      // handleInquiryNotification received `inq = {}` → admin got
      // an empty-body email + blank sheet row + submitter copy
      // NEVER sent.
      inquiry:
        payload.type === "inquiry.created" ? payload.inquiry : undefined,
    });
    if (!result.ok) {
      console.error(
        `[notify:failover] all providers failed for ${recipient.email}:`,
        result.error
      );
    }
    // Persist which provider actually delivered (or "all_failed" /
    // "legacy_apps_script" / "stub"). The EmailLog row already exists
    // from the audit-write above; we just augment it with the provider.
    if (logId) {
      try {
        await db.emailLog.updateMany({
          where: { id: logId },
          data: {
            provider: result.provider,
            ...(result.ok ? {} : { status: "failed", error: result.error ?? "delivery failed" }),
          },
        });
      } catch (err) {
        console.error("[notify:failover] provider persist failed:", err);
      }
    }
  } catch (err) {
    console.error("[notify:failover] delivery threw:", err);
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
 * Notify confirmed subscribers about a newly published post.
 * Returns the count of recipients actually queued.
 *
 * BATCH 5 (§28): `opts.segment` selects the recipient segment —
 * "all" (every confirmed subscriber) or "recent90" (confirmed in
 * the last 90 days — the "new subscribers" segment). The notify
 * decision itself is carried by the caller (post.notifyPlanned).
 *
 * @param post The post that was just published
 * @param opts.segment Recipient segment (default "all")
 * @returns number of confirmed subscribers notified
 */
export async function notifyPostPublished(
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    author: string;
    publishedAt: string;
  },
  opts?: { segment?: "all" | "recent90" }
): Promise<number> {
  if (!enabled) return 0;

  try {
    const segment = opts?.segment ?? "all";
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const subscribers = await db.subscriber.findMany({
      where: {
        status: "confirmed",
        ...(segment === "recent90" ? { confirmedAt: { gte: ninetyDaysAgo } } : {}),
      },
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

/* ─────────────────────────────────────────────────────────────
   BATCH 5 (§23): new-comment admin notification. Fire-and-forget
   from the public comment route; uses the operational-alert
   pipeline (branded email + EmailLog audit + failover delivery).
   Keyed per-comment so every submitted comment notifies exactly
   once — comment rate limiting bounds the volume.
   ───────────────────────────────────────────────────────────── */
export async function notifyNewComment(c: {
  id: string;
  postTitle: string;
  postSlug: string;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: string; // pending | spam (both deserve an admin look)
}): Promise<void> {
  try {
    const preview = c.body.length > 400 ? `${c.body.slice(0, 400)}…` : c.body;
    await sendAdminAlertEmail({
      key: `comment.new.${c.id}`,
      subject: `New comment awaiting moderation — ${c.postTitle}`,
      bodyText: [
        `${c.authorName} commented on "${c.postTitle}".`,
        "",
        `Status: ${c.status}`,
        c.authorEmail ? `Author email: ${c.authorEmail}` : "No email provided",
        "",
        preview,
      ].join("\n"),
      blocks: [
        { kind: "text", text: `${c.authorName} commented on "${c.postTitle}" (status: ${c.status}).` },
        { kind: "text", text: preview },
      ],
      ctaText: "Moderate in admin",
      ctaUrl: `${BASE_URL}/#admin`,
    });
  } catch (err) {
    console.error("[notify] new-comment alert failed:", err);
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
   Payment reminder email (Phase-2 Module 5). Re-attaches the
   proposal+invoice PDF. Subject format is fixed by spec:
   "Reminder: Invoice #INV-xxxx Due {date}"
   ───────────────────────────────────────────────────────────── */
export type ReminderEmailPayload = {
  invoiceId: string;
  invoiceNumber: string;
  kind: "friendly" | "due" | "overdue";
  customerName: string;
  customerEmail: string;
  service: string;
  amountNaira: number;
  dueLabel: string; // "14 February 2026"
  dueDate?: string | null;
  dvaAccountNumber?: string | null;
  dvaBankName?: string | null;
  dvaAccountName?: string | null;
  bodyText: string; // AI-refined body prose
  pdfBase64: string;
  pdfFilename: string;
  portalUrl?: string | null; // Module 8A — /portal/{secureToken} link
};

const REMINDER_TYPE: Record<ReminderEmailPayload["kind"], string> = {
  friendly: "invoice.reminder_3d",
  due: "invoice.reminder_due",
  overdue: "invoice.reminder_overdue",
};

/* ── Plain-text body + subject composers (exported for tests, B1-C) ──
   These are extracted verbatim from the inline body/subject construction
   that used to live inside sendReminderEmail. They are the EXACT strings
   the production email path sends — sendReminderEmail now calls these
   helpers instead of constructing the body inline, so
   tests/email-plaintext.test.ts verifies the real production output. */
export function reminderSubject(rem: ReminderEmailPayload): string {
  return `Reminder: Invoice #${rem.invoiceNumber} Due ${rem.dueLabel}`;
}

export function composeReminderBody(rem: ReminderEmailPayload): string {
  return [
    rem.bodyText,
    ``,
    `Invoice:  ${rem.invoiceNumber}`,
    `Amount:   ${fmtNaira(rem.amountNaira)}`,
    `Due date: ${rem.dueLabel}`,
    ...(rem.dvaAccountNumber
      ? [
          ``,
          `Pay by bank transfer to:`,
          `  Bank:    ${rem.dvaBankName ?? ""}`,
          `  Account: ${rem.dvaAccountNumber}`,
          `  Name:    ${rem.dvaAccountName ?? "Okomba Analytics"}`,
        ]
      : []),
    ``,
    ...(rem.portalUrl ? [`View your proposal: ${rem.portalUrl}`, ``] : []),
    `The PDF attached to this email contains the full proposal, invoice and`,
    `payment details for your records.`,
  ].join("\n");
}

export async function sendReminderEmail(
  rem: ReminderEmailPayload
): Promise<{ ok: boolean; error?: string }> {
  if (!enabled) return { ok: false, error: "notifications disabled" };

  const subject = reminderSubject(rem);
  const body = composeReminderBody(rem);

  const html = brandedEmailHtml({
    title: `Reminder — ${rem.invoiceNumber}`,
    preheader: `${fmtNaira(rem.amountNaira)} · due ${rem.dueLabel}`,
    blocks: [
      { kind: "text", text: rem.bodyText },
      {
        kind: "kv",
        rows: [
          ["Invoice", rem.invoiceNumber],
          ["Amount", fmtNaira(rem.amountNaira)],
          ["Due date", rem.dueLabel],
        ],
      },
      ...(rem.dvaAccountNumber
        ? ([
            {
              kind: "text",
              text: `Pay by bank transfer:\nBank: ${rem.dvaBankName ?? ""}\nAccount: ${rem.dvaAccountNumber}\nAccount name: ${rem.dvaAccountName ?? "Okomba Analytics"}`,
            },
          ] as EmailBlock[])
        : []),
      { kind: "text", text: "The PDF attached to this email contains the full proposal, invoice and payment details." },
    ],
    ...(rem.portalUrl ? { ctaText: "View & pay in your portal", ctaUrl: rem.portalUrl } : {}),
    footerNote: "Already paid? Reply to this email and we will confirm right away.",
  });

  // Audit row (sent_emails contract). Phase 29: also persist the
  // provider that actually delivered (set after the failover call
  // returns, so we know which provider succeeded).
  let logId: string | null = null;
  try {
    const created = await db.emailLog.create({
      data: {
        type: REMINDER_TYPE[rem.kind],
        recipientEmail: rem.customerEmail,
        subject,
        status: "sent",
        bodyText: body,
        bodyHtml: html,
        attachments: [{ filename: rem.pdfFilename, size: rem.pdfBase64.length }],
        invoiceId: rem.invoiceId,
      },
      select: { id: true },
    });
    logId = created.id;
  } catch (err) {
    console.error("[notify:reminder] log persist failed:", err);
  }

  // Real delivery via the failover chain (apps_script → resend →
  // mailtrap → maileroo). Falls back to NOTIFY_WEBHOOK_URL when no
  // providers are configured (the legacy Apps Script path expects
  // action="sendInvoiceEmail" + base64Pdf, so we pass that hint).
  try {
    const result = await deliverWithFailover({
      to: rem.customerEmail,
      subject,
      bodyHtml: html,
      bodyText: body,
      attachments: [
        { filename: rem.pdfFilename, contentType: "application/pdf", base64: rem.pdfBase64 },
      ],
      type: REMINDER_TYPE[rem.kind],
      legacyAction: "sendInvoiceEmail",
      invoiceSummary: {
        invoiceNumber: rem.invoiceNumber,
        customerName: rem.customerName,
        service: rem.service,
        amount: fmtNaira(rem.amountNaira),
        dueDate: rem.dueLabel,
      },
    });
    if (logId) {
      try {
        await db.emailLog.updateMany({
          where: { id: logId },
          data: {
            provider: result.provider,
            ...(result.ok ? {} : { status: "failed", error: result.error ?? "delivery failed" }),
          },
        });
      } catch {}
    }
    if (!result.ok) {
      console.error("[notify:reminder] delivery failed:", result.error);
      return { ok: false, error: result.error };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "delivery failed";
    console.error("[notify:reminder] delivery threw:", msg);
    if (logId) {
      try {
        await db.emailLog.updateMany({
          where: { id: logId },
          data: { status: "failed", error: msg },
        });
      } catch {}
    }
    return { ok: false, error: msg };
  }
}

/* ─────────────────────────────────────────────────────────────
   Proposal + invoice email (Phase-2 Module 4). Sends a branded
   HTML email with the PDF ATTACHED (never a link) via the Google
   Apps Script engine.
   Subject format is fixed by spec:
   "Your Proposal from Okomba Analytics - Invoice #INV-xxx"
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
  dvaAccountName?: string | null;
  pdfBase64: string; // raw PDF bytes, base64-encoded
  pdfFilename: string; // Okomba_Proposal_{invoiceNumber}.pdf
  portalUrl?: string | null; // Module 8A — /portal/{secureToken} link
};

/* ── Plain-text body + subject composers (exported for tests, B1-C) ──
   Extracted verbatim from sendProposalEmail. Tests verify the real
   production output by calling these same helpers. */
export function proposalSubject(inv: InvoiceEmailPayload): string {
  return `Your Proposal from Okomba Analytics - Invoice #${inv.invoiceNumber}`;
}

export function composeProposalBody(inv: InvoiceEmailPayload): string {
  const due = proposalDueLabel(inv);
  return [
    `Dear ${inv.customerName},`,
    ``,
    `Thank you for choosing Okomba Analytics. Your proposal and invoice`,
    `are attached to this email as a single PDF document.`,
    ``,
    ...(inv.portalUrl ? [`View your proposal: ${inv.portalUrl}`, ``] : []),
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
          `  Name:    ${inv.dvaAccountName ?? "Okomba Analytics"}`,
        ]
      : []),
    ``,
    `The PDF attached to this email is your official proposal and invoice.`,
  ].join("\n");
}

export async function sendProposalEmail(
  inv: InvoiceEmailPayload
): Promise<{ ok: boolean; error?: string }> {
  if (!enabled) return { ok: false, error: "notifications disabled" };

  const due = proposalDueLabel(inv);
  const subject = proposalSubject(inv);
  const body = composeProposalBody(inv);

  const html = brandedEmailHtml({
    title: `Your Proposal — ${inv.invoiceNumber}`,
    preheader: `${inv.service} — ${fmtNaira(inv.amountNaira)}${due ? ` · due ${due}` : ""}`,
    blocks: [
      {
        kind: "text",
        text: `Dear ${inv.customerName},\nThank you for choosing Okomba Analytics. Your proposal and invoice are attached to this email as a single PDF document.`,
      },
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
              text: `Payment account (Paystack Dedicated Virtual Account):\nBank: ${inv.dvaBankName ?? ""}\nAccount: ${inv.dvaAccountNumber}\nAccount name: ${inv.dvaAccountName ?? "Okomba Analytics"}`,
            },
          ] as EmailBlock[])
        : []),
      ...(inv.description ? ([{ kind: "text", text: inv.description }] as EmailBlock[]) : []),
      { kind: "text", text: "The PDF attached to this email is your official proposal and invoice." },
    ],
    ...(inv.portalUrl
      ? { ctaText: "View your proposal online", ctaUrl: inv.portalUrl }
      : {}),
    footerNote: "Questions about this proposal? Reply to this email or reach us on WhatsApp.",
  });

  const attachment: EmailAttachment = {
    filename: inv.pdfFilename,
    contentType: "application/pdf",
    base64: inv.pdfBase64,
  };

  // Audit row (sent_emails contract). Phase 29: also persist the
  // provider that actually delivered (set after the failover call).
  let logId: string | null = null;
  try {
    const created = await db.emailLog.create({
      data: {
        type: "invoice.sent",
        recipientEmail: inv.customerEmail,
        subject,
        status: "sent",
        bodyText: body,
        bodyHtml: html,
        attachments: [
          { filename: inv.pdfFilename, size: inv.pdfBase64.length },
        ],
        invoiceId: inv.invoiceId,
      },
      select: { id: true },
    });
    logId = created.id;
  } catch (err) {
    console.error("[notify:invoice] log persist failed:", err);
  }

  // Real delivery via the failover chain (apps_script → resend →
  // mailtrap → maileroo). Falls back to NOTIFY_WEBHOOK_URL when no
  // providers are configured.
  try {
    const result = await deliverWithFailover({
      to: inv.customerEmail,
      subject,
      bodyHtml: html,
      bodyText: body,
      attachments: [attachment],
      type: "invoice.sent",
      legacyAction: "sendInvoiceEmail",
      invoiceSummary: {
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        service: inv.service,
        amount: fmtNaira(inv.amountNaira),
        dueDate: due,
      },
    });
    if (logId) {
      try {
        await db.emailLog.updateMany({
          where: { id: logId },
          data: {
            provider: result.provider,
            ...(result.ok ? {} : { status: "failed", error: result.error ?? "delivery failed" }),
          },
        });
      } catch {}
    }
    if (!result.ok) {
      console.error("[notify:invoice] delivery failed:", result.error);
      return { ok: false, error: result.error };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "delivery failed";
    console.error("[notify:invoice] delivery threw:", msg);
    if (logId) {
      try {
        await db.emailLog.updateMany({
          where: { id: logId },
          data: { status: "failed", error: msg },
        });
      } catch {}
    }
    return { ok: false, error: msg };
  }
}

/* ─────────────────────────────────────────────────────────────
   Admin alert email (Phase-2 Module 8) — internal operational
   alerts: Cloudinary failures, backup failures, payment-proof
   uploads. Rate-limited per key so a repeat incident never spams.
   ───────────────────────────────────────────────────────────── */
export type AdminAlertPayload = {
  key: string; // dedupe/rate-limit key, e.g. "cloudinary.unconfigured"
  subject: string;
  bodyText: string;
  blocks?: EmailBlock[];
  ctaText?: string;
  ctaUrl?: string;
};

const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const alertLastSent = new Map<string, number>();

export function adminAlertRecipient(): string {
  return process.env.ADMIN_EMAIL || "support@okomba.com";
}

export async function sendAdminAlertEmail(p: AdminAlertPayload): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!enabled) return { ok: false, skipped: true };

  const last = alertLastSent.get(p.key) ?? 0;
  if (Date.now() - last < ALERT_COOLDOWN_MS) return { ok: true, skipped: true };
  alertLastSent.set(p.key, Date.now());

  const blocks: EmailBlock[] = p.blocks?.length
    ? p.blocks
    : [{ kind: "text", text: p.bodyText }];

  const html = brandedEmailHtml({
    title: p.subject,
    preheader: p.bodyText.split("\n")[0]?.slice(0, 120) ?? p.subject,
    blocks,
    ...(p.ctaText && p.ctaUrl ? { ctaText: p.ctaText, ctaUrl: p.ctaUrl } : {}),
    footerNote: "Automated operational alert from the Okomba Analytics platform.",
  });

  const to = adminAlertRecipient();

  // Audit row. Phase 29: also persist the provider that delivered.
  let logId: string | null = null;
  try {
    const created = await db.emailLog.create({
      data: {
        type: "system.alert",
        recipientEmail: to,
        subject: p.subject,
        status: "sent",
        bodyText: p.bodyText,
        bodyHtml: html,
      },
      select: { id: true },
    });
    logId = created.id;
  } catch (err) {
    console.error("[notify:admin-alert] log persist failed:", err);
  }

  // Real delivery via the failover chain.
  try {
    const result = await deliverWithFailover({
      to,
      subject: p.subject,
      bodyHtml: html,
      bodyText: p.bodyText,
      attachments: [],
      type: "system.alert",
      legacyAction: "sendEmail",
    });
    if (logId) {
      try {
        await db.emailLog.updateMany({
          where: { id: logId },
          data: {
            provider: result.provider,
            ...(result.ok ? {} : { status: "failed", error: result.error ?? "delivery failed" }),
          },
        });
      } catch {}
    }
    if (!result.ok) {
      console.error("[notify:admin-alert] delivery failed:", result.error);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[notify:admin-alert] delivery threw:", err instanceof Error ? err.message : err);
    return { ok: false };
  }
}

/* ─────────────────────────────────────────────────────────────
   Payment proof uploaded alert (Module 8A "I've Paid" button).
   ───────────────────────────────────────────────────────────── */
export type PaymentProofAlertPayload = {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  amountNaira: number;
  fileName: string;
  sizeBytes: number;
  portalUrl: string;
};

/* ── Plain-text body + subject composers (exported for tests, B1-C) ── */
export function paymentProofAlertSubject(a: PaymentProofAlertPayload): string {
  return `Payment proof uploaded — ${a.invoiceNumber} (${a.customerName})`;
}

export function composePaymentProofAlertBody(a: PaymentProofAlertPayload): string {
  return [
    `${a.customerName} just uploaded a payment proof via the client portal.`,
    ``,
    `Invoice:  ${a.invoiceNumber}`,
    `Amount:   ${fmtNaira(a.amountNaira)}`,
    `Email:    ${a.customerEmail}`,
    `Proof:    ${a.fileName} (${Math.max(1, Math.round(a.sizeBytes / 1024))} KB)`,
    ``,
    `Open the Payments tab to verify, then confirm the invoice when the`,
    `bank/Paystack record lands. Portal: ${a.portalUrl}`,
  ].join("\n");
}

export async function notifyPaymentProofUploaded(a: PaymentProofAlertPayload): Promise<void> {
  await sendAdminAlertEmail({
    key: `payment.proof.${a.invoiceNumber}`,
    subject: paymentProofAlertSubject(a),
    bodyText: composePaymentProofAlertBody(a),
    blocks: [
      { kind: "text", text: `${a.customerName} just uploaded a payment proof via the client portal.` },
      {
        kind: "kv",
        rows: [
          ["Invoice", a.invoiceNumber],
          ["Amount", fmtNaira(a.amountNaira)],
          ["Customer email", a.customerEmail],
          ["Proof file", `${a.fileName} (${Math.max(1, Math.round(a.sizeBytes / 1024))} KB)`],
        ],
      },
    ],
    ctaText: "Open admin Payments",
    ctaUrl: `${BASE_URL}/#/admin`,
  });
}

/* ─────────────────────────────────────────────────────────────
   Payment thank-you email (Phase-2 Module 7 — Paystack webhook).
   Sent automatically when charge.success flips an invoice to
   `paid`. The official RECEIPT PDF is attached (never a link).
   ───────────────────────────────────────────────────────────── */
export type PaymentEmailPayload = {
  invoiceId: string;
  invoiceNumber: string;
  receiptNumber: string;
  customerName: string;
  customerEmail: string;
  service: string;
  amountNaira: number;
  paidLabel: string; // "17 February 2026"
  paystackReference?: string | null;
  bodyText: string; // AI-written thank-you prose
  pdfBase64: string;
  pdfFilename: string;
};

/* ── Plain-text body + subject composers (exported for tests, B1-C) ── */
export function paymentThankYouSubject(p: PaymentEmailPayload): string {
  return `Thank You — Payment Received for Invoice #${p.invoiceNumber}`;
}

export function composePaymentThankYouBody(p: PaymentEmailPayload): string {
  return [
    p.bodyText,
    ``,
    `Receipt:      ${p.receiptNumber}`,
    `Invoice:      ${p.invoiceNumber}`,
    `Amount paid:  ${fmtNaira(p.amountNaira)}`,
    `Date paid:    ${p.paidLabel}`,
    ...(p.paystackReference ? [`Reference:    ${p.paystackReference}`] : []),
    ``,
    `The PDF attached to this email is your official receipt. Your`,
    `project kickoff is scheduled within 24 hours.`,
  ].join("\n");
}

export async function sendPaymentThankYouEmail(
  p: PaymentEmailPayload
): Promise<{ ok: boolean; error?: string }> {
  if (!enabled) return { ok: false, error: "notifications disabled" };

  const subject = paymentThankYouSubject(p);
  const body = composePaymentThankYouBody(p);

  const html = brandedEmailHtml({
    title: `Payment Received — ${p.receiptNumber}`,
    preheader: `${fmtNaira(p.amountNaira)} · invoice ${p.invoiceNumber} settled`,
    blocks: [
      { kind: "text", text: p.bodyText },
      {
        kind: "kv",
        rows: [
          ["Receipt", p.receiptNumber],
          ["Invoice", p.invoiceNumber],
          ["Amount paid", fmtNaira(p.amountNaira)],
          ["Date paid", p.paidLabel],
          ...(p.paystackReference
            ? ([["Paystack ref", p.paystackReference]] as [string, string][])
            : []),
        ],
      },
      {
        kind: "text",
        text: "The PDF attached to this email is your official receipt. Your project kickoff is scheduled within 24 hours — a start confirmation is on its way.",
      },
    ],
    footerNote: "Questions about this payment? Reply to this email or reach us on WhatsApp.",
  });

  // Audit row (sent_emails contract). Phase 29: also persist the
  // provider that actually delivered (set after the failover call).
  let logId: string | null = null;
  try {
    const created = await db.emailLog.create({
      data: {
        type: "payment.received",
        recipientEmail: p.customerEmail,
        subject,
        status: "sent",
        bodyText: body,
        bodyHtml: html,
        attachments: [{ filename: p.pdfFilename, size: p.pdfBase64.length }],
        invoiceId: p.invoiceId,
      },
      select: { id: true },
    });
    logId = created.id;
  } catch (err) {
    console.error("[notify:payment] log persist failed:", err);
  }

  // Real delivery via the failover chain (apps_script → resend →
  // mailtrap → maileroo). Falls back to NOTIFY_WEBHOOK_URL when no
  // providers are configured.
  try {
    const result = await deliverWithFailover({
      to: p.customerEmail,
      subject,
      bodyHtml: html,
      bodyText: body,
      attachments: [
        { filename: p.pdfFilename, contentType: "application/pdf", base64: p.pdfBase64 },
      ],
      type: "payment.received",
      legacyAction: "sendInvoiceEmail",
      invoiceSummary: {
        invoiceNumber: p.invoiceNumber,
        customerName: p.customerName,
        service: p.service,
        amount: fmtNaira(p.amountNaira),
        dueDate: `PAID ${p.paidLabel}`,
      },
    });
    if (logId) {
      try {
        await db.emailLog.updateMany({
          where: { id: logId },
          data: {
            provider: result.provider,
            ...(result.ok ? {} : { status: "failed", error: result.error ?? "delivery failed" }),
          },
        });
      } catch {}
    }
    if (!result.ok) {
      console.error("[notify:payment] delivery failed:", result.error);
      return { ok: false, error: result.error };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "delivery failed";
    console.error("[notify:payment] delivery threw:", msg);
    if (logId) {
      try {
        await db.emailLog.updateMany({
          where: { id: logId },
          data: { status: "failed", error: msg },
        });
      } catch {}
    }
    return { ok: false, error: msg };
  }
}

/* ─────────────────────────────────────────────────────────────
   BATCH 6 (§37–42) — Advertisement emails.

   §39 rules:
   • Immediately after a public request, the advertiser receives
     "Your advertising request has been received." and Okomba
     receives "New advertising request." (with a useful summary +
     contact info).
   • Internal adminNotes are NEVER disclosed in advertiser emails.
   • Decision emails carry the pricing/payment instructions on
     approval (§38 workflow) and confirmation on payment.
   ───────────────────────────────────────────────────────────── */

export type AdEmailRow = {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  countryCode: string | null;
  websiteUrl: string | null;
  adType: string;
  placement: string;
  durationDays: number | null;
  budget: string | null;
  description: string;
  amount: { toString(): string } | null;
  currency: string;
  startAt: Date | null;
  endAt: Date | null;
};

const AD_PAYMENT_INSTRUCTIONS = [
  "Payment instructions:",
  "• Bank transfer (NGN) — Okomba Analytics, details below",
  "• International — a payment link will be issued on request",
  "",
  "Bank: Guaranty Trust Bank (GTB)",
  "Account name: Okomba Analytics",
  "Account number: 0123456789",
  "Reference: use your request ID above",
].join("\n");

function adFullName(ad: AdEmailRow): string {
  return `${ad.firstName} ${ad.lastName}`.trim();
}

function money(ad: AdEmailRow): string | null {
  if (ad.amount == null) return null;
  const n = Number(ad.amount.toString());
  if (!Number.isFinite(n)) return null;
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: ad.currency || "NGN",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${ad.currency} ${n.toLocaleString()}`;
  }
}

/* Internal shared sender for advertiser-facing ad emails. */
async function sendAdEmail(
  ad: AdEmailRow,
  subject: string,
  blocks: EmailBlock[],
  bodyText: string,
  type: string
): Promise<{ ok: boolean }> {
  if (!enabled) return { ok: false };

  const html = brandedEmailHtml({
    title: subject,
    preheader: bodyText.split("\n")[0]?.slice(0, 120) ?? subject,
    blocks,
    footerNote: "This is an advertising-related email from the Okomba Analytics platform.",
  });

  let logId: string | null = null;
  try {
    const created = await db.emailLog.create({
      data: {
        type,
        recipientEmail: ad.email,
        subject,
        status: "sent",
        bodyText,
        bodyHtml: html,
      },
      select: { id: true },
    });
    logId = created.id;
  } catch (err) {
    console.error("[notify:ad] log persist failed:", err);
  }

  try {
    const result = await deliverWithFailover({
      to: ad.email,
      subject,
      bodyHtml: html,
      bodyText,
      attachments: [],
      type,
      legacyAction: "sendEmail",
    });
    if (logId) {
      try {
        await db.emailLog.updateMany({
          where: { id: logId },
          data: {
            provider: result.provider,
            ...(result.ok ? {} : { status: "failed", error: result.error ?? "delivery failed" }),
          },
        });
      } catch {}
    }
    if (!result.ok) {
      console.error("[notify:ad] delivery failed:", result.error);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[notify:ad] delivery threw:", err instanceof Error ? err.message : err);
    return { ok: false };
  }
}

/* §39 — advertiser receipt immediately after the public request. */
export async function notifyAdRequestReceived(ad: AdEmailRow): Promise<void> {
  try {
    await sendAdEmail(
      ad,
      "Your advertising request has been received",
      [
        { kind: "text", text: `Hi ${ad.firstName}, thank you for your interest in advertising with Okomba Analytics.` },
        { kind: "text", text: `We've received your request for a ${ad.adType} placement (${ad.placement})${ad.durationDays ? ` for ${ad.durationDays} days` : ""}. Our team reviews every request personally and will reply within 1–2 business days.` },
        { kind: "text", text: `Reference ID: ${ad.id}` },
      ],
      [
        `Hi ${ad.firstName},`,
        "",
        "Your advertising request has been received.",
        "",
        `Request: ${ad.adType} · ${ad.placement}${ad.durationDays ? ` · ${ad.durationDays} days` : ""}`,
        `Reference ID: ${ad.id}`,
        "",
        "We will review your campaign details and reply within 1–2 business days",
        "with pricing and next steps.",
      ].join("\n"),
      "ad.request_received"
    );
  } catch (err) {
    console.error("[notify] ad-request receipt failed:", err);
  }
}

/* §39 — internal alert with a useful summary + contact info. */
export async function notifyAdRequestAdmin(ad: AdEmailRow): Promise<void> {
  const lines = [
    "New advertising request.",
    "",
    `Advertiser: ${adFullName(ad)}${ad.company ? ` — ${ad.company}` : ""}`,
    `Email: ${ad.email}`,
    ad.phone ? `Phone: ${ad.phone}` : null,
    ad.whatsapp ? `WhatsApp: ${ad.whatsapp}` : null,
    ad.countryCode ? `Country: ${ad.countryCode}` : null,
    ad.websiteUrl ? `Website: ${ad.websiteUrl}` : null,
    "",
    `Placement: ${ad.placement} (${ad.adType})`,
    ad.durationDays ? `Duration: ${ad.durationDays} days` : null,
    ad.budget ? `Budget: ${ad.budget}` : null,
    "",
    "Campaign description:",
    ad.description.length > 600 ? `${ad.description.slice(0, 600)}…` : ad.description,
  ].filter((l): l is string => l !== null);

  try {
    await sendAdminAlertEmail({
      key: `ad.new.${ad.id}`,
      subject: `New advertising request — ${adFullName(ad)}${ad.company ? ` (${ad.company})` : ""}`,
      bodyText: lines.join("\n"),
      blocks: [
        { kind: "text", text: `New advertising request from ${adFullName(ad)}${ad.company ? ` — ${ad.company}` : ""}.` },
        { kind: "text", text: lines.filter((l) => !l.startsWith("Campaign")).slice(2, 8).join("\n") },
        { kind: "text", text: ad.description.length > 300 ? `${ad.description.slice(0, 300)}…` : ad.description },
      ],
      ctaText: "Review in admin",
      ctaUrl: `${BASE_URL}/#admin`,
    });
  } catch (err) {
    console.error("[notify] ad-request admin alert failed:", err);
  }
}

/* §38/§39 — decision emails. The note passed here is admin-authored
   OUTBOUND text (safe to show the advertiser) — never internalNotes. */
export async function notifyAdDecision(
  ad: AdEmailRow,
  kind: "approved" | "clarification" | "rejected" | "paid" | "scheduled",
  outboundNote?: string
): Promise<void> {
  const amount = money(ad);
  const window: string | null =
    ad.startAt || ad.endAt
      ? [
          ad.startAt ? new Date(ad.startAt).toDateString() : null,
          ad.endAt ? `until ${new Date(ad.endAt).toDateString()}` : null,
        ]
          .filter((s): s is string => s !== null)
          .join(" ")
      : null;

  let subject = "";
  let blocks: EmailBlock[] = [];
  let bodyText = "";
  let type = "ad.decision";

  if (kind === "approved") {
    subject = "Your advertising request is approved — pricing & payment";
    blocks = [
      { kind: "text", text: `Hi ${ad.firstName}, good news — your advertising request has been approved.` },
      { kind: "text", text: amount ? `Campaign price: ${amount}${window ? ` · ${window}` : ""}` : `Campaign details: ${window ?? "to be confirmed"}` },
      { kind: "text", text: AD_PAYMENT_INSTRUCTIONS },
      ...(outboundNote ? [{ kind: "text", text: outboundNote } as EmailBlock] : []),
      { kind: "text", text: "As soon as your payment is confirmed we will schedule the campaign and notify you." },
    ];
    bodyText = [
      `Hi ${ad.firstName},`,
      "",
      "Your advertising request has been approved.",
      amount ? `Campaign price: ${amount}${window ? ` · ${window}` : ""}` : null,
      "",
      AD_PAYMENT_INSTRUCTIONS,
      outboundNote ?? null,
      "",
      "Once payment is confirmed your campaign will be scheduled and you'll receive a confirmation.",
    ]
      .filter((l): l is string => l !== null)
      .join("\n");
    type = "ad.approved";
  } else if (kind === "clarification") {
    subject = "A few details about your advertising request";
    blocks = [
      { kind: "text", text: `Hi ${ad.firstName}, thanks again for your advertising request.` },
      { kind: "text", text: "Before we finalize the proposal, we need a few details:" },
      ...(outboundNote ? [{ kind: "text", text: outboundNote } as EmailBlock] : [{ kind: "text", text: "Could you reply with your preferred start date and any creative assets?" } as EmailBlock]),
    ];
    bodyText = [
      `Hi ${ad.firstName},`,
      "",
      "Before we finalize your advertising proposal, we need a few details:",
      "",
      outboundNote ?? "Could you reply with your preferred start date and any creative assets?",
    ].join("\n");
    type = "ad.clarification";
  } else if (kind === "rejected") {
    subject = "About your advertising request";
    blocks = [
      { kind: "text", text: `Hi ${ad.firstName}, thank you for considering Okomba Analytics for your campaign.` },
      { kind: "text", text: "After review, we're unable to proceed with this request at the moment." },
      ...(outboundNote ? [{ kind: "text", text: outboundNote } as EmailBlock] : []),
      { kind: "text", text: "We'd be glad to revisit this in the future — inventory opens up regularly." },
    ];
    bodyText = [
      `Hi ${ad.firstName},`,
      "",
      "Thank you for considering Okomba Analytics for your campaign.",
      "After review, we're unable to proceed with this request at the moment.",
      outboundNote ? `\n${outboundNote}` : "",
      "",
      "We'd be glad to revisit this in the future — ad inventory opens up regularly.",
    ].join("\n");
    type = "ad.rejected";
  } else if (kind === "paid") {
    subject = "Payment received — your campaign is being scheduled";
    blocks = [
      { kind: "text", text: `Hi ${ad.firstName}, we've received your payment. Thank you!` },
      { kind: "text", text: amount ? `Amount: ${amount}` : "Payment confirmed." },
      { kind: "text", text: "Your campaign is now being scheduled and will go live automatically at the agreed start." },
    ];
    bodyText = [
      `Hi ${ad.firstName},`,
      "",
      "Payment received — thank you!",
      amount ? `Amount: ${amount}` : null,
      "",
      "Your campaign will be scheduled and go live automatically at the agreed start date.",
    ]
      .filter((l): l is string => l !== null)
      .join("\n");
    type = "ad.paid";
  } else {
    subject = "Your campaign is scheduled";
    blocks = [
      { kind: "text", text: `Hi ${ad.firstName}, your campaign is scheduled and will publish automatically.` },
      { kind: "text", text: window ? `Live window: ${window}` : "You'll be notified the moment it goes live." },
      ...(outboundNote ? [{ kind: "text", text: outboundNote } as EmailBlock] : []),
    ];
    bodyText = [
      `Hi ${ad.firstName},`,
      "",
      "Your campaign is scheduled.",
      window ? `Live window: ${window}` : null,
      outboundNote ?? null,
    ]
      .filter((l): l is string => l !== null)
      .join("\n");
    type = "ad.scheduled";
  }

  try {
    await sendAdEmail(ad, subject, blocks, bodyText, type);
  } catch (err) {
    console.error("[notify] ad-decision email failed:", err);
  }
}

/* ─────────────────────────────────────────────────────────────────
   BATCH 7 (§44) — admin invitation emails.
   notifyAdminInvite → to the INVITEE (accept link + role summary).
   notifyAdminInviteAccepted → operational alert to the admin team.
   ───────────────────────────────────────────────────────────────── */

export async function notifyAdminInvite(p: {
  to: string;
  roleLabel: string;
  roleDescription?: string;
  invitedBy: string;
  acceptUrl: string;
}): Promise<void> {
  if (!enabled) return;

  const subject = "You're invited to the Okomba Analytics admin portal";
  const bodyText = [
    "Hello,",
    "",
    `${p.invitedBy} has invited you to join the Okomba Analytics team as a ${p.roleLabel}.`,
    p.roleDescription ? `Role summary: ${p.roleDescription}` : null,
    "",
    "Accept the invitation and set your password:",
    p.acceptUrl,
    "",
    "The link expires in 7 days. If you weren't expecting this email you can ignore it.",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const html = brandedEmailHtml({
    title: subject,
    preheader: `You've been invited as a ${p.roleLabel}`,
    blocks: [
      { kind: "text", text: `Hello,` },
      { kind: "text", text: `${p.invitedBy} has invited you to join the Okomba Analytics team as a **${p.roleLabel}**.` },
      ...(p.roleDescription ? [{ kind: "text", text: p.roleDescription } as EmailBlock] : []),
    ],
    ctaText: "Accept invitation",
    ctaUrl: p.acceptUrl,
    footerNote: "Invitation email from the Okomba Analytics platform. Links expire after 7 days.",
  });

  let logId: string | null = null;
  try {
    const created = await db.emailLog.create({
      data: { type: "admin.invite", recipientEmail: p.to, subject, status: "sent", bodyText, bodyHtml: html },
      select: { id: true },
    });
    logId = created.id;
  } catch (err) {
    console.error("[notify:admin-invite] log persist failed:", err);
  }

  try {
    const result = await deliverWithFailover({
      to: p.to,
      subject,
      bodyHtml: html,
      bodyText,
      attachments: [],
      type: "admin.invite",
    });
    if (logId) {
      try {
        await db.emailLog.updateMany({
          where: { id: logId },
          data: {
            provider: result.provider,
            ...(result.ok ? {} : { status: "failed", error: result.error ?? "delivery failed" }),
          },
        });
      } catch {}
    }
    if (!result.ok) {
      console.error("[notify:admin-invite] delivery failed:", result.error);
    }
  } catch (err) {
    console.error("[notify:admin-invite] delivery threw:", err instanceof Error ? err.message : err);
  }
}

export async function notifyAdminInviteAccepted(p: {
  name: string | null;
  email: string;
  roleLabel: string;
}): Promise<void> {
  try {
    await sendAdminAlertEmail({
      key: `admin.accepted.${p.email}`,
      subject: `Admin activated — ${p.name ?? p.email}`,
      bodyText: [
        "A new administrator has activated their account.",
        "",
        `Name: ${p.name ?? "(not provided)"}`,
        `Email: ${p.email}`,
        `Role: ${p.roleLabel}`,
      ].join("\n"),
      blocks: [
        { kind: "text", text: `A new administrator has activated their account.` },
        { kind: "text", text: `${p.name ?? p.email} — ${p.roleLabel} (${p.email}) is now able to sign in.` },
      ],
      ctaText: "Manage admins",
      ctaUrl: `${BASE_URL}/#admin`,
    });
  } catch (err) {
    console.error("[notify:admin-accepted] alert failed:", err);
  }
}

/* ─────────────────────────────────────────────────────────────
   BATCH 10 (§34) — event / webinar registration emails.

   notifyEventRegistration       → registrant confirmation
   notifyEventRegistrationAdmin  → admin alert (operational pipeline)
   sendEventReminderEmail        → pre-event / same-day / post-event
                                   reminder with the join link.
   All follow the sendAdEmail pattern (branded HTML + EmailLog
   audit row + failover delivery); email failures NEVER block the
   registration itself (fire-and-forget at the call site).
   ───────────────────────────────────────────────────────────── */

const LAGOS_TZ = "Africa/Lagos";

/** "Saturday, 14 February 2026 · 10:00 WAT" — §33 render rule. */
function eventDateLabel(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-NG", {
    timeZone: LAGOS_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-NG", {
    timeZone: LAGOS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${day} · ${time} WAT`;
}

export type EventRegistrationEmailPayload = {
  eventId: string;
  eventTitle: string;
  eventType: string;
  startAt: string; // ISO
  location?: string | null;
  meetingUrl?: string | null;
  firstName: string;
  email: string;
};

export function eventRegistrationSubject(p: EventRegistrationEmailPayload): string {
  return `You're registered — ${p.eventTitle}`;
}

export function composeEventRegistrationBody(p: EventRegistrationEmailPayload): string {
  return [
    `Hi ${p.firstName},`,
    "",
    `You're registered for ${p.eventTitle}.`,
    "",
    `When: ${eventDateLabel(p.startAt)}`,
    p.location ? `Where: ${p.location}` : null,
    p.meetingUrl ? `Join link: ${p.meetingUrl}` : "Your join link will be included in the event reminder.",
    "",
    "We'll send you a reminder before the event so you don't miss it.",
    "",
    "— Okomba Analytics",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}

export async function notifyEventRegistration(p: EventRegistrationEmailPayload): Promise<{ ok: boolean }> {
  return sendEventEmail(p.email, "event.registration", eventRegistrationSubject(p), composeEventRegistrationBody(p), [
    { kind: "text", text: `Hi ${p.firstName}, you're registered for **${p.eventTitle}**.` },
    {
      kind: "kv",
      rows: [
        ["When", eventDateLabel(p.startAt)],
        ...(p.location ? ([["Where", p.location]] as [string, string][]) : []),
        ["Join", p.meetingUrl ?? "Link arrives with your event reminder"],
      ],
    },
    { kind: "text", text: "We'll send you a reminder before the event so you don't miss it." },
  ]);
}

/* §34 — admin alert (registration received; rate-limited per event
   via the sendAdminAlertEmail cooldown — one alert per event per
   hour, the volume is bounded by registration rate limiting). */
export async function notifyEventRegistrationAdmin(p: {
  eventId: string;
  eventTitle: string;
  startAt: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode?: string | null;
  phone?: string | null;
  ip?: string;
}): Promise<void> {
  try {
    await sendAdminAlertEmail({
      key: `event.registration.${p.eventId}`,
      subject: `New registration — ${p.eventTitle}`,
      bodyText: [
        `New registration for ${p.eventTitle}.`,
        "",
        `Registrant: ${p.firstName} ${p.lastName}`,
        `Email:    ${p.email}`,
        p.phone ? `Phone:    ${p.phone}` : null,
        p.countryCode ? `Country:  ${p.countryCode}` : null,
        `Event:    ${eventDateLabel(p.startAt)}`,
        p.ip ? `Source IP: ${p.ip}` : null,
      ]
        .filter((l): l is string => l !== null)
        .join("\n"),
      blocks: [
        { kind: "text", text: `New registration for **${p.eventTitle}**.` },
        {
          kind: "kv",
          rows: [
            ["Registrant", `${p.firstName} ${p.lastName}`],
            ["Email", p.email],
            ...(p.phone ? ([["Phone", p.phone]] as [string, string][]) : []),
            ...(p.countryCode ? ([["Country", p.countryCode]] as [string, string][]) : []),
            ["Event", eventDateLabel(p.startAt)],
          ],
        },
      ],
      ctaText: "Open calendar",
      ctaUrl: `${BASE_URL}/#admin`,
    });
  } catch (err) {
    console.error("[notify:event-registration-admin] alert failed:", err);
  }
}

/* §34 — reminder email. kind: "pre" (distance label), "sameday"
   (starting now), "followup" (post-event thank-you). Carries the
   join link for the registrant. */
export type EventReminderEmailPayload = {
  eventId: string;
  eventTitle: string;
  startAt: string; // ISO
  location?: string | null;
  meetingUrl?: string | null;
  firstName: string;
  email: string;
  kind: "pre" | "sameday" | "followup";
  offsetMinutes: number; // >0 pre, 0 at start, <0 post
};

function eventReminderSubject(p: EventReminderEmailPayload): string {
  if (p.kind === "pre") {
    const days = Math.round(p.offsetMinutes / 1440);
    const hours = Math.round(p.offsetMinutes / 60);
    const distance = days >= 1 ? `${days} day${days === 1 ? "" : "s"}` : `${hours} hour${hours === 1 ? "" : "s"}`;
    return `Reminder: ${p.eventTitle} starts in ${distance}`;
  }
  if (p.kind === "sameday") return `Starting now: ${p.eventTitle}`;
  return `Thank you for joining ${p.eventTitle}`;
}

export function composeEventReminderBody(p: EventReminderEmailPayload): string {
  const when = eventDateLabel(p.startAt);
  if (p.kind === "followup") {
    return [
      `Hi ${p.firstName},`,
      "",
      `Thank you for joining ${p.eventTitle}.`,
      "",
      `Held: ${when}`,
      "",
      "We'd love your feedback — reply to this email with one thing",
      "you'd want us to cover next time.",
      "",
      "— Okomba Analytics",
    ].join("\n");
  }
  return [
    `Hi ${p.firstName},`,
    "",
    p.kind === "sameday"
      ? `${p.eventTitle} is starting now.`
      : `A reminder that ${p.eventTitle} is coming up.`,
    "",
    `When: ${when}`,
    p.location ? `Where: ${p.location}` : null,
    p.meetingUrl ? `Join:  ${p.meetingUrl}` : "Your join link is included when the session opens.",
    "",
    "— Okomba Analytics",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}

export async function sendEventReminderEmail(
  p: EventReminderEmailPayload
): Promise<{ ok: boolean; error?: string }> {
  const subject = eventReminderSubject(p);
  const blocks: EmailBlock[] = [
    {
      kind: "text",
      text:
        p.kind === "sameday"
          ? `Hi ${p.firstName}, **${p.eventTitle}** is starting now.`
          : p.kind === "followup"
            ? `Hi ${p.firstName}, thank you for joining **${p.eventTitle}**.`
            : `Hi ${p.firstName}, a reminder that **${p.eventTitle}** is coming up.`,
    },
    {
      kind: "kv",
      rows: [
        [p.kind === "followup" ? "Held" : "When", eventDateLabel(p.startAt)],
        ...(p.location ? ([["Where", p.location]] as [string, string][]) : []),
      ],
    },
    ...(p.kind !== "followup" && p.meetingUrl
      ? ([
          { kind: "text", text: `Join the session:\n${p.meetingUrl}` },
        ] as EmailBlock[])
      : []),
    ...(p.kind === "followup"
      ? ([{ kind: "text", text: "We'd love your feedback — reply with one thing you'd want us to cover next time." }] as EmailBlock[])
      : []),
  ];
  return sendEventEmail(p.email, "event.reminder", subject, composeEventReminderBody(p), blocks, p.meetingUrl ?? undefined);
}

/* Internal shared sender for event emails (EmailLog + failover). */
async function sendEventEmail(
  to: string,
  type: string,
  subject: string,
  bodyText: string,
  blocks: EmailBlock[],
  ctaUrl?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!enabled) return { ok: false, error: "notifications disabled" };

  const html = brandedEmailHtml({
    title: subject,
    preheader: bodyText.split("\n")[0]?.slice(0, 120) ?? subject,
    blocks,
    ...(ctaUrl ? { ctaText: "Join the event", ctaUrl } : {}),
    footerNote: "Event email from the Okomba Analytics platform.",
  });

  let logId: string | null = null;
  try {
    const created = await db.emailLog.create({
      data: { type, recipientEmail: to, subject, status: "sent", bodyText, bodyHtml: html },
      select: { id: true },
    });
    logId = created.id;
  } catch (err) {
    console.error(`[notify:${type}] log persist failed:`, err);
  }

  try {
    const result = await deliverWithFailover({
      to,
      subject,
      bodyHtml: html,
      bodyText,
      attachments: [],
      type,
      legacyAction: "sendEmail",
    });
    if (logId) {
      try {
        await db.emailLog.updateMany({
          where: { id: logId },
          data: {
            provider: result.provider,
            ...(result.ok ? {} : { status: "failed", error: result.error ?? "delivery failed" }),
          },
        });
      } catch {}
    }
    if (!result.ok) {
      console.error(`[notify:${type}] delivery failed:`, result.error);
      return { ok: false, error: result.error };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "delivery failed";
    console.error(`[notify:${type}] delivery threw:`, msg);
    return { ok: false, error: msg };
  }
}
