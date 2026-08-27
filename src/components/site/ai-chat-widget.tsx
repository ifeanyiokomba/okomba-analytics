"use client";

/**
 * AI Service Finder widget (Phase-2 Module 7 — redesigned Stage 10).
 *
 * Launcher is now a compact floating chat-icon FAB on the right edge
 * (replaces the long "Talk Through Your Ideas 💡" pill that was
 * covering content). The FAB:
 *   • floats fixed and travels with scroll
 *   • runs a gentle bounce + ping-ring animation at intervals to
 *     draw the eye (respects prefers-reduced-motion)
 *   • emits a soft two-note chime at intervals (Web Audio API —
 *     no asset, ~0.4kb). Autoplay-policy compliant: chime only
 *     arms after the visitor's first interaction with the page.
 *     A mute toggle lives in the chat header.
 *
 * Chat panel logic (history, /api/ai/chat, lead capture, GA4)
 * is unchanged from the previous implementation.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, Sparkles, X, CheckCircle2, ShieldCheck, ExternalLink, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent, aiChatServiceHref } from "@/lib/analytics";

type ChatMessage = { role: "user" | "assistant"; content: string; at?: number; services?: string[] };

const STORAGE_KEY = "okomba-ai-chat-v1";
const SESSION_KEY = "okomba-ai-chat-session";
const SOUND_PREF_KEY = "okomba-ai-chat-sound";

const SUGGESTIONS = [
  "I need a website for my school",
  "Help me choose the right service",
  "I need payment integration for my shop",
];

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm Okomba AI. Tell me what you're trying to build or fix for your organisation, and I'll recommend the right service — then I'll prepare a custom proposal for you.",
};

function loadHistory(): { messages: ChatMessage[]; captured: boolean } {
  if (typeof window === "undefined") return { messages: [WELCOME], captured: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { messages: [WELCOME], captured: false };
    const parsed = JSON.parse(raw) as { messages?: ChatMessage[]; captured?: boolean };
    const messages = Array.isArray(parsed.messages) && parsed.messages.length
      ? parsed.messages.filter(
          (m) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim().length > 0
        )
      : [WELCOME];
    return { messages, captured: !!parsed.captured };
  } catch {
    return { messages: [WELCOME], captured: false };
  }
}

function loadSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id || id.length < 6) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function loadSoundPref(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SOUND_PREF_KEY) !== "off";
  } catch {
    return false;
  }
}

/* ── Web Audio chime (generated, no asset) ─────────────────── */
function playChime(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    // Soft two-note sine arpeggio (G5 → C6), low gain, short release
    const notes = [
      { f: 784.0, t: 0.0, d: 0.12 },   // G5
      { f: 1046.5, t: 0.11, d: 0.18 }, // C6
    ];
    const master = ctx.createGain();
    master.gain.value = 0.06; // quiet
    master.connect(ctx.destination);
    for (const n of notes) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = n.f;
      const g = ctx.createGain();
      const start = now + n.t;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(1, start + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, start + n.d);
      osc.connect(g);
      g.connect(master);
      osc.start(start);
      osc.stop(start + n.d + 0.02);
    }
    // Close the context after the tail to free the AudioContext slot
    setTimeout(() => { try { ctx.close(); } catch { /* noop */ } }, 600);
  } catch {
    /* audio must never break UX */
  }
}

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [captured, setCaptured] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nudge, setNudge] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string>("ssr");
  const interactedRef = useRef(false);

  // Restore history + session + sound pref
  useEffect(() => {
    const { messages: m, captured: c } = loadHistory();
    setMessages(m);
    setCaptured(c);
    sessionIdRef.current = loadSessionId();
    setSoundOn(loadSoundPref());
    // Gentle nudge after 14s on first visit (never for returning visitors)
    if (m.length <= 1) {
      const t = setTimeout(() => setNudge(true), 14000);
      return () => clearTimeout(t);
    }
  }, []);

  // Persist history
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, captured }));
  }, [messages, captured]);

  // Auto-scroll to latest message
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, open]);

  // Focus input when opening on desktop
  useEffect(() => {
    if (open && window.innerWidth >= 768) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [open]);

  // ── Attention loop: bounce + chime at intervals ──────────────
  // Bounce runs visually whether or not sound is on; chime only when
  // sound is enabled AND the visitor has interacted with the page at
  // least once (browser autoplay-policy compliance).
  useEffect(() => {
    if (open) return; // no attention loop while the panel is open
    if (typeof window === "undefined") return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    // First attention pulse ~9s after mount (if not opened), then every ~28s
    let bounceTimer: ReturnType<typeof setTimeout>;
    let chimeTimer: ReturnType<typeof setTimeout>;

    const scheduleBounce = (delay: number) => {
      bounceTimer = setTimeout(() => {
        if (reduce) return;
        setBouncing(true);
        setTimeout(() => setBouncing(false), 1600);
        scheduleBounce(28000);
      }, delay);
    };

    const scheduleChime = (delay: number) => {
      chimeTimer = setTimeout(() => {
        if (soundOn && interactedRef.current) playChime();
        scheduleChime(32000);
      }, delay);
    };

    scheduleBounce(9000);
    scheduleChime(9000);

    return () => {
      clearTimeout(bounceTimer);
      clearTimeout(chimeTimer);
    };
  }, [open, soundOn]);

  // Mark first user interaction (anywhere on the page) to arm the chime
  useEffect(() => {
    const arm = () => { interactedRef.current = true; };
    const opts: AddEventListenerOptions = { once: true, passive: true };
    window.addEventListener("pointerdown", arm, opts);
    window.addEventListener("keydown", arm, opts);
    window.addEventListener("scroll", arm, opts);
    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
      window.removeEventListener("scroll", arm);
    };
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      try { window.localStorage.setItem(SOUND_PREF_KEY, next ? "on" : "off"); } catch { /* noop */ }
      // Play a confirming chime immediately when enabling (user gesture → allowed)
      if (next) playChime();
      return next;
    });
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || typing) return;
      setError(null);
      setNudge(false);
      setInput("");

      const isFirst = messages.length <= 1; // welcome only → first real turn
      const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
      setMessages(nextMessages);
      setTyping(true);

      // Module 8C — GA4 client-side event (server also records deduped).
      if (isFirst) {
        trackEvent("ai_chat_start", {
          session_id: sessionIdRef.current,
          first_message_chars: trimmed.length,
        });
      }

      const startedAt = Date.now();
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            messages: nextMessages
              .slice(-20)
              .map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const j = (await res.json().catch(() => null)) as
          | { ok: boolean; reply?: string; leadCaptured?: boolean; recommendedServices?: string[]; error?: string }
          | null;
        if (!res.ok || !j?.ok || !j.reply) {
          throw new Error(j?.error ?? "Chat unavailable");
        }
        // Small floor so the typing dots never flash
        const elapsed = Date.now() - startedAt;
        if (elapsed < 600) await new Promise((r) => setTimeout(r, 600 - elapsed));

        const services = Array.isArray(j.recommendedServices) ? j.recommendedServices.slice(0, 4) : [];
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: j.reply!, at: Date.now(), services: services.length ? services : undefined },
        ]);
        if (j.leadCaptured) setCaptured(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Chat unavailable";
        setError(msg);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Apologies — I dropped offline for a moment. Please try again, or use the contact form below and the team will reach out.",
            at: Date.now(),
          },
        ]);
      } finally {
        setTyping(false);
      }
    },
    [messages, typing]
  );

  const clearChat = useCallback(() => {
    setMessages([WELCOME]);
    setCaptured(false);
    setError(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      sessionIdRef.current = loadSessionId();
    }
  }, []);

  return (
    <>
      {/* ── Floating chat-icon launcher (compact FAB) ── */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.9 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-5 right-4 z-[80] sm:bottom-6 sm:right-6"
          >
            {/* Attention ping ring — runs during the bounce window */}
            <span
              className={cn(
                "pointer-events-none absolute inset-0 rounded-full bg-gold/40 transition-opacity duration-300",
                bouncing ? "opacity-100 animate-ping-slow" : "opacity-0"
              )}
              aria-hidden="true"
            />

            {/* Dismissible text nudge bubble (first visit only) */}
            {nudge && !captured && (
              <div className="absolute bottom-full right-0 mb-3 w-[210px] rounded-2xl rounded-br-sm border border-gold/30 bg-white px-3.5 py-2.5 text-[12px] font-medium text-[#1c2333] shadow-gold">
                <div className="flex items-start gap-2">
                  <Sparkles size={13} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                  <span>Not sure where to start? Let&apos;s talk through your ideas.</span>
                </div>
                <button
                  onClick={() => setNudge(false)}
                  aria-label="Dismiss"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-black/10 bg-white text-[#5a6373] shadow-sm hover:text-[#1c2333]"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              onClick={() => setOpen(true)}
              aria-label="Open the Okomba AI chat — talk through your ideas"
              className={cn(
                "group relative flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 bg-[#0B0F1A] text-white shadow-float transition-all duration-300 hover:border-gold hover:shadow-gold-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                bouncing && "animate-chat-bounce"
              )}
            >
              {/* Ambient gold glow */}
              <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gold/30 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
              {/* Pulsing status dot */}
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#0B0F1A] bg-teal animate-status-pulse" aria-hidden="true" />
              <MessageCircle size={22} strokeWidth={2.2} className="text-gold-light" aria-hidden="true" />
              {/* Tiny unread-style count chip showing we're alive */}
              <span className="sr-only">Okomba AI is online</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="Okomba AI service finder chat"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-3 bottom-3 top-14 z-[90] flex flex-col overflow-hidden rounded-3xl border border-gold/25 bg-[#f7f5ef] shadow-float sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[min(620px,calc(100dvh-3rem))] sm:w-[400px]"
          >
            {/* Header */}
            <header className="relative flex items-center gap-3 bg-[#0B0F1A] px-4 py-3.5">
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-gold via-gold-light to-gold" aria-hidden="true" />
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/20">
                <Sparkles size={17} className="text-gold-light" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-white">Okomba AI</p>
                <p className="flex items-center gap-1.5 text-[11px] text-[#8a93a5]">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal animate-status-pulse" aria-hidden="true" />
                  Service finder · replies instantly
                </p>
              </div>
              {/* Sound toggle */}
              <button
                onClick={toggleSound}
                aria-pressed={soundOn}
                aria-label={soundOn ? "Mute chat notification sound" : "Enable chat notification sound"}
                title={soundOn ? "Notification sound on" : "Notification sound off"}
                className="rounded-lg p-1.5 text-[#8a93a5] transition-colors hover:bg-white/10 hover:text-white"
              >
                {soundOn ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
              </button>
              <button
                onClick={clearChat}
                className="hidden rounded-lg px-2 py-1 text-[11px] font-medium text-[#8a93a5] transition-colors hover:text-white sm:block"
                aria-label="Start a fresh conversation"
              >
                Reset
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-lg p-1.5 text-[#8a93a5] transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </header>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4 [scrollbar-width:thin] sm:px-4"
              aria-live="polite"
            >
              {messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                      m.role === "user"
                        ? "rounded-br-md bg-[#0B0F1A] text-white shadow-sm"
                        : "rounded-bl-md border border-[#e4e1d8] bg-white text-[#1c2333] shadow-sm"
                    )}
                  >
                    {m.role === "assistant" && (
                      <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-gold">
                        Okomba AI
                      </span>
                    )}
                    {m.content}
                    {m.role === "assistant" && m.services && m.services.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-[#ece9df] pt-2.5">
                        {m.services.map((s) => (
                          <a
                            key={s}
                            href={aiChatServiceHref("services")}
                            className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold-dim px-2.5 py-1 text-[11px] font-semibold text-[#1c2333] transition-all hover:border-gold hover:bg-gold/20"
                            onClick={() => trackEvent("proposal_view", { from: "ai_chat", service: s })}
                          >
                            {s}
                            <ExternalLink size={10} aria-hidden="true" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing dots */}
              {typing && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-[#e4e1d8] bg-white px-4 py-3 shadow-sm">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-gold"
                        style={{
                          animation: `chat-dot 1.2s ease-in-out ${d * 0.18}s infinite`,
                        }}
                        aria-hidden="true"
                      />
                    ))}
                    <span className="sr-only">Okomba AI is typing</span>
                  </div>
                </div>
              )}

              {/* Lead captured confirmation */}
              {captured && !typing && messages[messages.length - 1]?.role === "assistant" && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2.5 rounded-2xl border border-gold/35 bg-gold-dim px-3.5 py-3 text-[12.5px] text-[#1c2333] shadow-sm">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                    <p>
                      <span className="font-semibold">Got your email.</span> A custom proposal is being
                      prepared and will land in your inbox shortly — investment details included.
                    </p>
                  </div>
                </div>
              )}

              {/* Suggestion chips */}
              {messages.length <= 1 && !typing && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      className="rounded-full border border-[#e4e1d8] bg-white px-3.5 py-2 text-[12px] font-medium text-[#1c2333] shadow-sm transition-all hover:border-gold/50 hover:shadow-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {error && (
                <p role="alert" className="px-1 text-[11.5px] text-red-600">
                  {error}
                </p>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="border-t border-[#e4e1d8] bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-3.5"
            >
              <div className="flex items-center gap-2">
                <label htmlFor="ai-chat-input" className="sr-only">
                  Message Okomba AI
                </label>
                <input
                  id="ai-chat-input"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe what you want to build…"
                  maxLength={2000}
                  autoComplete="off"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-[#e4e1d8] bg-[#f7f5ef] px-3.5 text-[13px] text-[#1c2333] placeholder:text-[#9aa1af] focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || typing}
                  aria-label="Send message"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold text-[#141926] shadow-sm transition-all hover:bg-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={16} aria-hidden="true" />
                </button>
              </div>
              <p className="mt-2 flex items-center gap-1.5 pl-1 text-[10.5px] text-[#9aa1af]">
                <ShieldCheck size={11} aria-hidden="true" />
                AI recommends real Okomba services · never shares pricing in chat
              </p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
