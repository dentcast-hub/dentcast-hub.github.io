# Historical modularization development record — not live instructions

This document records staging development at its original revision. Its former branch directions, activation status, backup-reading requirements and proposed workflow routes are historical, not current execution instructions.
For live work read `.dentcast/workflows/README.md`, `.dentcast/workflows/global/README.md` and `.dentcast/workflows/agent-parity.md`.
For «انتشار ناقص داشتم», first read `.dentcast/PUBLISH-HANDOFF.md`, then `.dentcast/workflows/publish-handoff.md`.
Staging utilities remain restricted to staging. Do not follow the historical steps below to resume a real publication or assume their test results describe the current branch.
Current repair branch and status: `.dentcast/workflows/PUBLISHING-REPAIR-PLAN.md`.

---

## Historical record (non-operative)

# Stage 8 — offline integration check (feature branch only)

**Goal:** make the accepted Stage 7 mechanical workflow a single repeatable,
independently inspectable integration check before considering any entrypoint switch.
This is a **staging preparation stage**, NOT a live router deployment.

## Executable integration boundary

Run from the checked-out `refactor/publishing-modular-workflow` branch:

```bash
python tools/dentcast_stage8_9_preflight.py --baseline-ref origin/main
```

- Compiles **17 representative combinations**: clinical/Insight, Chairside,
  ShareHub, NoteCast, episode, glossary, LiteCast, and Challenge, each with and
  without an attached paper; and paper-only.
- Re-runs the independent canonical Stage 7 route oracle on each compiled plan
  and checks all step source paths, uniqueness, predecessor dependencies, the
  mandatory first intake and disabled execution flags.
- Compares the **actual bytes** of all five currently active Claude/Codex/Cursor
  publishing/parity entrypoints and both primary DES/Fidelity engine/spec files
  against the local fetched `origin/main` version. A missing baseline, source
  drift, invalid plan, missing source, or unaccepted Stage 7 record blocks.
- GitHub Actions checks out full history, runs all original tests, new negative
  Stage 8 tests and the CLI gate, and independently runs the Stage 2 source audit.
- There is **no network access in the gate, no private input, no model inference,
  no approvals, no GitHub write, no publication and no production change**.

A successful result is `STAGING_INTEGRATION_PASS`, not `PUBLISHED` or
full end-to-end semantic/production behavioral parity. Original external
operators, actual scientific checks, real page builds and approvals are
still required at activation time.

**Source caution:** If upstream `main` changes a live instruction/spec after
Stage 8, the baseline comparison may block until changes are reviewed and the
feature branch reconciled. Do not silently approve drift.

**Verified staging CI:** https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/38855544071 — 223 passing unit tests; Stage 2 source audit PASS; read-only CLI output `STAGING_INTEGRATION_PASS`, 17 routes and no issues. The live-entrypoint and scientific baseline was identical to `origin/main`.

## Acceptance

The Stage 8 staging integration is accepted only when:
1. All 17 compiled route variants pass the independent route oracle.
2. Live entrypoints and scientific files are byte-identical to `origin/main`.
3. All staging test suites, Stage 2 audit and Stage 8/9 CLI pass in CI.
4. There is no effective publish/merge/activation permission in the result.

Stage 9's explicit closed activation boundary is documented in
`STAGE-9-PRE-ACTIVATION.md`. No permission to switch the real router is implied.
