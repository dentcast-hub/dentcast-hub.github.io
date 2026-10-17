# Historical modularization development record — not live instructions

This document records staging development at its original revision. Its former branch directions, activation status, backup-reading requirements and proposed workflow routes are historical, not current execution instructions.
For live work read `.dentcast/workflows/README.md`, `.dentcast/workflows/global/README.md` and `.dentcast/workflows/agent-parity.md`.
For «انتشار ناقص داشتم», first read `.dentcast/PUBLISH-HANDOFF.md`, then `.dentcast/workflows/publish-handoff.md`.
Staging utilities remain restricted to staging. Do not follow the historical steps below to resume a real publication or assume their test results describe the current branch.
Current repair branch and status: `.dentcast/workflows/PUBLISHING-REPAIR-PLAN.md`.

---

## Historical record (non-operative)

# Global invariant source map — review draft, NOT ACTIVE

## Purpose and non-negotiable rule

This is a **source-indexed coverage map**, not a replacement for the source text. The current README, CLAUDE, AGENTS, Cursor rules, and agent-parity remain authoritative under their existing precedence. **No production loader may rely on this short summary as if it were the complete global contract.**

The new router can become token-efficient only after every always-on invariant is either (a) preserved verbatim in an approved common contract or (b) referenced in an explicitly loaded, complete canonical file. A source citation alone does not guarantee the agent read the rule.

## Canonical publishing hard rules

All of these live in `.dentcast/workflows/README.md`, **lines 3–56**, already copied verbatim into `01-hard-rules.md`. They are always-on and must be loaded **in full**, not summarized:

| Rule | Coverage / trigger |
|---|---|
| 1 | Brain source of truth |
| 2 | Category isolation and same-type templates |
| 3 | Append to **absolute end** of flat brain array |
| 4 | Discover first, ask second |
| 5 | Exact same-category brain schema |
| 6 | Lock semantically chosen pillar/subtopic before consumers |
| 7 | Read structured taxonomy live |
| 8 | `main` authoritative for taxonomy/builders |
| 9 | Shared maximum of five related links |
| 10 | LiteCast isolated `.ir` ecosystem |
| 11 | Fresh mandatory semantic enrichment with documented no-op/exception |
| 12 | English mirror/toggle with LiteCast and challenge exceptions |
| 13 | Never fabricate metadata |
| 14 | Confidence-gated confirmations |
| 15 | Hashtag reference standardization |
| 16 | Copy user-provided strings exactly |
| 17 | Full correction sweep for changed title/caption |
| 18 | Publish final mechanical gate |

**Warning:** The list above is an index only. Every rule has exceptions, subconditions, and precedence expressed in its **full source paragraph**.

## Cross-agent always-on obligations (not safely covered by README alone)

| Source | Coverage needed before publication | Review concern |
|---|---|---|
| `CLAUDE.md` introduction and publishing protocol | Auto-loaded Claude context, exact title/caption, verification, publication, source-specific caveats | Substantive details; cannot discard by treating file as a trivial router |
| `AGENTS.md` §6 (starts line 373) | Repository conventions, closed categories, challenge privacy, assets, and broader repo contracts | Long; identify which subrules apply to a page vs. unrelated application maintenance |
| `AGENTS.md` §7 (starts line 1210) | Normal/Plus/Premium publish outputs, pathway/quiz/flashcard, DES, notifications | Distinguish publish-triggered work from passive app feature descriptions |
| `AGENTS.md` §8 (starts line 1441) | Deferred GA4, preconnect, e-namad and global site identity | Must not drop page invariants |
| `AGENTS.md` §9–10 (starts lines 1588, 1611) | Agent behavior and maintenance synchronization | Preserve approval/coordination rules |
| `.dentcast/workflows/agent-parity.md` Rule 0 (starts line 27) | Read-complete rule, AGENTS §6–8 parity, precedence | **Blocks lazy loading until explicitly replaced and tested** |
| `.dentcast/workflows/agent-parity.md` §§1–7 | Confirmation gates, capability fallback, commands, final parity checklist, git protocol | Preserve full contents or explicit required-on-demand routing |
| `.cursor/rules/dentcast-router.mdc` (alwaysApply) | Cursor route discovery and cross-agent prerequisites | Must match Claude/Codex behavior |
| `.cursor/rules/dentcast-publishing.mdc` (conditional) | Full publishing step list, edge-case reminders, mechanical gate | Currently orders complete README read; update only in activation bundle |

## Known source-level conflicts and non-equivalences

1. **Brain append location:** README Hard Rule 3 says append to the absolute end of the single flat array. CLAUDE/AGENTS introductory phrasing mentions the end of a category/section. Do not copy that older wording into the common contract. Existing canonical precedence selects README; actual source text remains unchanged until activation.
2. **DES eligibility:** some introductions say 'every publish', while AGENTS §7 identifies LiteCast and explicit 'no DES' exceptions. The full README Phase B Q4.8 + Phase C 4.13 must determine eligibility. Do **not** infer new conditions from this index.
3. **LiteCast semantic links:** README Hard Rule 11 says mandatory analysis for all types; Rule 10 defines a separate LiteCast link universe and Phase C step 0 overrides specialist actions. Preserve both, rather than interpreting either alone.
4. **English exception scope:** README Hard Rule 12 documents exactly LiteCast and challenge skips. Other tables may abbreviate the exceptions; the full canonical rule wins.
5. **DES/Fidelity ownership:** DES/Fidelity is **one independently versioned opaque scientific subsystem**. Publishing modularization may route to it and record external execution state, but must not change its prompts, scoring or decision logic. Internal per-agent durable checkpoints are explicitly allowed, keyed to source/prompt/model/input versions, with unchanged downstream validation.

## Proposed common-contract loading boundaries (subject to audit)

- **Always:** complete README hard rules; full agent-parity behavior obligations; relevant page-wide invariants; route detection; founder approval and git/merge rules.
- **On relevant publication branch:** full stage module(s) in execution order; any required specialist canonical workflow; appropriate Plus/Premium publish outputs.
- **When touching shared assets or app features:** applicable AGENTS §6–8 detailed rules and tool-specific contracts.
- **When invoking DES/Fidelity:** the unchanged versioned scientific engine and existing invocation rules. Intermediate checker answers may be checkpointed and resumed; the outcome is not final until the original gates finish.
- **Before completion:** all required enrichments, English exceptions, build/version ordering, Phase F mechanical gate and final report.

## Required next verification

1. Create a **line-by-line coverage manifest** for all normative clauses in AGENTS §§6–8, CLAUDE, and agent-parity; the high-level map here is not sufficient for activation.
2. Test that each clause is always loaded or routed to the correct full source file, including conditional and negative constraints.
3. Measure initial and per-route context usage; a short index that still requires full AGENTS/CLAUDE and README has **not** saved tokens.
4. Exercise publication dry runs and recovery scenarios before changing any active entrypoint.
5. Request founder approval for coordinated activation; **never merge automatically**.

## Model-effort review points

**Higher-effort model recommended** for (a) deciding whether every normative clause in AGENTS §§6–8 and CLAUDE can be safely made conditional, (b) resolving contradictory precedence or negative rules, and (c) reviewing the final activation diff for behavioral equivalence. Mechanical extraction, manifest generation, source-line hashing and routine verification do not inherently require the strongest model. This is a recommendation, not an automatic model switch.
