"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, UserPlus, X } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

/* ─────────────────────────────────────────────────────────────
   QuickAddCustomerDialog — Directive §15 "Quick manual customer
   creation": enter a customer WITHOUT importing a file.
   Minimum: firstName, lastName, email, phone, country.
   Posts to /api/admin/customers (upsert-safe by email — §14
   no duplicate customers for repeat entries).
   ───────────────────────────────────────────────────────────── */

const STATUS_OPTIONS = ["lead", "qualified", "proposal_sent", "paying", "churned"];

export function QuickAddCustomerDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("lead");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Escape closes (§14) unless mid-submit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const submit = async () => {
    setError(null);
    if (!firstName.trim()) return setError("First name is required");
    if (!lastName.trim()) return setError("Last name is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      return setError("Enter a valid email address");
    if (!phone.trim()) return setError("Phone is required");
    if (!countryCode) return setError("Select a country");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          countryCode,
          company: company.trim() || undefined,
          role: role.trim() || undefined,
          status,
          source: "manual",
        }),
      });
      const j = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !j.ok) throw new Error(j.error ?? "Could not save the customer");
      setSaved(true);
      onSaved?.();
      setTimeout(onClose, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the customer");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-xl border border-white/[0.1] bg-[#0d1322] px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20";
  const label = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Add a customer"
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div className="section-dark relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float sm:rounded-3xl [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
        <header className="relative shrink-0 border-b border-white/[0.07] p-5">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gold/[0.1] blur-2xl"
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-[9px] text-gold">CRM · Quick add</p>
              <h2 className="mt-1.5 font-display text-[17px] font-bold text-foreground">
                Add a customer
              </h2>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                No file needed — create the CRM record directly.
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-[12.5px] text-red-300"
            >
              {error}
            </div>
          )}
          {saved && (
            <div
              role="status"
              className="mb-4 flex items-center gap-2 rounded-xl border border-teal/30 bg-teal/[0.08] px-4 py-3 text-[12.5px] text-teal"
            >
              <CheckCircle2 size={15} aria-hidden="true" /> Customer saved.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="qa-first" className={label}>
                First name *
              </label>
              <input
                id="qa-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={field}
                placeholder="Ada"
                autoComplete="given-name"
              />
            </div>
            <div>
              <label htmlFor="qa-last" className={label}>
                Last name *
              </label>
              <input
                id="qa-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={field}
                placeholder="Obi"
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="qa-email" className={label}>
              Email *
            </label>
            <input
              id="qa-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
              placeholder="ada@example.com"
              autoComplete="email"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="qa-phone" className={label}>
                Phone *
              </label>
              <input
                id="qa-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={field}
                placeholder="+234 803 000 0000"
                autoComplete="tel"
              />
            </div>
            <div>
              <label htmlFor="qa-country" className={label}>
                Country *
              </label>
              <select
                id="qa-country"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className={field}
              >
                <option value="">Select…</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="qa-company" className={label}>
                Company
              </label>
              <input
                id="qa-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={field}
                placeholder="TechStartNG"
              />
            </div>
            <div>
              <label htmlFor="qa-role" className={label}>
                Role
              </label>
              <input
                id="qa-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={field}
                placeholder="Founder"
              />
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="qa-status" className={label}>
              Lifecycle status
            </label>
            <select
              id="qa-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={field}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <footer className="shrink-0 border-t border-white/[0.07] bg-white/[0.015] p-5">
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={busy || saved}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              ) : saved ? (
                <CheckCircle2 size={15} aria-hidden="true" />
              ) : (
                <UserPlus size={15} aria-hidden="true" />
              )}
              {saved ? "Saved" : "Create customer"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
