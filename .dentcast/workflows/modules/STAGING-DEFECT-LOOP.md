# Historical modularization development record — not live instructions

This document records staging development at its original revision. Its former branch directions, activation status, backup-reading requirements and proposed workflow routes are historical, not current execution instructions.
For live work read `.dentcast/workflows/README.md`, `.dentcast/workflows/global/README.md` and `.dentcast/workflows/agent-parity.md`.
For «انتشار ناقص داشتم», first read `.dentcast/PUBLISH-HANDOFF.md`, then `.dentcast/workflows/publish-handoff.md`.
Staging utilities remain restricted to staging. Do not follow the historical steps below to resume a real publication or assume their test results describe the current branch.
Current repair branch and status: `.dentcast/workflows/PUBLISHING-REPAIR-PLAN.md`.

---

## Historical record (non-operative)

# Staging defect loop (not an activation instruction)

For every incremental orchestrator change, use up to four local review/fix cycles before handing off to an independent stronger-model audit.

1. **Baseline:** inspect current feature-branch files and canonical clauses. Run all available tests; record exact evidence and any unavailable test runner.
2. **Adversarial pass:** try malformed inputs, interrupted modules, stale revisions, repeated receipts, unauthorized skips, privacy and source-of-truth mismatches. Fix discovered defects on this feature branch only.
3. **Regression pass:** add a negative test for each defect, rerun existing and new tests, inspect code/test assumptions for false positives.
4. **Cross-module pass:** validate planner, independent validator, checkpoint transitions, and relevant source rules together; record unresolved dependencies and stop before activation.

Do not equate **tests written** with **tests passed**. A GitHub commit is not evidence of successful CI. If the runner is inaccessible, explicitly report **NOT EXECUTED** and preserve that as a blocker.

Never activate the staged router, edit active entrypoints, merge into main, publish, deploy, or alter scientific DES/Fidelity behavior without separately scoped founder approval. Treat source-text slices as reference, not executable modules. Checkpoint simulations do not certify actual external side effects or founder approvals.

The goal is behavioral correctness and recoverability across agents, not token minimization.
