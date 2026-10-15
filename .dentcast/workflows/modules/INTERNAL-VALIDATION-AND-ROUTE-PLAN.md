# Modular publishing — internal validation and route compiler design

Status: **STAGING ONLY. No production router, no merge, no DES/Fidelity modification.**

## Structural validation performed (2026-10-15)

Read the current contract and canonical module excerpts directly from GitHub. JSON parsed; 15 unique module IDs, no unknown unconditional dependencies, no self-dependencies, no cycles. This is **not** a behavioral parity pass. All 15 adapters and schema validators remain unimplemented.

### Findings and corrections

- **Taxonomy/page dependency:** original draft required `page` before `taxonomy`, but specialist page creation may require locked taxonomy. Corrected taxonomy to depend on intake; page has conditional taxonomy-lock input. Route compiler must enforce semantic confirmation before the first taxonomy-dependent write, not merely rely on generic dependency arrays.
- **Final verification:** original draft depended only on build. Corrected to consume route execution ledger and every applicable receipt, approval and Phase F result; no blanket assumption that build is required for paper-only.
- **Route variants:** paper-only, LiteCast, Challenge, standard page+paper are distinct plans. Paper-only must not enter page/brain/build/English/notification by default.
- **Missing fidelity:** old guidance contradictions (incremental vs full Fidelity recheck, challenge exclusions, brain absolute tail) must be resolved against canonical source; **do not modify the scientific engine**.
- **Design limitation:** current `trigger` names are labels, not executable predicates. `requires` is only unconditional edges; route-specific dependencies remain to be compiled.

## Proposed next-step route planner (not executable)

Inputs: exact user request, attachments, current branch/commit, live brain/category precedent, global invariant registry. Outputs: route ID, ordered applicable modules, required source files, explicit skipped modules with source-backed reasons, locked decisions, gates, allowed side effects, final verification conditions.

### Example route skeletons (require clause audit)

| Route | Required special handling | Forbidden assumptions |
|---|---|---|
| ordinary specialist publish | intake; taxonomy lock; page; navigation; semantic analysis; optional evidence/learning; brain; English; build and Phase F | do not omit English or semantic analysis; do not assume evidence always eligible |
| page + attached paper | all eligible publish stages **and** paper ingestion/credit | do not classify paper ingestion as DentAI-only |
| paper-only | intake and three paper-ingestion parts, including catalog; route-specific completion | no page, brain, build, English, or false publish report |
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

Build a **read-only route-plan compiler and validator** first, using canonical fixtures and explicit rule IDs. It should output JSON plans and diagnostics without editing content, calling DES, committing, notifying, or publishing. After route plans pass negative and positive tests, implement a stateful orchestrator and per-module adapters.

## Verification checklist

- [x] JSON parses, unique module IDs
- [x] Unconditional dependency graph acyclic and referentially valid
- [x] Taxonomy prerequisite and verification-ledger design corrected
- [ ] Complete rule-by-rule mapping across README, CLAUDE, AGENTS, Cursor and agent-parity
- [ ] Executable predicates and route-specific dependency graph
- [ ] Module input/output schema validation
- [ ] Dry-run fixtures for each route and negative test
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

**Stage 2 remains OPEN:** enumerate every canonical rule, skip, approval and stop against all 15 module owners; implement positive/negative fixtures for every supported route; resolve the six findings above; then independently verify parity. Do not start Stage 3 implementation or claim behavioral equivalence before this gate is green.
