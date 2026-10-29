"""DES v3.5 appendix rules 10, 12-14 in tools/des_fidelity_units.py, and the
version gate that keeps every pre-3.5 record's assignment where it was."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import des_fidelity_units as units

CID = 'sharehub/share-test'


def src(author, year, doi, version='3.5', basis='FULL_TEXT'):
    return {'des_version': version, 'content_type': 'PRIMARY', 'text_basis': basis,
            'citation': {'authors': author, 'year': year, 'doi': doi, 'title': f'{author} paper'}}


def u(i, text, para, heading=False):
    d = {'id': f'u{i}', 'text': text, 'para': para}
    if heading:
        d['heading'] = True
    return d


SOURCES = [src('Okeson', 1988, '10.1/a'), src('Okeson', 2020, '10.1/b'), src('Conti', 2005, '10.1/c')]
UNITS = [u(1, 'Title', 1, True),
         u(2, 'در مطالعهٔ اوکیسون ۱۹۸۸ هشتاد درصد بدون درد بودند.', 2),
         u(3, 'این تفاوت ماندگار نبود.', 2),
         u(4, 'به گفتهٔ اوکیسون ۲۰۲۰ سازگاری هشت تا ده هفته طول می‌کشد.', 3),
         u(5, 'در مطالعهٔ کونتی درد زودتر کم شد.', 4),
         u(6, 'جمله‌ای که هیچ منبعی را نام نمی‌برد.', 5)]
MARKERS = {CID: {'S1': {'markers': ['اوکیسون'], 'disambiguators': ['1988']},
                 'S2': {'markers': ['اوکیسون'], 'disambiguators': ['2020']},
                 'S3': {'markers': ['کونتی']}}}


class Tmp(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.d = Path(self.tmp.name)
        self.mf = self.d / 'markers.json'
        self.pd = self.d / 'plans'
        self.p1 = patch.object(units, 'MARKERS_FILE', self.mf)
        self.p2 = patch.object(units, 'PLANS_DIR', self.pd)
        self.p1.start(); self.p2.start()

    def tearDown(self):
        self.p1.stop(); self.p2.stop(); self.tmp.cleanup()

    def write_plan(self, rec):
        p = units.plan_path(CID)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(rec, ensure_ascii=False), encoding='utf-8')


class MarkerTests(Tmp):
    def test_persian_marker_whole_word_and_persian_digits(self):
        self.assertTrue(units.names_v35('اوکیسون ۱۹۸۸ گفت', {'1988'}))
        self.assertTrue(units.names_v35('اوکیسون گفت', {'اوکیسون'}))
        self.assertFalse(units.names_v35('اوکیسونی گفت', {'اوکیسون'}))
        self.assertFalse(units.names_v35('a Contiguous zone', {'Conti'}))

    def test_declared_markers_and_disambiguators(self):
        self.mf.write_text(json.dumps(MARKERS, ensure_ascii=False), encoding='utf-8')
        mode, plan = units.assign(UNITS, SOURCES, CID)
        self.assertEqual(mode, 'SOURCE')
        self.assertEqual(plan[0], ['u2', 'u3'])   # 1988 only, carry within the paragraph
        self.assertEqual(plan[1], ['u4'])         # 2020 only — the shared author no longer doubles it
        self.assertEqual(plan[2], ['u5'])
        self.assertNotIn('u6', sum(plan.values(), []))

    def test_without_declared_markers_persian_names_nothing(self):
        mode, plan = units.assign(UNITS, SOURCES, CID)
        self.assertEqual(mode, 'POOLED')

    def test_bad_tag_refused(self):
        self.mf.write_text(json.dumps({CID: {'s1': {'markers': ['x']}}}), encoding='utf-8')
        with self.assertRaises(SystemExit):
            units.assign(UNITS, SOURCES, CID)

    def test_pre_35_records_ignore_sidecar_and_plan(self):
        old = [dict(s, des_version='3.4') for s in SOURCES]
        self.mf.write_text(json.dumps(MARKERS, ensure_ascii=False), encoding='utf-8')
        self.write_plan({'content_id': CID, 'origin': 'founder', 'decision': {'status': 'confirmed'},
                         'plan': {'0': ['u6']}})
        self.assertEqual(units.assign(UNITS, old, CID), units.assign(UNITS, old))


class PlanTests(Tmp):
    def test_founder_plan_replaces_assignment(self):
        self.write_plan({'content_id': CID, 'origin': 'founder', 'decision': {'status': 'confirmed'},
                         'plan': {'0': ['u3', 'u2'], '2': ['u5', 'u6']}})
        self.assertEqual(units.assign(UNITS, SOURCES, CID), ('SOURCE', {0: ['u2', 'u3'], 2: ['u5', 'u6']}))

    def test_unconfirmed_founder_plan_refused(self):
        self.write_plan({'content_id': CID, 'origin': 'founder', 'plan': {'0': ['u2']}})
        with self.assertRaises(SystemExit):
            units.assign(UNITS, SOURCES, CID)

    def test_unknown_unit_or_origin_refused(self):
        for rec in ({'content_id': CID, 'origin': 'founder', 'decision': {'status': 'confirmed'}, 'plan': {'0': ['u99']}},
                    {'content_id': CID, 'origin': 'agent', 'plan': {'0': ['u2']}},
                    {'content_id': CID, 'origin': 'orphan_sweep', 'plan': {'0': ['u2']}},
                    {'content_id': 'other', 'origin': 'founder', 'decision': {'status': 'confirmed'}, 'plan': {}}):
            self.write_plan(rec)
            with self.assertRaises(SystemExit):
                units.assign(UNITS, SOURCES, CID)


class OrphanTests(unittest.TestCase):
    def test_orphans_are_unjudged_or_silent_body_units(self):
        voted = {0: {'claims': [{'id': 'u2', 'verdict': 'MATCHES'}, {'id': 'u3', 'verdict': 'NOT_IN_SOURCE'}]},
                 2: {'claims': [{'id': 'u5', 'verdict': 'AUTHOR_VIEW'}, {'id': 'u3', 'verdict': 'NOT_ASSESSABLE'}]}}
        got = [x['id'] for x in units.orphan_units(UNITS, {}, voted)]
        self.assertEqual(got, ['u3', 'u4', 'u6'])   # u1 heading, u2 judged, u5 excluded by design


class RebaseGrowthTests(unittest.TestCase):
    def claim(self, i, verdict='MATCHES'):
        return {'id': f'u{i}', 'claim_quote': UNITS[i - 1]['text'], 'verdict': verdict}

    def test_growth_needs_every_added_unit_rechecked(self):
        base = {'claims': [self.claim(2), self.claim(4)]}
        page = [UNITS[1], UNITS[2], UNITS[3]]
        runs = [{'claims': [self.claim(3, 'NOT_IN_SOURCE')]}, {'claims': [self.claim(3, 'NOT_IN_SOURCE')]}]
        out = units.rebase(base, runs, page, 0)
        self.assertEqual([c['id'] for c in out[0]['claims']], ['u2', 'u3', 'u4'])
        with self.assertRaises(SystemExit):
            units.rebase(base, [], page, 0)

    def test_dropped_or_reordered_ids_still_refused(self):
        base = {'claims': [self.claim(2), self.claim(4)]}
        runs = [{'claims': [self.claim(3)]}]
        with self.assertRaises(SystemExit):
            units.rebase(base, runs, [UNITS[2], UNITS[3]], 0)
        with self.assertRaises(SystemExit):
            units.rebase(base, runs, [UNITS[3], UNITS[2], UNITS[1]], 0)


class SweepCliTests(Tmp):
    def run_main(self, *args):
        rec = {CID: {'sources': SOURCES}}
        (self.d / 'plus').mkdir(exist_ok=True)
        (self.d / 'plus/des-scores.json').write_text(json.dumps(rec), encoding='utf-8')
        with patch.object(units, 'ROOT', self.d), patch.object(units, 'split_page', return_value=UNITS), \
                patch.object(sys, 'argv', ['x', CID, *args]):
            units.main()

    def test_sweep_records_found_units_and_reports_absent(self):
        self.mf.write_text(json.dumps(MARKERS, ensure_ascii=False), encoding='utf-8')
        run = self.d / 'run'
        run.mkdir()
        texts = {s['citation']['doi']: {'text_basis': 'FULL_TEXT', 'source_text': f'Text of S{n}. Pain fell early.'}
                 for n, s in enumerate(SOURCES, 1)}
        (self.d / 'texts.json').write_text(json.dumps(texts), encoding='utf-8')
        for k, ids in {0: ['u2', 'u3'], 1: ['u4'], 2: ['u5']}.items():
            (run / f'voted-src{k}.json').write_text(json.dumps(
                {'claims': [{'id': i, 'verdict': 'NOT_IN_SOURCE' if i == 'u3' else 'MATCHES'} for i in ids]}))
        self.run_main('--orphans', str(run), '--texts', str(self.d / 'texts.json'))
        blk = json.loads((run / 'orphans-input.json').read_text(encoding='utf-8'))
        self.assertEqual([x['id'] for x in blk['units']], ['u3', 'u6'])
        self.assertEqual(len(blk['sources']), 3)
        (run / 'orphans.json').write_text(json.dumps({'u3': {'found': None, 'note': 'nowhere'}}))
        with self.assertRaises(SystemExit):   # u6 unanswered
            self.run_main('--sweep', str(run))
        (run / 'orphans.json').write_text(json.dumps({'u3': {'found': None, 'note': 'nowhere'},
                                                      'u6': {'found': 'S3', 'source_quote': 'not in the text'}}))
        with self.assertRaises(SystemExit):   # quote must be verbatim
            self.run_main('--sweep', str(run))
        (run / 'orphans.json').write_text(json.dumps({'u3': {'found': None, 'note': 'nowhere'},
                                                      'u6': {'found': 'S3', 'source_quote': 'Pain fell early.'}}))
        self.run_main('--sweep', str(run))
        rec = json.loads(units.plan_path(CID).read_text(encoding='utf-8'))
        self.assertEqual(rec['origin'], 'orphan_sweep')
        self.assertEqual(rec['plan']['2'], ['u5', 'u6'])
        self.assertEqual(rec['sweep'][0]['absent'], ['u3'])
        self.assertEqual(units.assign(UNITS, SOURCES, CID)[1][2], ['u5', 'u6'])

    def test_sweep_refused_on_pre_35_records(self):
        old = [dict(s, des_version='3.4') for s in SOURCES]
        rec = {CID: {'sources': old}}
        (self.d / 'plus').mkdir(exist_ok=True)
        (self.d / 'plus/des-scores.json').write_text(json.dumps(rec), encoding='utf-8')
        with patch.object(units, 'ROOT', self.d), patch.object(units, 'split_page', return_value=UNITS), \
                patch.object(sys, 'argv', ['x', CID, '--sweep', str(self.d)]):
            with self.assertRaises(SystemExit):
                units.main()


class LiveRecordsUnchanged(unittest.TestCase):
    def test_share_41_and_42_assignments(self):
        scores = json.loads((ROOT / 'plus/des-scores.json').read_text(encoding='utf-8'))
        for cid, want in (('sharehub/share-41', {0: 58}), ('sharehub/share-42', {0: 12, 1: 12, 2: 2})):
            s = scores[cid]['sources']
            mode, plan = units.assign(units.split_page(cid, s), s, cid)
            self.assertEqual({k: len(v) for k, v in plan.items()}, want, cid)


class KnowledgeFileTests(unittest.TestCase):
    """des-vX-knowledge.md is the system prompt: the spec cut at its appendix,
    byte for byte, so every run's prompt digest is the same file."""

    def test_knowledge_is_the_spec_without_its_appendix(self):
        for k in sorted((ROOT / '.dentcast').glob('des-v*-knowledge.md')):
            v = k.name[len('des-v'):-len('-knowledge.md')]
            spec = ROOT / '.dentcast' / f'dentcast-evidence-score-v{v}.md'
            if not spec.exists():
                continue
            full = spec.read_bytes()
            cut = full.find('## Appendix — pipeline contract'.encode())
            self.assertGreater(cut, 0, spec.name)
            self.assertEqual(k.read_bytes(), full[:cut].rstrip(b'\n') + b'\n', k.name)


if __name__ == '__main__':
    unittest.main()
