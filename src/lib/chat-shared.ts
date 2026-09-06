/* ─────────────────────────────────────────────────────────────
   BATCH 11 (§58–§63) — CLIENT-SAFE AI chat vocabulary.

   Split from src/lib/ai-chat-monitor.ts + src/lib/ai-knowledge.ts
   (server-only: they import Prisma) per the same Turbopack lesson as
   events-shared/events (Task 41) and ads-shared/ads: a client
   component importing constants from a module that transitively
   imports `db` drags Prisma into the browser bundle. The public
   widget + the admin AI Monitor import THIS file; route handlers and
   libs keep their server-side definitions.
   ───────────────────────────────────────────────────────────── */

/* ── Conversation state machine (§58 lifecycle) ──────────── */

export type ChatConversationStatus = "ai" | "takeover_requested" | "human";

/** List-row + header status vocabulary shared by the admin monitor. */
export const CHAT_STATUS_META: Record<
  string,
  { label: string; dot: string; chip: string; header: string }
> = {
  ai: {
    label: "AI",
    dot: "bg-white/40",
    chip: "border-white/15 bg-white/[0.04] text-muted-foreground",
    header: "Service finder · replies instantly",
  },
  takeover_requested: {
    label: "Handover requested",
    dot: "bg-gold animate-pulse",
    chip: "border-gold/35 bg-gold-dim text-gold",
    header: "Connecting you to our team…",
  },
  human: {
    label: "Human",
    dot: "bg-teal",
    chip: "border-teal/35 bg-teal-dim text-teal",
    header: "You're chatting with our team",
  },
};

export function chatStatusMeta(status: string) {
  return CHAT_STATUS_META[status] ?? CHAT_STATUS_META.ai;
}

/** Conversations-list status filter chips ("" = all). */
export const CHAT_STATUS_FILTERS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "ai", label: "AI" },
  { key: "takeover_requested", label: "Handover requested" },
  { key: "human", label: "Human" },
];

/* ── Sentiment / urgency chips (§58) ─────────────────────── */

export const CHAT_SENTIMENT_STYLES: Record<string, string> = {
  positive: "border-teal/35 bg-teal-dim text-teal",
  neutral: "border-white/15 bg-white/[0.04] text-muted-foreground",
  negative: "border-red-500/30 bg-red-500/10 text-red-300",
};

export const CHAT_URGENCY_STYLES: Record<string, string> = {
  low: "border-white/15 bg-white/[0.04] text-muted-foreground",
  medium: "border-gold/35 bg-gold-dim text-gold",
  high: "border-red-500/30 bg-red-500/10 text-red-300",
};

/* ── Public widget poll (GET /api/chat/session) ──────────── */

/** Message row the public poll may return (roles agent|system|assistant;
 *  the widget renders only agent + system from the poll — assistant
 *  replies always arrive via the POST /api/ai/chat response). */
export type PublicChatPollMessage = {
  id: string;
  role: string;
  content: string;
  authorLabel: string | null;
  createdAt: string;
};

export type PublicChatSessionResponse = {
  ok: boolean;
  status: ChatConversationStatus;
  agentName: string | null;
  adminOnline: boolean;
  newMessages: PublicChatPollMessage[];
  alternatives?: string;
};

/** POST /api/ai/chat response (additive Batch 11 fields optional). */
export type AiChatTurnResponse = {
  ok: boolean;
  reply?: string;
  stage?: string;
  recommendedServices?: string[];
  leadScore?: number | null;
  leadCaptured?: boolean;
  email?: string | null;
  draftProposal?: "generating" | "created" | "failed";
  usedFallback?: boolean;
  humanOwned?: boolean;
  escalate?: boolean;
  status?: string;
  agentName?: string | null;
  conversationId?: string;
  error?: string;
};

/* ── Admin projections (§58 monitoring) ──────────────────── */

export type AdminChatConversationRow = {
  id: string;
  sessionId: string;
  customerName: string | null;
  customerEmail: string | null;
  status: string;
  sentiment: string | null;
  urgency: string | null;
  escalationReason: string | null;
  agentEmail: string | null;
  agentName: string | null;
  lastMessageAt: string;
  createdAt: string;
  messageCount: number;
  lastMessagePreview: string;
};

export type AdminChatMessage = {
  id: string;
  role: string; // user | assistant | agent | system
  content: string;
  authorLabel: string | null;
  createdAt: string;
};

export type AdminChatConversation = {
  id: string;
  sessionId: string;
  customerName: string | null;
  customerEmail: string | null;
  status: string;
  agentEmail: string | null;
  agentName: string | null;
  sentiment: string | null;
  urgency: string | null;
  escalationReason: string | null;
  escalationNotifiedAt: string | null;
  lastMessageAt: string;
  createdAt: string;
  messageCount: number;
};

export type AdminChatConversationDetail = {
  ok: boolean;
  conversation: AdminChatConversation;
  messages: AdminChatMessage[];
};

/* ── Knowledge singleton (§50/§51) ───────────────────────── */

export type AiContactConfig = {
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  hours?: string;
  callbackEnabled?: boolean;
};

export type AiServicePrice = {
  name: string;
  description?: string;
  duration?: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
};

export type AiFaqItem = { q: string; a: string };

export type AiEducationItem = {
  course: string;
  description?: string;
  duration?: string;
};

export type AiPolicies = {
  paymentPolicy?: string;
  cancellationPolicy?: string;
  depositPolicy?: string;
  invoiceTerms?: string;
  discounts?: string;
};

export type AiKnowledge = {
  businessProfile: string | null;
  contact: AiContactConfig;
  faq: AiFaqItem[];
  services: AiServicePrice[];
  education: AiEducationItem[];
  policies: AiPolicies;
  updatedAt: string;
};

/** §51 live preview: "₦350,000 – ₦1,200,000 · 3–6 weeks". */
export function aiServicePricePreview(s: {
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  duration?: string;
}): string {
  const sym = s.currency && s.currency.toUpperCase() !== "NGN" ? `${s.currency} ` : "₦";
  const fmt = (n: number) => n.toLocaleString("en-NG");
  const min = typeof s.priceMin === "number" && Number.isFinite(s.priceMin) ? s.priceMin : null;
  const max = typeof s.priceMax === "number" && Number.isFinite(s.priceMax) ? s.priceMax : null;
  let price: string;
  if (min != null && max != null && min !== max) price = `${sym}${fmt(min)} – ${sym}${fmt(max)}`;
  else if (min != null && max != null) price = `${sym}${fmt(min)}`;
  else if (min != null) price = `from ${sym}${fmt(min)}`;
  else if (max != null) price = `from ${sym}${fmt(max)}`;
  else price = "custom (in your proposal)";
  return s.duration ? `${price} · ${s.duration}` : price;
}

/* ── §63 audit trail ────────────────────────────────────── */

export type AiAuditEntry = {
  id: string;
  action: string;
  actor: string | null;
  conversationId: string | null;
  targetId: string | null;
  meta: unknown;
  createdAt: string;
};

export type AiAuditFamily = "handoff" | "chat" | "knowledge" | "proposal" | "other";

export function aiAuditFamily(action: string): AiAuditFamily {
  if (action.startsWith("ai.handoff.")) return "handoff";
  if (action.startsWith("ai.chat.")) return "chat";
  if (action.startsWith("ai.knowledge.")) return "knowledge";
  if (action.startsWith("ai.proposal.")) return "proposal";
  return "other";
}

export const AI_AUDIT_FAMILY_STYLES: Record<AiAuditFamily, string> = {
  handoff: "border-gold/35 bg-gold-dim text-gold",
  chat: "border-teal/35 bg-teal-dim text-teal",
  knowledge: "border-purple-400/35 bg-purple-400/10 text-purple-300",
  proposal: "border-gold-light/35 bg-gold-light/10 text-gold-light",
  other: "border-white/15 bg-white/[0.04] text-muted-foreground",
};

export const AI_AUDIT_FAMILY_LABELS: Record<AiAuditFamily, string> = {
  handoff: "Handoff",
  chat: "Chat",
  knowledge: "Knowledge",
  proposal: "Proposal",
  other: "Other",
};

/* ── §62 presence ────────────────────────────────────────── */

export type AdminPresence = {
  status: string; // online | away | offline
  seenAt: string | null;
};

export type AdminPresenceResponse = {
  ok: boolean;
  mine: AdminPresence;
  anyOnline: boolean;
  error?: string;
};

/* ── Small helpers ───────────────────────────────────────── */

/** "a1b2c3d4" — short form for conversationId chips. */
export function shortId(id: string, len = 8): string {
  return id.length <= len ? id : `${id.slice(0, len)}…`;
}
