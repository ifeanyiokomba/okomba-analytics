"use client";

import { useMemo, useState } from "react";
import {
  BellRing,
  Check,
  Download,
  ExternalLink,
  FileSignature,
  Link2,
  Loader2,
  ReceiptText,
  Search,
  SearchX,
  Sparkles,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INVOICE_STATUSES,
  INVOICE_STATUS_STYLES,
  formatDate,
  formatNaira,
  timeAgo,
  type DraftProposalRow,
  type Invoice,
} from "./types";

/* Proposals tab — AI-chat draft proposals (Module 7), every sent
   proposal/invoice with PDF access, plus the Module-5 reminder
   engine trigger. */

export function InvoicesTab({
  invoices,
  loading,
  onCreateFromInquiries,
  onRunReminders,
  runningReminders,
  drafts = [],
  onOpenDraft,
  onDiscardDraft,
}: {
  invoices: Invoice[];
  loading: boolean;
  onCreateFromInquiries: () => void;
  onRunReminders?: () => void;
  runningReminders?: boolean;
  drafts?: DraftProposalRow[];
  onOpenDraft?: (draft: DraftProposalRow) => void;
  onDiscardDraft?: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // Module 8A — per-row portal-token fetch + copy feedback
  const [portalLoadingId, setPortalLoadingId] = useState<string | null>(null);
  const [portalCopiedId, setPortalCopiedId] = useState<string | null>(null);

  const portalAppPath = (token: string) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/#/portal/${token}`;

  const ensureAndCopyPortal = async (inv: Invoice) => {
    setPortalLoadingId(inv.id);
    try {
      const res = await fetch(`/api/admin/invoices/${inv.id}/portal-token`, {
        method: "POST",
      });
      const j = (await res.json().catch(() => null)) as { token?: string } | null;
      if (!res.ok || !j?.token) throw new Error("token failed");
      const url = portalAppPath(j.token);
      await navigator.clipboard.writeText(url).catch(() => {});
      setPortalCopiedId(inv.id);
      setTimeout(() => setPortalCopiedId((id) => (id === inv.id ? null : id)), 1800);
    } catch {
      setPortalCopiedId(null);
    } finally {
      setPortalLoadingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (!q) return true;
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerEmail.toLowerCase().includes(q) ||
        inv.service.toLowerCase().includes(q)
      );
    });
  }, [invoices, search, statusFilter]);

  const activeStatuses = useMemo(
    () => INVOICE_STATUSES.filter((s) => invoices.some((i) => i.status === s)),
    [invoices]
  );

  const totalValue = filtered.reduce((sum, i) => sum + i.amountNaira, 0);
  const paidValue = filtered.filter((i) => i.status === "paid").reduce((s, i) => s + i.amountNaira, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Proposals sent", value: String(invoices.length) },
          { label: "Pipeline value", value: formatNaira(totalValue), gold: true },
          { label: "Paid", value: formatNaira(paidValue), teal: true },
          {
            label: "Awaiting payment",
            value: String(invoices.filter((i) => ["sent", "pending", "overdue"].includes(i.status)).length),
          },
        ].map((cell) => (
          <div key={cell.label} className="surface-card px-4 py-3.5">
            <p className="eyebrow text-[8.5px] text-muted-foreground">{cell.label}</p>
            <p
              className={cn(
                "mt-1 truncate font-mono text-[15px] font-semibold",
                cell.gold ? "text-gold" : cell.teal ? "text-teal" : "text-foreground"
              )}
            >
              {cell.value}
            </p>
          </div>
        ))}
      </div>

      {/* AI chat draft proposals (Module 7) */}
      {drafts.length > 0 && (
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <h2 className="flex items-center gap-2 text-[14.5px] font-semibold text-foreground">
              <Sparkles size={15} className="text-gold" aria-hidden="true" />
              AI chat drafts{" "}
              <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
                ready to review &amp; send ({drafts.length})
              </span>
            </h2>
          </div>
          <ul className="divide-y divide-white/[0.04]">
            {drafts.map((d) => (
              <li
                key={d.id}
                className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim text-gold">
                    <Sparkles size={14} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[13px] font-medium text-foreground">{d.customerName}</p>
                      {d.leadScore != null && (
                        <span
                          title="AI lead score"
                          className={cn(
                            "rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                            d.leadScore >= 7
                              ? "border-teal/30 bg-teal-dim text-teal"
                              : d.leadScore >= 4
                                ? "border-gold/35 bg-gold-dim text-gold"
                                : "border-white/15 bg-white/[0.04] text-muted-foreground"
                          )}
                        >
                          lead {d.leadScore}/10
                        </span>
                      )}
                      {d.status === "sent" && (
                        <span className="rounded-full border border-teal/30 bg-teal-dim px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-teal">
                          sent
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                      {d.customerEmail} · {d.service} · captured {timeAgo(d.createdAt)}
                    </p>
                  </div>
                </div>
                {d.status !== "sent" && d.status !== "discarded" && (
                  <div className="flex shrink-0 items-center gap-2">
                    {onDiscardDraft && (
                      <button
                        onClick={() => onDiscardDraft(d.id)}
                        aria-label={`Discard draft for ${d.customerName}`}
                        title="Discard draft"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.03] text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-300"
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    )}
                    {onOpenDraft && (
                      <button
                        onClick={() => onOpenDraft(d)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-[12px] font-semibold text-[#141926] transition-colors hover:bg-gold-light"
                      >
                        <FileSignature size={13} aria-hidden="true" /> Review &amp; send
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="surface-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-white/[0.06] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <h2 className="text-[14.5px] font-semibold text-foreground">
            Proposals &amp; invoices{" "}
            <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
              ({filtered.length}
              {filtered.length !== invoices.length ? ` of ${invoices.length}` : ""})
            </span>
          </h2>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {onRunReminders && (
              <button
                onClick={onRunReminders}
                disabled={runningReminders}
                title="Run the payment-reminder scan now (also runs daily at 09:00 WAT)"
                className="inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold-dim px-4 py-2.5 text-[12px] font-semibold text-gold transition-colors hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {runningReminders ? (
                  <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                ) : (
                  <BellRing size={13} aria-hidden="true" />
                )}
                Run reminders
              </button>
            )}
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
                placeholder="Search invoice, client…"
                aria-label="Search invoices"
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-2.5 pl-9 pr-3.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 sm:w-60"
              />
            </div>
            {activeStatuses.length > 0 && (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
                {["all", ...activeStatuses].map((s) => (
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
                    {s === "all" ? "All" : s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gold" aria-label="Loading invoices" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <ReceiptText size={30} className="text-muted-foreground/40" aria-hidden="true" />
            <p className="max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
              No proposals sent yet. Open an inquiry and use{" "}
              <span className="font-medium text-gold">Create proposal</span> to draft one with AI
              and send it as a branded PDF.
            </p>
            <button
              onClick={onCreateFromInquiries}
              className="mt-1 inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-gold-dim px-4 py-2.5 text-[12.5px] font-semibold text-gold transition-colors hover:bg-gold/20"
            >
              <FileSignature size={14} aria-hidden="true" /> Go to inquiries
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <SearchX size={26} className="text-muted-foreground/40" aria-hidden="true" />
            <p className="text-[13.5px] text-muted-foreground">No invoices match your search.</p>
          </div>
        ) : (
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {["Invoice", "Client", "Service", "Amount", "Due", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.025]">
                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="font-mono text-[12.5px] font-semibold text-foreground">{inv.invoiceNumber}</p>
                      <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                        {inv.sentAt ? `sent ${formatDate(inv.sentAt, { withYear: true })}` : "not sent"}
                      </p>
                    </td>
                    <td className="max-w-[180px] px-6 py-4">
                      <p className="truncate text-[13px] font-medium text-foreground">{inv.customerName}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{inv.customerEmail}</p>
                      {inv.dvaAccountNumber && (
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70" title="Paystack DVA">
                          DVA {inv.dvaAccountNumber}
                          {inv.dvaSandbox ? " · sandbox" : ""}
                        </p>
                      )}
                    </td>
                    <td className="max-w-[170px] px-6 py-4">
                      <p className="truncate text-[12.5px] text-foreground/90">{inv.service}</p>
                      {inv.durationLabel && (
                        <p className="text-[11px] text-muted-foreground">{inv.durationLabel}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="font-mono text-[13px] font-semibold text-gold">{formatNaira(inv.amountNaira)}</p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-[11.5px] text-muted-foreground">
                      {inv.dueDate ? formatDate(inv.dueDate, { withYear: true }) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-block rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
                          INVOICE_STATUS_STYLES[inv.status] ?? INVOICE_STATUS_STYLES.sent
                        )}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {/* Module 8A — client portal link (ensure token + copy hash route) */}
                        <button
                          onClick={() => ensureAndCopyPortal(inv)}
                          disabled={portalLoadingId === inv.id}
                          aria-label={`Copy client portal link for ${inv.invoiceNumber}`}
                          title="Copy client portal link"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.03] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
                        >
                          {portalLoadingId === inv.id ? (
                            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                          ) : portalCopiedId === inv.id ? (
                            <Check size={13} className="text-teal" aria-hidden="true" />
                          ) : (
                            <Link2 size={13} aria-hidden="true" />
                          )}
                        </button>
                        <a
                          href={`/api/admin/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View PDF for ${inv.invoiceNumber}`}
                          title="View branded PDF"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.03] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                        >
                          <ExternalLink size={13} aria-hidden="true" />
                        </a>
                        <a
                          href={`/api/admin/invoices/${inv.id}/pdf?download=1`}
                          aria-label={`Download PDF for ${inv.invoiceNumber}`}
                          title="Download branded PDF"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.03] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                        >
                          <Download size={13} aria-hidden="true" />
                        </a>
                      </div>
                      {portalCopiedId === inv.id && (
                        <p className="mt-1 truncate font-mono text-[9.5px] text-teal" title="Portal link copied">
                          portal link copied
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
