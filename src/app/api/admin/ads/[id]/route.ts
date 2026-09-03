import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { AD_PAYMENT_STATUSES, AD_STATUSES } from "@/lib/ads";
import { notifyAdDecision } from "@/lib/notify";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* PATCH /api/admin/ads/[id] — §38/§40 admin transitions.             */
/* Status changes append to statusHistory; key transitions trigger    */
/* the §39 advertiser emails. `outboundNote` is admin-authored text  */
/* safe for the advertiser; `adminNotes` stays internal (§39).        */
/* ------------------------------------------------------------------ */

const TERMINAL = new Set(["completed", "expired", "rejected"]);
const LIVE = new Set(["active", "scheduled", "paid"]);

const bodySchema = z.object({
  status: z.enum(AD_STATUSES).optional(),
  paymentStatus: z.enum(AD_PAYMENT_STATUSES).optional(),
  amount: z.coerce.number().min(0).max(1_000_000_000).optional().nullable(),
  currency: z
    .string()
    .trim()
    .length(3)
    .optional()
    .transform((v) => (v ? v.toUpperCase() : v)),
  startAt: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : v === "" ? null : undefined)),
  endAt: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : v === "" ? null : undefined)),
  durationDays: z.coerce.number().int().min(1).max(365).optional().nullable(),
  headline: z.string().trim().max(120).optional(),
  bodyCopy: z.string().trim().max(400).optional(),
  ctaLabel: z.string().trim().max(40).optional(),
  ctaUrl: z.string().trim().url("CTA URL must be valid").max(300).optional(),
  creativeUrl: z.string().trim().url("Creative URL must be valid").max(300).optional(),
  adminNotes: z.string().trim().max(2000).optional(),
  outboundNote: z.string().trim().max(1500).optional(),
});

function parseDate(v: string | undefined | null): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "invalid" as unknown as Date; // caller validates
  return d;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminAuthorized(req))) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const { id } = await ctx.params;

    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid update" },
        { status: 422 }
      );
    }
    const body = parsed.data;
    const existing = await db.adRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Ad request not found" }, { status: 404 });
    }

    /* ── Guard: terminal states can't jump straight back to live ── */
    if (
      body.status &&
      TERMINAL.has(existing.status) &&
      LIVE.has(body.status) &&
      body.status !== existing.status
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: `Cannot move a ${existing.status} request straight to ${body.status}. Re-open it as "reviewing" first.`,
        },
        { status: 422 }
      );
    }

    /* ── Schedule guards (§42): need a window + something to show ── */
    const nextStartRaw = body.startAt !== undefined ? body.startAt : existing.startAt?.toISOString();
    const nextDuration =
      body.durationDays !== undefined && body.durationDays !== null
        ? body.durationDays
        : body.durationDays === null
          ? existing.durationDays
          : (body.durationDays ?? existing.durationDays);
    if (body.status === "scheduled") {
      if (!nextStartRaw) {
        return NextResponse.json(
          { ok: false, error: "Set a start date before scheduling" },
          { status: 422 }
        );
      }
      const d = new Date(nextStartRaw);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ ok: false, error: "Invalid start date" }, { status: 422 });
      }
      const hasCreative =
        body.creativeUrl ??
        existing.creativeUrl ??
        existing.creativeId ??
        body.headline ??
        existing.headline;
      if (!hasCreative) {
        return NextResponse.json(
          { ok: false, error: "Upload a creative or set a headline before scheduling" },
          { status: 422 }
        );
      }
    }

    /* ── Build the update ── */
    const data: Record<string, unknown> = {};

    if (body.status !== undefined && body.status !== existing.status) {
      data.status = body.status;
      data.reviewedAt = new Date();
      const history = Array.isArray(existing.statusHistory)
        ? (existing.statusHistory as { status: string; at: string; note?: string }[])
        : [];
      history.push({
        status: body.status,
        at: new Date().toISOString(),
        ...(body.adminNotes ? { note: body.adminNotes.slice(0, 200) } : {}),
      });
      data.statusHistory = history;
    }
    if (body.paymentStatus !== undefined) data.paymentStatus = body.paymentStatus;
    if (body.amount !== undefined) data.amount = body.amount;
    if (body.currency) data.currency = body.currency;
    if (body.headline !== undefined) data.headline = body.headline;
    if (body.bodyCopy !== undefined) data.bodyCopy = body.bodyCopy;
    if (body.ctaLabel !== undefined) data.ctaLabel = body.ctaLabel;
    if (body.ctaUrl !== undefined) data.ctaUrl = body.ctaUrl;
    if (body.creativeUrl !== undefined) data.creativeUrl = body.creativeUrl;
    if (body.adminNotes !== undefined) data.adminNotes = body.adminNotes;

    const startAt = parseDate(nextStartRaw);
    if (startAt === ("invalid" as unknown as Date)) {
      return NextResponse.json({ ok: false, error: "Invalid start date" }, { status: 422 });
    }
    if (startAt !== undefined) data.startAt = startAt;

    /* endAt: explicit body value wins; else derive from duration on schedule */
    if (body.endAt !== undefined) {
      const endAt = parseDate(body.endAt);
      if (endAt === ("invalid" as unknown as Date)) {
        return NextResponse.json({ ok: false, error: "Invalid end date" }, { status: 422 });
      }
      if (endAt !== undefined) data.endAt = endAt;
    } else if (body.status === "scheduled" && nextDuration && startAt) {
      const end = new Date(startAt.getTime() + nextDuration * 24 * 60 * 60 * 1000);
      data.endAt = end;
    }

    /* Approval auto-arms payment expectation (§38) */
    if (body.status === "approved" && !body.paymentStatus) {
      if (existing.paymentStatus === "unpaid") data.paymentStatus = "pending";
    }

    /* Marking paid (§40) */
    if (body.paymentStatus === "paid") {
      data.paidAt = new Date();
      if (!body.status && ["approved", "payment_pending"].includes(existing.status)) {
        data.status = "paid";
        const history = Array.isArray(existing.statusHistory)
          ? (existing.statusHistory as { status: string; at: string }[])
          : [];
        history.push({ status: "paid", at: new Date().toISOString() });
        data.statusHistory = history;
      }
    }

    const updated = await db.adRequest.update({
      where: { id },
      data,
      include: {
        attachment: { select: { id: true, url: true } },
        creative: { select: { id: true, url: true } },
      },
    });

    /* ── §39 decision emails (best-effort) ── */
    const emailRow = {
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      company: updated.company,
      email: updated.email,
      phone: updated.phone,
      whatsapp: updated.whatsapp,
      countryCode: updated.countryCode,
      websiteUrl: updated.websiteUrl,
      adType: updated.adType,
      placement: updated.placement,
      durationDays: updated.durationDays,
      budget: updated.budget,
      description: updated.description,
      amount: updated.amount,
      currency: updated.currency,
      startAt: updated.startAt,
      endAt: updated.endAt,
    };
    if (body.status === "approved" && existing.status !== "approved") {
      void notifyAdDecision(emailRow, "approved", body.outboundNote).catch(() => {});
    } else if (body.status === "awaiting_customer" && existing.status !== "awaiting_customer") {
      void notifyAdDecision(emailRow, "clarification", body.outboundNote).catch(() => {});
    } else if (body.status === "rejected" && existing.status !== "rejected") {
      void notifyAdDecision(emailRow, "rejected", body.outboundNote).catch(() => {});
    } else if (body.status === "scheduled" && existing.status !== "scheduled") {
      void notifyAdDecision(emailRow, "scheduled", body.outboundNote).catch(() => {});
    } else if (body.paymentStatus === "paid" && existing.paymentStatus !== "paid") {
      void notifyAdDecision(emailRow, "paid", body.outboundNote).catch(() => {});
    }

    return NextResponse.json({ ok: true, ad: { ...updated, amount: updated.amount?.toString() ?? null } });
  } catch (err) {
    console.error("[PATCH /api/admin/ads/:id]", err);
    return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminAuthorized(req))) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const { id } = await ctx.params;
    const existing = await db.adRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Ad request not found" }, { status: 404 });
    }
    await db.adRequest.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/ads/:id]", err);
    return NextResponse.json({ ok: false, error: "Delete failed" }, { status: 500 });
  }
}
