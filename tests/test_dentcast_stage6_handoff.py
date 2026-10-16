"""Stage 6: separate operators resume the SAME pinned plan, never trust chat."""
import copy
import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / filename)
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj


remote = load("s6_remote", "tools/dentcast_github_memory.py")
routes = load("s6_routes", "tools/dentcast_stage3_route.py")
handoff = load("s6_handoff", "tools/dentcast_stage6_handoff.py")
mock = load("s6_mock", "tests/test_dentcast_github_memory.py")
REV = "b" * 40
D = "a" * 64
RECEIPT = {"schema": "dc-public-receipt-v1",
           "validation": {"contract_checked": True, "input_bound": True,
                          "source_verified": True},
           "input_digest": D, "output_digest": D, "source_revision": REV}
KWS = {"input_digest": D, "output_digest": D,
       "gate": "local_integrity_checked",
       "public_receipt": RECEIPT,
       "receipt_digest": remote.digest(RECEIPT)}
A = {"family": "claude", "model": "synthetic-only", "session": "independent-context-1"}
B = {"family": "cursor", "model": "synthetic-only", "session": "independent-context-2"}
C = {"family": "codex", "model": "synthetic-only", "session": "independent-context-3"}


class Stage6HandoffTests(unittest.TestCase):
    def setUp(self):
        self.git = mock.FakeGit()
        self.store = remote.RemoteMemory(self.git)
        self.plan = routes.compile_steps({
            "has_text": True, "has_paper": False,
            "category": "clinical", "challenge": False,
            "source_revision": REV,
        })
        self.assertEqual(self.plan["status"], "compiled_staging_requires_operator")
        self.store.begin("handoff-run", REV, remote.digest(self.plan), A)

    def next(self):
        # Fresh object to emulate an unrelated agent/client resuming by run ID
        return handoff.handoff(remote.RemoteMemory(self.git),
                               "handoff-run", self.plan)

    def test_three_independent_operator_clients_and_explicit_pause(self):
        self.assertEqual(self.next()["next_step"]["step_id"], "intake:route")
        self.store.append("handoff-run", A, "step_completed", "intake:route", **KWS)
        self.assertEqual(self.next()["next_step"]["step_id"], "page:draft")
        self.store.append("handoff-run", B, "step_paused", "page:draft",
                          gate="blocked")
        stopped = self.next()
        self.assertEqual(stopped["status"], "blocked_awaiting_explicit_recovery")
        self.assertIsNone(stopped["next_step"])
        self.assertEqual(stopped["paused_step_id"], "page:draft")
        self.store.append("handoff-run", C, "step_recovered", "page:draft")
        self.assertEqual(self.next()["next_step"]["step_id"], "page:draft")
        self.store.append("handoff-run", C, "step_completed", "page:draft", **KWS)
        new = self.next()
        self.assertEqual(new["next_step"]["step_id"], "taxonomy:lock")
        self.assertEqual(new["completed_count"], 2)
        self.assertFalse(new["real_publish_completed"])
        self.assertEqual([ev["actor"]["family"] for ev in
                          self.store.snapshot("handoff-run")["events"]],
                         ["claude", "claude", "cursor", "codex", "codex"])

    def test_missing_step_cannot_be_accepted_as_next(self):
        self.store.append("handoff-run", A, "step_completed", "page:draft", **KWS)
        with self.assertRaisesRegex(ValueError, "GAP_OR_OUT_OF_ORDER"):
            self.next()

    def test_rogue_plan_and_source_revision_rejected(self):
        changed = copy.deepcopy(self.plan)
        changed["ordered_steps"][1]["module_id"] = "brain"
        with self.assertRaisesRegex(ValueError, "PLAN_FINGERPRINT_CHANGED"):
            handoff.handoff(self.store, "handoff-run", changed)
        changed = copy.deepcopy(self.plan)
        changed["source_revision"] = "c" * 40
        with self.assertRaisesRegex(ValueError, "PLAN_FINGERPRINT_CHANGED"):
            handoff.handoff(self.store, "handoff-run", changed)

    def test_paused_step_wrong_canonical_position_fails_closed(self):
        self.store.append("handoff-run", A, "step_paused", "brain:append")
        with self.assertRaisesRegex(ValueError, "PAUSE_NOT_AT_NEXT_UNFINISHED"):
            self.next()

    def test_full_step_replay_never_means_real_publication(self):
        for step in self.plan["ordered_steps"]:
            self.store.append("handoff-run", A, "step_completed",
                              step["step_id"], **KWS)
        end = self.next()
        self.assertEqual(end["status"], "all_contract_steps_staged_not_published")
        self.assertIsNone(end["next_step"])
        self.assertFalse(end["real_publish_completed"])
        self.assertFalse(end["execution_authorized"])
        # An unverified finish event is not publication success.
        self.store.append("handoff-run", A, "staging_finished", "run:finished")
        self.assertEqual(self.next()["status"],
                         "all_contract_steps_staged_not_published")

    def test_failed_finish_with_missing_steps_is_caught(self):
        self.store.append("handoff-run", A, "staging_finished", "run:finished")
        with self.assertRaisesRegex(ValueError, "PREMATURE_STAGING_FINISH"):
            self.next()


if __name__ == "__main__":
    unittest.main()
