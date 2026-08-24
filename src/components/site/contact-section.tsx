"use client";

import { ArrowRight, CheckCircle2, Clock3, Mail, Phone, Zap } from "lucide-react";
import { CONTACT } from "@/lib/content";
import { Reveal } from "./reveal";

const CONTACT_METHODS = [
  {
    icon: Mail,
    label: "Email support",
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
    accent: "border-[#5b9eff]/25 bg-[#5b9eff]/10 text-[#5b9eff]",
    note: "Detailed briefs & documents",
  },
  {
    icon: Phone,
    label: "Phone call",
    value: CONTACT.phone,
    href: CONTACT.phoneHref,
    accent: "border-gold/25 bg-gold-dim text-gold",
    note: "Mon–Sat · 8:00–18:00 WAT",
  },
  {
    icon: Zap,
    label: "WhatsApp",
    value: `${CONTACT.phone} · Fast response`,
    href: CONTACT.whatsapp,
    accent: "border-teal/25 bg-teal-dim text-teal",
    note: "Usually replies within minutes",
    external: true,
  },
];

const WHY_POINTS = [
  { title: "Fast turnaround", desc: "Rapid delivery without sacrificing quality." },
  { title: "Confidential & secure", desc: "Your data and projects handled with discretion." },
  { title: "Globally competitive", desc: "International-standard work at accessible pricing." },
  { title: "Support ready", desc: "We're available when you need us most." },
  { title: "Result-driven", desc: "Every engagement focuses on measurable outcomes." },
];

type ContactSectionProps = {
  onGetStarted: () => void;
};

export function ContactSection({ onGetStarted }: ContactSectionProps) {
  return (
    <section id="contact" className="section-pad relative scroll-mt-20" aria-label="Contact">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden="true" />

      <div className="container-xl relative">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* ── Contact methods ── */}
          <Reveal>
            <div>
              <span className="eyebrow inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-gold-dim px-4 py-1.5 text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" aria-hidden="true" />
                Contact
              </span>
              <h2 className="mt-6 text-balance font-display text-3xl font-bold leading-[1.12] text-foreground sm:text-4xl">
                Have an idea, project or problem to solve?{" "}
                <span className="text-gradient-gold">Let&apos;s build the right solution.</span>
              </h2>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                Tell us what you need — a website, a payment system, an operation to automate — and
                our team will respond within 24 hours with a tailored proposal.
              </p>

              <div className="mt-8 space-y-3">
                {CONTACT_METHODS.map((m) => (
                  <a
                    key={m.label}
                    href={m.href}
                    {...(m.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="surface-card group flex items-center gap-4 p-4.5 px-5 py-4 focus-visible:outline-2 focus-visible:outline-gold"
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${m.accent}`}>
                      <m.icon size={19} strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] font-semibold text-foreground">{m.label}</span>
                      <span className="block truncate text-[13px] text-muted-foreground">{m.value}</span>
                      <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground/70">{m.note}</span>
                    </span>
                    <ArrowRight
                      size={16}
                      className="shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-1 group-hover:text-gold"
                      aria-hidden="true"
                    />
                  </a>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── Why choose + response promise ── */}
          <Reveal delay={120}>
            <div className="flex h-full flex-col gap-5">
              <div className="surface-card p-7 md:p-8">
                <h3 className="font-display text-lg font-bold text-foreground">Why teams choose Okomba</h3>
                <ul className="mt-5 space-y-4">
                  {WHY_POINTS.map((w) => (
                    <li key={w.title} className="flex gap-3.5">
                      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
                      <div>
                        <p className="text-[14px] font-semibold text-foreground">{w.title}</p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{w.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Big conversion banner */}
              <div className="relative flex-1 overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/[0.12] via-white to-white p-7 md:p-8">
                <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gold/[0.14] blur-3xl" aria-hidden="true" />
                <div className="relative flex h-full flex-col">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold-light to-gold text-ink shadow-gold">
                    <Clock3 size={20} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-balance font-display text-[20px] font-bold leading-snug text-foreground">
                    Start a project in under 2 minutes
                  </h3>
                  <p className="mt-2.5 flex-1 text-[13.5px] leading-relaxed text-muted-foreground">
                    One smart form — name, contact, service and a few lines about your goal. We take
                    it from there with a tailored proposal.
                  </p>
                  <button
                    onClick={onGetStarted}
                    className="btn-shine mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-light to-gold px-6 py-4 text-[15px] font-semibold text-ink shadow-gold-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  >
                    Submit Inquiry
                    <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
                  </button>
                  <p className="mt-3.5 text-center font-mono text-[10.5px] text-muted-foreground">
                    No obligation · Response within 24h
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
