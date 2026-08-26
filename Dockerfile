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

# Install ONLY production deps at runtime. This is necessary because Prisma 6's
# CLI has transitive runtime deps that live OUTSIDE the `prisma/` and `@prisma/`
# packages — specifically `@prisma/config` requires `effect`, `c12`,
# `deepmerge-ts`, `empathic`, and `c12` itself pulls in `chokidar`, `confbox`,
# `defu`, `dotenv`, `exsolve`, `giget`, `jiti`, `ohash`, `pathe`,
# `perfect-debounce`, `pkg-types`, `rc9`, each with their own transitive deps.
#
# Our previous "slim" Dockerfile (commits ceb45ad / a9fe579) copied only the
# `prisma` and `@prisma` packages from the builder — which worked for Prisma 5
# (no external runtime deps) but broke on Prisma 6 with:
#     Error: Cannot find module 'effect'
#     Require stack:
#     - /app/node_modules/@prisma/config/dist/index.js
#     - /app/node_modules/prisma/build/index.js
# (see Render deploy log 2026-08-26T18:19:19Z).
#
# Copying each transitive dep piecemeal would be whack-a-mole. `npm install
# --omit=dev` resolves the full production dep tree (~70 direct deps + all
# transitive, ~300MB) and creates the `.bin/prisma` symlink via npm's standard
# bin-linking — so `npx prisma`, `node_modules/.bin/prisma`, AND the entrypoint's
# `node ./node_modules/prisma/build/index.js` call all work correctly.
#
# `--no-package-lock` because the project ships `bun.lock` (not
# `package-lock.json`) — Render's Node runtime ships npm, not bun, so we let npm
# resolve fresh (no lockfile to drive `npm ci`).
#
# This install is SOLELY for the Prisma CLI invocation in docker-entrypoint.sh
# (`prisma db push`). The Next.js standalone server in `.next/standalone/`
# has its own bundled `node_modules/` (Next.js traces imports at build time and
# inlines them there) — it does NOT depend on this top-level install.
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund --no-package-lock

# Generated Prisma client (self-contained at src/generated/prisma/ — no
# external deps per its package.json) + schema + standalone Next.js server
# (has its own bundled node_modules) + seed script.
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
