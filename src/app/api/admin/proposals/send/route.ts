import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { isProposalDraftValid } from "@/lib/proposal";
import { sendProposal } from "@/lib/invoice-service";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/admin/proposals/send                                      */
/* Body: { inquiryId, proposal, amountNaira, durationLabel?,           */
/*         dueDate?, description? }                                    */
/* → invoice number + Paystack DVA + branded PDF + email w/ attachment */
/*   + reminder events + WhatsApp caption queue.                       */
/* ------------------------------------------------------------------ */

const proposalShape = z.object({
  executiveSummary: z.string().min(1).max(4000),
  objectives: z.array(z.string().min(1).max(500)).max(10),
  scope: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        items: z.array(z.string().min(1).max(500)).max(10),
      })
    )
    .max(8),
  deliverables: z.array(z.string().min(1).max(300)).max(12),
  timeline: z
    .array(
      z.object({
        phase: z.string().min(1).max(80),
        duration: z.string().min(1).max(60),
        focus: z.string().min(1).max(300),
      })
    )
    .max(8),
  terms: z.array(z.string().min(1).max(400)).max(10),
});

const schema = z.object({
  inquiryId: z.string().min(1),
  proposal: proposalShape,
  amountNaira: z.coerce.number().int().min(1, "Amount must be at least \u20A61").max(2_000_000_000),
  durationLabel: z.string().trim().max(60).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  draftProposalId: z.string().optional(), // Module 7: mark the AI-chat draft as sent
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
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid proposal payload" },
        { status: 400 }
      );
    }

    const d = parsed.data;
    if (!isProposalDraftValid(d.proposal)) {
      return NextResponse.json({ ok: false, error: "Malformed proposal" }, { status: 400 });
    }

    let dueDate: Date | null = null;
    if (d.dueDate) {
      const t = new Date(d.dueDate).getTime();
      if (Number.isNaN(t)) {
        return NextResponse.json({ ok: false, error: "Invalid due date" }, { status: 400 });
      }
      dueDate = new Date(t);
      if (dueDate.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
        return NextResponse.json(
          { ok: false, error: "Due date cannot be in the past" },
          { status: 400 }
        );
      }
    }

    const result = await sendProposal({
      inquiryId: d.inquiryId,
      proposal: d.proposal,
      amountNaira: d.amountNaira,
      durationLabel: d.durationLabel || null,
      dueDate,
      description: d.description || null,
    });

    // Module 7: the AI-chat draft this proposal came from is now sent
    if (result.ok && d.draftProposalId) {
      await db.draftProposal
        .update({ where: { id: d.draftProposalId }, data: { status: "sent" } })
        .catch(() => {});
    }

    const status = result.ok ? 200 : 502;
    return NextResponse.json(result, { status });
  } catch (err) {
    console.error("[POST /api/admin/proposals/send]", err);
    return NextResponse.json(
      { ok: false, error: "Proposal send failed" },
      { status: 500 }
    );
  }
}
