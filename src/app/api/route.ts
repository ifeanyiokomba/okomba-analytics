import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api — lightweight health check for uptime monitoring.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "okomba-analytics",
    time: new Date().toISOString(),
  });
}
