#!/usr/bin/env python3
"""Read-only native Stop adapter; no subprocess adapter chain or state writes.

Claude/Codex (default): prints {"decision": "block", "reason": ...}; once the
payload says stop_hook_active (the agent already continued after a block), it
only reports the reason as a systemMessage and on stderr, never blocking twice.
Cursor (`--cursor`, `.cursor/hooks.json` `stop`): prints {"followup_message": ...},
the only output Cursor's stop hook accepts, and stays silent after a few
automatic follow-ups so a guard that cannot clear never loops the agent.
Outside a Git checkout with an active publication (handoff or pending cleanup)
it allows the stop without loading the guard.
"""
import json
import os
from pathlib import Path
import subprocess
import sys

sys.dont_write_bytecode = True
CURSOR_MAX_FOLLOWUPS = 3
HANDOFF = ".dentcast/PUBLISH-HANDOFF.md"
CLEANUP_NAME = "dentcast-publish-cleanup.json"
# The single ls-remote stays well inside the hook's 25 s timeout.
REMOTE_TIMEOUT_SECONDS = "8"


def git(path, *args):
    try:
        p = subprocess.run(["git", "-C", str(path), *args], capture_output=True, text=True, timeout=5,
                           env={**os.environ, "GIT_TERMINAL_PROMPT": "0", "GIT_OPTIONAL_LOCKS": "0"})
    except (OSError, subprocess.TimeoutExpired):
        return None
    return p.stdout.strip() if p.returncode == 0 else None


def candidates(payload, cursor):
    if cursor:
        yield os.environ.get("CURSOR_PROJECT_DIR")
        roots = payload.get("workspace_roots")
        if isinstance(roots, list) and roots and isinstance(roots[0], str):
            yield roots[0]
    else:
        # The session's own directory first: a worktree or a checkout other
        # than the project directory is where its handoff lives.
        yield payload.get("cwd") if isinstance(payload.get("cwd"), str) else None
        yield os.environ.get("CLAUDE_PROJECT_DIR")
        yield os.environ.get("CODEX_PROJECT_DIR")
    yield os.getcwd()


def project_root(payload, cursor):
    for candidate in candidates(payload, cursor):
        if candidate and Path(candidate).is_dir():
            top = git(candidate, "rev-parse", "--show-toplevel")
            if top:
                return Path(top).resolve()
    return None


def has_handoff(root):
    return (root / HANDOFF).is_file()


def active(root):
    if has_handoff(root):
        return True
    path = git(root, "rev-parse", "--git-path", CLEANUP_NAME)
    return bool(path) and (Path(path) if Path(path).is_absolute() else root / path).exists()


def main(argv=None):
    cursor = "--cursor" in (sys.argv[1:] if argv is None else argv)
    try:
        payload = json.load(sys.stdin)
    except (ValueError, OSError):
        return 0
    payload = payload if isinstance(payload, dict) else {}
    if cursor:
        loops = payload.get("loop_count")
        if isinstance(loops, int) and loops >= CURSOR_MAX_FOLLOWUPS:
            return 0
    root = project_root(payload, cursor)
    if root is None or not active(root):
        return 0
    os.environ.setdefault("DENTCAST_GIT_REMOTE_TIMEOUT", REMOTE_TIMEOUT_SECONDS)
    sys.path.insert(0, str(root / "tools"))
    try:
        import dentcast_publish_handoff as h
        import dentcast_publish_lifecycle as lifecycle
        lifecycle.guard(root, "stop")
    except Exception as exc:
        blocked = type(exc).__name__ == "Blocked"
        if not blocked and not has_handoff(root):
            return 0  # guard-internal failure with no active handoff: allow
        code = str(exc) if blocked else "GUARD_UNAVAILABLE"
        if "git pull --ff-only" in code:
            reason = "Publication handoff needs review: " + code
        else:
            reason = ("Publication handoff needs review: " + code + ". Run guard --phase stop, record actual state, "
                      "or confirm-cleanup/restore-cleanup for interrupted cleanup.")
        if cursor:
            print(json.dumps({"followup_message": reason}))
        elif payload.get("stop_hook_active") is True:
            print(reason, file=sys.stderr)
            print(json.dumps({"systemMessage": reason}))
        else:
            print(json.dumps({"decision": "block", "reason": reason}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
