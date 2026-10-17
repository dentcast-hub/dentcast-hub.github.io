# Historical modularization development record — not live instructions

This document records staging development at its original revision. Its former branch directions, activation status, backup-reading requirements and proposed workflow routes are historical, not current execution instructions.
For live work read `.dentcast/workflows/README.md`, `.dentcast/workflows/global/README.md` and `.dentcast/workflows/agent-parity.md`.
For «انتشار ناقص داشتم», first read `.dentcast/PUBLISH-HANDOFF.md`, then `.dentcast/workflows/publish-handoff.md`.
Staging utilities remain restricted to staging. Do not follow the historical steps below to resume a real publication or assume their test results describe the current branch.
Current repair branch and status: `.dentcast/workflows/PUBLISHING-REPAIR-PLAN.md`.

---

## Historical record (non-operative)

# Stage 7 — STAGING ACCEPTED (offline mechanical scope only)

Decision date: 2026-10-16. Baseline: `edb249228f` on
`refactor/publishing-modular-workflow`, initially clean. The founder explicitly
redefined this mission as offline/Sandbox acceptance, with real model, human and
external-system gates deferred until activation. Earlier NO-GO findings remain
valid for **production activation**, not the newly bounded acceptance scope.

**STAGING ACCEPTED does not certify complete behavioral equivalence, trustworthy
operator assertions, semantic decisions, or real publication. Stage 8 remains
blocked. No main change, merge, router activation, API/Drive/Admin test write or
production notification was performed.**

## Corrections and their evidence

1. Glossary is discovered from `glossary/glossary.json`, not a nonexistent brain
   type. Its page is authored separately, its registry has a scoped writer, and
   the unchanged builder generates the index only. The erroneous C2.6 description
   was corrected in README and its exact extracted module together, consistent
   with C1–2, the glossary-writer handoff, builder implementation and Phase F.
   No term generator was invented. Glossary uses the complete semantic module
   with explicit 4.7 → 4.7-ب → 4.8 → 4.9 order, no specialist brain append or
   pathway placement, English retained, Phase E omitted, and the existing
   noncustomary-Pulse skip scoped to glossary.
2. The independent route audit now detects omitted flashcards, Quiz, evidence and
   pathway stages and a push marker preceding English. Previously these could
   disappear from a normal route without that audit failing.
3. Removed `CANONICAL_NO_CITED_SOURCE_ELIGIBLE`: lack of cited sources is not
   permission to omit DES; the existing COMMENTARY/source-basket decision remains
   inside the untouched evidence invocation. Video-tip skips are category-scoped
   and available for both cards and Quiz, preserving the canonical exception.
4. `dentcast.json` can be written by the brain owner only for episode/dentcast;
   the generic writer previously could not update the episode catalog. Glossary
   registration cannot write the specialist brain or episode catalog.
5. An `awaiting_approval` pause cannot be reopened using its own receipt hash.
   A hash is not human consent; staging has no trusted approval adapter, so the
   human gate remains closed. Retry of an ordinary failed operation still works.
   Old pause records without approval provenance fail closed.
6. Internal symlink ancestors cannot disguise protected paths from the sandbox
   editor. Existing external-path, source-input and generated-file protections
   remain in force.

DES/Fidelity prompts, engine, segmentation, votes, scores and scientific records
were not changed. New tests do not generate scientific judgments or human consent.

## Executed evidence and precise limits

| Scenario | Actual offline evidence | Limit |
|---|---|---|
| Insight (`clinical`), Chairside, ShareHub | Required/forbidden route checks, each with/without paper; real paired FAQ-corpus edit and unchanged card/Quiz builders | No semantic writing, multi-source scoring or full publication certification |
| LiteCast | Independent direct JSON append versus Stage 3 editor, original stamper in both trees, exact byte comparison; **new synthetic page passed original Phase F: 23 passed, 0 warned, 0 failed**; altered title then failed | No patient content, author judgment or live publication |
| Glossary | Independent direct writes versus actual sandbox editor; new synthetic term and JSON; original CLI builder in both trees; full byte manifests equal; term preserved and index includes it | Clinical content and actual inbound-link decisions await authorized operator |
| NoteCast/Episode | Both route variants; real paired learning-index outputs; paired episode catalog writer and original episodes builder, preserving an explicit NoteCast link on the episode page | Shared evidence/model provenance and human decision not certified |
| Challenge | Required skips and retained marker; paired question-page write and real original public-index builder; no answer/key fields or English page | Private answer never supplied; Admin handoff remains blocked |
| Paper-only / attached paper | Only Drive+catalog completion in paper-only plan, no credit/page/Phase F; actual existing large-catalog transport and receipt tests; forbidden local Drive operation rejected | No external filing or fabricated Drive receipt presented as real |
| Failure/resume/privacy | Failed-operation retry, stale/corrupt checkpoints, input invalidation, independent checker checkpoint boundaries, concurrent-write CAS, gated human pause and filesystem isolation | Existing mock-model/client tests prove mechanics, not real model independence |

The pairs compare mechanical operations performed in two independently marked
temporary directories, not copied published pages masquerading as new publishing.
Local schema-positioning fixtures and the episode writer's explicitly stubbed
invocation boundary are disclosed in tests. They do **not** execute an entire
publication chain through human/scientific gates. No shape receipt is treated as
consent or scientific proof. External operations are blocked or represented only
in existing clearly labelled contract unit tests.

Reproduction:

```sh
python -m unittest discover -s tests -p 'test_dentcast*.py' -v
python tools/audit_dentcast_stage2_contract.py
```

Local and GitHub CI result: **218 tests passed**, including behavioral filesystem/builder
scenarios; source/contract audit **PASS**, zero issues.

**Verified CI:** https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/38854740524
— success on code commit `82f75c4c6fc16b1ac296d65c563c8aeebc755ded`.
Downloaded job logs confirm all 17 suites total 218 tests and the new synthetic
LiteCast Phase F line is `23 passed, 0 warned, 0 failed`. The later commit only
records this evidence; it does not change executable code. All executed canonical builders and Phase F were
compared with the fetched main revision and were byte-identical; main was not
merged or changed. Test directories are disposable and no browser opens their
analytics markup.

## Context cost, not measured token usage

See `STAGE-7-CONTEXT-BYTES.json` for exact UTF-8 byte counts and assumptions.
No tokenizer/model billing meter was used. These are source-size estimates, not
observed tokens, cache usage or savings.

| Input | Bytes |
|---|---:|
| README | 240,501 |
| AGENTS | 331,697 |
| CLAUDE | 244,394 |
| agent-parity | 31,348 |
| Cursor alwaysApply router | 18,886 |
| Cursor task publishing rule | 20,014 |
| Normal no-paper unique modules (including hard rules) | 224,497 |
| Normal no-paper full reload on every substep | 741,216 |

Selecting unique modules reduces the normal route's source bytes by about 6.7%
relative to README alone; LiteCast is about 56% and glossary about 16% smaller.
Repeated substep loading reverses that advantage. Claude's CLAUDE file, Codex's
AGENTS discovery/truncation and Cursor's alwaysApply router must be included in
real measurement. Current read-all rules remain active, so module reads currently
**add** context instead of replacing README. No realized token reduction is claimed.

## Pre-activation gates (all remain closed)

- Authenticate human decisions against exact content/version/scope. Existing
  operator boolean assertions and hash-shaped approval fields are only schema
  inputs, not verified founder consent; the present staging executor must never
  be promoted into a trusted publication engine without this boundary.
- Execute actual independent scientific/model sessions, validate source/text
  basis and shared NoteCast/Episode evidence, demonstrate blind reviewer isolation
  and stronger review, and test interruption against actual returned results.
- Provide a private store for restricted source text, patient information and
  Challenge answers; public Git hashes/attestations do not establish permission.
- Exercise authorized Drive filing, private Admin handoff and notification
  conditions against approved environments; no such traffic was sent here.
- Run complete authorized old/new publications and inspect semantic decisions,
  cross-links, all builders/sidecars, title/caption sweeps and new-page Phase F on
  every applicable production route. The successful new LiteCast mechanical gate
  is not a substitute for specialist scientific-route verification.
- Measure end-to-end context/tokens under actual Claude/Codex/Cursor clients,
  deduplicate module loads and verify complete global-rule loading before any
  reduction of the active read-all requirements.
- Obtain independent behavioral review and explicit founder permission before
  coordinated router activation/Stage 8 or merge. This report grants neither.
