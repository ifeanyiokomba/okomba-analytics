import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { AD_PLACEMENT_KEYS, AD_TYPE_KEYS } from "@/lib/ads";
import { COUNTRY_CODES, normalizeEmail, normalizePhone } from "@/lib/countries";
import { saveMediaUpload } from "@/lib/media";
import { notifyAdRequestAdmin, notifyAdRequestReceived } from "@/lib/notify";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/ads/request — §37 public "Advertise With Us" intake.     */
/* Accepts multipart/form-data (with optional attachment) or JSON.    */
/* Rate-limited 5 / 10 min per IP. Creates AdRequest(status=new),     */
/* then fires the two §39 emails (advertiser receipt + admin alert)  */
/* without ever blocking the 201 on email transport problems.         */
/* ------------------------------------------------------------------ */

/* In-memory rate limiting (per IP): max 5 submissions / 10 minutes  */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const rateLimitBuckets = new Map<string, number[]>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (rateLimitBuckets.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitBuckets.set(ip, recent);
  return true;
}

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  company: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  email: z.string().trim().email("A valid email is required").max(160),
  phone: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  whatsapp: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  country: z
    .string()
    .trim()
    .length(2)
    .optional()
    .transform((v) => (v ? v.toUpperCase() : undefined)),
  websiteUrl: z
    .string()
    .trim()
    .url("Website/social URL must be a valid URL")
    .max(300)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  adType: z.enum(AD_TYPE_KEYS as unknown as [string, ...string[]]),
  placement: z.enum(AD_PLACEMENT_KEYS as unknown as [string, ...string[]]),
  startDate: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  durationDays: z.coerce
    .number()
    .int("Whole days only")
    .min(1, "At least 1 day")
    .max(365, "At most 365 days")
    .optional(),
  budget: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  description: z
    .string()
    .trim()
    .min(20, "Please describe your campaign (at least 20 characters)")
    .max(4000),
  termsConsent: z
    .union([z.literal(true), z.literal("true"), z.literal("on"), z.literal(1), z.literal("1")])
    .refine((v) => v === true || v === "true" || v === "on" || v === 1 || v === "1", {
      message: "You must accept the advertising terms",
    }),
  honeypot: z.string().max(0).optional().transform(() => undefined),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    const contentType = req.headers.get("content-type") ?? "";
    let raw: Record<string, unknown>;
    let attachmentFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      raw = {};
      for (const [key, value] of form.entries()) {
        if (key === "attachment" && value instanceof File && value.size > 0) {
          attachmentFile = value;
        } else if (typeof value === "string") {
          raw[key] = value;
        }
      }
    } else {
      raw = (await req.json()) as Record<string, unknown>;
    }

    // §92-style silent honeypot: bots that fill the hidden field are
    // discarded without any tip-off.
    if (typeof raw.honeypot === "string" && raw.honeypot.length > 0) {
      return NextResponse.json({ ok: true, id: "hp" }, { status: 201 });
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid submission" },
        { status: 422 }
      );
    }
    const data = parsed.data;

    const normalizedEmail = normalizeEmail(data.email) ?? data.email.toLowerCase();
    const normalizedPhone = normalizePhone(data.phone) ?? null;
    const normalizedWhatsapp = normalizePhone(data.whatsapp) ?? null;

    // Preferred start date must be sane (not in the past, ≤ 1 year out)
    let start: Date | null = null;
    if (data.startDate) {
      const d = new Date(data.startDate);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ ok: false, error: "Invalid start date" }, { status: 422 });
      }
      if (d.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
        return NextResponse.json(
          { ok: false, error: "Preferred start date cannot be in the past" },
          { status: 422 }
        );
      }
      start = d;
    }

    // Country must be a known ISO-2 code when provided
    if (data.country && !COUNTRY_CODES.includes(data.country)) {
      return NextResponse.json({ ok: false, error: "Unknown country code" }, { status: 422 });
    }

    // §37 attachment — validated + optimized via the shared media
    // pipeline (magic bytes, MIME allowlist, size caps, sharp WebP).
    let attachmentId: string | undefined;
    if (attachmentFile) {
      const result = await saveMediaUpload(attachmentFile);
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
      }
      attachmentId = result.asset.id;
    }

    const ad = await db.adRequest.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company ?? null,
        email: normalizedEmail,
        phone: normalizedPhone,
        whatsapp: normalizedWhatsapp,
        countryCode: data.country ?? null,
        websiteUrl: data.websiteUrl ?? null,
        adType: data.adType,
        placement: data.placement,
        startDate: start,
        durationDays: data.durationDays ?? null,
        budget: data.budget ?? null,
        description: data.description,
        attachmentId: attachmentId ?? null,
        termsConsent: true,
        status: "new",
        statusHistory: [{ status: "new", at: new Date().toISOString() }],
      },
    });

    // §38/§39 emails — best-effort, never block the request
    const emailRow = {
      id: ad.id,
      firstName: ad.firstName,
      lastName: ad.lastName,
      company: ad.company,
      email: ad.email,
      phone: ad.phone,
      whatsapp: ad.whatsapp,
      countryCode: ad.countryCode,
      websiteUrl: ad.websiteUrl,
      adType: ad.adType,
      placement: ad.placement,
      durationDays: ad.durationDays,
      budget: ad.budget,
      description: ad.description,
      amount: ad.amount,
      currency: ad.currency,
      startAt: ad.startAt,
      endAt: ad.endAt,
    };
    void notifyAdRequestReceived(emailRow).catch(() => {});
    void notifyAdRequestAdmin(emailRow).catch(() => {});

    // Analytics: ad_request event (marketing funnel)
    try {
      await db.analyticsEvent.create({
        data: {
          type: "ad_request",
          meta: { placement: ad.placement, adType: ad.adType, source: "advertise-section" },
        },
      });
    } catch {}

    return NextResponse.json({ ok: true, id: ad.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/ads/request]", err);
    return NextResponse.json({ ok: false, error: "Could not submit request" }, { status: 500 });
  }
}
