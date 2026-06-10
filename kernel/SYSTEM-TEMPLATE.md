# SYSTEM-TEMPLATE.md — Neutral Technical Rules Template
#
# INSTRUCTIONS:
# This is the BASE TEMPLATE. When creating a new project from this template:
# 1. Fill in the sections marked with [FILL IN]
# 2. Remove sections that do not apply to your stack
# 3. Rename to kernel/SYSTEM.md (or keep both, with SYSTEM.md being the active instance)
# 4. kernel/SYSTEM.md is the file read by the AI — this is only the fill-in guide.
#
# SCOPE OF THIS FILE:
# SYSTEM.md defines HOW code is written: standards, patterns, error handling, security rules.
# It does NOT define WHERE the project is hosted, WHAT versions are used, or WHICH integrations
# are active — all of that belongs in kernel/project.toml (the technical dictionary).
# Before filling this file, fill in kernel/project.toml first.

---

## Language and Stack
[FILL IN — Use kernel/project.toml as reference]

Example (TypeScript/Node):
- TypeScript with strict mode
- Node.js 20+ with ESM modules
- API: Express | NestJS | Fastify
- ORM: Prisma with PostgreSQL

Example (Python):
- Python 3.11+ with type hints
- FastAPI with Pydantic v2
- ORM: SQLAlchemy | Tortoise ORM
- Database: PostgreSQL | SQLite

Example (Mobile):
- Dart 3+ / Flutter 3.x
- State: Riverpod | Bloc
- APIs: REST via Dio

---

## Code Style
[FILL IN — Define your project's conventions]

Example:
- Use functional components (React)
- Prefer `const` over `let`
- Use explicit return types in TypeScript
- Avoid `any` — use only when strictly necessary
- `async/await` — never callbacks when a clear async alternative exists

---

## Logging
[FILL IN — Define the logging strategy]

Invariant rules (for any stack):
- NEVER use `console.log()` / `print()` in production code
- Use the project logger (define path here)
- Never log sensitive data (passwords, tokens, PII)
- Mandatory levels: info | warn | error

Example (Node.js):
```ts
import { logger } from './utils/logger'
logger.info('message', { context })
```

---

## Error Handling
[FILL IN — Define the error handling pattern]

Invariant rules:
- Critical errors do not propagate without context
- Never expose stack traces or internal details to the end user

Example (TypeScript):
```ts
try {
  const result = await operation()
  return { success: true, data: result }
} catch (error) {
  logger.error('Operation failed', { error })
  return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
}
```

---

## Security and Input Validation
These rules are invariant — do not remove:
- Validate all input with explicit schema (Zod | Pydantic | Joi | etc.)
- Assume all external input is malicious
- Use parameterized queries — never concatenate user input in SQL
- Never hardcode secrets, tokens, or credentials

---

## Technical Architecture
[FILL IN — Define layers and responsibilities]

Example (MVC/Clean):
- Controller handles HTTP; business logic stays in Services/Repositories
- Frontend does not access the database directly — only consumes HTTP/JSON APIs
- Sensitive routes must use an authentication middleware

Example (Feature-based):
- Each feature is self-contained: controller + service + repository + types
- Shared code lives in `src/shared/`

---

## Tests
[FILL IN — Define the testing strategy]

Invariant rules:
- Write tests for business logic
- Cover edge cases and error states
- Use descriptive test names

Example:
- Unit tests: Vitest | Jest | pytest
- E2E: Playwright
- Minimum coverage: 80% on critical logic

---

## Database
[FILL IN — Define database access rules]

Example (Prisma):
- Prisma is the only database access layer in the backend
- Migrations must be versioned (Prisma Migrate)
- If the schema changes, run `npx prisma generate` before continuing

Example (SQLAlchemy):
- Alembic for versioned migrations
- Pydantic models for serialization/validation at the boundary

---

## Engineering Philosophy
These rules are universal — always keep:
- Readability above cleverness
- Explicit above implicit
- Simple above complex
- Remove obsolete code rather than commenting it out

---

## Optional Sections (remove those that don't apply)

### Payments (e.g.: Stripe)
- Never store card numbers
- Use tokenization
- Log payment attempts
- Handle failures gracefully with idempotency keys

### State Management (e.g.: React)
- Use React Context for theme/user
- Avoid unnecessary global state
- Server state remains on the server

### Internationalization
[FILL IN — if the project has i18n]
- Library: i18next | next-intl | react-i18next
- Default locale: en-US (adjust per project)
- Translation files at: `src/locales/`
