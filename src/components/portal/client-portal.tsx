"use client";

/**
 * Client Portal UI (Phase-2 Module 8A).
 *
 * Auth-free by design — the 192-bit secureToken in the URL IS the access
 * control. Renders the branded Ink + Honey-Gold proposal the customer
 * received by email: editorial ink cover, paper Total-Due card, DVA box
 * with 1-click copy, timeline stepper, scope & deliverables cards, a
 * sticky-ish actions row (Download PDF + "I've Paid" proof upload),
 * and a private ink footer. Mobile-first; tested at 375px.
 *
 * Two named exports:
 *   - ClientPortal       — the full UI (props: { token })
 *   - ClientPortalView    — thin wrapper so /portal/[secureToken]/page.tsx
 *                           can swap the implementation without touching
 *                           its import line.
 *
 * Analytics (spec 8C):
 *   - proposal_view fires ONCE when the proposal body scrolls into view
 *     (server + GA4).
 *   - payment_click fires on "I've Paid" click (GA4 only — the upload
 *     itself records payment_proof_uploaded server-side).
 *   - portal_visit + pdf_download are recorded server-side automatically
 *     by the API routes; the client only pushes pdf_download to GA4.
 */

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode, type RefObject } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { trackEvent, trackServerEvent } from "@/lib/analytics";

/* ─────────────────────── Types ─────────────────────── */

type PortalStatus = "draft" | "sent" | "pending" | "paid" | "overdue" | "cancelled";

type Dva = {
  accountNumber: string;
  bankName: string;
  accountName: string;
};

type PdfMeta = {
  cloudinaryUrl: string | null;
  downloadUrl: string;
  storage: "cloudinary" | "local" | "generated";
};

type PaymentProof = {
  fileName: string;
  uploadedAt: string | null;
} | null;

type ProposalSection = { title: string; items: string[] };
type ProposalTimelinePhase = { phase: string; duration: string; focus: string };

type ProposalDraft = {
  executiveSummary: string;
  objectives: string[];
  scope: ProposalSection[];
  deliverables: string[];
  timeline: ProposalTimelinePhase[];
  terms: string[];
};

type Portal = {
  token: string;
  invoiceNumber: string;
  customerName: string;
  service: string;
  description?: string | null;
  amountNaira: number;
  currency: string;
  durationLabel: string | null;
  dueDate: string | null;
  status: PortalStatus;
  paidAt: string | null;
  sentAt: string | null;
  createdAt: string;
  portalViewedAt: string | null;
  dva: Dva | null;
  pdf: PdfMeta;
  paymentProof: PaymentProof;
  proposal: ProposalDraft;
};

type FetchState =
  | { kind: "loading" }
  | { kind: "not-found"; message?: string }
  | { kind: "error"; message: string }
  | { kind: "ready"; portal: Portal };

type UploadState =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "success"; message: string; proof: { fileName: string; uploadedAt: string | null } }
  | { kind: "error"; message: string };

/* ───────────────────── Formatters ───────────────────── */

const fmtNaira = (n: number): string =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/* ───────────────── Loading / error shells ───────────────── */

function InkSpinner({ label }: { label: string }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#0B0F1A]"
      role="status"
      aria-label={label}
    >
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#C9910A] border-t-transparent" />
    </div>
  );
}

function InkMessageCard({
  title,
  body,
  variant = "neutral",
}: {
  title: string;
  body: string;
  variant?: "neutral" | "error";
}) {
  const accentClasses =
    variant === "error"
      ? "bg-[#dc2626]/15 text-[#ff8a80]"
      : "bg-[#C9910A]/15 text-[#FFC94D]";
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A] px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-7 text-center shadow-2xl">
        <div
          className={`mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full ${accentClasses}`}
        >
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl tracking-tight text-white">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{body}</p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <a
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9910A] px-4 py-3 font-display font-semibold text-white transition hover:bg-[#FFC94D] hover:text-[#141926]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </a>
          <a
            href="https://wa.me/2348088948657"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-white/60 transition-colors hover:text-white"
          >
            or WhatsApp +234 808 894 8657
          </a>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Cover ───────────────────── */

function StatusPill({ status, paidAt }: { status: PortalStatus; paidAt: string | null }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C9910A] px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-white">
        <Check className="h-3 w-3" aria-hidden="true" />
        Paid{paidAt ? ` · ${fmtDate(paidAt)}` : ""}
      </span>
    );
  }
  if (status === "overdue") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff8a80]/40 bg-[#dc2626]/15 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-[#ff8a80]">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        Action needed
      </span>
    );
  }
  return null;
}

function Cover({ portal }: { portal: Portal }) {
  const paid = portal.status === "paid";
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full"
      style={{ background: "linear-gradient(180deg, #0B0F1A 0%, #141926 100%)" }}
    >
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col px-5 pb-16 pt-7 sm:min-h-[70vh] sm:max-w-3xl sm:px-8 sm:pb-20 sm:pt-10">
        {paid && (
          <div className="mb-6 rounded-xl border border-[#C9910A]/40 bg-[#C9910A]/10 px-4 py-3 text-center">
            <p className="font-display text-sm font-semibold text-[#FFC94D]">
              Thank you — payment received
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span
            className="text-[15px] font-semibold text-[#C9910A]"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              letterSpacing: "-0.02em",
            }}
          >
            OKOMBA
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FFC94D]/80">
            Client Portal · {portal.invoiceNumber}
          </span>
        </div>

        <div className="mt-auto pt-10 sm:pt-16">
          <h1 className="font-display text-[2rem] leading-[1.05] tracking-tight text-white sm:text-[3.25rem]">
            Prepared for
            <br />
            {portal.customerName}
          </h1>
          <p className="mt-3 text-base text-[#FFC94D] sm:text-lg">{portal.service}</p>
          <div className="mt-4">
            <StatusPill status={portal.status} paidAt={portal.paidAt} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ─────────────────── Total Due card ─────────────────── */

function TotalDueCard({ portal }: { portal: Portal }) {
  const paid = portal.status === "paid";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e4e1d8] border-l-4 border-l-[#C9910A] bg-white p-5 shadow-[0_8px_24px_-12px_rgba(11,15,26,0.18)] sm:p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C9910A]">Total Due</p>
      <p className="mt-1 font-display text-[2rem] leading-none tracking-tight text-[#1c2333] sm:text-[2.5rem]">
        {fmtNaira(portal.amountNaira)}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-[#5a6373]">
        {portal.durationLabel && <span>{portal.durationLabel}</span>}
        {paid && portal.paidAt ? (
          <span className="text-[#00C9A7]">Settled on {fmtDate(portal.paidAt)}</span>
        ) : portal.dueDate ? (
          <span>Due {fmtDate(portal.dueDate)}</span>
        ) : null}
      </div>
    </div>
  );
}

/* ───────────────────── DVA card ───────────────────── */

function DvaCard({ dva, disabled }: { dva: Dva; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dva.accountNumber);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = dva.accountNumber;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        /* clipboard API unavailable — fail silently, the visible number still works */
      }
    }
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={[
        "rounded-2xl border bg-white p-5 transition sm:p-6",
        disabled
          ? "border-[#e4e1d8] opacity-60"
          : "border-[#e4e1d8] shadow-[0_8px_24px_-12px_rgba(11,15,26,0.12)]",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[#C9910A]" aria-hidden="true" />
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#5a6373]">
          Dedicated Virtual Account
        </p>
      </div>
      <p className="mt-3 font-display text-lg text-[#1c2333]">{dva.bankName}</p>
      <p className="text-sm text-[#5a6373]">{dva.accountName}</p>
      <button
        type="button"
        onClick={handleCopy}
        disabled={disabled}
        aria-label={`Copy account number ${dva.accountNumber}`}
        className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-[#e4e1d8] bg-[#f7f5ef] px-4 py-3 text-left transition hover:border-[#C9910A] disabled:cursor-not-allowed"
      >
        <span className="font-mono text-xl tracking-wider text-[#1c2333]">
          {dva.accountNumber}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#C9910A]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#C9910A]">
          {copied ? (
            <>
              <Check className="h-3 w-3" aria-hidden="true" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" aria-hidden="true" /> Copy
            </>
          )}
        </span>
      </button>
    </div>
  );
}

/* ───────────────────── Timeline ───────────────────── */

function Timeline({ phases }: { phases: ProposalTimelinePhase[] }) {
  if (!phases.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#e4e1d8] bg-white p-6 text-center">
        <p className="text-sm text-[#5a6373]">
          Your engagement timeline will appear here once confirmed.
        </p>
      </div>
    );
  }
  return (
    <ol className="relative">
      <span
        className="absolute left-[7px] top-2 bottom-2 w-px bg-[#e4e1d8]"
        aria-hidden="true"
      />
      {phases.map((p, i) => (
        <li key={`${p.phase}-${i}`} className="relative pb-6 pl-8 last:pb-0">
          <span className="absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-[#C9910A] bg-[#C9910A]" />
          <p className="font-display font-semibold text-[#1c2333]">{p.phase}</p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[#C9910A]">
            {p.duration}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-[#5a6373]">{p.focus}</p>
        </li>
      ))}
    </ol>
  );
}

/* ───────────────── Section label ───────────────── */

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#5a6373]">
      {children}
    </p>
  );
}

/* ───────────────────── Actions row ───────────────────── */

type ActionsProps = {
  portal: Portal;
  upload: UploadState;
  onPickFile: () => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
};

function ActionsRow({ portal, upload, onPickFile, onFileChange, fileInputRef }: ActionsProps) {
  const paid = portal.status === "paid";
  // After a successful in-session upload the freshly-returned proof meta
  // is the most accurate signal; show the success card until the page is
  // refetched. Otherwise, if a proof is already on file (server state),
  // show the muted "verifying" card. If neither and not paid, show the
  // I've Paid button (or the error card after a failed upload).
  const showSuccessCard = !paid && upload.kind === "success";
  const showProofReceivedCard =
    !paid && portal.paymentProof !== null && upload.kind === "idle";
  const showIvePaidButton =
    !paid &&
    portal.paymentProof === null &&
    (upload.kind === "idle" || upload.kind === "error");

  return (
    <div className="grid grid-cols-1 gap-3 pb-[env(safe-area-inset-bottom)]">
      {/* Download PDF — available in every status */}
      <a
        href={portal.pdf.downloadUrl}
        download
        onClick={() =>
          trackEvent("pdf_download", {
            invoiceNumber: portal.invoiceNumber,
            secureToken: portal.token,
          })
        }
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9910A] px-5 py-4 font-display font-semibold text-white shadow-lg shadow-[#C9910A]/20 transition hover:bg-[#FFC94D] hover:text-[#141926]"
      >
        <Download className="h-5 w-5" aria-hidden="true" />
        Download proposal PDF
      </a>

      {/* Hidden file input driven by the I've Paid button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,application/pdf"
        className="hidden"
        onChange={onFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      {showIvePaidButton && (
        <button
          type="button"
          onClick={onPickFile}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#141926] bg-transparent px-5 py-4 font-display font-semibold text-[#141926] transition hover:bg-[#141926] hover:text-white"
        >
          <Upload className="h-5 w-5" aria-hidden="true" />
          I&apos;ve Paid
        </button>
      )}

      {upload.kind === "uploading" && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#e4e1d8] bg-white px-5 py-4 text-sm text-[#5a6373]">
          <Loader2 className="h-4 w-4 animate-spin text-[#C9910A]" aria-hidden="true" />
          Uploading your payment proof…
        </div>
      )}

      {showSuccessCard && upload.kind === "success" && (
        <div className="rounded-xl border border-[#C9910A]/40 bg-[#C9910A]/10 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#C9910A]" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-[#1c2333]">
                Proof received — thank you
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#5a6373]">
                {upload.message}
              </p>
              {upload.proof.fileName && (
                <p className="mt-2 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-wider text-[#5a6373]">
                  <FileText className="h-3 w-3 text-[#C9910A]" aria-hidden="true" />
                  {upload.proof.fileName}
                  {upload.proof.uploadedAt && <> · {fmtDate(upload.proof.uploadedAt)}</>}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {upload.kind === "error" && (
        <div className="rounded-xl border border-[#dc2626]/40 bg-[#dc2626]/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#dc2626]" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-[#1c2333]">
                Upload failed
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#5a6373]">
                {upload.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {showProofReceivedCard && (
        <div className="flex items-center gap-3 rounded-xl border border-[#e4e1d8] bg-[#f7f5ef] px-4 py-3 text-sm text-[#5a6373]">
          <Loader2 className="h-4 w-4 animate-spin text-[#5a6373]" aria-hidden="true" />
          <span className="min-w-0">
            Proof received — verifying
            {portal.paymentProof?.fileName && (
              <span className="ml-1 truncate font-mono text-[11px] text-[#5a6373]/80">
                · {portal.paymentProof.fileName}
              </span>
            )}
          </span>
        </div>
      )}

      {paid && (
        <div className="flex items-center gap-2 rounded-xl border border-[#00C9A7]/30 bg-[#00C9A7]/10 px-4 py-3 text-sm text-[#00C9A7]">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Payment received — thank you
        </div>
      )}
    </div>
  );
}

/* ───────────────────── Main component ───────────────────── */

export function ClientPortal({ token }: { token: string }) {
  const [state, setState] = useState<FetchState>({ kind: "loading" });
  const [upload, setUpload] = useState<UploadState>({ kind: "idle" });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const proposalRef = useRef<HTMLDivElement | null>(null);
  const proposalViewFiredRef = useRef(false);

  // Fetch portal data once on mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/portal/${encodeURIComponent(token)}`, {
          headers: { Accept: "application/json" },
        });
        if (cancelled) return;
        if (res.status === 404) {
          setState({ kind: "not-found" });
          return;
        }
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; error?: string; portal?: Portal }
          | null;
        if (cancelled) return;
        if (!res.ok || !data?.ok || !data.portal) {
          setState({
            kind: "error",
            message: data?.error ?? "Portal unavailable. Please try again later.",
          });
          return;
        }
        setState({ kind: "ready", portal: data.portal });
      } catch {
        if (cancelled) return;
        setState({
          kind: "error",
          message: "Network error — please check your connection and try again.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Fire proposal_view once when the proposal body scrolls into view.
  useEffect(() => {
    if (state.kind !== "ready") return;
    const node = proposalRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      // Observer unavailable — fire immediately so analytics still records.
      if (!proposalViewFiredRef.current) {
        proposalViewFiredRef.current = true;
        const params = {
          invoiceNumber: state.portal.invoiceNumber,
          secureToken: token,
        };
        void trackServerEvent("proposal_view", params);
        trackEvent("proposal_view", params);
      }
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !proposalViewFiredRef.current) {
            proposalViewFiredRef.current = true;
            const params = {
              invoiceNumber: state.portal.invoiceNumber,
              secureToken: token,
            };
            void trackServerEvent("proposal_view", params);
            trackEvent("proposal_view", params);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [state, token]);

  // ── Loading / not-found / error shells ──
  if (state.kind === "loading") {
    return <InkSpinner label="Loading client portal" />;
  }
  if (state.kind === "not-found") {
    return (
      <InkMessageCard
        title="We couldn't find this proposal"
        body="If this link is older than 30 days, request a fresh one from support@okomba.com."
      />
    );
  }
  if (state.kind === "error") {
    return (
      <InkMessageCard
        title="Portal unavailable"
        body={state.message}
        variant="error"
      />
    );
  }

  const { portal } = state;
  const paid = portal.status === "paid";

  const handlePaidClick = () => {
    // GA4 only — server records payment_proof_uploaded on the upload itself.
    trackEvent("payment_click", { invoiceNumber: portal.invoiceNumber });
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUpload({ kind: "uploading" });
    try {
      const form = new FormData();
      form.append("proof", file);
      const res = await fetch(`/api/portal/${encodeURIComponent(token)}/paid`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; message?: string; proof?: { fileName?: string; uploadedAt?: string | null } }
        | null;
      if (res.ok && data?.ok && data.proof) {
        setUpload({
          kind: "success",
          message:
            data.message ??
            "Thank you! Your payment proof has been received — we'll confirm within a few hours.",
          proof: {
            fileName: data.proof.fileName ?? file.name,
            uploadedAt: data.proof.uploadedAt ?? null,
          },
        });
      } else {
        setUpload({
          kind: "error",
          message:
            data?.error ??
            "Upload failed — please try again or email support@okomba.com.",
        });
      }
    } catch {
      setUpload({
        kind: "error",
        message: "Network error — please check your connection and try again.",
      });
    }
    // Reset the input so the same file can be re-selected after an error.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f5ef]">
      <Cover portal={portal} />

      <main className="flex w-full flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 sm:max-w-3xl sm:px-8">
          <div className="-mt-8 sm:-mt-12">
            <TotalDueCard portal={portal} />
          </div>

          {portal.dva && (
            <div className="mt-4">
              <DvaCard dva={portal.dva} disabled={paid} />
            </div>
          )}

          {/* Proposal body — proposal_view fires when this scrolls into view */}
          <div ref={proposalRef} className="mt-8 flex-1">
            <section>
              <SectionLabel>Engagement Timeline</SectionLabel>
              <Timeline phases={portal.proposal.timeline} />
            </section>

            {portal.proposal.executiveSummary && (
              <section className="mt-8">
                <SectionLabel>Executive Summary</SectionLabel>
                <div className="rounded-2xl border border-[#e4e1d8] bg-white p-5 shadow-[0_8px_24px_-12px_rgba(11,15,26,0.12)] sm:p-6">
                  <p className="text-[15px] leading-relaxed text-[#1c2333] sm:text-base">
                    {portal.proposal.executiveSummary}
                  </p>
                </div>
              </section>
            )}

            {portal.proposal.objectives.length > 0 && (
              <section className="mt-6">
                <SectionLabel>Engagement Objectives</SectionLabel>
                <div className="rounded-2xl border border-[#e4e1d8] bg-white p-5 shadow-[0_8px_24px_-12px_rgba(11,15,26,0.12)] sm:p-6">
                  <ul className="space-y-2">
                    {portal.proposal.objectives.map((o, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#1c2333]">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#C9910A]"
                          aria-hidden="true"
                        />
                        <span className="leading-relaxed">{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {portal.proposal.scope.length > 0 && (
              <section className="mt-6">
                <SectionLabel>Scope of Work</SectionLabel>
                <div className="space-y-3">
                  {portal.proposal.scope.map((s, i) => (
                    <details
                      key={`${s.title}-${i}`}
                      className="group rounded-2xl border border-[#e4e1d8] bg-white p-4 shadow-[0_8px_24px_-12px_rgba(11,15,26,0.12)] sm:p-5"
                      open={i === 0}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                        <span className="font-display font-semibold text-[#1c2333]">
                          {s.title}
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-wider text-[#C9910A]">
                          {s.items.length} {s.items.length === 1 ? "item" : "items"}
                        </span>
                      </summary>
                      <ul className="mt-3 space-y-2">
                        {s.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-[#5a6373]">
                            <span
                              className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#C9910A]"
                              aria-hidden="true"
                            />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {portal.proposal.deliverables.length > 0 && (
              <section className="mt-6">
                <SectionLabel>Deliverables</SectionLabel>
                <div className="rounded-2xl border border-[#e4e1d8] bg-white p-5 shadow-[0_8px_24px_-12px_rgba(11,15,26,0.12)] sm:p-6">
                  <ul className="space-y-2">
                    {portal.proposal.deliverables.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#1c2333]">
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#00C9A7]"
                          aria-hidden="true"
                        />
                        <span className="leading-relaxed">{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {portal.proposal.terms.length > 0 && (
              <section className="mt-6">
                <SectionLabel>Terms &amp; Conditions</SectionLabel>
                <div className="rounded-2xl border border-[#e4e1d8] bg-white p-5 shadow-[0_8px_24px_-12px_rgba(11,15,26,0.12)] sm:p-6">
                  <ol className="space-y-2">
                    {portal.proposal.terms.map((t, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-[#5a6373]">
                        <span className="font-mono text-[11px] text-[#C9910A]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="leading-relaxed">{t}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            )}
          </div>

          {/* Actions row — sticky-ish above the footer on mobile, full-width stacked at 375px */}
          <div className="mt-8 pb-10">
            <ActionsRow
              portal={portal}
              upload={upload}
              onPickFile={handlePaidClick}
              onFileChange={handleFileChange}
              fileInputRef={fileInputRef}
            />
          </div>
        </div>
      </main>

      <footer className="mt-auto bg-[#0B0F1A]">
        <div className="mx-auto w-full max-w-md px-5 py-7 sm:max-w-3xl sm:px-8">
          <p className="font-mono text-[10.5px] leading-relaxed text-white/55">
            Okomba Analytics · support@okomba.com · +234 808 894 8657 · This portal
            link is private to {portal.customerName}.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ───────────── Thin wrapper for /portal/[secureToken] ───────────── */

export function ClientPortalView({ token }: { token: string }) {
  return <ClientPortal token={token} />;
}

export default ClientPortal;
