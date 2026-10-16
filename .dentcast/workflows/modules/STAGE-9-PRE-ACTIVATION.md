# Stage 9 — pre-activation package and explicit release boundary

**Staging readiness: assembled and tested. Actual activation: BLOCKED.**

Stage 7 is accepted in its intentionally limited offline scope.
Stage 8 provides a new read-only 17-case integration and live-instruction drift gate.
This document defines the Stage 9 handoff, without changing any active
publication path or weakening any approval gate.

**Integration evidence:** https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/38855544071 — 223 passing tests and Stage 8 preflight with 17 checked routes and zero issues. No gate below was opened by those tests.

## Final Stage 9 offline acceptance — 2026-10-16

**OFFLINE STAGE 9: PASS. Production activation and main merge: NOT PERMITTED.**

- [Verified GitHub Actions run 38862612815](https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/38862612815) passed **235 tests across 19 suites**, including 4 new release-scope/rejection tests.
- The independent original Stage 2 source/contract audit passed; the Stage 8 route audit checked **17 variants** without issues and the unchanged original Phase F LiteCast synthetic fixture remains passing.
- `tools/dentcast_stage9_release_dossier.py --baseline-ref origin/main` returned `FINAL_STAGING_HANDOFF_PASS`, with **96 changed files, 0 outside the permitted staging paths**, five active entrypoints and the two scientific core files byte-identical to the fetched main baseline, and all **seven external activation gates closed**.
- CI tested executable SHA `88ca484a4451b4f0a6d6abd6cc01538a20efb516`; main baseline `aeab61a5b5c5e29925ae2d591c2e60144b783806`. At the time of this run, the long-lived feature branch was **one commit behind main**. This must be reconciled and rechecked before any future merge; it is not permission to do that now.
- The final gate can be rerun in a full-history checkout using the CLI above. It reports the current candidate SHA and exact baseline automatically; the documented SHA is *audit evidence*, not an automatically updated release pointer.
- No site content, real article, live publication entrypoint, scientific engine or real external service was changed by this stage. The only new executable capability is a **read-only, fail-closed release inspection**.

**Project disposition:** development and offline/Sandbox validation of all nine stages is complete. **The modular replacement is not active or proven to save tokens in real publishing sessions**; genuine operator/science/approval and full old/new end-to-end verification are intentionally deferred to a separately authorized activation effort. No `STAGING_FINAL_ACCEPTED` label can override those seven gates.

## Feature-branch entrypoint migration (after offline Stage 9 acceptance)

A new staging-only migration preserves the full original `README.md` as `README.legacy.md`, original root `CLAUDE.md` / `AGENTS.md` as `*.legacy.md`, original `agent-parity.md` as `agent-parity.legacy.md`, and three Cursor rules in `.dentcast/workflows/legacy/cursor/`. The active equivalents on **this feature branch only** now point to a guarded 12-module staging router. The original scientific engine and prompt remain unchanged.

All original-byte tests now check the preserved legacy files against `origin/main`; the new active connectors are **deliberately different** and are required to include `STAGING_ONLY_NO_LIVE_PUBLISH`. Do NOT confuse this with the earlier static Stage 9 check that required the ACTIVE entrypoints to match main. The branch must again pass CI after the migration. Full runtime and seven external production gates remain CLOSED. No merge, publication or live activation is authorized by staging tests.

## Verified staging package

- Route compiler: `tools/dentcast_stage3_route.py`
- Independent route oracle: `tools/audit_dentcast_stage7_parity.py`
- Cross-client GitHub handoff: `tools/dentcast_stage6_handoff.py`
- Original scientific system is immutable: `tools/des_fidelity_units.py` and
  `.dentcast/des-v3.4-knowledge.md`
- Stage 8/9 preflight: `tools/dentcast_stage8_9_preflight.py`
- Tests: `tests/test_dentcast_stage8_9_preflight.py`
- CI: `.github/workflows/publishing-route-staging-tests.yml`, with
  `origin/main` fetched and all baseline identities checked.

### Staging pass meaning

`STAGING_INTEGRATION_PASS` establishes only that representative compiler routes
are complete against the independent mechanical oracle and current active
entrypoint/scientific bytes match the fetched `main` baseline.

`PRE_ACTIVATION_PACKAGE_READY_ACTIVATION_BLOCKED` means the release-review
package is available, **not** that release/activation, merge, human approval,
semantic judgment or full behavioral parity is authorized.

## Pre-activation checks, currently CLOSED

Every item requires independently inspectable execution/provenance before
its own gate can be opened. The staging checker MUST NOT accept hash-shaped
operator assertions or a Boolean as permission.

1. **Founder approval:** authenticate the human decision against exact
   content SHA, category, route, change set, version and deployment scope.
2. **Science:** independently run actual checker models and stronger review
   with isolated contexts; preserve the original DES/Fidelity prompt, source
   basis, scores, votes, correction gates and complete resume semantics.
3. **Confidentiality:** establish a genuinely private, access-controlled store
   for patient data, full-text copyrighted/licensed sources, private Challenge
   answers and sensitive results. The public git history is not such a store.
4. **External service contracts:** exercise approved isolated Drive, Admin and
   notification integration gates with authorized accounts and safe test data.
5. **Complete behavioral parity:** execute complete old/new same-input
   publishing workflows in separately protected, disposable environments;
   review every semantic link and diff all generated files, indexes, sidecars,
   English variants, affected neighbors, and final Phase F.
6. **Runtime load/savings:** measure actual client-side read/instruction context
   for Claude Code, Codex and Cursor; prove source precedence and all-global-rule
   loading before replacing any `read-all` requirement. No numeric token
   saving is claimed by Stage 8 or 9.
7. **Independent review and release decision:** sign off on the verified
   source-to-clause and exception matrix and obtain a NEW explicit founder
   decision for the exact coordinated entrypoint change, then separately
   authorize any `main` merge or production publication.

## Exactly how future cutover would proceed (NOT EXECUTED)

1. Freeze and verify the feature branch SHA, `main` SHA and intended diff.
2. Produce dated authenticated evidence for **all seven closed gates** above.
3. Obtain explicit founder review of the five-entrypoint atomic change
   proposal. Preserve full authoritative rules; never activate a short shim
   that hides a mandatory global instruction.
4. Prepare a reversible, single-change cutover with before/after hashes,
   branch protection and rollback plan; do not modify the DES/Fidelity engine.
5. Run final full old/new acceptance and a real final Phase F before requesting
   **separate permission to merge**.
6. Without all these proofs, keep the current original README/read-all router
   active and retain the new modules as staging-only development artifacts.

## Scope and disposition

**Stage 9 offline release-preparation: complete.**
**Live Stage 9 activation: not started, not permitted, not represented as done.**
The deliverable is a rigorously closed release boundary and repeatable
integration handoff, not a silently enabled publishing path.

No `main` merge, real article, Drive/Admin interaction, push notification,
production deployment or live router rewiring is authorized by this file.
