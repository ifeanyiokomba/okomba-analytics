/**
 * Phase 29 — Email failover chain.
 *
 * Iterates enabled EmailProviderConfig rows in priority order and tries
 * each provider's HTTP endpoint. Returns on the first HTTP 2xx. All
 * failures (4xx, 5xx, timeout, network) fall through to the next
 * provider. If EVERY enabled provider fails, throws an aggregated
 * Error with the per-provider failure reasons.
 *
 * BACKWARD-COMPAT FALLBACK
 * ────────────────────────
 * If no EmailProviderConfig rows are configured (the table is empty),
 * we transparently fall back to the legacy `NOTIFY_WEBHOOK_URL` env
 * var (Google Apps Script single-provider pattern). This keeps the
 * deployed Render service working without forcing the founder to
 * re-enter credentials before the next deploy. The legacy path is
 * loud — it logs a console.warn so the operator notices the chain
 * is unconfigured.
 *
 * The legacy path also accepts the Apps Script-specific payload shape
 * (`action: "sendInvoiceEmail"` + `base64Pdf`) so callers in notify.ts
 * that pass invoice PDF attachments keep working unchanged.
 */

import { db } from "@/lib/db";
import {
  callProviderApi,
  decryptCredentials,
  getEnabledProvidersOrdered,
  type EmailProviderName,
} from "@/lib/email-config";

export type FailoverAttachment = {
  filename: string;
  contentType: string;
  base64: string;
};

export type FailoverOptions = {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  attachments?: FailoverAttachment[];
  type: string;
  // Legacy Apps-Script-only fields (only read if the failover chain
  // is empty AND we fall back to NOTIFY_WEBHOOK_URL). Real providers
  // ignore these.
  invoiceSummary?: Record<string, unknown>;
  legacyAction?: string; // "sendEmail" | "sendInvoiceEmail"
  // B5-FIX Bug 2: the inquiry object for type=inquiry.created. Forwarded
  // to both the modern apps_script provider (buildAppsScriptPayload) and
  // the legacy fallback (buildLegacyAppsScriptPayload) so Code.gs's
  // handleInquiryNotification can compose the dual emails.
  inquiry?: Record<string, unknown>;
};

export type FailoverAttempt = {
  provider: string;
  ok: boolean;
  error?: string;
  latencyMs: number;
};

export type FailoverResult = {
  provider: string; // "apps_script" | "resend" | … | "legacy_apps_script" | "stub"
  ok: boolean;
  error?: string;
  attempts: FailoverAttempt[];
};

const LEGACY_TIMEOUT_MS = 30_000;

/* ── Legacy Apps Script payload shape (B5 — extracted for contract
 *    test; B5-FIX — Bug 4 root-cause fix) ──────────────────────
 *
 * Phase 29 hardcoded this JSON body inline inside the legacy fallback
 * fetch() call. Batch 5 (Code.gs reconciliation) extracted it into a
 * pure function so tests/codegs-payload-shape.test.ts can assert the
 * EXACT field shape without making a real HTTP call.
 *
 * B5-FIX (this batch — Bug 4 root-cause fix per Master Directive §8):
 *
 *   • Bug 4 fix — the legacy payload now INCLUDES the `type` field.
 *     Phase 29's buildLegacyAppsScriptPayload returned 11 fields and
 *     SILENTLY DROPPED `type` from the payload. Code.gs's doPost
 *     received no `type`, no `name`/`email`, no `recipient` → fell
 *     to `throw new Error("Unrecognized payload")`. Apps Script
 *     caught the throw and returned `{success:false, error:"Unrecog-
 *     nized payload"}` with HTTP 200 (Apps Script's ContentService
 *     always returns 200 from doPost). The failover chain's `res.ok`
 *     check saw HTTP 200 → thought delivery SUCCEEDED → marked the
 *     email as sent → TRUE SILENT FAILURE. With the `type` field
 *     now in the payload, Code.gs's `if (data.type)` branch routes
 *     to handleNotification(data) which has the new default case
 *     (Bug 3 fix) → the email actually goes out.
 *
 *   • Bug 2 fix (legacy side) — the legacy payload also forwards the
 *     `inquiry` object when set (only for type=inquiry.created). Same
 *     shape as the modern provider's Bug 2 fix in email-config.ts.
 *
 *   • Bug 1 fix (legacy side) — the legacy payload keeps sending `to`
 *     (NOT `recipient`) but Code.gs v6 now accepts both fields, so
 *     `to` is picked up. No payload change needed on this side beyond
 *     what was already there.
 *
 * The legacy path (NOTIFY_WEBHOOK_URL) was the ONLY delivery path
 * today where invoice emails actually reached the recipient — because
 * notify.ts passes `legacyAction: "sendInvoiceEmail"` for invoice.sent
 * / invoice.reminder_* / payment.received, and Code.gs routes
 * action="sendInvoiceEmail" → sendInvoiceEmail(data) which reads
 * `data.to` directly. With the Bug 4 fix, the legacy path now ALSO
 * delivers non-invoice emails (inquiry.created, subscriber.welcome,
 * post.published, broadcast, system.alert) — those reach customers
 * via handleNotification → switch case + default case.
 */
export type LegacyAppsScriptPayloadOptions = {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  attachments?: FailoverAttachment[];
  type: string;
  invoiceSummary?: Record<string, unknown>;
  legacyAction?: string;
  // B5-FIX Bug 2 (legacy side): forward the inquiry object for
  // type=inquiry.created so Code.gs can compose the dual emails.
  inquiry?: Record<string, unknown>;
};

export function buildLegacyAppsScriptPayload(
  opts: LegacyAppsScriptPayloadOptions,
  ctx: { bodyText: string; attachments: FailoverAttachment[] }
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    action: opts.legacyAction ?? "sendEmail",
    to: opts.to,
    subject: opts.subject,
    body: ctx.bodyText,
    html: opts.bodyHtml,
    bodyText: ctx.bodyText,
    bodyHtml: opts.bodyHtml,
    attachments: ctx.attachments,
    base64Pdf:
      ctx.attachments.length > 0 ? ctx.attachments[0].base64 : undefined,
    filename:
      ctx.attachments.length > 0 ? ctx.attachments[0].filename : undefined,
    invoiceSummary: opts.invoiceSummary,
    // B5-FIX Bug 4: include the `type` field in the legacy payload
    // so Code.gs's `if (data.type)` branch routes to handleNotification
    // (and its new default case) instead of throwing "Unrecognized
    // payload" → silent HTTP 200 failure.
    type: opts.type,
  };
  // B5-FIX Bug 2 (legacy side): forward the inquiry object when set
  // (only for type=inquiry.created in practice).
  if (opts.inquiry) {
    payload.inquiry = opts.inquiry;
  }
  return payload;
}

export async function getEnabledProviderCount(): Promise<number> {
  try {
    return await db.emailProviderConfig.count({
      where: { enabled: true, provider: { not: "test_recipient" } },
    });
  } catch {
    return 0;
  }
}

export async function deliverWithFailover(
  opts: FailoverOptions
): Promise<FailoverResult> {
  const bodyText = opts.bodyText ?? "";
  const attachments = opts.attachments ?? [];

  // ── Try each configured provider in priority order ──────────
  let providers: Awaited<ReturnType<typeof getEnabledProvidersOrdered>> = [];
  try {
    providers = await getEnabledProvidersOrdered();
  } catch (err) {
    console.error("[email-failover] could not load providers:", err);
  }
  // The test_recipient pseudo-row is never a delivery provider.
  providers = providers.filter((p) => p.provider !== "test_recipient");

  const attempts: FailoverAttempt[] = [];

  for (const row of providers) {
    const provider = row.provider as EmailProviderName;
    let creds;
    try {
      creds = decryptCredentials(row.credentialsEnc);
    } catch (err) {
      const latencyMs = 0;
      const error = `decrypt failed: ${
        err instanceof Error ? err.message : "unknown"
      }`;
      attempts.push({ provider, ok: false, error, latencyMs });
      console.error(`[email-failover] ${provider} decrypt failed:`, err);
      continue;
    }

    const start = Date.now();
    let result: { ok: boolean; error?: string; detail?: string };
    try {
      result = await callProviderApi(provider, creds, {
        to: opts.to,
        subject: opts.subject,
        bodyHtml: opts.bodyHtml,
        bodyText,
        attachments,
        type: opts.type,
        // B5-FIX Bug 5: forward legacyAction so the modern apps_script
        // provider can set action="sendInvoiceEmail" for invoice emails
        // (preserves the PDF attachment flow). Other providers (resend /
        // mailtrap / maileroo) ignore these fields — see callProviderApi.
        legacyAction: opts.legacyAction,
        // B5-FIX Bug 2: forward the inquiry object for type=inquiry.created.
        inquiry: opts.inquiry,
      });
    } catch (err) {
      result = {
        ok: false,
        error: err instanceof Error ? err.message : "unknown error",
      };
    }
    const latencyMs = Date.now() - start;
    attempts.push({
      provider,
      ok: result.ok,
      error: result.error,
      latencyMs,
    });

    if (result.ok) {
      return {
        provider,
        ok: true,
        attempts,
      };
    }
    console.warn(
      `[email-failover] ${provider} failed (${result.error}) — trying next provider`
    );
  }

  // ── Legacy fallback: NOTIFY_WEBHOOK_URL (Google Apps Script) ──
  // Used only when no providers are configured. Keeps the deployed
  // Render service working until the founder sets up the chain.
  const webhookUrl = process.env.NOTIFY_WEBHOOK_URL;
  if (providers.length === 0 && webhookUrl) {
    const start = Date.now();
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildLegacyAppsScriptPayload(opts, { bodyText, attachments })),
        signal: AbortSignal.timeout(LEGACY_TIMEOUT_MS),
      });
      const latencyMs = Date.now() - start;
      const ok = res.ok;
      attempts.push({
        provider: "legacy_apps_script",
        ok,
        error: ok ? undefined : `HTTP ${res.status}`,
        latencyMs,
      });
      if (ok) {
        return {
          provider: "legacy_apps_script",
          ok: true,
          attempts,
        };
      }
    } catch (err) {
      const latencyMs = Date.now() - start;
      attempts.push({
        provider: "legacy_apps_script",
        ok: false,
        error: err instanceof Error ? err.message : "legacy fetch failed",
        latencyMs,
      });
    }
  } else if (providers.length === 0 && !webhookUrl) {
    // ── Pure stub mode (no providers, no webhook) ────────────
    // This is the dev-mode path: log only, don't fail. Phase 28
    // and earlier called this the "email stub" — preserve that
    // behavior so the dev server still boots cleanly when nothing
    // is configured.
    attempts.push({
      provider: "stub",
      ok: true,
      latencyMs: 0,
    });
    console.info(
      `[email-failover] stub delivery — to=${opts.to}, subject=${opts.subject} ` +
        `(no providers configured AND NOTIFY_WEBHOOK_URL unset)`
    );
    return { provider: "stub", ok: true, attempts };
  }

  // ── If we have configured providers but ALL of them failed, AND
  // the legacy webhook is also unset or also failed, surface the
  // aggregated failure to the caller (notify.ts) so it can mark
  // the EmailLog row as `failed`. ───────────────────────────────
  if (providers.length > 0 && !webhookUrl) {
    const agg = attempts
      .map((a) => `${a.provider}: ${a.error ?? "unknown"}`)
      .join(" | ");
    return {
      provider: "all_failed",
      ok: false,
      error: `all ${attempts.length} providers failed — ${agg}`,
      attempts,
    };
  }

  const agg = attempts
    .map((a) => `${a.provider}: ${a.error ?? "unknown"}`)
    .join(" | ");
  return {
    provider: "all_failed",
    ok: false,
    error: `delivery chain exhausted — ${agg}`,
    attempts,
  };
}
