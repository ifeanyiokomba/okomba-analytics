/* ─────────────────────────────────────────────────────────────
   Posts — shared types, tag (de)serialization, and seed helper.
   Phase 28: tags column is now native PostgreSQL jsonb, so we no
   longer serialize to/from JSON strings in the app — the Prisma
   client returns an already-parsed array. The helpers below still
   guard against bad shapes (null / non-array / mixed contents).
   ───────────────────────────────────────────────────────────── */

import { db } from "@/lib/db";
import { BLOG_POSTS } from "@/lib/content";

export type PostStatus = "draft" | "published";

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
export function toPost(row: {
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
}): Post {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    tags: parseTags(row.tags),
    author: row.author,
    status: (row.status === "published" ? "published" : "draft") as PostStatus,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    notifySentAt: row.notifySentAt ? row.notifySentAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
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
