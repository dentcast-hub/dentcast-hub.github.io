"""tools/relay_call.py: the founder-carried isolated call (agent-parity.md «مسیر رله»)."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOL = ROOT / "tools/relay_call.py"


def run(*args):
    return subprocess.run([sys.executable, str(TOOL), *args], capture_output=True, text=True)


class RelayTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.d = Path(self.tmp.name)
        self.block = {"mode": "FIDELITY", "scope": "SOURCE", "source_text": "Pain fell early.",
                      "units": [{"id": "u1", "text": "Title"}, {"id": "u2", "text": "Pain fell early."}]}
        (self.d / "input-src0.json").write_text(json.dumps(self.block), encoding="utf-8")
        (self.d / "sys.md").write_text("SPEC TEXT", encoding="utf-8")
        self.relay = self.d / "relay.md"
        r = run("pack", "--system", str(self.d / "sys.md"), "--input", str(self.d / "input-src0.json"),
                "--answer-to", str(self.d / "out-src0-1.json"), "--out", str(self.relay))
        self.assertEqual(r.returncode, 0, r.stderr)

    def tearDown(self):
        self.tmp.cleanup()

    def reply(self, text):
        p = self.d / "reply.txt"
        p.write_text(text, encoding="utf-8")
        return run("ingest", str(p), "--relay", str(self.relay))

    def test_pack_holds_system_and_input_verbatim(self):
        t = self.relay.read_text(encoding="utf-8")
        self.assertIn("SPEC TEXT", t)
        self.assertIn(json.dumps(self.block), t)

    def test_pack_refuses_a_path_inside_the_repo(self):
        r = run("pack", "--input", str(self.d / "input-src0.json"), "--answer-to", "x.json",
                "--out", str(ROOT / "relay-test.md"))
        self.assertNotEqual(r.returncode, 0)
        self.assertFalse((ROOT / "relay-test.md").exists())

    def test_fenced_reply_is_ingested_unchanged(self):
        ans = {"mode": "FIDELITY", "claims": [{"id": "u1", "verdict": "NOT_A_CLAIM"}, {"id": "u2", "verdict": "MATCHES"}]}
        r = self.reply("Here it is:\n```json\n" + json.dumps(ans) + "\n```\n")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(json.loads((self.d / "out-src0-1.json").read_text(encoding="utf-8")), ans)

    def test_missing_unit_is_refused(self):
        r = self.reply(json.dumps({"claims": [{"id": "u1", "verdict": "NOT_A_CLAIM"}]}))
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("u2", r.stderr)
        self.assertFalse((self.d / "out-src0-1.json").exists())

    def test_two_objects_are_refused(self):
        r = self.reply('{"claims": []} and also {"claims": []}')
        self.assertNotEqual(r.returncode, 0)

    def test_changed_input_is_refused(self):
        (self.d / "input-src0.json").write_text(json.dumps({**self.block, "x": 1}), encoding="utf-8")
        r = self.reply(json.dumps({"claims": [{"id": "u1"}, {"id": "u2"}]}))
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("changed", r.stderr)


if __name__ == "__main__":
    unittest.main()
