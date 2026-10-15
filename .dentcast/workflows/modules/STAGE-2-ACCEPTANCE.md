# Stage 2 — completed canonical contract audit (staging)

**Status: COMPLETE for contract/route/source audit. NOT a proof of end-to-end executable behavioral parity.**

Audit baseline: canonical `.dentcast/workflows/README.md` on `refactor/publishing-modular-workflow`; original active publishing entrypoints are deliberately unchanged. No merge, deployment, real publishing, DES/Fidelity protocol edit, or production activation is authorized by this report.

## What passed and how to reproduce

- Canonical README: **2,598 lines**; all **12** named source slices in `.dentcast/workflows/modules/01-*.md` through `12-*.md` are exact, contiguous text spans of the canonical source. Their union covers **every non-whitespace character** of the original. The static audit explicitly fails for modified/missing text.
- All **17 numbered hard rules** are mapped to owning module(s), as are all canonical heading spans; ownership is traced through the source slices and the explicit section map in `INTERNAL-VALIDATION-AND-ROUTE-PLAN.md`.
- All **15** conceptual module IDs exist in both draft contracts, with identical unconditional dependencies. The graph is checked for missing entries, unknown references, self-reference and cycles.
- All **5** production publishing entrypoints (`CLAUDE.md`, `AGENTS.md`, two Cursor router files and `agent-parity.md`) continue to direct agents to the original canonical workflow. The audit fails if a live entrypoint switches to the staging orchestrator.
- **7 route fixtures** (paper-only, ordinary, ordinary+paper, LiteCast, LiteCast+paper, Challenge, Challenge+paper), additional category variations, and negative/fail-closed cases are exercised. These assert the *staging route skeleton* and explicitly do not grant execution permission.
- Notification is contracted as **two separate phase-scoped invocations**: `notification:pulse` at C6 before Build, and `notification:push-marker` at E after D if applicable; the latter is omitted for LiteCast and glossary while Challenge keeps it. For LiteCast, specialist link actions are replaced by **its own 0.5/0.6** analysis, not skipped without a counterpart.
- The status of the existing read-only intake adapter is explicitly versioned `0.1`; the future `1.0-draft` module schema is different and cannot be silently substituted.

**Reproduce locally (read-only):**

```bash
python3 tools/audit_dentcast_stage2_contract.py
python3 -m unittest discover -s tests -p 'test_dentcast_stage2_contract.py' -v
python3 -m unittest discover -s tests -p 'test_dentcast_route_dependencies.py' -v
```

GitHub Actions passed on commit `31dfd21a00af16e04c9a8f2353a7228c0f3352e7`: [staging audit and tests](https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/38792785122). The dedicated CI job includes the previous staging suite and the new static audit, and watches canonical/entrypoint/contract changes.

## Canonical routing and approval decisions locked for Stage 3

| Canonical behavior | Contractual requirement / source |
|---|---|
| Paper only | Phase 0 + 4.10 Parts **1 and 2 only**, catalog commit; **no Part 3, build, English, Phase E/F page gate** |
| Publish + attached paper | Phase 0 + 4.10 Parts **1, 2, 3** before Build, in addition to the full page route |
| Specialist ordinary | Same-category page C2, taxonomy lock C2.4 before dependent writes, C2.5/C2.6, fresh 4.7–4.9, brain tail, pathway assessment, Pulse C6, version C7, Build C8, English D, Phase E marker when eligible, Phase F |
| LiteCast | `litecast/lite-glossary.json` and .ir identity; 0.5/0.6 internal linking, C6 Pulse, C7/C8 build, **no specialist taxonomy/brain/pathways, English D or push marker E** |
| Challenge | Ordinary specialist page/brain/taxonomy/Pulse/build and Phase E/F still apply; 4.11/4.12/4.13, pathway placement and English D explicitly skipped. Admin answer stays **outside public Git** |
| Glossary | Specialist enrichment + build and English D; **Phase E marker skipped** |
| NoteCast / Episode | Parent episode update, shared evidence-basis rules and episode-specific related-link surfaces; no generic template shortcut |
| DentCast+ | FAQ and quiz use own canonical type rules; flashcards can be documented optional based on actual clinical source, never fabricated |
| DES / Fidelity | Source-basket and text-basis gate preserved; 2 independent checker contexts with identical pinned input/model, optional disagreement-only third, vote, stronger adjudication/review, per-differing-sentence founder approval (4.13) |
| Founder approvals | Preserve `agent-parity.md` nonautomatable gates (intro paragraph, unknowable facts, ambiguous taxonomy/links, paper Drive/DOI, external side effects, DES basket choice, per-unit Fidelity corrections, learning-pathway gates). A green Phase F never substitutes for fresh semantic analysis receipts |
| Text edits | HR16 exact user-provided codepoints and HR17 sweep all derived surfaces, rebuild, final Phase F |

Source map: `INTERNAL-VALIDATION-AND-ROUTE-PLAN.md` includes all 17 hard rules and all canonical phase and section owners.

## Stage 2 defect dispositions

1. **LiteCast build incorrectly requiring specialist brain** — corrected registry and module contract; regression test now expects *no* dependency violation.
2. **Taxonomy/page ordering** — contracted as C2 page draft then C2.4 taxonomy lock, with taxonomy-dependent writes delayed; unconditional contract and registry aligned. Future compiler must enforce the boundary rather than combining it into one unsafe write.
3. **LiteCast missing link/Pulse stages in planner** — corrected draft route skeleton, with internal only links; Phase E remains separately skipped.
4. **Build/English wrong order** — corrected draft skeleton and the phase-dependent English contract.
5. **Pulse/Phase E conflation** — split invocation identities in the contract; executable repeated substep scheduling remains a Stage 3 implementation requirement.
6. **Paper-only verification conflation** — corrected unconditional verify prerequisites and explicit route completion behavior; no false Phase F page receipt.
7. **DES independent checkpoints and separate v0.1 vs v1.0 schemas** — documented with fail-closed compatibility requirement; implementation and scientific end-to-end proof await Stage 3/5/7.
8. **Obsolete CI test asserting the old LiteCast defect** — replaced; negative test now detects deliberate reintroduction.

## What Stage 2 does NOT establish

**Contract conformance is not execution parity.** Fourteen real module adapters, conditional predicate compilation, phase-scoped scheduling, all interactive approvals, GitHub remote CAS, nested Fidelity cross-agent resume, real side effects and end-to-end golden publication fixtures are **not** implemented or demonstrated by this stage. These are deliberately passed to Stages 3–7. Before activation, execute real adapters in isolated staging, independently compare with canonical outputs and demonstrate no lost gate, exception, timing or side effect. Any discrepancy fails closed.

**Founder action required to close Stage 2: none.** This accepted contract baseline authorizes continued staged implementation **only** on the feature branch. It does not authorize merge/activation/publication.
