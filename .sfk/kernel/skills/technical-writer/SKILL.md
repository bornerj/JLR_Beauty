---
name: technical-writer
description: Technical documentation skill for engineering teams. Use for README files, API docs, architecture docs, runbooks, migration guides, tutorials, and docs quality reviews.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Technical Writer

## Purpose
Produce clear, accurate, and maintainable documentation that reduces support load and speeds engineering onboarding.

## Use This Skill When
- Creating or rewriting project README files.
- Writing API or SDK documentation.
- Documenting architecture and key design decisions.
- Producing runbooks, troubleshooting guides, or migration notes.
- Auditing docs quality and identifying stale content.

## Documentation Standards
- Accuracy first: docs must match current behavior.
- One concept per section.
- Prefer examples that are runnable or directly testable.
- State prerequisites explicitly.
- Use consistent terms and naming across all docs.

## Recommended Deliverables
- `README.md` with quick start and core workflows.
- API reference (endpoints, params, responses, errors).
- `docs/architecture.md` with boundaries and data flow.
- `docs/runbook.md` with operational procedures.
- `docs/migration.md` for breaking changes.

## README Minimum Template
```markdown
# Project Name

## What It Does
## Why It Exists
## Quick Start
## Installation
## Configuration
## Usage
## Development
## Testing
## Troubleshooting
## Contributing
```

## Workflow
1. Discover audience and purpose (developer, operator, stakeholder).
2. Inventory existing docs and find gaps.
3. Draft concise structure before writing prose.
4. Add examples and edge-case notes.
5. Validate commands and links.
6. Publish and define update ownership.

## Rules
- Do not hide breaking changes.
- Mark deprecated behavior explicitly.
- Separate facts from recommendations.
- Avoid marketing language in technical docs.
- Keep examples minimal but complete.

## Quality Checklist
- [ ] A new engineer can run the project using the docs only.
- [ ] All commands are verified.
- [ ] Error cases and common failures are documented.
- [ ] Version-specific constraints are explicit.
- [ ] Ownership and update process are defined.

