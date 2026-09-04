import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import {
  attachEngagement,
  ensureUniqueSlug,
  publishDuePosts,
  serializeTags,
  slugify,
  toPost,
} from "@/lib/posts";
import { type AttachmentMeta } from "@/lib/media";
import { notifyPostPublished } from "@/lib/notify";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

// §26 SEO + §25 attachments + §28 notify + scheduling
const attachmentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: z.string().trim().min(1).max(500),
  bytes: z.number().int().min(0),
  mime: z.string().trim().min(1).max(100),
  kind: z.enum(["image", "video", "document"]),
});

const postStatusSchema = z.enum(["draft", "scheduled", "published"]);

const postSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(180, "Title is too long"),
  slug: z.string().trim().max(100, "Slug is too long").optional(),
  excerpt: z.string().trim().min(10, "Excerpt must be at least 10 characters").max(400, "Excerpt is too long"),
  content: z.string().trim().min(20, "Content must be at least 20 characters").max(50000, "Content is too long"),
  category: z.string().trim().min(2, "Category is required").max(60),
  tags: z.array(z.string().trim().max(40)).max(10, "Max 10 tags").optional(),
  author: z.string().trim().max(120).optional(),
  status: postStatusSchema.optional(),
  // ── BATCH 5 ──
  authorId: z.string().trim().min(1).nullable().optional(),
  coverImageUrl: z.string().trim().max(500).nullable().optional(),
  attachments: z.array(attachmentSchema).max(20, "Max 20 attachments").optional(),
  seoTitle: z.string().trim().max(180).nullable().optional(),
  seoDescription: z.string().trim().max(320).nullable().optional(),
  socialImageUrl: z.string().trim().max(500).nullable().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  notifyPlanned: z.boolean().optional(),
  notifySegment: z.enum(["all", "recent90"]).optional(),
});

const patchSchema = postSchema.partial().extend({
  id: z.string().trim().min(1),
});

/* ------------------------------------------------------------------ */
/* GET /api/admin/posts — list ALL posts (draft + scheduled + pub)     */
/* Query: ?status=published|draft|scheduled                            */
/* Also runs the due-publish scheduler so admin always sees fresh     */
/* state (single-process cron equivalent, §26).                        */
/* ------------------------------------------------------------------ */
export async function GET(req: Request) {
  try {
    const guard = await authorizeAdmin(req, "manage_posts");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    await publishDuePosts().catch((err) =>
      console.error("[admin/posts] scheduler failed:", err)
    );

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");
    const where: Prisma.PostWhereInput = {};
    if (statusFilter === "draft" || statusFilter === "scheduled" || statusFilter === "published") {
      where.status = statusFilter;
    }

    const rows = await db.post.findMany({
      where,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      include: { authorRef: true },
    });

    const posts = await attachEngagement(rows.map(toPost));
    return NextResponse.json({ ok: true, posts });
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
/* status: draft | scheduled (requires scheduledAt) | published.       */
/* Publishing fires the subscriber blast only when notifyPlanned      */
/* (§28 — default true for §120 backward compatibility).              */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  try {
    const guard = await authorizeAdmin(req, "manage_posts");
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

    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid post" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // §26 scheduling: a scheduled post needs a future-ish time
    if (data.status === "scheduled" && !data.scheduledAt) {
      return NextResponse.json(
        { ok: false, error: "Pick a publish date/time to schedule this post" },
        { status: 400 }
      );
    }

    // §43 author: resolve the profile (and keep the legacy author
    // string in sync for the email pipeline back-compat)
    let authorName = data.author ?? "OKOMBA ANALYTICS";
    let authorId: string | null = null;
    if (data.authorId) {
      const author = await db.postAuthor.findUnique({
        where: { id: data.authorId },
        select: { id: true, name: true, active: true },
      });
      if (!author || !author.active) {
        return NextResponse.json(
          { ok: false, error: "Selected author is not available" },
          { status: 400 }
        );
      }
      authorId = author.id;
      authorName = author.name;
    }

    const desiredSlug = data.slug ? slugify(data.slug) : slugify(data.title);
    const finalSlug = await ensureUniqueSlug(desiredSlug);

    const isPublished = data.status === "published";
    const isScheduled = data.status === "scheduled";
    const now = new Date();

    const created = await db.post.create({
      data: {
        title: data.title,
        slug: finalSlug,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        tags: serializeTags(data.tags ?? []),
        author: authorName,
        status: isPublished ? "published" : isScheduled ? "scheduled" : "draft",
        publishedAt: isPublished ? now : null,
        authorId,
        coverImageUrl: data.coverImageUrl ?? null,
        attachments: (data.attachments ?? []) satisfies AttachmentMeta[],
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        socialImageUrl: data.socialImageUrl ?? null,
        scheduledAt: isScheduled && data.scheduledAt ? new Date(data.scheduledAt) : null,
        notifyPlanned: data.notifyPlanned ?? true,
        notifySegment: data.notifySegment ?? "all",
      },
      include: { authorRef: true },
    });

    if (isPublished && created.notifyPlanned) {
      // Fire-and-forget the email blast (never blocks the response)
      notifyPostPublished(
        {
          id: created.id,
          title: created.title,
          slug: created.slug,
          excerpt: created.excerpt,
          category: created.category,
          author: created.author,
          publishedAt: created.publishedAt?.toISOString() ?? now.toISOString(),
        },
        { segment: created.notifySegment === "recent90" ? "recent90" : "all" }
      ).catch((err) => console.error("[post.created] notify failed:", err));
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
/* Transitions into "published" fire the subscriber blast when        */
/* notifyPlanned (§28). Draft → scheduled keeps it private until the  */
/* scheduler (publishDuePosts) flips it.                               */
/* ------------------------------------------------------------------ */
export async function PATCH(req: Request) {
  try {
    const guard = await authorizeAdmin(req, "manage_posts");
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

    // §26 scheduling guards
    const nextStatus = updates.status ?? existing.status;
    const nextScheduledAt = updates.scheduledAt !== undefined ? updates.scheduledAt : existing.scheduledAt?.toISOString();
    if (nextStatus === "scheduled" && !nextScheduledAt) {
      return NextResponse.json(
        { ok: false, error: "Pick a publish date/time to schedule this post" },
        { status: 400 }
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

    // §43 author resolution + legacy string sync
    let authorUpdate: Prisma.PostUpdateInput = {};
    if (updates.authorId !== undefined) {
      if (updates.authorId === null) {
        authorUpdate = { authorRef: { disconnect: true } };
        if (updates.author !== undefined) {
          authorUpdate.author = updates.author;
        }
      } else {
        const author = await db.postAuthor.findUnique({
          where: { id: updates.authorId },
          select: { id: true, name: true, active: true },
        });
        if (!author || !author.active) {
          return NextResponse.json(
            { ok: false, error: "Selected author is not available" },
            { status: 400 }
          );
        }
        authorUpdate = {
          authorRef: { connect: { id: author.id } },
          author: updates.author !== undefined ? updates.author : author.name,
        };
      }
    } else if (updates.author !== undefined) {
      authorUpdate = { author: updates.author };
    }

    const wasPublished = existing.status === "published";
    const nowPublished = updates.status === "published";
    const transitioningToPublished = !wasPublished && nowPublished;
    const nowScheduled = updates.status === "scheduled";

    const updated = await db.post.update({
      where: { id },
      data: {
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.slug !== undefined ? { slug: finalSlug } : {}),
        ...(updates.excerpt !== undefined ? { excerpt: updates.excerpt } : {}),
        ...(updates.content !== undefined ? { content: updates.content } : {}),
        ...(updates.category !== undefined ? { category: updates.category } : {}),
        ...(updates.tags !== undefined ? { tags: serializeTags(updates.tags) } : {}),
        ...(updates.coverImageUrl !== undefined ? { coverImageUrl: updates.coverImageUrl } : {}),
        ...(updates.attachments !== undefined ? { attachments: updates.attachments } : {}),
        ...(updates.seoTitle !== undefined ? { seoTitle: updates.seoTitle } : {}),
        ...(updates.seoDescription !== undefined ? { seoDescription: updates.seoDescription } : {}),
        ...(updates.socialImageUrl !== undefined ? { socialImageUrl: updates.socialImageUrl } : {}),
        ...(updates.notifyPlanned !== undefined ? { notifyPlanned: updates.notifyPlanned } : {}),
        ...(updates.notifySegment !== undefined ? { notifySegment: updates.notifySegment } : {}),
        ...(updates.status !== undefined ? { status: updates.status } : {}),
        ...(transitioningToPublished ? { publishedAt: new Date() } : {}),
        ...(nowScheduled && updates.scheduledAt
          ? { scheduledAt: new Date(updates.scheduledAt) }
          : {}),
        ...(nowScheduled && updates.scheduledAt === undefined && !existing.scheduledAt
          ? { scheduledAt: new Date() }
          : {}),
        ...authorUpdate,
      },
      include: { authorRef: true },
    });

    if (transitioningToPublished && updated.notifyPlanned) {
      notifyPostPublished(
        {
          id: updated.id,
          title: updated.title,
          slug: updated.slug,
          excerpt: updated.excerpt,
          category: updated.category,
          author: updated.author,
          publishedAt: updated.publishedAt?.toISOString() ?? new Date().toISOString(),
        },
        { segment: updated.notifySegment === "recent90" ? "recent90" : "all" }
      ).catch((err) => console.error("[post.updated] notify failed:", err));
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
