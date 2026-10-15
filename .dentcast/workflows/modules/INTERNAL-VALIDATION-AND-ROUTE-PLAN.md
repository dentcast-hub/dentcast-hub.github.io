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
