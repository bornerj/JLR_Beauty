---
name: engineering-backend-architect
description: Backend architecture and server-side delivery guidance for APIs, services, databases, integrations, security, performance, and reliability. Use when designing backend systems, implementing server-side features, reviewing backend code, defining schemas and contracts, or planning infrastructure-aware backend changes.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Engineering Backend Architect

Use this skill to turn backend requirements into a concrete implementation plan, safe design decisions, and production-ready changes.

## Operating Principles

- Start from business requirements, constraints, and failure modes.
- Prefer the simplest architecture that meets scale, reliability, and security needs.
- Design for observability, recovery, and operational clarity from the start.
- Treat security and data integrity as default requirements, not optional follow-up work.

## Workflow

1. Clarify the request:
   - Identify domains, actors, data flows, integrations, SLOs, and compliance constraints.
   - Call out missing requirements that affect correctness, scale, or security.
2. Shape the system:
   - Choose the service boundary, API style, data model, and communication pattern.
   - State trade-offs explicitly when choosing monolith vs modular service, sync vs async flow, SQL vs NoSQL, queue vs direct call, and similar decisions.
3. Design the data layer:
   - Define entities, ownership, lifecycle, indexes, constraints, and migration strategy.
   - Optimize for common read/write paths instead of theoretical flexibility.
4. Design the runtime behavior:
   - Specify validation, idempotency, retries, rate limits, timeouts, and concurrency controls.
   - Define logging, metrics, tracing, alerting, and backpressure behavior.
5. Implement with guardrails:
   - Keep contracts explicit.
   - Add tests around business rules, error handling, and regression-prone edge cases.
6. Verify before handoff:
   - Validate happy path, failure path, authorization, and performance-sensitive flows.

## Default Checklist

Before finalizing backend work, verify:

- Clear ownership of each service, module, and data store
- Input validation at every trust boundary
- Authentication and authorization rules are explicit
- Idempotency strategy for retried or duplicated requests
- Query/index strategy for critical database paths
- Timeouts, retries, and circuit-breaker behavior for external dependencies
- Structured logs and actionable metrics for the new flow
- Migration and rollback safety for schema changes
- Tests covering both business rules and operational failure cases

## API and Contract Guidance

- Define request/response contracts before implementation.
- Prefer explicit versioning or additive evolution when contracts are externally consumed.
- Return errors that are machine-readable and operationally useful.
- Keep domain logic out of transport handlers when possible.
- Document invariants, side effects, and eventual consistency expectations.

## Data and Persistence Guidance

- Model entities around real domain boundaries, not UI screens.
- Use constraints and indexes intentionally; do not defer integrity entirely to application code.
- Plan migrations as forward-only changes unless the environment requires reversible scripts.
- For high-write or high-read paths, measure expected access patterns and optimize those first.
- Be explicit about consistency requirements, retention rules, and deletion behavior.

## Reliability and Security Guidance

- Assume partial failure: dependency outages, slow queries, duplicate events, stale caches.
- Use least privilege for service and database access.
- Encrypt sensitive data in transit and at rest when applicable.
- Protect public surfaces with authentication, authorization, validation, and rate limits.
- Prefer graceful degradation over silent corruption or undefined behavior.

## Validation

For significant backend work, provide:

- Architecture summary
- Contract or schema summary
- Operational risks and mitigations
- Test/verification notes

## Related Skills

- `@[skills/architecture]` for system-level trade-off analysis
- `@[skills/api-patterns]` for API design conventions
- `@[skills/database-design]` for schema and indexing work
- `@[skills/nodejs-best-practices]` or `@[skills/python-patterns]` for language-specific implementation details
- `@[skills/testing-patterns]` for test strategy
