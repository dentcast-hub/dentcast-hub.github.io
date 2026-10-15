# Publishing modularization — dependency and activation audit

**Status:** design and dependency audit only. No live router switch; no checkpoint implementation; no merge.

## Findings

1. **Canonical read rule is a blocker to lazy loading.** `.dentcast/workflows/agent-parity.md` Rule 0 requires reading the entire canonical workflow on every run. `.cursor/rules/dentcast-publishing.mdc` also requires the full README. A new modular router must amend those rules in sync, otherwise splitting files cannot reduce context usage.
2. **Global repo rules are large and cross-cutting.** `CLAUDE.md` and `AGENTS.md` are not lightweight equivalents. Agent-parity Rule 0 also requires AGENTS sections 6–8 on every publish. These need a parity-preserving, minimal global contract before lazy loading can be claimed.
3. **The first extraction is lossless but not yet optimal for lazy loading.** `03-page-and-links.md` includes LiteCast, template, taxonomy, navigation, and cross-links; `07-finalize-build.md` includes challenge, hashtags, brain, learning pathways, and build. They are grouped by contiguous source line ranges, not clean semantic execution boundaries.
4. **External workflow references are authoritative.** Phase D delegates to `en-version.md`; glossary cross-linking delegates to `cross-link.md`; challenges to `.dentcast/challenge-handoff.md`; DES to `.dentcast/dentcast-evidence-score-v3.4.md` (verify current spec at runtime); attached-paper ingestion has Drive-specific steps. Do not inline or reimplement these contracts.
5. **Not all branches are equivalent.** LiteCast uses `litecast/lite-glossary.json`, stays on `.ir`, and skips the English mirror. Challenges require explicit handling of private answers and skip several learning/English steps. Episode/NoteCast pairs may share evidence results. DES eligibility follows cited sources, not content category.
6. **Order and invalidation matter.** Pillar/subtopic is decided before related capsules and brain write; shared five-link budget spans multiple enrichment steps; title/caption edits require a sweep; hash stamping must follow all hashed writes; Phase F is mandatory and semantic review is not replaced by it.
7. **Founder approval barriers are stateful dependencies.** Titles/captions, ambiguous semantic decisions, certain DES/Fidelity corrections, and git/merge decisions must not be silently inferred from a previous or unrelated approval.

## Proposed loader contract (NOT activated)

- At entry: read a short stage router, the **complete approved global invariant contract**, and agent parity; identify publishing route and conditional branches.
- Read intake module and required authoritative source-of-truth files for discovery.
- At each stage: read only that stage's full module plus its referenced authoritative specialty workflow and its declared dependencies.
- Record the step outcome in an in-session execution ledger even before durable checkpoints exist. Do not treat the ledger as crash-safe.
- Mandatory enrichment, English exceptions, notification, and mechanical gate must be explicitly resolved.
- If a dependency changes, revisit affected downstream stages. Do not silently treat earlier work as valid.
- Keep `README.md` canonical and all current entrypoints unchanged until loader and global-rule parity are reviewed and behavior-tested.

## Cross-stage dependency matrix

| Stage | Requires | Produces / locks | Conditional or risk |
|---|---|---|---|
| Routing/intake | User content, category discovery, same-category precedent, brain | Category, approved title/body, source basket, media and challenge decisions | Unknown metadata requires questions; do not guess |
| Page/template | Locked category and approved text | New page, template identity | Same-category-only cloning; LiteCast special route |
| Taxonomy | Live main taxonomy and body | Pillar/subtopic decision | Never silently recompute after lock |
| Navigation/enrichment | Pillar decision, brain, glossary, final-ish body | Capsules, backlinks, inline links, related links | 5-link shared cap; mandatory fresh semantic analysis |
| Attached paper | Paper file and citation metadata | Cabinet record, DOI/credit links | Drive capability, copyright and exact metadata |
| Learning content | Final text and category | Flashcards, quiz | Explicit challenge/LiteCast skips |
| DES/Fidelity | Cited source inventory, exact source text, final page claims, spec version | Source records, votes, founder review, final fidelity record | Multiple sources, same text basis, no invented DOI; changed claims invalidate votes |
| Challenge | Explicit challenge decision, approved public question | Public markup and private admin handoff | No private answer in repo; different skip path |
| Brain/pathways | Category, locked taxonomy, final page, tags | Brain entry, learning placement | Append to absolute end; gate bundle |
| Build/version | All content-affecting writes | Generated indexes, content stamp | Re-run stamp after any hashed write |
| English | Finished Persian page | English mirror and two-way toggle | Skip only LiteCast/challenge |
| Notification | Completed page and route | Publish marker | Only proper .org publish path |
| Mechanical gate | All applicable outputs | Verification report | Nonzero exit means incomplete; warnings require review |

## Required parity gates before activation

1. Audit every hard rule and external referenced workflow for correct loading and precedence.
2. Refine oversized contiguous modules by **verbatim movement**, with a machine-verifiable reconstruction manifest or equivalent.
3. Align `CLAUDE.md`, `AGENTS.md`, Cursor routers and `agent-parity.md` in one coordinated activation change; do not leave conflicting read-all rules.
4. Run representative dry-run scenarios: ordinary Insight, LiteCast, challenge, multi-source ShareHub, NoteCast+episode shared evidence, glossary, paper attachment, correction after initial publication.
5. Verify mandatory stage coverage, user approval stops, unchanged outputs and final mechanical gate. **No such behavior test has been executed yet.**
6. Only after these gates, activate lazy loading; only then design persistent checkpoints based on stabilized stage boundaries.

## Audit limitation

This is a dependency/architecture review of repository instructions, not an execution-level parity proof. In particular, the 2,598-line original README remains canonical; the new modules have not been exercised by a publishing agent.
