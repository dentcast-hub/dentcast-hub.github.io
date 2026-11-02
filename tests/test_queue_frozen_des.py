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


if __name__ == '__main__':
    unittest.main()
