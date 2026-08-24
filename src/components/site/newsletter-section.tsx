"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail, MailCheck, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

/** Only true when no real email provider is configured (dev/demo mode). */
const DEV_CONFIRM_SIMULATION = process.env.NEXT_PUBLIC_DEV_CONFIRM_SIMULATION !== "false";

/**
 * Newsletter band — double opt-in email capture wired to POST /api/subscribe.
 * Step 1: enter email → pending subscriber created, confirm link shown (dev
 * simulation of the email). Step 2: user visits confirm link → confirmed.
 */
export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [confirmPath, setConfirmPath] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "busy") return;
    setState("busy");
    setMessage("");
    setConfirmPath(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Subscription failed");
      setState("done");
      setMessage(
        data.alreadyConfirmed
          ? "You're already subscribed — thank you!"
          : "Almost there — one click confirms your subscription."
      );
      if (data.confirmPath) setConfirmPath(data.confirmPath);
      setEmail("");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const confirmNow = async () => {
    if (!confirmPath) return;
    setState("busy");
    try {
      const res = await fetch(confirmPath);
      // The confirm endpoint returns a branded HTML page; the fetch itself
      // confirms the subscription server-side.
      if (res.ok) {
        setState("sent");
        setMessage("Confirmed! You're on the list — practical insights, no spam.");
      } else {
        setState("error");
        setMessage("Confirmation failed — please try subscribing again.");
      }
    } catch {
      setState("error");
      setMessage("Confirmation failed — please try again.");
    }
  };

  return (
    <section aria-label="Newsletter" className="container-xl">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/[0.14] via-[#fffdf7] to-white p-8 md:p-12 shadow-[0_20px_60px_-24px_rgba(201,145,10,0.4)]">
          {/* decor */}
          <div className="bg-dots pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(60%_80%_at_80%_20%,black,transparent)]" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gold/[0.12] blur-[90px] animate-glow-breathe" aria-hidden="true" />

          <div className="relative grid items-center gap-8 md:grid-cols-[1.15fr_0.85fr] md:gap-12">
            <div>
              <span className="eyebrow inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-gold-dim px-4 py-1.5 text-gold">
                <Mail size={12} aria-hidden="true" />
                Insights, delivered
              </span>
              <h2 className="mt-5 text-balance font-display text-2xl font-bold leading-[1.15] text-foreground sm:text-3xl">
                Digital strategy notes for ambitious teams
              </h2>
              <p className="mt-3.5 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                Occasional, practical writing on payments, automation and building in Nigeria&apos;s
                digital economy. The same field notes we use on client work — free in your inbox.
              </p>
            </div>

            <div>
              {state === "done" || state === "sent" ? (
                <div className="flex flex-col items-start gap-4 rounded-2xl border border-teal/30 bg-teal/[0.08] p-5">
                  <div
                    role="status"
                    className="flex w-full items-start gap-3.5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-dim text-teal">
                      {state === "sent" ? (
                        <MailCheck size={19} aria-hidden="true" />
                      ) : (
                        <CheckCircle2 size={19} aria-hidden="true" />
                      )}
                    </span>
                    <div>
                      <p className="text-[14.5px] font-semibold text-foreground">
                        {state === "sent" ? "Subscription confirmed" : "Check your inbox"}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{message}</p>
                    </div>
                  </div>

                  {/* Step 2 (dev simulation): confirm button when link present */}
                  {state === "done" && confirmPath && DEV_CONFIRM_SIMULATION && (
                    <div className="w-full rounded-xl border border-gold/20 bg-gold/[0.06] p-4">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-gold/80">
                        Confirm subscription
                      </p>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                        In production this arrives by email. For now, confirm with one click:
                      </p>
                      <button
                        onClick={confirmNow}
                        disabled={state !== "done"}
                        className="btn-shine mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        <MailCheck size={14} aria-hidden="true" />
                        Confirm my subscription
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={submit} noValidate className="flex flex-col gap-3">
                  <div className="relative">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70"
                      aria-hidden="true"
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (state === "error") setState("idle");
                      }}
                      placeholder="you@company.com"
                      aria-label="Email address"
                      autoComplete="email"
                      className={cn(
                        "w-full rounded-2xl border bg-white py-4 pl-11 pr-4 text-[14.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60",
                        state === "error"
                          ? "border-red-500/60 focus:border-red-500"
                          : "border-black/[0.12] focus:border-gold/60 focus:bg-gold/[0.04]"
                      )}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={state === "busy" || email.length === 0}
                    className="btn-shine group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-light to-gold px-6 py-4 text-[14.5px] font-semibold text-ink shadow-gold-lg transition-all hover:-translate-y-0.5 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {state === "busy" ? (
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Send size={15} strokeWidth={2.3} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    )}
                    {state === "busy" ? "Subscribing…" : "Get the insights"}
                  </button>
                  {state === "error" && (
                    <p role="alert" className="flex items-center gap-2 px-1 text-[12.5px] text-red-400">
                      <AlertCircle size={13} aria-hidden="true" /> {message}
                    </p>
                  )}
                  <p className="px-1 font-mono text-[10px] leading-relaxed text-muted-foreground/70">
                    No spam. Unsubscribe anytime. Your email stays private.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
