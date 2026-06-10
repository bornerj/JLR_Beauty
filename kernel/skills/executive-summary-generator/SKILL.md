---
name: executive-summary-generator
description: Executive summary generation for technical and business contexts. Use to turn long updates, incident reports, metrics, or project docs into concise decision-ready summaries with clear impact, recommendations, and next steps.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Executive Summary Generator

## Purpose
Transform complex project or operational inputs into concise summaries for leadership decisions.

## Use This Skill When
- Preparing weekly or monthly leadership updates.
- Summarizing incident outcomes for non-technical stakeholders.
- Converting long technical docs into decision-ready briefings.
- Communicating project risk, impact, and priorities to executives.

## Required Inputs
- Context: what happened and why now.
- Key facts: metrics, timelines, constraints, dependencies.
- Business impact: cost, revenue, risk, customer effect.
- Decision needed: approve, delay, escalate, re-scope, invest.

If data is missing, explicitly state assumptions and gaps.

## Output Structure (Mandatory)
Use this exact structure:

```markdown
## 1. Situation
- Current state and trigger
- Why this matters now

## 2. Key Findings
- 3-5 findings, ordered by business impact
- Include quantitative evidence where available

## 3. Impact
- Business/operational impact in concrete terms
- Risk level and time horizon

## 4. Recommendations
- 3-4 prioritized actions (Critical/High/Medium)
- Include owner and timeline

## 5. Immediate Next Steps
- 2-3 actions for the next 7-30 days
- Explicit decision point and deadline
```

## Rules
- Be concise and specific; avoid generic language.
- Do not invent facts.
- Distinguish observed facts vs assumptions.
- Prioritize decision support over narrative detail.
- Keep focus on outcomes, risks, and actions.

## Quality Checklist
- [ ] Findings are evidence-backed.
- [ ] Impact is clear and quantified when possible.
- [ ] Recommendations include owner + timeline.
- [ ] Next steps are actionable and time-bound.
- [ ] Open risks or data gaps are explicit.

