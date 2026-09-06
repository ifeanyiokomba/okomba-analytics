"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  CircleDollarSign,
  Clock3,
  GraduationCap,
  Info,
  Loader2,
  Phone,
  Plus,
  Save,
  ScrollText,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  aiServicePricePreview,
  type AiKnowledge,
  type AiContactConfig,
  type AiEducationItem,
  type AiFaqItem,
  type AiServicePrice,
} from "@/lib/chat-shared";
import { formatTimestamp } from "./types";

/* ─────────────────────────────────────────────────────────────
   BATCH 11 (§50/§51) — AI Knowledge Base editor.

   GET /api/admin/ai/knowledge on mount; each section card saves
   ITSELF via a partial PUT (only that section travels — untouched
   sections can never be reset). 422 validation errors render inline
   next to the offending section; success toasts through the
   dashboard `notify` prop + shows the §51 figure rule.
   ───────────────────────────────────────────────────────────── */

type SectionKey = "businessProfile" | "contact" | "faq" | "services" | "education" | "policies";

const SECTION_LABELS: Record<SectionKey, string> = {
  businessProfile: "Business profile",
  contact: "Contact",
  faq: "FAQ",
  services: "Services & pricing",
  education: "Education",
  policies: "Policies",
};

const POLICY_FIELDS: { key: keyof AiKnowledge["policies"]; label: string; hint: string }[] = [
  { key: "paymentPolicy", label: "Payment policy", hint: "How and when clients pay (₦ figures here may be quoted by the AI)." },
  { key: "cancellationPolicy", label: "Cancellation policy", hint: "Cancellation windows and refunds." },
  { key: "depositPolicy", label: "Deposit policy", hint: "Upfront deposits, e.g. “projects start from a ₦150,000 deposit”." },
  { key: "invoiceTerms", label: "Invoice terms", hint: "Due days, validity, late fees." },
  { key: "discounts", label: "Discounts", hint: "Bundle or repeat-client discounts." },
];

const inputBase =
  "w-full rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-gold/60";
const labelBase = "mb-1.5 block text-[11px] font-medium text-muted-foreground";

export function AiKnowledgeEditor({ notify }: { notify: (text: string, type?: "ok" | "err") => void }) {
  const [knowledge, setKnowledge] = useState<AiKnowledge | null>(null);
  const [draft, setDraft] = useState<AiKnowledge | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<SectionKey | null>(null);
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<SectionKey, string>>>({});
  const [savedFlash, setSavedFlash] = useState<SectionKey | null>(null);

  /* ── Load ── */
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai/knowledge", { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as { ok: boolean; knowledge?: AiKnowledge };
      if (j.ok && j.knowledge) {
        setKnowledge(j.knowledge);
        setDraft(structuredClone(j.knowledge));
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

  useEffect(() => {
    if (!savedFlash) return;
    const t = setTimeout(() => setSavedFlash(null), 4000);
    return () => clearTimeout(t);
  }, [savedFlash]);

  /* ── Section payload builder (used for BOTH the draft snapshot
     being saved and the last-saved snapshot for dirty tracking) ── */
  const buildSectionPayloadFrom = (section: SectionKey, src: AiKnowledge): Record<string, unknown> => {
    switch (section) {
      case "businessProfile":
        return { businessProfile: src.businessProfile?.trim() ?? "" };
      case "contact": {
        const c = src.contact;
        const contact: AiContactConfig = {
          ...(c.phone?.trim() ? { phone: c.phone.trim() } : {}),
          ...(c.whatsapp?.trim() ? { whatsapp: c.whatsapp.trim() } : {}),
          ...(c.email?.trim() ? { email: c.email.trim() } : {}),
          ...(c.address?.trim() ? { address: c.address.trim() } : {}),
          ...(c.hours?.trim() ? { hours: c.hours.trim() } : {}),
          callbackEnabled: c.callbackEnabled !== false,
        };
        return { contact };
      }
      case "faq":
        return {
          faq: src.faq
            .map((f) => ({ q: f.q.trim(), a: f.a.trim() }))
            .filter((f) => f.q.length > 0 && f.a.length > 0),
        };
      case "services":
        return {
          services: src.services
            .map((s) => ({
              name: s.name.trim(),
              ...(s.description?.trim() ? { description: s.description.trim() } : {}),
              ...(s.duration?.trim() ? { duration: s.duration.trim() } : {}),
              ...(typeof s.priceMin === "number" && Number.isFinite(s.priceMin) ? { priceMin: s.priceMin } : {}),
              ...(typeof s.priceMax === "number" && Number.isFinite(s.priceMax) ? { priceMax: s.priceMax } : {}),
              ...(s.currency?.trim() ? { currency: s.currency.trim() } : {}),
            }))
            .filter((s) => s.name.length > 0),
        };
      case "education":
        return {
          education: src.education
            .map((e) => ({
              course: e.course.trim(),
              ...(e.description?.trim() ? { description: e.description.trim() } : {}),
              ...(e.duration?.trim() ? { duration: e.duration.trim() } : {}),
            }))
            .filter((e) => e.course.length > 0),
        };
      case "policies": {
        const p = src.policies;
        return {
          policies: {
            ...(p.paymentPolicy?.trim() ? { paymentPolicy: p.paymentPolicy.trim() } : {}),
            ...(p.cancellationPolicy?.trim() ? { cancellationPolicy: p.cancellationPolicy.trim() } : {}),
            ...(p.depositPolicy?.trim() ? { depositPolicy: p.depositPolicy.trim() } : {}),
            ...(p.invoiceTerms?.trim() ? { invoiceTerms: p.invoiceTerms.trim() } : {}),
            ...(p.discounts?.trim() ? { discounts: p.discounts.trim() } : {}),
          },
        };
      }
    }
  };

  const isDirty = (section: SectionKey): boolean => {
    if (!knowledge || !draft) return false;
    return (
      JSON.stringify(buildSectionPayloadFrom(section, draft)) !==
      JSON.stringify(buildSectionPayloadFrom(section, knowledge))
    );
  };

  const saveSection = async (section: SectionKey) => {
    if (!draft) return;
    setSavingSection(section);
    setSectionErrors((prev) => ({ ...prev, [section]: undefined }));
    try {
      const res = await fetch("/api/admin/ai/knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSectionPayloadFrom(section, draft)),
      });
      const j = (await res.json().catch(() => null)) as { ok: boolean; knowledge?: AiKnowledge; error?: string } | null;
      if (!res.ok || !j?.ok) {
        setSectionErrors((prev) => ({ ...prev, [section]: j?.error ?? "Could not save — please retry" }));
        notify(j?.error ?? "Could not save this section", "err");
        return;
      }
      if (j.knowledge) {
        setKnowledge(j.knowledge);
        setDraft(structuredClone(j.knowledge));
      }
      setSavedFlash(section);
      notify("Knowledge updated", "ok");
    } catch {
      setSectionErrors((prev) => ({ ...prev, [section]: "Network error — please retry" }));
      notify("Network error — could not save", "err");
    } finally {
      setSavingSection(null);
    }
  };

  /* ── Draft mutators ── */
  const patchDraft = (fn: (d: AiKnowledge) => void) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="surface-card flex items-center justify-center py-24">
        <Loader2 size={22} className="animate-spin text-gold" aria-label="Loading AI knowledge" />
      </div>
    );
  }

  if (!draft || !knowledge) {
    return (
      <div className="surface-card px-6 py-12 text-center">
        <p className="text-[13px] font-medium text-foreground">Couldn&apos;t load the AI knowledge base</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Check your access_ai permission or try the refresh button on the conversations list.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Grounding banner (§49/§51) */}
      <div className="surface-card flex items-start gap-3 border-purple-400/20 px-5 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-400/10">
          <Info size={16} className="text-purple-300" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-foreground">
            This knowledge grounds every AI chat reply
          </p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
            Live public events are included automatically. Only figures configured here may be quoted by
            the AI; anything else becomes <em>&ldquo;custom (in your proposal)&rdquo;</em>.
          </p>
          <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/70">
            Last updated {formatTimestamp(knowledge.updatedAt)}
          </p>
        </div>
      </div>

      {/* ── Business profile ── */}
      <section className="surface-card flex flex-col gap-4 px-5 py-4" aria-labelledby="ai-kb-profile-h">
        <header className="flex items-center gap-3">
          <BookOpen size={15} className="shrink-0 text-gold" aria-hidden="true" />
          <h3 id="ai-kb-profile-h" className="flex-1 text-[13.5px] font-semibold text-foreground">
            {SECTION_LABELS.businessProfile}
          </h3>
          <SectionSaveButton
            section="businessProfile"
            dirty={isDirty("businessProfile")}
            saving={savingSection === "businessProfile"}
            error={sectionErrors.businessProfile}
            saved={savedFlash === "businessProfile"}
            onSave={saveSection}
          />
        </header>
        <div>
          <label htmlFor="ai-kb-profile" className={labelBase}>
            Who Okomba Analytics is, what it does, who it serves — the AI answers identity questions from this.
          </label>
          <textarea
            id="ai-kb-profile"
            rows={5}
            value={draft.businessProfile ?? ""}
            maxLength={8000}
            onChange={(e) => patchDraft((d) => { d.businessProfile = e.target.value; })}
            placeholder="e.g. Okomba Analytics is a Nigerian data & analytics consultancy…"
            className={cn(inputBase, "resize-y leading-relaxed")}
          />
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="surface-card flex flex-col gap-4 px-5 py-4" aria-labelledby="ai-kb-contact-h">
        <header className="flex items-center gap-3">
          <Phone size={15} className="shrink-0 text-gold" aria-hidden="true" />
          <h3 id="ai-kb-contact-h" className="flex-1 text-[13.5px] font-semibold text-foreground">
            {SECTION_LABELS.contact}
          </h3>
          <SectionSaveButton
            section="contact"
            dirty={isDirty("contact")}
            saving={savingSection === "contact"}
            error={sectionErrors.contact}
            saved={savedFlash === "contact"}
            onSave={saveSection}
          />
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ai-kb-phone" className={labelBase}>Phone</label>
            <input id="ai-kb-phone" type="tel" value={draft.contact.phone ?? ""} maxLength={40}
              onChange={(e) => patchDraft((d) => { d.contact.phone = e.target.value; })}
              placeholder="+234 808 894 8657" className={inputBase} />
          </div>
          <div>
            <label htmlFor="ai-kb-whatsapp" className={labelBase}>WhatsApp</label>
            <input id="ai-kb-whatsapp" type="text" value={draft.contact.whatsapp ?? ""} maxLength={200}
              onChange={(e) => patchDraft((d) => { d.contact.whatsapp = e.target.value; })}
              placeholder="https://wa.me/2348088948657" className={inputBase} />
          </div>
          <div>
            <label htmlFor="ai-kb-email" className={labelBase}>Email</label>
            <input id="ai-kb-email" type="email" value={draft.contact.email ?? ""} maxLength={200}
              onChange={(e) => patchDraft((d) => { d.contact.email = e.target.value; })}
              placeholder="support@okomba.com" className={inputBase} />
          </div>
          <div>
            <label htmlFor="ai-kb-address" className={labelBase}>Address</label>
            <input id="ai-kb-address" type="text" value={draft.contact.address ?? ""} maxLength={200}
              onChange={(e) => patchDraft((d) => { d.contact.address = e.target.value; })}
              placeholder="Lagos, Nigeria" className={inputBase} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ai-kb-hours" className={labelBase}>Business hours</label>
            <input id="ai-kb-hours" type="text" value={draft.contact.hours ?? ""} maxLength={120}
              onChange={(e) => patchDraft((d) => { d.contact.hours = e.target.value; })}
              placeholder="Mon–Sat, 8:00–18:00 WAT" className={inputBase} />
          </div>
        </div>
        {/* callbackEnabled toggle (§61 callback alternative) */}
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-[12.5px] font-medium text-foreground">
              <Clock3 size={13} className="text-gold" aria-hidden="true" /> Offer callback requests
            </span>
            <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
              When the team declines a chat, the AI may offer to schedule a callback.
            </span>
          </span>
          <span className="relative inline-flex shrink-0">
            <input
              type="checkbox"
              role="switch"
              checked={draft.contact.callbackEnabled !== false}
              onChange={(e) => patchDraft((d) => { d.contact.callbackEnabled = e.target.checked; })}
              aria-label="Offer callback requests when the team is unavailable"
              className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full border border-white/[0.12] bg-white/[0.06] transition-colors peer-checked:border-teal/60 peer-checked:bg-teal-dim peer-focus-visible:ring-2 peer-focus-visible:ring-gold/50" aria-hidden="true" />
            <span className="pointer-events-none absolute left-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-[#0B0F1A] text-[10px] font-bold text-muted-foreground transition-transform peer-checked:translate-x-5 peer-checked:border-teal/50 peer-checked:text-teal" aria-hidden="true">
              {draft.contact.callbackEnabled !== false ? <Check size={11} /> : null}
            </span>
          </span>
        </label>
      </section>

      {/* ── FAQ ── */}
      <section className="surface-card flex flex-col gap-4 px-5 py-4" aria-labelledby="ai-kb-faq-h">
        <header className="flex items-center gap-3">
          <ScrollText size={15} className="shrink-0 text-gold" aria-hidden="true" />
          <h3 id="ai-kb-faq-h" className="flex-1 text-[13.5px] font-semibold text-foreground">
            {SECTION_LABELS.faq}
            <span className="ml-2 font-mono text-[10px] font-normal text-muted-foreground">
              {draft.faq.length}/50
            </span>
          </h3>
          <SectionSaveButton
            section="faq"
            dirty={isDirty("faq")}
            saving={savingSection === "faq"}
            error={sectionErrors.faq}
            saved={savedFlash === "faq"}
            onSave={saveSection}
          />
        </header>
        {draft.faq.length === 0 && (
          <p className="text-[11.5px] text-muted-foreground">
            No FAQs yet — pairs you add here are answered verbatim-grounded in chat.
          </p>
        )}
        <div className="flex flex-col gap-3">
          {draft.faq.map((f, idx) => (
            <FaqRow
              key={idx}
              row={f}
              index={idx}
              onChange={(q, a) => patchDraft((d) => { d.faq[idx] = { q, a }; })}
              onRemove={() => patchDraft((d) => { d.faq.splice(idx, 1); })}
            />
          ))}
        </div>
        <button
          onClick={() => patchDraft((d) => { d.faq.push({ q: "", a: "" }); })}
          disabled={draft.faq.length >= 50}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={13} aria-hidden="true" /> Add FAQ
        </button>
      </section>

      {/* ── Services & pricing (§51) ── */}
      <section className="surface-card flex flex-col gap-4 px-5 py-4" aria-labelledby="ai-kb-services-h">
        <header className="flex items-center gap-3">
          <CircleDollarSign size={15} className="shrink-0 text-gold" aria-hidden="true" />
          <h3 id="ai-kb-services-h" className="flex-1 text-[13.5px] font-semibold text-foreground">
            {SECTION_LABELS.services}
            <span className="ml-2 font-mono text-[10px] font-normal text-muted-foreground">
              {draft.services.length}/50
            </span>
          </h3>
          <SectionSaveButton
            section="services"
            dirty={isDirty("services")}
            saving={savingSection === "services"}
            error={sectionErrors.services}
            saved={savedFlash === "services"}
            onSave={saveSection}
          />
        </header>
        <p className="text-[11.5px] leading-relaxed text-muted-foreground">
          These are the ONLY price figures the AI may quote (§51). Leave both prices empty for
          &ldquo;custom (in your proposal)&rdquo;.
        </p>
        <div className="flex flex-col gap-3">
          {draft.services.map((s, idx) => (
            <ServiceRow
              key={idx}
              row={s}
              index={idx}
              onChange={(patch) => patchDraft((d) => { d.services[idx] = { ...d.services[idx], ...patch }; })}
              onRemove={() => patchDraft((d) => { d.services.splice(idx, 1); })}
            />
          ))}
        </div>
        <button
          onClick={() => patchDraft((d) => { d.services.push({ name: "" }); })}
          disabled={draft.services.length >= 50}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={13} aria-hidden="true" /> Add service
        </button>
      </section>

      {/* ── Education ── */}
      <section className="surface-card flex flex-col gap-4 px-5 py-4" aria-labelledby="ai-kb-education-h">
        <header className="flex items-center gap-3">
          <GraduationCap size={15} className="shrink-0 text-gold" aria-hidden="true" />
          <h3 id="ai-kb-education-h" className="flex-1 text-[13.5px] font-semibold text-foreground">
            {SECTION_LABELS.education}
            <span className="ml-2 font-mono text-[10px] font-normal text-muted-foreground">
              {draft.education.length}/50
            </span>
          </h3>
          <SectionSaveButton
            section="education"
            dirty={isDirty("education")}
            saving={savingSection === "education"}
            error={sectionErrors.education}
            saved={savedFlash === "education"}
            onSave={saveSection}
          />
        </header>
        {draft.education.length === 0 && (
          <p className="text-[11.5px] text-muted-foreground">
            No courses yet — training offers you add here are pitched by the AI.
          </p>
        )}
        <div className="flex flex-col gap-3">
          {draft.education.map((e, idx) => (
            <EducationRow
              key={idx}
              row={e}
              index={idx}
              onChange={(patch) => patchDraft((d) => { d.education[idx] = { ...d.education[idx], ...patch }; })}
              onRemove={() => patchDraft((d) => { d.education.splice(idx, 1); })}
            />
          ))}
        </div>
        <button
          onClick={() => patchDraft((d) => { d.education.push({ course: "" }); })}
          disabled={draft.education.length >= 50}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={13} aria-hidden="true" /> Add course
        </button>
      </section>

      {/* ── Policies ── */}
      <section className="surface-card flex flex-col gap-4 px-5 py-4" aria-labelledby="ai-kb-policies-h">
        <header className="flex items-center gap-3">
          <ScrollText size={15} className="shrink-0 text-gold" aria-hidden="true" />
          <h3 id="ai-kb-policies-h" className="flex-1 text-[13.5px] font-semibold text-foreground">
            {SECTION_LABELS.policies}
          </h3>
          <SectionSaveButton
            section="policies"
            dirty={isDirty("policies")}
            saving={savingSection === "policies"}
            error={sectionErrors.policies}
            saved={savedFlash === "policies"}
            onSave={saveSection}
          />
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {POLICY_FIELDS.map((f) => (
            <div key={f.key}>
              <label htmlFor={`ai-kb-policy-${f.key}`} className={labelBase}>
                {f.label}
              </label>
              <textarea
                id={`ai-kb-policy-${f.key}`}
                rows={3}
                maxLength={2000}
                value={draft.policies[f.key] ?? ""}
                onChange={(e) => patchDraft((d) => { d.policies[f.key] = e.target.value; })}
                placeholder={f.hint}
                className={cn(inputBase, "resize-y leading-relaxed")}
              />
              <p className="mt-1 text-[10px] text-muted-foreground/70">{f.hint}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── Section save button + inline error / saved flash ────── */

function SectionSaveButton({
  section,
  dirty,
  saving,
  error,
  saved,
  onSave,
}: {
  section: SectionKey;
  dirty: boolean;
  saving: boolean;
  error?: string;
  saved: boolean;
  onSave: (section: SectionKey) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col items-end gap-1">
      <button
        onClick={() => void onSave(section)}
        disabled={saving}
        aria-label={`Save ${SECTION_LABELS[section]} section`}
        className={cn(
          "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-[11.5px] font-semibold transition-colors",
          saving
            ? "cursor-wait border-white/[0.09] bg-white/[0.03] text-muted-foreground"
            : dirty
              ? "border-gold/45 bg-gold-dim text-gold hover:bg-gold/20"
              : "border-white/[0.09] bg-white/[0.03] text-muted-foreground hover:text-gold"
        )}
      >
        {saving ? (
          <Loader2 size={12} className="animate-spin" aria-hidden="true" />
        ) : saved ? (
          <Check size={12} aria-hidden="true" />
        ) : (
          <Save size={12} aria-hidden="true" />
        )}
        {saving ? "Saving…" : saved ? "Saved" : "Save"}
      </button>
      {error && (
        <p role="alert" className="max-w-[260px] text-right text-[10.5px] leading-snug text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

/* ── FAQ row ────────────────────────────────────────────── */

function FaqRow({
  row,
  index,
  onChange,
  onRemove,
}: {
  row: AiFaqItem;
  index: number;
  onChange: (q: string, a: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[10px] text-muted-foreground/70">Q{index + 1}</span>
        <input
          type="text"
          value={row.q}
          maxLength={300}
          aria-label={`FAQ question ${index + 1}`}
          placeholder="How fast can we start?"
          onChange={(e) => onChange(e.target.value, row.a)}
          className={inputBase}
        />
        <button
          onClick={onRemove}
          aria-label={`Remove FAQ ${index + 1}`}
          className="shrink-0 rounded-lg border border-white/[0.09] bg-white/[0.03] p-2 text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-300"
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
      <textarea
        value={row.a}
        rows={2}
        maxLength={2000}
        aria-label={`FAQ answer ${index + 1}`}
        placeholder="Projects typically kick off within 5 working days of the deposit."
        onChange={(e) => onChange(row.q, e.target.value)}
        className={cn(inputBase, "mt-2.5 resize-y leading-relaxed")}
      />
    </div>
  );
}

/* ── Services row (§51 — with live price preview) ────────── */

function ServiceRow({
  row,
  index,
  onChange,
  onRemove,
}: {
  row: AiServicePrice;
  index: number;
  onChange: (patch: Partial<AiServicePrice>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[10px] text-muted-foreground/70">#{index + 1}</span>
        <input
          type="text"
          value={row.name}
          maxLength={120}
          aria-label={`Service ${index + 1} name`}
          placeholder="Data Dashboard Build"
          onChange={(e) => onChange({ name: e.target.value })}
          className={inputBase}
        />
        <button
          onClick={onRemove}
          aria-label={`Remove service ${index + 1}`}
          className="shrink-0 rounded-lg border border-white/[0.09] bg-white/[0.03] p-2 text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-300"
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
      <textarea
        value={row.description ?? ""}
        rows={2}
        maxLength={400}
        aria-label={`Service ${index + 1} description`}
        placeholder="Interactive dashboards on your live data sources…"
        onChange={(e) => onChange({ description: e.target.value })}
        className={cn(inputBase, "mt-2.5 resize-y leading-relaxed")}
      />
      <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div>
          <label className={labelBase} htmlFor={`svc-min-${index}`}>Price min (₦)</label>
          <input
            id={`svc-min-${index}`}
            type="number"
            min={0}
            step={1000}
            value={row.priceMin ?? ""}
            aria-label={`Service ${index + 1} minimum price`}
            placeholder="350000"
            onChange={(e) => onChange({ priceMin: e.target.value === "" ? undefined : Number(e.target.value) })}
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelBase} htmlFor={`svc-max-${index}`}>Price max (₦)</label>
          <input
            id={`svc-max-${index}`}
            type="number"
            min={0}
            step={1000}
            value={row.priceMax ?? ""}
            aria-label={`Service ${index + 1} maximum price`}
            placeholder="1200000"
            onChange={(e) => onChange({ priceMax: e.target.value === "" ? undefined : Number(e.target.value) })}
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelBase} htmlFor={`svc-dur-${index}`}>Duration</label>
          <input
            id={`svc-dur-${index}`}
            type="text"
            value={row.duration ?? ""}
            maxLength={80}
            aria-label={`Service ${index + 1} duration`}
            placeholder="3–6 weeks"
            onChange={(e) => onChange({ duration: e.target.value })}
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelBase} htmlFor={`svc-cur-${index}`}>Currency</label>
          <input
            id={`svc-cur-${index}`}
            type="text"
            value={row.currency ?? ""}
            maxLength={8}
            aria-label={`Service ${index + 1} currency`}
            placeholder="NGN"
            onChange={(e) => onChange({ currency: e.target.value })}
            className={inputBase}
          />
        </div>
      </div>
      {/* §51 live preview — exactly what the AI may quote */}
      <p className="mt-2.5 flex items-center gap-2 font-mono text-[10.5px] text-teal">
        <CircleDollarSign size={11} aria-hidden="true" />
        {aiServicePricePreview(row) || "custom (in your proposal)"}
      </p>
    </div>
  );
}

/* ── Education row ──────────────────────────────────────── */

function EducationRow({
  row,
  index,
  onChange,
  onRemove,
}: {
  row: AiEducationItem;
  index: number;
  onChange: (patch: Partial<AiEducationItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[10px] text-muted-foreground/70">#{index + 1}</span>
        <input
          type="text"
          value={row.course}
          maxLength={160}
          aria-label={`Course ${index + 1} name`}
          placeholder="Data Analytics Fundamentals"
          onChange={(e) => onChange({ course: e.target.value })}
          className={inputBase}
        />
        <button
          onClick={onRemove}
          aria-label={`Remove course ${index + 1}`}
          className="shrink-0 rounded-lg border border-white/[0.09] bg-white/[0.03] p-2 text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-300"
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
      <textarea
        value={row.description ?? ""}
        rows={2}
        maxLength={600}
        aria-label={`Course ${index + 1} description`}
        placeholder="Six-week hands-on cohort covering…"
        onChange={(e) => onChange({ description: e.target.value })}
        className={cn(inputBase, "mt-2.5 resize-y leading-relaxed")}
      />
      <div className="mt-2.5 max-w-xs">
        <label className={labelBase} htmlFor={`edu-dur-${index}`}>Duration</label>
        <input
          id={`edu-dur-${index}`}
          type="text"
          value={row.duration ?? ""}
          maxLength={80}
          aria-label={`Course ${index + 1} duration`}
          placeholder="6 weeks"
          onChange={(e) => onChange({ duration: e.target.value })}
          className={inputBase}
        />
      </div>
    </div>
  );
}
