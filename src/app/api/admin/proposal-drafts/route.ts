import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* /api/admin/proposal-drafts                                          */
/*   GET    — list draft proposals (AI-chat leads appear in the       */
/*            Proposals tab, ready to review & send)                   */
/*   DELETE — discard a draft (body { id })                             */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const drafts = await db.draftProposal.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({
      ok: true,
      drafts: drafts.map((d) => ({
        id: d.id,
        source: d.source,
        customerName: d.customerName,
        customerEmail: d.customerEmail,
        service: d.service,
        leadScore: d.leadScore,
        inquiryId: d.inquiryId,
        receivedEmailId: d.receivedEmailId,
        status: d.status,
        createdAt: d.createdAt.toISOString(),
        draft: (d.draftJson && typeof d.draftJson === "object") ? d.draftJson : {},
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/proposal-drafts]", err);
    return NextResponse.json({ ok: false, error: "Failed to load drafts" }, { status: 500 });
  }
}

const delSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: Request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => null);
    const parsed = delSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    }
    await db.draftProposal.update({
      where: { id: parsed.data.id },
      data: { status: "discarded" },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/proposal-drafts]", err);
    return NextResponse.json({ ok: false, error: "Failed to discard draft" }, { status: 500 });
  }
}
