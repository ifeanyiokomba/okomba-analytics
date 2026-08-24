"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Service } from "@/lib/content";
import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { CapabilityTicker, StatsBand } from "@/components/site/trust";
import { ServicesSection } from "@/components/site/services-section";
import { ProductsSection } from "@/components/site/products-section";
import { CaseStudiesSection } from "@/components/site/case-studies-section";
import { WhySection } from "@/components/site/why-section";
import { ProcessSection } from "@/components/site/process-section";
import { TestimonialsSection } from "@/components/site/testimonials-section";
import { InsightsSection } from "@/components/site/insights-section";
import { AboutSection } from "@/components/site/about-section";
import { FaqSection } from "@/components/site/faq-section";
import { NewsletterSection } from "@/components/site/newsletter-section";
import { ContactSection } from "@/components/site/contact-section";
import { Footer } from "@/components/site/footer";
import { LoadingScreen } from "@/components/site/loading-screen";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { BackToTop } from "@/components/site/back-to-top";

/* ── Lazy-loaded: only fetched when actually opened ── */
const InquiryModal = dynamic(
  () => import("@/components/site/inquiry-modal").then((m) => m.InquiryModal),
  { ssr: false }
);
const AdminPortal = dynamic(
  () => import("@/components/site/admin-portal").then((m) => m.AdminPortal),
  { ssr: false, loading: () => <div className="flex min-h-screen items-center justify-center bg-background" aria-label="Loading admin portal"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" /></div> }
);

type ToastData = { msg: string };

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<"home" | "admin">("home");
  const [modalService, setModalService] = useState<Service | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  // Hash routing for the admin portal (preserves original /#/admin workflow)
  useEffect(() => {
    const sync = () => setRoute(window.location.hash === "#/admin" ? "admin" : "home");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const openInquiry = useCallback((service: Service | null) => {
    setModalService(service);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setTimeout(() => setModalService(null), 300);
  }, []);

  const handleSuccess = useCallback((name: string) => {
    setToast({ msg: `Thank you ${name}! Your inquiry has been received — we'll respond within 24 hours.` });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const scrollTo = useCallback((id: string) => {
    if (route !== "home") {
      window.location.hash = "";
      setRoute("home");
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 120);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [route]);

  if (loading) {
    return <LoadingScreen onDone={() => setLoading(false)} />;
  }

  // ── Admin portal view ──
  if (route === "admin") {
    return <AdminPortal onExit={() => (window.location.hash = "")} />;
  }

  // ── Marketing site ──
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[300] focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:font-semibold focus:text-ink"
      >
        Skip to main content
      </a>

      <Navbar onGetStarted={() => openInquiry(null)} />
      <ScrollProgress />
      <BackToTop />

      <main id="main" className="flex-1">
        <Hero onGetStarted={() => openInquiry(null)} />
        <CapabilityTicker />
        <StatsBand />
        <ServicesSection onRequestService={openInquiry} />
        <ProductsSection />
        <CaseStudiesSection />
        <WhySection />
        <ProcessSection onGetStarted={() => openInquiry(null)} />
        <TestimonialsSection />
        <InsightsSection />
        <NewsletterSection />
        <AboutSection />
        <FaqSection />
        <ContactSection onGetStarted={() => openInquiry(null)} />
      </main>

      <Footer onNavigate={scrollTo} onGetStarted={() => openInquiry(null)} />

      {modalOpen && (
        <InquiryModal
          service={modalService}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      )}

      {/* Success toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-[150] flex max-w-sm items-start gap-3 rounded-2xl border border-teal/30 bg-[#0b101c]/95 p-4 pr-5 shadow-float backdrop-blur-xl [animation:slide-in-right_0.4s_cubic-bezier(0.22,1,0.36,1)]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-dim text-teal">
            <CheckCircle2 size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[13.5px] font-semibold text-foreground">Inquiry received</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{toast.msg}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="ml-1 mt-0.5 text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
