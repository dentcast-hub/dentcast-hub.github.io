# Publishing stage router — DESIGN ONLY (NOT ACTIVE)

> This file is a proposed *execution map*, **not** a replacement for the canonical `../README.md`. Until explicit activation and parity testing, always follow the existing entrypoints and read-all requirements.

## Boot sequence (proposed after activation)

1. Read the **approved complete global invariant contract** and agent parity. Do not use this short map as a substitute for global rules. The current global contract is distributed across `CLAUDE.md`, `AGENTS.md`, `../README.md` hard rules, and `../agent-parity.md`; extracting and verifying a smaller global contract is a prerequisite.
2. Identify route: new publication vs. English-only vs. ads/reporting vs. cross-link vs. glossary vs. external fidelity. **This router applies only to new publication.**
3. Read `01-hard-rules.md` and `02-routing-intake.md` fully. Resolve approvals and input metadata before any write.
4. Load each applicable stage **in execution order** from the manifest below. Read each selected stage in full immediately before executing it; do not assume it is covered by the summary.
5. Load referenced authoritative specialty workflows on demand (e.g. English version, cross-link, DES spec, challenge handoff). Never replace their content with a summary.
6. Resolve all mandatory stages and skips explicitly; run the final mechanical gate; only report completion on success.

## Stage manifest

| Order | Stage | Module | When | Main dependencies |
|---|---|---|---|---|
| 0 | Global hard rules | `01-hard-rules.md` | Always | Global repo invariants |
| 1 | Routing / discovery / intake | `02-routing-intake.md` | Always | User input, brain, category precedent |
| 2 | LiteCast special branch and page creation | `03-litecast-and-page.md` | Always; conditional sub-branch | Locked category, page source |
| 3 | Taxonomy, navigation, parent/series links | `04-taxonomy-and-navigation.md` | Applicable specialist routes | Main taxonomy, page, episode parent |
| 4 | Semantic glossary and related links | `05-semantic-linking.md` | Mandatory analysis on all applicable routes | Final-ish page, shared 5-link budget |
| 5 | Attached paper / cabinet | `06-paper-ingestion.md` | If paper attached | Actual file, DOI and Drive metadata |
| 6 | Flashcards and quiz | `07-flashcards-and-quiz.md` | As prescribed by type | Page content; challenge exclusions |
| 7 | Opaque evidence subsystem invocation | `08-des-fidelity.md` (unchanged adapter/legacy extraction) | Invoke according to the EXISTING publication eligibility/skip rules | Pass exact approved inputs; consume validated results; no internal modification |
| 8 | Challenge | `09-challenge.md` | Only if challenge selected | Private handoff contract |
| 9 | Hashtags, brain, pathways | `10-brain-and-pathways.md` | Applicable routes | Locked taxonomy, final metadata |
| 10 | Pulse, version and build | `11-build-and-version.md` | Applicable routes | All content-affecting writes |
| 11 | English, notification, verification, report | `12-english-notify-verify.md` | Mandatory with documented skips | Finished fa page, specialty en workflow, final gate |

**Important:** This manifest mirrors source order; it does not yet prove that each stage is independently resumable. Some steps are intertwined and require an execution dependency review before checkpointing.

## Immutable evidence subsystem boundary

**DES + Fidelity are one indivisible, closed subsystem.** The publishing router may decide **when** to invoke the existing system based on the canonical eligibility rules, provide the exact source material and final claims, and consume its validated outputs. It must NOT split DES from Fidelity, change either prompt, alter source selection, scoring, claim segmentation, two-checker voting, tie-break, stronger review, founder gates, or output schema. Do not introduce new skip conditions or automatically run it on cases where the existing protocol says to skip. The existing prompt files and tools are the authority; `08-des-fidelity.md` is a verbatim extracted invocation contract, NOT permission to refactor the engine. If the internal engine changes independently in the future, the publishing router must still treat it as opaque.

Checkpointing later may store a validated completed result and its provenance, but may not introduce internal checkpoints or reuse partial/invalid outputs without the engine's own existing guarantees.

## Routing invariants

- LiteCast: its own data source and `.ir` identity; no specialist cross-links or English mirror. Read the LiteCast branch within stage 2; don't infer that specialist stage 4 can run unchanged.
- Challenge: private answers never go into public git; documented English skip.
- Source-based DES: preserve the existing eligibility logic and pass exact inputs into the opaque DES/Fidelity subsystem. Do not replicate or edit its internal algorithm.
- New specialist pages: fresh semantic link analyses, shared 5-link cap, taxonomy decision locked before use.
- All routes: preserve title/caption exactness, mandatory approvals, build order, stamp-after-last-write, and final `verify_publish.py` gate.

## Activation blockers

1. Validate rule parity across `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/`, `../agent-parity.md` and the full canonical README.
2. Replace current Rule 0's read-all requirement only after a global-contract parity proof. The new contract must be complete, not merely short.
3. Test representative paths and inspect actual outputs. No dry-run execution is claimed by this file.
4. Coordinate all router changes in one activation commit, with explicit founder review.
5. Persistent checkpointing is intentionally out of scope until these boundaries are validated.
