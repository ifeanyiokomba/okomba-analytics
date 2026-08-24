"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { Service } from "@/lib/content";

/* Service detail drilldown — preserved from original admin portal.
   Opened when admin clicks the service title in an inquiry row. */
export function ServiceDetailDialog({
  service,
  onClose,
}: {
  service: Service | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!service) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [service, onClose]);

  if (!service) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Service details: ${service.title}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float sm:rounded-3xl [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
        <header className="relative border-b border-white/[0.06] p-6 md:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/[0.1] blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <span className="eyebrow rounded-full border border-gold/25 bg-gold-dim px-3 py-1 text-[9px] text-gold">
                {service.category}
              </span>
              <h2 className="mt-3.5 font-display text-[21px] font-bold leading-snug text-foreground">{service.title}</h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground">{service.desc}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close service details"
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto px-6 py-7 md:px-8" style={{ display: "grid", gap: "1.15rem" }}>
          <div>
            <p className="eyebrow mb-2.5 text-[9px] text-gold">Capabilities</p>
            <ul className="grid gap-1.5">
              {service.subs.map((s) => (
                <li key={s} className="flex items-start gap-2 text-[12.5px] text-muted-foreground">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-teal" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="eyebrow mb-2.5 text-[9px] text-gold">Benefits</p>
              <ul className="space-y-1.5">
                {service.benefits.map((b) => (
                  <li key={b} className="text-[12.5px] text-muted-foreground">
                    <span className="text-teal">✓</span> {b}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-2.5 text-[9px] text-gold">Ideal for</p>
              <div className="flex flex-wrap gap-1.5">
                {service.idealFor.map((t) => (
                  <span key={t} className="rounded-md bg-white/[0.05] px-2 py-1 text-[11px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
