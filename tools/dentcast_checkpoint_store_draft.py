"""Atomic local staging checkpoint storage. Never publishes or executes modules."""
import json
import os
import tempfile
from pathlib import Path


def _validate(state):
    if not isinstance(state, dict) or state.get("execution_authorized") is not False:
        raise ValueError("UNSAFE_STATE")
    required = ("run_id", "revision", "plan_digest", "sequence", "next_index", "receipts", "paused")
    if any(k not in state for k in required):
        raise ValueError("INCOMPLETE_STATE")
    if not isinstance(state["run_id"], str) or not state["run_id"]:
        raise ValueError("INVALID_RUN_ID")
    if not isinstance(state["revision"], str) or not state["revision"]:
        raise ValueError("INVALID_REVISION")
    if not isinstance(state["sequence"], list) or not isinstance(state["receipts"], dict):
        raise ValueError("INVALID_STATE_SHAPE")
    if type(state["next_index"]) is not int or not 0 <= state["next_index"] <= len(state["sequence"]):
        raise ValueError("INVALID_CURSOR")
    if type(state["paused"]) is not bool:
        raise ValueError("INVALID_PAUSE_FLAG")

    seq = state['sequence']
    receipts = state['receipts']
    if not seq or seq[0] != 'intake' or len(seq) != len(set(seq)):
        raise ValueError('INVALID_SEQUENCE')
    if any(mid not in seq for mid in receipts):
        raise ValueError('UNKNOWN_RECEIPT_MODULE')
    if any(mid not in receipts or receipts[mid].get('status') != 'completed' for mid in seq[:state['next_index']]):
        raise ValueError('CURSOR_RECEIPT_MISMATCH')
    if any(mid in receipts for mid in seq[state['next_index'] + 1:]):
        raise ValueError('FUTURE_RECEIPT')
    current = seq[state['next_index']] if state['next_index'] < len(seq) else None
    if state['paused'] != bool(current in receipts):
        raise ValueError('PAUSE_RECEIPT_MISMATCH')


def save(path, state):
    """Atomic replace with fsync; caller supplies a private local staging path."""
    _validate(state)
    target = Path(path)
    if not target.parent.is_dir():
        raise ValueError("CHECKPOINT_PARENT_MISSING")
    if target.is_symlink():
        raise ValueError("CHECKPOINT_SYMLINK_FORBIDDEN")
    payload = json.dumps(state, ensure_ascii=False, sort_keys=True, indent=2).encode("utf-8")
    tmp = None
    try:
        fd, tmp = tempfile.mkstemp(prefix=".dentcast-state-", dir=str(target.parent))
        with os.fdopen(fd, "wb") as handle:
            os.fchmod(handle.fileno(), 0o600)
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(tmp, target)
        tmp = None
        if os.name == "posix":
            directory_fd = os.open(str(target.parent), os.O_RDONLY)
            try:
                os.fsync(directory_fd)
            finally:
                os.close(directory_fd)
    finally:
        if tmp is not None:
            os.unlink(tmp)


def load(path, expected_run_id, expected_revision, expected_plan_digest):
    target = Path(path)
    if target.is_symlink():
        raise ValueError("CHECKPOINT_SYMLINK_FORBIDDEN")
    state = json.loads(target.read_text(encoding="utf-8"))
    _validate(state)
    if (state["run_id"] != expected_run_id or
            state["revision"] != expected_revision or
            state["plan_digest"] != expected_plan_digest):
        raise ValueError("CHECKPOINT_IDENTITY_MISMATCH")
    return state
