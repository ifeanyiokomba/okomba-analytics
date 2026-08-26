import cron from "node-cron";

/**
 * Background jobs.
 *
 * Library choice (2026): node-cron — zero-infrastructure in-process
 * scheduling. Heavier queues (BullMQ + Redis) only pay off with
 * multi-instance deploys; this app is a single Node host (Render),
 * so node-cron is the right-sized tool.
 *
 * Jobs:
 *   1. Anti-sleep self-ping (Phase-1 Module 1) — free-tier hosts idle
 *      sleeping services; a 9-minute self-ping keeps the instance warm.
 *   2. Payment reminders (Phase-2 Module 5) — daily 09:00 Africa/Lagos.
 *      Nudges customers 3 days before due, on the due date, and 1 day
 *      overdue — email + WhatsApp, PDF re-attached every time.
 */

let started = false;

export function startCronJobs(): void {
  if (started) return;
  started = true;

  if (process.env.CRON_SELF_PING_ENABLED === "true") {
    const base =
      process.env.SELF_PING_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      `http://localhost:${process.env.PORT ?? 3000}`;
    const expr = process.env.CRON_SELF_PING_EXPR || "0 */9 * * * *"; // every 9 min
    if (!cron.validate(expr)) {
      console.error(`[cron] invalid CRON_SELF_PING_EXPR: ${expr}`);
    } else {
      cron.schedule(expr, () => {
        void pingHealthOnce(base);
      });
      console.log(`[cron] anti-sleep self-ping scheduled (${expr}) → ${base}/api/health`);
    }
  }

  /* ── Module 5: daily reminder scan, 09:00 Africa/Lagos ── */
  if (process.env.REMINDER_CRON_ENABLED !== "false") {
    const expr = process.env.REMINDER_CRON_EXPR || "0 9 * * *"; // 09:00 daily
    if (!cron.validate(expr)) {
      console.error(`[cron] invalid REMINDER_CRON_EXPR: ${expr}`);
      return;
    }
    cron.schedule(
      expr,
      async () => {
        try {
          const { runReminderScan } = await import("@/lib/reminders");
          const report = await runReminderScan({ trigger: "cron" });
          console.log(
            `[cron] reminder scan — ${report.sentCount} sent, ${report.skipped.length} skipped (${report.lagosToday})`
          );
        } catch (err) {
          console.error("[cron] reminder scan failed:", err);
        }
      },
      { timezone: "Africa/Lagos" }
    );
    console.log(`[cron] payment reminders scheduled (${expr} Africa/Lagos)`);
  }

  /* ── Module 8B: daily 02:00 WAT database backup ── */
  if (process.env.BACKUP_CRON_ENABLED !== "false") {
    const expr = process.env.BACKUP_CRON_EXPR || "0 2 * * *"; // 02:00 daily
    if (!cron.validate(expr)) {
      console.error(`[cron] invalid BACKUP_CRON_EXPR: ${expr}`);
    } else {
      cron.schedule(
        expr,
        async () => {
          try {
            const { runDbBackup } = await import("@/lib/backup");
            const r = await runDbBackup({ trigger: "cron" });
            console.log(
              `[cron] db backup — ${r.ok ? "ok" : "FAILED"} (${r.target}, ${r.fileName}, ${Math.max(1, Math.round(r.sizeBytes / 1024))} KB)`
            );
          } catch (err) {
            console.error("[cron] db backup failed:", err);
          }
        },
        { timezone: "Africa/Lagos" }
      );
      console.log(`[cron] daily db backup scheduled (${expr} Africa/Lagos)`);
    }
  }
}

/** One health ping — exported for manual verification. */
export async function pingHealthOnce(
  base?: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const target =
    (base ??
      process.env.SELF_PING_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      `http://localhost:${process.env.PORT ?? 3000}`).replace(/\/$/, "") + "/api/health";
  try {
    const res = await fetch(target, { signal: AbortSignal.timeout(10000) });
    console.log(`[cron] self-ping ${target} → ${res.status}`);
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error(
      `[cron] self-ping ${target} failed:`,
      err instanceof Error ? err.message : err
    );
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}
