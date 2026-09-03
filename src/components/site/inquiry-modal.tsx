"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SERVICES, type Service } from "@/lib/content";
import { ServiceIcon } from "./service-icon";
import { COUNTRIES } from "@/lib/countries";

type InquiryModalProps = {
  service: Service | null; // preselected service
  onClose: () => void;
  onSuccess: (name: string) => void;
};

// ── BATCH 2 (directive §5,§6): canonical customer identity contract ──
//   Required: firstName, lastName, email, phone, country, service, message
//   Optional: whatsapp, addlService, budget
//   The single `name` field is gone — we collect first + last name
//   separately so the backend never has to split a combined string
//   (directive §48: "Do not use name splitting for newly submitted users").
//   Country is a structured ISO-2 <select> (directive §7) — no free text.
type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string;
  country: string;
  service: string;
  addlService: string;
  budget: string;
  message: string;
};

const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  whatsapp: "",
  country: "",
  service: "",
  addlService: "",
  budget: "",
  message: "",
};

const BUDGET_OPTIONS = [
  "Under ₦150k",
  "₦150k – ₦500k",
  "₦500k – ₦1.5M",
  "₦1.5M – ₦5M",
  "₦5M+",
  "Not sure yet",
];

/**
 * Inquiry modal — the core conversion workflow (preserved from original app).
 * Submits to POST /api/inquiries, which persists to the database for the admin dashboard.
 */
export function InquiryModal({ service, onClose, onSuccess }: InquiryModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Preselect service + reset when opened
  useEffect(() => {
    setForm((f) => ({ ...f, service: service?.title ?? "" }));
    setErrors({});
    setApiError(null);
    const t = setTimeout(() => firstFieldRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [service]);

  // Escape key + scroll lock + focus trap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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
  }, [onClose]);

  const selectedService = useMemo(
    () => SERVICES.find((s) => s.title === form.service) ?? null,
    [form.service]
  );

  // Lookup for the additional service so we can render its icon too
  const additionalService = useMemo(
    () => SERVICES.find((s) => s.title === form.addlService) ?? null,
    [form.addlService]
  );

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = (): boolean => {
    const er: typeof errors = {};
    if (form.firstName.trim().length < 1) er.firstName = "First name is required";
    if (form.lastName.trim().length < 1) er.lastName = "Last name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) er.email = "A valid email is required";
    if (form.phone.trim().length < 7) er.phone = "A valid phone number is required";
    if (!form.country) er.country = "Please select your country";
    if (!form.service) er.service = "Please select a service";
    if (form.message.trim().length < 10) er.message = "Tell us a little more (min. 10 characters)";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          whatsapp: form.whatsapp.trim() || undefined,
          country: form.country,
          service: form.service,
          addlService: form.addlService || undefined,
          budget: form.budget || undefined,
          message: form.message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Submission failed. Please try again.");
      // For the thank-you toast, derive a display name from the two
      // explicit fields — never split a combined string on the client
      // (directive §48).
      const displayName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
      onSuccess(displayName);
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Service inquiry form"
      onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}
    >
      <div
        ref={dialogRef}
        className="section-dark relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)] sm:rounded-3xl"
      >
        {/* Header */}
        <header className="relative border-b border-white/[0.06] p-6 md:px-7">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/[0.1] blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-[9px] text-gold">Project inquiry</p>
              <h2 className="mt-2 font-display text-[20px] font-bold leading-snug text-foreground">
                Let&apos;s build the right solution
              </h2>
              <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                Fill this in — we respond within 24 hours.
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

        {/* Form body */}
        <form onSubmit={submit} noValidate className="flex flex-col overflow-y-auto">
          <div className="space-y-4.5 px-6 py-6 md:px-7" style={{ display: "grid", gap: "1.05rem" }}>
            {/* ── BATCH 2: First name + Last name (directive §5, §48) ──
                The single `name` field is gone — we collect the two
                explicitly so the backend never has to split a combined
                string. The "Full name" label is replaced with two
                side-by-side required inputs. */}
            <div className="grid gap-4 sm:grid-cols-2" style={{ gap: "1.05rem" }}>
              <div>
                <label htmlFor="iq-first" className={labelCls}>
                  First name <span className="text-gold">*</span>
                </label>
                <input
                  ref={firstFieldRef}
                  id="iq-first"
                  type="text"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={set("firstName")}
                  placeholder="Adaeze"
                  className={inputCls("firstName")}
                  aria-invalid={!!errors.firstName}
                />
                {errors.firstName && (
                  <p className={errorCls}><AlertCircle size={12} aria-hidden="true" />{errors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="iq-last" className={labelCls}>
                  Last name <span className="text-gold">*</span>
                </label>
                <input
                  id="iq-last"
                  type="text"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={set("lastName")}
                  placeholder="Nwosu"
                  className={inputCls("lastName")}
                  aria-invalid={!!errors.lastName}
                />
                {errors.lastName && (
                  <p className={errorCls}><AlertCircle size={12} aria-hidden="true" />{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2" style={{ gap: "1.05rem" }}>
              <div>
                <label htmlFor="iq-email" className={labelCls}>
                  Email <span className="text-gold">*</span>
                </label>
                <input
                  id="iq-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@company.com"
                  className={inputCls("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className={errorCls}><AlertCircle size={12} aria-hidden="true" />{errors.email}</p>
                )}
              </div>
              {/* Country — structured ISO-2 select, no free text (directive §7) */}
              <div>
                <label htmlFor="iq-country" className={labelCls}>
                  Country <span className="text-gold">*</span>
                </label>
                <select
                  id="iq-country"
                  value={form.country}
                  onChange={set("country")}
                  className={cn(inputCls("country"), "cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%239aa3b8%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-no-repeat pr-10")}
                  aria-invalid={!!errors.country}
                >
                  <option value="">Select your country…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#0b101c]">
                      {c.label}{c.dialCode ? ` (${c.dialCode})` : ""}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className={errorCls}><AlertCircle size={12} aria-hidden="true" />{errors.country}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2" style={{ gap: "1.05rem" }}>
              {/* Phone — now REQUIRED (directive §6) */}
              <div>
                <label htmlFor="iq-phone" className={labelCls}>
                  Phone <span className="text-gold">*</span>
                </label>
                <input
                  id="iq-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+234 800 000 0000"
                  className={inputCls("phone")}
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && (
                  <p className={errorCls}><AlertCircle size={12} aria-hidden="true" />{errors.phone}</p>
                )}
              </div>
              <div>
                <label htmlFor="iq-wa" className={labelCls}>WhatsApp number</label>
                <input
                  id="iq-wa"
                  type="tel"
                  value={form.whatsapp}
                  onChange={set("whatsapp")}
                  placeholder="Optional — defaults to phone"
                  className={inputCls("whatsapp")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2" style={{ gap: "1.05rem" }}>
              <div>
                <label htmlFor="iq-service" className={labelCls}>
                  Service needed <span className="text-gold">*</span>
                </label>
                <select id="iq-service" value={form.service} onChange={set("service")} className={cn(inputCls("service"), "cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%239aa3b8%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-no-repeat pr-10")}>
                  <option value="">Select a service…</option>
                  {SERVICES.map((s) => (
                    <option key={s.id} value={s.title} className="bg-[#0b101c]">
                      {s.title}
                    </option>
                  ))}
                </select>
                {errors.service && (
                  <p className={errorCls}><AlertCircle size={12} aria-hidden="true" />{errors.service}</p>
                )}
              </div>
              <div>
                <label htmlFor="iq-budget" className={labelCls}>Budget range</label>
                <select id="iq-budget" value={form.budget} onChange={set("budget")} className={cn(inputCls("budget"), "cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%239aa3b8%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-no-repeat pr-10")}>
                  <option value="">Optional — helps us tailor the proposal</option>
                  {BUDGET_OPTIONS.map((b) => (
                    <option key={b} value={b} className="bg-[#0b101c]">
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="iq-msg" className={labelCls}>
                Project details <span className="text-gold">*</span>
              </label>
              <textarea
                id="iq-msg"
                rows={4}
                value={form.message}
                onChange={set("message")}
                placeholder="What are you building? What problem should this solve? Any timeline?"
                className={cn(inputCls("message"), "resize-none")}
                aria-invalid={!!errors.message}
              />
              {errors.message && (
                <p className={errorCls}><AlertCircle size={12} aria-hidden="true" />{errors.message}</p>
              )}
            </div>

            {/* Additional service (moved below budget for flow) */}
            <div>
              <label htmlFor="iq-addl" className={labelCls}>Additional service</label>
              <select id="iq-addl" value={form.addlService} onChange={set("addlService")} className={cn(inputCls("addlService"), "cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%239aa3b8%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-no-repeat pr-10")}>
                <option value="">Optional — any second service?</option>
                {SERVICES.filter((s) => s.title !== form.service).map((s) => (
                  <option key={s.id} value={s.title} className="bg-[#0b101c]">
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected service context hint — Stage 11 redesign
                (founder directive). Each service carries an "object"
                (its own icon: </> for web/mobile, wallet for fintech,
                zap for payment integration, etc.) so users can see at
                a glance which service the form is being submitted for.
                The badge animates in when a service is picked, and a
                second chip appears for the additional service. */}
            <AnimatePresence>
              {(selectedService || additionalService) && (
                <motion.div
                  initial={{ opacity: 0, y: 6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/[0.10] to-gold/[0.04] px-4 py-3.5">
                    <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-gold/80">
                      Building for
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {selectedService ? (
                        <span className="inline-flex items-center gap-2 rounded-lg border border-gold/35 bg-[#0b101c] px-3 py-1.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gold-dim text-gold">
                            <ServiceIcon name={selectedService.icon} size={13} className="text-gold" />
                          </span>
                          <span className="text-[12px] font-semibold text-foreground">{selectedService.title}</span>
                          <span className="rounded-full border border-gold/20 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-wider text-gold/80">
                            {selectedService.category}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[11.5px] text-muted-foreground">
                          <span className="font-mono text-[9.5px]">?</span>
                          Pick a service below
                        </span>
                      )}
                      {additionalService && (
                        <>
                          <span className="font-mono text-[12px] text-gold/60">+</span>
                          <span className="inline-flex items-center gap-2 rounded-lg border border-teal/30 bg-teal-dim px-3 py-1.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal/15 text-teal">
                              <ServiceIcon name={additionalService.icon} size={13} className="text-teal" />
                            </span>
                            <span className="text-[12px] font-semibold text-foreground">{additionalService.title}</span>
                          </span>
                        </>
                      )}
                    </div>
                    {selectedService && (
                      <p className="mt-2.5 flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground">
                        <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                        <span>
                          <span className="font-semibold text-foreground">{selectedService.title}</span> — {selectedService.desc}
                        </span>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {apiError && (
              <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" aria-hidden="true" />
                <p className="text-[12.5px] leading-relaxed text-red-300">{apiError}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-5 md:px-7">
            <button
              type="submit"
              disabled={submitting}
              className="btn-shine inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-light to-gold px-6 py-3.5 text-[14.5px] font-semibold text-ink shadow-gold-lg transition-all hover:-translate-y-0.5 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Submitting…
                </>
              ) : (
                <>
                  Submit Inquiry
                  <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
                </>
              )}
            </button>
            <p className="mt-3 text-center font-mono text-[10px] text-muted-foreground/70">
              Your details are stored securely and never shared.
            </p>
          </footer>
        </form>
      </div>
    </div>
  );
}
