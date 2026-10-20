# Live per-step checkpoint and completion protocol

This protocol wraps the existing twelve active source modules. It does not rewrite authoring, category exceptions, human approvals, builders or the scientific DES/Fidelity engine. Every agent follows it; native hooks are supplementary adapters, not proof that a client actually loaded instructions.

## Continuous execution, source loading and delivery preflight

The permanent guide (this file), temporary current state (`.dentcast/PUBLISH-HANDOFF.md`),
and explicit recovery (`publish-handoff.md` / `publish-discovery.md`) have different
roles. Ordinary publication still creates and updates the current state. It does
not enter recovery because a gate reports a missing receipt or stale checkpoint.
«کجایی؟», «چی شد؟», «ادامه بده» and «ادامه انتشار» during an active run request
status/continuation: reply directly, then continue that same run. No reinitialization
or branch discovery. `discover --recover-incomplete` is reserved for an explicit
user request identifying an incomplete/interrupted publication; the option records
that trigger, never invents it. Keep explicit recovery available and verify its
selected immutable head before continuing.

Choose the active route and required sources at the start. Read each necessary
source completely in bounded, numbered ranges small enough to avoid truncation.
Keep `(path, source hash/revision, complete ranges read)` in this session; no new
state file. A cross-reference to an already completely read unchanged source
requires no reread. Reload only the changed source, an authorized recovery source,
or a source actually needed to diagnose a new error; state the reason. A changed
source invalidates its loaded entry and affected evidence. Summaries and memory
never replace the first complete reading of a required source.

Before expensive authoring/builds, determine the usable read, write and delivery
paths. Connector GitHub access and terminal Git credentials are separate. Read-only
permission checks do not prove push; a bounded `git push --dry-run` to the intended
feature ref may test transport without writing a commit/ref. Do not probe by
committing on main. If transport fails, select an available connector/pack/blob
route before heavy work. Report the real limitation once and preserve local work.

Before push, long transfer, branch update and merge, freshly read the exact PR,
its state/merged flag, head branch/repository/SHA and destination branch/SHA.
`check-pr --repository owner/repo --number N --expected-head SHA --expected-base SHA
--expected-branch BRANCH [--token-env NAME]` performs this read-only check through
REST. Equivalent fresh connected GitHub reads are valid when REST credentials are
unavailable; check both exact branch heads, never scan branches for this purpose.
A closed/merged PR or moved ref requires revising the delivery plan, preserving
local work and comparing it to current main. Post-merge edits are not in the merge
until byte/Git evidence proves that. Do not deliver to the old branch automatically.
Use expected SHA / non-force fast-forward; recheck after long blob uploads immediately
before updating a ref. A check cannot remove the race on a service without atomic
leases; report that limitation and never force overwrite.

After scoped work is committed, `delivery-plan --base-ref <verified-base>
--max-blob-bytes <actual-selected-tool-limit>` returns changed paths, blob IDs,
sizes, total bytes and the expected final tree, without file bodies. It does not
prove access, push, or approve work. Transfer only changed objects missing remotely;
reuse successful blob uploads by Git object ID while bytes stay identical. Build
one tree/commit from the verified base rather than tiny per-file commits. Verify
every returned blob ID and the final tree against local Git before a ref update.
Keep payloads, Base64, large JSON and tool registries out of conversation output.
If only chunked transport exists, report bytes/call limits and the bounded number
of calls; stop on an unchanged failure, preserving successes, rather than loop.

If the same read/command with the same input and error is requested again without
any source, digest, file or remote-state change, identify an execution loop: report
the exact unchanged blocker and take a different diagnostic/correction step. Do
not reread the guide or retry invalid arguments unchanged. Use `--help` once to
resolve actual CLI schema uncertainty. `advance` is already available: prefer it
over separate transition calls; it records verified real work and never substitutes
for semantic judgment, scientific independence, human approvals or Phase F.

Continue automatically until the authorized scope is complete or a real decision
or blocker requires input. Existing explicit “merge after completion” permission
persists once all gates pass; status requests do not revoke it. Without explicit
merge authorization stop before merge. Page readiness or green CI is not full
publication completion. At meaningful milestones and during long work, give a
short report of actual result, current action and remaining work. Distinguish
prepared, verified, committed, pushed, merged and live. Report no invented ETA or
percent. A real blocker must name its cause, effect and required next action;
record/preserve the current checkpoint and do independent authorized work.

## Scope, baseline and final bytes

Declare each related source/page/data path in `target_paths`, including inputs
needed to detect stale evidence. The writer also enrolls only the concrete known
canonical builder outputs it actually observes changing (pillar HTML/sidecars,
homepage/player, generated indexes, sitemap and worker stamp). A new unrelated dirty
path is not auto-enrolled: preserve it and review its relation before explicitly
adding a target. Site-wide injectors may touch other articles; these are not
blanket-authorized outputs and need separate review/scope. Never stage all dirty
work blindly. Do not remove watched paths to conceal drift.

Current comparisons retain the complete committed baseline inventory even when
those files become clean. The commit tree, declared targets and actual generated
outputs reconstruct the baseline in API-delivered or fresh checkouts; unchanged
committed files disappearing from `git status` are not content changes. Changes
to bytes, modes, index, inputs, rules or later commits still block/reconcile.
`inspect` names changed file/rule paths and a limited next action; a stale/missing
receipt is a current-run repair, not permission to discover branches. Never invent
past semantic outcomes to satisfy a missing completion receipt.

Preserve existing newline style and formatting from the first write. Canonical
writers use `dentcast_text_io.write_text` / `text_io.mjs`; mixed endings fail with
a request for a scoped byte edit, not global normalization. Manual patches must
also preserve existing bytes; inspect normal diff and an EOL-insensitive diff to
separate format churn. Finish all content, taxonomy, injectors, English and builder
writes, then stamp last and run final verification on those final bytes. A later
effective edit invalidates affected checks: rebuild dependencies, restamp and verify.
Never certify the earlier tree as the final delivery.

## Start and identify the run

1. Enter recovery only after the user explicitly says the publication is incomplete/interrupted. A request to resume counts only if it identifies the publication as incomplete/interrupted. Read `.dentcast/PUBLISH-HANDOFF.md` once, then run `python3 tools/dentcast_publish_handoff.py inspect` once in the actual checkout. If missing, do not invent progress. The inspector also detects a private pending-cleanup receipt in Git metadata and instructs `confirm-cleanup` or `restore-cleanup`.
   For recovery from GitHub or a missing local handoff, follow `publish-discovery.md`: use `discover --recover-incomplete`/`discover --recover-incomplete --repository owner/repo` (or equivalent connected GitHub reads), require a complete stable scan and unique candidate, retrieve the selected named branch without disturbing local work, compare its HEAD with the returned `head_sha`, then inspect it. Do not choose a newest branch or continue from a partial/ambiguous result. Keep the recovered semantic state in the current session and do not reread/re-inspect the handoff during that run; use the latest helper digest. A generic `ادامه بده` does not trigger recovery.
2. For a new run, check only whether the fixed handoff file exists; do not read its contents. If it exists, make no publication changes and ask whether the user means to resume an incomplete publication. Read it only after that explicit confirmation. Otherwise prepare the public-safe input described in `publish-handoff-tool.md`. Obtain the **full canonical ledger** using `python3 tools/dentcast_publish_handoff.py plan` and place its `steps` into the input JSON. `init`/`record` reject incomplete ledgers. For a known paper-only route use `plan --paper-only`, category `paper-only`, and watch the cabinet catalog.
3. Before intake identity is known, use content ID `unassigned`, category `pending`, the full ordinary ledger and an initial watched path such as `dentcast-brain.json`. This is explicitly an unassigned run, not a guessed publication ID. Create it with `init` before the first canonical step. Resolve identity **once** with `bind --expected-sha256 <digest> --content-id <actual-id> --category <actual-category> --target-path <path> --evidence <intake-reference>` (repeat `--target-path` for required work). Binding is permitted only with unchanged work and no authoring/side effects started. Paper-only binding occurs at Phase 0; ordinary binding occurs during intake before authoring. Real identities cannot subsequently be silently rebound.

## Before and after EVERY canonical step

Read the full relevant module once per unchanged source revision. A repeated module reference does not require a second read. During the active run, use the publication state already held in the current session and the digest returned by the latest helper read/write; do not reread or re-inspect the fixed handoff before each step:

```bash
python3 tools/dentcast_publish_handoff.py step --id <canonical-id> --status started --expected-sha256 <digest> --reconcile-note 'Verified previous step delivery and reviewed Git changes'
# Execute only the actual authorized canonical action and verify its result.
python3 tools/dentcast_publish_handoff.py step --id <canonical-id> --status completed --evidence <actual-receipt-reference> --expected-sha256 <new-digest> --reconcile-note 'Reviewed the actual step changes and evidence'
```

Use `skipped --reason <canonical-exception>` for an inapplicable step, or `blocked`/`failed` with a real reason. Record before pausing. A completed checkpoint must first have been started; neither the hook nor the CLI performs semantic work or creates a scientific result. Add actual decisions, approvals, input references, validation and delivery receipts via `record` using the full current `recorded_state.publication` object, never by replacing it with a partial example. Known approval scopes and external action history cannot disappear.

### Prefer one command per verified action

Use `advance` to reduce manual calls and digest copying. After completing and
reviewing an already-started step, record its real evidence and start the next
ready step in one command:

```bash
python3 tools/dentcast_publish_handoff.py advance --id <current-id> --evidence <actual-receipt-reference> --start-next --expected-sha256 <digest> --reconcile-note '<review of actual changes>'
```

Read the full applicable module before requesting `--start-next`; omit that
flag at an unread-module boundary, an approval wait, an external-action delivery
boundary, or the end of the turn. The tool records progress only: it never
executes the next action, grants approval or evaluates scientific work.

For consecutive genuinely inapplicable pending steps, supply repeated
`--skip '<id>=<canonical exception and reason>'` arguments in canonical order.
These may follow `--id`, or be used without it. The agent must establish each
exception from its applicable module; the tool does not guess category skips.
Each skip still gets its own durable checkpoint. Use `--start-next` alone to
start the first ready pending step, if needed. Failure/blocking results still
use `step --status failed/blocked`; Phase F still uses the real `verify` command.

The helper preflights the requested sequence, then saves each transition
separately and passes the new digest internally. Only one CLI response is needed.
On interruption, earlier writes survive; on an observed mid-sequence failure,
`transitions_written` and the last successful digest identify saved progress.
Do not replay a completed action or assume the whole request was atomic.
Normal stale-write, identity, ordering, approval and external-outcome guards
remain in force. This changes command overhead, not the 52-step canonical ledger.

### Checkpoint every step; deliver coherent batches

After **each** canonical step or dynamic substep (including a skip, failure or
block), save its real result in the local handoff before continuing. Keep one
step transition per handoff write (the `advance` helper automates these separate writes); do not combine finishing one step with
starting the next or resolve multiple new steps in one write. This preserves
precise recovery state without forcing a tiny Git commit after every action.

Group scoped public-safe work and its latest handoff into a commit/push when a
coherent unit is complete: for example, after a meaningful phase or related
set of steps, before ending a turn or switching agents/checkouts, and before
any irreversible external action. For an external action, first record
`started`, then deliver that checkpoint before performing the action; record
the observed outcome immediately afterward. Unknown outcomes must be
reconciled before retrying. Private inputs stay outside public Git; record safe
references. Use `inspect --check-remote` at delivery boundaries.

The Stop guard still requires the latest handoff and watched work to be
delivered before a turn ends. Phase F and paper-only verification can run from
a locally consistent checkpoint; save their results and include them in the
next delivery batch. `finish` still requires a freshly synchronized remote,
exact delivered handoff and completed gates before cleanup. If push/network
access fails at a delivery boundary, preserve local work, record the blocker
and actual error, and do not end the turn or cross an external side-effect
boundary until delivery is resolved. The helper observes Git; it does not
automatically commit, push, grant publication authorization, or transfer
files.

A work commit changes HEAD/index relative to its pre-commit observation. Once
the exact handoff is committed, the helper rebuilds the baseline from that
commit in the original checkout or a fresh clone. Actual later changes still
require review and a specific reconciliation note. A note cannot bypass
delivery. Do not create a checkpoint-only commit loop to embed a commit's own
SHA.

The v3 handoff stores semantic state only: important decisions and approvals,
DES/Fidelity scores and results, external outcomes, and other information
that committed files do not contain. It does not repeat branch names, file
status, commits, hashes, or Git fingerprints. Current Git facts are computed
at inspection/delivery. A fresh checkout reconstructs the baseline from the
commit that wrote the exact checkpoint bytes; later work commits still
require review. The private same-checkout observation contains no semantic
publication ledger.

The Stop guard also requires the latest active handoff/work to be delivered
before normal turn completion. This applies when the native client actually
executes that hook; explicit CLI discipline remains mandatory elsewhere. A
coherent batch may contain multiple canonical steps. If delivery is
unavailable, preserve the checkpoint and report the blocked state; do not
repeatedly perform publication actions or claim delivery succeeded.

The lifecycle registry in `tools/dentcast_publish_lifecycle.py` maps every canonical phase/question/top-level action and the paper-ingestion parts to a module. Its order preserves two source dependencies: **C.8 builders before C.7 stamping**, and **LiteCast C.0.5/C.0.6 after C.2 page construction**. Canonical skip rules still come from the full source, not a guessed category map. All inventory checkpoints remain present on page publications, with explicit skips where applicable. `rules`, Phase `0`, Phase `F` and final report `G` cannot be skipped.

For repeating scientific checks or other dynamic substeps, add explicit ledger IDs like `C.4.13/<unit-and-checker-id>` before their aggregate `C.4.13` checkpoint, with the same module. Record each outcome and preserve verified result references. This does not change scientific voting, independence or adjudication. The registry checks ordering and coverage, not the truth or completeness of semantic judgments. Paper-only runs follow only `rules`, `0`, paper Parts 1/2 and reporting, without inventing a page, English mirror, brain entry, version bump or page Phase F.

Before an external action, record a unique action ID with `started`; afterward record the observed outcome/evidence. Unknown outcomes block a retry until reconciled. The registry aggregate does not excuse recording per-action and per-unit progress.

The step command and transition writer reject starting/restarting a step while
an external outcome is started/unknown; raw `record` cannot bypass that guard.
Keep the blocker/receipt, verify the real outcome, then reconcile it explicitly.

## Verification and completion

At page Phase F run the helper's **real verification** command, which executes the repository's fixed `tools/verify_publish.py` on the single actual content ID:

```bash
python3 tools/dentcast_publish_handoff.py verify --expected-sha256 <digest> --expect-title '<exact-user-title>' --expect-caption '<exact-user-caption>'
```

Omit an expectation only if the user genuinely provided neither corresponding string; never derive an alternative from the rendered page. Do not use `--all` or `--last`. The helper captures exit code, output digest, expected strings and summary, marks F completed/failed, and preserves state on failure. It does not suppress warnings; review the actual verifier output and source rules. The helper's receipt is metadata, not a substitute for the scientific and human gates. Re-run verification after any affected change.

For paper-only, after Parts 1/2 and before reporting, run `verify --expected-sha256 <digest> --catalog-id <actual-P-id>`. It rechecks the actual catalog entry, Drive-link identities and a recorded completed Drive-action receipt. The agent must still verify the real upload, correct folder, enriched schema and metadata with the canonical tools; the local gate cannot contact Drive or replace those approvals. This is the documented no-page exception, not a synthetic page Phase F.

Finish the report at G and record its real reference. Record `context.delivery` as objects with nonempty `scope` and nonempty `evidence` reference lists for actual required deployment/live/delivery checks. A bare Boolean is rejected; the agent must verify the evidence. Persist the public-safe checkpoint and work on the authorized branch before cleanup:

1. Stage only the scoped public work. Refresh the handoff **after staging**, with reviewed state/evidence, then stage the latest handoff. The pre-commit guard checks the staged state matches the current file and the captured work/index.
2. Commit and push through the normal authorized Git workflow. Verify current remote state with `inspect --check-remote`. An exact committed checkpoint is reconstructed from Git; refresh with `record` and a reconciliation note only for actual additional changes/evidence, not merely to embed the commit's SHA.
3. Run `finish --expected-sha256 <digest>`. It requires the full resolved ledger, no unresolved recorded gates, evidence references, clean watched work, the exact delivered handoff and a freshly synchronized remote. It reruns the actual applicable mechanical gate and checks work did not change during it. Only then does it remove the fixed temporary file locally.
4. `finish` returns **cleanup_pending_delivery**, not publication success. A durable private recovery receipt is kept in Git metadata; it is not a second publication handoff in the repository. Commit/push **only the handoff deletion**, then run `confirm-cleanup`. Success requires the deletion to be observed on the synchronized remote branch and unchanged publication work. The private recovery receipt is then removed.
5. If cleanup/push fails or is interrupted, run `restore-cleanup`. It restores the same fixed `.dentcast/PUBLISH-HANDOFF.md` as `cleanup_pending`, preserving the old work fingerprint so drift is still reported. It never restores content or repeats an external action. Keep it until reconciliation and successful delivery.

The helper never commits, pushes, deploys or runs an external receipt's commands. `finish` is authorized by the publication's completion contract, not by a Boolean claiming founder consent. Its mechanical checks cannot independently prove private approvals, semantic quality, external service outcomes or that omitted approval requirements do not exist; the executing agent must verify those original gates. A stale/missing/corrupt state is not success.

## Missing DES/Fidelity results are not warnings

Phase F fails on absent DES unless the category is LiteCast/Challenge or a
content-specific exemption is recorded in `.dentcast/des-exemptions.json`.
This registry is publication metadata, not part of the closed scoring spec;
never add exemption fields to `plus/des-scores.json` or change scientific prompts.

For an actual founder decision to publish without DES, store an entry keyed by
the exact content ID with these fields only:

```json
{
  "sharehub/share-N": {
    "content_id": "sharehub/share-N",
    "page_sha256": "SHA256 of the final UTF-8 page text",
    "reason": "founder_without_des",
    "approval": {
      "status": "confirmed",
      "decision": "Concise exact scope of the founder's real decision",
      "evidence": ["Public-safe reference to that decision"]
    }
  }
}
```

`unsourced_audio_caption` is the other allowed reason, only for an episode
whose audio-only/caption status was explicitly confirmed. Neither reason can
be inferred from missing results. Never fabricate approval or copy one from
another publication. Keep private conversations out of Git. The verifier
checks the reference's presence and scope; the agent must verify its truth.
Hash with `hashlib.sha256(Path(page).read_text(encoding="utf-8").encode("utf-8")).hexdigest()`
after builders finish. Any later page change invalidates the record: reconcile
its scope with the real approval before updating it, and rerun Phase F. Add
`.dentcast/des-exemptions.json` to this run's watched target paths when used.

An absent Fidelity field or null source slot must satisfy the existing source
exceptions (COMMENTARY, source errors, pre-3.1 NOT_APPRAISABLE) or a freshly
computed zero-unit SOURCE assignment from `des_fidelity_units.py`. A manual
claim of "no units" does not count; pooled units require a result. CITATION_ONLY
from v3.1 still requires the spec's INSUFFICIENT_TEXT result object. Missing or
unreadable assignment evidence fails closed. Founder-supplied complete canonical DES score JSON for this exact page is
validated and reused **without rerunning DES**, independently of Fidelity.
If only DES is supplied, run only still-owed Fidelity; if both tracks are
complete and valid, rerun neither. An incomplete, mismatched or stale supplied
result blocks the publish pending correction; it is not a DES exemption or
permission to rescore silently. Existing complete results are validated
without rerunning model calls; scoring prompts and voting are unchanged.

## Hook and CI coverage

- `scripts/cursor-parity-notice.mjs` recognizes active nested modules/global rules, avoids backup snapshots, reminds shared client edits and active-run checkpointing, and never writes a state or marks work done.
- The existing Claude/Codex hook configurations call the advisory adapter and a Stop guard. These adapters require actual native client support; their JSON presence is not a runtime certification. Cursor's always-on rules and every client's explicit CLI protocol remain authoritative. Shell edits bypassing a file hook are caught by Stop/pre-commit checks when those hooks are installed.
- Install local Git hooks once per checkout with `git config core.hooksPath .githooks`. The pre-commit guard permits consistent paused handoffs, blocks stale/unstaged checkpoints and unguarded deletion, and validates cleanup-only commits. It does not infer a publication from arbitrary content edits when no handoff exists. GitHub API commits bypass local hooks, so agents using them must preserve the same contract and CI verifies committed checkpoints/cleanup boundaries.
- `.github/workflows/publishing-live-contract-tests.yml` runs on main, fix/refactor branches and PRs. It tests active contracts, recovery/cleanup, hooks, and the committed-state boundary, including nested module/global changes. Historical staging CI remains separate and is not the active live-workflow certification.

Read `PUBLISHING-FINAL-REPORT.md` for integrated CLI/Git/discovery acceptance and remaining native-client/live-publication limits. Tests that use fixture verifiers prove guard behavior, not scientific correctness or a real published page.
