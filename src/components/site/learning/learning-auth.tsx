"use client";

/* ─────────────────────────────────────────────────────────────
   BATCH 13 (§65) — Okomba Learning auth screen.
   Login + signup toggle, friendly field errors, password
   requirements helper, country select (default NG).
   ───────────────────────────────────────────────────────────── */

import { useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Phone,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { StudentPublicDto } from "@/lib/learning-shared";
import { ApiError, apiFetch } from "./learning-shared-ui";

const COUNTRIES = [
  { code: "NG", label: "Nigeria" },
  { code: "GH", label: "Ghana" },
  { code: "KE", label: "Kenya" },
  { code: "US", label: "United States" },
  { code: "UK", label: "United Kingdom" },
  { code: "OTHER", label: "Other" },
] as const;

type AuthMode = "login" | "signup";

type LearningAuthProps = {
  initialMode?: AuthMode;
  onSuccess: (student: StudentPublicDto) => void;
  onBack: () => void;
};

export function LearningAuth({ initialMode = "login", onSuccess, onBack }: LearningAuthProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Shared fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<string>("NG");

  const passLongEnough = password.length >= 8;
  const passHasLetterAndNumber = /[a-zA-Z]/.test(password) && /\d/.test(password);
  const passValid = passLongEnough && passHasLetterAndNumber;

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && !passValid) {
      setError("Your password needs at least 8 characters, including a letter and a number.");
      return;
    }
    setBusy(true);
    try {
      const path = mode === "signup" ? "/api/learning/auth/signup" : "/api/learning/auth/login";
      const body =
        mode === "signup"
          ? {
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password,
              phone: phone.trim() || undefined,
              country,
            }
          : { email: email.trim().toLowerCase(), password };
      const data = await apiFetch<{ ok: true; student: StudentPublicDto }>(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onSuccess(data.student);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong — please try again.";
      setError(err instanceof ApiError && err.status === 401 ? msg : msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6">
      {/* soft ambient accents */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-[340px] w-[560px] -translate-x-1/2 rounded-full bg-gold/[0.08] blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[240px] w-[420px] translate-x-1/4 rounded-full bg-teal/[0.07] blur-[110px]"
        aria-hidden="true"
      />

      <div className="lp-anim-fade-up relative w-full max-w-[440px]">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} aria-hidden="true" /> Back to catalogue
        </button>

        <div className="rounded-2xl border border-black/[0.07] bg-white p-6 shadow-[0_24px_60px_-30px_rgba(20,25,38,0.25)] sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-dim text-gold">
              <GraduationCap size={22} aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-display text-[21px] font-bold text-foreground">
                {mode === "login" ? "Welcome back" : "Create your free account"}
              </h1>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {mode === "login"
                  ? "Pick up right where you left off."
                  : "Start learning in under a minute — it's free."}
              </p>
            </div>
          </div>

          {/* Mode toggle */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-black/[0.07] bg-black/[0.03] p-1"
          >
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                type="button"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={cn(
                  "rounded-lg py-2 text-[13px] font-semibold transition-all focus-visible:outline-2 focus-visible:outline-gold",
                  mode === m ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="lp-name" className="text-[12.5px] font-medium text-muted-foreground">
                  Full name
                </Label>
                <div className="relative">
                  <User
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                    aria-hidden="true"
                  />
                  <Input
                    id="lp-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ngozi Eze"
                    className="rounded-xl border-black/[0.1] bg-white py-3 pl-10 pr-4 text-[14px]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="lp-email" className="text-[12.5px] font-medium text-muted-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                  aria-hidden="true"
                />
                <Input
                  id="lp-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-xl border-black/[0.1] bg-white py-3 pl-10 pr-4 text-[14px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lp-password" className="text-[12.5px] font-medium text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                  aria-hidden="true"
                />
                <Input
                  id="lp-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl border-black/[0.1] bg-white py-3 pl-10 pr-12 text-[14px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
                >
                  {showPassword ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                </button>
              </div>

              {mode === "signup" && (
                <ul className="mt-2 space-y-1.5" aria-live="polite">
                  <PasswordRule met={passLongEnough} label="At least 8 characters" />
                  <PasswordRule met={passHasLetterAndNumber} label="Contains a letter and a number" />
                </ul>
              )}
            </div>

            {mode === "signup" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="lp-phone" className="text-[12.5px] font-medium text-muted-foreground">
                    Phone <span className="font-normal text-muted-foreground/70">(optional)</span>
                  </Label>
                  <div className="relative">
                    <Phone
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                      aria-hidden="true"
                    />
                    <Input
                      id="lp-phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="080…"
                      className="rounded-xl border-black/[0.1] bg-white py-3 pl-10 pr-4 text-[14px]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lp-country" className="text-[12.5px] font-medium text-muted-foreground">
                    Country
                  </Label>
                  <select
                    id="lp-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="h-11 w-full rounded-xl border border-black/[0.1] bg-white px-3.5 text-[14px] text-foreground outline-none transition-colors focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/25 bg-destructive/[0.04] px-4 py-3 text-[13px] font-medium text-destructive"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-gold-light to-gold text-[15px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />{" "}
                  {mode === "login" ? "Signing in…" : "Creating your account…"}
                </>
              ) : mode === "login" ? (
                "Sign in"
              ) : (
                "Create account & start learning"
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-[12.5px] text-muted-foreground">
            {mode === "login" ? "New to Okomba Learning? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="font-semibold text-gold transition-colors hover:text-gold-dark focus-visible:outline-2 focus-visible:outline-gold"
            >
              {mode === "login" ? "Create a free account" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Encouraging side note */}
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-gold/20 bg-gold-dim/50 px-4 py-3.5">
          <Sparkles size={15} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Learn free, forever.</span> Every course on Okomba
            Learning is currently free — lessons, quizzes and certificates of completion included.
          </p>
        </div>
        <p className="sr-only">
          <BookOpenCheck aria-hidden="true" /> Okomba Learning account
        </p>
      </div>
    </div>
  );
}

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-[12px]">
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          met ? "border-teal/50 bg-teal-dim text-teal" : "border-black/15 text-transparent"
        )}
        aria-hidden="true"
      >
        {met ? <Check size={10} strokeWidth={3} /> : null}
      </span>
      <span className={met ? "font-medium text-teal" : "text-muted-foreground/80"}>{label}</span>
      <span className="sr-only">{met ? "requirement met" : "requirement not met"}</span>
    </li>
  );
}
