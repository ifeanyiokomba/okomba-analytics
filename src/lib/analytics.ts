/**
 * GA4 + dataLayer client analytics helper (Phase-2 Module 8C).
 *
 * Usage:  import { trackEvent } from "@/lib/analytics"; trackEvent("pdf_download", { ... })
 *
 * - Pushes to window.dataLayer AND calls gtag() when GA4 is configured
 *   (NEXT_PUBLIC_GA4_MEASUREMENT_ID set). In the dev sandbox with no
 *   GA4 property, the dataLayer still receives the event and a
 *   console trace is logged — harmless and inspectable.
 * - Server-side first-party recording (AnalyticsEvent table) is done
 *   by the relevant API routes (portal, ai/chat) OR by POSTing to
 *   /api/analytics/track for client-only events (proposal_view,
 *   payment_click, ai_chat_start).
 */

export const GA4_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsClientEvent =
  | "ai_chat_start"
  | "portal_visit"
  | "proposal_view"
  | "pdf_download"
  | "payment_click"
  | "payment_proof_uploaded";

export function isGa4Enabled(): boolean {
  return (
    typeof window !== "undefined" &&
    !!GA4_MEASUREMENT_ID &&
    typeof window.gtag === "function"
  );
}

/** Fire a GA4 event. Never throws. */
export function trackEvent(
  name: AnalyticsClientEvent,
  params: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...params });
    if (isGa4Enabled()) {
      window.gtag!("event", name, params);
    } else {
      // dev trace — visible in the browser console so the funnel is
      // debuggable without a GA4 property configured.
      console.debug(`[analytics] ${name}`, params);
    }
  } catch {
    /* analytics must never break UX */
  }
}

/** POST an event to the first-party AnalyticsEvent table (server truth). */
export async function trackServerEvent(
  name: AnalyticsClientEvent,
  params: Record<string, unknown> = {}
): Promise<void> {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: name, ...params }),
      keepalive: true,
    });
  } catch {
    /* fire-and-forget */
  }
}

/** UTM link builder for AI-chat recommended-service chips (spec 8C.3). */
export function aiChatServiceHref(serviceAnchor: string): string {
  const u = new URL(
    `/?utm_source=ai_chat&utm_medium=ai_chat&utm_campaign=service_finder#${serviceAnchor}`,
    typeof window !== "undefined" ? window.location.origin : "https://okomba.com"
  );
  return `${u.pathname}?${u.searchParams.toString()}${u.hash}`;
}
