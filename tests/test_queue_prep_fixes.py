"""Fixes from publish-queue item 24's preparation session (ShareHub, full-arch
implant IOS accuracy, 2026-11-07):

  1. captions added after the full FIDELITY run: only the captions are judged
     (founder ruling, item 24 approval 4) — `--carry` and `--vote --base`;
  2. the sentence split no longer cuts «تصویر ۱.», «Fig. 1», «e.g.»;
  3. an empty source_conclusion is refused loudly, and can be pinned up front;
  4. des.json / plan.json shapes are checked instead of read in silence;
  8. tools/related_cap.py counts «کاوش بیشتر» as Phase F does;
  9. queue_fidelity_prep.py --cleanup never widens on an empty argument.
"""
import contextlib
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import des_fidelity_units as units  # noqa: E402
import pdf_source_text as pst  # noqa: E402
import queue_apply as qa  # noqa: E402
import queue_fidelity_prep as qfp  # noqa: E402
import queue_stamp as qs  # noqa: E402

CID = "sharehub/share-test"
DOI = "10.1016/j.prosdent.2026.09.031"
SRC = {"des_version": "3.5", "content_type": "RESEARCH", "text_basis": "FULL_TEXT",
       "citation": {"authors": "Junying Li, Jing Lu", "year": 2026, "doi": DOI, "title": "Full-arch scanning review",
                    "journal": "J Prosthet Dent"}}
TEXTS = {DOI: {"source_text": "Paper text. Current evidence remains insufficient.", "text_basis": "FULL_TEXT"}}
CAPTIONS = [f"تصویر {n}. زیرنویس شمارهٔ {n} دربارهٔ اسکن فول‌آرچ است. منبع: Li و همکاران 2026، شکل {m}"
            for n, m in zip("۱۲۳۴۵", (1, 4, 2, 7, 3))]


def page(captions=()):
    """Title + 12 paragraphs × 5 sentences = 61 units; caption k after paragraph 2k+1."""
    parts = ["<html><body><main><h1>اسکن دیجیتال فول‌آرچ ایمپلنت</h1>"]
    for p in range(12):
        parts.append("<p>" + " ".join(f"جملهٔ {j + 1} از بند {p + 1} است." for j in range(5)) + "</p>")
        k = p // 2
        if p % 2 == 0 and k < len(captions):
            parts.append(f'<figure><img src="/sharehub/f{k}.webp" alt="x"><figcaption>{captions[k]}</figcaption></figure>')
    parts.append("</main></body></html>")
    return "\n".join(parts)


def claim(u, verdict="MATCHES"):
    return {"id": u["id"], "claim_quote": u["text"], "verdict": verdict, "change_kind": None,
            "source_quote": "" if verdict != "MATCHES" else "Current evidence remains insufficient.",
            "source_ref": None, "note": "t"}


def fid(claims):
    return {"des_version": "3.5", "mode": "FIDELITY", "scope": "SOURCE", "text_basis": "FULL_TEXT",
            "claims": claims, "provisional": False, "source_conclusion": "Current evidence remains insufficient."}


class Site(unittest.TestCase):
    """A temporary ROOT with one page and its DES record (no FIDELITY yet: a queue draft)."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.d = Path(self.tmp.name)
        (self.d / "plus").mkdir()
        (self.d / "sharehub").mkdir()
        (self.d / "plus/des-scores.json").write_text(json.dumps({CID: {"scored_at": "2026-11-07", "sources": [SRC]}}),
                                                     encoding="utf-8")
        (self.d / "texts.json").write_text(json.dumps(TEXTS), encoding="utf-8")
        self.patches = [patch.object(units, "ROOT", self.d), patch.object(units, "PLANS_DIR", self.d / "plans"),
                        patch.object(units, "MARKERS_FILE", self.d / "markers.json")]
        for p in self.patches:
            p.start()

    def tearDown(self):
        for p in self.patches:
            p.stop()
        self.tmp.cleanup()

    def write_page(self, captions=()):
        (self.d / f"{CID}.html").write_text(page(captions), encoding="utf-8")

    def main(self, *args):
        with patch.object(sys, "argv", ["des_fidelity_units.py", CID, *args]), \
                contextlib.redirect_stdout(io.StringIO()) as out:
            units.main()
        return out.getvalue()


class CaptionCarryTests(Site):
    """Item 1. Reproduction: Fidelity on the page without images had 61 units; the five captions made it 76
    under the old cut (71 under today's), `--vote --base` refused the shifted ids and the whole Fidelity
    (two full runs) was run again."""

    def base_dir(self):
        self.write_page()
        us = units.split_page(CID, [SRC])
        self.assertEqual(len(us), 61)
        base = self.d / "run1"
        base.mkdir()
        claims = [claim(u, "NOT_A_CLAIM" if u.get("heading") else "MATCHES") for u in us]
        claims[7]["verdict"] = "NOT_IN_SOURCE"
        (base / "voted-src0.json").write_text(json.dumps(fid(claims), ensure_ascii=False), encoding="utf-8")
        return base, claims

    def test_reproduction_ids_shift_and_the_old_rebase_refuses(self):
        base, claims = self.base_dir()
        self.write_page(CAPTIONS)
        self.assertEqual(len(units.split_page(CID, [SRC], legacy=True)), 76)
        now = units.split_page(CID, [SRC])
        self.assertEqual(len(now), 71)
        caps = [u for u in now if u.get("caption")]
        runs = [{"claims": [claim(u) for u in caps]}] * 2
        with self.assertRaises(SystemExit):   # what the session hit: ids shifted
            units.rebase(fid(claims), runs, now, 0)

    def test_carry_lists_only_the_captions_and_vote_keeps_every_other_verdict(self):
        base, claims = self.base_dir()
        self.write_page(CAPTIONS)
        rep = json.loads(self.main("--carry", str(base)))["carry"]["src0"]
        self.assertEqual(rep["carried"], 61)
        caps = [u for u in units.split_page(CID, [SRC]) if u.get("caption")]
        self.assertEqual(len(caps), 10)
        self.assertEqual(rep["judge_now"], [u["id"] for u in caps])
        run2 = self.d / "run2"
        self.main("--carry", str(base), "--texts", str(self.d / "texts.json"), "--build", str(run2))
        blk = json.loads((run2 / "input-src0.json").read_text(encoding="utf-8"))
        self.assertEqual([u["id"] for u in blk["units"]], rep["judge_now"])
        self.assertNotIn("caption", blk["units"][0])   # internal key never reaches the model
        for r in (1, 2):
            (run2 / f"out-src0-{r}.json").write_text(json.dumps(fid([claim(u) for u in blk["units"]]),
                                                                 ensure_ascii=False), encoding="utf-8")
        self.main("--vote", str(run2), "--base", str(base))
        voted = json.loads((run2 / "voted-src0.json").read_text(encoding="utf-8"))
        self.assertEqual(len(voted["claims"]), 71)
        old = {c["claim_quote"]: c["verdict"] for c in claims}
        for c in voted["claims"]:
            if c["claim_quote"] in old:
                self.assertEqual(c["verdict"], old[c["claim_quote"]], c["id"])
        self.assertEqual(voted["counts"]["not_in_source"], 1)
        self.assertEqual(voted["counts"]["matches"], 59 + 10)   # 60 body − 1 NOT_IN_SOURCE, + 10 captions

    def test_carry_refuses_when_body_text_moved(self):
        base, _ = self.base_dir()
        self.write_page(CAPTIONS)
        p = self.d / f"{CID}.html"
        p.write_text(p.read_text(encoding="utf-8").replace("جملهٔ 2 از بند 3 است.", "جملهٔ دوم بند سوم عوض شد."),
                     encoding="utf-8")
        with self.assertRaises(SystemExit) as e:
            self.main("--carry", str(base))
        self.assertIn("not a figure caption", str(e.exception))

    def test_vote_needs_two_runs_over_each_caption(self):
        base, _ = self.base_dir()
        self.write_page(CAPTIONS)
        caps = [u for u in units.split_page(CID, [SRC]) if u.get("caption")]
        run2 = self.d / "run2"
        run2.mkdir()
        (run2 / "out-src0-1.json").write_text(json.dumps(fid([claim(u) for u in caps]), ensure_ascii=False),
                                              encoding="utf-8")
        with self.assertRaises(SystemExit) as e:
            self.main("--vote", str(run2), "--base", str(base))
        self.assertIn("two checker runs", str(e.exception))

    def test_recorded_plan_with_old_ids_is_refused(self):
        base, _ = self.base_dir()
        self.write_page(CAPTIONS)
        p = units.plan_path(CID)
        p.parent.mkdir(parents=True)
        p.write_text(json.dumps({"content_id": CID, "origin": "orphan_sweep", "sweep": [{"found": {}}],
                                 "plan": {"0": [f"u{i}" for i in range(1, 62)]}}), encoding="utf-8")
        with self.assertRaises(SystemExit):
            self.main("--carry", str(base))


class SentenceSplitTests(Site):
    """Item 2."""

    def test_caption_label_and_reference_abbreviations_stay_whole(self):
        s = units.sentences
        self.assertEqual(s("تصویر ۱. دو چالش اسکن. منبع: Li و همکاران 2026، Fig. 1"),
                         ["تصویر ۱. دو چالش اسکن.", "منبع: Li و همکاران 2026، Fig. 1"])
        self.assertEqual(s("Figure 2. Accuracy by span. Source: Li et al., Figs. 4 and 5."),
                         ["Figure 2. Accuracy by span.", "Source: Li et al., Figs. 4 and 5."])
        self.assertEqual(s("Case Reports in Dentistry (2022), Fig. 2."), ["Case Reports in Dentistry (2022), Fig. 2."])
        self.assertEqual(s("ابزارها (e.g. Scan Aid) کمک می‌کنند. جملهٔ بعدی."),
                         ["ابزارها (e.g. Scan Aid) کمک می‌کنند.", "جملهٔ بعدی."])

    def test_real_sentence_ends_still_cut(self):
        s = units.sentences
        self.assertEqual(s("در جدول ۲ آمده است. بعد Table 3. ادامه."), ["در جدول ۲ آمده است.", "بعد Table 3.", "ادامه."])
        self.assertEqual(s("See Fig. The next one."), ["See Fig.", "The next one."])   # no number: a real stop
        self.assertEqual(s("جمله‌ای تمام شد. جملهٔ دیگر؟ آخری!"), ["جمله‌ای تمام شد.", "جملهٔ دیگر؟", "آخری!"])

    def test_captions_are_marked_and_a_judged_record_keeps_its_cut(self):
        self.write_page(CAPTIONS[:1])
        now = units.split_page(CID, [SRC])
        cap = [u for u in now if u.get("caption")]
        self.assertEqual([u["text"] for u in cap], ["تصویر ۱. زیرنویس شمارهٔ ۱ دربارهٔ اسکن فول‌آرچ است.",
                                                     "منبع: Li و همکاران 2026، شکل 1"])
        legacy = units.split_page(CID, [SRC], legacy=True)
        judged = [fid([claim(u) for u in legacy])]
        self.assertEqual(units.split_for(CID, [SRC], judged), legacy)   # a stored record's ids never move
        self.assertEqual(units.split_for(CID, [SRC], [fid([claim(u) for u in now])]), now)
        self.assertEqual(units.split_for(CID, [SRC], None), now)        # a draft gets today's cut


GLUED = ("Methods text. Results text.\nCONCLUSIONS REFERENCES\nBased on the findings, the following conclusions "
         "were drawn: Current evidence remains insufficient for IOS-CHS and IOS-IPG.\n1. Smith A. A paper. "
         "J Dent 2020;1:1-2.")


class SourceConclusionTests(Site):
    """Item 3. Reproduction: J Prosthet Dent two-column page, «CONCLUSIONS REFERENCES» glued."""

    def test_glued_heading_gives_empty_and_build_refuses(self):
        self.assertEqual(units.conclusion_of(GLUED, "FULL_TEXT"), "")
        with self.assertRaises(SystemExit) as e:
            units.source_conclusion_for({"source_text": GLUED, "text_basis": "FULL_TEXT"})
        self.assertIn("source_conclusion", str(e.exception))
        self.write_page()
        (self.d / "texts.json").write_text(json.dumps({DOI: {"source_text": GLUED, "text_basis": "FULL_TEXT"}}))
        with self.assertRaises(SystemExit):
            self.main("--texts", str(self.d / "texts.json"), "--build", str(self.d / "b"))

    def test_pin_before_the_first_run_is_used(self):
        pin = "Current evidence remains insufficient for IOS-CHS and IOS-IPG."
        self.assertEqual(units.source_conclusion_for({"source_text": GLUED, "text_basis": "FULL_TEXT",
                                                      "source_conclusion": pin}), pin)
        self.write_page()
        (self.d / "texts.json").write_text(json.dumps({DOI: {"source_text": GLUED, "text_basis": "FULL_TEXT",
                                                             "source_conclusion": pin}}))
        self.main("--texts", str(self.d / "texts.json"), "--build", str(self.d / "b"))
        blk = json.loads((self.d / "b/input-src0.json").read_text(encoding="utf-8"))
        self.assertEqual(blk["source_conclusion"], pin)

    def test_pdf_source_text_warns_and_pins(self):
        with tempfile.TemporaryDirectory() as t:
            out = Path(t) / "texts.json"
            with patch.object(pst, "read_words", return_value=([], "pdftotext")), \
                    patch.object(pst, "source_text", return_value=GLUED):
                with contextlib.redirect_stdout(io.StringIO()) as buf:
                    rc_ = pst.main(["x.pdf", "--doi", DOI, "-o", str(out)])
                self.assertEqual(rc_, 3)
                rec = json.loads(buf.getvalue())
                self.assertEqual(rec["source_conclusion"], "")
                self.assertIn("EMPTY", rec["warning"])
                pin = "Current evidence remains insufficient for IOS-CHS and IOS-IPG."
                with contextlib.redirect_stdout(io.StringIO()) as buf:
                    self.assertEqual(pst.main(["x.pdf", "--doi", DOI, "-o", str(out), "--conclusion", pin]), 0)
                self.assertEqual(json.loads(out.read_text())[DOI.lower()]["source_conclusion"], pin)
                with self.assertRaises(SystemExit):   # not in the text
                    pst.main(["x.pdf", "--doi", DOI, "-o", str(out), "--conclusion", "Something the paper never says."])


class PackageShapeTests(unittest.TestCase):
    """Item 4."""

    def item(self, t, des, plan=None):
        d = Path(t) / "24-sharehub-x"
        (d / "05-DES-Fidelity").mkdir(parents=True)
        (d / "05-DES-Fidelity/des.json").write_text(json.dumps(des), encoding="utf-8")
        if plan is not None:
            (d / "05-DES-Fidelity/plan.json").write_text(json.dumps(plan), encoding="utf-8")
        return d

    def run_check(self, *a, **k):
        problems, warnings = [], []
        with tempfile.TemporaryDirectory() as t:
            qs.check_des_package(self.item(t, *a, **k), problems, warnings)
        return problems, warnings

    def test_canonical_is_clean(self):
        self.assertEqual(self.run_check({"scored_at": "2026-11-07", "sources": [SRC]}), ([], []))

    def test_bare_shapes_are_named_not_silent(self):
        p, w = self.run_check(SRC)
        self.assertEqual(p, [])
        self.assertTrue(w and w[0].startswith("W5") and "bare SOURCE object" in w[0])
        p, w = self.run_check([SRC])
        self.assertTrue(w and "bare list" in w[0])
        p, _ = self.run_check({"scored_at": "7/11", "sources": [SRC], "fidelity": []})
        self.assertEqual(len(p), 2, p)

    def test_plan_rules(self):
        des = {"scored_at": "2026-11-07", "sources": [SRC]}
        p, _ = self.run_check(des, {"content_id": "x", "origin": "orphan_sweep", "plan": {"0": ["u1"]}})
        self.assertTrue(p and p[0].startswith("P4") and "sweep receipt" in p[0])
        p, _ = self.run_check(des, {"origin": "founder", "plan": {"0": ["u1"]}})
        self.assertTrue(p and "confirmed" in p[0])
        p, _ = self.run_check(des, {"origin": "orphan_sweep", "sweep": [{}], "plan": {"3": ["u1"]}})
        self.assertTrue(p and "source indexes" in p[0])
        self.assertEqual(self.run_check(des, {"origin": "orphan_sweep", "sweep": [{}], "plan": {"0": ["u1"]}}),
                         ([], []))

    def test_prep_warns_on_a_one_source_plan_without_sweep(self):
        with tempfile.TemporaryDirectory() as t:
            d = self.item(t, {"scored_at": "2026-11-07", "sources": [SRC]},
                          {"origin": "orphan_sweep", "plan": {"0": ["u1"]}})
            w = qfp.package_warnings(d, {"sources": 1})
        self.assertTrue(any("one-source page has no orphan sweep" in x for x in w), w)


class RelatedCapTests(unittest.TestCase):
    """Item 8: nav capsules count, the about line and the footer do not."""

    def setUp(self):
        global rc
        import related_cap as rc  # noqa: PLC0415

    def test_count_matches_phase_f(self):
        doc = ('<main><h1>t</h1><p><a href="/glossary/x.html">x</a></p>'
               '<div class="dc-related-section">\n<h2 class="dc-related-label">کاوش بیشتر</h2>\n'
               '<div class="dc-related-capsules">\n<a href="/glossary/" class="dc-related-capsule">دانشنامه</a>\n'
               '<a href="/pillar/digital/" class="dc-related-capsule">فهرست موضوعی</a>\n'
               '<a href="/sharehub/share-2.html" class="dc-related-capsule">دقت اسکن</a>\n</div>\n</div>\n'
               '<footer><a class="btn" href="/glossary/">بازگشت</a><div class="about-link">'
               '<a href="/about.html">درباره</a></div></footer></main>')
        with tempfile.TemporaryDirectory() as t:
            p = Path(t) / "p.html"
            p.write_text(doc, encoding="utf-8")
            r = rc.count(p)
        self.assertEqual((r["count"], r["free"], r["status"]), (3, 2, "room"))
        self.assertEqual([x["nav_capsule"] for x in r["links"]], ["دانشنامه", "فهرست موضوعی", None])

    def test_live_glossary_page(self):
        r = rc.count(ROOT / "glossary/scan-body.html")
        self.assertEqual(r["section"], "dc-related-section")
        self.assertEqual(r["count"], len(r["links"]))


class CleanupTests(unittest.TestCase):
    """Item 9: --cleanup without a path refuses (an empty shell variable never widens it); symlinks refused."""

    def run_cli(self, *a, env=None):
        return subprocess.run([sys.executable, str(ROOT / "tools/queue_fidelity_prep.py"), *a],
                              capture_output=True, text=True, env=env)

    def work(self, t, name):
        d = Path(t) / (qfp.PREFIX + name)
        (d / "checkout").mkdir(parents=True)
        (d / "checkout" / qa.THROWAWAY_MARKER).write_text("t\n", encoding="utf-8")
        (d / qfp.NOTE).write_text(json.dumps({"item": "x"}), encoding="utf-8")
        return d

    def test_empty_target_refused_all_is_explicit(self):
        with tempfile.TemporaryDirectory() as t:
            a = self.work(t, "a")
            env = {**os.environ, "TMPDIR": t}
            r = self.run_cli("--cleanup", env=env)
            self.assertEqual(r.returncode, 2)
            self.assertEqual(json.loads(r.stdout)["code"], "CLEANUP_TARGET")
            self.assertTrue(a.exists())
            r = self.run_cli("--cleanup", "--all", env=env)
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
            self.assertFalse(a.exists())

    def test_symlinked_work_dir_is_not_removed(self):
        with tempfile.TemporaryDirectory() as t:
            real = self.work(t, "real")
            link = Path(t) / (qfp.PREFIX + "link")
            link.symlink_to(real)
            self.assertFalse(qfp.is_work_dir(link))
            self.assertTrue(qfp.is_work_dir(real))


if __name__ == "__main__":
    unittest.main()
