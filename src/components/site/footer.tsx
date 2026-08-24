"use client";

import { ArrowUp, Mail, MapPin, Phone } from "lucide-react";
import { CONTACT, PRODUCTS, SERVICES } from "@/lib/content";
import { OkombaLogo, OkombaMark } from "./logo";

type FooterProps = {
  onNavigate: (id: string) => void;
  onGetStarted: () => void;
};

export function Footer({ onNavigate, onGetStarted }: FooterProps) {
  const year = new Date().getFullYear();

  const companyLinks = [
    { label: "Services", id: "services" },
    { label: "Solutions", id: "solutions" },
    { label: "Featured work", id: "work" },
    { label: "Process", id: "process" },
    { label: "About", id: "about" },
    { label: "Insights", id: "insights" },
    { label: "FAQ", id: "faq" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <footer className="relative mt-auto border-t border-white/[0.07] bg-[#04060b]" aria-label="Site footer">
      {/* top glow line */}
      <div className="shimmer-line absolute inset-x-0 top-0 h-px opacity-70" aria-hidden="true" />

      <div className="container-xl">
        {/* ── Upper footer ── */}
        <div className="grid grid-cols-1 gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:py-20">
          {/* Brand column */}
          <div>
            <OkombaLogo height={36} />
            <p className="mt-6 max-w-xs text-[13.5px] leading-relaxed text-muted-foreground">
              A professional digital services &amp; technology company building web applications,
              payment systems and digital operations that move businesses forward.
            </p>
            <div className="mt-7 flex flex-col gap-3">
              <a href={`mailto:${CONTACT.email}`} className="group inline-flex items-center gap-3 text-[13.5px] text-muted-foreground transition-colors hover:text-gold">
                <Mail size={15} className="text-gold" aria-hidden="true" />
                {CONTACT.email}
              </a>
              <a href={CONTACT.phoneHref} className="group inline-flex items-center gap-3 text-[13.5px] text-muted-foreground transition-colors hover:text-gold">
                <Phone size={15} className="text-gold" aria-hidden="true" />
                {CONTACT.phone}
              </a>
              <a
                href={CONTACT.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 text-[13.5px] text-muted-foreground transition-colors hover:text-teal"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-teal" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                WhatsApp — fastest response
              </a>
              <p className="inline-flex items-center gap-3 text-[13.5px] text-muted-foreground">
                <MapPin size={15} className="text-gold" aria-hidden="true" />
                Nigeria · Serving clients globally
              </p>
            </div>
          </div>

          {/* Services column */}
          <nav aria-label="Services links">
            <h3 className="eyebrow text-[10px] text-muted-foreground">Services</h3>
            <ul className="mt-5 space-y-2.5">
              {SERVICES.slice(0, 7).map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => onNavigate("services")}
                    className="text-left text-[13.5px] text-muted-foreground transition-colors hover:text-gold"
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Products + company column */}
          <nav aria-label="Products and company links">
            <h3 className="eyebrow text-[10px] text-muted-foreground">Products</h3>
            <ul className="mt-5 space-y-2.5">
              {PRODUCTS.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => onNavigate("solutions")}
                    className="text-left text-[13.5px] text-muted-foreground transition-colors hover:text-gold"
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
            <h3 className="eyebrow mt-8 text-[10px] text-muted-foreground">Company</h3>
            <ul className="mt-5 space-y-2.5">
              {companyLinks.slice(3).map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => onNavigate(l.id)}
                    className="text-left text-[13.5px] text-muted-foreground transition-colors hover:text-gold"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* CTA column */}
          <div>
            <h3 className="eyebrow text-[10px] text-muted-foreground">Get started</h3>
            <p className="mt-5 text-[13.5px] leading-relaxed text-muted-foreground">
              Ready to move? Tell us about your project and get a tailored proposal within 24 hours.
            </p>
            <button
              onClick={onGetStarted}
              className="btn-shine mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-3.5 text-[14px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Start a Project
            </button>

            <div className="mt-8 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
              <OkombaMark size={34} />
              <p className="font-mono text-[10.5px] leading-relaxed text-muted-foreground">
                Trusted by 50+ clients across 200+ delivered projects.
              </p>
            </div>
          </div>
        </div>

        {/* ── Lower footer ── */}
        <div className="flex flex-col items-center justify-between gap-5 border-t border-white/[0.06] py-7 md:flex-row">
          <p className="text-[12.5px] text-muted-foreground">
            © {year} Okomba Analytics. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate("about")} className="text-[12.5px] text-muted-foreground transition-colors hover:text-foreground">
              Privacy
            </button>
            <button onClick={() => onNavigate("about")} className="text-[12.5px] text-muted-foreground transition-colors hover:text-foreground">
              Terms
            </button>
            <a
              href="/#insights"
              className="text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Newsletter
            </a>
            <a href="/#/" className="font-mono text-[10px] text-muted-foreground/50 transition-colors hover:text-muted-foreground" aria-label="Admin portal">
              ·
            </a>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Back to top"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.03] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              <ArrowUp size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
