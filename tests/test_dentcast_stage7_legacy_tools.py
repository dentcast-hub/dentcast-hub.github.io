"""Independent Stage 7: execute unchanged canonical tools in a disposable checkout.

No Git push, no model judgment, no patient data and no production file edits.
"""
import base64
import hashlib
import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
D = "a" * 64
REV = "b" * 40


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj


stamp = load("s7_original_stamper", "tools/stamp-version.py")
router = load("s7_route", "tools/dentcast_stage3_route.py")
runner = load("s7_runner", "tools/dentcast_stage3_orchestrator.py")
editor = load("s7_editor", "tools/dentcast_stage3_apply.py")
bridge = load("s7_bridge", "tools/dentcast_stage3_bridge.py")


def fake_report(inv, receipt=D):
    # Synthetic shape only; no clinical, approval or scientific proof.
    kinds = {"digest": D, "optional_digest": D, "text": "test",
             "bool_true": True, "bool_false": False, "nonnegative": 0,
             "positive": 1, "zero": 0, "one": 1, "list": [], "mapping": {}}
    obj = {name: kinds[type_name] for name, type_name
           in inv["required_output_schema"].items()}
    if inv["step"]["step_id"] == "intake:route":
        obj["route"] = inv["context"]["route"]
    return {"step_id": inv["step"]["step_id"], "module_id": inv["step"]["module_id"],
            "input_digest": inv["input_digest"], "status": "completed",
            "outputs": obj, "external_receipt_digest": receipt,
            "approval_receipt_digest": None, "error": None}


class LegacyToolSandboxTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="s7-real-")
        self.addCleanup(self.tmp.cleanup)
        self.sandbox = Path(self.tmp.name)
        (self.sandbox / bridge.SANDBOX_MARKER).write_text(json.dumps({
            "purpose": "dentcast-stage3-disposable-test",
            "allow_real_publication": False, "allow_remote_mutation": False
        }), encoding="utf-8")

    def test_original_stamp_version_real_execution_then_idempotent(self):
        # Preserve the EXISTING builder byte for byte: no replacement logic.
        (self.sandbox / "tools").mkdir()
        shutil.copy2(ROOT / "tools/stamp-version.py",
                     self.sandbox / "tools/stamp-version.py")
        source_fingerprints = {}
        rels = [p.relative_to(ROOT) for p in stamp.VERSION_INPUTS]
        for rel in rels:
            path = self.sandbox / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            if (ROOT / rel).is_file():
                data = (ROOT / rel).read_bytes()
                path.write_bytes(data)
                source_fingerprints[str(rel)] = hashlib.sha256(data).hexdigest()
        (self.sandbox / "service-worker.js").write_text(
            "const CACHE_NAME = 'dentcast-assets-old';\n", encoding="utf-8")
        (self.sandbox / "index.html").write_text(
            '<script src="dentcast-brain.json?v=old"></script>', encoding="utf-8")
        (self.sandbox / "player.html").write_text(
            '<script src="dentcast-brain.json?v=old"></script>', encoding="utf-8")
        def run_builder():
            result = subprocess.run(
                [sys.executable, str(self.sandbox / "tools/stamp-version.py")],
                cwd=self.sandbox, capture_output=True, text=True, timeout=30)
            self.assertEqual(result.returncode, 0, result.stderr)
        run_builder()
        expected = hashlib.sha256(b"".join(
            (self.sandbox / rel).read_bytes()
            for rel in rels if (self.sandbox / rel).is_file()
        )).hexdigest()[:10]
        worker = self.sandbox / "service-worker.js"
        self.assertIn("dentcast-assets-" + expected, worker.read_text())
        for html in ("index.html", "player.html"):
            self.assertIn("dentcast-brain.json?v=" + expected,
                          (self.sandbox / html).read_text())
        unchanged = worker.read_bytes()
        run_builder()
        self.assertEqual(unchanged, worker.read_bytes())
        litecast = self.sandbox / "litecast/lite-glossary.json"
        litecast.write_bytes(litecast.read_bytes() + b" ")
        run_builder()
        self.assertNotEqual(unchanged, worker.read_bytes())
        self.assertEqual(source_fingerprints, {
            str(rel): hashlib.sha256((ROOT / rel).read_bytes()).hexdigest()
            for rel in rels if str(rel) in source_fingerprints})

    def test_real_legacy_phase_f_rejects_missing_page_and_wrong_title(self):
        # The legacy gate is the source of truth; don't fake a success receipt.
        script = ROOT / "tools/verify_publish.py"
        run = subprocess.run(
            [sys.executable, str(script), "sharehub/stage7-no-such-page",
             "--expect-title", "عنوان ساختگی"],
            cwd=ROOT, capture_output=True, text=True, timeout=35)
        self.assertEqual(run.returncode, 1, run.stdout[-1200:])
        self.assertIn("FAIL", run.stdout)

    def test_binary_webp_byte_receipt_and_bad_payload_rejection(self):
        state = runner.begin({"has_text": True, "has_paper": False,
                              "category": "litecast", "challenge": False},
                             "image-fixture", REV)
        state = runner.submit(state, fake_report(runner.next_invocation(state)))
        inv = runner.next_invocation(state)
        self.assertEqual(inv["step"]["step_id"], "page:draft")
        (self.sandbox / "litecast").mkdir()
        # Valid container signature for testing byte transport, not a real photo.
        blob = b"RIFF" + (4).to_bytes(4, "little") + b"WEBP"
        edit = {"step_id": "page:draft", "input_digest": inv["input_digest"],
                "author_asserted_gates": inv["step"]["approval_gates"],
                "edits": [{"path": "litecast/fixture.webp",
                           "before_sha256": None,
                           "content_base64": base64.b64encode(blob).decode()}]}
        result = editor.apply_intent(state, edit, self.sandbox)
        self.assertEqual((self.sandbox / "litecast/fixture.webp").read_bytes(), blob)
        self.assertFalse(result["published"])
        wrong = json.loads(json.dumps(edit))
        wrong["edits"][0]["content_base64"] = base64.b64encode(b"<script/>").decode()
        with self.assertRaisesRegex(ValueError, "IMAGE_MAGIC_BYTES_MISMATCH"):
            editor.check_intent(state, wrong, self.sandbox)
        wrong = json.loads(json.dumps(edit))
        wrong["edits"][0] = {"path": "litecast/fixture.webp",
                             "before_sha256": None,
                             "content_utf8": "not-binary"}
        with self.assertRaisesRegex(ValueError, "BINARY_ASSET_REQUIRES_BASE64"):
            editor.check_intent(state, wrong, self.sandbox)

    def test_litecast_actual_json_tail_append_is_necessary_and_scoped(self):
        rel = "litecast/lite-glossary.json"
        target = self.sandbox / rel
        target.parent.mkdir(exist_ok=True)
        shutil.copy2(ROOT / rel, target)
        before = target.read_bytes()
        data = json.loads(before)
        old_entries = data["LightGlossary"]
        self.assertTrue(old_entries)
        synthetic = dict(old_entries[-1], id="litecast-999999",
                         title="صرفاً تست", page_url="litecast/lite-CAST999999.html")
        data["LightGlossary"].append(synthetic)
        state = runner.begin({"has_text": True, "has_paper": False,
                              "category": "litecast", "challenge": False},
                             "lite-register", REV)
        while runner.next_invocation(state)["step"]["step_id"] != "page:litecast-register":
            state = runner.submit(state, fake_report(runner.next_invocation(state)))
        inv = runner.next_invocation(state)
        self.assertEqual(inv["step"]["module_id"], "page")
        intent = {"step_id": inv["step"]["step_id"],
                  "input_digest": inv["input_digest"],
                  "author_asserted_gates": inv["step"]["approval_gates"],
                  "edits": [{"path": rel,
                             "before_sha256": hashlib.sha256(before).hexdigest(),
                             "content_utf8": json.dumps(data, ensure_ascii=False)}]}
        result = editor.apply_intent(state, intent, self.sandbox)
        receipt = self.sandbox / "receipt.json"
        receipt.write_text(json.dumps(result["artifact_receipt"]))
        advanced = bridge.verify_local_receipt(
            state, fake_report(inv, result["artifact_receipt_digest"]),
            receipt, self.sandbox)
        self.assertEqual(advanced["next_index"],
                         state["next_index"] + 1)
        after = json.loads(target.read_text())
        self.assertEqual(after["LightGlossary"][:-1], old_entries)
        self.assertEqual(after["LightGlossary"][-1], synthetic)
        self.assertEqual((ROOT / rel).read_bytes(), before)
        with self.assertRaisesRegex(ValueError, "MODULE_WRITE_SCOPE_FORBIDDEN"):
            editor.allowed("page", "dentcast-brain.json")


if __name__ == "__main__":
    unittest.main()
