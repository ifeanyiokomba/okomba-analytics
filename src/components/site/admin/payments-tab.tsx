"use client";

/**
 * Payments tab (Phase-2 Module 7 — Paystack webhook money trail).
 *
 * • Webhook event log — every charge.success / transfer.success /
 *   rejected signature, with signature validity, linkage to the
 *   invoice, and the processing result (reminders stopped, thank-you
 *   sent, kickoff scheduled).
 * • Fire a SIGNED test charge.success for any unpaid invoice —
 *   runs through the exact production pipeline (signature verify →
 *   invoice paid → reminders stopped → AI thank-you + receipt PDF).
 * • Paid invoices + scheduled project kickoffs.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  FlaskConical,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Webhook,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDate,
  formatNaira,
  timeAgo,
  WEBHOOK_STATUS_STYLES,
  type Invoice,
  type KickoffEventRow,
  type PaidInvoiceRow,
  type WebhookLogRow,
} from "./types";

type PaymentsData = {
  logs: WebhookLogRow[];
  paidInvoices: PaidInvoiceRow[];
  kickoffEvents: KickoffEventRow[];
};

const FINAL_STATUSES = new Set(["processed", "failed", "ignored", "duplicate"]);

export function PaymentsTab({
  invoices,
  notify,
}: {
  invoices: Invoice[];
  notify: (text: string, type?: "ok" | "err") => void;
}) {
  const [data, setData] = useState<PaymentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string>("");
  const [firing, setFiring] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const unpaid = useMemo(
    () => invoices.filter((i) => ["sent", "pending", "overdue"].includes(i.status)),
    [invoices]
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/payments?limit=100");
      if (!res.ok) throw new Error("Failed to load");
      const j = (await res.json()) as { ok: boolean } & PaymentsData;
      if (j.ok) setData({ logs: j.logs ?? [], paidInvoices: j.paidInvoices ?? [], kickoffEvents: j.kickoffEvents ?? [] });
    } catch {
      /* keep previous data */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Refresh the log while any row is still processing (background
  // webhook work: AI thank-you + receipt PDF + sends)
  useEffect(() => {
    const pending = data?.logs.some((l) => !FINAL_STATUSES.has(l.status)) ?? false;
    if (!pending) return;
    const t = setInterval(() => void load(), 2500);
    return () => clearInterval(t);
  }, [data, load]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const fireTestWebhook = useCallback(async () => {
    if (!selectedInvoice || firing) return;
    setFiring(true);
    try {
      const res = await fetch("/api/admin/payments/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: selectedInvoice, event: "charge.success" }),
      });
      const j = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string; logId?: string; invoiceNumber?: string; outcome?: { status?: string; detail?: Record<string, unknown>; error?: string } }
        | null;
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? "Test webhook failed");

      const inv = unpaid.find((i) => i.id === selectedInvoice);
      notify(`Test charge.success fired for ${inv?.invoiceNumber ?? j.invoiceNumber} — processing…`, "ok");
      setSelectedInvoice("");

      // Poll until the background processing settles
      const started = Date.now();
      const targetLogId = j.logId;
      const poll = setInterval(async () => {
        await load();
        if (Date.now() - started > 60000 || !targetLogId) {
          clearInterval(poll);
          pollRef.current = null;
          setFiring(false);
          return;
        }
        const res2 = await fetch("/api/admin/payments?limit=10");
        if (!res2.ok) return;
        const j2 = (await res2.json()) as { ok: boolean; logs?: WebhookLogRow[] };
        const row = j2.logs?.find((l) => l.id === targetLogId);
        if (row && FINAL_STATUSES.has(row.status)) {
          clearInterval(poll);
          pollRef.current = null;
          setFiring(false);
          if (row.status === "processed") {
            notify(`${row.invoiceNumber} marked PAID — reminders stopped, thank-you + receipt sent`, "ok");
          } else {
            notify(`Webhook ended as "${row.status}"${row.error ? `: ${row.error}` : ""}`, "err");
          }
        }
      }, 2000);
      pollRef.current = poll;
    } catch (err) {
      notify(err instanceof Error ? err.message : "Test webhook failed", "err");
      setFiring(false);
    }
  }, [selectedInvoice, firing, unpaid, notify, load]);

  const processedPayments = data?.logs.filter(
    (l) => l.event === "charge.success" && l.status === "processed"
  );
  const revenueVerified = data?.paidInvoices.reduce((s, i) => s + Math.round(i.amountKobo / 100), 0) ?? 0;
  const failedCount = data?.logs.filter((l) => l.status === "failed").length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Webhook events", value: String(data?.logs.length ?? 0) },
          { label: "Payments confirmed", value: String(processedPayments?.length ?? 0), teal: true },
          { label: "Revenue verified", value: formatNaira(revenueVerified), gold: true },
          { label: "Failed events", value: String(failedCount), err: failedCount > 0 },
        ].map((cell) => (
          <div key={cell.label} className="surface-card px-4 py-3.5">
            <p className="eyebrow text-[8.5px] text-muted-foreground">{cell.label}</p>
            <p className={cn(
              "mt-1 font-mono text-[16px] font-semibold",
              cell.gold ? "text-gold" : cell.teal ? "text-teal" : cell.err ? "text-red-300" : "text-foreground"
            )}>
              {cell.value}
            </p>
          </div>
        ))}
      </div>

      {/* Test webhook console */}
      <div className="surface-card px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim text-gold">
              <FlaskConical size={15} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[14.5px] font-semibold text-foreground">Test the payment pipeline</h2>
              <p className="mt-0.5 max-w-lg text-[12px] leading-relaxed text-muted-foreground">
                Fires a <span className="font-mono text-gold">charge.success</span> webhook signed with the real
                secret for an unpaid invoice — flips it to <span className="text-teal">paid</span>, stops reminders,
                sends the AI thank-you email + WhatsApp with the receipt PDF, and schedules the 24h kickoff.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="test-invoice" className="sr-only">Choose an unpaid invoice</label>
            <select
              id="test-invoice"
              value={selectedInvoice}
              onChange={(e) => setSelectedInvoice(e.target.value)}
              disabled={firing || unpaid.length === 0}
              className="rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] text-foreground outline-none transition-colors focus:border-gold/60 disabled:opacity-50"
            >
              <option value="">{unpaid.length ? "Choose unpaid invoice…" : "No unpaid invoices"}</option>
              {unpaid.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.invoiceNumber} · {i.customerName} · {formatNaira(i.amountNaira)}
                </option>
              ))}
            </select>
            <button
              onClick={() => void fireTestWebhook()}
              disabled={!selectedInvoice || firing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-[12.5px] font-semibold text-[#141926] transition-all hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              {firing ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Zap size={14} aria-hidden="true" />}
              {firing ? "Processing…" : "Fire test webhook"}
            </button>
          </div>
        </div>
      </div>

      {/* Webhook log */}
      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
          <h2 className="text-[14.5px] font-semibold text-foreground">
            Paystack webhook log{" "}
            <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
              ({data?.logs.length ?? 0})
            </span>
          </h2>
          <button
            onClick={() => void load()}
            aria-label="Refresh webhook log"
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
          >
            <RefreshCw size={13} aria-hidden="true" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Webhook size={22} className="animate-pulse text-gold" aria-label="Loading webhook log" />
          </div>
        ) : !data || data.logs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Webhook size={28} className="text-muted-foreground/40" aria-hidden="true" />
            <p className="max-w-md text-[13px] text-muted-foreground">
              No webhook events yet. Point Paystack at{" "}
              <code className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[11px] text-gold">/api/paystack/webhook</code>{" "}
              or fire a test event above.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {data.logs.map((l) => {
              const isOpen = expanded === l.id;
              let detail: Record<string, unknown> = {};
              if (l.result && typeof l.result === "object" && !Array.isArray(l.result)) {
                detail = l.result as Record<string, unknown>;
              }
              const isCharge = l.event === "charge.success";
              const Icon = isCharge ? CreditCard : l.event === "transfer.success" ? Webhook : l.event === "signature.rejected" ? ShieldX : Ban;
              return (
                <li key={l.id} className="transition-colors hover:bg-white/[0.025]">
                  <button
                    onClick={() => setExpanded(isOpen ? null : l.id)}
                    aria-expanded={isOpen}
                    className="flex w-full flex-col gap-2 px-6 py-4 text-left sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                        l.status === "processed"
                          ? "border-teal/25 bg-teal-dim text-teal"
                          : l.status === "failed"
                            ? "border-red-500/25 bg-red-500/10 text-red-300"
                            : "border-white/[0.08] bg-white/[0.03] text-muted-foreground"
                      )}>
                        <Icon size={14} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11.5px] font-semibold text-foreground">{l.event}</span>
                          <span className={cn(
                            "rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                            WEBHOOK_STATUS_STYLES[l.status] ?? WEBHOOK_STATUS_STYLES.ignored
                          )}>
                            {l.status}
                          </span>
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                            l.signatureValid
                              ? "border-teal/30 bg-teal-dim text-teal"
                              : "border-red-500/30 bg-red-500/10 text-red-300"
                          )}>
                            {l.signatureValid ? <ShieldCheck size={9} aria-hidden="true" /> : <ShieldX size={9} aria-hidden="true" />}
                            {l.signatureValid ? "sig ok" : "bad sig"}
                          </span>
                          {l.source === "admin-test" && (
                            <span className="rounded-full border border-purple-400/35 bg-purple-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-purple-300">
                              test
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 truncate text-[12.5px] text-muted-foreground">
                          {l.invoiceNumber ? (
                            <span className="font-medium text-foreground">{l.invoiceNumber}</span>
                          ) : null}
                          {l.amountKobo ? ` · ${formatNaira(Math.round(l.amountKobo / 100))}` : ""}
                          {l.reference ? ` · ref ${l.reference}` : ""}
                          {l.status === "processed" && typeof detail.remindersStopped === "number" && (
                            <span className="text-teal"> · {detail.remindersStopped} reminders stopped</span>
                          )}
                        </p>
                        {l.status === "failed" && l.error && (
                          <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-red-300">
                            <AlertTriangle size={11} aria-hidden="true" /> {l.error}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-2 font-mono text-[10px] text-muted-foreground/70">
                      {timeAgo(l.receivedAt)}
                      <ChevronDown size={13} className={cn("transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/[0.05] bg-black/20 px-6 py-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="eyebrow text-[8.5px] text-muted-foreground">Result</p>
                          <pre className="mt-1.5 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-white/[0.06] bg-black/30 p-3 font-mono text-[10.5px] leading-relaxed text-muted-foreground [scrollbar-width:thin]">
{JSON.stringify(detail, null, 2)}
                          </pre>
                        </div>
                        <div className="flex flex-col gap-2 text-[11.5px] text-muted-foreground">
                          <p><span className="text-foreground">Received:</span> {formatDate(l.receivedAt, { withYear: true, withTime: true })}</p>
                          {l.processedAt && <p><span className="text-foreground">Processed:</span> {formatDate(l.processedAt, { withYear: true, withTime: true })}</p>}
                          {l.paystackId && <p><span className="text-foreground">Paystack event id:</span> {l.paystackId}</p>}
                          {l.invoiceId && <p><span className="text-foreground">Invoice id:</span> {l.invoiceId}</p>}
                          {l.error && <p className="text-red-300"><span className="text-foreground">Error:</span> {l.error}</p>}
                          <p><span className="text-foreground">Signature verified:</span> {l.signatureValid ? "yes (HMAC-SHA512)" : "no"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Paid invoices + kickoffs */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="surface-card overflow-hidden">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <h3 className="text-[13.5px] font-semibold text-foreground">Paid invoices</h3>
          </div>
          {!data || data.paidInvoices.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 py-10 text-center">
              <CheckCircle2 size={24} className="text-muted-foreground/40" aria-hidden="true" />
              <p className="text-[12.5px] text-muted-foreground">No payments confirmed yet.</p>
            </div>
          ) : (
            <ul className="max-h-72 divide-y divide-white/[0.04] overflow-y-auto [scrollbar-width:thin]">
              {data.paidInvoices.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium text-foreground">{i.invoiceNumber} · {i.customerName}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{i.service}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-[12.5px] font-semibold text-teal">{formatNaira(Math.round(i.amountKobo / 100))}</p>
                    <p className="font-mono text-[10px] text-muted-foreground/70">{formatDate(i.paidAt, { withYear: true })}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface-card overflow-hidden">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <h3 className="text-[13.5px] font-semibold text-foreground">Project kickoffs (24h after payment)</h3>
          </div>
          {!data || data.kickoffEvents.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 py-10 text-center">
              <Zap size={24} className="text-muted-foreground/40" aria-hidden="true" />
              <p className="text-[12.5px] text-muted-foreground">Scheduled automatically when an invoice is paid.</p>
            </div>
          ) : (
            <ul className="max-h-72 divide-y divide-white/[0.04] overflow-y-auto [scrollbar-width:thin]">
              {data.kickoffEvents.map((k) => {
                let p: { invoiceNumber?: string; customerName?: string; service?: string } = {};
                if (k.payload && typeof k.payload === "object" && !Array.isArray(k.payload)) {
                  p = k.payload as typeof p;
                }
                return (
                  <li key={k.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-foreground">
                        {p.customerName ?? k.customerEmail ?? "Customer"} · {p.invoiceNumber ?? ""}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">{p.service ?? "Kickoff"}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[10.5px] text-gold">{formatDate(k.eventDate, { withYear: true, withTime: true })}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
