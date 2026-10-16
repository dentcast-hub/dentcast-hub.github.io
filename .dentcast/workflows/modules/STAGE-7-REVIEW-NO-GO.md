# Stage 7 — Independent sandbox parity audit (NO-GO for activation)

**Decision: MECHANICAL / SELECTED CONTENT TESTS PASS; FULL CANONICAL BEHAVIORAL PARITY IS NOT PROVEN. Stage 8 activation MUST REMAIN BLOCKED.**

Branch: `refactor/publishing-modular-workflow` only. This is NOT an authorization to publish, deploy, merge or reroute the currently active publishing agents.

## Reproducible evidence

- Source: `.dentcast/workflows/README.md` and original agent parity contract; neither was modified for this test.
- Independent read-only auditor: `tools/audit_dentcast_stage7_parity.py`. Unlike the existing operator-reported schema validators, this checks the **actual bytes / HTML metadata** in a disposable workspace and the externally visible routing requirements.
- Independent fixtures: `tests/test_dentcast_stage7_parity.py`, including a **real Stage 3 file edit** and an independently read and checked resulting HTML page. A valid write/receipt **does not** make the publish pass if its English mirror is missing.
- Existing canonical published-page specimens checked **read-only** against the same observable invariants: `chairside/chairside-41.html` + its en mirror; `sharehub/share-18.html` + its en mirror; `litecast/lite-CAST39.html` on the .ir-only track.
- Seven route variants: ordinary, ordinary+paper, LiteCast, LiteCast+paper, Challenge, Challenge+paper, paper-only. Adversarial fixtures detect wrong stamp sequencing, missing LiteCast registry update, phantom language toggle, English page missing noindex, wrong canonical domain, forbidden cross-ecosystem LiteCast links, >5 links in one `dc-related-section`, missing phase-E push marker and missing page.
- **FINAL CI**: https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/38848025544 — **187 tests passed**, including 13 Stage 7 content-level tests, and the canonical source/contract audit returned zero issues. The CI suite remains staging-only and read-only with respect to GitHub remote publication.

## Behavior mismatches found and corrected in staging

1. **Final content/version stamp incorrectly happened before last writes/build.** The original canonical C8 and Phase D demand an idempotent LAST stamp. The staging plan now explicitly includes `build:version-final` **after builders, English mirror if applicable and push marker, immediately before Phase F**; the independent auditor fails a regression to early stamping.
2. **LiteCast index update was at risk of being omitted by a generic brain path.** The staging compiler now requires `page:litecast-register` in the LiteCast route; a separate regression fails when removed. LiteCast has **no specialist brain, taxonomy, English mirror or Phase E push marker**.

All corrections are isolated to the feature branch. Merely checking these routes does not prove semantic link quality or actual clinical evidence analysis.

## Release-blocking deficiencies (cannot honestly certify parity yet)

1. The Stage 3 "module executor" accepts **agent-authored change intents and schema/receipt attestations**. It does not independently perform all 15 canonical publishing jobs. Founder approval assertions in that bridge are **not** independently authenticated approval records. Green tests are therefore not a surrogate for the founder's decisions, original-text preservation, evidence-basket choices or per-sentence scientific correction gates.
2. No complete **same-input, side-by-side, end-to-end publish** from the old workflow and the proposed modular workflow has been executed in isolated disposable workspaces and compared artifact-by-artifact (HTML, brain, LiteCast index, pillar sidecar, builder indexes, Pulse, DES/Fidelity, paper cabinet, en mirrors, final Phase F). Testing selected existing pages and synthetic outputs is useful but is not the same experiment.
3. Actual **Claude/Cursor/Codex independent scientific contexts and stronger-model review**, real Drive filing, admin Challenge handoff, external notification gating and production-equivalent Phase F have not been jointly exercised under the new executor. Stage 6 used independently simulated agent clients, not independently executed models.
4. No truly independent reviewer has attested that all canonical approvals, no-guess exceptions, category mappings and side effects are behaviorally identical after executing them. Existing exact source coverage and static ownership mapping are *not* enough.
5. The proposed run-memory path is in a **public GitHub repository**. Hash-shaped public-release attestations do not establish patient or licensed-text publication consent, so real private article/Fidelity inputs MUST NOT be put into it. A safe external access/approval system remains necessary.

## Safe next action

**Do not activate Stage 8.** First run representative *fully authorized, public-safe* end-to-end old/new publications in disposable checkouts using actual operator modules, produce a manifest of paired artifact hashes and independently inspect every difference including approval gates; independently verify real Fidelity models/context isolation and full Phase F. Only after that proof can an explicit founder approval be requested to switch the live router.

This audit is complete as a **no-go finding**, not a certification of finished behavioral parity. The work can continue without changing `main`; founder consent is not required to keep testing safely.
