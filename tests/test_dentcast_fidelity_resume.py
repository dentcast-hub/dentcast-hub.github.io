"""Stage 5 true per-unit Fidelity resume, exact science routing and real remote CAS mock."""
import copy
import hashlib
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
D = "a" * 64
REV = "b" * 40
PROMPT = hashlib.sha256(
    (ROOT / ".dentcast/des-v3.4-knowledge.md").read_bytes()).hexdigest()


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / "tools" / filename)
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj


f = load("s5_resume", "dentcast_fidelity_resume.py")
m = load("s5_memory", "dentcast_github_memory.py")
stage4 = load("s5_fake_backend", "tests/test_dentcast_github_memory.py")
CHECKER = {"provider": "Anthropic", "model": "sonnet",
           "reasoning": "medium", "preflight_digest": D}
REVIEWER = {"provider": "Anthropic", "model": "opus",
            "reasoning": "high", "preflight_digest": D}
CLAUDE = {"family": "claude", "model": "sonnet", "session": "checker-1"}
CURSOR = {"family": "cursor", "model": "sonnet", "session": "checker-2"}
CODEX = {"family": "codex", "model": "sonnet", "session": "checker-3"}
OPUS = {"family": "claude", "model": "opus", "session": "reviewer-1"}
SOURCE = "Evidence supports the treatment outcome. Evidence differs in scope."


def block(n=72, pooled=False):
    out = {"mode": "FIDELITY", "scope": "SOURCE",
           "source_text": SOURCE, "text_basis": "FULL_TEXT",
           "units": [{"id": "u" + str(i), "text": "Claim number " + str(i)}
                     for i in range(1, n + 1)],
           "derivative_url": "https://dentcast.org/sharehub/share-18.html",
           "source_conclusion": "Evidence differs in scope."}
    if pooled:
        out["pooled_part"] = "S1"
    return out


def output(source, verdicts=None, only=None):
    verdicts = verdicts or {}
    units = [u for u in source["units"] if only is None or u["id"] in set(only)]
    claims = []
    for unit in units:
        verdict = verdicts.get(unit["id"], "MATCHES")
        claims.append({
            "id": unit["id"], "claim_quote": unit["text"],
            "verdict": verdict,
            "change_kind": "HEDGE_REMOVED" if verdict == "ALTERED" else None,
            "source_quote": "Evidence supports the treatment outcome.",
            "source_ref": None, "note": "synthetic-test-only",
        })
    vs = [x["verdict"] for x in claims]
    counts = {"matches": vs.count("MATCHES"), "altered": vs.count("ALTERED"),
              "reversed": vs.count("REVERSED"), "not_in_source": 0,
              "not_assessable": 0, "author_view": 0, "not_a_claim": 0}
    assessed, score, level = f.vp.des_fidelity_recompute(counts, "3.4")
    return {"des_version": "3.4", "mode": "FIDELITY",
            "scope": "SOURCE", "text_basis": "FULL_TEXT",
            "claims": claims, "counts": counts,
            "assessable": assessed, "fidelity_score": score, "level": level,
            "provisional": False,
            "source_conclusion": source["source_conclusion"],
            "fact_fa": "آزمون ساختگی", "interpretation_fa": "آزمون ساختگی"}


class FidelityResumeTests(unittest.TestCase):
    def setUp(self):
        self.api = stage4.FakeGit()
        self.store = m.RemoteMemory(self.api)
        self.store.begin("sci-test", REV, D, CLAUDE)
        self.block = block()

    def start(self, source_id="src0", source=None):
        self.block = source or self.block
        return f.begin_source(self.store, "sci-test", source_id, self.block,
                              CHECKER, REVIEWER, CLAUDE,
                              prompt_digest=PROMPT,
                              public_release_approval_digest=D)

    def checker(self, role, agent, data=None, only=None, source_id="src0"):
        return f.submit_checker(
            self.store, "sci-test", source_id, role, agent,
            data if data is not None else output(self.block, only=only),
            public_release_approval_digest=D, only_units=only)

    def test_72_claim_resume_across_claude_cursor_without_rerunning_first(self):
        self.start()
        self.checker("checker1", CLAUDE)
        first_snapshot = self.store.snapshot("sci-test")
        self.assertEqual(len(first_snapshot["events"]), 3)
        task = f.next_task(self.store, "sci-test", "src0")
        self.assertEqual(task["role"], "checker2")
        self.assertTrue(task["blind"])
        self.assertEqual(len(task["block"]["units"]), 72)
        self.assertNotIn("result", task)
        self.assertNotIn("checker1", json.dumps(task))
        self.checker("checker2", CURSOR)
        next_step = f.next_task(self.store, "sci-test", "src0")
        self.assertEqual(next_step["role"], "validate_final_vote")
        self.assertEqual(next_step["status"], "ready_for_existing_vote_cli")
        snap, meta, runs, others = f.state_of(self.store, "sci-test", "src0")
        self.assertEqual(len(runs), 2)
        self.assertEqual(len(runs["checker1"][0]["claims"]), 72)
        self.assertEqual(len(runs["checker2"][0]["claims"]), 72)
        self.assertEqual(runs["checker1"][1], "checker-1")
        self.assertEqual(runs["checker2"][1], "checker-2")
        self.assertEqual(len(snap["events"]), 4)
        self.assertEqual(snap["state"]["status"], "active")
        self.assertFalse(snap["state"]["real_publish_verified"])

    def test_disagreement_only_third_then_stronger_review_then_founder(self):
        self.start()
        self.checker("checker1", CLAUDE)
        self.checker("checker2", CURSOR,
                     output(self.block, {"u37": "ALTERED"}))
        t = f.next_task(self.store, "sci-test", "src0")
        self.assertEqual(t["role"], "checker3")
        self.assertEqual(t["only_units"], ["u37"])
        self.assertEqual([u["id"] for u in t["block"]["units"]], ["u37"])
        self.assertNotIn("checker1", json.dumps(t))
        third = output(self.block, {"u37": "ALTERED"}, only=["u37"])
        self.checker("checker3", CODEX, third, only=["u37"])
        review_task = f.next_task(self.store, "sci-test", "src0")
        self.assertEqual(review_task["role"], "review")
        self.assertEqual(review_task["units"], ["u37"])
        f.submit_reviewer_result(
            self.store, "sci-test", "src0", "review", OPUS,
            {"u37": {"agree": False, "reason": "Reviewer disputes scope"}},
            public_release_approval_digest=D)
        founder = f.next_task(self.store, "sci-test", "src0")
        self.assertEqual(founder["role"], "founder_review")
        self.assertEqual(founder["flagged_units"], ["u37"])
        self.assertEqual(founder["status"], "awaiting_explicit_founder_decision")
        _, _, runs, x = f.state_of(self.store, "sci-test", "src0")
        voted, tie, unresolved, unreviewed = f.engine.vote_source(
            [runs["checker1"][0], runs["checker2"][0], runs["checker3"][0]],
            reviewed=x["review"])
        self.assertIn("Stronger-model review disagrees", voted["claims"][36]["note"])
        self.assertEqual((tie, unresolved, unreviewed), ([], [], []))

    def test_all_three_answers_different_require_stronger_adjudication(self):
        self.start()
        self.checker("checker1", CLAUDE)
        self.checker("checker2", CURSOR,
                     output(self.block, {"u37": "ALTERED"}))
        self.checker("checker3", CODEX,
                     output(self.block, {"u37": "REVERSED"}, only=["u37"]),
                     only=["u37"])
        t = f.next_task(self.store, "sci-test", "src0")
        self.assertEqual(t["role"], "adjudication")
        self.assertEqual(t["units"], ["u37"])
        f.submit_reviewer_result(
            self.store, "sci-test", "src0", "adjudication", OPUS,
            {"u37": {"verdict": "ALTERED", "change_kind": "HEDGE_REMOVED",
                     "source_quote": "Evidence supports the treatment outcome.",
                     "note": "Adjudicator decision"}},
            public_release_approval_digest=D)
        next_stage = f.next_task(self.store, "sci-test", "src0")
        self.assertEqual(next_stage["role"], "review")
        self.assertEqual(next_stage["units"], ["u37"])

    def test_full_checker_must_not_submit_71_of_72(self):
        self.start()
        bad = output(self.block)
        bad["claims"].pop()
        with self.assertRaisesRegex(ValueError, "INCOMPLETE_FULL_CHECKER"):
            self.checker("checker1", CLAUDE, bad)
        self.assertEqual(f.next_task(self.store, "sci-test", "src0")["role"], "checker1")

    def test_same_context_and_changed_model_are_rejected(self):
        self.start()
        self.checker("checker1", CLAUDE)
        with self.assertRaisesRegex(ValueError, "CHECKERS_SHARE_CONTEXT_FORBIDDEN"):
            self.checker("checker2", CLAUDE)
        wrong = dict(CURSOR, model="gpt-different")
        with self.assertRaisesRegex(ValueError, "CHECKER_MODEL_OR_SESSION_NOT_PINNED"):
            self.checker("checker2", wrong)

    def test_changed_claim_quote_and_source_quote_fail(self):
        self.start()
        for mod in ("claim", "source", "score", "basis"):
            fake = output(self.block)
            if mod == "claim":
                fake["claims"][0]["claim_quote"] = "wrong"
            elif mod == "source":
                fake["claims"][0]["source_quote"] = "Invented quote"
            elif mod == "score":
                fake["fidelity_score"] = 1
            else:
                fake["text_basis"] = "ABSTRACT_ONLY"
            with self.subTest(mod=mod), self.assertRaises(ValueError):
                self.checker("checker1", CLAUDE, fake)

    def test_pooled_part_runs_only_one_call_then_external_merge(self):
        pooled = block(4, pooled=True)
        self.start("S1", pooled)
        self.checker("checker1", CLAUDE, output(pooled), source_id="S1")
        task = f.next_task(self.store, "sci-test", "S1")
        self.assertEqual(task["role"], "merge_pooled")
        self.assertTrue(task["no_checker_vote_on_pooled"])
        with self.assertRaisesRegex(ValueError, "WRONG_SCIENTIFIC_SUBSTEP"):
            self.checker("checker2", CURSOR, output(pooled), source_id="S1")

    def test_public_release_and_prompt_change_fail_closed(self):
        with self.assertRaisesRegex(ValueError, "PUBLIC_RELEASE_OR_PROMPT"):
            f.begin_source(self.store, "sci-test", "src0", self.block,
                           CHECKER, REVIEWER, CLAUDE,
                           prompt_digest=PROMPT, public_release_approval_digest=None)
        with self.assertRaisesRegex(ValueError, "PUBLIC_RELEASE_OR_PROMPT"):
            f.begin_source(self.store, "sci-test", "src0", self.block,
                           CHECKER, REVIEWER, CLAUDE,
                           prompt_digest=D, public_release_approval_digest=D)

    def test_fraudulent_or_missing_immutable_checkpoint_refuses_resume(self):
        self.start()
        self.checker("checker1", CLAUDE)
        filemap = self.api.commits[self.api.head_ref]["files"]
        snap = self.store.snapshot("sci-test")
        h = snap["events"][-1]["artifact_digests"][0]
        name = m.run_folder("sci-test") + "/artifacts/" + h + ".json"
        filemap[name]["payload"]["result"]["claims"][0]["verdict"] = "ALTERED"
        with self.assertRaisesRegex(ValueError, "ARTIFACT_REPLAY_INTEGRITY_FAILURE"):
            f.next_task(self.store, "sci-test", "src0")

    def test_duplicate_checker1_prevented_after_successful_resume(self):
        self.start()
        self.checker("checker1", CLAUDE)
        with self.assertRaisesRegex(ValueError, "WRONG_SCIENTIFIC_SUBSTEP"):
            self.checker("checker1", CURSOR)


if __name__ == "__main__":
    unittest.main()
