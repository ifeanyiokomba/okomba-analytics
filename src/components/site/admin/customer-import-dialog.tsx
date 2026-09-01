"use client";

import { useRef, useState } from "react";
import {
  Check,
  FileSpreadsheet,
  FileType2,
  Info,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { CustomerImportRow } from "./types";

/* ─────────────────────────────────────────────────────────────
   CustomerImportDialog — CSV/Excel upload with AI extraction.
   Flow:
     1. Admin picks a .csv or .xlsx file
     2. We POST it to /api/admin/customers/import which parses the
        rows, sends them to the z-ai-web-dev-sdk LLM to map arbitrary
        columns onto our canonical Customer shape, and returns the
        extracted rows as JSON
     3. Admin reviews the preview, can edit any field inline
        (delete rows they don't want, fix names, etc.)
     4. Admin clicks "Import N customers" → fires POST /api/admin/
        customers per row (upsert-safe by email)
   This is the "AI affix all in their necessary required position"
   the founder asked for: the AI reads whatever column names the
   file has (could be "Client Full Name", "EmailAddress", "Mobile",
   "WhatsApp #", etc.) and slots each into the right field.
   ───────────────────────────────────────────────────────────── */

export function CustomerImportDialog({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"pick" | "parsing" | "review" | "committing" | "done">("pick");
  const [rows, setRows] = useState<CustomerImportRow[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setPhase("parsing");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/customers/import", {
        method: "POST",
        body: fd,
      });
      const j = (await res.json()) as {
        ok: boolean;
        rows: CustomerImportRow[];
        detectedColumns: string[];
        usedFallback?: boolean;
        error?: string;
      };
      if (!res.ok || !j.ok) throw new Error(j.error ?? "Parse failed");
      setRows(j.rows);
      setDetectedColumns(j.detectedColumns ?? []);
      setUsedFallback(!!j.usedFallback);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setPhase("pick");
    }
  };

  const updateRow = (idx: number, patch: Partial<CustomerImportRow>) => {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeRow = (idx: number) => {
    setRows((rs) => rs.filter((_, i) => i !== idx));
  };

  const commit = async () => {
    setPhase("committing");
    setError(null);
    let okCount = 0;
    let failCount = 0;
    for (const r of rows) {
      try {
        const res = await fetch("/api/admin/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(r),
        });
        if (res.ok) okCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }
    setImportedCount(okCount);
    setFailedCount(failCount);
    setPhase("done");
    onImported?.();
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Import customers from CSV or Excel"
      onClick={(e) => e.target === e.currentTarget && phase !== "committing" && onClose()}
    >
      <div className="section-dark relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float sm:rounded-3xl [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
        {/* Header */}
        <header className="relative shrink-0 border-b border-white/[0.07] p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/[0.1] blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-[9px] text-gold">CRM · Bulk import</p>
              <h2 className="mt-1.5 font-display text-[19px] font-bold text-foreground">
                Import customers from CSV / Excel
              </h2>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Upload a contact list — the AI reads your column names and slots each row into the right field.
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={phase === "committing"}
              aria-label="Close"
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {phase === "pick" && (
            <>
              {error && (
                <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-[12.5px] text-red-300">
                  {error}
                </div>
              )}
              <label
                htmlFor="csv-file"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) void handleFile(f);
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/[0.12] bg-white/[0.015] px-6 py-14 text-center transition-colors hover:border-gold/40 hover:bg-gold/[0.04]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold-dim text-gold">
                  <Upload size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[14.5px] font-semibold text-foreground">
                    Drop your CSV / Excel file here, or click to browse
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Supports .csv and .xlsx · up to 100 rows per import
                  </p>
                </div>
                <input
                  ref={inputRef}
                  id="csv-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                  }}
                />
              </label>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <FeatureCard
                  icon={Sparkles}
                  title="AI auto-maps columns"
                  body={`Whatever your file calls them — "Client Name", "EmailAddress", "Mobile #" — the LLM slots each into the right field.`}
                />
                <FeatureCard
                  icon={FileType2}
                  title="CSV + Excel"
                  body="Both .csv and .xlsx work out of the box. Up to 100 rows per import; larger lists can be split."
                />
                <FeatureCard
                  icon={Info}
                  title="Editable preview"
                  body="You review every row before anything is committed — fix names, drop junk, then import."
                />
              </div>
            </>
          )}

          {phase === "parsing" && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <Loader2 size={28} className="animate-spin text-gold" />
              <p className="text-[13.5px] text-muted-foreground">
                Parsing <span className="font-medium text-foreground">{fileName}</span> and asking the AI to map columns…
              </p>
              <p className="font-mono text-[10px] text-muted-foreground/70">
                this usually takes 5-15 seconds
              </p>
            </div>
          )}

          {phase === "review" && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gold/15 bg-gold/[0.05] px-4 py-3">
                <Sparkles size={15} className="text-gold" aria-hidden="true" />
                <p className="text-[12.5px] text-foreground">
                  AI extracted <span className="font-bold text-gold">{rows.length}</span> customer
                  {rows.length === 1 ? "" : "s"} from <span className="font-mono">{fileName}</span>
                </p>
                {usedFallback && (
                  <span className="rounded-full border border-amber-500/40 bg-amber-50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-700">
                    Fallback mapping — review carefully
                  </span>
                )}
              </div>

              {detectedColumns.length > 0 && (
                <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <p className="eyebrow mb-1.5 text-[9px] text-muted-foreground">
                    Detected columns ({detectedColumns.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedColumns.map((c) => (
                      <span
                        key={c}
                        className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
                <table className="w-full min-w-[820px] text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                      {["Name", "Email", "Phone", "WhatsApp", "Company", "Tags", "Score", ""].map((h) => (
                        <th key={h} className="px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-b border-white/[0.04] align-top">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={r.name}
                            onChange={(e) => updateRow(i, { name: e.target.value })}
                            className="w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[12px] text-foreground outline-none focus:border-gold/60"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="email"
                            value={r.email}
                            onChange={(e) => updateRow(i, { email: e.target.value })}
                            className="w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[12px] text-foreground outline-none focus:border-gold/60"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={r.phone ?? ""}
                            onChange={(e) => updateRow(i, { phone: e.target.value || null })}
                            className="w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[12px] text-foreground outline-none focus:border-gold/60"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={r.whatsapp ?? ""}
                            onChange={(e) => updateRow(i, { whatsapp: e.target.value || null })}
                            className="w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[12px] text-foreground outline-none focus:border-gold/60"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={r.company ?? ""}
                            onChange={(e) => updateRow(i, { company: e.target.value || null })}
                            className="w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[12px] text-foreground outline-none focus:border-gold/60"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {r.tags.length === 0 ? (
                              <span className="text-[10.5px] text-muted-foreground/60">—</span>
                            ) : (
                              r.tags.map((t) => (
                                <span
                                  key={t}
                                  className="rounded-md border border-teal/25 bg-teal-dim px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-wider text-teal"
                                >
                                  {t}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-gold">
                          {r.leadScore ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeRow(i)}
                            aria-label="Remove row"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.02] text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-300"
                          >
                            <Trash2 size={11} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {phase === "committing" && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <Loader2 size={28} className="animate-spin text-gold" />
              <p className="text-[13.5px] text-muted-foreground">
                Importing {rows.length} customer{rows.length === 1 ? "" : "s"}…
              </p>
              <p className="font-mono text-[10px] text-muted-foreground/70">
                upserting by email so duplicates are skipped
              </p>
            </div>
          )}

          {phase === "done" && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-teal/30 bg-teal-dim text-teal">
                <Check size={26} strokeWidth={2.6} aria-hidden="true" />
              </span>
              <p className="font-display text-[18px] font-bold text-foreground">
                Import complete
              </p>
              <p className="text-[13px] text-muted-foreground">
                {importedCount} customer{importedCount === 1 ? "" : "s"} imported
                {failedCount > 0 ? ` · ${failedCount} failed` : ""}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {phase === "review" && (
          <footer className="shrink-0 border-t border-white/[0.07] bg-white/[0.015] px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] text-muted-foreground/70">
                {rows.length} rows ready
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-white/[0.09] bg-white/[0.03] px-4 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={commit}
                  disabled={rows.length === 0}
                  className="btn-shine inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-light to-gold px-5 py-2 text-[12.5px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <FileSpreadsheet size={13} aria-hidden="true" />
                  Import {rows.length} customer{rows.length === 1 ? "" : "s"}
                </button>
              </div>
            </div>
          </footer>
        )}
        {phase === "done" && (
          <footer className="shrink-0 border-t border-white/[0.07] bg-white/[0.015] px-6 py-4">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="btn-shine inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-light to-gold px-5 py-2 text-[12.5px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5"
              >
                <Check size={13} aria-hidden="true" /> Done
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/25 bg-gold-dim text-gold">
        <Icon size={14} aria-hidden="true" />
      </span>
      <p className="mt-2.5 text-[12.5px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
