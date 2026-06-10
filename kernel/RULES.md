# KERNEL_MASTER.md
# AI MASTER KERNEL — Governance + Execution + Memory + Git (with Anti-Failure + Anti-Scope-Drift)

> Sovereign behavioral document for the development AI.
> In case of conflict with any other file, this document prevails.

---

# 0️. KERNEL ARCHITECTURE

<!--
GOAL: Unify governance and execution in a single source of truth.
IMPACT: Reduces ambiguity and improves retention.
MITIGATED RISK: Duplicate or conflicting rules across multiple files.
-->

Layers (internal precedence order):
1. Fundamental Principles
2. State Machine
3. Cognitive Engine (RAG + STAR)
4. Anti-Scope-Drift Layer (detection + blocking)
5. Execution (with and without plan)
6. Anti-Failure Layer (mandatory checkpoints)
7. Memory (persistence + traceability)
8. Git Kernel (dual approval)
9. Document Governance
10. Audit and Session Closure
11. Global Precedence + Prohibitions
12. Immutable Operational Flow

---

# 1️. FUNDAMENTAL PRINCIPLES (IMMUTABLE LAWS)

<!--
GOAL: Create laws that can never be ignored.
IMPACT: Prevents behavioral drift in long sessions.
MITIGATED RISK: Execution without context, unauthorized commit/push, incorrect session closure.
-->

1. No action occurs without context (RAG).
2. No structural change occurs without an approved plan.
3. No commit occurs without explicit user authorization.
4. No push occurs without a new explicit user authorization.
5. No plan can become DONE without a complete Git Record.
6. No session can be closed without an audit.
7. Every functional change must generate persistence in the appropriate memory.
8. Writing templates in `memory/WORKFLOW_MEMORY_PLAYBOOK.md` under section `## 6) Reusable Templates`
9. At bootstrap, the repository must first be classified as NEW PROJECT or EXISTING PROJECT before `project.toml` or `SYSTEM.md` are enforced.

---

# 2️. STATE MACHINE (DETERMINISTIC BEHAVIOR)

<!--
GOAL: Turn behavior into a state machine.
IMPACT: Prevents skipping steps and increases consistency.
MITIGATED RISK: Out-of-order execution.
-->

| State                  | Description                         |
|------------------------|-------------------------------------|
| IDLE                   | Waiting for instruction             |
| CONTEXT_LOADING        | Executing RAG                       |
| PLANNING               | Creating plan                       |
| WAITING_APPROVAL       | Waiting for explicit approval       |
| EXECUTING_WITH_PLAN    | Executing plan                      |
| EXECUTING_WITHOUT_PLAN | Point-in-time execution             |
| GIT_REVIEW             | Pre-commit review                   |
| GIT_WAITING_APPROVAL   | Waiting for commit/push authorization |
| AUDIT_MODE             | Final audit                         |

Invalid transitions are prohibited.

---

# 3️. COGNITIVE ENGINE (RAG + STAR)

<!--
GOAL: Force context and reasoning before action.
IMPACT: Reduces generic solutions and increases technical precision.
MITIGATED RISK: Changes based on assumptions.
-->

## 3.1 RAG — Context Retrieval (Mandatory)

State → CONTEXT_LOADING

Before any change:
- Search for similar implementations in the repository (using task keywords).
- Read: `.d.ts`, `package.json`, database schema (e.g.: `schema.prisma`).
- Analyze boundaries: who imports and who is imported by the target module.
- Consult bug history: `memory/logs/DEBUG-HISTORY.md`.
- Consult technical/organizational patterns (when they exist outside this kernel).

## 3.2 STAR — Reasoning Structure (Mandatory)

After RAG:
1. SITUATION — current context and involved files.
2. TASK — objective + constraints discovered in RAG.
3. ACTION — real technical steps (no generic assumptions).
4. RESULT — expected state + how to validate.

For small tasks it can be mental.
For plans it must be explicit.

---

# 4️. ANTI-SCOPE-DRIFT LAYER (DETECTION + BLOCKING)

<!--
GOAL: Detect scope growth and prevent silent expansion.
IMPACT: Maintains discipline and predictability.
MITIGATED RISK: Refactors/structural changes without a plan.
-->

## 4.1 Scope Classification (After RAG)

Classify the task as:
- POINT-IN-TIME (no plan) OR
- STRUCTURAL (with plan)

## 4.2 Scope Expansion Triggers (Objective Signals)

IF ANY condition occurs during point-in-time execution, THEN scope is considered EXPANDED:

1. More than 3 main files changed (not counting trivial adjustments).
2. Change to schema/data model/migrations.
3. Adding or swapping dependencies (package.json).
4. Creation of new central modules/routes/components.
5. Change to architecture/folder organization.
6. Emergence of a new implicit requirement ("while we're here, let's also…").
7. Changes to authentication, authorization, billing, or critical integrations.

## 4.3 Mandatory Response to Expanded Scope

When EXPANSION is detected:

1. Pause additional execution (block).
2. Inform that a scope drift occurred.
3. Ask whether to convert to a PLAN.
4. If YES → create PLAN-XXXX and wait for approval.
5. If NO → maintain execution only at the minimum needed to return to stable state and record the decision.

---

# 5️. SCOPE DETERMINATION (BASE RULE)

<!--
GOAL: Formally decide between plan vs. point-in-time.
IMPACT: Organizes complexity and reduces improvisation.
MITIGATED RISK: Large changes treated as small.
-->

IF impacting architecture/multiple modules/requirements/structural flow/DB/integrations:
→ Create Plan (PLANNING → WAITING_APPROVAL)
- means recording in `PLAN-XXXX-SUBJECT.md`
ELSE:
→ Point-in-Time Execution (EXECUTING_WITHOUT_PLAN)
- means recording in `memory/MODIFICATION_LOG.md`

---

# 6️. EXECUTION WITH PLAN

<!--
GOAL: Execute structural changes with full traceability.
IMPACT: Better control, audit, and history.
MITIGATED RISK: Large change without execution trail.
-->

## 6.1 Plan Creation

Create: `memory/plans/PLAN-XXXX-SUBJECT.md`
- XXXX sequential starting at 0001
- Detailed checklist
- Explicit STAR structure
- Validation criteria

State → PLANNING
Present plan → WAITING_APPROVAL
Execute only after explicit approval.

## 6.2 Plan Execution

State → EXECUTING_WITH_PLAN
- Update real progress in the plan itself.
- On interruption: last completed step + next step.
- Maintain adherence to the approved scope.

## 6.3 Plan Closure

When complete:
- Rename to `PLAN-XXXX-DONE-SUBJECT.md`
- Mandatorily include: `## Git Record of Delivery` (see Git Kernel)

---

# 7️. EXECUTION WITHOUT PLAN (POINT-IN-TIME CHANGE)

<!--
GOAL: Allow small changes with low overhead.
IMPACT: Maintains speed without losing traceability.
MITIGATED RISK: Small changes without record.
-->

State → EXECUTING_WITHOUT_PLAN

Record in real time, as soon as the processing is complete and presented to the user,
each block recorded in `memory/MODIFICATION_LOG.md`:
- Context/objective
- Changed files
- Validations executed
- Last completed step + next step (if any)

Continuously apply the Anti-Scope-Drift Layer (section 4).

---

# 8️. ANTI-FAILURE LAYER (MANDATORY CHECKPOINTS)

<!--
GOAL: Prevent operational failures (missed steps and skips).
IMPACT: Creates "locks" before critical actions.
MITIGATED RISK: Skipping RAG, forgetting logs, unauthorized commit/push, closing without audit.
-->

## 8.1 Pre-Execution Checkpoint (before changing anything)

Mandatory check:
- Was RAG done?
- Was DEBUG-HISTORY consulted when applicable?
- Was the scope classified (point-in-time vs. structural)?
- Is there a risk of scope expansion (section 4)?

If any answer is NO:
→ return to CONTEXT_LOADING or PLANNING.

## 8.2 Post-Change Checkpoint (before considering "done")

Mandatory check:
- Were validations executed (when applicable)?
- Was memory recorded (MODIFICATION_LOG / PLAN / DEBUG-HISTORY)?
- Was documentation updated (when applicable)?

## 8.3 Pre-Git Checkpoint (before commit)

Mandatory check:
- Were changed files listed?
- Was a summary prepared per file?
- Were validations recorded?
- If plan: will the Git Record be filled in the plan?

## 8.4 Pre-Session-Closure Checkpoint

Mandatory check:
- Was MODIFICATION_LOG updated with accomplished + pending items?
- Was the audit executed and recorded?
- Was the checklist copied and named with PASS/FAIL?

---

# 9️. MEMORY SYSTEM (PERSISTENCE AND TRACEABILITY)

<!--
GOAL: Ensure history is retrievable via RAG.
IMPACT: Increases continuity and prevents bug repetition.
MITIGATED RISK: Context loss over time.
-->

## 9.1 Memory Destinations

| Type               | Location                                          |
|--------------------|---------------------------------------------------|
| Macro log          | `memory/MODIFICATION_LOG.md`                      |
| Detailed execution | `memory/plans/PLAN-XXXX-DONE-SUBJECT.md`          |
| Resolved bug       | `memory/logs/DEBUG-HISTORY.md`                    |
| Decision           | `memory/decisions/`                               |
| Technical evolution| `docs/evolutive_changes/EVOLUTION_MEMORY.md`      |

## 9.2 MODIFICATION_LOG Rule

- With active plan: record only the START and END milestone of the plan.
- Without active plan: record each change in real time.
- If a change occurs outside the plan: record it in the MODIFICATION_LOG.
- A repository may be treated as NEW PROJECT only if there are no plans, no decisions, and `memory/MODIFICATION_LOG.md` still contains only examples/template content.

## 9.3 Bug Record (Mandatory)

Whenever a bug is resolved, record in `memory/logs/DEBUG-HISTORY.md`:

# ID: ERR-XXX: Semantic Name
SYMPTOM:
ROOT_CAUSE:
ACTION:
CONTEXT:

If the change is a bug, add tag: `##bug` in the log record.

## 9.4 Decision Record

Create `memory/decisions/DECISION-XXX.md` (XXX starting at 001).
Before creating, check for conflicts with existing decisions.

Structure:

Status: ACTIVE | DEPRECATED
Date: YYYY-MM-DD
Context:
Decision:
Consequences:

## 9.5 PR Description Kernel (Mandatory for Publishable Deliveries)

Goal:
- preserve in the repository the publishable description of the delivery
- avoid context loss between implementation, commit, push, and PR opening
- standardize delivery communication across projects

Rule:
Whenever a delivery reaches a publishable state, the agent must create or update a file
`memory/PR-XXXX-DESCRIPTION.md`.

Definition of "publishable delivery":
- a change ready for commit/push
- a delivery with relevant scope
- a change that combines code, memory, documentation, or product behavior
- any work that would normally justify a PR, even if the PR is not yet opened

Minimum required content:
- PR title
- objective
- what was done
- main affected areas or files
- validations executed
- notes, risks, or operational observations

Convention:
- save in `memory/`
- use sequential numbering: `PR-0001-DESCRIPTION.md`, `PR-0002-DESCRIPTION.md`, etc.
- write in the project's/user's default language
- keep the content aligned with the final commit and the real delivery state

When to create:
- when finishing a delivery ready for commit
- before push or publication
- when closing a relevant `PLAN-XXXX` or a significant delivery block without a plan

When to update:
- if the delivery scope changes before the final commit
- if new relevant validations are executed
- if the PR text becomes outdated relative to the real diff

Relationship with other artifacts:
- does not replace `PLAN`
- does not replace `MODIFICATION_LOG`
- does not replace `DECISION`
- does not replace commit
- complements those artifacts as the publication package of the delivery

Closure rule:
No delivery considered ready for publication may be closed without:
1. updated memory
2. commit prepared or completed
3. `memory/PR-XXXX-DESCRIPTION.md` created or updated

---

# 10. GIT KERNEL (2-STEP APPROVAL)

<!--
GOAL: Human control before recording history and publishing.
IMPACT: Prevents irreversible actions without consent.
MITIGATED RISK: Unauthorized commit/push.
-->

## 10.1 Pre-Commit Review

State → GIT_REVIEW

Before commit, list:
- Changed files
- Objective summary per file
- Validations executed (lint/build/test)

## 10.2 Commit Authorization

State → GIT_WAITING_APPROVAL

Commit only after explicit approval.
Conventional message: feat:, fix:, docs:, refactor:, chore:

## 10.3 Commit Confirmation

After commit, inform:
- Short hash
- Branch
- Message
- Final statistics

## 10.4 Push Authorization

Push only after a new explicit approval.
After push: remote/branch and result.

## 10.5 Git Record of Delivery (Mandatory in Plan)

Every plan must contain:

## Git Record of Delivery
- Step 1 (Pre-commit review): files + validations
- Step 2 (Commit authorization): explicit user confirmation
- Step 3 (Commit confirmation): hash/branch/message/statistics
- Step 4 (Push authorization and result): explicit confirmation + return
- Push status: PENDING | COMPLETED

No plan can become DONE without this section filled in.

---

# 1️1. DOCUMENT GOVERNANCE

<!--
GOAL: Synchronize real changes with documentation.
IMPACT: Reduces "tribal knowledge".
MITIGATED RISK: Implicit architecture/requirements.
-->

When changing scope/architecture:
- `docs/project/PROJECT_OVERVIEW.md`
- `docs/evolutive_changes/EVOLUTION_MEMORY.md`

New requirements/gaps:
- `docs/project/REQUIREMENTS.md`

Bootstrap and project-definition documents must obey these rules:
- First classify the repository as NEW PROJECT or EXISTING PROJECT.
- NEW PROJECT = no `PLAN-XXXX`, no decisions, and no real entries in `memory/MODIFICATION_LOG.md` beyond the examples/template area.
- For NEW PROJECT, `kernel/project.toml` and `kernel/SYSTEM.md` are references/examples only and must not be used to validate the repository state.
- SFK kernel/template files must be written in English.
- Project-generated deliverables may be written in the language declared in `kernel/project.toml -> [project] language`.
- `docs/project/PROJECT_OVERVIEW.md` must preserve its `#` and `##` heading structure across sessions — do not add, remove, or rename top-level sections.
- `docs/project/REQUIREMENTS.md` must preserve its `#` and `##` heading structure. Requirements use `FR-XXX`, non-functional requirements use `NFR-XXX`, acceptance criteria use `AC-XXX`.
- `docs/project/SCOPE.md` and `docs/project/SETUP.md` are mandatory project documents — they must exist and maintain their `##` section structure across sessions.

Technical evolution (recurring errors/refactors/lessons):
- `docs/evolutive_changes/EVOLUTION_MEMORY.md`

Integrations and deploy:
- `docs/config/INTEGRATIONS.md`
- `docs/config/DEPLOY_ENV_REFERENCE.md`

---

# 1️2. AUDIT AND SESSION CLOSURE

<!--
GOAL: Close with control and a final checklist.
IMPACT: Reduces accumulated failures.
MITIGATED RISK: Closing with invisible pending items.
-->

When the user says "Close Session":

1. Update `memory/MODIFICATION_LOG.md`:
   - what was done
   - what changed
   - what remained pending

2. State → AUDIT_MODE (no code writing)

3. Evaluate per `kernel/AUDIT_CHECKLIST.md` and return PASS or FAIL

4. Copy checklist to:
   `memory/logs/AUDIT_CHECKLIST_date_time.md`

5. Mark checks and rename file with:
   `-PASS` or `-FAIL`

Session only closes after audit.

---

# 1️3. GLOBAL PRECEDENCE

<!--
GOAL: Resolve any conflict without debate.
IMPACT: AI always knows which rule wins.
MITIGATED RISK: Inconsistent behavior.
-->

1. This Kernel is sovereign.
2. RAG precedes any action.
3. Active plan dominates execution.
4. Anti-Scope-Drift can block point-in-time execution and require a plan.
5. Anti-Failure imposes checkpoints before critical actions.
6. Git requires dual authorization (commit and push).
7. Audit is mandatory before session closure.
8. No plan becomes DONE without a complete Git Record.

---

# 1️4. ABSOLUTE PROHIBITIONS

<!--
GOAL: Create unequivocal "cannot do".
IMPACT: Reduces chance of accidental violation.
MITIGATED RISK: Irreversible actions.
-->

The AI CANNOT:
- Execute a structural change without an approved plan.
- Continue a point-in-time change after a drift trigger without a user decision.
- Commit without explicit authorization.
- Push without a new explicit authorization.
- Close a session without an audit.
- Ignore DEBUG-HISTORY when fixing a bug.
- Change a requirement without updating applicable documentation.
- Mark a plan as DONE without the Git Record of Delivery.

---

# 1️5. SOCRATIC GATE (PRE-IMPLEMENTATION)

<!--
GOAL: Prevent premature implementation on ambiguous or complex requests.
IMPACT: Reduces rework and misalignment.
MITIGATED RISK: Code written in the wrong direction.
-->

Every request passes through this gate before any tool use or implementation:

| Request Type        | Strategy           | Mandatory Action                                  |
|---------------------|--------------------|---------------------------------------------------|
| New Feature / Build | Deep discovery     | Ask at least 3 strategic questions                |
| Edit / Bug Fix      | Context check      | Confirm understanding + ask about impact          |
| Vague / Simple      | Clarification      | Ask about Purpose, Users, and Scope               |
| Full Orchestration  | Guardian           | STOP sub-agents until user confirms plan          |
| Proceed Directly    | Validation         | STOP → Ask 2 Edge Case questions                  |

Protocol:
1. Never Assume: If 1% is uncertain, ASK.
2. Spec-heavy requests: Do not skip the gate. Ask about trade-offs or edge cases before starting.
3. Wait: DO NOT write code until the user gives the go-ahead.

---

# 1️6. FINAL CHECKLIST PROTOCOL

<!--
GOAL: Ensure quality before deploy/delivery.
IMPACT: Catch critical issues before production.
MITIGATED RISK: Deploy with security bugs, lint failures, or failing tests.
-->

Trigger: When the user says "final checks", "run all tests", "validate everything", or similar.

| Stage         | Command                                              | Purpose                            |
|---------------|------------------------------------------------------|------------------------------------|
| Manual Audit  | python kernel/scripts/checklist.py .                 | Priority-based audit               |
| Pre-Deploy    | python kernel/scripts/verify_all.py . --url URL      | Full suite + Performance + E2E     |

Execution order by priority:
1. Security → 2. Lint → 3. Schema → 4. Tests → 5. UX → 6. SEO → 7. Lighthouse/E2E

Rules:
- A task is NOT complete until checklist.py returns success.
- If it fails, fix Critical blockers first (Security/Lint).

---
