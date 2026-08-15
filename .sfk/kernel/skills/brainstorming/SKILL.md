---
name: brainstorming
description: Socratic questioning protocol + requirements discovery and validation gates. MANDATORY for complex requests, new features, or unclear requirements. Includes progress reporting and error handling.
allowed-tools: Read, Glob, Grep
---

# Brainstorming & Communication Protocol

> **MANDATORY:** Use for complex/vague requests, new features, updates.

---

## 🛑 SOCRATIC GATE (ENFORCEMENT)

### When to Trigger

| Pattern | Action |
|---------|--------|
| "Build/Create/Make [thing]" without details | 🛑 ASK 3 questions |
| Complex feature or architecture | 🛑 Clarify before implementing |
| Update/change request | 🛑 Confirm scope |
| Vague requirements | 🛑 Ask purpose, users, constraints |

### 🚫 MANDATORY: 3 Questions Before Implementation

1. **STOP** - Do NOT start coding
2. **ASK** - Minimum 3 questions:
   - 🎯 Purpose: What problem are you solving?
   - 👥 Users: Who will use this?
   - 📦 Scope: Must-have vs nice-to-have?
3. **WAIT** - Get response before proceeding

---

## 🧠 Dynamic Question Generation

**⛔ NEVER use static templates.** Read `dynamic-questioning.md` for principles.

### Core Principles

| Principle | Meaning |
|-----------|---------|
| **Questions Reveal Consequences** | Each question connects to an architectural decision |
| **Context Before Content** | Understand greenfield/feature/refactor/debug context first |
| **Minimum Viable Questions** | Each question must eliminate implementation paths |
| **Generate Data, Not Assumptions** | Don't guess—ask with trade-offs |

### Question Generation Process

```
1. Parse request → Extract domain, features, scale indicators
2. Identify decision points → Blocking vs. deferable
3. Generate questions → Priority: P0 (blocking) > P1 (high-leverage) > P2 (nice-to-have)
4. Format with trade-offs → What, Why, Options, Default
```

### Question Format (MANDATORY)

```markdown
### [PRIORITY] **[DECISION POINT]**

**Question:** [Clear question]

**Why This Matters:**
- [Architectural consequence]
- [Affects: cost/complexity/timeline/scale]

**Options:**
| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| A | [+] | [-] | [Use case] |

**If Not Specified:** [Default + rationale]
```

**For detailed domain-specific question banks and algorithms**, see: `dynamic-questioning.md`

---

## Hybrid Requirements & Vision Flow (MANDATORY for project creation)

Use this flow when the request is about creating a new product, defining scope, or stabilizing requirements.

### 0) Context Scan (before designing)

Before asking deep questions:

- Check what already exists (docs, plans, code, prior decisions)
- Distinguish existing behavior vs proposed behavior
- Mark implicit constraints that still need confirmation

Do not propose architecture yet.

### 1) Initial Socratic Gate (current rule still applies)

- Ask minimum 3 blocking questions first (Purpose, Users, Scope)
- Wait for answers before implementation

### 2) Deep Clarification (one question at a time)

After the initial gate, refine requirements with one high-impact question per turn:

- Prefer multiple-choice when possible
- Use open-ended only when needed
- Each question must remove an implementation fork

### 3) Non-Functional Requirements (MANDATORY)

Explicitly confirm or propose assumptions for:

- Performance targets
- Scale (users, traffic, data volume)
- Security/privacy constraints
- Reliability/availability expectations
- Maintenance/ownership model

If user is unsure, propose defaults and label them as assumptions.

### 4) Understanding Lock (HARD GATE)

Before proposing solution design, provide:

1. Understanding Summary (5-7 bullets):
   - what is being built
   - why it exists
   - who it serves
   - constraints
   - non-goals
2. Explicit assumptions
3. Open questions

Then ask for explicit confirmation:

> "Does this accurately reflect your intent? Please confirm or correct before we move to design."

Do not proceed to design without confirmation.

### 5) Options With Trade-offs

After confirmation, propose 2-3 viable approaches:

- lead with recommended option
- explain complexity, risk, extensibility, maintenance
- avoid premature optimization (YAGNI)

### 6) Decision Log (MANDATORY)

Keep a running log:

- decision made
- alternatives considered
- why chosen
- deferred items (if any)

### 7) Exit Criteria (before implementation)

Brainstorming may end only when all are true:

- Understanding Lock confirmed
- At least one approach explicitly accepted
- Assumptions documented
- Key risks acknowledged
- Decision Log complete

If any item is missing, continue refinement.

### 8) Handoff Artifact

Produce a durable markdown handoff containing:

- understanding summary
- assumptions
- decision log
- accepted approach and constraints
- implementation notes (scope boundaries, must-haves)

---

## Progress Reporting (PRINCIPLE-BASED)

**PRINCIPLE:** Transparency builds trust. Status must be visible and actionable.

### Status Board Format

| Agent | Status | Current Task | Progress |
|-------|--------|--------------|----------|
| [Agent Name] | ✅🔄⏳❌⚠️ | [Task description] | [% or count] |

### Status Icons

| Icon | Meaning | Usage |
|------|---------|-------|
| ✅ | Completed | Task finished successfully |
| 🔄 | Running | Currently executing |
| ⏳ | Waiting | Blocked, waiting for dependency |
| ❌ | Error | Failed, needs attention |
| ⚠️ | Warning | Potential issue, not blocking |

---

## Error Handling (PRINCIPLE-BASED)

**PRINCIPLE:** Errors are opportunities for clear communication.

### Error Response Pattern

```
1. Acknowledge the error
2. Explain what happened (user-friendly)
3. Offer specific solutions with trade-offs
4. Ask user to choose or provide alternative
```

### Error Categories

| Category | Response Strategy |
|----------|-------------------|
| **Port Conflict** | Offer alternative port or close existing |
| **Dependency Missing** | Auto-install or ask permission |
| **Build Failure** | Show specific error + suggested fix |
| **Unclear Error** | Ask for specifics: screenshot, console output |

---

## Completion Message (PRINCIPLE-BASED)

**PRINCIPLE:** Celebrate success, guide next steps.

### Completion Structure

```
1. Success confirmation (celebrate briefly)
2. Summary of what was done (concrete)
3. How to verify/test (actionable)
4. Next steps suggestion (proactive)
```

---

## Communication Principles

| Principle | Implementation |
|-----------|----------------|
| **Concise** | No unnecessary details, get to point |
| **Visual** | Use emojis (✅🔄⏳❌) for quick scanning |
| **Specific** | "~2 minutes" not "wait a bit" |
| **Alternatives** | Offer multiple paths when stuck |
| **Proactive** | Suggest next step after completion |

---

## Anti-Patterns (AVOID)

| Anti-Pattern | Why |
|--------------|-----|
| Jumping to solutions before understanding | Wastes time on wrong problem |
| Assuming requirements without asking | Creates wrong output |
| Over-engineering first version | Delays value delivery |
| Ignoring constraints | Creates unusable solutions |
| "I think" phrases | Uncertainty → Ask instead |

---
