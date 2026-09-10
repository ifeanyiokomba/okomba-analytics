"use client";

/* ─────────────────────────────────────────────────────────────
   BATCH 13 (§64–§67) — Okomba Learning shared UI atoms.

   Small building blocks reused across the student portal views:
   fetch wrapper, toast, badges, progress ring/bar, stat cards,
   empty/error states, skeleton blocks and date/text formatters.
   ───────────────────────────────────────────────────────────── */

import { AlertTriangle, CheckCircle2, Info, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { COURSE_LEVEL_META, type CourseLevel } from "@/lib/learning-shared";

/* ── Fetch wrapper ─────────────────────────────────────────── */

/** Error with the HTTP status attached (401 = logged-out, etc). */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Same-origin fetch with cookies for the learning API. Throws a
 * friendly ApiError on network failure / non-ok / {ok:false}.
 * Pass an AbortSignal via init.signal for abort-safe effects.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, credentials: "include" });
  } catch {
    throw new ApiError("Network error — check your connection and try again.", 0);
  }
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string } & T;
  if (!res.ok || data.ok === false) {
    throw new ApiError(data.error ?? `Request failed (${res.status})`, res.status);
  }
  return data;
}

/* ── Toast (portal-local, same feel as page.tsx) ───────────── */

export type ToastTone = "success" | "error" | "info";

export function LearningToast({
  tone,
  message,
  onDismiss,
}: {
  tone: ToastTone;
  message: string;
  onDismiss: () => void;
}) {
  const icon =
    tone === "success" ? (
      <CheckCircle2 size={18} aria-hidden="true" />
    ) : tone === "error" ? (
      <AlertTriangle size={18} aria-hidden="true" />
    ) : (
      <Info size={18} aria-hidden="true" />
    );
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-4 z-[150] flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl border border-black/[0.08] bg-white p-4 pr-5 shadow-[0_20px_48px_-18px_rgba(20,25,38,0.3)] [animation:lp-toast-in_0.35s_cubic-bezier(0.22,1,0.36,1)] sm:max-w-sm"
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          tone === "success" && "bg-teal-dim text-teal",
          tone === "error" && "bg-destructive/10 text-destructive",
          tone === "info" && "bg-gold-dim text-gold"
        )}
      >
        {icon}
      </span>
      <p className="pt-1 text-[13.5px] font-medium leading-relaxed text-foreground">{message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-1 mt-1 text-muted-foreground/60 transition-colors hover:text-foreground"
      >
        ✕
      </button>
    </div>
  );
}

/* ── Badges / progress ─────────────────────────────────────── */

export function LevelBadge({ level, className }: { level: CourseLevel; className?: string }) {
  const meta = COURSE_LEVEL_META[level];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold tracking-wide",
        meta.chip,
        className
      )}
    >
      {meta.label}
    </span>
  );
}

/** SVG progress ring with a number in the middle. */
export function ProgressRing({
  percent,
  size = 84,
  stroke = 8,
  label,
  tone = "gold",
}: {
  percent: number;
  size?: number;
  stroke?: number;
  label?: string;
  tone?: "gold" | "teal";
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const trackColor = tone === "gold" ? "rgba(201,145,10,0.15)" : "rgba(10,157,132,0.15)";
  const ringColor = tone === "gold" ? "var(--gold)" : "var(--teal)";
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `${clamped}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="absolute text-center">
        <span className="font-display text-[15px] font-bold text-foreground">{clamped}%</span>
        {label ? <span className="sr-only">{label}</span> : null}
      </span>
    </div>
  );
}

/** Slim labelled progress bar (used for per-course progress). */
export function ProgressBar({
  percent,
  className,
  barClassName,
}: {
  percent: number;
  className?: string;
  barClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${clamped}% complete`}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-black/[0.07]", className)}
    >
      <div
        className={cn("h-full rounded-full bg-gradient-to-r from-gold-light to-gold transition-[width] duration-500", barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* ── Small stat card (quiz attempts, courses…) ─────────────── */

export function StatCard({
  icon,
  value,
  label,
  tone = "gold",
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  tone?: "gold" | "teal" | "purple";
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-black/[0.07] bg-white p-4">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          tone === "gold" && "bg-gold-dim text-gold",
          tone === "teal" && "bg-teal-dim text-teal",
          tone === "purple" && "bg-purple/10 text-purple"
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-display text-[19px] font-bold leading-tight text-foreground">{value}</p>
        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/* ── Empty / error / loading states ────────────────────────── */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/[0.12] bg-white/60 px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-dim text-gold">{icon}</span>
      <h3 className="mt-4 font-display text-[17px] font-bold text-foreground">{title}</h3>
      {body ? <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-muted-foreground">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/[0.03] px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-display text-[16px] font-bold text-foreground">Something went wrong</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-5 rounded-xl border-black/15">
          <RotateCcw size={14} aria-hidden="true" /> Try again
        </Button>
      ) : null}
    </div>
  );
}

/** Skeleton block helpers for async views. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-black/[0.06] bg-white p-5", className)}>
      <Skeleton className="h-4 w-2/3 rounded-md" />
      <Skeleton className="mt-3 h-3 w-full rounded-md" />
      <Skeleton className="mt-2 h-3 w-4/5 rounded-md" />
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-label="Loading content" role="status">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

/* ── Formatters ────────────────────────────────────────────── */

/** "155" → "2h 35m"; "45" → "45m"; 0 → "0m". */
export function formatMinutes(total: number): string {
  if (!total) return "0m";
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

/** 0 → "Free"; otherwise ₦ with thousands separators. */
export function formatPrice(ngn: number): string {
  if (!ngn) return "Free";
  return `₦${ngn.toLocaleString("en-NG")}`;
}

/** Compact relative time: "just now" · "5m ago" · "3h ago" · "2d ago" · "Jan 5". */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** "Ngozi Eze" → "NE"; fallback "?" when blank. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
