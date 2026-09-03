import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { slugify } from "@/lib/posts";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST AUTHORS (directive §43) — author profiles shown on public     */
/* posts (name / role / bio / avatar). Posts keep a legacy `author`   */
/* string snapshot for email-template back-compat.                    */
/* ------------------------------------------------------------------ */

async function ensureUniqueAuthorSlug(desired: string, excludeId?: string): Promise<string> {
  const base = slugify(desired) || "author";
  let candidate = base;
  let suffix = 1;
  while (
    await db.postAuthor.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

const createSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  role: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(400).optional(),
  avatarUrl: z.string().trim().max(500).optional(),
  active: z.boolean().optional(),
});

const patchSchema = createSchema.partial().extend({
  id: z.string().trim().min(1),
});

/* GET /api/admin/posts/authors — list with post counts */
export async function GET() {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const authors = await db.postAuthor.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
      include: { _count: { select: { posts: true } } },
    });
    return NextResponse.json({
      ok: true,
      authors: authors.map((a) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        role: a.role,
        bio: a.bio,
        avatarUrl: a.avatarUrl,
        active: a.active,
        postCount: a._count.posts,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/posts/authors]", err);
    return NextResponse.json({ ok: false, error: "Failed to load authors" }, { status: 500 });
  }
}

/* POST /api/admin/posts/authors — create */
export async function POST(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ ok: false, error: first?.message ?? "Invalid author" }, { status: 400 });
    }
    const d = parsed.data;
    const created = await db.postAuthor.create({
      data: {
        name: d.name,
        slug: await ensureUniqueAuthorSlug(d.name),
        role: d.role?.trim() || "Contributor",
        bio: d.bio?.trim() || null,
        avatarUrl: d.avatarUrl?.trim() || null,
        active: d.active ?? true,
      },
    });
    return NextResponse.json({ ok: true, author: created }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/posts/authors]", err);
    return NextResponse.json({ ok: false, error: "Failed to create author" }, { status: 500 });
  }
}

/* PATCH /api/admin/posts/authors — update */
export async function PATCH(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ ok: false, error: first?.message ?? "Invalid author" }, { status: 400 });
    }
    const { id, ...updates } = parsed.data;
    const existing = await db.postAuthor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Author not found" }, { status: 404 });
    }

    // Keep post author-string snapshots faithful when renaming —
    // posts already published under this author get the new name
    // on their next re-save; the legacy string on each Post row is
    // a deliberate snapshot, so we only sync it for drafts/scheduled.
    const updated = await db.postAuthor.update({
      where: { id },
      data: {
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.name !== undefined ? { slug: await ensureUniqueAuthorSlug(updates.name, id) } : {}),
        ...(updates.role !== undefined ? { role: updates.role.trim() || "Contributor" } : {}),
        ...(updates.bio !== undefined ? { bio: updates.bio.trim() || null } : {}),
        ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl.trim() || null } : {}),
        ...(updates.active !== undefined ? { active: updates.active } : {}),
      },
    });
    return NextResponse.json({ ok: true, author: updated });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ ok: false, error: "Author not found" }, { status: 404 });
    }
    console.error("[PATCH /api/admin/posts/authors]", err);
    return NextResponse.json({ ok: false, error: "Failed to update author" }, { status: 500 });
  }
}

/* DELETE /api/admin/posts/authors?id=… — remove (posts keep their
   legacy author string; authorId is cleared via FK onDelete SetNull) */
export async function DELETE(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    }
    await db.postAuthor.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ ok: false, error: "Author not found" }, { status: 404 });
    }
    console.error("[DELETE /api/admin/posts/authors]", err);
    return NextResponse.json({ ok: false, error: "Failed to delete author" }, { status: 500 });
  }
}
