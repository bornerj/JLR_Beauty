# SFK — Structured Framework Kit

> SFK is a multi-tenant orchestration layer that provides memory, rules, and procedures as a service, decoupling the AI intelligence from the execution logic.

---

## 📋 Overview

SFK is a modular system consisting of:

- **20 Specialist Agents** - Role-based AI personas
- **46 Skills** - Domain-specific knowledge modules
- **11 Workflows** - Slash command procedures

---

## 🏗️ Directory Structure

```plaintext
kernel/
├── ARCHITECTURE.md          # This file
├── agents/                  # 20 Specialist Agents
├── skills/                  # 46 Skills
├── workflows/               # 11 Slash Commands
├── rules/                   # Global Rules
└── scripts/                 # SFK Scripts
```

---

## 🤖 Agents (20)

Specialist AI personas for different domains.

| Agent                    | Focus                      | Skills Used                                              |
| ------------------------ | -------------------------- | -------------------------------------------------------- |
| `orchestrator`           | Multi-agent coordination   | parallel-agents, agents-orchestrator, behavioral-modes   |
| `project-planner`        | Discovery, task planning   | brainstorming, plan-writing, architecture                |
| `frontend-specialist`    | Web UI/UX                  | frontend-design, engineering-frontend-developer, nextjs-react-expert, web-design-guidelines |
| `backend-specialist`     | API, business logic        | api-patterns, engineering-backend-architect, nodejs-best-practices, database-design     |
| `database-architect`     | Schema, SQL                | database-design                                           |
| `mobile-developer`       | iOS, Android, RN           | mobile-design                                            |
| `game-developer`         | Game logic, mechanics      | game-development                                         |
| `devops-engineer`        | CI/CD, Docker              | deployment-procedures, fullstack-docker-deploy, server-management |
| `security-auditor`       | Security compliance        | vulnerability-scanner, red-team-tactics                  |
| `penetration-tester`     | Offensive security         | red-team-tactics                                         |
| `test-engineer`          | Testing strategies         | testing-patterns, tdd-workflow, webapp-testing           |
| `debugger`               | Root cause analysis        | systematic-debugging                                     |
| `performance-optimizer`  | Speed, Web Vitals          | performance-profiling                                    |
| `seo-specialist`         | Ranking, visibility        | seo-fundamentals, geo-fundamentals                       |
| `documentation-writer`   | Manuals, docs              | documentation-templates                                  |
| `product-manager`        | Requirements, user stories | plan-writing, brainstorming                              |
| `product-owner`          | Strategy, backlog, MVP     | plan-writing, brainstorming                              |
| `qa-automation-engineer` | E2E testing, CI pipelines  | webapp-testing, testing-patterns                         |
| `code-archaeologist`     | Legacy code, refactoring   | clean-code, code-review-checklist                        |
| `explorer-agent`         | Codebase analysis          | architecture, brainstorming, plan-writing, systematic-debugging |

---

## 🧩 Skills (46)

Modular knowledge domains that agents can load on-demand. based on task context.

### Frontend & UI

| Skill                   | Description                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| `web-design-guidelines` | Web UI audit - 100+ rules for accessibility, UX, performance (Vercel) |
| `tailwind-patterns`     | Tailwind CSS v4 utilities                                             |
| `frontend-design`       | UI/UX patterns, design systems                                        |
| `engineering-frontend-developer` | Frontend implementation and UX delivery guidance             |
| `nextjs-react-expert`   | React and Next.js performance patterns                                |

### Backend & API

| Skill                   | Description                    |
| ----------------------- | ------------------------------ |
| `api-patterns`          | REST, GraphQL, tRPC            |
| `engineering-backend-architect` | Backend architecture and delivery guidance |
| `nodejs-best-practices` | Node.js async, modules         |
| `python-patterns`       | Python standards, FastAPI      |
| `rust-pro`              | Rust systems/backend patterns  |
| `mcp-builder`           | Model Context Protocol         |

### Database

| Skill             | Description                 |
| ----------------- | --------------------------- |
| `database-design` | Schema design, optimization |

### Cloud & Infrastructure

| Skill                   | Description               |
| ----------------------- | ------------------------- |
| `deployment-procedures` | CI/CD, deploy workflows   |
| `fullstack-docker-deploy` | Self-hosted fullstack Docker standard |
| `server-management`     | Infrastructure management |
| `bash-linux`           | Linux shell operations    |
| `powershell-windows`   | Windows shell operations  |

### Testing & Quality

| Skill                   | Description              |
| ----------------------- | ------------------------ |
| `testing-patterns`      | Jest, Vitest, strategies |
| `webapp-testing`        | E2E, Playwright          |
| `tdd-workflow`          | Test-driven development  |
| `code-review-checklist` | Code review standards    |
| `lint-and-validate`     | Linting, validation      |
| `systematic-debugging`  | Root cause debugging     |
| `systematic-debugging-awesome` | Extended debugging playbook |
| `performance-profiling` | Profiling and bottleneck analysis |
| `kaizen`                | Continuous improvement loop |

### Security

| Skill                   | Description              |
| ----------------------- | ------------------------ |
| `vulnerability-scanner` | Security auditing, OWASP |
| `red-team-tactics`      | Offensive security       |

### Architecture & Planning

| Skill           | Description                |
| --------------- | -------------------------- |
| `app-builder`   | Full-stack app scaffolding |
| `architecture`  | System design patterns     |
| `plan-writing`  | Task planning, breakdown   |
| `brainstorming` | Socratic questioning       |
| `intelligent-routing` | Automatic agent routing |
| `parallel-agents` | Multi-agent coordination  |
| `agents-orchestrator` | Phase-based multi-agent delivery |
| `behavioral-modes` | Task-adaptive operation modes |

### Mobile & Game

| Skill           | Description           |
| --------------- | --------------------- |
| `mobile-design` | Mobile UI/UX patterns |
| `game-development` | Game logic, mechanics |

### SEO & Growth

| Skill              | Description                   |
| ------------------ | ----------------------------- |
| `seo-fundamentals` | SEO, E-E-A-T, Core Web Vitals |
| `geo-fundamentals` | GenAI optimization            |

### Documentation & Strategy

| Skill                     | Description               |
| ------------------------- | ------------------------- |
| `documentation-templates` | Doc formats               |
| `technical-writer`        | Developer documentation   |
| `executive-summary-generator` | Executive decision summaries |
| `tool-evaluator`          | Tool/platform evaluation  |

### Other

| Skill                     | Description               |
| ------------------------- | ------------------------- |
| `clean-code`              | Coding standards (Global) |
| `i18n-localization`       | Internationalization      |

---

## 🔄 Workflows (11)

Slash command procedures. Invoke with `/command`.

| Command          | Description              |
| ---------------- | ------------------------ |
| `/brainstorm`    | Socratic discovery       |
| `/create`        | Create new features      |
| `/debug`         | Debug issues             |
| `/deploy`        | Deploy application       |
| `/enhance`       | Improve existing code    |
| `/orchestrate`   | Multi-agent coordination |
| `/plan`          | Task breakdown           |
| `/preview`       | Preview changes          |
| `/status`        | Check project status     |
| `/test`          | Run tests                |
| `/ui-ux-pro-max` | Design with 50 styles    |

---

## 🎯 Skill Loading Protocol

```plaintext
User Request → Skill Description Match → Load SKILL.md
                                            ↓
                                    Read references/
                                            ↓
                                    Read scripts/
```

### Skill Structure

```plaintext
skill-name/
├── SKILL.md           # (Required) Metadata & instructions
├── scripts/           # (Optional) Python/Bash scripts
├── references/        # (Optional) Templates, docs
└── assets/            # (Optional) Images, logos
```

### Enhanced Skills (with scripts/references)

| Skill               | Files | Coverage                            |
| ------------------- | ----- | ----------------------------------- |
| `app-builder`       | 20    | Full-stack scaffolding              |
| `mobile-design`     | 14    | Mobile UX, platform guides, audits  |
| `nextjs-react-expert` | 11  | Next.js/React optimization rules    |
| `frontend-design`   | 10    | UI system + scripts                 |
| `fullstack-docker-deploy` | 9 | Docker stack templates + scaffold |

---

## Scripts (4)

Top-level SFK scripts. Two are validation masters and two support preview/session operations.

### Top-Level Scripts

| Script               | Purpose                                    | When to Use                    |
| -------------------- | ------------------------------------------ | ------------------------------ |
| `checklist.py`       | Priority-based validation (Core checks)    | Development, pre-commit        |
| `verify_all.py`      | Comprehensive verification (All checks)    | Pre-deployment, releases       |
| `auto_preview.py`    | Start/stop/status local preview server     | Local preview workflow         |
| `session_manager.py` | Project/session status and stack detection | Session diagnostics and context |

### Usage

```bash
# Quick validation during development
python kernel/scripts/checklist.py .

# Full verification before deployment
python kernel/scripts/verify_all.py . --url http://localhost:3000

# Start local preview server (default port 3000)
python kernel/scripts/auto_preview.py start

# Show project/session status summary
python kernel/scripts/session_manager.py status .
```

### What They Check

**checklist.py** (Core checks):

- Security (vulnerabilities, secrets)
- Code Quality (lint, types)
- Schema Validation
- Test Suite
- UX Audit
- SEO Check

**verify_all.py** (Full suite):

- Everything in checklist.py PLUS:
- Lighthouse (Core Web Vitals)
- Playwright E2E
- Bundle Analysis
- Mobile Audit
- i18n Check

For details, see [kernel/scripts/README.md](scripts/README.md)

---

## 📊 Statistics

| Metric              | Value                         |
| ------------------- | ----------------------------- |
| **Total Agents**    | 20                            |
| **Total Skills**    | 46                            |
| **Total Workflows** | 11                            |
| **Total Scripts**   | 4 (top-level) + 17 (skill-level) |
| **Coverage**        | ~90% web/mobile development   |

---

## 🔗 Quick Reference

| Need     | Agent                 | Skills                                |
| -------- | --------------------- | ------------------------------------- |
| Web App  | `frontend-specialist` | engineering-frontend-developer, nextjs-react-expert, frontend-design, web-design-guidelines |
| API      | `backend-specialist`  | engineering-backend-architect, api-patterns, nodejs-best-practices   |
| Mobile   | `mobile-developer`    | mobile-design                         |
| Database | `database-architect`  | database-design                       |
| Security | `security-auditor`    | vulnerability-scanner                 |
| Testing  | `test-engineer`       | testing-patterns, webapp-testing      |
| Debug    | `debugger`            | systematic-debugging                  |
| Plan     | `project-planner`     | brainstorming, plan-writing           |
