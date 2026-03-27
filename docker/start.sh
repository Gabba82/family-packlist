#!/bin/sh
set -eu

DB_PATH="/app/data/app.db"
NEED_SEED=0

if [ ! -f "$DB_PATH" ]; then
  NEED_SEED=1
fi

export DATABASE_URL="${DATABASE_URL:-file:/app/data/app.db}"
export NEXT_TELEMETRY_DISABLED="${NEXT_TELEMETRY_DISABLED:-1}"

npx prisma migrate deploy

if [ "$NEED_SEED" -eq 1 ]; then
  npx prisma db seed
fi

exec npm run start -- -H 0.0.0.0 -p "${PORT:-3000}"
