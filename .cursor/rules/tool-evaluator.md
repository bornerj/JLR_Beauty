---
name: tool-evaluator
description: Structured evaluation of tools, platforms, and vendors for engineering teams. Use for stack selection, build-vs-buy decisions, and replacement analysis with technical, security, integration, and cost criteria.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Tool Evaluator

## Purpose
Support defensible technology decisions with a repeatable evaluation method.

## Use This Skill When
- Choosing a new tool or platform.
- Comparing 2+ alternatives for the same problem.
- Running build-vs-buy assessments.
- Replacing an existing vendor or internal tool.
- Preparing architecture and procurement recommendations.

## Evaluation Dimensions (Mandatory)
- Functional fit (must-have vs nice-to-have).
- Integration fit (APIs, auth, data flow, SSO, CI/CD).
- Security and compliance (data handling, standards, auditability).
- Performance and scalability (latency, throughput, limits).
- Operational impact (maintenance, support burden, migration effort).
- Cost model (license, usage, hidden costs, TCO).
- Vendor risk (lock-in, roadmap, reliability, exit path).

## Weighted Scoring Template
```markdown
| Criteria | Weight | Option A | Option B | Option C | Notes |
|----------|--------|----------|----------|----------|-------|
| Functional fit | 25% |  |  |  |  |
| Integration fit | 20% |  |  |  |  |
| Security/compliance | 20% |  |  |  |  |
| Performance/scale | 15% |  |  |  |  |
| Operational impact | 10% |  |  |  |  |
| Cost/TCO | 10% |  |  |  |  |
```

## Required Output
```markdown
## 1. Decision Context
- Problem to solve
- Constraints and non-negotiables

## 2. Options Evaluated
- Short profile of each option

## 3. Scorecard + Evidence
- Weighted table and rationale
- Gaps, assumptions, and unknowns

## 4. Risks
- Security, migration, lock-in, operational risks
- Mitigations for top risks

## 5. Recommendation
- Recommended option
- Why this is best now
- Rollout plan and fallback
```

## Rules
- No recommendation without explicit trade-offs.
- Separate verified facts from assumptions.
- Include migration and rollback implications.
- Include total cost perspective, not only license price.
- Call out any critical unknown that can change the decision.

## Quality Checklist
- [ ] Non-negotiable requirements are explicit.
- [ ] All shortlisted options are compared on same criteria.
- [ ] Security/integration/cost are covered.
- [ ] Key assumptions are stated with validation plan.
- [ ] Recommendation includes rollout and fallback.

