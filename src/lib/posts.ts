/* ─────────────────────────────────────────────────────────────
   Posts — shared types, tag (de)normalization, slug helpers,
   scheduled-publishing scheduler, and engagement aggregation.

   Phase 28: tags column is native PostgreSQL jsonb — the Prisma
   client returns an already-parsed array; helpers still guard
   against bad shapes.

   BATCH 5 (directive §25/§26/§28/§43): the Post type now carries
   author profiles, cover/attachments, SEO metadata, scheduling
   and notify planning. `publishDuePosts()` is the idempotent
   scheduler that flips due scheduled posts to published (called
   from the public and admin list routes — background-worker
   equivalent for the single-process deployment).
   ───────────────────────────────────────────────────────────── */

import { db } from "@/lib/db";
import { BLOG_POSTS } from "@/lib/content";
import { parseAttachments, type AttachmentMeta } from "@/lib/media-shared";
import { notifyPostPublished } from "@/lib/notify";

export type PostStatus = "draft" | "scheduled" | "published";

export type AuthorProfile = {
  id: string;
  name: string;
  slug: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  status: PostStatus;
  publishedAt: string | null;
  notifySentAt: string | null;
  createdAt: string;
  updatedAt: string;
  // ── BATCH 5 ──
  authorId: string | null;
  authorProfile: AuthorProfile | null;
  coverImageUrl: string | null;
  attachments: AttachmentMeta[];
  seoTitle: string | null;
  seoDescription: string | null;
  socialImageUrl: string | null;
  scheduledAt: string | null;
  notifyPlanned: boolean;
  notifySegment: "all" | "recent90";
  // engagement (present on list/detail responses)
  commentCount?: number;
  reactionCount?: number;
};

export type NewPostInput = {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  category: string;
  tags?: string[];
  author?: string;
  status?: PostStatus;
  publishedAt?: string | null;
  authorId?: string | null;
  coverImageUrl?: string | null;
  attachments?: AttachmentMeta[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  socialImageUrl?: string | null;
  scheduledAt?: string | null;
  notifyPlanned?: boolean;
  notifySegment?: "all" | "recent90";
};

/* ── Tag (de)normalization (Phase 28: tags column is Json array) ── */
export function parseTags(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  // Backwards-compat: if an old row slipped through as a JSON string,
  // try to parse it.
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((t): t is string => typeof t === "string")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    } catch {
      return raw.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }
  return [];
}

export function serializeTags(tags: string[] | null | undefined): string[] {
  return (tags ?? [])
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter(Boolean);
}

/* ── Map a DB row to a typed Post (for API responses) ────── */
type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: unknown; // Phase 28: jsonb column → already-parsed array
  author: string;
  status: string;
  publishedAt: Date | null;
  notifySentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: string | null;
  coverImageUrl: string | null;
  attachments: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  socialImageUrl: string | null;
  scheduledAt: Date | null;
  notifyPlanned: boolean;
  notifySegment: string;
  authorRef?: {
    id: string;
    name: string;
    slug: string;
    role: string;
    bio: string | null;
    avatarUrl: string | null;
  } | null;
};

export function toPost(row: PostRow): Post {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    tags: parseTags(row.tags),
    author: row.author,
    status: (row.status === "published"
      ? "published"
      : row.status === "scheduled"
        ? "scheduled"
        : "draft") as PostStatus,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    notifySentAt: row.notifySentAt ? row.notifySentAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    authorId: row.authorId,
    authorProfile: row.authorRef
      ? {
          id: row.authorRef.id,
          name: row.authorRef.name,
          slug: row.authorRef.slug,
          role: row.authorRef.role,
          bio: row.authorRef.bio,
          avatarUrl: row.authorRef.avatarUrl,
        }
      : null,
    coverImageUrl: row.coverImageUrl,
    attachments: parseAttachments(row.attachments),
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    socialImageUrl: row.socialImageUrl,
    scheduledAt: row.scheduledAt ? row.scheduledAt.toISOString() : null,
    notifyPlanned: row.notifyPlanned,
    notifySegment: row.notifySegment === "recent90" ? "recent90" : "all",
  };
}

/* ── Slugify (kebab case) ─────────────────────────────────── */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/* ── Ensure a unique slug against existing posts ──────────── */
export async function ensureUniqueSlug(
  desired: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(desired) || "untitled";
  let candidate = base;
  let suffix = 1;
  // Loop until we find a slug not in use (excluding the post being edited)
  while (
    await db.post.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    })
  ) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

/* ── Engagement aggregation (§23/§24 counts for cards) ────── */

/** Attach approved-comment + reaction totals to a list of posts. */
export async function attachEngagement(posts: Post[]): Promise<Post[]> {
  if (posts.length === 0) return posts;
  const ids = posts.map((p) => p.id);

  const [commentGroups, reactionGroups] = await Promise.all([
    db.comment.groupBy({
      by: ["postId"],
      where: { postId: { in: ids }, status: "approved" },
      _count: { id: true },
    }),
    db.reaction.groupBy({
      by: ["postId"],
      where: { postId: { in: ids } },
      _count: { id: true },
    }),
  ]);

  const commentMap = new Map(commentGroups.map((g) => [g.postId, g._count.id]));
  const reactionMap = new Map(reactionGroups.map((g) => [g.postId, g._count.id]));

  return posts.map((p) => ({
    ...p,
    commentCount: commentMap.get(p.id) ?? 0,
    reactionCount: reactionMap.get(p.id) ?? 0,
  }));
}

/* ── Scheduled publishing (§26) ───────────────────────────── */

/**
 * Publish every scheduled post whose time has come. Idempotent and
 * race-safe: the status flip is a conditional updateMany, and the
 * subscriber blast only fires for the request that actually won the
 * flip (updated count === 1). Called from the public and admin post
 * list routes — the single-process equivalent of a cron worker.
 */
export async function publishDuePosts(): Promise<number> {
  const now = new Date();
  const due = await db.post.findMany({
    where: { status: "scheduled", scheduledAt: { lte: now } },
    select: { id: true, notifyPlanned: true, notifySegment: true },
  });
  if (due.length === 0) return 0;

  let published = 0;
  for (const p of due) {
    const updated = await db.post.updateMany({
      where: { id: p.id, status: "scheduled" },
      data: { status: "published", publishedAt: now },
    });
    if (updated.count !== 1) continue; // someone else flipped it first
    published += 1;

    if (p.notifyPlanned) {
      const row = await db.post.findUnique({
        where: { id: p.id },
        select: {
          id: true, title: true, slug: true, excerpt: true,
          category: true, author: true, publishedAt: true,
        },
      });
      if (row) {
        notifyPostPublished(
          {
            id: row.id,
            title: row.title,
            slug: row.slug,
            excerpt: row.excerpt,
            category: row.category,
            author: row.author,
            publishedAt: row.publishedAt?.toISOString() ?? now.toISOString(),
          },
          { segment: p.notifySegment === "recent90" ? "recent90" : "all" }
        ).catch((err) => console.error("[publishDuePosts] notify failed:", err));
      }
    }
  }
  return published;
}

/* ── One-time seed: pull the static BLOG_POSTS into the DB ── */
/* Idempotent — only seeds posts whose slug is missing. Safe to call
   on every cold start of the public GET route. */
let seedPromise: Promise<void> | null = null;

export function seedPostsIfEmpty(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        const existingSlugs = new Set(
          (await db.post.findMany({ select: { slug: true } })).map((p) => p.slug)
        );

        const missing = BLOG_POSTS.filter((p) => !existingSlugs.has(p.slug));
        if (missing.length === 0) return;

        await Promise.all(
          missing.map((p) =>
            db.post.create({
              data: {
                title: p.title,
                slug: p.slug,
                excerpt: p.excerpt,
                content: p.content,
                category: p.category,
                tags: serializeTags(p.tags),
                author: p.author,
                status: "published",
                publishedAt: new Date(p.date),
              },
            })
          )
        );
      } catch (err) {
        // Reset so a future request can retry
        seedPromise = null;
        console.error("[seedPostsIfEmpty] failed:", err);
      }
    })();
  }
  return seedPromise;
}
