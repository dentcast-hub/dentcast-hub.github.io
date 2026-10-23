"""First-cut transport tests: fake Git data, never simulated scientific work."""
import base64
import copy
import hashlib
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc
import dentcast_connected_first_push as fp

HEAD = "a" * 40
TREE = "b" * 40
COMMIT = "c" * 40
NEW_TREE = "d" * 40


def fixture():
    content = "insight/insight-fixture"
    path = content + ".html"
    asset = "insight/assets/first-cut-fixture.webp"
    # Structured fixture tests only transport and canonical ledgers. It does
    # not assert that any real author approval or scientific step occurred.
    p = {
        "content_id": content, "category": "insight",
        "target_paths": [path, asset], "status": "in_progress",
        "blocker": None,
        "context": {k: [] for k in (
            "inputs", "decisions", "approvals", "pending_questions", "validation",
            "delivery", "unrelated_changes")},
        "steps": lc.plan(), "external_actions": []}
    # Synthetic only: these declarations exercise first-cut infrastructure
    # and NEVER represent clinical review or a real author approval.
    p["context"]["decisions"] = [
        {"kind": "first_cut_lead_provenance_v1",
         "origin": "not_applicable", "source_ref": "fixture:no-lead-in-test",
         "evidence": ["fixture:structural-only"]},
        {"kind": "first_cut_scope_audit_v1",
         "landing_path": "insight/index.html",
         "landing_mode": "generated_later",
         "builder_ref": "fixture:synthetic-builder",
         "related_changed_paths": [],
         "observed_changed_paths": [path, asset],
         "evidence": ["fixture:synthetic-audit"]}]
    for row in p["steps"]:
        row["status"] = "completed"
        row["evidence"] = ["fixture:synthetic:" + row["id"]]
        if row["id"] == "C.4.9":
            break
    wire = h.render({"schema": h.SCHEMA, "publication": p,
                     "reconciliation": None}).encode()
    tiny_webp = base64.b64decode("UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=")
    return {
        path: ('<html><img src="/' + asset + '"></html>').encode(),
        asset: tiny_webp,
        h.STATE_PATH: wire
    }


class FakeGitHub:
    def __init__(self):
        self.ref = HEAD
        self.blobs = {}
        self.tree_id = None
        self.updated = 0
        self.handoff = None
        self.mutate_before_update = False
        self.baseline_media = {}
        self.baseline_landing = b"<html><div id='fixture-builder-render'></div></html>"

    def head(self, branch):
        return self.ref

    def existing_handoff(self, branch):
        return self.handoff

    def commit_tree(self, sha):
        return TREE if sha == HEAD else self.tree_id

    def blob(self, body):
        oid = fp.git_oid(body)
        self.blobs[oid] = body
        return oid

    def tree(self, base, entries):
        assert base == TREE
        self.tree_id = NEW_TREE
        self.entries = entries
        return NEW_TREE

    def commit(self, tree, parent):
        assert tree == NEW_TREE and parent == HEAD
        return COMMIT

    def update(self, branch, sha):
        if self.mutate_before_update:
            self.ref = "e" * 40
            raise ValueError("GITHUB_NON_FAST_FORWARD")
        if self.ref != HEAD:
            raise ValueError("STALE_REF")
        self.ref = sha
        self.updated += 1

    def path_oid(self, path, commit):
        if path == "insight/index.html" and commit in (HEAD, COMMIT):
            return fp.git_oid(self.baseline_landing)
        if path in self.baseline_media and commit in (HEAD, COMMIT):
            return fp.git_oid(self.baseline_media[path])
        if commit == HEAD:
            raise ValueError("REMOTE_PATH_NOT_FILE:" + path)
        assert commit == COMMIT
        return next(x["sha"] for x in self.entries if x["path"] == path)

    def get_blob(self, sha):
        if sha == fp.git_oid(self.baseline_landing):
            return self.baseline_landing
        for body in self.baseline_media.values():
            if fp.git_oid(body) == sha:
                return body
        return self.blobs[sha]


class FirstCutTests(unittest.TestCase):
    def test_checked_in_real_webp_and_schema_fixture(self):
        """Fixture written through connected GitHub blob/tree/ref, not publishing."""
        folder = Path(__file__).resolve().parent / "fixtures/connected-first-cut"
        path = "tests/fixtures/connected-first-cut/page.html"
        asset = "tests/fixtures/connected-first-cut/image.webp"
        files = {
            path: (folder / "page.html").read_bytes(),
            asset: (folder / "image.webp").read_bytes(),
            h.STATE_PATH: (folder / "handoff.md").read_bytes()
        }
        meta = fp.validate_cut(files)
        self.assertEqual(meta["next_step"], "C.4.10.1")
        self.assertEqual(files[asset][:4], b"RIFF")

    def test_atomic_first_cut_and_binary_readback(self):
        client = FakeGitHub()
        files = fixture()
        result = fp.deliver(client, "content/test-cut", HEAD, files, 1024 * 1024)
        self.assertEqual(result["delivery"], "verified-first-cut")
        self.assertEqual(result["next_step"], "C.4.10.1")
        self.assertEqual(client.updated, 1)
        self.assertEqual(len(client.entries), 3)
        self.assertEqual({x["path"] for x in client.entries}, set(files))
        self.assertEqual(result["sha256"][h.STATE_PATH],
                         hashlib.sha256(files[h.STATE_PATH]).hexdigest())

    def test_tool_specific_size_limit_checked_before_transfer(self):
        client = FakeGitHub()
        with self.assertRaisesRegex(ValueError, "BLOB_EXCEEDS_TOOL_LIMIT"):
            fp.deliver(client, "content/test-cut", HEAD, fixture(), 10)
        self.assertEqual(client.blobs, {})

    def test_bad_post_update_path_receipt_is_not_success(self):
        class Tampered(FakeGitHub):
            def path_oid(self, path, commit):
                return "e" * 40
        client = Tampered()
        with self.assertRaisesRegex(ValueError, "POST_UPDATE_TREE_PATH_MISMATCH"):
            fp.deliver(client, "content/test-cut", HEAD, fixture(), 1024 * 1024)
        self.assertEqual(client.updated, 1)  # outcome needs reconciliation; no retry

    def test_ref_moved_before_blob_upload(self):
        client = FakeGitHub()
        client.ref = "f" * 40
        with self.assertRaisesRegex(ValueError, "HEAD_CHANGED_BEFORE_UPLOAD"):
            fp.deliver(client, "content/test-cut", HEAD, fixture(), 1024 * 1024)
        self.assertEqual(client.blobs, {})

    def test_ref_moves_after_commit(self):
        client = FakeGitHub()
        client.mutate_before_update = True
        with self.assertRaisesRegex(ValueError, "NON_FAST_FORWARD"):
            fp.deliver(client, "content/test-cut", HEAD, fixture(), 1024 * 1024)
        self.assertEqual(client.updated, 0)

    def test_no_replacement_of_existing_handoff(self):
        client = FakeGitHub()
        client.handoff = {"sha": "other-run"}
        with self.assertRaisesRegex(ValueError, "REMOTE_HANDOFF_EXISTS"):
            fp.deliver(client, "content/test-cut", HEAD, fixture(), 1024 * 1024)

    def test_invalid_ledger_and_missing_image_rejected(self):
        files = fixture()
        del files["insight/assets/first-cut-fixture.webp"]
        with self.assertRaisesRegex(ValueError, "MISSING_CANONICAL_TARGET_BYTES"):
            fp.validate_cut(files)
        files = fixture()
        p, _ = h.parse_state(files[h.STATE_PATH])
        p["publication"]["steps"][0]["status"] = "pending"
        p["publication"]["steps"][0]["evidence"] = []
        files[h.STATE_PATH] = h.render(p).encode()
        with self.assertRaises((h.Blocked, ValueError)):
            fp.validate_cut(files)

    def test_failed_external_action_blocks_before_blob_upload(self):
        files = fixture()
        state, _ = h.parse_state(files[h.STATE_PATH])
        state["publication"]["external_actions"].append({
            "id": "fixture:drive-upload", "target": "drive:fixture",
            "status": "failed", "evidence": ["fixture:failed-outcome"]})
        files[h.STATE_PATH] = h.render(state).encode()
        client = FakeGitHub()
        with self.assertRaisesRegex(ValueError, "EXTERNAL_OUTCOME_UNRESOLVED"):
            fp.deliver(client, "content/test-cut", HEAD, files, 1024 * 1024)
        self.assertEqual(client.blobs, {})
        self.assertEqual(client.updated, 0)
        self.assertEqual(client.ref, HEAD)

    def test_missing_static_landing_page_blocks_upload(self):
        files = fixture()
        state, _ = h.parse_state(files[h.STATE_PATH])
        state["publication"]["target_paths"].append("insight/index.html")
        audit = next(x for x in state["publication"]["context"]["decisions"]
                     if x["kind"] == "first_cut_scope_audit_v1")
        audit["landing_mode"] = "included"
        audit["observed_changed_paths"].append("insight/index.html")
        files[h.STATE_PATH] = h.render(state).encode()
        client = FakeGitHub()
        with self.assertRaisesRegex(ValueError, "MISSING_CANONICAL_TARGET_BYTES:insight/index.html"):
            fp.deliver(client, "content/test-cut", HEAD, files, 1024 * 1024)
        self.assertEqual(client.blobs, {})
        self.assertEqual(client.updated, 0)

    def test_unreviewed_extra_path_blocks(self):
        files = fixture()
        files["insight/index.html"] = b"<html>unreviewed</html>"
        with self.assertRaisesRegex(ValueError, "UNDECLARED_FIRST_CUT_PATH"):
            fp.validate_cut(files)

    def test_pending_question_blocks_before_upload(self):
        files = fixture()
        state, _ = h.parse_state(files[h.STATE_PATH])
        state["publication"]["context"]["pending_questions"].append("fixture:ask author")
        files[h.STATE_PATH] = h.render(state).encode()
        client = FakeGitHub()
        with self.assertRaisesRegex(ValueError, "FIRST_CUT_PENDING_QUESTIONS"):
            fp.deliver(client, "content/test-cut", HEAD, files, 1024 * 1024)
        self.assertEqual(client.blobs, {})

    def test_pending_or_rejected_approval_blocks_before_upload(self):
        for status in ("pending", "rejected"):
            with self.subTest(status=status):
                files = fixture()
                state, _ = h.parse_state(files[h.STATE_PATH])
                state["publication"]["context"]["approvals"].append({
                    "scope": "authored-intro", "status": status,
                    "decision": None if status == "pending" else "declined",
                    "evidence": [] if status == "pending" else ["fixture:declined"]})
                files[h.STATE_PATH] = h.render(state).encode()
                client = FakeGitHub()
                with self.assertRaisesRegex(ValueError, "FIRST_CUT_UNRESOLVED_APPROVAL"):
                    fp.deliver(client, "content/test-cut", HEAD, files, 1024 * 1024)
                self.assertEqual(client.blobs, {})

    def test_explicit_approved_intro_allows_transport(self):
        files = fixture()
        state, _ = h.parse_state(files[h.STATE_PATH])
        state["publication"]["context"]["approvals"].append({
            "scope": "authored-intro", "status": "confirmed",
            "decision": "approved", "evidence": ["fixture:author-message"]})
        files[h.STATE_PATH] = h.render(state).encode()
        self.assertEqual(fp.validate_cut(files)["next_step"], "C.4.10.1")

    def test_missing_lead_origin_declaration_is_blocked(self):
        files = fixture()
        state, _ = h.parse_state(files[h.STATE_PATH])
        state["publication"]["context"]["decisions"] = [
            d for d in state["publication"]["context"]["decisions"]
            if d["kind"] != "first_cut_lead_provenance_v1"]
        files[h.STATE_PATH] = h.render(state).encode()
        client = FakeGitHub()
        with self.assertRaisesRegex(h.Blocked, "FIRST_CUT_DECLARATION_REQUIRED"):
            fp.deliver(client, "content/test-cut", HEAD, files, 1024 * 1024)
        self.assertEqual(client.blobs, {})
        self.assertEqual(client.updated, 0)

    def test_agent_written_intro_requires_recorded_confirmed_approval(self):
        for status in ("absent", "pending", "rejected", "confirmed"):
            with self.subTest(status=status):
                files = fixture()
                state, _ = h.parse_state(files[h.STATE_PATH])
                lead = next(d for d in state["publication"]["context"]["decisions"]
                            if d["kind"] == "first_cut_lead_provenance_v1")
                lead["origin"] = "agent_authored"
                lead["source_ref"] = "fixture:agent-wrote-lead"
                if status != "absent":
                    state["publication"]["context"]["approvals"].append({
                        "scope": "authored-intro", "status": status,
                        "decision": None if status == "pending" else
                                    ("approved" if status == "confirmed" else "declined"),
                        "evidence": [] if status == "pending" else ["fixture:user-message"]})
                files[h.STATE_PATH] = h.render(state).encode()
                client = FakeGitHub()
                if status == "confirmed":
                    self.assertEqual(fp.validate_cut(files)["next_step"], "C.4.10.1")
                else:
                    with self.assertRaises((h.Blocked, ValueError)):
                        fp.deliver(client, "content/test-cut", HEAD, files, 1024 * 1024)
                    self.assertEqual(client.blobs, {})
                    self.assertEqual(client.updated, 0)

    def test_original_author_paragraph_needs_no_new_approval(self):
        files = fixture()
        state, _ = h.parse_state(files[h.STATE_PATH])
        lead = next(d for d in state["publication"]["context"]["decisions"]
                    if d["kind"] == "first_cut_lead_provenance_v1")
        lead["origin"] = "author_original"
        lead["source_ref"] = "fixture:original-author-paragraph"
        files[h.STATE_PATH] = h.render(state).encode()
        self.assertEqual(fp.validate_cut(files)["next_step"], "C.4.10.1")

    def test_undeclared_manual_landing_and_related_changed_pages_block(self):
        for changed in ("landing", "related"):
            with self.subTest(changed=changed):
                files = fixture()
                state, _ = h.parse_state(files[h.STATE_PATH])
                audit = next(d for d in state["publication"]["context"]["decisions"]
                             if d["kind"] == "first_cut_scope_audit_v1")
                if changed == "landing":
                    audit["landing_mode"] = "included"
                else:
                    audit["related_changed_paths"].append("glossary/another-page.html")
                files[h.STATE_PATH] = h.render(state).encode()
                client = FakeGitHub()
                with self.assertRaises((h.Blocked, ValueError)):
                    fp.deliver(client, "content/test-cut", HEAD, files, 1024 * 1024)
                self.assertEqual(client.blobs, {})
                self.assertEqual(client.updated, 0)

    def test_webp_referenced_but_not_declared_or_in_base_blocks_before_upload(self):
        files = fixture()
        page = "insight/insight-fixture.html"
        files[page] = files[page].replace(
            b"</html>", b'<img src="/insight/assets/unlisted.webp?v=3"></html>')
        client = FakeGitHub()
        with self.assertRaisesRegex((h.Blocked, ValueError),
                                    "FIRST_CUT_WEBP_NOT_IN_BUNDLE_OR_BASE"):
            fp.deliver(client, "content/test-cut", HEAD, files, 1024 * 1024)
        self.assertEqual(client.blobs, {})
        self.assertEqual(client.updated, 0)

    def test_existing_baseline_webp_is_verified_by_oid_and_bytes(self):
        files = fixture()
        page = "insight/insight-fixture.html"
        path = "insight/assets/old-existing.webp"
        files[page] = files[page].replace(
            b"</html>", b'<img src="/insight/assets/old-existing.webp?v=1"></html>')
        body = files["insight/assets/first-cut-fixture.webp"]
        client = FakeGitHub()
        client.baseline_media[path] = body
        result = fp.deliver(client, "content/test-cut", HEAD, files, 1024 * 1024)
        self.assertEqual(result["baseline_media"], [path])
        self.assertEqual(client.updated, 1)

    def test_undeclared_static_index_detected_from_actual_base(self):
        files = fixture()
        client = FakeGitHub()
        client.baseline_landing = (
            b'<html><ul><li><a href="insight-98.html">existing article</a>'
            b'</li></ul></html>')
        with self.assertRaisesRegex(h.Blocked,
                                    "MANUAL_LANDING_MUST_BE_INCLUDED_BEFORE_CUT"):
            fp.deliver(client, "content/test-cut", HEAD, files, 1024 * 1024)
        self.assertEqual(client.blobs, {})
        self.assertEqual(client.updated, 0)

    def test_bad_existing_baseline_webp_is_blocked(self):
        files = fixture()
        page = "insight/insight-fixture.html"
        path = "insight/assets/old-existing.webp"
        files[page] = files[page].replace(
            b"</html>", b'<img src="/insight/assets/old-existing.webp"></html>')
        client = FakeGitHub()
        client.baseline_media[path] = b"fake webp"
        with self.assertRaisesRegex((h.Blocked, ValueError),
                                    "FIRST_CUT_WEBP_NOT_IN_BUNDLE_OR_BASE"):
            fp.deliver(client, "content/test-cut", HEAD, files, 1024 * 1024)
        self.assertEqual(client.blobs, {})

    def test_not_full_publication_or_paper_only(self):
        files = fixture()
        p, _ = h.parse_state(files[h.STATE_PATH])
        for step in p["publication"]["steps"]:
            step["status"] = "completed"
            step["evidence"] = ["fixture:synthetic"]
        files[h.STATE_PATH] = h.render(p).encode()
        with self.assertRaisesRegex(ValueError, "FIRST_CUT_NOT_COMPLETE"):
            fp.validate_cut(files)
        with self.assertRaisesRegex(ValueError, "FEATURE_BRANCH_REQUIRED"):
            fp.deliver(FakeGitHub(), "main", HEAD, fixture(), 1024 * 1024)


if __name__ == "__main__":
    unittest.main()
