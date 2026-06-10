---
name: agents-orchestrator
description: Multi-agent execution protocol for complex delivery work that needs planning, architecture, implementation, QA, and synthesis across multiple specialists. Use when a task spans multiple domains, benefits from coordinated specialist passes, or requires explicit quality gates before completion.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Agents Orchestrator

Use this skill to coordinate specialist agents or distinct workstreams without losing scope control, evidence, or validation rigor.

## When to Orchestrate

Use orchestration when:

- The task spans backend, frontend, database, testing, or deployment concerns
- Independent analysis from different specialists will improve decision quality
- The work needs phase gates such as discovery -> implementation -> QA
- A single agent would likely miss cross-functional risks

Do not orchestrate simple, single-domain changes that can be completed directly.

## Core Rules

- Keep one source of truth for scope, assumptions, and current status.
- Give each specialist a narrow, explicit objective.
- Require evidence before marking a phase complete.
- Prefer incremental validation over end-of-project surprises.
- Stop retry loops when they stop adding signal; escalate the blocker instead.

## Recommended Phase Flow

1. Discovery
   - Clarify the request, affected systems, acceptance criteria, and risks.
   - Use `@[skills/architecture]`, `@[skills/brainstorming]`, or `@[skills/plan-writing]` if the scope is still fuzzy.
2. Planning
   - Break the work into concrete tasks with ownership, dependencies, and validation criteria.
   - Sequence tasks so later specialists are not blocked by missing foundation work.
3. Domain Execution
   - Route each task to the right specialist or workstream.
   - Keep handoffs short and artifact-based: file paths, failing tests, design constraints, API contracts, screenshots.
4. QA and Validation
   - Validate each completed unit of work before moving on when the task is risk-sensitive.
   - Use test evidence, screenshots, logs, and diff review rather than assumptions.
5. Synthesis
   - Consolidate outcomes, unresolved risks, and next actions into one final report.

## Suggested Specialist Mapping

- `frontend-specialist` for UI implementation and UX-sensitive changes
- `backend-specialist` for API and business-logic work
- `database-architect` for schema and persistence decisions
- `test-engineer` or `qa-automation-engineer` for validation strategy and execution
- `debugger` for failure analysis and repeated regressions
- `performance-optimizer` for bottlenecks and measurement
- `documentation-writer` when the output needs durable documentation

## Handoff Protocol

Each handoff should include:

- Objective: what must be achieved now
- Scope: files, modules, or systems in play
- Constraints: requirements, non-goals, conventions, deadlines
- Evidence needed: tests, screenshots, logs, metrics, or design parity
- Exit condition: what counts as done for this step

## Retry and Escalation

- Retry only when the next pass has new information or a narrower hypothesis.
- If a task fails validation repeatedly, summarize the blocker and choose one:
  - change approach
  - reduce scope
  - escalate the decision
- Do not allow repeated unstructured loops.

## Output Expectations

A good orchestration result includes:

- Phase-by-phase status
- Work completed and evidence gathered
- Open risks or blockers
- Recommended next action or final readiness assessment

## Related Skills

- `@[skills/parallel-agents]` for multi-agent coordination patterns
- `@[skills/plan-writing]` for task decomposition
- `@[skills/architecture]` for system trade-offs
- `@[skills/testing-patterns]` and `@[skills/webapp-testing]` for quality gates
