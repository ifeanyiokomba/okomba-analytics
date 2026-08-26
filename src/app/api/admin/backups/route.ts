import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { runDbBackup, backupStatus } from "@/lib/backup";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET  /api/admin/backups — backup trail (Module 8B)                   */
/* POST /api/admin/backups — run a backup now (manual trigger)          */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const status = await backupStatus();
    return NextResponse.json({ ok: true, ...status });
  } catch (err) {
    console.error("[GET /api/admin/backups]", err);
    return NextResponse.json({ ok: false, error: "Failed to load backups" }, { status: 500 });
  }
}

export async function POST() {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const result = await runDbBackup({ trigger: "manual" });
    const status = await backupStatus();
    return NextResponse.json({
      ok: result.ok,
      backup: result,
      ...status,
    });
  } catch (err) {
    console.error("[POST /api/admin/backups]", err);
    return NextResponse.json({ ok: false, error: "Backup run failed" }, { status: 500 });
  }
}
