"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDot,
  Clock3,
  Download,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  Search,
  SearchX,
  TrendingUp,
  User,
  Users,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportInquiriesCsv, exportSubscribersCsv } from "@/lib/csv-export";
import { SERVICES, type Service } from "@/lib/content";
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
  budget?: string | null;
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
  byBudget: { budget: string; count: number }[];
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
type Subscriber = {
  id: string;
  email: string;
  status: string;
  confirmedAt: string | null;
  createdAt: string;
};

function AdminDashboard({ onLogout, onExit }: { onLogout: () => void; onExit: () => void }) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [detailService, setDetailService] = useState<Service | null>(null);
  const [detailInquiry, setDetailInquiry] = useState<Inquiry | null>(null);

  // table controls
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [budgetFilter, setBudgetFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<"createdAt" | "name" | "service">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const PAGE_SIZE = 10;

  const toggleSort = (key: "createdAt" | "name" | "service") => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
    }
  };

  const load = useCallback(async () => {
    setError(null);
    try {
      const [listRes, statsRes, subsRes] = await Promise.all([
        fetch("/api/inquiries"),
        fetch("/api/inquiries?stats=1"),
        fetch("/api/subscribers"),
      ]);
      if (!listRes.ok || !statsRes.ok) throw new Error("Failed to load data — session may have expired");
      const list = await listRes.json();
      const s = await statsRes.json();
      setInquiries(list.inquiries ?? []);
      setStats(s.stats ?? null);
      // subscribers is non-fatal — only admins with valid session get it
      if (subsRes.ok) {
        const subs = await subsRes.json();
        setSubscribers(subs.subscribers ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, budgetFilter, sortKey, sortDir]);

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
  const maxBudgetCount = stats?.byBudget?.[0]?.count ?? 1;

  // Filtered inquiries for the table (client-side search + status + budget filters)
  const filteredInquiries = inquiries
    .filter((i) => {
      const matchesStatus = statusFilter === "all" || i.status === statusFilter;
      const matchesBudget =
        budgetFilter === "all" ||
        (budgetFilter === "none" ? !i.budget : i.budget === budgetFilter);
      if (!matchesStatus || !matchesBudget) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        i.name.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        i.service.toLowerCase().includes(q) ||
        (i.phone ?? "").toLowerCase().includes(q) ||
        (i.whatsapp ?? "").toLowerCase().includes(q) ||
        i.message.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "service") cmp = a.service.localeCompare(b.service);
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

  // Pagination slice
  const totalPages = Math.max(Math.ceil(filteredInquiries.length / PAGE_SIZE), 1);
  const safePage = Math.min(page, totalPages);
  const paginatedInquiries = filteredInquiries.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={load}
              aria-label="Refresh data"
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.03] px-2.5 py-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold sm:px-3.5"
            >
              <RefreshCw size={13} aria-hidden="true" /> <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onExit}
              aria-label="Back to website"
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.03] px-2.5 py-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3.5"
            >
              <ArrowLeft size={13} aria-hidden="true" /> <span className="hidden sm:inline">Site</span>
            </button>
            <button
              onClick={logout}
              aria-label="Log out"
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/[0.08] px-2.5 py-2 text-[12.5px] font-medium text-red-300 transition-colors hover:bg-red-500/15 sm:px-3.5"
            >
              <LogOut size={13} aria-hidden="true" /> <span className="hidden sm:inline">Logout</span>
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

        {/* Budget distribution */}
        {stats && stats.byBudget.length > 0 && (
          <div className="surface-card mt-4 p-6">
            <h2 className="text-[14.5px] font-semibold text-foreground">Budget distribution</h2>
            <p className="mt-1 text-[11.5px] text-muted-foreground">From inquiries that shared a budget range</p>
            <div className="mt-5 space-y-3.5">
              {stats.byBudget.map((b) => (
                <div key={b.budget} className="flex items-center gap-4">
                  <span className="w-40 shrink-0 truncate text-[12.5px] text-muted-foreground md:w-56">{b.budget}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal to-[#00e0c0] transition-[width] duration-700"
                      style={{ width: `${Math.max((b.count / maxBudgetCount) * 100, 4)}%` }}
                    />
                  </div>
                  <span className="w-7 shrink-0 text-right font-mono text-[12px] font-semibold text-teal">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inquiries table */}
        <div className="surface-card mt-4 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] px-6 py-5 md:flex-row md:items-center md:justify-between">
            <h2 className="text-[14.5px] font-semibold text-foreground">
              All inquiries{" "}
              <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
                ({filteredInquiries.length}{filteredInquiries.length !== inquiries.length ? ` of ${inquiries.length}` : ""})
              </span>
            </h2>

            <button
              onClick={() => exportInquiriesCsv(filteredInquiries)}
              disabled={filteredInquiries.length === 0}
              aria-label="Export visible inquiries as CSV"
              title="Export visible inquiries as CSV"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:pointer-events-none disabled:opacity-40"
            >
              <Download size={13} aria-hidden="true" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Search + status filter controls */}
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
                  placeholder="Search name, email, service…"
                  aria-label="Search inquiries"
                  className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-2.5 pl-9 pr-3.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 sm:w-64"
                />
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
                {["all", ...STATUSES].map((s) => (
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
                    {s === "all" ? "All" : s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget filter chips (derived from data) */}
            {Array.from(new Set(inquiries.map((i) => i.budget).filter(Boolean))).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">Budget</span>
                {["all", "none", ...Array.from(new Set(inquiries.map((i) => i.budget).filter((b): b is string => !!b)))].map((b) => (
                  <button
                    key={b}
                    onClick={() => setBudgetFilter(b)}
                    aria-pressed={budgetFilter === b}
                    className={cn(
                      "rounded-full border px-3 py-1.5 font-mono text-[10.5px] font-medium transition-colors",
                      budgetFilter === b
                        ? "border-teal/50 bg-teal-dim text-teal"
                        : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground"
                    )}
                  >
                    {b === "all" ? "All" : b === "none" ? "No budget" : b}
                  </button>
                ))}
              </div>
            )}
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
          ) : filteredInquiries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <SearchX size={26} className="text-muted-foreground/40" aria-hidden="true" />
              <p className="text-[13.5px] text-muted-foreground">No inquiries match your search or filter.</p>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setBudgetFilter("all");
                }}
                className="rounded-lg border border-gold/30 bg-gold-dim px-3.5 py-1.5 text-[12px] font-medium text-gold transition-colors hover:bg-gold/20"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    {([
                      { label: "Client", key: "name" as const },
                      { label: "Service", key: "service" as const },
                      { label: "Message", key: null },
                      { label: "Received", key: "createdAt" as const },
                      { label: "Status", key: null },
                    ] as const).map((h) => {
                      const isSortable = h.key !== null;
                      const isActive = isSortable && sortKey === h.key;
                      return (
                        <th key={h.label} className="px-6 py-3.5 text-left">
                          {isSortable ? (
                            <button
                              onClick={() => toggleSort(h.key!)}
                              aria-label={`Sort by ${h.label}`}
                              className={cn(
                                "inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider transition-colors",
                                isActive ? "text-gold" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {h.label}
                              {isActive ? (
                                sortDir === "asc" ? (
                                  <ChevronUp size={12} aria-hidden="true" />
                                ) : (
                                  <ChevronDown size={12} aria-hidden="true" />
                                )
                              ) : (
                                <ArrowUpDown size={11} className="opacity-40" aria-hidden="true" />
                              )}
                            </button>
                          ) : (
                            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">{h.label}</span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {paginatedInquiries.map((i) => (
                    <tr key={i.id} className="group/row border-b border-white/[0.04] transition-colors hover:bg-white/[0.025]">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setDetailInquiry(i)}
                          title="View inquiry details"
                          className="inline-flex max-w-[200px] items-center gap-1.5 text-left text-[13.5px] font-semibold text-foreground transition-colors hover:text-gold"
                        >
                          <span className="truncate">{i.name}</span>
                          <ExternalLink
                            size={11}
                            className="shrink-0 text-gold/0 transition-colors group-hover/row:text-gold/70"
                            aria-hidden="true"
                          />
                        </button>
                        <p className="mt-0.5 text-[11.5px] text-muted-foreground">{i.email}</p>
                        {i.whatsapp && <p className="text-[11px] text-muted-foreground/70">WA: {i.whatsapp}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            const svc = SERVICES.find((s) => s.title === i.service) ?? null;
                            setDetailService(svc);
                          }}
                          disabled={!SERVICES.some((s) => s.title === i.service)}
                          title={SERVICES.some((s) => s.title === i.service) ? `View ${i.service} details` : undefined}
                          className="max-w-[180px] text-left text-[12.5px] text-foreground/90 transition-colors hover:text-gold disabled:cursor-default disabled:hover:text-foreground/90"
                        >
                          {i.service}
                        </button>
                        {i.addlService && <p className="mt-0.5 max-w-[180px] text-[11px] text-muted-foreground">+ {i.addlService}</p>}
                        {i.budget && (
                          <span className="mt-1.5 inline-block rounded-md bg-gold/10 px-2 py-0.5 font-mono text-[10px] font-medium text-gold">
                            {i.budget}
                          </span>
                        )}
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

          {/* Pagination controls */}
          {filteredInquiries.length > PAGE_SIZE && (
            <nav
              aria-label="Inquiry pagination"
              className="flex items-center justify-between gap-4 border-t border-white/[0.06] px-6 py-4"
            >
              <p className="font-mono text-[11px] text-muted-foreground">
                Page {safePage} of {totalPages} · {filteredInquiries.length} inquiries
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={safePage === 1}
                  aria-label="Previous page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.03] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:pointer-events-none disabled:opacity-35"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                  .slice(Math.max(safePage - 2, 0), Math.max(safePage - 2, 0) + 5)
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      aria-current={p === safePage ? "page" : undefined}
                      className={cn(
                        "h-8 min-w-8 rounded-lg border px-2 font-mono text-[11.5px] transition-colors",
                        p === safePage
                          ? "border-gold/50 bg-gold-dim font-semibold text-gold"
                          : "border-white/[0.09] bg-white/[0.03] text-muted-foreground hover:border-white/25 hover:text-foreground"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={safePage === totalPages}
                  aria-label="Next page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.03] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:pointer-events-none disabled:opacity-35"
                >
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
            </nav>
          )}
        </div>
        {/* Subscribers panel */}
        <div className="surface-card mt-4 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-6 py-5">
            <h2 className="flex items-center gap-2.5 text-[14.5px] font-semibold text-foreground">
              <Users size={16} className="text-teal" aria-hidden="true" />
              Newsletter subscribers
              <span className="ml-1 font-mono text-[11px] font-normal text-muted-foreground">({subscribers.length})</span>
            </h2>
            <button
              onClick={() => exportSubscribersCsv(subscribers)}
              disabled={subscribers.length === 0}
              aria-label="Export subscribers as CSV"
              title="Export subscribers as CSV"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-teal/40 hover:text-teal disabled:pointer-events-none disabled:opacity-40"
            >
              <Download size={13} aria-hidden="true" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-teal" aria-label="Loading subscribers" />
            </div>
          ) : subscribers.length === 0 ? (
            <p className="px-6 py-10 text-center text-[13px] text-muted-foreground">
              No subscribers yet — newsletter signups from the website will appear here.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto px-6 py-4">
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {subscribers.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <a
                        href={`mailto:${s.email}`}
                        className="truncate text-[12.5px] font-medium text-foreground transition-colors hover:text-gold"
                      >
                        {s.email}
                      </a>
                      <span
                        title={
                          s.status === "confirmed"
                            ? "Confirmed subscriber"
                            : s.status === "unsubscribed"
                              ? "Unsubscribed"
                              : "Awaiting confirmation"
                        }
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold",
                          s.status === "confirmed"
                            ? "bg-teal/15 text-teal"
                            : s.status === "unsubscribed"
                              ? "bg-red-500/15 text-red-400"
                              : "bg-gold/15 text-gold/80"
                        )}
                      >
                        {s.status === "confirmed" ? "CONFIRMED" : s.status === "unsubscribed" ? "UNSUBSCRIBED" : "PENDING"}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">
                      {new Date(s.confirmedAt ?? s.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      {/* Service drilldown dialog */}
      <ServiceDetailDialog service={detailService} onClose={() => setDetailService(null)} />

      {/* Inquiry detail dialog */}
      <InquiryDetailDialog
        inquiry={detailInquiry}
        onClose={() => setDetailInquiry(null)}
        onOpenService={(svc) => {
          setDetailInquiry(null);
          setDetailService(svc);
        }}
      />
    </div>
  );
}

/* ── Service detail drilldown ─────────────────────────────── */
function ServiceDetailDialog({ service, onClose }: { service: Service | null; onClose: () => void }) {
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

/* ── Inquiry detail dialog ────────────────────────────────── */
function InquiryDetailDialog({
  inquiry,
  onClose,
  onOpenService,
}: {
  inquiry: Inquiry | null;
  onClose: () => void;
  onOpenService: (svc: Service) => void;
}) {
  useEffect(() => {
    if (!inquiry) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [inquiry, onClose]);

  if (!inquiry) return null;

  const matchedService = SERVICES.find((s) => s.title === inquiry.service) ?? null;
  const mailto = `mailto:${inquiry.email}?subject=${encodeURIComponent(
    `Re: your ${inquiry.service} inquiry — Okomba Analytics`
  )}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Inquiry from ${inquiry.name}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <article className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float sm:rounded-3xl [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
        {/* Header */}
        <header className="relative border-b border-white/[0.06] p-6 md:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gold/[0.09] blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <span
                className={cn(
                  "inline-block rounded-full border px-3 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider",
                  STATUS_STYLES[inquiry.status] ?? STATUS_STYLES.new
                )}
              >
                {inquiry.status.replace("_", " ")}
              </span>
              <h2 className="mt-3 font-display text-[22px] font-bold text-foreground">{inquiry.name}</h2>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                {new Date(inquiry.createdAt).toLocaleString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close inquiry details"
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-7 md:px-8" style={{ display: "grid", gap: "1.15rem" }}>
          {/* Contact grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: "Email", value: inquiry.email, href: mailto },
              { label: "Phone", value: inquiry.phone },
              { label: "WhatsApp", value: inquiry.whatsapp },
              { label: "Budget", value: inquiry.budget },
            ]
              .filter((f) => f.value)
              .map((f) => (
                <div key={f.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
                  <p className="eyebrow text-[9px] text-muted-foreground">{f.label}</p>
                  {f.href ? (
                    <a href={f.href} className="mt-1.5 block truncate text-[13px] font-medium text-foreground transition-colors hover:text-gold">
                      {f.value}
                    </a>
                  ) : (
                    <p className="mt-1.5 truncate text-[13px] font-medium text-foreground">{f.value}</p>
                  )}
                </div>
              ))}
          </div>

          {/* Services */}
          <div className="rounded-xl border border-gold/15 bg-gold/[0.05] p-4.5 px-5 py-4">
            <p className="eyebrow mb-2 text-[9px] text-gold">Requested services</p>
            <div className="flex flex-wrap items-center gap-2">
              {matchedService ? (
                <button
                  onClick={() => onOpenService(matchedService)}
                  className="rounded-lg border border-gold/30 bg-gold-dim px-3 py-1.5 text-[12px] font-medium text-gold transition-colors hover:bg-gold/20"
                >
                  {inquiry.service} →
                </button>
              ) : (
                <span className="text-[12.5px] text-foreground">{inquiry.service}</span>
              )}
              {inquiry.addlService && (
                <span className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-[11.5px] text-muted-foreground">
                  + {inquiry.addlService}
                </span>
              )}
            </div>
          </div>

          {/* Full message */}
          <div>
            <p className="eyebrow mb-2 text-[9px] text-muted-foreground">Message</p>
            <p className="whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-white/[0.02] p-4.5 p-5 text-[13.5px] leading-relaxed text-foreground/90">
              {inquiry.message}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <footer className="flex flex-col gap-2.5 border-t border-white/[0.06] bg-white/[0.015] px-6 py-5 sm:flex-row md:px-8">
          <a
            href={mailto}
            className="btn-shine inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-3 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5"
          >
            <Mail size={14} aria-hidden="true" />
            Reply by email
          </a>
          {inquiry.whatsapp && (
            <a
              href={`https://wa.me/${inquiry.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-teal/30 bg-teal-dim px-5 py-3 text-[13px] font-medium text-teal transition-colors hover:bg-teal/15"
            >
              Reply on WhatsApp
            </a>
          )}
        </footer>
      </article>
    </div>
  );
}
