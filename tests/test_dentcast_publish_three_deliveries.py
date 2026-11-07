"""The one page delivery model against real local Git remotes: an optional
save point once C.4.13 has started, Push 2 at C.6, and delivery 3.

The verifier and semantic results are explicit fixtures, not real scientific work.
"""
import copy
import io
import json
import subprocess
from contextlib import redirect_stderr, redirect_stdout
import unittest
from unittest.mock import patch

import test_dentcast_publish_handoff as fixtures
import test_dentcast_publish_lifecycle as lifecycle_fixtures
import test_dentcast_publish_second_cut_editorial as editorial
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc
import check_publish_merge_gate as merge

run = fixtures.run


class ThreeDeliveriesTests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp
    assert_blocked = fixtures.HandoffTests.assert_blocked
    prepare = lifecycle_fixtures.LifecycleTests.prepare

    def start(self):
        # A page run (LiteCast: no English mirror fixture needed) with its frozen
        # Push-2 records; the order and policy markers come from the first write.
        (self.root/'dentcast-brain.json').write_text('[]')
        run(self.root, 'add', 'dentcast-brain.json')
        run(self.root, 'commit', '-m', 'fixture empty brain')
        self.p['category'] = 'litecast'
        # Work edits after C.2 go to a scoped data file: the page text is locked.
        (self.root/'work.json').write_text('{}\n')
        run(self.root, 'add', 'work.json')
        run(self.root, 'commit', '-m', 'fixture scoped data file')
        self.p['target_paths'].append('work.json')
        result = self.prepare()
        state, sha = h.load_state(self.root)
        p = state['publication']
        self.assertTrue(lc.editorial_cut_v2(p) and lc.ledger_order_v2(p))
        p['context']['decisions'].extend([
            {'kind': 'first_cut_lead_provenance_v1',
             'origin': 'not_applicable',
             'source_ref': 'fixture:page-already-has-prose',
             'evidence': ['fixture:synthetic-lead-origin-review']},
        ])
        p['context']['decisions'].append(editorial.receipt(p))
        p['context']['approvals'] = [
            {'scope': 'title', 'status': 'confirmed', 'decision': 'fixture title',
             'evidence': ['fixture:title approved']},
            {'scope': 'caption', 'status': 'confirmed', 'decision': 'fixture caption',
             'evidence': ['fixture:caption approved']}]
        result = h.save(self.root, p, expected=sha)
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
                if sid == 'C.4.14':
                    # An ordinary fixture page is not a Challenge.
                    result = lc.step(self.root, started['sha256'], sid, 'skipped', [], 'fixture: ordinary page, no Challenge')
                else:
                    result = lc.step(self.root, started['sha256'], sid, 'completed', ['fixture:' + sid], None)
            sha = result['sha256']
            if sid == until:
                return sha

    def deliver(self, label):
        state, sha = h.load_state(self.root)
        run(self.root, 'add', 'note.html', *(['work.json'] if (self.root/'work.json').exists() else []))
        result = h.save(self.root, state['publication'], expected=sha, note='Reviewed staged fixture work')
        run(self.root, 'add', h.STATE_PATH)
        lc.guard(self.root, 'pre-commit')
        run(self.root, 'commit', '-m', label)
        lc.guard(self.root, 'ci')
        run(self.root, 'push', 'origin', 'main')
        return result['sha256']

    def complete_two(self):
        """Save point, then Push 2."""
        sha = self.start()
        sha = self.walk(sha, 'C.4.9')
        sha = self.deliver('save point')
        sha = self.walk(sha, 'C.6')
        return self.deliver('delivery 2')

    def prepare_final(self):
        """The runner's part, simulated in this checkout."""
        sha = self.complete_two()
        sha = lc.step(self.root, sha, 'C.8', 'started', [], None)['sha256']
        (self.root/'work.json').write_text('{"final": true}\n')
        state, _ = h.load_state(self.root)
        sha = h.save(self.root, state['publication'], expected=sha, note='Reviewed final fixture edit')['sha256']
        sha = self.walk(sha, 'G')
        state, _ = h.load_state(self.root)
        state['publication']['context']['delivery'] = [{'scope':'fixture external checks', 'evidence':['fixture:checked']}]
        return h.save(self.root, state['publication'], expected=sha)['sha256']

    def test_canonical_fixed_cut_gate_rejects_questions_and_missing_approval(self):
        p = fixtures.publication()
        p['content_id'], p['category'] = 'note', 'insight'
        p['steps'] = lc.plan()
        p['context']['decisions'] = [{'kind': lc.LEDGER_ORDER_V2}, {'kind': lc.DELIVERY_POLICY},
                                     {'kind': lc.DELIVERY_POLICY_V2}]
        with self.assertRaisesRegex(h.Blocked, 'FIRST_CUT_DECLARATION_REQUIRED'):
            lc.require_fixed_cut_readiness(p)
        lead = {'kind': 'first_cut_lead_provenance_v1',
                'origin': 'agent_authored', 'source_ref': 'fixture:agent-lead',
                'evidence': ['fixture:lead-reviewed']}
        p['context']['decisions'].append(lead)
        with self.assertRaisesRegex(h.Blocked, 'AGENT_LEAD_EXPLICIT_FOUNDER_APPROVAL_REQUIRED'):
            lc.require_fixed_cut_readiness(p)
        p['context']['approvals'].append({
            'scope': 'authored-intro', 'decision': None,
            'status': 'pending', 'evidence': []})
        with self.assertRaisesRegex(h.Blocked, 'DELIVERY_UNRESOLVED_APPROVAL'):
            lc.require_fixed_cut_readiness(p)
        p['context']['approvals'][0].update(status='rejected', decision='declined',
                                             evidence=['fixture:declined'])
        with self.assertRaisesRegex(h.Blocked, 'DELIVERY_UNRESOLVED_APPROVAL'):
            lc.require_fixed_cut_readiness(p)
        p['context']['approvals'][0].update(status='confirmed', decision='approved',
                                             evidence=['fixture:explicit-author-yes'])
        lc.require_fixed_cut_readiness(p)
        p['context']['pending_questions'] = [{'message': 'M1', 'step': 'C.2',
                                              'question': 'fixture:unanswered question',
                                              'answered': False}]
        with self.assertRaisesRegex(h.Blocked, 'DELIVERY_PENDING_QUESTIONS'):
            lc.require_fixed_cut_readiness(p)
        p['context']['pending_questions'] = []
        lc.require_fixed_cut_readiness(p)
        # Original author paragraph needs no fresh, inferred author approval.
        p['context']['approvals'] = []
        lead['origin'] = 'author_original'
        lead['source_ref'] = 'fixture:original-paragraph'
        lc.require_fixed_cut_readiness(p)
        lead['origin'] = 'not_applicable'
        lead['source_ref'] = 'fixture:preexisting-prose-no-new-lead'
        lc.require_fixed_cut_readiness(p)

    def test_push2_precommit_and_ci_fail_without_lead_provenance(self):
        sha = self.start()
        self.walk(sha, 'C.6')
        state, _ = h.load_state(self.root)
        state['publication']['context']['decisions'] = [
            d for d in state['publication']['context']['decisions']
            if d.get('kind') != 'first_cut_lead_provenance_v1']
        h.write_atomic(self.root, state)
        run(self.root, 'add', h.STATE_PATH)
        self.assert_blocked('FIRST_CUT_DECLARATION_REQUIRED',
                            lc.guard, self.root, 'pre-commit')
        # Even when the native pre-commit hook was not installed or bypassed,
        # CI must reject the same invalid committed checkpoint.
        run(self.root, 'commit', '-m', 'fixture:unsafe Push 2')
        self.assert_blocked('FIRST_CUT_DECLARATION_REQUIRED',
                            lc.guard, self.root, 'ci')

    def test_push2_precommit_and_ci_block_unanswered_question(self):
        sha = self.start()
        self.walk(sha, 'C.6')
        state, _ = h.load_state(self.root)
        state['publication']['context']['pending_questions'] = [
            {'message': 'M1', 'step': 'C.2', 'question': 'fixture:unanswered intake detail',
             'answered': False}]
        h.write_atomic(self.root, state)
        run(self.root, 'add', h.STATE_PATH)
        self.assert_blocked('DELIVERY_PENDING_QUESTIONS',
                            lc.guard, self.root, 'pre-commit')
        run(self.root, 'commit', '-m', 'fixture:unsafe unresolved questions')
        self.assert_blocked('DELIVERY_PENDING_QUESTIONS',
                            lc.guard, self.root, 'ci')

    def test_exactly_three_deliveries_and_final_work_without_final_handoff(self):
        sha = self.prepare_final()
        before = h.text_git(self.root, 'rev-parse', 'HEAD')
        self.assertEqual(lc.finish(self.root, sha)['status'], 'cleanup_pending_delivery')
        self.assertFalse((self.root/h.STATE_PATH).exists())
        report = lc.completion_path({'content_id':'note'})
        self.assertTrue((self.root/report).exists())
        original_report = (self.root/report).read_bytes()
        (self.root/report).write_text('{}')
        run(self.root, 'add', 'note.html', 'work.json', h.STATE_PATH, report, lc.technical_report_path({'content_id': 'note', 'category': 'litecast'}))
        self.assert_blocked('COMPLETION_RECEIPT_CHANGED', lc.guard, self.root, 'pre-commit')
        (self.root/report).write_bytes(original_report)
        run(self.root, 'add', 'note.html', 'work.json', report, lc.technical_report_path({'content_id': 'note', 'category': 'litecast'}))
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

    def at_save_point_with_recorded_edit(self):
        sha = self.walk(self.start(), 'C.4.9')
        (self.root/'work.json').write_text('{"saved": true}\n')
        state, _ = h.load_state(self.root)
        return h.save(self.root, state['publication'], expected=sha, note='Reviewed save-point edit')['sha256']

    def test_stage_delivery_refreshes_checkpoint_for_index_only(self):
        sha = self.at_save_point_with_recorded_edit()
        # Without it, staging alone leaves the checkpoint stale for the guard.
        run(self.root, 'add', 'work.json', h.STATE_PATH)
        self.assert_blocked('CHECKPOINT_REQUIRED_BEFORE_COMMIT_OR_STOP', lc.guard, self.root, 'pre-commit')
        run(self.root, 'reset', '-q')
        result = lc.stage_delivery(self.root, sha, ['work.json'])
        self.assertEqual(result['status'], 'delivery_staged')
        run(self.root, 'commit', '-m', 'save point')
        lc.guard(self.root, 'ci')
        run(self.root, 'push', 'origin', 'main')
        self.assertEqual(h.load_state(self.root)[1], result['sha256'])

    def test_stage_delivery_refuses_unrecorded_bytes_and_foreign_paths(self):
        sha = self.at_save_point_with_recorded_edit()
        self.assert_blocked('STAGE_PATH_OUTSIDE_PUBLICATION:unrelated.md',
                            lc.stage_delivery, self.root, sha, ['unrelated.md'])
        (self.root/'work.json').write_text('{"edited": "after the checkpoint"}\n')
        self.assert_blocked('RECORD_WORK_CHANGES_BEFORE_STAGING',
                            lc.stage_delivery, self.root, sha, ['work.json'])
        self.assertEqual(h.git(self.root, 'diff', '--cached', '--name-only'), b'')

    def complete_three(self):
        sha = self.prepare_final()
        lc.finish(self.root, sha)
        report = lc.completion_path({'content_id': 'note'})
        tech = lc.technical_report_path({'content_id': 'note', 'category': 'litecast'})
        run(self.root, 'add', '-A', 'note.html', 'work.json', h.STATE_PATH, report, tech)
        run(self.root, 'commit', '-m', 'delivery 3')
        run(self.root, 'push', 'origin', 'main')
        lc.confirm_cleanup(self.root)
        return report

    def test_merge_gate_checks_workflow_against_the_delivered_commit(self):
        report = self.complete_three()
        delivered = h.text_git(self.root, 'rev-parse', 'HEAD')
        # Main changes an active rule after delivery but before the PR merges.
        (self.root/'.dentcast/workflows/README.md').write_text('rules changed on main\n')
        run(self.root, 'commit', '-am', 'main: workflow edit landed mid-run')
        self.assertEqual(merge.verify_publication_history(self.root, self.baseline, []), {'note'})
        data = h.decode_json((self.root/report).read_text())
        self.assertEqual(lc.validate_final_receipt(self.root, data, delivered), 'note')
        # Without a delivery commit (local finish) the live workspace is still checked.
        self.assert_blocked('FINAL_RECEIPT_WORKFLOW_MISMATCH', lc.validate_final_receipt,
                            self.root, data)

    def test_ignored_private_input_is_local_only_after_delivery(self):
        (self.root/'.ignored').mkdir()
        pdf = self.root/'.ignored/paper.pdf'
        pdf.write_bytes(b'%PDF private fixture')
        self.p['target_paths'].append('.ignored/paper.pdf')
        self.p['context']['inputs'].append(
            {'path': '.ignored/paper.pdf', 'sha256': h.file_info(self.root, '.ignored/paper.pdf')['sha256']})
        sha = self.walk(self.start(), 'C.4.9')
        self.assert_blocked('LOCAL_ONLY_INPUT_IS_NEVER_DELIVERED', lc.stage_delivery,
                            self.root, sha, ['.ignored/paper.pdf'])
        sha = self.deliver('save point')
        self.assertEqual(h.text_git(self.root, 'ls-tree', '-r', '--name-only', 'HEAD', '.ignored'), '')
        # Present and unchanged after the save: the next step may start.
        sha = lc.step(self.root, sha, 'C.4.11', 'started', [], None)['sha256']
        sha = lc.step(self.root, sha, 'C.4.11', 'completed', ['fixture:cards'], None)['sha256']
        # Absent (another checkout or removed after delivery): local-only, allowed.
        pdf.unlink()
        sha = lc.step(self.root, sha, 'C.4.12', 'started', [], None)['sha256']
        # Present with different bytes: still caught against the bound hash.
        pdf.write_bytes(b'%PDF tampered')
        self.assert_blocked('INPUT_BYTES_CHANGED_RECONCILE:.ignored/paper.pdf', lc.step,
                            self.root, sha, 'C.4.12', 'completed', ['fixture:faq'], None)
        self.assertEqual(h.inspect(self.root)['portability_reason'], 'UNTRACKED_OR_IGNORED_REQUIRED_FILE')

    def test_stage_delivery_only_at_save_point_or_push2(self):
        sha = self.walk(self.start(), 'C.4.10.3')
        self.assert_blocked('STAGE_DELIVERY_ONLY_AT_FIXED_CUT', lc.stage_delivery, self.root, sha, ['note.html'])

    def test_third_delivery_may_carry_the_public_technical_report_only(self):
        sha = self.prepare_final()
        lc.finish(self.root, sha)
        receipt = lc.completion_path({'content_id': 'note'})
        report = lc.technical_report_path({'content_id': 'note', 'category': 'litecast'})
        self.assertEqual(report, '.dentcast/publication-reports/litecast-note.md')
        text = (self.root/report).read_text(encoding='utf-8')
        for line in ('# note — publication technical report', '- `C.4.14` skipped — fixture: ordinary page, no Challenge',
                     '- `F` completed', '**1 passed, 0 warned, 0 failed — publish is COMPLETE**',
                     '- fixture external checks: fixture:checked', '- `work.json`', '- `' + report + '`',
                     '- No DES record'):
            self.assertIn(line, text)
        run(self.root, 'add', 'note.html', 'work.json', h.STATE_PATH, receipt)
        self.assert_blocked('FINAL_DELIVERY_MUST_BE_FULLY_STAGED', lc.guard, self.root, 'pre-commit')
        (self.root/'unrelated.md').write_text('not part of this publication\n')
        run(self.root, 'add', receipt, report, 'unrelated.md')
        self.assert_blocked('UNRELATED_FINAL_DELIVERY_PATH', lc.guard, self.root, 'pre-commit')
        run(self.root, 'rm', '--cached', '-q', 'unrelated.md')
        (self.root/'unrelated.md').unlink()
        lc.guard(self.root, 'pre-commit')
        run(self.root, 'commit', '-m', 'delivery 3 with technical report')
        lc.guard(self.root, 'ci')
        run(self.root, 'push', 'origin', 'main')
        self.assertTrue(lc.confirm_cleanup(self.root)['publication_completed'])
        self.assertEqual(merge.verify_publication_history(self.root, self.baseline, []), {'note'})

    def test_intermediate_progress_is_local_and_push2_requires_real_push(self):
        sha = self.start()
        sha = self.walk(sha, '0')
        lc.guard(self.root, 'stop')
        self.assert_blocked('COMMIT_ONLY_AT_SAVE_POINT_OR_PUSH_2', lc.guard, self.root, 'pre-commit')
        # The old C.4.9 cut is gone: nothing holds the next step there.
        sha = self.walk(sha, 'C.4.9')
        sha = lc.step(self.root, sha, 'C.4.11', 'started', [], None)['sha256']
        sha = self.walk(sha, 'C.6')
        self.assert_blocked('PREVIOUS_STEP_', lc.step, self.root, sha, 'C.8', 'started', [], None)
        sha = self.deliver('delivery 2')
        self.assertEqual(lc.step(self.root, sha, 'C.8', 'started', [], None)['next_step'], 'C.8')

    def test_advance_stops_only_at_push2_including_valid_scientific_skips(self):
        sha = self.start()
        sha = self.walk(sha, 'C.4.10.3')
        result = lc.advance(self.root, sha, skips=[('C.4.13', 'fixture:lawful exception')], start_next=True)
        self.assertNotEqual(result.get('status'), 'delivery_required')
        sha = self.walk(h.load_state(self.root)[1], 'C.4.8')
        sha = lc.step(self.root, sha, 'C.4.9', 'started', [], None)['sha256']
        result = lc.advance(self.root, sha, 'C.4.9', ['fixture:semantic'], start_next=True)
        self.assertNotEqual(result.get('status'), 'delivery_required')
        sha = self.walk(h.load_state(self.root)[1], 'C.5.6-b')
        sha = lc.step(self.root, sha, 'C.6', 'started', [], None)['sha256']
        result = lc.advance(self.root, sha, 'C.6', ['fixture:english'], start_next=True)
        self.assertEqual(result['status'], 'delivery_required')
        self.assertEqual(result['delivery'], 1)
        self.assertEqual(lc.delivery_boundary(h.load_state(self.root)[0]['publication']), 1)

    def test_policy_cannot_be_removed(self):
        sha = self.start()
        state, _ = h.load_state(self.root)
        state['publication']['context']['decisions'] = []
        self.assert_blocked('OLD_DELIVERY_MODEL_RETIRED|DELIVERY_POLICY_CANNOT_BE_DROPPED|LEDGER_ORDER_CANNOT_CHANGE',
                            h.save, self.root, state['publication'], expected=sha)

    def test_invalidation_after_a_save_needs_no_recrossing_and_push2_is_frozen(self):
        sha = self.start()
        sha = self.walk(sha, 'C.4.9')
        self.deliver('save point')
        state, sha = h.load_state(self.root)
        sha = lc.invalidate(self.root, sha, 'C.2', 'fixture reviewed page step after the save')['sha256']
        sha = self.walk(self.reconfirm(sha), 'C.4.9')
        self.deliver('another save after the audited invalidation')
        sha = self.walk(h.load_state(self.root)[1], 'C.6')
        self.deliver('delivery 2')
        # After Push 2 the handoff is frozen: a record on it is refused up front.
        state, sha = h.load_state(self.root)
        self.assert_blocked('RECORD_AFTER_DELIVERED_CUT_START_NEXT_STEP_FIRST', h.save, self.root,
                            state['publication'], expected=sha, note='fixture unchanged')

    def test_rules_invalidation_after_push2_redelivers_push2_and_finishes(self):
        # A failed post-Push-2 continuation whose fix changes a workflow file
        # (a tool defect fixed on main) must invalidate from `rules`; the run
        # then crosses Push 2 again and still finishes.
        sha = self.complete_two()
        state, sha = h.load_state(self.root)
        sha = lc.invalidate(self.root, sha, 'rules', 'fixture reviewed workflow fix after Push 2')['sha256']
        sha = self.walk(self.reconfirm(sha), 'C.6')
        self.deliver('delivery 2 again')
        state, sha = h.load_state(self.root)
        sha = lc.step(self.root, sha, 'C.8', 'started', [], None)['sha256']
        sha = self.walk(sha, 'G')
        state, _ = h.load_state(self.root)
        state['publication']['context']['delivery'] = [{'scope':'fixture external checks', 'evidence':['fixture:checked']}]
        sha = h.save(self.root, state['publication'], expected=sha)['sha256']
        self.assertEqual(lc.finish(self.root, sha)['status'], 'cleanup_pending_delivery')

    def reconfirm(self, sha):
        """An invalidation returns approvals to pending; restore them with evidence."""
        state, _ = h.load_state(self.root)
        for a in state['publication']['context']['approvals']:
            a.update(status='confirmed', decision='fixture ' + a['scope'],
                     evidence=['fixture:re-verified after invalidation'])
        return h.save(self.root, state['publication'], expected=sha, note='fixture re-verified approvals')['sha256']

    def deliver_sha(self):
        return h.load_state(self.root)[1]

    def test_failed_final_verifier_preserves_handoff(self):
        sha = self.prepare_final()
        with patch.dict('os.environ', {'DENTCAST_FIXTURE_FAIL':'1'}):
            self.assertEqual(lc.finish(self.root, sha)['status'], 'blocked')
        self.assertTrue((self.root/h.STATE_PATH).exists())
        self.assertFalse(lc.pending(self.root))

    def test_final_receipt_and_files_are_guarded_and_restore_is_local(self):
        sha = self.prepare_final()
        lc.finish(self.root, sha)
        (self.root/'work.json').write_text('{"unexpected": "drift"}\n')
        self.assert_blocked('WORK_CHANGED_AFTER_CLEANUP', lc.confirm_cleanup, self.root)
        lc.restore_cleanup(self.root)
        self.assertTrue((self.root/h.STATE_PATH).exists())
        self.assertFalse((self.root/lc.completion_path({'content_id':'note'})).exists())
        self.assertFalse((self.root/lc.technical_report_path({'content_id':'note', 'category':'litecast'})).exists())
        self.assertEqual(h.text_git(self.root, 'rev-list', '--count', self.baseline+'..HEAD'), '2')

    def test_restore_refuses_an_edited_technical_report_and_removes_its_own(self):
        sha = self.prepare_final()
        report = self.root/lc.technical_report_path({'content_id': 'note', 'category': 'litecast'})
        lc.finish(self.root, sha)
        original = report.read_bytes()
        report.write_text('edited by hand\n')
        self.assert_blocked('TECHNICAL_REPORT_CHANGED', lc.restore_cleanup, self.root)
        report.write_bytes(original)
        lc.restore_cleanup(self.root)
        self.assertFalse(report.exists())

    def test_finish_never_overwrites_an_authored_technical_report(self):
        sha = self.prepare_final()
        report = self.root/lc.technical_report_path({'content_id': 'note', 'category': 'litecast'})
        report.parent.mkdir(parents=True, exist_ok=True)
        report.write_text('authored report\n')
        state, _ = h.load_state(self.root)
        state['publication']['target_paths'].append(report.relative_to(self.root).as_posix())
        sha = h.save(self.root, state['publication'], expected=sha, note='Reviewed authored report')['sha256']
        lc.finish(self.root, sha)
        self.assertEqual(report.read_text(), 'authored report\n')
        self.assertNotIn('technical_report', lc.cleanup_record(self.root))

    def test_cli_init_automatically_selects_fixed_policy(self):
        self.prepare()
        (self.root/h.STATE_PATH).unlink()
        data = copy.deepcopy(self.p)
        path = self.base/'new-input.json'
        # The English mirror path derives from <section>/<slug>: reject others at init.
        path.write_text(json.dumps(data))
        with redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()) as err:
            self.assertEqual(h.main(['--repo',str(self.root),'init','--input',str(path)]), 2)
        self.assertIn('CONTENT_ID_INVALID', err.getvalue())
        self.assertFalse((self.root/h.STATE_PATH).exists())
        data['content_id'] = 'insight/note'
        path.write_text(json.dumps(data))
        with redirect_stdout(io.StringIO()):
            self.assertEqual(h.main(['--repo',str(self.root),'init','--input',str(path)]), 0)
        self.assertTrue(lc.fixed_delivery(h.load_state(self.root)[0]['publication']))


if __name__ == '__main__':
    unittest.main()
