"""Independent Stage 7: execute unchanged canonical tools in a disposable checkout.

No Git push, no model judgment, no patient data and no production file edits.
"""
import base64
import hashlib
import importlib.util
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
D = "a" * 64
REV = "b" * 40


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj


stamp = load("s7_original_stamper", "tools/stamp-version.py")
router = load("s7_route", "tools/dentcast_stage3_route.py")
runner = load("s7_runner", "tools/dentcast_stage3_orchestrator.py")
editor = load("s7_editor", "tools/dentcast_stage3_apply.py")
bridge = load("s7_bridge", "tools/dentcast_stage3_bridge.py")
glossary_builder = load("s7_glossary_builder", "tools/build_pillar.py")
pairwise = load("s7_pairwise", "tools/audit_dentcast_stage7_pairwise.py")


def fake_report(inv, receipt=D):
    # Synthetic shape only; no clinical, approval or scientific proof.
    kinds = {"digest": D, "optional_digest": D, "text": "test",
             "bool_true": True, "bool_false": False, "nonnegative": 0,
             "positive": 1, "zero": 0, "one": 1, "list": [], "mapping": {}}
    obj = {name: kinds[type_name] for name, type_name
           in inv["required_output_schema"].items()}
    if inv["step"]["step_id"] == "intake:route":
        obj["route"] = inv["context"]["route"]
    return {"step_id": inv["step"]["step_id"], "module_id": inv["step"]["module_id"],
            "input_digest": inv["input_digest"], "status": "completed",
            "outputs": obj, "external_receipt_digest": receipt,
            "approval_receipt_digest": None, "error": None}


class LegacyToolSandboxTests(unittest.TestCase):
    def assert_phase_f_exit_matches_summary(self, run):
        match = re.search(r"(\d+) passed, (\d+) warned, (\d+) failed",
                          run.stdout)
        self.assertIsNotNone(match, run.stdout[-1500:] + run.stderr[-500:])
        failures = int(match.group(3))
        self.assertEqual(run.returncode, 1 if failures else 0,
                         run.stdout[-1500:] + run.stderr[-500:])

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="s7-real-")
        self.addCleanup(self.tmp.cleanup)
        self.sandbox = Path(self.tmp.name)
        (self.sandbox / bridge.SANDBOX_MARKER).write_text(json.dumps({
            "purpose": "dentcast-stage3-disposable-test",
            "allow_real_publication": False, "allow_remote_mutation": False
        }), encoding="utf-8")

    def test_original_stamp_version_real_execution_then_idempotent(self):
        # Preserve the EXISTING builder byte for byte: no replacement logic.
        (self.sandbox / "tools").mkdir()
        shutil.copy2(ROOT / "tools/stamp-version.py",
                     self.sandbox / "tools/stamp-version.py")
        source_fingerprints = {}
        rels = [p.relative_to(ROOT) for p in stamp.VERSION_INPUTS]
        for rel in rels:
            path = self.sandbox / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            if (ROOT / rel).is_file():
                data = (ROOT / rel).read_bytes()
                path.write_bytes(data)
                source_fingerprints[str(rel)] = hashlib.sha256(data).hexdigest()
        (self.sandbox / "service-worker.js").write_text(
            "const CACHE_NAME = 'dentcast-assets-old';\n", encoding="utf-8")
        (self.sandbox / "index.html").write_text(
            '<script src="dentcast-brain.json?v=old"></script>', encoding="utf-8")
        (self.sandbox / "player.html").write_text(
            '<script src="dentcast-brain.json?v=old"></script>', encoding="utf-8")
        def run_builder():
            result = subprocess.run(
                [sys.executable, str(self.sandbox / "tools/stamp-version.py")],
                cwd=self.sandbox, capture_output=True, text=True, timeout=30)
            self.assertEqual(result.returncode, 0, result.stderr)
        run_builder()
        expected = hashlib.sha256(b"".join(
            (self.sandbox / rel).read_bytes()
            for rel in rels if (self.sandbox / rel).is_file()
        )).hexdigest()[:10]
        worker = self.sandbox / "service-worker.js"
        self.assertIn("dentcast-assets-" + expected, worker.read_text())
        for html in ("index.html", "player.html"):
            self.assertIn("dentcast-brain.json?v=" + expected,
                          (self.sandbox / html).read_text())
        unchanged = worker.read_bytes()
        run_builder()
        self.assertEqual(unchanged, worker.read_bytes())
        litecast = self.sandbox / "litecast/lite-glossary.json"
        litecast.write_bytes(litecast.read_bytes() + b" ")
        run_builder()
        self.assertNotEqual(unchanged, worker.read_bytes())
        self.assertEqual(source_fingerprints, {
            str(rel): hashlib.sha256((ROOT / rel).read_bytes()).hexdigest()
            for rel in rels if str(rel) in source_fingerprints})

    def test_paired_legacy_vs_modular_real_litecast_write_and_stamper(self):
        # Same public-safe synthetic LiteCast input, two independently prepared
        # disposable trees. Legacy follows the documented JSON append directly;
        # modular uses the real Stage 3 editor plus verified artifact receipt.
        # Both execute the UNCHANGED original version stamper.
        legacy = self.sandbox / "legacy"
        modular = self.sandbox / "modular"
        rel = "litecast/lite-glossary.json"
        old_data = json.loads((ROOT / rel).read_text(encoding="utf-8"))
        new_data = json.loads(json.dumps(old_data))
        previous = list(new_data["LightGlossary"])
        entry = dict(previous[-1], id="litecast-stage7-synthetic",
                     title="آزمایش ایزوله", page_url="litecast/lite-CAST999998.html")
        new_data["LightGlossary"].append(entry)
        intended = json.dumps(new_data, ensure_ascii=False, indent=2)
        for workspace in (legacy, modular):
            workspace.mkdir()
            (workspace / bridge.SANDBOX_MARKER).write_text(json.dumps({
                "purpose": "dentcast-stage3-disposable-test",
                "allow_real_publication": False,
                "allow_remote_mutation": False,
            }))
            for path in stamp.VERSION_INPUTS:
                relative = path.relative_to(ROOT)
                destination = workspace / relative
                destination.parent.mkdir(parents=True, exist_ok=True)
                if path.exists():
                    shutil.copyfile(path, destination)
            (workspace / "tools").mkdir()
            shutil.copyfile(ROOT / "tools/stamp-version.py",
                            workspace / "tools/stamp-version.py")
            shutil.copyfile(ROOT / "service-worker.js",
                            workspace / "service-worker.js")
            (workspace / "index.html").write_text(
                '<script src="dentcast-brain.json?v=old"></script>')
            (workspace / "player.html").write_text(
                '<script src="dentcast-brain.json?v=old"></script>')

        # Canonical legacy file operation: append matching same-type entry.
        (legacy / rel).write_text(intended, encoding="utf-8")
        state = runner.begin({"has_text": True, "has_paper": False,
                              "category": "litecast", "challenge": False},
                             "real-paired-litecast", REV)
        while runner.next_invocation(state)["step"]["step_id"] != "page:litecast-register":
            state = runner.submit(state, fake_report(runner.next_invocation(state)))
        inv = runner.next_invocation(state)
        raw = (modular / rel).read_bytes()
        intent = {"step_id": inv["step"]["step_id"],
                  "input_digest": inv["input_digest"],
                  "author_asserted_gates": inv["step"]["approval_gates"],
                  "edits": [{"path": rel,
                             "before_sha256": hashlib.sha256(raw).hexdigest(),
                             "content_utf8": intended}]}
        outcome = editor.apply_intent(state, intent, modular)
        receipt = modular / "receipt.json"
        receipt.write_text(json.dumps(outcome["artifact_receipt"]))
        bridge.verify_local_receipt(
            state, fake_report(inv, outcome["artifact_receipt_digest"]),
            receipt, modular)
        self.assertEqual(json.loads((modular / rel).read_text())["LightGlossary"][:-1],
                         previous)
        # Neither operator may affect the real source file.
        self.assertEqual(json.loads((ROOT / rel).read_text()), old_data)

        for workspace in (legacy, modular):
            run = subprocess.run(
                [sys.executable, str(workspace / "tools/stamp-version.py")],
                cwd=workspace, capture_output=True, text=True, timeout=30)
            self.assertEqual(run.returncode, 0, run.stderr)
        # Receipts are local audit metadata, not site outputs; only compare the
        # actual published artifact paths, using an independently hashed manifest.
        receipt.unlink()
        required = [rel, "service-worker.js", "index.html", "player.html"]
        verdict = pairwise.compare(legacy, modular, required)
        self.assertEqual(verdict["status"], "PAIRED_BYTES_EQUAL", verdict["issues"])
        self.assertFalse(verdict["full_behavioral_parity_proven"])
        for path in required:
            self.assertEqual(verdict["legacy_manifest"][path]["sha256"],
                             verdict["modular_manifest"][path]["sha256"])

    def test_latest_sharehub_legacy_phase_f_exit_matches_failures(self):
        # Do not count a real latest-page failure as staging parity proof.
        # A future approved correction may legitimately make this page green.
        proc = subprocess.run(
            [sys.executable, str(ROOT / "tools/verify_publish.py"),
             "sharehub/share-34"], cwd=ROOT, capture_output=True,
            text=True, timeout=65)
        self.assert_phase_f_exit_matches_summary(proc)


    def test_real_glossary_builder_scope_only_index_is_generated(self):
        # Canonical README 2.6 claims *term pages* and the index are built;
        # the current actual builder writes ONLY glossary/index.html.
        # Execute the original builder in an isolated destination, without
        # altering the source-of-truth JSON or real repository.
        gloss = self.sandbox / "glossary"
        gloss.mkdir()
        source = ROOT / "glossary/glossary.json"
        original = source.read_bytes()
        shutil.copyfile(source, gloss / "glossary.json")
        previous_root = glossary_builder.ROOT
        previous_gloss = glossary_builder.GLOSS_PATH
        try:
            glossary_builder.ROOT = self.sandbox
            glossary_builder.GLOSS_PATH = gloss / "glossary.json"
            generated = glossary_builder.build_glossary()
            self.assertEqual(generated, gloss / "index.html")
            content = generated.read_text(encoding="utf-8")
            term = json.loads(original)["glossary"][0]
            self.assertIn(term["url"], content)
            self.assertEqual({p.name for p in gloss.glob("*.html")},
                             {"index.html"})
        finally:
            glossary_builder.ROOT = previous_root
            glossary_builder.GLOSS_PATH = previous_gloss
        self.assertEqual(source.read_bytes(), original)

    def test_real_legacy_phase_f_rejects_missing_page_and_wrong_title(self):
        # The legacy gate is the source of truth; don't fake a success receipt.
        script = ROOT / "tools/verify_publish.py"
        run = subprocess.run(
            [sys.executable, str(script), "sharehub/stage7-no-such-page",
             "--expect-title", "عنوان ساختگی"],
            cwd=ROOT, capture_output=True, text=True, timeout=35)
        self.assertEqual(run.returncode, 1, run.stdout[-1200:])
        self.assertIn("FAIL", run.stdout)

    def test_historical_canonical_page_phase_f_exit_matches_failures(self):
        # Historical outputs can drift as Pulse rotates or content is fixed.
        # Check the real gate's exit contract, never freeze old failures as truth.
        script = ROOT / "tools/verify_publish.py"
        run = subprocess.run(
            [sys.executable, str(script), "sharehub/share-18"],
            cwd=ROOT, capture_output=True, text=True, timeout=60)
        self.assert_phase_f_exit_matches_summary(run)


    def test_real_large_paper_catalog_local_edit_receipt(self):
        # Existing canonical catalog exceeds default 5 MB; synthetic whitespace
        # tests transport only, not medical metadata or external Drive filing.
        rel = "dentcast_cabinet_full_catalog.json"
        before = (ROOT / rel).read_bytes()
        self.assertGreater(len(before), 5_000_000)
        destination = self.sandbox / rel
        destination.write_bytes(before)
        state = runner.begin({"has_text": False, "has_paper": True},
                             "large-catalog", REV)
        while runner.next_invocation(state)["step"]["step_id"] != "paper-cabinet:catalog":
            state = runner.submit(state, fake_report(runner.next_invocation(state)))
        inv = runner.next_invocation(state)
        proposed = before.decode("utf-8") + "\n"
        self.assertEqual(json.loads(proposed), json.loads(before))
        intent = {
            "step_id": inv["step"]["step_id"],
            "input_digest": inv["input_digest"],
            "author_asserted_gates": inv["step"]["approval_gates"],
            "edits": [{"path": rel, "before_sha256": hashlib.sha256(before).hexdigest(),
                       "content_utf8": proposed}],
        }
        out = editor.apply_intent(state, intent, self.sandbox)
        self.assertFalse(out["published"])
        self.assertEqual(destination.read_bytes(), proposed.encode("utf-8"))
        receipt = self.sandbox / "large-catalog-receipt.json"
        receipt.write_text(json.dumps(out["artifact_receipt"]))
        state_after = bridge.verify_local_receipt(
            state, fake_report(inv, out["artifact_receipt_digest"]),
            receipt, self.sandbox)
        self.assertEqual(state_after["next_index"], state["next_index"] + 1)
        self.assertEqual((ROOT / rel).read_bytes(), before)

    def test_binary_webp_byte_receipt_and_bad_payload_rejection(self):
        state = runner.begin({"has_text": True, "has_paper": False,
                              "category": "litecast", "challenge": False},
                             "image-fixture", REV)
        state = runner.submit(state, fake_report(runner.next_invocation(state)))
        inv = runner.next_invocation(state)
        self.assertEqual(inv["step"]["step_id"], "page:draft")
        (self.sandbox / "litecast").mkdir()
        # Valid container signature for testing byte transport, not a real photo.
        blob = b"RIFF" + (4).to_bytes(4, "little") + b"WEBP"
        edit = {"step_id": "page:draft", "input_digest": inv["input_digest"],
                "author_asserted_gates": inv["step"]["approval_gates"],
                "edits": [{"path": "litecast/fixture.webp",
                           "before_sha256": None,
                           "content_base64": base64.b64encode(blob).decode()}]}
        result = editor.apply_intent(state, edit, self.sandbox)
        self.assertEqual((self.sandbox / "litecast/fixture.webp").read_bytes(), blob)
        self.assertFalse(result["published"])
        wrong = json.loads(json.dumps(edit))
        wrong["edits"][0]["content_base64"] = base64.b64encode(b"<script/>").decode()
        with self.assertRaisesRegex(ValueError, "IMAGE_MAGIC_BYTES_MISMATCH"):
            editor.check_intent(state, wrong, self.sandbox)
        wrong = json.loads(json.dumps(edit))
        wrong["edits"][0] = {"path": "litecast/fixture.webp",
                             "before_sha256": None,
                             "content_utf8": "not-binary"}
        with self.assertRaisesRegex(ValueError, "BINARY_ASSET_REQUIRES_BASE64"):
            editor.check_intent(state, wrong, self.sandbox)

    def test_litecast_actual_json_tail_append_is_necessary_and_scoped(self):
        rel = "litecast/lite-glossary.json"
        target = self.sandbox / rel
        target.parent.mkdir(exist_ok=True)
        shutil.copy2(ROOT / rel, target)
        before = target.read_bytes()
        data = json.loads(before)
        old_entries = list(data["LightGlossary"])
        self.assertTrue(old_entries)
        synthetic = dict(old_entries[-1], id="litecast-999999",
                         title="صرفاً تست", page_url="litecast/lite-CAST999999.html")
        data["LightGlossary"].append(synthetic)
        state = runner.begin({"has_text": True, "has_paper": False,
                              "category": "litecast", "challenge": False},
                             "lite-register", REV)
        while runner.next_invocation(state)["step"]["step_id"] != "page:litecast-register":
            state = runner.submit(state, fake_report(runner.next_invocation(state)))
        inv = runner.next_invocation(state)
        self.assertEqual(inv["step"]["module_id"], "page")
        intent = {"step_id": inv["step"]["step_id"],
                  "input_digest": inv["input_digest"],
                  "author_asserted_gates": inv["step"]["approval_gates"],
                  "edits": [{"path": rel,
                             "before_sha256": hashlib.sha256(before).hexdigest(),
                             "content_utf8": json.dumps(data, ensure_ascii=False)}]}
        result = editor.apply_intent(state, intent, self.sandbox)
        receipt = self.sandbox / "receipt.json"
        receipt.write_text(json.dumps(result["artifact_receipt"]))
        advanced = bridge.verify_local_receipt(
            state, fake_report(inv, result["artifact_receipt_digest"]),
            receipt, self.sandbox)
        self.assertEqual(advanced["next_index"],
                         state["next_index"] + 1)
        after = json.loads(target.read_text())
        self.assertEqual(after["LightGlossary"][:-1], old_entries)
        self.assertEqual(after["LightGlossary"][-1], synthetic)
        self.assertEqual((ROOT / rel).read_bytes(), before)
        with self.assertRaisesRegex(ValueError, "MODULE_WRITE_SCOPE_FORBIDDEN"):
            editor.allowed("page", "dentcast-brain.json")

class StagingClosureTests(unittest.TestCase):
    setUp = LegacyToolSandboxTests.setUp

    def write(self, root, path, data):
        target = root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(data if isinstance(data, str) else json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def tool(self, root, name, *args):
        target = root / "tools" / name
        target.parent.mkdir(exist_ok=True)
        shutil.copyfile(ROOT / "tools" / name, target)
        run = subprocess.run(["node" if name.endswith(".mjs") else sys.executable,
                              str(target), *args], cwd=root, text=True,
                             capture_output=True, timeout=40)
        self.assertEqual(run.returncode, 0, run.stdout[-2500:] + run.stderr[-1000:])
        return run

    def fixture_state(self, category, target_step):
        # Shape-only positioning of a local mechanical slice. Never run or
        # synthesize a scientific/Drive/human result to get to the target.
        state = runner.begin({"has_text": True, "has_paper": False,
                              "category": category, "challenge": False}, "slice", REV)
        while runner.next_invocation(state)["step"]["step_id"] != target_step:
            inv = runner.next_invocation(state)
            self.assertNotIn(inv["step"]["module_id"], {"evidence", "paper-cabinet", "challenge"})
            state = runner.submit(state, fake_report(inv))
        return state

    def apply(self, state, root, path, data):
        inv = runner.next_invocation(state)
        target = root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        before = hashlib.sha256(target.read_bytes()).hexdigest() if target.exists() else None
        return editor.apply_intent(state, {
            "step_id": inv["step"]["step_id"], "input_digest": inv["input_digest"],
            "author_asserted_gates": inv["step"]["approval_gates"],
            "edits": [{"path": path, "before_sha256": before,
                       "content_utf8": data if isinstance(data, str) else json.dumps(data, ensure_ascii=False, indent=2)}],
        }, root)

    def pair(self):
        marker = (self.sandbox / bridge.SANDBOX_MARKER).read_text()
        roots = [self.sandbox / n for n in ("legacy", "modular")]
        for root in roots:
            root.mkdir()
            self.write(root, bridge.SANDBOX_MARKER, marker)
        return roots

    def test_glossary_real_paired_registration_page_and_index_builder(self):
        a, b = self.pair()
        entry = {"slug": "stage7-fixture", "title": "Staging Fixture",
                 "fa_title": "مدخل آزمایشی", "synonyms": ["Staging Fixture"],
                 "url": "/glossary/stage7-fixture.html",
                 "pillar": {"primary": None, "secondary": [], "subtopic": None}}
        data = {"glossary": [entry]}
        for root in (a, b):
            self.write(root, "glossary/glossary.json", {"glossary": []})
            self.write(root, ".dentcast/asset-versions.json", (ROOT / ".dentcast/asset-versions.json").read_text())
        html = '<html lang="fa"><body><h1>مدخل آزمایشی</h1><p>این مدخل صرفاً دادهٔ آزمایشی است.</p></body></html>'
        self.write(a, "glossary/stage7-fixture.html", html)
        self.apply(self.fixture_state("glossary", "page:draft"), b,
                   "glossary/stage7-fixture.html", html)
        self.write(a, "glossary/glossary.json", data)
        state = self.fixture_state("glossary", "brain:glossary-register")
        self.apply(state, b, "glossary/glossary.json", data)
        with self.assertRaisesRegex(ValueError, "GLOSSARY_REGISTRY_SCOPE"):
            self.apply(state, b, "dentcast-brain.json", [])
        for root in (a, b):
            self.tool(root, "build_pillar.py", "glossary")
            self.assertIn(entry["url"], (root / "glossary/index.html").read_text())
            self.assertEqual((root / "glossary/stage7-fixture.html").read_text(), html)
            self.assertFalse((root / "dentcast-brain.json").exists())
        result = pairwise.compare(a, b, ["glossary/glossary.json", "glossary/index.html", "glossary/stage7-fixture.html"])
        self.assertEqual(result["status"], "PAIRED_BYTES_EQUAL", result)

    def test_new_synthetic_litecast_real_phase_f_pass_and_mutation_failure(self):
        root = self.sandbox
        title, caption = "آزمایش مستقل", "این متن صرفاً برای آزمون آفلاین است."
        cid = "litecast/lite-CAST999998"
        entry = {"type": "litecast", "id": "litecast-999998", "title": title,
                 "caption": caption, "hashtags": [], "keywords": [], "page_url": cid + ".html"}
        self.write(root, "dentcast-brain.json", [])
        self.write(root, "litecast/lite-glossary.json", {"LightGlossary": [entry]})
        self.write(root, "glossary/glossary.json", {"glossary": []})
        self.write(root, "plus/faq-corpus.json", {"byContent": {}})
        self.write(root, "plus/content-index.json", {})
        self.write(root, "index.html", '<script src="dentcast-brain.json?v=old"></script>')
        self.write(root, "player.html", '<script src="dentcast-brain.json?v=old"></script>')
        self.write(root, "service-worker.js", "const CACHE_NAME = 'dentcast-assets-old';")
        self.write(root, "sitemap.xml", "<urlset/>")
        url = "https://dentcast.ir/" + cid + ".html"
        ld = {"@context": "https://schema.org", "@type": "Article", "headline": title,
              "datePublished": "2026-10-16", "dateModified": "2026-10-16"}
        html = (f'<html lang="fa" dir="rtl"><head><title>{title}</title>'
                f'<link rel="canonical" href="{url}"><meta property="og:url" content="{url}">'
                f'<meta property="og:title" content="{title}"><meta name="twitter:title" content="{title}">'
                f'<meta name="description" content="{caption}"><meta property="og:description" content="{caption}">'
                f'<meta name="twitter:description" content="{caption}">'
                '<script>/* Offline fixture; never loaded in a browser. */'
                'gtag("config", "G-GMM0WC8X3M"); var src="G-GMM0WC8X3M";</script>'
                f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script></head>'
                f'<body><main class="article-content-wrap"><h1>{title}</h1><p>{caption}</p></main></body></html>')
        self.apply(self.fixture_state("litecast", "page:draft"), root, cid + ".html", html)
        self.tool(root, "stamp-version.py")
        result = self.tool(root, "verify_publish.py", cid, "--expect-title", title, "--expect-caption", caption)
        self.assertIn("0 failed", result.stdout)
        print("SYNTHETIC LITECAST PHASE F:", result.stdout.strip().splitlines()[-1])
        # This proves the unchanged mechanical gate on NEW synthetic bytes;
        # it is not a scientific result or an authorization to publish.
        (root / (cid + ".html")).write_text(html.replace(f"<h1>{title}</h1>", "<h1>تغییر تأییدنشده</h1>"))
        bad = subprocess.run([sys.executable, str(root / "tools/verify_publish.py"), cid],
                             cwd=root, text=True, capture_output=True, timeout=30)
        self.assertEqual(bad.returncode, 1)
        self.assertIn("16 title", bad.stdout)

    def test_real_learning_builders_synthetic_multiple_categories(self):
        # Actual builders consume nonclinical synthetic corpus, without DES calls.
        a, b = self.pair()
        ids = ["insight/stage7", "chairside/stage7", "sharehub/stage7", "notecast/stage7", "episodes/stage7", "glossary/stage7"]
        source = {"faqPages": [{"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "آیا این یک آزمون آفلاین است؟", "acceptedAnswer": {"@type": "Answer", "text": "بله، این داده صرفاً آزمایشی است."}}]}],
                  "definedTermSets": [{"@type": "DefinedTermSet", "@id": "https://example.invalid/#flashcards", "hasDefinedTerm": [{"@type": "DefinedTerm", "name": "آزمون آفلاین", "description": "اجرای ابزار بدون ارسال به سرویس خارجی."}]}]}
        corpus = {"byContent": {cid: source for cid in ids + ["litecast/stage7", "insight/en/stage7"]}}
        self.write(a, "plus/faq-corpus.json", corpus)
        self.write(b, "plus/faq-corpus.json", {"byContent": {}})
        self.apply(self.fixture_state("clinical", "learning-assets:flashcards"), b, "plus/faq-corpus.json", corpus)
        for root in (a, b):
            self.tool(root, "build_flashcards_index.mjs")
            self.tool(root, "build_quiz_index.mjs")
            cards = json.loads((root / "plus/flashcards-index.json").read_text())["byContent"]
            quiz = json.loads((root / "plus/quiz-index.json").read_text())["byContent"]
            self.assertEqual(set(cards), set(ids))
            self.assertEqual(set(quiz), set(ids))
            self.assertEqual(json.loads((root / "plus/faq-corpus.json").read_text()), corpus)
        self.assertEqual(pairwise.compare(a, b, ["plus/faq-corpus.json", "plus/flashcards-index.json", "plus/quiz-index.json"])["status"], "PAIRED_BYTES_EQUAL")

    def test_episode_catalog_real_builder_preserves_notecast_link(self):
        # Slice-level injection selects only the writer boundary, not fabricated
        # predecessor science/approvals. The original builder is really executed.
        from unittest.mock import patch
        a, b = self.pair()
        episode = {"episode": "999998", "title": "Sandbox episode", "description": "<p>Offline fixture.</p>",
                   "duration": "01:00", "audio_url": "https://example.invalid/test.mp3",
                   "page_url": "/episodes/episode-999998.html", "published": "Fri, 16 Oct 2026 00:00:00 GMT"}
        for root in (a, b):
            self.write(root, "dentcast.json", [])
            self.write(root, "dentcast-brain.json", [])
            self.write(root, "tools/episodes_template.html", (ROOT / "tools/episodes_template.html").read_text())
            self.write(root, "episodes/episode-999998.html", '<p>Offline episode</p><a class="ep-related-link" href="/notecast/stage7.html">NoteCast</a>')
        state = runner.begin({"has_text": True, "has_paper": False, "category": "episode", "challenge": False}, "boundary", REV)
        inv = runner.next_invocation(state)
        inv["step"] = next(s for s in state["plan"]["ordered_steps"] if s["step_id"] == "brain:append")
        self.write(a, "dentcast.json", [episode])
        # Patch only invocation selection and receipt production, not writer or builder.
        with patch.object(editor.runner, "next_invocation", return_value=inv), patch.object(editor.bridge, "attest_sample_receipt", return_value={"scope": "mechanical-fixture-only"}):
            intent = {"step_id": "brain:append", "input_digest": inv["input_digest"], "author_asserted_gates": [],
                      "edits": [{"path": "dentcast.json", "before_sha256": hashlib.sha256((b / "dentcast.json").read_bytes()).hexdigest(), "content_utf8": json.dumps([episode], ensure_ascii=False, indent=2)}]}
            editor.apply_intent(state, intent, b)
            inv["context"]["category"] = "notecast"
            with self.assertRaisesRegex(ValueError, "EPISODE_CATALOG_SCOPE"):
                editor.check_intent(state, intent, b)
        for root in (a, b):
            self.tool(root, "build_episodes.py")
            self.assertIn('/episodes/episode-999998.html', (root / "episodes.html").read_text())
            self.assertIn('/notecast/stage7.html', (root / "episodes/episode-999998.html").read_text())
        self.assertEqual(pairwise.compare(a, b, ["episodes.html", "dentcast.json", "episodes/episode-999998.html"])["status"], "PAIRED_BYTES_EQUAL")

    def test_challenge_public_builder_paired_no_answer_or_english(self):
        a, b = self.pair()
        question = '<p data-dc-challenge-question>آیا این یک دادهٔ آزمایشی است؟</p>'
        for root in (a, b):
            (root / "plus").mkdir()
        self.write(a, "chairside/stage7.html", question)
        self.apply(self.fixture_state("chairside", "page:draft"), b, "chairside/stage7.html", question)
        for root in (a, b):
            self.tool(root, "build_challenge_index.mjs")
            data = json.loads((root / "plus/challenges.json").read_text())
            entry = data["byContent"]["chairside/stage7"]
            self.assertTrue(entry["question"])
            self.assertNotIn("answer_fa", entry)
            self.assertNotIn("key_points", entry)
            self.assertFalse((root / "chairside/en/stage7.html").exists())
        self.assertEqual(pairwise.compare(a, b, ["chairside/stage7.html", "plus/challenges.json"])["status"], "PAIRED_BYTES_EQUAL")


if __name__ == "__main__":
    unittest.main()
