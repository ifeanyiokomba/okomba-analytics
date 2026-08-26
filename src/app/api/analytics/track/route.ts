import { NextResponse } from "next/server";
import {
  isAnalyticsEventType,
  recordAnalyticsEvent,
} from "@/lib/analytics-server";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* POST /api/analytics/track — public client-side event ingest (8C)     */
/* Same event names as GA4. Strict whitelist + tiny in-memory rate      */
/* limit (60 req/min/IP). GA4 itself gets the event via gtag; this      */
/* endpoint feeds our first-party AnalyticsEvent table.                 */
/* ------------------------------------------------------------------ */

const RATE_LIMIT = 60;
const WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now > h.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  h.count += 1;
  return h.count > RATE_LIMIT;
}

// opportunistic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
}, WINDOW_MS).unref?.();

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (rateLimited(ip)) {
      return NextResponse.json({ ok: false, error: "Too many events" }, { status: 429 });
    }

    const body = (await req.json().catch(() => null)) as
      | { type?: string; invoiceId?: string; secureToken?: string; sessionId?: string; meta?: Record<string, unknown> }
      | null;

    if (!body?.type || !isAnalyticsEventType(body.type)) {
      return NextResponse.json({ ok: false, error: "Unknown event type" }, { status: 400 });
    }
    // portal_visit / pdf_download are recorded server-side by the portal
    // API — accepting them here too would double-count.
    if (body.type === "portal_visit" || body.type === "pdf_download") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    await recordAnalyticsEvent({
      type: body.type,
      invoiceId: typeof body.invoiceId === "string" ? body.invoiceId : null,
      secureToken: typeof body.secureToken === "string" ? body.secureToken : null,
      sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
      meta:
        body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
          ? (body.meta as Record<string, unknown>)
          : {},
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/analytics/track]", err);
    return NextResponse.json({ ok: false, error: "Track failed" }, { status: 500 });
  }
}
