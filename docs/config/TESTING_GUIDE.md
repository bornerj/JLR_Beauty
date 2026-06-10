# Testing Guide

This guide documents how to test the future full-stack environment (React + Express + Prisma + MySQL).
Current project is static HTML/Tailwind; testing steps below are for when backend is active.

## Goals
- Validate business rules and data integrity.
- Catch regressions before deploys.
- Cover critical admin workflows (services/users/products).

## Test Types
- **Unit**: services, validators, utilities (fast, isolated).
- **Integration**: API routes + database.
- **E2E**: user/admin flows in the browser.

## Environments
- **development**: local DB, verbose logs.
- **test**: isolated DB/schema, deterministic seed.
- **staging**: production-like (avoid destructive tests).

## Database Setup (Test)
Use a dedicated schema:
- `jlr_ai_studio_test`

Proposed reset flow:
1. Drop & recreate test schema.
2. Apply Prisma migrations.
3. Run base seed.
4. Run feature seed.
5. Optional: error seed for negative tests.

## Seed Strategy
Seeds live under `data/seeds/` (versioned).

Seed sets:
- **base**: minimal required entities.
- **feature**: realistic data for UI flows.
- **error**: invalid/edge-case data.

Error seed examples:
- Duplicate emails (unique constraint).
- Orphaned relations (missing category).
- Zero/negative price (validation).
- Overlong strings (length checks).
- Unicode/emoji inputs (encoding).

## Security & Failure Cases
Connection failures:
- Wrong DB host/port
- Invalid credentials
- Timeout/delay

SQL injection payloads:
- `' OR 1=1 --`
- `"; DROP TABLE services; --`
- `admin'/*`

Auth/permission:
- No token (401)
- Non-admin role (403)
- Expired/tampered token (401)

Rate limit/abuse:
- Rapid login attempts
- Burst submissions to forms

## Proposed Scripts (Future)
- `test:unit`
- `test:integration`
- `test:e2e`
- `db:reset:test`
- `seed:base`
- `seed:feature`
- `seed:error`

## Example Test Flow (Future)
1. `db:reset:test`
2. `seed:base`
3. `seed:feature`
4. `test:unit`
5. `test:integration`
6. `test:e2e`

## Observability
- Capture API logs on failing tests.
- Store E2E screenshots/traces for flaky cases.
- Record DB errors and slow queries.
