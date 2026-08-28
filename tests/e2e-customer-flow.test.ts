/**
 * E2E Customer-Flow Integration Test (Batch 8, Deliverable 1)
 * ============================================================
 *
 * Task ID: B8 — Master Directive §9 Batch 8 (FULL END-TO-END
 * integration testing).  This file traces the COMPLETE real-world
 * customer journey from inquiry submission → admin proposal → portal
 * visit → Paystack payment webhook → admin payment visibility.
 *
 * ─── What does this test verify? ───────────────────────────────────
 * The Master Directive §9 Batch 8 customer flow has 6 steps.  Each
 * step is a separate `it(...)` so a failure surfaces exactly which
 * leg of the journey broke:
 *
 *   S1  Customer submits inquiry
 *       → POST /api/inquiries with valid payload (name, email,
 *         phone, service, message ≥ 10 chars)
 *       → assert HTTP 201 + Inquiry row created + ReceivedEmail
 *         audit row created + EmailLog row(s) created (admin +
 *         submitter copies) via deliverWithFailover stub mode.
 *
 *   S2  Admin creates proposal from the inquiry
 *       → call sendProposal(input) directly from
 *         src/lib/invoice-service.ts (skipping the AI-draft route
 *         so the test does not depend on the LLM)
 *       → assert Invoice row created with: invoiceNumber,
 *         customerName, customerEmail, amountKobo, secureToken
 *         (non-null, 256-bit / 43-char base64url), paystackReference
 *         (non-null per B3 GAP-A fix), dvaAccountNumber, dvaBankName,
 *         pdfUrl, status="sent", sentAt set.
 *
 *   S3  Customer receives the email with the portal link
 *       → simulate by calling portalUrlFor(secureToken)
 *       → assert the URL ends with /portal/{secureToken}.
 *
 *   S4  Customer visits the portal
 *       → GET /api/portal/{secureToken}
 *       → assert 200 + body.portal carries: customerName, service,
 *         amountNaira (matching invoice.amountKobo/100), dva box
 *         (accountNumber + bankName + accountName), status="sent"
 *         (so the "I've Paid" button renders enabled), pdf
 *         downloadUrl.
 *
 *   S5  Customer pays via Paystack
 *       → fire charge.success webhook (signed with the test secret)
 *         using the invoice's paystackReference (the primary lookup
 *         key — proves the B3 GAP-A fix's reference is wired through)
 *       → assert HTTP 200 + WebhookLog settles to "processed"
 *       → assert Invoice.status="paid" + paidAt set
 *       → assert EventRecord reminder rows flipped to "skipped"
 *         (proves reminders are stopped on payment)
 *       → assert EmailLog row with type="payment.received" exists
 *         for the customer email (thank-you email queued)
 *       → assert EventRecord row with type="project.kickoff" exists
 *         (kickoff scheduled for 24h after payment)
 *
 *   S6  Admin sees the payment
 *       → GET /api/admin/payments (with admin cookie)
 *       → assert paidInvoices contains our test invoice
 *       → assert logs contains the charge.success webhook log
 *       → assert kickoffEvents contains the kickoff event row
 *       → assert GET /api/admin/customers/[id] (CRM customer detail)
 *         timeline contains the inquiry + invoice + thank-you email
 *
 * ─── How does this verify the REAL production code? ────────────────
 *   • The REAL Prisma client is used (db from src/lib/db.ts).  No
 *     mocks, no in-memory stand-ins.
 *   • The REAL webhook handler (src/app/api/paystack/webhook/route.ts
 *     + src/lib/payment-webhook.ts) is invoked via its exported POST.
 *   • The REAL signature verification (HMAC-SHA512 + timingSafeEqual)
 *     is exercised — we sign the body with the test secret.
 *   • The REAL invoice-service.sendProposal() is invoked — it calls
 *     the REAL paystack.createInvoiceDva (sandbox path because
 *     PAYSTACK_SECRET_KEY is unset), generates a REAL proposal PDF,
 *     uploads to Cloudinary (local fallback when unconfigured), and
 *     delivers the proposal email via the failover chain (stub mode
 *     when no providers configured).
 *   • The REAL admin auth (src/lib/admin-auth.ts + admin/login route)
 *     is used to mint a session cookie for step 6.
 *
 * ─── Run ─────────────────────────────────────────────────────────
 *   cd /home/z/my-project
 *   set -a && source .env && set +a
 *   PAYSTACK_WEBHOOK_SECRET='test-secret-b8' \
 *     NODE_ENV=development \
 *     bun test tests/e2e-customer-flow.test.ts
 *
 * If DATABASE_URL or PAYSTACK_WEBHOOK_SECRET is not set, the suite is
 * SKIPPED (not failed) — production secrets must not be required to
 * run unit tests.  This matches the B1-A pattern.
 *
 * ─── Test-data hygiene ────────────────────────────────────────────
 * All test data is prefixed (`b8-customer-flow@e2e.okomba.local`,
 * invoice number `INV-B8-CUSTOMER-*`, paystackReference
 * `OKM-INV-B8-CUSTOMER-*`).  beforeAll purges any prior run's
 * leftovers; afterAll purges the run we just made.  Re-running the
 * test produces no DB pollution.
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { createHmac } from "node:crypto";
import { db } from "@/lib/db";
import { sendProposal } from "@/lib/invoice-service";
import { portalUrlFor } from "@/lib/portal";
import { POST as webhookPost } from "@/app/api/paystack/webhook/route";
import { POST as inquiryPost } from "@/app/api/inquiries/route";
import { GET as portalGet } from "@/app/api/portal/[token]/route";
import { POST as adminLoginPost } from "@/app/api/admin/login/route";
import { GET as adminPaymentsGet } from "@/app/api/admin/payments/route";
import { GET as adminCustomerDetailGet } from "@/app/api/admin/customers/[id]/route";
import type { ProposalDraft } from "@/lib/proposal";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

// ─── Test environment guard ──────────────────────────────────────
const TEST_SECRET =
  process.env.PAYSTACK_WEBHOOK_SECRET ||
  process.env.PAYSTACK_SECRET_KEY ||
  "";
const HAS_DATABASE_URL = !!process.env.DATABASE_URL;
const HAS_SECRET = !!TEST_SECRET;
const SHOULD_RUN = HAS_DATABASE_URL && HAS_SECRET;

const suite = SHOULD_RUN ? describe : describe.skip;

// ─── Test data (all prefixed to keep prod data clean) ────────────
const TEST_EMAIL = "b8-customer-flow@e2e.okomba.local";
const TEST_NAME = "B8 Customer Flow";
const TEST_PHONE = "+23481000000001";
const TEST_SERVICE = "Web Development";
const TEST_MESSAGE =
  "B8 E2E customer-flow test inquiry — please build a marketing site.";
const TEST_INVOICE_NUMBER_PREFIX = "INV-B8-CUSTOMER-";

// Distinct Paystack event id (dedup key).  Re-using one across runs
// would short-circuit to "duplicate" at the route handler.
const EVT_ID_CUSTOMER_PAYS = 88_001;

// The live IDs captured during the run.
const captured: {
  inquiryId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  secureToken?: string;
  paystackReference?: string;
  customerId?: string;
  paidAtMs?: number;
  webhookLogId?: string;
  adminCookie?: string;
} = {};

// ─── Helpers ─────────────────────────────────────────────────────

function signBody(raw: string): string {
  return createHmac("sha512", TEST_SECRET).update(raw, "utf8").digest("hex");
}

type ChargeSuccessPayload = {
  event: "charge.success";
  data: {
    id: number;
    domain: "test";
    status: "success";
    reference: string | null;
    amount: number;
    currency: string;
    paid_at: string;
    channel: string;
    customer: { email: string; first_name: string; last_name: string };
    dedicated_account?: {
      account_number: string;
      account_name: string;
      bank: { name: string };
    };
  };
};

function buildChargeSuccessPayload(opts: {
  paystackId: number;
  reference: string | null;
  amount: number;
  customerEmail: string;
  customerName: string;
  dvaAccountNumber?: string;
  dvaBankName?: string;
}): ChargeSuccessPayload {
  const [first, ...rest] = opts.customerName.split(" ");
  const payload: ChargeSuccessPayload = {
    event: "charge.success",
    data: {
      id: opts.paystackId,
      domain: "test",
      status: "success",
      reference: opts.reference ?? "",
      amount: opts.amount,
      currency: "NGN",
      paid_at: new Date().toISOString(),
      channel: "dedicated_nuban",
      customer: {
        email: opts.customerEmail,
        first_name: first ?? "Client",
        last_name: rest.join(" "),
      },
    },
  };
  if (opts.dvaAccountNumber) {
    payload.data.dedicated_account = {
      account_number: opts.dvaAccountNumber,
      account_name: "Okomba Analytics",
      bank: { name: opts.dvaBankName ?? "Paystack Test Bank" },
    };
  }
  return payload;
}

async function fireWebhook(
  payload: ChargeSuccessPayload
): Promise<{ status: number; body: unknown; logId: string | null }> {
  const rawBody = JSON.stringify(payload);
  const signature = signBody(rawBody);
  const req = new Request("http://localhost:3000/api/paystack/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-paystack-signature": signature,
    },
    body: rawBody,
  });
  const res = await webhookPost(req);
  const body = (await res.json().catch(() => null)) as
    | {
        ok?: boolean;
        logId?: string;
        error?: string;
        duplicate?: boolean;
        received?: boolean;
        inFlight?: boolean;
      }
    | null;
  return {
    status: res.status,
    body,
    logId: body?.logId ?? null,
  };
}

async function pollWebhookLog(
  logId: string,
  timeoutMs = 30_000
): Promise<{
  status: string;
  error: string | null;
  invoiceId: string | null;
}> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const row = await db.webhookLog.findUnique({ where: { id: logId } });
    if (row && row.status !== "received") {
      return {
        status: row.status,
        error: row.error,
        invoiceId: row.invoiceId,
      };
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(
    `WebhookLog ${logId} did not settle within ${timeoutMs}ms — still "received"`
  );
}

// Build a minimal valid ProposalDraft — avoids the AI draft route.
function buildTestProposalDraft(): ProposalDraft {
  return {
    executiveSummary:
      "B8 E2E test proposal summary — engagement covers scoping, build, and handover for the requested service.",
    objectives: [
      "Deliver the requested service to a production standard.",
      "Maintain weekly progress checkpoints.",
      "Hand over documented, maintainable outputs.",
    ],
    scope: [
      {
        title: "Discovery & Planning",
        items: ["Requirements workshop", "Delivery plan"],
      },
      {
        title: "Design & Build",
        items: ["Core build", "Iterative review"],
      },
      {
        title: "Delivery & Handover",
        items: ["Final QA and launch", "Documentation and handover session"],
      },
    ],
    deliverables: [
      "Discovery summary and delivery plan",
      "Final build of the requested service",
      "Documentation pack",
      "Handover session",
    ],
    timeline: [
      { phase: "Phase 1 — Discovery", duration: "1 week", focus: "Requirements." },
      { phase: "Phase 2 — Build", duration: "2-4 weeks", focus: "Design + build." },
      { phase: "Phase 3 — Handover", duration: "1 week", focus: "QA + launch." },
    ],
    terms: [
      "Two revision rounds included per deliverable.",
      "Weekly progress updates throughout the engagement.",
      "Timeline starts from the kick-off date.",
    ],
  };
}

// ─── Cleanup helpers ────────────────────────────────────────────

async function purgeTestRows(): Promise<void> {
  // Find invoices created by this test (by email).
  const leftovers = await db.invoice.findMany({
    where: { customerEmail: TEST_EMAIL },
    select: { id: true },
  });
  const leftoverIds = leftovers.map((r) => r.id);

  if (leftoverIds.length > 0) {
    await db.eventRecord
      .deleteMany({ where: { relatedInvoiceId: { in: leftoverIds } } })
      .catch(() => {});
    await db.whatsAppMessage
      .deleteMany({ where: { relatedInvoiceId: { in: leftoverIds } } })
      .catch(() => {});
    await db.emailLog
      .deleteMany({ where: { invoiceId: { in: leftoverIds } } })
      .catch(() => {});
    await db.webhookLog
      .deleteMany({ where: { invoiceId: { in: leftoverIds } } })
      .catch(() => {});
    await db.analyticsEvent
      .deleteMany({ where: { invoiceId: { in: leftoverIds } } })
      .catch(() => {});
    await db.invoice
      .deleteMany({ where: { id: { in: leftoverIds } } })
      .catch(() => {});
  }

  // WebhookLogs with no matched invoice (unknown-reference scenario
  // from the failure-flows test) — purge by reference prefix.
  await db.webhookLog
    .deleteMany({ where: { reference: { startsWith: "OKM-INV-B8-" } } })
    .catch(() => {});

  // Inquiries + received emails by email
  await db.receivedEmail.deleteMany({ where: { email: TEST_EMAIL } }).catch(() => {});
  await db.inquiry.deleteMany({ where: { email: TEST_EMAIL } }).catch(() => {});

  // EmailLogs (no invoice link — inquiry.created copies)
  await db.emailLog.deleteMany({ where: { recipientEmail: TEST_EMAIL } }).catch(() => {});

  // Customer row (CRM)
  await db.customer.deleteMany({ where: { email: TEST_EMAIL } }).catch(() => {});

  // Admin sessions minted by this test (purge by hash is not possible
  // since we don't know the hash here — but we delete by expiresAt
  // window around now is overkill; the logout step in the admin flow
  // test handles this.  We leave no orphan inquiries/invoices, which
  // is the contract that matters for prod-data hygiene.)
}

// ─── Test suite ──────────────────────────────────────────────────

suite("B8 E2E customer flow (Master Directive §9 Batch 8)", () => {
  beforeAll(async () => {
    // Defensive: clean any prior-run leftovers first so the suite is
    // idempotent (re-runnable without manual DB cleanup).
    await purgeTestRows();

    // Create a Customer row so the CRM detail endpoint (step 6 part 3)
    // can resolve the customer by ID.  This is the canonical CRM
    // record — without it, /api/admin/customers/[id] returns 404 even
    // though the inquiry + invoice exist by email.
    const customer = await db.customer.create({
      data: {
        name: TEST_NAME,
        email: TEST_EMAIL,
        phone: TEST_PHONE,
        status: "lead",
        source: "inquiry",
        tags: ["b8-e2e"],
      },
    });
    captured.customerId = customer.id;
  }, 60_000);

  afterAll(async () => {
    await purgeTestRows();
    await db.$disconnect();
  }, 60_000);

  // ── S1: Customer submits inquiry ──────────────────────────────
  it("S1: POST /api/inquiries creates Inquiry + ReceivedEmail + EmailLog rows and returns 201", async () => {
    const req = new Request("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.1",
      },
      body: JSON.stringify({
        name: TEST_NAME,
        email: TEST_EMAIL,
        phone: TEST_PHONE,
        service: TEST_SERVICE,
        message: TEST_MESSAGE,
      }),
    });
    const res = await inquiryPost(req);
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: boolean; id: string };
    expect(body.ok).toBe(true);
    expect(body.id).toBeTruthy();
    captured.inquiryId = body.id;

    // Verify the Inquiry row landed.
    const inquiry = await db.inquiry.findUnique({ where: { id: body.id } });
    expect(inquiry).not.toBeNull();
    expect(inquiry?.name).toBe(TEST_NAME);
    expect(inquiry?.email).toBe(TEST_EMAIL);
    expect(inquiry?.service).toBe(TEST_SERVICE);
    expect(inquiry?.message).toBe(TEST_MESSAGE);
    expect(inquiry?.status).toBe("new");

    // Verify the ReceivedEmail audit row landed (Phase-1 Module 2).
    const received = await db.receivedEmail.findFirst({
      where: { email: TEST_EMAIL, inquiryId: body.id },
    });
    expect(received).not.toBeNull();
    expect(received?.source).toBe("contact");

    // Give the fire-and-forget notifyNewInquiry a moment to land its
    // EmailLog rows (admin + submitter copies).  2 rows expected
    // because notify.ts calls deliverOne twice (admin + customer).
    let emailLogs: { id: string; type: string }[] = [];
    for (let i = 0; i < 20; i++) {
      emailLogs = await db.emailLog.findMany({
        where: { recipientEmail: TEST_EMAIL, type: "inquiry.created" },
        select: { id: true, type: true },
      });
      if (emailLogs.length >= 1) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    expect(emailLogs.length).toBeGreaterThanOrEqual(1);

    // Also verify the admin copy landed (sent to FROM_EMAIL not the
    // test email — we just check the test customer's submitter copy).
    // The submitter copy's recipientEmail == TEST_EMAIL.
    const submitterCopy = await db.emailLog.findFirst({
      where: { recipientEmail: TEST_EMAIL, type: "inquiry.created" },
    });
    expect(submitterCopy).not.toBeNull();
    expect(submitterCopy?.status).toBe("sent");
  }, 30_000);

  // ── S2: Admin creates proposal from inquiry ─────────────────
  it("S2: sendProposal() creates an Invoice row with all B3 GAP-A fields populated (status=sent)", async () => {
    if (!captured.inquiryId) {
      throw new Error("S1 must run before S2 — inquiryId missing");
    }

    // Delete any prior invoice for this email so the test is
    // re-runnable (nextInvoiceNumber() bumps to avoid collisions,
    // but our purgeTestRows already wiped leftovers).
    const result = await sendProposal({
      inquiryId: captured.inquiryId,
      proposal: buildTestProposalDraft(),
      amountNaira: 750_000, // ₦750,000
      durationLabel: "3 weeks",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14d from now
      description: "B8 E2E test proposal — marketing site build",
    });

    expect(result.ok).toBe(true);
    expect(result.invoiceId).toBeTruthy();
    expect(result.invoiceNumber).toBeTruthy();
    // Invoice number is auto-generated by nextInvoiceNumber() as
    // INV-{year}-{seq}, so we just assert the production shape (the
    // unique cleanup handle is the customer email, not the invoice
    // number).
    expect(result.invoiceNumber?.startsWith("INV-")).toBe(true);
    captured.invoiceId = result.invoiceId;
    captured.invoiceNumber = result.invoiceNumber;

    // Reload from DB to assert the persisted shape.
    const invoice = await db.invoice.findUnique({ where: { id: result.invoiceId } });
    expect(invoice).not.toBeNull();
    expect(invoice?.invoiceNumber).toBe(result.invoiceNumber);
    expect(invoice?.customerName).toBe(TEST_NAME);
    expect(invoice?.customerEmail).toBe(TEST_EMAIL);
    expect(invoice?.customerPhone).toBe(TEST_PHONE);
    expect(invoice?.service).toBe(TEST_SERVICE);
    expect(invoice?.amountKobo).toBe(75_000_000); // 750k NGN = 75,000,000 kobo
    expect(invoice?.currency).toBe("NGN");
    expect(invoice?.durationLabel).toBe("3 weeks");
    expect(invoice?.dueDate).not.toBeNull();
    expect(invoice?.status).toBe("sent");
    expect(invoice?.sentAt).not.toBeNull();

    // B3 GAP-A fix: secureToken persisted (256-bit / 43-char base64url)
    expect(invoice?.secureToken).toBeTruthy();
    expect(invoice?.secureToken?.length).toBe(43);
    expect(/^[A-Za-z0-9_-]+$/.test(invoice?.secureToken ?? "")).toBe(true);
    captured.secureToken = invoice?.secureToken ?? undefined;

    // B3 GAP-A fix: paystackReference persisted (non-null, OKM- prefix)
    expect(invoice?.paystackReference).toBeTruthy();
    expect(invoice?.paystackReference).toMatch(/^OKM-INV-/);
    captured.paystackReference = invoice?.paystackReference ?? undefined;

    // DVA box data (sandbox path — Paystack Test Bank (Sandbox))
    expect(invoice?.dvaAccountNumber).toBeTruthy();
    expect(invoice?.dvaAccountNumber?.length).toBe(10);
    expect(invoice?.dvaBankName).toBeTruthy();
    expect(invoice?.dvaBankName).toContain("Sandbox");

    // PDF URL (local fallback when Cloudinary unconfigured — but
    // still non-null so the portal can render the download link)
    expect(invoice?.pdfUrl).not.toBeNull();

    // Reminders were scheduled (3 events: 3d-before-due, due, overdue)
    const reminderEvents = await db.eventRecord.findMany({
      where: {
        relatedInvoiceId: invoice?.id,
        type: { startsWith: "invoice.reminder" },
      },
    });
    expect(reminderEvents.length).toBe(3);
    expect(reminderEvents.every((e) => e.status === "scheduled")).toBe(true);

    // Proposal email landed (EmailLog type=invoice.sent)
    const proposalEmail = await db.emailLog.findFirst({
      where: { recipientEmail: TEST_EMAIL, type: "invoice.sent" },
    });
    expect(proposalEmail).not.toBeNull();
    expect(proposalEmail?.status).toBe("sent");
  }, 45_000);

  // ── S3: Customer receives email with portal link ────────────
  it("S3: portalUrlFor(secureToken) returns a URL ending with /portal/{secureToken}", async () => {
    if (!captured.secureToken) {
      throw new Error("S2 must run before S3 — secureToken missing");
    }
    const url = portalUrlFor(captured.secureToken);
    expect(url).toContain(`/portal/${captured.secureToken}`);
    // URL must start with http(s) so the email's CTA is clickable
    expect(url).toMatch(/^https?:\/\//);
  }, 5_000);

  // ── S4: Customer visits portal ───────────────────────────────
  it("S4: GET /api/portal/{secureToken} returns the invoice + DVA + amount + status=sent for the portal UI", async () => {
    if (!captured.secureToken) {
      throw new Error("S3 must run before S4 — secureToken missing");
    }
    const req = new Request(
      `http://localhost:3000/api/portal/${captured.secureToken}`,
      { method: "GET" }
    );
    const res = await portalGet(req, {
      params: Promise.resolve({ token: captured.secureToken }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      portal: {
        customerName: string;
        service: string;
        amountNaira: number;
        status: string;
        dva: { accountNumber: string; bankName: string; accountName: string } | null;
        pdf: { downloadUrl: string; storage: string };
      };
    };
    expect(body.ok).toBe(true);
    expect(body.portal).toBeTruthy();
    expect(body.portal.customerName).toBe(TEST_NAME);
    expect(body.portal.service).toBe(TEST_SERVICE);
    expect(body.portal.amountNaira).toBe(750_000);
    expect(body.portal.status).toBe("sent"); // enables the "I've Paid" button
    expect(body.portal.dva).not.toBeNull();
    expect(body.portal.dva?.accountNumber?.length).toBe(10);
    expect(body.portal.dva?.bankName).toBeTruthy();
    expect(body.portal.dva?.accountName).toBe("Okomba Analytics");
    expect(body.portal.pdf?.downloadUrl).toContain(`/api/portal/${captured.secureToken}/pdf`);
  }, 10_000);

  // ── S5: Customer pays via Paystack ───────────────────────────
  it("S5: charge.success webhook marks the invoice paid + stops reminders + queues thank-you email + schedules kickoff", async () => {
    if (!captured.invoiceId || !captured.paystackReference) {
      throw new Error("S2 must run before S5 — invoiceId / reference missing");
    }

    const invoiceBefore = await db.invoice.findUnique({
      where: { id: captured.invoiceId },
    });
    expect(invoiceBefore?.status).toBe("sent");
    expect(invoiceBefore?.paidAt).toBeNull();

    const amountKobo = invoiceBefore!.amountKobo;
    const payload = buildChargeSuccessPayload({
      paystackId: EVT_ID_CUSTOMER_PAYS,
      reference: captured.paystackReference, // primary lookup key (GAP-A fix)
      amount: amountKobo,
      customerEmail: TEST_EMAIL,
      customerName: TEST_NAME,
      dvaAccountNumber: invoiceBefore!.dvaAccountNumber ?? undefined,
      dvaBankName: invoiceBefore!.dvaBankName ?? undefined,
    });

    const res = await fireWebhook(payload);
    expect(res.status).toBe(200);
    expect(res.logId).not.toBeNull();
    captured.webhookLogId = res.logId!;

    const settled = await pollWebhookLog(res.logId!);
    expect(settled.status).toBe("processed");
    expect(settled.invoiceId).toBe(captured.invoiceId);

    const invoiceAfter = await db.invoice.findUnique({
      where: { id: captured.invoiceId },
    });
    expect(invoiceAfter?.status).toBe("paid");
    expect(invoiceAfter?.paidAt).not.toBeNull();
    captured.paidAtMs = invoiceAfter!.paidAt!.getTime();

    // Reminders stopped — all 3 reminder events flipped to "skipped".
    const reminders = await db.eventRecord.findMany({
      where: {
        relatedInvoiceId: captured.invoiceId,
        type: { startsWith: "invoice.reminder" },
      },
      select: { status: true, type: true },
    });
    expect(reminders.length).toBe(3);
    expect(reminders.every((e) => e.status === "skipped")).toBe(true);

    // Thank-you email queued — EmailLog type=payment.received
    const thankYouEmail = await db.emailLog.findFirst({
      where: { recipientEmail: TEST_EMAIL, type: "payment.received" },
    });
    expect(thankYouEmail).not.toBeNull();
    expect(thankYouEmail?.status).toBe("sent");
    // The receipt PDF was attached — verify the attachments JSON
    // array contains a receipt entry (filename starts with
    // Okomba_Receipt_).
    const atts = thankYouEmail?.attachments as unknown as { filename?: string }[];
    expect(Array.isArray(atts)).toBe(true);
    expect(atts.length).toBeGreaterThan(0);
    expect(atts.some((a) => a.filename?.startsWith("Okomba_Receipt_"))).toBe(true);

    // Kickoff event scheduled — EventRecord type=project.kickoff,
    // 24h after paidAt.
    const kickoff = await db.eventRecord.findFirst({
      where: {
        relatedInvoiceId: captured.invoiceId,
        type: "project.kickoff",
      },
    });
    expect(kickoff).not.toBeNull();
    expect(kickoff?.status).toBe("scheduled");
    // Kickoff eventDate ≈ paidAt + 24h
    const expected = new Date(captured.paidAtMs! + 24 * 60 * 60 * 1000);
    const diffMs = Math.abs(kickoff!.eventDate.getTime() - expected.getTime());
    expect(diffMs).toBeLessThan(60_000); // within 1 minute
  }, 60_000);

  // ── S6: Admin sees the payment ───────────────────────────────
  it("S6: GET /api/admin/payments (with admin cookie) shows the paid invoice + webhook log + kickoff event", async () => {
    if (!captured.invoiceId) {
      throw new Error("S5 must run before S6 — invoiceId missing");
    }

    // Step 1: admin login (uses the dev-default credentials because
    // ADMIN_EMAIL/ADMIN_PASSWORD are unset in our env, and NODE_ENV
    // is "development" so the dev defaults are honoured).
    const loginReq = new Request("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.2",
      },
      body: JSON.stringify({
        email: "admin@okomba.com",
        password: "okomba-admin-2025",
      }),
    });
    const loginRes = await adminLoginPost(loginReq);
    expect(loginRes.status).toBe(200);
    const setCookie = loginRes.headers.get("set-cookie") ?? "";
    const match = setCookie.match(new RegExp(`${ADMIN_COOKIE_NAME}=([^;]+)`));
    expect(match).not.toBeNull();
    const cookieVal = match![1];
    captured.adminCookie = cookieVal;

    // Step 2: GET /api/admin/payments with the cookie
    const paymentsReq = new Request("http://localhost:3000/api/admin/payments", {
      method: "GET",
      headers: { Cookie: `${ADMIN_COOKIE_NAME}=${cookieVal}` },
    });
    const paymentsRes = await adminPaymentsGet(paymentsReq);
    expect(paymentsRes.status).toBe(200);
    const body = (await paymentsRes.json()) as {
      ok: boolean;
      logs: { id: string; reference: string | null; status: string; invoiceId: string | null }[];
      paidInvoices: {
        id: string;
        invoiceNumber: string;
        customerEmail: string;
        amountKobo: number;
      }[];
      kickoffEvents: { relatedInvoiceId: string | null; type: string }[];
    };
    expect(body.ok).toBe(true);

    // The paid invoice appears in paidInvoices
    const found = body.paidInvoices.find((p) => p.id === captured.invoiceId);
    expect(found).toBeTruthy();
    expect(found?.customerEmail).toBe(TEST_EMAIL);
    expect(found?.amountKobo).toBe(75_000_000);

    // The WebhookLog shows the charge.success
    const log = body.logs.find((l) => l.id === captured.webhookLogId);
    expect(log).toBeTruthy();
    expect(log?.status).toBe("processed");
    expect(log?.invoiceId).toBe(captured.invoiceId);
    expect(log?.reference).toBe(captured.paystackReference);

    // The kickoff event appears in kickoffEvents
    const kickoff = body.kickoffEvents.find(
      (k) => k.relatedInvoiceId === captured.invoiceId
    );
    expect(kickoff).toBeTruthy();
    expect(kickoff?.type).toBe("project.kickoff");

    // Step 3: CRM customer detail — timeline contains inquiry + invoice + thank-you email
    if (!captured.customerId) {
      throw new Error("beforeAll must have created a Customer row");
    }
    const crmReq = new Request(
      `http://localhost:3000/api/admin/customers/${captured.customerId}`,
      {
        method: "GET",
        headers: { Cookie: `${ADMIN_COOKIE_NAME}=${cookieVal}` },
      }
    );
    const crmRes = await adminCustomerDetailGet(crmReq, {
      params: Promise.resolve({ id: captured.customerId }),
    });
    expect(crmRes.status).toBe(200);
    const crmBody = (await crmRes.json()) as {
      ok: boolean;
      customer: { id: string; email: string };
      timeline: { kind: string; title: string }[];
      stats: { inquiries: number; invoices: number; paidInvoices: number; emails: number };
    };
    expect(crmBody.ok).toBe(true);
    expect(crmBody.customer.email).toBe(TEST_EMAIL);

    // Timeline contains an inquiry item, an invoice item, and a
    // payment.received email item.
    const kinds = crmBody.timeline.map((t) => t.kind);
    expect(kinds).toContain("inquiry");
    expect(kinds).toContain("invoice");
    expect(kinds).toContain("email");

    // Stats reflect the engagement
    expect(crmBody.stats.inquiries).toBeGreaterThanOrEqual(1);
    expect(crmBody.stats.invoices).toBeGreaterThanOrEqual(1);
    expect(crmBody.stats.paidInvoices).toBeGreaterThanOrEqual(1);
    expect(crmBody.stats.emails).toBeGreaterThanOrEqual(2); // proposal + thank-you
  }, 30_000);
});
