import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toCourseCardDto } from "@/lib/learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/learning/courses — §64 PUBLIC catalogue (no auth).         */
/* Published courses only, ordered by sortOrder → createdAt, each     */
/* with moduleCount / lessonCount / totalMinutes / level / price.     */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const courses = await db.course.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        level: true,
        coverEmoji: true,
        coverUrl: true,
        priceNgn: true,
        modules: { select: { lessons: { select: { durationMinutes: true } } } },
      },
    });

    return NextResponse.json({ ok: true, courses: courses.map(toCourseCardDto) });
  } catch (err) {
    console.error("[GET /api/learning/courses]", err);
    return NextResponse.json({ ok: false, error: "Could not load the course catalogue" }, { status: 500 });
  }
}
