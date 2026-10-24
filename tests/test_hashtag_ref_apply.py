"""--apply on a not-yet-published article; --check on canonical tags filed as aliases."""
import io
from contextlib import redirect_stdout, redirect_stderr
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


class CanonicalAliasCheckTests(unittest.TestCase):
    setUp = ApplyNewArticleTests.setUp

    def check(self, mutate=None):
        path = self.dir / 'dentcast-hashtag-reference.json'
        data = json.loads(path.read_text(encoding='utf-8'))
        if mutate:
            mutate({c['tag']: c for c in data['concepts']})
        path.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
        out = io.StringIO()
        with redirect_stdout(out), redirect_stderr(io.StringIO()) as err:
            try:
                ref.cmd_check()
                code = 0
            except SystemExit as exc:
                code = exc.code
        return code, out.getvalue() + err.getvalue()

    def test_live_library_passes_and_rubber_dam_is_no_longer_an_isolation_alias(self):
        code, output = self.check()
        self.assertEqual(code, 0, output)
        self.assertNotIn('رابردم', output)
        concepts = {c['tag']: c for c in json.loads((ROOT / 'dentcast-hashtag-reference.json').read_text(encoding='utf-8'))['concepts']}
        self.assertIn('#رابردم', concepts)
        self.assertFalse({'رابردم', 'رابر دم'} & set(concepts['#ایزولاسیون']['aliases']))

    def test_new_alias_equal_to_another_canonical_fails(self):
        code, output = self.check(lambda c: c['#ایزولاسیون']['aliases'].append('رابردم'))
        self.assertEqual(code, 1)
        self.assertIn('alias "رابردم" of #ایزولاسیون is the canonical tag #رابردم', output)

    def test_known_pairs_are_reported_as_warnings(self):
        code, output = self.check()
        self.assertEqual(code, 0)
        self.assertIn('known canonical/alias collision', output)
        self.assertIn('#اسکن_دیجیتال', output)


if __name__ == '__main__':
    unittest.main()
