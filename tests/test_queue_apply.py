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
            (d / rel).parent.mkdir(parents=True, exist_ok=True)
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
        for k in ("title_en", "credit", "hashtags", "pillar"):
            self.assertIn(k, miss)
        self.assertEqual(d["title_fa"]["value"], "عنوان یک")
        # unfrozen 4.7/4.9 and the catalog fall to a recorded mechanical default, never to a guess
        defaults = {x["field"] for x in qm.defaults_of(d)}
        self.assertTrue({"explore_49", "backlinks_47"} <= defaults)

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
        # page text never comes from publish day (the agent writes no text)
        with self.assertRaises(qm.QueueRefusal) as e:
            qm.merge_supplement(item, d, {"title_en": {"value": "Title", "from": "publish-day: translation"}})
        self.assertEqual(e.exception.code, "SUPPLEMENT_TEXT_NOT_FROZEN")
        # a non-text fact from outside the item is a recorded manual step
        out = qm.merge_supplement(item, d, {"author": {"value": {"name": "x"}, "from": "publish-day: brain"}})
        self.assertEqual(out["_manual"]["value"][0]["field"], "author")

    def test_supplement_origin_may_be_a_line_range(self):
        item = self.make_item()
        (item / "07-ورودی‌ها.md").write_text("سطر\n- `#الف`\n- `#ب`\n", encoding="utf-8")
        d = qm.draft(item)
        out = qm.merge_supplement(item, d, {"hashtags": {"value": ["#الف", "#ب"], "from": "07-ورودی‌ها.md:2-3"}})
        self.assertEqual(out["hashtags"]["value"], ["#الف", "#ب"])
        with self.assertRaises(qm.QueueRefusal):
            qm.merge_supplement(item, d, {"hashtags": {"value": ["#ج"], "from": "07-ورودی‌ها.md:2-3"}})

    def test_keywords_in_prose_file_only_from_list(self):
        self.assertEqual(qm.keyword_lines(["# سر", "", "توضیح", "- a", "- b"]), ["a", "b"])
        self.assertEqual(qm.keyword_lines(["a", "b"]), ["a", "b"])
        self.assertIsNone(qm.keyword_lines(["# سر", "توضیح"]))


class CategoryPiecesTests(unittest.TestCase):
    def test_metanote_has_no_template_yet(self):
        self.assertNotIn("metanote", qa.CATEGORIES)
        self.assertEqual(set(qa.CATEGORIES), {"sharehub", "notecast", "insight", "chairside"})

    def test_persian_ordinals(self):
        self.assertEqual([qa.fa_ordinal(n) for n in (3, 21, 30, 40, 44)],
                         ["سوم", "بیست\u200cویکم", "سی\u200cام", "چهلم", "چهل\u200cوچهارم"])

    def test_bold_line_heading_only_when_text_follows(self):
        b = qa.blocks("**بخش**\nمتن بخش.\n\n**جملهٔ پررنگ مستقل**\n")
        self.assertEqual(b[0], ("h", 4, "بخش"))
        self.assertEqual(b[-1][0], "p")

    def test_insight_and_chairside_figures(self):
        imgs = {"01": {"alt_fa": "الت", "caption_fa": "زیر", "w": 3, "h": 4}}
        out = qa.render_insight("[[تصویر:01]]", imgs, lambda k: "/insight/insight9-1.webp", None, "fa")
        self.assertIn('<figure style="margin:1.25rem auto', out)
        self.assertIn("<figcaption", out)
        out = qa.render_chairside("- یک\n- دو", {}, None, None, "fa")
        self.assertEqual(out, "<ul>\n  <li>یک</li>\n  <li>دو</li>\n</ul>")


class EnglishBodyTests(ManifestTests):
    def test_english_body_stops_after_the_persian_sections(self):
        d = self.make_item(extra={
            "01-متن.md": "مقدمه.\n\n## الف\n\nمتن.\n",
            "06-انگلیسی.md": "## Title\nT\n\n## Caption\nC\n\n## Body\nIntro.\n\n## A\n\nText.\n\n## Translator notes\n- x\n"})
        body = qm.draft(d)["body_en"]["value"]
        self.assertIn("## A", body)
        self.assertNotIn("Translator", body)


class LeadParagraphTests(ManifestTests):
    def test_body_opening_with_a_list_refuses_before_any_write(self):
        d = self.make_item(extra={"01-متن.md": "## شرح حال\n\n- یک\n- دو\n\nپاراگراف.\n"})
        kinds = [b[0] for b in qa.blocks(qm.split_sources_tail((d / "01-متن.md").read_text(encoding="utf-8"))[0])]
        self.assertLess(kinds.index("ul"), kinds.index("p"))


class LegacyFormsTests(ManifestTests):
    """Frozen files written in the other layouts preparation agents used."""

    def test_bullet_images_and_english_metadata(self):
        d = self.make_item(extra={
            "03-تصاویر/تصاویر.md": "## تصویر 01\n- فایل: `01-a.webp`\n- Alt فارسی: الت (عیناً از alt داک)\n"
                                    "- زیرنویس: ندارد: داک زیرنویس نداشت.\n",
            "06-انگلیسی.md": "# Title\nT\n\n# Caption\nC\n\n# Article\nBody.\n\n[[Image:01]]\n\n## Image metadata\n"
                              "- Alt: An alt\n\n---\nوضعیت: تأییدشده\n"})
        (d / "03-تصاویر" / "01-a.webp").write_bytes(b"RIFF")
        dr = qm.draft(d)
        img = qm.plain(dr)["images"][0]
        self.assertEqual((img["file"], img["alt_fa"], img["alt_en"], img["caption_fa"], img["caption_en"]),
                         ("03-تصاویر/01-a.webp", "الت", "An alt", "", ""))
        self.assertEqual((dr["title_en"]["value"], dr["caption_en"]["value"]), ("T", "C"))
        self.assertNotIn("وضعیت", dr["body_en"]["value"])
        self.assertNotIn("Image metadata", dr["body_en"]["value"])

    def test_image_without_a_row_is_still_supplementable(self):
        d = self.make_item(extra={"03-تصاویر/تصاویر.md": "بدون جدول\n"})
        (d / "03-تصاویر" / "01-a.webp").write_bytes(b"RIFF")
        dr = qm.draft(d)
        self.assertIn("images.01.alt_fa", qm.missing(dr))
        (d / "03-تصاویر/تصاویر.md").write_text("الت فارسی\n", encoding="utf-8")
        out = qm.merge_supplement(d, dr, {"images": {"01": {"alt_fa": {"value": "الت فارسی", "from": "03-تصاویر/تصاویر.md:1"}}}})
        self.assertEqual(qm.plain(out)["images"][0]["alt_fa"], "الت فارسی")

    def test_title_heading_level_one_and_provenance_line(self):
        d = self.make_item(extra={"02-عنوان-کپشن.md": "# عنوان\n\nعنوان\n\nمنشأ: بنیان‌گذار\n\n# کپشن\n\nکپشن\n"})
        dr = qm.draft(d)
        self.assertEqual((dr["title_fa"]["value"], dr["caption_fa"]["value"]), ("عنوان", "کپشن"))

    def test_link_pathway_explore_and_backlink_forms(self):
        d = self.make_item(extra={
            "11-لینک‌های-گلاسری.md": (
                "## 4.7 — بک‌لینک\n\n- **`scanner` — `/glossary/scanner.html`: لینک.** متن لینک در «کاوش بیشتر»: «انتقال».\n\n"
                "## 4.8 — لینک\n\n- **عبارت:** «اسکن» (اول)\n- **مقصد:** `/glossary/scanner.html`\n- **تصمیم:** لینک خودکار\n"
                "- لینک ۲ (مرزی): نخستین «طرح» در «…» ← /episodes/episode-1.html\n\n"
                "## 4.9 — کاوش\n\n1. `/insight/insight-6.html` — «عنوان شش». تصمیم ثبت‌شده: لینک.\n"),
            "07-ورودی‌ها.md": "## مسیرهای یادگیری\n- انتخاب روشن: `occlusion`، درج پس از `insight/insight-1` («x»).\n"
                              "- `digital` پیشنهاد نمی‌شود: درج پس از `insight/insight-2`.\n"})
        dr = qm.plain(qm.draft(d))
        self.assertEqual([(x["phrase"], x["href"]) for x in dr["links_48"]],
                         [("اسکن", "/glossary/scanner.html"), ("طرح", "/episodes/episode-1.html")])
        self.assertEqual([(x["term"], x["anchor"]) for x in dr["backlinks_47"]], [("scanner", "انتقال")])
        self.assertEqual([(x["href"], x["label"]) for x in dr["explore_49"]], [("/insight/insight-6.html", "عنوان شش")])
        self.assertEqual([(x["id"], x["after"]) for x in dr["pathway"]], [("occlusion", "insight/insight-1")])

    def test_frozen_batch_orders_the_mint_and_bridge(self):
        d = self.make_item(extra={
            "12-batch.json": json.dumps({"concepts": [{"tag": "#نو"}], "articles": {}}),
            "07-ورودی‌ها.md": "- فهرست: #قدیم #نو\n- bridge: کلید «نو» به library tags موجود full-arch و bar؛ شاهد.\n"})
        dr = qm.plain(qm.draft(d))
        self.assertEqual((dr["mint"], dr["mint_batch"]), (["#نو"], "12-batch.json"))
        self.assertEqual(dr["bridge"], {"map": {"نو": ["full-arch", "bar"]}})


class RenderFixesTests(unittest.TestCase):
    def test_pipe_table_without_outer_pipes_is_a_table(self):
        md = "نتایج:\n\nنوع| نیرو\nالف| ۹۰۰\nب| ۱۵۵۰\n\nپایان."
        kinds = [b[0] for b in qa.blocks(md)]
        self.assertEqual(kinds, ["p", "table", "p"])
        html_ = qa.render_body(md, {}, None, None)
        self.assertIn("<thead><tr><th>نوع</th><th>نیرو</th></tr></thead>", html_)
        self.assertIn("<tr><td>ب</td><td>۱۵۵۰</td></tr>", html_)
        md2 = "| A | B |\n|---|---|\n| 1 | 2 |"
        self.assertEqual(qa.blocks(md2), [("table", [["A", "B"], ["1", "2"]])])

    def test_italic_line_after_an_image_is_its_caption(self):
        md = "متن.\n\n[[تصویر:01]]\n\n*تصویر: زیرنویس متن*\n\nادامه."
        self.assertEqual(qa.blocks(md)[1], ("img", "01", "تصویر: زیرنویس متن"))
        self.assertEqual(qa.blocks("[[Image:01]]")[0][:2], ("img", "01"))
        imgs = {"01": {"alt_fa": "الت", "caption_fa": "زیرنویس ۰۳", "w": 1, "h": 1}}
        out = qa.render_insight(md, imgs, lambda k: "/x.webp", None, "fa")
        self.assertIn("تصویر: زیرنویس متن</figcaption>", out)
        self.assertNotIn("زیرنویس ۰۳", out)

    def test_text_check_reads_table_cells_and_italics(self):
        import queue_install_des as qid
        d = Path(tempfile.mkdtemp())
        (d / "01-متن.md").write_text("نوع| نیرو\nالف| ۹۰۰\n\n*تصویر: زیر*\n\nیک *کج* واژه.\n", encoding="utf-8")
        self.assertEqual(qid.body_lines(d), ["نوع", "نیرو", "الف", "۹۰۰", "تصویر: زیر", "یک کج واژه."])

    def test_exam_question_without_kind(self):
        d = Path(tempfile.mkdtemp())
        (d / "08-سؤال‌های-آزمون.json").write_text(json.dumps({"questions": [
            {"prompt_fa": "س", "options": ["a", "b"], "correct": 0}]}), encoding="utf-8")

        class W:
            def __init__(self):
                self.t = json.dumps({"byContent": {}})

            def text(self, rel):
                return self.t

            def put(self, rel, t):
                self.t = t
        w = W()
        qa.exam(w, "insight/insight-9", d)
        self.assertEqual(json.loads(w.t)["byContent"]["insight/insight-9"]["questions"][0]["kind"], "mcq")

    def test_faq_object_and_content_id_placeholder(self):
        d = Path(tempfile.mkdtemp())
        (d / "10-فلش‌کارت-FAQ.json").write_text(json.dumps({"faqPage": {"@id": "https://dentcast.org/insight/insight-{content_id}.html#faq",
                                                                     "mainEntity": [{"name": "q"}]}}), encoding="utf-8")

        class W:
            t = '{\n  "byContent": {}\n}\n'

            def text(self, rel):
                return self.t

            def put(self, rel, t):
                W.t = t
        out = qa.faq(W(), "insight/insight-9", d, {})
        self.assertEqual(out["faq"], 1)
        self.assertIn("https://dentcast.org/insight/insight-9.html#faq", W.t)


class LedgerAndTextIoTests(unittest.TestCase):
    def test_init_input_refuses_a_bare_number(self):
        import queue_ledger as ql
        with self.assertRaises(qm.QueueRefusal) as e:
            ql.init_input("45")
        self.assertEqual(e.exception.code, "CONTENT_ID_INVALID")
        self.assertEqual(ql.init_input("sharehub/share-45")["content_id"], "sharehub/share-45")

    def test_merge_records_replaces_by_kind_and_scope(self):
        import queue_ledger as ql
        pub = {"target_paths": ["a"], "context": {"decisions": [{"kind": "queue_lane_v1"}, {"kind": "x", "v": 1}],
                                                  "approvals": [{"scope": "title", "decision": "old"}]}}
        rec = {"decisions": [{"kind": "x", "v": 2}], "approvals": [{"scope": "title", "decision": "new"}],
               "target_paths": ["b"]}
        out = ql.merge_records(pub, rec)
        self.assertEqual(out["context"]["decisions"], [{"kind": "queue_lane_v1"}, {"kind": "x", "v": 2}])
        self.assertEqual(out["context"]["approvals"], [{"scope": "title", "decision": "new"}])
        self.assertEqual(out["target_paths"], ["a", "b"])

    def test_json_replace_value_keeps_mixed_line_endings(self):
        text = '[\r\n  {\r\n    "hashtags": [\r\n      "#x"\r\n    ]\n  },\n  {"hashtags": ["#y"]}\n]\n'
        new = tio.json_replace_value(text, [0, "hashtags"], ["#x", "#z"])
        self.assertEqual(new, text.replace('"#x"\r\n', '"#x",\r\n      "#z"\r\n'))
        new = tio.json_replace_value(new, [1, "hashtags"], ["#q"])
        self.assertTrue(new.endswith('{"hashtags": ["#q"]}\n]\n'))


if __name__ == "__main__":
    unittest.main()
