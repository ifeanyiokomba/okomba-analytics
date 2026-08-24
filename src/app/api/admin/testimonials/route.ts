import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { toTestimonial } from "@/lib/testimonials";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */
const testimonialSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name is too long"),
  role: z.string().trim().min(2, "Role must be at least 2 characters").max(120, "Role is too long"),
  service: z.string().trim().min(2, "Service must be at least 2 characters").max(80, "Service is too long"),
  text: z.string().trim().min(20, "Quote must be at least 20 characters").max(1000, "Quote is too long"),
  rating: z.coerce.number().int("Rating must be a whole number").min(1, "Rating must be at least 1 star").max(5, "Rating can be at most 5 stars"),
  avatar: z
    .string()
    .trim()
    .max(300, "Avatar path is too long")
    .optional()
    .or(z.literal("")),
  status: z.enum(["draft", "published"]).optional(),
  sortOrder: z.coerce.number().int().default(0),
});

/* ------------------------------------------------------------------ */
/* GET /api/admin/testimonials — list ALL testimonials (draft + pub)   */
/* Query: ?status=published|draft                                       */
/* ------------------------------------------------------------------ */
export async function GET(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");
    const where: Prisma.TestimonialWhereInput = {};
    if (statusFilter === "draft" || statusFilter === "published") {
      where.status = statusFilter;
    }

    const rows = await db.testimonial.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      ok: true,
      testimonials: rows.map(toTestimonial),
    });
  } catch (err) {
    console.error("[GET /api/admin/testimonials]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load testimonials" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* POST /api/admin/testimonials — create a new testimonial             */
/* Body: { name, role, service, text, rating, avatar?, status?,        */
/*         sortOrder? }                                                */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
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

    const parsed = testimonialSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid testimonial" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const created = await db.testimonial.create({
      data: {
        name: data.name,
        role: data.role,
        service: data.service,
        text: data.text,
        rating: data.rating,
        avatar: data.avatar ? data.avatar : null,
        status: data.status ?? "published",
        sortOrder: data.sortOrder,
      },
    });

    return NextResponse.json(
      { ok: true, testimonial: toTestimonial(created) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/testimonials]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to create testimonial" },
      { status: 500 }
    );
  }
}
