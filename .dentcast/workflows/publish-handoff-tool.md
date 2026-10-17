# Live handoff helper

The temporary file is always `.dentcast/PUBLISH-HANDOFF.md`. The permanent contract is `publish-handoff.md`. Use Python 3.9+ and Git from the intended checkout (Python 3.11 is tested). The same CLI is available to Cursor, Claude Code and Codex when they have a local checkout and shell. GitHub-only agents can read the fixed Markdown file and public branch evidence; they cannot inspect an absent local checkout with this helper.

## Commands

Prepare a public-safe publication JSON outside the checkout, using the shape below. The input file is operator-supplied; the helper does not collect title/caption text, private transcripts, assets or source contents automatically.

```bash
python3 tools/dentcast_publish_handoff.py init --input /tmp/publish-input.json
python3 tools/dentcast_publish_handoff.py inspect
python3 tools/dentcast_publish_handoff.py inspect --check-remote
python3 tools/dentcast_publish_handoff.py record --input /tmp/publish-input.json --expected-sha256 <digest-from-last-read>
```

From another directory put `--repo /path/to/checkout` before the subcommand. On Windows use a suitable private input-file path instead of `/tmp`. `inspect --check-remote` reads `origin`'s branch matching the current local branch, independent of the configured upstream. Advancing to a subsequent step, verification entry and the Stop guard require this fresh observation automatically. It uses `git ls-remote`; it does not fetch or upload. A failed observation remains unknown and blocks progression. Cached upstream commits are labeled separately and are never proof of unpushed work. Missing remote commit objects remain unknown until the operator supplies history through their normal authorized Git workflow.

`init` refuses any existing state file. `record` requires the SHA-256 returned by the last successful read/write; a stale writer is rejected. Both use an advisory OS lock in Git metadata and atomic file replacement. Another cooperating writer in that checkout is rejected while the lock is held. This is not a distributed lock across clones or protection against a process bypassing the tool.

When actual files/index/HEAD have changed, inspect and reconcile the real changes before recording:

```bash
python3 tools/dentcast_publish_handoff.py record --input /tmp/publish-input.json --expected-sha256 <digest> --reconcile-note 'Reviewed the actual changes and rechecked affected evidence'
```

A reconciliation note records the operator's review; it does not prove that review occurred. Do not use it to hide missing work. Workflow fingerprint changes require invalidating all steps to pending. Replacing existing input references after resolved steps also requires invalidation. Changing the plan or a resolved step requires a note. The helper refuses rebinding an actual run to another content ID, category, repository identity or branch. The sole exception is a one-time `bind` of an unchanged `unassigned`/`pending` intake before authoring or side effects; see `publish-checkpoints.md`. Resolve branch migration deliberately outside this initial tool scope rather than silently changing the saved identity.

## Publication input

This is a **shape example**, not a complete execution plan. Replace its `steps` with the full output of `plan` (or `plan --paper-only`); CLI init/record reject incomplete plans. New init plans must be pending. Enumerate the actual applicable canonical substeps from the active modules; do not substitute two example steps for the real workflow. Intake can refine the plan with an explicit reconciliation note.

```json
{
  "content_id": "replace-with-actual-content-id",
  "category": "replace-with-actual-category",
  "target_paths": ["insight/replace-with-actual-page.html"],
  "status": "in_progress",
  "blocker": null,
  "context": {
    "inputs": [],
    "decisions": [],
    "approvals": [],
    "pending_questions": [],
    "validation": [],
    "delivery": [],
    "unrelated_changes": []
  },
  "steps": [
    {"id": "A", "module": "02-routing-intake.md", "status": "pending", "evidence": [], "reason": null},
    {"id": "C.2", "module": "03-litecast-and-page.md", "status": "pending", "evidence": [], "reason": null}
  ],
  "external_actions": []
}
```

- Paths are repository-relative, use `/`, and cannot escape the checkout or point at Git metadata. Include required ignored assets/inputs as target paths too if their availability must be checked; a present ignored file is local-only. Planned outputs may be absent until their step is executed.
- `status`: `in_progress`, `blocked`, `verifying`, `cleanup_pending`. A blocked run needs a blocker. No status means publication is complete.
- Step statuses: `pending`, `started`, `completed`, `skipped`, `blocked`, `failed`. Completed steps require evidence references; skipped/blocked/failed steps require reasons. Resolved steps form an ordered prefix, followed by at most one active unfinished step and remaining pending steps. Module order follows the twelve-module sequence. The tool checks this structure, not scientific quality, category exemptions or completeness of the caller's plan.
- Store exact public-safe input text or its retrievable reference and hash in `context.inputs`. Record routing and exceptions in `decisions`, actual command/exit/output/source revision in `validation`, actual delivery/live results in `delivery`, and unrelated work to preserve in `unrelated_changes`. These lists accept public-safe JSON records; receipts are not executed.
- Approval records have `scope`, `decision`, `status`, `evidence`. Status is `pending`, `confirmed`, `rejected`, or `not_required`. Pending may have a null decision and empty evidence; all other statuses require a decision and evidence references. Example: `{"scope":"opening paragraph","decision":null,"status":"pending","evidence":[]}`. Recorded approval scopes cannot disappear. Changing a recorded decision, resolving pending questions, or clearing a blocker requires a reconciliation note. The agent must discover every required approval and verify its real scope and evidence; an empty initial list does not prove none are required.
- External records have `id`, `target`, `status`, `evidence`. Status is `started`, `outcome_unknown`, `completed`, `failed`, or `not_performed`. Known outcomes require evidence references. Started/unknown actions block resume until reconciled, rather than retried. Entries cannot disappear or change target; terminal entries cannot be rewritten. Add a new ID for a new attempt and reference the original outcome.
- Do not put credentials, private source texts, private approval transcripts or restricted assets in public state. The helper persists verification fingerprints, not worktree diffs, file bodies or index inventories. User-supplied JSON is saved verbatim as structured data and must already be public-safe.

## Reading the result

The v2 state is Markdown with a short generated summary and one canonical JSON record. It contains semantic inputs, decisions, approvals, step evidence, external outcomes, blockers and next-step data. Minimal run identity (repository/branch), the original workflow source reference and expected file/workflow fingerprints remain as verification evidence. The source reference is **not the latest commit**. Generation, previous-checkpoint digest and reconciliation note protect checkpoint updates. Current HEAD, status, index, remote observations, upstream lists, ahead/behind and unpushed commits are not persisted in the handoff; obtain them from Git and `current_snapshot` in the inspector output. No self-hash is included; the CLI returns it.

For same-checkout comparison before delivery, the writer keeps only machine Git observations in private Git metadata (`dentcast-publish-observation.json`), bound to the checkpoint digest. It contains no publication decisions, step ledger or external action history and is not a second handoff. A fresh checkout does not need this cache: the loader finds the exact checkpoint bytes in local Git history and reconstructs index/commit facts there. Inspection never writes a cache or changes the handoff. If no matching committed checkpoint is available, reconstruction uses the workflow source reference conservatively and cannot turn dirty/untracked or missing work into delivered work. Lost local observations can require explicit reconciliation. Confirmed cleanup removes the local observation cache too.

Existing structured v1 handoffs remain readable without modification. An explicit successful `record` writes v2 while preserving semantic fields/receipts and normal reconciliation/invalidation rules. No automatic rewrite occurs on inspection. Manual/corrupt files still block. The fenced-record markers remain stable; `schema` selects the record format.

`inspect` validates format and hashes against the current checkout, reports the first unfinished recorded step, and returns the saved publication object under `recorded_state.publication` for preparing the next input. It does not execute that step. A generated summary edited separately, malformed JSON, stale files, changed workflow, conflicts, pending questions/approvals, or unreconciled external actions produce a blocked result. `started`/failed/blocked step state requires operator reconciliation. Copying this Markdown alone cannot recover missing files or local commits.

`git_snapshot_portable` describes **only the observed Git snapshot**:

- `no`: actual dirty work, ignored/untracked required files, unpushed commits, missing/different remote handoff, or known inconsistencies prevent claiming remote availability.
- `unknown`: the remote/history has not been verified. Offline operation is allowed in the same checkout with operator review; cached refs never become fresh remote proof.
- `yes`: the checkpoint bytes and clean local Git snapshot are available on the freshly observed remote branch, with no detected reconciliation blocker. This does not verify private inputs, external services, semantic receipts, missing approval requirements, or publication completion. The receiving checkout must still verify its own state.

A commit containing only the handoff does not invalidate itself. In the original checkout, changes relative to the private observation require review. In a fresh checkout, the exact delivered checkpoint commit supplies Git facts; expected file/workflow fingerprints and semantic gates are still checked. Do not recursively commit solely to record the checkpoint's own SHA. Commit/push each actual step with its handoff and confirm delivery before the next step. The helper never writes content files, commits, pushes, fetches, resets, restores content, or executes arbitrary receipt commands. `finish` reruns the fixed mechanical gate and removes the temporary state only under the guarded protocol. Its Git-metadata recovery receipt persists until the cleanup deletion is delivered and `confirm-cleanup` verifies it. Other checkpoint commands do not claim publication success.

Exit code 0 means the command wrote a checkpoint or found a structurally consistent checkpoint awaiting operator review. Exit code 2 means blocked/error. For init/record/inspect/step/bind/verify it never means a publication succeeded. Only `confirm-cleanup` can return verified completion of the delivered cleanup boundary. Read the result before acting; do not suppress errors with `|| true`.

## Boundaries and rollout

The checkpoint is a cooperative recovery aid, not signed proof of an action, a semantic validator or a crash-proof work backup. Abrupt interruption after a side effect but before its receipt remains an unknown outcome. Git hashes preserve identity, not the actual bytes of missing work. Transfer, attachment retrieval and Git delivery remain explicit authorized actions. The state is limited to 2 MiB and does not support dirty submodules or special files in its watched inventory.

The Linux implementation is tested using real local Git repositories and bare remotes. Windows lock support is implemented but has not been runtime-tested here. No cross-client runtime parity claim is made. Per-step wiring, active CI and guarded cleanup are supplied in stage 4; see `publish-checkpoints.md` for the mandatory protocol. Full receiving-agent recovery scenarios remain stage 5. Do not delete the state merely because all supplied ledger rows say completed.
