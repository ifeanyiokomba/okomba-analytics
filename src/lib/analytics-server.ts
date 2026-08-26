/**
 * First-party analytics event recorder (Phase-2 Module 8C).
 *
 * Every funnel event fires TWICE:
 *   1. client-side → GA4 (dataLayer/gtag) when a measurement ID is set;
 *   2. server-side → AnalyticsEvent table (this module) — the source of
 *      truth the Admin Analytics dashboard queries. The table works with
 *      or without GA4 configured, so KPIs never depend on a third party.
 *
 * Event names (shared contract with GA4 + /api/analytics/track):
 *   ai_chat_start          visitor sends their first AI-chat message
 *   portal_visit           client portal page loaded
 *   proposal_view          proposal content rendered/scrolled into view
 *   pdf_download           proposal PDF downloaded from the portal
 *   payment_click          "I've Paid" button clicked
 *   payment_proof_uploaded payment proof file uploaded (bonus funnel step)
 */

import { db } from "@/lib/db";

export const ANALYTICS_EVENT_TYPES = [
  "ai_chat_start",
  "portal_visit",
  "proposal_view",
  "pdf_download",
  "payment_click",
  "payment_proof_uploaded",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export function isAnalyticsEventType(v: unknown): v is AnalyticsEventType {
  return typeof v === "string" && (ANALYTICS_EVENT_TYPES as readonly string[]).includes(v);
}

export type RecordEventInput = {
  type: AnalyticsEventType;
  invoiceId?: string | null;
  secureToken?: string | null;
  sessionId?: string | null;
  meta?: Record<string, unknown>;
};

/** Persist one analytics event. Never throws — analytics must not break flows. */
export async function recordAnalyticsEvent(input: RecordEventInput): Promise<void> {
  try {
    await db.analyticsEvent.create({
      data: {
        type: input.type,
        invoiceId: input.invoiceId ?? null,
        secureToken: input.secureToken ?? null,
        sessionId: input.sessionId ?? null,
        meta: JSON.stringify(input.meta ?? {}),
      },
    });
  } catch (err) {
    console.error(`[analytics] failed to record ${input.type}:`, err);
  }
}

/** True when this session already produced the given event type. */
export async function hasSessionEvent(
  type: AnalyticsEventType,
  sessionId: string
): Promise<boolean> {
  try {
    const found = await db.analyticsEvent.findFirst({
      where: { type, sessionId },
      select: { id: true },
    });
    return !!found;
  } catch {
    return false;
  }
}
