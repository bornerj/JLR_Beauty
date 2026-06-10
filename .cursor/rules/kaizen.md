---
name: kaizen
description: Continuous improvement workflow for software engineering. Use to refine code, reduce defects, standardize patterns, and improve team delivery through small, validated iterations.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Kaizen

## Purpose
Apply continuous improvement to engineering work without disruptive rewrites.

## When To Use
- After shipping a feature, to harden quality.
- During refactors, to reduce risk incrementally.
- When recurring defects indicate weak standards.
- To improve delivery process, not only code.

## Core Principles
- Small, verifiable improvements over large risky changes.
- Prevent errors early (design/types/validation) instead of patching late.
- Standardize successful patterns so gains are repeatable.
- Measure impact of each improvement.

## Kaizen Loop (Mandatory)
1. Observe
   - Identify pain point (bug class, slow workflow, recurring review comments).
2. Analyze
   - Determine root cause and affected scope.
3. Improve
   - Implement the smallest change that removes the cause.
4. Verify
   - Confirm via tests, lint, and behavior checks.
5. Standardize
   - Document/templatize so the team reuses the better pattern.

## Engineering Focus Areas
- Code quality: naming, duplication, complexity, dead code.
- Reliability: error handling, validation, guardrails.
- Test quality: coverage on high-risk paths and regressions.
- Delivery quality: clearer plans, faster reviews, safer deploys.

## Rules
- Do not mix unrelated improvements in one batch.
- Each improvement must have explicit verification criteria.
- If no measurable benefit, do not keep the change.
- Prefer low-risk sequence: correctness -> clarity -> performance.
- Capture decisions so team behavior evolves, not just code.

## Output Format (For Kaizen Reviews)
```markdown
## Kaizen Cycle
- Problem:
- Root Cause:
- Improvement Applied:
- Verification Evidence:
- Standardization Action:
- Expected/Observed Impact:
```

## Suggested Toolchain
- `lint-and-validate` for immediate quality gates.
- `systematic-debugging` for root-cause depth.
- `testing-patterns` for regression prevention.
- `plan-writing` for controlled incremental execution.
- `deployment-procedures` for safe rollout of improvements.

## Completion Checklist
- [ ] Improvement is scoped and testable.
- [ ] Root cause is documented.
- [ ] Verification is reproducible.
- [ ] Standard/pattern was updated.
- [ ] Team can apply the same improvement again.

