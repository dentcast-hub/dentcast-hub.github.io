"""founder_report in tools/des_fidelity_units.py (founder, 2026-11-27): a sentence one
reference confirms is accepted, but nothing a pooled fold settled may stay unreported."""
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
            c(2, 'MATCHES', 'other sources: S3: REVERSED'),          # a reference says the opposite
            c(3, 'NOT_ASSESSABLE'),                                   # in no reference
            c(4, 'ALTERED', kind='HEDGE_REMOVED'),
            c(5, 'REVERSED'),
            c(6, 'NOT_A_CLAIM')]}
        self.assertEqual([r[0] for r in units.founder_report(pooled)], ['u2', 'u3', 'u4', 'u5'])

    def test_per_source_list_and_nulls(self):
        self.assertEqual([r[0] for r in units.founder_report([None, {'claims': [c(7, 'ALTERED')]}])], ['u7'])
        self.assertEqual(units.founder_report(None), [])


if __name__ == '__main__':
    unittest.main()
