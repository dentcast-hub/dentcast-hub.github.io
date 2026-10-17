# Publishing workflow repair — staged delivery

Owner decision (2026-10-17): legacy is backup only and is not read for execution. Use a single temporary `.dentcast/PUBLISH-HANDOFF.md`, update it at every publication step, discover it when asked to resume, and remove it after verified completion.

Working branch: `fix/publishing-resume-contract`.
Each stage is reviewed and verified, then committed and pushed before the next stage. Do not claim all stages are delivered when only a contract exists.

| Stage | Deliverable | Acceptance | Status |
|---|---|---|---|
| 1 | Permanent handoff contract, fixed temporary path, resume discovery in agent entrypoints | Same path and trigger in AGENTS, CLAUDE, Cursor, publishing README and shared parity; lifecycle and transfer limits documented | Contract and routing delivered in this stage |
| 2 | Active global rules, modular-only authority, corrected live/staging documentation | Required global invariants survive; no runtime instruction requires loading backup files; specialty routes preserved | Delivered in stage 2; active global rules and historical record boundaries |
| 3 | Minimal handoff writer, validator and recovery inspection | Dirty/staged/untracked work, local commits and remote availability distinguished; safe updates; no invented completion | Delivered in stage 3; fixed-path writer/inspector, strict schema, Git observation, atomic writes and local lock |
| 4 | Per-step workflow integration, hooks and CI | Every step updates state; nested module edits covered; working-branch CI tests actual active rules; completion cleanup guarded | Delivered in stage 4; explicit step protocol, native adapters, pre-commit/CI and recoverable completion |
| 5 | End-to-end recovery scenarios | Same-checkout dirty work; unpushed commit; remote transfer; missing/corrupt/stale state; ambiguous external outcome; verified cleanup | Delivered for CLI/Git recovery; actual native-client sessions and full live publication remain unobserved |

Stage 2 migrated complete global §§6–8 into active shared files, preserved detailed specialty triggers, replaced legacy runtime authority, redirected obsolete section references, and marked development documents historical. Stage 3 supplies the live fixed-path writer/inspector. Stage 4 supplies the explicit per-step protocol, native adapters, pre-commit/CI checks and guarded cleanup. Stage 5 validates fresh-process/checkout recovery; see [acceptance evidence and client limits](PUBLISHING-RECOVERY-ACCEPTANCE.md). Actual native client sessions and full live publication were not performed.
No real content publication is in progress as part of this repair, so no temporary publication handoff should be created merely for this refactor.

## Stage 2 validation

`python3 -m unittest discover -s tests -p test_dentcast_agent_entrypoint_migration.py -v` — 8 tests passed. Full global text migration and all twelve module bodies were checked against source fixtures, allowing only documented active-reference repairs. Backup fixtures are read by audit tests only; no live instruction requires them. No backup snapshot, scientific prompt, model algorithm or staging executable was changed. Real client runtime parity and automatic handoff recovery remain untested until later stages.

## Stage 3 validation

`python3 -m unittest discover -s tests -p test_dentcast_publish_handoff.py -v` — 32 tests passed using actual temporary Git repositories and local bare remotes. Covered staged/worktree/untracked distinctions, stale writers, atomic replacement failure, local-only commits, fresh versus cached remote observations, checkpoint-only commits, ignored required inputs, changed workflows and inputs, conflicts, malformed state, unsafe paths, pending approvals, external outcome reconciliation and terminal receipt preservation. No external publishing or network service was exercised.

`python3 -m unittest discover -s tests -p test_dentcast_agent_entrypoint_migration.py -v` — 8 active-entrypoint/migration checks passed. Python syntax checks also passed. Windows runtime locking and real agent/client recovery remain unverified. The helper does not transfer work, publish, or delete the checkpoint; stage 4 adds workflow/CI integration and completion cleanup.

## Stage 4 validation

57 Python checkpoint/lifecycle tests and 8 active-entrypoint/source-migration checks passed locally, plus 6 Node advisory-routing tests. The lifecycle tests exercise actual temporary Git repositories, installed pre-commit and native adapters, a fresh-clone CI boundary, staged/unstaged state, full ledger order, cleanup delivery confirmation and recovery after interrupted cleanup. Their fixture verifier tests execution/failure boundaries, not actual publication or scientific correctness. Module source bodies are unchanged behind the explicit protocol prefaces.

Local Node tests use `node --experimental-test-isolation=none --test tests/publishing-hooks.test.mjs` because this execution environment restricts Node child-process creation. Native adapter process tests run from Python and passed. GitHub CI uses the normal Node test runner and includes the three equivalent test groups plus committed-state/cleanup checks. Actual GitHub CI outcome is recorded in the implementation report, not assumed from YAML presence. No real content was published and no temporary live publication was fabricated.

## Stage 5 validation

Eight new acceptance tests run separate CLI processes against actual temporary checkouts/bare remotes. They cover dirty work, local commits, incomplete and complete transfer, reconciliation with retained resolved steps, corrupt/stale state, ambiguous external outcomes, an unchanged real page verifier rejecting incomplete content, and the real synthetic paper catalog gate through cleanup delivery confirmation. All 79 local checks passed (65 checkpoint/lifecycle/recovery, 8 migration, 6 Node). No scientific algorithm, legacy backup or actual publication artifact was changed. Full-page positive verification and actual native-client behavior remain explicitly unobserved; see the acceptance report.
