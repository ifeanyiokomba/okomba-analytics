import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { ensureUniqueSlug, serializeTags, slugify, toPost } from "@/lib/posts";
import { notifyPostPublished } from "@/lib/notify";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */
const postSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(180, "Title is too long"),
  slug: z.string().trim().max(100, "Slug is too long").optional(),
  excerpt: z.string().trim().min(10, "Excerpt must be at least 10 characters").max(400, "Excerpt is too long"),
  content: z.string().trim().min(20, "Content must be at least 20 characters").max(50000, "Content is too long"),
  category: z.string().trim().min(2, "Category is required").max(60),
  tags: z.array(z.string().trim().max(40)).max(10, "Max 10 tags").optional(),
  author: z.string().trim().max(120).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

const patchSchema = postSchema.partial().extend({
  id: z.string().trim().min(1),
  status: z.enum(["draft", "published"]).optional(),
});

/* ------------------------------------------------------------------ */
/* GET /api/admin/posts — list ALL posts (draft + published)          */
/* Query: ?status=published|draft                                       */
/* ------------------------------------------------------------------ */
export async function GET(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");
    const where: Prisma.PostWhereInput = {};
    if (statusFilter === "draft" || statusFilter === "published") {
      where.status = statusFilter;
    }

    const rows = await db.post.findMany({
      where,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({
      ok: true,
      posts: rows.map(toPost),
    });
  } catch (err) {
    console.error("[GET /api/admin/posts]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load posts" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* POST /api/admin/posts — create a new post                          */
/* Body: { title, slug?, excerpt, content, category, tags?, author?,  */
/*        status? }                                                     */
/* If status === "published", fire subscriber email blast (async).     */
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

    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid post" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const desiredSlug = data.slug ? slugify(data.slug) : slugify(data.title);
    const finalSlug = await ensureUniqueSlug(desiredSlug);

    const isPublished = data.status === "published";
    const now = new Date();

    const created = await db.post.create({
      data: {
        title: data.title,
        slug: finalSlug,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        tags: serializeTags(data.tags ?? []),
        author: data.author ?? "OKOMBA ANALYTICS",
        status: isPublished ? "published" : "draft",
        publishedAt: isPublished ? now : null,
      },
    });

    if (isPublished) {
      // Fire-and-forget the email blast (never blocks the response)
      notifyPostPublished({
        id: created.id,
        title: created.title,
        slug: created.slug,
        excerpt: created.excerpt,
        category: created.category,
        author: created.author,
        publishedAt: created.publishedAt?.toISOString() ?? now.toISOString(),
      }).catch((err) => console.error("[post.created] notify failed:", err));
    }

    return NextResponse.json({ ok: true, post: toPost(created) }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/posts]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to create post" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* PATCH /api/admin/posts — update an existing post                   */
/* Body: { id, title?, slug?, excerpt?, content?, category?, tags?,   */
/*         author?, status? }                                          */
/* When status transitions to "published" (from draft or first time),  */
/* fire the subscriber email blast.                                     */
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

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid post" },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;

    const existing = await db.post.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Post not found" },
        { status: 404 }
      );
    }

    // Slug uniqueness check if slug is being changed
    let finalSlug = existing.slug;
    if (updates.slug && updates.slug !== existing.slug) {
      finalSlug = await ensureUniqueSlug(slugify(updates.slug), id);
    } else if (updates.title && !updates.slug) {
      // If title changed and slug wasn't explicitly provided, keep existing slug
      // (don't auto-break URLs on retitling)
    }

    const wasPublished = existing.status === "published";
    const nowPublished = updates.status === "published";
    const transitioningToPublished = !wasPublished && nowPublished;

    const updated = await db.post.update({
      where: { id },
      data: {
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.slug !== undefined ? { slug: finalSlug } : {}),
        ...(updates.excerpt !== undefined ? { excerpt: updates.excerpt } : {}),
        ...(updates.content !== undefined ? { content: updates.content } : {}),
        ...(updates.category !== undefined ? { category: updates.category } : {}),
        ...(updates.tags !== undefined ? { tags: serializeTags(updates.tags) } : {}),
        ...(updates.author !== undefined ? { author: updates.author } : {}),
        ...(updates.status !== undefined ? { status: updates.status } : {}),
        ...(transitioningToPublished ? { publishedAt: new Date() } : {}),
      },
    });

    if (transitioningToPublished) {
      notifyPostPublished({
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
        excerpt: updated.excerpt,
        category: updated.category,
        author: updated.author,
        publishedAt: updated.publishedAt?.toISOString() ?? new Date().toISOString(),
      }).catch((err) => console.error("[post.updated] notify failed:", err));
    }

    return NextResponse.json({ ok: true, post: toPost(updated) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "Post not found" },
        { status: 404 }
      );
    }
    console.error("[PATCH /api/admin/posts]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update post" },
      { status: 500 }
    );
  }
}
