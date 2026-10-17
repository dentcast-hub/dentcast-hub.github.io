# Historical modularization development record — not live instructions

This document records staging development at its original revision. Its former branch directions, activation status, backup-reading requirements and proposed workflow routes are historical, not current execution instructions.
For live work read `.dentcast/workflows/README.md`, `.dentcast/workflows/global/README.md` and `.dentcast/workflows/agent-parity.md`.
For «انتشار ناقص داشتم», first read `.dentcast/PUBLISH-HANDOFF.md`, then `.dentcast/workflows/publish-handoff.md`.
Staging utilities remain restricted to staging. Do not follow the historical steps below to resume a real publication or assume their test results describe the current branch.
Current repair branch and status: `.dentcast/workflows/PUBLISHING-REPAIR-PLAN.md`.

---

## Historical record (non-operative)

# Modular publishing — internal validation and route compiler design

Status: **STAGE 2 CONTRACT AUDIT COMPLETE; staging only.** See [STAGE-2-ACCEPTANCE.md](STAGE-2-ACCEPTANCE.md) and the passing CI audit. No production router, no merge, no DES/Fidelity modification.

## Structural validation performed (2026-10-15)

Read the current contract and canonical module excerpts directly from GitHub. JSON parsed; 15 unique module IDs, no unknown unconditional dependencies, no self-dependencies, no cycles. This is **not** a behavioral parity pass. Only the intake staging adapter and its validator are implemented; the other 14 remain unimplemented (Stage 3).

### Findings and corrections

- **Taxonomy/page dependency:** original draft required `page` before `taxonomy`, but specialist page creation may require locked taxonomy. The **interface contract and the registry** now both put page draft before the taxonomy lock (C2 then C2.4). Page creation may not consume a taxonomy lock until canonical step 2.4; taxonomy-dependent navigation and brain writes must wait. Executable predicate parity will be tested when the adapters exist. Route compiler must enforce semantic confirmation before the first taxonomy-dependent write, not merely rely on generic dependency arrays.
- **Final verification:** original draft depended only on build. Corrected to consume route execution ledger and every applicable receipt, approval and Phase F result; no blanket assumption that build is required for paper-only.
- **Route variants:** paper-only, LiteCast, Challenge, standard page+paper are distinct plans. Paper-only must not enter page/brain/build/English/notification by default.
- **Missing fidelity:** old guidance contradictions (incremental vs full Fidelity recheck, challenge exclusions, brain absolute tail) must be resolved against canonical source; **do not modify the scientific engine**.
- **Design limitation:** current `trigger` names are labels, not executable predicates. `requires` is only unconditional edges; route-specific dependencies remain to be compiled.

## Route planner contract (draft planner exists; not executable publishing)

Inputs: exact user request, attachments, current branch/commit, live brain/category precedent, global invariant registry. Outputs: route ID, ordered applicable modules, required source files, explicit skipped modules with source-backed reasons, locked decisions, gates, allowed side effects, final verification conditions.

### Example route skeletons (require clause audit)

| Route | Required special handling | Forbidden assumptions |
|---|---|---|
| ordinary specialist publish | intake; page draft; taxonomy lock; navigation; semantic analysis; conditionally eligible evidence/learning; brain; pathways; C6 Pulse; C7 version; C8 build; English D; E marker; F gate | do not omit English or semantic analysis; do not assume evidence always eligible |
| page + attached paper | all eligible publish stages **and** paper ingestion/credit | do not classify paper ingestion as DentAI-only |
| paper-only | intake and paper-ingestion Parts 1 & 2 only (Drive + catalog), then commit; NO Part 3 or publication gate | no page, brain, build, English, or false publish report |
| LiteCast | independent .ir category, isolated links and data, explicit English skip | no specialist crosslinks, no .org English |
| Challenge | question and public-safe markup, private handoff, explicit exceptions | never commit answer or invent mirror |
| NoteCast+Episode | respect source-basket and evidence reuse conditions | do not recompute scientific scores automatically |

**Ordering:** This table is *not* an executable topological schedule. English, build, version stamp and final verification must follow exact canonical ordering and re-run when late writes invalidate earlier outputs.

## Mandatory compiler invariants

1. Compile route from canonical predicates; fail closed on unknown category, missing tools or unapproved mandatory choice.
2. Evaluate every module as applicable, canonically skipped, blocked, awaiting approval or completed. No silent omission.
3. Enforce both unconditional and conditional dependencies, plus shared five-link counter.
4. Validate module output schemas and permitted writes before committing side effects; record receipts.
5. A failed module identifies its source rule, module ID and retry scope; never mark a blocked stage as skipped.
6. Invalidate dependent artifacts on changed title, body, taxonomy, evidence basis, prompt version, approvals or builder version.
7. Preserve DES/Fidelity as an opaque external engine; only its own engine may manage per-checker checkpoints.
8. Run the actual final gate for applicable publication routes; an apparent build success is insufficient.
9. Never activate this draft or merge without founder approval.

## Next implementation boundary

The **read-only route-plan skeleton, validator, intake adapter and staging orchestrator now exist**, with static contract and route-fixture tests. They output draft plans and diagnostics without editing content, calling DES, notifying or publishing. The actual conditional executable route compiler, phase-scoped notification invocations, and 14 additional adapters are Stage 3 deliverables.

## Verification checklist

- [x] JSON parses, unique module IDs
- [x] Unconditional dependency graph acyclic and referentially valid
- [x] Taxonomy prerequisite and verification-ledger design corrected
- [x] Static canonical source coverage, all 17 hard-rule owners, five entrypoint references (Stage 2; not runtime parity)
- [ ] Executable predicates and route-specific dependency graph
- [ ] Module input/output schema validation
- [x] Seven draft-route fixture variants plus negative test cases (staging only)
- [ ] Durable checkpoint and side-effect idempotency
- [ ] Behavioral parity across Claude, Codex and Cursor
- [ ] Explicit founder activation approval

## Stage 2 canonical parity audit — findings requiring resolution (2026-10-15)

**Source read:** full canonical README heading inventory (2,598 lines), specifically hard rules (lines 3-56), LiteCast (361-440), taxonomy determination (529-573), Fidelity (1629-1764), final gate (2472-2554). This is a substantive **partial audit**, not a completed clause-by-clause parity proof. No active publishing code changed.

1. **LiteCast build/brain dependency is a draft contract defect.** Canonical 0.1 explicitly forbids LiteCast entries in specialist brain (lines 365-369), yet canonical 0.4 explicitly requires step 7 and step 8 rebuild (lines 381-389). A registry edge `build -> brain` cannot be unconditional. Fix the draft registry with a route-scoped prerequisite and test LiteCast, without introducing a specialist brain write.
2. **Taxonomy/page ordering requires a semantic boundary, not just a reordered list.** Canonical 2.4 starts after step 2 page construction (lines 440-529), but requires locked pillar/subtopic before step 2.5 capsule and step 5 brain write (529-573). Planner page-before-taxonomy is defensible only if page generation does not prematurely write taxonomy-dependent artifacts. Add an explicit precondition on navigation and brain, and a regression test.
3. **Fidelity resumability must be per input block and per checker.** Canonical 2c requires two independent full runs `out-src<k>-1.json`, `-2.json`, then disagreement-only third run, vote, stronger reviewer and founder gates (1700-1764). Resume must not rerun a valid first run, but cannot pass the first run's judgments to the second. Model identity, source/unit fingerprint and exact input block are required to reuse a result.
4. **Paper-only route must not be treated as a completed ordinary publish.** Canonical Phase 0 and paper branch require route-specific behavior. Final Phase F is mandatory for actual page publications (2472-2554); never synthesize a green page gate for paper-only.
5. **Final mechanical gate is necessary but not sufficient for semantic work.** Canonical Phase F expressly says semantic quality of 4.7/4.8/4.9 is not validated by the mechanical gate (2544-2546). Independent semantic execution receipts must remain mandatory even if `verify_publish.py` passes.
6. **Contract naming mismatch:** `MODULE-CONTRACTS.v1.json` uses `contract_version` and `dependency_receipts`, while the staging adapter uses `module_contract_version` and `dependencies`. A versioned translation or single canonical request schema is needed before a real second adapter.

**Disposition:** Stage 2 source/contract inventory and route-fixture audit is complete; see STAGE-2-ACCEPTANCE.md and CI. Runtime behavioral equivalence cannot be independently demonstrated until the Stage 3 real modules exist and is reserved for the later full parity gate. The historical six findings were corrected or documented as explicit Stage 3 handoffs.

## Historical Stage 2 open-gate snapshot (superseded by acceptance)

The earlier concern was incomplete traceability. It was closed for **static contract audit** by the exact 12-slice canonical text coverage, full hard-rule ownership map, five entrypoint checks and seven route fixtures. Full **executable** positive/negative parity tests remain deliberately assigned to Stages 3 and 7; they are not Stage 2 proof.

## Canonical rule inventory and ownership map — audit expansion

All 17 hard rules (README lines 3–56) mapped to owner and invariant below. This is a **traceability map**, not proof of executable equivalence.

| Canonical hard rule | Primary module | Required invariant / acceptance test |
|---|---|---|
| HR1 brain source | intake, page, brain | derive same-type schema from live brain; LiteCast exception HR10 |
| HR2 type isolation | intake, page | reject cross-type templates |
| HR3 brain tail | brain, verify | append to absolute flat-array tail |
| HR4 discover before ask | intake | probe authoritative data before questions |
| HR5 exact key parity | brain, verify | no invented/missing same-type fields |
| HR6 one-time semantic pillar lock | taxonomy, navigation, brain | classify once; ask only ambiguous; never re-decide |
| HR7 live structured pillars | taxonomy | read current PILLARS, no hardcoding |
| HR8 main authority | taxonomy, build | taxonomy/build tools reflect main |
| HR9 global five-link cap | navigation, semantic-links, verify | count all related capsules and preserve insertion order |
| HR10 LiteCast isolation | page, semantic-links, build, verify | own .ir source, links, no specialist brain or English |
| HR11 fresh semantic enrichment | semantic-links, verify | explicit analysis/empty receipt; episode and LiteCast equivalents |
| HR12 English exceptions | english, verify | mirror+toggle for ordinary .org, skip LiteCast/challenge only |
| HR13 no invented facts | intake, paper-cabinet, all | ask before unknown metadata/labels/DOI |
| HR14 confidence gates | intake, taxonomy, semantic-links | high-confidence report, ambiguous named-choice approval |
| HR15 canonical hashtag vocab | brain, verify | simulate/reuse/apply/check reference tags |
| HR16 exact user strings | intake, page, verify | byte/codepoint parity across surfaces |
| HR17 correction sweep | page, brain, build, verify | update every derived surface and rerun Phase F |

Canonical section-to-module traceability (all top-level execution sections, including special branches):

| Canonical sections | Module ownership | Mandatory conditional behavior |
|---|---|---|
| Phase 0, A, B Q1–Q5 | intake | four paper/text routes, writing-style gate, media, DES basis, challenge, Pulse |
| C 0, 1, 2 | page, semantic-links | LiteCast override, hash, clone same type, body approval |
| C 2.4 | taxonomy | main-backed semantic lock before 2.5 and brain |
| C 2.5–2.6 | navigation | cap, related capsules, landing/index |
| C 3–4, 4.5–4.6 | page, navigation, evidence | meta/hash, NoteCast parent and shared score, Promptologist links |
| C 4.7, 4.7-b, 4.8, 4.9 | semantic-links | fresh analysis, glossary reverse links, first occurrence, 5 cap |
| C 4.10 Parts 1–3 | paper-cabinet | paper-only 1+2; page+paper 1+2+3; confirm Drive/DOI |
| C 4.11–4.12 | learning-assets | FAQ/flashcards/quiz with category gates |
| C 4.13 Parts 1–5 | evidence | preserve exact DES source basis, independent checker/vote/reviewer, founder per-claim gate |
| C 4.14 | challenge | public half and private admin handoff; English exception |
| C 5.0, 5, 5.5 | brain, taxonomy | canonical hashtags, brain append and taxonomy verification |
| C 5.6, 5.6-b | pathways | founder gates and bundle checks |
| C 6 | notification | Pulse convention and approvals |
| C 7–8 | build | stamp version then rebuild, conditional route-specific outputs |
| D | english | full noindex mirror/toggle except two canonical skips |
| E | notification | push marker and eligibility |
| F, final summary | verify | exact strings, all receipts, semantic audit not inferred from green mechanical gate |

**Agent-entrypoint sources inspected:** `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/dentcast-router.mdc`, `.cursor/rules/dentcast-publishing.mdc`, `.dentcast/workflows/agent-parity.md`. All still point to active canonical publication rules; this stage does not reroute them.

**Known important behavior that the current draft planner does NOT yet implement:** conditional learning/evidence/pathway eligibility; LiteCast internal 0.5/0.6 semantic analysis; challenge private handoff; Phase B hard approvals; page+paper DOI credit; exact Phase F receipt and semantic receipt enforcement. A complete parity test cannot honestly be green with these unimplemented.

## Stage 2 closure

The machine audit is `tools/audit_dentcast_stage2_contract.py`; repeatable positive and adversarial fixtures are `tests/test_dentcast_stage2_contract.py`; the passing GitHub Actions evidence is linked in [STAGE-2-ACCEPTANCE.md](STAGE-2-ACCEPTANCE.md). This is a contract freeze, not activation or runtime behavioral parity. **Stage 3 is now unblocked for implementation on the feature branch**, subject to its own safety gates.
