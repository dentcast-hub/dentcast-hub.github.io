# Stage 9 — pre-activation package and explicit release boundary

**Staging readiness: assembled and tested. Actual activation: BLOCKED.**

Stage 7 is accepted in its intentionally limited offline scope.
Stage 8 provides a new read-only 17-case integration and live-instruction drift gate.
This document defines the Stage 9 handoff, without changing any active
publication path or weakening any approval gate.

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
