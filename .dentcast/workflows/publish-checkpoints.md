# Direct publication — checkpoints, deliveries, completion

The contract around the twelve modules: order, founder messages, ledger, three deliveries, completion.
It does not rewrite authoring, category exceptions, builders or the scientific DES/Fidelity engine.
Every client follows it; hooks are supplementary adapters, not proof a client loaded anything.

## Interrupted publication

This section is the only home of this rule; entrypoints point here.

- Roles: this file is the permanent guide; `.dentcast/PUBLISH-HANDOFF.md` is the temporary state of
  the current run; `publish-handoff.md` and `publish-discovery.md` are explicit recovery only.
- In an active session «کجایی؟»، «چی شد؟»، «ادامه بده» and «ادامه انتشار» are status/continuation
  requests: answer directly and continue from the current ledger and the latest helper digest. No
  reinitialization, no branch scan. A missing receipt, stale checkpoint or module cross-reference does
  not authorize recovery. Infrastructure-only work does not initialize a publication.
- Recovery only on «انتشار ناقص داشتم» or a request to resume a publication the user identifies as
  incomplete/interrupted: read `.dentcast/PUBLISH-HANDOFF.md` exactly once, then
  `publish-handoff.md`, and run `python3 tools/dentcast_publish_handoff.py inspect` once. No local
  file → `publish-discovery.md` (`discover --recover-incomplete`). Afterwards keep the state in the
  session; never reread the handoff before each step.
- Before a new publication check only whether the handoff exists. If it does: change nothing, ask
  whether the user means to resume; read it only after explicit confirmation. Never overwrite
  unfinished work.
- Update the handoff after every canonical step and before handing off; delete it only after verified
  completion. A missing file or unavailable work is reported, never invented. Local commits and dirty
  files are not available in another checkout.

## Source loading

- Choose the route and its sources at the start. Read each needed source completely, in bounded
  numbered ranges. Keep `(path, revision, ranges read)` in the session, no state file. An unchanged
  source already read is not reread; reload only a changed source, an authorized recovery source or a
  source needed to diagnose a new error, and say why. Summaries and memory never replace the first
  complete reading.
- The byte-exact readpack (`tools/dentcast_publish_readpack.py`): rules in `README.md` only. The pack
  is the text source, read at the moments below, not a preload.

**Just-in-time loading.** Up front: `README.md`, `global/README.md` with its selected sections,
`agent-parity.md`, this file, modules 01 and 02. After Phase B is locked, each module (or its readpack
ranges) is read completely immediately before the first ledger step its preface lists, and stays
loaded. A module whose steps are all canonically skipped is not read. Reading later never means
reading less.

| When | Read |
|---|---|
| Phase B locked, Question 4.9 = «چالش» | module 09 complete, before C.1 (its markup shapes the page of delivery 1) |
| Founder hands over DES/Fidelity JSON at intake | module 08 opening through «Conditional path for founder-supplied results», before Question 4.8 |
| Before C.0 … C.2 / C.2.4 … C.4.6 | modules 03 / 04 |
| Before C.4.10.1 (paper attached) | module 06 |
| Before C.4.13 | module 08 complete; LiteCast and Challenge read its opening up to `#### Conditional path for founder-supplied results` for the skip line |
| Before C.4.7 | module 05 |
| — delivery 1 — | modules 06 and 08 are therefore read before cut 1 |
| Before C.4.11 / C.4.14 / C.5.0 | modules 07 / 09 (Challenge only) / 10 |
| Before writing the English mirror (before C.6) | `en-version.md`, module 12 through the end of Phase D, module 11's C.6 part |
| Never in a normal run | module 11's C.8/C.7 part and module 12 Phases E–G: the runner does them; read only for guarded recovery (`publish-after-push2.md`) |

## Order, messages, text lock, deliveries

**Canonical order** (`plan` returns it; `init` marks new runs `ledger_order_v2`): `rules`, Phase 0, A,
B, C.0 … C.2, C.0.5, C.0.6, C.2.4, C.2.5, C.2.6, C.3, C.4, C.4.5, C.4.5-b, C.4.6, C.4.10.1, C.4.10.2,
C.4.10.3, C.4.13, C.4.7, C.4.7-b, C.4.8, C.4.9 **[delivery 1]**, C.4.11, C.4.12, C.4.14, C.5.0, C.5,
C.5.5, C.5.6, C.5.6-b, C.6 **[delivery 2]**, C.8, C.7, D, E, F, G **[runner]**. A handoff started
under the earlier order keeps it; the tools recognise it from the missing marker. `init` refuses an
old-order plan (`CANONICAL_PLAN_REQUIRED`), a marked run cannot be reordered
(`LEDGER_ORDER_CANNOT_CHANGE`), and a v2-order run requires the v2 cut policy
(`LEDGER_ORDER_V2_REQUIRES_DELIVERY_POLICY_V2`). Never relabel or migrate a delivered cut.

**Earlier delivery policy (compatibility).** A page handoff without the `fixed_three_deliveries_v2`
decision keeps its own second cut at C.4.13 and its local completion: the agent runs C.8 onward,
then `finish`, one commit with the final work, the completion receipt and the handoff deletion, one
push, `confirm-cleanup` (which reruns Phase F locally). If that final push fails, `restore-cleanup`
returns `final_delivery_pending`: retry the same push and confirm, with no new commit. A delivered
cut is never relabelled, and a policy marker is never removed to claim this path; a new page run
cannot choose it.

**Standing acceptance.** Agent proposals are not sent for confirmation: title/caption the agent
proposed, lead paragraph, Q3.5 rewrites, hashtags and mint, keywords, pillar/subtopic, borderline
links at 4.7/4.8/4.9 (conservative default: skip), flashcard/FAQ choices, catalog tags and the Drive
subfolder among existing ones, the Pulse line, pathway borderline and third pathway, uncertain bundle,
English mirror. Each is built per its module, recorded with evidence in the handoff and listed in the
**agent's Push-2 report** (below). The founder may change any of them; the change follows the
invalidation rules below.

**At most three founder messages**, each sent only when it has content:

1. **M1, open facts** — at the first step that needs a fact no real source answered (normally
   C.4.10.1, the paper branch: DOI, first author, which Drive file, catalog counters; a NoteCast credit
   target at C.4.5-b; Hard Rule 13). One message gathers every open fact known at that point; the
   dependent step waits, independent work continues. A rare later fact (an abstract the tool cannot
   fetch, module 08 Part 1) is asked where it arises. A page with no paper and no open fact has no M1.
2. **M3b, Part 3b** — at C.4.13, only when a sentence is still `ALTERED`/`REVERSED` after the stronger
   review: each with its three named answers (module 08). Pages without C.4.13 (LiteCast, Challenge,
   «بدون DES») have no M3b.
3. **M2, exam questions** — at 4.12-ب, approved one by one (module 07).

M1 and M3b are closed before delivery 1: the cut refuses any unanswered `pending_questions`.

Asked when they arise, because they are real decisions: a new subtopic in `PILLARS`, a new Drive
subfolder, DES basket 3 / publish without DES, a missing Fidelity runtime capability, a NoteCast pair
where neither episode has a related-content block (4.5) or a previous Promptologist part without an
`ep-nav` block (4.6), merge authorization. Founder data (text, title, any string given) is final and
copied (Hard Rule 16).

**Text lock.** After C.4.13 the body text, title, caption and image captions are locked (4.7–4.9 still
add their anchors around unchanged words). Only a Part 3b fix changes the body text (and re-measures
only its units). Any other change is the existing invalidation
from C.2 (`invalidate`, below).

**Push is never a founder gate.** The three deliveries are the contract. Page publications have
exactly three; this table is their only home:

| Delivery | Boundary | Contents | Who |
|---|---|---|---|
| 1 | after `C.4.9` | scoped work + latest handoff | agent |
| 2 | after `C.6`: DES/Fidelity, Challenge, links, flashcards/FAQ, hashtags, content record, pathways, Pulse, English mirror and every founder message closed | scoped work + latest handoff | agent |
| 3 | after C.8, C.7, D, E, real Phase F, G | final work + completion receipt + handoff deletion, one commit | `post-cut2-mechanical.yml` |

Between cuts checkpoint locally and continue. No stop, turn end, agent switch, approval wait or
external action adds a delivery. Interrupted between cuts: the newest work is local; remote recovery
reaches only the last delivered cut.

## Start and identify the run

1. Branch from a freshly fetched `origin/main` (`git fetch origin main`). A cloud session's own,
   still-empty `ccr-*` branch: `git switch -C <that-branch> --no-track origin/main`; elsewhere
   `git switch -c <branch> --no-track origin/main`. A branch that holds commits is never moved
   (`TOOL_OLDER_THAN_ORIGIN_MAIN` then names `git merge --no-edit origin/main`).
   `SHALLOW_CLONE_DEEPEN_REQUIRED` → `git fetch --deepen=50 origin` (or `--unshallow`) and retry.
2. Check only that `.dentcast/PUBLISH-HANDOFF.md` does not exist (section above). Then run the
   global selector with every path this run will touch and read what it adds
   (`python3 tools/dentcast_global_rules.py --path <path> … [--read]`, `global/README.md`); rerun it
   when the scope grows. It selects per file, so a pathway step loads the standings/certificate
   sections and not the exam internals.
3. `python3 tools/dentcast_publish_handoff.py plan` (paper-only: `plan --paper-only`, category
   `paper-only`); its full `steps` go into the input JSON (`publish-handoff-tool.md`). `init` and
   `record` reject an incomplete ledger.
4. Identity known → `init` with the real `content_id` and category. Otherwise `init` with content ID
   `unassigned`, category `pending`, the full ledger and a watched path such as
   `dentcast-brain.json`, then once `bind --expected-sha256 <digest> --content-id <id> --category
   <category> --target-path <path> --evidence <intake-reference>` during intake, before authoring.
   Completed, evidenced founder-requested external actions (e.g. a Drive move) do not block `bind`.
   A real identity is never rebound.
5. `content_id` = `<section>/<slug>` = page path without `.html` (`insight/insight-99`); the English
   mirror `<section>/en/<slug>.html` and receipts derive from it; other forms → `CONTENT_ID_INVALID`.
   Paper-only keeps its catalog id.

## Every canonical step

```bash
python3 tools/dentcast_publish_handoff.py step --id <id> --status started --expected-sha256 <digest> --reconcile-note '<prerequisites and Git changes reviewed>'
# perform only the authorized canonical action, verify it
python3 tools/dentcast_publish_handoff.py advance --id <id> --evidence <receipt-ref> --start-next --expected-sha256 <digest> --reconcile-note '<actual changes reviewed>'
```

- Prefer `advance`: it saves each transition separately, passes digests internally and stops at a
  delivery cut (`delivery_required`). Omit `--start-next` at an unread-module boundary or a wait.
  Consecutive inapplicable steps: repeated `--skip '<id>=<canonical exception>'` in order; a row an
  earlier `--start-next` opened may be skipped while it has no evidence, external action or change.
  `failed`/`blocked` use `step`. On a mid-sequence failure `transitions_written` and the last digest
  show what was saved; never replay a completed action.
- `skipped` needs the canonical exception from the module; "not loaded" is not one. `rules`, `0`,
  `F` and `G` cannot be skipped. A completed step was started first.
- Decisions, approvals, inputs, validation and delivery receipts go through `record` with the full
  current `recorded_state.publication` object. Recorded approval scopes and external actions never
  disappear.
- External action: record `<step-id>:<name>` as `started` before acting (e.g. `C.4.10.1:drive-move`,
  even when the founder asks for it earlier), its observed outcome right after. A started/unknown
  outcome blocks starting any step until reconciled.
- Dynamic substeps (e.g. `C.4.13/<unit-and-checker-id>`) sit before their aggregate step with the
  same module. The registry checks order and coverage, never the truth of a judgment.
- Same command, same input, same error, nothing changed = execution loop: report the blocker and
  change the diagnostic step. `--help` once for real CLI doubt.

**Scope and bytes.** Declare every source/page/data path in `target_paths`, including inputs needed
to detect stale evidence. The writer enrolls only canonical builder outputs it sees change; a new
unrelated dirty path is preserved and reviewed, never auto-staged or hidden. Preserve newline style
(`dentcast_text_io.write_text` / `text_io.mjs`). **A data file is never re-serialised whole**:
`plus/des-scores.json` and `dentcast-brain.json` have mixed endings on purpose and a whole-file
`json.dumps` would silently rewrite thousands of lines, so `write_text` refuses them. Insert with the
byte-preserving editors in the same module — `read_raw`, then `json_append` (a record or array item),
`json_replace_scalar` (a counter) or `json_replace_value` (one list), then `write_raw` — never a
hand-rolled byte edit. A stale or missing receipt is a current-run repair, never permission to scan
branches or to
invent past outcomes.

**Invalidation (same run, no extra delivery).** Bind each local input as `{"path": "inputs/paper-1.pdf",
"sha256": "<sha>"}` in `context.inputs` (neutral names; bytes stay local). Changed bound bytes, a
changed workflow rule or an effective change to the primary page's text blocks writes until:

```bash
python3 tools/dentcast_publish_handoff.py invalidate --expected-sha256 <digest> --from-step <first-affected-step> --reconcile-note '<actual dependency review>'
```

Workflow changes invalidate from `rules`; an approved-page edit from `C.2`. Superseded evidence stays
in the append-only `dependency_invalidation_v1` audit; approvals return to `pending` and are restored
only with real evidence. Re-run what the invalidation reopened, including real Phase F. A reconcile
note is not replacement evidence.

## Delivery cuts 1 and 2

```bash
python3 tools/dentcast_publish_handoff.py stage-delivery --expected-sha256 <digest> --path <scoped-path>   # repeat --path
```

`stage-delivery` stages the scoped work, refreshes the checkpoint in the index, stages the handoff
and runs the pre-commit guard; it refuses paths outside the publication or bytes the checkpoint has
not recorded. It never commits or pushes. Then one commit and one push, and a fresh remote read-back
(`inspect --check-remote`). A failed push blocks the cut; retrying the same delivery is not a new
milestone; never pretend a push succeeded or force-push.

After a delivered cut the first write is starting the next step; anything else is refused with
`RECORD_AFTER_DELIVERED_CUT_START_NEXT_STEP_FIRST`. A handoff changed after the push makes the next
step and the Stop guard refuse with `PREVIOUS_STEP_HANDOFF_NOT_DELIVERED`: restore it
(`git restore .dentcast/PUBLISH-HANDOFF.md`), start the next step, record again.

**What the writer validates at cut 1** (and every later cut): zero unanswered `pending_questions`,
no unconfirmed/rejected approval, and exactly one `context.decisions` entry
`kind="first_cut_lead_provenance_v1"` with a real `source_ref` and nonempty evidence, recorded **after
C.4.13 and before C.4.9** (the lead is locked text; recording it earlier makes a Part 3b fix invalidate
the `authored-intro` approval). `origin`: `author_original` (founder's own first paragraph);
`agent_authored` (agent's lead, plus approval `scope="authored-intro"`, `status="confirmed"`, whose
evidence is the standing-acceptance record); `not_applicable` (reviewed exception, reason in
`source_ref`).

**What the writer validates at cut 2** (and at completion): one `second_cut_editorial_lock_v1`
decision with all ten scopes, each `resolved` or `not_applicable` with a real reference:

```json
{"kind": "second_cut_editorial_lock_v1",
 "scopes": [{"scope": "scientific", "status": "resolved", "evidence": ["…"]},
            {"scope": "challenge"}, {"scope": "taxonomy"}, {"scope": "links"}, {"scope": "hashtags"},
            {"scope": "content_record"}, {"scope": "pathways"}, {"scope": "pulse"},
            {"scope": "english"}, {"scope": "author_approvals"}],
 "english": {"status": "ready", "path": "insight/en/insightNN.html", "evidence": ["…"]},
 "evidence": ["…"]}
```

Schema only; every scope carries its own `status` and `evidence`. English: LiteCast or Challenge →
`exempt`, path `null`, evidence; every other page → `ready`, mirror path in `target_paths`, file on
disk. `C.4.14` `completed` only with real `data-dc-challenge-question` markup; an ordinary post
records it `skipped`. Both `title` and `caption` are in `context.approvals`: `confirmed` with the
exact text in `decision` and its evidence (founder data, or standing acceptance for an agent
proposal), or `not_required` with a decision and evidence; at least one is `confirmed` so Phase F has
exact text. Missing either blocks cut 2. The runner reads these frozen records and never prompts.

## After Push 2 — nothing is the agent's

The runner (`post-cut2-mechanical.yml`, from the exact Push-2 commit) does C.8, C.7, D (technical),
E, real Phase F, G, delivery 3 and opens the PR (with the `QUEUE_PUBLISH_TOKEN` secret; a queue item's
PR comes from `queue-publish.yml`). Before Phase F it refuses a regenerated page that lost or lowered a
`?v=` stamp (`ASSET_VERSION_REGRESSION`). The agent does not run C.8 onward locally.

Immediately after Push 2 is confirmed, one message: the agent-side work has reached Push 2, GitHub
Actions is running the remaining mechanical delivery, the agent is monitoring it; branch, Push-2 SHA
and run link when available, **plus the agent's report**: the standing-acceptance list (what was
applied, what was skipped and why), every M1/M3b/M2 question with its answer, the orphan sentences
of the Fidelity sweep, and any real decision asked. Report G, written by the runner's `finish`, is
technical only (ledger, Phase F, fingerprints) and deliberately omits approvals; the agent's Push-2
report is the only human record of them. Not a completion claim. **Then read `publish-after-push2.md`
completely** and follow it. Three messages in all after Push 2: at Push 2, at the run's end, at
merge. A mechanical step that reveals a needed substantive change stops the run's path: invalidate,
never fix silently in D or F.

## Paper-only (one delivery)

No page, no DES cut, no English, no brain entry. Ledger: `rules`, `0`, paper Parts 1/2, `G`. After
Parts 1/2: `verify --expected-sha256 <digest> --catalog-id <P-id>` (rechecks the catalog entry,
Drive-link identity and the completed Drive-action receipt; the agent still verifies the real upload,
folder and schema). After G record `context.delivery` (scope + evidence of the Drive filing) — else
`DELIVERY_EVIDENCE_REQUIRED`. `stage-delivery` the catalog work and handoff, commit and push once,
then `finish`, commit/push only the handoff deletion, `confirm-cleanup`. The Stop guard blocks between
that push and `finish`. If that final delivery fails, `restore-cleanup` restores the same local handoff
(it removes only its own unchanged receipt and report); retry the same push, never a new commit.

## Phase F, DES exemptions, completion receipt

The helper's Phase F command (runner, and guarded recovery only):

```bash
python3 tools/dentcast_publish_handoff.py verify --expected-sha256 <digest> --expect-title '<exact title>' --expect-caption '<exact caption>'
```

It runs `tools/verify_publish.py` on the one content ID, never `--all`/`--last`. Omit an expectation
only when no exact string exists; never derive one from the rendered page. It records exit code,
output digest and summary; warnings are read, not suppressed.

Phase F fails on absent DES unless the page is LiteCast/Challenge or `.dentcast/des-exemptions.json`
holds a content-specific entry (publication metadata; never in `plus/des-scores.json`):

```json
{"sharehub/share-N": {"content_id": "sharehub/share-N",
  "page_sha256": "SHA256 of the final UTF-8 page text",
  "reason": "founder_without_des",
  "approval": {"status": "confirmed", "decision": "exact scope of the founder's decision",
               "evidence": ["public-safe reference"]}}}
```

`unsourced_audio_caption` is the other reason, only for an episode whose audio-only/caption status
was explicitly confirmed. Neither is inferred from missing results or copied from another page.
`page_sha256` = `hashlib.sha256(Path(page).read_text(encoding="utf-8").encode("utf-8")).hexdigest()`
of the page delivered at C.6; Phase F also accepts it plus only the single Phase E `dc-notify`
marker. A later page change invalidates the entry. Add the registry to `target_paths` when used.

An absent Fidelity field or null source slot must meet the source exceptions (COMMENTARY, source
errors, pre-3.1 NOT_APPRAISABLE) or a freshly computed zero-unit SOURCE assignment from
`des_fidelity_units.py`; a manual "no units" claim does not count; CITATION_ONLY (v3.1+) still needs
the `INSUFFICIENT_TEXT` object. Missing assignment evidence fails closed. Founder-supplied results:
module 08 only.

`.dentcast/publication-reports/<content-id>.completion.json` (completed-only receipt: finished ledger,
final fingerprints, the second-delivery commit) and the technical report
`.dentcast/publication-reports/<category>-<id>.md` are written by `finish` in the runner and share
delivery 3 with the handoff deletion. Status before `confirm-cleanup` is `cleanup_pending_delivery`,
never success. The helper never commits, pushes or deploys; its checks cannot prove private
approvals, semantic quality or external outcomes. A stale/missing/corrupt state is not success.

## Waiting, services, merge

- A real wait: report the step, the pending result and whether it blocks; continue independent work;
  refresh only the relevant result after a plausible change. Never poll every PR/check after each
  step.
- Before merge, freshly read the exact PR, its head/base SHAs and branch:
  `check-pr --repository owner/repo --number N --expected-head SHA --expected-base SHA
  --expected-branch BRANCH [--token-env NAME]` (or the same reads through connected GitHub tools).
  A moved ref or closed PR: preserve work, re-plan, never force.
- Merge only with authorization. An explicit «بعد از تکمیل مرج کن» persists until all gates pass;
  status requests do not revoke it. Without it, stop before merge. Distinguish prepared, verified,
  committed, pushed, merged and live; no invented ETA.
- Hosting (only home): DentCast is served from ArvanCloud and GitHub Pages (`dentcast.org`/`www` are
  CNAMEs to `dentcast-hub.github.io`, via Cloudflare DNS). Cloudflare Pages and Vercel are backup
  mirrors: their statuses are never requested, awaited, a gate or a completion criterion. A merge
  GitHub refuses over an unrelated required check is reported as that blocker; branch protection is
  never weakened.

Hooks and CI behind this protocol: `publish-maintenance.md` (only when changing hooks, CI or this
protocol).
