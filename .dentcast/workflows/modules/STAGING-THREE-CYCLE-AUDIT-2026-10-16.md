# Historical modularization development record — not live instructions

This document records staging development at its original revision. Its former branch directions, activation status, backup-reading requirements and proposed workflow routes are historical, not current execution instructions.
For live work read `.dentcast/workflows/README.md`, `.dentcast/workflows/global/README.md` and `.dentcast/workflows/agent-parity.md`.
For «انتشار ناقص داشتم», first read `.dentcast/PUBLISH-HANDOFF.md`, then `.dentcast/workflows/publish-handoff.md`.
Staging utilities remain restricted to staging. Do not follow the historical steps below to resume a real publication or assume their test results describe the current branch.
Current repair branch and status: `.dentcast/workflows/PUBLISHING-REPAIR-PLAN.md`.

---

## Historical record (non-operative)

# DentCast publishing modularization — three-cycle final sandbox audit

**Date:** 2026-10-16  
**Branch:** `refactor/publishing-modular-workflow`  
**Final tested executable SHA:** `5225c8a359c2ecbdd6a1aa9ead17fd68f966c9d7`  
**Scope:** offline, disposable sandbox and CI checks; **no real publishing**.

## Reproducible cycles

| Cycle | Adversarial / functional focus | Concrete corrections | Verified CI |
|---|---|---|---|
| 1 | Normal staging paths plus malformed input, nested protected paths, and noncanonical aliases | Reject non-string edit paths without uncaught AttributeError; protect nested .git/.dentcast/tools/tests/admin, reject normalized path aliases | [226/226 PASS](https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/38858420618), commit `3627558f` |
| 2 | Restart/integrity and receipt laundering via symlinked parent or two names for the same file | Share canonical artifact path guard across receipt creation and verification; reject symlink ancestors and path aliases | [228/228 PASS](https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/38858568544), commit `223746a6` |
| 3 | Independent final integration and regression; JPEG handling and removal of required routing steps | Accept legitimate lowercase `.jpeg` in the page binary-asset writer, keep header-mismatch rejection; adversarial omissions of glossary register, LiteCast register, English mirror and Challenge step rejected by independent oracle | [231/231 PASS](https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/38858802408), tested commit `5225c8a` |

The initial cycle-3 synthetic JPEG fixture had incorrectly escaped header bytes; it was corrected in `5225c8a` and the **full suite passed on that revision**, rather than treating the previous attempted fixture as successful.

### Final CI evidence

- All **231** tests in 18 suites passed, including pre-existing paired byte-output tests of separately marked disposable workspaces and canonical unmodified builder/stamper tests.
- The *original* Phase F run on a **synthetic LiteCast** returned **23 passed, 0 warned, 0 failed**; a deliberately altered title is rejected in the existing fixture.
- Stage 2 source/contract audit: **PASS**, no issues.
- Stage 8–9 read-only preflight: **`STAGING_INTEGRATION_PASS`**, 17 combinations verified, no issues; existing five live entrypoints and two DES/Fidelity core source files matched fetched `origin/main` bytes.
- Stage 9 only: **`PRE_ACTIVATION_PACKAGE_READY_ACTIVATION_BLOCKED`**.
- All four CI workflows on final tested SHA (staging, NUL guard, asset-version guard, Spot loader guard) concluded **success**.

### Explicit limits and disposition

**STAGING FINAL ACCEPTED** for the bounded offline/Sandbox mechanics audited here.

This is NOT proof of full semantic parity of two independently operated real publication workflows, real scholarly evidence judgments, human founder approval, private paper/clinical data authorization, real Claude/Cursor/Codex independent model sessions, successful Drive/Admin/notification effects, or true production token savings. Those requirements are explicitly kept as **closed pre-activation gates** in `STAGE-9-PRE-ACTIVATION.md`. Success of unit tests or mock operators is not substituted for those external facts.

**No real publication, deployment, main merge, live publishing-entrypoint change, activation of modular router or DES/Fidelity scientific engine modification.** Existing live read-all publishing path remains in place.

**Next action:** ready to begin a separately authorized Stage 9 activation-review workstream; do not perform cutover or merge on the strength of this report alone.
