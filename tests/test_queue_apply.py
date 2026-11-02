"""Queue lane: byte-preserving writers, manifest refusals, deterministic pieces."""
import hashlib
import json
import struct
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))

import dentcast_text_io as tio  # noqa: E402
import queue_apply as qa  # noqa: E402
import queue_manifest as qm  # noqa: E402


def additions_only(old, new):
    return qa.additions_only(old.encode(), new.encode())


class JsonAppendTests(unittest.TestCase):
    CRLF = '{\r\n  "byContent": {\r\n    "a/b-1": {\r\n      "x": 1\r\n    }\r\n  },\r\n  "list": [\r\n    1,\r\n    2\r\n  ]\r\n}\r\n'
    LF = CRLF.replace("\r\n", "\n")

    def test_object_key_crlf_only_additions(self):
        new = tio.json_append(self.CRLF, ["byContent"], {"q": [1]}, key="a/b-2")
        self.assertEqual(json.loads(new)["byContent"]["a/b-2"], {"q": [1]})
        self.assertTrue(additions_only(self.CRLF, new))
        self.assertNotIn("\n", new.replace("\r\n", ""))

    def test_object_key_lf(self):
        new = tio.json_append(self.LF, ["byContent"], {"q": 1}, key="a/b-2")
        self.assertNotIn("\r", new)
        self.assertTrue(additions_only(self.LF, new))

    def test_array_append_and_after(self):
        new = tio.json_append(self.CRLF, ["list"], 3)
        self.assertEqual(json.loads(new)["list"], [1, 2, 3])
        new = tio.json_append(self.CRLF, ["list"], 9, after=0)
        self.assertEqual(json.loads(new)["list"], [1, 9, 2])
        self.assertTrue(additions_only(self.CRLF, new))

    def test_refuses_existing_key(self):
        with self.assertRaises(KeyError):
            tio.json_append(self.CRLF, ["byContent"], {}, key="a/b-1")

    def test_replace_scalar(self):
        s = '{\n  "n": 41,\n  "t": {"k": 2}\n}\n'
        new = tio.json_replace_scalar(s, ["n"], 42)
        self.assertEqual(new, s.replace("41", "42"))

    def test_mixed_file_follows_last_child_newline(self):
        s = '{\r\n  "a": 1,\n  "b": 2\n}\n'
        new = tio.json_append(s, [], 3, key="c")
        self.assertIn(',\n  "c": 3', new)

    def test_real_repository_files_round_trip(self):
        for rel, path, key in (("dentcast-brain.json", [], None), ("plus/faq-corpus.json", ["byContent"], "__t"),
                               ("plus/exam-questions.json", ["byContent"], "__t"),
                               ("plus/des-scores.json", [], "__t"), ("plus/pathways.json", [], None)):
            old = tio.read_raw(ROOT / rel)
            new = tio.json_append(old, path, {"probe": True}, key=key)
            self.assertTrue(additions_only(old, new), rel)
            self.assertEqual(len(new.splitlines()) - len(old.splitlines()), 3, rel)


class TailAndRenderTests(unittest.TestCase):
    def test_sources_tail_split(self):
        body, tail = qm.split_sources_tail("متن\n\n---\n\n[doi:10.1/x](https://doi.org/10.1/x)\n")
        self.assertEqual(body, "متن")
        self.assertEqual(tail, ["[doi:10.1/x](https://doi.org/10.1/x)"])

    def test_divider_with_prose_is_body(self):
        md = "الف\n\n---\n\nیک جملهٔ واقعی\n"
        self.assertEqual(qm.split_sources_tail(md), (md, []))

    def test_links_first_occurrence_not_in_heading(self):
        md = "## سایلن\n\nاول سایلن و باز سایلن.\n\n- سایلن\n"
        out = qa.render_body(md, {}, None, qa.Linker([{"phrase": "سایلن", "href": "/glossary/silane.html"}]))
        self.assertEqual(out.count('href="/glossary/silane.html"'), 1)
        self.assertIn("<h2>سایلن</h2>", out)
        self.assertIn('<p>اول <a href="/glossary/silane.html">سایلن</a> و باز سایلن.</p>', out)

    def test_note_list_bold_image(self):
        md = "**بند**: متن\n\n- یک\n- دو\n\n> (توضیح)\n\n[[تصویر:01]]\n"
        imgs = {"01": {"alt_fa": "الت", "caption_fa": "زیرنویس", "w": 10, "h": 20}}
        out = qa.render_body(md, imgs, lambda k: f"/x/fig{int(k)}.webp", qa.Linker([]))
        self.assertIn("<p><strong>بند</strong>: متن</p>", out)
        self.assertIn("<ul><li>یک</li><li>دو</li></ul>", out)
        self.assertIn('role="note"', out)
        self.assertIn('<img src="/x/fig1.webp" alt="الت" width="10" height="20"', out)
        self.assertIn("<figcaption>زیرنویس</figcaption>", out)

    def test_unknown_image_marker_refuses(self):
        with self.assertRaises(qm.QueueRefusal):
            qa.render_body("[[تصویر:02]]", {}, lambda k: "", qa.Linker([]))

    def test_webp_size_vp8x(self):
        data = b"RIFF" + b"\0" * 4 + b"WEBPVP8X" + b"\0" * 8 + (247).to_bytes(3, "little") + (392).to_bytes(3, "little")
        self.assertEqual(qa.webp_size(data), (248, 393))

    def test_exam_id_minting(self):
        self.assertEqual("r-" + hashlib.sha1(b"sharehub/share-44|publish-1").hexdigest()[:8], "r-741513d1")


class PulseTests(unittest.TestCase):
    def test_top_in_bottom_out_seven(self):
        lis = "".join(f"          <li>L{i}</li>\r\n" for i in range(7))
        doc = f'<ul class="dc-pulse-list">\r\n{lis}</ul>'
        w = qa.Writes()
        w.put("index.html", doc)
        r = qa.pulse(w, "sharehub", "sharehub/share-9", {"pulse": {"link_phrase": "عنوان", "text": None}})
        new = w.text("index.html")
        self.assertEqual(new.count("<li>"), 7)
        self.assertIn('<li><a href="/sharehub/share-9.html">عنوان</a></li>\r\n          <li>L0</li>', new)
        self.assertNotIn("L6", new)
        self.assertIn("L6", r["dropped"])

    def test_wrong_count_refuses(self):
        w = qa.Writes()
        w.put("index.html", '<ul class="dc-pulse-list">\n<li>a</li>\n</ul>')
        with self.assertRaises(qm.QueueRefusal):
            qa.pulse(w, "sharehub", "sharehub/share-9", {"pulse": {"link_phrase": "x", "text": None}})


class ManifestTests(unittest.TestCase):
    def make_item(self, status="آماده", lock="", extra=None):
        d = Path(tempfile.mkdtemp()) / "07-sharehub-test"
        (d / "05-DES-Fidelity").mkdir(parents=True)
        files = {"01-متن.md": "متن بدنه.\n", "02-عنوان-کپشن.md": "## عنوان\nعنوان یک\n\n## کپشن\nکپشن یک\n",
                 "05-DES-Fidelity/des.json": "{}"}
        files.update(extra or {})
        for rel, t in files.items():
            (d / rel).write_text(t, encoding="utf-8")
        (d / "00-وضعیت.md").write_text(f"- وضعیت: {status}\n- قفل: {lock}\n", encoding="utf-8")
        sums = "".join(f"{hashlib.sha256((d / r).read_bytes()).hexdigest()}  {r}\n" for r in sorted(files))
        (d / "SHA256SUMS").write_text(sums, encoding="utf-8")
        return d

    def test_ready_item_loads(self):
        info = qm.load_item(self.make_item())
        self.assertEqual(info["nn"], "07")

    def test_hash_mismatch_refuses(self):
        d = self.make_item()
        (d / "01-متن.md").write_text("تغییر\n", encoding="utf-8")
        with self.assertRaises(qm.QueueRefusal) as e:
            qm.load_item(d)
        self.assertEqual(e.exception.code, "SHA256_MISMATCH")

    def test_status_row_in_sums_is_tolerated(self):
        d = self.make_item()
        with open(d / "SHA256SUMS", "a", encoding="utf-8") as f:
            f.write("0" * 64 + "  00-وضعیت.md\n")
        self.assertEqual(qm.load_item(d)["sums"]["tolerated"][0]["matches"], False)

    def test_not_ready_and_foreign_lock_refuse(self):
        with self.assertRaises(qm.QueueRefusal):
            qm.load_item(self.make_item(status="در حال آماده‌سازی"))
        with self.assertRaises(qm.QueueRefusal) as e:
            qm.load_item(self.make_item(lock="Codex Work"))
        self.assertEqual(e.exception.code, "FOREIGN_LOCK")
        self.assertTrue(qm.load_item(self.make_item(lock="Claude Code"), agent="Claude Code"))

    def test_missing_fields_are_named_never_inferred(self):
        d = qm.draft(self.make_item())
        miss = qm.missing(d)
        for k in ("title_en", "credit", "catalog", "hashtags", "pillar", "author", "legacy_review"):
            self.assertIn(k, miss)
        self.assertEqual(d["title_fa"]["value"], "عنوان یک")

    def test_supplement_cannot_override_frozen_value(self):
        item = self.make_item()
        d = qm.draft(item)
        with self.assertRaises(qm.QueueRefusal) as e:
            qm.merge_supplement(item, d, {"title_fa": {"value": "دیگر", "from": "publish-day: x"}})
        self.assertEqual(e.exception.code, "SUPPLEMENT_OVERRIDES_FROZEN")

    def test_supplement_claiming_a_file_must_be_verbatim(self):
        item = self.make_item()
        d = qm.draft(item)
        with self.assertRaises(qm.QueueRefusal):
            qm.merge_supplement(item, d, {"title_en": {"value": "Invented", "from": "02-عنوان-کپشن.md:2"}})
        out = qm.merge_supplement(item, d, {"title_en": {"value": "Title", "from": "publish-day: translation"}})
        self.assertEqual(out["_manual"]["value"][0]["field"], "title_en")

    def test_keywords_in_prose_file_only_from_list(self):
        self.assertEqual(qm.keyword_lines(["# سر", "", "توضیح", "- a", "- b"]), ["a", "b"])
        self.assertEqual(qm.keyword_lines(["a", "b"]), ["a", "b"])
        self.assertIsNone(qm.keyword_lines(["# سر", "توضیح"]))


class PrecheckTests(unittest.TestCase):
    def test_unsupported_category_and_handoff(self):
        self.assertNotIn("metanote", qa.CATEGORIES)


if __name__ == "__main__":
    unittest.main()
