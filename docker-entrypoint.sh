#!/bin/sh
set -e

echo "[entrypoint] applying database schema (idempotent)…"
npx prisma db push --skip-generate --accept-data-loss

echo "[entrypoint] seeding initial content (idempotent)…"
node scripts/seed-testimonials.mjs || echo "[entrypoint] seed skipped/failed — continuing (site still runs)"

echo "[entrypoint] starting Okomba Analytics on ${HOSTNAME}:${PORT}…"
exec node .next/standalone/server.js
