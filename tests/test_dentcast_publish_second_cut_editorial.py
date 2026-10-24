"""New editorial-first cut2 contract, with legacy v1 recovery preserved.

Tests use synthetic metadata to test the guard, NOT proof that science ran.
"""
import copy
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc


def sample(category="litecast", second="C.6", modern=True):
    p = {
        "content_id": "litecast/lite-CAST40" if category == "litecast" else "insight/insight100",
        "category": category,
        "target_paths": ["litecast/lite-CAST40.html"] if category == "litecast"
                        else ["insight/insight100.html", "insight/en/insight100.html"],
        "status": "in_progress", "blocker": None,
        "context": {"inputs": [], "decisions": [
            {"kind": lc.DELIVERY_POLICY},
            {"kind": "first_cut_lead_provenance_v1", "origin": "author_original",
             "source_ref": "fixture:source", "evidence": ["fixture:author-provided"]}],
            "approvals": [], "pending_questions": [],
            "validation": [], "delivery": [], "unrelated_changes": []},
        "steps": lc.plan(), "external_actions": []
    }
    if modern:
        p["context"]["decisions"].append({"kind": lc.DELIVERY_POLICY_V2})
        p["context"]["approvals"] = [
            {"scope": "title", "status": "confirmed", "decision": "fixture:exact title",
             "evidence": ["fixture:title approved"]},
            {"scope": "caption", "status": "not_required", "decision": "fixture:no separate caption",
             "evidence": ["fixture:no separate caption required"]},
        ]
    for step in p["steps"]:
        step["status"] = "completed"
        step["evidence"] = ["synthetic fixture: " + step["id"]]
        if step["id"] == "C.4.14" and category != "litecast":
            # An ordinary specialist article is NOT a Challenge.
            step["status"], step["evidence"], step["reason"] = (
                "skipped", [], "fixture: ordinary article, no Challenge")
        if step["id"] == second:
            break
    h.validate_publication(p)
    lc.require_plan(p)
    return p


def receipt(p):
    eng = p["category"] == "litecast"
    return {"kind": "second_cut_editorial_lock_v1",
            "scopes": [{"scope": scope, "status": "not_applicable" if eng and scope in
                        ("scientific", "pathways") else "resolved",
                        "evidence": ["fixture:reviewed " + scope]}
                       for scope in sorted(lc.EDITORIAL_SCOPES)],
            "english": {"status": "exempt" if eng else "ready",
                        "path": None if eng else "insight/en/insight100.html",
                        "evidence": ["fixture:actual-mirror-reviewed" if not eng
                                     else "fixture:LiteCast exemption"]},
            "evidence": ["fixture:editorial closure confirmed"]}


class EditorialSecondCutTests(unittest.TestCase):
    def assert_blocked(self, message, fn, *args):
        with self.assertRaisesRegex(h.Blocked, message):
            fn(*args)

    def test_legacy_cut_remains_at_science_step(self):
        old = sample(second="C.4.13", modern=False)
        self.assertEqual(lc.delivery_boundary(old), 2)
        self.assertFalse(lc.editorial_cut_v2(old))
        lc.require_fixed_cut_readiness(old)

    def test_new_cut_waits_through_all_editorial_steps(self):
        draft = sample(second="C.4.13")
        self.assertIsNone(lc.delivery_boundary(draft))
        self.assertEqual(h.next_step(draft), "C.4.14")
        done = sample(second="C.6")
        self.assertEqual(lc.delivery_boundary(done), 2)
        self.assert_blocked("SECOND_CUT_EDITORIAL_LOCK_REQUIRED",
                            lc.require_fixed_cut_readiness, done)
        done["context"]["decisions"].append(receipt(done))
        lc.require_fixed_cut_readiness(done)

    def test_scopes_cannot_be_omitted_or_duplicated(self):
        p = sample()
        item = receipt(p)
        p["context"]["decisions"].append(item)
        item["scopes"].pop()
        self.assert_blocked("SECOND_CUT_EDITORIAL_SCOPES_REQUIRED",
                            lc.require_fixed_cut_readiness, p)
        item["scopes"].append(copy.deepcopy(item["scopes"][0]))
        self.assert_blocked("SECOND_CUT_EDITORIAL_SCOPE_INVALID",
                            lc.require_fixed_cut_readiness, p)

    def test_unresolved_human_decision_is_still_a_blocker(self):
        p = sample()
        p["context"]["decisions"].append(receipt(p))
        p["context"]["approvals"] = [
            {"scope": "title", "status": "confirmed", "decision": "fixture:exact title",
             "evidence": ["fixture:title approved"]},
            {"scope": "caption", "status": "pending", "decision": None, "evidence": []},
        ]
        self.assert_blocked("DELIVERY_UNRESOLVED_APPROVAL",
                            lc.require_fixed_cut_readiness, p)
        p["context"]["approvals"][1].update(
            status="confirmed", decision="approved", evidence=["fixture:human decision"])
        lc.require_fixed_cut_readiness(p)

    def test_english_requires_real_enrolled_path_except_litecast_or_challenge(self):
        p = sample(category="insight")
        item = receipt(p)
        p["context"]["decisions"].append(item)
        lc.require_fixed_cut_readiness(p)
        p["target_paths"].remove("insight/en/insight100.html")
        self.assert_blocked("SECOND_CUT_ENGLISH_MIRROR_MISSING",
                            lc.require_fixed_cut_readiness, p)
        p["target_paths"].append("insight/en/insight100.html")
        item["english"]["status"] = "exempt"
        item["english"]["path"] = None
        self.assert_blocked("SECOND_CUT_ENGLISH_MIRROR_MISSING",
                            lc.require_fixed_cut_readiness, p)

    def test_no_multiple_or_fabricated_empty_lock(self):
        p = sample()
        item = receipt(p)
        p["context"]["decisions"].extend([item, copy.deepcopy(item)])
        self.assert_blocked("SECOND_CUT_EDITORIAL_LOCK_REQUIRED",
                            lc.require_fixed_cut_readiness, p)
        p["context"]["decisions"].pop()
        item["evidence"].clear()
        self.assert_blocked("SECOND_CUT_EDITORIAL_LOCK_FIELDS",
                            lc.require_fixed_cut_readiness, p)

    def test_enrolled_english_mirror_must_exist_on_disk_at_cut(self):
        p = sample(category="insight")
        p["context"]["decisions"].append(receipt(p))
        with tempfile.TemporaryDirectory() as folder:
            self.assert_blocked("SECOND_CUT_ENGLISH_FILE_NOT_ON_DISK",
                                lc.require_fixed_cut_readiness, p, Path(folder))
            en = Path(folder) / "insight/en/insight100.html"
            en.parent.mkdir(parents=True)
            en.write_text("<html lang='en'>fixture</html>", encoding="utf-8")
            lc.require_fixed_cut_readiness(p, Path(folder))

    def test_three_boundaries_still_exactly_three(self):
        p = sample(second="C.4.9")
        self.assertEqual(lc.delivery_boundary(p), 1)
        p = sample(second="C.6")
        p["context"]["decisions"].append(receipt(p))
        self.assertEqual(lc.delivery_boundary(p), 2)
        for step in p["steps"]:
            step["status"],step["evidence"] = "completed", ["fixture"]
        self.assertIsNone(lc.delivery_boundary(p))
        lc.require_fixed_cut_readiness(p)


if __name__ == "__main__":
    unittest.main()
