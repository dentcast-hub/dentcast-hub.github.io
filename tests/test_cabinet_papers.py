"""plus/cabinet-papers.json must match its bridge and the library.

The site-index workflow regenerates the file on main and only warns there, so
a stale bridge key (a site tag renamed later), a bridge row that yields no
paper or a stale exclusion is caught here, on the branch that causes it.
"""
import json
import os
import subprocess
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class CabinetPapersTest(unittest.TestCase):
    def test_output_is_current_and_bridge_is_clean(self):
        r = subprocess.run([sys.executable, 'tools/build_cabinet_papers.py', '--check'],
                           cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr + r.stdout)

    def test_every_listed_paper_has_a_link(self):
        with open(os.path.join(ROOT, 'plus', 'cabinet-papers.json'), encoding='utf-8') as f:
            out = json.load(f)
        for key, ids in out['byTag'].items():
            self.assertTrue(ids, key)
            for pid in ids:
                p = out['papers'][pid]
                self.assertTrue(p.get('v') or p.get('d'), pid)


if __name__ == '__main__':
    unittest.main()
