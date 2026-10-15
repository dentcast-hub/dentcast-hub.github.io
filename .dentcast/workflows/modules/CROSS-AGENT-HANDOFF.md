# Cross-agent modularization handoff — STAGING ONLY

**CURRENT IMPLEMENTATION STATUS (after Stages 1–5):** Read [STAGE-2-ACCEPTANCE.md](STAGE-2-ACCEPTANCE.md), [STAGE-3-ACCEPTANCE.md](STAGE-3-ACCEPTANCE.md), [STAGE-4-ACCEPTANCE.md](STAGE-4-ACCEPTANCE.md) and [STAGE-5-ACCEPTANCE.md](STAGE-5-ACCEPTANCE.md) first. The GitHub memory writer is `tools/dentcast_github_memory.py`; per-unit scientific resume is `tools/dentcast_fidelity_resume.py`; the portable staging orchestration is `tools/dentcast_stage3_orchestrator.py`. All remain STAGING ONLY and must not publish or activate the live router. The older audit notes below describe historical defects, not current implementation status.

**Purpose:** Claude Code, Cursor, Codex/GPT and Work must continue the SAME modularization project from the SAME GitHub branch and evidence, not restart from memory or a platform-specific prompt.

## First five actions, in order

1. Confirm repository `dentcast-hub/dentcast-hub.github.io` and branch `refactor/publishing-modular-workflow`. Record HEAD SHA. **Never default to main for edits.**
2. Read this handoff, `ORCHESTRATOR-CONTRACT.md`, `MODULE-CONTRACTS.v1.json`, `MODULE-REGISTRY.draft.json`, and `INTERNAL-VALIDATION-AND-ROUTE-PLAN.md`.
3. Read the canonical `.dentcast/workflows/README.md` and `.dentcast/workflows/agent-parity.md` plus the relevant original source slices. For any real publishing request, the original live instructions remain authoritative.
4. Inspect `tools/dentcast_route_plan_draft.py`, `tools/validate_dentcast_route_plan_draft.py`, `tools/dentcast_checkpoint_draft.py`, `tools/dentcast_checkpoint_store_draft.py`, `tests/test_dentcast_*draft.py`, `tests/test_dentcast_staging_integration.py`, and the GitHub Actions staging workflow. Inspect actual code and logs; don't trust prior agent summaries.
5. Run tests, identify a concrete defect or missing invariant, fix on the staging branch only, rerun tests and record precise pass/fail and source revision. Never claim a test ran unless its output was inspected.

## Immutable operating boundaries

- Current 12 Markdown slices remain **verbatim reference extracts**. The 15 logical owners now have callable staging validators and step executor; they are **NOT autonomous publication handlers** and may not be used on live content without explicit activation.
- No live router activation, main merge, deployment, content publication, or unrequested side effects.
- DES/Fidelity is an opaque independently versioned scientific subsystem; do not modify its scoring, prompts, voting, approval or adjudication logic.
- Preserve all 17 numbered hard rules, Phase F, exact title/caption bytes, explicit founder approvals, category exceptions, paper-only semantics, and cross-agent behavioral parity.
- The legacy planner produces `draft_requires_audit`. The Stage 3 step compiler and Stage 4/5 remote memory run **staging only**; every checkpoint retains `execution_authorized: false`, and no real publish is reported.
- A successful unit suite proves only the tested assertions; behavioral parity and executable-module completeness remain unproven.

## Current implementation and known risks

- Route planner and validator: conservative skeleton; Stage 3 adds a phase-scoped compiled staging plan, bounded validators, local file edits and verified receipts.
- Checkpoint transition + local atomic store: staging-only; GitHub Git-Data atomic commit, non-force ref CAS, event replay and immutable scientific/receipt storage have now been implemented in Stage 4. Real founder approval verification and external side-effect reconciliation are still unimplemented.
- **Historical dependency mismatch was resolved in Stage 2:** LiteCast build no longer requires specialist brain, its own links and Pulse remain, and Phase E vs C6 notification are distinct invocations. Live README stays authoritative.
- Stage 4/5 integrated suite has **162 tests passing** including nested 72-unit replay, conflict rejection, original-engine restoration and source invalidation. Verified run: https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/38801124387. Always verify current HEAD's CI again after code edits.
- For latest HEAD, retrieve GitHub Actions run and job logs, including per-suite counts, after commits. Fix failures before moving on.

## New staging central entrypoint

Use `tools/dentcast_orchestrator_draft.py` as the single **read-only** dry-run entrypoint across Claude Code, Cursor and Codex. Read `AGENT-ENTRYPOINT-STAGING.md` for explicit startup traces. The orchestrator now validates each adapter response against its **original invocation** before checkpoint acceptance; never bypass this validator. This is not an active publishing workflow and has no authority to publish.

## Concurrent writers: new staging rule

Use `store.save_checked(path, state, expected_digest)` for every new checkpoint write. First creation uses `expected_digest=None`; subsequent updates require the digest of the exact previously loaded state. A stable POSIX `flock` lock plus digest comparison rejects stale writes. The legacy `store.save()` remains for old staging tests and **is not concurrency-safe**; never use it in new agent orchestration. This is cooperative locking, not a protection against agents bypassing the API or networked filesystems with unreliable flock. On Windows the checked API fails closed. Keep checkpoint paths in a trusted private directory.

## GitHub shared execution memory: implemented for staging

Read `SHARED-EXECUTION-MEMORY-CONTRACT.md` before implementing remote cross-agent resume. Preserve scientific substeps and complete per-claim receipts: a verified first Fidelity agent must not be rerun merely because a different agent takes over. The second agent, comparison, and adjudication must follow the **existing** Fidelity engine unchanged. Use the existing public repository for temporary public-safe execution memory; never commit confidential or restricted inputs. Clean completed runs from the active tree only after verified publication. These both now exist for staging (`tools/dentcast_github_memory.py`, `tools/dentcast_fidelity_resume.py`). Do not confuse local/mock validation or the public-safe synthetic GitHub smoke run with production scientific model execution. Full live 3-agent validation remains Stage 6.

## Next priorities (Stages 6–8; preceding list is historical)

1. **Dependency parity audit:** compare every generated route against `MODULE-REGISTRY.draft.json` DAG, with explicit treatment of intentionally optional modules. Determine whether mismatches are bad route order, bad draft dependency contract, or a real canonical rule ambiguity. Record evidence before changing.
2. **Adversarial checkpoint tests:** stale writers and overwrites, mismatched plan digest, corrupt/tampered receipts, path safety, retry after crash. Do not imply atomic rename alone is concurrency-safe.
3. **Callable module adapter plan:** define platform-neutral structured inputs/outputs and validators, plus a minimal read-only dry-run dispatch; keep all publishing side effects forbidden until founder approval and full parity proof.
4. **Clause-level behavioral parity:** every canonical rule, exception, stop and approval gate mapped to owner and positive/negative test, including DES/Fidelity as opaque invocation.
5. Only after a clean integrated run and independent audit, propose activation for explicit founder approval.

## Reporting and authority

For each change report: branch and commit SHA, affected files, tests actually run with results, newly discovered defects, unresolved risks, and next step. Do not confuse **the user saying 'continue'** with permission to merge, activate, deploy or publish. A different agent resumes from this file and the repository's current state, not from the previous model's conversation history.

## Shared instructions

`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/dentcast-router.mdc` and `.dentcast/workflows/agent-parity.md` remain active and untouched by this staging handoff. They already route live publishing to the canonical README. The handoff is for modularization development only, and must not change active publishing behavior.
