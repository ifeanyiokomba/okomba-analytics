"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  SearchX,
  Sparkles,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CUSTOMER_STATUSES,
  CUSTOMER_STATUS_STYLES,
  timeAgo,
  type Customer,
} from "./types";
import { CustomerDetailDialog } from "./customer-detail-dialog";
import { CustomerImportDialog } from "./customer-import-dialog";

/* ─────────────────────────────────────────────────────────────
   CustomersTab — the CRM customer book.
   Header: search box + status filter pills + "Add customer" +
   "Import CSV/Excel" buttons.
   Table: each row is a customer — name, email, company, status,
   lead-score, last-contact, interaction counts, and a "View" button.
   Clicking any row opens CustomerDetailDialog with the full timeline.
   Mobile-first: table → card grid on small screens.
   ───────────────────────────────────────────────────────────── */

type CustomersListResponse = {
  ok: boolean;
  customers: Customer[];
  total: number;
  statusBreakdown: Record<string, number>;
};

export function CustomersTab() {
  const [data, setData] = useState<CustomersListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [detailId, setDetailId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Debounce search so we don't spam the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/customers?${params}`);
      if (!res.ok) throw new Error("Failed to load customers");
      const j = (await res.json()) as CustomersListResponse;
      setData(j);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  // Filter to active statuses (exclude blocked) for the pill row
  const visibleStatuses = CUSTOMER_STATUSES.filter((s) => s !== "blocked");
  const breakdown = data?.statusBreakdown ?? {};

  return (
    <div className="flex flex-col gap-5">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCell label="Total customers" value={String(data?.total ?? "—")} icon={Users} />
        <SummaryCell
          label="Paying"
          value={String(breakdown.paying ?? 0)}
          tone="text-teal"
        />
        <SummaryCell
          label="Pipeline"
          value={String(
            (breakdown.lead ?? 0) + (breakdown.qualified ?? 0) + (breakdown.proposal_sent ?? 0)
          )}
          tone="text-gold"
        />
        <SummaryCell
          label="Churned"
          value={String(breakdown.churned ?? 0)}
          tone="text-red-300"
        />
      </div>

      <div className="surface-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 md:px-6 md:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[14.5px] font-semibold text-foreground">
              All customers{" "}
              <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
                ({data?.customers.length ?? 0}
                {data && data.customers.length !== data.total ? ` of ${data.total}` : ""})
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setImportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gold/30 bg-gold-dim px-3.5 py-2 text-[12px] font-semibold text-gold transition-colors hover:bg-gold/20"
              >
                <Upload size={13} aria-hidden="true" />
                <span className="hidden sm:inline">Import CSV / Excel</span>
                <span className="sm:hidden">Import</span>
              </button>
              <a
                href="/api/admin/customers?limit=200"
                target="_blank"
                rel="noreferrer"
                aria-label="Export customers JSON"
                title="Export customers as JSON"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
              >
                <Download size={13} aria-hidden="true" />
                <span className="hidden sm:inline">Export</span>
              </a>
              <button
                onClick={() => {
                  /* Quick manual add — open the import dialog in pick mode
                     then they can paste a single row, or just go to the
                     detail dialog of an existing customer to edit. */
                  setImportOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gold-light to-gold px-3.5 py-2 text-[12px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5"
              >
                <UserPlus size={13} aria-hidden="true" />
                <span className="hidden sm:inline">Add customer</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
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
                placeholder="Search name, email, company, phone…"
                aria-label="Search customers"
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-2.5 pl-9 pr-3.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 sm:w-72"
              />
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
              <FilterPill
                label="All"
                count={data?.total ?? 0}
                active={statusFilter === "all"}
                onClick={() => setStatusFilter("all")}
              />
              {visibleStatuses.map((s) => (
                <FilterPill
                  key={s}
                  label={s.replace("_", " ")}
                  count={breakdown[s] ?? 0}
                  active={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gold" aria-label="Loading customers" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-[13px] text-red-300">{error}</p>
            <button
              onClick={() => void load()}
              className="rounded-lg border border-gold/30 bg-gold-dim px-3.5 py-1.5 text-[12px] font-medium text-gold transition-colors hover:bg-gold/20"
            >
              Retry
            </button>
          </div>
        ) : !data || data.customers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Users size={30} className="text-muted-foreground/40" aria-hidden="true" />
            <p className="max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
              No customers yet. Add one manually, or import a CSV/Excel file — the AI will map the
              columns to the right fields automatically.
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setImportOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-gold-dim px-4 py-2.5 text-[12.5px] font-semibold text-gold transition-colors hover:bg-gold/20"
              >
                <Upload size={14} aria-hidden="true" /> Import CSV / Excel
              </button>
              <button
                onClick={() => setImportOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-4 py-2.5 text-[12.5px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5"
              >
                <Plus size={14} aria-hidden="true" /> Add customer
              </button>
            </div>
          </div>
        ) : debouncedSearch && data.customers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <SearchX size={26} className="text-muted-foreground/40" aria-hidden="true" />
            <p className="text-[13.5px] text-muted-foreground">No customers match your search.</p>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="rounded-lg border border-gold/30 bg-gold-dim px-3.5 py-1.5 text-[12px] font-medium text-gold transition-colors hover:bg-gold/20"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {["Customer", "Company", "Stage", "Score", "Interactions", "Last contact", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.customers.map((c) => (
                  <CustomerRow key={c.id} c={c} onOpen={() => setDetailId(c.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer detail dialog */}
      {detailId && (
        <CustomerDetailDialog
          customerId={detailId}
          onClose={() => setDetailId(null)}
          onSaved={() => void load()}
        />
      )}

      {/* Import dialog */}
      {importOpen && (
        <CustomerImportDialog
          onClose={() => setImportOpen(false)}
          onImported={() => void load()}
        />
      )}
    </div>
  );
}

function CustomerRow({ c, onOpen }: { c: Customer; onOpen: () => void }) {
  return (
    <tr className="group/row border-b border-white/[0.04] transition-colors hover:bg-white/[0.025]">
      <td className="px-5 py-4">
        <button
          onClick={onOpen}
          className="inline-flex items-center gap-2.5 text-left"
          title="Open CRM detail"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-light to-gold font-display text-[12px] font-bold text-ink">
            {c.name.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-foreground transition-colors group-hover/row:text-gold">
              <span className="truncate">{c.name}</span>
              <ExternalLink
                size={11}
                className="shrink-0 text-gold/0 transition-colors group-hover/row:text-gold/70"
                aria-hidden="true"
              />
            </span>
            <span className="block truncate text-[11.5px] text-muted-foreground">{c.email}</span>
          </span>
        </button>
        {c.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 pl-[44px]">
            {c.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-md border border-teal/20 bg-teal-dim px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-wider text-teal"
              >
                {t}
              </span>
            ))}
            {c.tags.length > 3 && (
              <span className="font-mono text-[8.5px] text-muted-foreground/70">
                +{c.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </td>
      <td className="max-w-[160px] px-5 py-4">
        <span className="truncate text-[12.5px] text-foreground/90" title={c.company ?? ""}>
          {c.company ?? <span className="text-muted-foreground/60">—</span>}
        </span>
        {c.role && (
          <span className="block truncate text-[11px] text-muted-foreground">{c.role}</span>
        )}
      </td>
      <td className="px-5 py-4">
        <span
          className={cn(
            "inline-block rounded-full border px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider",
            CUSTOMER_STATUS_STYLES[c.status] ?? CUSTOMER_STATUS_STYLES.lead
          )}
        >
          {c.status.replace("_", " ")}
        </span>
      </td>
      <td className="px-5 py-4">
        {c.leadScore != null ? (
          <span
            className={cn(
              "inline-flex h-7 min-w-[34px] items-center justify-center rounded-md border px-2 font-mono text-[11px] font-bold",
              c.leadScore >= 70
                ? "border-teal/30 bg-teal-dim text-teal"
                : c.leadScore >= 40
                  ? "border-gold/35 bg-gold-dim text-gold"
                  : "border-white/[0.1] bg-white/[0.03] text-muted-foreground"
            )}
            title="AI lead score (0–100)"
          >
            {c.leadScore}
          </span>
        ) : (
          <span className="font-mono text-[10px] text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap items-center gap-1">
          {c.stats.inquiries > 0 && (
            <StatChip tone="gold" label={`${c.stats.inquiries} inq`} />
          )}
          {c.stats.invoices > 0 && (
            <StatChip tone="teal" label={`${c.stats.invoices} inv`} />
          )}
          {c.stats.emails > 0 && (
            <StatChip tone="blue" label={`${c.stats.emails} em`} />
          )}
          {c.stats.whatsapp > 0 && (
            <StatChip tone="green" label={`${c.stats.whatsapp} wa`} />
          )}
          {c.stats.notes > 0 && (
            <StatChip tone="purple" label={`${c.stats.notes} nt`} />
          )}
          {c.stats.inquiries === 0 &&
            c.stats.invoices === 0 &&
            c.stats.emails === 0 &&
            c.stats.whatsapp === 0 &&
            c.stats.notes === 0 && (
              <span className="font-mono text-[10px] text-muted-foreground/50">no activity</span>
            )}
        </div>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-[11.5px] text-muted-foreground">
        {c.lastContactAt ? (
          <>
            {timeAgo(c.lastContactAt)}
            <span className="block text-[10px] text-muted-foreground/60">
              {c.source}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground/60">never</span>
        )}
      </td>
      <td className="px-5 py-4">
        <button
          onClick={onOpen}
          title="Open CRM detail"
          aria-label={`Open CRM detail for ${c.name}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold-dim px-3 py-1.5 text-[11px] font-semibold text-gold transition-colors hover:bg-gold/20"
        >
          <Sparkles size={11} aria-hidden="true" />
          <span className="hidden xl:inline">Open</span>
        </button>
      </td>
    </tr>
  );
}

function SummaryCell({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone?: string;
  icon?: typeof Users;
}) {
  return (
    <div className="surface-card px-4 py-3.5">
      <div className="flex items-center justify-between">
        <p className="eyebrow text-[8.5px] text-muted-foreground">{label}</p>
        {Icon ? <Icon size={13} className="text-gold" aria-hidden="true" /> : null}
      </div>
      <p className={cn("mt-1 truncate font-mono text-[15px] font-semibold", tone ?? "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10.5px] font-medium capitalize transition-colors",
        active
          ? "border-gold/50 bg-gold-dim text-gold"
          : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground"
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 font-mono text-[9px] leading-none",
          active ? "bg-gold/20 text-gold" : "bg-black/[0.06] text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function StatChip({
  tone,
  label,
}: {
  tone: "gold" | "teal" | "blue" | "green" | "purple";
  label: string;
}) {
  const tones: Record<string, string> = {
    gold: "border-gold/25 bg-gold-dim text-gold",
    teal: "border-teal/25 bg-teal-dim text-teal",
    blue: "border-[#5b9eff]/25 bg-[#5b9eff]/10 text-[#5b9eff]",
    green: "border-[#1E8C5E]/25 bg-[#1E8C5E]/10 text-[#1E8C5E]",
    purple: "border-purple-400/25 bg-purple-400/10 text-purple-300",
  };
  return (
    <span
      className={cn(
        "inline-block rounded-md border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider",
        tones[tone]
      )}
    >
      {label}
    </span>
  );
}
