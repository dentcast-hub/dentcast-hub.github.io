"""Atomic local staging checkpoint storage. Never publishes or executes modules."""
import hashlib
import json
import os
import re
import tempfile
from contextlib import contextmanager
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
    if not seq or seq[0] != 'intake' or any(not isinstance(mid, str) or not mid for mid in seq) or len(seq) != len(set(seq)):
        raise ValueError('INVALID_SEQUENCE')
    if any(not isinstance(value, dict) for value in receipts.values()):
        raise ValueError('INVALID_RECEIPT_SHAPE')
    if any(mid not in seq for mid in receipts):
        raise ValueError('UNKNOWN_RECEIPT_MODULE')
    if any(mid not in receipts or receipts[mid].get('status') != 'completed' for mid in seq[:state['next_index']]):
        raise ValueError('CURSOR_RECEIPT_MISMATCH')
    if any(mid in receipts for mid in seq[state['next_index'] + 1:]):
        raise ValueError('FUTURE_RECEIPT')
    current = seq[state['next_index']] if state['next_index'] < len(seq) else None
    if state['paused'] != bool(current in receipts):
        raise ValueError('PAUSE_RECEIPT_MISMATCH')
    if current in receipts and receipts[current].get('status') not in ('blocked', 'failed', 'awaiting_approval'):
        raise ValueError('INVALID_PAUSE_RECEIPT')
    for mid, receipt in receipts.items():
        if receipt.get('module_id') != mid or receipt.get('source_revision') != state['revision']:
            raise ValueError('RECEIPT_IDENTITY_MISMATCH')
        if not isinstance(receipt.get('verification'), dict):
            raise ValueError('INVALID_VERIFICATION')
        if receipt.get('status') == 'completed' and receipt['verification'].get('passed') is not True:
            raise ValueError('UNVERIFIED_COMPLETION')
        if not isinstance(receipt.get('input_fingerprint'), str) or not re.fullmatch(r'[0-9a-f]{64}', receipt['input_fingerprint']):
            raise ValueError('INVALID_FINGERPRINT')
        if receipt.get('artifact_receipts') != []:
            raise ValueError('SIDE_EFFECTS_NOT_RECONCILED')


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

def content_digest(state):
    """Canonical content digest for optimistic compare-and-swap."""
    _validate(state)
    return hashlib.sha256(json.dumps(state, ensure_ascii=False, sort_keys=True,
                                     separators=(",", ":")).encode("utf-8")).hexdigest()


@contextmanager
def _exclusive_lock(path):
    """Advisory cross-process lock on POSIX; never silently pretend Windows is safe."""
    if os.name != "posix":
        raise RuntimeError("CAS_UNSUPPORTED_PLATFORM")
    import fcntl
    target = Path(path)
    lock = target.with_name(target.name + ".lock")
    if lock.is_symlink():
        raise ValueError("CHECKPOINT_LOCK_SYMLINK_FORBIDDEN")
    flags = os.O_CREAT | os.O_RDWR
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    fd = os.open(lock, flags, 0o600)
    try:
        if not os.path.isfile(lock) or os.fstat(fd).st_nlink != 1:
            raise ValueError("INVALID_CHECKPOINT_LOCK")
        fcntl.flock(fd, fcntl.LOCK_EX)
        yield
    finally:
        fcntl.flock(fd, fcntl.LOCK_UN)
        os.close(fd)


def save_checked(path, state, expected_digest=None):
    """Compare-and-swap update; None means create only.

    All cooperating writers MUST use this method, not legacy save().
    Keep .lock stable: never delete it, because deleting/recreating locks
    can let different processes lock different inodes.
    """
    _validate(state)
    if expected_digest is not None and (not isinstance(expected_digest, str) or
                                         not re.fullmatch(r"[0-9a-f]{64}", expected_digest)):
        raise ValueError("INVALID_EXPECTED_DIGEST")
    target = Path(path)
    if not target.parent.is_dir() or target.is_symlink():
        raise ValueError("INVALID_CHECKPOINT_TARGET")
    with _exclusive_lock(target):
        if target.is_symlink():
            raise ValueError("CHECKPOINT_SYMLINK_FORBIDDEN")
        if target.exists():
            if expected_digest is None:
                raise ValueError("CHECKPOINT_ALREADY_EXISTS")
            current = json.loads(target.read_text(encoding="utf-8"))
            _validate(current)
            if (current["run_id"] != state["run_id"] or
                    current["revision"] != state["revision"] or
                    current["plan_digest"] != state["plan_digest"]):
                raise ValueError("CHECKPOINT_IDENTITY_MISMATCH")
            if content_digest(current) != expected_digest:
                raise ValueError("STALE_CHECKPOINT_WRITER")
        elif expected_digest is not None:
            raise ValueError("CHECKPOINT_MISSING")
        save(target, state)
    return content_digest(state)
