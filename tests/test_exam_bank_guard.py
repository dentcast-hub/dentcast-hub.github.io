"""Prior data is never lost: the exam-question bank is append-only
(tools/validate_exam_questions.py, verify_publish «4.12-ب bank»), the other
bank files keep every other publication's entry (verify_publish «F … kept»),
and the page-scraping rewriters refuse to drop data (faq_corpus_extract.py,
strip_faq_schema.py). Every case runs in a throwaway git repository."""
import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "tools"


def git(root, *args):
    subprocess.run(["git", *args], cwd=root, check=True, capture_output=True)


def q(qid, prompt, correct=0, **extra):
    return {"id": qid, "kind": "mcq", "prompt_fa": prompt,
            "options": ["گزینهٔ اول", "گزینهٔ دوم", "گزینهٔ سوم", "گزینهٔ چهارم"],
            "correct": correct, "source": "publish", **extra}


BASE = {
    "version": 1,
    "note": "سؤال‌های آزمون",
    "byContent": {
        "chairside/chairside-1": {"questions": [q("r-aaaa0001", "پرسش یکم؟"), q("r-aaaa0002", "پرسش دوم؟", 1)]},
        "insight/insight-1": {"questions": [
            q("r-bbbb0001", "پرسش سوم؟", 2),
            q("r-bbbb0002", "پرسش چهارم؟", 3, status="review", review_note="بعداً"),
        ]},
    },
}


class Repo:
    """A tiny repo: pages, the bank files, the tools under test, and an
    origin/main ref at the first commit (the branch's merge-base)."""

    def __init__(self, with_main=True):
        self.dir = tempfile.TemporaryDirectory()
        self.root = Path(self.dir.name)
        (self.root / "tools").mkdir()
        for name in ("validate_exam_questions.py", "verify_publish.py",
                     "faq_corpus_extract.py", "strip_faq_schema.py"):
            shutil.copy(TOOLS / name, self.root / "tools" / name)
        for cid in ("chairside/chairside-1", "chairside/chairside-2", "insight/insight-1", "insight/insight-2"):
            self.write(f"{cid}.html", "<html><body><main><h1>t</h1></main></body></html>")
        self.dump("plus/exam-questions.json", BASE, indent=1)
        self.dump("dentcast-brain.json", [{"page_url": "/chairside/chairside-1.html", "title": "a"},
                                          {"url": "/insight/insight-1.html", "title": "b"}], indent=2)
        self.dump("plus/faq-corpus.json", {"version": 1, "byContent": {
            "chairside/chairside-1": {"faqPages": [{"@type": "FAQPage", "mainEntity": [{"name": "x"}]}],
                                      "definedTermSets": []}}}, indent=2)
        self.dump("plus/pathways.json", [{"id": "p1", "steps": [{"content_id": "chairside/chairside-1"},
                                                                 {"content_id": "insight/insight-1"}]}], indent=2)
        git(self.root, "init", "-q", "-b", "work")
        git(self.root, "config", "user.email", "t@example.com")
        git(self.root, "config", "user.name", "t")
        git(self.root, "add", "-A")
        git(self.root, "commit", "-qm", "base")
        if with_main:
            git(self.root, "update-ref", "refs/remotes/origin/main", "HEAD")

    def write(self, rel, text):
        p = self.root / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")

    def dump(self, rel, data, indent=1):
        self.write(rel, json.dumps(data, ensure_ascii=False, indent=indent))

    def load(self, rel):
        return json.loads((self.root / rel).read_text(encoding="utf-8"))

    def bank(self):
        return self.load("plus/exam-questions.json")

    def validate(self, *args):
        return subprocess.run([sys.executable, str(self.root / "tools/validate_exam_questions.py"), *args],
                              cwd=self.root, capture_output=True, text=True)

    def tool(self, name, *args):
        return subprocess.run([sys.executable, str(self.root / "tools" / name), *args],
                              cwd=self.root, capture_output=True, text=True)

    def verify_module(self):
        spec = importlib.util.spec_from_file_location(f"vp_{id(self)}", self.root / "tools/verify_publish.py")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod

    def close(self):
        self.dir.cleanup()


class ExamBankAppendOnly(unittest.TestCase):
    def setUp(self):
        self.repo = Repo()

    def tearDown(self):
        self.repo.close()

    def assertPasses(self, *args):
        r = self.repo.validate(*args)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        return r.stdout

    def assertFails(self, needle, *args):
        r = self.repo.validate(*args)
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn(needle, r.stdout)
        return r.stdout

    def test_unchanged_file_passes(self):
        out = self.assertPasses()
        self.assertIn("2 content ids: 3 live, 1 review; 0 error(s)", out)

    def test_append_new_content_id_passes(self):
        d = self.repo.bank()
        d["byContent"]["chairside/chairside-2"] = {"questions": [q("r-cccc0001", "پرسش تازه؟", 2)]}
        self.repo.dump("plus/exam-questions.json", d)
        self.assertPasses("--content", "chairside/chairside-2")
        self.assertPasses()

    def test_append_row_to_existing_content_passes(self):
        d = self.repo.bank()
        d["byContent"]["chairside/chairside-1"]["questions"].append(q("r-aaaa0003", "پرسش افزوده؟", 3))
        self.repo.dump("plus/exam-questions.json", d)
        self.assertPasses("--content", "chairside/chairside-1")
        out = self.assertPasses("--content", "insight/insight-1")  # another page's append: a warning
        self.assertIn("appended to another page", out)

    def test_deleting_a_row_fails(self):
        d = self.repo.bank()
        d["byContent"]["chairside/chairside-1"]["questions"].pop(0)
        self.repo.dump("plus/exam-questions.json", d)
        self.assertFails("r-aaaa0001: existing question removed")
        # also through --content of an unrelated page: damage anywhere fails
        self.assertFails("existing question removed", "--content", "insight/insight-1")

    def test_deleting_a_content_id_fails(self):
        d = self.repo.bank()
        del d["byContent"]["insight/insight-1"]
        self.repo.dump("plus/exam-questions.json", d)
        self.assertFails("insight/insight-1: content id removed")

    def test_replacing_rows_fails(self):
        d = self.repo.bank()
        d["byContent"]["chairside/chairside-1"]["questions"] = [q("r-dddd0001", "جایگزین؟")]
        self.repo.dump("plus/exam-questions.json", d)
        self.assertFails("existing question removed")

    def test_editing_an_old_row_fails_and_allow_edit_permits_it(self):
        d = self.repo.bank()
        d["byContent"]["chairside/chairside-1"]["questions"][1]["correct"] = 0
        d["byContent"]["chairside/chairside-1"]["questions"][1]["prompt_fa"] = "پرسش دوم بازنویسی‌شده؟"
        self.repo.dump("plus/exam-questions.json", d)
        self.assertFails("r-aaaa0002: existing question modified (correct, prompt_fa)")
        out = self.assertPasses("--allow-edit", "chairside/chairside-1")
        self.assertIn("under --allow-edit", out)
        self.assertFails("existing question modified", "--allow-edit", "insight/insight-1")

    def test_reformat_only_passes(self):
        d = self.repo.bank()
        text = json.dumps(d, ensure_ascii=True, indent=4, sort_keys=True) + "\n"
        self.repo.write("plus/exam-questions.json", text)
        out = self.assertPasses()
        self.assertNotIn("append-only", out)

    def test_review_promotion_warns_but_passes(self):
        d = self.repo.bank()
        row = d["byContent"]["insight/insight-1"]["questions"][1]
        del row["status"], row["review_note"]
        self.repo.dump("plus/exam-questions.json", d)
        self.assertIn("promoted from review to live", self.assertPasses())

    def test_retiring_with_rejected_is_a_modification(self):
        d = self.repo.bank()
        d["byContent"]["chairside/chairside-1"]["questions"][0]["status"] = "rejected"
        self.repo.dump("plus/exam-questions.json", d)
        self.assertFails("existing question modified (status)")

    def test_version_change_and_damaged_structure_fail(self):
        d = self.repo.bank()
        d["version"] = 2
        self.repo.dump("plus/exam-questions.json", d)
        self.assertFails('top-level "version" changed')
        self.repo.dump("plus/exam-questions.json", {"version": 1, "byContent": []})
        self.assertFails("byContent")

    def test_insert_before_existing_rows_warns(self):
        d = self.repo.bank()
        d["byContent"]["chairside/chairside-1"]["questions"].insert(0, q("r-aaaa0009", "پرسش جلوتر؟", 2))
        self.repo.dump("plus/exam-questions.json", d)
        self.assertIn("inserted before existing ones", self.assertPasses())

    def test_merge_base_not_current_main(self):
        # main moves on with another publication's rows; this branch never saw them
        git(self.repo.root, "checkout", "-q", "-b", "main-tip")
        d = self.repo.bank()
        d["byContent"]["chairside/chairside-2"] = {"questions": [q("r-eeee0001", "پرسش شاخهٔ دیگر؟")]}
        self.repo.dump("plus/exam-questions.json", d)
        git(self.repo.root, "commit", "-qam", "main advanced")
        git(self.repo.root, "update-ref", "refs/remotes/origin/main", "HEAD")
        git(self.repo.root, "checkout", "-q", "work")
        out = self.assertPasses()
        self.assertIn("0 error(s)", out)
        # against the tip itself the missing rows would look deleted
        self.assertFails("content id removed", "--baseline", "origin/main")

    def test_baseline_file_option(self):
        old = self.repo.root / "old.json"
        old.write_text(json.dumps(BASE, ensure_ascii=False), encoding="utf-8")
        d = self.repo.bank()
        d["byContent"]["insight/insight-1"]["questions"].pop()
        self.repo.dump("plus/exam-questions.json", d)
        self.assertFails("r-bbbb0002: existing question removed", "--baseline-file", str(old))


class NoBaseline(unittest.TestCase):
    def test_missing_origin_main_warns_and_passes(self):
        repo = Repo(with_main=False)
        try:
            r = repo.validate()
            self.assertEqual(r.returncode, 0, r.stdout)
            self.assertIn("NOT checked", r.stdout)
        finally:
            repo.close()


class VerifyPublishBankRows(unittest.TestCase):
    def setUp(self):
        self.repo = Repo()

    def tearDown(self):
        self.repo.close()

    def rows(self, cid="chairside/chairside-2"):
        vp = self.repo.verify_module()
        rep = vp.Report(cid)
        vp.check_bank_preservation(rep, cid)
        return rep.rows

    def by_status(self, status):
        return {r[1]: r[2] for r in self.rows() if r[0] == status}

    def test_clean_tree_all_ok(self):
        self.assertEqual([r for r in self.rows() if r[0] in ("FAIL", "WARN")], [])

    def test_removals_fail_and_reformat_passes(self):
        d = self.repo.bank()
        d["byContent"]["insight/insight-1"]["questions"].pop(0)
        self.repo.dump("plus/exam-questions.json", d)
        self.repo.dump("dentcast-brain.json", self.repo.load("dentcast-brain.json")[:1], indent=4)
        corpus = self.repo.load("plus/faq-corpus.json")
        corpus["byContent"] = {}
        self.repo.dump("plus/faq-corpus.json", corpus)
        fails = self.by_status("FAIL")
        self.assertIn("4.12-ب bank", fails)
        self.assertIn("insight/insight-1", fails["F brain kept"])
        self.assertIn("chairside/chairside-1", fails["F faq-corpus kept"])

    def test_own_entry_may_change_others_warn(self):
        brain = self.repo.load("dentcast-brain.json")
        brain[0]["title"] = "changed"
        brain.append({"page_url": "/chairside/chairside-2.html", "title": "new"})
        self.repo.dump("dentcast-brain.json", brain, indent=2)
        self.assertEqual(self.by_status("FAIL"), {})
        self.assertIn("chairside/chairside-1", self.by_status("WARN")["F brain kept"])
        vp = self.repo.verify_module()
        rep = vp.Report("chairside/chairside-1")
        vp.check_bank_preservation(rep, "chairside/chairside-1")
        self.assertFalse([r for r in rep.rows if r[0] in ("FAIL", "WARN")])

    def test_pathway_step_removal_warns(self):
        self.repo.dump("plus/pathways.json", [{"id": "p1", "steps": [{"content_id": "insight/insight-1"}]}], indent=2)
        self.assertIn("p1:chairside/chairside-1", self.by_status("WARN")["F pathways kept"])
        self.assertEqual(self.by_status("FAIL"), {})


class ScrapingRewritersRefuse(unittest.TestCase):
    def setUp(self):
        self.repo = Repo()

    def tearDown(self):
        self.repo.close()

    def test_faq_corpus_extract_refuses_to_drop_entries(self):
        before = (self.repo.root / "plus/faq-corpus.json").read_bytes()
        r = self.repo.tool("faq_corpus_extract.py")
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn("REFUSED", r.stderr)
        self.assertEqual((self.repo.root / "plus/faq-corpus.json").read_bytes(), before)
        r = self.repo.tool("faq_corpus_extract.py", "--force")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual(self.repo.load("plus/faq-corpus.json")["byContent"], {})

    def test_strip_faq_schema_keeps_unarchived_nodes(self):
        node = {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "پرسش؟"}]}
        page = ('<html><head><script type="application/ld+json">' + json.dumps(node, ensure_ascii=False)
                + '</script></head><body></body></html>')
        self.repo.write("insight/insight-2.html", page)
        r = self.repo.tool("strip_faq_schema.py", "insight/insight-2.html")
        self.assertIn("REFUSED", r.stderr)
        self.assertEqual((self.repo.root / "insight/insight-2.html").read_text(encoding="utf-8"), page)
        corpus = self.repo.load("plus/faq-corpus.json")
        corpus["byContent"]["insight/insight-2"] = {"faqPages": [node], "definedTermSets": []}
        self.repo.dump("plus/faq-corpus.json", corpus, indent=2)
        r = self.repo.tool("strip_faq_schema.py", "insight/insight-2.html")
        self.assertIn("stripped", r.stdout, r.stderr)
        self.assertNotIn("FAQPage", (self.repo.root / "insight/insight-2.html").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
