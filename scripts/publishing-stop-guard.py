#!/usr/bin/env python3
"""Read-only native Stop adapter; no subprocess adapter chain or state writes."""
import json
import os
from pathlib import Path
import sys

sys.dont_write_bytecode = True


def main():
    try:
        json.load(sys.stdin)
    except (ValueError, OSError):
        return 0
    root = Path(os.environ.get("CLAUDE_PROJECT_DIR") or os.environ.get("CODEX_PROJECT_DIR") or os.getcwd()).resolve()
    sys.path.insert(0, str(root / "tools"))
    try:
        import dentcast_publish_handoff as h
        import dentcast_publish_lifecycle as lifecycle
        lifecycle.guard(root, "stop")
    except Exception as exc:
        code = str(exc) if type(exc).__name__ == "Blocked" else "GUARD_UNAVAILABLE"
        print(json.dumps({"decision": "block", "reason":
            "Publication handoff needs review: " + code + ". Run guard --phase stop, record actual state, "
            "or confirm-cleanup/restore-cleanup for interrupted cleanup."}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
