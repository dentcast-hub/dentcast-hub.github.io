"""tools/build_des_records.py: one file per DES record, the store unchanged."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "tools"))
import build_des_records as b  # noqa: E402
import dentcast_post_cut2_runner as runner  # noqa: E402


class BuildDesRecordsTest(unittest.TestCase):
    def tree(self, data):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        (root / "plus").mkdir()
        (root / "plus/des-scores.json").write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        return root

    def test_repo_files_match_the_store(self):
        # The committed plus/des/ is exactly what the builder would write.
        write, stale = b.plan(REPO)
        self.assertEqual((sorted(write), stale), ([], []))
        store = json.loads((REPO / "plus/des-scores.json").read_text(encoding="utf-8"))
        for cid, rec in store.items():
            got = json.loads((REPO / "plus/des" / f"{cid}.json").read_text(encoding="utf-8"))
            self.assertEqual(got, rec, cid)

    def test_writes_prunes_and_is_idempotent(self):
        root = self.tree({"insight/insight-1": {"scored_at": "x", "sources": [{"band": "C"}]},
                          "episodes/episode-2": {"sources": []}})
        stray = root / "plus/des/old/gone.json"
        stray.parent.mkdir(parents=True)
        stray.write_text("{}", encoding="utf-8")
        self.assertEqual(b.main(["--root", str(root)]), 0)
        self.assertEqual(json.loads((root / "plus/des/insight/insight-1.json").read_text(encoding="utf-8")),
                         {"scored_at": "x", "sources": [{"band": "C"}]})
        self.assertFalse(stray.exists())
        self.assertFalse((root / "plus/des/old").exists())  # emptied dirs go too
        self.assertEqual(b.plan(root), ({}, []))
        self.assertEqual(b.main(["--root", str(root), "--check"]), 0)
        (root / "plus/des/insight/insight-1.json").write_text("{}\n", encoding="utf-8")
        self.assertEqual(b.main(["--root", str(root), "--check"]), 1)

    def test_refuses_a_content_id_that_is_not_a_page_path(self):
        for bad in ("../x", "/abs/path", "a/../../b", "Insight/x", ""):
            with self.subTest(bad=bad):
                root = self.tree({bad: {"sources": []}})
                with self.assertRaises(SystemExit):
                    b.plan(root)

    def test_the_runner_builds_them_and_may_commit_them(self):
        pub = {"steps": [], "target_paths": ["insight/insight-1.html"], "category": "clinical"}
        cmds = [" ".join(c) for c in runner.command_plan(Path("."), pub)]
        self.assertIn("python3 tools/build_des_records.py", cmds)
        self.assertLess(cmds.index("python3 .github/scripts/inject_img_attrs.py"),
                        cmds.index("python3 tools/build_des_records.py"))
        self.assertTrue(runner.handoff.builder_output("plus/des/insight/insight-1.json"))
        self.assertTrue(runner.handoff.builder_output("plus/des/dentai/promptologist/prompt-append2-1.json"))
        self.assertFalse(runner.handoff.builder_output("plus/des-scores.json"))
        self.assertFalse(runner.handoff.builder_output("plus/des/../dentcast-brain.json"))

    def test_module_11_names_the_builder(self):
        text = (REPO / ".dentcast/workflows/modules/11-build-and-version.md").read_text(encoding="utf-8")
        self.assertIn("python3 tools/build_des_records.py", text)

    def test_check_mode_cli(self):
        p = subprocess.run([sys.executable, "tools/build_des_records.py", "--check"], cwd=REPO,
                           capture_output=True, text=True)
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)


if __name__ == "__main__":
    unittest.main()
