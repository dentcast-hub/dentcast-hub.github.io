"""DES is scored once (founder 2026-11-25): tools/des_repair.py repairs a SOURCE answer
around the model's own ratings instead of asking for a new run."""
import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import des_repair as rep  # noqa: E402

TEXT = ("Twenty-nine studies were included in this review. The protocol was regis-\ntered in PROSPERO before "
        "the search. Two reviewers independently screened all records. The authors declare no conflicts of interest.")
REC = {"des_version": "3.7", "content_type": "RESEARCH", "question_type": "THERAPY", "text_basis": "FULL_TEXT",
       "citation": {"title": "T", "doi": "10.1/abc"},
       "s_design": {"value": 100, "anchor": "SR", "evidence_quote": "Twenty-nine studies were included in this review."},
       "q_method": {"tool": "AMSTAR-2", "multiplier": 0.8, "domains": [
           {"domain": "protocol", "rating": "low", "evidence_quote": "The protocol was registered in PROSPERO before the search.", "note": ""}]},
       "penalties": [{"item": "conflict", "base_points": 8, "points": 0, "evidence_quote": "", "note": ""}],
       "commentary_checklist": None, "des_score": 80, "band": "A", "provisional": False}
KEYS = {"top": {"RESEARCH": set(REC), "COMMENTARY": set(REC)}, "penalties": set(REC["penalties"][0]),
        "domains": set(REC["q_method"]["domains"][0]), "checklist": set(), "s_design": set(), "q_method": set()}


class RepairTests(unittest.TestCase):
    def run_repair(self, obj, doi="10.1/abc"):
        log, unverified = [], []
        with patch.object(rep, 'known_keys', return_value=KEYS):
            out = rep.repair(copy.deepcopy(obj), TEXT, "FULL_TEXT", doi, log, unverified)
        return out, log, unverified

    def test_clean_record_is_untouched(self):
        out, log, unverified = self.run_repair(REC)
        self.assertEqual(out, REC)
        self.assertEqual((log, unverified), ([], []))

    def test_extra_key_wrong_number_and_band_are_repaired_not_rerun(self):
        bad = copy.deepcopy(REC)
        bad["penalties"][0]["domain_or_item"] = "x"
        bad["des_score"], bad["band"] = 77, "B"
        out, log, _ = self.run_repair(bad)
        self.assertEqual(out, REC)
        self.assertEqual(len(log), 3)

    def test_hyphenated_quote_is_snapped_to_the_text(self):
        out, log, unverified = self.run_repair(REC)
        self.assertEqual(unverified, [])
        bad = copy.deepcopy(REC)
        bad["q_method"]["domains"][0]["evidence_quote"] = "The protocol was regis-tered in PROSPERO before the search."
        out, log, unverified = self.run_repair(bad)
        self.assertIn(rep.vp.des_norm(out["q_method"]["domains"][0]["evidence_quote"]), rep.vp.des_norm(TEXT))
        self.assertEqual(unverified, [])

    def test_stitched_quote_without_a_rating_is_emptied_and_the_score_stands(self):
        bad = copy.deepcopy(REC)
        bad["s_design"]["evidence_quote"] = "Meta-analyses were performed with JASP for three follow-up intervals."
        out, log, unverified = self.run_repair(bad)
        self.assertEqual(out["s_design"]["evidence_quote"], "")
        self.assertEqual((out["des_score"], out["band"]), (80, "A"))
        self.assertEqual(unverified, [])

    def test_unfound_quote_under_a_rating_is_reported_never_edited(self):
        bad = copy.deepcopy(REC)
        bad["q_method"]["domains"][0]["evidence_quote"] = "An entirely different statement about blinding of assessors."
        out, _, unverified = self.run_repair(bad)
        self.assertEqual(out["q_method"]["domains"][0], bad["q_method"]["domains"][0])
        self.assertEqual(len(unverified), 1)

    def test_another_papers_answer_is_the_case_that_reruns(self):
        bad = copy.deepcopy(REC)
        bad["citation"]["doi"] = "10.9/other"
        with self.assertRaises(SystemExit) as e:
            self.run_repair(bad)
        self.assertEqual(e.exception.code, 3)

    def test_cli_reads_a_fenced_reply(self):
        with tempfile.TemporaryDirectory() as d:
            d = Path(d)
            (d / 'a.txt').write_text('Here:\n```json\n' + json.dumps(REC) + '\n```', encoding='utf-8')
            (d / 't.json').write_text(json.dumps({"10.1/abc": {"source_text": TEXT, "text_basis": "FULL_TEXT"}}), encoding='utf-8')
            with patch.object(rep, 'known_keys', return_value=KEYS), \
                    patch.object(sys, 'argv', ['x', str(d / 'a.txt'), '--texts', str(d / 't.json'), '-o', str(d / 'o.json')]):
                self.assertEqual(rep.main(), 0)
            self.assertEqual(json.loads((d / 'o.json').read_text(encoding='utf-8')), REC)


if __name__ == '__main__':
    unittest.main()
