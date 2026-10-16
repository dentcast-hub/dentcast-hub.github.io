"""Stage 7 independent parity oracle: actual sandbox outputs, not agent assertions."""
import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIGEST = "a" * 64
REVISION = "b" * 40


def load(label, relative):
    spec = importlib.util.spec_from_file_location(label, ROOT / relative)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


oracle = load("stage7_parity_oracle", "tools/audit_dentcast_stage7_parity.py")
routes = load("stage7_compiler", "tools/dentcast_stage3_route.py")
runner = load("stage7_runner", "tools/dentcast_stage3_orchestrator.py")
patcher = load("stage7_patcher", "tools/dentcast_stage3_apply.py")
bridge = load("stage7_bridge", "tools/dentcast_stage3_bridge.py")


def fa(category, filename, *, en=False, challenge=False, count=2,
       marker=True, specialist_link=False):
    domain = "dentcast.ir" if category == "litecast" else "dentcast.org"
    current = category + ("/en/" if en else "/") + filename
    canonical = "https://" + domain + "/" + current
    links = "".join(
        '<a href="/litecast/lite-CAST1.html">Relevant</a>' if category == "litecast"
        else '<a href="/sharehub/share-18.html">Relevant</a>'
        for _ in range(count)
    )
    if specialist_link:
        links += '<a href="/glossary/margin.html">Specialist concept</a>'
    lang = 'lang="en" dir="ltr"' if en else 'lang="fa" dir="rtl"'
    toggle = ('<a class="lang-btn" href="../' + filename + '">فارسی</a>'
              if en else
              ("" if category == "litecast" or challenge
               else '<a class="lang-btn" href="en/' + filename + '">English</a>'))
    notify = '<meta name="dc-notify" content="true">' if marker and not en else ""
    noindex = '<meta name="robots" content="noindex, follow">' if en else ""
    return (f'<html {lang}><head><link rel="canonical" href="{canonical}">'
            f'<meta property="og:url" content="{canonical}">{notify}{noindex}'
            f'</head><body>{toggle}<div class="dc-related-section">{links}</div>'
            f'<h1>عنوان ساختگی برای تست</h1></body></html>')


def request(category="sharehub", paper=False, challenge=False):
    return {"has_text": True, "has_paper": paper,
            "category": category, "challenge": challenge}


def synthetic_report(inv):
    values = {}
    type_defaults = {
        "digest": DIGEST, "optional_digest": DIGEST,
        "text": "synthetic", "bool_true": True, "bool_false": False,
        "nonnegative": 0, "positive": 1, "zero": 0, "one": 1,
        "list": [], "mapping": {},
    }
    for field, typ in inv["required_output_schema"].items():
        values[field] = type_defaults[typ]
    if inv["step"]["step_id"] == "intake:route":
        values["route"] = inv["context"]["route"]
    return {
        "step_id": inv["step"]["step_id"],
        "module_id": inv["step"]["module_id"],
        "input_digest": inv["input_digest"],
        "status": "completed",
        "outputs": values,
        "external_receipt_digest": DIGEST,
        "approval_receipt_digest": None,
        "error": None,
    }


class IndependentParityTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        marker = self.root / bridge.SANDBOX_MARKER
        marker.write_text(json.dumps({
            "purpose": "dentcast-stage3-disposable-test",
            "allow_real_publication": False,
            "allow_remote_mutation": False,
        }), encoding="utf-8")

    def write_pair(self, category="sharehub", filename="share-999.html",
                   with_english=True, challenge=False, count=2,
                   marker=True, specialist_link=False):
        folder = self.root / category
        folder.mkdir(exist_ok=True)
        (folder / filename).write_text(
            fa(category, filename, challenge=challenge, count=count,
               marker=marker, specialist_link=specialist_link),
            encoding="utf-8")
        if with_english:
            en = folder / "en"
            en.mkdir(exist_ok=True)
            (en / filename).write_text(
                fa(category, filename, en=True, count=0, marker=False),
                encoding="utf-8")
        return folder / filename

    def test_all_seven_canonical_routes_have_mechanical_barriers(self):
        queries = [
            request(), request(paper=True), request(category="litecast"),
            request(category="litecast", paper=True),
            request(challenge=True), request(challenge=True, paper=True),
            {"has_text": False, "has_paper": True},
        ]
        for q in queries:
            with self.subTest(query=q):
                plan = routes.compile_steps(q)
                self.assertEqual(plan["status"],
                                 "compiled_staging_requires_operator")
                self.assertEqual(oracle.inspect_route(plan), [])
                self.assertFalse(plan["execution_authorized"])

    def test_bad_stamp_order_is_caught_even_if_module_contracts_accept_it(self):
        plan = routes.compile_steps(request())
        steps = plan["ordered_steps"]
        last = next(s for s in steps if s["step_id"] == "build:version-final")
        steps.remove(last)
        target = next(i for i, s in enumerate(steps)
                      if s["step_id"] == "build:rebuild")
        steps.insert(target, last)
        self.assertTrue(any("STAMP" in s or "CANONICAL_ORDER" in s
                            for s in oracle.inspect_route(plan)))

    def test_missing_bilingual_mirror_is_not_an_accepted_publish(self):
        self.write_pair(with_english=False)
        issues = oracle.inspect_page_pair(self.root, "sharehub", "share-999.html")
        self.assertIn("EN_MIRROR_MISSING", issues)

    def test_complete_pair_has_reverse_toggles_noindex_and_push_marker(self):
        self.write_pair()
        self.assertEqual(oracle.inspect_page_pair(
            self.root, "sharehub", "share-999.html"), [])

    def test_phantom_fa_toggle_or_wrong_en_link_rejected(self):
        p = self.write_pair()
        en = self.root / "sharehub/en/share-999.html"
        en.write_text(en.read_text().replace("../share-999.html", "../other.html"))
        self.assertIn("EN_TOGGLE_WRONG",
                      oracle.inspect_page_pair(self.root, "sharehub", "share-999.html"))
        en.write_text(en.read_text().replace("../other.html", "../share-999.html")
                      .replace('name="robots" content="noindex, follow"',
                               'name="robots" content="index, follow"'))
        self.assertIn("EN_NOINDEX_MISSING",
                      oracle.inspect_page_pair(self.root, "sharehub", "share-999.html"))

    def test_total_five_link_budget_crosses_every_related_link_kind(self):
        self.write_pair(count=6)
        self.assertIn("RELATED_LINKS_EXCEED_5",
                      oracle.inspect_page_pair(self.root, "sharehub", "share-999.html"))

    def test_litecast_ir_domain_and_no_specialist_links_or_language_toggle(self):
        self.write_pair(category="litecast", filename="lite-CAST99.html",
                        with_english=False, marker=False)
        self.assertEqual(oracle.inspect_page_pair(
            self.root, "litecast", "lite-CAST99.html"), [])
        p = self.root / "litecast/lite-CAST99.html"
        p.write_text(p.read_text() +
                     '<a href="/glossary/ferrule.html">Not allowed</a>')
        self.assertIn("LITECAST_SPECIALIST_LINK_FORBIDDEN",
                      oracle.inspect_page_pair(self.root, "litecast", "lite-CAST99.html"))

    def test_litecast_never_inherits_org_canonical(self):
        p = self.write_pair(category="litecast", filename="lite-CAST99.html",
                            with_english=False, marker=False)
        p.write_text(p.read_text().replace("dentcast.ir", "dentcast.org"))
        self.assertIn("FA_CANONICAL_IDENTITY",
                      oracle.inspect_page_pair(self.root, "litecast", "lite-CAST99.html"))

    def test_challenge_has_no_mirror_but_keeps_push_marker(self):
        self.write_pair(category="sharehub", challenge=True, with_english=False)
        self.assertEqual(oracle.inspect_page_pair(
            self.root, "sharehub", "share-999.html", challenge=True), [])
        p = self.root / "sharehub/share-999.html"
        p.write_text(p.read_text().replace(
            '<meta name="dc-notify" content="true">', ""))
        self.assertIn("PUSH_MARKER_INCORRECT",
                      oracle.inspect_page_pair(self.root, "sharehub", "share-999.html",
                                               challenge=True))

    def test_real_staging_edit_receipt_passes_but_incomplete_page_is_caught(self):
        self.write_pair(with_english=False)
        existing = self.root / "sharehub/share-999.html"
        state = runner.begin(request(), "stage7-local", REVISION)
        state = runner.submit(state, synthetic_report(runner.next_invocation(state)))
        inv = runner.next_invocation(state)
        self.assertEqual(inv["step"]["step_id"], "page:draft")
        new_content = existing.read_text().replace("عنوان ساختگی", "عنوان نهایی")
        intent = {
            "step_id": "page:draft", "input_digest": inv["input_digest"],
            "author_asserted_gates": inv["step"]["approval_gates"],
            "edits": [{"path": "sharehub/share-999.html",
                       "before_sha256": hashlib.sha256(existing.read_bytes()).hexdigest(),
                       "content_utf8": new_content}],
        }
        execution = patcher.apply_intent(state, intent, self.root)
        self.assertEqual(execution["status"], "staging_files_applied")
        receipt = self.root / "integrity-receipt.json"
        receipt.write_text(json.dumps(execution["artifact_receipt"]))
        completed = bridge.verify_local_receipt(
            state, synthetic_report(inv) |
            {"external_receipt_digest": execution["artifact_receipt_digest"]},
            receipt, self.root)
        self.assertEqual(completed["next_index"], 2)
        self.assertTrue(completed["history"][-1]["local_artifact_integrity_verified"])
        # Passing self-reported staging receipts is NOT proof of canonical page.
        self.assertIn("EN_MIRROR_MISSING",
                      oracle.inspect_page_pair(self.root, "sharehub", "share-999.html"))
        # Independent operator supplies the missing counterpart: now check passes.
        en = self.root / "sharehub/en"
        en.mkdir()
        (en / "share-999.html").write_text(
            fa("sharehub", "share-999.html", en=True, count=0, marker=False))
        self.assertEqual(oracle.inspect_page_pair(
            self.root, "sharehub", "share-999.html"), [])

    def test_corrupt_or_missing_page_fails_closed(self):
        self.assertEqual(oracle.inspect_page_pair(
            self.root, "sharehub", "share-999.html"), ["MISSING_FA_PAGE"])
        self.assertIn("INVALID_PUBLIC_PAGE_IDENTITY", oracle.inspect_page_pair(
            self.root, "../tools", "script.py"))


if __name__ == "__main__":
    unittest.main()
