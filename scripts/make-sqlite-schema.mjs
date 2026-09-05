#!/usr/bin/env node
/**
 * make-sqlite-schema.mjs — generate the LOCAL-DEV SQLite schema variant.
 * =====================================================================
 *
 * WHY THIS EXISTS
 * ───────────────
 * The repository's canonical schema (`prisma/schema.prisma`) targets
 * PostgreSQL (Neon) for production — including native `Json` columns,
 * which Prisma does NOT support on SQLite. The sandbox / local-dev
 * environment only has SQLite, so this script derives a byte-predictable
 * SQLite twin of the production schema:
 *
 *   • datasource provider  postgresql → sqlite
 *   • generator output     ../src/generated/prisma → ../src/generated/prisma-sqlite
 *   • every `Json` column  → `String` (same @default string literal)
 *
 * The runtime string↔object conversion for those columns is handled by
 * the JSON bridge in `src/lib/db.ts` (parse-if-string on reads,
 * stringify-if-object on writes — active ONLY in sqlite mode), so the
 * application code is identical on both providers:
 *
 *   DATABASE_URL=file:…    → sqlite client + JSON bridge (local dev)
 *   DATABASE_URL=postgres… → postgres client, native Json (production)
 *
 * USAGE
 * ─────
 *   node scripts/make-sqlite-schema.mjs
 *   (idempotent — safe to run before every local `prisma generate`/`db push`)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const src = join(root, "prisma", "schema.prisma");
const dst = join(root, "prisma", "schema.sqlite.prisma");

const original = readFileSync(src, "utf8");

let out = original;

// 1. Datasource provider: postgresql → sqlite
out = out.replace(
  /^(\s*provider\s*=\s*)"postgresql"/m,
  '$1"sqlite"'
);

// 2. Generator output: local twin directory
out = out.replace(
  /^(\s*output\s*=\s*)"([^"]*src\/generated\/)prisma"/m,
  '$1"$2prisma-sqlite"'
);

// 3. Column types: Json → String (optional `?` and @default preserved)
//    A `String @default("{}")` on SQLite stores the literal '{}'
//    string — the db.ts bridge parses it back into {} on read.
out = out.replace(/^(\s*\w+\s+)Json(\s|\?)/gm, "$1String$2");

if (out === original) {
  console.error("[make-sqlite-schema] ERROR — no transformations applied; schema layout changed?");
  process.exit(1);
}

// Sanity: no Json columns may remain
const leftover = out.match(/^\s*\w+\s+Json[\s?]/gm);
if (leftover) {
  console.error("[make-sqlite-schema] ERROR — unconverted Json columns:", leftover);
  process.exit(1);
}

writeFileSync(dst, out);
console.log(
  `[make-sqlite-schema] wrote prisma/schema.sqlite.prisma ` +
    `(${out.split("\n").length} lines, provider=sqlite, Json→String)`
);
