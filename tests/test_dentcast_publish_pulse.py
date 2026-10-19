"""Pulse position/cap/order gates and concise-report contract."""
from pathlib import Path
import sys
import unittest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import verify_publish as vp

def home(ids):
    return '<ul class="dc-pulse-list">'+''.join('<li><a href="/'+str(i)+'">item '+str(i)+'</a></li>' for i in ids)+'</ul>'

class PulseTests(unittest.TestCase):
    def report(self, ids, previous=None, sweep=False):
        rep=vp.Report('fixture')
        vp.check_pulse(rep,home(ids),'/new',sweep,home(previous) if previous is not None else None)
        return rep

    def test_insert_top_remove_bottom(self):
        self.assertFalse(self.report(['new',1,2,3,4,5,6],[1,2,3,4,5,6,7]).failures)
    def test_nine_lines_fail(self):
        self.assertTrue(self.report(['new',1,2,3,4,5,6,7,8]).failures)
    def test_wrong_position_fails(self):
        self.assertTrue(self.report([1,'new',2,3,4,5,6]).failures)
    def test_wrong_removed_line_fails(self):
        self.assertTrue(self.report(['new',1,2,3,4,5,7],[1,2,3,4,5,6,7]).failures)
    def test_reordered_survivors_fail(self):
        self.assertTrue(self.report(['new',2,1,3,4,5,6],[1,2,3,4,5,6,7]).failures)
    def test_duplicate_new_link_fails(self):
        self.assertTrue(self.report(['new','new',2,3,4,5,6]).failures)
    def test_retained_old_item_can_be_lower_in_sweep(self):
        self.assertFalse(self.report([1,'new',2,3,4,5,6],sweep=True).failures)
    def test_already_published_target_is_not_inserted_again(self):
        self.assertFalse(self.report(['new',1,2,3,4,5,6],['new',1,2,3,4,5,6]).failures)
    def test_actual_homepage_has_seven_items(self):
        self.assertEqual(len(vp.pulse_items((ROOT/'index.html').read_text())),7)
    def test_approval_and_report_rules_remain_explicit(self):
        text=(ROOT/'.dentcast/workflows/agent-parity.md').read_text()
        self.assertNotIn('یک سوال در یک پیام',text)
        self.assertNotIn('این‌ها را نه batch کن',text)
        self.assertIn('یک «بله» مبهم را به همهٔ موارد تعمیم نده',text)
        self.assertIn('پروتکل بستهٔ تصمیم‌گیری علمی DES/Fidelity عیناً پابرجاست',text)
        self.assertIn('گزارش فنیِ قابل‌بازیابی',text)

if __name__=='__main__':unittest.main()
