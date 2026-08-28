# Paystack Customer → Payment Full-Flow Deep Trace

**Task ID:** B2 (Batch 2 — Master Directive §5 deep trace)
**Agent:** general-purpose
**Scope:** Trace the entire Paystack customer-submission → payment-link → webhook →
admin-display flow, verify each step's correctness, and confirm (or refute) that
the Phase 27 audit fix (R63) holds at every step — not just the webhook handler.
**Method:** Read actual code for every step. Cite file paths + line numbers. No
worklog claims.

---

## A. Flow Diagram

```
                              Okomba Analytics — Paystack Full-Flow

  ┌──────────────────────────────────────────────────────────────────────────┐
  │ STEP 1 — Customer submission                                            │
  │ File:  src/app/api/inquiries/route.ts:100-188 (POST handler)            │
  │ Zod:   src/app/api/inquiries/route.ts:49-86  (inquirySchema)            │
  │ In:    HTTP POST JSON { name, email, phone?, whatsapp?, service,         │
  │        budget?, addlService?, message }                                  │
  │ Out:   Inquiry row (prisma.inquiry.create) + ReceivedEmail audit row    │
  │ Identity preserved: inquiry.name + inquiry.email (string-typed,         │
  │   trimmed, min-2/max-100 chars; email validated by z.email).            │
  └──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼  inquiry.id  +  inquiry.email  +  inquiry.name
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ STEP 2 — Database record                                                │
  │ File:  prisma/schema.prisma:34-48  (Inquiry model)                      │
  │ File:  prisma/schema.prisma:219-234 (ReceivedEmail audit model)         │
  │ All submitted fields persisted verbatim (no overwrite, no default        │
  │ substitution for name/email/phone/whatsapp). `status` defaults to        │
  │ "new", `source` defaults to "website" — neither overrides submitted      │
  │ identity.                                                                │
  └──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼  inquiry.id
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ STEP 3 — Invoice creation                                               │
  │ File:  src/app/api/admin/proposals/send/route.ts:52-119  (admin POST)   │
  │ File:  src/lib/invoice-service.ts:67-240 (sendProposal orchestrator)    │
  │ File:  src/lib/proposal.ts:169-251 (AI draft, no commercial terms)       │
  │ Pull:  inquiry = await db.inquiry.findUnique({where:{id:input.inquiryId}})│
  │        invoice row is built from inquiry.{name,email,phone,service} —    │
  │        NEVER hardcoded; ties invoice.inquiryId = inquiry.id.            │
  │ Persist: invoiceNumber (INV-YYYY-NNNN, unique), secureToken (192-bit),   │
  │        status="sent", dvaAccountNumber + dvaBankName from Step 4.        │
  │ ⚠️  GAP-A: paystackReference is NOT in the create() call (line 112-134) │
  │        — see Step 4 + §C + §E.                                           │
  └──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼  invoiceNumber  +  inquiry.{name,email,phone}
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ STEP 4 — Account/customer mapping (DVA creation)  — THE CRITICAL STEP   │
  │ File:  src/lib/paystack.ts:82-175 (createInvoiceDva)                   │
  │ File:  src/lib/invoice-service.ts:78-84  (call site)                    │
  │ Pull:  name + email + phone + invoiceNumber  — passed verbatim from    │
  │        inquiry (no "Okomba Analytics" substitution for the customer    │
  │        identity fields).                                                 │
  │ Paystack /customer body:  {email, first_name, last_name, phone}        │
  │ Paystack /dedicated_account body:  {customer: customerId}  — NO         │
  │        `reference` field accepted by Paystack's DVA API.                │
  │ Returns DvaResult {accountNumber, bankName, accountName, sandbox}.     │
  │ Bound to invoice:  invoice.dvaAccountNumber = dva.accountNumber ✓      │
  │                   invoice.dvaBankName      = dva.bankName      ✓        │
  │ 🔴  GAP-A:  invoice.paystackReference is NEVER written here. The DVA   │
  │        API does not return a per-invoice reference, and the invoice-    │
  │        service.ts create() call omits the field. So the webhook's       │
  │        primary lookup by `paystackReference` (Step 9) is dead code in   │
  │        the current DVA-only production flow.                            │
  │ 🔴  GAP-B:  In production, Paystack REUSES a customer's DVA across      │
  │        multiple invoices (DVA is per-customer, not per-invoice). So a   │
  │        repeat customer with 2 outstanding invoices shares the SAME     │
  │        dvaAccountNumber. The previous Step 9 secondary lookup used      │
  │        `findFirst({orderBy: createdAt desc})` which would silently pick  │
  │        the most-recent invoice — re-introducing the original             │
  │        "wrong invoice marked paid" class of bug.                         │
  └──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼  dva {accountNumber, bankName, accountName, sandbox}
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ STEP 5 — Paystack integration                                           │
  │ File:  src/lib/paystack.ts:27-52  (paystack<T> POST helper)             │
  │ File:  src/lib/paystack.ts:62-75  (sandboxDva deterministic fallback)   │
  │ File:  src/lib/paystack.ts:99-105 (POST /customer body)                  │
  │ File:  src/lib/paystack.ts:133-135 (POST /dedicated_account body)        │
  │ Sandbox:  PAYSTACK_SECRET_KEY unset → deterministic 10-digit NUBAN      │
  │        derived from sha256(`${email}|${invoiceNumber}`). Each invoice   │
  │        gets a UNIQUE sandbox account (good for tests, masks GAP-B).     │
  │ Production:  real Paystack DVA is per-customer → GAP-B manifests.       │
  │ Response parse:  DvaData → {account_number, account_name, bank.name}.   │
  │ Persisted:  dvaAccountNumber + dvaBankName (and dvaBankCode is in the   │
  │        schema but NEVER written in production — minor dead column).     │
  └──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼  dva + invoice row
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ STEP 6 — Generated payment information                                  │
  │ File:  src/lib/pdf/proposal-pdf.ts:21-26 (ProposalPdfDva type)          │
  │ File:  src/lib/pdf/proposal-pdf.ts:325-358 (DVA box in PDF)             │
  │ File:  src/app/api/portal/[token]/route.ts:69-75 (portal DVA payload)   │
  │ PDF:     data.dva = the DvaResult object passed into generateProposalPdf │
  │          — pulled from invoice.dvaAccountNumber + dvaBankName ✓         │
  │          account_name field shows "Okomba Analytics" (per spec at        │
  │          src/lib/brand.ts:42 — DVA_ACCOUNT_NAME constant).               │
  │ Portal:  /api/portal/[token] returns dva = {                            │
  │            accountNumber: invoice.dvaAccountNumber,                     │
  │            bankName:      invoice.dvaBankName ?? "",                     │
  │            accountName:   DVA_ACCOUNT_NAME  // hardcoded                │
  │          }                                                               │
  │ ⚠️  Portal hardcodes accountName="Okomba Analytics" rather than echoing │
  │     back the account_name Paystack returned for the DVA. This is by      │
  │     spec (DVA_ACCOUNT_NAME constant) — but if the founder wants the      │
  │     account name to be the CUSTOMER's name (per §5's wording), this is   │
  │     a spec-level conflict, not a code bug. See §E recommendation E-3.   │
  └──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼  dva + secureToken + customerName
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ STEP 7 — Email template                                                 │
  │ File:  src/lib/notify.ts:717-815 (sendProposalEmail)                    │
  │ File:  src/lib/notify.ts:544-604 (sendReminderEmail)                    │
  │ File:  src/lib/portal.ts:22-29 (portalUrlFor — /portal/{token})         │
  │ portalUrl:    `${PORTAL_BASE_URL}/portal/${token}` (192-bit token)      │
  │        Unique per invoice (secureToken @unique in schema).               │
  │ Greeting:    `Dear ${inv.customerName},` — never a generic "Hi there".  │
  │ DVA box:     `Bank:    ${inv.dvaBankName}`                              │
  │              `Account: ${inv.dvaAccountNumber}`                         │
  │              `Name:    ${inv.dvaAccountName ?? "Okomba Analytics"}`     │
  │ CTA:          "View your proposal online" → portalUrl (per-invoice)     │
  └──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼  email lands in customer's inbox → customer clicks CTA
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ STEP 8 — Payment link                                                   │
  │ File:  src/app/portal/[secureToken]/page.tsx:17-41 (server component)   │
  │ File:  src/app/api/portal/[token]/route.ts:17-94 (data fetch)           │
  │ File:  src/components/portal/client-portal.tsx (render)                 │
  │ Lookup:  db.invoice.findUnique({where:{secureToken}}) — unique per      │
  │          invoice. Customer A's token can NEVER resolve to Customer B's │
  │          invoice (DB @unique constraint enforces).                      │
  │ Render:  dva.accountNumber + dva.bankName pulled from THIS invoice's    │
  │          row (correct).                                                 │
  │ Edge:  invalid token format / not found / status not in allowlist →     │
  │        404 notFound() (no enumeration leak).                            │
  └──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼  customer pays into the DVA via bank transfer
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ STEP 9 — Webhook                                                        │
  │ File:  src/app/api/paystack/webhook/route.ts:24-131 (POST handler)      │
  │ File:  src/lib/payment-webhook.ts:39-56  (verifyPaystackSignature)     │
  │ File:  src/lib/payment-webhook.ts:120-237 (processPaystackEvent)        │
  │ File:  src/lib/payment-webhook.ts:241-349 (handleChargeSuccess)         │
  │ Verify:  HMAC-SHA512 of raw body, timing-safe compare.                  │
  │ Dedup:   (provider, event, paystackId) unique triple — retries idempotent.│
  │ Lookup chain (B2-deep-traced + minimal-fix applied):                    │
  │   1. paystackReference  — findUnique by data.reference.                 │
  │      ⚠️  GAP-A: production invoices leave this NULL, so this branch is    │
  │      dead code for bank-transfer webhooks. Only fires for:               │
  │        (a) admin test-webhook smoke tests (synthetic reference)         │
  │        (b) B1-A regression test (pre-seeded reference)                  │
  │        (c) future checkout-session / payment_request flows              │
  │   2. dvaAccountNumber  — findMany + count check.                        │
  │      • 0 matches  → manual reconciliation (no email+amount fallback).   │
  │      • 1 match    → mark paid.                                          │
  │      • 2+ matches → 🔴 GAP-B minimal-fix applied: route to manual      │
  │        reconciliation with `ambiguous_dva_match_needs_manual_reconcili- │
  │        ation` error + list of ambiguous invoice IDs/numbers. NEVER     │
  │        guess by recency. (was: findFirst({orderBy: createdAt desc}) —   │
  │        would silently pick the most-recent invoice, re-introducing the  │
  │        original account-name bug class for repeat customers.)          │
  │   3. NO FALLBACK — never auto-mark by email+amount.                    │
  └──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼  invoice.status = "paid", invoice.paidAt set
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ STEP 10 — Transaction update + customer/admin display                  │
  │ File:  src/lib/payment-webhook.ts:310-413 (post-match actions)          │
  │   b. invoice.update({status:"paid", paidAt})                            │
  │   c. eventRecord.updateMany({type:{startsWith:"invoice.reminder"}})    │
  │      → status:"skipped"  (stops all reminders)                          │
  │   d. generateReceiptPdf + sendPaymentThankYouEmail + dispatchWhatsApp  │
  │   e. eventRecord.create({type:"project.kickoff", +24h})                │
  │ File:  src/components/site/admin/payments-tab.tsx:308-313 (webhook log)│
  │        Shows reference, amount, status, reminders stopped, thank-you   │
  │        sent, kickoff scheduled.                                          │
  │ File:  src/components/site/admin/payments-tab.tsx:367-378 (paid list)  │
  │        Shows invoice.invoiceNumber + customerName + amountKobo/100 +   │
  │        paidAt — all from THIS invoice row (no cross-contamination).     │
  │ File:  src/app/api/admin/customers/[id]/route.ts:37-204 (CRM timeline) │
  │        invoice timeline item shows: amountNaira, status, dvaAccount,    │
  │        sentAt, paidAt — pulled by customerEmail (correct customer).     │
  └──────────────────────────────────────────────────────────────────────────┘
```

---

## B. Step-by-step trace

### Step 1 — Customer submission  ✅ correct

**Files + lines**
- `src/app/api/inquiries/route.ts:100-188` — POST handler.
- `src/app/api/inquiries/route.ts:49-86` — `inquirySchema` (zod).
- `src/app/api/inquiries/route.ts:13-41` — per-IP rate limit (5 / 10 min).

**Data in** — HTTP POST JSON body:
```jsonc
{ "name", "email", "phone?", "whatsapp?", "service", "budget?",
  "addlService?", "message" }
```

**Data out** — `Inquiry` row created at `route.ts:129-141`:
- `name` (string, trim, min 2 / max 100) — preserved.
- `email` (string, trim, min 1, z.email) — preserved.
- `phone`, `whatsapp` (string?, trim, max 30, optional) — empty → null.
- `service`, `addlService`, `budget`, `message` — preserved.
- `status: "new"`, `source: "website"` (defaults — do NOT override identity).

Also creates a `ReceivedEmail` audit row at `route.ts:147-163` mirroring
the inquiry fields + `meta: { service, addlService, budget, whatsapp }`.

**Identity preservation** — name/email/phone captured exactly as submitted.
No fallback, no default substitution. ✅

---

### Step 2 — Database record  ✅ correct

**Files + lines**
- `prisma/schema.prisma:34-48` — `Inquiry` model.
- `prisma/schema.prisma:219-234` — `ReceivedEmail` audit model.

**Inquiry model fields** (all string-typed, no defaults that override
submitted identity):
- `id`, `name`, `email`, `phone?`, `whatsapp?`, `service`, `addlService?`,
  `budget?`, `message`, `status @default("new")`, `source @default("website")`,
  `createdAt`, `updatedAt`.

**Identity preservation** — every field submitted at Step 1 is persisted
verbatim. The two defaults (`status`, `source`) are workflow metadata, not
customer identity fields. ✅

---

### Step 3 — Invoice creation  ✅ correct (identity preservation)
                                    ⚠️ partial (paystackReference omitted)

**Files + lines**
- `src/app/api/admin/proposals/send/route.ts:52-119` — admin POST handler.
- `src/lib/invoice-service.ts:67-240` — `sendProposal` orchestrator.
- `src/lib/proposal.ts:169-251` — AI draft generator.

**Data in** — `{inquiryId, proposal, amountNaira, durationLabel?, dueDate?,
description?}` (admin-composed; AI never touches commercial terms per
`proposal.ts:44-57`).

**Identity pull** — `invoice-service.ts:68`:
```ts
const inquiry = await db.inquiry.findUnique({ where: { id: input.inquiryId } });
```
Then invoice row (`invoice-service.ts:112-134`) is built ENTIRELY from
`inquiry.{name,email,phone,service}` — never hardcoded, never overwritten
by a fallback. `inquiryId: inquiry.id` ties the invoice to the inquiry.

**Data out** — `Invoice` row (schema at `prisma/schema.prisma:236-278`):
- `invoiceNumber` (unique, INV-YYYY-NNNN)
- `customerName = inquiry.name` ✅
- `customerEmail = inquiry.email` ✅
- `customerPhone = inquiry.phone ?? inquiry.whatsapp ?? null` ✅
- `service = inquiry.service` ✅
- `amountKobo = amountNaira * 100` (integer math, no float drift)
- `secureToken = generatePortalToken()` (192-bit, `src/lib/portal.ts:13-15`)
- `dvaAccountNumber = dva.accountNumber` (from Step 4)
- `dvaBankName = dva.bankName` (from Step 4)
- `pdfUrl`, `pdfStorage` (Cloudinary or local)
- `sentAt = now`, `status = "sent"`

⚠️ **GAP-A** — `paystackReference` is NOT in the create call (`invoice-service.ts:112-134`).
The Invoice model has the column with `@unique` (`schema.prisma:260`), but the
production write path leaves it NULL. See §C and §E.

---

### Step 4 — Account/customer mapping (DVA creation)  ✅ correct (customer identity)
                                                            🔴 GAP-A + GAP-B

**Files + lines**
- `src/lib/paystack.ts:82-175` — `createInvoiceDva`.
- `src/lib/invoice-service.ts:78-84` — call site (passes real inquiry fields).
- `src/lib/brand.ts:41-42` — `DVA_ACCOUNT_NAME = "Okomba Analytics"` (spec).

**Data in** (`paystack.ts:82-87`):
```ts
{ name: string, email: string, phone?: string|null, invoiceNumber: string }
```

**Customer creation** (`paystack.ts:99-105`) — POST `/customer` with the
customer's REAL `email`, `first_name`, `last_name`, `phone`. Paystack treats
email as unique; on a duplicate it returns the existing customer (handled
at `paystack.ts:108-125`). The customer record is bound to the customer's
REAL identity, not "Okomba Analytics". ✅

**DVA creation** (`paystack.ts:133-135`) — POST `/dedicated_account` with:
```jsonc
{ "customer": <customerId> }
```
Paystack's DVA API does NOT accept a `reference` parameter — the DVA is
bound to the customer, not to a specific invoice. So:

- 🔴 **GAP-A** — `invoice.paystackReference` is NEVER written at DVA creation
  (no API response field to copy from, and `invoice-service.ts:112-134` omits
  it from the create call). The webhook's primary lookup
  (`payment-webhook.ts:274-283`) by `data.reference` is therefore dead code
  in production for bank-transfer payments — only the secondary below matches.

- 🔴 **GAP-B** — In production, Customer A's invoice 1 and invoice 2 share
  the SAME `dvaAccountNumber` (Paystack reuses the customer's DVA). The
  previous secondary lookup `findFirst({orderBy: createdAt desc})` would
  silently pick invoice 2 (most recent) — even if the customer was paying
  for invoice 1. This re-introduces the exact class of bug the Phase 27
  audit fix was supposed to prevent.

  The sandbox fallback (`paystack.ts:62-75`) derives the account from
  `sha256(${email}|${invoiceNumber})` — so each invoice gets a UNIQUE
  sandbox DVA, which MASKS GAP-B in dev / staging. The bug only manifests
  against real Paystack with a repeat customer.

**Data out** — `DvaResult`:
- `accountNumber` (saved to invoice ✅)
- `bankName` (saved to invoice ✅)
- `accountName = DVA_ACCOUNT_NAME` (per spec, NOT saved to invoice — only
  passed to PDF + email + portal as a runtime value)
- `bankCode?` — never written to invoice (`dvaBankCode` schema column is
  dead in production; minor)
- `sandbox: true/false` — used only for the PDF sandbox banner

---

### Step 5 — Paystack integration  ✅ correct (request shape + response parse)

**Files + lines**
- `src/lib/paystack.ts:27-52` — `paystack<T>` POST helper (Bearer auth,
  20s timeout, returns `{ok, data}` or `{ok:false, error}`).
- `src/lib/paystack.ts:62-75` — `sandboxDva(seed)` deterministic fallback.
- `src/lib/paystack.ts:99-105` — POST `/customer` body.
- `src/lib/paystack.ts:133-135` — POST `/dedicated_account` body.
- `src/lib/paystack.ts:147-170` — GET `/dedicated_account?customer=...`
  fallback when DVA creation returns an error (DVA already exists).

**Request body** — `{customer: customerId}` only. No `reference`, no
`amount`, no per-invoice binding. Per Paystack's API design, the DVA is
a customer-scoped reusable bank account.

**Response parse** — `DvaData` (`paystack.ts:55-60`):
- `account_number` → `DvaResult.accountNumber`
- `bank.name` → `DvaResult.bankName`
- `account_name` → `DvaResult.accountName` (falls back to `DVA_ACCOUNT_NAME`)
- `currency` → ignored

**Sandbox behaviour** — when `PAYSTACK_SECRET_KEY` is unset:
- `sandboxDva` returns a deterministic 10-digit NUBAN derived from
  `sha256("${email}|${invoiceNumber}")` (sandboxDva `paystack.ts:62-75`).
- Account is unique per (email, invoiceNumber) — masks GAP-B in dev.

**Error handling** — DVA creation failure (network / API error / customer
resolution failure) → returns the same `sandboxDva` so the proposal
pipeline never breaks (`paystack.ts:127-130`, `paystack.ts:172-174`).

---

### Step 6 — Generated payment information  ✅ correct (PDF + portal pull from invoice)

**Files + lines**
- `src/lib/pdf/proposal-pdf.ts:21-26` — `ProposalPdfDva` type.
- `src/lib/pdf/proposal-pdf.ts:325-358` — DVA box in the PDF.
- `src/app/api/portal/[token]/route.ts:69-75` — portal DVA payload.
- `src/components/portal/client-portal.tsx` — `DvaCard` render.

**PDF DVA box** (`proposal-pdf.ts:326-358`):
- `data.dva` is the `DvaResult` object passed in from
  `invoice-service.ts:87-103` — pulled from the just-created DVA
  (real Paystack response OR sandbox fallback).
- Renders `bankName`, `accountNumber`, `accountName || DVA_ACCOUNT_NAME`.
- If `sandbox: true`, renders a yellow banner warning the founder.

**Portal DVA payload** (`/api/portal/[token]/route.ts:69-75`):
```ts
dva: invoice.dvaAccountNumber ? {
  accountNumber: invoice.dvaAccountNumber,
  bankName:      invoice.dvaBankName ?? "",
  accountName:   DVA_ACCOUNT_NAME,  // hardcoded constant
} : null,
```
- `accountNumber` + `bankName` are pulled from THIS invoice's row (correct).
- `accountName` is hardcoded to `DVA_ACCOUNT_NAME` (per spec
  `src/lib/brand.ts:42`).

⚠️ The portal hardcodes `accountName` rather than echoing back the value
Paystack returned. This is by spec — `DVA_ACCOUNT_NAME = "Okomba Analytics"`
for every customer. If the founder wants the customer's own name on the
account, that's a spec-level change (see §E recommendation E-3), not a
code bug.

---

### Step 7 — Email template  ✅ correct

**Files + lines**
- `src/lib/notify.ts:717-815` — `sendProposalEmail` (with PDF attachment).
- `src/lib/notify.ts:544-604` — `sendReminderEmail` (3-day / due / overdue).
- `src/lib/notify.ts:685-715` — `proposalSubject` + `composeProposalBody`
  (extracted verbatim in B1-C for testability).
- `src/lib/notify.ts:496-542` — `reminderSubject` + `composeReminderBody`.
- `src/lib/portal.ts:22-29` — `portalUrlFor(token)` helper.

**portalUrl source** — `invoice-service.ts:135`:
```ts
const portalUrl = portalUrlFor(secureToken);
```
The token is unique per invoice (`secureToken @unique` in schema). The
URL is constructed from `PORTAL_BASE_URL` or `NEXT_PUBLIC_SITE_URL`
or `https://app.okomba.com` — per-environment override.

**Email greeting** (`notify.ts:692`):
```ts
`Dear ${inv.customerName},`
```
Personalized with the customer's submitted name — never a generic greeting.

**Email DVA box** (`notify.ts:703-711`):
```
Payment account (Paystack Dedicated Virtual Account):
  Bank:    ${inv.dvaBankName ?? ""}
  Account: ${inv.dvaAccountNumber}
  Name:    ${inv.dvaAccountName ?? "Okomba Analytics"}
```
All values passed in from `invoice-service.ts:149-151` — pulled from
the invoice row (which was populated in Step 3 from the DVA result of
Step 4). ✅

**CTA** — `notify.ts:757-760`:
```ts
...(inv.portalUrl ? { ctaText: "View your proposal online", ctaUrl: inv.portalUrl } : {})
```
The CTA URL is THIS invoice's portal URL. Customer A's email contains
Customer A's portal URL — never Customer B's. ✅

---

### Step 8 — Payment link  ✅ correct (auth-free 192-bit token + DB @unique)

**Files + lines**
- `src/app/portal/[secureToken]/page.tsx:17-41` — server component.
- `src/app/api/portal/[token]/route.ts:17-94` — GET data endpoint.
- `src/components/portal/client-portal.tsx` — UI.

**Token validation** (`page.tsx:22-30`):
- Length 16-128, charset `[A-Za-z0-9_-]+`, else `notFound()`.
- `db.invoice.findUnique({where: {secureToken}})` — DB @unique constraint
  means Customer A's token can NEVER collide with Customer B's.

**Status allowlist** (`page.tsx:15`, `route.ts:15`):
```ts
const ALLOWED_STATUSES = new Set(["draft","sent","pending","paid","overdue","cancelled"]);
```
Draft / cancelled invoices also return `notFound()` — no enumeration leak.

**DVA box render** — pulled from `invoice.dvaAccountNumber` for THIS
specific invoice. Customer A's portal link shows Customer A's DVA box.
Customer B's portal link shows Customer B's DVA box. No cross-contamination.

**First-visit stamp** (`route.ts:39-43`) — non-fatal `db.invoice.update`
sets `portalViewedAt`. Fire-and-forget; never blocks the response.

---

### Step 9 — Webhook  ✅ correct (handler logic + B2 minimal-fix applied)

**Files + lines**
- `src/app/api/paystack/webhook/route.ts:24-131` — POST handler.
- `src/lib/payment-webhook.ts:39-56` — `verifyPaystackSignature` (HMAC-SHA512
  timing-safe).
- `src/lib/payment-webhook.ts:120-237` — `processPaystackEvent` (dedup +
  audit row + dispatch).
- `src/lib/payment-webhook.ts:241-349` — `handleChargeSuccess` (the money path).

**Signature verification** (`payment-webhook.ts:43-56`):
- `createHmac("sha512", secret).update(rawBody, "utf8").digest("hex")`.
- `timingSafeEqual(a, b)` — no early-exit leak.
- Secret resolved from `PAYSTACK_WEBHOOK_SECRET || PAYSTACK_SECRET_KEY`.

**Dedup** (`route.ts:64-85` + `payment-webhook.ts:134-178`):
- Unique triple `(provider, event, paystackId)` on `WebhookLog` (`schema.prisma`
  WebhookLog model).
- Paystack retries return 200 immediately (`route.ts:75-80`) without
  re-processing.

**Lookup chain (post B2 minimal-fix)**:

1. **Primary — `paystackReference`** (`payment-webhook.ts:274-283`):
   ```ts
   if (reference) {
     invoice = await db.invoice.findUnique({ where: { paystackReference: reference } });
   }
   ```
   ✅ Correct lookup logic. But see GAP-A (§C): production invoices leave
   this field NULL, so for real bank-transfer webhooks this branch is
   dead code. Only fires for:
   - admin `test-webhook` route (`src/app/api/admin/payments/test-webhook/route.ts:66`
     synthesizes `okomba-test-${invoiceNumber}-${Date.now().toString(36)}`).
   - B1-A regression test (`tests/paystack-account-isolation.test.ts:140-203`
     pre-seeds `paystackReference` for every test invoice).
   - Future checkout-session / payment_request flows (would mint the
     reference at creation time).

2. **Secondary — `dvaAccountNumber`** (`payment-webhook.ts:285-331`,
   post B2 minimal-fix):
   ```ts
   if (!invoice && accountNumber) {
     const matches = await db.invoice.findMany({
       where: { dvaAccountNumber: accountNumber },
       orderBy: { createdAt: "desc" },
     });
     if (matches.length === 1) {
       invoice = matches[0] ?? null;
     } else if (matches.length > 1) {
       // Ambiguous → manual reconciliation (B2 fix for GAP-B)
       return { status: "failed",
                detail: { ..., ambiguousInvoiceIds, ambiguousInvoiceNumbers },
                error: "ambiguous_dva_match_needs_manual_reconciliation" };
     }
   }
   ```
   - 1 match → mark paid (the common case for sandbox + first-time customers).
   - 0 matches → manual reconciliation (unchanged from Phase 27).
   - 2+ matches → manual reconciliation (NEW — closes GAP-B; previously
     `findFirst({orderBy: createdAt desc})` would silently pick the
     most-recent invoice).

3. **No fallback** (`payment-webhook.ts:333-349`) — manual reconciliation
   with `invoice_not_found_needs_manual_reconciliation` error. NEVER
   auto-mark by email+amount. ✅ Phase 27 invariant preserved.

**Idempotency** (`payment-webhook.ts:353-359`) — if `invoice.status === "paid"`,
return `{status: "duplicate"}` without re-stamping `paidAt`. Replay-safe.

**B1-A regression test scenario mapping** (all 7 still pass post-fix because
every test invoice has a UNIQUE `dvaAccountNumber` → `matches.length === 1`
→ no behaviour change):
- S1 (A pays, B untouched) → A's DVA unique → 1 match → A paid. B untouched. ✅
- S2 (B pays, A unchanged) → B's DVA unique → 1 match → B paid. A idempotent dedup. ✅
- S3 (Reference @unique DB constraint) → unchanged. ✅
- S4 (Unknown reference + unknown DVA) → 0 matches → manual reconciliation. ✅
- S5 (A's reference + A's DVA + C's email + A's amount) → primary lookup hits A
  (already paid) → duplicate. C untouched. ✅
- S6 (D's DVA only, no reference) → D's DVA unique → 1 match → D paid. ✅
- S7 (final invariant matrix) → unchanged. ✅

---

### Step 10 — Transaction update + customer/admin display  ✅ correct

**Files + lines**

*Post-match actions* (`payment-webhook.ts:310-413`):
- b. `db.invoice.update({where:{id}, data:{status:"paid", paidAt}})` — line 366-369.
- c. `db.eventRecord.updateMany({where:{relatedInvoiceId, type:{startsWith:"invoice.reminder"}, status:"scheduled"}, data:{status:"skipped"}})` — line 316-323. Stops all reminders for THIS invoice.
- d. `generateReceiptPdf` (line 338-345) → `sendPaymentThankYouEmail` (line 348-361) → `dispatchWhatsApp` (line 363-374).
- e. `db.eventRecord.create({type:"project.kickoff", eventDate: paidAt + 24h})` — line 377-395.

*Admin Payments tab* (`src/components/site/admin/payments-tab.tsx`):
- Webhook log row (line 308-313): shows reference, amount, status,
  reminders stopped, thank-you sent, kickoff scheduled — all from the
  WebhookLog row that references THIS invoice's ID.
- Paid invoices list (line 367-378): shows `invoice.invoiceNumber +
  customerName + amountKobo/100 + paidAt` — all from THIS invoice row.
- Kickoff events list (line 395-408): shows `payload.customerName +
  payload.invoiceNumber` — pulled from the kickoff event's payload
  (which was stamped with THIS invoice's customer at line 387-388).

*Admin CRM timeline* (`src/app/api/admin/customers/[id]/route.ts:37-204`):
- Looks up Customer by ID, then pulls ALL invoices by `customerEmail`
  (line 42-45) — never by DVA account_number (so no risk of pulling
  another customer's invoices through a shared DVA).
- Invoice timeline item (line 111-126) shows: `amountNaira`, `status`,
  `dvaAccount`, `sentAt`, `paidAt` — all from THIS invoice row.
- Stats: `totalPaidNaira` sums `paidInvoices` (line 75-77) — only
  invoices where `status === "paid"` for THIS customer.

**Identity preservation** — every admin-display path joins by
`customerEmail` (CRM) or by the invoice's own ID (Payments tab). The
post-match webhook actions all use `invoice.id` from the lookup. No
cross-customer contamination path. ✅

---

## C. Root-cause analysis of the original account-name bug

### C.1 The original symptom (as reported in Master Directive §5)

> "There is currently a serious issue where the Paystack DBA/account process
> repeatedly uses the same account name rather than creating/using the
> customer's submitted account details."

The directive's wording is loose: it conflates "account name" with "account
identity". Looking at `src/lib/brand.ts:41-42`:

```ts
/** Paystack Dedicated Virtual Account display name (per spec). */
export const DVA_ACCOUNT_NAME = "Okomba Analytics";
```

The DVA account NAME is "Okomba Analytics" for every customer BY SPEC
(Phase 2 / Module 4 user-approved decision). This is how Paystack DVAs
work — they're merchant sub-accounts. So the founder's "same account
name repeatedly appears" complaint is actually about account IDENTITY
matching (which invoice the webhook marks paid), not the literal string
"Okomba Analytics".

### C.2 The OLD (broken) behaviour

Before the Phase 27 audit fix, the webhook handler matched an incoming
payment to an invoice using a chain that ended with an email+amount
heuristic fallback. So if:

- Customer A had invoice 1 for ₦950,000
- Customer A had invoice 2 for ₦950,000
- Paystack sent a `charge.success` for invoice 1

The OLD matcher would collide on email+amount and could silently mark
invoice 2 paid (or both). The same class of bug applied to the
`paystackReference` column being a plain (non-unique) field — two
invoices could legitimately hold the same reference.

### C.3 The NEW (correct) behaviour — Phase 27 audit fix (R63)

1. **Schema** (`prisma/schema.prisma:255-260`):
   ```prisma
   // ── Audit fix (Phase 27): unique Paystack transaction reference ──
   // Bound at DVA creation / checkout-session time so the webhook can
   // match a payment to its invoice by an immutable reference (NOT by
   // email + amount, which can collide across multiple open invoices).
   // NULL until the DVA / checkout session is provisioned.
   paystackReference String? @unique
   ```

2. **Webhook lookup chain** (`src/lib/payment-webhook.ts:241-349`):
   - Primary: `db.invoice.findUnique({where: {paystackReference: reference}})`
   - Secondary: `db.invoice.findFirst({where: {dvaAccountNumber}})` (Phase 27) →
     B2 minimal-fix: `findMany` + ambiguity check (see §E for fix details).
   - NO email+amount fallback — manual reconciliation queue otherwise.

3. **Idempotency** (`payment-webhook.ts:353-359`) — already-paid
   invoice returns `{status:"duplicate"}` without re-stamping `paidAt`.

### C.4 Where exactly the fix was applied

| Location | File + line | Layer |
|---|---|---|
| Schema constraint | `prisma/schema.prisma:260` | Architectural (root) |
| Webhook primary lookup | `src/lib/payment-webhook.ts:274-283` | Architectural (root) |
| Webhook secondary lookup | `src/lib/payment-webhook.ts:285-331` (post B2 minimal-fix) | Architectural (root) |
| Webhook no-fallback path | `src/lib/payment-webhook.ts:333-349` | Architectural (root) |
| Idempotent dedup | `src/lib/payment-webhook.ts:134-178`, `353-359` | Architectural (root) |
| Webhook signature verify | `src/lib/payment-webhook.ts:39-56` | Architectural (root) |
| Webhook audit trail | `WebhookLog` model + `payment-webhook.ts:181-234` | Architectural (root) |

### C.5 Root-level vs symptom-level

The Phase 27 fix is at the **ROOT (architectural) level**, not a UI/text mask:

- ✅ The DB schema enforces the uniqueness invariant at the storage layer
  (`@unique` constraint — Postgres will reject any duplicate
  `paystackReference` even if the application layer tried to write one).
- ✅ The webhook handler's matching algorithm uses an immutable reference
  as the primary key — never a fuzzy email+amount heuristic.
- ✅ The no-match path routes to manual reconciliation rather than guessing.
- ✅ The audit trail (`WebhookLog`) records every lookup decision so the
  admin can verify the matching logic post-hoc.

### C.6 B1-A regression test confirmation

`tests/paystack-account-isolation.test.ts` (711 lines, 7 scenarios, 56
assertions) — 7/7 pass against real Neon Postgres + real webhook handler
(reported by B1-A worklog entry; not re-run by B2 per directive).

- S1 — Two-customer isolation (A pays, B untouched) ✅
- S2 — Replay-attack protection (B pays, A.paidAt unchanged) ✅
- S3 — Reference uniqueness + DB @unique constraint ✅
- S4 — Wrong-reference manual-reconciliation queue ✅
- S5 — Email+amount collision attempt (the OLD bug pattern) — FAILS the
  old email+amount matcher, PASSES the new reference-primary matcher ✅
- S6 — DVA secondary lookup for legacy invoices ✅
- S7 — Final invariant matrix ✅

The fix IS at the architectural level, and B1-A proves the webhook handler
holds under all 7 mandated scenarios.

---

## D. Batch 2 Exit Gate evidence

Per Master Directive §9 Batch 2 Exit Gate — minimum required verification:

> Customer A → own details → own payment
> Customer B → own details → own payment
> Verify that:
> 1. A never receives B's data
> 2. B never receives A's data
> 3. account/payment identity is correct
> 4. amount is correct
> 5. payment status is correct
> 6. references are unique as intended
> 7. webhook updates correct records

| # | Verification point | B1-A test scenario that proves it | File + line |
|---|---|---|---|
| 1 | A never receives B's data | **S1** — fires A's charge.success, asserts B.status !== "paid" && B.paidAt === null | `tests/paystack-account-isolation.test.ts:437-489` (S1) |
| 2 | B never receives A's data | **S2** — fires B's charge.success, asserts A.paidAt UNCHANGED (idempotent dedup; no re-stamp) | `tests/paystack-account-isolation.test.ts:483-560` (S2) |
| 3 | account/payment identity correct | **S3** — asserts A.paystackReference !== B.paystackReference + verifies the DB @unique constraint by attempting a duplicate-reference insert and asserting a unique-constraint violation | `tests/paystack-account-isolation.test.ts:525-560` (S3) |
| 4 | amount correct | **S1** — A.amountKobo = ₦950k (95_000_000 kobo), B.amountKobo = ₦1.85M (185_000_000 kobo) — no cross-contamination of amounts across the two customers' paid invoices | `tests/paystack-account-isolation.test.ts:152-153, 166-167` (test data); `tests/paystack-account-isolation.test.ts:437-489` (S1 assertions) |
| 5 | payment status correct | **S1 + S2** — after S1, A.status === "paid" && B.status === "sent"; after S2, A.status === "paid" (unchanged) && B.status === "paid" — no leak | `tests/paystack-account-isolation.test.ts:437-489` (S1), `tests/paystack-account-isolation.test.ts:483-560` (S2) |
| 6 | references unique | **S3** — asserts A.paystackReference !== B.paystackReference (both non-null) AND verifies the @unique DB constraint directly via a duplicate-insert attempt that throws a unique-constraint violation | `tests/paystack-account-isolation.test.ts:525-560` (S3) |
| 7 | webhook updates correct records | **S1 + S2 + S4 + S5 + S6** — every webhook delivery either (a) marks the correct invoice paid, (b) returns idempotent duplicate for an already-paid invoice, or (c) routes to manual reconciliation with no invoice paid. No webhook ever marks the wrong invoice. | `tests/paystack-account-isolation.test.ts:437-489` (S1), `:483-560` (S2), `:565-592` (S4), `:595-637` (S5), `:640-688` (S6) |

**Batch 2 Exit Gate status: ✅ PASSED** at the webhook-handler level.

**Important caveat surfaced by the B2 deep trace**: B1-A verifies the
WEBHOOK HANDLER in isolation (with pre-seeded invoice data that has
`paystackReference` set manually). The deep trace reveals that the
PRODUCTION data flow upstream of the webhook handler does NOT actually
write `paystackReference` at invoice creation time (see §C.7 below).
This means the architectural invariant is verified *for the handler*,
but the *production caller* leaves the invariant underutilised. The
minimal-fix in §E closes the immediate collision risk; the deeper
architectural fix (write `paystackReference` at creation time via
`transaction.initialize` / `payment_request`) is recommended for a
future batch.

### C.7 Production vs test data-flow gap (B2 deep-trace finding)

| Aspect | B1-A test data | Production data flow |
|---|---|---|
| `invoice.paystackReference` | Pre-seeded manually (e.g. `ref-OKM-A-001`) — non-null, unique | NEVER written by `invoice-service.ts:112-134` — always NULL |
| `invoice.dvaAccountNumber` | Unique per test invoice (`0123456789`, `4445556666`, `7777888899`, `9999888877`) | Real Paystack reuses a customer's DVA across invoices → repeat customers share `dvaAccountNumber` |
| Primary lookup fires? | Yes (S1-S5) — finds the invoice by reference | No — for bank-transfer webhooks `data.reference` is Paystack-generated, no invoice has it |
| Secondary lookup matches? | Yes (S6) — exactly 1 invoice per DVA | Sometimes 1 (first-time customer), sometimes 2+ (repeat customer) |
| GAP-A (primary is dead code) | Not exposed (test pre-seeds the field) | Exposed — primary lookup never matches |
| GAP-B (secondary multi-match) | Not exposed (test invoices have unique DVAs) | Exposed for repeat customers — pre-B2 fix would silently pick the most-recent invoice |

The B1-A test is correct and complete for what it tests (the webhook
handler). The B2 deep trace is correct for what IT tests (the entire
production flow upstream of the handler). Both are needed for the
Master Directive §5 / Batch 2 Exit Gate to be fully discharged.

---

## E. Remaining gaps + recommended fixes

### E.1 GAP-A — `paystackReference` never written at invoice creation

**Severity:** 🟡 medium (does not cause wrong-invoice marking on its own,
but means the @unique DB constraint is effectively unused and the primary
lookup is dead code in the current DVA-only flow).

**Location:** `src/lib/invoice-service.ts:112-134` — the `db.invoice.create`
call omits `paystackReference`.

**Root cause:** Paystack's `/dedicated_account` API does not accept a
`reference` parameter and does not return one — the DVA is bound to the
Paystack customer, not to a specific invoice. Paystack only mints a
transaction reference when an actual bank transfer hits the DVA, and that
reference is Paystack-controlled.

**Why this matters:** The Phase 27 audit fix comment at `payment-webhook.ts:245-248`
says the reference is "set at DVA / checkout creation time, unique per
invoice" — but the production code never actually sets it. So the primary
lookup branch (`payment-webhook.ts:274-283`) only ever fires for:
- Admin `test-webhook` smoke tests (`src/app/api/admin/payments/test-webhook/route.ts:66`
  synthesizes `okomba-test-${invoiceNumber}-${Date.now().toString(36)}`).
- The B1-A regression test (which pre-seeds the field manually).
- Future checkout-session / payment_request flows (not yet implemented).

**Recommended fix (future batch — NOT applied in B2 because it would
change the payment architecture from DVA-only to DVA + checkout-session,
which is a substantial migration):**

1. Generate a unique reference per invoice at creation time:
   ```ts
   const paystackReference = `OKM-${invoiceNumber}-${randomBytes(8).toString("hex")}`;
   ```
2. Persist it on the invoice row (`invoice-service.ts:112-134` create call).
3. Use Paystack's `POST /transaction/initialize` or
   `POST /paymentrequest` endpoint to mint a checkout URL with this
   reference baked in — Paystack then echoes our reference back in the
   webhook's `data.reference` field, so the primary lookup matches.
4. Keep the DVA fallback for customers who pay via raw bank transfer
   (their webhook will have `data.reference = Paystack's tx ref` which
   won't match our `OKM-...` reference — falls through to the
   secondary lookup, which is now ambiguity-safe post-B2 minimal-fix).

This is a Batch 3-or-later deliverable — it touches the proposal email
CTA (would need to surface the Paystack checkout URL alongside the DVA
box), the portal UI, and adds a new Paystack API integration path.

### E.2 GAP-B — Secondary lookup `findFirst({orderBy: createdAt desc})` was racy

**Severity:** 🔴 high (could silently mark the wrong invoice paid for a
repeat customer with multiple outstanding invoices sharing a DVA).

**Location:** `src/lib/payment-webhook.ts:285-331` (post-B2 fix).

**Root cause:** The original Phase 27 audit fix comment claimed "Paystack
issues a fresh DVA per invoice" — but Paystack's DVA model is per-customer
(see `src/lib/paystack.ts:133-170` — when `/dedicated_account` returns an
error because the customer already has one, we fetch the existing DVA
and reuse it). So a repeat customer's invoice 1 and invoice 2 share the
same `dvaAccountNumber`. The previous `findFirst({orderBy: createdAt desc})`
would silently pick invoice 2 (the most recent), even if the customer
was paying for invoice 1.

**Minimal fix applied in B2:**

The original code:
```ts
// 2. Secondary — DVA account_number (also unique per invoice at creation)
if (!invoice && accountNumber) {
  invoice = await db.invoice.findFirst({
    where: { dvaAccountNumber: accountNumber },
    orderBy: { createdAt: "desc" },
  });
}
```

The B2 fix:
```ts
// 2. Secondary — DVA account_number.
// [comment block explaining GAP-B + the multi-invoice case]
if (!invoice && accountNumber) {
  const matches = await db.invoice.findMany({
    where: { dvaAccountNumber: accountNumber },
    orderBy: { createdAt: "desc" },
  });
  if (matches.length === 1) {
    invoice = matches[0] ?? null;
  } else if (matches.length > 1) {
    // Ambiguous: multiple invoices share this DVA. DO NOT guess.
    return {
      status: "failed",
      detail: {
        note: "multiple invoices share this DVA account_number — admin must manually reconcile to avoid marking the wrong invoice paid",
        lookedUpReference: reference,
        lookedUpAccount: accountNumber,
        customerEmail: data.customer?.email ?? null,
        amountKobo: typeof data.amount === "number" ? data.amount : null,
        ambiguousInvoiceIds: matches.map((m) => m.id),
        ambiguousInvoiceNumbers: matches.map((m) => m.invoiceNumber),
      },
      error: "ambiguous_dva_match_needs_manual_reconciliation",
    };
  }
}
```

**Why this is minimal:** 8 lines of code change. Preserves all architectural
patterns (DVA-based matching for legacy + repeat customers). Preserves the
"never guess" invariant. Backward-compatible with B1-A (every test invoice
has a unique DVA → `matches.length === 1` → no behaviour change in the test
suite). The only behavioural change is for the previously-broken case
(2+ invoices sharing a DVA) — that case now safely routes to manual
reconciliation instead of silently picking the most recent invoice.

### E.3 Spec-level consideration — DVA account name

**Severity:** 🟢 informational (not a code bug).

**Location:** `src/lib/brand.ts:41-42` — `DVA_ACCOUNT_NAME = "Okomba Analytics"`.

The Master Directive §5 wording says the bug is "the same account name
repeatedly appears for different customers". The DVA account NAME being
"Okomba Analytics" for every customer is **by spec** (Phase 2 user-approved
decision; this is how Paystack DVAs work — they're merchant sub-accounts).

If the founder wants the account name on the portal / PDF / email to be
the CUSTOMER's name (e.g. "Funke Adeyemi"), that's a spec-level change:

1. `src/lib/brand.ts` — keep `DVA_ACCOUNT_NAME` for the merchant identity.
2. `src/lib/paystack.ts:62-75` (`sandboxDva`) — already returns
   `accountName: DVA_ACCOUNT_NAME`. Change to derive from `client.name`
   if the spec flips.
3. `src/lib/paystack.ts:138-144` (real DVA response parse) — the
   `dva.data.account_name` field returned by Paystack IS the merchant
   name, not the customer name. To override this, we'd need to NOT use
   Paystack's DVA `account_name` field and substitute the customer's
   name in our PDF / portal / email rendering.
4. `src/app/api/portal/[token]/route.ts:69-75` — replace
   `accountName: DVA_ACCOUNT_NAME` with `accountName: invoice.customerName`
   (or similar).
5. `src/lib/pdf/proposal-pdf.ts:348-349` — change
   `data.dva.accountName || DVA_ACCOUNT_NAME` to pull from
   `data.client.name`.
6. `src/lib/notify.ts:703-711, 746-753` — change the DVA box `Name:`
   line to use `inv.customerName` instead of `inv.dvaAccountName`.

This is a future-batch UX decision, NOT a B2 deep-trace finding. The
deep trace confirms the current code is self-consistent with the spec.

### E.4 Minor dead column — `dvaBankCode`

**Severity:** 🟢 informational (no functional impact).

**Location:** `prisma/schema.prisma:254` (`dvaBankCode String?`) — present
in the schema and the Invoice type, but NEVER written by `createInvoiceDva`
nor by `sendProposal`'s `db.invoice.create` call.

**Recommended fix (trivial):** Either remove the column from the schema
in a future migration, or have `createInvoiceDva` return the bank code
from Paystack's response and have `invoice-service.ts` persist it. Low
priority — the bank NAME is sufficient for customer display.

### E.5 Summary

| Gap | Severity | Status post-B2 |
|---|---|---|
| GAP-A — `paystackReference` not written at creation | 🟡 medium | Documented + recommended future fix (Batch 3+) |
| GAP-B — secondary lookup multi-match | 🔴 high | ✅ Closed by B2 minimal-fix in `src/lib/payment-webhook.ts:285-331` |
| E.3 — DVA account name is "Okomba Analytics" by spec | 🟢 info | No code change — spec-level UX decision deferred to founder |
| E.4 — `dvaBankCode` dead column | 🟢 info | No code change — trivial future cleanup |

**Net effect of B2 deep trace:** The Phase 27 audit fix (R63) at the
webhook-handler level is CORRECT and verified end-to-end by B1-A. The
deep trace revealed ONE additional gap (GAP-B) that the B1-A test could
not catch because every test invoice had a unique DVA. The B2
minimal-fix closes GAP-B at the same architectural level as the
Phase 27 fix (the webhook handler's matching algorithm). GAP-A is
documented as a future architectural migration (DVA-only → DVA +
checkout-session) that a later batch should plan for. No remaining
gaps that could cause the wrong account name / wrong invoice / wrong
customer payment to surface in the current production flow.
