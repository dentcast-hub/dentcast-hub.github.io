"""Round 5 regressions: non-ASCII report paths, merge-gate restamp commits,
external outcomes across a delivered cut."""
import copy
import subprocess
import tempfile
import unittest
from pathlib import Path

import test_dentcast_publish_handoff as fixtures
import test_dentcast_publish_lifecycle as lifecycle_fixtures
import test_dentcast_publish_three_deliveries as three
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc
import check_publish_merge_gate as gate

run = fixtures.run


def git(root, *args):
    return subprocess.run(["git", "-C", str(root), *args], check=True, capture_output=True, text=True).stdout


class NonAsciiPathTests(unittest.TestCase):
    def test_path_listings_are_not_c_quoted(self):
        # A Persian category («چالش», «اپیزود») names the technical report.
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            git(root, "init", "-q")
            git(root, "config", "user.email", "f@example.invalid"); git(root, "config", "user.name", "F")
            git(root, "config", "core.quotepath", "true")
            (root / "a.txt").write_text("a")
            git(root, "add", "-A"); git(root, "commit", "-qm", "a")
            name = ".dentcast/publication-reports/چالش-insight-71.md"
            (root / name).parent.mkdir(parents=True)
            (root / name).write_text("report")
            git(root, "add", "-A"); git(root, "commit", "-qm", "b")
            self.assertEqual(h.text_git(root, "diff", "--name-only", "HEAD^", "HEAD").splitlines(), [name])
            self.assertEqual(h.text_git(root, "diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD").splitlines(),
                             [name])


class RestampAfterMainMergeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        git(self.root, "init", "-q")
        git(self.root, "config", "user.email", "f@example.invalid"); git(self.root, "config", "user.name", "F")
        self.page = ('<p>pulse</p><!-- COUNTER:CONTENT:START -->۷۳۰<!-- COUNTER:CONTENT:END -->'
                     '<script src="/dentcast-brain.json?v=aaaaaaaaaa"></script>\n')
        (self.root / "index.html").write_text(self.page, encoding="utf-8")
        (self.root / "service-worker.js").write_text("const CACHE_NAME = 'dentcast-assets-aaaaaaaaaa';\n")
        git(self.root, "add", "-A"); git(self.root, "commit", "-qm", "delivery 3")
        self.delivery = git(self.root, "rev-parse", "HEAD").strip()

    def tearDown(self):
        self.tmp.cleanup()

    def commit(self, page, sw=None):
        (self.root / "index.html").write_text(page, encoding="utf-8")
        if sw:
            (self.root / "service-worker.js").write_text(sw)
        git(self.root, "commit", "-qam", "later")

    def test_restamp_and_counter_only_commit_is_not_an_own_change(self):
        self.commit(self.page.replace("aaaaaaaaaa", "bbbbbbbbbb").replace("۷۳۰", "۷۳۱"),
                    "const CACHE_NAME = 'dentcast-assets-bbbbbbbbbb';\n")
        self.assertEqual(gate.own_paths_after(self.root, self.delivery), set())

    def test_authored_change_in_the_same_file_is_still_checked(self):
        self.commit(self.page.replace("aaaaaaaaaa", "bbbbbbbbbb").replace("pulse", "edited pulse"))
        self.assertEqual(gate.own_paths_after(self.root, self.delivery), {"index.html"})


class ExternalOutcomeAcrossCutTests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp
    assert_blocked = fixtures.HandoffTests.assert_blocked
    prepare = lifecycle_fixtures.LifecycleTests.prepare
    start = three.ThreeDeliveriesTests.start
    walk = three.ThreeDeliveriesTests.walk
    deliver = three.ThreeDeliveriesTests.deliver

    def test_unresolved_external_outcome_cannot_be_committed_into_a_cut(self):
        sha = self.walk(self.start(), 'C.4.9')
        state, sha = h.load_state(self.root)
        p = copy.deepcopy(state['publication'])
        p['external_actions'].append({'id': 'C.4.9:drive-move', 'status': 'started',
                                      'target': 'fixture:drive', 'evidence': []})
        sha = h.save(self.root, p, expected=sha, note='external action started')['sha256']
        # Otherwise the pushed cut strands it: recording the outcome is a record on
        # the delivered cut and starting the next step is refused while it is open.
        run(self.root, 'add', 'note.html')
        self.assert_blocked('EXTERNAL_OUTCOME_UNRESOLVED_AT_CUT', lc.stage_delivery, self.root, sha, ['note.html'])
        p['external_actions'][0].update(status='completed', evidence=['fixture:drive:observed'])
        sha = h.save(self.root, p, expected=sha, note='observed outcome')['sha256']
        self.deliver('delivery 1')
        state, sha = h.load_state(self.root)
        self.assertEqual(lc.step(self.root, sha, 'C.4.10.1', 'started', [], None)['status'], 'checkpoint_written')


if __name__ == "__main__":
    unittest.main()
