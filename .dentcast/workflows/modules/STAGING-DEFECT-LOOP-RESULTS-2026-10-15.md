# Historical modularization development record — not live instructions

This document records staging development at its original revision. Its former branch directions, activation status, backup-reading requirements and proposed workflow routes are historical, not current execution instructions.
For live work read `.dentcast/workflows/README.md`, `.dentcast/workflows/global/README.md` and `.dentcast/workflows/agent-parity.md`.
For «انتشار ناقص داشتم», first read `.dentcast/PUBLISH-HANDOFF.md`, then `.dentcast/workflows/publish-handoff.md`.
Staging utilities remain restricted to staging. Do not follow the historical steps below to resume a real publication or assume their test results describe the current branch.
Current repair branch and status: `.dentcast/workflows/PUBLISHING-REPAIR-PLAN.md`.

---

## Historical record (non-operative)

# Staging defect loop — 2026-10-15

Scope: draft checkpoint transition and atomic local checkpoint store. No publishing, no module execution, no main merge, no DES/Fidelity changes.

## Pass 1 — baseline
Executed in isolated local Python environment (a manually mirrored copy of the GitHub checkpoint files): 27 checkpoint/store unit tests passed. This is NOT a GitHub Actions result.

## Pass 2 — adversarial completion receipts
Reproduced defect: an inconsistent completed receipt with wrong source revision and failed verification was accepted by checkpoint persistence. Added checks for receipt module ID, source revision, and verified completion. Added 2 regression tests. Local run: 29 passed.

## Pass 3 — side effects and fingerprints
Reproduced defect: checkpoint persistence accepted a completed receipt with an invalid fingerprint and non-empty artifact receipts. Added fail-closed checks. Added 2 regression tests. Local run: 31 passed.

## Pass 4 — end-to-end recovery and regression
Executed local in-memory planner-independent four-module checkpoint flow: intake -> taxonomy -> page(failed) -> explicit recovery -> page(completed) -> verify(completed), including disk saves/reloads and pause-bypass rejection. PASS. Re-ran 31 checkpoint/store unit tests: PASS.

## Limitations / gates
- Local execution used a manually mirrored checkpoint implementation and tests, not a checked-out GitHub tree (GitHub network unavailable from the local test runtime).
- Route planner, route validator, and their end-to-end integration tests were NOT executed in this loop; do not claim the entire test suite is green.
- GitHub Actions run status is not confirmed.
- No runnable publishing modules or live orchestrator dispatch exists; checkpoint store has no multi-process compare-and-swap/locking, no tamper-evident signatures, and no authorized side-effect reconciliation.
- Staging remains non-executable and cannot authorize publish/deploy/merge.
