import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { approveAndImport } from "@/lib/import/job-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/admin/customers/import-v2/approve { jobId }
   Directive §16 — the admin confirmation gate. No DB write happens
   before this. Kicks off the chunked background import. */
export async function POST(req: Request) {
  try {
    const guard = await authorizeAdmin(req, "import_customers");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }
    const body = (await req.json().catch(() => null)) as { jobId?: string } | null;
    if (!body?.jobId) {
      return NextResponse.json({ ok: false, error: "Missing jobId" }, { status: 400 });
    }
    const job = await db.importJob.findUnique({ where: { id: body.jobId } });
    if (!job) {
      return NextResponse.json({ ok: false, error: "Import job not found" }, { status: 404 });
    }
    if (job.status !== "awaiting_approval") {
      return NextResponse.json(
        { ok: false, error: `Job is ${job.status.replace("_", " ")} — only previewed jobs can be approved` },
        { status: 400 }
      );
    }
    await db.importJob.update({
      where: { id: job.id },
      data: { approvedAt: new Date() },
    });
    approveAndImport(job.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST import-v2/approve]", err);
    return NextResponse.json({ ok: false, error: "Approve failed" }, { status: 500 });
  }
}
