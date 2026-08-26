/**
 * Module 5 E2E seed — creates four unpaid invoices that exercise the
 * reminder windows (run with: bun scripts/seed-module5-test.ts).
 *
 *   INV …0002  due +3 days  → "Friendly Reminder"  must fire
 *   INV …0003  due today    → "Due Today"          must fire
 *   INV …0004  due −1 day   → "Overdue"            must fire
 *   INV …0005  due +2 days  → nothing (negative control)
 */
import { PrismaClient } from "../src/generated/prisma/client.js";

const db = new PrismaClient();

const DAY = 86_400_000;

function atLagosMidnightUTC(offsetDays: number): Date {
  // Lagos is UTC+1 — 00:00 Lagos == 23:00 UTC of the previous day.
  const now = new Date();
  const lagosToday = new Date(now.getTime() + 3_600_000);
  lagosToday.setUTCHours(0, 0, 0, 0);
  return new Date(lagosToday.getTime() + offsetDays * DAY - 3_600_000 + 3_600_000);
}

const proposal = (service: string) => ({
  executiveSummary: `This engagement covers ${service} for the client, delivered by Okomba Analytics in structured phases with clear checkpoints, documented outputs and a hands-on handover session.`,
  objectives: [
    "Deliver the requested service to a production standard",
    "Keep the client informed with weekly progress checkpoints",
    "Hand over documented, maintainable outputs",
  ],
  scope: [
    {
      title: "Discovery & Planning",
      items: ["Requirements workshop with the client", "Success criteria and delivery plan"],
    },
    {
      title: "Design & Build",
      items: ["Core build of the requested service", "Iterative review with the client"],
    },
    {
      title: "Delivery & Handover",
      items: ["Final QA and launch", "Documentation and handover session"],
    },
  ],
  deliverables: [
    "Discovery summary and delivery plan",
    `${service} — final build`,
    "Documentation pack",
    "Handover session",
  ],
  timeline: [
    { phase: "Phase 1 — Discovery", duration: "1 week", focus: "Requirements and planning." },
    { phase: "Phase 2 — Build", duration: "2 weeks", focus: "Design, build and reviews." },
    { phase: "Phase 3 — Handover", duration: "1 week", focus: "QA, launch, documentation." },
  ],
  terms: [
    "Two revision rounds included per deliverable.",
    "Weekly progress updates throughout the engagement.",
    "Timeline starts from the kick-off date.",
  ],
});

async function main() {
  const spec = [
    {
      number: "INV-2026-0002",
      name: "Chidinma Eze",
      email: "chidinma@brightpathlogistics.com",
      phone: "+234 812 345 6789",
      service: "Web & Digital Product Development",
      amountNaira: 2_350_000,
      dueOffsetDays: 3, // friendly reminder
    },
    {
      number: "INV-2026-0003",
      name: "Tunde Bakare",
      email: "tunde@granitecapital.ng",
      phone: "08099887766",
      service: "Data Analytics & BI Dashboard",
      amountNaira: 1_180_000,
      dueOffsetDays: 0, // due today
    },
    {
      number: "INV-2026-0004",
      name: "Amaka Nwosu",
      email: "amaka@zenithfarms.co",
      phone: "+234 706 554 3322",
      service: "Brand Identity & Design Systems",
      amountNaira: 890_000,
      dueOffsetDays: -1, // overdue
    },
    {
      number: "INV-2026-0005",
      name: "Kelechi Obi",
      email: "kelechi@swiftpay.africa",
      phone: "+234 902 446 1180",
      service: "Automation & Systems Integration",
      amountNaira: 3_600_000,
      dueOffsetDays: 2, // negative control — no reminder today
    },
  ];

  for (const s of spec) {
    const existing = await db.invoice.findUnique({ where: { invoiceNumber: s.number } });
    if (existing) {
      console.log(`skip ${s.number} (already exists)`);
      continue;
    }
    await db.invoice.create({
      data: {
        invoiceNumber: s.number,
        customerName: s.name,
        customerEmail: s.email,
        customerPhone: s.phone,
        service: s.service,
        description: `${s.service} — professional services as detailed in this proposal`,
        proposalJson: JSON.stringify(proposal(s.service)),
        amountKobo: s.amountNaira * 100,
        currency: "NGN",
        durationLabel: "3 weeks",
        dueDate: atLagosMidnightUTC(s.dueOffsetDays),
        status: "sent",
        dvaAccountNumber: `77${Math.floor(10000000 + Math.random() * 89999999)}`,
        dvaBankName: "Paystack Test Bank (Sandbox)",
        sentAt: new Date(Date.now() - 4 * DAY),
      },
    });
    console.log(`created ${s.number} — ${s.name} — due ${s.dueOffsetDays >= 0 ? "+" : ""}${s.dueOffsetDays}d`);
  }
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
