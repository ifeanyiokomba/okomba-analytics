"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Loader2,
  Megaphone,
  PenLine,
  Save,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PreviewCard } from "./campaign-preview-card";
import {
  CAMPAIGN_AUDIENCE_MODES,
  CAMPAIGN_MODE_LABELS,
  CAMPAIGN_TOKENS,
  CAMPAIGN_TOKEN_HELP,
  type AudienceOption,
  type AudienceOptions,
  type AudiencePreview,
  type CampaignAudienceFilter,
  type CampaignAudienceMode,
  type CampaignContent,
  type CampaignPreviewRow,
  type CampaignSummary,
  type CampaignToken,
} from "@/lib/campaigns-shared";

/* ─────────────────────────────────────────────────────────────
   BATCH 12 (§56/§57) — campaign builder dialog.

   Step 1 Audience: §56 mode selector + live masked count/sample
   (preview-audience, debounced; §57 — no emails in the sample).
   Step 2 Content: name/goal + AI generate (create w/ generate or
   /generate for drafts) + §57 token toolbar inserting at the
   cursor + AI/fallback badge.
   Step 3 Preview: masked per-recipient renders with resolved
   token values highlighted in gold, then save draft (PUT).
   ───────────────────────────────────────────────────────────── */

const STEP_LABELS = ["Audience", "Content", "Preview"];

function filterOf(
  mode: CampaignAudienceMode,
  v: { status: string; tag: string; country: string; service: string; q: string }
): CampaignAudienceFilter {
  return {
    mode,
    ...(mode === "status" && v.status ? { status: v.status } : {}),
    ...(mode === "tag" && v.tag ? { tag: v.tag } : {}),
    ...(mode === "country" && v.country ? { country: v.country } : {}),
    ...(mode === "service" && v.service ? { service: v.service } : {}),
    ...(mode === "custom" && v.q.trim() ? { q: v.q.trim() } : {}),
  };
}

export function CampaignBuilderDialog({
  notify,
  editCampaign,
  onClose,
  onSaved,
}: {
  notify: (text: string, type?: "ok" | "err") => void;
  /** Edit mode: an existing draft/pending campaign (skips step 1). */
  editCampaign: CampaignSummary | null;
  onClose: () => void;
  onSaved: (campaign: CampaignSummary) => void;
}) {
  const editing = editCampaign !== null;

  const [step, setStep] = useState<1 | 2 | 3>(editing ? 2 : 1);
  const [mode, setMode] = useState<CampaignAudienceMode>(
    (editCampaign?.audience?.mode as CampaignAudienceMode) ?? "all"
  );
  const [sel, setSel] = useState({ status: "", tag: "", country: "", service: "", q: "" });
  const [options, setOptions] = useState<AudienceOptions | null>(null);
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [previewing, setPreviewing] = useState(true);

  const [name, setName] = useState(editCampaign?.name ?? "");
  const [goal, setGoal] = useState(editCampaign?.goal ?? "");
  const [subject, setSubject] = useState(editCampaign?.subjectTemplate ?? "");
  const [body, setBody] = useState(editCampaign?.bodyTemplate ?? "");
  const [ctaLabel, setCtaLabel] = useState(editCampaign?.ctaLabel ?? "");
  const [usedFallback, setUsedFallback] = useState<boolean | null>(
    editCampaign ? editCampaign.usedFallback : null
  );

  const [campaignId, setCampaignId] = useState<string | null>(editCampaign?.id ?? null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previews, setPreviews] = useState<CampaignPreviewRow[] | null>(null);
  const [loadingPreviews, setLoadingPreviews] = useState(false);

  const [lastFocus, setLastFocus] = useState<"subject" | "body">("body");
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  /* ── Options loader ── */
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/ai/campaigns/audience-options", { cache: "no-store" });
        if (!res.ok) return;
        const j = (await res.json()) as { ok: boolean; options?: AudienceOptions };
        if (j.ok && j.options) setOptions(j.options);
      } catch {
        /* transient */
      }
    })();
  }, []);

  /* ── Debounced live audience preview (§56) ── */
  const filter = useMemo(() => filterOf(mode, sel), [mode, sel]);

  useEffect(() => {
    if (editing) return; // audience locked in edit mode
    const t = setTimeout(async () => {
      if (mode === "custom" && !sel.q.trim()) {
        setPreview(null);
        setPreviewing(false);
        return;
      }
      setPreviewing(true);
      try {
        const res = await fetch("/api/admin/ai/campaigns/preview-audience", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filter }),
        });
        if (!res.ok) return;
        const j = (await res.json()) as AudiencePreview & { ok: boolean };
        if (j.ok) setPreview({ ok: true, count: j.count, sample: j.sample ?? [] });
      } catch {
        /* transient */
      } finally {
        setPreviewing(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [filter, mode, sel.q, editing]);

  /* ── Escape closes (when idle) ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving && !generating) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [saving, generating, onClose]);

  /* ── AI generate / create (§56) ── */
  const generate = async () => {
    setError(null);
    if (!name.trim()) return setError("Campaign name is required");
    setGenerating(true);
    try {
      if (campaignId) {
        // Existing draft → regenerate via /generate (draft-only).
        const res = await fetch(`/api/admin/ai/campaigns/${campaignId}/generate`, { method: "POST" });
        const j = (await res.json().catch(() => null)) as
          | { ok: boolean; campaign?: CampaignSummary; error?: string }
          | null;
        if (!res.ok || !j?.ok || !j.campaign) {
          setError(j?.error ?? "Regeneration failed");
          return;
        }
        applyCampaign(j.campaign);
        notify("Templates regenerated with AI", "ok");
      } else {
        const res = await fetch("/api/admin/ai/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), goal: goal.trim() || undefined, audience: filter, generate: true }),
        });
        const j = (await res.json().catch(() => null)) as
          | { ok: boolean; campaign?: CampaignSummary; content?: CampaignContent; error?: string }
          | null;
        if (!res.ok || !j?.ok || !j.campaign) {
          setError(j?.error ?? "Generation failed");
          return;
        }
        setCampaignId(j.campaign.id);
        applyCampaign(j.campaign);
        if (j.content) setUsedFallback(j.content.usedFallback);
        notify(j.campaign.usedFallback ? "Fallback templates created (AI unavailable)" : "AI templates generated", "ok");
      }
    } catch {
      setError("Network error — generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const writeManually = async () => {
    setError(null);
    if (!name.trim()) return setError("Campaign name is required");
    if (campaignId) return; // already created — just edit the fields
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/ai/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), goal: goal.trim() || undefined, audience: filter, generate: false }),
      });
      const j = (await res.json().catch(() => null)) as
        | { ok: boolean; campaign?: CampaignSummary; error?: string }
        | null;
      if (!res.ok || !j?.ok || !j.campaign) {
        setError(j?.error ?? "Could not create the draft");
        return;
      }
      setCampaignId(j.campaign.id);
      notify("Blank draft created — write your copy", "ok");
    } catch {
      setError("Network error — could not create the draft");
    } finally {
      setGenerating(false);
    }
  };

  const applyCampaign = (c: CampaignSummary) => {
    setSubject(c.subjectTemplate);
    setBody(c.bodyTemplate);
    setCtaLabel(c.ctaLabel ?? "");
    setUsedFallback(c.usedFallback);
  };

  /* ── Step 3: masked previews (§56 preview-before-send) ── */
  const loadPreviews = useCallback(async (id: string) => {
    setLoadingPreviews(true);
    try {
      const res = await fetch(`/api/admin/ai/campaigns/${id}`, { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as { ok: boolean; previews?: CampaignPreviewRow[] };
      if (j.ok) setPreviews(j.previews ?? []);
    } catch {
      /* transient */
    } finally {
      setLoadingPreviews(false);
    }
  }, []);

  useEffect(() => {
    if (step === 3 && campaignId) {
      setPreviews(null);
      void loadPreviews(campaignId);
    }
  }, [step, campaignId, loadPreviews]);

  /* ── Token insertion at cursor (§57 toolbar) ── */
  const insertToken = (token: CampaignToken) => {
    const text = `{{${token}}}`;
    if (lastFocus === "subject") {
      const field = subjectRef.current;
      const start = field?.selectionStart ?? subject.length;
      const end = field?.selectionEnd ?? subject.length;
      setSubject(subject.slice(0, start) + text + subject.slice(end));
      requestAnimationFrame(() => field?.setSelectionRange(start + text.length, start + text.length));
    } else {
      const field = bodyRef.current;
      const start = field?.selectionStart ?? body.length;
      const end = field?.selectionEnd ?? body.length;
      setBody(body.slice(0, start) + text + body.slice(end));
      requestAnimationFrame(() => field?.setSelectionRange(start + text.length, start + text.length));
    }
  };

  const validateContent = (): string | null => {
    if (subject.trim().length < 3) return "Subject must be at least 3 characters";
    if (subject.trim().length > 80) return "Subject must be at most 80 characters";
    if (body.trim().length < 20) return "Body must be at least 20 characters";
    if (body.trim().length > 6000) return "Body must be at most 6000 characters";
    return null;
  };

  const putContent = async (): Promise<CampaignSummary | null> => {
    if (!campaignId) return null;
    const res = await fetch(`/api/admin/ai/campaigns/${campaignId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        goal: goal.trim() || null,
        ...(editing ? {} : { audience: filter }),
        subjectTemplate: subject.trim(),
        bodyTemplate: body.trim(),
        ctaLabel: ctaLabel.trim() || null,
      }),
    });
    const j = (await res.json().catch(() => null)) as
      | { ok: boolean; campaign?: CampaignSummary; error?: string }
      | null;
    if (!res.ok || !j?.ok || !j.campaign) {
      setError(j?.error ?? "Could not save the campaign");
      return null;
    }
    return j.campaign;
  };

  /** §56 preview reflects the SAVED draft — put the current edits
   *  first (silent), then show the masked per-recipient renders. */
  const goToPreview = async () => {
    const v = validateContent();
    if (v) return setError(v);
    setError(null);
    if (!campaignId) return setError("Generate or write the content first");
    setSaving(true);
    try {
      const saved = await putContent();
      if (saved) setStep(3);
    } catch {
      setError("Network error — could not save");
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    if (!campaignId) return;
    const v = validateContent();
    if (v) return setError(v);
    setSaving(true);
    setError(null);
    try {
      const saved = await putContent();
      if (saved) {
        notify("Campaign draft saved", "ok");
        onSaved(saved);
      }
    } catch {
      setError("Network error — could not save");
    } finally {
      setSaving(false);
    }
  };

  const canAdvanceStep1 = !editing && !previewing && (preview?.count ?? 0) > 0;

  const field =
    "w-full rounded-xl border border-white/[0.1] bg-[#0d1322] px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20";
  const label = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Edit campaign" : "New campaign builder"}
      onClick={(e) => e.target === e.currentTarget && !saving && !generating && onClose()}
    >
      <div className="section-dark relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float sm:rounded-3xl [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
        <header className="relative shrink-0 border-b border-white/[0.07] p-5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gold/[0.1] blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow flex items-center gap-1.5 text-[9px] text-gold">
                <Megaphone size={11} aria-hidden="true" /> AI Campaigns{editing ? " · Edit draft" : " · Builder"}
              </p>
              <h2 className="mt-1.5 font-display text-[17px] font-bold text-foreground">
                {editing ? editCampaign?.name : "New campaign"}
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={saving || generating}
              aria-label="Close"
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          {/* Step indicator */}
          <ol className="relative mt-4 flex items-center gap-2" aria-label="Builder steps">
            {STEP_LABELS.map((s, i) => {
              const n = (i + 1) as 1 | 2 | 3;
              const active = step === n;
              const done = step > n;
              return (
                <li key={s} className="flex items-center gap-2">
                  <span
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                      active
                        ? "border-gold/50 bg-gold-dim text-gold"
                        : done
                          ? "border-teal/35 bg-teal-dim text-teal"
                          : "border-white/[0.09] bg-white/[0.03] text-muted-foreground"
                    )}
                  >
                    <span className="font-mono text-[9.5px]">{done ? "✓" : n}</span> {s}
                  </span>
                  {i < STEP_LABELS.length - 1 && <span className="text-muted-foreground/40" aria-hidden="true">→</span>}
                </li>
              );
            })}
          </ol>
        </header>

        <div className="flex-1 overflow-y-auto p-5 [scrollbar-width:thin]">
          {error && (
            <div role="alert" className="mb-4 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-[12.5px] text-red-300">
              {error}
            </div>
          )}

          {/* ── Step 1: Audience (§56) ── */}
          {step === 1 && (
            <section aria-label="Audience selection">
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2" role="group" aria-label="Audience mode">
                {CAMPAIGN_AUDIENCE_MODES.map((m) => {
                  const on = mode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setMode(m)}
                      className={cn(
                        "inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-2.5 text-[12.5px] font-medium transition-colors",
                        on
                          ? "border-gold/45 bg-gold-dim text-gold"
                          : "border-white/[0.09] bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground"
                      )}
                    >
                      <Users size={13} aria-hidden="true" />
                      {CAMPAIGN_MODE_LABELS[m]}
                    </button>
                  );
                })}
              </div>

              {/* Dependent input */}
              {mode !== "all" && (
                <div className="mt-3">
                  {mode === "custom" ? (
                    <input
                      type="search"
                      value={sel.q}
                      onChange={(e) => setSel((s) => ({ ...s, q: e.target.value }))}
                      placeholder="Search name, email, company…"
                      aria-label="Custom audience search"
                      className={field}
                    />
                  ) : (
                    <select
                      value={
                        mode === "status"
                          ? sel.status
                          : mode === "tag"
                            ? sel.tag
                            : mode === "country"
                              ? sel.country
                              : sel.service
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        setSel((s) =>
                          mode === "status"
                            ? { ...s, status: v }
                            : mode === "tag"
                              ? { ...s, tag: v }
                              : mode === "country"
                                ? { ...s, country: v }
                                : { ...s, service: v }
                        );
                      }}
                      aria-label={`${CAMPAIGN_MODE_LABELS[mode]} value`}
                      className={field}
                    >
                      <option value="">Select…</option>
                      {(options?.[mode === "status" ? "statuses" : mode === "tag" ? "tags" : mode === "country" ? "countries" : "services"] ?? []).map(
                        (o: AudienceOption) => (
                          <option key={o.value} value={o.value}>
                            {mode === "country" ? `${o.value}` : o.value} ({o.count})
                          </option>
                        )
                      )}
                    </select>
                  )}
                </div>
              )}

              {/* Live count + masked sample (§57) */}
              <div className="mt-4 rounded-xl border border-white/[0.07] bg-[#07090f]/60 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12.5px] font-semibold text-foreground">Audience preview</p>
                  <p className="font-mono text-[12px] text-gold">
                    {previewing ? (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 size={12} className="animate-spin" aria-hidden="true" /> counting…
                      </span>
                    ) : (
                      <>
                        {preview ? preview.count : 0} recipient{preview?.count === 1 ? "" : "s"}
                      </>
                    )}
                  </p>
                </div>
                {!previewing && preview && preview.sample.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {preview.sample.map((s, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-1 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-2"
                      >
                        <span className="truncate text-[12px] font-medium text-foreground">
                          {s.firstName ?? "—"}
                        </span>
                        <span className="flex flex-wrap gap-1">
                          <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground capitalize">
                            {s.status}
                          </span>
                          {s.countryCode && (
                            <span className="rounded-full bg-gold/10 px-1.5 py-0.5 font-mono text-[9px] text-gold">
                              {s.countryCode}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {!previewing && preview && preview.sample.length > 0 && (
                  <p className="mt-2.5 text-[10.5px] text-muted-foreground/70">
                    §57 privacy — names, stages and countries only. Emails are never shown here.
                  </p>
                )}
                {!previewing && preview && preview.count === 0 && (
                  <p className="mt-2 text-[11.5px] text-muted-foreground">No customers match this audience.</p>
                )}
              </div>
            </section>
          )}

          {/* ── Step 2: Content (§56/§57) ── */}
          {step === 2 && (
            <section aria-label="Campaign content">
              {editing && (
                <p className="mb-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 font-mono text-[10.5px] text-muted-foreground">
                  Audience locked: {CAMPAIGN_MODE_LABELS[(editCampaign?.audience?.mode as CampaignAudienceMode) ?? "all"]}
                </p>
              )}

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label htmlFor="cb-name" className={label}>
                    Campaign name *
                  </label>
                  <input
                    id="cb-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={120}
                    placeholder="Q1 re-engagement"
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor="cb-goal" className={label}>
                    Goal (the AI brief)
                  </label>
                  <textarea
                    id="cb-goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    rows={2}
                    maxLength={1000}
                    placeholder="What should this campaign achieve?"
                    className={cn(field, "resize-y")}
                  />
                </div>
              </div>

              {/* Generate actions */}
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => void generate()}
                  disabled={generating || saving || !name.trim()}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gold/60 bg-gold px-4 py-2.5 text-[12.5px] font-semibold text-ink transition-all hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generating ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles size={14} aria-hidden="true" />
                  )}
                  {campaignId ? "Regenerate with AI" : "Generate with AI"}
                </button>
                {!campaignId && (
                  <button
                    onClick={() => void writeManually()}
                    disabled={generating || saving || !name.trim()}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    <PenLine size={14} aria-hidden="true" />
                    Write manually
                  </button>
                )}
                {usedFallback !== null && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                      usedFallback
                        ? "border-amber-400/35 bg-amber-400/10 text-amber-300"
                        : "border-teal/35 bg-teal-dim text-teal"
                    )}
                  >
                    {usedFallback ? "fallback template" : "AI-generated"}
                  </span>
                )}
              </div>

              {/* Templates + token toolbar (§57) */}
              <div className="mt-4">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">
                    Tokens
                  </span>
                  {CAMPAIGN_TOKENS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      title={CAMPAIGN_TOKEN_HELP[t]}
                      onClick={() => insertToken(t)}
                      disabled={!campaignId}
                      className="rounded-full border border-purple-400/30 bg-purple-400/10 px-2.5 py-1 font-mono text-[10px] text-purple-300 transition-colors hover:bg-purple-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {`{{${t}}}`}
                    </button>
                  ))}
                </div>
                <div>
                  <label htmlFor="cb-subject" className={label}>
                    Subject (3–80 chars) *
                  </label>
                  <input
                    id="cb-subject"
                    ref={subjectRef}
                    value={subject}
                    onFocus={() => setLastFocus("subject")}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={80}
                    placeholder="Hi {{firstName}} — a quick update"
                    disabled={!campaignId}
                    className={cn(field, "disabled:opacity-50")}
                  />
                </div>
                <div className="mt-3">
                  <label htmlFor="cb-body" className={label}>
                    Body (20–6000 chars) * — tokens resolve per recipient
                  </label>
                  <textarea
                    id="cb-body"
                    ref={bodyRef}
                    value={body}
                    onFocus={() => setLastFocus("body")}
                    onChange={(e) => setBody(e.target.value)}
                    rows={8}
                    maxLength={6000}
                    placeholder={"Hi {{firstName}},\n\n…\n\n— Okomba Analytics"}
                    disabled={!campaignId}
                    className={cn(field, "min-h-40 font-mono text-[12px] disabled:opacity-50")}
                  />
                  <p className="mt-1 text-right font-mono text-[9.5px] text-muted-foreground/70">{body.length}/6000</p>
                </div>
                <div className="mt-3">
                  <label htmlFor="cb-cta" className={label}>
                    CTA label (optional, ≤ 28 chars)
                  </label>
                  <input
                    id="cb-cta"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    maxLength={28}
                    placeholder="Schedule a chat"
                    disabled={!campaignId}
                    className={cn(field, "disabled:opacity-50")}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ── Step 3: Preview (§56 preview-before-send) ── */}
          {step === 3 && (
            <section aria-label="Campaign preview">
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                §57 privacy — each email is rendered per-recipient from their own record only. Resolved
                values are highlighted in <span className="font-semibold text-gold">gold</span>.
              </p>

              {loadingPreviews ? (
                <div className="mt-4 flex flex-col gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-28 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03]" />
                  ))}
                </div>
              ) : previews && previews.length > 0 ? (
                <div className="mt-4 flex flex-col gap-3">
                  {previews.map((p, i) => (
                    <PreviewCard
                      key={i}
                      email={p.email}
                      subject={p.subject}
                      body={p.body}
                      subjectTemplate={subject}
                      bodyTemplate={body}
                      ctaLabel={ctaLabel}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[12px] text-muted-foreground">
                  No previews available (empty audience?).
                </p>
              )}
            </section>
          )}
        </div>

        <footer className="shrink-0 border-t border-white/[0.07] bg-white/[0.015] p-5">
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => {
                if (step === 3) setStep(2);
                else if (editing) onClose();
                else setStep(1);
              }}
              disabled={saving || generating}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              {step === 3 ? "Back to content" : step === 2 ? (editing ? "Cancel" : "Back to audience") : "Cancel"}
            </button>

            {step < 3 ? (
              <button
                onClick={step === 1 ? () => setStep(2) : () => void goToPreview()}
                disabled={saving || generating || (step === 1 && !canAdvanceStep1) || (step === 2 && !campaignId)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gold/45 bg-gold-dim px-5 py-2.5 text-[13px] font-semibold text-gold transition-all hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {step === 2 ? <Eye size={14} aria-hidden="true" /> : <ArrowRight size={14} aria-hidden="true" />}
                {step === 1 ? "Next — content" : "Preview"}
              </button>
            ) : (
              <button
                onClick={() => void saveDraft()}
                disabled={saving || generating}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
                Save draft
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
