"""module 08 Part 2c (founder 2026-11-09): the orphan sweep is owed exactly when a body
sentence of a multi-source v3.5+ page reaches no source; the tool enforces it, and
nothing else on the ordinary path moves."""
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tests'))
sys.path.insert(0, str(ROOT / 'tools'))
import des_fidelity_units as units
from test_des_v35_fidelity_units import CID, MARKERS, SOURCES, UNITS, Tmp, src, u


class SweepOwedTests(Tmp):
    def owed(self, units_=UNITS, sources=SOURCES):
        mode, plan = units.assign(units_, sources, CID)
        return units.unswept(CID, units_, sources, mode, plan)

    def test_unnamed_sentence_on_a_multi_source_page_owes_the_sweep(self):
        self.mf.write_text(json.dumps(MARKERS, ensure_ascii=False), encoding='utf-8')
        self.assertEqual(self.owed(), ['u6'])

    def test_every_sentence_reaching_a_source_owes_nothing(self):
        self.mf.write_text(json.dumps(MARKERS, ensure_ascii=False), encoding='utf-8')
        self.assertEqual(self.owed(UNITS[:5]), [])

    def test_recorded_plan_settles_it(self):
        self.mf.write_text(json.dumps(MARKERS, ensure_ascii=False), encoding='utf-8')
        self.write_plan({'content_id': CID, 'origin': 'orphan_sweep', 'plan': {'0': ['u2', 'u3']},
                         'sweep': [{'found': {}, 'absent': ['u6']}]})
        self.assertEqual(self.owed(), [])

    def test_one_source_and_old_records_never_owe_it(self):
        one = [src('Okeson', 1988, '10.1/a')]
        self.assertEqual(self.owed(UNITS, one), [])
        old = [src('Okeson', 1988, '10.1/a', version='3.4'), src('Conti', 2005, '10.1/c', version='3.4')]
        self.assertEqual(self.owed(UNITS, old), [])

    def test_sentence_naming_a_textless_source_is_not_an_orphan(self):
        book = {'des_version': '3.6', 'content_type': 'NOT_APPRAISABLE', 'text_basis': 'CITATION_ONLY',
                'citation': {'authors': 'Rosenstiel', 'year': 2016, 'title': 'Contemporary book'}}
        mk = dict(MARKERS[CID]); mk['S4'] = {'markers': ['روزنشتیل']}
        self.mf.write_text(json.dumps({CID: mk}, ensure_ascii=False), encoding='utf-8')
        page = UNITS[:5] + [u(6, 'به گفتهٔ روزنشتیل این قاعده عمومی است.', 5)]
        self.assertEqual(self.owed(page, SOURCES + [book]), [])

    def run_main(self, *argv):
        with patch.object(units, 'split_page', lambda *a, **k: UNITS), \
             patch.object(units, 'is_audio_episode', lambda c: False), \
             patch.object(sys, 'argv', ['des_fidelity_units.py', CID, *argv]), \
             patch.object(units.json, 'loads', wraps=units.json.loads):
            store = {CID: {'scored_at': '2026-11-09', 'sources': SOURCES}}
            with patch.object(units, 'ROOT', self.d):
                (self.d / 'plus').mkdir(exist_ok=True)
                (self.d / 'plus/des-scores.json').write_text(json.dumps(store), encoding='utf-8')
                units.main()

    def test_full_build_refused_but_a_part_3b_recheck_is_not(self):
        self.mf.write_text(json.dumps(MARKERS, ensure_ascii=False), encoding='utf-8')
        texts = self.d / 'texts.json'
        texts.write_text(json.dumps({d: {'source_text': 'One. Two. Three.', 'text_basis': 'FULL_TEXT'}
                                     for d in ('10.1/a', '10.1/b', '10.1/c')}), encoding='utf-8')
        with self.assertRaises(SystemExit) as e:
            self.run_main('--texts', str(texts), '--build', str(self.d / 'b'))
        self.assertIn('u6', str(e.exception))
        self.run_main('--texts', str(texts), '--build', str(self.d / 'b2'), '--only', 'u2')
        self.assertTrue((self.d / 'b2' / 'input-src0.json').exists())


if __name__ == '__main__':
    unittest.main()
