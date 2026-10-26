"""Real temporary Git/CLI/hook boundaries with an explicit fixture verifier.

The fixture executable tests invocation and failure handling, not real content
or scientific verification. Actual content/client continuation is stage 5.
"""
import copy
from contextlib import redirect_stdout, redirect_stderr
import io
import json
import os
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

import test_dentcast_publish_handoff as fixtures
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc

run = fixtures.run
ROOT = Path(__file__).resolve().parents[1]


class LifecycleTests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp
    assert_blocked = fixtures.HandoffTests.assert_blocked

    def prepare(self, complete=False, paper=False):
        # A real subprocess executable, deliberately a test stub, not the real Phase F.
        script = ('import os,sys\nassert "--all" not in sys.argv and "--last" not in sys.argv\n'
                  'fail=os.environ.get("DENTCAST_FIXTURE_FAIL")=="1"\n'
                  'print("0 passed, 0 warned, 1 failed — publish is INCOMPLETE" if fail else '
                  '"1 passed, 0 warned, 0 failed — publish is COMPLETE")\nsys.exit(1 if fail else 0)\n')
        (self.root / 'tools/verify_publish.py').write_text(script)
        for name in ('tools/dentcast_publish_handoff.py', 'tools/dentcast_publish_lifecycle.py'):
            (self.root/name).write_bytes((ROOT/name).read_bytes())
        run(self.root, 'add', '.')
        run(self.root, 'commit', '-m', 'fixture gate and CLI')
        self.p['content_id'] = 'note'
        self.p['steps'] = lc.plan(paper)
        if paper:
            self.p['category'] = 'paper-only'
            self.p['target_paths'] = ['dentcast_cabinet_full_catalog.json']
            record = {'id': 'P0001', 'drive_id': 'fixture-drive',
                      'drive_view': 'https://drive.google.com/file/d/fixture-drive/view',
                      'drive_download': 'https://drive.google.com/uc?export=download&id=fixture-drive'}
            (self.root/self.p['target_paths'][0]).write_text(json.dumps({'papers': [record]}))
            run(self.root, 'add', self.p['target_paths'][0])
            run(self.root, 'commit', '-m', 'fixture catalog')
            self.p['external_actions'] = [{'id':'drive', 'target':'drive:fixture-drive',
                                          'status':'completed', 'evidence':['fixture:real-operator-reference']}]
        if complete:
            for s in self.p['steps']:
                s.update(status='completed', evidence=['fixture:' + s['id']])
            receipt = lc.gate(self.root, self.p, 'literal title', 'literal caption', 'P0001' if paper else None)
            self.p['context']['validation'].append({k:v for k,v in receipt.items() if k!='output'})
            self.p['context']['delivery'] = [{'scope':'fixture delivery', 'evidence':['fixture:delivery-observation']}]
        return h.save(self.root, self.p, initial=True)

    def deliver(self):
        run(self.root, 'add', h.STATE_PATH)
        run(self.root, 'commit', '-m', 'checkpoint')
        run(self.root, 'push', 'origin', 'main')

    def test_full_inventory_covers_all_modules_and_preserves_dependencies(self):
        p=fixtures.publication();p['steps']=lc.plan();lc.require_plan(p)
        self.assertEqual({s['module'] for s in p['steps']}, set(h.MODULES))
        ids=[s['id'] for s in p['steps']]
        self.assertLess(ids.index('C.8'),ids.index('C.7'))
        self.assertLess(ids.index('C.2'),ids.index('C.0.5'))
        p['steps'].pop(3)
        self.assert_blocked('CANONICAL_PLAN_REQUIRED',lc.require_plan,p)

    def test_dynamic_unit_steps_precede_their_aggregate(self):
        p=fixtures.publication();p['steps']=lc.plan()
        index=next(i for i,s in enumerate(p['steps']) if s['id']=='C.4.13')
        extra=copy.deepcopy(p['steps'][index]);extra['id']='C.4.13/source-1-checker-1'
        p['steps'].insert(index,extra);lc.require_plan(p)
        p['steps'].insert(index+1,p['steps'].pop(index))
        self.assert_blocked('SUBSTEP_MUST_PRECEDE_AGGREGATE',lc.require_plan,p)

    def test_step_requires_start_and_the_next_id(self):
        initial=self.prepare()
        self.assert_blocked('STEP_MUST_BE_STARTED_FIRST',lc.step,self.root,initial['sha256'],'rules','completed',['fixture:read'],None)
        started=lc.step(self.root,initial['sha256'],'rules','started',[],None)
        done=lc.step(self.root,started['sha256'],'rules','completed',['fixture:read complete hard rules'],None)
        self.assertEqual(done['next_step'],'0')
        self.assert_blocked('NOT_NEXT_CANONICAL_STEP',lc.step,self.root,done['sha256'],'C.2','started',[],None)

    def test_binding_is_one_time_and_cannot_follow_authoring(self):
        self.p.update(content_id='unassigned',category='pending')
        initial=self.prepare()
        # prepare sets a fixture ID; use the actual placeholder before initializing in a fresh fixture.
        state,_=h.load_state(self.root)
        state['publication']['content_id']='unassigned'
        h.write_atomic(self.root,state)
        sha=h.load_state(self.root)[1]
        result=lc.bind(self.root,sha,'insight/note','insight',['note.html'],'fixture:resolved intake')
        self.assert_blocked('IDENTITY_ALREADY_BOUND',lc.bind,self.root,result['sha256'],'other','insight',['note.html'],'fixture')

    def test_binding_stores_the_canonical_category(self):
        initial=self.prepare()
        state,_=h.load_state(self.root)
        state['publication'].update(content_id='unassigned',category='Pending')
        h.write_atomic(self.root,state)
        sha=h.load_state(self.root)[1]
        lc.bind(self.root,sha,'litecast/note','LiteCast',['note.html'],'fixture:resolved intake')
        self.assertEqual(h.load_state(self.root)[0]['publication']['category'],'litecast')

    def test_raw_phase_f_completion_is_rejected(self):
        self.prepare(complete=True)
        state,_=h.load_state(self.root)
        for s in state['publication']['steps']:
            if s['id'] in ('F','G'):s.update(status='pending',evidence=[],reason=None)
        sha=h.write_atomic(self.root,state)
        self.assert_blocked('USE_REAL_VERIFY_FOR_PHASE_F',lc.step,self.root,sha,'F','completed',['fake:flag'],None)

    def test_verify_executes_fixed_gate_and_keeps_failure_checkpoint(self):
        self.prepare(complete=True)
        state,_=h.load_state(self.root)
        for s in state['publication']['steps']:
            if s['id'] in ('F','G'):s.update(status='pending',evidence=[],reason=None)
        sha=h.write_atomic(self.root,state)
        self.deliver()
        with patch.dict(os.environ,{'DENTCAST_FIXTURE_FAIL':'1'}):
            result=lc.verify(self.root,sha,'exact-title','exact-caption')
        self.assertEqual(result['status'],'blocked')
        self.assertIn('INCOMPLETE',result['verification']['output'])
        state,_=h.load_state(self.root)
        self.assertEqual(next(s for s in state['publication']['steps'] if s['id']=='F')['status'],'failed')
        self.assertNotIn('output',state['publication']['context']['validation'][-1])

    def test_finish_requires_completed_plan_and_fresh_delivery(self):
        initial=self.prepare()
        self.assert_blocked('PUBLICATION_STEPS_UNFINISHED',lc.finish,self.root,initial['sha256'])

    def test_finish_without_pushed_checkpoint_does_not_delete_it(self):
        initial=self.prepare(complete=True)
        self.assert_blocked('FRESH_SYNCHRONIZED_REMOTE_REQUIRED',lc.finish,self.root,initial['sha256'])
        self.assertTrue((self.root/h.STATE_PATH).exists())

    def test_fresh_failed_gate_prevents_cleanup_despite_old_success_receipt(self):
        initial=self.prepare(complete=True);self.deliver()
        with patch.dict(os.environ,{'DENTCAST_FIXTURE_FAIL':'1'}):
            result=lc.finish(self.root,initial['sha256'])
        self.assertEqual(result['status'],'blocked')
        self.assertTrue((self.root/h.STATE_PATH).exists())
        self.assertFalse(lc.pending(self.root))

    def test_complete_cleanup_requires_remote_deletion_confirmation(self):
        initial=self.prepare(complete=True);self.deliver()
        result=lc.finish(self.root,initial['sha256'])
        self.assertEqual(result['status'],'cleanup_pending_delivery')
        self.assertFalse(result['publication_completed'])
        self.assertFalse((self.root/h.STATE_PATH).exists())
        self.assertTrue(lc.pending(self.root))
        self.assert_blocked('REMOTE_HANDOFF_NOT_REMOVED',lc.confirm_cleanup,self.root)
        run(self.root,'add','-u',h.STATE_PATH)
        lc.guard(self.root,'pre-commit')
        run(self.root,'commit','-m','cleanup only')
        self.assert_blocked('CLEANUP_NOT_DELIVERED',lc.confirm_cleanup,self.root)
        run(self.root,'push','origin','main')
        self.assertTrue(lc.confirm_cleanup(self.root)['publication_completed'])
        self.assertFalse(lc.pending(self.root))

    def test_cleanup_failure_restores_same_fixed_file(self):
        initial=self.prepare(complete=True);self.deliver();lc.finish(self.root,initial['sha256'])
        self.assert_blocked('CLEANUP_DELIVERY_PENDING',h.save,self.root,self.p,initial=True)
        restored=lc.restore_cleanup(self.root)
        self.assertEqual(restored['status'],'checkpoint_restored')
        state,_=h.load_state(self.root)
        self.assertEqual(state['publication']['status'],'cleanup_pending')
        self.assertIsNotNone(state['publication']['blocker'])
        self.assertFalse(lc.pending(self.root))

    def test_unguarded_deletion_and_unrelated_cleanup_commit_are_blocked(self):
        initial=self.prepare(complete=True);self.deliver()
        raw=(self.root/h.STATE_PATH).read_bytes();(self.root/h.STATE_PATH).unlink()
        self.assert_blocked('UNGUARDED_HANDOFF_DELETION',lc.guard,self.root,'pre-commit')
        (self.root/h.STATE_PATH).write_bytes(raw)
        lc.finish(self.root,initial['sha256'])
        (self.root/'unrelated.txt').write_text('unrelated')
        run(self.root,'add','unrelated.txt')
        self.assert_blocked('CLEANUP_COMMIT_MUST_ONLY_DELETE_HANDOFF',lc.guard,self.root,'pre-commit')

    def test_precommit_checks_staged_checkpoint_and_actual_staged_index(self):
        initial=self.prepare()
        self.assert_blocked('LATEST_HANDOFF_MUST_BE_STAGED',lc.guard,self.root,'pre-commit')
        run(self.root,'add',h.STATE_PATH)
        lc.guard(self.root,'pre-commit')
        (self.root/'note.html').write_text('step changed page')
        self.assert_blocked('CHECKPOINT_REQUIRED_BEFORE_COMMIT_OR_STOP',lc.guard,self.root,'stop')
        self.assert_blocked('CHECKPOINT_REQUIRED_BEFORE_COMMIT_OR_STOP',lc.guard,self.root,'pre-commit')

    def test_ci_accepts_clean_committed_checkpoint_even_on_detached_head(self):
        self.prepare();self.deliver()
        run(self.root,'switch','--detach')
        lc.guard(self.root,'ci')

    def test_actual_installed_git_hook_rejects_a_stale_checkpoint(self):
        self.prepare()
        folder=self.root/'.githooks';folder.mkdir()
        (folder/'pre-commit').write_bytes((ROOT/'.githooks/pre-commit').read_bytes())
        (folder/'pre-commit').chmod(0o755)
        run(self.root,'config','core.hooksPath','.githooks')
        (self.root/'note.html').write_text('uncheckpointed edit')
        run(self.root,'add','note.html',h.STATE_PATH)
        result=run(self.root,'commit','-m','must fail',check=False)
        self.assertNotEqual(result.returncode,0)
        self.assertIn('Commit blocked',result.stderr)

    def test_paper_only_uses_catalog_check_without_running_page_verifier(self):
        initial=self.prepare(complete=True,paper=True);self.deliver()
        with patch.dict(os.environ,{'DENTCAST_FIXTURE_FAIL':'1'}):
            result=lc.finish(self.root,initial['sha256'])
        self.assertEqual(result['status'],'cleanup_pending_delivery')
        self.assertEqual(result['verification']['kind'],'paper_catalog_gate')

    def test_paper_only_final_handoff_uses_stage_delivery(self):
        initial=self.prepare(complete=True,paper=True)
        catalog='dentcast_cabinet_full_catalog.json'
        data=json.loads((self.root/catalog).read_text());data['papers'][0]['title']='fixture title'
        (self.root/catalog).write_text(json.dumps(data))
        state,_=h.load_state(self.root)
        sha=h.save(self.root,state['publication'],expected=initial['sha256'],note='Reviewed catalog enrichment')['sha256']
        result=lc.stage_delivery(self.root,sha,[catalog])
        self.assertEqual(result['status'],'delivery_staged')
        run(self.root,'commit','-m','paper-only final handoff');run(self.root,'push','origin','main')
        self.assertEqual(lc.finish(self.root,result['sha256'])['status'],'cleanup_pending_delivery')

    def test_paper_only_stage_delivery_requires_the_finished_ledger(self):
        self.prepare(paper=True)
        sha=h.load_state(self.root)[1]
        self.assert_blocked('STAGE_DELIVERY_ONLY_AT_FIXED_CUT',lc.stage_delivery,self.root,sha,
                            ['dentcast_cabinet_full_catalog.json'])

    def test_bare_delivery_boolean_is_not_completion_evidence(self):
        self.prepare(complete=True)
        state,_=h.load_state(self.root);state['publication']['context']['delivery']=[True]
        sha=h.write_atomic(self.root,state);self.deliver()
        self.assert_blocked('DELIVERY_EVIDENCE_REQUIRED',lc.finish,self.root,sha)

    def test_ci_rejects_deleted_unfinished_checkpoint_from_parent_commit(self):
        self.prepare();self.deliver()
        (self.root/h.STATE_PATH).unlink();run(self.root,'add','-u',h.STATE_PATH)
        run(self.root,'commit','-m','invalid deletion')
        self.assert_blocked('CI_UNFINISHED_HANDOFF_DELETION',lc.guard,self.root,'ci')

    def test_native_stop_adapter_checks_real_state_without_mutating_it(self):
        self.prepare();self.deliver()
        script=ROOT/'scripts/publishing-stop-guard.py'
        env={**os.environ,'CLAUDE_PROJECT_DIR':str(self.root)}
        before=(self.root/h.STATE_PATH).read_bytes()
        result=subprocess.run([os.sys.executable,str(script)],input='{}',text=True,capture_output=True,env=env)
        self.assertEqual(result.stdout,'')
        (self.root/'note.html').write_text('unrecorded native edit')
        result=subprocess.run([os.sys.executable,str(script)],input='{}',text=True,capture_output=True,env=env)
        self.assertEqual(json.loads(result.stdout)['decision'],'block')
        self.assertEqual((self.root/h.STATE_PATH).read_bytes(),before)

    def test_native_post_tool_adapter_reads_json_and_does_not_write_state(self):
        self.prepare()
        script=ROOT/'scripts/cursor-parity-notice.mjs'
        before=(self.root/h.STATE_PATH).read_bytes()
        result=subprocess.run(['node',str(script)],input=json.dumps({'tool_input':{'file_path':'.dentcast/workflows/modules/08-des-fidelity.md'}}),
                              text=True,capture_output=True,env={**os.environ,'CLAUDE_PROJECT_DIR':str(self.root)})
        self.assertIn('هندآف ثابت',json.loads(result.stdout)['hookSpecificOutput']['additionalContext'])
        self.assertEqual((self.root/h.STATE_PATH).read_bytes(),before)

    def test_cleanup_confirmation_rejects_changed_work(self):
        initial=self.prepare(complete=True);self.deliver();lc.finish(self.root,initial['sha256'])
        (self.root/'note.html').write_text('changed after verification')
        self.assert_blocked('WORK_CHANGED_AFTER_CLEANUP',lc.confirm_cleanup,self.root)
        self.assertTrue(lc.pending(self.root))

    def test_interruption_after_private_receipt_before_unlink_can_be_restored(self):
        initial=self.prepare(complete=True);self.deliver()
        original=Path.unlink
        def fail_state(path,*args,**kwargs):
            if path==self.root/h.STATE_PATH:raise OSError('fixture crash before unlink')
            return original(path,*args,**kwargs)
        with patch.object(Path,'unlink',fail_state):
            self.assertRaises(OSError,lc.finish,self.root,initial['sha256'])
        self.assertTrue((self.root/h.STATE_PATH).exists())
        self.assertTrue(lc.pending(self.root))
        self.assertEqual(lc.restore_cleanup(self.root)['status'],'checkpoint_restored')

    def test_ci_checks_cleanup_in_a_fresh_clone_without_private_metadata(self):
        initial=self.prepare(complete=True);self.deliver();lc.finish(self.root,initial['sha256'])
        run(self.root,'add','-u',h.STATE_PATH);run(self.root,'commit','-m','cleanup');run(self.root,'push','origin','main')
        other=self.base/'ci-clone'
        subprocess.run(['git','clone',str(self.remote),str(other)],check=True,capture_output=True)
        self.assertFalse(lc.pending(other))
        lc.guard(other,'ci')

    def test_placeholder_cannot_be_bound_after_authoring_started(self):
        self.prepare()
        state,_=h.load_state(self.root)
        p=state['publication'];p.update(content_id='unassigned',category='pending')
        for row in p['steps']:
            if row['id']=='C.0':
                row.update(status='started');break
            row.update(status='completed',evidence=['fixture:intake'])
        sha=h.write_atomic(self.root,state)
        self.assert_blocked('BIND_ONLY_BEFORE_AUTHORING',lc.bind,self.root,sha,'note','insight',['note.html'],'fixture:identity')

    def placeholder_with_action(self, status, evidence):
        self.prepare()
        state,_=h.load_state(self.root)
        p=state['publication'];p.update(content_id='unassigned',category='pending')
        p['steps'][0].update(status='completed',evidence=['fixture:rules'])
        p['external_actions']=[{'id':'drive-rename','target':'drive:fixture-file','status':status,'evidence':evidence}]
        return h.write_atomic(self.root,state)

    def test_bind_after_completed_founder_requested_external_action_keeps_receipt(self):
        sha=self.placeholder_with_action('completed',['fixture:drive rename+move observed'])
        result=lc.bind(self.root,sha,'insight/note','insight',['note.html'],'fixture:identity')
        p=h.load_state(self.root)[0]['publication']
        self.assertEqual(result['status'],'checkpoint_written')
        self.assertEqual((p['content_id'],p['category']),('insight/note','insight'))
        self.assertEqual(p['external_actions'],[{'id':'drive-rename','target':'drive:fixture-file','status':'completed','evidence':['fixture:drive rename+move observed']}])

    def test_bind_rejects_unsettled_or_failed_external_action(self):
        for status,evidence in (('started',[]),('outcome_unknown',[]),('failed',['fixture:error'])):
            with self.subTest(status=status):
                self.setUp()
                sha=self.placeholder_with_action(status,evidence)
                self.assert_blocked('BIND_ONLY_BEFORE_AUTHORING',lc.bind,self.root,sha,'note','insight',['note.html'],'fixture:identity')

    def test_bind_after_external_action_still_rejects_started_authoring(self):
        sha=self.placeholder_with_action('completed',['fixture:observed'])
        state,_=h.load_state(self.root)
        for row in state['publication']['steps']:
            if row['id']=='C.0':
                row.update(status='started');break
            row.update(status='completed',evidence=['fixture:intake'])
        sha=h.write_atomic(self.root,state)
        self.assert_blocked('BIND_ONLY_BEFORE_AUTHORING',lc.bind,self.root,sha,'note','insight',['note.html'],'fixture:identity')

    def test_cli_cannot_seed_completed_plan_or_replace_real_phase_f_with_a_flag(self):
        self.prepare(complete=True)
        state,_=h.load_state(self.root)
        for row in state['publication']['steps']:
            if row['id'] in ('F','G'):row.update(status='pending',evidence=[],reason=None)
        sha=h.write_atomic(self.root,state)
        payload=copy.deepcopy(state['publication'])
        next(s for s in payload['steps'] if s['id']=='F').update(status='completed',evidence=['forged:flag'])
        path=self.base/'input.json';path.write_text(json.dumps(payload))
        out,err=io.StringIO(),io.StringIO()
        with redirect_stdout(out),redirect_stderr(err):
            code=h.main(['--repo',str(self.root),'record','--input',str(path),'--expected-sha256',sha])
        self.assertEqual(code,2)
        self.assertEqual(json.loads(err.getvalue())['error'],'USE_REAL_VERIFY_FOR_PHASE_F')
        self.assertEqual(h.load_state(self.root)[1],sha)



class ChallengeCheckpointTests(unittest.TestCase):
    setUp = LifecycleTests.setUp
    prepare = LifecycleTests.prepare

    def at_challenge(self):
        self.prepare()
        state, _ = h.load_state(self.root)
        for row in state['publication']['steps']:
            if row['id'] == 'C.4.14':
                row.update(status='started', evidence=[], reason=None)
                break
            row.update(status='completed', evidence=['fixture:' + row['id']])
        return h.write_atomic(self.root, state)

    def test_completed_challenge_without_markup_is_rejected(self):
        digest = self.at_challenge()
        (self.root / 'note.html').write_text('<p data-x="data-dc-challenge-question">ordinary</p>\n'
                                             '<script>q("[data-dc-challenge-question]")</script>\n')
        with self.assertRaisesRegex(h.Blocked, 'C.4.14 completed means Challenge; record skipped for an ordinary post'):
            lc.step(self.root, digest, 'C.4.14', 'completed', ['fixture:challenge'], None, 'Reviewed page edit')
        result = lc.step(self.root, digest, 'C.4.14', 'skipped', [], 'ordinary post, not a Challenge', 'Reviewed page edit')
        self.assertEqual(h.next_step(h.load_state(self.root)[0]['publication']), 'C.5.0')
        self.assertTrue(result['sha256'])

    def test_completed_challenge_with_real_markup_is_accepted(self):
        digest = self.at_challenge()
        (self.root / 'note.html').write_text('<p data-dc-challenge-question data-dc-challenge-image="/insight/x.webp">Q</p>\n')
        lc.step(self.root, digest, 'C.4.14', 'completed', ['fixture:challenge'], None, 'Reviewed page edit')
        self.assertEqual(h.next_step(h.load_state(self.root)[0]['publication']), 'C.5.0')

if __name__=='__main__':unittest.main()
