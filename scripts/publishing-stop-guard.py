#!/usr/bin/env python3
"""Read-only native Stop adapter; no subprocess adapter chain or state writes.

Claude/Codex (default): prints {"decision": "block", "reason": ...}.
Cursor (`--cursor`, `.cursor/hooks.json` `stop`): prints {"followup_message": ...},
the only output Cursor's stop hook accepts, and stays silent after a few
automatic follow-ups so a guard that cannot clear never loops the agent.
"""
import json
import os
from pathlib import Path
import sys

sys.dont_write_bytecode = True
CURSOR_MAX_FOLLOWUPS = 3


def project_root(payload, cursor):
    names = ("CURSOR_PROJECT_DIR",) if cursor else ("CLAUDE_PROJECT_DIR", "CODEX_PROJECT_DIR")
    for name in names:
        if os.environ.get(name):
            return Path(os.environ[name]).resolve()
    roots = payload.get("workspace_roots") if cursor and isinstance(payload, dict) else None
    if isinstance(roots, list) and roots and isinstance(roots[0], str):
        return Path(roots[0]).resolve()
    return Path(os.getcwd()).resolve()


def main(argv=None):
    cursor = "--cursor" in (sys.argv[1:] if argv is None else argv)
    try:
        payload = json.load(sys.stdin)
    except (ValueError, OSError):
        return 0
    if cursor and isinstance(payload, dict):
        loops = payload.get("loop_count")
        if isinstance(loops, int) and loops >= CURSOR_MAX_FOLLOWUPS:
            return 0
    root = project_root(payload, cursor)
    sys.path.insert(0, str(root / "tools"))
    try:
        import dentcast_publish_handoff as h
        import dentcast_publish_lifecycle as lifecycle
        lifecycle.guard(root, "stop")
    except Exception as exc:
        code = str(exc) if type(exc).__name__ == "Blocked" else "GUARD_UNAVAILABLE"
        reason = ("Publication handoff needs review: " + code + ". Run guard --phase stop, record actual state, "
                  "or confirm-cleanup/restore-cleanup for interrupted cleanup.")
        print(json.dumps({"followup_message": reason} if cursor else {"decision": "block", "reason": reason}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
