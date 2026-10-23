"""Three fixed page deliveries against real local Git remotes.

The verifier and semantic results are explicit fixtures, not real scientific work.
"""
import copy
import io
import json
import subprocess
from contextlib import redirect_stdout
import unittest
from unittest.mock import patch

import test_dentcast_publish_handoff as fixtures
import test_dentcast_publish_lifecycle as lifecycle_fixtures
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc
import check_publish_merge_gate as merge

run = fixtures.run


class ThreeDeliveriesTests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp
    assert_blocked = fixtures.HandoffTests.assert_blocked
    prepare = lifecycle_fixtures.LifecycleTests.prepare

    def start(self):
        (self.root/'dentcast-brain.json').write_text('[]')
        run(self.root, 'add', 'dentcast-brain.json')
        run(self.root, 'commit', '-m', 'fixture empty brain')
        result = self.prepare()
        state, sha = h.load_state(self.root)
        state['publication']['context']['decisions'].extend([
            {'kind': lc.DELIVERY_POLICY},
            {'kind': 'first_cut_lead_provenance_v1',
             'origin': 'author_original',
             'source_ref': 'fixture:original-writer-paragraph',
             'evidence': ['fixture:synthetic-author-content']}])
        result = h.save(self.root, state['publication'], expected=sha)
        run(self.root, 'push', 'origin', 'main')
        self.baseline = h.text_git(self.root, 'rev-parse', 'HEAD')
        return result['sha256']

    def walk(self, sha, until):
        while True:
            state, _ = h.load_state(self.root)
            sid = h.next_step(state['publication'])
            if sid == 'F':
                result = lc.verify(self.root, sha, 'fixture title', 'fixture caption')
            else:
                row = next(r for r in state['publication']['steps'] if r['id'] == sid)
                started = {'sha256':sha} if row['status']=='started' else lc.step(self.root, sha, sid, 'started', [], None)
                result = lc.step(self.root, started['sha256'], sid, 'completed', ['fixture:' + sid], None)
            sha = result['sha256']
            if sid == until:
                return sha

    def deliver(self, label):
        state, sha = h.load_state(self.root)
        run(self.root, 'add', 'note.html')
        result = h.save(self.root, state['publication'], expected=sha, note='Reviewed staged fixture work')
        run(self.root, 'add', h.STATE_PATH)
        lc.guard(self.root, 'pre-commit')
        run(self.root, 'commit', '-m', label)
        lc.guard(self.root, 'ci')
        run(self.root, 'push', 'origin', 'main')
        return result['sha256']

    def complete_two(self):
        sha = self.start()
        sha = self.walk(sha, 'C.4.9')
        sha = self.deliver('delivery 1')
        sha = self.walk(sha, 'C.4.13')
        return self.deliver('delivery 2')

    def prepare_final(self):
        sha = self.complete_two()
        sha = lc.step(self.root, sha, 'C.4.14', 'started', [], None)['sha256']
        (self.root/'note.html').write_text('final fixture bytes\n')
        state, _ = h.load_state(self.root)
        sha = h.save(self.root, state['publication'], expected=sha, note='Reviewed final fixture edit')['sha256']
        sha = self.walk(sha, 'G')
        state, _ = h.load_state(self.root)
        state['publication']['context']['delivery'] = [{'scope':'fixture external checks', 'evidence':['fixture:checked']}]
        return h.save(self.root, state['publication'], expected=sha)['sha256']

    def test_exactly_three_deliveries_and_final_work_without_final_handoff(self):
        sha = self.prepare_final()
        before = h.text_git(self.root, 'rev-parse', 'HEAD')
        self.assertEqual(lc.finish(self.root, sha)['status'], 'cleanup_pending_delivery')
        self.assertFalse((self.root/h.STATE_PATH).exists())
        report = lc.completion_path({'content_id':'note'})
        self.assertTrue((self.root/report).exists())
        original_report = (self.root/report).read_bytes()
        (self.root/report).write_text('{}')
        run(self.root, 'add', 'note.html', h.STATE_PATH, report)
        self.assert_blocked('COMPLETION_RECEIPT_CHANGED', lc.guard, self.root, 'pre-commit')
        (self.root/report).write_bytes(original_report)
        run(self.root, 'add', 'note.html', report)
        lc.guard(self.root, 'pre-commit')
        run(self.root, 'commit', '-m', 'delivery 3: final work, report and deletion')
        lc.guard(self.root, 'ci')
        self.assertEqual(lc.restore_cleanup(self.root)['status'], 'final_delivery_pending')
        self.assertFalse((self.root/h.STATE_PATH).exists())
        self.assertTrue(lc.pending(self.root))
        self.assert_blocked('CLEANUP_NOT_DELIVERED', lc.confirm_cleanup, self.root)
        run(self.root, 'push', 'origin', 'main')
        self.assertTrue(lc.confirm_cleanup(self.root)['publication_completed'])
        self.assertEqual(h.text_git(self.root, 'rev-list', '--count', self.baseline+'..HEAD'), '3')
        self.assertEqual(h.text_git(self.root, 'rev-parse', 'HEAD^'), before)
        self.assertEqual(merge.verify_publication_history(self.root, self.baseline, []), {'note'})
        other = self.base/'receiving-clone'
        subprocess.run(['git','clone',str(self.remote),str(other)],check=True,capture_output=True)
        lc.guard(other, 'ci')
        data = h.decode_json((other/report).read_text())
        self.assertEqual(lc.validate_final_receipt(other, data, 'HEAD'), 'note')
        run(other, 'config', 'user.name', 'Fixture')
        run(other, 'config', 'user.email', 'fixture@example.invalid')
        run(other, 'commit', '--allow-empty', '-m', 'forbidden fourth delivery')
        self.assert_blocked('EXTRA_DELIVERY_COMMIT_FORBIDDEN', lc.validate_final_receipt, other, data, 'HEAD')

    def test_intermediate_progress_is_local_and_cut_requires_real_push(self):
        sha = self.start()
        sha = self.walk(sha, '0')
        lc.guard(self.root, 'stop')
        self.assert_blocked('ONLY_THREE_FIXED_DELIVERIES_ALLOWED', lc.guard, self.root, 'pre-commit')
        sha = self.walk(sha, 'C.4.9')
        self.assert_blocked('PREVIOUS_STEP_', lc.step, self.root, sha, 'C.4.10.1', 'started', [], None)
        sha = self.deliver('delivery 1')
        self.assertEqual(lc.step(self.root, sha, 'C.4.10.1', 'started', [], None)['next_step'], 'C.4.10.1')

    def test_advance_stops_at_cut_including_valid_scientific_skips(self):
        sha = self.start()
        sha = self.walk(sha, 'C.4.8')
        sha = lc.step(self.root, sha, 'C.4.9', 'started', [], None)['sha256']
        result = lc.advance(self.root, sha, 'C.4.9', ['fixture:semantic'], start_next=True)
        self.assertEqual(result['status'], 'delivery_required')
        self.assertEqual(result['delivery'], 1)
        self.assertEqual(h.next_step(h.load_state(self.root)[0]['publication']), 'C.4.10.1')
        sha = self.deliver('delivery 1')
        sha = self.walk(sha, 'C.4.12')
        result = lc.advance(self.root, sha, skips=[('C.4.13','fixture:lawful exception')], start_next=True)
        self.assertEqual(result['delivery'], 2)
        self.assertEqual(lc.delivery_boundary(h.load_state(self.root)[0]['publication']), 2)

    def test_policy_cannot_be_removed_and_extra_checkpoint_commit_is_rejected(self):
        sha = self.start()
        state, _ = h.load_state(self.root)
        state['publication']['context']['decisions'] = []
        self.assert_blocked('DELIVERY_POLICY_CANNOT_BE_DROPPED', h.save, self.root, state['publication'], expected=sha)
        sha = self.walk(sha, 'C.4.9')
        self.deliver('delivery 1')
        self.assert_blocked('FIRST_DELIVERY_REQUIRES_NO_ACTIVE_REMOTE_HANDOFF', lc.guard, self.root, 'pre-commit')

    def test_failed_final_verifier_preserves_handoff(self):
        sha = self.prepare_final()
        with patch.dict('os.environ', {'DENTCAST_FIXTURE_FAIL':'1'}):
            self.assertEqual(lc.finish(self.root, sha)['status'], 'blocked')
        self.assertTrue((self.root/h.STATE_PATH).exists())
        self.assertFalse(lc.pending(self.root))

    def test_final_receipt_and_files_are_guarded_and_restore_is_local(self):
        sha = self.prepare_final()
        lc.finish(self.root, sha)
        (self.root/'note.html').write_text('unexpected drift')
        self.assert_blocked('WORK_CHANGED_AFTER_CLEANUP', lc.confirm_cleanup, self.root)
        lc.restore_cleanup(self.root)
        self.assertTrue((self.root/h.STATE_PATH).exists())
        self.assertFalse((self.root/lc.completion_path({'content_id':'note'})).exists())
        self.assertEqual(h.text_git(self.root, 'rev-list', '--count', self.baseline+'..HEAD'), '2')

    def test_cli_init_automatically_selects_fixed_policy(self):
        self.prepare()
        (self.root/h.STATE_PATH).unlink()
        data = copy.deepcopy(self.p)
        path = self.base/'new-input.json'
        path.write_text(json.dumps(data))
        with redirect_stdout(io.StringIO()):
            self.assertEqual(h.main(['--repo',str(self.root),'init','--input',str(path)]), 0)
        self.assertTrue(lc.fixed_delivery(h.load_state(self.root)[0]['publication']))


if __name__ == '__main__':
    unittest.main()
