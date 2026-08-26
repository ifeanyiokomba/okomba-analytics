#!/bin/sh
set -e

# We invoke prisma via `node ./node_modules/prisma/build/index.js` instead of
# `npx prisma` (or `node_modules/.bin/prisma`) on purpose:
#   • `npx` would resolve to `node_modules/.bin/prisma`, which Docker's COPY
#     dereferences from a symlink into a *regular file*, breaking Prisma's
#     runtime `__dirname`-based wasm lookup (`prisma_schema_build_bg.wasm`).
#   • Calling the entrypoint JS directly keeps `__dirname` =
#     `node_modules/prisma/build/`, which is where the wasm files actually
#     live, so the lookup succeeds. (See Dockerfile for the full rationale.)
#   • This works regardless of whether the `.bin/prisma` symlink was recreated.
echo "[entrypoint] applying database schema (idempotent)…"
node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss

echo "[entrypoint] seeding initial content (idempotent)…"
node scripts/seed-testimonials.mjs || echo "[entrypoint] seed skipped/failed — continuing (site still runs)"

echo "[entrypoint] starting Okomba Analytics on ${HOSTNAME}:${PORT}…"
exec node .next/standalone/server.js
