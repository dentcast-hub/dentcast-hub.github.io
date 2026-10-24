"""No omitted/reworded rules; conservative routing and stale-map rejection."""
import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import dentcast_global_rules as rules

class GlobalRulesTests(unittest.TestCase):
    def setUp(self):
        self.manifest, self.blocks = rules.sections()

    def ids(self, paths):
        return {b['id'] for b in rules.select(self.manifest, self.blocks, paths)}

    def test_all_original_bytes_are_preserved_once(self):
        for source in self.manifest['sources']:
            actual = ''.join(b['text'] for b in self.blocks if b['source'] == source['path']).encode()
            self.assertEqual(actual, (ROOT / source['path']).read_bytes())

    def test_initial_load_reduces_bytes_without_omitting_core(self):
        chosen = rules.select(self.manifest, self.blocks)
        self.assertLess(sum(len(b['text'].encode()) for b in chosen), sum(len(b['text'].encode()) for b in self.blocks))
        self.assertIn('site-invariants', self.ids([]))
        self.assertIn('des-display', self.ids([]))
        self.assertIn('repo-core', self.ids([]))

    def test_standard_page_does_not_load_unrelated_account_features(self):
        self.assertNotIn('google-auth', self.ids(['sharehub/share-36.html', 'plus/des-scores.json']))

    def test_pathway_edit_loads_certificate_and_exam_constraints(self):
        self.assertIn('pathway-operations', self.ids(['plus/pathways.json']))

    def test_routine_publication_paths_load_only_core(self):
        core = {b['id'] for b in self.blocks if b['core']}
        for path in ['.dentcast/hashtag-batches/share-41.json', '.dentcast/publication-reports/sharehub-share-41.md']:
            self.assertEqual(self.ids([path]), core)

    def test_home_bundles_loads_core_and_pathway_operations(self):
        core = {b['id'] for b in self.blocks if b['core']}
        self.assertEqual(self.ids(['plus/js/home-bundles.js']), core | {'pathway-operations'})

    def test_episode_loads_audio_constraints(self):
        self.assertIn('audio-hub', self.ids(['episodes/episode-166.html']))

    def test_unknown_shared_code_and_backend_fall_back_to_all(self):
        for path in ['plus-api/src/auth.ts', 'dc-nav.js', 'new-category/new.html', 'unknown.json']:
            self.assertEqual(len(self.ids([path])), len(self.blocks))

    def test_path_union_never_removes_rules(self):
        self.assertLessEqual(self.ids(['episodes/episode-166.html']), self.ids(['episodes/episode-166.html', 'plus/pathways.json']))

    def test_source_change_fails_closed(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for source in self.manifest['sources']:
                path = root / source['path']; path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes((ROOT / source['path']).read_bytes())
            path = root / rules.MANIFEST; path.write_text(json.dumps(self.manifest))
            (root / self.manifest['sources'][0]['path']).write_text('changed')
            with self.assertRaisesRegex(ValueError, 'MAP_STALE'):
                rules.sections(root)

    def test_no_path_escape(self):
        with self.assertRaisesRegex(ValueError, 'RELATIVE_PATH'):
            self.ids(['../outside'])

if __name__ == '__main__': unittest.main()
