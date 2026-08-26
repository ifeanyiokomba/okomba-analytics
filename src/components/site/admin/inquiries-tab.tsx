"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  ExternalLink,
  FileSignature,
  Inbox,
  Loader2,
  Search,
  SearchX,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportInquiriesCsv } from "@/lib/csv-export";
import { SERVICES, type Service } from "@/lib/content";
import {
  INQUIRY_STATUSES,
  INQUIRY_STATUS_STYLES,
  type Inquiry,
} from "./types";

const PAGE_SIZE = 10;

/* Inquiries tab — preserved table behavior, just moved into a tab.
   Receives loaded inquiries + handles its own filtering, sorting,
   pagination and status PATCH. The dialog openers are passed in so
   the parent stays the source of truth for open dialogs. */
export function InquiriesTab({
  inquiries,
  loading,
  error,
  onUpdateStatus,
  updatingId,
  onOpenInquiry,
  onOpenService,
  onClearFilters,
  onCreateProposal,
}: {
  inquiries: Inquiry[];
  loading: boolean;
  error: string | null;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  updatingId: string | null;
  onOpenInquiry: (i: Inquiry) => void;
  onOpenService: (svc: Service) => void;
  onClearFilters?: () => void;
  onCreateProposal: (i: Inquiry) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [budgetFilter, setBudgetFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<"createdAt" | "name" | "service">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Reset to first page when filters change — derived state, not an effect.
  // Each setter wraps setPage(1) so the page resets whenever a filter moves.
  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const toggleSort = (key: "createdAt" | "name" | "service") => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
    }
    setPage(1);
  };

  const filteredInquiries = useMemo(() => {
    return inquiries
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
  }, [inquiries, search, statusFilter, budgetFilter, sortKey, sortDir]);

  const totalPages = Math.max(Math.ceil(filteredInquiries.length / PAGE_SIZE), 1);
  const safePage = Math.min(page, totalPages);
  const paginatedInquiries = filteredInquiries.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const exportable = filteredInquiries.map((i) => ({
    name: i.name,
    email: i.email,
    phone: i.phone ?? null,
    whatsapp: i.whatsapp ?? null,
    service: i.service,
    addlService: i.addlService ?? null,
    budget: i.budget ?? null,
    message: i.message,
    status: i.status,
    createdAt: i.createdAt,
  }));

  return (
    <div className="surface-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 border-b border-white/[0.06] px-6 py-5 md:flex-row md:items-center md:justify-between">
        <h2 className="text-[14.5px] font-semibold text-foreground">
          All inquiries{" "}
          <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
            ({filteredInquiries.length}
            {filteredInquiries.length !== inquiries.length ? ` of ${inquiries.length}` : ""})
          </span>
        </h2>

        <button
          onClick={() => exportInquiriesCsv(exportable)}
          disabled={filteredInquiries.length === 0}
          aria-label="Export visible inquiries as CSV"
          title="Export visible inquiries as CSV"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:pointer-events-none disabled:opacity-40"
        >
          <Download size={13} aria-hidden="true" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>

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
              onChange={(e) => resetPage(setSearch)(e.target.value)}
              placeholder="Search name, email, service…"
              aria-label="Search inquiries"
              className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-2.5 pl-9 pr-3.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 sm:w-64"
            />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
            {["all", ...INQUIRY_STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => resetPage(setStatusFilter)(s)}
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

        {Array.from(new Set(inquiries.map((i) => i.budget).filter(Boolean))).length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">Budget</span>
            {["all", "none", ...Array.from(new Set(inquiries.map((i) => i.budget).filter((b): b is string => !!b)))].map(
              (b) => (
                <button
                  key={b}
                  onClick={() => resetPage(setBudgetFilter)(b)}
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
              )
            )}
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gold" aria-label="Loading inquiries" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox size={30} className="text-muted-foreground/40" aria-hidden="true" />
          <p className="text-[13.5px] text-muted-foreground">
            No inquiries yet — they&apos;ll appear here the moment someone submits the form.
          </p>
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
              onClearFilters?.();
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
                  { label: "Proposal", key: null },
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
                        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {h.label}
                        </span>
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
                      onClick={() => onOpenInquiry(i)}
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
                    {i.source === "ai_chat" && (
                      <span
                        title="Lead captured by the AI Service Finder widget"
                        className="mt-1 inline-flex items-center gap-1 rounded-full border border-purple-400/35 bg-purple-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-purple-300"
                      >
                        <Sparkles size={9} aria-hidden="true" /> AI chat
                      </span>
                    )}
                    {i.whatsapp && <p className="text-[11px] text-muted-foreground/70">WA: {i.whatsapp}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        const svc = SERVICES.find((s) => s.title === i.service);
                        if (svc) onOpenService(svc);
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
                      onChange={(e) => onUpdateStatus(i.id, e.target.value)}
                      aria-label={`Status for ${i.name}`}
                      className={cn(
                        "cursor-pointer appearance-none rounded-full border px-3.5 py-1.5 text-[11px] font-semibold outline-none transition-colors",
                        INQUIRY_STATUS_STYLES[i.status] ?? INQUIRY_STATUS_STYLES.new
                      )}
                    >
                      {INQUIRY_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-[#0b101c] text-foreground">
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onCreateProposal(i)}
                      title={`Create proposal for ${i.name}`}
                      aria-label={`Create proposal for ${i.name}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold-dim px-3 py-1.5 text-[11px] font-semibold text-gold transition-colors hover:bg-gold/20"
                    >
                      <FileSignature size={12} aria-hidden="true" />
                      <span className="hidden xl:inline">Propose</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
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
  );
}
