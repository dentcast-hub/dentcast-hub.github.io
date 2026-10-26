# DentCast Publishing — modular LIVE router

**LIVE_MODULAR_PUBLISHING_ENABLED.** The twelve active modules below are the new-publication execution contract. Legacy files are backup only; do not read them for execution, fallback, or conflict resolution. No approval, exception, scientific requirement or mandatory validation is waived.

## Connected first-cut metadata, opt-in

The no-checkout metadata-only adapters are documented in
`.dentcast/workflows/connected-github-handoff.md`. They serialize
the **existing** canonical v3 handoff and do not replace any publishing
module, scientific checker, review gate, or founder approval. A GitHub
connector by itself does not prove the JavaScript/Python adapter can be
executed or that the intended bytes were delivered. Push 1 is a
durability boundary only; the current agent continues normally after
remote read-back, with optional user-initiated handoff. The connected-only metadata adapters
currently stop at the first cut: they are not a terminal-free engine for
DES/Fidelity, builders, Phase F or subsequent deliveries. See
`connected-github-postcut-status.md` for the measured limits and the
non-mandatory continuation/handoff distinction.

## Interrupted publication

The permanent execution guide is `publish-checkpoints.md`; the temporary current-run state is `.dentcast/PUBLISH-HANDOFF.md`; `publish-handoff.md` and `publish-discovery.md` describe explicit recovery. These are different roles. In a continuing active session, «کجایی؟», «چی شد؟», «ادامه بده» and «ادامه انتشار» are status/continuation requests: answer directly and continue from the current ledger and last valid tool digest. Missing receipts, stale checkpoints and module cross-references do not authorize recovery or branch scans. Read each required complete source once per unchanged revision in the continuous run; follow the execution/delivery discipline in `publish-checkpoints.md`. Infrastructure-only work does not initialize a publication.

For «انتشار ناقص داشتم» or an explicit request to resume a publication the user identifies as incomplete/interrupted, read `.dentcast/PUBLISH-HANDOFF.md` exactly once, then `.dentcast/workflows/publish-handoff.md`. A generic «ادامه بده» or «ادامه انتشار» alone does not trigger recovery. During the active run, keep state in the current session and do not reread the handoff before each step; use the latest helper digest. Before a new publication, check only whether the file exists. If it does, make no changes and ask whether the user means to resume; read it only after explicit confirmation. Never overwrite unfinished work. Update the handoff after every canonical step and before handing off; delete it only after verified completion. A missing file or unavailable work must be reported, not invented. Local commits and dirty files are not automatically available in another checkout.

## Always-load before routing

Read `.dentcast/workflows/global/README.md` and the complete active sections selected by that router for the current edit scope, the complete `.dentcast/workflows/agent-parity.md`, and complete `modules/01-hard-rules.md` and `modules/02-routing-intake.md`. For detailed routing triggers use `.dentcast/workflows/routing-details.md`.

Authority: applicable canonical workflow and active modules > active shared global rules > agent-parity > client summaries. User instructions take priority. Surface genuine active-rule conflicts; do not silently fall back to backups.

## Optional byte-exact readpack after locked Phase B

To reduce avoidable context loading, after completing and actually locking Phase B
category, Question 4.7 (paper attached?), and Question 4.9 (Challenge?), a local
checkout agent MAY use the deterministic reading selector. Always read this router,
the global router/selected complete global sections, agent-parity, checkpoint
protocol, and full modules 01/02 first. Then, in that same unchanged session:

```bash
python3 tools/dentcast_publish_readpack.py \
  --category sharehub --attached-paper no --challenge no --after-intake \
  --output /tmp/dentcast-readpack.txt --manifest /tmp/dentcast-readpack.json
```

Replace arguments only with verified, locked intake facts; use `unknown` if
anything remains unsettled. Read all selected source ranges from the pack in
bounded chunks and retain the manifest/source hashes. The selector copies
applicable source bytes verbatim, not summaries. It omits only explicitly
category-inapplicable branches; omitted steps still require their actual
canonical ledger SKIP reason. Changed pinned source files automatically
fall back to full-file reading. If the selector, provenance, source revision,
category or tool capability is uncertain, read original full applicable modules
instead. Regenerate/read any changed dependency before using its rules.

The `--after-intake` switch is legal **only** if those six introductory sources
were fully read earlier in this same session/revision. Omit that switch for a
self-contained full pack. Required specialty workflows, dynamic global sections,
scientific prompt files, original DES/Fidelity independence, human approvals,
the three delivery cuts, builders, and full Phase F remain mandatory. This
readpack performs no semantic/scientific step, grants no approval, and writes
only the chosen local temporary reading/manifest files.

## New-publication dispatch

1. Classify text, attached paper, category, media and scientific basis using Phase 0/A/B in module 02, including all required approvals.
2. Execute original canonical steps, reading every applicable rule in full either directly from its module or via the verified, byte-exact post-intake readpack (above), in this order:
   - `modules/01-hard-rules.md`
   - `modules/02-routing-intake.md`
   - `modules/03-litecast-and-page.md`
   - `modules/04-taxonomy-and-navigation.md`
   - `modules/05-semantic-linking.md`
   - `modules/06-paper-ingestion.md`
   - `modules/07-flashcards-and-quiz.md`
   - `modules/08-des-fidelity.md`
   - `modules/09-challenge.md`
   - `modules/10-brain-and-pathways.md`
   - `modules/11-build-and-version.md`
   - `modules/12-english-notify-verify.md`

3. For newly initialized v2 publications, complete all authoring,
semantic judgments, DES/Fidelity and human approvals **through C.6**
before second Push. This includes the authored English mirror + reciprocal
toggle when the category needs one; Phase D's technical verification stays
after builders. Before resolving C.6, write the full ten-scope editorial
lock specified in `publish-checkpoints.md`. The mechanical cut2 gate
enforces it. Previous v1-only handoffs retain the original C.4.13 cut.
4. Respect all category exceptions, semantic decisions, founder approvals, original builder ordering, English mirror, notices, versioning and complete Phase F. At step 4.13, validate and reuse a founder-supplied DES score with its complete canonical JSON for this exact page **without rerunning DES**. Independently reuse supplied valid Fidelity JSON; if only DES was supplied, run only any owed Fidelity. Reject mismatched/incomplete supplied results rather than silently rescoring. If neither is supplied, use the canonical source-dependent procedure in module 08; Part 3, founder decisions and Phase F remain mandatory. A skipped module requires its canonical exemption and a recorded reason; "not loaded" is not an exemption.
5. Use actual approved tools. Report missing capabilities or failed gates; do not substitute simulated scientific results, synthetic receipts or Boolean assertions.
6. Maintain the fixed temporary handoff under `publish-handoff.md`. Optional staging tools (`tools/dentcast_stage3_route.py`, `tools/dentcast_stage3_orchestrator.py`, `tools/dentcast_stage6_handoff.py`, `tools/dentcast_github_memory.py`, `tools/dentcast_fidelity_resume.py`) are development aids, not the live handoff or publishing engine. Their staging restrictions remain in force.
7. Keep private/restricted material out of public history. No arbitrary branch merges or inferred approval.

## Routes

| Request | Active workflow |
|---|---|
| New content or attached paper (with or without text) | `.dentcast/workflows/README.md` |
| Existing-page English | `.dentcast/workflows/en-version.md` |
| Ads | `.dentcast/workflows/ads.md` |
| Ad statistics | `.dentcast/workflows/spot-report.md` |
| Glossary authoring | `.claude/skills/glossary-writer/SKILL.md` |
| Cross-linking | `.dentcast/workflows/cross-link.md` |
| New section | `.dentcast/workflows/new-section.md` |
| Offline publishing | `.dentcast/offline-publish.md` |
| External Fidelity | `.dentcast/workflows/external-fidelity.md` |

Detailed triggers and specialty conditions: `.dentcast/workflows/routing-details.md`. Read the selected specialty workflow completely. New content uses the modular sequence, including paper-only and category exceptions.

## Publication services and waits

`publish-checkpoints.md` defines the actual service/check scope and wait policy.
The real destinations are ArvanCloud and GitHub Pages (proxied through Cloudflare DNS). Cloudflare Pages
and Vercel are backups only: their statuses are never a publishing gate.

## Completion

Complete all applicable actions and approvals, verify Phase F and required delivery, provide the final report, then remove the temporary handoff as the completion contract specifies. Hashes or checkpoints alone are not publication. Read `publish-checkpoints.md` for the three fixed deliveries and guarded completion, and `publish-discovery.md` for remote recovery. `PUBLISHING-FINAL-REPORT.md` records delivered repair stages, integrated acceptance and the native-client/live-publication limits; main integration is tracked in [PR #914](https://github.com/dentcast-hub/dentcast-hub.github.io/pull/914). Existing clones must update to a revision containing these changes.

## Per-step checkpoints and delivery batches

Read `.dentcast/workflows/publish-checkpoints.md`. Use the full canonical ledger from `tools/dentcast_publish_handoff.py plan`; write `started` before each action and its actual result afterward using `step`/`record`. Prefer `advance` for separate durable transitions in one call; in a local Git checkout before Push 1, prefer the bounded Fast Local WAL (flush/reconcile at dependency changes and mandatory gates, with the existing byte limit) for deferred heavy snapshots. Page publications have **exactly three deliveries**: (1) after page construction and semantic linking (`C.4.9`), (2) after `C.6`, once DES/Fidelity, Challenge, hashtags, content record, pathways, Pulse, the authored English mirror and every founder approval are closed (v1-only handoffs started earlier keep `C.4.13`), (3) after C.8 builders, C.7 stamp, technical D, E, real Phase F and report G. Deliver work plus the latest handoff at cuts 1 and 2; keep intermediate checkpoints local. For v2 runs the `post-cut2-mechanical.yml` GitHub workflow produces delivery 3 from the exact Push-2 commit: do not run C.8 onward locally; monitor that run and use its guarded recovery only if it fails. Otherwise, at cut 3 run `finish`, then commit/push final work, the completion receipt and handoff deletion together, and run `confirm-cleanup`. Never push a completed final handoff or a fourth cleanup commit. Stops, agent switches, approvals and external actions do not add deliveries. Restore locally with `restore-cleanup` if final delivery fails. Paper-only and pre-existing runs retain their documented compatibility path. Hooks supplement this contract and never certify semantic or scientific results.
