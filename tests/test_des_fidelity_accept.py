"""module 08 «Acceptance is mechanical» (founder 2026-11-09): tools/des_fidelity_units.py
accept() takes any agent's FIDELITY result on what can be checked, and on nothing else."""
import copy
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import des_fidelity_units as units

CID = 'sharehub/share-test'
SRC = [{'des_version': '3.6', 'content_type': 'PRIMARY', 'text_basis': 'ABSTRACT_ONLY',
        'citation': {'authors': 'A', 'year': 2024, 'doi': '10.1/x', 'title': 'A paper'}}]
TEXT = 'Implants failed less often. Bone loss was small in both groups. Patients were satisfied.'
TEXTS = {'10.1/x': {'source_text': TEXT, 'text_basis': 'ABSTRACT_ONLY'}}
UNITS = [{'id': 'u1', 'text': 'ایمپلنت‌ها کمتر شکست خوردند.', 'para': 1},
         {'id': 'u2', 'text': 'تحلیل استخوان در هر دو گروه کم بود.', 'para': 1},
         {'id': 'u3', 'text': 'بیماران راضی بودند.', 'para': 2}]
PLAN = {0: ['u1', 'u2', 'u3']}


def claim(u, verdict, quote, kind=None):
    return {'id': u['id'], 'claim_quote': u['text'], 'verdict': verdict, 'change_kind': kind,
            'source_quote': quote, 'source_ref': None, 'note': ''}


def good():
    claims = [claim(UNITS[0], 'MATCHES', 'Implants failed less often.'),
              claim(UNITS[1], 'MATCHES', 'Bone loss was small in both groups.'),
              claim(UNITS[2], 'MATCHES', 'Patients were satisfied.')]
    return {'des_version': '3.6', 'mode': 'FIDELITY', 'scope': 'SOURCE', 'text_basis': 'ABSTRACT_ONLY',
            'claims': claims,
            'counts': {'matches': 3, 'altered': 0, 'reversed': 0, 'not_in_source': 0, 'not_assessable': 0,
                       'author_view': 0, 'not_a_claim': 0},
            'assessable': 3, 'fidelity_score': 100, 'level': 'HIGH', 'provisional': True,
            'source_conclusion': 'Patients were satisfied.', 'fact_fa': '', 'interpretation_fa': None}


def run(packet):
    return units.accept(CID, SRC, UNITS, 'SOURCE', PLAN, packet, TEXTS)


class AcceptTests(unittest.TestCase):
    def test_valid_result_is_accepted_without_any_receipt(self):
        for packet in (good(), [good()], {'src0': good()}):
            rep = run(packet)
            self.assertEqual(rep.failures, [], rep.render())

    def test_quote_not_in_source_is_refused(self):
        f = good(); f['claims'][1]['source_quote'] = 'Bone loss was large.'
        self.assertTrue(run(f).failures)

    def test_claim_quote_off_the_page_is_refused(self):
        f = good(); f['claims'][0]['claim_quote'] = 'ایمپلنت‌ها هرگز شکست نخوردند.'
        self.assertTrue(run(f).failures)

    def test_missing_unit_is_refused(self):
        f = good(); f['claims'] = f['claims'][:2]
        self.assertTrue(run(f).failures)

    def test_wrong_arithmetic_is_refused(self):
        f = good(); f['fidelity_score'] = 90
        self.assertTrue(run(f).failures)

    def test_altered_without_kind_is_refused(self):
        f = copy.deepcopy(good()); f['claims'][0]['verdict'] = 'ALTERED'
        self.assertTrue(run(f).failures)


if __name__ == '__main__':
    unittest.main()


import json
import tempfile
from unittest.mock import patch


class PacketFlowTests(unittest.TestCase):
    """The handoff: agent A packs one file, agent B accepts and installs it."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name) / 'site'
        (self.root / 'plus').mkdir(parents=True)
        self.store = self.root / 'plus/des-scores.json'
        self.out = Path(self.tmp.name) / 'handoff'
        self.out.mkdir()
        (self.out / 'texts.json').write_text(json.dumps(TEXTS), encoding='utf-8')
        (self.out / 'fid.json').write_text(json.dumps(good(), ensure_ascii=False), encoding='utf-8')
        self.patches = [patch.object(units, 'ROOT', self.root),
                        patch.object(units, 'split_page', lambda *a, **k: UNITS),
                        patch.object(units, 'assign', lambda *a, **k: ('SOURCE', PLAN))]
        for p in self.patches:
            p.start()

    def tearDown(self):
        for p in self.patches:
            p.stop()
        self.tmp.cleanup()

    def main(self, *argv):
        with patch.object(sys, 'argv', ['des_fidelity_units.py', CID, *argv]):
            units.main()

    def test_pack_then_accept_and_install_elsewhere(self):
        self.store.write_text(json.dumps({CID: {'scored_at': '2026-11-09', 'sources': SRC}}), encoding='utf-8')
        pk = self.out / 'packet.json'
        self.main('--texts', str(self.out / 'texts.json'), '--fidelity', str(self.out / 'fid.json'), '--pack', str(pk))
        packet = json.loads(pk.read_text(encoding='utf-8'))
        self.assertEqual(packet['kind'], units.PACKET_KIND)
        self.assertEqual(packet['texts'], TEXTS)
        # the receiving side: no record yet, no texts.json — the packet is all it gets
        self.store.write_text('{\r\n}\r\n', encoding='utf-8')
        self.main('--accept', str(pk), '--install')
        rec = json.loads(self.store.read_text(encoding='utf-8'))[CID]
        self.assertEqual(rec['fidelity'], [good()])
        self.assertIn(b'\r\n', self.store.read_bytes())

    def test_pack_refuses_a_failing_result_and_a_path_in_the_repo(self):
        self.store.write_text(json.dumps({CID: {'scored_at': '2026-11-09', 'sources': SRC}}), encoding='utf-8')
        bad = good(); bad['fidelity_score'] = 70
        (self.out / 'bad.json').write_text(json.dumps(bad, ensure_ascii=False), encoding='utf-8')
        with self.assertRaises(SystemExit):
            self.main('--texts', str(self.out / 'texts.json'), '--fidelity', str(self.out / 'bad.json'),
                      '--pack', str(self.out / 'p.json'))
        self.assertFalse((self.out / 'p.json').exists())
        with self.assertRaises(SystemExit):
            self.main('--texts', str(self.out / 'texts.json'), '--fidelity', str(self.out / 'fid.json'),
                      '--pack', str(self.root / 'p.json'))

    def test_packet_for_another_page_is_refused(self):
        pk = self.out / 'other.json'
        pk.write_text(json.dumps({'kind': units.PACKET_KIND, 'content_id': 'sharehub/share-x',
                                  'des': {'sources': SRC}, 'fidelity': [good()], 'texts': TEXTS}), encoding='utf-8')
        with self.assertRaises(SystemExit):
            self.main('--accept', str(pk))

    def test_des_quote_not_in_text_is_refused(self):
        s = copy.deepcopy(SRC)
        s[0]['s_design'] = {'evidence_quote': 'A randomised trial of 400 patients.'}
        pk = self.out / 'p.json'
        pk.write_text(json.dumps({'kind': units.PACKET_KIND, 'content_id': CID, 'des': {'sources': s},
                                  'fidelity': [good()], 'texts': TEXTS}, ensure_ascii=False), encoding='utf-8')
        with self.assertRaises(SystemExit):
            self.main('--accept', str(pk))

    def test_pack_from_a_des_file_without_a_stored_record(self):
        (self.out / 'des.json').write_text(json.dumps({'scored_at': '2026-11-09', 'sources': SRC}), encoding='utf-8')
        pk = self.out / 'packet.json'
        self.main('--texts', str(self.out / 'texts.json'), '--des', str(self.out / 'des.json'),
                  '--fidelity', str(self.out / 'fid.json'), '--pack', str(pk))
        self.assertEqual(json.loads(pk.read_text(encoding='utf-8'))['des']['sources'], SRC)
