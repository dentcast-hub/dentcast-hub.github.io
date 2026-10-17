# Publication recovery acceptance — 2026-10-17

The active modular workflow and fixed `.dentcast/PUBLISH-HANDOFF.md` recovery
contract are implemented on `fix/publishing-resume-contract`. They apply when
that branch (or a later integration containing these changes) is checked out.
An agent on an older main checkout still sees the older instructions. This
repair has not merged main or published content.

## Observed acceptance

`tests/test_dentcast_publish_recovery.py` adds eight acceptance scenarios using
fresh Python CLI processes, actual temporary Git checkouts and local bare
remotes. It uses the unchanged production `tools/verify_publish.py`, never a
fixture verifier. All remote operations in these tests are local Git operations.

| Scenario | Observed result |
|---|---|
| Same checkout, uncommitted page, new CLI process | Exact bytes preserved; completed rules retained; next step is `0`; portability is no |
| Local commit not pushed | Reported as local-only; fresh clone has neither that work nor its handoff |
| Only handoff copied to fresh clone | Missing work detected by snapshot comparison; inspection blocks and leaves the handoff untouched |
| Work and checkpoint committed and pushed | Receiving clone retrieves exact bytes; requires explicit reconciliation of changed HEAD/index; preserves resolved prefix; refreshed checkpoint-only commit becomes portable after push |
| Corrupt or stale checkpoint | Inspection blocks without overwriting the file or work |
| Ambiguous external outcome | `outcome_unknown` preserved and retry prohibition reported; no external action executed |
| Actual page verifier, content absent from indexes | Production verifier exits 1 with INCOMPLETE; failed F persisted; finish refuses cleanup |
| Actual paper-only catalog gate | Synthetic catalog/link identity accepted; cleanup remains incomplete until deletion committed/pushed and confirmed; fresh-clone CI guard accepts verified deletion |

The positive catalog lifecycle uses synthetic IDs and operator receipts. No
Drive upload occurred. Boundary fixtures seed earlier completed ledgers through
the internal API so tests can reach verification/cleanup; this is not evidence
of scientific completion. No positive full-page publication, live site delivery,
scientific review, or real notification was performed. The production verifier
and scientific algorithms were not changed.

Existing tests additionally cover stale writers, interrupted cleanup restoration,
approvals, conflicts, offline remotes, workflow/input changes, installed pre-commit,
native Stop adapter processes, routing advice and complete module/global migration.
Total local validation: 65 Python checkpoint/lifecycle/recovery tests, 8 migration
checks, and 6 Node checks (79 tests). GitHub CI runs the same groups and the
committed-state guard. A workflow definition is not itself a successful run;
consult Actions for the commit being evaluated.

## Receiving-agent procedure

1. Read the repository entrypoint in the actual working checkout. On a request
   such as «انتشار ناقص داشتم», read `.dentcast/PUBLISH-HANDOFF.md` first, then
   the active contract/modules. Backup legacy files are not execution sources.
2. Run `python3 tools/dentcast_publish_handoff.py inspect --check-remote`.
   Missing state on main does not prove another working branch has no run.
   Remote access failure means unknown, not synchronized. Do not retry uncertain
   uploads or notifications.
3. If work is local-only, continue in the original checkout or retrieve the
   authorized complete work/commits/assets. Copying just the handoff cannot do
   this. Do not reset or reconstruct exact user inputs from memory.
4. After retrieving work, compare the saved hashes, actual bytes, index, commit
   history, workflow sources and external evidence. Export the saved
   `recorded_state.publication` object to an input JSON file **outside the
   checkout**, retaining receipts and resolved steps whose prerequisites still
   hold. Use `record --input <file> --expected-sha256 <inspection hash>
   --reconcile-note <specific evidence reviewed>` to record the reviewed state.
   A note is an operator assertion, not automatic proof that missing work exists.
   Changed scientific inputs require invalidating dependent work; changed
   workflow fingerprints require a pending plan as enforced by the writer.
5. Commit/push the refreshed fixed handoff when authorized, then inspect again.
   Checkpoint-only commits do not require recursively embedding their own SHA.
   Resume the reported first unfinished step using the per-step protocol.
6. Use the applicable real verification and guarded finish/confirmation flow.
   If cleanup delivery fails, restore the same fixed file with
   `restore-cleanup`. Do not report publication complete before confirmation.

## Client boundaries

| Surface | Evidence | Remaining limit |
|---|---|---|
| AGENTS / CLAUDE / Cursor entrypoints | Shared active modules, fixed resume trigger/path and migration tests | A client must actually load repository instructions from this checkout |
| Python CLI | Fresh-process and fresh-clone acceptance above | Operator must verify semantic truth, private inputs and external outcomes |
| Claude / Codex Stop adapter | Direct adapter process tests and configuration checks | Actual installed client hook execution has not been observed here |
| Cursor advice | Pure Node routing tests, nested paths and backup exclusion | Actual Cursor runtime not launched; no native Cursor hook guarantee claimed |
| Git pre-commit | Installed-hook process tests | Each checkout needs `git config core.hooksPath .githooks`; hooks can be bypassed |
| GitHub CI | Live contract suite configured on working branch and PRs | Does not force a client to read instructions or execute scientific steps |

No repository file can guarantee compliance by every arbitrary agent. The shared
entrypoints establish the required behavior; CLI, Git and CI checks enforce
observable state boundaries. Native client sessions and a real full publication
remain operational acceptance to observe during an authorized publication.
