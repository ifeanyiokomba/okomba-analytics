import { PrismaClient, Prisma } from '@/generated/prisma'

/**
 * Dual-provider database client.
 * ═══════════════════════════════════════════════════════════════════
 * ONE schema, ONE application codebase, TWO deployment targets:
 *
 *   DATABASE_URL=postgresql://…  → the committed PostgreSQL client
 *     (src/generated/prisma — generated from prisma/schema.prisma,
 *     native `Json` columns, deployed on Render + Neon).
 *
 *   DATABASE_URL=file:…          → the locally generated SQLite twin
 *     (src/generated/prisma-sqlite — generated from
 *     prisma/schema.sqlite.prisma via scripts/make-sqlite-schema.mjs,
 *     `Json` columns mapped to `String`).
 *
 * The mode is derived from DATABASE_URL itself — no extra env vars.
 *
 * JSON BRIDGE (sqlite mode only)
 * ───────────────────────────────
 * SQLite has no native Json type, so the twin schema stores JSON in
 * `String` columns. A Prisma client extension transparently converts:
 *   • writes: object → JSON.stringify  (only in sqlite mode)
 *   • reads:  string → JSON.parse      (safe no-op for objects)
 * The read side is parse-if-string, so it also heals any legacy
 * double-encoded rows regardless of provider. Production NEVER runs
 * the write side (native Json input already takes objects).
 */

const DATABASE_URL = process.env.DATABASE_URL ?? ''
const SQLITE_MODE = DATABASE_URL.startsWith('file:')

/** True when this module has been pulled into a browser bundle (via
 *  value-import chains like post-editor-dialog → slugify → posts → db).
 *  Constructing a PrismaClient in a browser throws at import time and
 *  kills the whole chunk — so browser builds get a fail-loud proxy that
 *  only throws IF a client component actually calls into db. */
const IS_BROWSER =
  typeof window !== 'undefined' && typeof window.document !== 'undefined'

/* ── global Prisma singleton (dev hot-reload) ──────────────────── */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaCacheKey: string | undefined
}

/**
 * Cache key guards against stale clients after `prisma generate` runs
 * mid-development (e.g. new models added): if the key changes, a fresh
 * client is instantiated instead of reusing the outdated global one.
 */
const PRISMA_CACHE_KEY = 'schema-v14-merged-dual-mode'

/* ── JSON bridge: the Json columns (see prisma/schema.prisma) ──── */

const JSON_FIELD_NAMES = new Set([
  'draftJson',    // DraftProposal
  'result',       // WebhookLog
  'payload',      // WebhookLog / EventRecord
  'tags',         // Post / Customer
  'attachments',  // EmailLog
  'meta',         // ReceivedEmail / AnalyticsEvent
  'proposalJson', // Invoice
])

const WRITE_OPERATIONS = new Set([
  'create', 'createMany', 'update', 'updateMany', 'upsert',
])

/** Prisma's JSON null sentinels — resolved lazily (server-side only). */
function isPrismaJsonNull(value: unknown): boolean {
  return value === Prisma.JsonNull || value === Prisma.DbNull
}

function looksLikeJson(value: string): boolean {
  const first = value.trimStart()[0]
  return first === '{' || first === '[' || first === '"'
}

/** Recursively parse-if-string at known Json field keys. */
function parseJsonFields(value: unknown, depth = 0): void {
  if (depth > 5 || value === null || value === undefined) return
  if (Array.isArray(value)) {
    for (const item of value) parseJsonFields(item, depth + 1)
    return
  }
  if (value instanceof Date || typeof value !== 'object') return
  const row = value as Record<string, unknown>
  for (const key of Object.keys(row)) {
    const cell = row[key]
    if (
      typeof cell === 'string' &&
      JSON_FIELD_NAMES.has(key) &&
      looksLikeJson(cell)
    ) {
      try {
        row[key] = JSON.parse(cell)
      } catch {
        /* not valid JSON — leave the raw string in place */
      }
    } else {
      parseJsonFields(cell, depth + 1)
    }
  }
}

/** Recursively stringify-if-object at known Json field keys (writes). */
function stringifyJsonFields(value: unknown, depth = 0): void {
  if (depth > 5 || value === null || value === undefined) return
  if (Array.isArray(value)) {
    for (const item of value) stringifyJsonFields(item, depth + 1)
    return
  }
  if (value instanceof Date || typeof value !== 'object') return
  if (isPrismaJsonNull(value)) return
  const row = value as Record<string, unknown>
  for (const key of Object.keys(row)) {
    const cell = row[key]
    if (
      typeof cell === 'object' &&
      cell !== null &&
      !(cell instanceof Date) &&
      !isPrismaJsonNull(cell) &&
      JSON_FIELD_NAMES.has(key)
    ) {
      row[key] = JSON.stringify(cell)
    } else {
      stringifyJsonFields(cell, depth + 1)
    }
  }
}

/**
 * Parse a value that may be a JSON string (sqlite column, or a legacy
 * double-encoded write) OR an already-parsed object (postgres Json).
 * Use at call sites that historically did `JSON.parse(row.field)`.
 */
export function jsonLoose<T = unknown>(value: unknown): T {
  if (typeof value === 'string' && looksLikeJson(value)) {
    try {
      return JSON.parse(value) as T
    } catch {
      return value as unknown as T
    }
  }
  return value as T
}

/**
 * The JSON bridge — applied on BOTH providers:
 *   • reads:  parse-if-string (no-op for objects). Heals rows written
 *     by either code style (native-object writes AND legacy
 *     JSON.stringify writes) so the API surface is uniform.
 *   • writes: stringify-if-object — ONLY in sqlite mode (String
 *     columns). On postgres the native Json input already takes
 *     objects, so the write side is a no-op there.
 */
function withJsonBridge(base: PrismaClient): PrismaClient {
  const extended = base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          if (SQLITE_MODE) stringifyJsonFields(args)
          const result = await query(args)
          parseJsonFields(result)
          return result
        },
      },
    },
  })
  // The extension preserves every model delegate + $queryRaw; the cast
  // keeps the public type identical to the production client.
  return extended as unknown as PrismaClient
}

/* ── client construction ───────────────────────────────────────── */

function newPostgresClient(): PrismaClient {
  return withJsonBridge(
    new PrismaClient({
      // Query logging is a dev aid — keep production stdout clean.
      log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
    })
  )
}

function newSqliteClient(): PrismaClient {
  // Node built-ins are resolved LAZILY (never statically imported) so
  // bundlers building browser chunks never see `node:module`/`node:path`
  // — this file sits in a graph shared with client components via
  // @/lib/posts et al. process.getBuiltinModule exists on Node ≥22.3
  // and bypasses bundler static analysis entirely.
  type NodeModuleNS = { createRequire: (path: string) => NodeRequire }
  type ProcessWithBuiltins = typeof process & {
    getBuiltinModule?: <T = unknown>(id: string) => T
  }
  const proc = process as ProcessWithBuiltins
  const nodeModule = proc.getBuiltinModule?.<NodeModuleNS>('node:module')
  if (!nodeModule?.createRequire) {
    throw new Error(
      '[db] process.getBuiltinModule unavailable — Node >= 22.3 required for sqlite dev mode'
    )
  }
  // Load the locally generated SQLite twin OUTSIDE the bundler's
  // static analysis (createRequire resolves at runtime, from disk).
  // src/generated/prisma-sqlite is gitignored + produced by:
  //   bun run db:local
  //   (derives prisma/schema.sqlite.prisma, generates the twin client,
  //    pushes db/custom.db and seeds)
  const require = nodeModule.createRequire(`${process.cwd()}/package.json`)
  const mod = require('./src/generated/prisma-sqlite') as {
    PrismaClient: new (opts?: { log?: string[] }) => PrismaClient
  }
  const client = new mod.PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })
  return withJsonBridge(client)
}

function buildDb(): PrismaClient {
  if (IS_BROWSER) {
    // Browser bundles import this module transitively (see IS_BROWSER
    // above) but must never USE it — all admin data flows through the
    // /api routes. The proxy keeps the import side-effect-free while
    // failing loudly on any accidental client-side db usage.
    return new Proxy({} as PrismaClient, {
      get(_target, prop: string) {
        throw new Error(
          `[db] server-only client accessed in the browser (.${prop}) — use the /api routes instead`
        )
      },
    })
  }
  try {
    return SQLITE_MODE ? newSqliteClient() : newPostgresClient()
  } catch (err) {
    if (SQLITE_MODE) {
      console.error(
        '[db] sqlite mode selected (DATABASE_URL=file:…) but the local client is missing.\n' +
        '      Run the bootstrap:  bun run db:local\n' +
        '      (generates prisma/schema.sqlite.prisma + src/generated/prisma-sqlite + db/custom.db)'
      )
    }
    throw err
  }
}

export const db =
  globalForPrisma.prisma && globalForPrisma.prismaCacheKey === PRISMA_CACHE_KEY
    ? globalForPrisma.prisma
    : buildDb()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
  globalForPrisma.prismaCacheKey = PRISMA_CACHE_KEY
}

export { SQLITE_MODE }
