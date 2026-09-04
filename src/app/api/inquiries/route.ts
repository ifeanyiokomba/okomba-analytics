import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { notifyNewInquiry } from "@/lib/notify";
import { COUNTRY_CODES, normalizeEmail, normalizePhone } from "@/lib/countries";
import { findOrCreateCustomer, linkInquiryToCustomer } from "@/lib/customer-service";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* In-memory rate limiting (per IP): max 5 submissions / 10 minutes    */
/* ------------------------------------------------------------------ */
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

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (rateLimitBuckets.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitBuckets.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateLimitBuckets.set(ip, recent);
  return false;
}

/* ------------------------------------------------------------------ */
/* Validation schemas                                                  */
/* ------------------------------------------------------------------ */
const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

// ── BATCH 2 (directive §5,§6,§7): canonical customer identity contract ──
//   Required: firstName, lastName, email, phone, country, service, message
//   Optional: whatsapp, addlService, budget
//   Country MUST be a structured ISO-2 code from the catalogue — no free text.
//   Phone is normalized (whitespace/parens stripped) on the backend so the
//   browser is never the final authority (directive §7, §8).
//   The legacy `name` field is NOT accepted from the client anymore —
//   it's derived server-side from firstName + " " + lastName for compat
//   with the existing PDF / email / portal pipeline.
const inquirySchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(60, "First name must be at most 60 characters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(60, "Last name must be at most 60 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .pipe(z.email("Please provide a valid email address")),
  phone: z
    .string()
    .trim()
    .min(7, "A valid phone number is required")
    .max(30, "Phone must be at most 30 characters"),
  whatsapp: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(30, "WhatsApp must be at most 30 characters").optional()
  ),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .refine((c) => (COUNTRY_CODES as readonly string[]).includes(c), {
      message: "Please select a valid country",
    }),
  service: z.string().trim().min(1, "Please select a service"),
  budget: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(60, "Budget must be at most 60 characters").optional()
  ),
  addlService: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(200, "Additional service must be at most 200 characters")
      .optional()
  ),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be at most 2000 characters"),
});

const INQUIRY_STATUSES = ["new", "contacted", "in_progress", "closed"] as const;

const updateStatusSchema = z.object({
  id: z.string().trim().min(1, "Inquiry id is required"),
  status: z.enum(INQUIRY_STATUSES, {
    error: "Status must be one of: new, contacted, in_progress, closed",
  }),
});

/* ------------------------------------------------------------------ */
/* POST /api/inquiries — public: submit a new inquiry                  */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, error: "Too many submissions. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Request body must be valid JSON" },
        { status: 400 }
      );
    }

    const parsed = inquirySchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid submission" },
        { status: 400 }
      );
    }

    // ── BATCH 2: normalize + derive canonical identity ──
    //   email/phone are normalized server-side (directive §7).
    //   `name` is derived for legacy display/compat — we don't accept
    //   it from the client anymore (directive §48: no name-splitting).
    const normalizedEmail = normalizeEmail(parsed.data.email) ?? parsed.data.email.toLowerCase();
    const normalizedPhone = normalizePhone(parsed.data.phone);
    const normalizedWhatsapp = normalizePhone(parsed.data.whatsapp) ?? null;
    const derivedName =
      `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

    // ── directive §28: Validate → Create Inquiry → Find Customer by
    //   normalized email → Create/Update Customer → Link Inquiry → Customer ──
    //   Customer sync runs FIRST (so the Inquiry row can carry customerId
    //   at creation time — saves a second write). Per directive §29, we do
    //   NOT provision a Paystack customer or DVA here — that happens later
    //   when a proposal is accepted and an invoice is created.
    let customerId: string | null = null;
    try {
      const upsert = await findOrCreateCustomer({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: normalizedEmail,
        phone: normalizedPhone,
        whatsapp: normalizedWhatsapp,
        countryCode: parsed.data.country,
        source: "inquiry",
      });
      customerId = upsert.customer.id;
    } catch (err) {
      // Customer sync failure must NOT block the inquiry — the lead is
      // still valuable. The admin can re-link from the CRM view later.
      console.error("[POST /api/inquiries] customer sync failed:", err);
    }

    const inquiry = await db.inquiry.create({
      data: {
        name: derivedName, // legacy display/compat field
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        countryCode: parsed.data.country,
        customerId,
        email: normalizedEmail,
        phone: normalizedPhone,
        whatsapp: normalizedWhatsapp,
        service: parsed.data.service,
        addlService: parsed.data.addlService ?? null,
        budget: parsed.data.budget ?? null,
        message: parsed.data.message,
        status: "new",
      },
    });

    // If Customer was created BEFORE the Inquiry row, link back the
    // Inquiry's customerId now (the findOrCreateCustomer call returned
    // the Customer id, but db.inquiry.create already set it — so this
    // is a no-op in the happy path; it's a safety net for the rare case
    // where the Customer exists but their row was updated after the
    // Inquiry create.
    if (customerId && !inquiry.customerId) {
      await linkInquiryToCustomer(inquiry.id, customerId);
    }

    // received_emails audit trail (Phase-1 Module 2) — inbound record
    // mirrors the inquiry; kept separate from the workflow table so
    // ai_chat leads (Phase 3) and manual entries share one audit log.
    try {
      await db.receivedEmail.create({
        data: {
          source: "contact",
          name: derivedName,
          email: inquiry.email,
          phone: inquiry.phone,
          subject: `Inquiry — ${inquiry.service}`,
          message: inquiry.message,
          inquiryId: inquiry.id,
          meta: {
            service: inquiry.service,
            addlService: inquiry.addlService,
            budget: inquiry.budget,
            whatsapp: inquiry.whatsapp,
            firstName: inquiry.firstName,
            lastName: inquiry.lastName,
            countryCode: inquiry.countryCode,
            customerId: inquiry.customerId,
          },
        },
      });
    } catch (err) {
      console.error("[received_emails] audit persist failed:", err);
    }

    // Fire-and-forget notification (never blocks or fails the response)
    notifyNewInquiry({
      id: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      whatsapp: inquiry.whatsapp,
      service: inquiry.service,
      addlService: inquiry.addlService,
      message: inquiry.message,
    }).catch(() => undefined);

    return NextResponse.json({ ok: true, id: inquiry.id, customerId }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/inquiries]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to submit inquiry. Please try again later." },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* GET /api/inquiries — admin: list inquiries (or ?stats=1 aggregates) */
/* ------------------------------------------------------------------ */
export async function GET(req: Request) {
  try {
    const guard = await authorizeAdmin(req, "view_customers");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    const url = new URL(req.url);
    const wantsStats = url.searchParams.get("stats") === "1";

    if (wantsStats) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        total,
        newCount,
        contacted,
        inProgress,
        closed,
        last7Days,
        groupedByService,
        subscribers,
        groupedByBudget,
        confirmedSubscribers,
        postsTotal,
        postsPublished,
        postsDraft,
        emailsSent,
        emailsLast7Days,
      ] = await Promise.all([
        db.inquiry.count(),
        db.inquiry.count({ where: { status: "new" } }),
        db.inquiry.count({ where: { status: "contacted" } }),
        db.inquiry.count({ where: { status: "in_progress" } }),
        db.inquiry.count({ where: { status: "closed" } }),
        db.inquiry.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        db.inquiry.groupBy({
          by: ["service"],
          _count: { _all: true },
        }),
        db.subscriber.count(),
        db.inquiry.groupBy({
          by: ["budget"],
          _count: { _all: true },
          where: { budget: { not: null } },
        }),
        db.subscriber.count({ where: { status: "confirmed" } }),
        db.post.count(),
        db.post.count({ where: { status: "published" } }),
        db.post.count({ where: { status: "draft" } }),
        db.emailLog.count(),
        db.emailLog.count({ where: { sentAt: { gte: sevenDaysAgo } } }),
      ]);

      const byService = groupedByService
        .map((row) => ({ service: row.service, count: row._count._all }))
        .sort((a, b) => b.count - a.count);

      const byBudget = groupedByBudget
        .map((row) => ({ budget: row.budget as string, count: row._count._all }))
        .sort((a, b) => b.count - a.count);

      return NextResponse.json({
        ok: true,
        stats: {
          total,
          new: newCount,
          contacted,
          in_progress: inProgress,
          closed,
          last7Days,
          byService,
          byBudget,
          subscribers,
          confirmedSubscribers,
          postsTotal,
          postsPublished,
          postsDraft,
          emailsSent,
          emailsLast7Days,
        },
      });
    }

    const inquiries = await db.inquiry.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, inquiries });
  } catch (err) {
    console.error("[GET /api/inquiries]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load inquiries" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* PATCH /api/inquiries — admin: update an inquiry's status            */
/* ------------------------------------------------------------------ */
export async function PATCH(req: Request) {
  try {
    const guard = await authorizeAdmin(req, "edit_customers");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Request body must be valid JSON" },
        { status: 400 }
      );
    }

    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const updated = await db.inquiry.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ ok: true, inquiry: updated });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "Inquiry not found" },
        { status: 404 }
      );
    }
    console.error("[PATCH /api/inquiries]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update inquiry" },
      { status: 500 }
    );
  }
}
