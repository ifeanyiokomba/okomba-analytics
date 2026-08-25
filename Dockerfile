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
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
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
