/**
 * Next.js instrumentation — runs once when the server process boots.
 * Starts background jobs (anti-sleep self-ping) on the Node runtime.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCronJobs } = await import("@/lib/cron");
    startCronJobs();
  }
}
