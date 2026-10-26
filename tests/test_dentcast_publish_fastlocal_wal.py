"""Real Git checkout + bare remote regression tests for optional Fast Local WAL.

Fixtures certify checkpoint mechanics, not execution of scientific stages.
"""
import copy
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import test_dentcast_publish_handoff as fixtures
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc
import dentcast_publish_fastlocal as wal


class FastLocalWALTests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp

    def start(self):
        self.p["steps"] = lc.plan()
        self.p["context"]["decisions"].append({"kind": lc.DELIVERY_POLICY})
        # C.4.9 completion now requires the first-cut lead declaration.
        self.p["context"]["decisions"].append({
            "kind": "first_cut_lead_provenance_v1", "origin": "not_applicable",
            "source_ref": "fixture:page-already-has-prose",
            "evidence": ["fixture:synthetic-lead-origin-review"]})
        return h.save(self.root, self.p, initial=True)

    def test_batch_skips_are_durable_and_do_not_rescan_git_per_event(self):
        initial=self.start()
        d=wal.begin(self.root,initial["sha256"])["digest"]
        d=wal.step(self.root,d,"rules","started")["digest"]
        d=wal.step(self.root,d,"rules","completed",["fixture:rules-reviewed"])["digest"]
        d=wal.step(self.root,d,"0","started")["digest"]
        d=wal.step(self.root,d,"0","completed",["fixture:routing-reviewed"])["digest"]
        # No semantic action is done by a batch call: skip reasons are reviewed
        # fixture inputs; the test proves storage and ordering mechanics only.
        items=[{"id":"A","status":"skipped","evidence":[],"reason":"fixture:category-check-not-applicable"},
               {"id":"B.1","status":"skipped","evidence":[],"reason":"fixture:type-already-known"}]
        with patch.object(wal,"read",wraps=wal.read) as reads, \
             patch.object(h,"snapshot",side_effect=AssertionError("FULL_GIT_SCAN")):
            result=wal.batch(self.root,d,items)
        self.assertEqual(reads.call_count,1)
        self.assertEqual(len(result["transitions_written"]),2)
        self.assertEqual(wal.inspect(self.root)["next_step"],"B.2")
        durable=wal.read(self.root)[1]
        self.assertEqual(durable["steps"][3]["status"],"skipped")

    def test_batch_refuses_premature_completion_and_stale_or_invalid_order(self):
        initial=self.start()
        d=wal.begin(self.root,initial["sha256"])["digest"]
        pair=[{"id":"rules","status":"started","evidence":[],"reason":None},
              {"id":"rules","status":"completed","evidence":["fixture:fake-action"],"reason":None}]
        with self.assertRaisesRegex(h.Blocked,"WAL_BATCH_ACTION_MUST_RUN_BETWEEN_CALLS"):
            wal.batch(self.root,d,pair)
        with self.assertRaisesRegex(h.Blocked,"NOT_NEXT_CANONICAL_STEP"):
            wal.batch(self.root,d,[{"id":"A","status":"skipped","evidence":[],"reason":"wrong-order"}])
        with self.assertRaisesRegex(h.Blocked,"STALE_WAL_WRITE"):
            wal.batch(self.root,"0"*64,[pair[0]])
        self.assertEqual(wal.inspect(self.root)["digest"],d)

    def test_unrelated_step_count_does_not_require_heavy_checkpoint(self):
        initial = self.start()
        d = wal.begin(self.root, initial["sha256"])["digest"]
        with patch.object(h, "snapshot", side_effect=AssertionError("FULL_GIT_SCAN")):
            for item in self.p["steps"][:12]:
                d = wal.step(self.root, d, item["id"], "started")["digest"]
                out = wal.step(self.root, d, item["id"], "completed",
                               ["fixture:" + item["id"]])
                d = out["digest"]
                self.assertEqual(out["status"], "fastlocal_active")
        # A real pause still materializes and validates the canonical state.
        result = wal.flush(self.root, d, "fixture:reviewed actual work before pause")
        self.assertFalse(result["first_delivery_cut"])
        self.assertIn("no delivery is due", result["next_action"])
        saved, _ = h.load_state(self.root)
        self.assertTrue(all(s["status"] == "completed"
                            for s in saved["publication"]["steps"][:12]))

    def test_byte_limit_preserves_previous_durable_state_until_reviewed_flush(self):
        initial = self.start()
        d = wal.begin(self.root, initial["sha256"])["digest"]
        before = wal.location(self.root).read_bytes()
        with patch.object(wal, "MAX_BYTES", len(before) + 1):
            with self.assertRaisesRegex(h.Blocked, "WAL_LIMIT_FLUSH_FIRST"):
                wal.step(self.root, d, "rules", "started")
        self.assertEqual(wal.location(self.root).read_bytes(), before)
        self.assertEqual(wal.inspect(self.root)["digest"], d)
        result = wal.flush(self.root, d, "fixture:reviewed state at byte limit")
        self.assertEqual(result["next_step"], "rules")

    def test_two_steps_flush_to_one_canonical_handoff(self):
        init = self.start()
        begin = wal.begin(self.root, init["sha256"])
        d = begin["digest"]
        for sid in ("rules", "0"):
            start = wal.step(self.root, d, sid, "started")
            d = start["digest"]
            end = wal.step(self.root, d, sid, "completed",
                           ["fixture:not_actual_semantic_review:" + sid])
            d = end["digest"]
        with self.assertRaisesRegex(h.Blocked, "WAL_ACTIVE"):
            h.inspect(self.root)
        with self.assertRaisesRegex(h.Blocked, "WAL_ACTIVE"):
            h.save(self.root, self.p, expected=init["sha256"],
                   note="not allowed outside WAL")
        result = wal.flush(self.root, d, 'fixture:reviewed actual canonical state')
        self.assertEqual(result["status"], "checkpoint_materialized")
        self.assertFalse(wal.active(self.root))
        saved, sha = h.load_state(self.root)
        self.assertEqual(sha, result["sha256"])
        self.assertEqual(saved["publication"]["steps"][0]["status"], "completed")
        self.assertEqual(saved["publication"]["steps"][1]["status"], "completed")
        self.assertEqual(result["next_step"], "A")

    def test_incomplete_started_step_never_becomes_completed(self):
        init = self.start()
        d = wal.begin(self.root, init["sha256"])["digest"]
        d = wal.step(self.root, d, "rules", "started")["digest"]
        self.assertEqual(wal.inspect(self.root)["next_step"], "rules")
        wal.flush(self.root, d, 'fixture:reviewed actual canonical state')
        state, _ = h.load_state(self.root)
        self.assertEqual(state["publication"]["steps"][0]["status"], "started")

    def test_rejects_stale_writer_and_unsafe_skip(self):
        init = self.start()
        d = wal.begin(self.root, init["sha256"])["digest"]
        with self.assertRaisesRegex(h.Blocked, "CANONICAL_SKIP_REASON_REQUIRED"):
            wal.step(self.root, d, "rules", "skipped", reason="shortcut")
        x = wal.step(self.root, d, "rules", "started")
        with self.assertRaisesRegex(h.Blocked, "STALE_WAL_WRITE"):
            wal.step(self.root, d, "rules", "completed", ["invented"])
        self.assertEqual(wal.inspect(self.root)["digest"], x["digest"])

    def test_flush_without_review_receipt_fails_closed(self):
        init = self.start()
        digest = wal.begin(self.root, init["sha256"])["digest"]
        with self.assertRaisesRegex(h.Blocked, "WAL_FLUSH_REQUIRES_REAL_REVIEW_NOTE"):
            wal.flush(self.root, digest)
        self.assertTrue(wal.active(self.root))

    def test_torn_tail_requires_explicit_repair_with_expected_hash(self):
        init = self.start()
        d = wal.begin(self.root, init["sha256"])["digest"]
        d = wal.step(self.root, d, "rules", "started")["digest"]
        with wal.location(self.root).open("ab") as f:
            f.write(b'{"version": "incomplete"')
            f.flush()
        with self.assertRaisesRegex(h.Blocked, "WAL_TORN_TAIL"):
            wal.inspect(self.root)
        with self.assertRaisesRegex(h.Blocked, "WAL_TAIL_NOT_SAFELY_REPAIRABLE"):
            wal.repair(self.root, "0"*64)
        recovered = wal.repair(self.root, d)
        self.assertEqual(recovered["status"], "wal_tail_repaired")
        self.assertEqual(wal.inspect(self.root)["next_step"], "rules")
        with self.assertRaisesRegex(h.Blocked, "CANONICAL_SKIP_REASON_REQUIRED"):
            wal.step(self.root, recovered["digest"], "rules", "skipped",
                     reason="cannot skip started action")
        wal.flush(self.root, recovered["digest"], "fixture:reviewed recovered prefix")
        state, _ = h.load_state(self.root)
        self.assertEqual(state["publication"]["steps"][0]["status"], "started")

    def test_complete_record_corruption_is_not_repaired(self):
        init = self.start()
        wal.begin(self.root, init["sha256"])
        with wal.location(self.root).open("ab") as f:
            f.write(b'{}\n')
        with self.assertRaisesRegex(h.Blocked, "WAL_HASH_CHAIN_INVALID"):
            wal.inspect(self.root)
        with self.assertRaisesRegex(h.Blocked, "WAL_HASH_CHAIN_INVALID"):
            wal.repair(self.root, "0"*64)

    def test_first_cut_is_boundary_not_agent_stop(self):
        init = self.start()
        digest = wal.begin(self.root, init["sha256"])["digest"]
        for row in self.p["steps"]:
            if row["id"] == "C.4.10.1":
                break
            sid = row["id"]
            digest = wal.step(self.root, digest, sid, "started")["digest"]
            digest = wal.step(self.root, digest, sid, "completed",
                              ["fixture:transport-only:" + sid])["digest"]
        st = wal.inspect(self.root)
        self.assertTrue(st["first_delivery_cut"])
        with self.assertRaisesRegex(h.Blocked, "FIRST_PUSH_REQUIRED"):
            wal.step(self.root, digest, "C.4.10.1", "started")
        result = wal.flush(self.root, digest, 'fixture:reviewed first-cut prefix')
        self.assertTrue(result["first_delivery_cut"])
        self.assertEqual(result["next_step"], "C.4.10.1")
        self.assertIn("SAME agent", result["next_action"])
        state, _ = h.load_state(self.root)
        self.assertEqual(lc.delivery_boundary(state["publication"]), 1)

    def test_precommit_rejects_unflushed_local_wal(self):
        init = self.start()
        wal.begin(self.root, init["sha256"])
        with self.assertRaisesRegex(h.Blocked, "WAL_MUST_BE_MATERIALIZED"):
            lc.guard(self.root, "pre-commit")

    def test_wal_engine_change_fails_closed(self):
        init = self.start()
        wal.begin(self.root, init["sha256"])
        original_read = Path.read_bytes
        def changed_engine_only(path):
            return (b"modified module" if path.name == "dentcast_publish_fastlocal.py"
                    else original_read(path))
        with patch.object(Path, "read_bytes", autospec=True,
                          side_effect=changed_engine_only):
            with self.assertRaisesRegex(h.Blocked, "WAL_ENGINE_CHANGED"):
                wal.inspect(self.root)

    def test_enroll_really_related_new_path_without_extra_checkpoint_push(self):
        init = self.start()
        digest = wal.begin(self.root, init["sha256"])["digest"]
        new_path = "insight/new-image.webp"
        file = self.root / new_path
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(b"RIFF-not-publishable-fixture")
        enrolled = wal.enroll_target(self.root, digest, new_path,
                                     "fixture:reviewed-new-image-path")
        with self.assertRaisesRegex(h.Blocked, "WAL_TARGET_MUST_BE_REVIEWED"):
            wal.enroll_target(self.root, enrolled["digest"], new_path,
                              "fixture:duplicate")
        out = wal.flush(self.root, enrolled["digest"],
                        "Fixture: reviewed new scoped image byte and path")
        self.assertEqual(out["status"], "checkpoint_materialized")
        state, _ = h.load_state(self.root)
        self.assertIn(new_path, state["publication"]["target_paths"])

    def test_flush_recovers_after_canonical_save_with_unsorted_wal_targets(self):
        init = self.start()
        digest = wal.begin(self.root, init["sha256"])["digest"]
        # WAL enrollment order differs from h.save's sorted canonical inventory.
        new_path = "insight/a-reviewed-image.webp"
        image = self.root / new_path
        image.parent.mkdir(parents=True, exist_ok=True)
        image.write_bytes(b"RIFF-test-content-only")
        digest = wal.enroll_target(
            self.root, digest, new_path, "fixture:reviewed-image")["digest"]
        with patch.object(Path, "unlink",
                          side_effect=OSError("fixture:crash-before-WAL-unlink")):
            with self.assertRaisesRegex(OSError, "crash-before-WAL-unlink"):
                wal.flush(self.root, digest, "fixture:explicit-review")
        self.assertTrue(wal.active(self.root))
        saved, canonical_sha = h.load_state(self.root)
        self.assertEqual(saved["publication"]["target_paths"],
                         sorted(["note.html", new_path]))
        # Retry validates existing canonical bytes; it must not write again.
        generation = saved["generation"]
        recovered = wal.flush(self.root, digest, "fixture:explicit-review")
        after, after_sha = h.load_state(self.root)
        self.assertFalse(wal.active(self.root))
        self.assertEqual(recovered["sha256"], canonical_sha)
        self.assertEqual(after_sha, canonical_sha)
        self.assertEqual(after["generation"], generation)
        self.assertEqual(after["publication"], saved["publication"])

    def test_flush_recovery_still_rejects_a_genuinely_different_wal(self):
        init = self.start()
        digest = wal.begin(self.root, init["sha256"])["digest"]
        first_path = "insight/a-reviewed-image.webp"
        image = self.root / first_path
        image.parent.mkdir(parents=True, exist_ok=True)
        image.write_bytes(b"RIFF-test-content-only")
        digest = wal.enroll_target(
            self.root, digest, first_path, "fixture:reviewed-image")["digest"]
        with patch.object(Path, "unlink",
                          side_effect=OSError("fixture:interrupt-after-save")):
            with self.assertRaisesRegex(OSError, "interrupt-after-save"):
                wal.flush(self.root, digest, "fixture:explicit-review")
        # A new WAL target that was not part of the saved checkpoint
        # is real drift, not the harmless target_paths ordering mismatch.
        digest = wal.enroll_target(
            self.root, digest, "insight/different.webp",
            "fixture:subsequent-append")["digest"]
        with self.assertRaisesRegex(h.Blocked, "WAL_BASE_CHANGED_RECONCILE"):
            wal.flush(self.root, digest, "fixture:explicit-review")
        self.assertTrue(wal.active(self.root))

    def test_changed_workflow_source_invalidates_nonempty_wal(self):
        init = self.start()
        digest = wal.begin(self.root, init["sha256"])["digest"]
        digest = wal.step(self.root, digest, "rules", "started")["digest"]
        digest = wal.step(self.root, digest, "rules", "completed",
                          ["fixture:read-hard-rules"])["digest"]
        path = self.root / h.WORKFLOW_PATHS[0]
        path.write_text("changed fixture rule, intentional invalidation")
        with self.assertRaisesRegex(h.Blocked, "WORKFLOW_CHANGE_REQUIRES_STEP_INVALIDATION"):
            wal.flush(self.root, digest, "Fixture: reviewed changed workflow")
        self.assertTrue(wal.active(self.root))

    def test_journal_step_has_no_full_snapshots(self):
        init = self.start()
        d = wal.begin(self.root, init["sha256"])["digest"]
        with patch.object(h, "snapshot", wraps=h.snapshot) as snapshots:
            for sid in ("rules", "0"):
                d = wal.step(self.root, d, sid, "started")["digest"]
                d = wal.step(self.root, d, sid, "completed",
                             ["fixture:" + sid])["digest"]
        self.assertEqual(snapshots.call_count, 0)
        self.assertTrue(wal.active(self.root))


if __name__ == "__main__":
    unittest.main()
