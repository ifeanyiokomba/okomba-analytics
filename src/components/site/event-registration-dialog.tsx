"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, Clock, Loader2, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { COUNTRIES } from "@/lib/countries";
import { lagosEventLongLabel, type PublicEvent } from "@/lib/events-shared";

/* ── BATCH 10 (§34) — public event registration dialog ─────────
   Captures the §34 contract: first/last name, email, phone
   (optional), country, and EXPLICIT consent to receive event
   reminders + confirmations. Success/duplicate/error states are
   inline with an aria-live status region.                           */

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  consent: boolean;
};

const INITIAL: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  consent: false,
};

type SubmitState =
  | { phase: "form" }
  | { phase: "busy" }
  | { phase: "success" }
  | { phase: "duplicate" };

export function EventRegistrationDialog({
  event,
  onClose,
}: {
  event: PublicEvent; // the section mounts this dialog conditionally — fresh open = fresh mount
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [state, setState] = useState<SubmitState>({ phase: "form" });
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  /* Focus the first field shortly after mount */
  useEffect(() => {
    const t = setTimeout(() => firstFieldRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  /* §14 a11y — Escape + focus trap + scroll lock */
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

  const set =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((f) => ({ ...f, [key]: value }));
      setErrors((er) => ({ ...er, [key]: undefined }));
    };

  const validate = (): boolean => {
    const er: typeof errors = {};
    if (form.firstName.trim().length < 1) er.firstName = "First name is required";
    if (form.lastName.trim().length < 1) er.lastName = "Last name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) er.email = "A valid email is required";
    if (!form.country) er.country = "Please select your country";
    if (!form.consent) er.consent = "Please tick the consent box to continue";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setState({ phase: "busy" });
    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
          countryCode: form.country,
          consent: true,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setState({ phase: "form" });
        setApiError(
          data?.error ??
            (res.status === 429
              ? "Too many attempts — please wait a moment and try again."
              : "Registration failed. Please try again.")
        );
        return;
      }
      setState(data?.duplicate ? { phase: "duplicate" } : { phase: "success" });
    } catch {
      setState({ phase: "form" });
      setApiError("Network error — please try again.");
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
      aria-label={`Register for ${event.title}`}
      onClick={(e) => e.target === e.currentTarget && state.phase !== "busy" && onClose()}
    >
      <div
        ref={dialogRef}
        className="section-dark relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)] sm:rounded-3xl"
      >
        {/* Header */}
        <header className="relative border-b border-white/[0.06] p-6 md:px-7">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/[0.1] blur-2xl"
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow text-[9px] text-gold">Events & webinars</p>
              <h2 className="mt-2 font-display text-[19px] font-bold leading-snug text-foreground">{event.title}</h2>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted-foreground">
                <Clock size={12} aria-hidden="true" /> {lagosEventLongLabel(event.startAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close registration"
              disabled={state.phase === "busy"}
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* aria-live status region */}
        <p role="status" aria-live="polite" className="sr-only">
          {state.phase === "busy"
            ? "Submitting your registration"
            : state.phase === "success"
              ? "Registration successful — check your inbox for confirmation"
              : state.phase === "duplicate"
                ? "You are already registered for this event"
                : apiError
                  ? `Error: ${apiError}`
                  : ""}
        </p>

        {state.phase === "success" || state.phase === "duplicate" ? (
          /* ── Success / duplicate view ── */
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center md:px-7">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-teal/30 bg-teal-dim text-teal">
              <CheckCircle2 size={26} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-[16.5px] font-semibold text-foreground">
                {state.phase === "duplicate" ? "You're already registered — see you there" : "You're registered — check your inbox for confirmation"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                {state.phase === "duplicate" ? (
                  <>
                    We already have <span className="font-medium text-foreground">{form.email.trim() || "your email"}</span> on
                    the list for <span className="font-medium text-foreground">{event.title}</span>.
                  </>
                ) : (
                  <>
                    A confirmation email is on its way to{" "}
                    <span className="font-medium text-foreground">{form.email.trim()}</span>. We'll send a reminder before{" "}
                    {event.hasMeetingUrl ? "the session starts — your join link is in the email." : "the event starts."}
                  </>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-gold/45 bg-gold-dim px-5 py-3 text-[13.5px] font-semibold text-gold transition-colors hover:border-gold/70 hover:bg-gold/20"
            >
              Close
            </button>
          </div>
        ) : (
          /* ── Form view ── */
          <form onSubmit={submit} noValidate className="flex flex-col overflow-y-auto">
            <div className="space-y-4.5 px-6 py-6 md:px-7" style={{ display: "grid", gap: "1.05rem" }}>
              {apiError && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12.5px] text-red-300"
                >
                  <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> {apiError}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2" style={{ gap: "1.05rem" }}>
                <div>
                  <label htmlFor="reg-firstName" className={labelCls}>
                    First name *
                  </label>
                  <input
                    ref={firstFieldRef}
                    id="reg-firstName"
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
                  <label htmlFor="reg-lastName" className={labelCls}>
                    Last name *
                  </label>
                  <input
                    id="reg-lastName"
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
                <label htmlFor="reg-email" className={labelCls}>
                  Email *
                </label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set("email")}
                  className={inputCls("email")}
                  placeholder="you@example.com"
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
                  <label htmlFor="reg-phone" className={labelCls}>
                    Phone (optional)
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    className={inputCls("phone")}
                    placeholder="+234 801 234 5678"
                  />
                </div>
                <div>
                  <label htmlFor="reg-country" className={labelCls}>
                    Country *
                  </label>
                  <select
                    id="reg-country"
                    value={form.country}
                    onChange={set("country")}
                    className={inputCls("country")}
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
              </div>

              {/* §34 consent — REQUIRED */}
              <div>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={set("consent")}
                    className="mt-0.5 h-4 w-4 accent-[#C9910A]"
                    aria-invalid={!!errors.consent}
                  />
                  <span className="text-[12.5px] leading-relaxed text-muted-foreground">
                    I consent to receive event reminders and confirmations for this event.
                  </span>
                </label>
                {errors.consent && (
                  <p className={errorCls}>
                    <AlertCircle size={12} aria-hidden="true" /> {errors.consent}
                  </p>
                )}
              </div>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-6 py-4 md:px-7">
              <p className="hidden items-center gap-1.5 text-[11px] text-muted-foreground/70 sm:flex">
                <Users size={12} aria-hidden="true" />
                {event.capacity === null
                  ? "Free · open to all"
                  : `${event.spotsLeft ?? 0} of ${event.capacity} spots left`}
              </p>
              <button
                type="submit"
                disabled={state.phase === "busy"}
                className="inline-flex items-center gap-2 rounded-xl border border-gold/45 bg-gold-dim px-5 py-3 text-[13.5px] font-semibold text-gold transition-colors hover:border-gold/70 hover:bg-gold/20 disabled:opacity-60"
              >
                {state.phase === "busy" ? (
                  <>
                    <Loader2 size={15} className="animate-spin" aria-hidden="true" /> Registering…
                  </>
                ) : (
                  <>
                    <CalendarDays size={15} aria-hidden="true" /> Register
                  </>
                )}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}
