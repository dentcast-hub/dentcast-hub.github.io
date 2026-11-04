"""Preparation-side queue tools: the draft page (queue_apply --draft), the
FIDELITY prep chain, the freeze stamp, column-aware PDF text and the exam
draft pre-check. None of these is a publish; each refuses outside its lane."""
import contextlib
import hashlib
import io
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))

import pdf_source_text as pst  # noqa: E402
import queue_apply as qa  # noqa: E402
import queue_manifest as qm  # noqa: E402
import queue_stamp as qs  # noqa: E402
import validate_exam_questions as veq  # noqa: E402

TEMPLATE = 45  # sharehub/share-45: the latest ShareHub page, the draft's template


def make_item(base, name="05-sharehub-test", des=True, extra=None):
    d = Path(base) / name
    (d / "05-DES-Fidelity").mkdir(parents=True)
    files = {"00-وضعیت.md": "- وضعیت: در حال آماده‌سازی\n",
             "01-متن.md": "این جملهٔ نخست است. این جملهٔ دوم است.\n\n## بخش دوم\n\nجملهٔ سوم این‌جاست.\n",
             "02-عنوان-کپشن.md": "## عنوان\nیک عنوان آزمایشی\n\n## کپشن\nکپشن آزمایشی\n"}
    if des:
        scores = json.loads((ROOT / "plus/des-scores.json").read_text(encoding="utf-8"))
        files["05-DES-Fidelity/des.json"] = json.dumps({"sources": scores[f"sharehub/share-{TEMPLATE}"]["sources"][:1]},
                                                      ensure_ascii=False)
    files.update(extra or {})
    for rel, t in files.items():
        (d / rel).parent.mkdir(parents=True, exist_ok=True)
        (d / rel).write_text(t, encoding="utf-8")
    return d


def make_throwaway(base):
    """The smallest copy queue_apply --draft and des_fidelity_units need."""
    c = Path(base) / "checkout"
    shutil.copytree(ROOT / "tools", c / "tools", ignore=shutil.ignore_patterns("__pycache__"))
    for rel in (f"sharehub/share-{TEMPLATE}.html", "dentcast-brain.json", "plus/des-scores.json"):
        (c / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / rel, c / rel)
    (c / qa.THROWAWAY_MARKER).write_text("throwaway\n", encoding="utf-8")
    return c


def args(item, cid, **kw):
    base = dict(item=str(item), content_id=cid, supplement=None, date="2026-11-04", agent=None, dry_run=False,
                receipt=None, allow_handoff=False, founder_text_change=None, draft=True, throwaway=True)
    base.update(kw)
    return SimpleNamespace(**base)


class ManifestDraftTests(unittest.TestCase):
    def test_missing_inputs_file_does_not_crash_and_names_fields(self):
        with tempfile.TemporaryDirectory() as t:
            d = qm.draft(make_item(t))
            self.assertIsNone(d["_inputs"]["value"])
            self.assertIn("07-ورودی‌ها.md missing", d["_inputs"]["from"])
            miss = qm.missing(d)
            for f in ("hashtags", "pillar", "pulse"):
                self.assertIn(f, miss)
            self.assertEqual(d["category"]["value"], "sharehub")

    def test_bad_folder_name_is_a_refusal(self):
        with tempfile.TemporaryDirectory() as t:
            with self.assertRaises(qm.QueueRefusal) as e:
                qm.draft(make_item(t, name="not-an-item"))
            self.assertEqual(e.exception.code, "ITEM_NAME")

    def test_broken_manifest_json_is_a_refusal(self):
        with tempfile.TemporaryDirectory() as t:
            with self.assertRaises(qm.QueueRefusal) as e:
                qm.draft(make_item(t, extra={"12-انتشار.json": "{not json"}))
            self.assertEqual(e.exception.code, "MANIFEST_JSON")


class DraftModeTests(unittest.TestCase):
    def test_refuses_without_throwaway_flag(self):
        with tempfile.TemporaryDirectory() as t:
            with self.assertRaises(qm.QueueRefusal) as e:
                qa.draft_assemble(args(make_item(t), "sharehub/share-46", throwaway=False))
            self.assertEqual(e.exception.code, "DRAFT_NEEDS_THROWAWAY")

    def test_refuses_in_a_real_checkout(self):
        # this repository has .git and no marker: --draft never writes here
        with tempfile.TemporaryDirectory() as t:
            with self.assertRaises(qm.QueueRefusal) as e:
                qa.draft_assemble(args(make_item(t), "sharehub/share-46"))
            self.assertEqual(e.exception.code, "NOT_THROWAWAY")

    def test_refuses_a_copy_with_git(self):
        with tempfile.TemporaryDirectory() as t:
            c = make_throwaway(t)
            (c / ".git").mkdir()
            with patch.object(qa, "ROOT", c), self.assertRaises(qm.QueueRefusal) as e:
                qa.draft_assemble(args(make_item(t), "sharehub/share-46"))
            self.assertEqual(e.exception.code, "NOT_THROWAWAY")

    def test_draft_page_and_des_record_in_throwaway(self):
        with tempfile.TemporaryDirectory() as t:
            c = make_throwaway(t)
            item = make_item(t)   # status «در حال آماده‌سازی», no SHA256SUMS, no 07
            with patch.object(qa, "ROOT", c):
                r = qa.draft_assemble(args(item, "sharehub/share-46"))
            self.assertEqual(r["status"], "draft")
            self.assertTrue(r["not_for_publish"])
            page = (c / "sharehub/share-46.html").read_text(encoding="utf-8")
            self.assertIn("این جملهٔ نخست است.", page)
            self.assertIn("یک عنوان آزمایشی", page)
            rec = json.loads((c / "plus/des-scores.json").read_text(encoding="utf-8"))["sharehub/share-46"]
            self.assertEqual(set(rec), {"scored_at", "sources"})
            self.assertFalse((ROOT / "sharehub/share-46.html").exists())

    def test_draft_refuses_a_taken_id(self):
        with tempfile.TemporaryDirectory() as t:
            c = make_throwaway(t)
            with patch.object(qa, "ROOT", c), self.assertRaises(qm.QueueRefusal) as e:
                qa.draft_assemble(args(make_item(t), f"sharehub/share-{TEMPLATE}"))
            self.assertEqual(e.exception.code, "DRAFT_CONTENT_ID")


class FidelityPrepTests(unittest.TestCase):
    def run_prep(self, *extra):
        return subprocess.run([sys.executable, str(ROOT / "tools/queue_fidelity_prep.py"), *extra],
                              capture_output=True, text=True)

    def test_units_and_blocks_from_the_draft_page(self):
        with tempfile.TemporaryDirectory() as t:
            c = make_throwaway(t)
            item = make_item(t)
            src = json.loads((item / "05-DES-Fidelity/des.json").read_text(encoding="utf-8"))["sources"][0]
            doi = ((src.get("citation") or {}).get("doi") or "").lower() or "s1"
            texts = Path(t) / "texts.json"
            texts.write_text(json.dumps({doi: {"source_text": "Paper text. It ends here.",
                                               "text_basis": src["text_basis"]}}), encoding="utf-8")
            r = self.run_prep(str(item), "--checkout", str(c), "--content-id", "sharehub/share-46",
                              "--texts", str(texts), "--build", str(Path(t) / "blocks"))
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
            out = json.loads(r.stdout)
            self.assertEqual(out["scope"], "SOURCE")
            self.assertGreaterEqual(out["units"], 5)
            self.assertEqual(len(out["blocks"]), 1)
            blk = json.loads(Path(out["blocks"][0]).read_text(encoding="utf-8"))
            self.assertEqual(blk["source_conclusion"], "It ends here.")

    def test_refuses_a_checkout_that_is_not_throwaway(self):
        with tempfile.TemporaryDirectory() as t:
            c = make_throwaway(t)
            (c / qa.THROWAWAY_MARKER).unlink()
            r = self.run_prep(str(make_item(t)), "--checkout", str(c))
            self.assertEqual(r.returncode, 2)
            self.assertEqual(json.loads(r.stdout)["code"], "NOT_THROWAWAY")

    def test_without_des_package_says_so(self):
        with tempfile.TemporaryDirectory() as t:
            c = make_throwaway(t)
            r = self.run_prep(str(make_item(t, des=False)), "--checkout", str(c), "--content-id", "sharehub/share-46")
            self.assertEqual(r.returncode, 2)
            self.assertEqual(json.loads(r.stdout)["code"], "DES_PACKAGE_MISSING")


class StampTests(unittest.TestCase):
    def repo(self, t):
        r = Path(t) / "main"
        (r / "glossary").mkdir(parents=True)
        (r / "glossary/glossary.json").write_text('{"g": 1}\n', encoding="utf-8")
        (r / "dentcast-brain.json").write_text("[]\n", encoding="utf-8")
        git = lambda *a: subprocess.run(["git", "-C", str(r), *a], check=True, capture_output=True)
        git("init", "-q")
        git("add", ".")
        git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "x")
        return r, subprocess.run(["git", "-C", str(r), "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()

    def test_stamps_provenance_and_regenerates_sums(self):
        with tempfile.TemporaryDirectory() as t:
            repo, sha = self.repo(t)
            item = make_item(t, extra={"11-لینک‌های-گلاسری.md": "# 11\n- main: {{main_sha}}\n- glossary: {{glossary_sha256}}\n"
                                                              "- brain: {{brain_sha256}}\n",
                                       "SHA256SUMS": "stale\n"})
            with contextlib.redirect_stdout(io.StringIO()):
                code = qs.main([str(item), "--repo", str(repo), "--ref", "HEAD"])
            self.assertEqual(code, 4)  # 07, English … still missing: incomplete, named
            head = (item / "11-لینک‌های-گلاسری.md").read_text(encoding="utf-8")
            self.assertIn(sha, head)
            self.assertIn(hashlib.sha256(b'{"g": 1}\n').hexdigest(), head)
            self.assertIn(hashlib.sha256(b"[]\n").hexdigest(), head)
            sums = (item / "SHA256SUMS").read_text(encoding="utf-8")
            self.assertNotIn("00-وضعیت.md", sums)
            self.assertNotIn("SHA256SUMS", sums)
            self.assertIn("  11-لینک‌های-گلاسری.md\n", sums)
            self.assertEqual(qm.check_sums(item)["checked"], [l.split("  ", 1)[1] for l in sums.splitlines()])

    def test_manifest_title_must_equal_02(self):
        with tempfile.TemporaryDirectory() as t:
            repo, _ = self.repo(t)
            item = make_item(t, extra={"12-انتشار.json": json.dumps({"schema": qm.SCHEMA, "title_fa": "عنوانی دیگر"},
                                                                    ensure_ascii=False)})
            (item / "SHA256SUMS").write_text(qs.sums_text(item), encoding="utf-8")
            out = qs.verify_manifest(item)
            self.assertTrue(any(p.startswith("title_fa") for p in out["problems"]))

    def test_dry_run_writes_nothing(self):
        with tempfile.TemporaryDirectory() as t:
            repo, _ = self.repo(t)
            item = make_item(t, extra={"11-لینک‌های-گلاسری.md": "{{main_sha}}\n"})
            before = (item / "11-لینک‌های-گلاسری.md").read_bytes()
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(qs.main([str(item), "--repo", str(repo), "--ref", "HEAD", "--dry-run"]), 0)
            self.assertEqual((item / "11-لینک‌های-گلاسری.md").read_bytes(), before)
            self.assertFalse((item / "SHA256SUMS").exists())


def w(text, x0, top, upright=True):
    return {"text": text, "x0": x0, "x1": x0 + 6 * len(text), "top": top, "bottom": top + 9, "upright": upright}


class PdfSourceTextTests(unittest.TestCase):
    def two_column_page(self):
        words = [w("Title", 200, 40), w("of", 236, 40), w("the", 254, 40), w("paper", 278, 40)]
        for i in range(8):
            top = 80 + 12 * i
            words += [w(f"L{i}a", 40, top), w(f"L{i}b", 70, top), w(f"R{i}a", 320, top), w(f"R{i}b", 350, top)]
        words += [w("Downloaded", 10, 300, upright=False), w("Downloaded", 40, 400), w("from", 110, 400),
                  w("Wiley", 150, 400), w("Online", 190, 400), w("Library", 230, 400)]
        return {"width": 595.0, "words": words}

    def test_left_column_then_right_full_width_kept_footer_dropped(self):
        text = pst.source_text([self.two_column_page()])
        lines = text.split("\n")
        self.assertEqual(lines[0], "Title of the paper")
        self.assertEqual(lines[1:9], [f"L{i}a L{i}b" for i in range(8)])
        self.assertEqual(lines[9:17], [f"R{i}a R{i}b" for i in range(8)])
        self.assertNotIn("Downloaded", text)

    def test_single_column_is_read_line_by_line(self):
        words = []
        for i in range(8):
            words += [w(f"w{i}{k}", 40 + 40 * k, 80 + 12 * i) for k in range(12)]
        text = pst.source_text([{"width": 595.0, "words": words}])
        self.assertEqual(text.split("\n")[0], " ".join(f"w0{k}" for k in range(12)))

    def test_letter_spaced_heading_is_rejoined(self):
        self.assertEqual(pst.heading_fix("ACKNO WLE DGE MENTS"), "ACKNOWLEDGEMENTS")
        self.assertEqual(pst.heading_fix("5 | CONCLUSION"), "5 | CONCLUSION")
        self.assertEqual(pst.heading_fix("Plain sentence here."), "Plain sentence here.")

    def test_running_head_on_most_pages_is_dropped(self):
        body = lambda i: [f"opening sentence {'abcd'[i]}", f"second {'efgh'[i]}", f"Table {i} in the middle",
                          f"fourth {'ijkl'[i]}", f"closing words {'wxyz'[i]}"]
        pages = [["PACHIOU et al. | 33%d" % i, *body(i)] for i in range(4)]
        self.assertEqual(pst.drop_furniture(pages), [body(i) for i in range(4)])

    def test_real_pdf_round_trip_when_tools_exist(self):
        try:
            from reportlab.pdfgen import canvas  # noqa: PLC0415
        except ImportError:
            self.skipTest("reportlab not installed")
        try:
            import pdfplumber  # noqa: F401,PLC0415
        except ImportError:
            if not shutil.which("pdftotext"):
                self.skipTest("neither pdfplumber nor pdftotext installed")
        with tempfile.TemporaryDirectory() as t:
            pdf = Path(t) / "p.pdf"
            cv = canvas.Canvas(str(pdf), pagesize=(595, 842))
            for i in range(10):
                cv.drawString(40, 780 - 14 * i, f"Left line {i} words.")
                cv.drawString(320, 780 - 14 * i, f"Right line {i} words.")
            cv.drawString(40, 40, "Downloaded from https://onlinelibrary.wiley.com by x. See the Terms and Conditions")
            cv.save()
            out = Path(t) / "texts.json"
            with contextlib.redirect_stdout(io.StringIO()):
                pst.main([str(pdf), "--doi", "10.1/X", "--basis", "FULL_TEXT", "-o", str(out)])
            data = json.loads(out.read_text(encoding="utf-8"))
            self.assertEqual(set(data), {"10.1/x"})
            text = data["10.1/x"]["source_text"]
            self.assertLess(text.index("Left line 9"), text.index("Right line 0"))
            self.assertNotIn("Downloaded", text)
            self.assertEqual(data["10.1/x"]["text_basis"], "FULL_TEXT")


class ExamDraftCheckTests(unittest.TestCase):
    GOOD = {"prompt_fa": "در اوردنچر متکی بر ریشه، شایع‌ترین عارضهٔ دندان پایه کدام است؟",
            "options": ["پوسیدگی سطح", "شکستگی تاج", "تحلیل لثه", "التهاب پالپ"], "correct": 0,
            "reason": "متن پوسیدگی را شایع‌ترین عارضه می‌داند."}

    def check(self, **over):
        return veq.draft_check([{**self.GOOD, **over}])

    def test_good_question_passes(self):
        self.assertEqual(self.check(), ([], []))

    def test_three_options_fail(self):
        self.assertTrue(any("exactly four" in e for e in self.check(options=self.GOOD["options"][:3])[0]))

    def test_length_ratio_and_longest_key(self):
        errs = self.check(options=["پوسیدگی سطح ریشه در دندان", "شکستگی تاج", "تحلیل لثه", "التهاب پالپ"])[0]
        self.assertTrue(any("1.25" in e for e in errs))
        self.assertTrue(any("single longest" in e for e in errs))

    def test_banned_option(self):
        errs = self.check(options=["پوسیدگی سطح", "شکستگی تاج", "تحلیل لثه", "هیچ‌کدام موارد"])[0]
        self.assertTrue(any("banned" in e for e in errs))

    def test_option_restating_stem(self):
        errs = self.check(options=["عارضهٔ دندان پایه", "شکستگی تاج", "تحلیل لثه", "التهاب پالپ"])[0]
        self.assertTrue(any("restates the stem" in e for e in errs))

    def test_leak_is_a_warning(self):
        errs, warns = self.check(options=["پوسیدگی ریشه", "تحلیل استخوان", "التهاب پالپ", "شکستگی تاجی"])
        self.assertEqual(errs, [])
        self.assertTrue(any("ریشه" in x and "leak" in x for x in warns))

    def test_full_text_is_shown(self):
        shown = veq.show_draft([self.GOOD])
        for part in [self.GOOD["prompt_fa"], *self.GOOD["options"], "کلید", self.GOOD["reason"]]:
            self.assertIn(part, shown)

    def test_cli_exit_codes(self):
        with tempfile.TemporaryDirectory() as t:
            f = Path(t) / "q.json"
            f.write_text(json.dumps({"questions": [self.GOOD]}, ensure_ascii=False), encoding="utf-8")
            r = subprocess.run([sys.executable, str(ROOT / "tools/validate_exam_questions.py"), "--draft-check", str(f)],
                               capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stdout)
            f.write_text(json.dumps([{**self.GOOD, "options": self.GOOD["options"][:2]}], ensure_ascii=False),
                         encoding="utf-8")
            r = subprocess.run([sys.executable, str(ROOT / "tools/validate_exam_questions.py"), "--draft-check", str(f)],
                               capture_output=True, text=True)
            self.assertEqual(r.returncode, 1)


if __name__ == "__main__":
    unittest.main()
