# Live publication handoff contract

This is the active, agent-neutral contract for interrupted real publications.
The one temporary state file is **`.dentcast/PUBLISH-HANDOFF.md`**, relative to the repository root.
Its name never includes a content ID, date, agent, or run ID. This contract is permanent; the state file exists only while a publication is unfinished.
`modules/CROSS-AGENT-HANDOFF.md` concerns historical modularization development, not resuming a live publication.
Legacy files are backup snapshots only: do not load them as execution instructions or use them to override the active modular workflow.

## Discovery and resume

Recovery is triggered only when the user explicitly says that a publication is incomplete/interrupted (for example, «انتشار ناقص داشتم»). A request to resume counts only if it identifies the publication as incomplete/interrupted. A generic «ادامه بده» or «ادامه انتشار» without identifying an incomplete publication does not trigger recovery.
At that recovery point, read the fixed state file once and run the inspector once. Then keep the semantic state in the current session and use the latest digest returned by the helper; do not reread or re-inspect the handoff before each step. If the user later explicitly reports another interruption, treat it as a new recovery and read once then.
Before a new publication, check only whether the fixed state file exists; do not read its contents. If it exists, make no publication changes and ask whether the user means to resume the incomplete publication. Read it only after that explicit confirmation. Never overwrite an unfinished run.

If the file is missing, report that no handoff was found. Inspect available Git evidence and ask only for missing publication context; do not invent completed steps or claim successful resume.
For remote recovery or a missing local file, follow [GitHub handoff discovery](publish-discovery.md). Run `python3 tools/dentcast_publish_handoff.py discover` (or `discover --repository owner/repo` without a checkout), or perform the same complete, immutable-head reads through connected GitHub tools. A missing file on main does not establish that no work exists elsewhere. Select only the unique verified active handoff after a complete stable scan; never guess from branch recency. Multiple, malformed or identity-mismatched handoffs and incomplete scans block selection. Preserve local-only work and verify the selected latest head/checkout before continuing.

Before resuming:
1. Verify repository, branch, content identity, recorded source revision, and local versus remote state.
2. Inspect `git status --short --untracked-files=all`, `git diff`, `git diff --cached`, and `git log`. Discover the upstream; after a successful authorized fetch, compare it with HEAD. Record unknown remote state as unknown, never as synchronized.
3. Compare actual files and hashes, commits, test output, and external receipts with the handoff. A checked box or an agent's claim is not evidence.
4. Preserve unrelated changes. Do not reset, clean, force-push, switch away from dirty work, or blindly pull/merge to make the handoff appear consistent.
5. Resume the first unfinished canonical step whose prerequisites are verified. Recheck stale evidence when its inputs changed. Record any invalidated downstream steps.
6. For an external action marked started without a verified outcome, reconcile the real outcome before retrying, to avoid duplicate uploads, notices, or other side effects.

## State lifecycle

- Create the state file before the first publication mutation or external action.
- Update it after **every canonical step**, including completed, skipped, blocked, and failed steps; write the reason and evidence.
- After every step, commit its scoped public-safe work together with this handoff and push to the authorized working branch. Confirm delivery before starting the next step; failure or unknown remote state blocks progression. Follow the enforced boundary in `publish-checkpoints.md`; do not defer delivery until turn end.
- Before each external action, record intended action, target, and status `started`; afterward record its verified result or `outcome_unknown`.
- Update semantic progress before ending a turn, switching agents, committing, or handing off. After commit/push, inspect Git directly; do not duplicate current HEAD, index, status, ahead/behind or remote observations in the handoff. Do not recursively commit just to put a commit's own SHA inside itself.
- If interrupted mid-step, the next agent verifies the actual state rather than assuming the last checkpoint is current. A Markdown file cannot guarantee recovery from every crash.
- Keep the file on any failure, pending approval, failed verification, unknown external outcome, or incomplete delivery.
- Delete it only after all applicable steps and approvals, the complete Phase F, required publication delivery and its verification, and the final report are complete. Commit/push cleanup when Git delivery is part of the authorized publication. A cleanup push failure remains incomplete and must be reported; restore a local handoff describing it.
- Retain permanent contracts, tools, and historical development documentation. Only the temporary state file is removed.

## Local work versus portable handoff

A Markdown summary does not transfer uncommitted files or unpushed commits.
For the same checkout, inspect modified, staged and untracked work directly in Git. The handoff contains no Git status, commit, branch, file inventory or fingerprint data; the helper derives its verification baseline from Git history or private local Git metadata.
For another checkout/client, determine remote availability using Git and `inspect --check-remote`, not a saved portability Boolean. Transfer all required public-safe files and commits to the authorized working branch, or identify a retrievable patch/bundle and assets with hashes. Do not claim portability until the receiving agent can retrieve and verify both the state and the work.
If transfer is unavailable, explicitly block remote resume and identify the original checkout or missing artifact. Never reconstruct exact author text from memory.
Keep secrets, private inputs, private approval transcripts, and restricted scientific inputs out of public Git. Record safe references and availability instead; missing private inputs block dependent steps.
Never silently publish drafts or create a remote checkpoint without the user's existing authorization. The present refactor's commit/push authorization does not authorize future content publications.
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

## Rollout

Stages 1–3 provide shared entrypoint discovery, active modular/global rules, and the live checkpoint writer/inspector. Use the helper to record each step and inspect an interrupted run. It verifies Git state and ledger structure, not the actual truth of approvals, semantic decisions or scientific results. Stage 4 adds the full step ledger, explicit before/after checkpoints, native advisory/Stop adapters, pre-commit and CI guards, real mechanical verification and recoverable cleanup. Read `publish-checkpoints.md` before execution. Stage 5 validates fresh-process/checkout recovery; read [acceptance evidence, receiving-agent procedure and client limits](PUBLISHING-RECOVERY-ACCEPTANCE.md). Native hook configuration alone does not certify client runtime behavior. Existing staging helpers are separate from this live handoff and do not replace it.
