# Cross-agent modularization handoff — STAGING ONLY

**Purpose:** Claude Code, Cursor, Codex/GPT and Work must continue the SAME modularization project from the SAME GitHub branch and evidence, not restart from memory or a platform-specific prompt.

## First five actions, in order

1. Confirm repository `dentcast-hub/dentcast-hub.github.io` and branch `refactor/publishing-modular-workflow`. Record HEAD SHA. **Never default to main for edits.**
2. Read this handoff, `ORCHESTRATOR-CONTRACT.md`, `MODULE-CONTRACTS.v1.json`, `MODULE-REGISTRY.draft.json`, and `INTERNAL-VALIDATION-AND-ROUTE-PLAN.md`.
3. Read the canonical `.dentcast/workflows/README.md` and `.dentcast/workflows/agent-parity.md` plus the relevant original source slices. For any real publishing request, the original live instructions remain authoritative.
4. Inspect `tools/dentcast_route_plan_draft.py`, `tools/validate_dentcast_route_plan_draft.py`, `tools/dentcast_checkpoint_draft.py`, `tools/dentcast_checkpoint_store_draft.py`, `tests/test_dentcast_*draft.py`, `tests/test_dentcast_staging_integration.py`, and the GitHub Actions staging workflow. Inspect actual code and logs; don't trust prior agent summaries.
5. Run tests, identify a concrete defect or missing invariant, fix on the staging branch only, rerun tests and record precise pass/fail and source revision. Never claim a test ran unless its output was inspected.

## Immutable operating boundaries

- Current 12 Markdown slices are **verbatim reference extracts**, not independently callable implementations. The 15 logical module contracts are **proposals** with adapters and validators NOT_IMPLEMENTED.
- No live router activation, main merge, deployment, content publication, or unrequested side effects.
- DES/Fidelity is an opaque independently versioned scientific subsystem; do not modify its scoring, prompts, voting, approval or adjudication logic.
- Preserve all 17 numbered hard rules, Phase F, exact title/caption bytes, explicit founder approvals, category exceptions, paper-only semantics, and cross-agent behavioral parity.
- The current planner produces `draft_requires_audit`, never an executable plan. Checkpoint records always have `execution_authorized: false`.
- A successful unit suite proves only the tested assertions; behavioral parity and executable-module completeness remain unproven.

## Current implementation and known risks

- Route planner and validator: conservative skeleton, some category predicates still unresolved.
- Checkpoint transition + local atomic store: staging-only, no actual module dispatch, no durable approval registry, no multi-process compare-and-swap, no idempotent side-effect reconciliation.
- **Discovered registry dependency mismatch:** registry says `taxonomy` depends on `page`; older planner put taxonomy before page. Corrected planner to put page first. Other dependency mismatches still require a complete DAG audit, particularly `build` on LiteCast routes (registry currently requires `brain`, which LiteCast omits). Do not silently change the canonical workflow to fit the draft registry.
- Prior verified GitHub Actions run: https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/38786784803 — 66 tests passed on an earlier SHA; **not proof of the current HEAD**.
- For latest HEAD, retrieve GitHub Actions run and job logs, including per-suite counts, after commits. Fix failures before moving on.

## Next priorities

1. **Dependency parity audit:** compare every generated route against `MODULE-REGISTRY.draft.json` DAG, with explicit treatment of intentionally optional modules. Determine whether mismatches are bad route order, bad draft dependency contract, or a real canonical rule ambiguity. Record evidence before changing.
2. **Adversarial checkpoint tests:** stale writers and overwrites, mismatched plan digest, corrupt/tampered receipts, path safety, retry after crash. Do not imply atomic rename alone is concurrency-safe.
3. **Callable module adapter plan:** define platform-neutral structured inputs/outputs and validators, plus a minimal read-only dry-run dispatch; keep all publishing side effects forbidden until founder approval and full parity proof.
4. **Clause-level behavioral parity:** every canonical rule, exception, stop and approval gate mapped to owner and positive/negative test, including DES/Fidelity as opaque invocation.
5. Only after a clean integrated run and independent audit, propose activation for explicit founder approval.

## Reporting and authority

For each change report: branch and commit SHA, affected files, tests actually run with results, newly discovered defects, unresolved risks, and next step. Do not confuse **the user saying 'continue'** with permission to merge, activate, deploy or publish. A different agent resumes from this file and the repository's current state, not from the previous model's conversation history.

## Shared instructions

`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/dentcast-router.mdc` and `.dentcast/workflows/agent-parity.md` remain active and untouched by this staging handoff. They already route live publishing to the canonical README. The handoff is for modularization development only, and must not change active publishing behavior.
