import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeAdmin } from "@/lib/admin-auth";
import { runAutonomousWorkflow } from "@/lib/ai-workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/* ------------------------------------------------------------------ */
/* POST /api/admin/ai/workflow/run — §54 manual autonomous-workflow    */
/* trigger. Body {inquiryId}; synchronous run → the step-by-step       */
/* report (for E2E + the admin "run now" action). 404 when the        */
/* inquiry does not exist. access_ai-gated.                           */
/* ------------------------------------------------------------------ */

const schema = z.object({
  inquiryId: z.string().trim().min(1, "inquiryId is required"),
});

export async function POST(req: Request) {
  const guard = await authorizeAdmin(req, "access_ai");
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: first?.message ?? "Invalid request" },
        { status: 422 }
      );
    }

    const inquiry = await db.inquiry.findUnique({
      where: { id: parsed.data.inquiryId },
      select: { id: true },
    });
    if (!inquiry) {
      return NextResponse.json({ ok: false, error: "Inquiry not found" }, { status: 404 });
    }

    const report = await runAutonomousWorkflow({
      inquiryId: inquiry.id,
      trigger: "admin",
    });
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error("[POST /api/admin/ai/workflow/run]", err);
    return NextResponse.json({ ok: false, error: "Workflow run failed" }, { status: 500 });
  }
}
