"""Explicit mechanical fixtures; no scientific review or human approval is claimed.

Dependency invalidation through the canonical writer (the Fast Local journal
was retired with cut 1 on 2026-11-07). "record" is an ordinary checkpoint write
over the current ledger: it is where changed bytes are detected.
"""
import copy
import unittest
from unittest.mock import patch
import test_dentcast_publish_handoff as fixtures
import test_dentcast_publish_three_deliveries as three
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc


class DependencyRecoveryTests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp

    def start(self):
        self.p["steps"] = lc.plan()
        self.p["context"]["decisions"].append({
            "kind": "first_cut_lead_provenance_v1", "origin": "not_applicable",
            "source_ref": "fixture:page-already-has-prose",
            "evidence": ["fixture:synthetic-lead-origin-review"]})
        return h.save(self.root, self.p, initial=True)

    def source(self):
        (self.root/'source.txt').write_text('fixture source v1')
        self.p['target_paths'].append('source.txt')
        self.p['context']['inputs'] = [{'ref':'source.txt', 'sha256':h.digest(b'fixture source v1')}]
        self.p['context']['approvals'] = [{'scope':'fixture text', 'status':'confirmed',
            'decision':'fixture only original bytes', 'evidence':['fixture:original-approval']}]

    def walk(self, sha, until='0'):
        for row in self.p['steps']:
            sid=row['id']
            sha=lc.step(self.root,sha,sid,'started',[],None)['sha256']
            sha=lc.step(self.root,sha,sid,'completed',['fixture:'+sid],None)['sha256']
            if sid==until: return sha
        self.fail('unknown fixture boundary')

    def record(self, sha, note):
        p=h.load_state(self.root)[0]['publication']
        return h.save(self.root,p,expected=sha,note=note)

    def test_workflow_drift_has_a_durable_exit_without_erasing_history(self):
        d=self.walk(self.start()['sha256'])
        (self.root/h.WORKFLOW_PATHS[0]).write_text('fixture rule changed')
        with self.assertRaisesRegex(h.Blocked,'WORKFLOW_CHANGE_REQUIRES_STEP_INVALIDATION'):
            self.record(d,'fixture reviewed changed rule')
        with self.assertRaisesRegex(h.Blocked,'WORKFLOW_CHANGE_REQUIRES_STEP_INVALIDATION'):
            lc.invalidate(self.root,d,'0','fixture too narrow')
        final=lc.invalidate(self.root,d,'rules','fixture reviewed affected rules')
        saved,_=h.load_state(self.root)
        audit=saved['publication']['context']['decisions'][-1]
        self.assertEqual(audit['kind'],h.INVALIDATION)
        self.assertEqual(audit['superseded']['steps'][0]['evidence'],['fixture:rules'])
        self.assertEqual(final['next_step'],'rules')

    def test_source_byte_change_blocks_old_hash_and_old_approval(self):
        self.source();d=self.walk(self.start()['sha256'],'C.2')
        (self.root/'source.txt').write_text('fixture source v2')
        with self.assertRaisesRegex(h.Blocked,'INPUT_BYTES_CHANGED_RECONCILE:source.txt'):
            self.record(d,'fixture generic note is not new evidence')
        final=lc.invalidate(self.root,d,'rules','fixture changed source')
        p=h.load_state(self.root)[0]['publication']
        self.assertTrue(all(s['status']=='pending' for s in p['steps']))
        self.assertEqual(p['context']['approvals'][0]['status'],'pending')
        self.assertEqual(p['context']['inputs'][0]['sha256'],h.digest(b'fixture source v2'))
        self.assertEqual(p['context']['decisions'][-1]['superseded']['approvals'][0]['status'],'confirmed')
        self.assertEqual(final['next_step'],'rules')

    def test_page_edit_requires_invalidation_and_preserves_unaffected_prefix(self):
        self.source();d=self.walk(self.start()['sha256'],'C.2')
        (self.root/'note.html').write_text('fixture changed approved page')
        with self.assertRaisesRegex(h.Blocked,'APPROVED_PAGE_CHANGED_INVALIDATE'):
            self.record(d,'fixture note alone')
        result=lc.invalidate(self.root,d,'C.2','fixture page changed')
        p=h.load_state(self.root)[0]['publication']
        self.assertEqual(result['next_step'],'C.2')
        self.assertEqual(p['steps'][0]['status'],'completed')
        self.assertEqual(p['context']['approvals'][0]['status'],'pending')

    def test_link_wrappers_and_cache_stamp_do_not_revoke_text_approval(self):
        self.source()
        (self.root/'note.html').write_text('<p>fixture exact text</p><script src="x?v=1"></script>')
        d=self.walk(self.start()['sha256'],'C.2')
        (self.root/'note.html').write_text('<p>fixture <a href="/related">exact</a> text</p><script src="x?v=2"></script>')
        out=self.record(d,'fixture reviewed links and stamp, unchanged prose')
        p=h.load_state(self.root)[0]['publication']
        self.assertEqual(out['next_step'],'C.0.5')
        self.assertEqual(p['context']['approvals'][0]['status'],'confirmed')

    def test_related_capsules_added_at_4_9_do_not_revoke_prose_approval(self):
        self.source()
        page=('<p>fixture approved body</p><div class="dc-related-section"><h2>کاوش بیشتر</h2>'
              '<div class="dc-related-capsules"><a href="/glossary/" class="dc-related-capsule">دانشنامه</a>{}</div></div>')
        (self.root/'note.html').write_text(page.format(''))
        d=self.walk(self.start()['sha256'],'C.2')
        (self.root/'note.html').write_text(page.format(
            '<a class="dc-related-capsule" href="/x/sibling.html">fixture sibling label</a>'
            '<a href="/y.html" class="ep-related-link">fixture episode label</a>'))
        d=self.record(d,'fixture reviewed 4.9 capsules, unchanged prose')['sha256']
        p=h.load_state(self.root)[0]['publication']
        self.assertEqual(p['context']['approvals'][0]['status'],'confirmed')
        (self.root/'note.html').write_text(page.format('').replace('approved body','edited body'))
        with self.assertRaisesRegex(h.Blocked,'APPROVED_PAGE_CHANGED_INVALIDATE'):
            self.record(d,'fixture changed approved prose')

    def test_non_prose_and_intact_verbatim_approvals_survive_later_page_step(self):
        self.source()
        self.p['context']['approvals'] = [
            {'scope':'title', 'status':'confirmed', 'decision':'fixture title',
             'evidence':['fixture:title']},
            {'scope':'pillar', 'status':'confirmed', 'decision':'fixture pillar',
             'evidence':['fixture:pillar']},
            {'scope':'challenge', 'status':'confirmed', 'decision':'ordinary post',
             'evidence':['fixture:challenge']},
            {'scope':'exam-questions', 'status':'confirmed', 'decision':'two MCQs',
             'evidence':['fixture:exam']},
            {'scope':'keywords', 'status':'confirmed', 'decision':'fixture kw',
             'evidence':['fixture:keywords']}]
        (self.root/'note.html').write_text('<meta name="keywords" content="fixture kw"><h1>fixture title</h1><p>body</p>')
        d=self.walk(self.start()['sha256'],'C.2')
        (self.root/'note.html').write_text('<meta name="keywords" content="fixture kw"><h1>fixture title</h1><p>body</p><div>credit capsule</div>')
        d=self.record(d,'fixture reviewed later canonical page step')['sha256']
        p=h.load_state(self.root)[0]['publication']
        self.assertEqual([a['status'] for a in p['context']['approvals']],['confirmed']*5)
        (self.root/'note.html').write_text('<h1>fixture retitled</h1><p>body</p>')
        with self.assertRaisesRegex(h.Blocked,'APPROVED_PAGE_CHANGED_INVALIDATE'):
            self.record(d,'fixture changed approved title')

    def test_committed_approval_text_reconstructs_without_private_observation(self):
        self.source()
        (self.root/'note.html').write_text('<p>fixture exact text</p>')
        first=self.start()
        # Local fixture only: exercise committed-baseline reconstruction.
        fixtures.run(self.root,'add','.')
        fixtures.run(self.root,'commit','-m','fixture approved baseline')
        h.observation_path(self.root).unlink()
        (self.root/'note.html').write_text('<p>fixture <a href="/related">exact</a> text</p>')
        p=h.load_state(self.root)[0]['publication']
        out=h.save(self.root,p,expected=first['sha256'],note='fixture unchanged prose')
        self.assertEqual(h.load_state(self.root)[0]['publication']['context']['approvals'][0]['status'],'confirmed')
        (self.root/'note.html').write_text('<p>fixture changed text</p>')
        with self.assertRaisesRegex(h.Blocked,'APPROVED_PAGE_CHANGED_INVALIDATE'):
            h.save(self.root,p,expected=out['sha256'],note='fixture old approval is insufficient')

    def test_canonical_input_change_cannot_retain_approval(self):
        self.source();initial=self.start()
        d=lc.step(self.root,initial['sha256'],'rules','started',[],None)['sha256']
        d=lc.step(self.root,d,'rules','completed',['fixture:rules'],None)['sha256']
        (self.root/'source.txt').write_text('fixture changed')
        with self.assertRaisesRegex(h.Blocked,'INPUT_BYTES_CHANGED'):
            lc.step(self.root,d,'0','started',[],None,note='fixture note')
        result=lc.invalidate(self.root,d,'rules','fixture invalidation')
        p=h.load_state(self.root)[0]['publication']
        self.assertEqual(p['context']['approvals'][0]['status'],'pending')
        self.assertEqual(result['next_step'],'rules')
        # A direct record may not update hashes while retaining old approval.
        (self.root/'source.txt').write_text('fixture third version')
        p['context']['approvals'][0].update(status='confirmed',decision='fixture new approval',evidence=['fixture:new'])
        # First save approval for current source after explicit invalidation.
        h.refresh_local_inputs(self.root,p)
        # New binding plus confirmed evidence in a single generic write is not an invalidation.
        with self.assertRaises(h.Blocked):
            h.save(self.root,p,expected=result['sha256'],note='fixture bypass attempt')

    def test_stale_invalidation_is_rejected(self):
        d=self.walk(self.start()['sha256'])
        before=(self.root/h.STATE_PATH).read_bytes()
        with self.assertRaisesRegex(h.Blocked,'STALE_HANDOFF_WRITE'):
            lc.invalidate(self.root,'0'*64,'rules','fixture stale')
        self.assertEqual((self.root/h.STATE_PATH).read_bytes(),before)
        lc.invalidate(self.root,d,'0','fixture suffix')
        with self.assertRaisesRegex(h.Blocked,'STALE_HANDOFF_WRITE'):
            lc.invalidate(self.root,d,'rules','fixture retry')

    def test_unchanged_and_unrelated_files_do_not_invalidate_evidence(self):
        d=self.walk(self.start()['sha256'])
        (self.root/'unrelated.txt').write_text('fixture unrelated')
        # Existing scope gate remains; unrelated work is not silently adopted.
        with self.assertRaisesRegex(h.Blocked,'UNREVIEWED_PATHS_OUTSIDE_PUBLICATION'):
            self.record(d,'fixture unrelated')
        (self.root/'unrelated.txt').unlink()
        self.assertEqual(self.record(d,'fixture unchanged scoped work')['next_step'],'A')

    def test_watched_source_cannot_be_removed_to_hide_drift(self):
        self.source();first=self.start()
        p=copy.deepcopy(h.load_state(self.root)[0]['publication']);p['target_paths'].remove('source.txt')
        (self.root/'source.txt').write_text('fixture drift')
        with self.assertRaisesRegex(h.Blocked,'WATCHED_PATHS_CANNOT_BE_DROPPED'):
            h.save(self.root,p,expected=first['sha256'],note='fixture concealment')

    def test_external_outcome_and_history_survive_invalidation(self):
        first=self.start();d=lc.step(self.root,first['sha256'],'rules','started',[],None)['sha256']
        d=lc.step(self.root,d,'rules','completed',['fixture:rules'],None)['sha256']
        p=h.load_state(self.root)[0]['publication']
        p['external_actions']=[{'id':'fixture-upload','target':'fixture:drive','status':'outcome_unknown','evidence':[]}]
        d=h.save(self.root,p,expected=d,note='fixture unknown outcome')['sha256']
        result=lc.invalidate(self.root,d,'rules','fixture dependency drift')
        p2=h.load_state(self.root)[0]['publication']
        self.assertEqual(p2['external_actions'],p['external_actions'])
        with self.assertRaisesRegex(h.Blocked,'EXTERNAL_OUTCOME_UNKNOWN'):
            lc.step(self.root,result['sha256'],'rules','started',[],None)



class BaselineReadTests(unittest.TestCase):
    setUp=three.ThreeDeliveriesTests.setUp
    prepare=three.ThreeDeliveriesTests.prepare
    start=three.ThreeDeliveriesTests.start
    walk=three.ThreeDeliveriesTests.walk
    deliver=three.ThreeDeliveriesTests.deliver

    def test_advance_reads_fixed_sources_once_and_checks_delivery_once(self):
        d=self.start();d=self.walk(d,'C.6');d=self.deliver('fixture Push 2')
        with patch.object(h,'git',wraps=h.git) as calls:
            result=lc.advance(self.root,d,start_next=True)
        self.assertEqual(result['transitions_written'][0]['id'],'C.8')
        args=[c.args[1:] for c in calls.call_args_list]
        self.assertEqual(sum(a[0]=='ls-remote' for a in args),1)
        for path in h.WORKFLOW_PATHS:
            self.assertEqual(sum(a[0]=='show' and a[1].endswith(':'+path) for a in args),1,path)
        # Each public operation creates a new scope; mutable bytes are not cached.
        with patch.object(h,'git',wraps=h.git) as later:
            lc.advance(self.root,result['sha256'],sid='C.8',evidence=['fixture:step'],start_next=True)
        self.assertFalse(any(c.args[1]=='ls-remote' for c in later.call_args_list))

    def test_save_point_needs_no_remote_read_before_the_next_step(self):
        d=self.start();d=self.walk(d,'C.4.9');d=self.deliver('fixture save point')
        with patch.object(h,'git',wraps=h.git) as calls:
            lc.advance(self.root,d,start_next=True)
        self.assertFalse(any(c.args[1]=='ls-remote' for c in calls.call_args_list))

    def test_cache_never_reuses_worktree_or_origin(self):
        d=self.start();d=self.walk(d,'C.4.9');d=self.deliver('fixture save point')
        @h.baseline_read_session
        def observe_twice():
            first=h.inspect(self.root)
            (self.root/'note.html').write_text('fixture drift during operation')
            second=h.inspect(self.root)
            return first,second
        first,second=observe_twice()
        self.assertNotIn('WORK_OR_INDEX_CHANGED',first['issues'])
        self.assertIn('WORK_OR_INDEX_CHANGED',second['issues'])

if __name__=='__main__':unittest.main()
