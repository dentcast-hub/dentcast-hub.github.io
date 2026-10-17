# Historical modularization development record — not live instructions

This document records staging development at its original revision. Its former branch directions, activation status, backup-reading requirements and proposed workflow routes are historical, not current execution instructions.
For live work read `.dentcast/workflows/README.md`, `.dentcast/workflows/global/README.md` and `.dentcast/workflows/agent-parity.md`.
For «انتشار ناقص داشتم», first read `.dentcast/PUBLISH-HANDOFF.md`, then `.dentcast/workflows/publish-handoff.md`.
Staging utilities remain restricted to staging. Do not follow the historical steps below to resume a real publication or assume their test results describe the current branch.
Current repair branch and status: `.dentcast/workflows/PUBLISHING-REPAIR-PLAN.md`.

---

## Historical record (non-operative)

# DentCast Publishing — Orchestrator & Module Contract v0.1 (STAGING)

> **Primary objective: modular ownership, round-trip invocation, fault isolation, testability and resumability.** Token reduction is optional, not an acceptance criterion. This document defines a proposed interface, not an active publishing instruction. Original README and all current entrypoints remain authoritative.

## Cross-agent continuation (Claude Code / Cursor / Codex)

For work **on the staging modularization project** (not live publication), start with [CROSS-AGENT-HANDOFF.md](CROSS-AGENT-HANDOFF.md). This is one shared source of continuation state, not a replacement for the active canonical README or agent-parity rules. Never infer permission to activate or merge from the handoff.

## Shared GitHub execution memory (proposed, not active)

See [SHARED-EXECUTION-MEMORY-CONTRACT.md](SHARED-EXECUTION-MEMORY-CONTRACT.md). Cross-agent continuation must preserve **nested** module checkpoints (including completed first Fidelity reviewer and pending second reviewer), complete immutable per-claim scientific outputs, verified receipts, and actor provenance. The existing public repository holds only public-safe temporary run records; restricted or identifying material must never enter Git history. Shared memory requires conflict-safe GitHub writes and orchestrator-controlled cleanup after verified publication. Local checkpoint tests do not prove GitHub-level concurrency or scientific resumability.

## Stage 1 architecture baseline

The founder chose temporary execution memory in this existing GitHub repository. Cleanup of an active run is orchestrator-owned and allowed only after the applicable canonical completion gate and verified publication outcome. Local POSIX CAS is not remote GitHub concurrency control. Open Stage 2 parity issues include taxonomy/page order, LiteCast build/brain dependencies, conditional route edges and schema naming. No activation or scientific behavior changes are authorized.

## Mental model

The **orchestrator is a state machine**, not a large replacement README and not an agent that memorizes every specialist rule. It owns route selection, dependency graph, approvals, status transitions, dispatch, checkpoint references, error routing, invalidation and final verification. Each module owns a bounded responsibility, its full domain rules, a version and explicit inputs/outputs. The orchestrator calls a module and receives a structured result; it does not silently reproduce that module's scientific or editorial work.

`discover -> plan -> dispatch(module, inputs, state snapshot) -> module result -> validate -> persist -> unlock dependents`

**The twelve extracted files are source slices, not yet independently executable modules.** This contract is the interface target. Do not call the current twelve files complete modules until each has an actual adapter/handler, ownership mapping and tests.

## Required module interface

Each registered module declares:
- `id`, `contract_version`, `implementation_ref`, `source_of_truth`, `owner`.
- `trigger` (deterministic eligibility predicate), `requires` (state fields and completed modules), `input_schema`, `output_schema`.
- `reads` (allowlisted data), `writes` (owned artifacts only), `side_effects` (explicitly authorized tools and targets).
- `approval_gates`, `skip_conditions`, `invalidated_by`, `failure_codes`, `retry_policy`.
- `verification` (tests and acceptance checks), `privacy_class`, `checkpoint_policy`.

Module invocation request:
```json
{
  "run_id": "opaque-id",
  "module_id": "taxonomy",
  "module_contract_version": "0.1",
  "source_revision": "git-commit-sha",
  "attempt": 1,
  "input_fingerprint": "sha256-of-canonical-input",
  "inputs": {},
  "dependencies": {},
  "approvals": {}
}
```
Module response:
```json
{
  "run_id": "opaque-id",
  "module_id": "taxonomy",
  "status": "completed",
  "input_fingerprint": "same-fingerprint",
  "outputs": {},
  "artifacts": [],
  "decisions": [],
  "approval_requests": [],
  "invalidates": [],
  "verification": [],
  "error": null
}
```
`status` must be one of `completed | skipped_with_reason | awaiting_approval | blocked | failed`. An attempted but unresolved step is **never** `skipped_with_reason`. All skips must identify the original rule that authorizes them. `completed` is not equivalent to published.

## Central state and failure isolation

Persistent run record includes: run ID, source revision, route, content category, content ID, exact user-supplied title/caption bytes or secure reference, module registry revision, module statuses and versions, dependency fingerprints, locked taxonomy decision, approval identities/scopes/timestamps, completed side effects, artifact checksums, checkpoint locations, pending actions, failure codes, last successful verification. Store private or licensed inputs outside public git; record only safe references/hashes in public logs.

Every error must identify **module ID, operation, source file/version, rule/step ID, input fingerprint, failed invariant, remediation and retry scope**. The orchestrator should not say only 'publish failed'. If failure occurs in a shared global invariant, assign ownership to `core-contract`, not an arbitrary module.

A module cannot mark its own founder approval complete. The orchestrator receives the founder's explicit approval and binds it to the exact subject/version. Any relevant content change invalidates that approval.

Checkpoint and retry: persist an immutable result **after validating** module output and before dispatching a dependent stage; replay only if source revision, module contract/implementation version, exact inputs, dependency outputs and approval scope match. Side effects must be idempotent or have a durable idempotency key; do not blindly replay git writes, notifications, Drive uploads, DB writes or external agent calls. A checkpoint cannot silently bypass a required verification or approval gate.

## Proposed logical module ownership (NOT identical to the twelve source slices)

| Logical module | Owns | Input -> output | Source-slice candidates |
|---|---|---|---|
| `intake` | classify route, preserve user strings, collect metadata, explicit approval requests | user content -> typed publish plan | 02 |
| `page` | clone same-type structure, media, identity, basic HTML | locked category + media -> draft page | 03 |
| `taxonomy` | live pillar/subtopic semantic decision and lock | draft + live taxonomy -> locked classification | 04 |
| `navigation` | capsule, parent/series and navigation placement | page + taxonomy -> nav artifacts | 04 |
| `semantic-links` | fresh in-body and related semantic analysis, shared 5-link budget | content + existing links -> proposed/applied links + count | 05 |
| `paper-cabinet` | paper-only route, Drive/catalog, source metadata | attached paper -> cabinet/credit result | 06 |
| `learning-assets` | flashcards and quiz with type exclusions | approved content -> indexed learning artifacts | 07 |
| `evidence` | invoke **opaque, independently versioned DES/Fidelity engine** | eligible evidence units -> validated engine result or approval request | 08 is invocation contract only |
| `challenge` | challenge markup and private handoff | approved challenge question -> public-safe page and private handoff reference | 09 |
| `brain` | schema-consistent append at absolute end of flat array, hashtag reference | final content + locked metadata -> brain/hash artifacts | 10 |
| `pathways` | learning paths and bundle gates | specialist brain entry -> path decision | 10 |
| `build` | pulse, ordered builders, version/hash restamp | validated artifacts -> built outputs | 11 |
| `english` | approved English mirror with exact exceptions | final fa page -> en mirror/toggle or authorized skip | 12 |
| `notification` | notification marker with exceptions | publication state -> marker or authorized skip | 12 |
| `verify` | Phase F and final report | complete artifact set -> green gate and report | 12 |

**Hard rules and cross-agent parity are core contracts, not a mutable scientific module.** The source slices may combine responsibilities; split *execution ownership* only after verifying every original cross-stage dependency. This is a target domain decomposition, not permission to move paragraphs or rewrite canonical rules.

## Non-negotiable invariants

1. Canonical README source precedence remains in force until a reviewed replacement contract is activated. The README has **17** numbered hard rules, plus Phase F final gate (not 'Hard Rule 18').
2. `dentcast-brain.json` is a single flat array: append new entries to its absolute end; never invent schema fields or change closed category policy.
3. Semantic-link analysis remains mandatory even when the result is empty; LiteCast uses its own isolated universe. Shared related-links budget remains five.
4. English mirror/toggle is mandatory except the canonical LiteCast and challenge skips.
5. Source-dependent DES eligibility and complete existing scientific voting/founder gates are unchanged. Evidence engine has its **own** independent version and internal per-agent durable checkpoint capability; the publishing orchestrator stores only invocation and validated-return state.
6. Title/caption user bytes and founder decisions are preserved; revisions invalidate affected downstream outputs and approvals.
7. Public git never contains private challenge answers or private clinical/source materials.
8. No unrequested git merge, production activation or deployment. Successful Phase F is mandatory before claiming publication complete.

## Dependency / invalidation examples

- **Title/caption change:** invalidate affected page metadata, related derived surfaces, English mirror, brain references, hashes, builds and final gate; preserve unrelated paper cabinet state if fingerprints still match.
- **Pillar decision change:** invalidate navigation capsule, brain pillar fields, pathways, dependent indexes, builds and verification; do not rerun independent paper ingestion.
- **Source text or text-basis change:** invalidate evidence-unit outputs and dependent DES/Fidelity checker checkpoints and derived public evidence record; require renewed scientific gates.
- **DES/Fidelity version change:** invalidate affected evidence invocation and all scientific sub-checkpoints under that version unless explicitly verified compatible by its own engine; preserve unrelated page operations.
- **Challenge route:** enforce private answer isolation, challenge-specific exclusions and no English mirror.
- **Sixth related link:** fail `semantic-links` validation with link-budget rule reference; do not proceed to final verification.

## Acceptance criteria before activation

- Every normative clause in CLAUDE/AGENTS/agent-parity/README has a stable owner, activation rule, source reference and regression test.
- Every logical module has an actual callable implementation/adapter and schema validation; no implicit cross-module file writes.
- Positive AND negative route tests pass, including failure ownership and checkpoint invalidation.
- Same required decisions, stops, artifacts and approvals across Claude, Codex and Cursor; text phrasing need not be identical.
- Live entrypoints changed atomically after founder approval, with reversible commit; merging to main requires separate explicit approval.
- Do not use context/token savings as a go/no-go criterion; record as a secondary metric only.

## Known pre-existing contradictions to resolve before activation

- Fidelity rescore scope differs between canonical README and some agent/Cursor summaries. Preserve canonical scientific execution semantics; treat changes to the engine itself as a separate versioned project.
- CLAUDE/AGENTS intro has legacy 'end of category' brain wording; canonical flat-array rule wins.
- AGENTS Plus/Premium summary incompletely states challenge exceptions; load full canonical route rules.
- Historic eight-module extraction must not be auto-selected as runnable modules.
