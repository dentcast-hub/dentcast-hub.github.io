# DentCast Publishing — modular LIVE router

> **Publish-queue check — first.** If this publication was requested from the publish queue («صف انتشار», branch `queue`), this router is not the route: publishing an item from the queue reads only `.dentcast/workflows/queue-route.md`; preparing one or reporting the queue reads `.dentcast/workflows/publish-queue.md`. Only a category the queue tool refuses (`CATEGORY_UNSUPPORTED`) comes back here, with the item's files as the founder's input.

**LIVE_MODULAR_PUBLISHING_ENABLED.** The twelve active modules below are the new-publication execution contract. Legacy files are backup only; do not read them for execution, fallback, or conflict resolution. No approval, exception, scientific requirement or mandatory validation is waived.

**Interrupted publication** («انتشار ناقص داشتم»), the run state `.dentcast/PUBLISH-HANDOFF.md` and recovery through `.dentcast/workflows/publish-handoff.md`: `publish-checkpoints.md`, «Interrupted publication».

## Always-load before routing

Read `.dentcast/workflows/global/README.md` and the complete active sections it selects for the current edit scope, the complete `.dentcast/workflows/agent-parity.md`, `publish-checkpoints.md`, and complete `modules/01-hard-rules.md` and `modules/02-routing-intake.md`. Detailed triggers: `.dentcast/workflows/routing-details.md`.

**Authority** (stated only here): applicable canonical workflow and active modules > active shared global rules > agent-parity > client summaries. User instructions take priority. Surface a genuine active-rule conflict; never fall back to backups.

## Byte-exact readpack (optional, after locked Phase B)

The only home of the readpack rules. After Phase B category, Question 4.7 (paper attached?) and Question 4.9 (Challenge?) are actually locked, a local checkout MAY run the deterministic selector instead of reading whole modules:

```bash
python3 tools/dentcast_publish_readpack.py \
  --category sharehub --attached-paper no --challenge no --after-intake \
  --output /tmp/dentcast-readpack.txt --manifest /tmp/dentcast-readpack.json
```

- Arguments are only verified, locked intake facts; anything unsettled is `unknown` (that module stays full text).
- The pack copies applicable source bytes verbatim and omits only category-inapplicable branches; an omitted step still needs its canonical SKIP reason in the ledger.
- Read each module's ranges completely, in bounded chunks, at the moment `publish-checkpoints.md` («Just-in-time loading») names for that module; keep the manifest and source hashes.
- `--after-intake` is legal only if this router, the global router and selected sections, agent-parity, `publish-checkpoints.md` and modules 01/02 were read completely earlier in this same session and revision; omit it for a self-contained pack.
- A changed source reverts that module to full text; regenerate. Never reuse a pack after its source revision or locked intake changed. If the selector, provenance, revision or category is uncertain, read the original full modules.
- The pack never loads specialty workflows, dynamic global sections or scientific prompt files; those stay separately required. It performs no step, grants no approval and writes only its two temporary files.

## New-publication dispatch

1. Classify text, attached paper, category, media and scientific basis with Phase 0/A/B of module 02.
2. Read every applicable rule in full, from the module or the readpack, from these modules:
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

   File numbers are not the execution order. Execute in the ledger order of `publish-checkpoints.md` («Order, messages, text lock, deliveries»): paper ingestion (06) and DES/Fidelity (08) run before links (05) and flashcards/FAQ (07). Read each module just before its first step.
3. Agent proposals are built, recorded and reported, never sent for confirmation; the founder gets at most three messages (M1 open facts, M3b still-flagged Part 3b sentences at C.4.13, M2 exam questions) plus the real decisions listed in `publish-checkpoints.md`; the agent's Push-2 report lists every proposal and answer.
4. Close all authoring, semantic judgments, DES/Fidelity, the authored English mirror (unless LiteCast/Challenge) and every founder message **through C.6**, write the ten-scope editorial lock, then Push 2. After Push 2 the runner does C.8, C.7, D, E, F, G and opens the PR; the agent monitors (`publish-after-push2.md`).
5. Respect every category exception, semantic decision, founder decision, builder order, versioning and complete Phase F. A skipped module needs its canonical exemption and a recorded reason; "not loaded" is not an exemption.
6. Use actual tools. Report a missing capability or failed gate; never substitute simulated scientific results, synthetic receipts or Boolean assertions. Staging tools are not the live handoff or publishing engine.
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
| External Fidelity | `.dentcast/workflows/external-fidelity.md` |
| Publish queue on branch `queue` (prepare, status) | `.dentcast/workflows/publish-queue.md` |
| Publish an item from the queue (publish day) | `.dentcast/workflows/queue-route.md` (only this) |

Detailed triggers and specialty conditions: `.dentcast/workflows/routing-details.md`. Read the selected specialty workflow completely. New content uses the modular sequence, including paper-only and category exceptions.

## Checkpoints, deliveries, completion

`publish-checkpoints.md`: ledger, the founder messages, text lock, the three deliveries, hosting and merge. Hashes or checkpoints alone are not publication.
