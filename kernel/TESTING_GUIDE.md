# TESTING_GUIDE.md — Universal Testing Directives

Loaded when testing tasks are active. Defines the mandatory testing strategy for any project built on this template.
Stack-specific tooling goes in `kernel/SYSTEM.md`. This file defines the **principles and structure** that apply regardless of stack.

---

## Core Principle

Tests are not optional. Every feature that touches business logic must have a test.
Tests document behavior and prevent regressions — they are part of the deliverable, not an afterthought.

---

## Test Pyramid

```
         [E2E]
        (few, slow)
       ─────────────
      [Integration]
     (some, medium)
    ─────────────────
         [Unit]
      (many, fast)
```

- **Unit**: functions, validators, utilities — isolated, no I/O.
- **Integration**: service + database + API routes — validates contracts.
- **E2E**: full user flows in the browser — validates critical paths only.

Rule: most coverage comes from unit + integration. E2E covers the 3–5 flows a failure in would be catastrophic.

---

## Test Environments

| Environment | Database | Purpose |
|---|---|---|
| `development` | local DB, verbose logs | day-to-day work |
| `test` | isolated schema, deterministic seed | automated test runs |
| `staging` | production-like | pre-release validation (no destructive tests) |

The `test` environment must be fully reproducible: drop → migrate → seed → run → pass.

---

## Seed Strategy

Every project must define three seed sets:

| Seed | Content |
|---|---|
| `base` | Minimum required entities for the app to function |
| `feature` | Realistic data for UI and integration flows |
| `error` | Invalid/edge-case data: duplicates, missing relations, boundary values |

Seeds are versioned alongside migrations.

---

## What Must Always Be Tested

Regardless of stack, these categories are non-negotiable:

### Business Logic
- Every service function that enforces a rule.
- Every validator that rejects invalid input.
- Every state transition (order status, user role changes, etc.).

### API Contracts
- Success responses return the correct shape.
- Error responses return consistent error structure.
- Auth-protected routes reject unauthenticated and unauthorized requests.

### Security Baseline
- SQL/NoSQL injection payloads rejected.
- Auth tokens: missing (401), expired (401), tampered (401), insufficient role (403).
- Rate limit / burst inputs handled gracefully.

### Data Integrity
- Unique constraints enforced.
- Cascade/orphan behavior is intentional and tested.
- Boundary values (zero, negative, max length, unicode) handled without crash.

---

## Standard Script Names

Define these in `package.json` (or equivalent) for every project:

```
test:unit          → unit tests only
test:integration   → integration tests only
test:e2e           → E2E tests only
test               → full suite
db:reset:test      → drop → migrate → seed (test environment)
seed:base          → base seed only
seed:feature       → feature seed only
seed:error         → error/edge-case seed
```

---

## Standard Test Flow (pre-deploy)

```
1. db:reset:test
2. seed:base
3. seed:feature
4. test:unit
5. test:integration
6. test:e2e
```

---

## Observability During Tests

- Capture API response logs on failing integration tests.
- Store E2E screenshots and traces for flaky or failed cases.
- Record slow queries and DB errors separately from app logs.

---

## Rules for the AI

- Do not write code without a corresponding test if the code contains business logic.
- Do not skip the `error` seed — edge cases are where bugs live.
- When a bug is fixed, add a regression test that would have caught it.
- When selecting the test stack, refer to `kernel/SYSTEM.md` for the project's chosen tools.
