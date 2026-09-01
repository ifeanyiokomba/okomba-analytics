#!/usr/bin/env node
/**
 * smart-db.mjs — provider-aware Prisma task runner.
 * ═══════════════════════════════════════════════════════════════════
 * Routes `db:push` / `db:generate` to the correct schema based on
 * DATABASE_URL — the single source of truth (see src/lib/db.ts):
 *
 *   DATABASE_URL=postgresql://… → prisma/schema.prisma      (prod)
 *   DATABASE_URL=file:…         → prisma/schema.sqlite.prisma (local)
 *
 * Subcommands:
 *   push          safe schema push (no data loss)
 *   push-unsafe   push --accept-data-loss (explicit opt-in)
 *   generate      generate the client for the active provider
 *   local         full local bootstrap: derive sqlite schema →
 *                 generate sqlite client → push → seed
 *
 * Production paths are unaffected: render.yaml and docker-entrypoint.sh
 * call the prisma CLI directly against prisma/schema.prisma.
 */

import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const envPath = join(root, ".env");

// Minimal .env parse (DATABASE_URL only) — no dotenv dependency.
let databaseUrl = process.env.DATABASE_URL ?? "";
if (!databaseUrl && existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = /^DATABASE_URL\s*=\s*(.+)\s*$/.exec(line);
    if (m) {
      databaseUrl = m[1].trim().replace(/^["']|["']$/g, "");
      break;
    }
  }
}

const SQLITE = databaseUrl.startsWith("file:");
const PG_SCHEMA = join("prisma", "schema.prisma");
const SQLITE_SCHEMA = join("prisma", "schema.sqlite.prisma");
const activeSchema = SQLITE ? SQLITE_SCHEMA : PG_SCHEMA;

function prisma(args, { acceptDataLoss = false } = {}) {
  const cli = join(root, "node_modules", "prisma", "build", "index.js");
  const full = acceptDataLoss ? [...args, "--accept-data-loss"] : args;
  console.log(`[smart-db] prisma ${full.join(" ")} (provider: ${SQLITE ? "sqlite" : "postgresql"})`);
  const res = spawnSync("node", [cli, ...full], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl || undefined },
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

function ensureSqliteSchema() {
  if (!existsSync(join(root, SQLITE_SCHEMA))) {
    console.log("[smart-db] deriving prisma/schema.sqlite.prisma …");
    const res = spawnSync("node", [join(root, "scripts", "make-sqlite-schema.mjs")], {
      cwd: root, stdio: "inherit",
    });
    if (res.status !== 0) process.exit(res.status ?? 1);
  }
}

const cmd = process.argv[2];

switch (cmd) {
  case "push":
    if (SQLITE) ensureSqliteSchema();
    prisma(["db", "push", "--schema", activeSchema]);
    break;

  case "push-unsafe":
    if (SQLITE) ensureSqliteSchema();
    prisma(["db", "push", "--schema", activeSchema, "--skip-generate"], { acceptDataLoss: true });
    break;

  case "generate":
    if (SQLITE) ensureSqliteSchema();
    prisma(["generate", "--schema", activeSchema]);
    break;

  case "local": {
    console.log("[smart-db] local bootstrap: derive → generate → push → seed");
    const derive = spawnSync("node", [join(root, "scripts", "make-sqlite-schema.mjs")], {
      cwd: root, stdio: "inherit",
    });
    if (derive.status !== 0) process.exit(derive.status ?? 1);
    prisma(["generate", "--schema", SQLITE_SCHEMA]);
    prisma(["db", "push", "--schema", SQLITE_SCHEMA, "--skip-generate"]);
    const seed = join(root, "scripts", "seed-testimonials.mjs");
    if (existsSync(seed)) {
      const res = spawnSync("node", [seed], { cwd: root, stdio: "inherit" });
      if (res.status !== 0) console.log("[smart-db] seed failed — continuing (site still runs)");
    }
    console.log("[smart-db] local environment ready (db/custom.db)");
    break;
  }

  default:
    console.error(
      `Usage: node scripts/smart-db.mjs <push|push-unsafe|generate|local>\n` +
        `Active provider: ${SQLITE ? "sqlite" : "postgresql"} (${databaseUrl.slice(0, 12)}…)`
    );
    process.exit(1);
}
