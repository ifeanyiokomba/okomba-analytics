"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Mail, MailCheck, Send, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

/** Only true when no real email provider is configured (dev/demo mode). */
const DEV_CONFIRM_SIMULATION = process.env.NEXT_PUBLIC_DEV_CONFIRM_SIMULATION !== "false";

/**
 * Newsletter band — double opt-in email capture wired to POST /api/subscribe.
 * Step 1: enter email → pending subscriber created, confirm link shown (dev
 * simulation of the email). Step 2: user visits confirm link → confirmed.
 *
 * Stage 11 (founder directive): the "Get the insights" button is ALWAYS
 * lit with the full gold gradient — never dimmed/pale. A subtle glow pulse
 * invites the click even before any text is typed. On submit, a stylish
 * confirmation plays (icon swap → arrow → checkmark, glow burst, micro-
 * confetti sparkles) so the user feels the email was actually sent.
 */
export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "sent-flash" | "done" | "error">("idle");
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
      // Stylish "sent!" flash before settling into the done state
      setState("sent-flash");
      setMessage(
        data.alreadyConfirmed
          ? "You're already subscribed — thank you!"
          : "Almost there — one click confirms your subscription."
      );
      if (data.confirmPath) setConfirmPath(data.confirmPath);
      setEmail("");
      // Hold the celebratory flash for 1.4s, then settle into the steady state
      setTimeout(() => setState("done"), 1400);
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
      if (res.ok) {
        setState("sent-flash");
        setMessage("Confirmed! You're on the list — practical insights, no spam.");
        setTimeout(() => setState("sent"), 1400);
      } else {
        setState("error");
        setMessage("Confirmation failed — please try subscribing again.");
      }
    } catch {
      setState("error");
      setMessage("Confirmation failed — please try again.");
    }
  };

  // ── The button label / icon / glow depends on state ─────────────────
  const buttonContent = (() => {
    switch (state) {
      case "busy":
        return { icon: <Loader2 size={15} className="animate-spin" aria-hidden="true" />, label: "Sending…" };
      case "sent-flash":
        return { icon: <CheckCircle2 size={15} aria-hidden="true" />, label: "Sent!" };
      case "done":
        return { icon: <MailCheck size={15} aria-hidden="true" />, label: "Check your inbox" };
      case "sent":
        return { icon: <CheckCircle2 size={15} aria-hidden="true" />, label: "Subscribed" };
      default:
        return { icon: <Send size={15} strokeWidth={2.3} aria-hidden="true" />, label: "Get the insights" };
    }
  })();

  return (
    <section id="newsletter" aria-label="Newsletter" className="container-xl scroll-mt-24">
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
              <AnimatePresence mode="wait">
                {state === "done" || state === "sent" || state === "sent-flash" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-teal/30 bg-teal/[0.08] p-5"
                  >
                    {/* Sent-flash glow burst — a one-shot gold/teal radial pulse */}
                    {state === "sent-flash" && (
                      <>
                        <span
                          className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(60%_60%_at_50%_50%,rgba(0,201,167,0.35),transparent_70%)] [animation:sent-flash_1.4s_ease-out_forwards]"
                          aria-hidden="true"
                        />
                        {/* micro-confetti — 5 sparkles flying outward */}
                        <span className="pointer-events-none absolute left-1/2 top-1/2 z-10" aria-hidden="true">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <Sparkles
                              key={i}
                              size={11 - i}
                              className="absolute text-gold [animation:confetti_1.2s_ease-out_forwards]"
                              style={{
                                // @ts-expect-error custom props for keyframes
                                "--cx": `${Math.cos((i / 5) * Math.PI * 2) * 60}px`,
                                "--cy": `${Math.sin((i / 5) * Math.PI * 2) * 60 - 14}px`,
                                animationDelay: `${i * 30}ms`,
                                left: 0,
                                top: 0,
                              }}
                            />
                          ))}
                        </span>
                      </>
                    )}

                    <div role="status" className="relative flex w-full items-start gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-dim text-teal">
                        {state === "sent-flash" || state === "sent" ? (
                          <CheckCircle2 size={19} aria-hidden="true" />
                        ) : (
                          <MailCheck size={19} aria-hidden="true" />
                        )}
                      </span>
                      <div>
                        <p className="text-[14.5px] font-semibold text-foreground">
                          {state === "sent-flash" || state === "sent" ? "Subscribed" : "Check your inbox"}
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{message}</p>
                      </div>
                    </div>

                    {/* Step 2 (dev simulation): confirm button when link present */}
                    {state === "done" && confirmPath && DEV_CONFIRM_SIMULATION && (
                      <div className="relative w-full rounded-xl border border-gold/20 bg-gold/[0.06] p-4">
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
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={submit}
                    noValidate
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-3"
                  >
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
                    {/* ALWAYS-LIT submit button — full gold gradient + pulsing
                        glow ring regardless of email contents. Pointer-events
                        disable on empty so the browser shows the required
                        tooltip instead of silently doing nothing. The form
                        validation kicks in natively (input has `required`). */}
                    <button
                      type="submit"
                      aria-label="Subscribe to the Okomba insights newsletter"
                      className={cn(
                        "btn-shine group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-4 text-[14.5px] font-bold text-ink shadow-gold-lg transition-all active:scale-[0.99]",
                        // Always-on gradient — never dimmed
                        "bg-gradient-to-r from-gold-light via-gold to-gold-dark",
                        // Subtle lift on hover (no translate, just glow)
                        "hover:shadow-[0_18px_50px_-12px_rgba(201,145,10,0.55)]",
                        state === "busy" && "pointer-events-none",
                      )}
                    >
                      {/* Glow ring behind the button — invites clicks even
                          before email is entered. Pulsing keyframes. */}
                      <span
                        className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-gold-light to-gold opacity-70 blur-md [animation:btn-glow_2.8s_ease-in-out_infinite]"
                        aria-hidden="true"
                      />
                      {/* Hover shine sweep */}
                      <span
                        className="pointer-events-none absolute inset-0 -z-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]"
                        aria-hidden="true"
                      />
                      <span className="relative z-10 flex items-center gap-2">
                        {buttonContent.icon}
                        {buttonContent.label}
                        {state === "idle" && (
                          <ArrowRight
                            size={15}
                            strokeWidth={2.6}
                            className="transition-transform group-hover:translate-x-1"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    </button>
                    {state === "error" && (
                      <p role="alert" className="flex items-center gap-2 px-1 text-[12.5px] text-red-400">
                        <AlertCircle size={13} aria-hidden="true" /> {message}
                      </p>
                    )}
                    <p className="px-1 font-mono text-[10px] leading-relaxed text-muted-foreground/70">
                      No spam. Unsubscribe anytime. Your email stays private.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
