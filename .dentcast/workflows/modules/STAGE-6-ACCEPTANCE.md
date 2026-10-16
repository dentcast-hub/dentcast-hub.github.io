# Stage 6 — cross-client handoff, real GitHub race, and crash-recovery evidence

**Status: TESTED — staging transport and handoff. NOT CERTIFIED with live Claude/Cursor/Codex runtimes. NOT ACTIVE.**

The agent-independent transport and failure/recovery behavior has been implemented and verified. Genuine, independent runs inside the three named **external AI applications** have **not** occurred; their delegated model sessions, blinded independence and app-specific permissions cannot be established in this execution environment. This remains a **specific pre-activation gate**, not a silently passed test.

## What is actually implemented and tested

- `tools/dentcast_stage6_handoff.py` reads a replay-verified run by ID, checks the SHA-256 digest of the exact Stage 3 compiled route, enforces the frozen source revision, proves that completed steps form a strict prefix of the canonical plan, refuses skipped steps and out-of-order results, and returns only the next pending canonical module, approvals and source reference. A paused step is **blocked** until explicitly recovered. An end-of-plan state is marked **staged, never published**.
- `tools/dentcast_github_memory.py` now binds each completed event to exact input/output fingerprints **and** a matching immutable receipt. Replay verifies the receipt against the event fields, plus every content-addressed artifact. It detects falsified or missing data, mismatched pending-step state and stale plan revisions.
- **Lost GitHub acknowledgment**: if GitHub accepted a commit but the caller lost the response, retrying the same begin/completion/scientific checker/pause/recovery returns the already committed receipt rather than duplicating scientific or publication work. A different result for the same completed scientific step raises a conflict. No automatic unsafe re-execution.
- **GitHub optimistic concurrency**: one atomic Git tree and Git commit per transition, then a non-force branch-ref update. Two siblings from the same parent cannot both advance the shared branch; losing writers must fetch HEAD and reconcile. Never force-push.

## Automated evidence

**174 tests PASS**, with all legacy canonical-source and staging checks also passing. CI run: https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/38847144937 on commit `edd9f1762c4a3b00b607de2a5c2f8b377de6d78f`.

- Test suite `tests/test_dentcast_stage6_handoff.py`: synthetic separate Claude/Cursor/Codex-labeled actors hand off an exact plan, pause, refuse premature advancement, recover, and confirm that all verified stages still never mean a real publish.
- `tests/test_dentcast_github_memory.py`: simulates a dropped network acknowledgment **after** committing and proves replay without duplicated begin, completed step, or pause/recovery; rejects different checker results, false receipt binding, tampered steps and stale branch updates.
- `tests/test_dentcast_fidelity_resume.py`: the existing 72-unit source, blinded second checker task, discrepancy-only third, stronger reviewer/adjudicator and no founder-approval bypass remain green.

## Real GitHub test — distinct from mocks

A completely synthetic, public-safe, non-scientific run `stage6-smoke-20261016` was created on the **feature branch** with four separate, atomic GitHub commits:

1. Begin: `c14984f1dbb2817853275a23877c4e90f01c409a`.
2. Pause: `9c02d59c2ace6bc721904c7b7035ae1d6f47dc62` (synthetic client A).
3. Recover: `6ca81e213818a82080dae9f25ccf99c9e2e86c39` (synthetic client B).
4. Completed one staged step with an input/output-bound receipt: `0b5f49fa5c5ad75882410ce7d36275b118487eb5`.

All seven final files (manifest, state, four events and receipt) were fetched independently on GitHub; their event sequence and previous-digest links matched, receipt fingerprints matched the completed event, and `execution_authorized=false`, `real_publish_verified=false`.

A deliberately stale sibling commit `f5724be7a15f67087b2d5df2892f04dfa343e71d` was constructed from an old parent. Updating the branch with `force=false` and the old expected SHA returned a GitHub integration error **and branch HEAD stayed unchanged** at the valid latest run commit. This demonstrates no stale overwrite; the connector emitted a generic GraphQL error rather than a typed CAS-conflict message, so exact error classification remains an integration follow-up.

These were **two synthetic operator identities**, not separate external Claude/Cursor/Codex AI executions. No real scientific data or patient content was uploaded.

## Still required before production

1. Run a real handoff in **Claude Code, Cursor and Codex** using the same pinned repository state, separately verify each application's actual session/model and permission controls, and prove that one agent does not see another blinded checker's output.
2. Verify external founder approvals by an independently authenticated mechanism; the current digest labels cannot grant approval.
3. Carry out Stage 7 canonical behavioral parity on isolated, public-safe publication fixtures and measure actual context/token savings.
4. Founder explicitly approves any later Stage 8 live entrypoint change or merge. **Nothing in Stage 6 grants this permission.**

**Scope:** `dentcast-hub/dentcast-hub.github.io` / `refactor/publishing-modular-workflow`. No `main` merge, live router change, publication or scientific DES/Fidelity-engine change.
