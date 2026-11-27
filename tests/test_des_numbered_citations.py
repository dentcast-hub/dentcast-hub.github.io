"""Numbered citations in tools/des_fidelity_units.py (founder, 2026-11-27):
a sentence citing «[n]» is measured against the n-th reference only, never pooled."""
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import des_fidelity_units as units

CID = 'sharehub/share-numbered-test'


def src(author, doi, title):
    return {'des_version': '3.7', 'content_type': 'RESEARCH', 'text_basis': 'ABSTRACT_ONLY',
            'citation': {'authors': author, 'year': 2020, 'doi': doi, 'title': title}}


SOURCES = [src('Alpha', '10.1/a', 'First paper on receptors'),
           src('Beta', '', 'Second paper on implant feeling'),
           src('Gamma', '10.1/c', 'Third paper on contacts')]
PAGE = """<html><body><main><h1>T</h1><div class="glass-box">
<p>جملهٔ اول درباره‌ی گیرنده‌ها است [1]. جملهٔ بعدی بدون شماره است.</p>
<p>ایمپلنت هم حس دارد [2, 3].</p>
<p>جمله‌ای بی‌منبع.</p>
<h3>منابع</h3><ol class="sh-refs">
<li>Alpha. First paper. <a href="https://doi.org/10.1/a">DOI</a></li>
<li>Beta. Second paper on implant feeling. 2012.</li>
<li>Gamma. Third. <a href="https://doi.org/10.1/c">DOI</a></li>
</ol></div><div class="author-note">x</div></main></body></html>"""


def u(i, text, para):
    return {'id': f'u{i}', 'text': text, 'para': para}


UNITS = [u(1, 'جملهٔ اول درباره‌ی گیرنده‌ها است [1].', 1), u(2, 'جملهٔ بعدی بدون شماره است.', 1),
         u(3, 'ایمپلنت هم حس دارد [2, 3].', 2), u(4, 'جمله‌ای بی‌منبع.', 3)]


class NumberedCitations(unittest.TestCase):
    def run_assign(self, page=PAGE, sources=SOURCES, stored=None):
        with tempfile.TemporaryDirectory() as d:
            (Path(d) / 'sharehub').mkdir()
            (Path(d) / f'{CID}.html').write_text(page, encoding='utf-8')
            with patch.object(units, 'ROOT', Path(d)), patch.object(units, 'stored_fidelity', lambda c: stored):
                return units.assign(UNITS, sources, CID)

    def test_numbers_parse(self):
        self.assertEqual(units.cited_numbers('x [2, 3] y [۴–۶]'), {2, 3, 4, 5, 6})

    def test_each_number_goes_to_its_own_source_only(self):
        mode, plan = self.run_assign()
        self.assertEqual(mode, 'SOURCE')
        self.assertEqual(plan, {0: ['u1', 'u2'], 1: ['u3'], 2: ['u3']})  # u4 is left to the orphan sweep

    def test_unmatched_reference_stops_a_fresh_run(self):
        bad = [SOURCES[0], src('Beta', '', 'Something else entirely'), SOURCES[2]]
        with self.assertRaises(SystemExit):
            self.run_assign(sources=bad)

    def test_number_beyond_the_list_stops_a_fresh_run(self):
        with self.assertRaises(SystemExit):
            self.run_assign(page=PAGE.replace('[2, 3]', '[4]'))

    def test_pooled_record_keeps_its_assignment(self):
        mode, _ = self.run_assign(stored={'scope': 'POOLED', 'claims': []})
        self.assertEqual(mode, 'POOLED')


if __name__ == '__main__':
    unittest.main()
