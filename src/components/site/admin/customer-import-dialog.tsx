"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CloudDownload,
  FileSpreadsheet,
  Info,
  Link2,
  Loader2,
  RefreshCw,
  Sparkles,
  Table2,
  Upload,
  X,
  XCircle,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   CustomerImportDialog — Master Platform Evolution Directive
   §16/§17/§18 + founder requirement:
   "import large data … from google drive, sheets, etc …
    regardless of what format, location".

   SOURCES (pick step):
     • Device upload — CSV/TSV/XLSX/XLS/PDF/DOCX/TXT/JSON
     • Any https URL (SSRF-guarded server-side)
     • Google Sheets link (public/link-shared → CSV export)
     • Google Drive file link (direct download)

   PIPELINE (job-based, background §17):
     create → fetch → extract → AI map (chunks) → validate →
     PREVIEW (admin approval gate §16) → chunked import →
     completed (+ retry failed chunks §17).
   ───────────────────────────────────────────────────────────── */

type JobStatus =
  | "created"
  | "fetching"
  | "extracting"
  | "mapping"
  | "awaiting_approval"
  | "importing"
  | "completed"
  | "failed"
  | "cancelled";

type PreviewRow = {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  countryCode: string | null;
  company: string | null;
  role: string | null;
  notes: string | null;
  tags: string[];
  status: string;
  leadScore: number | null;
};

type JobState = {
  id: string;
  source: string;
  sourceUrl: string | null;
  fileName: string;
  format: string;
  status: JobStatus;
  stage: string | null;
  error: string | null;
  recordsFound: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  importedCount: number;
  existingCount: number;
  failedCount: number;
  totalChunks: number;
  chunkStates: string[];
  usedFallback: boolean;
};

type SourceTab = "upload" | "url" | "google_sheets" | "google_drive";

const ACTIVE_POLL_MS = 1200;

const SOURCE_TABS: { key: SourceTab; label: string; icon: typeof Upload; hint: string }[] = [
  { key: "upload", label: "Upload", icon: Upload, hint: "From your device — any format" },
  { key: "url", label: "Web link", icon: Link2, hint: "Any https:// file URL" },
  { key: "google_sheets", label: "Google Sheets", icon: Table2, hint: "Shared sheet → auto CSV" },
  { key: "google_drive", label: "Google Drive", icon: CloudDownload, hint: "Shared Drive file" },
];

export function CustomerImportDialog({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"pick" | "working" | "review" | "importing" | "done">("pick");
  const [tab, setTab] = useState<SourceTab>("upload");
  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobState | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Escape closes (§14) — never while a background job is mid-flight
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "working" && phase !== "importing") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  /* ── Poll the job until it needs admin attention ─────────── */
  const pollJob = useCallback(
    (id: string) => {
      stopPolling();
      const tick = async () => {
        try {
          const res = await fetch(`/api/admin/customers/import-v2?id=${encodeURIComponent(id)}`);
          const j = (await res.json()) as {
            ok: boolean;
            job: JobState;
            previewRows: PreviewRow[];
            previewTruncated: boolean;
            totalRows: number;
            error?: string;
          };
          if (!res.ok || !j.ok) return; // transient — keep polling
          setJob(j.job);
          if (j.job.status === "awaiting_approval") {
            setPreview(j.previewRows ?? []);
            setTotalRows(j.totalRows ?? 0);
            setPhase("review");
            stopPolling();
          } else if (j.job.status === "completed") {
            setPhase("done");
            stopPolling();
            if (!notifiedRef.current) {
              notifiedRef.current = true;
              onImported?.();
            }
          } else if (j.job.status === "failed" || j.job.status === "cancelled") {
            setError(j.job.error ?? `Import was ${j.job.status}`);
            stopPolling();
            setPhase("pick");
          }
          // importing/extracting/mapping/fetching/created → keep polling
        } catch {
          /* transient network error — keep polling */
        }
      };
      void tick();
      pollRef.current = setInterval(tick, ACTIVE_POLL_MS);
    },
    [stopPolling, onImported]
  );

  /* ── Start a job (upload or remote source) ────────────────── */
  const startJob = async (init: { file?: File; source?: SourceTab; url?: string }) => {
    setBusy(true);
    setError(null);
    notifiedRef.current = false;
    try {
      let res: Response;
      if (init.file) {
        const fd = new FormData();
        fd.append("file", init.file);
        res = await fetch("/api/admin/customers/import-v2", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/admin/customers/import-v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: init.source, url: init.url }),
        });
      }
      const j = (await res.json()) as { ok: boolean; jobId?: string; error?: string };
      if (!res.ok || !j.ok || !j.jobId) {
        throw new Error(j.error ?? "Could not start the import");
      }
      setJobId(j.jobId);
      setPhase("working");
      pollJob(j.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setPhase("pick");
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (file: File) => void startJob({ file });

  const submitUrl = () => {
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      setError("Paste a link starting with https://");
      return;
    }
    void startJob({ source: tab, url: trimmed });
  };

  /* ── Approve the preview (§16 gate) ───────────────────────── */
  const approve = async () => {
    if (!jobId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/customers/import-v2/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const j = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !j.ok) throw new Error(j.error ?? "Approve failed");
      setPhase("importing");
      pollJob(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  };

  /* ── Cancel a previewed job ────────────────────────────────── */
  const cancelJob = async () => {
    if (!jobId) return onClose();
    setBusy(true);
    try {
      await fetch("/api/admin/customers/import-v2/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
    } catch {
      /* best-effort */
    }
    setBusy(false);
    stopPolling();
    onClose();
  };

  /* ── Retry failed chunks (§17) ─────────────────────────────── */
  const retryFailed = async () => {
    if (!jobId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/customers/import-v2/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const j = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !j.ok) throw new Error(j.error ?? "Retry failed");
      setError(null);
      pollJob(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setBusy(false);
    }
  };

  const working = phase === "working" || phase === "importing";
  const importDone = (job?.importedCount ?? 0) + (job?.existingCount ?? 0);
  const importTotal = totalRows || job?.validCount || 0;
  const progressPct =
    phase === "importing" && importTotal > 0
      ? Math.min(100, Math.round((importDone / importTotal) * 100))
      : 0;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Import customers"
      onClick={(e) => e.target === e.currentTarget && !working && onClose()}
    >
      <div className="section-dark relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float sm:rounded-3xl [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
        {/* Header */}
        <header className="relative shrink-0 border-b border-white/[0.07] p-6">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/[0.1] blur-2xl"
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-[9px] text-gold">CRM · Bulk import</p>
              <h2 className="mt-1.5 font-display text-[19px] font-bold text-foreground">
                Import customers
              </h2>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Any format — CSV, Excel, PDF, Word, JSON, text · any source — device, link,
                Google Sheets or Drive · up to 50,000 records with AI field mapping.
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={working}
              aria-label="Close import dialog"
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-[12.5px] text-red-300"
            >
              <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1: pick source ─────────────────────────── */}
          {phase === "pick" && (
            <div>
              {/* Source tabs */}
              <div role="tablist" aria-label="Import source" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SOURCE_TABS.map((t) => {
                  const Icon = t.icon;
                  const active = tab === t.key;
                  return (
                    <button
                      key={t.key}
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setTab(t.key);
                        setError(null);
                      }}
                      className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition-all ${
                        active
                          ? "border-gold/50 bg-gold-dim shadow-gold/20"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-gold/30 hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon
                        size={19}
                        className={active ? "text-gold" : "text-muted-foreground"}
                        aria-hidden="true"
                      />
                      <span
                        className={`text-[12.5px] font-semibold ${active ? "text-gold" : "text-foreground"}`}
                      >
                        {t.label}
                      </span>
                      <span className="text-[10.5px] leading-tight text-muted-foreground">{t.hint}</span>
                    </button>
                  );
                })}
              </div>

              {/* Upload tab */}
              {tab === "upload" && (
                <label
                  htmlFor="import-file"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFile(f);
                  }}
                  className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/[0.12] bg-white/[0.015] px-6 py-14 text-center transition-colors hover:border-gold/40 hover:bg-gold/[0.04]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold-dim text-gold">
                    <Upload size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[14.5px] font-semibold text-foreground">
                      Drop your file here, or click to browse
                    </p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      .csv · .tsv · .xlsx · .xls · .pdf · .docx · .txt · .json — up to 50 MB / 50,000 rows
                    </p>
                  </div>
                  <input
                    ref={inputRef}
                    id="import-file"
                    type="file"
                    accept=".csv,.tsv,.xlsx,.xls,.pdf,.docx,.txt,.json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </label>
              )}

              {/* URL / Sheets / Drive tabs */}
              {tab !== "upload" && (
                <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                  <p className="text-[13px] font-semibold text-foreground">
                    {tab === "url" && "Paste the direct file link"}
                    {tab === "google_sheets" && "Paste the Google Sheets link"}
                    {tab === "google_drive" && "Paste the Google Drive file link"}
                  </p>
                  <p className="mt-1 text-[11.5px] text-muted-foreground">
                    {tab === "url" &&
                      "e.g. https://example.com/contacts.csv — any public http(s) file. The server downloads it safely (private/internal addresses are blocked)."}
                    {tab === "google_sheets" &&
                      "Share the sheet with “Anyone with the link” (Viewer) first — we read it as CSV automatically."}
                    {tab === "google_drive" &&
                      "Share the file with “Anyone with the link” first — we download it directly, any format."}
                  </p>
                  <div className="mt-3.5 flex flex-col gap-2.5 sm:flex-row">
                    <input
                      type="url"
                      inputMode="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitUrl()}
                      placeholder={
                        tab === "google_sheets"
                          ? "https://docs.google.com/spreadsheets/d/…"
                          : tab === "google_drive"
                            ? "https://drive.google.com/file/d/…"
                            : "https://example.com/customers.csv"
                      }
                      aria-label="Source link"
                      className="flex-1 rounded-xl border border-white/[0.1] bg-[#0d1322] px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
                    />
                    <button
                      onClick={submitUrl}
                      disabled={busy || !url.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-3 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {busy ? (
                        <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                      ) : (
                        <ArrowRight size={15} aria-hidden="true" />
                      )}
                      Fetch &amp; import
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <FeatureCard
                  icon={Sparkles}
                  title="AI auto-maps fields"
                  body="Recognizes First Name / Given Name / Surname / Mobile / WhatsApp variants and maps them to the right fields — plus country → ISO code."
                />
                <FeatureCard
                  icon={FileSpreadsheet}
                  title="Any format"
                  body="Spreadsheets parse directly; PDFs, Word docs and text files are read by the AI document extractor."
                />
                <FeatureCard
                  icon={CheckCircle2}
                  title="Preview before import"
                  body="Nothing touches your CRM until you review the extraction and click approve. Existing customers are updated, never duplicated."
                />
              </div>
            </div>
          )}

          {/* ── STEP 2: working (extraction/mapping) ─────────── */}
          {phase === "working" && (
            <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
              <span className="relative flex h-16 w-16 items-center justify-center">
                <span
                  className="absolute inset-0 rounded-full border-2 border-gold/20 border-t-gold [animation:spin_1.1s_linear_infinite]"
                  aria-hidden="true"
                />
                <Loader2 size={22} className="text-gold" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-[16px] font-bold text-foreground">
                  {job?.stage ?? "Preparing import…"}
                </p>
                <p className="mt-1.5 text-[12px] text-muted-foreground">
                  {job?.status === "fetching" && "Downloading the source file…"}
                  {job?.status === "extracting" && "Parsing rows from your file…"}
                  {(!job || job.status === "created" || job.status === "mapping") &&
                    "AI is reading and mapping your records — large files are processed in chunks."}
                  {job?.status === "awaiting_approval" && "Almost ready…"}
                </p>
              </div>
              {job && job.recordsFound > 0 && (
                <p className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-[11.5px] text-muted-foreground">
                  {job.recordsFound.toLocaleString()} raw records found so far
                </p>
              )}
            </div>
          )}

          {/* ── STEP 3: review / approval gate (§16) ──────────── */}
          {phase === "review" && job && (
            <div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <StatChip
                  icon={FileSpreadsheet}
                  label="Records found"
                  value={job.recordsFound.toLocaleString()}
                />
                <StatChip
                  icon={CheckCircle2}
                  label="Valid to import"
                  value={job.validCount.toLocaleString()}
                  tone="good"
                />
                <StatChip
                  icon={Info}
                  label="Duplicates (in file)"
                  value={job.duplicateCount.toLocaleString()}
                  tone="warn"
                />
                <StatChip
                  icon={XCircle}
                  label="Invalid / skipped"
                  value={job.invalidCount.toLocaleString()}
                  tone="bad"
                />
              </div>

              <p className="mt-4 text-[12px] text-muted-foreground">
                Source: <span className="text-foreground">{job.fileName}</span> ·
                format <span className="uppercase text-foreground">{job.format}</span> ·{" "}
                {job.source.replace("_", " ")}
                {job.usedFallback && (
                  <>
                    {" "}· mapped with the deterministic header matcher
                    <span className="text-gold"> (AI unavailable or PII opt-out active)</span>
                  </>
                )}
              </p>

              {/* Preview table */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.08]">
                <div className="max-h-[34vh] overflow-y-auto overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-[12px]">
                    <thead className="sticky top-0 bg-[#0d1322] text-[10px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Phone</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Country</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Company</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Tags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((r, i) => (
                        <tr key={`${r.email}-${i}`} className="border-t border-white/[0.05]">
                          <td className="px-4 py-2.5 font-medium text-foreground">
                            {[r.firstName, r.lastName].filter(Boolean).join(" ") || "—"}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">{r.email}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{r.phone ?? "—"}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{r.countryCode ?? "—"}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{r.company ?? "—"}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {r.tags.length ? r.tags.join(", ") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalRows > preview.length && (
                  <p className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[11px] text-muted-foreground">
                    Showing first {preview.length.toLocaleString()} of{" "}
                    {totalRows.toLocaleString()} records — all {totalRows.toLocaleString()} will be
                    imported on approval.
                  </p>
                )}
              </div>

              <p className="mt-3.5 flex items-start gap-2 rounded-xl border border-teal/25 bg-teal/[0.06] px-4 py-3 text-[11.5px] text-teal">
                <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                On approval, records are imported in background chunks of 200. Emails that already
                exist in your CRM are <strong>updated</strong> (never duplicated) and counted
                separately.
              </p>
            </div>
          )}

          {/* ── STEP 4: importing progress (§17) ─────────────── */}
          {phase === "importing" && job && (
            <div className="py-6">
              <div className="flex items-center justify-between text-[12.5px]">
                <p className="font-medium text-foreground">
                  {job.status === "completed" ? "Finalizing…" : (job.stage ?? "Importing…")}
                </p>
                <p className="text-muted-foreground">
                  {importDone.toLocaleString()} / {importTotal.toLocaleString()}
                </p>
              </div>
              <div
                className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-white/[0.06]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPct}
                aria-label="Import progress"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-light to-gold transition-[width] duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <StatChip icon={CheckCircle2} label="New customers" value={job.importedCount.toLocaleString()} tone="good" />
                <StatChip icon={RefreshCw} label="Updated existing" value={job.existingCount.toLocaleString()} />
                <StatChip icon={XCircle} label="Failed" value={job.failedCount.toLocaleString()} tone={job.failedCount ? "bad" : undefined} />
              </div>
              {job.failedCount > 0 && job.status === "completed" && (
                <button
                  onClick={retryFailed}
                  disabled={busy}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold-dim px-4 py-2.5 text-[12.5px] font-semibold text-gold transition-colors hover:border-gold/60 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={busy ? "animate-spin" : ""} aria-hidden="true" />
                  Retry {job.failedCount.toLocaleString()} failed record(s)
                </button>
              )}
            </div>
          )}

          {/* ── STEP 5: done ────────────────────────────────── */}
          {phase === "done" && job && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-teal/30 bg-teal/[0.08] text-teal">
                <CheckCircle2 size={26} aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-[17px] font-bold text-foreground">
                  Import completed
                </p>
                <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                  {job.importedCount.toLocaleString()} new customer
                  {job.importedCount === 1 ? "" : "s"} ·{" "}
                  {job.existingCount.toLocaleString()} updated ·{" "}
                  {job.failedCount.toLocaleString()} failed
                  {job.failedCount > 0 && " — retry available"}
                </p>
              </div>
              {job.failedCount > 0 && (
                <button
                  onClick={retryFailed}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold-dim px-4 py-2.5 text-[12.5px] font-semibold text-gold transition-colors hover:border-gold/60 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={busy ? "animate-spin" : ""} aria-hidden="true" />
                  Retry failed chunks
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <footer className="shrink-0 border-t border-white/[0.07] bg-white/[0.015] p-5">
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            {phase === "pick" && (
              <button
                onClick={onClose}
                className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            )}
            {phase === "review" && (
              <>
                <button
                  onClick={cancelJob}
                  disabled={busy}
                  className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  onClick={approve}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 size={15} aria-hidden="true" />
                  )}
                  Import {job?.validCount.toLocaleString() ?? 0} customers
                </button>
              </>
            )}
            {phase === "done" && (
              <>
                <button
                  onClick={() => {
                    setPhase("pick");
                    setJob(null);
                    setPreview([]);
                    setUrl("");
                    setJobId(null);
                    setError(null);
                    notifiedRef.current = false;
                  }}
                  className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Import another file
                </button>
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-6 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ── Small building blocks ─────────────────────────────────── */

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Upload;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim text-gold">
        <Icon size={14} aria-hidden="true" />
      </span>
      <p className="mt-2.5 text-[12.5px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Upload;
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad";
}) {
  const toneCls =
    tone === "good"
      ? "border-teal/30 bg-teal/[0.06] text-teal"
      : tone === "warn"
        ? "border-gold/30 bg-gold-dim text-gold"
        : tone === "bad"
          ? "border-red-500/25 bg-red-500/[0.06] text-red-300"
          : "border-white/[0.08] bg-white/[0.03] text-foreground";
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 ${toneCls}`}>
      <Icon size={14} className="shrink-0 opacity-80" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-display text-[15px] font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}
