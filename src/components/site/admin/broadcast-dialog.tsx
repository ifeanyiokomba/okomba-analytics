"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Send, Users, X } from "lucide-react";

/* Broadcast dialog — compose a free-form email that goes to every
   confirmed subscriber. Records each send in EmailLog. */
export function BroadcastDialog({
  subscriberCount,
  onClose,
  onSent,
}: {
  subscriberCount: number;
  onClose: () => void;
  onSent: (sent: number) => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"confirmed" | "all">("confirmed");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSend = async () => {
    setError(null);
    if (subject.trim().length < 3) {
      setError("Subject must be at least 3 characters.");
      return;
    }
    if (body.trim().length < 10) {
      setError("Message body must be at least 10 characters.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, audience }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Send failed");
      onSent(data.sent ?? 0);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Compose broadcast"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="section-dark relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float sm:rounded-3xl [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
        <header className="relative border-b border-white/[0.06] p-6 md:p-7">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/[0.12] blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim text-gold">
                <Mail size={16} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-[20px] font-bold text-foreground">Compose broadcast</h2>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Send an announcement to your newsletter subscribers.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close broadcast composer"
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto px-6 py-6 md:px-7" style={{ display: "grid", gap: "1.15rem" }}>
          {/* Audience picker */}
          <div>
            <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Audience</span>
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => setAudience("confirmed")}
                aria-pressed={audience === "confirmed"}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors ${
                  audience === "confirmed" ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users size={12} aria-hidden="true" /> Confirmed only
              </button>
              <button
                type="button"
                onClick={() => setAudience("all")}
                aria-pressed={audience === "all"}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors ${
                  audience === "all" ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users size={12} aria-hidden="true" /> Everyone
              </button>
            </div>
            <p className="mt-1.5 font-mono text-[10.5px] text-muted-foreground/70">
              {audience === "confirmed" ? "Only confirmed subscribers" : "All subscribers (incl. pending)"} · currently{" "}
              {audience === "confirmed" ? subscriberCount : "all rows"} recipients
            </p>
          </div>

          {/* Subject */}
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Subject</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="An important update from Okomba Analytics"
              maxLength={180}
              className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 focus:bg-white/[0.05]"
            />
          </label>

          {/* Body */}
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Message</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Plain text. Will be sent as the email body."
              className="w-full resize-y rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[13.5px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 focus:bg-white/[0.05]"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/[0.08] px-3.5 py-2.5 text-[12.5px] text-red-300">
              {error}
            </p>
          )}
        </div>

        <footer className="flex flex-col gap-2.5 border-t border-white/[0.06] bg-white/[0.015] px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-7">
          <p className="text-[11.5px] text-muted-foreground">
            Each send is recorded in the email log.
          </p>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || subscriberCount === 0}
            className="btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            ) : (
              <Send size={13} aria-hidden="true" />
            )}
            {sending ? "Sending…" : "Send broadcast"}
          </button>
        </footer>
      </div>
    </div>
  );
}
