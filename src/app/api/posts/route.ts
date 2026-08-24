import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedPostsIfEmpty, toPost } from "@/lib/posts";

export const runtime = "nodejs";

/**
 * GET /api/posts — public list of PUBLISHED posts.
 * Optional query params:
 *   ?slug=<slug>   → returns a single published post by slug
 *   ?limit=<n>     → cap the number returned (default 50)
 *
 * The DB is auto-seeded from BLOG_POSTS on the first call so the
 * marketing site always has content even before the admin authors any.
 */
export async function GET(req: Request) {
  try {
    // Seed (idempotent — skips slugs already present)
    await seedPostsIfEmpty();

    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 50;

    if (slug) {
      const row = await db.post.findUnique({
        where: { slug },
      });
      if (!row || row.status !== "published") {
        return NextResponse.json(
          { ok: false, error: "Post not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, post: toPost(row) });
    }

    const rows = await db.post.findMany({
      where: { status: "published" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return NextResponse.json({ ok: true, posts: rows.map(toPost) });
  } catch (err) {
    console.error("[GET /api/posts]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load posts" },
      { status: 500 }
    );
  }
}
