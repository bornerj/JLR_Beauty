> Enter Auditor Mode, do not write code, only evaluate per SESSION-AUDIT-CHECKLIST and return PASS or FAIL.

# SESSION-AUDIT-CHECKLIST.md
Goal: act as an auditing agent before final commit, push, or session closure.

No session can be closed with FAIL.

## 1. Decision Integrity (Decision Drift)

[ ] Are all active DECISION-* entries still valid?
[ ] Did any change made today contradict an ACTIVE decision?
[ ] Were structural changes (auth, schema, API contract, architecture) recorded as a new DECISION or an update?

If there is a conflict:
→ BLOCK closure until the decision is recorded or adjusted.

---

## 2. State Integrity (Architectural Drift)

[ ] Is there any PLAN-XXXX that is not DONE?
[ ] Was there a relevant flow or architecture change not reflected in the official state?
[ ] Was the plan scope respected?

If not:
→ Update the open PLAN-XXXX or record a formal deviation.

---

## 3. Operational Memory

[ ] Was every change recorded in the MODIFICATION_LOG?
[ ] Was the plan (PLAN-XXXX) updated with real progress?
[ ] Was the plan correctly closed if completed?

---

## 4. Debug Memory

[ ] Was any bug fixed in this session?
[ ] If yes, is there a corresponding entry in `memory/logs/DEBUG-HISTORY.md`?
[ ] Was the template followed with:
    - ID
    - SYMPTOM
    - ROOT_CAUSE
    - ACTION
    - CONTEXT

If not:
→ Record before closing the session.

---

## 5. Technical Validation

[ ] Was lint executed?
[ ] Was build executed?
[ ] Were tests executed?
[ ] Was the Prisma migration applied and validated if the schema changed?
[ ] Are logs clean with no unauthorized console.log?

---

## 6. Regression Risk

[ ] Was any sensitive area changed? (auth, payment, scheduling, external integration)
[ ] Are there tests covering the change?
[ ] Is there similar history in debug-history that could resurface?

---

## 7. Git Governance

[ ] Was a review of changed files done?
[ ] Does the commit message follow the standard?
[ ] Was the Git Record of Delivery filled in?
[ ] Was push explicitly authorized?

---

## Audit Result

Status: PASS | FAIL

If FAIL:
- Describe the violation.
- Indicate the mandatory corrective action before merge or push.
