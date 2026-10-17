"""Compact persisted state, live Git reconstruction, and v1 read compatibility."""
import copy
import json
import unittest

import test_dentcast_publish_recovery as fixtures
import dentcast_publish_handoff as h

run = fixtures.run


class CompactHandoffTests(unittest.TestCase):
    setUp = fixtures.RecoveryAcceptanceTests.setUp
    prepare = fixtures.RecoveryAcceptanceTests.prepare
    init = fixtures.RecoveryAcceptanceTests.init
    cli = fixtures.RecoveryAcceptanceTests.cli
    clone = fixtures.RecoveryAcceptanceTests.clone
    deliver_checkpoint = fixtures.RecoveryAcceptanceTests.deliver_checkpoint

    def wire(self):
        raw = (self.root / h.STATE_PATH).read_text()
        return json.loads(raw.split(h.BEGIN, 1)[1].split(h.END, 1)[0])

    def test_persisted_state_omits_derived_git_facts(self):
        self.prepare()
        (self.root/'note.html').write_text('staged')
        run(self.root, 'add', 'note.html')
        (self.root/'note.html').write_text('working')
        self.init()
        state = self.wire()
        self.assertEqual(state['schema'], 'publish-handoff-v2')
        self.assertEqual(set(state['snapshot']), {'repository', 'branch', 'files', 'workflow'})
        self.assertEqual(set(state['snapshot']['files']['note.html']), {'kind', 'sha256', 'executable'})
        self.assertNotIn('remote', state['snapshot'])
        self.assertNotIn('head', state['snapshot'])
        self.assertNotIn('index', state['snapshot']['files']['note.html'])
        view = self.cli('inspect', '--check-remote')
        self.assertEqual(view['current_snapshot']['files']['note.html']['status'], 'MM')
        self.assertEqual(view['current_snapshot']['remote']['status'], 'observed')

    def test_semantic_progress_and_unknown_external_receipts_survive_round_trip(self):
        self.prepare()
        self.p['context']['inputs'] = [{'reference': 'fixture:private-input', 'hash': 'fixture:sha'}]
        self.p['context']['decisions'] = ['fixture:approved route']
        self.p['context']['approvals'] = [{'scope': 'title', 'decision': 'fixture:exact',
                                         'status': 'confirmed', 'evidence': ['fixture:approval']}]
        self.p['external_actions'] = [{'id': 'notify', 'target': 'fixture:notice',
                                      'status': 'outcome_unknown', 'evidence': ['fixture:timeout']}]
        initial = self.init()
        parsed, sha = h.parse_state((self.root/h.STATE_PATH).read_bytes())
        self.assertEqual(parsed['publication'], self.p)
        self.assertEqual(sha, initial['sha256'])
        self.assertIn('EXTERNAL_OUTCOME_UNKNOWN_DO_NOT_RETRY', self.cli('inspect', code=2)['issues'])

    def test_fresh_clone_rebuilds_committed_index_without_private_cache(self):
        self.prepare()
        self.init()
        self.deliver_checkpoint()
        clone = self.clone()
        self.assertFalse(h.observation_path(clone).exists())
        before = (clone/h.STATE_PATH).read_bytes()
        view = self.cli('inspect', '--check-remote', root=clone)
        self.assertEqual(view['git_snapshot_portable'], 'yes')
        self.assertEqual(view['recorded_state']['snapshot']['head'], run(clone, 'rev-parse', 'HEAD').stdout.strip())
        self.assertEqual((clone/h.STATE_PATH).read_bytes(), before)
        self.assertFalse(h.observation_path(clone).exists())

    def test_missing_private_observation_never_adopts_dirty_work_as_baseline(self):
        self.prepare()
        self.init()
        self.deliver_checkpoint()
        h.observation_path(self.root).unlink()
        (self.root/'note.html').write_text('unexpected bytes')
        view = self.cli('inspect', code=2)
        self.assertIn('WORK_OR_INDEX_CHANGED', view['issues'])

    def test_committed_work_supersedes_stale_local_index_without_rewriting_handoff(self):
        self.prepare()
        (self.root/'note.html').write_text('fixture:recorded work')
        run(self.root, 'add', 'note.html')
        self.init()
        before = (self.root/h.STATE_PATH).read_bytes()
        run(self.root, 'add', h.STATE_PATH)
        run(self.root, 'commit', '-m', 'work and checkpoint together')
        run(self.root, 'push', 'origin', 'main')
        view = self.cli('inspect', '--check-remote')
        self.assertEqual(view['issues'], [])
        self.assertEqual(view['git_snapshot_portable'], 'yes')
        self.assertEqual((self.root/h.STATE_PATH).read_bytes(), before)

    def test_fresh_clone_does_not_hide_work_commits_after_the_checkpoint(self):
        self.prepare()
        self.init()
        self.deliver_checkpoint()
        (self.root/'other-work.txt').write_text('work without refreshed checkpoint')
        run(self.root, 'add', 'other-work.txt')
        run(self.root, 'commit', '-m', 'later work without checkpoint')
        run(self.root, 'push', 'origin', 'main')
        clone = self.clone()
        view = self.cli('inspect', '--check-remote', root=clone, code=2)
        self.assertIn('HEAD_CHANGED_REVIEW_REQUIRED', view['issues'])
        self.assertEqual(view['git_snapshot_portable'], 'no')

    def test_cache_cannot_override_public_verification_baseline(self):
        self.prepare()
        self.init()
        path = h.observation_path(self.root)
        cached = json.loads(path.read_text())
        self.assertNotIn('publication', cached)
        cached['snapshot']['files']['note.html']['sha256'] = 'a'*64
        path.write_text(json.dumps(cached))
        result = self.cli('inspect', code=2)
        self.assertIn('OBSERVATION_BASELINE_MISMATCH', result['error'])

    def test_v1_read_and_explicit_record_upgrade_preserve_semantics(self):
        self.prepare()
        self.init()
        state, _ = h.load_state(self.root)
        old = copy.deepcopy(state)
        old['schema'] = 'publish-handoff-v1'
        raw = h.render(old).encode()
        (self.root/h.STATE_PATH).write_bytes(raw)
        loaded, sha = h.load_state(self.root)
        self.assertEqual(loaded['publication'], self.p)
        self.assertEqual(loaded['schema'], 'publish-handoff-v1')
        self.assertEqual((self.root/h.STATE_PATH).read_bytes(), raw)
        h.save(self.root, loaded['publication'], expected=sha)
        self.assertEqual(self.wire()['schema'], 'publish-handoff-v2')
        self.assertEqual(self.wire()['publication'], self.p)

    def test_compact_encoding_is_smaller_and_canonical(self):
        self.prepare()
        self.init()
        state, _ = h.load_state(self.root)
        compact = h.render(state)
        full = h.render_full(state)
        self.assertLess(len(compact), len(full))
        parsed, _ = h.parse_state(compact.encode())
        self.assertEqual(h.render(parsed), compact)

    def test_present_ignored_input_still_blocks_portability_after_cache_loss(self):
        self.prepare()
        self.p['target_paths'].append('.ignored/input.txt')
        path = self.root/'.ignored/input.txt'
        path.parent.mkdir()
        path.write_text('fixture:private source')
        self.init()
        h.observation_path(self.root).unlink()
        view = self.cli('inspect', '--check-remote')
        self.assertEqual(view['git_snapshot_portable'], 'no')
        self.assertEqual(view['portability_reason'], 'UNTRACKED_OR_IGNORED_REQUIRED_FILE')


if __name__ == '__main__':
    unittest.main()
