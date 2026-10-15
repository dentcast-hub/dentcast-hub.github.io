# Publishing modules — staging index

**Status: extracted and dependency-audited; NOT ACTIVATED. DES/Fidelity is an immutable opaque subsystem.** The canonical `../README.md`, `CLAUDE.md`, `AGENTS.md`, Cursor routing and `../agent-parity.md` remain unchanged.

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

## Supporting design files

- [DEPENDENCY-AUDIT.md](DEPENDENCY-AUDIT.md) — global and cross-stage constraints, risks and parity gates.
- [STAGE-ROUTER-DRAFT.md](STAGE-ROUTER-DRAFT.md) — proposed lazy-loading algorithm, **not activated**.

## Verification and safeguards

The source ranges above cover all 2,598 original lines once, in original order, without overlaps or gaps. The first 8-file extraction was previously reassembled with exact character parity. The refined 12-file extraction is verbatim from the same original ranges; final machine parity and representative behavior tests remain required before activation.

Do not activate a router, alter read-all requirements, introduce checkpoints, merge to main or claim production readiness before the specified parity gates and founder review.
