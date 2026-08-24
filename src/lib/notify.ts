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
        `Confirm link will be appended automatically by the caller.`,
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

/* ── Internal: send a single message + record the log ────── */
async function deliverOne(
  payload: NotificationPayload,
  recipient: { email: string; id?: string }
): Promise<void> {
  if (!enabled) return;

  const subject = subjectFor(payload);
  const body = composeBody(payload);
  const channel = payload.type;

  // ── EMAIL STUB (console) ─────────────────────────────────
  // Replace with a real provider call (Resend / SendGrid / SES) when
  // credentials are configured. Example:
  //   await fetch("https://api.resend.com/emails", {
  //     method: "POST",
  //     headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  //     body: JSON.stringify({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to: recipient.email, subject, text: body }),
  //   });
  console.info(
    `[notify:email-stub] → ${channel}\n` +
      `to: ${recipient.email}\n` +
      `from: ${FROM_NAME} <${FROM_EMAIL}>\n` +
      `subject: ${subject}\n` +
      `──────────────────────────────────────────────\n` +
      `${body}\n` +
      `──────────────────────────────────────────────\n`
  );

  // ── Record in EmailLog ───────────────────────────────────
  // So the admin dashboard can show a real audit trail.
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
      },
    });
  } catch (err) {
    console.error("[notify:email-log] persist failed:", err);
  }

  // ── Optional webhook forward (unchanged behaviour) ───────
  const webhookUrl = process.env.NOTIFY_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, recipient: recipient.email, subject, body }),
        signal: AbortSignal.timeout(5000),
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

export async function notifyNewSubscriber(email: string): Promise<void> {
  try {
    await deliverOne(
      {
        type: "subscriber.welcome",
        email,
        receivedAt: new Date().toISOString(),
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
