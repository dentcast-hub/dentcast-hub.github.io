#!/usr/bin/env python3
"""One atomic GitHub Git-Data delivery at DentCast's first publication cut.

Transport adapter, NOT a publishing engine. The canonical local helper must
already have generated the v3 handoff with real step evidence. This tool cannot
grant approvals, classify sources, produce DES/Fidelity or skip a gate.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen
import os

import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc

REPO = "dentcast-hub/dentcast-hub.github.io"
HANDOFF = h.STATE_PATH


def need(ok, reason):
    if not ok:
        raise ValueError(reason)


def git_oid(body):
    return hashlib.sha1(b"blob " + str(len(body)).encode() + b"\0" + body).hexdigest()


def validate_cut(files):
    """Validate canonical v3 wire state and structural asset inventory; no
    simulated semantic or scientific validation is implied.
    """
    need(isinstance(files, dict) and HANDOFF in files, "HANDOFF_REQUIRED")
    need(all(isinstance(data, bytes) for data in files.values()), "BYTES_REQUIRED")
    for path in files:
        h.relative_path(path)
        need(path != ".git" and not path.startswith(".git/"), "UNSAFE_PATH")
    state, _ = h.parse_state(files[HANDOFF])
    need(state["schema"] == h.SCHEMA, "V3_HANDOFF_REQUIRED")
    p = state["publication"]
    lc.require_plan(p)
    need(p["category"] != "paper-only", "PAPER_ONLY_HAS_ANOTHER_ROUTE")
    need(p["content_id"] not in ("", "unassigned")
         and p["category"] != "pending", "INTAKE_UNBOUND")
    need(lc.delivery_boundary(p) == 1, "FIRST_CUT_NOT_COMPLETE")
    need(p["status"] == "in_progress" and p["blocker"] is None, "PUBLICATION_BLOCKED")
    need(not any(a["status"] in ("started", "outcome_unknown")
                 for a in p["external_actions"]), "EXTERNAL_OUTCOME_UNRESOLVED")
    need(all(path == HANDOFF or path in p["target_paths"] for path in files),
         "PATH_NOT_IN_CANONICAL_TARGETS")
    html = p["content_id"] + ".html"
    need(html in files and b"<html" in files[html].lower(),
         "PAGE_BYTES_REQUIRED")
    # Image paths in the HTML are not always URL-encoded; this is a guard
    # against referring to a newly staged image that never reached the commit.
    for path in p["target_paths"]:
        if path.lower().endswith(".webp") and (
                path.encode("utf-8") in files[html]
                or Path(path).name.encode("utf-8") in files[html]):
            need(path in files, "REFERENCED_WEBP_BYTES_REQUIRED:" + path)
            body = files[path]
            need(len(body) >= 20 and body[:4] == b"RIFF"
                 and body[8:12] == b"WEBP"
                 and int.from_bytes(body[4:8], "little") + 8 == len(body)
                 and body[12:16] in (b"VP8 ", b"VP8L", b"VP8X"),
                 "INVALID_WEBP_BYTES:" + path)
    return {"content_id": p["content_id"],
            "next_step": h.next_step(p),
            "state_sha256": hashlib.sha256(files[HANDOFF]).hexdigest()}


class REST:
    """GitHub REST implementation. The same Git-data operations are exposed by
    the connected GitHub tools, including create_blob/tree/commit/update_ref.
    """
    def __init__(self, token, repo=REPO):
        need(bool(token), "GITHUB_TOKEN_REQUIRED_FOR_CLI")
        self.token, self.repo = token, repo

    def call(self, method, endpoint, data=None, missing_ok=False):
        uri = "https://api.github.com/repos/" + self.repo + endpoint
        raw = None if data is None else json.dumps(data).encode("utf-8")
        request = Request(uri, raw, method=method, headers={
            "Authorization": "Bearer " + self.token,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "dentcast-first-cut"})
        try:
            with urlopen(request, timeout=25) as resp:
                body = resp.read()
            return json.loads(body) if body else {}
        except HTTPError as exc:
            if missing_ok and exc.code == 404:
                return None
            # Do not log tokens, headers, request data or server error bodies.
            raise ValueError("GITHUB_HTTP_" + str(exc.code)) from None

    def head(self, branch):
        data = self.call("GET", "/git/ref/heads/" + quote(branch, safe="/"))
        return data["object"]["sha"]

    def commit_tree(self, sha):
        return self.call("GET", "/git/commits/" + sha)["tree"]["sha"]

    def existing_handoff(self, branch):
        return self.call("GET", "/contents/" + HANDOFF +
                         "?ref=" + quote(branch, safe=""), missing_ok=True)

    def blob(self, body):
        data = self.call("POST", "/git/blobs", {
            "content": base64.b64encode(body).decode("ascii"),
            "encoding": "base64"})
        return data["sha"]

    def tree(self, base, entries):
        return self.call("POST", "/git/trees", {
            "base_tree": base, "tree": entries})["sha"]

    def commit(self, tree, parent):
        return self.call("POST", "/git/commits", {
            "message": "publish: first verified checkpoint at C.4.9",
            "tree": tree, "parents": [parent]})["sha"]

    def update(self, branch, sha):
        # Only a fast-forward is allowed. Because the new commit's sole
        # parent is expected HEAD, a concurrent branch advance is rejected.
        self.call("PATCH", "/git/refs/heads/" + quote(branch, safe="/"),
                  {"sha": sha, "force": False})

    def path_oid(self, path, commit):
        """Prove the delivered tree actually binds each path to its blob."""
        response = self.call("GET", "/contents/" + quote(path, safe="/")
                             + "?ref=" + quote(commit, safe=""))
        need(response.get("type") == "file", "REMOTE_PATH_NOT_FILE:" + path)
        return response["sha"]

    def get_blob(self, sha):
        data = self.call("GET", "/git/blobs/" + sha)
        need(data["encoding"] == "base64", "UNSUPPORTED_REMOTE_BLOB_ENCODING")
        return base64.b64decode(data["content"])


def deliver(transport, branch, expected_head, files, max_blob_bytes):
    """Commit exactly once on a pre-created publication branch, fail-closed.

    No CLI git checkout needed for the GitHub REST backend. For connector-only
    execution these same operations must be run via GitHub tools, with an
    independently validated handoff; this function is not an authorization to
    manufacture a checkpoint in a tool-limited environment.
    """
    need(bool(branch) and branch != "main", "FEATURE_BRANCH_REQUIRED")
    need(isinstance(expected_head, str) and len(expected_head) == 40
         and all(x in "0123456789abcdef" for x in expected_head),
         "EXACT_EXPECTED_HEAD_REQUIRED")
    need(type(max_blob_bytes) is int and max_blob_bytes > 0,
         "TOOL_BLOB_LIMIT_REQUIRED")
    for path, body in files.items():
        need(len(body) <= max_blob_bytes, "BLOB_EXCEEDS_TOOL_LIMIT:" + path)
    meta = validate_cut(files)
    need(transport.head(branch) == expected_head, "HEAD_CHANGED_BEFORE_UPLOAD")
    need(transport.existing_handoff(branch) is None,
         "REMOTE_HANDOFF_EXISTS_RECONCILE_FIRST")
    base_tree = transport.commit_tree(expected_head)
    entries = []
    for path, body in sorted(files.items()):
        expected_oid = git_oid(body)
        observed_oid = transport.blob(body)
        need(observed_oid == expected_oid, "BLOB_SHA_MISMATCH:" + path)
        entries.append({"path": path, "mode": "100644", "type": "blob",
                        "sha": expected_oid})
    tree = transport.tree(base_tree, entries)
    commit = transport.commit(tree, expected_head)
    need(transport.head(branch) == expected_head, "HEAD_CHANGED_BEFORE_REF_UPDATE")
    transport.update(branch, commit)  # no force, no retry on ambiguous error
    need(transport.head(branch) == commit, "POST_UPDATE_HEAD_NOT_CONFIRMED")
    need(transport.commit_tree(commit) == tree, "POST_UPDATE_TREE_MISMATCH")
    for path, body in files.items():
        oid = git_oid(body)
        need(transport.path_oid(path, commit) == oid,
             "POST_UPDATE_TREE_PATH_MISMATCH:" + path)
        need(transport.get_blob(oid) == body,
             "POST_UPDATE_BLOB_BYTES_MISMATCH:" + path)
    return {**meta, "branch": branch, "commit": commit,
            "tree": tree, "paths": list(sorted(files)),
            "sha256": {p: hashlib.sha256(b).hexdigest() for p, b in files.items()},
            "delivery": "verified-first-cut"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", default=REPO)
    parser.add_argument("--branch", required=True)
    parser.add_argument("--expected-head", required=True)
    parser.add_argument("--manifest", required=True, help="Local JSON path-to-file map")
    parser.add_argument("--max-blob-bytes", type=int, required=True,
                        help="Measured maximum accepted by the selected transfer tool")
    args = parser.parse_args()
    manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    need(isinstance(manifest, dict) and manifest, "MANIFEST_REQUIRED")
    files = {h.relative_path(dst): Path(src).read_bytes()
             for dst, src in manifest.items()}
    result = deliver(REST(os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN"),
                          args.repo), args.branch, args.expected_head, files, args.max_blob_bytes)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
