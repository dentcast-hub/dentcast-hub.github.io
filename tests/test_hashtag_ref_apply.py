"""--apply on a not-yet-published article points to the step-5 route."""
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import hashtag_ref as ref


class ApplyNewArticleTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.dir = Path(temp.name)
        for name in ('dentcast-brain.json', 'dentcast-hashtag-reference.json'):
            shutil.copyfile(ROOT / name, self.dir / name)
        for name, value in (('BRAIN', 'dentcast-brain.json'), ('REF', 'dentcast-hashtag-reference.json')):
            patcher = patch.object(ref, name, self.dir / value)
            patcher.start()
            self.addCleanup(patcher.stop)
        self.tag = json.loads((ROOT / 'dentcast-hashtag-reference.json').read_text(encoding='utf-8'))['concepts'][0]['tag']

    def batch(self, articles):
        path = self.dir / 'batch.json'
        path.write_text(json.dumps({'type': 'sharehub', 'concepts': [], 'articles': articles}), encoding='utf-8')
        return str(path)

    def test_unknown_article_names_the_empty_articles_route(self):
        before = (self.dir / 'dentcast-brain.json').read_bytes()
        with self.assertRaises(SystemExit) as ctx:
            ref.cmd_apply(self.batch({'sharehub/share-99999': [self.tag]}))
        message = str(ctx.exception.code)
        for term in ('no brain entry for sharehub/share-99999', '"articles": {}', 'step 5',
                     '--sync', 'build_plus_index.mjs', '--check'):
            self.assertIn(term, message)
        self.assertEqual(before, (self.dir / 'dentcast-brain.json').read_bytes())


if __name__ == '__main__':
    unittest.main()
