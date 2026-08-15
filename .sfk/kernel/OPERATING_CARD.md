# Operating Card — Always Loaded, Never Skipped

> The non-negotiables. If you do nothing else, do these. Full detail: `.sfk/kernel/RULES.md`.

**Before acting**
1. Session start → run `.sfk/kernel/BOOTSTRAP.md`; read `memory/progress.md` Resume Panel first.
2. Complex/structural change → write `memory/plans/PLAN-XXXX.md` BEFORE executing.

**While working**
3. Architectural choice made → record `memory/decisions/DECISION-XXX.md`.
4. Bug resolved → record `memory/logs/DEBUG-HISTORY.md` (ERR-XXXX) before closing.
5. DB schema/data change → `db/migrations/` (append-only) + log in `memory/logs/BUILD-HISTORY.md`.
6. External interface → `sfk.toml [[integrations]]` + `docs/integrations/<service>.md`. Names, never secret values.

**Before finishing**
7. Significant change → append to `memory/MODIFICATION_LOG.md` (the pre-commit hook BLOCKS commits without it).
8. Module changed state → update `memory/progress.md` (Modules table + Resume Panel `next_action`).

**Git (dual approval)**
9. Never commit without explicit approval. Never push without a SECOND, separate approval. Commit approval ≠ push approval.

**Boundaries**
10. Never edit engine files (`.sfk/`) without explicit instruction. Never mix engine, project state, and tooling.
