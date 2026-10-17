# Historical modularization development record — not live instructions

This document records staging development at its original revision. Its former branch directions, activation status, backup-reading requirements and proposed workflow routes are historical, not current execution instructions.
For live work read `.dentcast/workflows/README.md`, `.dentcast/workflows/global/README.md` and `.dentcast/workflows/agent-parity.md`.
For «انتشار ناقص داشتم», first read `.dentcast/PUBLISH-HANDOFF.md`, then `.dentcast/workflows/publish-handoff.md`.
Staging utilities remain restricted to staging. Do not follow the historical steps below to resume a real publication or assume their test results describe the current branch.
Current repair branch and status: `.dentcast/workflows/PUBLISHING-REPAIR-PLAN.md`.

---

## Historical record (non-operative)

# Agent entrypoint discovery — feature-branch modular staging

**STAGING_ONLY_NO_LIVE_PUBLISH** — only the isolated feature branch, no `main` merge or actual publication.

| Client | Native entrypoint | Exact archived original | Next |
|---|---|---|---|
| Claude Code | `CLAUDE.md` (normally auto-loaded) | `CLAUDE.legacy.md` | `.dentcast/workflows/agent-parity.md` then `.dentcast/workflows/README.md` |
| Cursor | `.cursor/rules/dentcast-router.mdc` + `dentcast-operating-protocol.mdc` (both alwaysApply) | `.dentcast/workflows/legacy/cursor/` | `AGENTS.legacy.md` §§6–8, agent parity, modular README; conditional publishing rule |
| Codex/GPT | `AGENTS.md` | `AGENTS.legacy.md` | agent parity, modular README |

The full original `.dentcast/workflows/README.legacy.md` is the authoritative source for **all** 12 verbatim slices, 17 hard rules, DES/Fidelity, approvals, exact title/caption, exceptions, final Phase F and original order. The active `README.md` on this feature branch is a short guarded **staging connector**; it first requires full global legacy rules + hard-rules + route-intake, then lazy-loads the remaining selected slices. This migration by itself does not prove lower token cost or live behavior parity.

Use `tools/dentcast_stage3_route.py`, `tools/dentcast_stage3_orchestrator.py`, `tools/dentcast_stage6_handoff.py`, and public-safe synthetic GitHub checkpoints for disposable sandbox tests only. `tools/dentcast_stage8_9_preflight.py` compares archived originals to current `main` and confirms original science engine unchanged.

**What static CI can establish:** presence of every native entrypoint, archive path, Cursor always-on flag, 12 source files, byte-for-byte legacy source identity, Stage 2/7 route parity and staged recovery.

**What it cannot establish:** actual independent Claude/Cursor/Codex software successfully loading instructions, full real semantic output parity, private data security for production and independent authenticated founder approval. All real release gates remain CLOSED.
