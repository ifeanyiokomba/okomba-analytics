/* ─────────────────────────────────────────────────────────────
   Admin portal — shared types & helpers
   ───────────────────────────────────────────────────────────── */

import type { Post } from "@/lib/posts";

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  service: string;
  addlService?: string | null;
  budget?: string | null;
  message: string;
  status: string;
  source?: string | null; // website | ai_chat (Module 7)
  createdAt: string;
};

export type Subscriber = {
  id: string;
  email: string;
  status: string;
  confirmedAt: string | null;
  createdAt: string;
};

export type EmailLog = {
  id: string;
  type: string;
  recipientEmail: string;
  subject: string;
  status: string;
  postId: string | null;
  subscriberId: string | null;
  sentAt: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  inquiryId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  service: string;
  amountNaira: number;
  currency: string;
  durationLabel: string | null;
  dueDate: string | null;
  status: string;
  dvaAccountNumber: string | null;
  dvaBankName: string | null;
  dvaSandbox: boolean;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

/* ── AI chat drafts (Module 7 — Proposals tab) ────────────── */
export type DraftProposalRow = {
  id: string;
  source: string;
  customerName: string;
  customerEmail: string;
  service: string;
  leadScore: number | null;
  inquiryId: string | null;
  receivedEmailId: string | null;
  status: string; // draft | sent | discarded
  createdAt: string;
  draft: ProposalDraft;
};

/* ── Paystack webhook log (Module 7 — Payments tab) ─────────── */
export type WebhookLogRow = {
  id: string;
  provider: string;
  event: string;
  paystackId: string | null;
  reference: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  amountKobo: number | null;
  currency: string | null;
  signatureValid: boolean;
  source: string; // webhook | admin-test
  status: string; // received | processed | failed | ignored | duplicate
  result: string; // JSON detail
  error: string | null;
  receivedAt: string;
  processedAt: string | null;
};

export type PaidInvoiceRow = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  service: string;
  amountKobo: number;
  currency: string;
  paidAt: string;
};

export type KickoffEventRow = {
  id: string;
  customerEmail: string | null;
  eventDate: string;
  relatedInvoiceId: string | null;
  payload: string;
  status: string;
};

/* ── WhatsApp widget (Module 6) ───────────────────────────── */
export type WhatsAppChat = {
  phone: string;
  name: string;
  service: string | null;
  lastMessage: {
    text: string | null;
    direction: string;
    sentAt: string;
    media: string | null;
  } | null;
  lastActivityAt: string;
  unread: number;
  totalMessages: number;
  latestInvoice: {
    id: string;
    invoiceNumber: string;
    amountNaira: number;
    dueDate: string | null;
    status: string;
  } | null;
};

export type WhatsAppMessage = {
  id: string;
  direction: "inbound" | "outbound" | string;
  toPhone: string | null;
  fromPhone: string | null;
  messageText: string | null;
  mediaFilename: string | null;
  relatedInvoiceId: string | null;
  status: string;
  sentAt: string;
};

export type WhatsAppServiceStatus = {
  mode: "real" | "demo" | "unknown" | string;
  status: "connected" | "disconnected" | "connecting" | "unknown" | string;
  phone?: string | null;
  qr?: string | null;
  serviceUp: boolean;
};

export function formatPhoneDisplay(msisdn: string): string {
  const n = msisdn.replace(/\D/g, "");
  if (n.startsWith("234") && n.length === 13) {
    return `+234 ${n.slice(3, 6)} ${n.slice(6, 9)} ${n.slice(9)}`;
  }
  return `+${n}`;
}

/* Client-side mirror of the server ProposalDraft shape. */
export type ProposalDraft = {
  executiveSummary: string;
  objectives: string[];
  scope: { title: string; items: string[] }[];
  deliverables: string[];
  timeline: { phase: string; duration: string; focus: string }[];
  terms: string[];
};

export type Stats = {
  total: number;
  new: number;
  contacted: number;
  in_progress: number;
  closed: number;
  last7Days: number;
  subscribers: number;
  confirmedSubscribers: number;
  postsTotal: number;
  postsPublished: number;
  postsDraft: number;
  emailsSent: number;
  emailsLast7Days: number;
  byService: { service: string; count: number }[];
  byBudget: { budget: string; count: number }[];
};

export type { Post };

export const INQUIRY_STATUSES = ["new", "contacted", "in_progress", "closed"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const SUBSCRIBER_STATUSES = ["pending", "confirmed", "unsubscribed"] as const;
export type SubscriberStatus = (typeof SUBSCRIBER_STATUSES)[number];

export const POST_STATUSES = ["draft", "published"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

/* ── Status → Tailwind classes (used in chips + selects) ──── */
export const INQUIRY_STATUS_STYLES: Record<string, string> = {
  new: "border-gold/35 bg-gold-dim text-gold",
  contacted: "border-[#5b9eff]/35 bg-[#5b9eff]/10 text-[#5b9eff]",
  in_progress: "border-purple-400/35 bg-purple-400/10 text-purple-300",
  closed: "border-teal/35 bg-teal-dim text-teal",
};

export const SUBSCRIBER_STATUS_STYLES: Record<string, string> = {
  pending: "border-gold/35 bg-gold-dim text-gold/80",
  confirmed: "border-teal/35 bg-teal-dim text-teal",
  unsubscribed: "border-red-500/30 bg-red-500/10 text-red-300",
};

export const POST_STATUS_STYLES: Record<string, string> = {
  draft: "border-purple-400/35 bg-purple-400/10 text-purple-300",
  published: "border-teal/35 bg-teal-dim text-teal",
};

/* ── Email log type labels ─────────────────────────────────── */
export const EMAIL_TYPE_LABELS: Record<string, string> = {
  "inquiry.created": "Inquiry receipt",
  "subscriber.welcome": "Welcome / confirm",
  "post.published": "New post",
  broadcast: "Broadcast",
  "invoice.sent": "Proposal / invoice",
  "invoice.reminder_3d": "Reminder · friendly",
  "invoice.reminder_due": "Reminder · due today",
  "invoice.reminder_overdue": "Reminder · overdue",
  "payment.received": "Payment thank-you",
};

/* ── Invoice status chips (Proposals tab) ───────────────────── */
export const INVOICE_STATUS_STYLES: Record<string, string> = {
  draft: "border-purple-400/35 bg-purple-400/10 text-purple-300",
  sent: "border-gold/35 bg-gold-dim text-gold",
  pending: "border-[#5b9eff]/35 bg-[#5b9eff]/10 text-[#5b9eff]",
  paid: "border-teal/35 bg-teal-dim text-teal",
  overdue: "border-red-500/30 bg-red-500/10 text-red-300",
  cancelled: "border-white/15 bg-white/[0.04] text-muted-foreground",
};

export const INVOICE_STATUSES = ["draft", "sent", "pending", "paid", "overdue", "cancelled"] as const;

/* ── Webhook log status chips (Payments tab) ────────────── */
export const WEBHOOK_STATUS_STYLES: Record<string, string> = {
  received: "border-gold/35 bg-gold-dim text-gold",
  processed: "border-teal/35 bg-teal-dim text-teal",
  failed: "border-red-500/30 bg-red-500/10 text-red-300",
  ignored: "border-white/15 bg-white/[0.04] text-muted-foreground",
  duplicate: "border-purple-400/35 bg-purple-400/10 text-purple-300",
};

export function formatNaira(n: number): string {
  return `\u20A6${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

/* ── Convert ISO string → "10 Mar" / "10 Mar 2025" ──────────── */
export function formatDate(
  iso: string,
  opts: { withYear?: boolean; withTime?: boolean } = {}
): string {
  const d = new Date(iso);
  const fmt: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    ...(opts.withYear ? { year: "numeric" } : {}),
    ...(opts.withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  };
  return d.toLocaleString("en-NG", fmt);
}

/* ── Convert ISO string → full timestamp w/ time ───────────── */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Convert ISO string → "3 hours ago" relative ───────────── */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 60) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  if (day < 30) return `${Math.floor(day / 7)}w ago`;
  return formatDate(iso, { withYear: false });
}

/* ── Estimate reading time from content length ─────────────── */
export function readTimeFor(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}
