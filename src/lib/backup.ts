/**
 * Daily database backup (Phase-2 Module 8B).
 *
 * Every night at 02:00 Africa/Lagos (node-cron — wired in cron.ts):
 *   1. Snapshot the SQLite database (VACUUM INTO when the sqlite3 CLI
 *      is available — safe online backup; plain file copy otherwise).
 *   2. Upload the snapshot to Google Drive when a service account +
 *      folder id are configured (hand-rolled JWT + Drive v3 — no
 *      heavyweight googleapis dependency).
 *   3. Otherwise store locally under data/backups/ with a 14-day
 *      rotation, and alert the admin.
 *   4. Every run is recorded in BackupLog (the admin Analytics tab
 *      shows the trail) — failures ALSO alert the admin by email.
 */

import { execFile } from "child_process";
import { copyFile, mkdir, readdir, stat, unlink } from "fs/promises";
import path from "path";
import { createSign } from "crypto";
import { promisify } from "util";
import { db } from "@/lib/db";
import { sendAdminAlertEmail } from "@/lib/notify";

const execFileAsync = promisify(execFile);

/* ── Configuration ────────────────────────────────────────── */

const BACKUP_DIR = path.join(process.cwd(), "data", "backups");
const LOCAL_RETENTION_DAYS = 14;

function dbFilePath(): string {
  const url = process.env.DATABASE_URL || "";
  const m = url.match(/^file:(.+?)(\?.*)?$/);
  return m?.[1] ?? path.join(process.cwd(), "db", "custom.db");
}

type DriveCreds = { client_email: string; private_key: string; folder_id: string };

function driveCredentials(): DriveCreds | null {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) return null;
  try {
    const raw =
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
      (process.env.GOOGLE_SERVICE_ACCOUNT_B64
        ? Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_B64, "base64").toString("utf8")
        : "");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { client_email?: string; private_key?: string };
    if (!parsed.client_email || !parsed.private_key) return null;
    return { client_email: parsed.client_email, private_key: parsed.private_key, folder_id: folderId };
  } catch (err) {
    console.error("[backup] invalid GOOGLE_SERVICE_ACCOUNT_JSON:", err);
    return null;
  }
}

/* ── Snapshot creation ────────────────────────────────────── */

async function sqliteBackupAvailable(): Promise<boolean> {
  try {
    await execFileAsync("sqlite3", ["-version"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Create the snapshot file and return its path. Uses `VACUUM INTO`
 * (transactionally consistent even while the app writes) when the
 * sqlite3 CLI exists, otherwise a plain copy (fine at 02:00 WAT low
 * traffic, and the DB is small).
 */
async function createSnapshot(target: string): Promise<void> {
  const source = dbFilePath();
  const hasCli = await sqliteBackupAvailable();
  if (hasCli) {
    await execFileAsync("sqlite3", [source, `VACUUM INTO '${target}'`], { timeout: 60000 });
  } else {
    await copyFile(source, target);
  }
}

/* ── Google Drive upload (no googleapis dependency) ───────── */

async function getDriveAccessToken(creds: DriveCreds): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claims = Buffer.from(
    JSON.stringify({
      iss: creds.client_email,
      scope: "https://www.googleapis.com/auth/drive.file",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  ).toString("base64url");
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(creds.private_key).toString("base64url");
  const jwt = `${header}.${claims}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`drive token: ${res.status} ${await res.text()}`);
  const j = (await res.json()) as { access_token?: string };
  if (!j.access_token) throw new Error("drive token: no access_token");
  return j.access_token;
}

async function uploadToDrive(
  creds: DriveCreds,
  filePath: string,
  fileName: string,
  mimeType: string
): Promise<string> {
  const token = await getDriveAccessToken(creds);
  const bytes = await (await import("fs/promises")).readFile(filePath);

  // Simple media upload, then attach name + parent folder.
  const up = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=media&fields=id",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": mimeType },
      body: new Uint8Array(bytes),
      signal: AbortSignal.timeout(120000),
    }
  );
  if (!up.ok) throw new Error(`drive upload: ${up.status} ${await up.text()}`);
  const { id } = (await up.json()) as { id: string };

  const meta = await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: fileName, parents: [creds.folder_id] }),
    signal: AbortSignal.timeout(20000),
  });
  if (!meta.ok) throw new Error(`drive metadata: ${meta.status} ${await meta.text()}`);

  return `https://drive.google.com/file/d/${id}/view`;
}

/* ── Local rotation ───────────────────────────────────────── */

async function rotateLocalBackups(): Promise<void> {
  try {
    const files = await readdir(BACKUP_DIR);
    const cutoff = Date.now() - LOCAL_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    for (const f of files) {
      if (!f.endsWith(".db")) continue;
      const full = path.join(BACKUP_DIR, f);
      const info = await stat(full).catch(() => null);
      if (info && info.mtimeMs < cutoff) await unlink(full).catch(() => {});
    }
  } catch {
    /* nothing to rotate yet */
  }
}

/* ── Main entry ───────────────────────────────────────────── */

export type BackupRunResult = {
  ok: boolean;
  target: "gdrive" | "local";
  fileName: string;
  sizeBytes: number;
  durationMs: number;
  driveUrl?: string;
  error?: string;
};

export async function runDbBackup(opts?: { trigger?: "cron" | "manual" }): Promise<BackupRunResult> {
  const startedAt = Date.now();
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
  const fileName = `okomba-db-${stamp}.db`;
  const creds = driveCredentials();
  const targetPath = path.join(BACKUP_DIR, fileName);
  const trigger = opts?.trigger ?? "cron";

  let sizeBytes = 0;
  let driveUrl: string | undefined;
  let failError: string | undefined;

  try {
    await mkdir(BACKUP_DIR, { recursive: true });
    await createSnapshot(targetPath);
    sizeBytes = (await stat(targetPath)).size;
  } catch (err) {
    failError = err instanceof Error ? err.message : "snapshot failed";
  }

  // ── Google Drive upload (when credentials exist) ──
  if (!failError && creds) {
    try {
      driveUrl = await uploadToDrive(creds, targetPath, fileName, "application/octet-stream");
      console.log(`[backup] ${fileName} → Google Drive (${trigger})`);
    } catch (err) {
      // Drive failed but the local snapshot exists → keep it, alert admin.
      failError = err instanceof Error ? err.message : "drive upload failed";
      console.error("[backup] drive upload failed:", failError);
    }
  }

  const durationMs = Date.now() - startedAt;
  const target: "gdrive" | "local" = creds ? "gdrive" : "local";
  const ok = !failError;

  // ── Audit row ──
  try {
    await db.backupLog.create({
      data: {
        kind: "db",
        target,
        status: ok ? "success" : "failed",
        fileName,
        sizeBytes,
        durationMs,
        error: failError ?? null,
      },
    });
  } catch (err) {
    console.error("[backup] log persist failed:", err);
  }

  if (!failError) await rotateLocalBackups();

  // ── Admin alert on failure, or first local-only run ──
  if (failError) {
    await sendAdminAlertEmail({
      key: `backup.failed.${new Date().toISOString().slice(0, 13)}`, // hourly dedupe
      subject: `Database backup FAILED — ${fileName}`,
      bodyText: [
        "The scheduled database backup did not complete cleanly.",
        "",
        `Snapshot: ${fileName}`,
        `Reason:   ${failError}`,
        "",
        sizeBytes > 0
          ? "A local snapshot WAS created under data/backups/ — verify Drive credentials."
          : "No snapshot was produced. Check disk space and DATABASE_URL.",
      ].join("\n"),
    });
  } else if (!creds) {
    await sendAdminAlertEmail({
      key: "backup.local-only",
      subject: "Backups are local-only — Google Drive not configured",
      bodyText: [
        "A database backup was created on the local disk (data/backups/),",
        "but Google Drive credentials are not set, so nothing is uploaded",
        "off-instance.",
        "",
        `Latest snapshot: ${fileName} (${Math.max(1, Math.round(sizeBytes / 1024))} KB)`,
        "",
        "Set GOOGLE_SERVICE_ACCOUNT_JSON (or GOOGLE_SERVICE_ACCOUNT_B64) and",
        "GOOGLE_DRIVE_FOLDER_ID to enable the 02:00 WAT off-site backup.",
      ].join("\n"),
    });
  }

  return { ok, target, fileName, sizeBytes, durationMs, driveUrl, error: failError };
}

/* ── Status for the admin Analytics tab ───────────────────── */

export async function backupStatus() {
  const logs = await db.backupLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return {
    configured: !!driveCredentials(),
    retentionDays: LOCAL_RETENTION_DAYS,
    logs: logs.map((l) => ({
      id: l.id,
      kind: l.kind,
      target: l.target,
      status: l.status,
      fileName: l.fileName,
      sizeBytes: l.sizeBytes,
      durationMs: l.durationMs,
      error: l.error,
      createdAt: l.createdAt.toISOString(),
    })),
  };
}
