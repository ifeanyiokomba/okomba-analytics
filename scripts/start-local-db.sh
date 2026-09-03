#!/usr/bin/env bash
# ── Local embedded PostgreSQL (sandbox parity with Neon production) ──
# The production deployment (Render) uses Neon Postgres with
# provider="postgresql" in prisma/schema.prisma. To keep the local
# sandbox on the SAME schema (same provider, same Json column types),
# we run a real local PostgreSQL 16 from the zonky embedded binaries
# instead of diverging back to SQLite.
#
# Usage:   bash scripts/start-local-db.sh
# Effect:  PostgreSQL 16 listening on 127.0.0.1:54329 (trust auth,
#          loopback-only). .env DATABASE_URL already points here:
#          postgresql://okomba@127.0.0.1:54329/okomba?schema=public
#
# NOTE: never expose 54329 externally — only port 3000 is routed.

set -euo pipefail

PG_ROOT="${PG_ROOT:-/home/z/pg}"
PG_DATA="$PG_ROOT/data"
PG_LOG="$PG_ROOT/pg.log"
PG_PORT="${PG_PORT:-54329}"
PG_BIN="$PG_ROOT/pgdist/bin"

# 1. One-time bootstrap: download + extract binaries + initdb + createdb
if [ ! -x "$PG_BIN/postgres" ]; then
  echo "[pg] first run — downloading embedded PostgreSQL 16.4 (zonky)…"
  mkdir -p "$PG_ROOT/extracted" "$PG_ROOT/pgdist"
  curl -sL -o "$PG_ROOT/pg.jar" \
    "https://repo1.maven.org/maven2/io/zonky/test/postgres/embedded-postgres-binaries-linux-amd64/16.4.0/embedded-postgres-binaries-linux-amd64-16.4.0.jar"
  (cd "$PG_ROOT" && unzip -o -q pg.jar -d extracted)
  tar -xf "$PG_ROOT/extracted/postgres-linux-x86_64.txz" -C "$PG_ROOT/pgdist"
fi

if [ ! -f "$PG_DATA/PG_VERSION" ]; then
  echo "[pg] initdb…"
  mkdir -p "$PG_DATA"
  "$PG_BIN/initdb" -D "$PG_DATA" -U okomba --auth=trust -E UTF8
fi

# 2. Start (idempotent)
if "$PG_BIN/pg_ctl" -D "$PG_DATA" status >/dev/null 2>&1; then
  echo "[pg] already running on port $PG_PORT"
else
  "$PG_BIN/pg_ctl" -D "$PG_DATA" -l "$PG_LOG" \
    -o "-p $PG_PORT -c listen_addresses=127.0.0.1" -w start
  echo "[pg] started on 127.0.0.1:$PG_PORT"
fi

# 3. Ensure the app database exists (single-user mode — no createdb
#    binary ships with the zonky dist).
if ! "$PG_BIN/pg_ctl" -D "$PG_DATA" status >/dev/null 2>&1; then
  echo "[pg] FATAL: server did not start — see $PG_LOG" >&2
  exit 1
fi
