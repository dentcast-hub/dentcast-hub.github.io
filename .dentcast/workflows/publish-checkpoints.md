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

### Verbatim route-dependent source loading (no shorter scientific protocol)

After the actual Phase B decisions for category, attached paper and Challenge
are locked, a local checkout may run `tools/dentcast_publish_readpack.py`
as documented in `.dentcast/workflows/README.md`. Only that pinned,
hash-identified byte-for-byte extraction of proven inapplicable branches may
stand in for reading an entire applicable publication module. Read all selected
ranges completely, including ordinary DES/Fidelity execution instructions
when owed; record source revision and selection coverage in the current
session. The readpack is not a checkpoint, execution engine, scientific
summary, category exemption, or authorization to bypass anything. It never
loads dynamic global path rules, specialty workflows or scientific prompts:
those remain separately required in their complete applicable form.

If source hashes drift, regenerate the selection; the tool reverts that module
to its full text. Unknown intake retains full text. If selector execution,
provenance or actual locked intake cannot be verified, read the original
complete relevant modules. Never reuse an old pack after its source revision
or locked intake changes. After-intake reuse is allowed only for the six
introductory sources already completely read in that unchanged session.
Canonical ledger steps, durable receipts, approvals, DES/Fidelity, Phase F,
and the three fixed pushes are identical in both reading modes.

## Publication services and remote checks

Vercel is not a DentCast publication service. Its commit status, deployment,
preview, failure or pending state must never be requested as publication evidence,
polled, awaited, treated as a publishing/merge gate, or included in the completion
criteria or routine final report. A GitHub response may include that unrelated
status; its presence does not enroll a new external action or approval requirement.
Design references to Vercel in site styling are unrelated to hosting.

Use the actual repository checks, canonical Phase F, required remote delivery
observations and applicable checks of the real DentCast destinations (Cloudflare
Pages / ArvanCloud). Do not infer a new deployment task from an aggregate status
or a third-party bot. A successful Vercel status cannot substitute for a failed
repository check or Phase F. If GitHub itself refuses a merge because of an
unrelated required check, report that exact configuration blocker; do not claim a
merge or weaken branch protection. Removal of an external installation is a
separate administration action, not an implicit publishing step.

## Waiting and refreshing remote state

At a real wait, report the canonical step, the exact pending result, and whether
it blocks the next action. Keep that outcome in the existing run ledger; do not
create another checkpoint format. Continue independent authorized work.
Refresh only the relevant result after a plausible state change (an action was
submitted, a callback/new event arrived, or a bounded polling interval elapsed).
Do not poll all PRs/checks after each local step. Stop an unchanged error loop and
report the cause instead of issuing identical failing requests. This does not
waive the fresh exact-PR/ref preflight immediately before a delivery/ref update
or merge, or remote read-back at the fixed three delivery cuts.

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
python3 tools/dentcast_publish_handoff.py step --id <canonical-id> --status started --expected-sha256 <digest> --reconcile-note 'Reviewed current step prerequisites and Git changes'
# Execute only the actual authorized canonical action and verify its result.
python3 tools/dentcast_publish_handoff.py step --id <canonical-id> --status completed --evidence <actual-receipt-reference> --expected-sha256 <new-digest> --reconcile-note 'Reviewed the actual step changes and evidence'
```

Use `skipped --reason <canonical-exception>` for an inapplicable step, or `blocked`/`failed` with a real reason. Record before pausing. A completed checkpoint must first have been started; neither the hook nor the CLI performs semantic work or creates a scientific result. Add actual decisions, approvals, input references, validation and delivery receipts via `record` using the full current `recorded_state.publication` object, never by replacing it with a partial example. Known approval scopes and external action history cannot disappear.

### Optional connected GitHub state construction (not a forced handoff)

For a new page publication in a tool-limited GitHub-connected runtime,
the portable metadata compiler in connected-github-handoff.md may
construct the same complete canonical v3 handoff without local Git.
Its Python variant imports the authoritative plan and validation; its
import-free JavaScript wire codec has strict Python byte/plan parity
checks. These tools are only recorders/validators; they never perform
a semantic step, grant author approval, evaluate DES/Fidelity, commit
files or certify delivery. All normal workflow modules and approval
requirements still apply. After an actual verified first remote delivery,
**continue in the same agent whenever possible**; changing agents or
entering a Work session is optional, not mandated by Push 1.

### Bounded heavy validation using Fast Local WAL

When working in a local Git checkout on a new page *before Push 1*,
use the already-supported `tools/dentcast_publish_fastlocal.py` WAL.
Every transition retains its own timestamped, hash-chained and fsynced
receipt; a missing or torn event remains detectable. The **expensive**
Git checkout/workflow snapshot runs at `flush`, not on every semantic
step. Flush and reconcile at the first delivery cut, before changing a recorded
input/approval/external action, when a relevant source or prerequisite changes,
and before stopping or handing off. Re-begin after the flush if the fixed
delivery boundary was not reached. Do not trigger a full Git/workflow snapshot
merely because five or ten steps elapsed. Every event still validates ordering
and its recorded prerequisites. The existing 2 MiB journal limit and first-cut
guard bound local work; reaching the byte limit requires a reviewed local flush,
never discarding the WAL or pushing an extra checkpoint. Never push intermediate
flushes: the same three delivery commits still apply.

The WAL is only available before Push 1. Later scientific work uses the existing
canonical writer and validation; this optimization does not defer DES/Fidelity,
approval validation or Phase F. Changing an enrolled input invalidates affected
evidence under the existing reconciliation rules, including uncommitted bytes.
A step receipt records work actually performed, not a substitute for that work.

For consecutive genuinely inapplicable skips, or a previous step's
completion and the next step's start, `fastlocal.py batch` can store
up to 20 transitions with **one WAL replay**, while persisting every
individual event. The input is a JSON array of `{id,status,evidence,reason}`
records supplied from reviewed real actions. A step cannot be
`started` and `completed` within the same batch command: the actual
semantic action must take place between them. Lightweight ordering,
approval and outcome rules remain checked on every transition;
hard validation stays at flush, the fixed push gates, and Phase F.
Do not use this local WAL option as proof of work in a GitHub-only agent.

### Explicit dependency invalidation (same run, no extra delivery)

A reconciliation note is not replacement evidence. Enroll each local source in
`target_paths` and bind its bytes in the existing `context.inputs` list using
`{"path":"sources/paper.txt","sha256":"<actual SHA-256>"}`. Existing
`{"ref":"<enrolled local path>","sha256":"..."}` entries are also checked.
URLs/non-file references still require the operator's real source verification;
these tools do not fetch or assess a paper. Watched paths cannot be removed to
hide drift. Index-only changes do not invalidate byte-bound evidence.

Changed bound input bytes block writes/inspection until reconciled. An effective text change to
the approved primary page also requires explicit invalidation; unchanged approval
metadata plus a review note cannot bless changed bytes. Where no unique primary
page can be identified from the content ID, watched HTML pages are checked
conservatively. Link wrappers/cache stamps alone do not invalidate text approval;
the exact decoded text preserves internal whitespace and Persian codepoints.
Its uncommitted hash stays in the existing private Git observation; committed
text is reconstructed from Git, and a missing baseline fails conservatively.
The current approval schema has no narrower machine-readable
scope-to-text binding, so invalidation returns confirmed/not-required approvals
to pending, preserves their prior decisions in the audit, and never grants consent.

If a nonempty Fast Local WAL cannot flush because rules or inputs changed, do
not retry flush or remove the WAL. Review the actual change, then run:

```bash
python3 tools/dentcast_publish_fastlocal.py invalidate --expected-digest <digest> --from-step rules --reconcile-note '<actual dependency review>'
python3 tools/dentcast_publish_fastlocal.py flush --expected-digest <returned-digest> --reconcile-note '<review of preserved evidence and invalidated suffix>'
```

The first command appends a hash-chained invalidation event; it does not replace
prior events. The second materializes it through the normal canonical writer.
An interruption between them resumes with `fastlocal.py inspect` and flush;
an interruption after the canonical save retries that same flush idempotently.
An explicit invalidation can reconcile a changed WAL engine only with full
invalidation and structurally valid replay; ordinary reads still reject an
engine mismatch, and corruption/torn tails retain their existing guards.

For canonical state after WAL materialization use:

```bash
python3 tools/dentcast_publish_handoff.py invalidate --expected-sha256 <digest> --from-step <first-affected-step> --reconcile-note '<actual dependency review>'
```

The unaffected prefix is preserved. Changed workflow or existing input references
require invalidation from `rules` under the existing conservative contract; an
approved-page edit invalidates `C.2` and the following steps. Earlier invalidation
is permitted. Superseded steps, inputs, approvals, validation and delivery evidence
remain in an append-only `dependency_invalidation_v1` decision in the existing
handoff, not another state format. Only local input hashes are refreshed, never
scientific scores, independent reviews or human decisions. Pending questions,
external attempts and reconciliations remain intact; unknown external outcomes
still block retry. Re-execute affected actions and real Phase F as required.
This creates no fourth delivery and does not change the three fixed cuts.

Within one canonical operation, immutable baseline file/workflow inventories may
be reused for the same resolved commit, checkout and target set. The cache ends
with that operation; worktree bytes, index, origin, branch and remote observations
are always fresh. `advance` uses the writer's boundary guard once instead of
preflighting the same remote boundary twice. A later delivery operation must
observe remote state again.

### Compact handoff, unchanged canonical plan

For new canonical v3 handoffs, persist the significant `steps` prefix only:
all started/completed/skipped/failed records, plus any explicitly enrolled
dynamic substeps (even when pending). Pure trailing `pending` canonical
rows are omitted from the file and **reconstructed from the live registry**
when opened. A missing or reordered step inside the prefix is an error.
Older full-length v3 files remain accepted. This is a storage format
optimization, not permission to bypass a step, gate or review.

### Prefer one command per verified action

Use `advance` to reduce manual calls and digest copying. After completing and
reviewing an already-started step, record its real evidence and start the next
ready step in one command:

```bash
python3 tools/dentcast_publish_handoff.py advance --id <current-id> --evidence <actual-receipt-reference> --start-next --expected-sha256 <digest> --reconcile-note '<review of actual changes>'
```

Read the full applicable module before requesting `--start-next`; omit that
flag at an unread-module boundary or an approval wait. At either fixed delivery
cut, the helper saves the completed step and stops before starting the next one. The tool records progress only: it never
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

### First-cut human decision checks in every execution mode

At the first cut, and on every subsequent fixed delivery, both the canonical
local CLI/Git/CI route and the connected route must have zero unanswered
`pending_questions` and no unconfirmed/rejected approval. The canonical
local guard also requires exactly one
`context.decisions` entry with
`kind="first_cut_lead_provenance_v1"`, a real `source_ref` and nonempty
evidence. Set `origin` to `author_original` when the first paragraph is
supplied by the author; no additional approval is required for that paragraph.
If the agent composed a new lead, set `origin="agent_authored"` and record
the author's real explicit confirmation as `scope="authored-intro"`,
`status="confirmed"` in `context.approvals`. Use
`origin="not_applicable"` only for a genuine reviewed exception (e.g. the
page already has ordinary prose and no new lead was created), with a specific
reason in `source_ref`. Never infer approval from the absence of a record.

The pre-commit guard and the independent committed CI guard both reject a
missing declaration or outstanding questions. These checks do not create a
new human approval requirement for an original author paragraph, and an
agent-supplied metadata claim is not itself proof of consent; inspect its
real evidence. Existing category exceptions, paper-only route, scientific
DES/Fidelity and the three fixed push boundaries remain unchanged.

### Checkpoint every step locally; deliver exactly three times

After **each** canonical step or dynamic substep, save its real result locally
before continuing. Keep one transition per write; `advance` performs separate
writes and returns `delivery_required` rather than crossing an undelivered cut.
Local checkpoints are not proof that another checkout can recover the work.

Every new page publication still has exactly three commit/push deliveries.
**Newly initialized pages** carry `fixed_three_deliveries_v2` (alongside the
v1 compatibility marker), whereas already-started v1-only handoffs remain
on their original second cut; NEVER relabel or retroactively migrate their
published first/second delivery. The new schedule is:

| Delivery | Boundary | What is delivered |
|---|---|---|
| 1 | After `C.4.9`: page construction and semantic linking complete | Scoped work and latest unfinished handoff |
| 2 — new v2 only | After `C.6`: DES/Fidelity, Challenge, hashtags, content registry, pathways, Pulse, translations and all human sign-offs completed or legitimately exempted | Scoped editorially finalized work and current handoff |
| 2 — existing v1-only | After `C.4.13`: old scientific cut, unchanged | Historical v1 step order and handoff |
| 3 | After all remaining steps, final bytes, real Phase F and report G | Final work and completion receipt, with the old handoff deleted in the same commit/push |

### Editorial closure required before the v2 second delivery

The *author* side of Phase D (complete English body, first/final
editorial review, reciprocal toggles and any consent) is performed before
C.6 is resolved; after second Push, Phase D only performs mechanical
consistency checks and noindex/hreflang/sitemap tools. LiteCast and Challenge
keep their existing English exemption. Move no scientific review or founder
correction after the second cut. Fill the full ten-scope
`second_cut_editorial_lock_v1` decision:

```json
{
  "kind": "second_cut_editorial_lock_v1",
  "scopes": [
    {"scope": "scientific", "status": "resolved", "evidence": ["real source/review reference"]},
    {"scope": "challenge", "status": "not_applicable", "evidence": ["reason based on route"]},
    {"scope": "taxonomy", "status": "resolved", "evidence": ["verified classification"]},
    {"scope": "links", "status": "resolved", "evidence": ["actual semantic-link audit"]},
    {"scope": "hashtags", "status": "resolved", "evidence": ["canonical library check"]},
    {"scope": "content_record", "status": "resolved", "evidence": ["entry and title/meta check"]},
    {"scope": "pathways", "status": "resolved", "evidence": ["placement/exception audit"]},
    {"scope": "pulse", "status": "resolved", "evidence": ["seven-line update or justified exception"]},
    {"scope": "english", "status": "resolved", "evidence": ["existing approved mirror or exemption"]},
    {"scope": "author_approvals", "status": "resolved", "evidence": ["documented human decisions"]}
  ],
  "english": {"status": "ready", "path": "insight/en/insightNN.html",
              "evidence": ["source and mirror reviewed before Push 2"]},
  "evidence": ["actual current-run editorial close review"]
}
```

The sample is SCHEMA ONLY, never copy its example evidence into a real run.
Each ten-scope status is either `resolved` or `not_applicable` with a
genuine independent source/reference for the actual category. For LiteCast
or confirmed Challenge the English status MUST be `exempt`, path `null`
and a justified evidence reference; all other pages MUST be `ready`, with
the correct mirror path in `target_paths` and a real file already on disk.
The canonical writer validates this at cut 2 and at completion. Its
structural check does not substitute for the actual author sign-off.
Before the v2 second delivery, also record both `title` and `caption` in
`context.approvals`. Use `status="confirmed"` with the exact approved text in
`decision` and evidence of that approval when Phase F must verify a string.
Use `status="not_required"` with a specific decision and evidence when no
separate exact title or caption string applies; at least one of the two scopes
must be `confirmed` so Phase F has exact text to verify. The automatic post-Push-2
workflow reads these frozen records; it does not invent or prompt for missing
text. Missing either scope blocks the second cut before any mechanical builder
runs.

### Agent update and wait after Push 2

Immediately after the second-delivery push is confirmed, tell the user that the agent's content/preparation work is complete through Push 2, GitHub Actions is performing the remaining mechanical steps, and the agent is actively monitoring the run. Include the exact branch and Push-2 SHA, plus the Actions run link as soon as it is available. This is a handoff update, not a claim that publication is complete.

Stay with the run and poll at bounded intervals until it reaches a terminal state; do not end the turn or leave the user without a status while the job is queued or running. If preflight skips or no run appears, inspect the event, branch and handoff before reporting that Actions started. If the run succeeds, verify that delivery 3 is based on the exact Push-2 SHA, the completion receipt is present, the active handoff is removed, and cleanup is confirmed before reporting publication complete. If it fails, inspect the uploaded logs/recovery artifact, diagnose and resume through the guarded recovery path where possible, and keep the user informed of the real status.

All editorial work (including tags, Pulse and the English writing itself)
must be completed before the second boundary. If any mechanical operation
later reveals a needed substantive change, STOP and explicitly invalidate
affected approvals; do not silently resolve it in Phase D/Phase F.

No discretionary phase, turn end, agent/checkout switch, approval wait or external
action adds a fourth delivery. Between cuts, checkpoint locally and continue.
If interrupted there, report that the newest work is local; remote recovery is
available only through the last delivered cut. Do not claim otherwise or push an
extra checkpoint. Before an external action record `started` locally; immediately
record its observed outcome. Unknown outcomes block retry as before. External
actions still require their existing scope and approval; this protocol grants none.

Cuts 1 and 2 require a fresh remote observation before crossing into the next
step, including when scientific steps are lawfully skipped. Stage scoped work,
refresh the local checkpoint after staging, stage the latest handoff, commit and
push once; verify actual remote delivery. Failed transport blocks crossing that
cut. Preserve work and report the real error; retrying the same unaccepted
logical delivery does not create another milestone. Never advance by pretending
a failed push succeeded. The helper does not commit or push automatically.

`init` records `fixed_three_deliveries_v1` in semantic decisions for new page
runs, including unassigned intake; it cannot subsequently be removed. Pre-commit
and CI reject intermediate or duplicate checkpoint commits and check cut order.
The completed-only `.dentcast/publication-reports/<content-id>.completion.json`
receipt lets CI verify cut 3 without publishing a final active handoff. It records
the finished ledger, final fingerprints and the two prior delivery commits; it
is an audit report, not a recovery candidate. Final deletion and output changes
must share that third commit. Git history checks enforce three delivery commits;
hooks cannot count network retries or prevent a client bypassing local hooks.

The Stop guard permits consistent local progress between cuts. At a delivery cut
it requires delivered work; during final cleanup it requires final confirmation.
A checkpoint written in an earlier run without the policy marker retains the
legacy cleanup path so interrupted older work remains recoverable. Paper-only
is a separate no-page route and keeps its catalog verification/cleanup contract;
do not invent page/DES cuts for it. Never remove a policy marker to claim legacy.

The v3 handoff remains semantic-only. Git reconstructs committed fingerprints;
private same-checkout observations support local progress. Do not create commits
to embed their own SHA. Keep private input bodies out of all public receipts.

For v2 only, the cut moves *forward in the step sequence* from C.4.13 to
C.6, **after** the judgment-dependent steps. The canonical plan's 52
step IDs, science requirements and module order remain unchanged. C.8,
C.7, D technical checks, E, real Phase F, final report G and final
delivery run after the v2 second cut. The legacy v1 boundary retains
C.4.13 without migration.

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

Finish report G and record its real reference. `context.delivery` must contain
objects with nonempty `scope` and `evidence` lists for actual required external
checks; a Boolean is rejected. For new page runs, **do not commit or push this
final handoff**:

1. Finish all final edits and verify the actual bytes; save the completed local
   ledger and report evidence. Keep HEAD at the already pushed second delivery.
2. Run `finish --expected-sha256 <digest>`. It requires all gates resolved, real
   successful Phase F, actual delivery evidence and a freshly synchronized remote
   at delivery 2. It reruns the mechanical gate and checks unchanged work. It
   writes the completed-only receipt, retains private recovery metadata and
   removes the active handoff locally.
3. Stage only final scoped work, the completion receipt and handoff deletion.
   Commit/push them **together as delivery 3**, then run `confirm-cleanup`.
   This confirms actual remote delivery and unchanged final bytes. No additional
   cleanup commit/push follows. Until confirmation, status is
   `cleanup_pending_delivery`, never publication success.
4. If interrupted before successful delivery, preserve work and use
   `restore-cleanup` to restore the same local handoff. It removes its own unchanged
   completion receipt locally, never restores content or repeats an external
   action. If the final commit already exists, `restore-cleanup` preserves that
   commit and returns `final_delivery_pending`: retry the same push and confirm,
   without making another commit. Reconcile actual Git/index drift and rerun
   affected checks before retry.

For pre-policy interrupted runs and paper-only, compatibility retains the earlier
exact delivered final handoff followed by a deletion-only cleanup commit and
`confirm-cleanup`. This exception is not available to a new page run.

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
- Install local Git hooks once per checkout with `git config core.hooksPath .githooks`. The pre-commit guard permits only the two fixed active checkpoints for new page runs, blocks stale/unstaged checkpoints and unguarded deletion, and validates the combined third delivery. Legacy and paper-only cleanup remains compatible. It does not infer a publication from arbitrary content edits when no handoff exists. GitHub API commits bypass local hooks, so agents using them must preserve the same contract and CI verifies committed checkpoints/cleanup boundaries.
- `.github/workflows/publishing-live-contract-tests.yml` runs on main, fix/refactor branches and PRs. It tests active contracts, recovery/cleanup, hooks, and the committed-state boundary, including nested module/global changes. Historical staging CI remains separate and is not the active live-workflow certification.

Read `PUBLISHING-FINAL-REPORT.md` for integrated CLI/Git/discovery acceptance and remaining native-client/live-publication limits. Tests that use fixture verifiers prove guard behavior, not scientific correctness or a real published page.
