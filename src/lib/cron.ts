import cron from "node-cron";

/**
 * Background jobs (Phase-1 Module 1).
 *
 * Library choice (2026): node-cron — zero-infrastructure in-process
 * scheduling. Heavier queues (BullMQ + Redis) only pay off with
 * multi-instance deploys; this app is a single Node host (Render),
 * so node-cron is the right-sized tool.
 *
 * Anti-sleep: free-tier hosts idle sleeping services; a 9-minute
 * self-ping keeps the instance warm. UptimeRobot (external) is the
 * belt-and-braces option — see docs/DEPLOYMENT.md.
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
      return;
    }
    cron.schedule(expr, () => {
      void pingHealthOnce(base);
    });
    console.log(`[cron] anti-sleep self-ping scheduled (${expr}) → ${base}/api/health`);
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
