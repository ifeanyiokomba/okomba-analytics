import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import { retryFailedChunks } from "@/lib/import/job-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/admin/customers/import-v2/retry { jobId }
   Directive §17 — "The system must support retrying failed
   chunks." Re-runs ONLY chunks marked failed. */
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
    const result = await retryFailedChunks(body.jobId);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST import-v2/retry]", err);
    return NextResponse.json({ ok: false, error: "Retry failed" }, { status: 500 });
  }
}
