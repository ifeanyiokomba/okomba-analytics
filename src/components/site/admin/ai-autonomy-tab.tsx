"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Check,
  Loader2,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AI_ACTIONS,
  AI_ACTION_LABELS,
  AI_LEVEL_META,
  DEFAULT_AUTONOMY,
  WORKFLOW_CHAIN,
  type AiAction,
  type AiActionSummary,
  type AiLevel,
  type AutonomyConfigDto,
} from "@/lib/campaigns-shared";
import { formatTimestamp } from "./types";
import { AiApprovalQueue } from "./ai-approval-queue";

/* ─────────────────────────────────────────────────────────────
   BATCH 12 (§52/§53) — Autonomy sub-tab of the AI Monitor.

   §52 control center: master enable (confirm-on-enable popover),
   per-action level matrix, daily email budget, allowlists,
   never-do list, escalation rules, save / SAFE DEFAULTS.
   §53 approval queue + recent activity live in
   ai-approval-queue.tsx (the ai-knowledge-editor split pattern).
   ───────────────────────────────────────────────────────────── */

type EditableConfig = Omit<AutonomyConfigDto, "updatedAt">;

function toEditable(cfg: AutonomyConfigDto): EditableConfig {
  return {
    enabled: cfg.enabled,
    levels: { ...cfg.levels },
    maxEmailsPerDay: cfg.maxEmailsPerDay,
    allowedRecipients: [...cfg.allowedRecipients],
    allowedServices: [...cfg.allowedServices],
    escalationRules: { ...cfg.escalationRules },
    prohibitedActions: [...cfg.prohibitedActions],
  };
}

export function AiAutonomyTab({
  notify,
  active,
  onOpenAudit,
}: {
  notify: (text: string, type?: "ok" | "err") => void;
  active: boolean;
  onOpenAudit: () => void;
}) {
  const [cfg, setCfg] = useState<EditableConfig | null>(null);
  const [baseline, setBaseline] = useState<EditableConfig | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEnable, setConfirmEnable] = useState(false);
  const [actions, setActions] = useState<AiActionSummary[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai/autonomy", { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as { ok: boolean; config?: AutonomyConfigDto };
      if (j.ok && j.config) {
        const editable = toEditable(j.config);
        setCfg(editable);
        setBaseline(editable);
        setSavedAt(j.config.updatedAt);
      }
    } catch {
      /* transient */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(
    () => (cfg && baseline ? JSON.stringify(cfg) !== JSON.stringify(baseline) : false),
    [cfg, baseline]
  );

  /* -- editor helpers ---------------------------------------- */

  const setLevel = (action: AiAction, level: AiLevel) =>
    setCfg((c) => (c ? { ...c, levels: { ...c.levels, [action]: level } } : c));

  const toggleEnable = () => {
    if (!cfg) return;
    if (cfg.enabled) {
      setConfirmEnable(false);
      setCfg({ ...cfg, enabled: false });
    } else {
      setConfirmEnable(true);
    }
  };

  const put = async (payload: EditableConfig, okText: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/autonomy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = (await res.json().catch(() => null)) as
        | { ok: boolean; config?: AutonomyConfigDto; error?: string }
        | null;
      if (!res.ok || !j?.ok || !j.config) {
        setError(j?.error ?? "Could not save autonomy settings");
        return false;
      }
      setCfg(toEditable(j.config));
      setBaseline(toEditable(j.config));
      setSavedAt(j.config.updatedAt);
      notify(okText, "ok");
      return true;
    } catch {
      setError("Network error — could not save autonomy settings");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const save = () => cfg && void put(cfg, "Autonomy settings saved");

  const restoreDefaults = () => {
    setConfirmEnable(false);
    void put(
      { ...DEFAULT_AUTONOMY, levels: { ...DEFAULT_AUTONOMY.levels }, escalationRules: { ...DEFAULT_AUTONOMY.escalationRules } },
      "SAFE defaults restored — autonomy off"
    );
  };

  /* ── §52 email budget usage derived from the action ledger ── */
  const budgetUsed = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    let used = 0;
    for (const a of actions) {
      if (a.status !== "executed") continue;
      if (new Date(a.updatedAt).getTime() < startOfDay.getTime()) continue;
      if (a.action === "proposal.send" || a.action === "email.followup") used += 1;
      else if (a.action === "campaign.send") {
        const sent = Number(a.resultJson?.sent);
        used += Number.isFinite(sent) ? sent : 1;
      }
    }
    return used;
  }, [actions]);

  const levelsSummary = useMemo(() => {
    if (!cfg) return "";
    return AI_ACTIONS.map((a) => `${AI_ACTION_LABELS[a].split(" ")[0]}: ${AI_LEVEL_META[cfg.levels[a]].label}`).join(" · ");
  }, [cfg]);

  if (loading) {
    return (
      <div className="surface-card flex justify-center py-14">
        <Loader2 size={20} className="animate-spin text-gold" aria-label="Loading autonomy settings" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── §54 workflow chain strip ── */}
      <section className="surface-card px-5 py-4" aria-label="AI workflow chain">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-wider text-purple-300">
            <Sparkles size={12} aria-hidden="true" /> §54 chain
          </span>
          {WORKFLOW_CHAIN.map((s, idx) => (
            <span key={s.key} className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-[10.5px] font-medium",
                  idx % 2 === 0
                    ? "border-gold/35 bg-gold-dim text-gold"
                    : "border-teal/35 bg-teal-dim text-teal"
                )}
              >
                {s.label}
              </span>
              {idx < WORKFLOW_CHAIN.length - 1 && (
                <span className="text-muted-foreground/50" aria-hidden="true">
                  →
                </span>
              )}
            </span>
          ))}
        </div>
        <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
          Run the full workflow per inquiry from the <strong className="text-foreground/90">Inquiries tab → “AI workflow”</strong> button
          — every step follows the §52/§53 policy below and lands in the audit trail.
        </p>
      </section>

      {/* ── §52 control center ── */}
      <section className="surface-card px-5 py-5" aria-label="AI autonomy control center">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim">
              <ShieldCheck size={16} className="text-gold" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[14.5px] font-semibold text-foreground">Autonomy control center</h2>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                How much the AI may do on its own (§52) — every outbound action passes this gate.
              </p>
            </div>
          </div>

          {/* Master enable + confirm-on-enable popover */}
          <div className="relative">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "font-mono text-[10px] font-semibold uppercase tracking-wider",
                  cfg?.enabled ? "text-gold" : "text-muted-foreground"
                )}
              >
                {cfg?.enabled ? "Autonomy ON" : "Autonomy OFF"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={cfg?.enabled ?? false}
                aria-label="Master autonomy switch"
                onClick={toggleEnable}
                className={cn(
                  "relative h-9 w-16 shrink-0 rounded-full border transition-colors",
                  cfg?.enabled
                    ? "border-gold/60 bg-gold/25"
                    : "border-white/[0.12] bg-white/[0.05]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 h-6 w-6 rounded-full transition-all",
                    cfg?.enabled
                      ? "left-[34px] bg-gold shadow-gold"
                      : "left-1 bg-white/50"
                  )}
                  aria-hidden="true"
                />
              </button>
            </div>

            {confirmEnable && (
              <div
                role="alertdialog"
                aria-label="Confirm enabling autonomy"
                className="absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-gold/30 bg-[#0b101c] p-4 shadow-float"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                  <div>
                    <p className="text-[12.5px] font-semibold text-foreground">Enable AI autonomy?</p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                      The AI will act within the boundaries below — levels, budget, allowlists and the never-do list still apply.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setConfirmEnable(false);
                          setCfg((c) => (c ? { ...c, enabled: true } : c));
                        }}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-gold/60 bg-gold px-3.5 py-2 text-[12px] font-semibold text-ink transition-colors hover:bg-gold-light"
                      >
                        <Check size={13} aria-hidden="true" /> Enable
                      </button>
                      <button
                        onClick={() => setConfirmEnable(false)}
                        className="inline-flex min-h-[44px] items-center rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status strip */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <span className="flex items-center gap-2 text-[11.5px]">
            <span className={cn("h-2 w-2 rounded-full", cfg?.enabled ? "bg-gold" : "bg-white/35")} aria-hidden="true" />
            <span className={cfg?.enabled ? "font-semibold text-gold" : "font-semibold text-muted-foreground"}>
              {cfg?.enabled ? "AI may act (within policy)" : "AI prepares — nothing sends unattended"}
            </span>
          </span>
          <span className="font-mono text-[10.5px] text-muted-foreground">
            Budget today: <span className="text-foreground">{budgetUsed}</span> / {cfg?.maxEmailsPerDay ?? 50} emails
          </span>
          <span className="hidden font-mono text-[10.5px] text-muted-foreground lg:inline">{levelsSummary}</span>
        </div>

        {/* Level matrix (§53) */}
        <div className="mt-5">
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Per-action approval level
          </h3>
          <div className="mt-3 flex flex-col gap-3">
            {AI_ACTIONS.map((action) => (
              <div
                key={action}
                className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="min-w-[150px] sm:w-[190px]">
                  <p className="text-[12.5px] font-semibold text-foreground">{AI_ACTION_LABELS[action]}</p>
                  <p className="font-mono text-[9.5px] text-muted-foreground/70">{action}</p>
                </div>
                <div
                  className="grid flex-1 grid-cols-2 gap-1.5 sm:grid-cols-4"
                  role="group"
                  aria-label={`Approval level for ${AI_ACTION_LABELS[action]}`}
                >
                  {(["suggest", "review", "semi_autonomous", "autonomous"] as AiLevel[]).map((lvl) => {
                    const isOn = cfg?.levels[action] === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        role="radio"
                        aria-checked={isOn}
                        title={AI_LEVEL_META[lvl].hint}
                        onClick={() => setLevel(action, lvl)}
                        className={cn(
                          "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-semibold transition-colors",
                          isOn
                            ? AI_LEVEL_META[lvl].chip
                            : "border-white/[0.08] bg-white/[0.02] text-muted-foreground/80 hover:border-white/20 hover:text-foreground"
                        )}
                      >
                        {isOn && <Check size={11} aria-hidden="true" />}
                        {AI_LEVEL_META[lvl].label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget + escalation rules */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
            <label htmlFor="autonomy-budget" className="text-[12px] font-semibold text-foreground">
              Max AI emails per day
            </label>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Proposal sends, follow-ups and campaign batches — counted on the §52 daily budget.
            </p>
            <input
              id="autonomy-budget"
              type="number"
              min={0}
              max={10000}
              value={cfg?.maxEmailsPerDay ?? 50}
              onChange={(e) => {
                const n = Number(e.target.value);
                setCfg((c) => (c ? { ...c, maxEmailsPerDay: Number.isFinite(n) ? Math.max(0, Math.min(10000, Math.trunc(n))) : c.maxEmailsPerDay } : c));
              }}
              className="mt-2.5 w-32 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2.5 text-[13px] font-mono text-foreground outline-none transition-colors focus:border-gold/60"
            />
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
            <p className="text-[12px] font-semibold text-foreground">Escalation rules</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              When the AI parks instead of acting.
            </p>
            <div className="mt-2.5 flex flex-col gap-2">
              <SwitchRow
                label="On AI fallback content"
                checked={cfg?.escalationRules.onFallback ?? true}
                onChange={(v) => setCfg((c) => (c ? { ...c, escalationRules: { ...c.escalationRules, onFallback: v } } : c))}
              />
              <SwitchRow
                label="On low confidence"
                checked={cfg?.escalationRules.onLowConfidence ?? true}
                onChange={(v) => setCfg((c) => (c ? { ...c, escalationRules: { ...c.escalationRules, onLowConfidence: v } } : c))}
              />
              <SwitchRow
                label="When pricing is missing (§51)"
                checked={cfg?.escalationRules.pricingMissing ?? true}
                onChange={(v) => setCfg((c) => (c ? { ...c, escalationRules: { ...c.escalationRules, pricingMissing: v } } : c))}
              />
              <div className="flex items-center justify-between gap-3 pt-1">
                <label htmlFor="autonomy-camp-threshold" className="text-[11.5px] text-foreground/90">
                  Campaigns above recipient count
                </label>
                <input
                  id="autonomy-camp-threshold"
                  type="number"
                  min={0}
                  max={100000}
                  value={cfg?.escalationRules.campaignsAboveRecipientCount ?? 10}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setCfg((c) =>
                      c
                        ? {
                            ...c,
                            escalationRules: {
                              ...c.escalationRules,
                              campaignsAboveRecipientCount: Number.isFinite(n) ? Math.max(0, Math.min(100000, Math.trunc(n))) : c.escalationRules.campaignsAboveRecipientCount,
                            },
                          }
                        : c
                    );
                  }}
                  className="w-24 rounded-lg border border-white/[0.09] bg-white/[0.03] px-2.5 py-2 text-right text-[12px] font-mono text-foreground outline-none transition-colors focus:border-gold/60"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Allowlists + never-do list */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TagInput
            id="autonomy-recipients"
            title="Allowed recipients / domains"
            hint="When set, the AI only emails these addresses or domains (e.g. @yourco.com). Empty = everyone in CRM."
            placeholder="name@domain.com or @domain.com"
            values={cfg?.allowedRecipients ?? []}
            onChange={(v) => setCfg((c) => (c ? { ...c, allowedRecipients: v } : c))}
          />
          <TagInput
            id="autonomy-services"
            title="Allowed services"
            hint="When set, the AI only proposes these services. Empty = all configured services."
            placeholder="Brand Power Audit"
            values={cfg?.allowedServices ?? []}
            onChange={(v) => setCfg((c) => (c ? { ...c, allowedServices: v } : c))}
          />
        </div>

        <div className="mt-4">
          <TagInput
            id="autonomy-prohibited"
            title="Never-do list"
            hint="Hard blocks — the AI never performs these actions regardless of levels."
            placeholder="refund"
            values={cfg?.prohibitedActions ?? []}
            onChange={(v) => setCfg((c) => (c ? { ...c, prohibitedActions: v } : c))}
            icon={<Ban size={12} aria-hidden="true" />}
          />
        </div>

        {/* Footer: error + actions */}
        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-[12.5px] text-red-300"
          >
            {error}
          </div>
        )}
        <div className="mt-5 flex flex-col gap-2.5 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-muted-foreground/80">
            {savedAt ? `Last updated ${formatTimestamp(savedAt)}` : "Defaults (self-seeded)"}
            {dirty && <span className="ml-2 text-gold">· unsaved changes</span>}
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={restoreDefaults}
              disabled={saving}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <RotateCcw size={14} aria-hidden="true" />
              )}
              Safe defaults
            </button>
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gold/60 bg-gold px-5 py-2.5 text-[12.5px] font-semibold text-ink transition-all hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <Save size={14} aria-hidden="true" />
              )}
              Save
            </button>
          </div>
        </div>
      </section>

      {/* ── §53 approval queue + recent activity ── */}
      <AiApprovalQueue
        notify={notify}
        active={active}
        onOpenAudit={onOpenAudit}
        onActionsLoaded={setActions}
      />
    </div>
  );
}

/* ── Switch row (escalation toggles) ─────────────────────── */

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex min-h-[44px] items-center justify-between gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-white/[0.03]"
    >
      <span className="text-[11.5px] text-foreground/90">{label}</span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked ? "border-teal/60 bg-teal/25" : "border-white/[0.12] bg-white/[0.05]"
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] h-4 w-4 rounded-full transition-all",
            checked ? "left-[22px] bg-teal" : "left-[3px] bg-white/50"
          )}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}

/* ── Tag input (allowlists / never-do list) ──────────────── */

function TagInput({
  id,
  title,
  hint,
  placeholder,
  values,
  onChange,
  icon,
}: {
  id: string;
  title: string;
  hint: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  icon?: React.ReactNode;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim().toLowerCase();
    if (!v || values.includes(v)) {
      setInput("");
      return;
    }
    onChange([...values, v]);
    setInput("");
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
      <label htmlFor={id} className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
        {icon}
        {title}
      </label>
      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{hint}</p>
      {values.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] py-1 pl-2.5 pr-1 font-mono text-[10.5px] text-foreground/90"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                aria-label={`Remove ${v}`}
                className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-red-500/15 hover:text-red-300"
              >
                <X size={10} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="mt-2.5 flex items-center gap-2">
        <input
          id={id}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          aria-label={`Add to ${title}`}
          className="min-w-0 flex-1 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2.5 text-[12px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          aria-label={`Add ${title} entry`}
          className="shrink-0 rounded-lg border border-gold/35 bg-gold-dim px-3 py-2.5 text-[12px] font-semibold text-gold transition-colors hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}
