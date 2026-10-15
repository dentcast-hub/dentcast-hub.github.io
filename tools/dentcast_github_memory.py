#!/usr/bin/env python3
"""DentCast STAGING remote memory: atomic GitHub Git-Data commit + verified replay.

Uses git commits/trees/blobs and NON-FORCE ref updates, not local flock and not
the non-atomic Contents API. One run transition and all its immutable objects
are one commit. Concurrent sibling commits cannot both fast-forward the branch.
No production publish, approvals, cleanup or scientific engine invocation.
Only PUBLIC-SAFE enumerated metadata may be sent to this public repository.

Requires an authorized GitHub token through GH_TOKEN/GITHUB_TOKEN when used as
a CLI. Tests use an independent fake Git backend. Branch is staging-pinned.
"""
import argparse
import base64
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

REPO = "dentcast-hub/dentcast-hub.github.io"
BRANCH = "refactor/publishing-modular-workflow"
PREFIX = ".dentcast/execution-memory/runs"
RUN_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,47}$")
ATOM_RE = re.compile(r"^[A-Za-z0-9._:/-]{1,128}$")
HEX = re.compile(r"^[0-9a-f]{64}$")
CONTRACT = "github-memory-v1"
FAMILIES = {"claude", "cursor", "codex", "other"}
KINDS = {"begin", "step_completed", "step_paused", "step_recovered",
         "fidelity_checkpoint", "fidelity_invalidate", "staging_finished"}
# Publication activation is not allowed here. Cleanup requires a separate
# verified canonical publication gate and is NOT offered by this staging tool.


def canonical(obj):
    return json.dumps(obj, ensure_ascii=False, sort_keys=True,
                      separators=(",", ":"), allow_nan=False).encode("utf-8")


def digest(obj):
    return hashlib.sha256(canonical(obj)).hexdigest()


def require(condition, error):
    if not condition:
        raise ValueError(error)


def safe_atom(value):
    return isinstance(value, str) and bool(ATOM_RE.fullmatch(value))


def safe_digest(value):
    return isinstance(value, str) and bool(HEX.fullmatch(value))


def run_folder(run_id):
    require(isinstance(run_id, str) and bool(RUN_RE.fullmatch(run_id)),
            "INVALID_RUN_ID")
    return PREFIX + "/" + run_id


def actor_check(actor):
    require(isinstance(actor, dict) and set(actor) == {"family", "model", "session"},
            "ACTOR_FIELDS")
    require(actor["family"] in FAMILIES, "UNKNOWN_AGENT_FAMILY")
    require(all(v is None or safe_atom(v) for v in
                (actor["model"], actor["session"])), "UNSAFE_ACTOR_METADATA")
    return actor


def manifest_check(value):
    require(isinstance(value, dict) and
            set(value) == {"schema", "run_id", "source_revision", "plan_digest",
                           "contract_version", "public_safe", "execution_authorized"},
            "MANIFEST_FIELDS")
    run_folder(value["run_id"])
    require(value["schema"] == CONTRACT and value["public_safe"] is True and
            value["execution_authorized"] is False, "UNSAFE_MANIFEST")
    require(safe_atom(value["source_revision"]) and
            safe_digest(value["plan_digest"]) and safe_atom(value["contract_version"]),
            "BAD_MANIFEST_IDENTITY")
    return True


def event_check(event, manifest):
    require(isinstance(event, dict) and
            set(event) == {"schema", "run_id", "seq", "previous_digest",
                           "kind", "step_id", "actor", "source_revision",
                           "input_digest", "output_digest", "receipt_digest",
                           "artifact_digests", "gate", "status"},
            "EVENT_FIELDS")
    require(event["schema"] == CONTRACT and event["run_id"] == manifest["run_id"]
            and event["source_revision"] == manifest["source_revision"],
            "EVENT_RUN_IDENTITY")
    require(type(event["seq"]) is int and event["seq"] > 0 and
            (event["previous_digest"] is None or safe_digest(event["previous_digest"])),
            "EVENT_SEQUENCE_SHAPE")
    require(event["kind"] in KINDS and safe_atom(event["step_id"]),
            "UNKNOWN_EVENT_KIND_OR_STEP")
    actor_check(event["actor"])
    require(all(v is None or safe_digest(v)
                for v in (event["input_digest"], event["output_digest"],
                          event["receipt_digest"])), "INVALID_EVENT_DIGEST")
    require(isinstance(event["artifact_digests"], list) and
            len(event["artifact_digests"]) <= 200 and
            len(set(event["artifact_digests"])) == len(event["artifact_digests"]) and
            all(safe_digest(x) for x in event["artifact_digests"]),
            "INVALID_ARTIFACT_REFERENCES")
    require(event["gate"] in {"unverified_staging", "local_integrity_checked",
                              "engine_verified", "blocked", "none"},
            "INVALID_EVENT_GATE")
    require(event["status"] in {"pending", "completed_staging", "paused", "invalidated"},
            "INVALID_EVENT_STATUS")
    if event["kind"] == "begin":
        require(event["seq"] == 1 and event["previous_digest"] is None and
                event["step_id"] == "run:begin" and event["status"] == "pending",
                "INVALID_BEGIN_EVENT")
    if event["kind"] == "staging_finished":
        require(event["status"] == "completed_staging", "INVALID_STAGING_FINISH")
    return True


def state_check(state, manifest):
    require(isinstance(state, dict) and set(state) == {
        "schema", "run_id", "source_revision", "manifest_digest",
        "revision", "event_digests", "last_event_digest",
        "status", "completed_steps", "pending_step",
        "execution_authorized", "real_publish_verified"}, "STATE_FIELDS")
    require(state["schema"] == CONTRACT and state["run_id"] == manifest["run_id"]
            and state["source_revision"] == manifest["source_revision"]
            and state["manifest_digest"] == digest(manifest), "STATE_MANIFEST_MISMATCH")
    require(state["execution_authorized"] is False and
            state["real_publish_verified"] is False, "UNAUTHORIZED_STATE")
    require(state["status"] in {"active", "paused", "finished_staging"} and
            type(state["revision"]) is int and state["revision"] >= 1,
            "INVALID_RUN_STATUS")
    events = state["event_digests"]
    require(isinstance(events, list) and len(events) == state["revision"] and
            all(safe_digest(e) for e in events) and
            len(set(events)) == len(events) and
            events[-1] == state["last_event_digest"], "EVENT_CHAIN_STATE_MISMATCH")
    require(isinstance(state["completed_steps"], list) and
            all(safe_atom(x) for x in state["completed_steps"]) and
            len(set(state["completed_steps"])) == len(state["completed_steps"]),
            "INVALID_COMPLETED_STEPS")
    require(state["pending_step"] is None or safe_atom(state["pending_step"]),
            "INVALID_PENDING_STEP")
    return True


class GithubAPI:
    """Minimal GitHub Git-Data API transport. Never logs auth or payload."""
    def __init__(self, token=None, repo=REPO, branch=BRANCH):
        require(repo == REPO and branch == BRANCH, "NON_STAGING_REPOSITORY_FORBIDDEN")
        self.repo, self.branch = repo, branch
        self.token = token if token is not None else (
            os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN"))
        require(bool(self.token), "GITHUB_TOKEN_REQUIRED")

    def call(self, method, endpoint, payload=None):
        url = "https://api.github.com/repos/" + self.repo + "/" + endpoint
        headers = {"Authorization": "Bearer " + self.token,
                   "Accept": "application/vnd.github+json",
                   "X-GitHub-Api-Version": "2022-11-28",
                   "User-Agent": "dentcast-stage4-memory"}
        body = None
        if payload is not None:
            body = canonical(payload)
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=25) as res:
                data = res.read()
                return json.loads(data) if data else {}
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                raise FileNotFoundError("GITHUB_OBJECT_NOT_FOUND") from exc
            if exc.code in (409, 412, 422):
                raise Conflict("GITHUB_COMPARE_AND_SWAP_CONFLICT") from exc
            raise RuntimeError("GITHUB_API_ERROR_STATUS_" + str(exc.code)) from exc


class Conflict(ValueError):
    pass


class RemoteMemory:
    def __init__(self, api):
        require(api.repo == REPO and api.branch == BRANCH,
                "NON_STAGING_REPOSITORY_FORBIDDEN")
        self.api = api

    def head(self):
        value = self.api.call("GET", "git/ref/heads/" + self.api.branch)
        sha = value["object"]["sha"]
        require(re.fullmatch("[0-9a-f]{40}", sha) is not None, "BAD_HEAD")
        return sha

    def read_json(self, head, path):
        require(re.fullmatch("[0-9a-f]{40}", head) is not None, "BAD_READ_REF")
        reply = self.api.call("GET", "contents/" +
                              urllib.parse.quote(path, safe="/") +
                              "?ref=" + head)
        require(reply["encoding"] == "base64", "INVALID_GITHUB_FILE_ENCODING")
        raw = base64.b64decode(reply["content"])
        return json.loads(raw.decode("utf-8"))

    def try_json(self, head, path):
        try:
            return self.read_json(head, path)
        except FileNotFoundError:
            return None

    @staticmethod
    def event_path(run_id, seq, event_hash):
        return run_folder(run_id) + "/events/%06d-%s.json" % (seq, event_hash)

    def snapshot(self, run_id, head=None):
        folder = run_folder(run_id)
        head = head or self.head()
        manifest = self.read_json(head, folder + "/manifest.json")
        manifest_check(manifest)
        require(manifest["run_id"] == run_id, "WRONG_MANIFEST_RUN")
        state = self.read_json(head, folder + "/state.json")
        state_check(state, manifest)
        events = []
        previous = None
        completed = []
        status = "active"
        for seq, h in enumerate(state["event_digests"], start=1):
            event = self.read_json(head, self.event_path(run_id, seq, h))
            event_check(event, manifest)
            require(digest(event) == h and event["seq"] == seq and
                    event["previous_digest"] == previous,
                    "EVENT_REPLAY_INTEGRITY_FAILURE")
            if seq == 1:
                require(event["kind"] == "begin", "MISSING_BEGIN_EVENT")
            else:
                require(event["kind"] != "begin", "DUPLICATE_BEGIN")
            if event["kind"] == "step_completed":
                require(event["step_id"] not in completed and
                        event["status"] == "completed_staging", "DUPLICATE_COMPLETE")
                completed.append(event["step_id"])
            if event["kind"] == "step_paused":
                status = "paused"
            elif event["kind"] == "step_recovered":
                require(status == "paused", "RECOVER_WITHOUT_PAUSE")
                status = "active"
            elif event["kind"] == "staging_finished":
                status = "finished_staging"
            previous = h
            events.append(event)
        require(state["completed_steps"] == completed and
                state["status"] == status, "STATE_EVENT_REPLAY_DIVERGENCE")
        return {"head": head, "manifest": manifest, "state": state,
                "events": events}

    def _atomic_commit(self, expected_head, files, message):
        """Commit all files via one tree update + non-force branch update."""
        require(files and all(p.startswith(PREFIX + "/") for p in files),
                "MEMORY_PATH_ONLY")
        current = self.head()
        if current != expected_head:
            raise Conflict("STALE_GITHUB_HEAD_REREAD_AND_RECONCILE")
        parent = self.api.call("GET", "git/commits/" + expected_head)
        tree = [{"path": path, "mode": "100644", "type": "blob",
                 "content": canonical(value).decode("utf-8")}
                for path, value in sorted(files.items())]
        created_tree = self.api.call("POST", "git/trees",
                                     {"base_tree": parent["tree"]["sha"], "tree": tree})
        child = self.api.call("POST", "git/commits", {
            "message": message, "tree": created_tree["sha"],
            "parents": [expected_head]})
        new_sha = child["sha"]
        try:
            self.api.call("PATCH", "git/refs/heads/" + self.api.branch,
                          {"sha": new_sha, "force": False})
        except Conflict:
            raise Conflict("CONCURRENT_WRITER_LOST_REREAD_AND_RECONCILE")
        # A ref update can appear successful but another writer may already
        # advance HEAD. Verify our commit remains an ancestor by fast-forward
        # semantics (provided by GitHub) rather than requiring identical HEAD.
        return new_sha

    def begin(self, run_id, source_revision, plan_digest, actor,
              contract_version="1.0-draft"):
        run_folder(run_id)
        actor_check(actor)
        head = self.head()
        folder = run_folder(run_id)
        require(self.try_json(head, folder + "/manifest.json") is None,
                "RUN_ALREADY_EXISTS")
        manifest = {
            "schema": CONTRACT, "run_id": run_id, "source_revision": source_revision,
            "plan_digest": plan_digest, "contract_version": contract_version,
            "public_safe": True, "execution_authorized": False,
        }
        manifest_check(manifest)
        event = {
            "schema": CONTRACT, "run_id": run_id, "seq": 1,
            "previous_digest": None, "kind": "begin", "step_id": "run:begin",
            "actor": actor, "source_revision": source_revision,
            "input_digest": plan_digest, "output_digest": None, "receipt_digest": None,
            "artifact_digests": [], "gate": "unverified_staging", "status": "pending",
        }
        event_check(event, manifest)
        h = digest(event)
        state = {
            "schema": CONTRACT, "run_id": run_id,
            "source_revision": source_revision, "manifest_digest": digest(manifest),
            "revision": 1, "event_digests": [h], "last_event_digest": h,
            "status": "active", "completed_steps": [], "pending_step": None,
            "execution_authorized": False, "real_publish_verified": False,
        }
        state_check(state, manifest)
        files = {folder + "/manifest.json": manifest, folder + "/state.json": state,
                 self.event_path(run_id, 1, h): event}
        commit = self._atomic_commit(head, files, "staging-memory: begin " + run_id)
        return {"commit": commit, "state": state}

    def append(self, run_id, actor, kind, step_id, *, input_digest=None,
               output_digest=None, receipt_digest=None, artifact_digests=(),
               gate="unverified_staging"):
        require(kind in KINDS - {"begin"}, "INVALID_APPEND_KIND")
        actor_check(actor)
        snap = self.snapshot(run_id)
        old, manifest, head = snap["state"], snap["manifest"], snap["head"]
        require(old["status"] != "finished_staging", "RUN_ALREADY_FINISHED")
        if old["status"] == "paused":
            require(kind == "step_recovered", "PAUSED_REQUIRES_EXPLICIT_RECOVERY")
        if kind == "step_recovered":
            require(old["status"] == "paused", "RUN_NOT_PAUSED")
        if kind == "step_completed":
            require(gate in {"local_integrity_checked", "engine_verified"},
                    "UNVERIFIED_COMPLETE_FORBIDDEN")
            require(safe_digest(receipt_digest), "MISSING_VERIFIED_RECEIPT_HASH")
        if kind == "fidelity_checkpoint":
            require(gate == "engine_verified" and safe_digest(receipt_digest),
                    "FIDELITY_REQUIRES_ENGINE_RECEIPT")
        if kind == "staging_finished":
            require(old["status"] == "active", "FINISH_REQUIRES_ACTIVE")
        seq = old["revision"] + 1
        state = dict(old)
        state["event_digests"] = list(old["event_digests"])
        state["completed_steps"] = list(old["completed_steps"])
        if kind == "step_completed":
            require(step_id not in state["completed_steps"], "STEP_ALREADY_COMPLETED")
            state["completed_steps"].append(step_id)
        status = "completed_staging" if kind in {"step_completed", "staging_finished"} else (
            "paused" if kind == "step_paused" else
            "invalidated" if kind == "fidelity_invalidate" else "pending")
        event = {
            "schema": CONTRACT, "run_id": run_id, "seq": seq,
            "previous_digest": old["last_event_digest"], "kind": kind,
            "step_id": step_id, "actor": actor,
            "source_revision": manifest["source_revision"],
            "input_digest": input_digest, "output_digest": output_digest,
            "receipt_digest": receipt_digest, "artifact_digests": list(artifact_digests),
            "gate": gate, "status": status,
        }
        event_check(event, manifest)
        h = digest(event)
        state["revision"] = seq
        state["event_digests"].append(h)
        state["last_event_digest"] = h
        if kind == "step_paused":
            state["status"] = "paused"
            state["pending_step"] = step_id
        elif kind == "step_recovered":
            require(step_id == old["pending_step"], "RECOVERY_SCOPE_MISMATCH")
            state["status"] = "active"
            state["pending_step"] = None
        elif kind == "staging_finished":
            state["status"] = "finished_staging"
        state_check(state, manifest)
        folder = run_folder(run_id)
        files = {folder + "/state.json": state, self.event_path(run_id, seq, h): event}
        commit = self._atomic_commit(head, files, "staging-memory: " + kind +
                                      " " + run_id + " " + step_id)
        return {"commit": commit, "state": state, "event_digest": h}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("command", choices=["begin", "show", "append"])
    p.add_argument("--run-id", required=True)
    p.add_argument("--revision")
    p.add_argument("--plan-digest")
    p.add_argument("--agent", choices=sorted(FAMILIES), default="other")
    p.add_argument("--model")
    p.add_argument("--session")
    p.add_argument("--kind", choices=sorted(KINDS - {"begin"}))
    p.add_argument("--step")
    p.add_argument("--input-digest")
    p.add_argument("--output-digest")
    p.add_argument("--receipt-digest")
    p.add_argument("--gate", default="unverified_staging")
    args = p.parse_args()
    try:
        store = RemoteMemory(GithubAPI())
        actor = {"family": args.agent, "model": args.model, "session": args.session}
        if args.command == "begin":
            result = store.begin(args.run_id, args.revision, args.plan_digest, actor)
        elif args.command == "show":
            result = store.snapshot(args.run_id)
        else:
            require(args.kind and args.step, "EVENT_KIND_AND_STEP_REQUIRED")
            result = store.append(args.run_id, actor, args.kind, args.step,
                                  input_digest=args.input_digest,
                                  output_digest=args.output_digest,
                                  receipt_digest=args.receipt_digest,
                                  gate=args.gate)
        # CLI never prints raw patient notes, quotes or private material.
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (ValueError, RuntimeError, FileNotFoundError, KeyError) as exc:
        print(json.dumps({"status": "blocked", "error": str(exc),
                          "execution_authorized": False}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
