# Live handoff helper

The temporary file is always `.dentcast/PUBLISH-HANDOFF.md`. The permanent contract is `publish-handoff.md`. Use Python 3.9+ and Git from the intended checkout (Python 3.11 is tested). The same CLI is available to Cursor, Claude Code and Codex when they have a local checkout and shell. GitHub-only agents can read the fixed Markdown file and public branch evidence; they cannot inspect an absent local checkout with this helper.

## Commands

Prepare a public-safe publication JSON outside the checkout, using the shape below. The input file is operator-supplied; the helper does not collect title/caption text, private transcripts, assets or source contents automatically.

```bash
python3 tools/dentcast_publish_handoff.py init --input /tmp/publish-input.json
python3 tools/dentcast_publish_handoff.py inspect
python3 tools/dentcast_publish_handoff.py inspect --check-remote
python3 tools/dentcast_publish_handoff.py discover --recover-incomplete
python3 tools/dentcast_publish_handoff.py discover --recover-incomplete --repository dentcast-hub/dentcast-hub.github.io
python3 tools/dentcast_publish_handoff.py record --input /tmp/publish-input.json --expected-sha256 <digest-from-last-read>
```

From another directory put `--repo /path/to/checkout` before the subcommand. On Windows use a suitable private input-file path instead of `/tmp`. `inspect --check-remote` reads `origin`'s branch matching the current local branch, independent of the configured upstream. The three fixed page delivery boundaries require a fresh remote observation; intermediate steps, stops and external-action receipts stay local. It uses `git ls-remote`; it does not fetch or upload. A failed observation remains unknown and blocks crossing those boundaries. Cached upstream commits are labeled separately and are never proof of delivered work. Missing remote commit objects remain unknown until the operator supplies history through their normal authorized Git workflow.

`init` refuses any existing state file. `record` requires the SHA-256 returned by the last successful read/write; a stale writer is rejected. Both use an advisory OS lock in Git metadata and atomic file replacement. Another cooperating writer in that checkout is rejected while the lock is held. This is not a distributed lock across clones or protection against a process bypassing the tool.

`discover` is a read-only GitHub branch scan, implemented by `dentcast_publish_discovery.py`. Without `--repository` it infers a GitHub repository from the checkout's origin; with an explicit owner/repo it needs no Git checkout. It paginates every branch, reads the fixed handoff at immutable head SHAs, validates identity/plan, and rechecks all heads before selecting a unique candidate. Check `discovery_complete`, `selected`, and `errors`. Multiple/invalid candidates, changed heads, API/auth/rate failures or a branch limit block selection. Use `--token-env <configured-variable>` when authenticated REST is required, or the same reads through connected GitHub tools. Read `publish-discovery.md` for retrieval and GitHub-only agents; a found handoff does not certify that its content is ready to publish.

When actual files/index/HEAD have changed, inspect and reconcile the real changes before recording:

```bash
python3 tools/dentcast_publish_handoff.py record --input /tmp/publish-input.json --expected-sha256 <digest> --reconcile-note 'Reviewed the actual changes and rechecked affected evidence'
```

A reconciliation note records the operator's review; it does not prove that review occurred. Do not use it to hide missing work. Workflow fingerprint changes require invalidating all steps to pending. Replacing existing input references after resolved steps also requires invalidation. Changing the plan or a resolved step requires a note. The helper refuses rebinding an actual run to another content ID, category, repository identity or branch. The sole exception is a one-time `bind` of an unchanged `unassigned`/`pending` intake before authoring (settled, evidenced founder-requested external actions are kept); see `publish-checkpoints.md`. Resolve branch migration deliberately outside this initial tool scope rather than silently changing the saved identity.

For changed bound local inputs, approved page bytes, or workflow rules use the
explicit `invalidate` command described in `publish-checkpoints.md`; a review note
alone cannot retain stale dependent evidence. Active WALs have their own durable
`fastlocal.py invalidate` followed by `flush`, without deleting their history.

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
- `category` is the lowercase canonical value the tools compare (`litecast`, `glossary`, `sharehub`, `chairside`, `promptologist`, …; `paper-only` for the no-page route, `pending` only for an unassigned intake), never a display spelling such as `LiteCast`.
- `status`: `in_progress`, `blocked`, `verifying`, `cleanup_pending`. A blocked run needs a blocker. No status means publication is complete.
- Step statuses: `pending`, `started`, `completed`, `skipped`, `blocked`, `failed`. Completed steps require evidence references; skipped/blocked/failed steps require reasons. Resolved steps form an ordered prefix, followed by at most one active unfinished step and remaining pending steps. Module order follows the twelve-module sequence. The tool checks this structure, not scientific quality, category exemptions or completeness of the caller's plan.
- Store only inputs or results that cannot be recovered from committed files in `context.inputs`. Prefer a retrievable reference and hash over copying content. Record important routing decisions, DES/Fidelity results and scores, required validation results, delivery outcomes, and external-action receipts when they are not already represented in committed files. Do not copy Git status, file inventories, commit IDs, branch names, diffs, or other facts Git can reconstruct into the handoff. These lists accept public-safe JSON records; receipts are not executed.
- Approval records have `scope`, `decision`, `status`, `evidence`. Status is `pending`, `confirmed`, `rejected`, or `not_required`. Pending may have a null decision and empty evidence; all other statuses require a decision and evidence references. Example: `{"scope":"opening paragraph","decision":null,"status":"pending","evidence":[]}`. Recorded approval scopes cannot disappear. Changing a recorded decision, resolving pending questions, or clearing a blocker requires a reconciliation note. The agent must discover every required approval and verify its real scope and evidence; an empty initial list does not prove none are required.
- External records have `id`, `target`, `status`, `evidence`. Status is `started`, `outcome_unknown`, `completed`, `failed`, or `not_performed`. Known outcomes require evidence references. Started/unknown actions block resume until reconciled, rather than retried. Entries cannot disappear or change target; terminal entries cannot be rewritten. Add a new ID for a new attempt and reference the original outcome.
- Do not put credentials, private source texts, private approval transcripts or restricted assets in public state. The handoff does not persist Git fingerprints, worktree diffs, file bodies or index inventories; temporary Git observations stay in private `.git` metadata. User-supplied JSON is saved verbatim as structured data and must already be public-safe.

## Reading the result

The v3 state is Markdown with a short generated summary and one canonical JSON record. It contains only semantic inputs, important decisions, approvals, DES/Fidelity scores and results, step outcomes, blockers, and external-action receipts that cannot be recovered from committed files. It does not persist repository/branch names, workflow revisions, file fingerprints or inventories, Git status, commits, index state, remote observations, upstream lists, ahead/behind counts, or unpushed commits. The helper reconstructs its verification baseline from Git history or keeps an uncommitted observation in private Git metadata until delivery. Generation, previous-checkpoint digest and reconciliation note protect updates. `inspect` returns current Git facts under `current_snapshot`; no self-hash is included, and the CLI returns the handoff digest.

For same-checkout comparison before delivery, the writer keeps only machine Git observations in private Git metadata (`dentcast-publish-observation.json`), bound to the checkpoint digest. It contains no publication decisions, step ledger or external-action history and is not a second handoff. Once the exact checkpoint is committed, Git supersedes that pre-commit observation in the original checkout too. A fresh checkout does not need the cache: the loader finds the commit containing the exact checkpoint bytes and rebuilds the baseline from that commit's tree and changed paths. Inspection never writes a cache or changes the handoff. If neither a matching committed checkpoint nor its private observation is available, recovery blocks rather than assuming a baseline. Lost local observations can require explicit reconciliation. Confirmed cleanup removes the local observation cache too.

Existing structured v1 and v2 handoffs remain readable without modification. An explicit successful write upgrades them to v3 while preserving semantic fields/receipts and normal reconciliation/invalidation rules. No automatic rewrite occurs on inspection. Manual/corrupt files still block. The fenced-record markers remain stable; `schema` selects the record format.

`inspect` validates format and hashes against the current checkout, reports the first unfinished recorded step, and returns the saved publication object under `recorded_state.publication` for preparing the next input. It does not execute that step. A generated summary edited separately, malformed JSON, stale files, changed workflow, conflicts, pending questions/approvals, or unreconciled external actions produce a blocked result. `started`/failed/blocked step state requires operator reconciliation. Copying this Markdown alone cannot recover missing files or local commits.

`git_snapshot_portable` describes **only the observed Git snapshot**:

- `no`: actual dirty work, ignored/untracked required files, unpushed commits, missing/different remote handoff, or known inconsistencies prevent claiming remote availability.
- `unknown`: the remote/history has not been verified. Offline operation is allowed in the same checkout with operator review; cached refs never become fresh remote proof.
- `yes`: the checkpoint bytes and clean local Git snapshot are available on the freshly observed remote branch, with no detected reconciliation blocker. This does not verify private inputs, external services, semantic receipts, missing approval requirements, or publication completion. The receiving checkout must still verify its own state.

A commit containing only the handoff does not invalidate itself. Uncommitted checkpoints use the private observation; committed checkpoints use their actual Git commit in either the original or receiving checkout. Expected file/workflow fingerprints, later work changes and semantic gates are still checked. Do not recursively commit solely to record the checkpoint's own SHA. For new page runs, deliver exactly after `C.4.9`, after `C.6` for v2 editorial-locked runs (`C.4.13` for v1-only handoffs), and after all remaining work, Phase F and G. Cuts 1/2 include the latest unfinished handoff. Cut 3 includes final work, a completed-only `.dentcast/publication-reports/<content-id>.completion.json` receipt and handoff deletion in one commit/push; never deliver a completed final handoff first. `init` installs the non-removable `fixed_three_deliveries_v1` decision. Intermediate progress, stops and external-action receipts remain local; `advance` returns `delivery_required` at undelivered cuts. See `publish-checkpoints.md` for the complete contract, legacy/paper-only compatibility (paper-only also stages its commit with `stage-delivery`) and recovery limits. The helper writes the checkpoint and completion receipt, never content, commits, pushes, fetches, resets or arbitrary receipt commands. `finish` reruns the fixed mechanical gate and removes the temporary state only under the guarded protocol. Its Git-metadata recovery receipt persists until the cleanup deletion is delivered and `confirm-cleanup` verifies it. Other checkpoint commands do not claim publication success.

Exit code 0 means the command wrote a checkpoint or found a structurally consistent checkpoint awaiting operator review. Exit code 2 means blocked/error. For init/record/inspect/step/bind/verify it never means a publication succeeded. Only `confirm-cleanup` can return verified completion of the delivered cleanup boundary. Read the result before acting; do not suppress errors with `|| true`.

## Boundaries and rollout

The checkpoint is a cooperative recovery aid, not signed proof of an action, a semantic validator or a crash-proof work backup. Abrupt interruption after a side effect but before its receipt remains an unknown outcome. Git hashes preserve identity, not the actual bytes of missing work. Transfer, attachment retrieval and Git delivery remain explicit authorized actions. The state is limited to 2 MiB and does not support dirty submodules or special files in its watched inventory.

The Linux implementation is tested using real local Git repositories and bare remotes. Windows lock support is implemented but has not been runtime-tested here. No cross-client runtime parity claim is made. See `publish-checkpoints.md` for the mandatory protocol and `PUBLISHING-FINAL-REPORT.md` for integrated receiving-agent acceptance and actual client/live-publication limits. Do not delete the state merely because all supplied ledger rows say completed.

## Low-overhead progress recording

Prefer `advance --id <already-started-step> --evidence <verified-result>
--start-next --expected-sha256 <digest>` when the next module is loaded and its
action is ready. Add explicit consecutive `--skip ID=REASON` entries for canonical
exceptions. Each transition is persisted separately; digests are passed internally.
Omit `--start-next` at a pause or delivery boundary. `advance` never runs actions
or replaces Phase F `verify`; see `publish-checkpoints.md` for recovery on partial
progress. No approval or completed result is inferred.
