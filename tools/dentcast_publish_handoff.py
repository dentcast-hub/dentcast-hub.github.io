#!/usr/bin/env python3
"""Fixed-path live publication checkpoint and guarded completion (no content authoring).

Only writes .dentcast/PUBLISH-HANDOFF.md and an advisory lock in Git metadata.
Never commits, pushes, fetches, or restores content. Completion reruns the real
mechanical gate and stages a recoverable handoff cleanup; see lifecycle commands.
Network observation is opt-in --check-remote (git ls-remote, no fetch).
"""
import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import subprocess
import sys
import tempfile
from urllib.parse import urlsplit

sys.dont_write_bytecode = True

STATE_PATH = ".dentcast/PUBLISH-HANDOFF.md"
SCHEMA = "publish-handoff-v1"
LIMIT = 2 * 1024 * 1024
MODULES = (
    "01-hard-rules.md", "02-routing-intake.md", "03-litecast-and-page.md",
    "04-taxonomy-and-navigation.md", "05-semantic-linking.md",
    "06-paper-ingestion.md", "07-flashcards-and-quiz.md", "08-des-fidelity.md",
    "09-challenge.md", "10-brain-and-pathways.md", "11-build-and-version.md",
    "12-english-notify-verify.md",
)
WORKFLOW_PATHS = (
    ".dentcast/workflows/README.md", ".dentcast/workflows/agent-parity.md",
    ".dentcast/workflows/publish-handoff.md", ".dentcast/workflows/routing-details.md",
    ".dentcast/workflows/global/README.md",
    ".dentcast/workflows/global/repo-conventions.md",
    ".dentcast/workflows/global/plus-premium.md",
    ".dentcast/workflows/global/site-invariants.md",
    "tools/dentcast_publish_handoff.py",
    "tools/dentcast_publish_lifecycle.py", "tools/verify_publish.py",
    ".dentcast/workflows/publish-checkpoints.md",
) + tuple(".dentcast/workflows/modules/" + m for m in MODULES)
BEGIN = "<!-- dentcast-publish-state-v1 -->\n```json\n"
END = "\n```\n<!-- /dentcast-publish-state-v1 -->\n"


class Blocked(ValueError):
    pass


def require(ok, code):
    if not ok:
        raise Blocked(code)


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def digest(data):
    return hashlib.sha256(data).hexdigest()


def decode_json(text):
    def pairs(items):
        out = {}
        for key, value in items:
            require(key not in out, "DUPLICATE_JSON_KEY")
            out[key] = value
        return out

    def constant(_):
        raise Blocked("NONSTANDARD_JSON_NUMBER")
    return json.loads(text, object_pairs_hook=pairs, parse_constant=constant)


def git(root, *args, optional=False, timeout=15):
    env = {**os.environ, "GIT_TERMINAL_PROMPT": "0", "GIT_OPTIONAL_LOCKS": "0",
           "GIT_NO_LAZY_FETCH": "1"}
    try:
        p = subprocess.run(["git", "-C", str(root), *args], capture_output=True,
                           env=env, timeout=timeout)
    except (OSError, subprocess.TimeoutExpired):
        if optional:
            return None
        raise Blocked("GIT_UNAVAILABLE_OR_TIMEOUT") from None
    if p.returncode:
        if optional:
            return None
        # Git stderr may contain credential-bearing remote URLs; do not expose it.
        raise Blocked("GIT_COMMAND_FAILED:" + args[0])
    return p.stdout


def text_git(root, *args, optional=False):
    out = git(root, *args, optional=optional)
    return out.decode("utf-8", "surrogateescape").strip() if out is not None else None


def relative_path(value):
    require(isinstance(value, str) and bool(value), "INVALID_PATH")
    p = PurePosixPath(value)
    require(not p.is_absolute() and "\\" not in value and "\x00" not in value
            and not re.match(r"^[A-Za-z]:", value)
            and all(s not in ("", ".", "..") for s in value.split("/"))
            and p.parts[0].lower() != ".git", "UNSAFE_PATH")
    return value


def safe_path(root, value, allow_leaf_link=False):
    relative_path(value)
    current = root
    parts = PurePosixPath(value).parts
    for i, part in enumerate(parts):
        current = current / part
        require(not current.is_symlink() or (allow_leaf_link and i == len(parts)-1),
                "SYMLINK_PARENT_OR_STATE")
    return current


def file_info(root, path):
    p = safe_path(root, path, allow_leaf_link=True)
    try:
        s = p.lstat()
    except FileNotFoundError:
        return {"kind": "missing", "sha256": None, "executable": False}
    if stat.S_ISLNK(s.st_mode):
        return {"kind": "symlink", "sha256": digest(os.fsencode(os.readlink(p))),
                "executable": False}
    require(stat.S_ISREG(s.st_mode), "UNSUPPORTED_DIRECTORY_OR_SPECIAL_FILE")
    h = hashlib.sha256()
    with p.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    require(p.stat().st_size == s.st_size and p.stat().st_mtime_ns == s.st_mtime_ns,
            "FILE_CHANGED_DURING_SNAPSHOT")
    return {"kind": "file", "sha256": h.hexdigest(),
            "executable": bool(s.st_mode & stat.S_IXUSR)}


def identity(url, root=None):
    """No credentials, usernames or raw local paths are saved in the state."""
    if "://" in url:
        u = urlsplit(url)
        if u.scheme == "file":
            return "local:" + digest(os.fsencode(str(Path(u.path).resolve())))
        require(bool(u.hostname), "INVALID_ORIGIN")
        host = u.hostname.lower() + (":" + str(u.port) if u.port else "")
        return host + "/" + u.path.strip("/").removesuffix(".git")
    if re.match(r"^(?:[^/@:]+@)?[^/:]+:.+", url) and not re.match(r"^[A-Za-z]:", url):
        host, path = url.split(":", 1)
        return host.split("@")[-1].lower() + "/" + path.strip("/").removesuffix(".git")
    return "local:" + digest(os.fsencode(str(((root or Path.cwd()) / url).resolve())))


def valid_hash(value):
    return isinstance(value, str) and re.fullmatch(r"[0-9a-f]{64}", value) is not None


def config(root, key):
    return text_git(root, "config", "--get", key, optional=True)


def branch(root):
    value = text_git(root, "symbolic-ref", "--quiet", "--short", "HEAD", optional=True)
    require(value is not None, "DETACHED_HEAD")
    return value


def status_paths(root):
    raw = git(root, "status", "--porcelain=v1", "-z", "--untracked-files=all",
              "--ignore-submodules=none").decode("utf-8", "surrogateescape").split("\x00")
    result = {}
    i = 0
    while i < len(raw) and raw[i]:
        row = raw[i]
        require(len(row) >= 4 and row[2] == " ", "MALFORMED_GIT_STATUS")
        status, path = row[:2], relative_path(row[3:])
        result[path] = status
        i += 1
        if "R" in status or "C" in status:
            require(i < len(raw) and bool(raw[i]), "MALFORMED_GIT_RENAME")
            result[relative_path(raw[i])] = status + ":source"
            i += 1
    result.pop(STATE_PATH, None)
    return result


def index_entries(root):
    result = {}
    for row in git(root, "ls-files", "--stage", "-z").split(b"\x00"):
        if row:
            meta, path = row.split(b"\t", 1)
            mode, oid, stage = meta.decode("ascii").split()
            result.setdefault(path.decode("utf-8", "surrogateescape"), []).append(
                {"mode": mode, "oid": oid, "stage": int(stage)})
    return result


def remote_observation(root, head, current_branch, check_remote):
    upstream = text_git(root, "rev-parse", "--abbrev-ref", "--symbolic-full-name",
                        "@{upstream}", optional=True)
    cached = text_git(root, "rev-parse", "--verify", "@{upstream}^{commit}", optional=True)
    observation = {"status": "unknown", "reason": "NOT_CHECKED", "head": None,
                   "observed_at": None, "branch": current_branch,
                   "cached_upstream": upstream, "cached_upstream_head": cached,
                   "commits_not_in_cached_upstream": None,
                   "ahead": None, "behind": None, "unpushed_commits": None}
    if cached:
        observation["commits_not_in_cached_upstream"] = text_git(
            root, "rev-list", cached + ".." + head).splitlines()
    if not check_remote:
        return observation
    out = git(root, "ls-remote", "--exit-code", "--", "origin",
              "refs/heads/" + current_branch, optional=True)
    observation["observed_at"] = now()
    if out is None:
        observation["reason"] = "REMOTE_UNAVAILABLE_OR_BRANCH_MISSING"
        return observation
    rows = out.decode("ascii").strip().splitlines()
    require(len(rows) == 1, "AMBIGUOUS_REMOTE_HEAD")
    remote_head, ref = rows[0].split()
    require(re.fullmatch(r"[0-9a-f]{40}|[0-9a-f]{64}", remote_head)
            and ref == "refs/heads/" + current_branch, "INVALID_REMOTE_HEAD")
    observation.update(status="observed", reason=None, head=remote_head)
    if git(root, "cat-file", "-e", remote_head + "^{commit}", optional=True) is None:
        observation["reason"] = "REMOTE_COMMIT_OBJECT_NOT_LOCAL_NO_FETCH_PERFORMED"
        return observation
    counts = text_git(root, "rev-list", "--left-right", "--count", head + "..." + remote_head)
    ahead, behind = (int(x) for x in counts.split())
    observation.update(ahead=ahead, behind=behind,
                       unpushed_commits=text_git(root, "rev-list", remote_head + ".." + head).splitlines())
    return observation


def snapshot(root, targets, check_remote=False):
    first_head = text_git(root, "rev-parse", "--verify", "HEAD^{commit}")
    first_branch = branch(root)
    origin = config(root, "remote.origin.url")
    require(bool(origin), "ORIGIN_REQUIRED")
    paths = status_paths(root)
    index = index_entries(root)
    watched = sorted(set(paths) | set(targets))
    files = {p: {**file_info(root, p), "status": paths.get(p),
                 "index": index.get(p, [])} for p in watched if p != STATE_PATH}
    workflow = {}
    for p in WORKFLOW_PATHS:
        info = file_info(root, p)
        require(info["kind"] == "file", "ACTIVE_WORKFLOW_FILE_MISSING_OR_SYMLINK:" + p)
        workflow[p] = info["sha256"]
    require(paths == status_paths(root) and index == index_entries(root)
            and first_head == text_git(root, "rev-parse", "HEAD")
            and first_branch == branch(root), "GIT_CHANGED_DURING_SNAPSHOT")
    for p in files:
        info = file_info(root, p)
        require(all(files[p][k] == info[k] for k in info), "FILE_CHANGED_DURING_SNAPSHOT")
    return {"repository": identity(origin, root), "branch": first_branch,
            "head": first_head, "files": files, "workflow": workflow,
            "remote": remote_observation(root, first_head, first_branch, check_remote)}


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def validate_publication(p):
    require(isinstance(p, dict) and set(p) == {
        "content_id", "category", "target_paths", "status", "blocker", "context",
        "steps", "external_actions"}, "PUBLICATION_FIELDS_INVALID")
    require(nonempty(p["content_id"]) and nonempty(p["category"]), "CONTENT_IDENTITY_REQUIRED")
    require(p["status"] in ("in_progress", "blocked", "verifying", "cleanup_pending"), "INVALID_STATUS")
    require(p["blocker"] is None or nonempty(p["blocker"]), "INVALID_BLOCKER")
    require(p["status"] != "blocked" or nonempty(p["blocker"]), "BLOCK_REASON_REQUIRED")
    require(isinstance(p["target_paths"], list) and bool(p["target_paths"]), "TARGETS_REQUIRED")
    require(len(set(p["target_paths"])) == len(p["target_paths"]), "DUPLICATE_TARGET")
    for path in p["target_paths"]:
        relative_path(path)
        require(path != STATE_PATH, "HANDOFF_CANNOT_BE_CONTENT_TARGET")
    require(isinstance(p["context"], dict), "CONTEXT_REQUIRED")
    for field in ("inputs", "decisions", "approvals", "pending_questions", "validation",
                  "delivery", "unrelated_changes"):
        require(isinstance(p["context"].get(field), list), "CONTEXT_LIST_REQUIRED:" + field)
    scopes = set()
    for approval in p["context"]["approvals"]:
        require(isinstance(approval, dict) and set(approval) == {"scope", "decision", "status", "evidence"}
                and nonempty(approval["scope"]), "APPROVAL_FIELDS_INVALID")
        require(approval["status"] in ("pending", "confirmed", "rejected", "not_required"), "APPROVAL_STATUS_INVALID")
        require(isinstance(approval["evidence"], list) and all(nonempty(e) for e in approval["evidence"]),
                "APPROVAL_EVIDENCE_INVALID")
        require(approval["decision"] is None or nonempty(approval["decision"]), "APPROVAL_DECISION_INVALID")
        require(approval["status"] == "pending" or (nonempty(approval["decision"]) and bool(approval["evidence"])),
                "APPROVAL_DECISION_AND_EVIDENCE_REQUIRED")
        require(approval["scope"] not in scopes, "DUPLICATE_APPROVAL_SCOPE")
        scopes.add(approval["scope"])
    require(isinstance(p["steps"], list) and bool(p["steps"]), "STEP_PLAN_REQUIRED")
    ids, order, unfinished = set(), -1, False
    for s in p["steps"]:
        require(isinstance(s, dict) and set(s) == {"id", "module", "status", "evidence", "reason"},
                "STEP_FIELDS_INVALID")
        require(nonempty(s["id"]) and s["id"] not in ids, "DUPLICATE_OR_EMPTY_STEP")
        ids.add(s["id"])
        require(s["module"] in MODULES, "UNKNOWN_MODULE")
        require(MODULES.index(s["module"]) >= order, "MODULE_ORDER_INVALID")
        order = MODULES.index(s["module"])
        require(s["status"] in ("pending", "started", "completed", "skipped", "blocked", "failed"),
                "INVALID_STEP_STATUS")
        require(isinstance(s["evidence"], list) and all(nonempty(e) for e in s["evidence"]),
                "INVALID_EVIDENCE_REFERENCES")
        require(s["reason"] is None or nonempty(s["reason"]), "INVALID_STEP_REASON")
        require(s["status"] != "completed" or bool(s["evidence"]), "COMPLETION_EVIDENCE_REQUIRED")
        require(s["status"] not in ("skipped", "blocked", "failed") or nonempty(s["reason"]),
                "STEP_REASON_REQUIRED")
        require(not unfinished or s["status"] == "pending", "OUT_OF_ORDER_STEP_STATE")
        if s["status"] not in ("completed", "skipped"):
            unfinished = True
    require(isinstance(p["external_actions"], list), "EXTERNAL_LEDGER_REQUIRED")
    seen = set()
    for a in p["external_actions"]:
        require(isinstance(a, dict) and set(a) == {"id", "target", "status", "evidence"},
                "EXTERNAL_FIELDS_INVALID")
        require(nonempty(a["id"]) and a["id"] not in seen and nonempty(a["target"]), "INVALID_ACTION")
        seen.add(a["id"])
        require(a["status"] in ("started", "outcome_unknown", "completed", "failed", "not_performed"),
                "INVALID_EXTERNAL_STATUS")
        require(isinstance(a["evidence"], list) and all(nonempty(e) for e in a["evidence"]),
                "INVALID_ACTION_EVIDENCE")
        require(a["status"] in ("started", "outcome_unknown") or bool(a["evidence"]),
                "EXTERNAL_OUTCOME_EVIDENCE_REQUIRED")


def next_step(p):
    return next((s["id"] for s in p["steps"] if s["status"] not in ("completed", "skipped")), None)


def render(state):
    p = state["publication"]
    # JSON quotes keep multiline/operator content from injecting Markdown headings.
    quote = lambda v: json.dumps(v, ensure_ascii=True)
    summary = ("# Publication handoff\n\n"
               "Generated checkpoint; receipts and approvals still require operator verification.\n"
               f"- Schema: {SCHEMA}\n- Generation: {state['generation']}\n"
               f"- Updated at (UTC): {state['updated_at']}\n"
               f"- Content: {quote(p['content_id'])}\n- Status: {p['status']}\n"
               f"- Branch: {quote(state['snapshot']['branch'])}\n"
               f"- Last completed step: {quote(next((s['id'] for s in reversed(p['steps']) if s['status'] == 'completed'), None))}\n"
               f"- Next canonical step: {quote(next_step(p))}\n\n"
               "## Inputs, decisions, step ledger, Git preservation and external outcomes\n\n"
               "The structured record below is authoritative. Do not edit its rendered summary separately.\n"
               "No file contents, diffs, credentials or private transcripts are collected by Git inspection.\n\n")
    return summary + BEGIN + json.dumps(state, ensure_ascii=True, indent=2, sort_keys=True) + END


def load_state(root):
    path = safe_path(root, STATE_PATH)
    require(path.is_file(), "HANDOFF_MISSING")
    require(path.stat().st_size <= LIMIT, "HANDOFF_TOO_LARGE")
    raw = path.read_bytes()
    return parse_state(raw)


def parse_state(raw):
    require(len(raw) <= LIMIT, "HANDOFF_TOO_LARGE")
    try:
        text = raw.decode("utf-8")
        require(text.count(BEGIN) == 1 and text.count(END) == 1, "HANDOFF_FORMAT_INVALID")
        state = decode_json(text.split(BEGIN, 1)[1].split(END, 1)[0])
        require(isinstance(state, dict) and set(state) == {
            "schema", "generation", "updated_at", "source_revision", "publication",
            "snapshot", "previous_sha256", "reconciliation"}, "STATE_FIELDS_INVALID")
        require(state["schema"] == SCHEMA and type(state["generation"]) is int
                and state["generation"] >= 1, "STATE_VERSION_INVALID")
        require(isinstance(state["updated_at"], str), "STATE_TIME_INVALID")
        require(datetime.fromisoformat(state["updated_at"]).utcoffset() is not None, "STATE_TIME_INVALID")
        require(state["reconciliation"] is None or (
            isinstance(state["reconciliation"], dict) and set(state["reconciliation"]) == {"note", "observed_changes"}
            and nonempty(state["reconciliation"]["note"])
            and isinstance(state["reconciliation"]["observed_changes"], list)
            and all(nonempty(s) for s in state["reconciliation"]["observed_changes"])), "RECONCILIATION_INVALID")
        validate_publication(state["publication"])
        require(isinstance(state["snapshot"], dict) and set(state["snapshot"]) == {
            "repository", "branch", "head", "files", "workflow", "remote"}, "SNAPSHOT_INVALID")
        snap = state["snapshot"]
        require(nonempty(snap["repository"]) and nonempty(snap["branch"])
                and isinstance(snap["head"], str)
                and re.fullmatch(r"[0-9a-f]{40}|[0-9a-f]{64}", snap["head"]), "SNAPSHOT_IDENTITY_INVALID")
        require(isinstance(state["source_revision"], str) and re.fullmatch(
                r"[0-9a-f]{40}|[0-9a-f]{64}", state["source_revision"]), "SOURCE_REVISION_INVALID")
        require(state["previous_sha256"] is None or valid_hash(state["previous_sha256"]), "PREVIOUS_DIGEST_INVALID")
        require(isinstance(snap["workflow"], dict) and set(snap["workflow"]) == set(WORKFLOW_PATHS)
                and all(valid_hash(v) for v in snap["workflow"].values()), "WORKFLOW_FINGERPRINT_INVALID")
        require(isinstance(snap["files"], dict), "FILE_INVENTORY_INVALID")
        for name, info in snap["files"].items():
            relative_path(name)
            require(name != STATE_PATH and isinstance(info, dict) and set(info) == {
                "kind", "sha256", "executable", "status", "index"}, "FILE_RECORD_INVALID")
            require(info["kind"] in ("file", "symlink", "missing") and type(info["executable"]) is bool,
                    "FILE_TYPE_INVALID")
            require((info["sha256"] is None if info["kind"] == "missing" else valid_hash(info["sha256"])),
                    "FILE_HASH_INVALID")
            require(info["status"] is None or nonempty(info["status"]), "FILE_STATUS_INVALID")
            require(isinstance(info["index"], list), "INDEX_RECORD_INVALID")
            for entry in info["index"]:
                require(isinstance(entry, dict) and set(entry) == {"mode", "oid", "stage"}
                        and entry["mode"] in ("100644", "100755", "120000", "160000")
                        and isinstance(entry["oid"], str) and re.fullmatch(
                            r"[0-9a-f]{40}|[0-9a-f]{64}", entry["oid"])
                        and type(entry["stage"]) is int and entry["stage"] in (0, 1, 2, 3), "INDEX_RECORD_INVALID")
        require(isinstance(snap["remote"], dict), "REMOTE_OBSERVATION_INVALID")
        require(render(state) == text, "HANDOFF_SUMMARY_OR_ENCODING_CHANGED")
    except Blocked:
        raise
    except (UnicodeError, ValueError, KeyError, TypeError, AttributeError, RecursionError):
        raise Blocked("HANDOFF_FORMAT_INVALID") from None
    return state, digest(raw)


@contextmanager
def locked(root):
    name = text_git(root, "rev-parse", "--git-path", "dentcast-publish-handoff.lock")
    path = Path(name) if Path(name).is_absolute() else root / name
    require(not path.is_symlink(), "UNSAFE_LOCK_PATH")
    fd = os.open(path, os.O_CREAT | os.O_RDWR | getattr(os, "O_NOFOLLOW", 0), 0o600)
    acquired = False
    try:
        if os.name == "nt":
            import msvcrt
            if os.fstat(fd).st_size == 0:
                os.write(fd, b"0")
            os.lseek(fd, 0, os.SEEK_SET)
            try:
                msvcrt.locking(fd, msvcrt.LK_NBLCK, 1)
            except OSError:
                raise Blocked("HANDOFF_BUSY") from None
        else:
            import fcntl
            try:
                fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except OSError:
                raise Blocked("HANDOFF_BUSY") from None
        acquired = True
        yield
    finally:
        if acquired and os.name == "nt":
            import msvcrt
            os.lseek(fd, 0, os.SEEK_SET)
            msvcrt.locking(fd, msvcrt.LK_UNLCK, 1)
        os.close(fd)


def write_atomic(root, state):
    path = safe_path(root, STATE_PATH)
    path.parent.mkdir(parents=True, exist_ok=True)
    data = render(state).encode("utf-8")
    require(len(data) <= LIMIT, "HANDOFF_TOO_LARGE")
    fd, temporary = tempfile.mkstemp(prefix=".publish-handoff-", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
            f.flush()
            os.fsync(f.fileno())
        os.replace(temporary, path)
        if os.name != "nt":
            directory = os.open(path.parent, os.O_RDONLY)
            try:
                os.fsync(directory)
            finally:
                os.close(directory)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    return digest(data)


def differences(root, state, current):
    recorded = state["snapshot"]
    issues = []
    for key, code in (("repository", "REPOSITORY_CHANGED"), ("branch", "BRANCH_CHANGED"),
                      ("files", "WORK_OR_INDEX_CHANGED"), ("workflow", "WORKFLOW_CHANGED")):
        if recorded[key] != current[key]:
            issues.append(code)
    if recorded["head"] != current["head"]:
        ancestor = git(root, "merge-base", "--is-ancestor", recorded["head"], current["head"], optional=True)
        diff = git(root, "diff", "--name-only", "-z", recorded["head"], current["head"], "--", optional=True)
        # Committing only this checkpoint must not make it stale through self-reference.
        if ancestor is None or diff is None or any(
                p and p.decode("utf-8", "surrogateescape") != STATE_PATH for p in diff.split(b"\x00")):
            issues.append("HEAD_CHANGED_REVIEW_REQUIRED")
    return issues


def preserve_actions(old, new):
    actions = {a["id"]: a for a in new["external_actions"]}
    resolved = []
    for previous in old["external_actions"]:
        require(previous["id"] in actions, "EXTERNAL_HISTORY_CANNOT_BE_DROPPED")
        current = actions[previous["id"]]
        require(previous["target"] == current["target"], "EXTERNAL_TARGET_CHANGED")
        if previous != current:
            require(previous["status"] in ("started", "outcome_unknown"), "EXTERNAL_TERMINAL_RECORD_IMMUTABLE")
            resolved.append("EXTERNAL_OUTCOME_RECONCILIATION:" + previous["id"])
    return resolved


def save(root, publication, expected=None, note=None, check_remote=False, initial=False):
    validate_publication(publication)
    require(note is None or nonempty(note), "RECONCILIATION_NOTE_EMPTY")
    with locked(root):
        import dentcast_publish_lifecycle as lifecycle
        require(not lifecycle.pending(root), "CLEANUP_DELIVERY_PENDING")
        path = safe_path(root, STATE_PATH)
        if initial:
            require(not path.exists(), "HANDOFF_ALREADY_EXISTS")
            previous, old_digest = None, None
        else:
            previous, old_digest = load_state(root)
            require(expected == old_digest, "STALE_HANDOFF_WRITE")
            require(all(previous["publication"][k] == publication[k] for k in ("content_id", "category")),
                    "PUBLICATION_IDENTITY_CHANGED")
        current = snapshot(root, publication["target_paths"], check_remote)
        issues = []
        if previous:
            require(all(previous["snapshot"][k] == current[k] for k in ("repository", "branch")),
                    "REPOSITORY_OR_BRANCH_CHANGED")
            issues = differences(root, previous, current)
            issues += preserve_actions(previous["publication"], publication)
            approvals = {a["scope"]: a for a in publication["context"]["approvals"]}
            for old in previous["publication"]["context"]["approvals"]:
                require(old["scope"] in approvals, "APPROVAL_HISTORY_CANNOT_BE_DROPPED")
                if old != approvals[old["scope"]]:
                    issues.append("APPROVAL_DECISION_CHANGED:" + old["scope"])
            if previous["publication"]["context"]["pending_questions"] and (
                    previous["publication"]["context"]["pending_questions"] != publication["context"]["pending_questions"]):
                issues.append("PENDING_QUESTIONS_CHANGED")
            if previous["publication"]["blocker"] and previous["publication"]["blocker"] != publication["blocker"]:
                issues.append("RECORDED_BLOCKER_CHANGED")
            if [(s["id"], s["module"]) for s in previous["publication"]["steps"]] != [
                    (s["id"], s["module"]) for s in publication["steps"]]:
                issues.append("STEP_PLAN_CHANGED")
            by_id = {s["id"]: s for s in publication["steps"]}
            if any(s["status"] in ("completed", "skipped") and by_id.get(s["id"]) != s
                   for s in previous["publication"]["steps"]):
                issues.append("RESOLVED_STEP_CHANGED")
            if previous["publication"]["context"]["inputs"] != publication["context"]["inputs"]:
                issues.append("INPUT_REFERENCES_CHANGED")
                if previous["publication"]["context"]["inputs"] and any(
                        s["status"] in ("completed", "skipped") for s in previous["publication"]["steps"]):
                    require(all(s["status"] == "pending" for s in publication["steps"]),
                            "INPUT_CHANGE_REQUIRES_STEP_INVALIDATION")
            if "WORKFLOW_CHANGED" in issues:
                require(all(s["status"] == "pending" for s in publication["steps"]),
                        "WORKFLOW_CHANGE_REQUIRES_STEP_INVALIDATION")
            require(not issues or nonempty(note), "RECONCILIATION_REQUIRED:" + ",".join(issues))
        state = {"schema": SCHEMA, "generation": previous["generation"]+1 if previous else 1,
                 "updated_at": now(), "source_revision": previous["source_revision"]
                 if previous and "WORKFLOW_CHANGED" not in issues else current["head"],
                 "publication": publication, "snapshot": current, "previous_sha256": old_digest,
                 "reconciliation": {"note": note, "observed_changes": issues} if note else None}
        sha = write_atomic(root, state)
        return {"status": "checkpoint_written", "path": STATE_PATH, "sha256": sha,
                "generation": state["generation"], "next_step": next_step(publication),
                "requires_operator_review": True, "publication_completed": False}


def inspect(root, check_remote=False):
    with locked(root):
        state, sha = load_state(root)
        current = snapshot(root, state["publication"]["target_paths"], check_remote)
        issues = differences(root, state, current)
        p = state["publication"]
        if p["blocker"]:
            issues.append("RECORDED_BLOCKER")
        if p["context"]["pending_questions"]:
            issues.append("PENDING_QUESTIONS")
        if any(a["status"] not in ("confirmed", "not_required") for a in p["context"]["approvals"]):
            issues.append("PENDING_OR_REJECTED_APPROVAL")
        if any(a["status"] in ("started", "outcome_unknown") for a in p["external_actions"]):
            issues.append("EXTERNAL_OUTCOME_UNKNOWN_DO_NOT_RETRY")
        if any(s["status"] in ("started", "blocked", "failed") for s in p["steps"]):
            issues.append("UNFINISHED_STEP_NEEDS_RECONCILIATION")
        if any(e["stage"] for f in current["files"].values() for e in f["index"]):
            issues.append("UNRESOLVED_GIT_CONFLICT")
        portable = "unknown"
        reason = "REMOTE_NOT_VERIFIED"
        remote = current["remote"]
        if remote["behind"]:
            issues.append("REMOTE_BRANCH_ADVANCED_REVIEW_REQUIRED")
        if remote["status"] == "observed" and remote["head"] != current["head"] and remote["ahead"] is None:
            issues.append("REMOTE_HISTORY_NOT_LOCAL_REVIEW_REQUIRED")
        if any(f["status"] for f in current["files"].values()):
            portable, reason = "no", "UNCOMMITTED_WORK_IS_LOCAL_ONLY"
        elif any(f["kind"] != "missing" and not f["index"] for f in current["files"].values()):
            portable, reason = "no", "UNTRACKED_OR_IGNORED_REQUIRED_FILE"
        elif remote["status"] == "observed" and remote["ahead"] is not None:
            remote_state = git(root, "show", remote["head"] + ":" + STATE_PATH, optional=True)
            if remote["ahead"]:
                portable, reason = "no", "LOCAL_COMMITS_NOT_ON_REMOTE_BRANCH"
            elif remote_state is None or digest(remote_state) != sha:
                portable, reason = "no", "REMOTE_HANDOFF_MISSING_OR_DIFFERENT"
            elif issues:
                portable, reason = "no", "CHECKPOINT_REQUIRES_RECONCILIATION"
            else:
                portable, reason = "yes", "GIT_SNAPSHOT_AND_HANDOFF_ON_OBSERVED_REMOTE_BRANCH"
        status = "blocked" if issues else "awaiting_operator_review"
        return {"status": status, "path": STATE_PATH, "sha256": sha, "issues": issues,
                "next_step": next_step(p), "recorded_state": state, "current_snapshot": current,
                "git_snapshot_portable": portable, "portability_reason": reason,
                "requires_operator_review": True, "publication_completed": False}


def main(argv=None):
    # Keep one Blocked class when the CLI entrypoint lazily imports lifecycle.
    import sys
    sys.modules.setdefault("dentcast_publish_handoff", sys.modules[__name__])
    import dentcast_publish_lifecycle as lifecycle
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--repo", default=".", help="Any path within the intended Git checkout")
    sub = ap.add_subparsers(dest="command", required=True)
    for command in ("init", "record", "inspect"):
        p = sub.add_parser(command)
        p.add_argument("--check-remote", action="store_true", help="Read origin branch with ls-remote; never fetch")
        if command != "inspect":
            p.add_argument("--input", required=True, help="Public-safe publication JSON, outside the checkout")
            if command == "record":
                p.add_argument("--expected-sha256", required=True)
                p.add_argument("--reconcile-note")
    p = sub.add_parser("plan")
    p.add_argument("--paper-only", action="store_true")
    p = sub.add_parser("step")
    p.add_argument("--expected-sha256", required=True)
    p.add_argument("--id", required=True)
    p.add_argument("--status", choices=("started", "completed", "skipped", "blocked", "failed"), required=True)
    p.add_argument("--evidence", action="append", default=[])
    p.add_argument("--reason")
    p.add_argument("--reconcile-note")
    p = sub.add_parser("verify")
    p.add_argument("--expected-sha256", required=True)
    p.add_argument("--expect-title")
    p.add_argument("--expect-caption")
    p.add_argument("--catalog-id")
    p = sub.add_parser("bind")
    p.add_argument("--expected-sha256", required=True)
    p.add_argument("--content-id", required=True)
    p.add_argument("--category", required=True)
    p.add_argument("--target-path", action="append", required=True)
    p.add_argument("--evidence", required=True)
    p = sub.add_parser("finish")
    p.add_argument("--expected-sha256", required=True)
    sub.add_parser("confirm-cleanup")
    sub.add_parser("restore-cleanup")
    p = sub.add_parser("guard")
    p.add_argument("--phase", choices=("stop", "pre-commit", "ci"), required=True)
    args = ap.parse_args(argv)
    try:
        root = None if args.command == "plan" else Path(text_git(Path(args.repo).resolve(), "rev-parse", "--show-toplevel")).resolve()
        if args.command == "plan":
            result = {"status": "plan_template", "steps": lifecycle.plan(args.paper_only), "publication_completed": False}
        elif args.command == "inspect":
            if not safe_path(root, STATE_PATH).exists() and lifecycle.pending(root):
                raise Blocked("CLEANUP_DELIVERY_PENDING:confirm-cleanup_or_restore-cleanup")
            result = inspect(root, args.check_remote)
            lifecycle.require_plan(result["recorded_state"]["publication"])
        elif args.command == "step":
            result = lifecycle.step(root, args.expected_sha256, args.id, args.status,
                                    args.evidence, args.reason, args.reconcile_note)
        elif args.command == "verify":
            result = lifecycle.verify(root, args.expected_sha256, args.expect_title, args.expect_caption, args.catalog_id)
        elif args.command == "bind":
            result = lifecycle.bind(root, args.expected_sha256, args.content_id, args.category, args.target_path, args.evidence)
        elif args.command == "finish":
            result = lifecycle.finish(root, args.expected_sha256)
        elif args.command == "confirm-cleanup":
            result = lifecycle.confirm_cleanup(root)
        elif args.command == "restore-cleanup":
            result = lifecycle.restore_cleanup(root)
        elif args.command == "guard":
            result = lifecycle.guard(root, args.phase)
        else:
            path = Path(args.input)
            require(path.stat().st_size <= LIMIT, "INPUT_TOO_LARGE")
            publication = decode_json(path.read_text(encoding="utf-8"))
            lifecycle.require_plan(publication)
            if args.command == "init":
                require(all(s["status"] == "pending" for s in publication["steps"]), "INIT_REQUIRES_PENDING_PLAN")
            else:
                previous, _ = load_state(root)
                old_f = next((s for s in previous["publication"]["steps"] if s["id"] == "F"), None)
                new_f = next((s for s in publication["steps"] if s["id"] == "F"), None)
                require(not new_f or new_f["status"] != "completed" or (old_f and old_f["status"] == "completed"),
                        "USE_REAL_VERIFY_FOR_PHASE_F")
                for receipt in previous["publication"]["context"]["validation"]:
                    if isinstance(receipt, dict) and receipt.get("kind") in ("phase_f", "paper_catalog_gate"):
                        require(receipt in publication["context"]["validation"], "MECHANICAL_RECEIPT_HISTORY_REQUIRED")
            result = save(root, publication, initial=args.command == "init",
                          expected=getattr(args, "expected_sha256", None),
                          note=getattr(args, "reconcile_note", None), check_remote=args.check_remote)
        print(json.dumps(result, ensure_ascii=True, indent=2))
        return 2 if result["status"] == "blocked" else 0
    except (ValueError, OSError, KeyError, TypeError, AttributeError, RecursionError):
        import sys
        exc = sys.exc_info()[1]
        code = str(exc) if isinstance(exc, Blocked) else "INVALID_INPUT_OR_STATE"
        print(json.dumps({"status": "blocked", "error": code,
                          "publication_completed": False}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
