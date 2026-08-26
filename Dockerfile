# ─────────────────────────────────────────────────────────────
# Okomba Analytics — production container
# Next.js standalone output + Prisma (SQLite on a mounted volume)
#
# Build:  docker build -t okomba-analytics .
# Run:    docker run -p 3000:3000 \
#           -v okomba-data:/data \
#           -e ADMIN_EMAIL=... -e ADMIN_PASSWORD=... \
#           okomba-analytics
# ─────────────────────────────────────────────────────────────

# ── Stage 1: build ────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Dependencies first (layer cache)
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Source + build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# ── Stage 2: runtime ──────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL=file:/data/custom.db

# Prisma CLI (runtime dependency) + generated client + schema
# + standalone server + static assets + public files + seed
#
# NOTE: we deliberately do NOT `COPY --from=builder .../node_modules/.bin/prisma`
# here. In a normal `npm install`, `node_modules/.bin/prisma` is a *symlink* →
# `../prisma/build/index.js`, and Prisma's bundled launcher resolves its
# `prisma_schema_build_bg.wasm` (and the per-engine `query_compiler_bg.*.wasm`
# files) via `__dirname`. Docker's `COPY` dereferences symlinks — so copying
# the symlink would land a *regular file* at `.bin/prisma`, making `__dirname`
# resolve to `.bin/` instead of `prisma/build/`, and the wasm lookup fails with
# `ENOENT: ... prisma_schema_build_bg.wasm` (see Render deploy log
# 2026-08-25T22:30:06Z). We recreate the symlink ourselves below so `npx prisma`
# (used by docker-entrypoint.sh and render.yaml startCommand) keeps working,
# AND the entrypoint also calls prisma directly via
# `node ./node_modules/prisma/build/index.js` as a belt-and-suspenders fallback.
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
RUN mkdir -p node_modules/.bin && ln -sf ../prisma/build/index.js node_modules/.bin/prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next/standalone ./.next/standalone
COPY --from=builder /app/scripts/seed-testimonials.mjs ./scripts/seed-testimonials.mjs

# Entrypoint: init DB (idempotent) → seed (idempotent) → serve
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && mkdir -p /data

EXPOSE 3000
VOLUME /data
ENTRYPOINT ["/docker-entrypoint.sh"]
