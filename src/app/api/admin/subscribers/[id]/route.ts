import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

/**
 * DELETE /api/admin/subscribers/[id] — remove a subscriber entirely.
 * Cleans up associated EmailLog rows for that subscriber.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await authorizeAdmin(undefined, "broadcast_subscribers");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    const { id } = await params;

    // Clean up any email logs referencing this subscriber (orphan prevention)
    await db.emailLog.deleteMany({ where: { subscriberId: id } });

    await db.subscriber.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "Subscriber not found" },
        { status: 404 }
      );
    }
    console.error("[DELETE /api/admin/subscribers/[id]]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to delete subscriber" },
      { status: 500 }
    );
  }
}
