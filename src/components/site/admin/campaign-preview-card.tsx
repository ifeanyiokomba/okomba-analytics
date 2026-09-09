"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   BATCH 12 (§56/§57) — masked campaign preview card + resolved
   token highlighting. Shared by the builder dialog (step 3) and
   the campaign detail view.

   The renderer reconstructs the template skeleton (literal parts
   escaped, {{tokens}} as lazy capture groups) and paints each
   resolved value in gold — the §57 "rendered per-recipient"
   signal. Falls back to plain text when the skeleton doesn't
   match (e.g. unknown tokens stripped server-side).
   ───────────────────────────────────────────────────────────── */

export function ResolvedText({
  template,
  rendered,
  className,
}: {
  template: string;
  rendered: string;
  className?: string;
}) {
  return <span className={className}>{highlightResolved(template, rendered)}</span>;
}

export function PreviewCard({
  email,
  subject,
  body,
  subjectTemplate,
  bodyTemplate,
  ctaLabel,
}: {
  email: string;
  subject: string;
  body: string;
  subjectTemplate: string;
  bodyTemplate: string;
  ctaLabel?: string | null;
}) {
  return (
    <article className="rounded-xl border border-white/[0.07] bg-[#07090f]/60 px-4 py-3.5">
      <p className="font-mono text-[10.5px] text-muted-foreground">{email}</p>
      <p className="mt-1.5 break-words text-[13px] font-semibold text-foreground">
        <ResolvedText template={subjectTemplate} rendered={subject} />
      </p>
      <p className="mt-2 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-muted-foreground">
        <ResolvedText template={bodyTemplate} rendered={body} />
      </p>
      {ctaLabel && ctaLabel.trim() && (
        <span className="mt-3 inline-flex items-center rounded-lg border border-gold/40 bg-gold-dim px-3 py-1.5 text-[11px] font-semibold text-gold">
          {ctaLabel.trim()}
        </span>
      )}
    </article>
  );
}

function highlightResolved(template: string, rendered: string): ReactNode {
  try {
    const parts = template.split(/(\{\{[a-zA-Z]+\}\})/g);
    if (parts.length <= 1) return rendered;
    const pattern = parts
      .map((p) =>
        /^\{\{[a-zA-Z]+\}\}$/.test(p) ? "(.*?)" : p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      )
      .join("");
    const m = rendered.match(new RegExp(`^${pattern}$`, "s"));
    if (!m) return rendered;
    const out: ReactNode[] = [];
    let gi = 1;
    parts.forEach((p, i) => {
      if (/^\{\{[a-zA-Z]+\}\}$/.test(p)) {
        out.push(
          <mark key={i} className="rounded bg-transparent font-semibold text-gold">
            {m[gi] || "—"}
          </mark>
        );
        gi += 1;
      } else if (p) {
        out.push(<span key={i}>{p}</span>);
      }
    });
    return out;
  } catch {
    return rendered;
  }
}
