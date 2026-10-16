"""Stage 3 actual local module edits, strict preconditions and evidence round trip."""
import hashlib
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHA = "b" * 40
DIGEST = "a" * 64


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / "tools" / filename)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


runner = load("s3apply_runner", "dentcast_stage3_orchestrator.py")
bridge = load("s3apply_bridge", "dentcast_stage3_bridge.py")
patcher = load("s3apply", "dentcast_stage3_apply.py")


def report(inv, digest):
    fields = inv["required_output_schema"]
    o = {}
    for key, kind in fields.items():
        o[key] = {"digest": DIGEST, "optional_digest": DIGEST, "text": "placeholder",
                  "bool_true": True, "bool_false": False, "nonnegative": 0,
                  "positive": 1, "zero": 0, "one": 1, "list": [], "mapping": {}}[kind]
    if inv["step"]["step_id"] == "intake:route":
        o["route"] = inv["context"]["route"]
    return {
        "step_id": inv["step"]["step_id"], "module_id": inv["step"]["module_id"],
        "input_digest": inv["input_digest"], "status": "completed",
        "outputs": o, "external_receipt_digest": digest,
        "approval_receipt_digest": None, "error": None,
    }


class Stage3ApplyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.workspace = Path(self.temp.name) / "disposable"
        self.workspace.mkdir()
        (self.workspace / bridge.SANDBOX_MARKER).write_text(json.dumps({
            "purpose": "dentcast-stage3-disposable-test",
            "allow_real_publication": False, "allow_remote_mutation": False,
        }), encoding="utf-8")
        self.state = runner.begin({
            "has_text": True, "has_paper": False,
            "category": "clinical", "challenge": False,
        }, "sandbox", SHA)
        # Stage 3 intake is an operator checkpoint in these synthetic fixtures.
        first = runner.next_invocation(self.state)
        self.state = runner.submit(self.state, report(first, DIGEST))
        self.inv = runner.next_invocation(self.state)
        self.assertEqual(self.inv["step"]["step_id"], "page:draft")
        (self.workspace / "clinical").mkdir()
        self.target = self.workspace / "clinical" / "insight-test.html"
        self.target.write_text("<h1>Before</h1>", encoding="utf-8")

    def intent(self, path="clinical/insight-test.html", before=None,
               text="<h1>After</h1>", gates=None):
        if before is None:
            before = hashlib.sha256(self.target.read_bytes()).hexdigest()
        return {
            "step_id": self.inv["step"]["step_id"],
            "input_digest": self.inv["input_digest"],
            "author_asserted_gates": self.inv["step"]["approval_gates"]
            if gates is None else gates,
            "edits": [{"path": path, "before_sha256": before, "content_utf8": text}],
        }


    def test_stage7_canonical_write_ownership_fail_closed(self):
        # Test the concrete canonical paths, not only permissive wildcard scopes.
        patcher.allowed("evidence", "plus/des-scores.json")
        patcher.allowed("learning-assets", "plus/faq-corpus.json")
        patcher.allowed("page", "litecast/lite-glossary.json")
        for owner, path in (
            ("evidence", "des-scores.json"),
            ("learning-assets", "plus/quiz-index.json"),
            ("brain", "litecast/lite-glossary.json"),
        ):
            with self.subTest(owner=owner, path=path):
                with self.assertRaisesRegex(ValueError, "MODULE_WRITE_SCOPE_FORBIDDEN"):
                    patcher.allowed(owner, path)

    def test_stage7_builder_write_ownership_prevents_source_mutation(self):
        state = runner.begin({"has_text": True, "has_paper": False,
                              "category": "clinical", "challenge": False},
                             "builder-guard", SHA)
        while runner.next_invocation(state)["step"]["step_id"] != "build:version":
            state = runner.submit(state, report(runner.next_invocation(state), DIGEST))
        invocation = runner.next_invocation(state)
        self.assertEqual(invocation["step"]["step_id"], "build:version")
        def intent(inv, name):
            return {"step_id": inv["step"]["step_id"],
                    "input_digest": inv["input_digest"],
                    "author_asserted_gates": inv["step"]["approval_gates"],
                    "edits": [{"path": name, "before_sha256": None,
                               "content_utf8": "{}"}]}

        with self.assertRaisesRegex(ValueError, "STAMPER_OUTPUT_SCOPE_FORBIDDEN"):
            patcher.check_intent(state, intent(invocation, "plus/quiz-index.json"),
                                 self.workspace)
        patcher.check_intent(state, intent(invocation, "service-worker.js"),
                             self.workspace)
        state = runner.submit(state, report(invocation, DIGEST))
        rebuild = runner.next_invocation(state)
        self.assertEqual(rebuild["step"]["step_id"], "build:rebuild")
        for name in ("dentcast-brain.json", "dentcast.json",
                     "glossary/glossary.json", "litecast/lite-glossary.json",
                     "plus/des-scores.json", "plus/faq-corpus.json",
                     "dentcast_cabinet_full_catalog.json", "dc-nav.js"):
            with self.subTest(name=name):
                with self.assertRaisesRegex(ValueError,
                                            "BUILDER_SOURCE_MUTATION_FORBIDDEN"):
                    patcher.check_intent(state, intent(rebuild, name), self.workspace)

    def test_stage7_generated_index_ownership_fail_closed(self):
        # Canonical builder outputs must not be manually overwritten by
        # challenge/page modules before the builder runs.
        with self.assertRaisesRegex(ValueError, "MODULE_WRITE_SCOPE_FORBIDDEN"):
            patcher.allowed("challenge", "plus/challenges.json")
        for path in ("index.html", "episodes.html", "glossary/index.html",
                     "pillar/index.html", "pillar/fixed-pros/index.html"):
            with self.subTest(path=path):
                with self.assertRaisesRegex(
                        ValueError, "PAGE_DRAFT_GENERATED_INDEX_FORBIDDEN"):
                    patcher.check_intent(self.state,
                                         self.intent(path=path, before=None),
                                         self.workspace)
        # An ordinary page draft remains writable in the marked sandbox.
        self.assertEqual(len(patcher.check_intent(
            self.state, self.intent(), self.workspace)), 1)

    def test_actual_edit_receipt_and_runner_advance(self):
        result = patcher.apply_intent(self.state, self.intent(), self.workspace)
        self.assertEqual(self.target.read_text(encoding="utf-8"), "<h1>After</h1>")
        self.assertFalse(result["execution_authorized"])
        self.assertFalse(result["published"])
        self.assertEqual(result["paths"], ["clinical/insight-test.html"])
        receipt = self.workspace / "operator-receipt.json"
        receipt.write_text(json.dumps(result["artifact_receipt"]), encoding="utf-8")
        updated = bridge.verify_local_receipt(
            self.state, report(self.inv, result["artifact_receipt_digest"]),
            receipt, self.workspace)
        self.assertEqual(updated["next_index"], 2)
        self.assertEqual(updated["plan"]["ordered_steps"][2]["step_id"], "taxonomy:lock")
        self.assertTrue(updated["history"][-1]["local_artifact_integrity_verified"])
        self.assertFalse(updated["real_publish_completed"])

    def test_phone_friendly_cli_task_apply_confirm_round_trip(self):
        state_path = self.workspace / "checkpoint.json"
        intent_path = self.workspace / "intent.json"
        receipt_path = self.workspace / "receipt.json"
        report_path = self.workspace / "report.json"
        state_path.write_text(json.dumps(self.state), encoding="utf-8")
        intent_path.write_text(json.dumps(self.intent()), encoding="utf-8")
        def command(*args):
            result = subprocess.run([sys.executable, *map(str, args)],
                                    cwd=ROOT, text=True, capture_output=True,
                                    check=False)
            self.assertEqual(result.returncode, 0, result.stderr)
            return json.loads(result.stdout)

        task = command("tools/dentcast_stage3_bridge.py", "task",
                       "--state", state_path)
        self.assertEqual(task["step_id"], "page:draft")
        result = command("tools/dentcast_stage3_apply.py",
                         "--state", state_path, "--intent", intent_path,
                         "--workspace", self.workspace,
                         "--receipt", receipt_path)
        self.assertEqual(result["status"], "staging_files_applied")
        report_path.write_text(json.dumps(
            report(self.inv, result["artifact_receipt_digest"])), encoding="utf-8")
        outcome = command("tools/dentcast_stage3_bridge.py", "confirm",
                          "--state", state_path, "--workspace", self.workspace,
                          "--receipt", receipt_path, "--report", report_path)
        self.assertEqual(outcome["completed_steps"], 2)
        self.assertEqual(self.target.read_text(encoding="utf-8"), "<h1>After</h1>")
        restored = json.loads(state_path.read_text(encoding="utf-8"))
        self.assertEqual(restored["next_index"], 2)
        self.assertTrue(restored["history"][-1]["local_artifact_integrity_verified"])
        self.assertFalse(restored["real_publish_completed"])

    def test_stale_sha_no_write(self):
        with self.assertRaisesRegex(ValueError, "STALE_EDIT_PRECONDITION"):
            patcher.apply_intent(self.state, self.intent(before=DIGEST), self.workspace)
        self.assertEqual(self.target.read_text(), "<h1>Before</h1>")

    def test_no_gates_no_write(self):
        with self.assertRaisesRegex(ValueError, "UNRESOLVED_REQUIRED_GATES"):
            patcher.apply_intent(self.state, self.intent(gates=[]), self.workspace)
        self.assertEqual(self.target.read_text(), "<h1>Before</h1>")

    def test_block_traversal_and_protected_paths(self):
        for path in ("../bad.html", "tools/stamp-version.py",
                     ".dentcast/workflows/README.md", "plus-api/secret.html",
                     "/tmp/bad.html"):
            with self.subTest(path=path), self.assertRaises(ValueError):
                patcher.apply_intent(self.state, self.intent(path=path), self.workspace)
        self.assertEqual(self.target.read_text(), "<h1>Before</h1>")

    def test_no_marker_rejects(self):
        (self.workspace / bridge.SANDBOX_MARKER).unlink()
        with self.assertRaisesRegex(ValueError, "UNMARKED_STAGE3_WORKSPACE"):
            patcher.apply_intent(self.state, self.intent(), self.workspace)

    def test_preflight_all_edits_before_write(self):
        intent = self.intent()
        intent["edits"].append({
            "path": "clinical/missing.html", "before_sha256": DIGEST,
            "content_utf8": "<h1>Wrong</h1>",
        })
        with self.assertRaisesRegex(ValueError, "STALE_EDIT_PRECONDITION"):
            patcher.apply_intent(self.state, intent, self.workspace)
        self.assertEqual(self.target.read_text(), "<h1>Before</h1>")

    def test_wrong_module_or_wrong_input_reject(self):
        intent = self.intent()
        intent["step_id"] = "brain:append"
        with self.assertRaisesRegex(ValueError, "STALE_MODULE_INVOCATION"):
            patcher.apply_intent(self.state, intent, self.workspace)
        intent["step_id"] = "page:draft"
        intent["input_digest"] = DIGEST
        with self.assertRaisesRegex(ValueError, "STALE_MODULE_INVOCATION"):
            patcher.apply_intent(self.state, intent, self.workspace)

    def test_modified_artifact_after_receipt_fails(self):
        outcome = patcher.apply_intent(self.state, self.intent(), self.workspace)
        self.target.write_text("tampered", encoding="utf-8")
        receipt = self.workspace / "operator-receipt.json"
        receipt.write_text(json.dumps(outcome["artifact_receipt"]), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "ARTIFACT_BYTES_CHANGED"):
            bridge.verify_local_receipt(self.state,
                                        report(self.inv, outcome["artifact_receipt_digest"]),
                                        receipt, self.workspace)

    def test_english_requires_both_article_folder_paths_not_site_root(self):
        patcher.allowed("english", "clinical/clinical-99.html")
        patcher.allowed("english", "clinical/en/clinical-99.html")
        for name in ("index.html", "clinical/other/sub/file.html", "tools/foo.html"):
            with self.subTest(name=name), self.assertRaises(ValueError):
                patcher.allowed("english", name)

    def test_unknown_non_edit_module_does_not_allow_file_edit(self):
        self.state = runner.submit(self.state, report(self.inv, DIGEST))
        self.inv = runner.next_invocation(self.state)
        self.assertEqual(self.inv["step"]["step_id"], "taxonomy:lock")
        with self.assertRaisesRegex(ValueError, "MODULE_HAS_NO_FILE_EDIT_AUTHORITY"):
            patcher.apply_intent(self.state, self.intent(), self.workspace)

    def test_rejects_outside_workspace_and_receipt_laundering(self):
        with self.assertRaises(ValueError):
            bridge.workspace_root(ROOT)
        result = patcher.apply_intent(self.state, self.intent(), self.workspace)
        receipt = self.workspace / "receipt.json"
        fake = dict(result["artifact_receipt"])
        fake["artifacts"] = [{"path": "../secret.txt", "sha256": DIGEST}]
        receipt.write_text(json.dumps(fake), encoding="utf-8")
        with self.assertRaises(ValueError):
            bridge.verify_local_receipt(self.state, report(self.inv, DIGEST),
                                        receipt, self.workspace)


if __name__ == "__main__":
    unittest.main()
