"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Eye,
  Loader2,
  MessageSquareQuote,
  Pencil,
  Plus,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Testimonial, TestimonialStatus } from "@/lib/testimonials";
import { POST_STATUS_STYLES } from "./types";

const AVATAR_COLORS = ["#FFC94D", "#00C9A7", "#5B9EFF"];

/* Testimonial editor dialog — compose new or edit existing testimonial.
   Interactive 5-star rating picker + live preview of the public card. */
export function TestimonialEditorDialog({
  testimonial,
  mode,
  onClose,
  onSave,
}: {
  testimonial: Testimonial | null; // null = new testimonial
  mode: "create" | "edit";
  onClose: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    role: string;
    service: string;
    text: string;
    rating: number;
    avatar?: string;
    status: TestimonialStatus;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(testimonial?.name ?? "");
  const [role, setRole] = useState(testimonial?.role ?? "");
  const [service, setService] = useState(testimonial?.service ?? "");
  const [text, setText] = useState(testimonial?.text ?? "");
  const [rating, setRating] = useState<number>(testimonial?.rating ?? 5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [avatar, setAvatar] = useState(testimonial?.avatar ?? "");
  const [status, setStatus] = useState<TestimonialStatus>(testimonial?.status ?? "published");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayRating = hoveredRating ?? rating;

  // Lock body scroll + ESC to close (same pattern as PostEditorDialog)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const initials = (name || "New Client")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSave = async () => {
    setError(null);
    if (name.trim().length < 2 || name.trim().length > 80) {
      setError("Name must be between 2 and 80 characters.");
      return;
    }
    if (role.trim().length < 2 || role.trim().length > 120) {
      setError("Role must be between 2 and 120 characters.");
      return;
    }
    if (service.trim().length < 2 || service.trim().length > 80) {
      setError("Service must be between 2 and 80 characters.");
      return;
    }
    if (text.trim().length < 20 || text.trim().length > 1000) {
      setError("Quote must be between 20 and 1000 characters.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...(testimonial ? { id: testimonial.id } : {}),
        name: name.trim(),
        role: role.trim(),
        service: service.trim(),
        text: text.trim(),
        rating,
        avatar: avatar.trim() ? avatar.trim() : undefined,
        status,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[13.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 focus:bg-white/[0.05]";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Add new testimonial" : `Edit testimonial: ${testimonial?.name ?? ""}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="section-dark relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float sm:rounded-3xl [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
        {/* Header */}
        <header className="relative border-b border-white/[0.06] p-6 md:p-7">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/[0.12] blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim text-gold">
                {mode === "create" ? <Plus size={16} aria-hidden="true" /> : <Pencil size={16} aria-hidden="true" />}
              </span>
              <div>
                <h2 className="font-display text-[20px] font-bold text-foreground">
                  {mode === "create" ? "Add testimonial" : "Edit testimonial"}
                </h2>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {mode === "create"
                    ? "Published testimonials appear instantly in the site's Client voices section."
                    : `Last updated ${new Date(testimonial!.updatedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close editor"
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Body — form + live preview */}
        <div className="overflow-y-auto px-6 py-6 md:px-7">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* Form column */}
            <div>
              {/* Name + role */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Client name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chukwuemeka Obi"
                    maxLength={80}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Role / company</span>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Founder, TechStartNG"
                    maxLength={120}
                    className={inputCls}
                  />
                </label>
              </div>

              {/* Service + status */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Service</span>
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    placeholder="e.g. Web Development"
                    maxLength={80}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TestimonialStatus)}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[13.5px] text-foreground outline-none transition-colors focus:border-gold/60"
                  >
                    <option value="published" className="bg-[#0b101c] text-foreground">Published — visible on site</option>
                    <option value="draft" className="bg-[#0b101c] text-foreground">Draft — hidden from site</option>
                  </select>
                </label>
              </div>

              {/* Rating picker */}
              <div className="mt-4">
                <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
                  Rating{" "}
                  <span className="font-mono text-[10px] text-muted-foreground/60">({displayRating}/5)</span>
                </span>
                <div
                  className="flex w-fit items-center gap-1 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5"
                  role="radiogroup"
                  aria-label="Star rating"
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoveredRating(s)}
                      onMouseLeave={() => setHoveredRating(null)}
                      aria-label={`Rate ${s} star${s === 1 ? "" : "s"}`}
                      aria-checked={rating === s}
                      role="radio"
                      className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                    >
                      <Star
                        size={20}
                        aria-hidden="true"
                        className={s <= displayRating ? "fill-gold text-gold" : "text-muted-foreground/50"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <label className="mt-4 block">
                <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Quote</span>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                  maxLength={1000}
                  placeholder="The client's exact words — reproduced as they wrote them."
                  className="w-full resize-y rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[13.5px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 focus:bg-white/[0.05]"
                />
                <span
                  className={cn(
                    "mt-1 inline-block font-mono text-[10px] text-muted-foreground/60",
                    text.trim().length > 0 && text.trim().length < 20 && "text-red-300"
                  )}
                >
                  {text.length}/1000
                </span>
              </label>

              {/* Avatar URL */}
              <label className="mt-4 block">
                <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
                  Avatar URL <span className="font-mono text-[10px] text-muted-foreground/60">(optional)</span>
                </span>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="/images/avatar-example.png"
                  maxLength={300}
                  className={cn(inputCls, "font-mono text-[12px]")}
                />
                <span className="mt-1 inline-block text-[10.5px] text-muted-foreground/60">
                  Leave empty to show the client's initials instead.
                </span>
              </label>
            </div>

            {/* Live preview column */}
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                <Eye size={12} aria-hidden="true" /> Live preview
              </div>
              <figure className="surface-card relative flex h-full flex-col p-5">
                <span
                  className="pointer-events-none absolute right-4 top-3 select-none font-display text-5xl leading-none text-gold/10"
                  aria-hidden="true"
                >
                  ”
                </span>
                <div className="flex gap-1" aria-label={`${displayRating} out of 5 stars`}>
                  {Array.from({ length: displayRating }).map((_, s) => (
                    <Star key={s} size={13} className="fill-gold text-gold" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="mt-3.5 flex-1 text-[12.5px] leading-relaxed text-foreground/90">
                  {text.trim() || (
                    <span className="text-muted-foreground/50">The quote will appear here…</span>
                  )}
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3 border-t border-white/[0.07] pt-4">
                  {avatar.trim() ? (
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-gold/30">
                      <Image
                        src={avatar.trim()}
                        alt={`Portrait of ${name.trim() || "client"}`}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-ink"
                      style={{ background: AVATAR_COLORS[0] }}
                      aria-hidden="true"
                    >
                      {initials}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold text-foreground">
                      {name.trim() || "Client name"}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {role.trim() || "Role, Company"}
                    </p>
                  </div>
                </figcaption>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="max-w-full truncate rounded-full bg-white/[0.05] px-2.5 py-1 font-mono text-[9px] text-muted-foreground">
                    {service.trim() || "Service"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
                      POST_STATUS_STYLES[status] ?? POST_STATUS_STYLES.draft
                    )}
                  >
                    {status}
                  </span>
                </div>
              </figure>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-red-500/25 bg-red-500/[0.08] px-3.5 py-2.5 text-[12.5px] text-red-300">
              {error}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <footer className="flex flex-col gap-2.5 border-t border-white/[0.06] bg-white/[0.015] px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-7">
          <p className="text-[11.5px] text-muted-foreground">
            {status === "published"
              ? "Saving as published — appears on the public site immediately."
              : "Saving as draft — hidden from the public site until published."}
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              ) : (
                <MessageSquareQuote size={13} aria-hidden="true" />
              )}
              Save testimonial
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
