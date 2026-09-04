import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import { runReminderScan, previewTodayReminders } from "@/lib/reminders";

export const runtime = "nodejs";
export const maxDuration = 120;

/* ------------------------------------------------------------------ */
/* Module 5 — manual reminder triggers (admin only).                   */
/*                                                                     */
/*   GET  /api/admin/reminders/run  → preview what would fire today    */
/*   POST /api/admin/reminders/run  → run the scan NOW                 */
/*        body: { dryRun?: boolean }                                   */
/*                                                                     */
/* The cron job runs the same scan daily at 09:00 Africa/Lagos; this   */
/* endpoint exists for testing and catch-up sends.                     */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const guard = await authorizeAdmin(undefined, "view_dashboard");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }
    const preview = await previewTodayReminders();
    return NextResponse.json({ ok: true, ...preview });
  } catch (err) {
    console.error("[GET /api/admin/reminders/run]", err);
    return NextResponse.json({ ok: false, error: "Preview failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const guard = await authorizeAdmin(undefined, "manage_settings");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }
    let dryRun = false;
    try {
      const body = (await req.json()) as { dryRun?: boolean };
      dryRun = body?.dryRun === true;
    } catch {
      /* no body → real run */
    }

    const report = await runReminderScan({ trigger: "manual", dryRun });
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error("[POST /api/admin/reminders/run]", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Scan failed" },
      { status: 500 }
    );
  }
}
