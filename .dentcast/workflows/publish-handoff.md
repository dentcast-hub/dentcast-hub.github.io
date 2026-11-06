# Live publication handoff contract

This is the active, agent-neutral contract for interrupted real publications.
The one temporary state file is **`.dentcast/PUBLISH-HANDOFF.md`**, relative to the repository root.
Its name never includes a content ID, date, agent, or run ID. This contract is permanent; the state file exists only while a publication is unfinished.
Legacy files are backup snapshots only: do not load them as execution instructions or use them to override the active modular workflow.

## Discovery and resume

The trigger («انتشار ناقص داشتم»), the new-run existence check and the read-once rule: `publish-checkpoints.md`, «Interrupted publication». A later explicitly reported interruption is a new recovery, read once then.

If the file is missing, report that no handoff was found. Inspect available Git evidence and ask only for missing publication context; do not invent completed steps or claim successful resume.
For remote recovery or a missing local file, follow [GitHub handoff discovery](publish-discovery.md). Run `python3 tools/dentcast_publish_handoff.py discover --recover-incomplete` (or `discover --repository owner/repo` without a checkout), or perform the same complete, immutable-head reads through connected GitHub tools. A missing file on main does not establish that no work exists elsewhere. Select only the unique verified active handoff after a complete stable scan; never guess from branch recency. Multiple, malformed or identity-mismatched handoffs and incomplete scans block selection. Preserve local-only work and verify the selected latest head/checkout before continuing.

Before resuming:
1. Verify the repository/branch selected through the checkout or discovery result, content identity, and local versus remote state. The v3 handoff does not store Git identity or source revision; locate its exact checkpoint in Git history.
2. Inspect `git status --short --untracked-files=all`, `git diff`, `git diff --cached`, and `git log`. Discover the upstream; after a successful authorized fetch, compare it with HEAD. Record unknown remote state as unknown, never as synchronized.
3. Compare actual files and hashes, commits, test output, and external receipts with the handoff. A checked box or an agent's claim is not evidence.
4. Preserve unrelated changes. Do not reset, clean, force-push, switch away from dirty work, or blindly pull/merge to make the handoff appear consistent.
5. Resume the first unfinished canonical step whose prerequisites are verified. Recheck stale evidence when its inputs changed. Record any invalidated downstream steps.
6. For an external action marked started without a verified outcome, reconcile the real outcome before retrying, to avoid duplicate uploads, notices, or other side effects.

## State lifecycle

- Create the state file before the first publication mutation or external action.
- Update it after **every canonical step**, including completed, skipped, blocked, and failed steps; write the reason and evidence.
- Between the fixed deliveries (`publish-checkpoints.md`, the only schedule) every result stays local.
- Before each external action, record intended action, target, and status `started`; afterward record its verified result or `outcome_unknown`.
- Update semantic progress before ending a turn, switching agents, committing, or handing off. After commit/push, inspect Git directly; do not duplicate current HEAD, index, status, ahead/behind or remote observations in the handoff. Do not recursively commit just to put a commit's own SHA inside itself.
- If interrupted mid-step, the next agent verifies the actual state rather than assuming the last checkpoint is current. A Markdown file cannot guarantee recovery from every crash.
- Keep the file on any failure, pending approval, failed verification, unknown external outcome, or incomplete delivery.
- Delete it only after all applicable steps, the complete Phase F, required delivery and its verification, and the final report. For page runs the runner deletes it in delivery 3; paper-only keeps its own path (`publish-checkpoints.md`). A failed cleanup delivery is incomplete and is reported.
- Retain permanent contracts, tools, and historical development documentation. Only the temporary state file is removed.

## Local work versus portable handoff

A Markdown summary does not transfer uncommitted files or unpushed commits.
For the same checkout, inspect modified, staged and untracked work directly in Git. The handoff contains no Git status, commit, branch, file inventory or fingerprint data; the helper derives its verification baseline from Git history or private local Git metadata.
For another checkout/client, determine remote availability using Git and `inspect --check-remote`, not a saved portability Boolean. Transfer all required public-safe files and commits to the authorized working branch, or identify a retrievable patch/bundle and assets with hashes. Do not claim portability until the receiving agent can retrieve and verify both the state and the work.
If transfer is unavailable, explicitly block remote resume and identify the original checkout or missing artifact. Never reconstruct exact author text from memory.
A receiving checkout continues on the selected branch that holds the delivered cut (see `publish-discovery.md`), never on its own new branch (such as a cloud session's `ccr-*` branch); the helper refuses that move with `DELIVERED_CUT_IS_ON_ANOTHER_BRANCH`. Approvals, exam questions and other work recorded after the last delivered cut are unavailable there: report them as such and ask the founder again; never copy them from memory.

**Stale checkout after a switch.** When another checkout or client continued the run, the original checkout's undelivered work is superseded. Signs: `inspect --check-remote` reports `REMOTE_HISTORY_NOT_LOCAL_REVIEW_REQUIRED` or `REMOTE_BRANCH_ADVANCED_REVIEW_REQUIRED`, `stage-delivery` refuses `REMOTE_BRANCH_MOVED_STALE_CHECKOUT`, a push is rejected as non-fast-forward, or `git pull --ff-only` is refused. Do not continue steps, commit, merge, rebase or force-push there, and do not carry its approvals or exam rows into the other run. Keep it recoverable with `git stash push -u -m stale-<slug>-<date>` (plus `git branch stale/<slug>-<date>` if it has local commits), then `git pull --ff-only`. If local commits still block the fast-forward, move the branch with `git switch -C <branch> origin/<branch>` only after the founder confirms; the backup branch keeps those commits. Then inspect from the delivered state, or stop if the run is complete.
Keep secrets, private inputs, private approval transcripts, and restricted scientific inputs out of public Git. Record safe references and availability instead; missing private inputs block dependent steps.
Never silently publish drafts. Remote checkpoints are only the three fixed deliveries of an authorized publication.
Allow one active publication in this fixed file; concurrent publication attempts must stop rather than overwrite each other's state.

## Required state template

The supported writer is `tools/dentcast_publish_handoff.py`; read [the tool guide](publish-handoff-tool.md) for `init`, `record`, and `inspect`. It writes a generated Markdown summary plus a canonical JSON record in the same fixed file. Keep only semantic facts that are not recoverable from committed files: important decisions, required approvals and open questions, DES/Fidelity scores and results, external-action outcomes, and non-Git input/result references. File changes and Git state are reconstructed from commits and the checkout. Do not duplicate them here or edit the rendered summary separately. A pre-existing manual file must be explicitly reconciled before conversion, never silently overwritten by `init`.

```markdown
# Publication handoff
- Schema: publish-handoff-v3
- Status: in_progress | blocked | verifying | cleanup_pending
- Content ID / category / target paths:
- Last completed canonical step:
- Next canonical step:
- Current blocker:

## Scientific results not recoverable from committed files
- DES score/result and evidence reference, if not committed:
- Fidelity scores/result and evidence reference, if not committed:

## Inputs and decisions
- Non-Git source/input references and hashes, only when not recoverable from committed files:
- Confirmed routing and category exceptions:
- Each required approval: decision, scope, evidence reference, verified/unknown:
- Pending questions (never infer consent):

## Step ledger
| Canonical step | Status | Evidence / output / skip reason | Input hashes / invalidation |
|---|---|---|---|
| ... | pending / started / completed / skipped / blocked / failed | ... | ... |

## Verification evidence
- Unrelated work to preserve (intent/context that Git cannot explain):
- Non-Git transfer artifact reference, if required:

## External action ledger
| Action / target | started at | Verified outcome or outcome_unknown | Receipt / reconciliation needed |
|---|---|---|---|

## Validation and completion
- Important validation results that are not recorded in committed files:
- Phase F result and applicable content ID:
- Required delivery, deployment/live checks, and their actual results:
- Remaining work and exact next safe action:
- Completion report and cleanup status:
```
