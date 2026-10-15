# Staging agent entrypoint — same for Claude Code, Cursor, Codex

**Scope:** modularization development on `refactor/publishing-modular-workflow` only. This file is not an active publishing router. No main merge, no publish/deploy, no activation.

## Simulation: start as Claude Code

1. Read root `CLAUDE.md`. For real publishing it points to `.dentcast/workflows/README.md`, plus `.dentcast/workflows/agent-parity.md` and `dentcast-brain.json`. **It does NOT route to the new modular orchestrator.**
2. For staging modularization, read `.dentcast/workflows/modules/CROSS-AGENT-HANDOFF.md`, then `ORCHESTRATOR-CONTRACT.md`, module registry, and canonical workflow.
3. Run the **same staging command** below.

## Simulation: start as Cursor

1. Read `.cursor/rules/dentcast-router.mdc` (alwaysApply true) and `.cursor/rules/dentcast-publishing.mdc` (publishing scope); the first explicitly sends Cursor to `AGENTS.md` sections 6–8 and `agent-parity.md`, and the publishing router points to `.dentcast/workflows/README.md`. **Neither routes to the new modular orchestrator.**
2. For staging modularization, read `.dentcast/workflows/modules/CROSS-AGENT-HANDOFF.md`, then `ORCHESTRATOR-CONTRACT.md`, module registry, and canonical workflow.
3. Run the **same staging command** below.

## Simulation: start as Codex / GPT

1. Read `AGENTS.md` and `.dentcast/workflows/agent-parity.md`; for publishing use canonical `README.md`.
2. For staging modularization, read the same `CROSS-AGENT-HANDOFF.md` and contracts.
3. Run the **same staging command** below.

## Single platform-neutral dry-run command

Create a **local private temporary** JSON file with explicit request fields, e.g.
`{"has_text":true,"has_paper":false,"category":"clinical","challenge":false}`.

```bash
python3 tools/dentcast_orchestrator_draft.py \
  --request /path/to/private/request.json \
  --run-id test-001 \
  --revision "$(git rev-parse HEAD)" \
  --checkpoint /path/to/private/staging-checkpoint.json
```

This calls draft route planner -> validator -> the single read-only `intake` adapter -> validated checkpoint receipt -> optional private atomic save. It **does not** run page, taxonomy, DES/Fidelity, builders, or publishing. It never grants execution authority.

**Readiness rule:** No change to live entrypoints until every logical module is callable, canonical clause-level behavioral parity is proven, and the founder explicitly approves activation. Do not misrepresent this staging guide as an automatic route for either agent.

## What the current simulated walkthrough proves (and does not)

- Static file inspection verifies both agents' *live publishing* references converge on the original canonical README and parity rules.
- A unit test invokes the **same staging orchestrator** under three simulated agent labels and asserts identical outputs.
- It does **not** prove that Claude Code or Cursor autonomously discover this staging file; they will not, unless instructed or their routers are explicitly changed later with approval.
- It does **not** simulate the proprietary runtimes of Claude Code or Cursor; the test only checks repository paths and platform-neutral Python execution.
