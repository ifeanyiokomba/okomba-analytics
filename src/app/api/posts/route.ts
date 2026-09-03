import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attachEngagement, publishDuePosts, seedPostsIfEmpty, toPost } from "@/lib/posts";

export const runtime = "nodejs";

/**
 * GET /api/posts — public list of PUBLISHED posts.
 * Optional query params:
 *   ?slug=<slug>   → returns a single published post by slug
 *   ?limit=<n>     → cap the number returned (default 50)
 *
 * The DB is auto-seeded from BLOG_POSTS on the first call so the
 * marketing site always has content even before the admin authors any.
 *
 * BATCH 5 (§23/§24/§26/§43): the response now carries engagement
 * totals (commentCount/reactionCount for cards), author profiles,
 * cover/attachments and SEO metadata. The due-publish scheduler
 * runs here as well, so scheduled posts flip public exactly on time
 * even without an admin session open.
 */
export async function GET(req: Request) {
  try {
    // Seed (idempotent — skips slugs already present)
    await seedPostsIfEmpty();

    // §26 scheduled publishing (idempotent, race-safe)
    await publishDuePosts().catch((err) =>
      console.error("[posts] scheduler failed:", err)
    );

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
        include: { authorRef: true },
      });
      if (!row || row.status !== "published") {
        return NextResponse.json(
          { ok: false, error: "Post not found" },
          { status: 404 }
        );
      }
      const [post] = await attachEngagement([toPost(row)]);
      return NextResponse.json({ ok: true, post });
    }

    const rows = await db.post.findMany({
      where: { status: "published" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: { authorRef: true },
    });

    const posts = await attachEngagement(rows.map(toPost));
    return NextResponse.json({ ok: true, posts });
  } catch (err) {
    console.error("[GET /api/posts]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load posts" },
      { status: 500 }
    );
  }
}
