# DentCast Publishing — modular LIVE router

> **Publish-queue check — first.** If this publication was requested from the publish queue («صف انتشار», branch `queue`), this router is not the route: publishing an item from the queue reads only `.dentcast/workflows/queue-route.md`; preparing one or reporting the queue reads `.dentcast/workflows/publish-queue.md`. Only a category the queue tool refuses (`CATEGORY_UNSUPPORTED`) comes back here, with the item's files as the founder's input.

**LIVE_MODULAR_PUBLISHING_ENABLED.** The twelve active modules below are the new-publication execution contract. Legacy files are backup only; do not read them for execution, fallback, or conflict resolution. No approval, exception, scientific requirement or mandatory validation is waived.

**Interrupted publication** («انتشار ناقص داشتم»), the run state `.dentcast/PUBLISH-HANDOFF.md` and recovery through `.dentcast/workflows/publish-handoff.md`: `publish-checkpoints.md`, «Interrupted publication».

## Reading: one pack per publication

A publication reads one file. Settle the four intake facts the selector takes (category; paper attached; Challenge; DES basket: `commentary` for the founder's own experience with no cited source, `research` otherwise), then:

```bash
python3 tools/dentcast_publish_readpack.py --category <cat> --attached-paper <yes|no> \\
  --challenge <yes|no> --des-basket <commentary|research> [--isolated-call yes] [--sources one] \\
  --output <scratch>/pack.txt --manifest <scratch>/pack.json
```

Read `pack.txt` once, top to bottom, in bounded chunks, before the first write. It carries, copied byte for byte, this router, the global rules of a page publication, `agent-parity.md`, `publish-checkpoints.md`, modules 01 and 02 and the parts of modules 03–12 that apply. No other rule file is opened; a tool that refuses names the one file to read.

- A fact that is not settled is `unknown`; the module it decides is then carried whole.
- `--isolated-call yes`: the agent runs each DES/Fidelity call itself in a separate context and the founder supplied no result; the relay and supplied-result paths are left out. `--sources one`: the page cites exactly one source; the orphan sweep is left out. Either is given only when certain.
- A step the pack leaves out still takes its canonical SKIP reason in the ledger; the manifest's `selection_reason` is that reason.
- Module 11 is carried above its `module-11-boundary` marker and module 12 through Phase D: the rest is the runner's.
- A changed source or intake fact: build the pack again and read what changed.
- Scientific prompt files are not in the pack: an isolated model call takes them by path (module 08). A specialty route reads its own workflow file.
- The pack performs no step and grants no approval.

Any other content change reads `.dentcast/workflows/global/README.md`, the sections its selector picks for the edited paths, and `.dentcast/workflows/agent-parity.md`.

**Authority** (stated only here): applicable canonical workflow and active modules > active shared global rules > agent-parity > client summaries. User instructions take priority. Surface a genuine active-rule conflict; never fall back to backups.

## New-publication dispatch

1. Classify text, attached paper, category, media and scientific basis with Phase 0/A/B of module 02.
2. The pack carries the applicable rules of these modules:
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

   File numbers are not the execution order. Execute in the ledger order of `publish-checkpoints.md` («Order, messages, text lock, deliveries»): paper ingestion (06) and DES/Fidelity (08) run before links (05) and flashcards/FAQ (07).
3. Agent proposals are built, recorded and reported, never sent for confirmation; the founder gets at most two messages (M1 open facts, M2 exam questions) plus the real decisions listed in `publish-checkpoints.md`; the agent's Push-2 report lists every proposal and answer.
4. Close all authoring, semantic judgments, DES/Fidelity, the Persian-only language state (Hard Rule 12) and every founder message (M1, M2, each only when it has content) **through C.6**, write the ten-scope editorial lock, then Push 2. After Push 2 the runner does C.8, C.7, D, E, F, G and opens the PR when the `QUEUE_PUBLISH_TOKEN` secret is configured (otherwise the agent or the founder opens it by hand); the agent stops at Push 2 and `publish-auto-merge.yml` merges the PR when green.
5. Respect every category exception, semantic decision, founder decision, builder order, versioning and complete Phase F. A skipped module needs its canonical exemption and a recorded reason; "not loaded" is not an exemption.
6. Use actual tools. Report a missing capability or failed gate; never substitute simulated scientific results, synthetic receipts or Boolean assertions. No staging, draft or legacy tool exists in the tree (an older version lives only in Git history and is never execution authority); the live engine is `dentcast_publish_handoff.py`, `dentcast_publish_lifecycle.py` and `dentcast_post_cut2_runner.py`.
7. Keep private/restricted material out of public history. No arbitrary branch merges, no inferred approval.

## Routes

| Request | Active workflow |
|---|---|
| New content or attached paper (with or without text) | `.dentcast/workflows/README.md` |
| Existing-page English | `.dentcast/workflows/en-version.md` |
| Ads | `.dentcast/workflows/ads.md` |
| Ad statistics | `.dentcast/workflows/spot-report.md` |
| Glossary authoring | `.claude/skills/glossary-writer/SKILL.md` (Codex/GPT: the byte-identical `.agents/skills/glossary-writer/SKILL.md`) |
| Cross-linking | `.dentcast/workflows/cross-link.md` |
| New section | `.dentcast/workflows/new-section.md` |
| Offline publishing | `.dentcast/offline-publish.md` |
| Minimal publications from /admin (setup, import into git, completion) | `.dentcast/quick-publish.md` |
| External Fidelity | `.dentcast/workflows/external-fidelity.md` |
| Publish queue on branch `queue` (prepare, status) | `.dentcast/workflows/publish-queue.md` |
| Publish an item from the queue (publish day) | `.dentcast/workflows/queue-route.md` (only this) |

Detailed triggers and specialty conditions: `.dentcast/workflows/routing-details.md`. A specialty route reads its own workflow file. New content uses the modular sequence, including paper-only and category exceptions.

## Checkpoints, deliveries, completion

`publish-checkpoints.md`: ledger, the founder messages (at most two), text lock, the save point and the deliveries, hosting and merge. Hashes or checkpoints alone are not publication.
