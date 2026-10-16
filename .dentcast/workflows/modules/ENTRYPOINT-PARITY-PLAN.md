# Cross-agent entrypoint parity — activation plan (NOT ACTIVE)

## Scope and source-of-truth findings

The existing five entrypoints have **not** been edited:
- `CLAUDE.md` — Claude's auto-loaded repository instructions; contains substantial substantive repo rules and publishing detail.
- `AGENTS.md` — agent-neutral instructions, including repo conventions (§6), Plus/Premium (§7), site-wide invariants (§8), agent behavior (§9), and maintenance (§10).
- `.cursor/rules/dentcast-router.mdc` — alwaysApply Cursor routing and parity requirements.
- `.cursor/rules/dentcast-publishing.mdc` — conditional Cursor publishing workflow and stage checklist.
- `.dentcast/workflows/agent-parity.md` — shared behavior contract, Rule 0 currently requires reading the complete canonical workflow and AGENTS §6–8.

**Critical:** Simply pointing any of these to `modules/STAGE-ROUTER-DRAFT.md` would conflict with Rule 0 and would not reduce total context cost. In particular, CLAUDE.md and AGENTS.md contain global rules that cannot safely be dropped or treated as duplicated summaries.

## Safe future activation (all-or-nothing)

1. Produce a **complete, reviewed global-invariants contract** that preserves all relevant obligations from README hard rules, CLAUDE, AGENTS §§6–8, and agent-parity. Separate always-required rules from optional capability/workflow references without losing precedence.
2. Establish the source of truth for every invariant and a source-line mapping; handle existing contradictions explicitly (e.g. the flat brain array is append-to-absolute-end per README Hard Rule 3; some older entrypoint language refers to category sections). The canonical README prevails until a reviewed resolution.
3. Build a small entrypoint shim for Claude/Codex/Cursor with identical route selection, required global contract, stage loading, approval gates and final validation. Preserve Cursor alwaysApply and agent-specific loading semantics.
4. Update **all five entrypoints together** only after stage and behavior parity tests pass. Existing CLAUDE maintenance instructions require mirroring changes to AGENTS and Cursor routing in the same commit; use a coordinated atomic change path, not piecemeal live activation.
5. Do not change DES/Fidelity prompts or scientific algorithm. Its implementation is independently versioned. Router invokes the **one opaque subsystem** according to existing eligibility and skip rules. Durable per-agent checkpoints are permitted for interruption recovery, keyed by version and input fingerprints, without altering the algorithm.
6. Confirm with founder before enabling a new live publishing path or merging. Work stays on `refactor/publishing-modular-workflow`.

## Verification scenarios to run

| Scenario | Must preserve |
|---|---|
| Ordinary specialist Insight | Correct same-type template, approved title/caption, semantic links, pillar, bilingual mirror, version and final gate |
| LiteCast | Independent `.ir` data and linking, no English mirror |
| Challenge | Private answer excluded from public git, correct skips and markup |
| ShareHub with several sources | Original evidence-basket rules and unchanged DES/Fidelity subsystem |
| NoteCast and parent episode | Shared evidence and credit semantics |
| New glossary term | Scope-limited cross-linking and global five-link budget |
| Paper-only attachment | Cabinet/Drive actions without invented article text |
| Title/caption correction | Full downstream sweep, builders and version restamp |
| Interruption during Fidelity | Resume from durable completed agent outputs, still run all remaining voting/founder gates |

## Status

This is a plan and a conflict audit, **not** a live router, a completed parity test, or a checkpoint implementation. The 12 extracted publishing modules and the unchanged original README coexist for review. No production entrypoint has been switched.
