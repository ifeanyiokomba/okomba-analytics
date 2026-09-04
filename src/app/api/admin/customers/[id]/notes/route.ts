import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* POST /api/admin/customers/[id]/notes                                */
/*   Add an internal note to a customer's CRM trail. The note is       */
/*   surfaced in the customer timeline (kind=note) and counted in       */
/*   the stats.                                                         */
/* ------------------------------------------------------------------ */

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await authorizeAdmin(req, "edit_customers");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }
    const { id } = await params;
    const body = (await req.json()) as { body: string; context?: string };
    if (!body.body || body.body.trim().length < 2) {
      return NextResponse.json({ ok: false, error: "Note body is empty" }, { status: 400 });
    }

    const c = await db.customer.findUnique({ where: { id } });
    if (!c) {
      return NextResponse.json({ ok: false, error: "Customer not found" }, { status: 404 });
    }

    const note = await db.customerNote.create({
      data: {
        customerId: c.id,
        author: "admin",
        body: body.body.trim(),
        context: body.context?.trim() || null,
      },
    });

    // Refresh the customer's lastContactAt so the list view updates
    await db.customer.update({
      where: { id: c.id },
      data: { lastContactAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      note: {
        id: note.id,
        body: note.body,
        context: note.context,
        author: note.author,
        createdAt: note.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[POST /api/admin/customers/[id]/notes]", err);
    return NextResponse.json({ ok: false, error: "Failed to add note" }, { status: 500 });
  }
}
