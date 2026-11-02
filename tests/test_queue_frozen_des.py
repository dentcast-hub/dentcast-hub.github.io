"""Founder standing order 1405/08/11: a publish-queue item's DES/Fidelity never
blocks its publish (publish-queue.md «حکم دائمی DES و Fidelity صف"), while a
record changed after installation still fails."""
from pathlib import Path
import json
import sys
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import verify_publish as vp  # noqa: E402
import queue_install_des as qi  # noqa: E402

CID = 'notecast/episode-999'
REC = {'scored_at': '2026-11-02', 'sources': [{'des_version': '3.5', 'des_score': 26, 'band': 'D'}]}


def files(rec, registry):
    return {'plus/des-scores.json': json.dumps({CID: rec}, ensure_ascii=False),
            vp.QUEUE_FROZEN: json.dumps(registry, ensure_ascii=False)}


def run(rec, registry):
    fs = files(rec, registry)
    rep = vp.Report(CID)
    rep.fail('4.13 DES', 'fid0 claim_quote is not on the page for [\'u2\']')
    rep.fail('8 pillar', 'not listed')
    with mock.patch.object(vp, 'exists', lambda p: p in fs), mock.patch.object(vp, 'read', lambda p: fs[p]):
        vp.apply_queue_frozen(rep, CID)
    return rep


class QueueFrozenTests(unittest.TestCase):
    def entry(self, sha, status='confirmed'):
        return {CID: {'queue_ref': 'queue/99-x', 'record_sha256': sha,
                      'approval': {'status': status, 'decision': 'd', 'evidence': ['e']}}}

    def test_same_hash_algorithm_in_both_tools(self):
        self.assertEqual(vp.queue_frozen_sha256(REC), qi.record_sha256(REC))

    def test_installed_record_turns_des_fails_into_warnings_only(self):
        rep = run(REC, self.entry(vp.queue_frozen_sha256(REC)))
        steps = [(r[0], r[1]) for r in rep.rows]
        self.assertIn(('WARN', '4.13 DES'), steps)
        self.assertIn(('FAIL', '8 pillar'), steps)          # other gates untouched
        self.assertNotIn(('FAIL', '4.13 DES'), steps)

    def test_changed_record_fails(self):
        changed = {**REC, 'scored_at': '2026-11-03'}
        rep = run(changed, self.entry(vp.queue_frozen_sha256(REC)))
        self.assertIn(('FAIL', '4.13 frozen'), [(r[0], r[1]) for r in rep.rows])
        self.assertIn(('FAIL', '4.13 DES'), [(r[0], r[1]) for r in rep.rows])

    def test_unconfirmed_approval_fails(self):
        rep = run(REC, self.entry(vp.queue_frozen_sha256(REC), status='pending'))
        self.assertIn(('FAIL', '4.13 frozen'), [(r[0], r[1]) for r in rep.rows])

    def test_no_registry_entry_changes_nothing(self):
        rep = run(REC, {})
        self.assertEqual([r[0] for r in rep.rows], ['FAIL', 'FAIL'])


TEXT_01 = open(ROOT / 'tests/fixtures/queue-05-text.md', encoding='utf-8').read()


class FrozenTextTests(unittest.TestCase):
    """Founder order 1405/08/11: on publish day the text does not move."""
    CID = 'notecast/episode-44'

    def guard(self, text, synced=(), added=()):
        import tempfile
        with tempfile.TemporaryDirectory() as t:
            Path(t, '01-متن.md').write_text(text, encoding='utf-8')
            units = qi.U.split_page(self.CID, [{'citation': {'doi': '10.1080/23337931.2017.1301211'}}])
            return qi.body_guard(Path(t), self.CID, units, list(synced), list(added))

    def test_published_page_carries_its_frozen_text(self):
        self.assertEqual(self.guard(TEXT_01), [])

    def test_a_line_missing_from_the_page_is_reported(self):
        self.assertTrue(self.guard(TEXT_01 + '\n\nجمله‌ای که روی صفحه نیست.'))

    def test_a_date_change_is_not_a_text_change(self):
        s = [{'before': 'تاریخ انتشار: 2026-10-29', 'after': 'تاریخ انتشار: 2026-11-02'}]
        self.assertEqual(self.guard(TEXT_01, synced=s), [])

    def test_a_reworded_body_sentence_is_reported(self):
        s = [{'before': 'اعمال سایلن', 'after': 'اعمال سایلن با دقت'}]
        self.assertTrue(self.guard(TEXT_01, synced=s))


if __name__ == '__main__':
    unittest.main()
