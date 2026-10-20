"""Regressions for current-run execution, committed builder scope and transfer races."""
import copy
from contextlib import redirect_stderr
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

import test_dentcast_publish_handoff as f
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc
from dentcast_text_io import write_text

ROOT = Path(__file__).resolve().parents[1]


class BaselineTests(unittest.TestCase):
    setUp = f.HandoffTests.setUp
    start = f.HandoffTests.start
    def test_builder_not_initially_declared_survives_commit_and_fresh_checkout(self):
        initial = self.start()
        page = self.root / 'pillar/digital/index.html'
        page.parent.mkdir(parents=True)
        page.write_bytes(b'<html>builder result</html>\r\n')
        result = h.save(self.root, self.p, expected=initial['sha256'], note='Reviewed actual builder output')
        self.assertIn('pillar/digital/index.html', h.load_state(self.root)[0]['publication']['target_paths'])
        f.run(self.root, 'add', h.STATE_PATH, 'pillar/digital/index.html')
        f.run(self.root, 'commit', '-m', 'API-equivalent tree: output plus exact checkpoint')
        f.run(self.root, 'push', 'origin', 'main')
        self.assertEqual(h.inspect(self.root)['issues'], [])
        clone = self.base / 'fresh'
        f.run(self.base, 'clone', str(self.remote), str(clone))
        self.assertEqual(h.inspect(clone)['issues'], [])
        (clone / 'pillar/digital/index.html').write_text('real change')
        view = h.inspect(clone)
        self.assertIn('WORK_OR_INDEX_CHANGED', view['issues'])
        self.assertIn('pillar/digital/index.html', view['changed_paths']['files'])
        self.assertNotEqual(result['sha256'], initial['sha256'])

    def test_unknown_new_path_is_preserved_and_cannot_be_adopted_by_generic_note(self):
        initial = self.start()
        path = self.root / 'other-person.txt'
        path.write_text('concurrent work')
        with self.assertRaisesRegex(h.Blocked, 'UNREVIEWED_PATHS_OUTSIDE_PUBLICATION'):
            h.save(self.root, self.p, expected=initial['sha256'], note='generic review')
        self.assertEqual(path.read_text(), 'concurrent work')

    def test_commit_inventory_remains_watched_even_for_legacy_undeclared_output(self):
        self.start()
        (self.root / 'legacy-output.json').write_text('{}')
        f.run(self.root, 'add', h.STATE_PATH, 'legacy-output.json')
        f.run(self.root, 'commit', '-m', 'legacy commit with undeclared output')
        # Observing the inventory does not bless semantic work or complete steps.
        view = h.inspect(self.root)
        self.assertIn('UNREVIEWED_COMMITTED_PATHS:legacy-output.json', view['issues'])
        self.assertFalse(view['publication_completed'])
        (self.root / 'legacy-output.json').write_text('{"changed":true}')
        self.assertIn('WORK_OR_INDEX_CHANGED', h.inspect(self.root)['issues'])

    def test_delivery_plan_has_only_changed_objects_and_no_bodies(self):
        base = f.run(self.root, 'rev-parse', 'HEAD').stdout.strip()
        (self.root / 'note.html').write_bytes(b'private payload')
        f.run(self.root, 'add', 'note.html')
        f.run(self.root, 'commit', '-m', 'changed object')
        plan = lc.delivery_plan(self.root, base, 3)
        self.assertEqual([e['path'] for e in plan['entries']], ['note.html'])
        self.assertEqual(plan['oversized_paths'], ['note.html'])
        self.assertEqual(plan['tree_sha'], f.run(self.root, 'rev-parse', 'HEAD^{tree}').stdout.strip())
        self.assertNotIn('private payload', json.dumps(plan))

    def test_untracked_handoff_is_not_in_deliverable_tree(self):
        self.start()
        base = f.run(self.root, 'rev-parse', 'HEAD').stdout.strip()
        with self.assertRaisesRegex(h.Blocked, 'COMMIT_CURRENT_HANDOFF_BEFORE_DELIVERY_PLAN'):
            lc.delivery_plan(self.root, base, 1000)

    def test_identical_transition_is_rejected_without_rewriting_checkpoint(self):
        self.p['steps'] = lc.plan()
        initial = self.start()
        started = lc.step(self.root, initial['sha256'], 'rules', 'started', [], None)
        before = (self.root/h.STATE_PATH).read_bytes()
        with self.assertRaisesRegex(h.Blocked, 'NO_STEP_STATE_CHANGE'):
            lc.step(self.root, started['sha256'], 'rules', 'started', [], None)
        self.assertEqual(before, (self.root/h.STATE_PATH).read_bytes())

    def test_older_receipt_without_new_helper_dependency_requires_invalidation(self):
        self.start()
        f.run(self.root, 'rm', 'tools/dentcast_text_io.py', 'tools/text_io.mjs')
        f.run(self.root, 'add', h.STATE_PATH)
        f.run(self.root, 'commit', '-m', 'older baseline without introduced helpers')
        for name in ('tools/dentcast_text_io.py', 'tools/text_io.mjs'):
            (self.root/name).write_text('new helper dependency')
        view = h.inspect(self.root)
        self.assertIn('WORKFLOW_CHANGED', view['issues'])
        self.assertIn('tools/dentcast_text_io.py', view['changed_paths']['workflow'])

    def test_discovery_requires_explicit_recovery_without_network_or_checkout(self):
        err = io.StringIO()
        with patch('dentcast_publish_discovery.GitHubReader') as reader, redirect_stderr(err):
            code = h.main(['discover', '--repository', 'owner/repo'])
        self.assertEqual(code, 2)
        self.assertIn('RECOVERY_REQUEST_REQUIRED', err.getvalue())
        reader.assert_not_called()



class PrRaceTests(unittest.TestCase):
    def setUp(self):
        self.pr = {'state': 'open', 'merged': False, 'merged_at': None,
                   'head': {'ref': 'publish/test', 'sha': 'a'*40, 'repo': {'full_name': 'owner/repo'}},
                   'base': {'ref': 'main', 'sha': 'b'*40, 'repo': {'full_name': 'owner/repo'}}}

    def read(self, url):
        if '/pulls/' in url:
            return copy.deepcopy(self.pr)
        return {'object': {'sha': 'b'*40 if url.endswith('/main') else 'a'*40}}

    def check(self, read=None):
        return lc.check_pr('owner/repo', 939, 'a'*40, 'b'*40, 'publish/test', read or self.read)

    def test_open_unchanged_pr(self):
        self.assertEqual(self.check()['status'], 'delivery_target_checked')

    def test_user_merged_pr_blocks_old_delivery(self):
        self.pr.update(state='closed', merged=True)
        with self.assertRaisesRegex(h.Blocked, 'PR_CLOSED_OR_MERGED'):
            self.check()

    def test_advanced_head_or_destination_blocks(self):
        for side, message in [('head', 'PR_HEAD_CHANGED'), ('base', 'PR_BASE_CHANGED')]:
            with self.subTest(side=side):
                old = self.pr[side]['sha']; self.pr[side]['sha'] = 'c'*40
                with self.assertRaisesRegex(h.Blocked, message):
                    self.check()
                self.pr[side]['sha'] = old

    def test_merge_during_ref_reads_blocks(self):
        calls = []
        def read(url):
            calls.append(url)
            if len(calls) == 4:
                self.pr.update(state='closed', merged=True)
            return self.read(url)
        with self.assertRaisesRegex(h.Blocked, 'PR_CHANGED_DURING_CHECK'):
            self.check(read)
        self.assertEqual(len(calls), 4)


class NewlineTests(unittest.TestCase):
    def test_python_and_javascript_preserve_crlf_and_lf_and_reject_mixed(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'output.txt'
            for ending in [b'\n', b'\r\n']:
                path.write_bytes(b'old' + ending)
                write_text(path, 'new\n')
                self.assertEqual(path.read_bytes(), b'new' + ending)
                script = "import {writeText} from " + json.dumps((ROOT/'tools/text_io.mjs').as_uri()) + "; writeText(process.argv[1], 'next\\n');"
                subprocess.run(['node', '--input-type=module', '-e', script, str(path)], check=True)
                self.assertEqual(path.read_bytes(), b'next' + ending)
            path.write_bytes(b'a\r\nb\n')
            with self.assertRaisesRegex(ValueError, 'MIXED_LINE_ENDINGS'):
                write_text(path, 'changed\n')
            self.assertEqual(path.read_bytes(), b'a\r\nb\n')

    def test_real_stamper_keeps_crlf_and_final_hash_and_is_idempotent(self):
        import tempfile
        spec = importlib.util.spec_from_file_location('stamper', ROOT/'tools/stamp-version.py')
        module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); sw = root/'service-worker.js'; page = root/'index.html'; source = root/'brain.json'
            sw.write_bytes(b"const CACHE_NAME = 'dentcast-assets-old';\r\n")
            page.write_bytes(b"fetch('dentcast-brain.json?v=old');\r\n")
            source.write_bytes(b'[]\r\n')
            with patch.object(module, 'ROOT', root), patch.object(module, 'SERVICE_WORKER', sw), patch.object(module, 'VERSION_INPUTS', [source]):
                for content in [b'[]\r\n', b'[1]\r\n']:
                    source.write_bytes(content)
                    version = module.content_version()
                    module.stamp_service_worker(version); module.stamp_brain_fetches(version)
                    self.assertIn(version.encode(), page.read_bytes())
                    self.assertEqual(sw.read_bytes().count(b'\n'), sw.read_bytes().count(b'\r\n'))
                    before = (sw.read_bytes(), page.read_bytes())
                    module.stamp_service_worker(version); module.stamp_brain_fetches(version)
                    self.assertEqual(before, (sw.read_bytes(), page.read_bytes()))


if __name__ == '__main__':
    unittest.main()
