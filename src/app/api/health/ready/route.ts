import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/health/ready — readiness probe (deep dependency check).   */
/*                                                                     */
/* Separate from /api/health (liveness). Liveness returns 200 the      */
/* instant the process is up — useful for "is the server alive?".     */
/* Readiness touches every critical dependency and returns 503 if     */
/* any of them is broken — useful for "can the server actually        */
/* serve traffic right now?".                                          */
/*                                                                     */
/* Render / UptimeRobot should probe /api/health for uptime;          */
/* orchestration systems (Kubernetes, ECS) should probe                */
/* /api/health/ready before routing traffic to this instance.         */
/* ------------------------------------------------------------------ */

type Check = { name: string; ok: boolean; latencyMs?: number; error?: string };

async function checkDatabase(): Promise<Check> {
  const t0 = Date.now();
  try {
    // 1-round-trip SELECT 1 — if Prisma can't answer this, the DB is
    // down OR the connection pool is exhausted. Either way the
    // instance cannot serve customers.
    await db.$queryRaw`SELECT 1`;
    return { name: "database", ok: true, latencyMs: Date.now() - t0 };
  } catch (err) {
    return {
      name: "database",
      ok: false,
      latencyMs: Date.now() - t0,
      error: err instanceof Error ? err.message : "database unreachable",
    };
  }
}

function checkEnvConfig(): Check {
  // Verifies that the absolute-minimum production env vars are present.
  // We don't check optional vars (Paystack, Cloudinary, etc.) because
  // those degrade gracefully — a missing required var is the only
  // readiness-blocking config issue.
  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.ADMIN_EMAIL) missing.push("ADMIN_EMAIL");
  if (!process.env.ADMIN_PASSWORD) missing.push("ADMIN_PASSWORD");
  return {
    name: "env",
    ok: missing.length === 0,
    error: missing.length > 0 ? `missing required vars: ${missing.join(", ")}` : undefined,
  };
}

export async function GET() {
  const checks = await Promise.all([checkDatabase(), checkEnvConfig()]);
  const allOk = checks.every((c) => c.ok);
  const body = {
    ok: allOk,
    service: "okomba-analytics",
    probe: "readiness",
    time: new Date().toISOString(),
    checks,
  };
  return NextResponse.json(body, { status: allOk ? 200 : 503 });
}
