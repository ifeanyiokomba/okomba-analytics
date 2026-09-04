import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { authorizeAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/admin/backups/[fileName]/download                          */
/*   Streams the named backup file to the admin as an attachment.      */
/*   Verifies the fileName matches a logged BackupLog row so an        */
/*   authenticated admin can't be tricked into streaming arbitrary     */
/*   files off the disk.                                               */
/* ------------------------------------------------------------------ */

const BACKUP_DIR = path.join(process.cwd(), "data", "backups");

// Hard whitelist — only the chars that ever appear in our generated names.
const SAFE_NAME = /^okomba-db-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.db$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    const guard = await authorizeAdmin(undefined, "manage_settings");
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }
    const { fileName } = await params;
    if (!SAFE_NAME.test(fileName)) {
      return NextResponse.json({ ok: false, error: "Invalid file name" }, { status: 400 });
    }

    // Cross-check the BackupLog table — only allow downloads of recorded runs.
    const log = await db.backupLog.findFirst({
      where: { fileName, status: "success" },
      orderBy: { createdAt: "desc" },
    });
    if (!log) {
      return NextResponse.json(
        { ok: false, error: "Backup record not found" },
        { status: 404 }
      );
    }

    const fullPath = path.join(BACKUP_DIR, fileName);
    // Path-traversal guard: the resolved path MUST sit inside BACKUP_DIR.
    if (!fullPath.startsWith(BACKUP_DIR + path.sep) && fullPath !== BACKUP_DIR) {
      return NextResponse.json({ ok: false, error: "Invalid path" }, { status: 400 });
    }

    const buf = await readFile(fullPath);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(buf.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/backups/[fileName]/download]", err);
    return NextResponse.json(
      { ok: false, error: "Download failed" },
      { status: 500 }
    );
  }
}
