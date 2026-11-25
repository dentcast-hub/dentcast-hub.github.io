# After Push 2 — only when the founder reports a problem

The agent's work ends at Push 2 (`publish-checkpoints.md`, «After Push 2»): it does not read this
file, monitor the run or merge. `publish-auto-merge.yml` merges the PR when every check is green and
comments on it otherwise. Read this file only when the founder says a run or PR is stuck, then
follow the part that fits. After Push 2 nothing is the
agent's: `post-cut2-mechanical.yml` runs C.8, C.7, D, E, Phase F and G from the exact Push-2 commit,
pushes delivery 3 and opens the PR when the `QUEUE_PUBLISH_TOKEN` secret is set (otherwise the job
summary says to open it by hand; a queue item's PR is opened by `queue-publish.yml`). It never merges.
Before Phase F it refuses any regenerated page that lost or lowered a `?v=` stamp it had at Push 2
(`ASSET_VERSION_REGRESSION`); the agent never runs `git diff -G'\?v='` by hand on this route.  A queue item (`queue-route.md`) reads only the
«Transient» bullet of the Failure section below: its lane forbids `invalidate` and any extra commit.

## Finding the run

`gh run list --workflow post-cut2-mechanical.yml --branch <branch>`, or the GitHub MCP tools
(`actions_list`, `actions_get`, `get_job_logs`). The run to read is the one whose `head_sha` is the
Push-2 SHA. Logs and recovery bundle: run artifact `post-cut2-<Push-2 SHA>` (14 days).

## Success

1. `git pull --ff-only` on the publication branch, always before ending the session. Not a
   fast-forward → the branch moved unexpectedly: stop and inspect, never merge, reset or force.
   Until the pull the Stop guard reports `DELIVERY_3_ON_REMOTE_PULL_REQUIRED` or
   `REMOTE_BRANCH_ADVANCED_NOT_FETCHED`; only the pull clears them.
2. `python3 tools/dentcast_publish_handoff.py confirm-cleanup`: read-only check of the pulled HEAD —
   its parent is the receipt's second-delivery commit (Push 2, or the last audited reconciliation
   commit; else `EXTRA_DELIVERY_COMMIT_FORBIDDEN`), the committed completion receipt's fingerprints
   match the tree (`FINAL_RECEIPT_FILE_MISMATCH`), its Phase F exit code is 0
   (`MECHANICAL_GATE_RECEIPT_REQUIRED`), the handoff is gone and HEAD is the remote head. It trusts the
   runner's committed Phase F receipt (no rerun, no `origin/main` fetch). Never
   run `restore-cleanup` on this route, nor `confirm-cleanup` before the pull.
3. The PR: the runner opens it, but only when the `QUEUE_PUBLISH_TOKEN` secret is set — its job
   summary says so when it is not. No PR after a green run → open it from the branch to `main`
   yourself, before the end-of-run message, with the connected GitHub tool (`create_pull_request`) or
   `gh pr create --base main --head <branch> --title "<content_id>: <title>"`, then wait for its checks. Put the link in the end message and say there that the runner could not.
4. No message here when the merge follows; its facts go into the merge message: `content_id`, branch,
   Push-2 SHA, run link, PR link and the Phase F summary line (the standing-acceptance list, the M1/M2 answers and the orphan sentences were
   already in the agent's Push-2 report; repeat nothing). Not "published" until merged.
5. **Merge**, without asking (`publish-checkpoints.md`, «Waiting, services, merge»): fresh
   `check-pr` (`python3 tools/dentcast_publish_handoff.py check-pr --repository <owner>/<repo> --number <n>
   --expected-head <sha> --expected-base <base SHA> --expected-branch <branch>`; unauthenticated works on this
   public repository), gates green, then merge (`gh pr merge <n> --merge`, the GitHub tool
   `merge_pull_request`, or the founder in the web UI). Message at merge. A red gate means no merge.
   Re-dispatch by hand: `gh workflow run post-cut2-mechanical.yml --ref <branch> -f target_branch=<branch>
   -f expected_head=<Push-2 SHA>` (the exact inputs `queue_publish.py status` or the handoff prints).

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
  evidence and redo the steps through C.6: the merge commit may be a save (once C.4.13 has started
  again) or Push 2 itself, which starts the workflow again.
- **Cause in the publication** (Phase F names a page, entry, approval or text): at the Push-2 commit
  `invalidate --from-step <first affected step>` (`C.6` when only a frozen approval/title/caption is
  wrong); restore each approval from the audit with the founder's actual correction, fix the bytes,
  redo the steps through `C.6`, stage fix + handoff and push **one** reconciliation commit, which
  starts the workflow again. Delivery 3 accepts the audited commits between Push 2 and itself.

Never edit a frozen approval with `record` after Push 2, never run C.8 onward locally while the
workflow can run, never start a run while another run of the same branch is in progress. A blocker
that recovery cannot clear is reported with its exact code and the run link.
