"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICES, type Service } from "@/lib/content";

type InquiryModalProps = {
  service: Service | null; // preselected service
  onClose: () => void;
  onSuccess: (name: string) => void;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  service: string;
  addlService: string;
  message: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  whatsapp: "",
  service: "",
  addlService: "",
  message: "",
};

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

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = (): boolean => {
    const er: typeof errors = {};
    if (form.name.trim().length < 2) er.name = "Please enter your full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) er.email = "A valid email is required";
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
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          whatsapp: form.whatsapp.trim() || undefined,
          service: form.service,
          addlService: form.addlService || undefined,
          message: form.message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Submission failed. Please try again.");
      onSuccess(form.name.trim());
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
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)] sm:rounded-3xl"
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
            <div className="grid gap-4 sm:grid-cols-2" style={{ gap: "1.05rem" }}>
              <div>
                <label htmlFor="iq-name" className={labelCls}>
                  Full name <span className="text-gold">*</span>
                </label>
                <input
                  ref={firstFieldRef}
                  id="iq-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Adaeze Nwosu"
                  className={inputCls("name")}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className={errorCls}><AlertCircle size={12} aria-hidden="true" />{errors.name}</p>
                )}
              </div>
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2" style={{ gap: "1.05rem" }}>
              <div>
                <label htmlFor="iq-phone" className={labelCls}>Phone</label>
                <input
                  id="iq-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+234 800 000 0000"
                  className={inputCls("phone")}
                />
              </div>
              <div>
                <label htmlFor="iq-wa" className={labelCls}>WhatsApp number</label>
                <input
                  id="iq-wa"
                  type="tel"
                  value={form.whatsapp}
                  onChange={set("whatsapp")}
                  placeholder="+234 800 000 0000"
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
                <label htmlFor="iq-addl" className={labelCls}>Additional service</label>
                <select id="iq-addl" value={form.addlService} onChange={set("addlService")} className={cn(inputCls("addlService"), "cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%239aa3b8%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-no-repeat pr-10")}>
                  <option value="">Optional…</option>
                  {SERVICES.filter((s) => s.title !== form.service).map((s) => (
                    <option key={s.id} value={s.title} className="bg-[#0b101c]">
                      {s.title}
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

            {/* Selected service context hint */}
            {selectedService && (
              <div className="flex items-start gap-3 rounded-xl border border-gold/15 bg-gold/[0.06] px-4 py-3">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">{selectedService.title}</span> — {selectedService.desc}
                </p>
              </div>
            )}

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
