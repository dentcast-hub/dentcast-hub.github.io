#!/usr/bin/env python3
"""Private-input binding, the pending-question record and honest write output.

Three defects of the 2026-11 plak-sefr/plak1-12 run:
  * `init` refused the documented `{"path": ..., "sha256": ...}` input because
    the path was not in `target_paths`, and a private input has no business in
    the checkout — so it must bind by digest instead.
  * `context.pending_questions` had no validated shape at all.
  * every write answered `"generation": 2`, a counter v3 does not persist.
"""
import copy
import json
import unittest
from pathlib import Path

import test_dentcast_publish_handoff as fixtures
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc

run = fixtures.run
ROOT = Path(__file__).resolve().parents[1]
DIGEST = h.digest(b"private founder text that never enters Git\n")


def question(**kw):
    record = {"message": "M1", "step": "C.2", "question": "Which pillar?", "answered": False}
    record.update(kw)
    return record


class PrivateInputBindingTests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp
    start = fixtures.HandoffTests.start
    state = fixtures.HandoffTests.state
    assert_blocked = fixtures.HandoffTests.assert_blocked

    def test_private_input_binds_by_digest_without_enrollment(self):
        # The shape the route must document: a digest, plus an opaque
        # out-of-repo location. Nothing is enrolled, nothing is resolved.
        self.p["context"]["inputs"] = [
            {"ref": "drive:cabinet/paper-1.pdf", "sha256": DIGEST, "note": "attached paper"}]
        result = self.start()
        self.assertEqual(result["status"], "checkpoint_written")
        self.assertEqual(self.p["target_paths"], ["note.html"])
        self.assertEqual(list(h.local_input_bindings(self.p)), [])
        self.assertEqual(h.local_only_inputs(self.root, self.p), set())
        self.assertEqual(self.state()["publication"]["context"]["inputs"],
                         self.p["context"]["inputs"])
        self.assertNotIn("PRIVATE", h.inspect(self.root)["issues"])

    def test_a_digest_in_the_location_field_is_refused(self):
        # The plak1-11 fallback `{"ref": "<sha256>"}`: it bound nothing, because
        # `ref` names where an input is, not what it hashes to.
        self.p["context"]["inputs"] = [{"ref": DIGEST}]
        self.assert_blocked("INPUT_DIGEST_MUST_BE_IN_SHA256:ref", self.start)
        self.p["context"]["inputs"] = [{"reference": DIGEST, "note": "paper"}]
        self.assert_blocked("INPUT_DIGEST_MUST_BE_IN_SHA256:reference", self.start)

    def test_a_private_binding_needs_a_real_digest(self):
        self.p["context"]["inputs"] = [{"ref": "drive:paper-1.pdf", "sha256": "not-a-digest"}]
        self.assert_blocked("INPUT_DIGEST_INVALID", self.start)

    def test_a_repo_path_input_must_still_be_enrolled_and_fingerprinted(self):
        self.p["context"]["inputs"] = [{"path": ".ignored/text-1.md", "sha256": DIGEST}]
        self.assert_blocked("INPUT_PATH_MUST_BE_ENROLLED_OR_BIND_BY_DIGEST:.ignored/text-1.md",
                            self.start)
        source = self.root / ".ignored/text-1.md"
        source.parent.mkdir()
        source.write_bytes(b"private founder text that never enters Git\n")
        self.p["target_paths"] = ["note.html", ".ignored/text-1.md"]
        result = self.start()
        self.assertEqual([path for _, path in h.local_input_bindings(self.p)],
                         [".ignored/text-1.md"])
        self.assertEqual(h.local_only_inputs(self.root, self.p), {".ignored/text-1.md"})
        # Immutable once bound: changed bytes stop the run, they do not re-bind.
        source.write_bytes(b"edited after binding\n")
        self.assert_blocked("INPUT_BYTES_CHANGED_RECONCILE:.ignored/text-1.md",
                            h.save, self.root, self.p, expected=result["sha256"])

    def test_a_bound_private_digest_cannot_be_swapped_under_resolved_steps(self):
        self.p["context"]["inputs"] = [{"ref": "drive:paper-1.pdf", "sha256": DIGEST}]
        self.p["steps"][0].update(status="completed", evidence=["receipt:intake"])
        result = self.start()
        self.p["context"]["inputs"] = [{"ref": "drive:paper-2.pdf", "sha256": h.digest(b"other\n")}]
        self.assert_blocked("INPUT_CHANGE_REQUIRES_STEP_INVALIDATION", h.save, self.root, self.p,
                            expected=result["sha256"], note="input replaced")

    def test_legacy_ref_to_an_enrolled_path_still_binds(self):
        self.p["context"]["inputs"] = [{"ref": "note.html", "sha256": h.digest(b"original\n")}]
        self.start()
        self.assertEqual([path for _, path in h.local_input_bindings(self.p)], ["note.html"])


class PendingQuestionShapeTests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp
    start = fixtures.HandoffTests.start
    assert_blocked = fixtures.HandoffTests.assert_blocked

    def test_canonical_record_is_accepted_and_still_blocks_resume(self):
        self.p["context"]["pending_questions"] = [question()]
        self.start()
        self.assertIn("PENDING_QUESTIONS", h.inspect(self.root)["issues"])

    def test_malformed_records_are_refused(self):
        for bad in ("Which pillar?", {"id": "q1", "step": "C.2", "topic": "pillar",
                                      "asked_via": "M1", "status": "asked"},
                    {"message": "M1", "step": "C.2", "question": "Which pillar?"}):
            self.p["context"]["pending_questions"] = [bad]
            self.assert_blocked("PENDING_QUESTION_FIELDS_INVALID", h.validate_publication, self.p)
        self.p["context"]["pending_questions"] = [question(message="M4")]
        self.assert_blocked("PENDING_QUESTION_MESSAGE_INVALID:M4", h.validate_publication, self.p)
        self.p["context"]["pending_questions"] = [question(step="")]
        self.assert_blocked("PENDING_QUESTION_STEP_AND_TEXT_REQUIRED", h.validate_publication, self.p)
        self.p["context"]["pending_questions"] = [question(question="  ")]
        self.assert_blocked("PENDING_QUESTION_STEP_AND_TEXT_REQUIRED", h.validate_publication, self.p)
        self.p["context"]["pending_questions"] = [question(answered="no")]
        self.assert_blocked("PENDING_QUESTION_ANSWERED_INVALID", h.validate_publication, self.p)
        self.p["context"]["pending_questions"] = [question(), question()]
        self.assert_blocked("DUPLICATE_PENDING_QUESTION", h.validate_publication, self.p)

    def test_an_answered_record_is_valid_and_the_cut_gate_is_unchanged(self):
        p = self.p
        p["context"]["pending_questions"] = [question(answered=True)]
        h.validate_publication(p)  # a record may carry its answer flag
        self.start()
        # Unchanged gate: every cut refuses a non-empty list, answered or not.
        self.assertIn("PENDING_QUESTIONS", h.inspect(self.root)["issues"])


class CommittedHistoryStillReadsTests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp
    start = fixtures.HandoffTests.start
    state = fixtures.HandoffTests.state

    def test_every_committed_completion_receipt_still_validates(self):
        receipts = sorted((ROOT / ".dentcast/publication-reports").rglob("*.completion.json"))
        self.assertGreaterEqual(len(receipts), 30)
        for path in receipts:
            payload = json.loads(path.read_text(encoding="utf-8"))
            publication = payload["state"]["publication"]
            h.validate_publication(publication)
            self.assertEqual(sorted(payload["state"]), ["publication", "snapshot"], path)
            self.assertNotIn("generation", payload["state"], path)

    def test_an_existing_handoff_reads_back_unchanged(self):
        result = self.start()
        raw = (self.root / h.STATE_PATH).read_bytes()
        state, sha = h.load_state(self.root)
        self.assertEqual(sha, result["sha256"])
        self.assertEqual(raw, (self.root / h.STATE_PATH).read_bytes())
        wire = json.loads(raw.decode("utf-8").split(h.BEGIN, 1)[1].split(h.END, 1)[0])
        self.assertEqual(set(wire), {"schema", "publication", "reconciliation"})
        self.assertEqual(wire["schema"], h.SCHEMA)


class WriteOutputTests(unittest.TestCase):
    setUp = fixtures.HandoffTests.setUp
    prepare = __import__("test_dentcast_publish_lifecycle").LifecycleTests.prepare

    def test_no_reset_generation_counter_is_reported_to_the_caller(self):
        initial = self.prepare()
        self.assertNotIn("generation", initial)
        begun = lc.step(self.root, initial["sha256"], "rules", "started", [], None)
        self.assertNotIn("generation", begun)
        result = lc.advance(self.root, begun["sha256"], "rules", ["fixture:rules-read"],
                            start_next=True)
        self.assertNotIn("generation", result)
        self.assertEqual(result["transitions_written"],
                         [{"id": "rules", "status": "completed"}, {"id": "0", "status": "started"}])
        # The digest is what a caller passes back, and it is a real identity.
        self.assertEqual(h.load_state(self.root)[1], result["sha256"])


if __name__ == "__main__":
    unittest.main()
