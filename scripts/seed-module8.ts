/**
 * Module 8 seed — realistic test dataset so the Client Portal,
 * Analytics dashboard, Cloudinary fallback, and backup trail are
 * all demo-able end-to-end without a live Paystack/Cloudinary/Drive.
 *
 *   bun run scripts/seed-module8.ts
 *
 * Creates: 3 inquiries (1 ai_chat), 5 invoices (2 paid, 2 sent,
 * 1 overdue) with full proposalJson + DVA + secureToken, a handful
 * of analytics events, one webhook log row, and one backup log row.
 */
import { db } from "../src/lib/db";
import { generatePortalToken } from "../src/lib/portal";

const PROPOSAL = {
  executiveSummary:
    "A structured engagement to design, build and ship a modern web product for your organisation, delivered in clear phases with measurable checkpoints.",
  objectives: [
    "Establish a fast, mobile-first web presence that converts visitors",
    "Integrate secure online payments with Nigerian bank rails",
    "Hand over a maintainable, well-documented codebase",
  ],
  scope: [
    { title: "Discovery & UX", items: ["Stakeholder workshop", "Sitemap + flows", "Wireframes"] },
    { title: "Build", items: ["Frontend (Next.js)", "Backend + APIs", "Payment integration"] },
    { title: "Launch", items: ["QA + accessibility", "Deployment", "Handover + training"] },
  ],
  deliverables: [
    "Production web application (web + mobile)",
    "Admin dashboard",
    "Payment system integration",
    "Brand-aligned design system",
  ],
  timeline: [
    { phase: "Discovery", duration: "1 week", focus: "Requirements, UX flows, sitemap" },
    { phase: "Design", duration: "1 week", focus: "High-fidelity UI, design system" },
    { phase: "Build", duration: "2 weeks", focus: "Frontend, backend, payments" },
    { phase: "Launch", duration: "3 days", focus: "QA, deploy, handover" },
  ],
  terms: [
    "Two revision rounds included per deliverable",
    "Timeline starts from the mobilisation date",
    "50% deposit to begin, balance on delivery",
  ],
};

const PAID_LABEL = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

async function main() {
  console.log("[seed-module8] starting…");

  // ── Inquiries ──
  const i1 = await db.inquiry.create({
    data: {
      name: "Funke Adeyemi",
      email: "funke@brightpath.ng",
      phone: "+234 803 111 0001",
      whatsapp: "+234 803 111 0001",
      service: "Web Development",
      message: "We need a school management portal for admissions and parent comms.",
      status: "contacted",
      source: "ai_chat",
    },
  });
  const i2 = await db.inquiry.create({
    data: {
      name: "Bisi Olawale",
      email: "bisi@votewise.org",
      phone: "+234 805 222 0002",
      whatsapp: "+234 805 222 0002",
      service: "Payment System Integration",
      message: "We need Paystack + DVA for our civic-tech donations platform.",
      status: "contacted",
      source: "ai_chat",
    },
  });
  const i3 = await db.inquiry.create({
    data: {
      name: "Chika Eze",
      email: "chika@fintrack.africa",
      phone: "+234 708 333 0003",
      service: "Data & Analytics",
      message: "Help us build a dashboard on top of our transaction data.",
      status: "new",
      source: "website",
    },
  });
  console.log(`[seed] 3 inquiries created`);

  // ── Invoices (2 paid, 2 sent, 1 overdue) ──
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  const daysAhead = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

  const invoices = [
    {
      invoiceNumber: "INV-2026-0007",
      inquiryId: i1.id,
      customerName: i1.name,
      customerEmail: i1.email,
      customerPhone: i1.phone,
      service: "Web Development",
      description: "School management portal — admissions + parent communications.",
      amountKobo: 1_850_000 * 100,
      durationLabel: "4 weeks",
      dueDate: daysAhead(7),
      status: "sent",
      dvaAccountNumber: "0123456789",
      dvaBankName: "Wema Bank",
      pdfStorage: "local" as const,
      sentAt: daysAgo(2),
    },
    {
      invoiceNumber: "INV-2026-0008",
      inquiryId: i2.id,
      customerName: i2.name,
      customerEmail: i2.email,
      customerPhone: i2.phone,
      service: "Payment System Integration",
      description: "Paystack + Dedicated Virtual Account integration for the donations platform.",
      amountKobo: 950_000 * 100,
      durationLabel: "3 weeks",
      dueDate: daysAgo(1),
      status: "paid",
      dvaAccountNumber: "9876543210",
      dvaBankName: "Wema Bank",
      pdfStorage: "local" as const,
      sentAt: daysAgo(10),
      paidAt: daysAgo(2),
    },
    {
      invoiceNumber: "INV-2026-0009",
      inquiryId: i3.id,
      customerName: i3.name,
      customerEmail: i3.email,
      customerPhone: i3.phone,
      service: "Data & Analytics",
      description: "Real-time analytics dashboard on transaction streams.",
      amountKobo: 1_200_000 * 100,
      durationLabel: "3 weeks",
      dueDate: daysAhead(14),
      status: "sent",
      dvaAccountNumber: "5550001111",
      dvaBankName: "Wema Bank",
      pdfStorage: "local" as const,
      sentAt: daysAgo(1),
    },
    {
      invoiceNumber: "INV-2026-0010",
      customerName: "Ada Obi",
      customerEmail: "ada@shopsmart.ng",
      customerPhone: "+234 812 444 0004",
      service: "Web Development",
      description: "E-commerce rebuild + checkout.",
      amountKobo: 2_400_000 * 100,
      durationLabel: "5 weeks",
      dueDate: daysAgo(3),
      status: "overdue",
      dvaAccountNumber: "4445556666",
      dvaBankName: "Wema Bank",
      pdfStorage: "local" as const,
      sentAt: daysAgo(20),
    },
    {
      invoiceNumber: "INV-2026-0011",
      customerName: "Tunde Bakare",
      customerEmail: "tunde@medserve.ng",
      customerPhone: "+234 818 555 0005",
      service: "Automation",
      description: "Clinic appointment + reminders automation.",
      amountKobo: 780_000 * 100,
      durationLabel: "2 weeks",
      dueDate: daysAhead(10),
      status: "paid",
      dvaAccountNumber: "7778889990",
      dvaBankName: "Wema Bank",
      pdfStorage: "local" as const,
      sentAt: daysAgo(25),
      paidAt: daysAgo(18),
    },
  ];

  for (const inv of invoices) {
    await db.invoice.create({
      data: {
        ...inv,
        currency: "NGN",
        proposalJson: JSON.stringify(PROPOSAL),
        secureToken: generatePortalToken(),
      } as any,
    });
  }
  console.log(`[seed] 5 invoices created`);

  // ── Analytics events (last 30 days, realistic funnel) ──
  const ev = async (type: string, daysBack: number, meta: Record<string, unknown> = {}) => {
    await db.analyticsEvent.create({
      data: { type, meta: JSON.stringify(meta), createdAt: daysAgo(daysBack) },
    });
  };
  // 12 ai_chat_start, 8 portal_visit, 6 proposal_view, 4 pdf_download, 3 payment_click, 2 payment_proof_uploaded
  for (let k = 0; k < 12; k++) await ev("ai_chat_start", 30 - k * 2, { service: "Web Development" });
  for (let k = 0; k < 8; k++) await ev("portal_visit", 28 - k * 3, { invoiceNumber: "INV-2026-0007" });
  for (let k = 0; k < 6; k++) await ev("proposal_view", 26 - k * 3);
  for (let k = 0; k < 4; k++) await ev("pdf_download", 24 - k * 4);
  for (let k = 0; k < 3; k++) await ev("payment_click", 20 - k * 5);
  for (let k = 0; k < 2; k++) await ev("payment_proof_uploaded", 16 - k * 6);
  console.log(`[seed] 35 analytics events created`);

  // ── Backup log (one successful local backup) ──
  await db.backupLog.create({
    data: {
      kind: "db",
      target: "local",
      status: "success",
      fileName: `okomba-db-${now.toISOString().slice(0, 19).replace(/[:T]/g, "-")}.db`,
      sizeBytes: 312_320,
      durationMs: 380,
      createdAt: daysAgo(1),
    },
  });
  console.log(`[seed] 1 backup log row`);

  // ── Webhook log (one processed charge.success) ──
  await db.webhookLog.create({
    data: {
      provider: "paystack",
      event: "charge.success",
      paystackId: "mod8-seed-" + Date.now(),
      reference: "ps_ref_seed_0008",
      invoiceNumber: "INV-2026-0008",
      amountKobo: 950_000 * 100,
      currency: "NGN",
      signatureValid: true,
      source: "admin-test",
      status: "processed",
      result: JSON.stringify({ remindersStopped: 2, thankYouSent: true, kickoff: true }),
      receivedAt: daysAgo(2),
      processedAt: daysAgo(2),
    },
  });
  console.log(`[seed] 1 webhook log row`);

  console.log("[seed-module8] done ✅");
  console.log(`   invoices: ${invoices.length} (2 paid, 2 sent, 1 overdue)`);
  console.log("   portals ready — open admin → Proposals tab → copy portal link");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

void PAID_LABEL;
