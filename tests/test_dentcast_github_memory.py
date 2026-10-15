"""Stage 4: independent fake GitHub Git-Data integration and race/replay tests."""
import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("s4", ROOT / "tools/dentcast_github_memory.py")
m = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(m)
D = "a" * 64
REV = "b" * 40
ACTORS = {
    "claude": {"family": "claude", "model": "sonnet", "session": "s1"},
    "cursor": {"family": "cursor", "model": "model-x", "session": "s2"},
    "codex": {"family": "codex", "model": "model-y", "session": "s3"},
}


class FakeGit:
    """Mimics atomic Git commits, snapshots and nonforce fast-forward CAS."""
    repo, branch = m.REPO, m.BRANCH

    def __init__(self):
        self.version = 0
        self.head_ref = "0" * 40
        self.commits = {self.head_ref: {"tree": {"sha": "t0"},
                                        "parent": None, "files": {}}}
        self.pending_trees = {}
        self.inject_race = None

    def call(self, verb, endpoint, body=None):
        if verb == "GET" and endpoint.startswith("git/ref/heads/"):
            return {"object": {"sha": self.head_ref}}
        if verb == "GET" and endpoint.startswith("git/commits/"):
            sha = endpoint.split("/")[-1]
            return self.commits[sha]
        if verb == "GET" and endpoint.startswith("contents/"):
            from urllib.parse import unquote
            path, ref = endpoint[9:].split("?ref=")
            path = unquote(path)
            files = self.commits[ref]["files"]
            if path not in files:
                raise FileNotFoundError(path)
            import base64
            return {"encoding": "base64",
                    "content": base64.b64encode(m.canonical(files[path])).decode("ascii")}
        if verb == "POST" and endpoint == "git/trees":
            self.version += 1
            sha = "t" + str(self.version)
            self.pending_trees[sha] = (body["base_tree"],
                                       copy.deepcopy(body["tree"]))
            return {"sha": sha}
        if verb == "POST" and endpoint == "git/commits":
            parent = body["parents"][0]
            self.version += 1
            sha = ("%040x" % self.version)
            base, edits = self.pending_trees[body["tree"]]
            files = copy.deepcopy(self.commits[parent]["files"])
            for item in edits:
                files[item["path"]] = json.loads(item["content"])
            self.commits[sha] = {"tree": {"sha": body["tree"]},
                                 "parent": parent, "files": files}
            return {"sha": sha}
        if verb == "PATCH" and endpoint.startswith("git/refs/heads/"):
            if self.inject_race is not None:
                fn = self.inject_race
                self.inject_race = None
                fn()
            candidate = self.commits[body["sha"]]
            if candidate["parent"] != self.head_ref or body["force"] is not False:
                raise m.Conflict("RACING_WRITER")
            self.head_ref = body["sha"]
            return {"ref": endpoint, "object": {"sha": self.head_ref}}
        raise AssertionError((verb, endpoint, body))


class RemoteMemoryTests(unittest.TestCase):
    def setUp(self):
        self.api = FakeGit()
        self.store = m.RemoteMemory(self.api)

    def start(self, name="test-run"):
        result = self.store.begin(name, REV, D, ACTORS["claude"])
        self.assertEqual(result["state"]["revision"], 1)
        return name

    def test_begin_replay_and_three_agent_handoff(self):
        run = self.start()
        first = self.store.snapshot(run)
        self.assertEqual(len(first["events"]), 1)
        self.assertFalse(first["state"]["execution_authorized"])
        self.store.append(run, ACTORS["claude"], "step_completed", "intake:route",
                          input_digest=D, receipt_digest=D, gate="local_integrity_checked")
        self.store.append(run, ACTORS["cursor"], "step_paused", "page:draft",
                          input_digest=D, gate="blocked")
        blocked = self.store.snapshot(run)
        self.assertEqual(blocked["state"]["status"], "paused")
        with self.assertRaisesRegex(ValueError, "PAUSED_REQUIRES_EXPLICIT_RECOVERY"):
            self.store.append(run, ACTORS["codex"], "step_completed", "page:draft",
                              receipt_digest=D, gate="local_integrity_checked")
        self.store.append(run, ACTORS["cursor"], "step_recovered", "page:draft")
        self.store.append(run, ACTORS["codex"], "step_completed", "page:draft",
                          receipt_digest=D, gate="local_integrity_checked")
        last = self.store.snapshot(run)
        self.assertEqual(last["state"]["revision"], 5)
        self.assertEqual(last["state"]["completed_steps"],
                         ["intake:route", "page:draft"])
        self.assertEqual(last["state"]["status"], "active")
        self.assertEqual([x["actor"]["family"] for x in last["events"]],
                         ["claude", "claude", "cursor", "cursor", "codex"])

    def test_racing_writers_only_one_fast_forwards(self):
        run = self.start()
        def winner():
            self.store.append(run, ACTORS["cursor"], "step_completed",
                              "intake:route", receipt_digest=D,
                              gate="local_integrity_checked")
        self.api.inject_race = winner
        with self.assertRaisesRegex(m.Conflict, "CONCURRENT_WRITER_LOST"):
            self.store.append(run, ACTORS["claude"], "step_completed",
                              "page:draft", receipt_digest=D,
                              gate="local_integrity_checked")
        snap = self.store.snapshot(run)
        self.assertEqual(snap["state"]["completed_steps"], ["intake:route"])
        self.assertEqual(snap["state"]["revision"], 2)
        self.assertEqual(len(snap["events"]), 2)

    def test_resume_from_existing_commit_pinned_snapshot(self):
        run = self.start()
        old = self.store.head()
        self.store.append(run, ACTORS["codex"], "step_paused", "page:draft")
        snap_old = self.store.snapshot(run, old)
        self.assertEqual(len(snap_old["events"]), 1)
        self.assertEqual(self.store.snapshot(run)["state"]["status"], "paused")

    def test_forged_or_missing_event_replay_blocks(self):
        run = self.start()
        self.store.append(run, ACTORS["claude"], "step_completed", "intake:route",
                          receipt_digest=D, gate="engine_verified")
        filemap = self.api.commits[self.api.head_ref]["files"]
        state = filemap[m.run_folder(run) + "/state.json"]
        state["completed_steps"] = ["not-really"]
        with self.assertRaisesRegex(ValueError, "STATE_EVENT_REPLAY_DIVERGENCE"):
            self.store.snapshot(run)
        state["completed_steps"] = ["intake:route"]
        event_path = self.store.event_path(run, 2, state["event_digests"][1])
        filemap[event_path]["kind"] = "step_paused"
        with self.assertRaisesRegex(ValueError, "EVENT_REPLAY_INTEGRITY_FAILURE"):
            self.store.snapshot(run)
        del filemap[event_path]
        with self.assertRaises(FileNotFoundError):
            self.store.snapshot(run)

    def test_stale_manual_snapshot_cannot_overwrite(self):
        run = self.start()
        snap = self.store.snapshot(run)
        self.store.append(run, ACTORS["cursor"], "step_paused", "page:draft")
        with self.assertRaises(m.Conflict):
            self.store._atomic_commit(snap["head"], {
                m.run_folder(run) + "/state.json": snap["state"]},
                "stale overwrite")

    def test_invalid_provenance_and_sensitive_metadata_rejected(self):
        run = self.start()
        with self.assertRaisesRegex(ValueError, "UNSAFE_ACTOR_METADATA"):
            self.store.append(run, {"family": "claude",
                                    "model": "patient name with spaces",
                                    "session": "s1"}, "step_paused", "page:draft")
        with self.assertRaisesRegex(ValueError, "UNVERIFIED_COMPLETE_FORBIDDEN"):
            self.store.append(run, ACTORS["codex"], "step_completed",
                              "page:draft", receipt_digest=D)
        with self.assertRaisesRegex(ValueError, "MISSING_VERIFIED_RECEIPT_HASH"):
            self.store.append(run, ACTORS["codex"], "step_completed",
                              "page:draft", gate="local_integrity_checked")
        with self.assertRaisesRegex(ValueError, "INVALID_RUN_ID"):
            self.store.begin("../../bad", REV, D, ACTORS["claude"])
        with self.assertRaisesRegex(ValueError, "RUN_ALREADY_EXISTS"):
            self.store.begin(run, REV, D, ACTORS["claude"])

    def test_finished_is_staging_only(self):
        run = self.start()
        self.store.append(run, ACTORS["claude"], "staging_finished", "run:finished")
        snap = self.store.snapshot(run)
        self.assertEqual(snap["state"]["status"], "finished_staging")
        self.assertFalse(snap["state"]["real_publish_verified"])
        with self.assertRaisesRegex(ValueError, "RUN_ALREADY_FINISHED"):
            self.store.append(run, ACTORS["claude"], "step_completed",
                              "page:draft", receipt_digest=D, gate="engine_verified")


if __name__ == "__main__":
    unittest.main()
