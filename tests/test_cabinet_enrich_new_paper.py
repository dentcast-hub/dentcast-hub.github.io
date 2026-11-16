"""Every paper added to the cabinet arrives full-text enriched.

tools/cabinet_enrich.py freezes a not-yet-catalogued paper's row keyed by DOI;
tools/queue_apply.py installs it under the catalogue id the entry is given and
refuses a new paper with no row; `coverage --check` fails while any catalogue
paper has no row (CI).
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import cabinet_enrich as ce  # noqa: E402
import queue_apply as qa  # noqa: E402

FROZEN = [{'doi': '10.1/new', 'ft_tags': ['implant-position'], 'new_tags': [], 'doc_class': 'systematic_review',
           'off_topic': False, 'off_topic_reason': None, 'catalog_type_ok': True, 'suggested_type': None,
           'text_quality': 'good', 'facts': {'main_result': 'x', 'follow_up': '1 year'},
           'cites_dois': ['10.1/old', '10.1/notincat']}]
P = {'P0001': {'id': 'P0001', 'doi': '10.1/OLD'}, 'P0002': {'id': 'P0002', 'doi': '10.1/new'}}


class InstallFrozenTests(unittest.TestCase):
    def test_row_is_installed_under_its_new_id_with_cited_ids(self):
        results, site = ce.install_frozen('{"id": "P0001", "ft_tags": [], "new_tags": [], "facts": {}, '
                                          '"cites_in_cabinet": []}\n', FROZEN, {'10.1/new': 'P0002'}, P)
        rows = ce.parse_results(results)
        self.assertEqual(sorted(rows), ['P0001', 'P0002'])
        self.assertEqual(rows['P0002']['cites_in_cabinet'], ['P0001'])
        self.assertNotIn('doi', rows['P0002'])
        self.assertNotIn('cites_dois', rows['P0002'])
        s = json.loads(site)['papers']['P0002']
        self.assertEqual(s['t'], ['implant-position'])
        self.assertEqual(s['c'], ['P0001'])
        self.assertEqual(s['f']['follow_up'], '1 year')

    def test_new_paper_without_row_is_refused(self):
        with self.assertRaises(KeyError):
            ce.install_frozen('', FROZEN, {'10.1/other': 'P0003'}, P)


class QueueApplyTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.item = Path(self.tmp.name)
        (self.item / '04-منبع').mkdir()
        self.w = qa.Writes()
        cat = {'papers': list(P.values())}
        self.w.put('dentcast_cabinet_full_catalog.json', json.dumps(cat))
        self.w.put(qa.ENRICH_RESULTS, '')
        self.m = {'catalog': [{'doi': '10.1/new'}]}

    def test_installs_rows_for_new_entries(self):
        (self.item / qa.ENRICH_ROWS).write_text(json.dumps(FROZEN), encoding='utf-8')
        out = qa.enrichment(self.w, self.item, self.m, {'entries': ['P0002']})
        self.assertEqual(out, {'installed': ['P0002']})
        self.assertIn('P0002', ce.parse_results(self.w.text(qa.ENRICH_RESULTS)))
        self.assertIn('P0002', json.loads(self.w.text(qa.ENRICH_SITE))['papers'])

    def test_missing_rows_file_refuses(self):
        with self.assertRaises(qa.QueueRefusal) as ctx:
            qa.enrichment(self.w, self.item, self.m, {'entries': ['P0002']})
        self.assertIn('ENRICHMENT_MISSING', str(ctx.exception.args))

    def test_linked_existing_paper_needs_nothing(self):
        out = qa.enrichment(self.w, self.item, self.m, {'entries': [{'linked': 'P0001'}]})
        self.assertIn('skip', out)


class CoverageTests(unittest.TestCase):
    def test_live_catalogue_is_fully_enriched(self):
        self.assertEqual(ce.missing_ids(), [], 'catalogue papers with no enrichment row; enrich them '
                         '(module 06 Part 2 step 9) before merging')

    def test_coverage_check_exits_nonzero_when_a_paper_is_missing(self):
        with patch.object(ce, 'missing_ids', return_value=['P9999']), patch('sys.stdout'):
            with self.assertRaises(SystemExit) as ctx:
                ce.cmd_coverage(type('A', (), {'check': True})())
        self.assertEqual(ctx.exception.code, 1)


if __name__ == '__main__':
    unittest.main()
