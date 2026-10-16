# Stage 7 — Independent sandbox parity audit (NO-GO for activation)

**Decision: MECHANICAL / SELECTED CONTENT TESTS PASS; FULL CANONICAL BEHAVIORAL PARITY IS NOT PROVEN. Stage 8 activation MUST REMAIN BLOCKED.**

Branch: `refactor/publishing-modular-workflow` only. This is NOT an authorization to publish, deploy, merge or reroute the currently active publishing agents.

## Reproducible evidence

- Source: `.dentcast/workflows/README.md` and original agent parity contract; neither was modified for this test.
- Independent read-only auditor: `tools/audit_dentcast_stage7_parity.py`. Unlike the existing operator-reported schema validators, this checks the **actual bytes / HTML metadata** in a disposable workspace and the externally visible routing requirements.
- Independent fixtures: `tests/test_dentcast_stage7_parity.py`, including a **real Stage 3 file edit** and an independently read and checked resulting HTML page. A valid write/receipt **does not** make the publish pass if its English mirror is missing.
- Existing canonical published-page specimens checked **read-only** against the same observable invariants: `chairside/chairside-41.html` + its en mirror; `sharehub/share-18.html` + its en mirror; `litecast/lite-CAST39.html` on the .ir-only track.
- Seven route variants: ordinary, ordinary+paper, LiteCast, LiteCast+paper, Challenge, Challenge+paper, paper-only. Adversarial fixtures detect wrong stamp sequencing, missing LiteCast registry update, phantom language toggle, English page missing noindex, wrong canonical domain, forbidden cross-ecosystem LiteCast links, >5 links in one `dc-related-section`, missing phase-E push marker and missing page.
- **LATEST VERIFIED CI:** https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/38848195289 — **191 tests passed**, including the Stage 7 independent content probes and four new canonical-tool sandbox tests; the source/contract auditor returned zero issues. These tests run without publication, deployment or touching `main`.
- **Original legacy tools actually executed** in controlled conditions: the unchanged `tools/stamp-version.py` stamped a disposable site, was idempotent, and changed its version when the copied LiteCast index changed; the unchanged `tools/verify_publish.py` rejected a nonexistent test publication with a failing exit code. These are important positive/negative mechanical controls, **not** a successful new end-to-end publish.
- **Actual sandbox edits** were verified for an appended synthetic LiteCast `LightGlossary` item (all previous entries preserved, live source unchanged), and binary WebP byte transport with an independently hashed receipt. An image-container header check is **not** visual validation of a converted clinical image.

## Behavior mismatches found and corrected in staging

1. **Final content/version stamp incorrectly happened before last writes/build.** The original canonical C8 and Phase D demand an idempotent LAST stamp. The staging plan now explicitly includes `build:version-final` **after builders, English mirror if applicable and push marker, immediately before Phase F**; the independent auditor fails a regression to early stamping.
2. **LiteCast index update was at risk of being omitted by a generic brain path.** The staging compiler now requires `page:litecast-register` in the LiteCast route; a separate regression fails when removed. LiteCast has **no specialist brain, taxonomy, English mirror or Phase E push marker**.

3. **The staging editor could not accept actual binary WebP images.** It now accepts binary asset bytes via strict Base64 and signature/size checks in a marked disposable workspace. It does **not** produce or evaluate image conversions; an authorized image operator remains necessary.

All corrections are isolated to the feature branch. Merely checking these routes does not prove semantic link quality or actual clinical evidence analysis.

## Release-blocking deficiencies (cannot honestly certify parity yet)

1. The Stage 3 "module executor" accepts **agent-authored change intents and schema/receipt attestations**. It does not independently perform all 15 canonical publishing jobs. Founder approval assertions in that bridge are **not** independently authenticated approval records. Green tests are therefore not a surrogate for the founder's decisions, original-text preservation, evidence-basket choices or per-sentence scientific correction gates.
2. No complete **same-input, side-by-side, end-to-end publish** from the old workflow and the proposed modular workflow has been executed in isolated disposable workspaces and compared artifact-by-artifact (HTML, brain, LiteCast index, pillar sidecar, builder indexes, Pulse, DES/Fidelity, paper cabinet, en mirrors, final Phase F). Testing selected existing pages and synthetic outputs is useful but is not the same experiment.
3. Actual **Claude/Cursor/Codex independent scientific contexts and stronger-model review**, real Drive filing, admin Challenge handoff, external notification gating and production-equivalent Phase F have not been jointly exercised under the new executor. Stage 6 used independently simulated agent clients, not independently executed models.
4. No truly independent reviewer has attested that all canonical approvals, no-guess exceptions, category mappings and side effects are behaviorally identical after executing them. Existing exact source coverage and static ownership mapping are *not* enough.
5. The proposed run-memory path is in a **public GitHub repository**. Hash-shaped public-release attestations do not establish patient or licensed-text publication consent, so real private article/Fidelity inputs MUST NOT be put into it. A safe external access/approval system remains necessary.

## Stage 7 continuation — 2026-10-16 (independent oracle hardening)

- **Verified CI:** https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/38849674762 — **194 tests passed** after commit `f173c6f5f34525e445089dd5fffd2ef6fa8feac3`, including three additional adversarial tests. The source/contract audit remained green. This is CI of the staging audit and runtime, **not** side-by-side proof of the complete publishing protocol.
- Corrected a **false-positive rule in the independent auditor**: canonical Phase E excludes Glossary as well as LiteCast/paper-only. An auditor that requires a Glossary push marker would wrongly reject valid behavior. The route oracle and synthetic glossary page specimen now enforce the documented exception.
- Hardened LiteCast isolation: specialist destinations are checked after URL resolution against the page URL, so `../glossary/...`, `//dentcast.org/...` and other escaping relative links cannot bypass the existing prefix checks. This does not attest genuine semantic link quality.
- Hardened route negatives: the oracle rejects extraneous evidence/learning/pathway/challenge work in LiteCast and Challenge, and extraneous paper-cabinet steps on unattached-paper routes. This does not launch or validate real external operators.
- **New release blocker found:** the Stage 3 route compiler derives allowed content categories only from `dentcast-brain.json`. Its inspected type inventory contains no `glossary` category, whereas the canonical glossary source is `glossary/glossary.json`. A genuine glossary request therefore cannot pass this compiler as written. Merely whitelisting `glossary` would NOT be safe: glossary source updates and generated index writes are not equivalent to a generic `brain:append` step. This needs a separate canonical source/side-effect/owner mapping, tests, and artifact parity, without guessing behavior.
- **Still NO-GO:** actual old/new same-input isolated publishing comparisons, founder approvals, independent scientific-model execution and confidentiality, production-equivalent Phase F, and evidence of meaningful token savings are unproven. Neither the auditor's green results nor a self-reported intent receipt may unlock Stage 8.

## Stage 7 follow-through — 2026-10-16 (audit finalization, NOT parity acceptance)

**CI proof:** https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/38850508738 — **201/201 staging tests pass**. The independent source/contract auditor also returned `status: PASS` with `issues: []`. This certifies the tested staging checks only. It does **not** certify a complete old/new publish or the scientific / founder gates.

**New concrete safeguards and instruments:**

- `tools/audit_dentcast_stage7_pairwise.py` now inventories the bytes of **two separately marked disposable workspaces**. It requires an explicit list of expected artifacts, hashes every file, detects changed, absent and extra artifacts, disallows symlinks, and exits nonzero on discrepancy. Four adversarial tests include identical copies of genuine existing published-page specimens, missing required artifacts, changed English mirror, extra writes, invalid workspace or symlink. Identical copies test the *comparator*, not independently executed old/new publishing. Its response deliberately sets `full_behavioral_parity_proven: false`.
- Staging write ownership was corrected without editing any canonical builder/scientific source: DES results target `plus/des-scores.json`, generated `plus/quiz-index.json` cannot be directly written by the learning-assets module, and the specialist brain module cannot touch `litecast/lite-glossary.json`. Tests reject each old incorrect write scope.
- The glossary request still **fails closed**, preserving Stage 2's existing `CATEGORY_RULES_NOT_MAPPED` contract rather than inventing a misleading generic brain route. Canonical text identifies its separate `glossary/glossary.json` source, generated `glossary/index.html`, and special term cross-link handoff. This route is not implemented; a Glossary approval cannot be inferred from the synthetic Phase E exception test.
- A new read-only, *real legacy Phase F* run against the existing `sharehub/share-18` produced **196 passed, 0 warned, 4 failed**. The reported failures include a Fidelity `claim_quote` absent from the current page (`fid4 / u160`) and no longer having a homepage Pulse link. An old published page is not a valid **new-publish** green positive control: Pulse rotates with newer content, and historical backlog must not be ascribed to a new modular run. The test now honestly asserts this expected failure instead of faking a pass. No scientific record or public page was changed.
- A static **source-byte**, not token, estimate for an ordinary no-paper route is 224,389 bytes of selected canonical module files against 240,382 bytes for all twelve (**~7% reduction** in module source bytes). This does not account for auto-loaded AGENTS/CLAUDE/Cursor instructions, repeated module loads or model tokenizer usage; no realized token-saving claim is justified.

**Final independent finding:** Stage 7 has produced an actionable, reproducible **NO-GO audit**. The Stage 7 *behavioral-parity acceptance criterion remains unmet*. The instrument is now available to compare actual independently operated old/new disposable publications, but neither this CI nor this chat executed the full pair: it would require authorized public-safe inputs, real domain/operator decisions, trusted founder approval checks, separate model contexts/stronger review, external paper/admin integrations and a clean real final Phase F, all compared artifact-by-artifact. Zero approval, release, deployment, main merge, or Stage 8 activation is implied.

**Required pre-Stage-8 acceptance evidence:** actual paired run manifests and differences for ordinary, ShareHub+paper, LiteCast, Challenge, glossary, episode/NoteCast, correction, and interruption/resumption; evidence of every canonical approval and skip, privacy and scientific independence; positive production-equivalent Phase F on a *new* fixture; and measured **model** context/token usage rather than static file size. If any case cannot be safely executed, record that case as blocked and retain **NO-GO**. Do not downgrade the gate to green for schedule reasons.

## Safe next action

**Do not activate Stage 8.** First run representative *fully authorized, public-safe* end-to-end old/new publications in disposable checkouts using actual operator modules, produce a manifest of paired artifact hashes and independently inspect every difference including approval gates; independently verify real Fidelity models/context isolation and full Phase F. Only after that proof can an explicit founder approval be requested to switch the live router.

This audit is complete as a **no-go finding**, not a certification of finished behavioral parity. The work can continue without changing `main`; founder consent is not required to keep testing safely.
