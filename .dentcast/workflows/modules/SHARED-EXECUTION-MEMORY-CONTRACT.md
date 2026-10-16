# Shared GitHub execution memory — implemented staging contract v0.2 (NOT ACTIVE)

**Implementation:** `tools/dentcast_github_memory.py` provides atomic GitHub Git-Data commit/branch CAS, full manifest/state/event chain replay and immutable artifacts/receipts. `tools/dentcast_fidelity_resume.py` implements per-unit cross-agent scientific checkpoints using the *unchanged* DES v3.4 engine. See `STAGE-4-ACCEPTANCE.md` and `STAGE-5-ACCEPTANCE.md`. This remains **staging only**; CI uses synthetic data and a real GitHub write smoke was performed. No public data upload is safe merely because a SHA attestation is present.

## Purpose

A publication belongs to a **run**, not to Claude Code, Cursor, Codex, or a chat session. An agent resuming a run must discover the current committed state, verify receipts, and continue at the first unfinished *substep*; it must never infer completion from prose or from a model name.

The **staging GitHub-backed implementation now works** for machine-readable events and externally provided scientific results. It is **not** a working production publishing system: no model execution is launched, no founder authorization is inferred and the old production router is unchanged.

## Storage and confidentiality

Use the existing public DentCast repository for temporary cross-agent execution memory. Only public-safe inputs and results may be committed; never include identifying patient data, credentials, restricted licensed content, or private challenge answers. Deleting files from the active branch does not erase Git history.

Current temporary layout in the existing repository:

```text
.dentcast/execution-memory/runs/<run_id>/manifest.json
.dentcast/execution-memory/runs/<run_id>/state.json
.dentcast/execution-memory/runs/<run_id>/events/000001-<event_id>.json
.dentcast/execution-memory/runs/<run_id>/artifacts/<artifact_digest>.json
.dentcast/execution-memory/runs/<run_id>/receipts/<receipt_id>.json
```

Store event/receipt/artifact objects as **immutable, content-addressed** objects. Use GitHub commit SHA and GitHub API optimistic concurrency for state updates, with an atomic branch-ref update or a dedicated serialized writer. Local POSIX flock only protects one machine; it does NOT protect GitHub writers. A successful push is not proof that an agent held an exclusive lease; re-fetch HEAD and reconcile on conflicts. Never force-push memory history.

## Required provenance

Every event records `event_id`, `run_id`, `actor.agent_family` (claude/cursor/codex/other), `actor.model` when known, `actor.session_id` when available, `timestamp_utc`, `stage_id`, `substep_id`, `event_type`, `source_revision`, `contract_version`, `input_digest`, `output_digest`, `artifact_refs`, `verification_receipt`, and `previous_event_digest`. An actor's own name is provenance, **not authorization or verification**. A claimed result must be validated against its original invocation and immutable evidence before being marked complete.

Record decisions and explicit founder approvals as distinct signed/verified-or-attributed events bound to exact scope, content fingerprint, and version. No agent can create a founder approval by writing an event.

## Nested Fidelity/DES checkpoint example (illustrative, not an actual scientific result)

```json
{
  "run_id": "opaque-run",
  "module": "evidence",
  "engine": "fidelity",
  "engine_version": "PINNED_EXISTING_VERSION",
  "input_digest": "sha256:PINNED_EXACT_CLAIM_SET_AND_SOURCES",
  "claim_set": {"count": 72, "manifest_ref": "artifacts/claims-digest"},
  "substeps": {
    "agent_1": {
      "status": "completed_verified",
      "actor": {"agent_family": "claude", "model": "PINNED_MODEL"},
      "result_ref": "artifacts/agent1-full-72-claim-result",
      "receipt_ref": "receipts/agent1-validated-receipt",
      "illustrative_summary": {"matched": 70, "total": 72}
    },
    "agent_2": {"status": "pending"},
    "comparison": {"status": "blocked_waiting_for_agent_2"},
    "adjudication": {"status": "pending"}
  }
}
```

The number **70/72 is hypothetical**, not a substitute for all 72 per-claim decisions, quotes, source spans, confidence/grade fields, and provenance required by the **existing** Fidelity engine. Exact claim IDs/order, source-text hashes, engine/prompt versions, model roles, and input/output schema must match the existing scientific implementation. Do **not** change scientific voting, thresholds, prompts, adjudication, approvals or required agent independence to make resume easier.

## Resume algorithm

1. Read current GitHub branch HEAD and immutable run manifest; check run ID, permissions, source revision, contract versions and hashes.
2. Replay/verify event chain and materialize state. Reject missing, corrupted, contradictory or unverified receipts. Do not rely on `state.json` alone.
3. Determine first pending substep using the **scientific engine's actual state machine**, not a generic publishing-level status. If `agent_1` has a complete validated 72-claim result with matching input/version, **reuse it**; otherwise pause or invalidate it explicitly.
4. Dispatch only `agent_2` with the same pinned claim set and required independent agent/model role. Do not give agent 2 agent 1's judgments if existing blind-voting rules prohibit it.
5. Validate agent 2's full receipt, persist immutable result, then invoke existing comparison and adjudication exactly as originally defined. A mere 70/72 count is insufficient for comparison.
6. Commit state transition with GitHub optimistic concurrency; on conflict re-read HEAD and re-evaluate, never overwrite another agent's progress.
7. If source text, claim set, scientific engine/prompt, or dependency version changes, invalidate **only the scientifically affected checkpoints** under existing rules; never silently reuse stale judgments.

## Required integration/production tests (unit coverage exists; live validations still required)

- Claude completes first scientific agent; Cursor resumes second without rerunning first; Codex compares the same two complete claim arrays.
- Invalid, incomplete or mismatched first-agent receipt triggers fail-closed behavior, not reuse.
- Two writers race on GitHub; exactly one state transition commits and the loser re-reads and reconciles.
- Crash after immutable result upload but before state update recovers without duplicate scientific execution or duplicate side effects.
- Privacy check ensures no private clinical/scientific artifacts reach the public repo or public GitHub Actions logs.
- Changing one source or claim set invalidates affected scientific receipts and enforces all original gates.
- Independence of the second agent and existing scientific comparison/adjudication are preserved.

## Activation gate

Before use for real publishing: public-safe data reviewed and cleanup verified; exact existing DES/Fidelity engine contract mapped; GitHub writer and replay verifier implemented; security/privacy and concurrent-writer tests pass; behavioral parity independently audited; founder explicitly approves activation. Until activation the only allowed use is **staging**, whether local or GitHub-backed; no production publication or DES/Fidelity execution is authorized.

## Temporary-run lifecycle

Keep only unfinished runs in the active directory. After the canonical final verification and confirmed successful publication, the orchestrator deletes the completed run directory in a separate commit. Never delete paused, failed, awaiting-approval or unverified runs. Cleanup does not erase Git history or published artifacts. Staging dry-runs never trigger cleanup. Paper-only runs follow their own canonical completion gate.
