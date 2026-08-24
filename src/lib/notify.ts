/**
 * Notification service — integration point for outbound notifications.
 *
 * Currently implements a console-based "email stub" that logs structured
 * notification payloads. When a real email provider (or webhook consumer
 * like Resend, SendGrid, Zapier, Slack) is configured, replace the body of
 * `deliver()` with the actual send — no other code needs to change.
 *
 * Set `NOTIFICATIONS_ENABLED=false` to silence entirely.
 */

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
  type: "subscriber.created";
  email: string;
  receivedAt: string;
};

const enabled = process.env.NOTIFICATIONS_ENABLED !== "false";

async function deliver(channel: string, payload: InquiryNotificationPayload | SubscriberNotificationPayload): Promise<void> {
  if (!enabled) return;

  // ── EMAIL STUB ──────────────────────────────────────────────
  // Replace with a real provider call (e.g. Resend) when credentials exist.
  // Example future implementation:
  //   await fetch("https://api.resend.com/emails", { method: "POST", ... })
  console.info(
    `[notify:email-stub] → ${channel}\n${JSON.stringify(payload, null, 2)}`
  );

  // ── WEBHOOK (optional) ─────────────────────────────────────
  // If NOTIFY_WEBHOOK_URL is set, forward the event as JSON.
  const webhookUrl = process.env.NOTIFY_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
    } catch (err) {
      // Never let notification failures break the user-facing request
      console.error("[notify:webhook] delivery failed:", err);
    }
  }
}

export async function notifyNewInquiry(inquiry: InquiryNotificationPayload["inquiry"]): Promise<void> {
  try {
    await deliver("inquiries", { type: "inquiry.created", inquiry, receivedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[notify] inquiry notification failed:", err);
  }
}

export async function notifyNewSubscriber(email: string): Promise<void> {
  try {
    await deliver("subscribers", { type: "subscriber.created", email, receivedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[notify] subscriber notification failed:", err);
  }
}
