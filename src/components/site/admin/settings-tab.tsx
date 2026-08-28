"use client";

/**
 * Phase 29 — Admin Settings tab.
 *
 * Surfaces the email-failover chain configuration to the founder:
 * one card per provider (Google Apps Script, Resend, Mailtrap,
 * Maileroo) with priority badge, enabled toggle, per-provider
 * credential form, Save + Test buttons, and last-test-status
 * badge. Credentials are AES-256-GCM encrypted at rest by the
 * server (src/lib/email-config.ts) — the client only ever sees
 * a `hasCredentials` boolean + the field NAMES that have values.
 *
 * Test recipient (where provider test messages are sent) is set
 * at the top of the page; defaults to ADMIN_EMAIL env var.
 */

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Shield, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ALL_PROVIDER_SLOTS,
  DEFAULT_PROVIDER_DISPLAY_NAMES,
  PROVIDER_FIELD_DEFS,
  type EmailProviderName,
} from "@/lib/email-config";

/* ── Types mirroring the API responses ────────────────────────── */
type PublicProviderRow = {
  id: string;
  provider: EmailProviderName;
  displayName: string;
  priority: number;
  enabled: boolean;
  hasCredentials: boolean;
  lastTestAt: string | null;
  lastTestStatus: string | null;
  lastTestError: string | null;
  credentialFields: string[];
  updatedAt: string;
};

/* Local form state — values are EMPTY STRINGS by default (the API
   only tells us which fields are populated, not their values —
   credentials are write-only on the read path). */
type ProviderFormState = {
  webhookUrl: string;
  apiKey: string;
  fromEmail: string;
  fromName: string;
  apiEndpoint: string;
};

const EMPTY_FORM: ProviderFormState = {
  webhookUrl: "",
  apiKey: "",
  fromEmail: "",
  fromName: "",
  apiEndpoint: "",
};

/* ── Per-provider presentational metadata ─────────────────────── */
const PROVIDER_META: Record<
  EmailProviderName,
  { blurb: string; endpoint: string }
> = {
  apps_script: {
    blurb: "Founder-Gmail path via a Google Apps Script Web App.",
    endpoint: "POST {webhookUrl} — body { to, subject, bodyHtml, attachments }",
  },
  resend: {
    blurb: "Transactional primary — official Resend API.",
    endpoint: "POST https://api.resend.com/emails",
  },
  mailtrap: {
    blurb: "Sandbox catch-all — safe for testing, real delivery.",
    endpoint: "POST https://send.api.mailtrap.io/api/send",
  },
  maileroo: {
    blurb: "Backup provider — high deliverability, low cost.",
    endpoint: "POST https://api.maileroo.com/v1/smtp/emails",
  },
  // Pseudo-row — never rendered as a card (ALL_PROVIDER_SLOTS
  // excludes it). The metadata exists only to satisfy the Record
  // type union after test_recipient was added to EmailProviderName.
  test_recipient: {
    blurb: "Test recipient pseudo-row — not a delivery provider.",
    endpoint: "internal-only",
  },
};

/* ── Settings tab ─────────────────────────────────────────────── */
export function SettingsTab() {
  const [providers, setProviders] = useState<PublicProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-provider form state (one form per card).
  const [forms, setForms] = useState<Record<string, ProviderFormState>>({});
  // Per-provider save / test in-flight state.
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  // Per-provider last-action toast.
  const [toast, setToast] = useState<{ provider: string; text: string; type: "ok" | "err" } | null>(null);

  // Test recipient field
  const [testTo, setTestTo] = useState("");
  const [savingTestTo, setSavingTestTo] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [provRes, testRes] = await Promise.all([
        fetch("/api/admin/email-config"),
        fetch("/api/admin/email-config/test-to"),
      ]);
      if (!provRes.ok) throw new Error("Failed to load email provider configs");
      const prov = await provRes.json();
      const list: PublicProviderRow[] = prov.providers ?? [];
      setProviders(list);

      // Initialize the form state for each provider with empty
      // values (we never receive the actual values from the API).
      const nextForms: Record<string, ProviderFormState> = {};
      for (const slot of ALL_PROVIDER_SLOTS) {
        nextForms[slot] = { ...EMPTY_FORM };
      }
      setForms(nextForms);

      if (testRes.ok) {
        const t = await testRes.json();
        if (t.to) setTestTo(t.to);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── Save one provider's credentials + enabled/priority ───── */
  const saveProvider = useCallback(
    async (provider: EmailProviderName) => {
      setSaving((s) => ({ ...s, [provider]: true }));
      const form = forms[provider] ?? EMPTY_FORM;
      // Only include fields that have values — empty strings would
      // overwrite existing credentials with blanks on save.
      const credentials: Record<string, string> = {};
      for (const [k, v] of Object.entries(form)) {
        if (v && v.trim()) credentials[k] = v.trim();
      }
      // If the form is fully empty, we still want to persist enabled/
      // priority changes — but the server requires credentialsEnc to
      // be a non-empty string. Send a sentinel placeholder the server
      // can interpret as "no credentials provided, keep existing".
      const payload: Record<string, unknown> = { provider };
      if (Object.keys(credentials).length > 0) {
        payload.credentials = credentials;
      } else {
        payload.credentials = null; // signal: keep existing
      }
      const existing = providers.find((p) => p.provider === provider);
      if (existing) {
        payload.enabled = existing.enabled;
        payload.priority = existing.priority;
        payload.displayName = existing.displayName;
      } else {
        payload.displayName = DEFAULT_PROVIDER_DISPLAY_NAMES[provider];
        payload.priority = ALL_PROVIDER_SLOTS.indexOf(provider) + 1;
        payload.enabled = true;
      }
      try {
        const res = await fetch("/api/admin/email-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? `HTTP ${res.status}`);
        }
        setToast({
          provider,
          text: `${DEFAULT_PROVIDER_DISPLAY_NAMES[provider]} saved`,
          type: "ok",
        });
        await load();
      } catch (err) {
        setToast({
          provider,
          text: err instanceof Error ? err.message : "Save failed",
          type: "err",
        });
      } finally {
        setSaving((s) => ({ ...s, [provider]: false }));
      }
    },
    [forms, providers, load]
  );

  /* ── Test one provider — sends a real test email ───────────── */
  const testProvider = useCallback(async (provider: EmailProviderName) => {
    setTesting((t) => ({ ...t, [provider]: true }));
    try {
      const res = await fetch(
        `/api/admin/email-config/test?provider=${encodeURIComponent(provider)}`,
        { method: "POST" }
      );
      const j = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !j.ok) {
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setToast({
        provider,
        text: `${DEFAULT_PROVIDER_DISPLAY_NAMES[provider]} test OK (${j.latencyMs ?? 0} ms)`,
        type: "ok",
      });
      await load();
    } catch (err) {
      setToast({
        provider,
        text: err instanceof Error ? err.message : "Test failed",
        type: "err",
      });
    } finally {
      setTesting((t) => ({ ...t, [provider]: false }));
    }
  }, [load]);

  /* ── Toggle enabled (persists immediately) ────────────────── */
  const toggleEnabled = useCallback(
    async (provider: EmailProviderName, nextEnabled: boolean) => {
      // Optimistic update
      setProviders((prev) =>
        prev.map((p) =>
          p.provider === provider ? { ...p, enabled: nextEnabled } : p
        )
      );
      const form = forms[provider] ?? EMPTY_FORM;
      const credentials: Record<string, string> = {};
      for (const [k, v] of Object.entries(form)) {
        if (v && v.trim()) credentials[k] = v.trim();
      }
      const existing = providers.find((p) => p.provider === provider);
      try {
        const res = await fetch("/api/admin/email-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider,
            credentials: Object.keys(credentials).length > 0 ? credentials : null,
            enabled: nextEnabled,
            displayName: existing?.displayName ?? DEFAULT_PROVIDER_DISPLAY_NAMES[provider],
            priority: existing?.priority ?? ALL_PROVIDER_SLOTS.indexOf(provider) + 1,
          }),
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        await load();
      } catch (err) {
        setToast({
          provider,
          text: err instanceof Error ? err.message : "Toggle failed",
          type: "err",
        });
        // Revert optimistic
        setProviders((prev) =>
          prev.map((p) =>
            p.provider === provider ? { ...p, enabled: !nextEnabled } : p
          )
        );
      }
    },
    [forms, providers, load]
  );

  /* ── Save test recipient ───────────────────────────────────── */
  const saveTestTo = useCallback(async () => {
    if (!testTo.trim()) return;
    setSavingTestTo(true);
    try {
      const res = await fetch("/api/admin/email-config/test-to", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setToast({
        provider: "_test",
        text: "Test recipient saved",
        type: "ok",
      });
    } catch (err) {
      setToast({
        provider: "_test",
        text: err instanceof Error ? err.message : "Save failed",
        type: "err",
      });
    } finally {
      setSavingTestTo(false);
    }
  }, [testTo]);

  /* ── Render ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-gold" aria-label="Loading email config" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-card px-6 py-5">
        <p className="text-[13px] text-red-400">{error}</p>
        <button
          onClick={() => void load()}
          className="mt-3 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[12px] text-foreground hover:border-gold/40 hover:text-gold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top explainer */}
      <section className="surface-card px-6 py-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim text-gold">
            <Shield size={16} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[14.5px] font-semibold text-foreground">
              Email Failover Chain
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              Providers are tried in priority order. If the primary
              fails, the next provider is automatically used. All
              credentials are AES-256-GCM encrypted at rest — the
              server stores <code className="font-mono text-[11px] text-gold">base64(iv|ciphertext|tag)</code>{" "}
              only, never plaintext.
            </p>
          </div>
        </div>
      </section>

      {/* Test recipient */}
      <section className="surface-card px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-[13.5px] font-semibold text-foreground">
              Test recipient
            </h3>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Email address used when you click <em>Test</em> on any provider.
              Defaults to <code className="font-mono text-[11px] text-gold">ADMIN_EMAIL</code>{" "}
              env var if not set.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="you@example.com"
              className="min-w-[16rem] flex-1 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
            />
            <button
              onClick={() => void saveTestTo()}
              disabled={savingTestTo || !testTo.trim()}
              className="shrink-0 rounded-xl border border-gold/30 bg-gold-dim px-4 py-2.5 text-[12.5px] font-medium text-gold transition-colors hover:bg-gold/20 disabled:opacity-50"
            >
              {savingTestTo ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </section>

      {/* Provider cards */}
      <div className="flex flex-col gap-4">
        {ALL_PROVIDER_SLOTS.map((slot, idx) => {
          const existing = providers.find((p) => p.provider === slot);
          const priority = existing?.priority ?? idx + 1;
          const enabled = existing?.enabled ?? false;
          const form = forms[slot] ?? EMPTY_FORM;
          const fields = PROVIDER_FIELD_DEFS[slot];
          const isSaving = saving[slot] ?? false;
          const isTesting = testing[slot] ?? false;

          return (
            <section
              key={slot}
              className="surface-card px-6 py-5"
              aria-label={`${existing?.displayName ?? DEFAULT_PROVIDER_DISPLAY_NAMES[slot]} configuration`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-semibold",
                      enabled
                        ? "border-gold/40 bg-gold-dim text-gold"
                        : "border-white/[0.12] bg-white/[0.03] text-muted-foreground"
                    )}
                    title={`Priority ${priority}`}
                  >
                    {priority}
                  </span>
                  <div>
                    <h3 className="text-[13.5px] font-semibold text-foreground">
                      {existing?.displayName ?? DEFAULT_PROVIDER_DISPLAY_NAMES[slot]}
                    </h3>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {PROVIDER_META[slot].blurb}
                    </p>
                    <p className="mt-1 font-mono text-[10.5px] text-muted-foreground/70">
                      {PROVIDER_META[slot].endpoint}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {existing?.lastTestStatus === "success" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-medium text-emerald-400">
                      <CheckCircle2 size={11} aria-hidden="true" /> Test OK
                    </span>
                  )}
                  {existing?.lastTestStatus === "failed" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10.5px] font-medium text-red-400">
                      <XCircle size={11} aria-hidden="true" /> Test failed
                    </span>
                  )}
                  {existing?.lastTestAt && (
                    <span className="font-mono text-[10px] text-muted-foreground/70">
                      {new Date(existing.lastTestAt).toLocaleString()}
                    </span>
                  )}
                  <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <span className="hidden sm:inline">Enabled</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={`Toggle ${existing?.displayName ?? slot}`}
                      onClick={() => void toggleEnabled(slot, !enabled)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
                        enabled
                          ? "border-gold/50 bg-gold/30"
                          : "border-white/[0.12] bg-white/[0.04]"
                      )}
                    >
                      <span
                        className={cn(
                          "block h-3.5 w-3.5 transform rounded-full bg-foreground transition-transform",
                          enabled ? "translate-x-[18px]" : "translate-x-1"
                        )}
                      />
                    </button>
                  </label>
                </div>
              </div>

              {/* Card body: per-provider form */}
              <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.key} className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`${slot}-${f.key}`}
                      className="text-[11.5px] font-medium text-muted-foreground"
                    >
                      {f.label}
                      {f.required && <span className="ml-1 text-gold">*</span>}
                    </label>
                    <input
                      id={`${slot}-${f.key}`}
                      type={f.type === "password" ? "password" : f.type}
                      value={(form as Record<string, string>)[f.key] ?? ""}
                      onChange={(e) =>
                        setForms((prev) => ({
                          ...prev,
                          [slot]: {
                            ...(prev[slot] ?? EMPTY_FORM),
                            [f.key]: e.target.value,
                          },
                        }))
                      }
                      placeholder={f.placeholder}
                      className={cn(
                        "rounded-lg border bg-white/[0.03] px-3 py-2 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-gold/60",
                        existing?.credentialFields.includes(f.key)
                          ? "border-gold/20"
                          : "border-white/[0.09]"
                      )}
                      aria-label={f.label}
                    />
                    {existing?.credentialFields.includes(f.key) && (
                      <span className="text-[10px] text-emerald-400/80">
                        ● saved
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Existing test error, if any */}
              {existing?.lastTestStatus === "failed" && existing.lastTestError && (
                <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11.5px] text-red-300">
                  <span className="font-semibold">Last test error:</span>{" "}
                  <code className="font-mono text-[11px]">{existing.lastTestError}</code>
                </p>
              )}

              {/* Card footer: Save + Test buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] pt-4">
                <button
                  onClick={() => void saveProvider(slot)}
                  disabled={isSaving}
                  className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-[12px] font-medium text-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
                >
                  {isSaving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => void testProvider(slot)}
                  disabled={isTesting || !existing?.hasCredentials}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold-dim px-4 py-2 text-[12px] font-medium text-gold transition-colors hover:bg-gold/20 disabled:opacity-50"
                >
                  {isTesting ? (
                    <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                  ) : null}
                  {isTesting ? "Testing…" : "Test"}
                </button>
              </div>

              {/* Toast (per-provider inline) */}
              {toast?.provider === slot && (
                <p
                  className={cn(
                    "mt-3 text-[11.5px]",
                    toast.type === "ok" ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {toast.text}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
