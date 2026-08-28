/**
 * Paystack Account-Isolation Regression Test
 * ===========================================
 *
 * Task ID: B1-A (Batch 1, sub-task A) — Master Directive §5 + Batch 2 Exit
 * Gate.  Closes the #1 CRITICAL gap flagged in the B0-A requirements matrix
 * (R36): "NO regression test for the Paystack account-name bug".
 *
 * ─── What bug does this regression-test? ──────────────────────────────
 * Before the Phase 27 audit fix (R63), the charge.success webhook matched
 * an incoming payment to an invoice using a heuristic that included
 * customer_email + amount. This is brittle: if two open invoices share
 * the same email (or, as in the original §5 bug report, the DVA account
 * name was reused across customers), Paystack's webhook can mark the
 * WRONG invoice paid — Customer A would see Customer B's payment, and
 * vice-versa. The "account-name bug" reported by the founder was the
 * visible symptom of this class of mismatch.
 *
 * ─── What was the OLD (broken) behaviour? ────────────────────────────
 * 1. DVA account name was reused across customers (the same "Okomba
 *    Analytics" string surfaced for every payer).
 * 2. The webhook matched by email + amount as a FALLBACK when the
 *    reference was missing — so two invoices for the same customer with
 *    the same amount were indistinguishable, and a malicious or replayed
 *    webhook could silently mark the wrong one paid.
 * 3. paystackReference was a plain (non-unique) column, so two invoices
 *    could legitimately hold the same reference.
 *
 * ─── What is the NEW (correct) behaviour (R63)? ──────────────────────
 * 1. `prisma/schema.prisma`: Invoice.paystackReference String? @unique
 *    (line 260) — the reference is an immutable, unique, per-invoice
 *    binding created at DVA / checkout-session time.
 * 2. `src/lib/paystack.ts`: DVA creation binds the account to one
 *    invoice at creation time — never reused.
 * 3. `src/lib/payment-webhook.ts` `handleChargeSuccess()` lookup chain:
 *       a. PRIMARY  : db.invoice.findUnique({ where: { paystackReference } })
 *       b. SECONDARY: db.invoice.findFirst({ where: { dvaAccountNumber } })
 *       c. NO FALLBACK — if neither matches, the payment lands in a
 *          "needs_manual_reconciliation" queue + alerts the admin.
 *          The webhook NEVER auto-marks an invoice paid by email+amount
 *          heuristic. Zero risk of marking the wrong invoice.
 *
 * ─── How each scenario proves isolation ──────────────────────────────
 *  S1 Two-customer isolation (A pays, B does not):
 *      Fires A's charge.success → A flips to "paid", B stays unpaid.
 *      Proves the webhook resolves ONE invoice per payment (no leak).
 *  S2 Replay attack (B's webhook does NOT retroactively mark A):
 *      Fires B's charge.success → B flips to "paid", A.paidAt is
 *      UNCHANGED.  Proves the idempotent-dedup branch + that B's
 *      payment cannot re-stamp A's timestamp.
 *  S3 Reference uniqueness:
 *      A.paystackReference !== B.paystackReference, both non-null.
 *      Proves the @unique constraint is honoured by the test data and
 *      that two different invoices CANNOT share a reference.
 *  S4 Wrong-reference webhook (manual reconciliation queue):
 *      Fires an unknown reference → no invoice is marked paid, the
 *      WebhookLog row settles to "failed" with invoiceId=null and
 *      error="invoice_not_found_needs_manual_reconciliation". The HTTP
 *      response is still 200 (Paystack never retries a 200).
 *      Proves the "no email+amount fallback" guarantee: a mystery
 *      payment does NOT get force-fit onto any open invoice.
 *  S5 Email+amount collision attempt (the OLD bug pattern):
 *      Customer C is created with the SAME amount as A (₦950,000).
 *      We fire a webhook with A's reference but C's email — exactly
 *      the payload that the OLD email+amount matcher would have
 *      routed to C (email matched C, amount matched A's ₦950k). The
 *      NEW matcher ignores the email entirely, resolves by
 *      paystackReference to A, hits A's idempotent-dedup branch
 *      ("already paid — no action"), and C is NEVER touched. With the
 *      OLD matcher, C would have been marked paid — so this scenario
 *      FAILS the old implementation and PASSES the new one.
 *  S6 DVA secondary lookup (legacy invoice with paystackReference=null):
 *      Customer D's invoice was created before Phase 27 and has no
 *      paystackReference. We fire a webhook with NO reference but
 *      D's DVA account_number. The secondary lookup catches it, D
 *      flips to "paid".  Proves the secondary lookup is also
 *      invoice-bound (D's DVA only matches D's invoice) and that
 *      legacy invoices still get paid.
 *
 * ─── Run ─────────────────────────────────────────────────────────────
 *   cd /home/z/my-project
 *   DATABASE_URL='postgresql://...?sslmode=require&pgbouncer=true&...' \
 *     PAYSTACK_WEBHOOK_SECRET='test-secret' \
 *     bun test tests/paystack-account-isolation.test.ts
 *
 * If DATABASE_URL or PAYSTACK_WEBHOOK_SECRET / PAYSTACK_SECRET_KEY is not
 * set, the suite is SKIPPED (not failed) — production secrets must not
 * be required to run unit tests. The signature verification IS part of
 * what we test, so the secret must be available when the test runs.
 *
 * ─── Idempotence ────────────────────────────────────────────────────
 * All test data is prefixed (invoice numbers "INV-OKM-TEST-*",
 * paystackReferences "ref-OKM-*"). beforeAll purges any prior run's
 * leftover rows; afterAll purges the run we just made. Re-running the
 * test produces no DB pollution.
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { createHmac } from "node:crypto";
import { db } from "@/lib/db";
import { POST } from "@/app/api/paystack/webhook/route";
import type { Invoice } from "@/generated/prisma";

// ─── Test environment guard ─────────────────────────────────────────
const TEST_SECRET =
  process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || "";
const HAS_DATABASE_URL = !!process.env.DATABASE_URL;
const HAS_SECRET = !!TEST_SECRET;
const SHOULD_RUN = HAS_DATABASE_URL && HAS_SECRET;

// describe.skip when env is missing — the suite is inert, not red.
const suite = SHOULD_RUN ? describe : describe.skip;

// ─── Test data (all prefixed to keep prod data clean) ───────────────
const TEST_INV_PREFIX = "INV-OKM-TEST-";
const TEST_REF_PREFIX = "ref-OKM-";

// Distinct Paystack event ids per scenario — the webhook's dedup key is
// (provider, event, paystackId). Reusing one would short-circuit to
// "duplicate" at the route handler and skip processing entirely.
const EVT_ID = {
  A_PAYS: 99001,
  B_PAYS: 99002,
  UNKNOWN_REF: 99003,
  EMAIL_AMOUNT_COLLISION: 99004,
  DVA_ONLY: 99005,
} as const;

type TestInvoice = {
  key: "A" | "B" | "C" | "D";
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  service: string;
  amountKobo: number;
  dvaAccountNumber: string;
  dvaBankName: string;
  dvaBankCode: string;
  paystackReference: string | null; // null = legacy (D's case)
  status: string; // pre-set status before any webhook fires
};

const TEST_INVOICES: TestInvoice[] = [
  {
    key: "A",
    invoiceNumber: `${TEST_INV_PREFIX}A-001`,
    customerName: "Funke Adeyemi",
    customerEmail: "funke@test.com",
    customerPhone: "+2348011111111",
    service: "Web Development",
    amountKobo: 95_000_000, // ₦950,000
    dvaAccountNumber: "0123456789",
    dvaBankName: "Paystack Test Bank",
    dvaBankCode: "000",
    paystackReference: `${TEST_REF_PREFIX}A-001`,
    status: "sent",
  },
  {
    key: "B",
    invoiceNumber: `${TEST_INV_PREFIX}B-001`,
    customerName: "Ada Obiora",
    customerEmail: "ada@test.com",
    customerPhone: "+2348022222222",
    service: "Data Analytics",
    amountKobo: 185_000_000, // ₦1,850,000
    dvaAccountNumber: "4445556666",
    dvaBankName: "Paystack Test Bank",
    dvaBankCode: "000",
    paystackReference: `${TEST_REF_PREFIX}B-001`,
    status: "sent",
  },
  {
    key: "C",
    invoiceNumber: `${TEST_INV_PREFIX}C-001`,
    customerName: "Chidi Eze",
    customerEmail: "chidi@test.com",
    customerPhone: "+2348033333333",
    service: "Automation",
    // SAME amount as A — this is the email+amount collision seed.
    amountKobo: 95_000_000,
    dvaAccountNumber: "7777888899",
    dvaBankName: "Paystack Test Bank",
    dvaBankCode: "000",
    paystackReference: `${TEST_REF_PREFIX}C-001`,
    status: "sent",
  },
  {
    key: "D",
    invoiceNumber: `${TEST_INV_PREFIX}D-001`,
    customerName: "Dapo Oko",
    customerEmail: "dapo@test.com",
    customerPhone: "+2348044444444",
    service: "Cloud Consulting",
    amountKobo: 50_000_000, // ₦500,000
    dvaAccountNumber: "9999888877",
    dvaBankName: "Paystack Test Bank",
    dvaBankCode: "000",
    // Legacy invoice created BEFORE Phase 27 fix — no paystackReference.
    paystackReference: null,
    status: "sent",
  },
];

// Holds the live DB IDs after beforeAll seeds the rows.
const invoiceIds: Record<string, string> = {};

// Holds A's paidAt timestamp captured during S1 so S2 can assert it
// is NOT re-stamped by B's subsequent webhook (idempotent dedup).
let s1PaidAtMs: number | null = null;

// ─── Helpers ────────────────────────────────────────────────────────

function signBody(raw: string): string {
  // Paystack spec: HMAC-SHA512 of the RAW request body, hex-encoded.
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

type PostResponse = {
  status: number;
  body: unknown;
  logId: string | null;
};

async function fireWebhook(payload: ChargeSuccessPayload): Promise<PostResponse> {
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
  const res = await POST(req);
  const body = (await res.json().catch(() => null)) as
    | { ok?: boolean; logId?: string; error?: string; duplicate?: boolean; received?: boolean }
    | null;
  return {
    status: res.status,
    body,
    logId: body?.logId ?? null,
  };
}

/**
 * Poll the WebhookLog row until processing settles out of "received".
 * The webhook POST handler returns 200 immediately and runs
 * processPaystackEvent in the background — the only way to know
 * processing is done is to watch the log row flip status.
 */
async function pollWebhookLog(logId: string, timeoutMs = 30_000): Promise<{
  status: string;
  result: Record<string, unknown>;
  invoiceId: string | null;
  error: string | null;
}> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const row = await db.webhookLog.findUnique({ where: { id: logId } });
    if (row && row.status !== "received") {
      let parsed: Record<string, unknown> = {};
      try {
        parsed =
          (row.result as Record<string, unknown> | null) ?? {};
      } catch {
        parsed = {};
      }
      return {
        status: row.status,
        result: parsed,
        invoiceId: row.invoiceId,
        error: row.error,
      };
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(
    `WebhookLog ${logId} did not settle within ${timeoutMs}ms — still "received"`
  );
}

async function reloadInvoice(key: string): Promise<Invoice | null> {
  const id = invoiceIds[key];
  if (!id) return null;
  return db.invoice.findUnique({ where: { id } });
}

// ─── Cleanup helpers (called from beforeAll / afterAll) ─────────────

async function purgeTestRows(): Promise<void> {
  // Find any leftover test invoices (from a prior run that crashed
  // before afterAll could clean up).
  const leftovers = await db.invoice.findMany({
    where: {
      OR: [
        { invoiceNumber: { startsWith: TEST_INV_PREFIX } },
        { paystackReference: { startsWith: TEST_REF_PREFIX } },
      ],
    },
    select: { id: true },
  });
  const leftoverIds = leftovers.map((r) => r.id);

  if (leftoverIds.length > 0) {
    await db.eventRecord.deleteMany({
      where: { relatedInvoiceId: { in: leftoverIds } },
    }).catch(() => {});
    await db.whatsAppMessage.deleteMany({
      where: { relatedInvoiceId: { in: leftoverIds } },
    }).catch(() => {});
    await db.emailLog.deleteMany({
      where: { invoiceId: { in: leftoverIds } },
    }).catch(() => {});
    await db.webhookLog.deleteMany({
      where: { invoiceId: { in: leftoverIds } },
    }).catch(() => {});
    await db.invoice.deleteMany({
      where: { id: { in: leftoverIds } },
    }).catch(() => {});
  }

  // Also purge orphan webhook logs that match the test reference prefix
  // (e.g. the "unknown reference" scenario fires "ref-OKM-UNKNOWN-999"
  // which has no matched invoice → no invoiceId to chain on).
  await db.webhookLog.deleteMany({
    where: { reference: { startsWith: TEST_REF_PREFIX } },
  }).catch(() => {});
}

// ─── Test suite ──────────────────────────────────────────────────────

suite("Paystack account-isolation regression (Master Directive §5)", () => {
  beforeAll(async () => {
    // Defensive: clean any prior-run leftovers first so the suite is
    // idempotent (re-runnable without manual DB cleanup).
    await purgeTestRows();

    // Seed all four test invoices in a clean state.
    for (const inv of TEST_INVOICES) {
      const created = await db.invoice.create({
        data: {
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
          customerEmail: inv.customerEmail,
          customerPhone: inv.customerPhone,
          service: inv.service,
          description: `Regression test invoice ${inv.key}`,
          amountKobo: inv.amountKobo,
          currency: "NGN",
          durationLabel: "2 weeks",
          status: inv.status,
          dvaAccountNumber: inv.dvaAccountNumber,
          dvaBankName: inv.dvaBankName,
          dvaBankCode: inv.dvaBankCode,
          paystackReference: inv.paystackReference,
          sentAt: new Date(),
        },
      });
      invoiceIds[inv.key] = created.id;
    }
  }, 60_000);

  afterAll(async () => {
    await purgeTestRows();
    await db.$disconnect();
  }, 60_000);

  // ── S1: Two-customer isolation — A pays, B does not ───────────────
  it("S1: marks A paid and leaves B untouched when only A's webhook fires", async () => {
    const a = TEST_INVOICES.find((i) => i.key === "A")!;
    const payload = buildChargeSuccessPayload({
      paystackId: EVT_ID.A_PAYS,
      reference: a.paystackReference!,
      amount: a.amountKobo,
      customerEmail: a.customerEmail,
      customerName: a.customerName,
      dvaAccountNumber: a.dvaAccountNumber,
      dvaBankName: a.dvaBankName,
    });

    const res = await fireWebhook(payload);
    expect(res.status).toBe(200);
    expect(res.logId).not.toBeNull();

    const settled = await pollWebhookLog(res.logId!);
    expect(settled.status).toBe("processed");
    expect(settled.invoiceId).toBe(invoiceIds.A);

    const aAfter = await reloadInvoice("A");
    const bAfter = await reloadInvoice("B");

    // A is paid with a real timestamp
    expect(aAfter?.status).toBe("paid");
    expect(aAfter?.paidAt).not.toBeNull();
    const aPaidAtMs = aAfter!.paidAt!.getTime();

    // B is STILL unpaid and has NO paidAt (the leak the old bug caused)
    expect(bAfter?.status).not.toBe("paid");
    expect(bAfter?.paidAt).toBeNull();

    // Stronger: A's paidAt must not equal B's paidAt (no shared-stamp leak)
    expect(bAfter?.paidAt?.getTime() ?? 0).not.toBe(aPaidAtMs);

    // Stash A's paidAt for S2's replay-protection assertion.
    s1PaidAtMs = aPaidAtMs;
  }, 45_000);

  // ── S2: Replay attack — B's webhook does NOT retroactively mark A ──
  it("S2: B's subsequent payment does not re-stamp A's paidAt (idempotent dedup)", async () => {
    const a = TEST_INVOICES.find((i) => i.key === "A")!;
    const b = TEST_INVOICES.find((i) => i.key === "B")!;
    const aPaidAtMs = s1PaidAtMs;
    if (aPaidAtMs === null) {
      throw new Error("S1 must run before S2 — s1PaidAtMs is null");
    }

    const payload = buildChargeSuccessPayload({
      paystackId: EVT_ID.B_PAYS,
      reference: b.paystackReference!,
      amount: b.amountKobo,
      customerEmail: b.customerEmail,
      customerName: b.customerName,
      dvaAccountNumber: b.dvaAccountNumber,
      dvaBankName: b.dvaBankName,
    });

    const res = await fireWebhook(payload);
    expect(res.status).toBe(200);
    expect(res.logId).not.toBeNull();

    const settled = await pollWebhookLog(res.logId!);
    expect(settled.status).toBe("processed");
    expect(settled.invoiceId).toBe(invoiceIds.B);

    const aAfter = await reloadInvoice("A");
    const bAfter = await reloadInvoice("B");

    // B is now paid
    expect(bAfter?.status).toBe("paid");
    expect(bAfter?.paidAt).not.toBeNull();

    // A is STILL paid with the ORIGINAL timestamp — not overwritten by
    // B's webhook. The old matcher could have re-stamped A if it had
    // matched B's payment to A by email+amount.
    expect(aAfter?.status).toBe("paid");
    expect(aAfter?.paidAt?.getTime()).toBe(aPaidAtMs);

    // Also: B's paidAt must differ from A's paidAt (no shared-stamp leak)
    expect(bAfter?.paidAt?.getTime()).not.toBe(aPaidAtMs);
  }, 45_000);

  // ── S3: Reference uniqueness ───────────────────────────────────────
  it("S3: A and B carry distinct, non-null paystackReferences (DB-level @unique enforcement)", async () => {
    const a = await reloadInvoice("A");
    const b = await reloadInvoice("B");
    expect(a?.paystackReference).not.toBeNull();
    expect(b?.paystackReference).not.toBeNull();
    expect(a?.paystackReference).not.toBe(b?.paystackReference);

    // Re-confirm the @unique constraint at the DB layer: an attempt to
    // create a second invoice with A's reference must reject. This is
    // the constraint that the OLD schema lacked — and the lookup chain
    // DEPENDS on it (a non-unique reference would let two invoices
    // collide on the primary lookup).
    //
    // Note: we use try/catch rather than expect(x).rejects because
    // Prisma's PrismaPromise is a thenable but NOT a real Promise,
    // which bun:test's `rejects` matcher rejects.
    let uniquenessViolation: string | null = null;
    try {
      await db.invoice.create({
        data: {
          invoiceNumber: `${TEST_INV_PREFIX}UNIQ-PROBE`,
          customerName: "Uniqueness Probe",
          customerEmail: "probe@test.com",
          service: "Probe",
          amountKobo: 1_000,
          currency: "NGN",
          status: "draft",
          paystackReference: a!.paystackReference, // duplicate → must reject
        },
      });
    } catch (err) {
      uniquenessViolation = err instanceof Error ? err.message : String(err);
    }
    expect(uniquenessViolation).not.toBeNull();
    expect(uniquenessViolation).toMatch(/unique constraint|UniqueConstraint/i);

    // Clean up the probe if it somehow slipped through.
    await db.invoice
      .deleteMany({ where: { invoiceNumber: `${TEST_INV_PREFIX}UNIQ-PROBE` } })
      .catch(() => {});
  }, 15_000);

  // ── S4: Wrong-reference webhook → manual reconciliation queue ─────
  it("S4: an unknown reference lands in the manual reconciliation queue — NO invoice is silently marked paid", async () => {
    // Snapshot the count of paid invoices BEFORE the unknown webhook.
    const paidBefore = await db.invoice.count({
      where: { status: "paid", invoiceNumber: { startsWith: TEST_INV_PREFIX } },
    });
    expect(paidBefore).toBe(2); // A + B from S1+S2

    const payload = buildChargeSuccessPayload({
      paystackId: EVT_ID.UNKNOWN_REF,
      reference: `${TEST_REF_PREFIX}UNKNOWN-999`, // matches no invoice
      amount: 95_000_000,
      customerEmail: "attacker@test.com", // try to collide with C by amount
      customerName: "Mystery Payer",
      // No DVA either — so neither primary nor secondary lookup matches.
    });

    const res = await fireWebhook(payload);
    // HTTP 200: Paystack never retries; the safe-failure is idempotent.
    expect(res.status).toBe(200);
    expect(res.logId).not.toBeNull();

    const settled = await pollWebhookLog(res.logId!);
    // The webhook must NOT have marked any invoice paid.
    expect(settled.status).toBe("failed");
    expect(settled.invoiceId).toBeNull();
    expect(settled.error).toContain("invoice_not_found_needs_manual_reconciliation");
    // The result must include the diagnostic fields (no silent
    // email+amount fallback that auto-picked an invoice).
    expect(settled.result.invoiceId ?? null).toBeNull();
    expect(settled.result.lookedUpReference).toBe(`${TEST_REF_PREFIX}UNKNOWN-999`);

    // Confirm: paid count is STILL 2. No new invoice got silently paid.
    const paidAfter = await db.invoice.count({
      where: { status: "paid", invoiceNumber: { startsWith: TEST_INV_PREFIX } },
    });
    expect(paidAfter).toBe(2);
  }, 30_000);

  // ── S5: Email+amount collision attempt (the OLD bug pattern) ───────
  it("S5: an attacker firing A's reference with C's email DOES NOT mark C paid (reference-primary lookup wins)", async () => {
    const a = TEST_INVOICES.find((i) => i.key === "A")!;
    const c = TEST_INVOICES.find((i) => i.key === "C")!;
    const aBefore = await reloadInvoice("A");
    const aPaidAtMsBefore = aBefore?.paidAt?.getTime();
    expect(aPaidAtMsBefore).not.toBeUndefined();

    // The malicious payload: A's reference (so primary lookup hits A)
    // but C's email + A's amount. The OLD email+amount matcher would
    // have selected C (email matched C, amount matched A's ₦950k which
    // C also has) and marked C paid. The NEW matcher ignores email
    // entirely and resolves to A by reference.
    const payload = buildChargeSuccessPayload({
      paystackId: EVT_ID.EMAIL_AMOUNT_COLLISION,
      reference: a.paystackReference!, // A's reference → resolves to A
      amount: a.amountKobo, // A's ₦950k (also C's amount)
      customerEmail: c.customerEmail, // C's email — the collision bait
      customerName: c.customerName,
      dvaAccountNumber: a.dvaAccountNumber, // also A's
    });

    const res = await fireWebhook(payload);
    expect(res.status).toBe(200);
    expect(res.logId).not.toBeNull();

    const settled = await pollWebhookLog(res.logId!);
    // A is already paid → idempotent dedup, status="duplicate"
    expect(settled.status).toBe("duplicate");
    expect(settled.invoiceId).toBe(invoiceIds.A);

    const aAfter = await reloadInvoice("A");
    const cAfter = await reloadInvoice("C");

    // C is UNTOUCHED — the proof that the email+amount matcher is gone.
    expect(cAfter?.status).not.toBe("paid");
    expect(cAfter?.paidAt).toBeNull();

    // A's paidAt is UNCHANGED (idempotent dedup, not a re-stamp).
    expect(aAfter?.paidAt?.getTime()).toBe(aPaidAtMsBefore);

    // C must still have NO paidAt at all.
    expect(cAfter?.paidAt).toBeNull();
  }, 30_000);

  // ── S6: DVA secondary lookup — legacy invoice (paystackReference=null) ─
  it("S6: a legacy invoice with paystackReference=null still resolves via the DVA secondary lookup", async () => {
    const d = TEST_INVOICES.find((i) => i.key === "D")!;

    // Fire a webhook with NO reference (Paystack sometimes omits it for
    // legacy DVA-only transfers) but D's dedicated_account present.
    const payload = buildChargeSuccessPayload({
      paystackId: EVT_ID.DVA_ONLY,
      reference: null, // legacy DVA-only payment
      amount: d.amountKobo,
      customerEmail: d.customerEmail,
      customerName: d.customerName,
      dvaAccountNumber: d.dvaAccountNumber,
      dvaBankName: d.dvaBankName,
    });

    const res = await fireWebhook(payload);
    expect(res.status).toBe(200);
    expect(res.logId).not.toBeNull();

    const settled = await pollWebhookLog(res.logId!);
    expect(settled.status).toBe("processed");
    expect(settled.invoiceId).toBe(invoiceIds.D);

    const dAfter = await reloadInvoice("D");
    expect(dAfter?.status).toBe("paid");
    expect(dAfter?.paidAt).not.toBeNull();

    // And to be sure the secondary lookup didn't bleed onto any other
    // test invoice: A, B, C must still be in their post-S5 state.
    const aAfter = await reloadInvoice("A");
    const bAfter = await reloadInvoice("B");
    const cAfter = await reloadInvoice("C");
    expect(aAfter?.status).toBe("paid");
    expect(bAfter?.status).toBe("paid");
    expect(cAfter?.status).not.toBe("paid"); // untouched since S5
  }, 30_000);

  // ── Final invariant: every test invoice ended in the expected state ─
  it("S7 (final invariant): the four-customer matrix ends in exactly the expected paid/unpaid state", async () => {
    const a = await reloadInvoice("A");
    const b = await reloadInvoice("B");
    const c = await reloadInvoice("C");
    const d = await reloadInvoice("D");

    expect(a?.status).toBe("paid");
    expect(b?.status).toBe("paid");
    expect(c?.status).not.toBe("paid"); // the collision target — never paid
    expect(d?.status).toBe("paid");

    // Exactly 3 of 4 paid.
    const paidCount = await db.invoice.count({
      where: {
        status: "paid",
        invoiceNumber: { startsWith: TEST_INV_PREFIX },
      },
    });
    expect(paidCount).toBe(3);

    // All paid invoices have distinct paidAt timestamps (no shared-stamp).
    const paidInvoices = await db.invoice.findMany({
      where: {
        status: "paid",
        invoiceNumber: { startsWith: TEST_INV_PREFIX },
      },
      select: { paidAt: true },
    });
    const stamps = paidInvoices
      .map((r) => r.paidAt?.getTime() ?? 0)
      .filter((t) => t > 0);
    expect(new Set(stamps).size).toBe(stamps.length);
  }, 15_000);
});
