import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/health — uptime-monitor endpoint (UptimeRobot / Render health check).
 * Deliberately dependency-free and instant: no DB touch, no auth.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "okomba-analytics",
    time: new Date().toISOString(),
  });
}
