import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { generateProposalDraft } from "@/lib/proposal";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/admin/proposals/generate                                  */
/* Body: { inquiryId }                                                 */
/* → AI-drafted proposal sections (admin reviews/edits before send).   */
/* The AI NEVER drafts commercial terms — price is set separately.     */
/* ------------------------------------------------------------------ */

const schema = z.object({
  inquiryId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const guard = await authorizeAdmin(req, "create_invoices");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "inquiryId is required" }, { status: 400 });
    }

    const inquiry = await db.inquiry.findUnique({
      where: { id: parsed.data.inquiryId },
    });
    if (!inquiry) {
      return NextResponse.json({ ok: false, error: "Inquiry not found" }, { status: 404 });
    }

    const { draft, usedFallback } = await generateProposalDraft({
      name: inquiry.name,
      service: inquiry.service,
      addlService: inquiry.addlService,
      message: inquiry.message,
      budget: inquiry.budget,
    });

    return NextResponse.json({
      ok: true,
      proposal: draft,
      usedFallback,
    });
  } catch (err) {
    console.error("[POST /api/admin/proposals/generate]", err);
    return NextResponse.json(
      { ok: false, error: "Proposal generation failed" },
      { status: 500 }
    );
  }
}
