/**
 * E2E Admin-Flow Integration Test (Batch 8, Deliverable 2)
 * =========================================================
 *
 * Task ID: B8 — Master Directive §9 Batch 8 (FULL END-TO-END
 * integration testing).  This file traces the COMPLETE admin journey
 * from login → inquiries → invoices → payments → CRM customer
 * detail → logout.
 *
 * ─── What does this test verify? ───────────────────────────────────
 * The Master Directive §9 Batch 8 admin flow has 8 steps.  Each step
 * is a separate `it(...)` so a failure surfaces exactly which leg
 * of the journey broke:
 *
 *   S1  Admin login
 *       → POST /api/admin/login with valid credentials
 *       → assert HTTP 200 + Set-Cookie header set with the
 *         okomba_admin cookie name + an AdminSession row created
 *         in the DB (SHA-256 hashed token persisted).
 *
 *   S2  Admin views inquiries stats
 *       → GET /api/inquiries?stats=1 with the admin cookie
 *       → assert 200 + body.stats.total ≥ our test inquiry count
 *         + body.stats.new ≥ 1 (our test inquiry is "new")
 *
 *   S3  Admin views inquiries list
 *       → GET /api/inquiries with the admin cookie
 *       → assert 200 + body.inquiries array contains our test
 *         inquiry (matched by id) with the right fields.
 *
 *   S4  (Covered by the customer-flow S2 — admin creates a proposal.
 *        Here we just verify the invoice exists in the DB so the
 *        subsequent admin-invoices step has data to show.)
 *
 *   S5  Admin views invoices
 *       → GET /api/admin/invoices with the admin cookie
 *       → assert 200 + body.invoices array contains our test
 *         invoice (matched by id) with the right fields.
 *
 *   S6  Admin views payments
 *       → GET /api/admin/payments with the admin cookie
 *       → assert 200 + body.paidInvoices contains our test invoice
 *         + body.logs contains the charge.success webhook log.
 *
 *   S7  Admin views CRM customer
 *       → GET /api/admin/customers with the admin cookie
 *       → assert 200 + body.customers contains our test customer
 *         (matched by email) with stats reflecting the inquiry +
 *         invoice + email interactions.
 *       → GET /api/admin/customers/[id] with the admin cookie
 *       → assert 200 + body.timeline contains an inquiry item,
 *         an invoice item, and an email item.
 *
 *   S8  Admin logout
 *       → POST /api/admin/logout with the admin cookie
 *       → assert 200 + Set-Cookie clears the cookie (maxAge=0)
 *       → assert the AdminSession row is deleted (DB-level verify)
 *       → assert a subsequent GET /api/admin/invoices with the
 *         now-invalidated cookie returns 401.
 *
 * ─── How does this verify the REAL production code? ────────────────
 *   • The REAL Prisma client is used (db from src/lib/db.ts).  No
 *     mocks, no in-memory stand-ins.
 *   • The REAL admin auth (src/lib/admin-auth.ts + admin/login +
 *     admin/logout routes) is exercised end-to-end.  Login mints
 *     a SHA-256-hashed session row; logout deletes it; the admin
 *     route guard isAdminAuthorized(req) verifies each request.
 *   • The REAL admin route handlers (GET /api/admin/invoices,
 *     GET /api/admin/payments, GET /api/admin/customers,
 *     GET /api/admin/customers/[id], GET /api/inquiries,
 *     POST /api/admin/login, POST /api/admin/logout) are invoked
 *     via their exported functions.
 *
 * ─── B8 minimal production-code fix dependency ────────────────────
 * This test depends on the B8 fix in src/lib/admin-auth.ts that
 * makes isAdminAuthorized accept an optional `req` parameter (so
 * the manual Cookie-header parse fallback becomes reachable when
 * next/headers' cookies() store is unavailable in the bun:test
 * harness).  Without this fix, every admin route would 401 in tests
 * because cookies() throws outside a real Next.js request scope.
 * The fix is backward-compatible: production callers don't pass `req`
 * and the existing cookies() path is used, byte-identical to the
 * pre-B8 behaviour.
 *
 * ─── Run ─────────────────────────────────────────────────────────
 *   cd /home/z/my-project
 *   set -a && source .env && set +a
 *   PAYSTACK_WEBHOOK_SECRET='test-secret-b8' \
 *     NODE_ENV=development \
 *     bun test tests/e2e-admin-flow.test.ts
 *
 * If DATABASE_URL or PAYSTACK_WEBHOOK_SECRET is not set, the suite is
 * SKIPPED (not failed) — production secrets must not be required to
 * run unit tests.  This matches the B1-A pattern.
 *
 * ─── Test-data hygiene ────────────────────────────────────────────
 * All test data is prefixed (`b8-admin-flow@e2e.okomba.local`,
 * invoice `INV-2026-…`, paystackReference `OKM-INV-2026-…`).  The
 * beforeAll hooks:
 *   1. Purge any prior run's leftovers.
 *   2. Create a Customer row (CRM canonical contact).
 *   3. Create an Inquiry row (so the admin inquiries list has data).
 *   4. Create an Invoice row with status="paid" + a WebhookLog row
 *      (so the admin payments list has data).
 * afterAll purges everything.
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { createHmac } from "node:crypto";
import { db } from "@/lib/db";
import { sendProposal } from "@/lib/invoice-service";
import { POST as webhookPost } from "@/app/api/paystack/webhook/route";
import { POST as inquiriesPost } from "@/app/api/inquiries/route";
import { GET as inquiriesGet } from "@/app/api/inquiries/route";
import { POST as adminLoginPost } from "@/app/api/admin/login/route";
import { POST as adminLogoutPost } from "@/app/api/admin/logout/route";
import { GET as adminInvoicesGet } from "@/app/api/admin/invoices/route";
import { GET as adminPaymentsGet } from "@/app/api/admin/payments/route";
import { GET as adminCustomersGet } from "@/app/api/admin/customers/route";
import { GET as adminCustomerDetailGet } from "@/app/api/admin/customers/[id]/route";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import type { ProposalDraft } from "@/lib/proposal";

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
const TEST_EMAIL = "b8-admin-flow@e2e.okomba.local";
const TEST_NAME = "B8 Admin Flow";
const TEST_PHONE = "+23481000000002";
const TEST_SERVICE = "Data Analytics";
const TEST_MESSAGE =
  "B8 E2E admin-flow test inquiry — need dashboard build.";
const EVT_ID_ADMIN_PAYS = 88_002;

const captured: {
  inquiryId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  secureToken?: string;
  paystackReference?: string;
  customerId?: string;
  webhookLogId?: string;
  adminCookie?: string;
  adminSessionTokenHash?: string;
} = {};

// ─── Helpers (mirror of e2e-customer-flow's helpers) ─────────────

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
    | { ok?: boolean; logId?: string; duplicate?: boolean; received?: boolean }
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
): Promise<{ status: string; invoiceId: string | null }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const row = await db.webhookLog.findUnique({ where: { id: logId } });
    if (row && row.status !== "received") {
      return { status: row.status, invoiceId: row.invoiceId };
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(
    `WebhookLog ${logId} did not settle within ${timeoutMs}ms — still "received"`
  );
}

function buildTestProposalDraft(): ProposalDraft {
  return {
    executiveSummary:
      "B8 admin-flow proposal summary — engagement covers dashboard build.",
    objectives: [
      "Deliver the requested dashboard.",
      "Maintain weekly checkpoints.",
      "Hand over documented outputs.",
    ],
    scope: [
      {
        title: "Discovery",
        items: ["Requirements workshop", "Data source mapping"],
      },
      {
        title: "Build",
        items: ["Dashboard build", "Iterative review"],
      },
      {
        title: "Handover",
        items: ["QA + launch", "Documentation"],
      },
    ],
    deliverables: ["Dashboard", "Docs", "Handover session"],
    timeline: [
      { phase: "Phase 1", duration: "1 week", focus: "Discovery." },
      { phase: "Phase 2", duration: "2 weeks", focus: "Build." },
      { phase: "Phase 3", duration: "1 week", focus: "Handover." },
    ],
    terms: [
      "Two revision rounds.",
      "Weekly progress updates.",
      "Timeline starts on kick-off.",
    ],
  };
}

async function purgeTestRows(): Promise<void> {
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
  await db.webhookLog
    .deleteMany({ where: { reference: { startsWith: "OKM-INV-2026-" } } })
    .catch(() => {});
  await db.receivedEmail.deleteMany({ where: { email: TEST_EMAIL } }).catch(() => {});
  await db.inquiry.deleteMany({ where: { email: TEST_EMAIL } }).catch(() => {});
  await db.emailLog.deleteMany({ where: { recipientEmail: TEST_EMAIL } }).catch(() => {});
  await db.customer.deleteMany({ where: { email: TEST_EMAIL } }).catch(() => {});
}

// ─── Test suite ──────────────────────────────────────────────────

suite("B8 E2E admin flow (Master Directive §9 Batch 8)", () => {
  beforeAll(async () => {
    // Defensive: clean any prior-run leftovers first so the suite is
    // idempotent (re-runnable without manual DB cleanup).
    await purgeTestRows();

    // 1. Create a Customer row (CRM canonical contact).
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

    // 2. Submit the inquiry via the real API (so ReceivedEmail +
    //    EmailLog audit rows are also created, mirroring prod).
    const req = new Request("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.10",
      },
      body: JSON.stringify({
        name: TEST_NAME,
        email: TEST_EMAIL,
        phone: TEST_PHONE,
        service: TEST_SERVICE,
        message: TEST_MESSAGE,
      }),
    });
    const res = await inquiriesPost(req);
    const body = (await res.json()) as { ok: boolean; id: string };
    captured.inquiryId = body.id;

    // 3. Admin creates the proposal (step S4 in the directive — done
    //    here so step S5 has an invoice to list).
    const proposal = await sendProposal({
      inquiryId: captured.inquiryId,
      proposal: buildTestProposalDraft(),
      amountNaira: 1_200_000, // ₦1,200,000
      durationLabel: "4 weeks",
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      description: "B8 admin-flow test proposal",
    });
    captured.invoiceId = proposal.invoiceId;
    captured.invoiceNumber = proposal.invoiceNumber;

    // Reload to capture the secure token + reference (used in the
    // webhook fire below to mark the invoice paid).
    const inv = await db.invoice.findUnique({ where: { id: proposal.invoiceId } });
    captured.secureToken = inv?.secureToken ?? undefined;
    captured.paystackReference = inv?.paystackReference ?? undefined;

    // 4. Fire charge.success webhook so the invoice flips to "paid"
    //    (the admin payments list step S6 needs a paid invoice).
    const payload = buildChargeSuccessPayload({
      paystackId: EVT_ID_ADMIN_PAYS,
      reference: captured.paystackReference!,
      amount: inv!.amountKobo,
      customerEmail: TEST_EMAIL,
      customerName: TEST_NAME,
      dvaAccountNumber: inv!.dvaAccountNumber ?? undefined,
      dvaBankName: inv!.dvaBankName ?? undefined,
    });
    const webhookRes = await fireWebhook(payload);
    captured.webhookLogId = webhookRes.logId!;
    await pollWebhookLog(captured.webhookLogId);

    // Give the fire-and-forget notification a moment to land the
    // thank-you email (so the CRM timeline has an email item).
    await new Promise((r) => setTimeout(r, 1000));
  }, 90_000);

  afterAll(async () => {
    await purgeTestRows();
    await db.$disconnect();
  }, 60_000);

  // ── S1: Admin login ──────────────────────────────────────────
  it("S1: POST /api/admin/login returns 200 + sets okomba_admin cookie + persists AdminSession row", async () => {
    const req = new Request("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.20",
      },
      body: JSON.stringify({
        email: "admin@okomba.com",
        password: "okomba-admin-2025",
      }),
    });
    const res = await adminLoginPost(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie.length).toBeGreaterThan(0);
    expect(setCookie).toContain(`${ADMIN_COOKIE_NAME}=`);
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(setCookie.toLowerCase()).toContain("samesite=lax");

    const match = setCookie.match(new RegExp(`${ADMIN_COOKIE_NAME}=([^;]+)`));
    expect(match).not.toBeNull();
    const cookieVal = match![1];
    expect(cookieVal.length).toBeGreaterThan(10);
    captured.adminCookie = cookieVal;

    // Verify an AdminSession row was created in the DB.  The DB
    // stores the SHA-256 hash of the cookie value (Phase 27 audit
    // fix) — not the raw cookie value.
    const { createHash } = await import("node:crypto");
    const expectedHash = createHash("sha256")
      .update(cookieVal, "utf8")
      .digest("hex");
    const session = await db.adminSession.findUnique({
      where: { token: expectedHash },
    });
    expect(session).not.toBeNull();
    expect(session?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    captured.adminSessionTokenHash = expectedHash;
  }, 15_000);

  // ── S2: Admin views inquiries stats ─────────────────────────
  it("S2: GET /api/inquiries?stats=1 (with admin cookie) returns stats including our test inquiry", async () => {
    if (!captured.adminCookie) {
      throw new Error("S1 must run before S2 — adminCookie missing");
    }
    const req = new Request("http://localhost:3000/api/inquiries?stats=1", {
      method: "GET",
      headers: { Cookie: `${ADMIN_COOKIE_NAME}=${captured.adminCookie}` },
    });
    const res = await inquiriesGet(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      stats: { total: number; new: number; contacted: number; last7Days: number };
    };
    expect(body.ok).toBe(true);
    expect(body.stats.total).toBeGreaterThanOrEqual(1);
    expect(body.stats.new).toBeGreaterThanOrEqual(1);
    expect(body.stats.last7Days).toBeGreaterThanOrEqual(1);
  }, 10_000);

  // ── S3: Admin views inquiries list ───────────────────────────
  it("S3: GET /api/inquiries (with admin cookie) returns the inquiries list with our test inquiry present", async () => {
    if (!captured.adminCookie || !captured.inquiryId) {
      throw new Error("S1 + beforeAll must run before S3");
    }
    const req = new Request("http://localhost:3000/api/inquiries", {
      method: "GET",
      headers: { Cookie: `${ADMIN_COOKIE_NAME}=${captured.adminCookie}` },
    });
    const res = await inquiriesGet(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      inquiries: {
        id: string;
        name: string;
        email: string;
        service: string;
        message: string;
        status: string;
      }[];
    };
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.inquiries)).toBe(true);
    const found = body.inquiries.find((i) => i.id === captured.inquiryId);
    expect(found).toBeTruthy();
    expect(found?.name).toBe(TEST_NAME);
    expect(found?.email).toBe(TEST_EMAIL);
    expect(found?.service).toBe(TEST_SERVICE);
    expect(found?.message).toBe(TEST_MESSAGE);
  }, 10_000);

  // ── S4: covered by beforeAll sendProposal call ───────────────
  it("S4: (covered by beforeAll) the invoice exists in the DB with the right shape", async () => {
    const inv = await db.invoice.findUnique({ where: { id: captured.invoiceId } });
    expect(inv).not.toBeNull();
    expect(inv?.customerEmail).toBe(TEST_EMAIL);
    expect(inv?.customerName).toBe(TEST_NAME);
    expect(inv?.status).toBe("paid"); // flipped by the webhook in beforeAll
    expect(inv?.paidAt).not.toBeNull();
    expect(inv?.secureToken).toBeTruthy();
    expect(inv?.paystackReference).toMatch(/^OKM-INV-/);
  }, 10_000);

  // ── S5: Admin views invoices ─────────────────────────────────
  it("S5: GET /api/admin/invoices (with admin cookie) returns the invoices list with our test invoice present", async () => {
    if (!captured.adminCookie || !captured.invoiceId) {
      throw new Error("S1 + S4 must run before S5");
    }
    const req = new Request("http://localhost:3000/api/admin/invoices", {
      method: "GET",
      headers: { Cookie: `${ADMIN_COOKIE_NAME}=${captured.adminCookie}` },
    });
    const res = await adminInvoicesGet(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      invoices: {
        id: string;
        invoiceNumber: string;
        customerName: string;
        customerEmail: string;
        service: string;
        amountNaira: number;
        status: string;
        paidAt: string | null;
      }[];
    };
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.invoices)).toBe(true);
    const found = body.invoices.find((i) => i.id === captured.invoiceId);
    expect(found).toBeTruthy();
    expect(found?.customerName).toBe(TEST_NAME);
    expect(found?.customerEmail).toBe(TEST_EMAIL);
    expect(found?.service).toBe(TEST_SERVICE);
    expect(found?.amountNaira).toBe(1_200_000);
    expect(found?.status).toBe("paid");
    expect(found?.paidAt).not.toBeNull();
  }, 10_000);

  // ── S6: Admin views payments ────────────────────────────────
  it("S6: GET /api/admin/payments (with admin cookie) shows the paid invoice + charge.success webhook log", async () => {
    if (!captured.adminCookie || !captured.invoiceId || !captured.webhookLogId) {
      throw new Error("S1 + beforeAll must run before S6");
    }
    const req = new Request("http://localhost:3000/api/admin/payments", {
      method: "GET",
      headers: { Cookie: `${ADMIN_COOKIE_NAME}=${captured.adminCookie}` },
    });
    const res = await adminPaymentsGet(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      logs: { id: string; status: string; invoiceId: string | null }[];
      paidInvoices: {
        id: string;
        invoiceNumber: string;
        customerEmail: string;
      }[];
      kickoffEvents: { relatedInvoiceId: string | null }[];
    };
    expect(body.ok).toBe(true);

    const paid = body.paidInvoices.find((p) => p.id === captured.invoiceId);
    expect(paid).toBeTruthy();
    expect(paid?.customerEmail).toBe(TEST_EMAIL);

    const log = body.logs.find((l) => l.id === captured.webhookLogId);
    expect(log).toBeTruthy();
    expect(log?.status).toBe("processed");
    expect(log?.invoiceId).toBe(captured.invoiceId);

    const kickoff = body.kickoffEvents.find(
      (k) => k.relatedInvoiceId === captured.invoiceId
    );
    expect(kickoff).toBeTruthy();
  }, 10_000);

  // ── S7: Admin views CRM customer ─────────────────────────────
  it("S7: GET /api/admin/customers + /api/admin/customers/[id] (with admin cookie) shows the customer + timeline", async () => {
    if (!captured.adminCookie || !captured.customerId) {
      throw new Error("S1 + beforeAll must run before S7");
    }
    const listReq = new Request("http://localhost:3000/api/admin/customers", {
      method: "GET",
      headers: { Cookie: `${ADMIN_COOKIE_NAME}=${captured.adminCookie}` },
    });
    const listRes = await adminCustomersGet(listReq);
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as {
      ok: boolean;
      customers: {
        id: string;
        name: string;
        email: string;
        stats: {
          inquiries: number;
          invoices: number;
          emails: number;
        };
      }[];
      total: number;
    };
    expect(listBody.ok).toBe(true);
    const cust = listBody.customers.find((c) => c.email === TEST_EMAIL);
    expect(cust).toBeTruthy();
    expect(cust?.name).toBe(TEST_NAME);
    expect(cust?.stats.inquiries).toBeGreaterThanOrEqual(1);
    expect(cust?.stats.invoices).toBeGreaterThanOrEqual(1);
    expect(cust?.stats.emails).toBeGreaterThanOrEqual(1);

    // Detail endpoint — full timeline
    const detailReq = new Request(
      `http://localhost:3000/api/admin/customers/${captured.customerId}`,
      {
        method: "GET",
        headers: { Cookie: `${ADMIN_COOKIE_NAME}=${captured.adminCookie}` },
      }
    );
    const detailRes = await adminCustomerDetailGet(detailReq, {
      params: Promise.resolve({ id: captured.customerId }),
    });
    expect(detailRes.status).toBe(200);
    const detailBody = (await detailRes.json()) as {
      ok: boolean;
      customer: { id: string; email: string };
      timeline: { kind: string }[];
      stats: {
        inquiries: number;
        invoices: number;
        paidInvoices: number;
        emails: number;
      };
    };
    expect(detailBody.ok).toBe(true);
    expect(detailBody.customer.email).toBe(TEST_EMAIL);

    // Timeline contains an inquiry + invoice + email item.
    const kinds = detailBody.timeline.map((t) => t.kind);
    expect(kinds).toContain("inquiry");
    expect(kinds).toContain("invoice");
    expect(kinds).toContain("email");

    // Stats reflect the engagement.
    expect(detailBody.stats.inquiries).toBeGreaterThanOrEqual(1);
    expect(detailBody.stats.invoices).toBeGreaterThanOrEqual(1);
    expect(detailBody.stats.paidInvoices).toBeGreaterThanOrEqual(1);
    expect(detailBody.stats.emails).toBeGreaterThanOrEqual(2);
  }, 15_000);

  // ── S8: Admin logout ─────────────────────────────────────────
  it("S8: POST /api/admin/logout invalidates the session (cookie cleared + DB row deleted + next request 401)", async () => {
    if (!captured.adminCookie || !captured.adminSessionTokenHash) {
      throw new Error("S1 must run before S8 — adminCookie / sessionHash missing");
    }
    const req = new Request("http://localhost:3000/api/admin/logout", {
      method: "POST",
      headers: { Cookie: `${ADMIN_COOKIE_NAME}=${captured.adminCookie}` },
    });
    const res = await adminLogoutPost(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);

    // Set-Cookie should clear the cookie (maxAge=0).
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${ADMIN_COOKIE_NAME}=`);
    expect(setCookie.toLowerCase()).toContain("max-age=0");

    // DB row should be deleted.
    const session = await db.adminSession.findUnique({
      where: { token: captured.adminSessionTokenHash },
    });
    expect(session).toBeNull();

    // Subsequent admin request with the now-invalidated cookie 401s.
    const followReq = new Request("http://localhost:3000/api/admin/invoices", {
      method: "GET",
      headers: { Cookie: `${ADMIN_COOKIE_NAME}=${captured.adminCookie}` },
    });
    const followRes = await adminInvoicesGet(followReq);
    expect(followRes.status).toBe(401);
  }, 10_000);
});
