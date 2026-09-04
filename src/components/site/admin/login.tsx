"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, User, UserPlus } from "lucide-react";
import { OkombaNavLogo } from "../logo";

/* Admin login — env-credential flow with session cookie.
   Stage 11 (founder directive): show/hide password eye toggle so the
   admin doesn't mistype credentials on mobile.

   BATCH 7 (§44): when inviteToken is provided (arrived via an
   invitation email link, /#/invite/<token>), renders the account
   ACTIVATION form instead — set name + password, account activates,
   session starts immediately. */
export function AdminLogin({
  onLogin,
  onExit,
  inviteToken,
  onCancelInvite,
}: {
  onLogin: () => void;
  onExit: () => void;
  inviteToken?: string;
  onCancelInvite?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Activation-mode state (§44)
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (inviteToken) {
        if (password !== confirm) {
          throw new Error("Passwords do not match");
        }
        const res = await fetch("/api/admin/admins/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: inviteToken, name, password }),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) throw new Error(data.error ?? "Activation failed");
        onLogin();
        return;
      }
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
          onClick={inviteToken && onCancelInvite ? onCancelInvite : onExit}
          className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} aria-hidden="true" /> Back to website
        </button>

        <div className="surface-card p-8 md:p-9">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold-dim text-gold shadow-gold">
              {inviteToken ? <KeyRound size={20} aria-hidden="true" /> : <Lock size={20} aria-hidden="true" />}
            </span>
            <div>
              <h1 className="font-display text-[22px] font-bold text-foreground">
                {inviteToken ? "Activate your account" : "Admin portal"}
              </h1>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                {inviteToken
                  ? "Set your name and password to finish joining the team."
                  : "Sign in to manage inquiries, posts & subscribers."}
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {inviteToken ? (
              <>
                <div>
                  <label htmlFor="invite-name" className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">
                    Your name
                  </label>
                  <div className="relative">
                    <UserPlus size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
                    <input
                      id="invite-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ngozi Eze"
                      className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-3 pl-10 pr-4 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 focus:bg-white/[0.05]"
                    />
                  </div>
                </div>
                <p className="rounded-lg border border-gold/20 bg-gold-dim/60 px-3.5 py-2.5 text-[11.5px] text-gold-light/90">
                  <CheckCircle2 size={12} className="mr-1.5 -mt-0.5 inline" aria-hidden="true" />
                  You were invited by the team. Your role and capabilities were assigned with the invitation.
                </p>
              </>
            ) : (
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
            )}
            <div>
              <label htmlFor="admin-pass" className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
                <input
                  id="admin-pass"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-3 pl-10 pr-12 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 focus:bg-white/[0.05]"
                />
                {/* Show / hide password toggle — eye icon on the right
                    inside the input so the admin can verify what they
                    typed on mobile. Hitting it does NOT submit. */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-white/[0.05] hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
                >
                  {showPassword ? (
                    <EyeOff size={15} aria-hidden="true" />
                  ) : (
                    <Eye size={15} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {inviteToken && (
              <div>
                <label htmlFor="invite-confirm" className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">
                  Confirm password
                </label>
                <div className="relative">
                  <CheckCircle2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
                  <input
                    id="invite-confirm"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-3 pl-10 pr-12 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 focus:bg-white/[0.05]"
                  />
                </div>
              </div>
            )}

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
              {busy
                ? inviteToken
                  ? "Activating…"
                  : "Signing in…"
                : inviteToken
                  ? "Activate account"
                  : "Sign in"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-5">
            <OkombaNavLogo onDark />
            <span className="font-mono text-[10px] text-muted-foreground/60">Internal use only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
