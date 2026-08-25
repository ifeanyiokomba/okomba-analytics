/* Smoke test: generate a branded proposal PDF with realistic data */
import { generateProposalPdf } from "../src/lib/pdf/proposal-pdf";
import fs from "node:fs";

const pdf = await generateProposalPdf({
  invoiceNumber: "INV-2026-0001",
  date: new Date(),
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  durationLabel: "3 weeks",
  client: { name: "Adaeze Okafor", email: "adaeze@edubridge.ng", phone: "+234 803 555 0101" },
  service: "Data Analytics & Reporting Dashboard",
  description: "Design and build of a real-time analytics dashboard for school performance tracking.",
  amountNaira: 1450000,
  currency: "NGN",
  proposal: {
    executiveSummary:
      "EduBridge Academy needs a unified view of student performance across its three campuses. This engagement delivers a real-time analytics dashboard that consolidates attendance, assessment and enrollment data, giving school leadership decision-grade visibility without manual spreadsheet work. The build follows Okomba Analytics' proven discover-design-deliver methodology.",
    objectives: [
      "Consolidate attendance, assessment and enrollment data into one live dashboard",
      "Reduce weekly reporting effort from hours to zero through automation",
      "Equip leadership with campus-level and class-level performance views",
    ],
    scope: [
      {
        title: "Discovery & Data Audit",
        items: [
          "Stakeholder workshop to confirm KPIs and success metrics",
          "Audit of existing data sources and export formats",
        ],
      },
      {
        title: "Design & Build",
        items: [
          "Dashboard information architecture and visual design",
          "Data pipeline and transformation layer",
          "Interactive dashboard implementation with role-based views",
        ],
      },
      {
        title: "Delivery & Enablement",
        items: ["UAT with school leadership", "Documentation and handover training"],
      },
    ],
    deliverables: [
      "Discovery summary and KPI definition pack",
      "Live analytics dashboard (web-based)",
      "Automated data pipeline",
      "Admin & teacher role-based views",
      "Documentation and handover session",
    ],
    timeline: [
      { phase: "Phase 1 — Discovery", duration: "1 week", focus: "KPI workshop, data audit and success criteria." },
      { phase: "Phase 2 — Design", duration: "1 week", focus: "Information architecture and dashboard visual design." },
      { phase: "Phase 3 — Build", duration: "1 week", focus: "Pipeline implementation and dashboard build." },
    ],
    terms: [
      "50% mobilisation to begin work; balance on final delivery.",
      "Two revision rounds included per deliverable.",
      "Weekly progress updates throughout the engagement.",
    ],
  },
  dva: {
    accountNumber: "9912345678",
    bankName: "Paystack Test Bank (Sandbox)",
    accountName: "Okomba Analytics",
    sandbox: true,
  },
});

fs.writeFileSync("/tmp/proposal-test.pdf", pdf);
console.log("PDF generated:", pdf.length, "bytes →", "/tmp/proposal-test.pdf");
