/* ─────────────────────────────────────────────────────────────
   Comments — shared anti-spam / abuse protections (directive
   §23 post comments + §92 comments/public content security).

   Defense layers (in the order a submission passes them):
   1. Rate limit — 5 comments / 10 min / IP (in-memory buckets,
      same pattern as the inquiries route).
   2. Honeypot + time-trap — hidden form fields that real users
      never fill; bots are silently discarded (OK response, no
      tip-off) so they can't adapt.
   3. Content checks — link budget, URL-shortener domains,
      profanity blocklist, all-caps shouting, duplicate bodies.
      Hard failures are stored with status "spam"/"rejected" for
      the admin trail but are NEVER public.
   4. Moderation-first — everything else lands as "pending" and
      only an admin approval makes it public. Anonymous
      commenting can never be a direct spam vector.
   ───────────────────────────────────────────────────────────── */

import { createHash, randomUUID } from "crypto";

/* ── Limits (exported for tests + route validation) ─────── */
export const COMMENT_LIMITS = {
  authorNameMin: 2,
  authorNameMax: 60,
  bodyMin: 10,
  bodyMax: 2000,
  emailMax: 254,
  maxLinks: 2,
  /** Same (IP, body) posted twice within this window → duplicate */
  duplicateWindowMs: 24 * 60 * 60 * 1000,
  /** Reports needed before a comment auto-hides (back to pending) */
  reportAutoHide: 3,
} as const;

export const COMMENT_STATUSES = ["pending", "approved", "rejected", "spam"] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export const COMMENT_MODERATION_ACTIONS = ["approve", "reject", "spam", "pending"] as const;
export type CommentModerationAction = (typeof COMMENT_MODERATION_ACTIONS)[number];

/* ── IP extraction + salted hashing (never store raw IP) ── */

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

const IP_SALT = process.env.COMMENT_IP_SALT ?? "okomba-comment-salt-v1";

export function hashIp(ip: string): string {
  return createHash("sha256").update(`${IP_SALT}:${ip}`).digest("hex").slice(0, 32);
}

/* ── In-memory rate limiting (shared pattern w/ inquiries) ─ */

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const rateLimitBuckets = new Map<string, number[]>();

/** Returns true when the caller is OVER the limit (blocked). */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (rateLimitBuckets.get(key) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitBuckets.set(key, recent);
    return true;
  }
  recent.push(now);
  rateLimitBuckets.set(key, recent);
  return false;
}

/* ── Visitor key (§24 reactions): anonymous session cookie ─ */

export const VISITOR_COOKIE = "ok_visitor";
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

/** Read the visitor key from the request's Cookie header (no create). */
export function readVisitorKey(req: Request): string | null {
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === VISITOR_COOKIE) {
      const value = rest.join("=").trim();
      if (value.length >= 8 && value.length <= 64) return value;
    }
  }
  return null;
}

/** Read or mint a visitor key; the route sets the cookie on its response. */
export function getOrCreateVisitorKey(req: Request): { key: string; isNew: boolean } {
  const existing = readVisitorKey(req);
  if (existing) return { key: existing, isNew: false };
  return { key: randomUUID(), isNew: true };
}

/* ── Spam detection (§92) ───────────────────────────────── */

/** Well-known URL shorteners / link farms — classic comment spam. */
const SHORTENER_HOSTS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly",
  "adf.ly", "cutt.ly", "shorturl.at", "rb.gy", "rebrand.ly", "tiny.cc",
]);

/** Profanity / abuse blocklist (§92). Small, blunt, maintained by hand. */
const PROFANITY_PATTERNS: RegExp[] = [
  /\b(f+u+c+k+|f+u+k+|phuk)\s*(ing|ed|er)?\b/i,
  /\b(sh+i+t+|s+h+i+t+)\s*(ing|ed|er|head|hole)?\b/i,
  /\bb+i+t+c+h+\b/i,
  /\bb+a+s+t+a+r+d+\b/i,
  /\ba+s+s+h+o+l+e+\b/i,
  /\b(d+u+c+h+e|w+a+n+k+e+r)\s*bag?\b/i,
  /\bc+u+n+t+\b/i,
  /\b(n+i+g+g+a?r?s*)\b/i,
  /\b(k+u+n+t+a?)\b/i,
  /\b(b+o+o+b+s|t+i+t+s|c+o+c+k+|d+i+c+k+)\b/i,
  /\b(p+u+s+s+y+)\b/i,
];

export type SpamCheckResult = {
  /** accept → store pending · reject → refuse + store trail · spam → store as spam (never public) */
  action: "accept" | "reject" | "spam";
  reasons: string[];
  score: number; // 0–100, only informational for the admin trail
};

export type SpamCheckInput = {
  body: string;
  authorName: string;
  authorEmail?: string | null;
};

function countLinks(text: string): number {
  return (text.match(/https?:\/\/[^\s)]+/gi) ?? []).length;
}

function extractHosts(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/https?:\/\/([^/\s)]+)/gi)) {
    if (m[1]) out.push(m[1].toLowerCase());
  }
  return out;
}

export function runSpamChecks(input: SpamCheckInput): SpamCheckResult {
  const reasons: string[] = [];
  let score = 0;

  const body = input.body;
  const name = input.authorName;

  // 1) Link budget
  const links = countLinks(body);
  if (links > COMMENT_LIMITS.maxLinks) {
    reasons.push(`link-budget:${links}`);
    score += 60;
    return { action: "reject", reasons, score: Math.min(score, 100) };
  }

  // 2) Shortener / link-farm domains
  const hosts = extractHosts(body);
  const shorteners = hosts.filter((h) => SHORTENER_HOSTS.has(h.replace(/^www\./, "")));
  if (shorteners.length > 0) {
    reasons.push(`shortener:${shorteners.join(",")}`);
    score += 50;
  }

  // 3) Profanity / abuse (hard spam)
  for (const re of PROFANITY_PATTERNS) {
    if (re.test(body) || re.test(name)) {
      reasons.push("profanity");
      score += 55;
      break;
    }
  }

  // 4) All-caps shouting (heuristic, only flags long bodies)
  const letters = body.replace(/[^a-zA-Z]/g, "");
  if (letters.length > 30) {
    const upperRatio = letters.replace(/[^A-Z]/g, "").length / letters.length;
    if (upperRatio > 0.7) {
      reasons.push(`caps:${Math.round(upperRatio * 100)}%`);
      score += 25;
    }
  }

  // 5) Repeated character spam ("aaaaaaa", "!!!!!!!")
  if (/(.)\1{9,}/.test(body)) {
    reasons.push("char-flood");
    score += 20;
  }

  // 6) Marketing keyword stuffing
  const spammyWords = ["seo services", "buy now", "casino", "crypto pump", "forex signals", "viagra", "escort", "loan offer"];
  const lower = body.toLowerCase();
  for (const w of spammyWords) {
    if (lower.includes(w)) {
      reasons.push(`keyword:${w}`);
      score += 45;
      break;
    }
  }

  // 7) Name plausibility (e.g. "Visit our site" as a name)
  if (name.length > 40 || /https?:\/\//i.test(name)) {
    reasons.push("name-implausible");
    score += 30;
  }

  const action = score >= 55 ? "spam" : score >= 30 ? "reject" : "accept";
  return { action, reasons, score: Math.min(score, 100) };
}

/** Normalized body for duplicate detection. */
export function bodyHash(body: string): string {
  return createHash("sha256")
    .update(body.trim().toLowerCase().replace(/\s+/g, " "))
    .digest("hex")
    .slice(0, 32);
}

/* ── Public comment shape (API responses) ───────────────── */

export type PublicComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  replies: PublicComment[];
};
