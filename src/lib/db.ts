import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaCacheKey: string | undefined
}

/**
 * Cache key guards against stale clients after `prisma generate` runs
 * mid-development (e.g. new models added): if the key changes, a fresh
 * client is instantiated instead of reusing the outdated global one.
 */
const PRISMA_CACHE_KEY = 'schema-v13-email-failover'

export const db =
  globalForPrisma.prisma && globalForPrisma.prismaCacheKey === PRISMA_CACHE_KEY
    ? globalForPrisma.prisma
    : new PrismaClient({
        // Query logging is a dev aid — keep production stdout clean.
        log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
      })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
  globalForPrisma.prismaCacheKey = PRISMA_CACHE_KEY
}
