# DentCast Publishing — modular LIVE router

**LIVE_MODULAR_PUBLISHING_ENABLED.** The twelve active modules below are the new-publication execution contract. Legacy files are backup only; do not read them for execution, fallback, or conflict resolution. No approval, exception, scientific requirement or mandatory validation is waived.

## Interrupted publication

For «انتشار ناقص داشتم» or an explicit request to resume a publication the user identifies as incomplete/interrupted, read `.dentcast/PUBLISH-HANDOFF.md` exactly once, then `.dentcast/workflows/publish-handoff.md`. A generic «ادامه بده» or «ادامه انتشار» alone does not trigger recovery. During the active run, keep state in the current session and do not reread the handoff before each step; use the latest helper digest. Before a new publication, check only whether the file exists. If it does, make no changes and ask whether the user means to resume; read it only after explicit confirmation. Never overwrite unfinished work. Update the handoff after every canonical step and before handing off; delete it only after verified completion. A missing file or unavailable work must be reported, not invented. Local commits and dirty files are not automatically available in another checkout.

## Always-load before routing

Read `.dentcast/workflows/global/README.md` and its three complete active global rule files, the complete `.dentcast/workflows/agent-parity.md`, and complete `modules/01-hard-rules.md` and `modules/02-routing-intake.md`. For detailed routing triggers use `.dentcast/workflows/routing-details.md`.

Authority: applicable canonical workflow and active modules > active shared global rules > agent-parity > client summaries. User instructions take priority. Surface genuine active-rule conflicts; do not silently fall back to backups.

## New-publication dispatch

1. Classify text, attached paper, category, media and scientific basis using Phase 0/A/B in module 02, including all required approvals.
2. Execute original canonical steps, loading each FULL applicable module immediately before its step, in this order:
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

3. Respect all category exceptions, semantic decisions, founder approvals, original builder ordering, English mirror, notices, versioning and complete Phase F. At step 4.13, use a complete, validated founder-supplied DES/Fidelity result packet for this publication without rerunning its calls; if no packet is supplied, follow the full source-dependent procedure in module 08. A skipped module requires its canonical exemption and a recorded reason; "not loaded" is not an exemption.
4. Use actual approved tools. Report missing capabilities or failed gates; do not substitute simulated scientific results, synthetic receipts or Boolean assertions.
5. Maintain the fixed temporary handoff under `publish-handoff.md`. Optional staging tools (`tools/dentcast_stage3_route.py`, `tools/dentcast_stage3_orchestrator.py`, `tools/dentcast_stage6_handoff.py`, `tools/dentcast_github_memory.py`, `tools/dentcast_fidelity_resume.py`) are development aids, not the live handoff or publishing engine. Their staging restrictions remain in force.
6. Keep private/restricted material out of public history. No arbitrary branch merges or inferred approval.

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

## Completion

Complete all applicable actions and approvals, verify Phase F and required delivery, provide the final report, then remove the temporary handoff as the completion contract specifies. Hashes or checkpoints alone are not publication. Read `publish-checkpoints.md` for coherent delivery batches and guarded cleanup, and `publish-discovery.md` for remote recovery. `PUBLISHING-FINAL-REPORT.md` records delivered repair stages, integrated acceptance and the native-client/live-publication limits; main integration is tracked in [PR #914](https://github.com/dentcast-hub/dentcast-hub.github.io/pull/914). Existing clones must update to a revision containing these changes.

## Per-step checkpoints and delivery batches

Read `.dentcast/workflows/publish-checkpoints.md`. Use the full canonical ledger from `tools/dentcast_publish_handoff.py plan`; write `started` before each action and its actual result afterward using `step`/`record`. Phase F uses the real `verify` command. Completion is `finish`, authorized cleanup commit/push, then `confirm-cleanup`; restore the same fixed handoff with `restore-cleanup` if cleanup fails. Hooks are supplemental and never mark scientific or semantic work complete.
