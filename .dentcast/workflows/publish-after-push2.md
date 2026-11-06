# After Push 2 — monitor, pull, confirm, merge

Read completely right after the second delivery of a page publication is confirmed
(`publish-checkpoints.md`, «After Push 2»). Not read before Push 2. After Push 2 nothing is the
agent's: `post-cut2-mechanical.yml` runs C.8, C.7, D, E, Phase F and G from the exact Push-2 commit,
pushes delivery 3 and opens the PR when the `QUEUE_PUBLISH_TOKEN` secret is set (otherwise the job
summary says to open it by hand; a queue item's PR is opened by `queue-publish.yml`). It never merges.
Before Phase F it refuses any regenerated page that lost or lowered a `?v=` stamp it had at Push 2
(`ASSET_VERSION_REGRESSION`); the agent never runs `git diff -G'\?v='` by hand on this route. The agent
monitors, reports, and merges only with authorization.

## Monitor

- Stay with the run until it is terminal; do not end the turn while it is queued or running. No
  periodic status messages: one at Push 2 (already sent), one at the run's end, one at merge.
- `gh run watch`, or without `gh` the GitHub MCP tools: `actions_list` (the branch's runs of
  `post-cut2-mechanical.yml`), `actions_get` (status, conclusion), `get_job_logs` (failed jobs).
- No run, or preflight skipped: inspect the event, branch and handoff before saying Actions started.
- Logs and recovery bundle: run artifact `post-cut2-<Push-2 SHA>` (14 days), through the Actions API
  (list the run's artifacts, download that zip), not from the branch.

## Success

1. `git pull --ff-only` on the publication branch, always before ending the session. Not a
   fast-forward → the branch moved unexpectedly: stop and inspect, never merge, reset or force.
   Until the pull the Stop guard reports `DELIVERY_3_ON_REMOTE_PULL_REQUIRED` or
   `REMOTE_BRANCH_ADVANCED_NOT_FETCHED`; only the pull clears them.
2. `python3 tools/dentcast_publish_handoff.py confirm-cleanup`: read-only check of the pulled HEAD —
   its parent is the receipt's second-delivery commit (Push 2, or the last audited reconciliation
   commit; else `EXTRA_DELIVERY_COMMIT_FORBIDDEN`), the committed completion receipt's fingerprints
   match the tree (`FINAL_RECEIPT_FILE_MISMATCH`), its Phase F exit code is 0
   (`MECHANICAL_GATE_RECEIPT_REQUIRED`), the handoff is gone and HEAD is the remote head. On a run with
   the v2 cut policy (`fixed_three_deliveries_v2`) it trusts the runner's committed Phase F receipt (no
   rerun, no `origin/main` fetch); a v1-policy run still reruns Phase F. Never
   run `restore-cleanup` on this route, nor `confirm-cleanup` before the pull.
3. Message at the run's end: `content_id`, branch, Push-2 SHA, run link, PR link and the Phase F
   summary line (the standing-acceptance list, the M1/M3b/M2 answers and the orphan sentences were
   already in the agent's Push-2 report; repeat nothing). Not "published" until merged.
4. **Merge** only with authorization (`publish-checkpoints.md`, «Waiting, services, merge»): fresh
   `check-pr`, gates green, then merge. Message at merge. A red gate means no merge.

A completed PR whose `main` advanced (another publication merged) usually conflicts on Pulse, the
homepage counters and the version stamp, so no merge ref is built and its checks do not run. Update
it with `git merge origin/main` on the completed branch, never by rerunning the publication: keep
both sides' entries and Pulse lines, then `python3 tools/update-homepage-counters.py` and
`python3 tools/stamp-version.py` (last), in the merge commit or in a following commit that changes
only those recomputed values. Until the stamp is rerun the merge gate fails on Phase F `7 version`.

## Failure — guarded recovery

A run that fails **before** delivery 3 pushes nothing; the branch stays at Push 2. A failure **after**
delivery 3 was pushed (the merge-gate verification or the PR step) leaves delivery 3 on the branch:
pull, `confirm-cleanup`, open the PR by hand if it is missing; never re-dispatch. Read the
logs/artifact, then:

- **`ASSET_VERSION_REGRESSION`:** a builder or stamp defect, never the agent's `git diff` job; it is a
  tool defect (next bullet but one) unless the lost stamp sits in the publication's own page edit.

- **Transient** (runner lost, network, outage): `workflow_dispatch` the same commit (`target_branch`,
  `expected_head` = Push-2 SHA). Commit nothing. A tool defect is not transient.
- **Tool defect fixed on `main`** (e.g. `tools/verify_publish.py`): at the Push-2 commit,
  `git merge --no-commit origin/main`, then `invalidate --from-step rules` with the real cause. Enroll
  merged non-publication paths in `target_paths` only after the invalidation is written (keep them
  out of the index until then, restore them from `origin/main` afterwards). Restore each still-valid
  approval from the `dependency_invalidation_v1` audit, re-record the ledger with re-verification
  evidence and re-cross the cuts in order: the merge commit is the re-delivered cut 1 (allowed once
  per audited invalidation), then cut 2 once more, which starts the workflow again.
- **Cause in the publication** (Phase F names a page, entry, approval or text): at the Push-2 commit
  `invalidate --from-step <first affected step>` (`C.6` when only a frozen approval/title/caption is
  wrong); restore each approval from the audit with the founder's actual correction, fix the bytes,
  redo the steps through `C.6`, stage fix + handoff and push **one** reconciliation commit, which
  starts the workflow again. Delivery 3 accepts the audited commits between Push 2 and itself.

Never edit a frozen approval with `record` after Push 2, never run C.8 onward locally while the
workflow can run, never start a run while another run of the same branch is in progress. A blocker
that recovery cannot clear is reported with its exact code and the run link.
