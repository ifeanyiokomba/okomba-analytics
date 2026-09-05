"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { EventRegistrationDialog } from "./event-registration-dialog";
import { eventTypeMeta, lagosTime, type PublicEvent } from "@/lib/events-shared";

/* ── BATCH 10 (§34) — public Events & webinars section ──────────
   Upcoming PUBLIC events (GET /api/events). Renders NOTHING when
   there are no upcoming events (section hidden entirely). Times
   shown in West Africa Time (WAT). The join link never ships in
   the public payload — registrants receive it by email.          */

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dateParts(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  const lagos = new Date(d.getTime() + 60 * 60_000); // UTC+1, no DST
  return {
    day: String(lagos.getUTCDate()).padStart(2, "0"),
    month: MONTHS_SHORT[lagos.getUTCMonth()],
  };
}

export function EventsSection() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [registerFor, setRegisterFor] = useState<PublicEvent | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to load events");
        const data = (await res.json()) as { ok: boolean; events: PublicEvent[] };
        if (!cancelled) setEvents(data.events ?? []);
      } catch {
        /* non-fatal — section stays hidden */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = useMemo(() => events.slice(0, 6), [events]);

  if (loading) {
    // Skeleton — matches the insights-section loading pattern
    return (
      <section id="events" className="section-pad" aria-label="Events and webinars">
        <div className="container-xl">
          <SectionHeading
            eyebrow="Events & webinars"
            title={<>Upcoming events & webinars</>}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="surface-card flex h-[240px] animate-pulse flex-col p-6" aria-hidden="true">
                <div className="h-14 w-14 rounded-2xl bg-black/[0.06]" />
                <div className="mt-5 h-5 w-3/4 rounded bg-black/[0.06]" />
                <div className="mt-3 h-3 w-1/2 rounded bg-black/[0.05]" />
                <div className="mt-4 h-3 w-full rounded bg-black/[0.05]" />
                <div className="mt-2 h-3 w-2/3 rounded bg-black/[0.05]" />
                <div className="mt-auto h-10 w-28 rounded-xl bg-black/[0.06]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (shown.length === 0) return null; // §34 — nothing upcoming: no section

  return (
    <section id="events" className="section-pad relative scroll-mt-20" aria-label="Events and webinars">
      <div className="container-xl relative">
        <SectionHeading
          eyebrow="Events & webinars"
          title={
            <>
              Upcoming <span className="text-gradient-gold">events & webinars</span>
            </>
          }
          desc="Free sessions from the Okomba team — data clinics, outlook briefings and hands-on workshops. All times are West Africa Time (WAT)."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((e, i) => {
            const meta = eventTypeMeta(e.type);
            const parts = dateParts(e.startAt);
            const fillPct =
              e.capacity !== null ? Math.min(100, Math.round((e.registrationCount / e.capacity) * 100)) : null;
            const full = e.spotsLeft === 0;
            return (
              <Reveal
                key={e.id}
                delay={Math.min(i * 0.06, 0.3)}
                as="article"
                className="surface-card group flex h-full flex-col p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Date block */}
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-gold/25 bg-gold-dim">
                    <span className="font-display text-[24px] font-bold leading-none text-gold">{parts.day}</span>
                    <span className="mt-1 font-mono text-[9.5px] uppercase tracking-widest text-gold/80">{parts.month}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9.5px] font-semibold", meta.chip)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden="true" />
                      {meta.label}
                    </span>
                    {e.capacity === null ? (
                      <span className="rounded-full border border-teal/25 bg-teal-dim px-3 py-1 text-[9.5px] font-semibold text-teal">
                        Free · open to all
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-[9.5px] font-semibold",
                          full
                            ? "border-rose-400/30 bg-rose-400/10 text-rose-400"
                            : "border-gold/25 bg-gold-dim text-gold"
                        )}
                      >
                        {full ? "Fully booked" : `${e.spotsLeft} spots left`}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="mt-5 text-balance text-[16.5px] font-semibold leading-snug text-foreground transition-colors group-hover:text-gold">
                  {e.title}
                </h3>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 font-mono">
                    <Clock size={12} aria-hidden="true" /> {lagosTime(e.startAt)} WAT
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={12} aria-hidden="true" /> {e.location ?? "Online"}
                  </span>
                </div>

                {e.description && (
                  <p className="mt-3 line-clamp-2 flex-1 text-[13.5px] leading-relaxed text-muted-foreground">
                    {e.description}
                  </p>
                )}

                {fillPct !== null && (
                  <div className="mt-4" aria-hidden="true">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-light to-gold transition-[width] duration-700"
                        style={{ width: `${Math.max(fillPct, 4)}%` }}
                      />
                    </div>
                    <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/70">
                      {e.registrationCount} registered · {e.capacity} capacity
                    </p>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-black/[0.07] pt-5">
                  <span className="font-mono text-[10.5px] text-muted-foreground">
                    {new Date(e.startAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "long",
                      timeZone: "Africa/Lagos",
                    })}
                  </span>
                  <button
                    onClick={() => setRegisterFor(e)}
                    disabled={full}
                    aria-label={`Register for ${e.title}`}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-all",
                      full
                        ? "cursor-not-allowed border-black/[0.08] bg-black/[0.03] text-muted-foreground/50"
                        : "border-gold/40 bg-gold-dim text-gold hover:border-gold/60 hover:-translate-y-0.5"
                    )}
                  >
                    <CalendarDays size={14} aria-hidden="true" />
                    {full ? "Full" : "Register"}
                    {!full && <ArrowUpRight size={13} aria-hidden="true" />}
                  </button>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      {registerFor && (
        <EventRegistrationDialog event={registerFor} onClose={() => setRegisterFor(null)} />
      )}
    </section>
  );
}
