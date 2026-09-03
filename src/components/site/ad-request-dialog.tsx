"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Megaphone, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AD_PLACEMENTS, AD_TYPES } from "@/lib/ads-shared";
import { COUNTRIES } from "@/lib/countries";

type AdRequestDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (name: string) => void;
};

/* ── BATCH 6 (§37) — public "Request Advertisement" form ──────
   Captures the full §37 contract: identity (first/last/company/
   email/phone/whatsapp/country/website), campaign (ad type,
   placement, start date, duration, budget, description) plus an
   optional attachment and explicit terms/consent.               */

type FormState = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  whatsapp: string;
  country: string;
  websiteUrl: string;
  adType: string;
  placement: string;
  startDate: string;
  durationDays: string;
  budget: string;
  description: string;
  terms: boolean;
};

const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  company: "",
  email: "",
  phone: "",
  whatsapp: "",
  country: "",
  websiteUrl: "",
  adType: "banner",
  placement: "home-banner",
  startDate: "",
  durationDays: "",
  budget: "",
  description: "",
  terms: false,
};

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export function AdRequestDialog({ open, onClose, onSuccess }: AdRequestDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setApiError(null);
    setAttachment(null);
    const t = setTimeout(() => firstFieldRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [open]);

  /* §14 a11y: Escape closes, Tab is trapped, body scroll locked */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, submitting]);

  const set =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((f) => ({ ...f, [key]: value }));
      setErrors((er) => ({ ...er, [key]: undefined }));
    };

  const validate = (): boolean => {
    const er: typeof errors = {};
    if (form.firstName.trim().length < 1) er.firstName = "First name is required";
    if (form.lastName.trim().length < 1) er.lastName = "Last name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) er.email = "A valid email is required";
    if (form.phone.trim().length < 7) er.phone = "A valid phone number is required";
    if (!form.country) er.country = "Please select your country";
    if (form.websiteUrl.trim() && !/^https?:\/\/.+\..+/.test(form.websiteUrl.trim()))
      er.websiteUrl = "Include the full URL (https://…)";
    if (form.durationDays.trim() && (!/^\d+$/.test(form.durationDays.trim()) || Number(form.durationDays) < 1))
      er.durationDays = "Whole days only";
    if (form.description.trim().length < 20) er.description = "Describe your campaign (min. 20 characters)";
    if (!form.terms) er.terms = "Please accept the advertising terms to continue";
    if (attachment && attachment.size > MAX_ATTACHMENT_BYTES)
      er.description = "Attachment exceeds the 10 MB limit";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.set("firstName", form.firstName.trim());
      payload.set("lastName", form.lastName.trim());
      if (form.company.trim()) payload.set("company", form.company.trim());
      payload.set("email", form.email.trim());
      payload.set("phone", form.phone.trim());
      if (form.whatsapp.trim()) payload.set("whatsapp", form.whatsapp.trim());
      if (form.country) payload.set("country", form.country);
      if (form.websiteUrl.trim()) payload.set("websiteUrl", form.websiteUrl.trim());
      payload.set("adType", form.adType);
      payload.set("placement", form.placement);
      if (form.startDate) payload.set("startDate", form.startDate);
      if (form.durationDays.trim()) payload.set("durationDays", form.durationDays.trim());
      if (form.budget.trim()) payload.set("budget", form.budget.trim());
      payload.set("description", form.description.trim());
      payload.set("termsConsent", "true");
      payload.set("honeypot", "");
      if (attachment) payload.set("attachment", attachment);

      const res = await fetch("/api/ads/request", { method: "POST", body: payload });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Submission failed. Please try again.");
      onSuccess(`${form.firstName.trim()} ${form.lastName.trim()}`.trim());
      setForm(INITIAL_FORM);
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (key: keyof FormState) =>
    cn(
      "w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors",
      errors[key]
        ? "border-red-500/60 focus:border-red-500"
        : "border-white/[0.09] focus:border-gold/60 focus:bg-gold/[0.04]"
    );

  const labelCls = "mb-1.5 block text-[12.5px] font-medium text-muted-foreground";
  const errorCls = "mt-1.5 flex items-center gap-1.5 text-[11.5px] text-red-400";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Request advertisement form"
      onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}
    >
      <div
        ref={dialogRef}
        className="section-dark relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)] sm:rounded-3xl"
      >
        <header className="relative border-b border-white/[0.06] p-6 md:px-7">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/[0.1] blur-2xl"
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-[9px] text-gold">Advertise with us</p>
              <h2 className="mt-2 font-display text-[20px] font-bold leading-snug text-foreground">
                Request advertising space
              </h2>
              <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                Tell us about your campaign — we reply within 1–2 business days.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close form"
              disabled={submitting}
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        <form onSubmit={submit} noValidate className="flex flex-col overflow-y-auto">
          <div className="space-y-4.5 px-6 py-6 md:px-7" style={{ display: "grid", gap: "1.05rem" }}>
            {/* Identity */}
            <div className="grid gap-4 sm:grid-cols-2" style={{ gap: "1.05rem" }}>
              <div>
                <label htmlFor="ad-firstName" className={labelCls}>
                  First name *
                </label>
                <input
                  ref={firstFieldRef}
                  id="ad-firstName"
                  type="text"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={set("firstName")}
                  className={inputCls("firstName")}
                  placeholder="Adaeze"
                  aria-invalid={!!errors.firstName}
                />
                {errors.firstName && (
                  <p className={errorCls}>
                    <AlertCircle size={12} aria-hidden="true" /> {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="ad-lastName" className={labelCls}>
                  Last name *
                </label>
                <input
                  id="ad-lastName"
                  type="text"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={set("lastName")}
                  className={inputCls("lastName")}
                  placeholder="Nwosu"
                  aria-invalid={!!errors.lastName}
                />
                {errors.lastName && (
                  <p className={errorCls}>
                    <AlertCircle size={12} aria-hidden="true" /> {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="ad-company" className={labelCls}>
                Company / business
              </label>
              <input
                id="ad-company"
                type="text"
                autoComplete="organization"
                value={form.company}
                onChange={set("company")}
                className={inputCls("company")}
                placeholder="EduBridge Foundation"
              />
            </div>

            <div>
              <label htmlFor="ad-email" className={labelCls}>
                Email *
              </label>
              <input
                id="ad-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set("email")}
                className={inputCls("email")}
                placeholder="you@company.com"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className={errorCls}>
                  <AlertCircle size={12} aria-hidden="true" /> {errors.email}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2" style={{ gap: "1.05rem" }}>
              <div>
                <label htmlFor="ad-phone" className={labelCls}>
                  Phone *
                </label>
                <input
                  id="ad-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  className={inputCls("phone")}
                  placeholder="+234 803 000 0000"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && (
                  <p className={errorCls}>
                    <AlertCircle size={12} aria-hidden="true" /> {errors.phone}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="ad-whatsapp" className={labelCls}>
                  WhatsApp
                </label>
                <input
                  id="ad-whatsapp"
                  type="tel"
                  value={form.whatsapp}
                  onChange={set("whatsapp")}
                  className={inputCls("whatsapp")}
                  placeholder="+234 803 000 0000"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2" style={{ gap: "1.05rem" }}>
              <div>
                <label htmlFor="ad-country" className={labelCls}>
                  Country *
                </label>
                <select
                  id="ad-country"
                  value={form.country}
                  onChange={set("country")}
                  className={cn(inputCls("country"), "appearance-none")}
                  aria-invalid={!!errors.country}
                >
                  <option value="">Select country…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className={errorCls}>
                    <AlertCircle size={12} aria-hidden="true" /> {errors.country}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="ad-website" className={labelCls}>
                  Website / social URL
                </label>
                <input
                  id="ad-website"
                  type="url"
                  value={form.websiteUrl}
                  onChange={set("websiteUrl")}
                  className={inputCls("websiteUrl")}
                  placeholder="https://…"
                  aria-invalid={!!errors.websiteUrl}
                />
                {errors.websiteUrl && (
                  <p className={errorCls}>
                    <AlertCircle size={12} aria-hidden="true" /> {errors.websiteUrl}
                  </p>
                )}
              </div>
            </div>

            {/* Campaign */}
            <div className="h-px bg-white/[0.07]" aria-hidden="true" />

            <div>
              <span className={labelCls}>Ad format *</span>
              <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Ad format">
                {AD_TYPES.map((t) => (
                  <label
                    key={t.key}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                      form.adType === t.key
                        ? "border-gold/50 bg-gold/[0.07]"
                        : "border-white/[0.09] bg-white/[0.02] hover:border-white/20"
                    )}
                  >
                    <input
                      type="radio"
                      name="adType"
                      value={t.key}
                      checked={form.adType === t.key}
                      onChange={set("adType")}
                      className="sr-only"
                    />
                    <Megaphone
                      size={15}
                      className={cn("mt-0.5 shrink-0", form.adType === t.key ? "text-gold" : "text-muted-foreground")}
                      aria-hidden="true"
                    />
                    <span>
                      <span
                        className={cn(
                          "block text-[13px] font-medium",
                          form.adType === t.key ? "text-foreground" : "text-foreground/85"
                        )}
                      >
                        {t.label}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-muted-foreground">{t.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="ad-placement" className={labelCls}>
                Preferred placement *
              </label>
              <select
                id="ad-placement"
                value={form.placement}
                onChange={set("placement")}
                className={cn(inputCls("placement"), "appearance-none")}
              >
                {AD_PLACEMENTS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                {AD_PLACEMENTS.find((p) => p.key === form.placement)?.desc}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3" style={{ gap: "1.05rem" }}>
              <div>
                <label htmlFor="ad-start" className={labelCls}>
                  Preferred start
                </label>
                <input
                  id="ad-start"
                  type="date"
                  value={form.startDate}
                  onChange={set("startDate")}
                  className={inputCls("startDate")}
                />
              </div>
              <div>
                <label htmlFor="ad-duration" className={labelCls}>
                  Duration (days)
                </label>
                <input
                  id="ad-duration"
                  type="number"
                  min={1}
                  max={365}
                  value={form.durationDays}
                  onChange={set("durationDays")}
                  className={inputCls("durationDays")}
                  placeholder="30"
                  aria-invalid={!!errors.durationDays}
                />
                {errors.durationDays && (
                  <p className={errorCls}>
                    <AlertCircle size={12} aria-hidden="true" /> {errors.durationDays}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="ad-budget" className={labelCls}>
                  Budget
                </label>
                <input
                  id="ad-budget"
                  type="text"
                  value={form.budget}
                  onChange={set("budget")}
                  className={inputCls("budget")}
                  placeholder="₦250k"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ad-description" className={labelCls}>
                Campaign description *
              </label>
              <textarea
                id="ad-description"
                rows={4}
                value={form.description}
                onChange={set("description")}
                className={cn(inputCls("description"), "resize-none")}
                placeholder="What are you promoting, who is your audience, and what outcome do you want?"
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className={errorCls}>
                  <AlertCircle size={12} aria-hidden="true" /> {errors.description}
                </p>
              )}
            </div>

            {/* §92 honeypot — hidden from humans, irresistible to bots */}
            <input
              type="text"
              name="honeypot"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />

            <div>
              <label htmlFor="ad-attachment" className={labelCls}>
                Attachment (brief, logo, or creative — optional)
              </label>
              <label
                htmlFor="ad-attachment"
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/[0.14] bg-white/[0.02] px-4 py-3.5 text-[13px] text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground"
              >
                <Paperclip size={15} aria-hidden="true" />
                <span className="truncate">
                  {attachment
                    ? `${attachment.name} · ${(attachment.size / 1024).toFixed(0)} KB`
                    : "Attach an image, PDF, or document (max 10 MB)"}
                </span>
              </label>
              <input
                id="ad-attachment"
                type="file"
                accept="image/*,application/pdf,.doc,.docx,.txt"
                className="sr-only"
                onChange={(e) => {
                  setAttachment(e.target.files?.[0] ?? null);
                  setErrors((er) => ({ ...er, description: undefined }));
                }}
              />
            </div>

            {/* Terms / consent (§37) */}
            <div>
              <label
                htmlFor="ad-terms"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.09] bg-white/[0.02] px-4 py-3"
              >
                <input
                  id="ad-terms"
                  type="checkbox"
                  checked={form.terms}
                  onChange={set("terms")}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#d4af37]"
                  aria-invalid={!!errors.terms}
                />
                <span className="text-[12.5px] leading-relaxed text-muted-foreground">
                  I agree that the information submitted may be used to evaluate and deliver my
                  advertising request, and I accept the advertising terms: campaigns are subject to
                  review, scheduled inventory, and brand-safety guidelines. Payment is due before a
                  campaign goes live.
                </span>
              </label>
              {errors.terms && (
                <p className={errorCls}>
                  <AlertCircle size={12} aria-hidden="true" /> {errors.terms}
                </p>
              )}
            </div>

            {apiError && (
              <p
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12.5px] text-red-300"
                role="alert"
              >
                <AlertCircle size={14} aria-hidden="true" /> {apiError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-gold group flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-[14px] font-semibold text-ink transition-all disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Sending request…
                </>
              ) : (
                <>
                  Request advertisement
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
