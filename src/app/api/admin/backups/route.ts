import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import { runDbBackup, backupStatus } from "@/lib/backup";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* GET  /api/admin/backups — backup trail (Module 8B)                   */
/* POST /api/admin/backups — run a backup now (manual trigger)          */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const guard = await authorizeAdmin(undefined, "manage_settings");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
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
    const guard = await authorizeAdmin(undefined, "manage_settings");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
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
