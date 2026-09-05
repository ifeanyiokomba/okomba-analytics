/* ─────────────────────────────────────────────────────────────
   Production seed (plain Node, no bun/tsx required).
   Idempotent — inserts the 3 core testimonials only when the
   table is empty. Safe to run on every boot.
   Run: node scripts/seed-testimonials.mjs
   ───────────────────────────────────────────────────────────── */

import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";

/* ── Provider-aware client (dual-mode: see scripts/smart-db.mjs) ──
   DATABASE_URL=file:…        → sqlite twin client (local dev)
   DATABASE_URL=postgresql://… → committed postgres client (prod)   */
function resolveDatabaseUrl() {
  let url = process.env.DATABASE_URL ?? "";
  if (!url && existsSync(".env")) {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const m = /^DATABASE_URL\s*=\s*(.+)$/.exec(line);
      if (m) { url = m[1].trim(); break; }
    }
  }
  return url;
}

const require = createRequire(import.meta.url);
const generated =
  resolveDatabaseUrl().startsWith("file:")
    ? require("../src/generated/prisma-sqlite/index.js")
    : require("../src/generated/prisma/index.js");
const PrismaClient = generated.PrismaClient ?? generated.default?.PrismaClient;
const prisma = new PrismaClient();

const SEED = [
  {
    name: "Chukwuemeka Obi",
    role: "Founder, TechStartNG",
    service: "Web Development",
    text: "OKOMBA ANALYTICS transformed our digital operations completely. The web app they built for us exceeded every expectation — professional, fast, and beautifully designed.",
    rating: 5,
    avatar: "/images/avatar-chukwuemeka.png",
    status: "published",
    sortOrder: 1,
  },
  {
    name: "Adaeze Nwosu",
    role: "Director, EduBridge Foundation",
    service: "Event Coordination",
    text: "Their event coordination service is world-class. They managed our entire virtual summit seamlessly — from registration to certificate distribution. Absolutely flawless execution.",
    rating: 5,
    avatar: "/images/avatar-adaeze.png",
    status: "published",
    sortOrder: 2,
  },
  {
    name: "Ibrahim Suleiman",
    role: "CEO, FinFlow Nigeria",
    service: "Payment Integration",
    text: "The payment integration support was exceptional. Complex Remita and gateway setups handled effortlessly. Our transaction processing is now fully automated.",
    rating: 5,
    avatar: "/images/avatar-ibrahim.png",
    status: "published",
    sortOrder: 3,
  },
];

async function main() {
  const existing = await prisma.testimonial.count();
  if (existing > 0) {
    console.log(`[seed-testimonials] ${existing} row(s) already present — skipping.`);
    return;
  }
  await prisma.testimonial.createMany({ data: SEED });
  console.log(`[seed-testimonials] seeded ${SEED.length} testimonials.`);
}

main()
  .catch((err) => {
    console.error("[seed-testimonials] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
