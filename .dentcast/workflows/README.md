# DentCast Publishing — modular STAGING router

**STAGING_ONLY_NO_LIVE_PUBLISH — FEATURE BRANCH ONLY.** The original complete 2,598-line contract was preserved without changes at [README.legacy.md](README.legacy.md). The 12 exact verbatim source slices are documented in [modules/INDEX.md](modules/INDEX.md). This router is not authorized for real publishing, live page changes, deployment, admin calls or merge.

## Always-load contract before routing

Read your entire applicable legacy client rules (`CLAUDE.legacy.md` or `AGENTS.legacy.md`, including §§6–8, and archived Cursor rule if applicable), **all** of `.dentcast/workflows/agent-parity.md`, **all** of [modules/01-hard-rules.md](modules/01-hard-rules.md), and **all** of [modules/02-routing-intake.md](modules/02-routing-intake.md). Maintain original source precedence: original complete [README.legacy.md](README.legacy.md) > global agent rules > shared parity > client summaries. Do not drop an invariant to save context.

## New-publication dispatch (SANDBOX only)

1. Resolve new publishing versus specialty work; identify has_text, has_paper, actual category and challenge decision without guessing. In particular paper-only is a distinct route.
2. For synthetic inputs, compile a read-only ordered plan using `tools/dentcast_stage3_route.py`. Its `compiled_staging_requires_operator` status does NOT mean execution is permitted. Follow `tools/dentcast_stage3_orchestrator.py` and `tools/dentcast_stage6_handoff.py` for validated per-step task and receipt handoff.
3. After the always-read 01/02, read the FULL text of each applicable slice immediately before that stage, in original order:
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
4. Every canonical step, skip and human approval must be resolved explicitly. Never skip semantic analysis because a cloned page lacks links. Preserve last-position flat-brain append, LiteCast `.ir` isolation, Challenge secrecy, source-dependent DES, bilingual exemptions, original builder/stamper ordering, exact title/caption and final original Phase F.
5. DES/Fidelity remains an **opaque original scientific subsystem** (unchanged prompt/engine `tools/des_fidelity_units.py`). Synthetic cross-client recovery may use `tools/dentcast_github_memory.py` and `tools/dentcast_fidelity_resume.py` with original input/output fingerprints, never private/licensed material in public Git.
6. **Stop at the staging boundary:** no real content, production builders, external Drive/Admin/notifications, publication, push or main merge; no claimed complete behavioral parity without the seven Stage 9 external gates.

## Other requests (unchanged specialty routes)

Existing-page English → `en-version.md`; ads → `ads.md`; ad stats → `spot-report.md`; glossary text drafting → `.claude/skills/glossary-writer/SKILL.md`; existing-page glossary cross-link → `cross-link.md`; new section → `new-section.md`; offline planning → `.dentcast/offline-publish.md`; external Fidelity → `external-fidelity.md`. Trigger selection remains in the preserved legacy client instructions.

## Verification and rollback

The source of truth for 12 exact slices and Stage 2/7 text parity is now **`README.legacy.md`**, not this router. The original Claude, AGENTS, Cursor and parity rules are archived alongside it. Use [modules/AGENT-ENTRYPOINT-STAGING.md](modules/AGENT-ENTRYPOINT-STAGING.md) and [modules/CROSS-AGENT-HANDOFF.md](modules/CROSS-AGENT-HANDOFF.md) for resume steps; success is staging-only. Rollback is a coordinated restoration of every legacy counterpart — never a partial renaming or a silent cutover.
