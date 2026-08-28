/**
 * Paystack Reference Minting Test (GAP-A fix)
 * ============================================
 *
 * Task ID: B3 (Batch 3, scenario S8) — Master Directive §5 + §6 +
 * B2 deep-trace finding "GAP-A".  Closes the #2 medium-severity gap
 * surfaced by the Batch 2 deep-trace of the Paystack flow:
 *
 *   GAP-A (🟡 medium, documented in B2): paystackReference was NEVER
 *   written at invoice creation in production code (src/lib/invoice-
 *   service.ts omitted it from the db.invoice.create() call).  The
 *   Paystack Dedicated Virtual Account (DVA) API does NOT return a
 *   per-invoice reference — DVAs are per-customer, not per-invoice —
 *   so the webhook handler's primary lookup (findUnique by reference)
 *   was dead code in production for bank-transfer payments.
 *
 * The B3 GAP-A fix:
 *   1. src/lib/paystack.ts: `createInvoiceDva()` mints a deterministic
 *      `OKM-{invoiceNumber}` reference in sandbox mode + a unique
 *      `OKM-{invoiceNumber}-{Date.now()}` reference in real-Paystack
 *      mode (returned as a new `reference` field on `DvaResult`).
 *   2. src/lib/invoice-service.ts: persists `paystackReference:
 *      dva.reference` to the invoice row at creation time.  The
 *      @unique DB constraint at `prisma/schema.prisma:260` is now
 *      exercised at the production data level.
 *
 * ─── What does this test verify? ───────────────────────────────────
 *   S8a  createInvoiceDva() returns a non-null `reference` string
 *        on the DvaResult (the field exists + is truthy).
 *   S8b  Sandbox reference follows the OKM-{invoiceNumber} format
 *        exactly — deterministic per invoice.
 *   S8c  Idempotent: calling createInvoiceDva twice with the SAME
 *        invoiceNumber mints the SAME reference (sandbox mode is
 *        the deterministic path; the real-Paystack path uses
 *        Date.now() so it differs per attempt by design).
 *   S8d  Distinct invoiceNumbers mint distinct references (the
 *        @unique DB constraint is therefore satisfiable).
 *   S8e  The sandbox flag is `true` when PAYSTACK_SECRET_KEY is unset
 *        (the dev / pre-launch / CI path).
 *   S8f  The reference is correctly attached to the FULL DvaResult
 *        (accountNumber + bankName + accountName + reference all
 *        present + consistent).
 *
 * ─── How does this verify the REAL production code? ────────────────
 * This test calls the REAL `createInvoiceDva()` from
 * `src/lib/paystack.ts` — the same function `src/lib/invoice-
 * service.ts:79` calls.  In CI (where PAYSTACK_SECRET_KEY is unset)
 * the function returns the SANDBOX path; this exercises the EXACT
 * code path the dev / pre-launch environment uses.  The real-Paystack
 * path's minting logic (`OKM-{invoiceNumber}-{Date.now()}`) is
 * exercised at the type / lint / line-coverage level — the production
 * code is shared between the two paths modulo the Date.now() suffix.
 *
 * ─── Design choices ────────────────────────────────────────────────
 *   - Uses `bun:test` (same harness as B1-A + B1-C).
 *   - Zero DB / zero network / zero env vars required — runs in CI.
 *   - beforeAll/afterAll save+restore PAYSTACK_SECRET_KEY so the test
 *     does not leak env state to other tests.
 *   - Does NOT verify the @unique DB constraint is honoured at the
 *     row level — that's B1-A's S3 (which creates two invoices with
 *     the same reference and expects a Prisma UniqueConstraint
 *     violation).  This test focuses on the minting contract.
 */
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { createInvoiceDva, type DvaResult } from "@/lib/paystack";

// ─── Test environment guard ─────────────────────────────────────────
// Save the original env so we can restore it after the test.  The
// sandbox path is taken when PAYSTACK_SECRET_KEY is unset — we
// force-unset it for the duration of the suite so the test is
// deterministic regardless of the host's env.
const ORIGINAL_SECRET = process.env.PAYSTACK_SECRET_KEY;

describe("GAP-A fix (B3, scenario S8): createInvoiceDva mints a paystackReference", () => {
  beforeAll(() => {
    delete process.env.PAYSTACK_SECRET_KEY;
  });

  afterAll(() => {
    if (ORIGINAL_SECRET !== undefined) {
      process.env.PAYSTACK_SECRET_KEY = ORIGINAL_SECRET;
    } else {
      delete process.env.PAYSTACK_SECRET_KEY;
    }
  });

  // ── S8a: non-null reference field ────────────────────────────────
  it("S8a: createInvoiceDva returns a non-null, non-empty reference string", async () => {
    const dva: DvaResult = await createInvoiceDva({
      name: "Ada Okonkwo",
      email: "ada@example.com",
      phone: "+234 803 555 0142",
      invoiceNumber: "INV-OKM-TEST-S8A-001",
    });

    expect(dva.reference).toBeTruthy();
    expect(typeof dva.reference).toBe("string");
    expect(dva.reference.length).toBeGreaterThan(0);
  });

  // ── S8b: OKM-{invoiceNumber} format in sandbox mode ────────────
  it("S8b: sandbox reference follows the OKM-{invoiceNumber} format (deterministic)", async () => {
    // Use a realistic production invoice-number format
    // (INV-YYYY-NNNN) so the regex assertion matches real-world
    // persistence patterns.
    const invoiceNumber = "INV-2026-0042";
    const dva = await createInvoiceDva({
      name: "Chidi Eze",
      email: "chidi@example.com",
      phone: null,
      invoiceNumber,
    });

    // Exact format: OKM-{invoiceNumber} — no timestamp in sandbox
    // mode so re-runs of the pipeline produce the same persisted
    // paystackReference (avoids @unique-constraint violations).
    expect(dva.reference).toBe(`OKM-${invoiceNumber}`);
    expect(dva.reference).toMatch(/^OKM-INV-\d{4}-\d{4}$/);
  });

  // ── S8c: idempotency — same invoiceNumber → same reference ──────
  it("S8c: idempotent — calling createInvoiceDva twice with the same invoiceNumber mints the same reference", async () => {
    const invoiceNumber = "INV-OKM-TEST-S8C-001";
    const client = {
      name: "Funke Adeyemi",
      email: "funke-s8c@example.com",
      phone: "+234 801 111 1111",
      invoiceNumber,
    };

    const dva1 = await createInvoiceDva(client);
    const dva2 = await createInvoiceDva(client);

    expect(dva1.reference).toBe(dva2.reference);
    // Both should match the OKM-{invoiceNumber} format.
    expect(dva1.reference).toBe(`OKM-${invoiceNumber}`);
    expect(dva2.reference).toBe(`OKM-${invoiceNumber}`);
  });

  // ── S8d: distinct invoiceNumbers → distinct references ──────────
  it("S8d: distinct invoiceNumbers mint distinct references (@unique constraint satisfiable)", async () => {
    const dva1 = await createInvoiceDva({
      name: "Client One",
      email: "one-s8d@example.com",
      phone: null,
      invoiceNumber: "INV-OKM-TEST-S8D-001",
    });
    const dva2 = await createInvoiceDva({
      name: "Client Two",
      email: "two-s8d@example.com",
      phone: null,
      invoiceNumber: "INV-OKM-TEST-S8D-002",
    });

    expect(dva1.reference).not.toBe(dva2.reference);
    expect(dva1.reference).toBe("OKM-INV-OKM-TEST-S8D-001");
    expect(dva2.reference).toBe("OKM-INV-OKM-TEST-S8D-002");
  });

  // ── S8e: sandbox flag is true when no secret is set ─────────────
  it("S8e: sandbox flag is true when PAYSTACK_SECRET_KEY is unset (dev / pre-launch / CI path)", async () => {
    const dva = await createInvoiceDva({
      name: "Sandbox Probe",
      email: "sandbox-s8e@example.com",
      phone: null,
      invoiceNumber: "INV-OKM-TEST-S8E-001",
    });

    expect(dva.sandbox).toBe(true);
    // Sandbox DVAs carry the labelled bank name to avoid being
    // mistaken for real payment details.
    expect(dva.bankName).toContain("Sandbox");
  });

  // ── S8f: full DvaResult contract ────────────────────────────────
  it("S8f: DvaResult carries accountNumber + bankName + accountName + reference + sandbox all together", async () => {
    const dva = await createInvoiceDva({
      name: "Full Result Probe",
      email: "full-s8f@example.com",
      phone: "+234 803 555 0142",
      invoiceNumber: "INV-OKM-TEST-S8F-001",
    });

    // All five fields are populated — the invoice-service.ts
    // create() call writes accountNumber + bankName + reference
    // (and accountName is rendered in the email DVA box).
    expect(dva.accountNumber).toBeTruthy();
    expect(dva.bankName).toBeTruthy();
    expect(dva.accountName).toBe("Okomba Analytics"); // per brand spec
    expect(dva.reference).toBeTruthy();
    expect(dva.sandbox).toBe(true);

    // The account number is a 10-digit NUBAN-style string.
    expect(dva.accountNumber).toMatch(/^\d{10}$/);
  });
});
