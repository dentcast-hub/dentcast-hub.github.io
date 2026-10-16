# Publishing modules — staging index

**Status: modular STAGING connector now wired on the feature branch only; NO production activation or main merge.** The canonical 2,598-line original is preserved verbatim as `../README.legacy.md`; the short staging router is `../README.md`. Original `CLAUDE.legacy.md`, `AGENTS.legacy.md`, `../agent-parity.legacy.md` and `../legacy/cursor/` are available for full instructions and rollback. DES/Fidelity is unchanged.

## Proposed execution-order modules (verbatim source slices)

| File | Original lines |
|---|---|
| [01-hard-rules.md](01-hard-rules.md) | 1–56 |
| [02-routing-intake.md](02-routing-intake.md) | 57–356 |
| [03-litecast-and-page.md](03-litecast-and-page.md) | 357–528 |
| [04-taxonomy-and-navigation.md](04-taxonomy-and-navigation.md) | 529–794 |
| [05-semantic-linking.md](05-semantic-linking.md) | 795–957 |
| [06-paper-ingestion.md](06-paper-ingestion.md) | 958–1143 |
| [07-flashcards-and-quiz.md](07-flashcards-and-quiz.md) | 1144–1335 |
| [08-des-fidelity.md](08-des-fidelity.md) — verbatim invocation contract; **do not modify engine/prompts** | 1336–1966 |
| [09-challenge.md](09-challenge.md) | 1967–2038 |
| [10-brain-and-pathways.md](10-brain-and-pathways.md) | 2039–2329 |
| [11-build-and-version.md](11-build-and-version.md) | 2330–2393 |
| [12-english-notify-verify.md](12-english-notify-verify.md) | 2394–2598 |

The earlier 8-file extraction is retained temporarily as a reference, not as an alternative runnable route. **Only the twelve files in this table constitute the proposed modular sequence.**

**Scope lock:** The evidence subsystem is invoked as a single closed unit under existing eligibility rules. Neither DES nor Fidelity prompts, scoring, voting, adjudication, or tools may be modified by this modularization. See [STAGE-ROUTER-DRAFT.md](STAGE-ROUTER-DRAFT.md) for the interface boundary.

## Staging integration and release boundary — Stages 8–9

- [STAGE-7-STAGING-ACCEPTANCE.md](STAGE-7-STAGING-ACCEPTANCE.md) — Stage 7 accepted only for offline/Sandbox behavior.
- [STAGE-8-INTEGRATION.md](STAGE-8-INTEGRATION.md) — verified read-only 17-route integration and main-baseline drift check.
- [STAGE-9-PRE-ACTIVATION.md](STAGE-9-PRE-ACTIVATION.md) — final offline Stage 9 PASS (235 tests); seven production activation gates remain closed.
- `python tools/dentcast_stage8_9_preflight.py --baseline-ref origin/main` — run in a full-history checkout; outputs staging status, never approval.

**Offline Stage 8 and 9 preparation plus feature-branch native entrypoint wiring are complete. Original complete global rules remain mandatory. Actual Claude/Cursor/Codex runtime loading, real publishing, main merge, and release are NOT authorized or certified.**

## Supporting design files

- [ORCHESTRATOR-CONTRACT.md](ORCHESTRATOR-CONTRACT.md) — central state machine, round-trip module interface, ownership and failure isolation (staging).
- [MODULE-REGISTRY.draft.json](MODULE-REGISTRY.draft.json) — initial 15-module ownership sketch (superseded for interface design).
- [MODULE-CONTRACTS.v1.json](MODULE-CONTRACTS.v1.json) — 15 detailed draft interfaces: owner, inputs, outputs, dependencies, writes, approvals, failures, invalidation, privacy, checkpoints and tests. **Not executable or parity-certified.**

- [DEPENDENCY-AUDIT.md](DEPENDENCY-AUDIT.md) — global and cross-stage constraints, risks and parity gates.
- [STAGE-ROUTER-DRAFT.md](STAGE-ROUTER-DRAFT.md) — proposed lazy-loading algorithm, **not activated**.
- [ENTRYPOINT-PARITY-PLAN.md](ENTRYPOINT-PARITY-PLAN.md) — cross-agent source map, known conflicts, coordinated activation plan and test scenarios.
- [GLOBAL-INVARIANTS-SOURCE-MAP.md](GLOBAL-INVARIANTS-SOURCE-MAP.md) — canonical hard-rule source map (its former count of 18 is incorrect; README has 17 numbered hard rules), global source boundaries, contradictions and higher-effort review gates.
- [VERIFICATION-LEDGER.md](VERIFICATION-LEDGER.md) — 12/12 exact source-slice parity, pending clause audit, independent-review handoff.
- [INDEPENDENT-REVIEW-BRIEF.md](INDEPENDENT-REVIEW-BRIEF.md) — ordered reading list and precise high-effort model audit assignment.

## Verification and safeguards

The source ranges above cover all 2,598 original lines once, in original order, without overlaps or gaps. The first 8-file extraction was previously reassembled with exact character parity. **The refined 12-file extraction has now passed exact text equality against each canonical source range (12/12).** Representative behavior tests and global rule coverage still remain required before activation.

Do not activate a router, alter read-all requirements, introduce checkpoints, merge to main or claim production readiness before the specified parity gates and founder review.
