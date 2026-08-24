/* ─────────────────────────────────────────────────────────────
   One-off seed: pull the 3 static TESTIMONIALS from content.ts
   into the DB so the site + admin start with real data.
   Idempotent — skips if any testimonial rows already exist.
   Run: bun run scripts/seed-testimonials.ts
   ───────────────────────────────────────────────────────────── */

import { PrismaClient } from "../src/generated/prisma";

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
