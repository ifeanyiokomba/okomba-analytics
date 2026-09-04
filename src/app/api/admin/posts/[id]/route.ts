import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

/**
 * DELETE /api/admin/posts/[id] — remove a post.
 * Draft or published, both deletable.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await authorizeAdmin(undefined, "manage_posts");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    const { id } = await params;

    // Clean up any email logs referencing this post (orphan prevention)
    await db.emailLog.deleteMany({ where: { postId: id } });

    await db.post.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "Post not found" },
        { status: 404 }
      );
    }
    console.error("[DELETE /api/admin/posts/[id]]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
