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


if __name__ == "__main__":
    unittest.main()
