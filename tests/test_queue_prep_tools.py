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


def _unused_sharehub_id():
    """A draft content_id no real publication can ever hold.

    The draft tests copy the live plus/des-scores.json into the throwaway
    checkout, and queue_apply --draft rightly refuses an id that already has a
    record. A fixed "next" number (share-46 once) collides the moment that
    page is really published, so the id is derived from the live data at run
    time: far above every ShareHub number in des-scores.json and on disk."""
    scores = json.loads((ROOT / "plus/des-scores.json").read_text(encoding="utf-8"))
    nums = [int(k.rsplit("-", 1)[1]) for k in scores if k.startswith("sharehub/share-")]
    nums += [int(p.stem.rsplit("-", 1)[1]) for p in (ROOT / "sharehub").glob("share-*.html")
             if p.stem.rsplit("-", 1)[1].isdigit()]
    return f"sharehub/share-{max(nums, default=0) + 100000}"


DRAFT_CID = _unused_sharehub_id()


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
                qa.draft_assemble(args(make_item(t), DRAFT_CID, throwaway=False))
            self.assertEqual(e.exception.code, "DRAFT_NEEDS_THROWAWAY")

    def test_refuses_in_a_real_checkout(self):
        # this repository has .git and no marker: --draft never writes here
        with tempfile.TemporaryDirectory() as t:
            with self.assertRaises(qm.QueueRefusal) as e:
                qa.draft_assemble(args(make_item(t), DRAFT_CID))
            self.assertEqual(e.exception.code, "NOT_THROWAWAY")

    def test_refuses_a_copy_with_git(self):
        with tempfile.TemporaryDirectory() as t:
            c = make_throwaway(t)
            (c / ".git").mkdir()
            with patch.object(qa, "ROOT", c), self.assertRaises(qm.QueueRefusal) as e:
                qa.draft_assemble(args(make_item(t), DRAFT_CID))
            self.assertEqual(e.exception.code, "NOT_THROWAWAY")

    def test_draft_page_and_des_record_in_throwaway(self):
        with tempfile.TemporaryDirectory() as t:
            c = make_throwaway(t)
            item = make_item(t)   # status «در حال آماده‌سازی», no SHA256SUMS, no 07
            with patch.object(qa, "ROOT", c):
                r = qa.draft_assemble(args(item, DRAFT_CID))
            self.assertEqual(r["status"], "draft")
            self.assertTrue(r["not_for_publish"])
            page = (c / f"{DRAFT_CID}.html").read_text(encoding="utf-8")
            self.assertIn("این جملهٔ نخست است.", page)
            self.assertIn("یک عنوان آزمایشی", page)
            rec = json.loads((c / "plus/des-scores.json").read_text(encoding="utf-8"))[DRAFT_CID]
            self.assertEqual(set(rec), {"scored_at", "sources"})
            self.assertFalse((ROOT / f"{DRAFT_CID}.html").exists())

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
            r = self.run_prep(str(item), "--checkout", str(c), "--content-id", DRAFT_CID,
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
            r = self.run_prep(str(make_item(t, des=False)), "--checkout", str(c), "--content-id", DRAFT_CID)
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


DOI_A, DOI_B, DOI_C = "10.1111/jopr.14059", "10.1186/s12903-025-06214-9", "10.2186/jpr.JPR_D_25_00028"
AUTH_A = ["Ahmed Mahrous", "David L. Botsko", "Tamer El-Gendy", "Amira Elgreatly"]
AUTH_B = ["Mohamed Elgamal", "Abdallah Mohammed Ibrahim"]


def checked_files(**over):
    """A queue item whose 04/05/09/10/08/11 have the real shapes and agree with each other."""
    refs = (f"# منابع\n\n1. Mahrous A, Botsko DL, El-Gendy T, Elgreatly A. “Enhancing digital workflows.” *J Prosthodont*. "
            f"2026. DOI: https://doi.org/{DOI_A}\n2. Elgamal M, Ibrahim AM. “Accuracy assessment.” *BMC Oral Health*. "
            f"2025. DOI: https://doi.org/{DOI_B}\n3. Alqutaibi AY, et al. “A systematic review.” 2026. "
            f"DOI: https://doi.org/{DOI_C}\n")
    catalog = [{"doi": DOI_A, "authors": AUTH_A}, {"doi": DOI_B, "authors": AUTH_B},
               {"doi": DOI_C, "link_existing": True}]
    des = {"sources": [{"citation": {"doi": DOI_A.lower(), "authors": ", ".join(AUTH_A)}},
                       {"citation": {"doi": DOI_B.lower(), "authors": ", ".join(AUTH_B)}}]}
    cards = {"definedTermSets": [{"@type": "DefinedTermSet", "@id": "{{PAGE_URL}}#flashcards", "hasDefinedTerm": [
        {"@type": "DefinedTerm", "@id": "{{PAGE_URL}}#flashcards-c1", "name": "مسیر ورود",
         "description": "مسیری که پروتز پارسیل در آن وارد و خارج می‌شود و جای آندرکات‌ها به آن وابسته است."}]}],
        "faqPages": [{"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": "سوروی دیجیتال چه کمکی می‌کند؟",
             "acceptedAnswer": {"@type": "Answer", "text": "ثبت شیب کست و طرح سوروی را برای لابراتوار نگه می‌دارد."}}]}]}
    files = {
        "01-متن.md": "در سوروی دیجیتال، مسیر ورود پروتز پارسیل تعیین می‌شود و آندرکات‌های قابل‌استفاده علامت می‌خورند.\n",
        "06-انگلیسی.md": "Digital surveying sets the path of insertion of the removable partial denture.\n",
        "04-منبع/منابع.md": refs,
        "04-منبع/کاتالوگ.json": json.dumps(catalog, ensure_ascii=False),
        "05-DES-Fidelity/des.json": json.dumps(des, ensure_ascii=False),
        "09-کلیدواژه‌ها.md": "# کلیدواژه‌ها\n\n- مسیر ورود (Path of Insertion)\n- آندرکات‌های قابل‌استفاده\n"
                             "- digital surveying for removable partial dentures\n",
        "10-فلش‌کارت-FAQ.json": json.dumps(cards, ensure_ascii=False),
        "08-سؤال‌های-آزمون.json": json.dumps({"questions": [{"prompt_fa": "مسیر ورود به چه وابسته است؟"}]},
                                             ensure_ascii=False),
        "11-لینک‌های-گلاسری.md": "# 11\n- main: {{main_sha}}\n- glossary: {{glossary_sha256}}\n- brain: {{brain_sha256}}\n",
    }
    for k, v in over.items():
        files[k] = v if isinstance(v, str) else json.dumps(v, ensure_ascii=False)
    return files


class StampCheckTests(unittest.TestCase):
    def item(self, t, **over):
        return make_item(t, des=False, extra=checked_files(**over))

    def test_clean_item_has_no_problems_or_warnings(self):
        with tempfile.TemporaryDirectory() as t:
            self.assertEqual(qs.checks(self.item(t)), {"problems": [], "warnings": []})

    def test_author_order_mismatch_is_a_problem(self):
        swapped = [AUTH_A[0], AUTH_A[2], AUTH_A[1], AUTH_A[3]]
        with tempfile.TemporaryDirectory() as t:
            des = {"sources": [{"citation": {"doi": DOI_A.lower(), "authors": ", ".join(swapped)}}]}
            out = qs.checks(self.item(t, **{"05-DES-Fidelity/des.json": des}))
            self.assertEqual(len(out["problems"]), 1, out)
            self.assertIn(DOI_A, out["problems"][0])
            self.assertIn("des.json", out["problems"][0])
        with tempfile.TemporaryDirectory() as t:
            refs = checked_files()["04-منبع/منابع.md"].replace("Botsko DL, El-Gendy T", "El-Gendy T, Botsko DL")
            out = qs.checks(self.item(t, **{"04-منبع/منابع.md": refs}))
            self.assertEqual(len(out["problems"]), 1, out)
            self.assertIn("منابع.md", out["problems"][0])
            item = Path(t) / "05-sharehub-test"
            with contextlib.redirect_stdout(io.StringIO()) as buf:
                self.assertEqual(qs.main([str(item), "--dry-run"]), 4)
            self.assertEqual(json.loads(buf.getvalue())["checks"]["problems"], out["problems"])

    def test_doi_missing_from_references_is_a_problem(self):
        with tempfile.TemporaryDirectory() as t:
            refs = "\n".join(l for l in checked_files()["04-منبع/منابع.md"].splitlines() if DOI_C not in l)
            out = qs.checks(self.item(t, **{"04-منبع/منابع.md": refs}))
            self.assertEqual(out["problems"], [f"P2 {DOI_C}: in 04-منبع/کاتالوگ.json but not in 04-منبع/منابع.md"])

    def test_latin_leftover_markers_are_ordinary_words_in_the_page_prose(self):
        files = checked_files()
        with tempfile.TemporaryDirectory() as t:
            item = self.item(t, **{"06-انگلیسی.md": files["06-انگلیسی.md"] + "\nA borderline ferrule is still a ferrule.\n",
                                   "11-لینک‌های-گلاسری.md": files.get("11-لینک‌های-گلاسری.md", "") + "\n- undercut: borderline\n"})
            w4 = [w for w in qs.checks(item)["warnings"] if w.startswith("W4")]
            self.assertEqual(len(w4), 1, w4)
            self.assertIn("11-لینک‌های-گلاسری.md", w4[0])
            self.assertNotIn("06-انگلیسی.md", "\n".join(w4))

    def test_soft_findings_are_warnings_and_strict_makes_them_problems(self):
        cards = json.loads(checked_files()["10-فلش‌کارت-FAQ.json"])
        answer = cards["faqPages"][0]["mainEntity"][0]["acceptedAnswer"]
        cards["definedTermSets"][0]["hasDefinedTerm"][0]["description"] = answer["text"].replace("نگه می‌دارد", "حفظ می‌کند")
        cards["faqPages"][0]["mainEntity"].append({"@type": "Question", "name": "چرا مسیر ورود مهم است؟",
                                                   "acceptedAnswer": {"text": "این مقاله آن را نخستین تصمیم طراحی می‌داند."}})
        with tempfile.TemporaryDirectory() as t:
            item = self.item(t, **{"10-فلش‌کارت-FAQ.json": cards,
                                   "09-کلیدواژه‌ها.md": checked_files()["09-کلیدواژه‌ها.md"] + "- selective laser melting RPD\n",
                                   "07-ورودی‌ها.md": "- pillar: x\n- hashtags: منتظر تأیید بنیان‌گذار\n"})
            out = qs.checks(item)
            self.assertEqual(out["problems"], [])
            joined = "\n".join(out["warnings"])
            for code, needle in (("W1", "selective laser melting RPD"), ("W2", "flashcards-c1"),
                                 ("W3", "این مقاله"), ("W4", "07-ورودی‌ها.md:2")):
                self.assertTrue(any(w.startswith(code) and needle in w for w in out["warnings"]), joined)
            self.assertEqual(len(out["warnings"]), 4, joined)
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(qs.main([str(item), "--dry-run"]), 0)
            with contextlib.redirect_stdout(io.StringIO()) as buf:
                self.assertEqual(qs.main([str(item), "--dry-run", "--strict"]), 4)
            self.assertEqual(len(json.loads(buf.getvalue())["checks"]["problems"]), 4)

    def test_skip_object_and_absent_files_are_notes(self):
        with tempfile.TemporaryDirectory() as t:
            out = qs.checks(self.item(t, **{"10-فلش‌کارت-FAQ.json": {"skip": "no glossary terms"}}))
            self.assertEqual(out["problems"], [])
            self.assertEqual(out["warnings"], ["skipped: 10-فلش‌کارت-FAQ.json is a skip object"])
        with tempfile.TemporaryDirectory() as t:
            out = qs.checks(make_item(t))   # the minimal item: no 04, 09, 10
            self.assertEqual(out["problems"], [])
            self.assertTrue(out["warnings"] and all(w.startswith("skipped:") for w in out["warnings"]), out)


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

    def test_glued_fraction_clean_vs_glued(self):
        clean = [{"words": [w(t, 10 * i, 50) for i, t in enumerate(["the", "framework", "design", "o'clock", "well-known"])]}]
        glued = [{"words": [w("theframeworkdesignofthestudy", 10, 50), w("and", 60, 50), w("a", 80, 50), w("b2", 90, 50),
                            w("x" * 30, 100, 50, upright=False), w("12345678901234567890", 120, 50)]}]
        self.assertEqual(pst.glued_fraction(clean), 0.0)
        self.assertAlmostEqual(pst.glued_fraction(glued), 1 / 3)  # 1 of 3 alphabetic upright words
        self.assertEqual(pst.glued_fraction([{"words": []}]), 0.0)

    def run_main(self, argv):
        with tempfile.TemporaryDirectory() as t:
            out = Path(t) / "texts.json"
            err = io.StringIO()
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(err):
                pst.main(["x.pdf", "--doi", "10.1/X", "-o", str(out), *argv])
            return json.loads(out.read_text(encoding="utf-8")), err.getvalue()

    def test_backend_pdftotext_skips_pdfplumber(self):
        page = {"width": 595.0, "words": [w("Hello", 40, 50), w("world", 80, 50)]}
        with patch.object(pst.shutil, "which", return_value="/usr/bin/pdftotext"), \
                patch.object(pst, "words_pdftotext", return_value=[page]) as pt, \
                patch.object(pst, "words_pdfplumber") as pl:
            data, err = self.run_main(["--backend", "pdftotext"])
        pt.assert_called_once()
        pl.assert_not_called()
        self.assertEqual(list(data), ["10.1/x"])
        self.assertEqual(set(data["10.1/x"]), {"source_text", "text_basis"})
        self.assertIn("backend=pdftotext", err)

    def test_auto_falls_back_to_pdftotext_when_pdfplumber_glues_words(self):
        glued = {"width": 595.0, "words": [w("theframeworkdesignofthestudy", 40, 50), w("andtheresultsofthetrial", 40, 62)]}
        good = {"width": 595.0, "words": [w("the", 40, 50), w("framework", 70, 50)]}
        with patch.object(pst.shutil, "which", return_value="/usr/bin/pdftotext"), \
                patch.object(pst, "words_pdfplumber", return_value=[glued]) as pl, \
                patch.object(pst, "words_pdftotext", return_value=[good]) as pt:
            data, err = self.run_main([])
        pl.assert_called_once()
        pt.assert_called_once()
        self.assertEqual(data["10.1/x"]["source_text"], "the framework")
        self.assertIn("pdfplumber glued words (100.0% over 18 chars); re-read with pdftotext", err)
        self.assertIn("backend=pdftotext", err)

    def test_auto_keeps_pdfplumber_when_clean(self):
        good = {"width": 595.0, "words": [w("the", 40, 50), w("framework", 70, 50)]}
        with patch.object(pst, "words_pdfplumber", return_value=[good]), \
                patch.object(pst, "words_pdftotext") as pt:
            _, err = self.run_main([])
        pt.assert_not_called()
        self.assertIn("backend=pdfplumber", err)

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
