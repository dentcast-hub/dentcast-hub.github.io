"""founder_report in tools/des_fidelity_units.py (founder, 2026-11-27): only a sentence the
reference addresses and the page says differently (ALTERED, REVERSED) keeps a page below a full match."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import des_fidelity_units as units


def c(i, verdict, note='', kind=None):
    return {'id': f'u{i}', 'claim_quote': f'جمله {i}', 'verdict': verdict, 'change_kind': kind,
            'source_ref': 'S1', 'note': note}


class FounderReport(unittest.TestCase):
    def test_pooled_fold_hides_nothing(self):
        pooled = {'scope': 'POOLED', 'claims': [
            c(1, 'MATCHES', 'other sources: S2: MATCHES'),           # confirmed: silent
            c(2, 'MATCHES', 'other sources: S3: REVERSED'),          # one reference confirms: a match
            c(3, 'NOT_ASSESSABLE'),                                   # no reference addresses it: not reported
            c(4, 'ALTERED', kind='HEDGE_REMOVED'),
            c(5, 'REVERSED'),
            c(6, 'NOT_A_CLAIM')]}
        self.assertEqual([r[0] for r in units.founder_report(pooled)], ['u4', 'u5'])

    def test_per_source_list_and_nulls(self):
        self.assertEqual([r[0] for r in units.founder_report([None, {'claims': [c(7, 'ALTERED')]}])], ['u7'])
        self.assertEqual(units.founder_report(None), [])


class FidelityGate(unittest.TestCase):
    """C.6 close refuses until every flagged sentence has the founder's answer (M3b)."""
    def test_unanswered_flag_stops_c6_and_an_answer_releases_it(self):
        import dentcast_publish_shortcuts as sc
        rec = {'scope': 'POOLED', 'claims': [c(1, 'MATCHES'), c(2, 'ALTERED', kind='HEDGE_REMOVED')]}
        with self.assertRaises(Exception) as e:
            sc.fidelity_gate([], rec)
        self.assertIn('FIDELITY_FOUNDER_DECISION_REQUIRED', str(e.exception))
        ok = [{'kind': 'fidelity_founder_decision_v1', 'units': ['u2'], 'answer': 'ادامه بده'}]
        self.assertEqual([r[0] for r in sc.fidelity_gate(ok, rec)], ['u2'])

    def test_full_match_passes(self):
        import dentcast_publish_shortcuts as sc
        self.assertEqual(sc.fidelity_gate([], {'claims': [c(1, 'MATCHES')]}), [])


if __name__ == '__main__':
    unittest.main()
