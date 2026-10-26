"""Round 6 regressions: typed category names, the --repo staleness check and
its safe hint, the merge gate's recomputed-value filter, verbatim git paths."""
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

import test_dentcast_publish_handoff as fixtures
import test_dentcast_publish_lifecycle as lifecycle_fixtures
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc
import dentcast_post_cut2_runner as runner
import check_publish_merge_gate as gate

ROOT = Path(__file__).resolve().parents[1]


def git(root, *args):
    return subprocess.run(["git", "-C", str(root), *args], check=True, capture_output=True, text=True).stdout


def new_repo(root):
    git(root, "init", "-q", "-b", "main")
    git(root, "config", "user.email", "f@example.invalid"); git(root, "config", "user.name", "F")
    git(root, "config", "core.quotepath", "true")


class CategoryNameTests(unittest.TestCase):
    def test_typed_names_map_to_the_historical_canonical_values(self):
        cases = {"clinical": ("Insight", "اینسایت", "اینسایت بالینی", "clinical"),
                 "chairside": ("ChairSide", "چیرساید"), "litecast": ("Lite Cast", "لایت‌کست"),
                 "sharehub": ("ShareHub", "شیر هاب"), "plak_sefr": ("Plak Sefr", "پلاک صفر", "plak_sefr"),
                 "promptologist": ("Promptologist", "پرامپتولوژیست"), "meta": ("MetaNote", "متانوت"),
                 "notecast": ("NoteCast", "نوت‌کست"), "dentcast_plus": ("DentCast+", "دنت‌کست پلاس"),
                 "taraz": ("Taraz", "تراز"), "dentcast": ("Episode", "اپیزود"),
                 "glossary": ("Glossary", "دانشنامه"), "paper-only": ("Paper Only",)}
        for canonical, names in cases.items():
            for name in names:
                self.assertEqual(h.canonical_category(name), canonical, name)
        # Arabic-keyboard yeh/kaf spell the same name.
        self.assertEqual(h.canonical_category("اينسايت"), "clinical")

    def test_existing_receipts_and_report_names_stay_valid(self):
        receipts = sorted((ROOT / ".dentcast/publication-reports").rglob("*.completion.json"))
        self.assertTrue(receipts)
        for path in receipts:
            p = json.loads(path.read_text(encoding="utf-8"))["state"]["publication"]
            self.assertEqual(h.canonical_category(p["category"]), p["category"], path)
        # e.g. plak_sefr-plak1-10.md, clinical-96.md
        self.assertTrue((ROOT / lc.technical_report_path(
            {"category": "پلاک صفر", "content_id": "plak-sefr/plak1-10"})).is_file())

    def test_challenge_flag_is_refused_as_a_category(self):
        for name in ("چالش", "Challenge"):
            with self.assertRaises(h.Blocked) as ctx:
                h.require_category_input(name)
            self.assertIn("CHALLENGE_IS_NOT_A_CATEGORY", str(ctx.exception))
            self.assertIn("clinical", str(ctx.exception))
        # A handoff stored before this check keeps working unchanged.
        self.assertEqual(h.canonical_category("چالش"), "چالش")


class BindCategoryTests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp
    assert_blocked = fixtures.HandoffTests.assert_blocked
    prepare = lifecycle_fixtures.LifecycleTests.prepare

    def pending(self):
        self.prepare()
        state, _ = h.load_state(self.root)
        state["publication"].update(content_id="unassigned", category="pending")
        h.write_atomic(self.root, state)
        return h.load_state(self.root)[1]

    def test_bind_stores_the_canonical_name_and_refuses_challenge(self):
        sha = self.pending()
        self.assert_blocked("CHALLENGE_IS_NOT_A_CATEGORY", lc.bind, self.root, sha, "insight/note", "چالش",
                            ["note.html"], "fixture:intake")
        lc.bind(self.root, sha, "insight/note", "اینسایت", ["note.html"], "fixture:intake")
        self.assertEqual(h.load_state(self.root)[0]["publication"]["category"], "clinical")


class StalenessRepoTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name) / "repo"
        self.root.mkdir()
        new_repo(self.root)
        for name in h.TOOL_FILES:
            (self.root / name).parent.mkdir(parents=True, exist_ok=True)
            (self.root / name).write_text("# v1\n")
        git(self.root, "add", "-A"); git(self.root, "commit", "-qm", "v1")
        for name in h.TOOL_FILES:
            (self.root / name).write_text("# v2\n")
        git(self.root, "commit", "-qam", "v2")
        git(self.root, "update-ref", "refs/remotes/origin/main", "HEAD")
        git(self.root, "reset", "-q", "--hard", "HEAD~1")
        git(self.root, "switch", "-q", "-c", "ccr-session")

    def tearDown(self):
        self.tmp.cleanup()

    def test_plan_checks_the_repo_checkout_not_the_tool_checkout(self):
        out = subprocess.run([os.sys.executable, str(ROOT / "tools/dentcast_publish_handoff.py"),
                              "--repo", str(self.root), "plan"], capture_output=True, text=True, check=True)
        warnings = json.loads(out.stdout).get("warnings", [])
        self.assertTrue(warnings and warnings[0].startswith("TOOL_OLDER_THAN_ORIGIN_MAIN"), out.stdout)
        self.assertIn("git switch -C ccr-session --no-track origin/main", warnings[0])

    def test_branch_with_own_commits_is_never_told_to_reset(self):
        (self.root / "work.txt").write_text("publication work")
        git(self.root, "add", "-A"); git(self.root, "commit", "-qm", "work")
        warning = h.tool_staleness_warnings(self.root)[0]
        self.assertNotIn("switch -C ccr-session", warning)
        self.assertIn("1 commit(s) not on origin/main", warning)
        self.assertIn("git merge --no-edit origin/main", warning)


class RecomputedValueFilterTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        new_repo(self.root)
        self.page = ('<!-- COUNTER:CONTENT:START -->۷۳۰<!-- COUNTER:CONTENT:END -->'
                     '<a href="https://www.youtube.com/watch?v=AAAAAAAAAAA">v</a>'
                     '<script src="/assets/app.js?v=12"></script>\n')
        (self.root / "index.html").write_text(self.page, encoding="utf-8")
        git(self.root, "add", "-A"); git(self.root, "commit", "-qm", "delivery 3")
        self.delivery = git(self.root, "rev-parse", "HEAD").strip()

    def tearDown(self):
        self.tmp.cleanup()

    def own(self, page):
        (self.root / "index.html").write_text(page, encoding="utf-8")
        git(self.root, "commit", "-qam", "later")
        return gate.own_paths_after(self.root, self.delivery)

    def test_asset_stamp_only_is_ignored(self):
        self.assertEqual(self.own(self.page.replace("app.js?v=12", "app.js?v=13").replace("۷۳۰", "۷۳۱")), set())

    def test_changed_video_id_is_an_own_change(self):
        self.assertEqual(self.own(self.page.replace("AAAAAAAAAAA", "BBBBBBBBBBB")), {"index.html"})

    def test_text_injected_into_a_counter_is_an_own_change(self):
        self.assertEqual(self.own(self.page.replace("۷۳۰<", '۷۳۰<a href="/x">x</a><')), {"index.html"})


class VerbatimPathTests(unittest.TestCase):
    def test_post_cut2_runner_git_lists_persian_paths_verbatim(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            new_repo(root)
            (root / "a").write_text("a"); git(root, "add", "-A"); git(root, "commit", "-qm", "a")
            name = ".dentcast/publication-reports/اپیزود-episode-162.md"
            (root / name).parent.mkdir(parents=True)
            (root / name).write_text("r"); git(root, "add", "-A"); git(root, "commit", "-qm", "b")
            self.assertEqual(runner.git(root, "diff", "--name-only", "HEAD^", "HEAD"), name)


if __name__ == "__main__":
    unittest.main()
