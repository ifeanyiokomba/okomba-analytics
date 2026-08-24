import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toTestimonial } from "@/lib/testimonials";

export const runtime = "nodejs";

/**
 * GET /api/testimonials — public list of PUBLISHED testimonials,
 * ordered by sortOrder asc then createdAt desc.
 */
export async function GET() {
  try {
    const rows = await db.testimonial.findMany({
      where: { status: "published" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      ok: true,
      testimonials: rows.map(toTestimonial),
    });
  } catch (err) {
    console.error("[GET /api/testimonials]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load testimonials" },
      { status: 500 }
    );
  }
}
