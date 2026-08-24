"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, Lock, Mail, User } from "lucide-react";
import { OkombaLockup } from "../logo";

/* Admin login — env-credential flow with session cookie.
   Preserved exactly from the original implementation, just polished. */
export function AdminLogin({
  onLogin,
  onExit,
}: {
  onLogin: () => void;
  onExit: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Invalid credentials");
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="section-dark relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5">
      <div className="bg-grid-on-dark mask-fade-y pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[580px] -translate-x-1/2 rounded-full bg-gold/[0.18] blur-[120px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[260px] w-[460px] translate-x-1/4 translate-y-1/4 rounded-full bg-teal/[0.1] blur-[120px]" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <button
          onClick={onExit}
          className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} aria-hidden="true" /> Back to website
        </button>

        <div className="surface-card p-8 md:p-9">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold-dim text-gold shadow-gold">
              <Lock size={20} aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-display text-[22px] font-bold text-foreground">Admin portal</h1>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Sign in to manage inquiries, posts & subscribers.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@okomba.com"
                  className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-3 pl-10 pr-4 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 focus:bg-white/[0.05]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="admin-pass" className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
                <input
                  id="admin-pass"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-3 pl-10 pr-4 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 focus:bg-white/[0.05]"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/[0.08] px-3.5 py-2.5 text-[12.5px] text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-shine inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 py-3.5 text-[14px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              ) : (
                <Lock size={14} aria-hidden="true" />
              )}
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-5">
            <OkombaLockup size="sm" tone="dark" />
            <span className="font-mono text-[10px] text-muted-foreground/60">Internal use only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
