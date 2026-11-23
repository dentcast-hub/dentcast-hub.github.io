"""The presentation layer (module 03 «Structure, chips and callout boxes», module 08 Part 2b).

Marked elements — `data-dc-presentation` on a page, `[[+]]` lines and `[[…]]` chips in a
queue text — are outside the DES/Fidelity text; unmarked headings and labels stay units
exactly as before; `tools/presentation_diff.py` proves a later change touched nothing else.
"""
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))

import des_fidelity_units as U  # noqa: E402
import presentation_diff as pd  # noqa: E402
import queue_apply as qa  # noqa: E402
import queue_install_des as qi  # noqa: E402
import queue_manifest as qm  # noqa: E402
import verify_publish as vp  # noqa: E402

A = vp.PRESENTATION_ATTR
# the main commit before this layer: its tools are «the old code» of the corpus check
BASELINE = "658d334d0bc2b5c46c397d7a23e947e4d47faf21"
BOX = ('<div role="note" style="background:var(--chip-bg);border:1px solid var(--chip-bd);border-right:4px solid '
       'var(--chip-bd);border-radius:var(--r-lg,1.125rem);padding:1rem 1.25rem;margin:1.25rem 0;">')


def page(body, head="<title>t</title>", h1="عنوان صفحه"):
    return (f"<html><head>{head}</head><body><main>\n<h1>{h1}</h1>\n{body}\n"
            '<div class="author-note">یادداشت</div>\n</main></body></html>\n')


OLD_BODY = """<p>لید مطلب این است. جملهٔ دوم لید.</p>
<h3>∆ عنوان نویسنده</h3>
<p>بی‌حسی با اپی‌نفرین مجاز است. فلیپرسین را نزن.</p>
<ul><li>استامینوفن انتخاب اول است.</li><li>آرتیکائین را استفاده نکن.</li></ul>
<p>نتیجه این است که درمان را عقب نینداز.</p>"""
NEW_BODY = f"""<p>لید مطلب این است. جملهٔ دوم لید.</p>
<h3 {A}>∆ ۱. بی‌حسی</h3>
<h3>∆ <span {A}>۲. </span>عنوان نویسنده</h3>
<p class="dc-sublabel" {A}><strong>اپی‌نفرین</strong> <span class="dc-chip dc-chip-ok" {A}>مجاز</span></p>
<p>بی‌حسی با اپی‌نفرین مجاز است. فلیپرسین را نزن.</p>
<ul><li><span class="dc-chip dc-chip-ok" {A}>مجاز</span> استامینوفن انتخاب اول است.</li><li><span class="dc-chip dc-chip-no" {A}>استفاده نکن</span> آرتیکائین را استفاده نکن.</li></ul>
{BOX}<p style="margin:0;" {A}><strong>نتیجه</strong></p>
<p style="margin:0;">نتیجه این است که درمان را عقب نینداز.</p></div>"""
TWO = [{"des_version": "3.7", "content_type": "RESEARCH", "text_basis": "FULL_TEXT",
        "citation": {"authors": "Smith A", "year": 2020, "doi": "10.1/a", "title": "A long first paper title"}},
       {"des_version": "3.7", "content_type": "RESEARCH", "text_basis": "FULL_TEXT",
        "citation": {"authors": "Jones B", "year": 2021, "doi": "10.1/b", "title": "A long second paper title"}}]


def keys(units):
    return [(u["id"], u["text"], bool(u.get("heading"))) for u in units]


class MarkerTests(unittest.TestCase):
    def test_a_page_without_the_marker_is_returned_as_it_is(self):
        frag = "<p>A.</p><h3>عنوان</h3><p><strong>برچسب</strong></p>"
        self.assertIs(vp.strip_presentation(frag), frag)
        self.assertEqual(vp.presentation_problems(page(frag)), [])
        self.assertEqual(vp.article_region(page(frag)), vp.article_region(page(frag), presentation=True))

    def test_marked_elements_go_and_nothing_else(self):
        frag = (f'<p>A.</p><h3 {A}>∆ ۱. X</h3><p class="dc-sublabel" {A}><strong>L</strong> <span {A}>c</span></p>'
                f'<ul><li><span class="dc-chip" {A}>مجاز <span>in</span></span> B.</li></ul>'
                f'<span title="{A}">keep</span><h3>عنوان نویسنده</h3>')
        self.assertEqual(vp.strip_presentation(frag),
                         f'<p>A.</p><ul><li>B.</li></ul><span title="{A}">keep</span><h3>عنوان نویسنده</h3>')

    def test_malformed_markers_are_named(self):
        for frag, word in ((f"<div {A}>x</div>", "cannot carry"), (f"<p {A}>never closed", "never closes"),
                           (f'<p {A}><a href="/x">link</a></p>', "holds a <a>"),
                           (f"<p {A}>x <img src='a.webp'></p>", "holds a <img>")):
            probs = vp.presentation_problems(page(frag))
            self.assertTrue(probs and word in probs[0], (frag, probs))
            with self.assertRaises(ValueError):
                vp.strip_presentation(frag)
            # the region keeps a malformed marker's words as page text, and the units tool refuses the page
            self.assertIn(A, vp.article_region(page(frag)))
            with self.assertRaises(SystemExit):
                U.split_html(page(frag), [])
        self.assertTrue(vp.presentation_problems(page("<p>x</p>").replace("<h1>", f"<h1 {A}>")))


class UnitTests(unittest.TestCase):
    def test_marked_elements_take_no_unit_and_move_no_id(self):
        for legacy in (False, True):
            old, new = U.split_html(page(OLD_BODY), [], legacy), U.split_html(page(NEW_BODY), [], legacy)
            self.assertEqual(keys(old), keys(new))
        texts = [u["text"] for u in U.split_html(page(NEW_BODY), [])]
        for word in ("∆ ۱. بی‌حسی", "اپی‌نفرین", "مجاز", "استفاده نکن", "نتیجه"):
            self.assertNotIn(word, texts)
        self.assertIn("∆ عنوان نویسنده", texts)

    def test_unmarked_headings_and_labels_are_units_as_before(self):
        body = ('<p>لید.</p><h3>∆ ۱. عنوان بی‌نشان</h3><p><strong>برچسب بی‌نشان</strong></p>'
                + BOX + '<p style="margin:0;"><strong>نتیجه</strong></p><p style="margin:0;">جمله.</p></div>')
        units = U.split_html(page(body), [])
        self.assertEqual([(u["text"], bool(u.get("heading"))) for u in units],
                         [("عنوان صفحه", True), ("لید.", False), ("∆ ۱.", True), ("عنوان بی‌نشان", True),
                          ("برچسب بی‌نشان", False), ("نتیجه", False), ("جمله.", False)])

    def test_phase_f_haystack_and_commentary_text_skip_the_layer(self):
        old, new = page(OLD_BODY), page(NEW_BODY)
        self.assertEqual(vp.des_norm(vp.text_of(vp.article_region(old))), vp.des_norm(vp.text_of(vp.article_region(new))))
        src = {"content_type": "COMMENTARY", "citation": {"title": "عنوان صفحه"}}
        self.assertEqual(vp.des_source_text(src, old, page_title="عنوان صفحه"),
                         vp.des_source_text(src, new, page_title="عنوان صفحه"))
        self.assertEqual(pd.text_of_record(old), pd.text_of_record(new))


class QueueSyntaxTests(unittest.TestCase):
    MD = ("لید.\n\n[[+]] ### ∆ ۱. بخش\n\n### ∆ [[+:۲.]] عنوان نویسنده\n\n[[+]] **اپی‌نفرین** [[مجاز]]\n\n"
          "جمله یک. جمله دو.\n\n- [[استفاده نکن]] آرتیکائین را نزن.\n\n> [[+]] **نتیجه**\n>\n> جملهٔ پایانی. جملهٔ دوم.")
    PLAIN = "لید.\n\n### ∆ عنوان نویسنده\n\nجمله یک. جمله دو.\n\n- آرتیکائین را نزن.\n\nجملهٔ پایانی. جملهٔ دوم."

    def renders(self, md):
        return {"sharehub": qa.render_body(md, {}, None, None), "insight": qa.render_insight(md, {}, None, None, "fa"),
                "chairside": qa.render_chairside(md, {}, None, None, "fa"),
                "metanote": qa.render_metanote(md, {}, None, None, "fa"),
                "notecast": qa.render_body(md, {}, None, None, "fa", "indented", "glossary-link")}

    def test_every_renderer_emits_the_marker(self):
        for cat, out in self.renders(self.MD).items():
            for piece in (f"<h3 {A}>∆ ۱. بخش</h3>", f"<h3>∆ <span {A}>۲.</span> عنوان نویسنده</h3>",
                          f'<p class="dc-sublabel" {A}><strong>اپی‌نفرین</strong> <span class="dc-chip dc-chip-ok" {A}>مجاز</span></p>',
                          f'<span class="dc-chip dc-chip-no" {A}>استفاده نکن</span> آرتیکائین را نزن.',
                          f'<p style="margin:0;" {A}><strong>نتیجه</strong></p>',
                          '<p style="margin:0;">جملهٔ پایانی. جملهٔ دوم.</p>'):
                self.assertIn(piece, out, cat)
            self.assertIn(qa.NOTE_OPEN, out, cat)
            self.assertEqual(vp.presentation_problems(page(out)), [], cat)
            self.assertNotIn("[[", out, cat)

    def test_rendered_units_equal_the_plain_text_in_every_category(self):
        for cat in qm.CATEGORIES:
            r = pd.compare_md(self.PLAIN, self.MD, cat)
            self.assertEqual((r["status"], r["marked_elements"]["new"]), ("presentation_only", 5), cat)

    def test_closed_chip_list_and_colour_classes(self):
        self.assertEqual({qm.chip_kind(x) for x in ("مجاز", "Allowed")}, {"ok"})
        self.assertEqual({qm.chip_kind(x) for x in ("با احتیاط", "با محدودیت", "با مشورت", "Caution")}, {"caution"})
        self.assertEqual({qm.chip_kind(x) for x in ("استفاده نکن", "هرگز", "Avoid", "Never")}, {"no"})
        self.assertIn('class="dc-chip dc-chip-caution"', qa.inline("[[با احتیاط]] متن"))
        with self.assertRaises(qm.QueueRefusal) as e:
            qa.inline("[[خوب]] متن")
        self.assertEqual(e.exception.code, "CHIP_UNKNOWN")
        with self.assertRaises(qm.QueueRefusal) as e:
            qa.render_body("- [[+]] برچسب وسط فهرست", {}, None, None)
        self.assertEqual(e.exception.code, "PRESENTATION_SYNTAX")
        self.assertTrue(qm.presentation_md_problems("متن [[خوب]]"))
        self.assertTrue(qm.presentation_md_problems("متن [[+]] وسط خط"))
        self.assertEqual(qm.presentation_md_problems(self.MD), [])

    def test_text_without_the_syntax_is_untouched(self):
        md = "لید.\n\n[[تصویر:01]]\n\n## بخش\n\n**برچسب**\nمتن.\n\n> **نتیجه**\n>\n> جمله.\n\n- مورد"
        plain = "بی نشانگر.\n\n> جمله"
        self.assertIs(qm.strip_presentation_md(plain), plain)
        self.assertEqual(qm.strip_presentation_md(md), md)
        self.assertEqual([b[0] for b in qa.blocks(md)], ["p", "img", "h", "h", "p", "note", "ul"])
        # an unmarked label is the author's text: a unit, as it was before the layer
        out = qa.render_insight("لید.\n\n> **نتیجه**\n>\n> جمله.", {}, None, None, "fa")
        self.assertIn('<p style="margin:0;"><strong>نتیجه</strong></p><p style="margin:0;"></p><p style="margin:0;">جمله.</p>', out)
        self.assertIn("نتیجه", [u["text"] for u in U.split_html(page(out), [])])

    def test_linker_never_links_inside_a_chip_or_a_presentation_line(self):
        linker = qa.Linker([{"phrase": "مجاز", "href": "/glossary/x.html"}])
        out = qa.render_body("[[+]] **مجاز بودن**\n\n- [[مجاز]] داروی مجاز این است.", {}, None, linker)
        self.assertIn(f'<span class="dc-chip dc-chip-ok" {A}>مجاز</span> داروی <a href="/glossary/x.html">مجاز</a>', out)
        self.assertIn(f'<p class="dc-sublabel" {A}><strong>مجاز بودن</strong></p>', out)

    def test_publish_day_text_check_ignores_the_layer(self):
        d = Path(tempfile.mkdtemp()) / "07-sharehub-test"
        d.mkdir()
        (d / "01-متن.md").write_text(self.PLAIN, encoding="utf-8")
        plain = qi.body_lines(d)
        (d / "01-متن.md").write_text(self.MD, encoding="utf-8")
        self.assertEqual(qi.body_lines(d), plain)
        shutil.rmtree(d.parent)


class DiffTests(unittest.TestCase):
    def refused(self, old, new, sources=None, **kw):
        with self.assertRaises(pd.Refusal) as e:
            pd.compare(old, new, sources, **kw)
        return e.exception.detail

    def test_presentation_only_change_passes(self):
        r = pd.compare(page(OLD_BODY), page(NEW_BODY))
        self.assertEqual((r["status"], r["marked_elements"]), ("presentation_only", {"old": 0, "new": 6}))
        # and back: removing the layer is presentation-only too
        self.assertEqual(pd.compare(page(NEW_BODY), page(OLD_BODY))["status"], "presentation_only")

    def test_one_word_is_refused_and_named(self):
        d = self.refused(page(OLD_BODY), page(NEW_BODY.replace("فلیپرسین را نزن", "فلیپرسین را هرگز نزن")))
        self.assertEqual(d["code"], "TEXT_CHANGED")
        self.assertEqual(d["old"]["text"], "فلیپرسین را نزن.")
        self.assertEqual(d["new"]["text"], "فلیپرسین را هرگز نزن.")

    def test_moved_split_joined_added_or_unmarked_text_is_refused(self):
        cases = {
            "moved": NEW_BODY.replace("<p>بی‌حسی با اپی‌نفرین مجاز است. فلیپرسین را نزن.</p>",
                                      "<p>فلیپرسین را نزن. بی‌حسی با اپی‌نفرین مجاز است.</p>"),
            "joined": NEW_BODY.replace("مجاز است. فلیپرسین", "مجاز است و فلیپرسین"),
            "dropped": NEW_BODY.replace(" جملهٔ دوم لید.", ""),
            "added unmarked heading": NEW_BODY.replace(f"<h3 {A}>∆ ۱. بی‌حسی</h3>", "<h3>∆ ۱. بی‌حسی</h3>"),
            "marker on the author's sentence": OLD_BODY.replace("<p>نتیجه این است", f"<p {A}>نتیجه این است"),
            "zwnj": NEW_BODY.replace("بی‌حسی با", "بی حسی با"),
        }
        for name, body in cases.items():
            self.assertEqual(self.refused(page(OLD_BODY), page(body))["code"], "TEXT_CHANGED", name)

    def test_links_images_and_the_rest_of_the_page_stay(self):
        linked = NEW_BODY.replace("استامینوفن انتخاب", '<a href="/glossary/x.html">استامینوفن</a> انتخاب')
        self.assertEqual(self.refused(page(OLD_BODY), page(linked))["code"], "STRUCTURE_CHANGED")
        self.assertEqual(self.refused(page(OLD_BODY), page(NEW_BODY, head="<title>other</title>"))["code"],
                         "OUTSIDE_BODY_CHANGED")
        # a cache stamp is not a change
        a = page(OLD_BODY, head='<link rel="stylesheet" href="/dc-theme.css?v=19">')
        b = page(NEW_BODY, head='<link rel="stylesheet" href="/dc-theme.css?v=20">')
        self.assertEqual(pd.compare(a, b)["status"], "presentation_only")

    def test_a_cut_paragraph_keeps_its_whitespace_for_phase_f(self):
        cut = OLD_BODY.replace("<p>بی‌حسی با اپی‌نفرین مجاز است. فلیپرسین را نزن.</p>",
                               "<p>بی‌حسی با اپی‌نفرین مجاز است.</p>" + BOX + '<p style="margin:0;">فلیپرسین را نزن.</p></div>')
        d = self.refused(page(OLD_BODY), page(cut))
        self.assertEqual(d["code"], "TEXT_CHANGED")
        self.assertIn("Phase F", d["message"])
        ok = cut.replace("مجاز است.</p>" + BOX, "مجاز است.</p>\n" + BOX)
        self.assertEqual(pd.compare(page(OLD_BODY), page(ok))["status"], "presentation_only")

    def test_several_sources_keep_their_paragraphs(self):
        cut = OLD_BODY.replace("<p>بی‌حسی با اپی‌نفرین مجاز است. فلیپرسین را نزن.</p>",
                               "<p>بی‌حسی با اپی‌نفرین مجاز است.</p>\n" + BOX + '<p style="margin:0;">فلیپرسین را نزن.</p></div>')
        self.assertEqual(pd.compare(page(OLD_BODY), page(cut))["status"], "presentation_only")  # one source: allowed
        d = self.refused(page(OLD_BODY), page(cut), TWO)
        self.assertEqual(d["code"], "PARAGRAPH_CHANGED")
        # a whole paragraph wrapped in place is the same paragraph
        r = pd.compare(page(OLD_BODY), page(NEW_BODY), TWO)
        self.assertEqual((r["status"], r["paragraphs_checked"]), ("presentation_only", True))

    def test_stored_assignment_is_recomputed_on_a_published_page(self):
        # paragraph-carried attribution: «Smith» names source 0 for the rest of its paragraph only
        old = "<p>Smith نشان داد که ایمپلنت می‌ماند. جملهٔ بعدی همان منبع است.</p>\n<p>Jones چیز دیگری گفت.</p>"
        units = U.split_html(page(old), TWO)
        self.assertEqual(U.assign(units, TWO)[1], {0: ["u2", "u3"], 1: ["u4"]})
        cut = old.replace(" جملهٔ بعدی همان منبع است.</p>", "</p>\n" + BOX + '<p style="margin:0;">جملهٔ بعدی همان منبع است.</p></div>')
        self.assertNotEqual(U.assign(U.split_html(page(cut), TWO), TWO)[1], {0: ["u2", "u3"], 1: ["u4"]})
        self.assertEqual(self.refused(page(old), page(cut), TWO, content_id="sharehub/none")["code"], "PARAGRAPH_CHANGED")

    def test_a_plan_recorded_on_the_earlier_cut_is_checked_on_that_cut_only(self):
        # sharehub/share-53: its record was judged on the cut before `sentences()`, so the plan's ids
        # are units of that cut alone; the unchanged page must pass, not stop inside recorded_plan
        cid = "sharehub/share-53"
        doc = (ROOT / "sharehub/share-53.html").read_text(encoding="utf-8")
        sources = pd.page_sources(cid)
        cuts = {legacy: U.split_html(doc, sources, legacy=legacy) for legacy in (False, True)}
        self.assertEqual({k: pd.plan_fits(cid, v) for k, v in cuts.items()}, {False: False, True: True})
        self.assertEqual(pd.compare(doc, doc, sources, cid)["status"], "presentation_only")


def frozen_item(base, name="07-chairside-test", status="آماده"):
    d = Path(base) / name
    (d / "05-DES-Fidelity").mkdir(parents=True)
    body_en = "Lead sentence. Second sentence.\n\nThe bottom line. Do not delay."
    files = {
        "01-متن.md": "لید مطلب. جملهٔ دوم.\n\nنتیجه این است. عقب نینداز.\n",
        "06-انگلیسی.md": f"## Title\nA title\n\n## Caption\nA caption\n\n## Body\n{body_en}\n\n## Figure captions\n- 01: none\n",
        "02-عنوان-کپشن.md": "## عنوان\nعنوان یک\n\n## کپشن\nکپشن یک\n",
        "05-DES-Fidelity/des.json": json.dumps({"scored_at": "2026-11-01", "sources": [{"content_type": "COMMENTARY"}]}),
        qm.MANIFEST_FILE: json.dumps({"schema": qm.SCHEMA, "title_en": {"value": "A title", "from": "06-انگلیسی.md:2"},
                                      "body_en": {"value": body_en, "from": "06-انگلیسی.md:8-11"},
                                      "figure": {"value": "- 01: none", "from": "06-انگلیسی.md:13"}},
                                     ensure_ascii=False, indent=2) + "\n",
    }
    for rel, t in files.items():
        (d / rel).write_text(t, encoding="utf-8")
    (d / qm.STATUS_FILE).write_text(f"- وضعیت: {status}\n- قفل: \n", encoding="utf-8")
    (d / "SHA256SUMS").write_text("".join(f"{hashlib.sha256((d / r).read_bytes()).hexdigest()}  {r}\n"
                                          for r in sorted(files)), encoding="utf-8")
    return d


class QueueRestampTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.item = frozen_item(Path(self.tmp) / "live")
        self.frozen = frozen_item(Path(self.tmp) / "frozen")
        self.addCleanup(shutil.rmtree, self.tmp)

    def retrofit(self):
        p = self.item / "01-متن.md"
        p.write_text("لید مطلب. جملهٔ دوم.\n\n[[+]] ### ∆ ۱. نتیجه‌گیری\n\n> [[+]] **نتیجه**\n>\n> نتیجه این است. عقب نینداز.\n",
                     encoding="utf-8")
        q = self.item / "06-انگلیسی.md"
        q.write_text(q.read_text(encoding="utf-8").replace(
            "The bottom line. Do not delay.",
            "[[+]] ### ∆ 1. Conclusion\n\n> [[+]] **Bottom line**\n>\n> The bottom line. Do not delay."), encoding="utf-8")

    def test_existing_frozen_item_is_unchanged(self):
        self.assertEqual(pd.queue_item(self.item, old_dir=self.frozen)["status"], "unchanged")
        qm.load_item(self.item)

    def test_presentation_only_retrofit_is_restamped_and_stays_ready(self):
        self.retrofit()
        with self.assertRaises(qm.QueueRefusal):
            qm.load_item(self.item)  # the frozen sums no longer match
        r = pd.queue_item(self.item, old_dir=self.frozen)
        self.assertEqual((r["status"], r["changed"], r["manifest_update"]),
                         ("presentation_only", ["01-متن.md", "06-انگلیسی.md"], "pending"))
        r = pd.queue_item(self.item, old_dir=self.frozen, restamp=True)
        self.assertEqual(r["status"], "restamped")
        self.assertIn("بازمهر لایهٔ نمایش", r["history_line"])
        info = qm.load_item(self.item)  # «آماده», sums match again
        self.assertTrue(info["status"].startswith("آماده"))
        m = json.loads((self.item / qm.MANIFEST_FILE).read_text(encoding="utf-8"))
        self.assertIn("> [[+]] **Bottom line**", m["body_en"]["value"])
        self.assertEqual(m["body_en"]["from"], "06-انگلیسی.md:8-15")
        self.assertEqual(m["figure"]["from"], "06-انگلیسی.md:17")  # the cited line moved with the text
        self.assertEqual(m["title_en"], {"value": "A title", "from": "06-انگلیسی.md:2"})
        # every other frozen file keeps its row, byte for byte
        old_rows = dict(reversed(l.split("  ", 1)) for l in (self.frozen / "SHA256SUMS").read_text(encoding="utf-8").splitlines())
        new_rows = dict(reversed(l.split("  ", 1)) for l in (self.item / "SHA256SUMS").read_text(encoding="utf-8").splitlines())
        self.assertEqual({k for k in old_rows if old_rows[k] != new_rows[k]},
                         {"01-متن.md", "06-انگلیسی.md", qm.MANIFEST_FILE})
        # idempotent, and still provable against the frozen version
        self.assertEqual(pd.queue_item(self.item, old_dir=self.frozen)["status"], "presentation_only")

    def test_a_changed_word_or_another_file_is_refused_and_nothing_is_written(self):
        self.retrofit()
        p = self.item / "01-متن.md"
        p.write_text(p.read_text(encoding="utf-8").replace("عقب نینداز", "هرگز عقب نینداز"), encoding="utf-8")
        sums = (self.item / "SHA256SUMS").read_bytes()
        with self.assertRaises(pd.Refusal) as e:
            pd.queue_item(self.item, old_dir=self.frozen, restamp=True)
        self.assertEqual(e.exception.detail["code"], "TEXT_CHANGED")
        self.assertEqual((self.item / "SHA256SUMS").read_bytes(), sums)
        shutil.copy(self.frozen / "01-متن.md", p)
        (self.item / "02-عنوان-کپشن.md").write_text("## عنوان\nعنوان دو\n", encoding="utf-8")
        with self.assertRaises(pd.Refusal) as e:
            pd.queue_item(self.item, old_dir=self.frozen, restamp=True)
        self.assertEqual(e.exception.detail["code"], "OTHER_FILE_CHANGED")

    def test_english_outside_the_body_and_an_item_in_preparation_are_refused(self):
        self.retrofit()
        q = self.item / "06-انگلیسی.md"
        q.write_text(q.read_text(encoding="utf-8").replace("A caption", "Another caption"), encoding="utf-8")
        with self.assertRaises(pd.Refusal) as e:
            pd.queue_item(self.item, old_dir=self.frozen)
        self.assertEqual(e.exception.detail["code"], "OTHER_TEXT_CHANGED")
        shutil.copy(self.frozen / "06-انگلیسی.md", q)
        (self.item / qm.STATUS_FILE).write_text("- وضعیت: در حال آماده‌سازی\n- قفل: \n", encoding="utf-8")
        with self.assertRaises(pd.Refusal) as e:
            pd.queue_item(self.item, old_dir=self.frozen, restamp=True)
        self.assertEqual(e.exception.detail["code"], "NOT_READY")


TEMPLATE = 45  # sharehub/share-45: the draft's template page, as in test_queue_prep_tools


class PublishDayTests(unittest.TestCase):
    """A frozen item's Fidelity, judged on the plain text, installs unchanged on the page built
    from the retrofitted text: same units, nothing added, nothing dropped, text check green."""

    PLAIN = "این جملهٔ نخست است. این جملهٔ دوم است.\n\n## بخش دوم\n\nجملهٔ سوم این‌جاست. جملهٔ چهارم هم هست.\n"
    RETRO = ("این جملهٔ نخست است. این جملهٔ دوم است.\n\n[[+]] ### ∆ ۱. آغاز\n\n## [[+:۲.]] بخش دوم\n\n"
             "[[+]] **برچسب** [[با احتیاط]]\n\n> [[+]] **نتیجه**\n>\n> جملهٔ سوم این‌جاست. جملهٔ چهارم هم هست.\n")

    def build(self, base, text, fidelity=None):
        from types import SimpleNamespace
        from unittest.mock import patch
        scores = json.loads((ROOT / "plus/des-scores.json").read_text(encoding="utf-8"))
        nums = [int(k.rsplit("-", 1)[1]) for k in scores if k.startswith("sharehub/share-")]
        cid = f"sharehub/share-{max(nums) + 100000}"
        c = Path(base) / "checkout"
        shutil.copytree(ROOT / "tools", c / "tools", ignore=shutil.ignore_patterns("__pycache__"))
        for rel in (f"sharehub/share-{TEMPLATE}.html", "dentcast-brain.json", "plus/des-scores.json"):
            (c / rel).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / rel, c / rel)
        (c / qa.THROWAWAY_MARKER).write_text("throwaway\n", encoding="utf-8")
        item = Path(base) / "05-sharehub-test"
        (item / "05-DES-Fidelity").mkdir(parents=True)
        files = {"00-وضعیت.md": "- وضعیت: در حال آماده‌سازی\n", "01-متن.md": text,
                 "02-عنوان-کپشن.md": "## عنوان\nیک عنوان آزمایشی\n\n## کپشن\nکپشن آزمایشی\n",
                 "05-DES-Fidelity/des.json": json.dumps(
                     {"sources": scores[f"sharehub/share-{TEMPLATE}"]["sources"][:1]}, ensure_ascii=False)}
        if fidelity is not None:
            files["05-DES-Fidelity/fidelity.json"] = json.dumps(fidelity, ensure_ascii=False)
        for rel, t in files.items():
            (item / rel).write_text(t, encoding="utf-8")
        ns = SimpleNamespace(item=str(item), content_id=cid, supplement=None, date="2026-11-04", agent=None,
                             dry_run=False, receipt=None, allow_handoff=False, founder_text_change=None, draft=True,
                             throwaway=True)
        with patch.object(qa, "ROOT", c):
            qa.draft_assemble(ns)
        return c, item, cid

    def units(self, c, cid):
        r = subprocess.run([sys.executable, str(c / "tools/des_fidelity_units.py"), cid, "--json"],
                           capture_output=True, text=True, encoding="utf-8")
        self.assertEqual(r.returncode, 0, r.stderr)
        return json.loads(r.stdout)["units"]

    def test_frozen_fidelity_installs_unchanged_on_the_retrofitted_page(self):
        with tempfile.TemporaryDirectory() as t1, tempfile.TemporaryDirectory() as t2:
            c1, _item1, cid = self.build(t1, self.PLAIN)
            plain_units = self.units(c1, cid)
            self.assertIn("جملهٔ سوم این‌جاست.", [u["text"] for u in plain_units])
            claims = [{"id": u["id"], "claim_quote": u["text"], "verdict": "NOT_A_CLAIM", "change_kind": None,
                       "source_quote": "", "source_ref": None, "note": ""} for u in plain_units]
            fid = [{"des_version": "3.7", "mode": "FIDELITY", "scope": "SOURCE", "text_basis": "FULL_TEXT",
                    "claims": claims,
                    "counts": {"matches": 0, "altered": 0, "reversed": 0, "not_in_source": 0, "not_assessable": 0,
                               "author_view": 0, "not_a_claim": len(claims)},
                    "assessable": 0, "fidelity_score": None, "level": "INSUFFICIENT_CLAIMS", "provisional": False,
                    "source_conclusion": "x", "fact_fa": "", "interpretation_fa": None}]
            c2, item2, cid2 = self.build(t2, self.RETRO, fid)
            self.assertEqual(cid2, cid)
            page = (c2 / f"{cid}.html").read_text(encoding="utf-8")
            self.assertEqual(len(vp.presentation_spans(vp.article_region(page, presentation=True))), 4)
            self.assertEqual(self.units(c2, cid), plain_units)  # ids, texts, paragraphs, flags
            chk = subprocess.run([sys.executable, str(c2 / "tools/queue_install_des.py"), "--check-text", str(item2), cid],
                                 capture_output=True, text=True, encoding="utf-8")
            self.assertEqual(chk.returncode, 0, chk.stdout + chk.stderr)
            self.assertEqual(json.loads(chk.stdout)["status"], "text_ok")
            dry = subprocess.run([sys.executable, str(c2 / "tools/queue_install_des.py"), "--dry-run", "--no-mirror",
                                  str(item2), cid], capture_output=True, text=True, encoding="utf-8")
            self.assertEqual(dry.returncode, 0, dry.stdout + dry.stderr)
            r = json.loads(dry.stdout)
            self.assertEqual((r["renumbered"], r["text_synced"], r["added"], r["unassigned"], r["dropped"]),
                             (0, [], [], [], []))
            self.assertEqual(r["units_on_page"], len(plain_units))


class StyleTests(unittest.TestCase):
    RESERVED = ("#c9922b", "#e3b849", "#c49820",          # amber: premium
                "#d92b52", "#ff6b8a", "#ff7a68",          # the heart
                "#78808f", "#5f8a63", "#3f9a49", "#2f8f3f", "#1f7a34",  # DES band scale
                "#6455a6", "#a99ce0",                      # DES chrome
                "#1f7850", "#5fd39b")                      # certificate green

    def tokens(self, css):
        return dict(re.findall(r"(--st-[a-z-]+):\s*([^;]+);", css))

    def test_chip_styles_are_site_wide_in_both_themes_and_mirrored_for_the_desktop_shell(self):
        theme = (ROOT / "dc-theme.css").read_text(encoding="utf-8")
        shell = (ROOT / "index.html").read_text(encoding="utf-8")
        for cls in (".dc-chip-ok", ".dc-chip-caution", ".dc-chip-no", ".dc-sublabel"):
            self.assertIn(cls, theme)
            self.assertIn(".dcd-content-area " + cls, shell)
        light = self.tokens(theme[theme.index("PRESENTATION LAYER"):].split('[data-theme="dark"]')[0])
        dark = self.tokens(theme[theme.index("PRESENTATION LAYER"):].split('[data-theme="dark"]')[1])
        self.assertEqual(set(light), set(dark))
        self.assertEqual(len(light), 7)
        block = shell[shell.index("Presentation layer: status chips"):]
        norm = lambda d: {k: v.replace(" ", "") for k, v in d.items()}
        self.assertEqual(norm(self.tokens(block.split('[data-theme="dark"]')[0])), norm(light))
        self.assertEqual(norm(self.tokens(block.split('[data-theme="dark"]')[1].split(".dcd-content-area")[0])), norm(dark))
        for value in list(light.values()) + list(dark.values()):
            self.assertNotIn(value.strip().lower(), self.RESERVED)

    def test_no_page_needs_an_inline_style_for_the_layer(self):
        out = qa.render_body(QueueSyntaxTests.MD, {}, None, None)
        self.assertNotIn("<style", out)
        self.assertNotIn("<script", out)


class CorpusTests(unittest.TestCase):
    """Backward compatibility: this checkout's tools cut every page with a DES record, and
    render and cut every queue text, exactly as the tools before the layer did."""

    def test_units_are_identical_to_the_tools_before_the_layer(self):
        if subprocess.run(["git", "-C", str(ROOT), "cat-file", "-e", BASELINE + "^{commit}"],
                          capture_output=True).returncode != 0:
            self.skipTest("the baseline commit is not in this clone")
        out = pd.corpus_check(BASELINE)
        # a page or queue text that carries the layer is counted apart (it differs by design)
        self.assertEqual(out["page_differences"], [], out)
        self.assertEqual(out["queue_differences"], [], out)
        # the corpus is not vacuous: the whole set of pages with a record was read, and some
        # of them still carry no layer and are compared with the pre-layer tools (a marked
        # page is proved one by one with presentation_diff --page instead)
        self.assertGreater(out["pages"], 300)
        self.assertGreater(out["pages"] - out["marked_pages"], 0)
        self.assertEqual(out["status"], "identical")


if __name__ == "__main__":
    unittest.main()
