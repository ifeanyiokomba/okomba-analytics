"use client";

import { useEffect } from "react";
import { FileSignature, Mail, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICES } from "@/lib/content";
import { INQUIRY_STATUS_STYLES, formatTimestamp, type Inquiry } from "./types";

/* Inquiry detail drilldown — preserved from original admin portal. */
export function InquiryDetailDialog({
  inquiry,
  onClose,
  onOpenService,
  onCreateProposal,
}: {
  inquiry: Inquiry | null;
  onClose: () => void;
  onOpenService: (svc: NonNullable<ReturnType<typeof SERVICES.find>>) => void;
  onCreateProposal: (i: Inquiry) => void;
}) {
  useEffect(() => {
    if (!inquiry) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [inquiry, onClose]);

  if (!inquiry) return null;

  const matchedService = SERVICES.find((s) => s.title === inquiry.service) ?? null;
  const mailto = `mailto:${inquiry.email}?subject=${encodeURIComponent(
    `Re: your ${inquiry.service} inquiry — Okomba Analytics`
  )}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Inquiry from ${inquiry.name}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <article className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float sm:rounded-3xl [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
        <header className="relative border-b border-white/[0.06] p-6 md:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gold/[0.09] blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <span
                className={cn(
                  "inline-block rounded-full border px-3 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider",
                  INQUIRY_STATUS_STYLES[inquiry.status] ?? INQUIRY_STATUS_STYLES.new
                )}
              >
                {inquiry.status.replace("_", " ")}
              </span>
              <h2 className="mt-3 font-display text-[22px] font-bold text-foreground">{inquiry.name}</h2>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                {formatTimestamp(inquiry.createdAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close inquiry details"
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto px-6 py-7 md:px-8" style={{ display: "grid", gap: "1.15rem" }}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: "Email", value: inquiry.email, href: mailto },
              { label: "Phone", value: inquiry.phone },
              { label: "WhatsApp", value: inquiry.whatsapp },
              { label: "Budget", value: inquiry.budget },
            ]
              .filter((f) => f.value)
              .map((f) => (
                <div key={f.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
                  <p className="eyebrow text-[9px] text-muted-foreground">{f.label}</p>
                  {f.href ? (
                    <a href={f.href} className="mt-1.5 block truncate text-[13px] font-medium text-foreground transition-colors hover:text-gold">
                      {f.value}
                    </a>
                  ) : (
                    <p className="mt-1.5 truncate text-[13px] font-medium text-foreground">{f.value}</p>
                  )}
                </div>
              ))}
          </div>

          <div className="rounded-xl border border-gold/15 bg-gold/[0.05] px-5 py-4">
            <p className="eyebrow mb-2 text-[9px] text-gold">Requested services</p>
            <div className="flex flex-wrap items-center gap-2">
              {matchedService ? (
                <button
                  onClick={() => onOpenService(matchedService)}
                  className="rounded-lg border border-gold/30 bg-gold-dim px-3 py-1.5 text-[12px] font-medium text-gold transition-colors hover:bg-gold/20"
                >
                  {inquiry.service} →
                </button>
              ) : (
                <span className="text-[12.5px] text-foreground">{inquiry.service}</span>
              )}
              {inquiry.addlService && (
                <span className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-[11.5px] text-muted-foreground">
                  + {inquiry.addlService}
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="eyebrow mb-2 text-[9px] text-muted-foreground">Message</p>
            <p className="whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-[13.5px] leading-relaxed text-foreground/90">
              {inquiry.message}
            </p>
          </div>
        </div>

        <footer className="flex flex-col gap-2.5 border-t border-white/[0.06] bg-white/[0.015] px-6 py-5 sm:flex-row md:px-8">
          <button
            onClick={() => onCreateProposal(inquiry)}
            className="btn-shine inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-3 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5"
          >
            <FileSignature size={14} aria-hidden="true" />
            Create proposal
          </button>
          <a
            href={mailto}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] px-5 py-3 text-[13px] font-medium text-foreground transition-colors hover:border-gold/40 hover:text-gold"
          >
            <Mail size={14} aria-hidden="true" />
            Reply by email
          </a>
          {inquiry.whatsapp && (
            <a
              href={`https://wa.me/${inquiry.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-teal/30 bg-teal-dim px-5 py-3 text-[13px] font-medium text-teal transition-colors hover:bg-teal/15"
            >
              WhatsApp
            </a>
          )}
        </footer>
      </article>
    </div>
  );
}
