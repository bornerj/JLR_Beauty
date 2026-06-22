#!/bin/bash
# Runs once on a fresh PostgreSQL data directory.
# Creates the least-privilege API users and applies RLS on sensitive tables.
set -e

RW_PASS="${DB_API_RW_PASSWORD:-JLRapiRW_Dev2026!}"
RO_PASS="${DB_API_RO_PASSWORD:-JLRapiRO_Dev2026!}"
DB="${POSTGRES_DB:-jlrbeauty}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$DB" <<-EOSQL

-- ─── API users ────────────────────────────────────────────────────────────────
CREATE USER jlr_api_rw WITH PASSWORD '${RW_PASS}';
CREATE USER jlr_api_ro  WITH PASSWORD '${RO_PASS}';

GRANT CONNECT ON DATABASE ${DB} TO jlr_api_rw;
GRANT CONNECT ON DATABASE ${DB} TO jlr_api_ro;

GRANT USAGE ON SCHEMA public TO jlr_api_rw;
GRANT USAGE ON SCHEMA public TO jlr_api_ro;

-- Existing tables (none at init time; Prisma creates them at migrate)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO jlr_api_rw;
GRANT USAGE, SELECT                  ON ALL SEQUENCES IN SCHEMA public TO jlr_api_rw;

GRANT SELECT                         ON ALL TABLES    IN SCHEMA public TO jlr_api_ro;
GRANT USAGE, SELECT                  ON ALL SEQUENCES IN SCHEMA public TO jlr_api_ro;

-- Future tables created by ${POSTGRES_USER} automatically grant to API users
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES    TO jlr_api_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT                  ON SEQUENCES TO jlr_api_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT                         ON TABLES    TO jlr_api_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT                  ON SEQUENCES TO jlr_api_ro;

EOSQL
