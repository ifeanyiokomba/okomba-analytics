import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { notifyNewInquiry } from "@/lib/notify";

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

const inquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .pipe(z.email("Please provide a valid email address")),
  phone: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(30, "Phone must be at most 30 characters").optional()
  ),
  whatsapp: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(30, "WhatsApp must be at most 30 characters").optional()
  ),
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

    const inquiry = await db.inquiry.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
        whatsapp: parsed.data.whatsapp ?? null,
        service: parsed.data.service,
        addlService: parsed.data.addlService ?? null,
        budget: parsed.data.budget ?? null,
        message: parsed.data.message,
        status: "new",
      },
    });

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

    return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 });
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
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false }, { status: 401 });
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
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false }, { status: 401 });
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
