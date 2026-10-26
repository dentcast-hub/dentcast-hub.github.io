"""Regressions for the Cursor path audit (round 3), on real local Git remotes.

The verifier and semantic results are explicit fixtures, not real scientific work.
"""
import unittest

import test_dentcast_publish_handoff as fixtures
import test_dentcast_publish_round2_fixes as round2
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc

run = fixtures.run


class Round3CursorTests(unittest.TestCase):
    R2 = round2.Round2Tests
    setUp = R2.setUp
    assert_blocked = R2.assert_blocked
    prepare = R2.prepare
    start = R2.start
    walk = R2.walk
    deliver = R2.deliver
    complete_two = R2.complete_two
    clone = R2.clone
    actions_delivers_third = R2.actions_delivers_third

    def test_confirm_cleanup_verifies_actions_delivery_three_after_pull(self):
        self.actions_delivers_third()
        run(self.root, 'pull', '-q', '--ff-only')
        self.assertFalse((self.root/h.STATE_PATH).exists())
        self.assertFalse(lc.pending(self.root))
        result = lc.confirm_cleanup(self.root)
        self.assertTrue(result['publication_completed'])
        self.assertEqual(result['delivered_by'], 'remote_final_delivery')
        self.assertEqual(result['cleanup_commit'], h.text_git(self.root, 'rev-parse', 'HEAD'))
        # An unpushed commit on top is not the delivered third commit.
        run(self.root, 'commit', '--allow-empty', '-m', 'local only')
        self.assert_blocked('CLEANUP_RECORD_MISSING_OR_INVALID', lc.confirm_cleanup, self.root)

    def test_confirm_cleanup_without_record_or_delivery_stays_blocked(self):
        self.complete_two()
        run(self.root, 'rm', '-q', h.STATE_PATH)
        run(self.root, 'commit', '-m', 'unguarded deletion', '--no-verify')
        self.assert_blocked('FINAL_RECEIPT_NOT_IN_DELIVERY_COMMIT', lc.confirm_cleanup, self.root)


if __name__ == '__main__':
    unittest.main()
