import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/admin/customers/import-v2/cancel { jobId }
   Directive §16 — abort a previewed job before any DB write.
   (Jobs already importing are also checked per-chunk by the
   runner and stop cleanly at the next chunk boundary.) */
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
    if (job.status === "completed" || job.status === "cancelled") {
      return NextResponse.json({ ok: false, error: `Job already ${job.status}` }, { status: 400 });
    }
    await db.importJob.update({
      where: { id: job.id },
      data: {
        status: "cancelled",
        stage: "Cancelled by admin",
        finishedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST import-v2/cancel]", err);
    return NextResponse.json({ ok: false, error: "Cancel failed" }, { status: 500 });
  }
}
