# Modular publication and recovery — implementation acceptance

All five original repair stages and all four delivery follow-up stages are
implemented on `fix/publishing-resume-contract`. Integration into main is tracked
in [PR #914](https://github.com/dentcast-hub/dentcast-hub.github.io/pull/914).
Clients using an older checkout continue to see its older rules until updated.
No content publication was performed by this repair.

## Resulting behavior

- AGENTS, CLAUDE and Cursor route through the same active shared rules and full
  applicable modules. Legacy snapshots are backups, not execution authority.
- `.dentcast/PUBLISH-HANDOFF.md` is the sole public temporary publication state.
  Its name is fixed. It records semantic progress, decisions, approvals, input
  references, validation evidence, external outcomes, blockers and next action.
  Current Git facts come from Git; compact identity/fingerprints remain evidence.
- After every canonical step, scoped work and the current handoff are committed
  together and pushed. The next step requires a fresh origin observation proving
  the latest exact handoff/work was delivered. Failed/unknown delivery blocks
  advancement. The helper observes delivery; the agent performs commit/push.
- For remote recovery, `discover` scans all GitHub branch pages at immutable
  head SHAs, validates handoff identity/plan and rechecks the full head map.
  A unique valid candidate supplies its observed latest SHA and handoff URL.
  Multiple/invalid files, incomplete scans or changed heads block selection.
  Branch recency is never a selection rule. The receiving checkout must still
  match that SHA and pass inspection before continuation.
- Completion requires resolved applicable work/approvals, real mechanical gate,
  delivery evidence and a delivered checkpoint. `finish` prepares recoverable
  cleanup; only after the deletion is committed/pushed and `confirm-cleanup`
  succeeds is completion reported. Interrupted cleanup restores the same file.

Read [the live contract](publish-handoff.md), [per-step protocol](publish-checkpoints.md)
and [discovery/retrieval procedure](publish-discovery.md) for execution.

## Integrated acceptance

`tests/test_dentcast_publish_integration.py` uses separate production CLI
processes, two actual Git checkouts and a local bare remote. Git reports a
GitHub run identity while a per-checkout URL rewrite sends all Git traffic to
that local remote. The discovery transport reads API-shaped responses from
actual bare-repository objects; the production selector is unchanged. These
are local integration tests, not live GitHub positive-publication tests.

| Integrated scenario | Verified boundary |
|---|---|
| Complete synthetic paper-only lifecycle | Every canonical step runs through started/completed CLI updates and scoped commit/push; discovery finds the actual branch/head; another clone matches SHA/digest and resumes the next unfinished step; actual catalog gate, report and confirmed cleanup succeed; final fresh-clone CI guard passes |
| Real push rejected by local pre-receive hook | Local checkpoint preserved; next step blocked; remote discovery finds no unpushed run; after delivery succeeds a receiving clone recovers it |
| Unknown external outcome transferred | Discovery and receiving inspection retain the unknown receipt; explicit retry and raw-record bypass both blocked until outcome reconciliation |
| Cleanup interrupted before delivery | Completion remains false; restore recreates the same fixed handoff with cleanup_pending and preserves existing external receipts |

These tests seed no completed scientific ledger. They use the actual CLI to
advance the five paper-only checkpoints, with explicitly synthetic metadata
and operator receipts. No Drive upload occurred. The real catalog gate checks
identity/link structure and the recorded receipt, not the truth of an upload.
Other tests exercise the unchanged page verifier rejecting incomplete content.
No positive full-page publication, scientific review, live deployment or real
notification was performed.

Integration exposed and fixed two issues:

1. Starting/restarting a step with a started/unknown external outcome is now
   rejected, including attempted transitions through raw `record` input.
   Recording a blocker or reconciling a verified outcome remains possible.
2. Once the exact handoff is committed, its Git commit supersedes the old local
   pre-commit index observation. The loader still compares expected fingerprints
   and uses the commit that wrote the checkpoint, so later work commits/dirty
   edits remain visible. A successful work+handoff commit no longer requires a
   redundant metadata rewrite just to refresh its own Git observation.

## Verification evidence

125 local checks passed: 111 Python checkpoint/lifecycle/discovery/compact/
integration/recovery tests, 8 active-entrypoint/source-migration checks and
6 Node advisory checks. GitHub Actions for the stage commit runs those groups
and the committed-state guard; its actual result is reported after the push.
Local Node uses `--experimental-test-isolation=none` because this environment
restricts Node child-process creation; GitHub uses the normal Node 22 runner.

The stage 3 live connected-GitHub scan observed 600 branch heads, checked the
fixed path at all 600 immutable heads, verified content-read access and compared
the complete head map again. No active handoff was found at those observed
heads. The recorded responses also passed through the production selector.
The standalone Python HTTP transport has controlled-response tests; no live
configured-token run or positive handoff was fabricated on GitHub.

No legacy backup, scientific model algorithm or production verifier was changed.
Changes are publication instructions, recovery helpers, hooks/CI and tests.

## Operational limits

The explicit shared protocol is mandatory for all agents following repository
instructions. No file can force every arbitrary client to load those rules.
Actual Cursor/Claude/Codex native sessions were not launched here; hook JSON is
not runtime proof. Direct native adapter processes and installed-hook tests
are covered. Each checkout needs `git config core.hooksPath .githooks` for the
Git hook; GitHub API commits bypass local hooks and retain the same contract.

Agents must verify scientific meaning, private inputs, approvals and actual
external outcomes. Hashes and fixture receipts cannot do that. Unpushed work
cannot be recovered by a GitHub-only agent. GitHub API access/rate limits and
the 1,000-branch scan bound block incomplete discovery. Windows locking is
implemented but not runtime-tested. A real authorized full publication and
native-client observation remain operational evidence to collect later.

Use a checkout containing the changes integrated through PR #914. Existing
clones must update to that revision; merging cannot refresh another agent's
already-open checkout or a client's cached instructions automatically.

## Execution reliability audit — 2026-10-20

Scope: infrastructure/instructions only, based on merged PRs #938 and #939.
No article bodies, publication data, scientific prompts, scoring, voting or human
approval rules are modified. The twelve module bodies below their checkpoint
banners compare exactly with the baseline. No publication was initialized.

### Evidence and prior repairs

- Baseline `a856192ada617e7426bbfaad02cfdc1f4cf0f98d` on main.
- #938 merged at `00c5b660b8b1e8c136975545335016c4dc6171a0`;
  #939 merged at `6b25498f2eb1803b2408258ee303d533c3425c5e`.
- Existing shared entrypoints already restricted recovery to explicitly
  incomplete/interrupted publications; `advance` and coherent delivery batches
  also already existed. These were retained, not reimplemented as new stages.
- Confirmed code mismatch: `snapshot_from_commit` includes a committed checkpoint's
  changed paths; the old current snapshot used only dirty paths plus declared
  targets. A builder output could disappear from the current inventory immediately
  after commit and generate false work/index/stale comparisons. The regression
  uses real commits, a bare remote and a fresh clone without private observations.
- Confirmed writers used universal-newline `read_text` followed by plain
  `write_text`/`open(..., 'w')`, allowing CRLF output to become LF. Writers now
  preserve uniform existing endings; mixed endings stop before writing.
- Terminal Git reads succeeded. A non-writing push dry-run failed because terminal
  Git had no credentials. Connected GitHub delivery is a separate capability;
  a read-only permission inspection is not push proof.

### The 14 local ShareHub files

The original checkout exists at
`/workspace/scratch/7c592a16d4c7/dentcast-repo-checkout`, with HEAD
`a03f4e276f351ee6739d64d3f953ec2e95dfe14d` and 14 dirty tracked files. It was
read only and left untouched. These are files, not proof of 14 distinct fixes.

Byte comparison with the audited main shows these **13 files already identical**:
`index.html`, `pillar/digital/index.html`, `pillar/digital/structure.json`,
`pillar/index.html`, `pillar/structure.json`, `player.html`, `plus/faq-corpus.json`,
`plus/flashcards-index.json`, `plus/quiz-index.json`, `service-worker.js`,
`sharehub/en/share-38.html`, `sharehub/share-38.html`, `up-board/index.json`.

Main contains post-merge commits `c783466f`, `f6fc5bf6`, `aab81645`, `a856192a`.
The remaining local `plus/content-index.json` has `folderCount=3` and 3 folders;
main has `folderCount=13` and 13 folders. Every other top-level JSON field is
identical, including the full `byContent` data. This is not evidence of an
undelivered infrastructure fix. Neither local article edits nor generated data
from that checkout were copied into this change.

### Changes and boundaries

- Separate current-state recording, permanent guide loading, and explicit recovery.
  Branch discovery CLI requires `--recover-incomplete`; a missing completion
  receipt reports a current-PR repair rather than directing a branch scan.
- Reuse completely read unchanged sources and valid tool digests in the session;
  explain reloads and detect repeated unchanged failures without a second ledger.
- Preserve baseline inventory across commit/API/fresh-checkout transitions;
  enroll only named canonical builder outputs automatically. Newly encountered
  unrelated dirty paths require explicit scope review; undeclared committed paths
  are reported for review. Byte/index/input/rule drift remains guarded.
- Add read-only `delivery-plan` for changed object IDs, sizes and final tree;
  add exact-PR/head/base/ref `check-pr` without branch discovery. These do not
  push, merge, authorize publication or evaluate semantic/scientific work.
- Reuse existing `advance`; reject identical step transitions. Clarify persistent
  explicit authorization, final stamp ordering, meaningful status updates and
  the difference between prepared/verified/committed/pushed/merged/live.

Native agent compliance with conversational loading/reporting cannot be proved by
unit tests or forced on arbitrary clients. Direct connector actions must use the
same fresh-PR checks and expected-SHA discipline; the CLI cannot intercept them.
Preflight is not a distributed lock: an atomic service-side lease is still needed
where available. No live publication, real merge, Windows runtime or new DES/
Fidelity evaluation was performed by this audit. Original semantic and human gates
remain required, and the infrastructure branch awaits founder merge approval.

### Validation of this repair

- 168 live publishing/checkpoint/discovery/cleanup/recovery tests: PASS, including
  14 new regressions for clean committed builder files, fresh checkout, real
  content drift, unrelated work, missing/new dependencies, duplicate transitions,
  uncommitted handoff delivery, changed/merged PRs and newline/stamp stability.
- 18 merge-gate tests, 12 entrypoint migration tests, 9 global-rule tests and
  6 native hook-adapter tests: PASS (213 automated tests total).
- Separate disposable checkout: 13 actual builder/injector commands ran
  successfully; 12 pre-existing output files seeded with CRLF retained CRLF.
  Repeated final stamping changed no output bytes. No live article was published.
- Python syntax, Node syntax, `git diff --check`, source-module body parity and
  workflow/client synchronization: PASS.
- Complete changed text payload can be read locally and passed internally to the
  GitHub tree API without printing bodies/Base64. The connector schema publishes
  no exact payload ceiling; this batch is below a conservative 1 MiB operational
  envelope, with its largest file below 200 KiB. This is not a claim about an
  undocumented backend limit. Transfer result/tree identity must still be checked.
