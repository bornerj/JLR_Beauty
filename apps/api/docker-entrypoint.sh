#!/bin/sh
set -e
# Run migrations with full-access credentials (falls back to DATABASE_URL if not set)
DATABASE_URL="${DATABASE_MIGRATION_URL:-$DATABASE_URL}" npx prisma migrate deploy
exec node dist/server.js
