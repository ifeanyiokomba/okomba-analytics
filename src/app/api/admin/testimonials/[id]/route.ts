import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { toTestimonial } from "@/lib/testimonials";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* Validation (all fields partial for PATCH)                           */
/* ------------------------------------------------------------------ */
const patchSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name is too long").optional(),
  role: z.string().trim().min(2, "Role must be at least 2 characters").max(120, "Role is too long").optional(),
  service: z.string().trim().min(2, "Service must be at least 2 characters").max(80, "Service is too long").optional(),
  text: z.string().trim().min(20, "Quote must be at least 20 characters").max(1000, "Quote is too long").optional(),
  rating: z.coerce.number().int("Rating must be a whole number").min(1, "Rating must be at least 1 star").max(5, "Rating can be at most 5 stars").optional(),
  avatar: z
    .string()
    .trim()
    .max(300, "Avatar path is too long")
    .optional()
    .or(z.literal("")),
  status: z.enum(["draft", "published"]).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

/* ------------------------------------------------------------------ */
/* PATCH /api/admin/testimonials/[id] — update an existing testimonial */
/* Body: partial { name, role, service, text, rating, avatar,          */
/*                 status, sortOrder }                                  */
/* ------------------------------------------------------------------ */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const { id } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Request body must be valid JSON" },
        { status: 400 }
      );
    }

    // Allow the id in the body to be omitted (route param wins)
    if (body && typeof body === "object" && !("id" in body)) {
      body = { ...(body as Record<string, unknown>), id };
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid testimonial" },
        { status: 400 }
      );
    }

    const { id: _bodyId, ...updates } = parsed.data;

    const existing = await db.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Testimonial not found" },
        { status: 404 }
      );
    }

    const updated = await db.testimonial.update({
      where: { id },
      data: {
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.role !== undefined ? { role: updates.role } : {}),
        ...(updates.service !== undefined ? { service: updates.service } : {}),
        ...(updates.text !== undefined ? { text: updates.text } : {}),
        ...(updates.rating !== undefined ? { rating: updates.rating } : {}),
        ...(updates.avatar !== undefined ? { avatar: updates.avatar ? updates.avatar : null } : {}),
        ...(updates.status !== undefined ? { status: updates.status } : {}),
        ...(updates.sortOrder !== undefined ? { sortOrder: updates.sortOrder } : {}),
      },
    });

    return NextResponse.json({ ok: true, testimonial: toTestimonial(updated) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "Testimonial not found" },
        { status: 404 }
      );
    }
    console.error("[PATCH /api/admin/testimonials/[id]]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update testimonial" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* DELETE /api/admin/testimonials/[id] — remove a testimonial          */
/* ------------------------------------------------------------------ */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const { id } = await params;

    await db.testimonial.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "Testimonial not found" },
        { status: 404 }
      );
    }
    console.error("[DELETE /api/admin/testimonials/[id]]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to delete testimonial" },
      { status: 500 }
    );
  }
}
