"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Loader2,
  MessageSquareQuote,
  Pencil,
  Plus,
  Search,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/lib/testimonials";
import { POST_STATUS_STYLES, formatDate } from "./types";

const TESTIMONIAL_STATUSES = ["draft", "published"] as const;

/* Testimonials tab — full CMS-style management.
   - List all testimonials (drafts first, then published)
   - Create / edit (opens TestimonialEditorDialog)
   - Delete (with inline confirm)
   - Filter by status + search by name/role/service/quote */
export function TestimonialsTab({
  testimonials,
  loading,
  onCreateNew,
  onEdit,
  onDelete,
  deletingId,
}: {
  testimonials: Testimonial[];
  loading: boolean;
  onCreateNew: () => void;
  onEdit: (testimonial: Testimonial) => void;
  onDelete: (testimonial: Testimonial) => Promise<void>;
  deletingId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return testimonials
      .filter((t) => {
        const matchesStatus = statusFilter === "all" || t.status === statusFilter;
        if (!matchesStatus) return false;
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.role.toLowerCase().includes(q) ||
          t.service.toLowerCase().includes(q) ||
          t.text.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // drafts first, then by updatedAt desc
        if (a.status !== b.status) return a.status === "draft" ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [testimonials, search, statusFilter]);

  const draftCount = testimonials.filter((t) => t.status === "draft").length;
  const publishedCount = testimonials.filter((t) => t.status === "published").length;
  const avgRating =
    testimonials.length === 0
      ? 0
      : testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length;

  return (
    <div className="space-y-4">
      {/* Top row: KPIs + Add testimonial */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <TestimonialsStatCard label="Total testimonials" value={testimonials.length} icon={MessageSquareQuote} accent="text-gold" bg="border-gold/25 bg-gold-dim" />
        <TestimonialsStatCard label="Published" value={publishedCount} icon={Send} accent="text-teal" bg="border-teal/25 bg-teal-dim" />
        <TestimonialsStatCard label="Drafts" value={draftCount} icon={Pencil} accent="text-purple-300" bg="border-purple-400/25 bg-purple-400/10" />
        <TestimonialsStatCard
          label="Avg rating"
          value={testimonials.length === 0 ? "—" : avgRating.toFixed(1)}
          icon={Star}
          accent="text-gold-light"
          bg="border-gold-light/25 bg-gold-light/10"
        />
      </div>

      {/* Add testimonial banner */}
      <div className="surface-card relative flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold/[0.08] blur-3xl" aria-hidden="true" />
        <div className="relative flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim text-gold shadow-gold">
            <Plus size={16} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[14.5px] font-semibold text-foreground">Add a testimonial</h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Publish kind words from real engagements to the public site. Save as a draft first, or publish straight away.
            </p>
          </div>
        </div>
        <button
          onClick={onCreateNew}
          className="btn-shine inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5"
        >
          <Plus size={13} aria-hidden="true" />
          Add testimonial
        </button>
      </div>

      {/* Testimonials list */}
      <div className="surface-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-white/[0.06] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <h2 className="text-[14.5px] font-semibold text-foreground">
            All testimonials{" "}
            <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
              ({filtered.length}
              {filtered.length !== testimonials.length ? ` of ${testimonials.length}` : ""})
            </span>
          </h2>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, role, service, quote…"
                aria-label="Search testimonials"
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-2.5 pl-9 pr-3.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 sm:w-72"
              />
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
              {["all", ...TESTIMONIAL_STATUSES].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={statusFilter === s}
                  className={cn(
                    "rounded-full border px-3 py-1.5 font-mono text-[10.5px] font-medium capitalize transition-colors",
                    statusFilter === s
                      ? "border-gold/50 bg-gold-dim text-gold"
                      : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-gold" aria-label="Loading testimonials" />
          </div>
        ) : testimonials.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <MessageSquareQuote size={28} className="text-muted-foreground/40" aria-hidden="true" />
            <p className="text-[13px] text-muted-foreground">
              No testimonials yet — click <span className="font-medium text-foreground">Add testimonial</span> to feature your first client voice.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Search size={24} className="text-muted-foreground/40" aria-hidden="true" />
            <p className="text-[13px] text-muted-foreground">No testimonials match your search.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {filtered.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-white/[0.025] sm:flex-row sm:items-start sm:justify-between"
              >
                <button
                  onClick={() => onEdit(t)}
                  className="group flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-muted-foreground transition-colors group-hover:border-gold/30 group-hover:text-gold">
                    <MessageSquareQuote size={15} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
                          POST_STATUS_STYLES[t.status] ?? POST_STATUS_STYLES.draft
                        )}
                      >
                        {t.status}
                      </span>
                      <span className="flex items-center gap-0.5" aria-label={`Rated ${t.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star
                            key={s}
                            size={10}
                            aria-hidden="true"
                            className={s < t.rating ? "fill-gold text-gold" : "text-muted-foreground/40"}
                          />
                        ))}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground/70">
                        <CalendarDays size={11} aria-hidden="true" />
                        Updated {formatDate(t.updatedAt, { withYear: true })}
                      </span>
                    </div>
                    <h3 className="mt-1.5 truncate text-[14px] font-semibold text-foreground transition-colors group-hover:text-gold">
                      {t.name}
                      <span className="ml-2 font-normal text-muted-foreground">{t.role}</span>
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[12.5px] text-muted-foreground">{t.text}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground/70">
                      <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5">{t.service}</span>
                      <span>· order {t.sortOrder}</span>
                    </div>
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-2 self-start">
                  <button
                    onClick={() => onEdit(t)}
                    aria-label={`Edit ${t.name}`}
                    title="Edit testimonial"
                    className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                  >
                    <Pencil size={11} aria-hidden="true" />
                    Edit
                  </button>
                  {confirmDeleteId === t.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={async () => {
                          await onDelete(t);
                          setConfirmDeleteId(null);
                        }}
                        aria-label={`Confirm delete ${t.name}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/15 px-2.5 py-1.5 text-[11px] font-medium text-red-300 transition-colors hover:bg-red-500/25"
                      >
                        <Trash2 size={11} aria-hidden="true" /> Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        aria-label="Cancel delete"
                        className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(t.id)}
                      disabled={deletingId === t.id}
                      aria-label={`Delete ${t.name}`}
                      title="Delete testimonial"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TestimonialsStatCard({
  label,
  value,
  icon: Icon,
  accent,
  bg,
}: {
  label: string;
  value: number | string;
  icon: typeof MessageSquareQuote;
  accent: string;
  bg: string;
}) {
  return (
    <div className="surface-card p-5">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${bg} ${accent}`}>
        <Icon size={16} aria-hidden="true" />
      </span>
      <p className="mt-3.5 font-display text-[26px] font-bold leading-none text-foreground">{value}</p>
      <p className="mt-1.5 text-[11.5px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
