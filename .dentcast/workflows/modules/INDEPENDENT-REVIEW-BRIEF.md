# Historical modularization development record — not live instructions

This document records staging development at its original revision. Its former branch directions, activation status, backup-reading requirements and proposed workflow routes are historical, not current execution instructions.
For live work read `.dentcast/workflows/README.md`, `.dentcast/workflows/global/README.md` and `.dentcast/workflows/agent-parity.md`.
For «انتشار ناقص داشتم», first read `.dentcast/PUBLISH-HANDOFF.md`, then `.dentcast/workflows/publish-handoff.md`.
Staging utilities remain restricted to staging. Do not follow the historical steps below to resume a real publication or assume their test results describe the current branch.
Current repair branch and status: `.dentcast/workflows/PUBLISHING-REPAIR-PLAN.md`.

---

## Historical record (non-operative)

# Independent high-effort review brief — DentCast publishing refactor

## Objective
Audit the staged modularization of the DentCast publishing protocol for complete behavior and cross-agent parity while reducing repeated context loading. This is an **audit and correction proposal**, not authorization to change production.

## Repository and status
- Repository: `dentcast-hub/dentcast-hub.github.io`
- Work branch: `refactor/publishing-modular-workflow`
- Baseline: `main`; canonical source `.dentcast/workflows/README.md`
- **DO NOT MERGE**, change `main`, or activate the new router without explicit founder permission.
- No DES/Fidelity prompt, scientific logic, scoring or version changes are authorized in this publishing refactor.

## Read in this order
1. `.dentcast/workflows/modules/VERIFICATION-LEDGER.md` — exact extraction parity and audit/test matrix.
2. `.dentcast/workflows/modules/INDEX.md` — twelve-module manifest.
3. `.dentcast/workflows/modules/GLOBAL-INVARIANTS-SOURCE-MAP.md` — source map and known precedence conflicts.
4. `.dentcast/workflows/modules/ENTRYPOINT-PARITY-PLAN.md` — cross-agent activation blockers.
5. `.dentcast/workflows/modules/DEPENDENCY-AUDIT.md` and `STAGE-ROUTER-DRAFT.md` — stage dependencies and proposed lazy loader.
6. Original `.dentcast/workflows/README.md` and `.dentcast/workflows/agent-parity.md`.
7. `CLAUDE.md`, `AGENTS.md` (especially §§6–10), `.cursor/rules/dentcast-router.mdc`, `.cursor/rules/dentcast-publishing.mdc`.
8. Relevant specialized workflow contracts referenced by the canonical README, **only when checking their invocation boundaries**.

## Established decisions
- Twelve contiguous modules are verbatim slices of original README lines 1–2598. Exact text equality against each source range was checked **12/12 PASS**. This is not behavior parity.
- DES/Fidelity is a **single independently versioned opaque subsystem** invoked by publishing according to existing eligibility/skip rules. Prompts, scientific methods, votes, tie-break, adjudication, founder approvals, and output semantics are NOT to be refactored here.
- DES/Fidelity **may have internal durable checkpoints per completed agent call**: persist returned answers and provenance, recover after token/context interruption, invalidate when input or spec changes, preserve all remaining validation. Avoid storing private material in public git.
- Both publishing-stage and internal DES/Fidelity checkpoints are planned, not implemented.
- Current canonical README, entrypoints and read-all rules remain live and unchanged; the proposed lazy router is NOT ACTIVE.

## Requested audit deliverables
1. A **clause-level source-to-destination coverage matrix** for all normative obligations in README, CLAUDE, AGENTS §§6–10, agent-parity, and Cursor entrypoints, including negative rules and conditional exceptions.
2. Explicit severity-ranked gaps/conflicts with file, line, evidence, and minimal fix; distinguish source conflicts from refactor-introduced issues.
3. Proposed **complete global invariant contract** with safe always-load vs on-demand boundaries and an executable routing plan. Do not drop obligations to save tokens.
4. Testable behavioral-parity matrix for Insight, LiteCast, Challenge, multi-source ShareHub, NoteCast/episode shared evidence, glossary, paper-only, title/caption correction, and interrupted DES/Fidelity.
5. An assessment of **actual** token/context savings including Claude auto-loaded context and Codex/Cursor differences. Do not claim savings without measurement.
6. A staged, reversible activation plan with founder approval gate and no merge.
7. A final report in Persian: what is verified, what is unverified, what should change, risks, and a go/no-go recommendation.

## Audit behavior
Work on the specified feature branch for reads. **Start read-only**; propose changes before writing. Do not silently modify, merge, deploy, publish content, or alter DES/Fidelity prompts. If repository access is unavailable, say so and request the needed access rather than pretending the audit happened.

## Important distinction
A source text that is split losslessly does not automatically produce a safe lazy-loader. The remaining difficult work is proving that every applicable rule and exception is loaded and executed by every agent, not simply that all files exist.
