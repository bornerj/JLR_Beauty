# kernel/ — SFK · Structured Framework Kit

**SFK is a multi-tenant orchestration layer that provides memory, rules, and procedures as a service, decoupling the AI intelligence from the execution logic.**

---

## What is this folder

`kernel/` is the core of SFK. It contains **everything an AI needs to know about this project** before writing a single line of code — identity, behavior, process, technical standards, and session protocol.

---

## Structure

```
kernel/
├── BOOTSTRAP.md         ← Mandatory entry point for every session (v0.6)
├── RULES.md             ← Sovereign: governance, process, memory, and Git
├── SYSTEM.md            ← Technical contract for the project (stack, standards)
├── SYSTEM-TEMPLATE.md   ← Fill-in guide for SYSTEM.md for new projects
├── project.toml         ← Technical dictionary: hosting, stack, design, env vars, integrations
├── SOUL.md              ← Compact and portable AI behavior contract
├── TESTING_GUIDE.md     ← Universal testing directives (all projects)
└── index.toml           ← Declarative session router by task type
```

---

## Precedence Hierarchy

```
RULES.md          ← governs process (sovereign)
  └── SYSTEM.md   ← governs technical implementation
       └── SOUL.md ← governs AI behavior
```

---

## LAYER 0 — Always loaded

These files are read in **every** session via `BOOTSTRAP.md`:

| File | Purpose |
|---|---|
| `project.toml` | Who we are: identity, stack, URLs |
| `SOUL.md` | How the AI behaves |
| `RULES.md` | How the process works |
| `SYSTEM.md` | How the code is written |

## LAYER 1 — Loaded by task type

See `index.toml` for the full trigger → files mapping.

---

## How to use when copying the template

1. Fill in `project.toml` with the name, stack, URLs, and env vars of the new project
2. Review `SOUL.md` (usually no changes needed)
4. Use `kernel/SYSTEM-TEMPLATE.md` as a guide to fill in `kernel/SYSTEM.md`
5. Sync the rest of the system via `memory/WORKFLOW_MEMORY_PLAYBOOK.md` section 9

---

## Relationship with the rest of SFK

```
kernel/       ← control (this directory)
.agent/       ← capabilities (20 agents, 46 skills, 11 workflows)
memory/       ← persistence (logs, plans, decisions, progress)
docs/         ← product documentation
```
