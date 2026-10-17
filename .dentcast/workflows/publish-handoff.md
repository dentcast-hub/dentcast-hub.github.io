# Live publication handoff contract

This is the active, agent-neutral contract for interrupted real publications.
The one temporary state file is **`.dentcast/PUBLISH-HANDOFF.md`**, relative to the repository root.
Its name never includes a content ID, date, agent, or run ID. This contract is permanent; the state file exists only while a publication is unfinished.
`modules/CROSS-AGENT-HANDOFF.md` concerns historical modularization development, not resuming a live publication.
Legacy files are backup snapshots only: do not load them as execution instructions or use them to override the active modular workflow.

## Discovery and resume

Triggers include «انتشار ناقص داشتم»، «انتشار ناتمام»، «ادامه انتشار»، "resume publishing", and any equivalent request to continue an interrupted publication.
Every agent (Cursor, Claude Code, Codex, Work, or another client following repository instructions) must first read the fixed state file, then this contract and the active workflow.
Also check for the state file before starting any new publication. Never overwrite an unfinished run with a new one; resolve the existing run with the user first.

If the file is missing, report that no handoff was found. Inspect available Git evidence and ask only for missing publication context; do not invent completed steps or claim successful resume.
With GitHub-only access, inspect the user's known working branch. A missing file on main does not establish that no work exists elsewhere.

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
- Before each external action, record intended action, target, and status `started`; afterward record its verified result or `outcome_unknown`.
- Update it before ending a turn, switching agents, committing, or handing off. After a commit/push, refresh the locally observed Git state. Do not recursively commit just to put a commit's own SHA inside itself.
- If interrupted mid-step, the next agent verifies the actual state rather than assuming the last checkpoint is current. A Markdown file cannot guarantee recovery from every crash.
- Keep the file on any failure, pending approval, failed verification, unknown external outcome, or incomplete delivery.
- Delete it only after all applicable steps and approvals, the complete Phase F, required publication delivery and its verification, and the final report are complete. Commit/push cleanup when Git delivery is part of the authorized publication. A cleanup push failure remains incomplete and must be reported; restore a local handoff describing it.
- Retain permanent contracts, tools, and historical development documentation. Only the temporary state file is removed.

## Local work versus portable handoff

A Markdown summary does not transfer uncommitted files or unpushed commits.
For the same checkout, record and verify modified, staged, and untracked files, their hashes, and local commit SHAs.
For another checkout/client, the handoff must state whether the actual work is available remotely. Transfer all required public-safe files and commits to the authorized working branch, or identify a retrievable patch/bundle and assets with hashes. Do not mark the run portable until the receiving agent can retrieve and verify both the state and the work.
If transfer is unavailable, explicitly block remote resume and identify the original checkout or missing artifact. Never reconstruct exact author text from memory.
Keep secrets, private inputs, private approval transcripts, and restricted scientific inputs out of public Git. Record safe references and availability instead; missing private inputs block dependent steps.
Never silently publish drafts or create a remote checkpoint without the user's existing authorization. The present refactor's commit/push authorization does not authorize future content publications.
Allow one active publication in this fixed file; concurrent publication attempts must stop rather than overwrite each other's state.

## Required state template

The supported writer is `tools/dentcast_publish_handoff.py`; read [the tool guide](publish-handoff-tool.md) for `init`, `record`, and `inspect`. It writes a generated Markdown summary plus a canonical JSON record in the same fixed file. That record carries the semantic fields below; unavailable machine values are null/unknown, never guessed. Do not edit the rendered summary separately. The following template documents the required recovery information for manual inspection; a pre-existing manual file must be explicitly reconciled before conversion, never silently overwritten by `init`.

```markdown
# Publication handoff
- Schema: publish-handoff-v1
- Updated at (UTC):
- Status: in_progress | blocked | verifying | cleanup_pending
- Repository:
- Working branch:
- Workflow source revision:
- Content ID / category / target paths:
- Last completed canonical step:
- Next canonical step:
- Current blocker:

## Inputs and decisions
- Exact public-safe title/caption, or retrievable reference and hash:
- Required assets/source inputs, locations, hashes, availability:
- Confirmed routing and category exceptions:
- Each required approval: decision, scope, evidence reference, verified/unknown:
- Pending questions (never infer consent):

## Step ledger
| Canonical step | Status | Evidence / output / skip reason | Input hashes / invalidation |
|---|---|---|---|
| ... | pending / started / completed / skipped / blocked / failed | ... | ... |

## Git and work preservation
- Observed local HEAD and observation time:
- Last observed remote HEAD, branch, observation time, fetch result:
- Upstream and ahead/behind, or unknown:
- Unpushed commits:
- Modified / staged / untracked paths and hashes:
- Unrelated changes to preserve:
- Transfer artifact / branch and verification:
- Portable to another checkout: yes / no / unknown; reason:
- Do not include this file's own hash; distinguish checkpoint observation from current HEAD.

## External action ledger
| Action / target | started at | Verified outcome or outcome_unknown | Receipt / reconciliation needed |
|---|---|---|---|

## Validation and completion
- Commands actually run, exit codes, output references and source revision:
- Phase F result and applicable content ID:
- Required delivery, deployment/live checks, and their actual results:
- Remaining work and exact next safe action:
- Completion report and cleanup status:
```

## Rollout

Stages 1–3 provide shared entrypoint discovery, active modular/global rules, and the live checkpoint writer/inspector. Use the helper to record each step and inspect an interrupted run. It verifies Git state and ledger structure, not the actual truth of approvals, semantic decisions or scientific results. Stage 4 adds the full step ledger, explicit before/after checkpoints, native advisory/Stop adapters, pre-commit and CI guards, real mechanical verification and recoverable cleanup. Read `publish-checkpoints.md` before execution. Complete cross-checkout/client recovery scenarios remain stage 5; native hook configuration alone does not certify client runtime behavior. Existing staging helpers are separate from this live handoff and do not replace it.
