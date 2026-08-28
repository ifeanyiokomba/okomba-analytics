/**
 * Reminder engine (Phase-2 Module 5).
 *
 * Daily 9:00 Africa/Lagos cron (src/lib/cron.ts) + manual trigger
 * (POST /api/admin/reminders/run). Auto-nudges customers to pay by
 * re-sending the SAME branded proposal+invoice PDF.
 *
 * Logic (user spec):
 *   IF dueDate - 3 days == today → "Friendly Reminder"  email + WhatsApp
 *   IF dueDate == today          → "Due Today"          email + WhatsApp
 *   IF dueDate + 1 day == today  → "Overdue"            email + WhatsApp
 *
 * Unpaid statuses are sent | pending | overdue — Module 4 marks
 * invoices "sent"; "pending" is the admin-facing label for the same
 * awaiting-payment state, both are nudged.
 *
 * Dedup: each reminder maps to an EventRecord row
 * (invoice.reminder_3d | invoice.reminder_due | invoice.reminder_overdue).
 * Once processed, the same window never fires twice — even if the
 * scan runs repeatedly the same day.
 */

import { db } from "@/lib/db";
import { sendReminderEmail } from "@/lib/notify";
import { ensurePortalToken, portalUrlFor } from "@/lib/portal";
import { refineReminderBody, type ReminderKind } from "@/lib/reminder-ai";
import { regenerateInvoicePdf } from "@/lib/invoice-pdf";
import { dispatchWhatsApp } from "@/lib/whatsapp";
import { DVA_ACCOUNT_NAME } from "@/lib/brand";
import type { Invoice } from "@/generated/prisma";

/* ── Lagos calendar helpers ────────────────────────────────── */

export const LAGOS_TZ = "Africa/Lagos";

/** "2026-02-14" for a given instant, as seen in Lagos. */
export function lagosDateKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: LAGOS_TZ });
}

/** Whole-day difference due − today (positive = future). */
function dayDiff(dueKey: string, todayKey: string): number {
  return Math.round((Date.parse(dueKey) - Date.parse(todayKey)) / 86_400_000);
}

function dueLabel(due: Date): string {
  return due.toLocaleDateString("en-NG", {
    timeZone: LAGOS_TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtNaira(n: number): string {
  return `\u20A6${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

const KIND_BY_OFFSET: Record<number, ReminderKind> = {
  3: "friendly",
  0: "due",
  [-1]: "overdue",
};

export const REMINDER_EVENT_TYPE: Record<ReminderKind, string> = {
  friendly: "invoice.reminder_3d",
  due: "invoice.reminder_due",
  overdue: "invoice.reminder_overdue",
};

const REMINDER_LABEL: Record<ReminderKind, string> = {
  friendly: "Friendly reminder (due in 3 days)",
  due: "Due today",
  overdue: "Overdue (1 day)",
};

/* ── Report types ──────────────────────────────────────────── */

export type ReminderOutcome = {
  invoiceId: string;
  invoiceNumber: string;
  customer: string;
  kind: ReminderKind;
  label: string;
  email: "sent" | "failed" | "skipped";
  emailError?: string;
  whatsapp: "sent" | "queued" | "failed" | "skipped";
  whatsappError?: string;
  aiUsedFallback?: boolean;
};

export type ReminderRunReport = {
  trigger: "cron" | "manual" | "flush";
  ranAt: string;
  lagosToday: string;
  scanned: number;
  sentCount: number;
  sent: ReminderOutcome[];
  skipped: { invoiceNumber: string; reason: string }[];
  dryRun: boolean;
  error?: string;
};

/* ── Engine ────────────────────────────────────────────────── */

export async function runReminderScan(opts?: {
  trigger?: "cron" | "manual" | "flush";
  dryRun?: boolean;
}): Promise<ReminderRunReport> {
  const trigger = opts?.trigger ?? "manual";
  const dryRun = opts?.dryRun ?? false;

  const now = new Date();
  const todayKey = lagosDateKey(now);

  const report: ReminderRunReport = {
    trigger,
    ranAt: now.toISOString(),
    lagosToday: todayKey,
    scanned: 0,
    sentCount: 0,
    sent: [],
    skipped: [],
    dryRun,
  };

  // 1. All unpaid invoices with a due date
  const invoices = await db.invoice.findMany({
    where: {
      status: { in: ["sent", "pending", "overdue"] },
      dueDate: { not: null },
    },
    orderBy: { dueDate: "asc" },
  });
  report.scanned = invoices.length;

  for (const inv of invoices) {
    const due = inv.dueDate;
    if (!due) continue;

    const diff = dayDiff(lagosDateKey(due), todayKey);
    const kind = KIND_BY_OFFSET[diff];
    if (!kind) continue; // no reminder window today

    const eventType = REMINDER_EVENT_TYPE[kind];

    // 2. Dedup via EventRecord — skip anything already processed
    let event = await db.eventRecord.findFirst({
      where: { relatedInvoiceId: inv.id, type: eventType },
      orderBy: { createdAt: "desc" },
    });
    if (event && event.status === "processed") {
      report.skipped.push({
        invoiceNumber: inv.invoiceNumber,
        reason: `${REMINDER_LABEL[kind]} already sent`,
      });
      continue;
    }
    // Catch-up: create the event row if it was never scheduled
    // (e.g. invoice seeded directly, or sent < 3 days before due)
    if (!event) {
      event = await db.eventRecord.create({
        data: {
          type: eventType,
          customerEmail: inv.customerEmail,
          customerPhone: inv.customerPhone,
          eventDate: due,
          relatedInvoiceId: inv.id,
          payload: {
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customerName,
            amountNaira: Math.round(inv.amountKobo / 100),
            service: inv.service,
            catchUp: true,
          },
          status: "scheduled",
        },
      });
    }

    if (dryRun) {
      report.sent.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customerName,
        kind,
        label: REMINDER_LABEL[kind],
        email: "skipped",
        whatsapp: "skipped",
      });
      continue;
    }

    // 3. Build the outcome
    const outcome: ReminderOutcome = {
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customer: inv.customerName,
      kind,
      label: REMINDER_LABEL[kind],
      email: "skipped",
      whatsapp: "skipped",
    };

    try {
      // 4. AI-refined body prose
      const amountNaira = Math.round(inv.amountKobo / 100);
      const { body, usedFallback } = await refineReminderBody({
        kind,
        customerName: inv.customerName,
        invoiceNumber: inv.invoiceNumber,
        amountNaira,
        dueLabel: dueLabel(due),
        service: inv.service,
        accountNumber: inv.dvaAccountNumber,
      });
      outcome.aiUsedFallback = usedFallback;

      // 5. Re-attach the SAME branded PDF (regenerated from the
      //    stored proposal snapshot — bit-for-bit same content)
      const pdf = await regenerateInvoicePdf(inv);
      const pdfBase64 = pdf.toString("base64");
      const pdfFilename = `Okomba_Proposal_${inv.invoiceNumber}.pdf`;

      // 5b. Ensure a portal token exists for older invoices + build
      //     the portal URL embedded in the reminder email CTA.
      const token = await ensurePortalToken(inv.id).catch(() => null);
      const portalUrl = token ? portalUrlFor(token) : null;

      // 6. Email — subject fixed by spec
      const emailResult = await sendReminderEmail({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        kind,
        customerName: inv.customerName,
        customerEmail: inv.customerEmail,
        service: inv.service,
        amountNaira,
        dueLabel: dueLabel(due),
        dueDate: due.toISOString(),
        dvaAccountNumber: inv.dvaAccountNumber,
        dvaBankName: inv.dvaBankName,
        dvaAccountName: DVA_ACCOUNT_NAME,
        bodyText: body,
        pdfBase64,
        pdfFilename,
        portalUrl,
      });
      outcome.email = emailResult.ok ? "sent" : "failed";
      outcome.emailError = emailResult.error;

      // 7. WhatsApp — caption fixed by spec
      const waPhone = inv.customerPhone;
      if (waPhone) {
        const firstName = inv.customerName.split(" ")[0];
        const caption = [
          `Hi ${firstName}, quick reminder: Invoice ${inv.invoiceNumber} ${fmtNaira(
            amountNaira
          )} due ${dueLabel(due)}.`,
          inv.dvaAccountNumber ? `Pay to ${inv.dvaAccountNumber}` : null,
        ]
          .filter(Boolean)
          .join(" ");
        const wa = await dispatchWhatsApp({
          to: waPhone,
          caption,
          pdfBase64: inv.pdfStorage === "cloudinary" && inv.pdfUrl ? null : pdfBase64,
          pdfUrl: inv.pdfStorage === "cloudinary" && inv.pdfUrl ? inv.pdfUrl : null,
          filename: pdfFilename,
          invoiceId: inv.id,
          source: "reminder",
        });
        outcome.whatsapp = wa.status;
        outcome.whatsappError = wa.error;
      }

      // 8. Mark the event processed + stamp lastSentAt (spec: update
      //    events.lastSentAt after send)
      await db.eventRecord.update({
        where: { id: event.id },
        data: {
          status: "processed",
          processedAt: new Date(),
          lastSentAt: new Date(),
          payload: {
            ...(event.payload && typeof event.payload === "object" && !Array.isArray(event.payload) ? event.payload as Record<string, unknown> : {}),
            lastOutcome: {
              email: outcome.email,
              whatsapp: outcome.whatsapp,
              sentAt: now.toISOString(),
            },
          },
        },
      });

      // 9. Past-due invoices flip to "overdue"
      if (diff < 0 && inv.status !== "overdue") {
        await db.invoice.update({
          where: { id: inv.id },
          data: { status: "overdue" },
        });
      }

      report.sent.push(outcome);
      report.sentCount += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "reminder failed";
      console.error(`[reminders] ${inv.invoiceNumber} failed:`, msg);
      await db.eventRecord
        .update({
          where: { id: event.id },
          data: { status: "failed", processedAt: new Date(), lastSentAt: new Date() },
        })
        .catch(() => {});
      outcome.email = outcome.email === "skipped" ? "failed" : outcome.email;
      outcome.emailError = msg;
      report.sent.push(outcome);
      report.sentCount += 1;
    }
  }

  return report;
}

/* ── Preview: what would fire today (no sends) ─────────────── */

export async function previewTodayReminders(): Promise<{
  lagosToday: string;
  due: { invoiceNumber: string; customer: string; kind: ReminderKind; label: string }[];
}> {
  const todayKey = lagosDateKey(new Date());
  const invoices = await db.invoice.findMany({
    where: {
      status: { in: ["sent", "pending", "overdue"] },
      dueDate: { not: null },
    },
  });
  const due: { invoiceNumber: string; customer: string; kind: ReminderKind; label: string }[] = [];
  for (const inv of invoices) {
    const kind = KIND_BY_OFFSET[dayDiff(lagosDateKey(inv.dueDate!), todayKey)];
    if (!kind) continue;
    const event = await db.eventRecord.findFirst({
      where: { relatedInvoiceId: inv.id, type: REMINDER_EVENT_TYPE[kind] },
      orderBy: { createdAt: "desc" },
    });
    if (event?.status === "processed") continue;
    due.push({
      invoiceNumber: inv.invoiceNumber,
      customer: inv.customerName,
      kind,
      label: REMINDER_LABEL[kind],
    });
  }
  return { lagosToday: todayKey, due };
}

export type { Invoice };
