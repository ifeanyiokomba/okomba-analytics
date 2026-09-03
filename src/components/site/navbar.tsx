"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Mail, Menu, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT } from "@/lib/content";
import { OkombaNavLogo } from "./logo";

const NAV_LINKS = [
  { label: "Services", id: "services" },
  { label: "Solutions", id: "solutions" },
  { label: "Work", id: "work" },
  { label: "Process", id: "process" },
  { label: "About", id: "about" },
  { label: "FAQ", id: "faq" },
];

type NavbarProps = {
  onGetStarted: () => void;
};

export function Navbar({ onGetStarted }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track which section is currently in view for link highlighting
  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.id);
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        // Pick the most visible intersecting entry
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          setActiveSection(visible.target.id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.1, 0.25, 0.5, 1] }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  // Lock body scroll when mobile menu is open + Escape closes (directive §14)
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // close + restore focus to the hamburger toggle (focus management §14)
        setOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const scrollTo = (id: string) => {
    setOpen(false);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-black/[0.08] bg-white/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <nav
          className="container-xl flex h-[72px] items-center justify-between gap-6"
          aria-label="Main navigation"
        >
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Okomba Analytics — back to top"
            className="shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-gold"
          >
            <OkombaNavLogo />
          </button>

          {/* Desktop links */}
          <ul className="hidden items-center gap-1 lg:flex" role="menubar">
            {NAV_LINKS.map((l) => {
              const isActive = activeSection === l.id;
              return (
                <li key={l.id} role="none">
                  <button
                    role="menuitem"
                    onClick={() => scrollTo(l.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "relative rounded-lg px-3.5 py-2 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-gold",
                      isActive
                        ? "text-gold"
                        : "text-muted-foreground hover:bg-black/[0.05] hover:text-foreground"
                    )}
                  >
                    {l.label}
                    {/* active underline dot */}
                    <span
                      className={cn(
                        "absolute inset-x-1/2 bottom-0.5 h-1 w-1 -translate-x-1/2 rounded-full bg-gold transition-all duration-300",
                        isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <a
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-full border border-black/10 bg-black/[0.04] px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-teal/40 hover:text-teal md:inline-flex focus-visible:outline-2 focus-visible:outline-teal"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              WhatsApp
            </a>

            <button
              onClick={onGetStarted}
              className="btn-shine hidden items-center gap-2 rounded-full bg-gradient-to-r from-gold-light to-gold px-5 py-2.5 text-[13.5px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:inline-flex"
            >
              Get Started
              <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
            </button>

            {/* Mobile hamburger */}
            <button
              ref={menuToggleRef}
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-black/[0.04] text-foreground transition-colors hover:border-gold/40 lg:hidden focus-visible:outline-2 focus-visible:outline-gold"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile menu overlay ─────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-white/97 backdrop-blur-2xl transition-all duration-300 lg:hidden",
          open ? "visible opacity-100" : "invisible opacity-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="container-xl flex h-full flex-col overflow-y-auto pb-10 pt-[104px]">
          <ul className="flex flex-col gap-1.5">
            {NAV_LINKS.map((l, i) => (
              <li key={l.id}>
                <button
                  onClick={() => scrollTo(l.id)}
                  style={{ transitionDelay: open ? `${i * 45 + 80}ms` : "0ms" }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left text-[17px] font-medium transition-all duration-300",
                    activeSection === l.id
                      ? "border-gold/40 bg-gold-dim text-gold"
                      : "border-black/[0.07] bg-black/[0.03] text-foreground hover:border-gold/30 hover:bg-gold-dim",
                    open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  )}
                >
                  {l.label}
                  <ArrowRight size={17} className={activeSection === l.id ? "text-gold" : "text-gold/70"} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-col gap-3">
            <button
              onClick={() => {
                setOpen(false);
                onGetStarted();
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-light to-gold px-6 py-4 text-[15px] font-semibold text-ink shadow-gold"
            >
              Get Started <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
            </button>
            <a
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl border border-teal/30 bg-teal-dim px-6 py-4 text-[15px] font-medium text-teal"
            >
              Chat on WhatsApp
            </a>
          </div>

          <div className="mt-8 rounded-2xl border border-black/[0.07] bg-black/[0.02] p-5">
            <p className="eyebrow mb-3 text-muted-foreground">Quick contact</p>
            <a
              href={`mailto:${CONTACT.email}`}
              className="flex items-center gap-3 py-1.5 text-[14px] text-muted-foreground hover:text-foreground"
            >
              <Mail size={15} className="text-gold" /> {CONTACT.email}
            </a>
            <a
              href={CONTACT.phoneHref}
              className="flex items-center gap-3 py-1.5 text-[14px] text-muted-foreground hover:text-foreground"
            >
              <Phone size={15} className="text-gold" /> {CONTACT.phone}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
