# Historical modularization development record — not live instructions

This document records staging development at its original revision. Its former branch directions, activation status, backup-reading requirements and proposed workflow routes are historical, not current execution instructions.
For live work read `.dentcast/workflows/README.md`, `.dentcast/workflows/global/README.md` and `.dentcast/workflows/agent-parity.md`.
For «انتشار ناقص داشتم», first read `.dentcast/PUBLISH-HANDOFF.md`, then `.dentcast/workflows/publish-handoff.md`.
Staging utilities remain restricted to staging. Do not follow the historical steps below to resume a real publication or assume their test results describe the current branch.
Current repair branch and status: `.dentcast/workflows/PUBLISHING-REPAIR-PLAN.md`.

---

## Historical record (non-operative)

# Verification ledger and independent review handoff — DRAFT

**Branch:** `refactor/publishing-modular-workflow`
**Production status:** NOT ACTIVATED. No main merge. No publishing entrypoint edits.
**Scope:** Modularize publishing workflow without behavioral changes. DES/Fidelity is one independently versioned opaque scientific subsystem. Its prompts and decisions are untouched; durable internal per-agent execution checkpoints are allowed.

## Completed mechanical source-slice parity — PASS

On this branch, fetched canonical `.dentcast/workflows/README.md` (234,214 characters) and **each of the twelve extracted module files** from GitHub. For each module, compared its complete UTF-8 text to the corresponding original inclusive source line range using exact JavaScript string equality (`module === source.split("\\n").slice(start-1,end).join("\\n")`). **12/12 exact matches.** Ranges cover source lines 1–2598 contiguously with no overlap/gap.

| Module | Source lines | Exact equality |
|---|---:|---|
| 01-hard-rules | 1–56 | PASS |
| 02-routing-intake | 57–356 | PASS |
| 03-litecast-and-page | 357–528 | PASS |
| 04-taxonomy-and-navigation | 529–794 | PASS |
| 05-semantic-linking | 795–957 | PASS |
| 06-paper-ingestion | 958–1143 | PASS |
| 07-flashcards-and-quiz | 1144–1335 | PASS |
| 08-des-fidelity | 1336–1966 | PASS |
| 09-challenge | 1967–2038 | PASS |
| 10-brain-and-pathways | 2039–2329 | PASS |
| 11-build-and-version | 2330–2393 | PASS |
| 12-english-notify-verify | 2394–2598 | PASS |

**Scope of proof:** text extraction equality only. It does NOT prove that a lazy-loading agent would select all mandatory modules or preserve execution semantics. Module 08 is a verbatim **invocation contract**, not an editable DES/Fidelity engine.

## Normative source inventory — reviewed structure, full clause audit pending

| Source | Line range / heading | Required disposition |
|---|---|---|
| README hard rules | 3–56, rules 1–18 | Load verbatim always |
| README stages | 57–2598 | Exact extracted modules; prove conditional routing |
| AGENTS §6 | 373–1209, repo conventions | Audit every normative clause; determine always-on vs relevant-only |
| AGENTS §7 | 1210–1440, Plus/Premium | Map every publication-triggered action to module and final gate |
| AGENTS §8 | 1441–1587, site-wide invariants | Identify page-level invariants that must always load |
| AGENTS §9 | 1588–1610, agent behavior | Preserve parity and founder approvals |
| AGENTS §10 | 1611–1623, maintenance | Coordinated entrypoint updates |
| CLAUDE.md | entire file | Verify Claude auto-loaded rules against common contract |
| agent-parity.md | Rule 0 and §§1–7 | Remove read-all conflict ONLY during approved coordinated activation |
| Cursor router | entire file | Preserve alwaysApply route discovery |
| Cursor publishing | entire file | Preserve mandatory stage list and exclusions |

**Important:** The AGENTS sections above are broad source boundaries, not a completed item-by-item normative audit. Do not certify global-rule parity on this evidence alone.

## High-risk decisions for independent reviewer

- Is every mandatory rule loaded even when the original source spreads it across multiple sections? In particular, is a rule's **negative exception** loaded as reliably as its positive requirement?
- Can AGENTS §6's many conventions be divided into on-demand topics without losing site-wide protections?
- Does the original precedence rule resolve flat brain append, DES basket/eligibility, LiteCast semantic enrichment and English skips correctly?
- Are title/caption approval, claim correction/founder gates, private challenge answers, and git merge authorization all preserved?
- Does any proposed route unintentionally bypass a specialty workflow, builder order, version stamp, or Phase F?
- Are checkpoint artifacts stored privately and keyed to immutable input/prompt/model/spec versions, with safe invalidation and unchanged downstream DES/Fidelity votes?

## Test matrix before activation

- [ ] Build line-by-line normative clause coverage manifest for AGENTS §§6–8, CLAUDE, and agent-parity.
- [ ] Design and review complete minimal global contract with explicit source-to-rule mappings.
- [ ] Verify Claude, Codex and Cursor each load the same effective rules.
- [ ] Dry-run ordinary Insight and multi-source ShareHub.
- [ ] Dry-run LiteCast isolated .ir and challenge private-answer exclusions.
- [ ] Dry-run NoteCast/episode evidence reuse and paper-only ingestion.
- [ ] Dry-run glossary cross-link and title/caption correction sweep.
- [ ] Dry-run DES/Fidelity interrupted after 1+ agent results, then resume without skipping voting/approval.
- [ ] Run final mechanical verification on representative test outputs.
- [ ] Measure context/token load versus baseline and confirm actual reduction.
- [ ] Obtain founder approval to activate entrypoint changes.
- [ ] Merge to main **only** after separate explicit approval.

## Suggested independent-review prompt (for stronger model)

> Audit the `refactor/publishing-modular-workflow` branch against `main` and the canonical `.dentcast/workflows/README.md`. Be a skeptical independent reviewer, not a redesign agent. Check clause-by-clause rule coverage, negative exceptions, source precedence, all agent entrypoints, actual lazy-load savings, DES/Fidelity subsystem independence/versioning and agent-level checkpoint safety. Confirm 12-module text parity independently. For every finding provide file, line, severity, reproducible evidence and minimal corrective action. Do not change prompts, do not activate the router, do not merge, and do not write any repository changes without my approval. Explicitly distinguish verified facts from untested assumptions.

## Unfinished

This ledger is the beginning of the final handoff report, not a certification. The line-by-line global audit, live router implementation, behavioral parity tests, and checkpoint persistence are **not done**.
