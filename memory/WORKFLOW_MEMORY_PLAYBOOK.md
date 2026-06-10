# Workflow & Memory Playbook

Reference date: 2026-03-25

Goal: document, in a standardized and reusable way, the work and operational memory system adopted in this project. This playbook can be replicated in other systems while maintaining the same governance.

---

## 0) Structure Overview (System Map)

```
SFK/
│
├── kernel/                          ← AI CONTROL LAYER
│   ├── BOOTSTRAP.md                 ← Mandatory entry point for every session
│   ├── RULES.md                     ← Sovereign: governance, process, memory, and Git
│   ├── SYSTEM.md                    ← Technical contract for the project (stack, standards)
│   ├── SYSTEM-TEMPLATE.md           ← Fill-in guide for SYSTEM.md
│   ├── project.toml                 ← Technical dictionary: identity, hosting, stack, design,
│   │                                   env vars per platform, integrations, dev tools
│   ├── SOUL.md                      ← Compact and portable AI behavior contract
│   ├── index.toml                   ← Declarative session router by task type
│   └── TESTING_GUIDE.md             ← Universal testing directives (all projects)
│
├── kernel/agents|skills|workflows   ← CAPABILITIES LAYER
│   ├── ARCHITECTURE.md              ← Source of truth for agents, skills, and scripts
│   ├── agents/                      ← specialist agents
│   ├── skills/                      ← domain skills
│   ├── workflows/                   ← slash commands
│   └── scripts/                     ← checklist.py, verify_all.py, etc.
│
├── memory/                          ← MEMORY LAYER
│   ├── MODIFICATION_LOG.md          ← Full chronological history (source of truth)
│   ├── progress.md                  ← Current module state (quick read)
│   ├── plans/PLAN-XXXX-*.md         ← Detailed execution of structural work
│   ├── decisions/DECISION-XXX.md    ← Architectural decisions and trade-offs
│   └── logs/
│       ├── DEBUG-HISTORY.md         ← Resolved bugs database (operational RAG)
│       ├── BUILD-HISTORY.md         ← Build commands and tool gotchas (operational)
│       ├── SESSION-AUDIT-CHECKLIST.md ← Session protocol + checklist (merged)
│       └── DRIFT-RULES.md           ← Scope/technical drift detection rules
│
└── docs/                            ← PRODUCT DOCUMENTATION
    ├── project/
    │   ├── PROJECT_OVERVIEW.md
    │   └── REQUIREMENTS.md
    ├── config/
    └── evolutive_changes/
        └── EVOLUTION_MEMORY.md
```

---

## 1) Governance Architecture

The model uses ten pillars (7 original + 3 new):

1. `kernel/BOOTSTRAP.md`: session start protocol (v0.6 with LAYER 0/1).
2. `kernel/RULES.md`: process, continuity, and memory rules (sovereign).
3. `kernel/SYSTEM.md`: technical and organizational engineering rules.
4. `kernel/project.toml`: **[NEW]** identity, stack, URLs, and design tokens for the project.
5. `kernel/SOUL.md`: **[NEW]** compact and portable AI behavior contract.
6. `kernel/index.toml`: **[NEW]** declarative router — loads files by task type.
7. `memory/MODIFICATION_LOG.md`: macro memory and operational traceability.
8. `memory/progress.md`: **[NEW]** current module state (quick read).
9. `memory/plans/PLAN-XXXX-...md`: detailed execution memory.
10. `memory/decisions/DECISION-XXX.md`: architectural/product decision memory.
11. `memory/logs/DEBUG-HISTORY.md`: resolved bugs database (operational RAG).

Core principle:
- `kernel/RULES.md` governs the process (sovereign).
- `kernel/project.toml` + `kernel/SOUL.md` define identity and behavior (portable).
- `kernel/index.toml` optimizes context loading by task type.
- `kernel/SYSTEM.md` governs technical implementation of the concrete project.
- `memory/MODIFICATION_LOG` records the continuous evolution of changes.
- `memory/progress.md` provides a snapshot of the current module state.
- `memory/logs/DEBUG-HISTORY.md` records recurring failures and fixes (RAG).
- `PLAN` and `DECISION` preserve deep context and traceability.

---

## 2) Responsibility of each file

### `kernel/BOOTSTRAP.md`
Purpose: mandatory entry point for every session (Kernel v0.6).

Obligations (LAYER 0):
- always load: `kernel/project.toml`, `kernel/SOUL.md`, `kernel/RULES.md`, `kernel/SYSTEM.md`;

Obligations (LAYER 1):
- consult `kernel/index.toml` to load additional files by task type;
- detect active plan in `memory/plans/PLAN-XXXX-...md` (file without `DONE`);
- consult `memory/progress.md` for a quick module state snapshot;
- validate conflicts between log, plan, and current workspace state;
- emit an understanding readback.

### `kernel/RULES.md`
Purpose: official source for workflow and memory.

Defines:
- when to create `PLAN-XXXX-SUBJECT`;
- when to record a point-in-time change without a plan;
- how to close a `PLAN` (`DONE`);
- how to record a `DECISION`;
- mandatory questions before execution (scope/architecture/requirement and need for a separate plan);
- active context protocol (`RAG`) and reasoning structure (`STAR`);
- mandatory recording of resolved bugs in `memory/logs/DEBUG-HISTORY.md`;
- commit/push approval rules;
- where to update complementary documentation.

### `kernel/SYSTEM.md`
Purpose: technical engineering contract for the concrete project.

Defines:
- stack and code standards;
- logging, security, validation, backend/frontend architecture;
- testing and technical quality rules.

Note: when creating a new project, fill in `kernel/SYSTEM-TEMPLATE.md` and rename it to `kernel/SYSTEM.md`.

### `kernel/project.toml`
Purpose: **technical dictionary of the project**. Loaded in every interaction. The single file a solo dev needs to read after a month away.

Contains:
- project name, version, type, language, and description;
- `[hosting.*]`: all servers/platforms by layer (frontend, backend, database) — URL, provider, service name;
- `[stack.*]`: full stack separated by layer (runtime, frontend, backend, database, package manager) — names **and versions**;
- `[design]`: CSS framework, version, build command, component library, icon library, and design tokens;
- `[environments.<platform>]`: env var names grouped by the platform where they must be configured (Railway, Vercel, etc.) — never values;
- `[[integrations]]`: one block per active third-party API — name, purpose, docs, env_vars required;
- `[tools.dev.*]`: local dev tools (e.g. ngrok) — purpose, who calls it, setup steps, notes;
- `[ai_context]`: reference map to all kernel files (used during AI onboarding).

Rule: all information that answers "where is this hosted?", "what versions are we using?", "which vars go on which server?", or "what integrations are active?" belongs here — not in separate docs files.

### `kernel/SOUL.md` [NEW]
Purpose: AI behavior contract. Portable with the template.

Contains:
- identity, communication, delivery, restrictions;
- disambiguation rules;
- context and memory management protocol.

### `kernel/index.toml` [NEW]
Purpose: declarative session router.

Defines:
- LAYER 0: files loaded in every session;
- LAYER 1: files loaded by task type (keyword triggers);
- read/write mapping by work context.

### `memory/progress.md` [NEW]
Purpose: snapshot of the current module state.

Contains:
- module table with states (stable/in-progress/blocked/planned/deprecated);
- technical debt table with criticality;
- recent activity log (summarized).

Rule: update whenever a `PLAN-XXXX` is marked as `DONE` or when a module changes state.

### `memory/MODIFICATION_LOG.md`
Purpose: chronological macro history.

Rule:
- with active plan: record only the `START` and `END` milestones of the plan;
- with active plan and a change outside the `SUBJECT-OF-CHANGE`: record the change in the log;
- without active plan: record everything in real time, after each executed and reported block;
- when a change stems from an error, add tag `##bug`;
- at session closure, record: what was done, what changed, and what remained pending.

### `memory/plans/PLAN-XXXX-...md`
Purpose: detailed execution of medium/large work.

Contains:
- scope, items, validations, checkpoints;
- continuity and execution traceability checkpoints;
- operational status (`IN PROGRESS`, etc.).

### `memory/logs/DEBUG-HISTORY.md`
Purpose: technical memory of real errors and their solutions.

Rule:
- create/update an entry whenever a bug is identified and resolved;
- format with `# ID`, `SYMPTOM`, `ROOT_CAUSE`, `ACTION`, `CONTEXT`;
- use sequential semantic IDs (`ERR-0001`, `ERR-0002`, ...);
- keep real symptoms (console/endpoint message/visual behavior) to facilitate later search.

### `memory/decisions/DECISION-XXX.md`
Purpose: record confirmed decisions.

Required format:
```md
Status: ACTIVE | DEPRECATED
Date: YYYY-MM-DD
Context: <objective context>
Decision: <decision made>
Consequences: <impacts and trade-offs>
```

---

## 3) Standard Operational Flow (end-to-end)

1. Start session via `kernel/BOOTSTRAP.md`.
2. Identify whether there is an active plan.
3. Execute active context retrieval (RAG):
   - search for similar implementations in the repository;
   - map dependencies (types, `package.json`, data schema);
   - analyze import boundaries;
   - consult `memory/logs/DEBUG-HISTORY.md` for similar bugs.
4. Before changing anything, gather context, list steps, and assess risks/impact/tests.
5. Mandatory questions:
   - whether there will be a scope/architecture change or creation/editing of a requirement;
   - whether the request requires a separate plan (`PLAN-XXXX`) or can proceed as a point-in-time adjustment.
6. Structure analysis and plan with STAR (`Situation`, `Task`, `Action`, `Result`) explicitly in relevant tasks.
7. Classify work:
   - medium/large → create `PLAN-XXXX` and wait for explicit approval before starting;
   - point-in-time → record execution in real time in the `MODIFICATION_LOG`.
8. Execute changes with technical validations (`kernel/SYSTEM.md`).
9. Record continuity checkpoint:
   - with plan: update progress in the `PLAN`;
   - without plan: record each block in the `MODIFICATION_LOG`.
10. If a bug was fixed, record a corresponding entry in `memory/logs/DEBUG-HISTORY.md`.
11. Follow the Git flow with dual approval:
   - approval for commit;
   - approval for push.
12. Record closure:
   - `PLAN`: rename to `DONE` when completed;
   - session: update `MODIFICATION_LOG` with done/changed/pending (including on "Close Session").

---

## 4) Naming and Numbering Conventions

### Plans
Pattern:
- `memory/plans/PLAN-XXXX-SUBJECT.md`
- when complete: `memory/plans/PLAN-XXXX-DONE-SUBJECT.md`

Rules:
- `XXXX` sequential starting at `0001`.
- one active plan per main front.
- `SUBJECT` is the topic that originated the plan.
- prefer short names; mnemonics allowed.

### Decisions
Pattern:
- `memory/decisions/DECISION-XXX.md`

Rules:
- `XXX` sequential starting at `001`.
- keep `Status` updated (`ACTIVE` or `DEPRECATED`).

---

## 5) Memory and Traceability Pattern

## Macro Memory
- File: `memory/MODIFICATION_LOG.md`
- Level: managerial chronology and real-time operational checkpoints.

## Detailed Memory
- File: `memory/plans/PLAN-*`
- Level: step-by-step technical execution.

## Git Traceability Memory
- File: `memory/MODIFICATION_LOG.md`
- Level: record of commit/push steps per delivery.

## Decision Memory
- File: `memory/decisions/DECISION-*`
- Level: justification for choices and trade-offs.

## Evolution Memory
- File: `docs/evolutive_changes/EVOLUTION_MEMORY.md`
- Level: lessons learned, recurrences, and revisions.

## Debug Memory
- File: `memory/logs/DEBUG-HISTORY.md`
- Level: real symptoms, root causes, and reusable fix actions.

---

## 6) Reusable Templates

### Plan template
```md
# PLAN-XXXX - TITLE

Status: IN PROGRESS
Opening date: YYYY-MM-DD
Context: ...

## Approach
...

## Scope
- In:
- Out:

## Action Items
- [ ] 1. ...
- [ ] 2. ...

## Validation
- [ ] command A
- [ ] command B

## Continuity Checkpoint
- Last completed step: ...
- Next planned step: ...
```

### Point-in-time record template for `MODIFICATION_LOG`
```md
## YYYY-MM-DD HH:MM:SS
- Executed block: <short title>
  - Objective/context:
  - Main files:
  - Validations:
  - Last completed step:
  - Next step:
  - Tags: ##bug (when applicable)

## YYYY-MM-DD HH:MM:SS
- Session closure
  - What was done:
  - What changed:
  - What remained pending:
```

### Git Record of Delivery template for `MODIFICATION_LOG`
```md
## Git Record of Delivery
- Step 1 (Pre-commit review): ...
- Step 2 (Commit authorization): ...
- Step 3 (Commit confirmation): ...
- Step 4 (Push authorization and result): ...
- Push status: PENDING | COMPLETED
```

### Bug record template for `debug-history`
```md
# ID: ERR-000X: Semantic error title
SYMPTOM: Exact console/API message or observed visual behavior.
ROOT_CAUSE: Objective technical explanation of why the failure occurred.
ACTION: Fix applied (code/command/flow adjustment).
CONTEXT: Relevant stack and environment (e.g.: Node 20, Prisma 5.22, Windows, Railway).
```

### Decision template
```md
Status: ACTIVE
Date: YYYY-MM-DD
Context: ...
Decision: ...
Consequences: ...
```

---

## 7) Mandatory Quality Rules

- No `console.log` (use the project logger).
- Validate input with explicit schema.
- Execute applicable lint/build/tests.
- Do not skip memory recording (plan/log/decision).
- Do not close a bug fix without recording in `debug-history`.
- Do not `push` without explicit approval.

---

## 8) Skills (`.agent/ARCHITECTURE.md`) — categorization

`.agent/ARCHITECTURE.md` organizes skills by packs/categories to speed up approach selection.
It also contains specialized agents.

Usage rule:
- if the task matches a skill, use the corresponding skill;
- when more than one skill is possible, choose the smallest set that covers the problem;
- keep execution adherent to the process (`bootstrap` + `rules` + `SYSTEM`).

---

## 9) How to port this model to other systems

Implementation checklist:
1. Fill in `kernel/project.toml` as the **complete technical dictionary**:
   - `[project]`, `[project.team]`, `[project.urls]`
   - `[hosting.frontend]`, `[hosting.backend]`, `[hosting.database]`
   - `[stack.runtime]`, `[stack.frontend]`, `[stack.backend]`, `[stack.database]`, `[stack.package_manager]`
   - `[design]` — include framework, version, and build command
   - `[environments.<platform>]` — one block per platform, list env var names
   - `[[integrations]]` — one block per active third-party API
   - `[tools.dev.*]` — local tools like ngrok (purpose, who calls, setup)
2. Fill in `kernel/SOUL.md` with the project-specific restrictions (or keep the default).
3. Fill in `kernel/SYSTEM.md` using `kernel/SYSTEM-TEMPLATE.md` as a guide.
5. Create folders: `memory/plans/`, `memory/decisions/`, `memory/logs/`, `docs/`.
6. Create `memory/MODIFICATION_LOG.md` and `memory/progress.md`.
7. Define naming pattern for `PLAN` and `DECISION` (see section 4).
8. Define commit/push approval rule (see `kernel/RULES.md` Git Kernel section).
9. Verify that `kernel/ARCHITECTURE.md` is updated with the project's agents and skills.

> **Do not create separate docs/config files for hosting, env vars, or integrations.**
> All of that lives in `kernel/project.toml`. Testing directives are in `kernel/TESTING_GUIDE.md`. Build gotchas go in `memory/logs/BUILD-HISTORY.md`.

Monthly audit checklist:
1. Does `memory/progress.md` reflect the real module state?
2. Is there an active plan without a checkpoint?
3. Are recent changes in the `MODIFICATION_LOG`?
4. Are relevant decisions in `DECISION-*`?
5. Were recent resolved bugs consolidated in `memory/logs/DEBUG-HISTORY.md`?
6. Is there a discrepancy between `kernel/RULES.md`, `kernel/SYSTEM.md`, and actual practice?
7. Are documentation references free of broken links?

---

## 10) Current Project References

### Session control
- Bootstrap: `kernel/BOOTSTRAP.md`
- Router: `kernel/index.toml`
- Sovereign: `kernel/RULES.md`

### Identity and behavior
- Identity: `kernel/project.toml`
- Behavior: `kernel/SOUL.md`
- Engineering: `kernel/SYSTEM.md`
- Neutral templates: `kernel/SYSTEM-TEMPLATE.md`

### Operational memory
- Macro log: `memory/MODIFICATION_LOG.md`
- Module state: `memory/progress.md`
- Debug history: `memory/logs/DEBUG-HISTORY.md`
- Plans: `memory/plans/PLAN-*`
- Decisions: `memory/decisions/DECISION-*`

### AI capabilities
- Agents/Skills/Scripts: `.agent/ARCHITECTURE.md`
- Workflows: `.agent/workflows/`
