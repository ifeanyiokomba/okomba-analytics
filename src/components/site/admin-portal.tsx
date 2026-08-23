"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  Clock3,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OkombaNavLogo } from "./logo";

/* ─────────────────────────────────────────────────────────────
   Admin portal — preserves the original /#/admin workflow.
   Login → dashboard with inquiry stats + requests (now DB-backed).
   ───────────────────────────────────────────────────────────── */

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  service: string;
  addlService?: string | null;
  message: string;
  status: string;
  createdAt: string;
};

type Stats = {
  total: number;
  new: number;
  contacted: number;
  in_progress: number;
  closed: number;
  last7Days: number;
  subscribers: number;
  byService: { service: string; count: number }[];
};

const STATUSES = ["new", "contacted", "in_progress", "closed"] as const;

const STATUS_STYLES: Record<string, string> = {
  new: "border-gold/35 bg-gold-dim text-gold",
  contacted: "border-[#5b9eff]/35 bg-[#5b9eff]/10 text-[#5b9eff]",
  in_progress: "border-purple-400/35 bg-purple-400/10 text-purple-300",
  closed: "border-teal/35 bg-teal-dim text-teal",
};

export function AdminPortal({ onExit }: { onExit: () => void }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/inquiries?stats=1");
        setLoggedIn(res.ok);
      } catch {
        setLoggedIn(false);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 size={28} className="animate-spin text-gold" aria-label="Checking session" />
      </div>
    );
  }

  return loggedIn ? (
    <AdminDashboard onLogout={() => setLoggedIn(false)} onExit={onExit} />
  ) : (
    <AdminLogin onLogin={() => setLoggedIn(true)} onExit={onExit} />
  );
}

/* ── Login ─────────────────────────────────────────────────── */
function AdminLogin({ onLogin, onExit }: { onLogin: () => void; onExit: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Invalid credentials");
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5">
      <div className="bg-grid mask-fade-y pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[560px] -translate-x-1/2 rounded-full bg-gold/[0.08] blur-[110px]" aria-hidden="true" />

      <div className="relative w-full max-w-sm">
        <button
          onClick={onExit}
          className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} aria-hidden="true" /> Back to website
        </button>

        <div className="surface-card p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold-dim text-gold">
            <Lock size={20} aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-[21px] font-bold text-foreground">Admin portal</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Sign in to view inquiries and dashboard statistics.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@okomba.com"
                  className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-3 pl-10 pr-4 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
                />
              </div>
            </div>
            <div>
              <label htmlFor="admin-pass" className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
                <input
                  id="admin-pass"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-3 pl-10 pr-4 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/[0.08] px-3.5 py-2.5 text-[12.5px] text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-shine inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 py-3.5 text-[14px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Lock size={14} aria-hidden="true" />}
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] text-muted-foreground/60">
          Okomba Analytics · Internal use only
        </p>
      </div>
    </div>
  );
}

/* ── Dashboard ─────────────────────────────────────────────── */
function AdminDashboard({ onLogout, onExit }: { onLogout: () => void; onExit: () => void }) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetch("/api/inquiries"),
        fetch("/api/inquiries?stats=1"),
      ]);
      if (!listRes.ok || !statsRes.ok) throw new Error("Failed to load data — session may have expired");
      const list = await listRes.json();
      const s = await statsRes.json();
      setInquiries(list.inquiries ?? []);
      setStats(s.stats ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Update failed");
      await load(); // refresh stats + list from server (single source of truth)
    } catch {
      setError("Could not update status. Please refresh.");
    } finally {
      setUpdatingId(null);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    onLogout();
  };

  const statCards = stats
    ? [
        { label: "Total inquiries", value: stats.total, icon: Inbox, accent: "text-gold", bg: "border-gold/25 bg-gold-dim" },
        { label: "New", value: stats.new, icon: CircleDot, accent: "text-gold", bg: "border-gold/25 bg-gold-dim" },
        { label: "Contacted", value: stats.contacted, icon: Mail, accent: "text-[#5b9eff]", bg: "border-[#5b9eff]/25 bg-[#5b9eff]/10" },
        { label: "In progress", value: stats.in_progress, icon: Clock3, accent: "text-purple-300", bg: "border-purple-400/25 bg-purple-400/10" },
        { label: "Closed", value: stats.closed, icon: CheckCircle2, accent: "text-teal", bg: "border-teal/25 bg-teal-dim" },
        { label: "Last 7 days", value: stats.last7Days, icon: TrendingUp, accent: "text-gold-light", bg: "border-gold-light/25 bg-gold-light/10" },
        { label: "Subscribers", value: stats.subscribers, icon: Users, accent: "text-teal", bg: "border-teal/25 bg-teal-dim" },
      ]
    : [];

  const maxServiceCount = stats?.byService?.[0]?.count ?? 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Admin header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#05070d]/88 backdrop-blur-xl">
        <div className="container-xl flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <OkombaNavLogo />
            <span className="hidden rounded-full border border-gold/30 bg-gold-dim px-3 py-1 font-mono text-[10px] text-gold sm:inline-block">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              <RefreshCw size={13} aria-hidden="true" /> Refresh
            </button>
            <button
              onClick={onExit}
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={13} aria-hidden="true" /> Site
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/[0.08] px-3.5 py-2 text-[12.5px] font-medium text-red-300 transition-colors hover:bg-red-500/15"
            >
              <LogOut size={13} aria-hidden="true" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container-xl py-10">
        <h1 className="font-display text-2xl font-bold text-foreground">Inquiry dashboard</h1>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Live service requests submitted through the website.
        </p>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-300">
            {error}
          </p>
        )}

        {/* Stat cards */}
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {statCards.map((c) => (
            <div key={c.label} className="surface-card p-5">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${c.bg} ${c.accent}`}>
                <c.icon size={16} aria-hidden="true" />
              </span>
              <p className="mt-3.5 font-display text-[26px] font-bold leading-none text-foreground">{c.value}</p>
              <p className="mt-1.5 text-[11.5px] font-medium text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Top services */}
        {stats && stats.byService.length > 0 && (
          <div className="surface-card mt-4 p-6">
            <h2 className="text-[14.5px] font-semibold text-foreground">Most requested services</h2>
            <div className="mt-5 space-y-3.5">
              {stats.byService.slice(0, 6).map((s) => (
                <div key={s.service} className="flex items-center gap-4">
                  <span className="w-40 shrink-0 truncate text-[12.5px] text-muted-foreground md:w-56">{s.service}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-light to-gold transition-[width] duration-700"
                      style={{ width: `${Math.max((s.count / maxServiceCount) * 100, 4)}%` }}
                    />
                  </div>
                  <span className="w-7 shrink-0 text-right font-mono text-[12px] font-semibold text-gold">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inquiries table */}
        <div className="surface-card mt-4 overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
            <h2 className="text-[14.5px] font-semibold text-foreground">
              All inquiries <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">({inquiries.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-gold" aria-label="Loading inquiries" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Inbox size={30} className="text-muted-foreground/40" aria-hidden="true" />
              <p className="text-[13.5px] text-muted-foreground">No inquiries yet — they&apos;ll appear here the moment someone submits the form.</p>
            </div>
          ) : (
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    {["Client", "Service", "Message", "Received", "Status"].map((h) => (
                      <th key={h} className="px-6 py-3.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((i) => (
                    <tr key={i.id} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <p className="text-[13.5px] font-semibold text-foreground">{i.name}</p>
                        <p className="mt-0.5 text-[11.5px] text-muted-foreground">{i.email}</p>
                        {i.whatsapp && <p className="text-[11px] text-muted-foreground/70">WA: {i.whatsapp}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="max-w-[180px] text-[12.5px] text-foreground/90">{i.service}</p>
                        {i.addlService && <p className="mt-0.5 max-w-[180px] text-[11px] text-muted-foreground">+ {i.addlService}</p>}
                      </td>
                      <td className="max-w-[260px] px-6 py-4">
                        <p className="line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">{i.message}</p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-[11.5px] text-muted-foreground">
                        {new Date(i.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        <span className="block text-muted-foreground/60">
                          {new Date(i.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={i.status}
                          disabled={updatingId === i.id}
                          onChange={(e) => updateStatus(i.id, e.target.value)}
                          aria-label={`Status for ${i.name}`}
                          className={cn(
                            "cursor-pointer appearance-none rounded-full border px-3.5 py-1.5 text-[11px] font-semibold outline-none transition-colors",
                            STATUS_STYLES[i.status] ?? STATUS_STYLES.new
                          )}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-[#0b101c] text-foreground">
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
