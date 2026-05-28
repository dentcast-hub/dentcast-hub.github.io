#!/usr/bin/env python3
"""
build_pillar.py — DentCast Pillar Page Builder
================================================
Generates a static HTML pillar page for a given pillar slug by reading
the two JSON sources of truth (dentcast-brain.json + glossary/glossary.json),
filtering entries by pillar.primary, grouping by pillar.subtopic, and
rendering a fully static HTML file. Visible content is present in raw HTML.
The output includes two <script> elements: theme-init (anti-flash) and
JSON-LD structured data; no other JavaScript.

Run from the project root:
    python tools/build_pillar.py bonding

Output:
    pillar/<slug>/index.html

Sources read (never modified):
    dentcast-brain.json
    glossary/glossary.json
    assets/icons/icons.svg   (referenced by URL only; not opened)

No other file in the project is read or written.
"""
from __future__ import annotations
import html
import json
import os
import sys
from collections import defaultdict
from pathlib import Path

# -------------------------------------------------------------------
# Pillar-specific copy & metadata.
# Add a new entry to PILLARS to build a new pillar page; the rest of
# the script is data-driven.
# -------------------------------------------------------------------
PILLARS = {
    "bonding": {
        "title_fa": "باندینگ",
        "icon":             "icon-tooth",
        "subtitle_fa_short": "از شیمی سطح تا چالش‌های بالینی",
        "page_title":       "فهرست موضوعی — باندینگ / دنت‌کست",
        "meta_description": "نقشه‌ی موضوعی باندینگ در دندان‌پزشکی — از مفاهیم پایه تا چالش‌های پیشرفته. مجموعه‌ای از اپیزودها، گلاسری، نوت‌کست‌ها و یادداشت‌های بالینی دنت‌کست در یک ساختار واحد.",
        "h1_fa":        "باندینگ",
        "subtitle_fa":  "نقشه‌ی موضوعی دنت‌کست",
        "intro_paragraphs": [
            'باندینگ مدرن، یکی از معدود نقاطی است که دندان‌پزشکی واقعاً تبدیل به یک <strong>رشته‌ی مولکولی</strong> می‌شود. این‌جا دیگر فقط با شکل و فرم سر و کار نداریم؛ با شیمی سطح، با ساختار کلاژن، با لایه‌هایی به ضخامت چند میکرون که تعیین می‌کنند یک ترمیم <strong>پنج سال</strong> دوام می‌آورد یا <strong>پنج ماه</strong>.',
            'پشت هر تصمیم باندینگ، یک زنجیره از مفاهیم نشسته است:',
            '<strong>substrate</strong> ای که می‌خواهیم به آن باند شویم چیست؟ — مینای پریزماتیک، عاج با توبول‌های باز، سرامیک سیلیکا‌بیس، زیرکونیا، فلز.',
            'چه <strong>استراتژی</strong>‌ای متناسب با این substrate است؟ چه ماده‌ای، با چه <strong>pH</strong>، در چه ترتیبی روی آن می‌نشیند؟',
            'و در نهایت، باند ایجاد شده در شرایط بالینی واقعی — رطوبت، آلودگی، فشار اکلوزال، گذر زمان — چقدر <strong>پایدار</strong> می‌ماند؟',
            'این صفحه یک نقشه‌ی موضوعی برای ورود به این جهان است. مطالب در پنج لایه دسته‌بندی شده‌اند، از مفاهیم پایه تا چالش‌های پیشرفته. اگر تازه با باندینگ آشنا می‌شوید، از بالا شروع کنید. اگر دنبال یک مفهوم خاص یا یک تصمیم بالینی مشخص هستید، مستقیم به دسته‌ی مرتبط بروید. هر مورد به منبع کاملش در دنت‌کست لینک شده — اپیزود پادکست، نوت‌کست، گلاسری، یا یادداشت بالینی.',
        ],
        "subtopics": [
            {"slug": "basics",     "title_fa": "مفاهیم پایه",     "icon": "icon-book",    "intro_fa": ""},
            {"slug": "materials",  "title_fa": "مواد و شیمی",  "icon": "icon-flask",   "intro_fa": ""},
            {"slug": "strategies", "title_fa": "استراتژی‌ها و نسل‌ها", "icon": "icon-compass", "intro_fa": ""},
            {"slug": "clinical",   "title_fa": "کاربردهای بالینی",   "icon": "icon-tooth",   "intro_fa": ""},
            {"slug": "advanced",   "title_fa": "موضوعات پیشرفته",   "icon": "icon-target",  "intro_fa": ""},
        ],
    },
    "ceramics": {
        "title_fa": "سرامیک",
        "icon":             "icon-flask",
        "subtitle_fa_short": "از شیمی ماده تا انتخاب بالینی",
        "page_title":       "فهرست موضوعی سرامیک / دنت‌کست",
        "meta_description": "نقشه‌ی موضوعی سرامیک در دندان‌پزشکی — از شیمی ماده و انواع سرامیک‌ها تا آماده‌سازی سطح، اندیکاسیون‌های بالینی، و الگوهای شکست. مجموعه‌ای از اپیزودها، گلاسری، نوت‌کست‌ها و یادداشت‌های بالینی دنت‌کست در یک ساختار واحد.",
        "h1_fa":        "سرامیک",
        "subtitle_fa":  "نقشه‌ی موضوعی دنت‌کست",
        "intro_paragraphs": [
            'سرامیک در دندان‌پزشکی یک ماده نیست. یک <strong>خانواده</strong> است. فلدسپاتیک، لیتیوم دی‌سیلیکات، زیرکونیا، هیبریدهای رزین‌ماتریکس — هر کدام یک شیمی، یک ساختار کریستالی، یک رفتار مکانیکی، و یک محدوده‌ی بالینی متفاوت دارد.',
            'این تنوع، یک تنش بالینی واقعی می‌سازد. <strong>برای این بیمار، این دندان، این جایگاه، چه سرامیکی؟</strong> پاسخ به این سؤال نه از کاتالوگ سازنده می‌آید نه از تجربه‌ی تنها. از فهم بنیادین این که چرا فلدسپاتیک شفاف‌تر است ولی شکننده‌تر، چرا زیرکونیا قوی‌تر است ولی <strong>کدرتر</strong>، چرا لیتیوم دی‌سیلیکات تعادلی بین این دو می‌سازد، و چرا هیچ‌کدام «بهترین» نیست.',
            'پشت هر تصمیم سرامیک، چند لایه نشسته است. ساختار ماده. روش پردازش. <strong>آماده‌سازی سطح</strong>. اندیکاسیون بالینی. و در نهایت، مکانیسم‌های شکست که گاهی سال‌ها بعد از سمان شدن خود را نشان می‌دهند.',
            'این صفحه یک نقشه‌ی موضوعی برای ورود به این جهان است. مطالب در <strong>پنج لایه دسته‌بندی شده‌اند</strong>، از مفاهیم پایه و انواع مواد تا چالش‌های آماده‌سازی سطح، کاربردهای بالینی، و الگوهای شکست. اگر تازه با سرامیک‌ها آشنا می‌شوید، از بالا شروع کنید. اگر دنبال یک ماده‌ی خاص یا یک تصمیم بالینی مشخص هستید، مستقیم به دسته‌ی مرتبط بروید. هر مورد به منبع کاملش در دنت‌کست لینک شده.',
        ],
        "subtopics": [
            {"slug": "basics",       "title_fa": "مفاهیم پایه",     "icon": "icon-book",    "intro_fa": ""},
            {"slug": "types",        "title_fa": "انواع سرامیک",    "icon": "icon-diamond", "intro_fa": ""},
            {"slug": "surface-prep", "title_fa": "آماده‌سازی سطح", "icon": "icon-wrench",  "intro_fa": "آماده‌سازی سطح سرامیک، آغاز یک زنجیره است. مرحله‌ی بعدی، یعنی پروتکل باند به دندان و انتخاب adhesive و رزین سمنت، در Pillar باندینگ به تفصیل آمده."},
            {"slug": "indications",  "title_fa": "کاربردهای بالینی", "icon": "icon-tooth",   "intro_fa": "انتخاب ماده‌ی سرامیک، نیمی از تصمیم است. نیمه‌ی دیگر، یعنی پروتکل سمان کردن و adhesive interface، در Pillar باندینگ بحث شده."},
            {"slug": "failures",     "title_fa": "چالش‌ها و شکست",   "icon": "icon-warning", "intro_fa": ""},
        ],
    },
    "fixed-pros": {
        "title_fa": "پروتز ثابت",
        "icon":             "icon-crown",
        "subtitle_fa_short": "از تراش تا سمان — زنجیره‌ی بازسازی",
        "page_title":       "فهرست موضوعی پروتز ثابت / دنت‌کست",
        "meta_description": "نقشه‌ی موضوعی پروتز ثابت در دندان‌پزشکی — از پست و کور و آماده‌سازی، تا قالب‌گیری، روکش و اینله/آنله، سمان‌کردن و الگوهای شکست. زنجیره‌ی بازسازی به‌صورت ساختارمند، با لینک به اپیزودها، گلاسری، نوت‌کست‌ها و یادداشت‌های بالینی دنت‌کست.",
        "h1_fa":        "پروتز ثابت",
        "subtitle_fa":  "نقشه‌ی موضوعی دنت‌کست",
        "intro_paragraphs": [
            'پروتز ثابت، یک <strong>زنجیره</strong> از تصمیم‌های وابسته است، نه یک ترمیم منفرد. هر حلقه — از بازسازی ساختار باقی‌مانده با <strong>پست و کور</strong> و کنترل <strong>فرول</strong>، تا تراش، قالب‌گیری، انتخاب ترمیم و سمان‌کردن — سقفِ کیفیت حلقه‌ی بعد را تعیین می‌کند. خطا در یک مرحله، تمام مراحل بعد را روی بنیان لرزان می‌نشاند.',
            'کیفیت <strong>تراش</strong> سقف دقت قالب‌گیری را معین می‌کند؛ دقت قالب — معمولی یا اسکن دیجیتال — سقف <strong>تطابق مارجینال</strong> ترمیم نهایی را؛ و انتخاب <strong>رزین سمنت</strong> به‌همراه آماده‌سازی سطح، حدِ پایداری <strong>روکش، اینله، آنله یا بریج</strong> را در میان‌مدت رقم می‌زند. هیچ مرحله‌ای ضعف مرحله‌ی قبل را جبران نمی‌کند.',
            'الگوهای شکست — از <strong>پوسیدگی ثانویه</strong> و جداشدگی روکش تا فرکچر — معمولاً به یک حلقه‌ی ضعیف در ابتدای زنجیره برمی‌گردند. این صفحه نقشه‌ای از کل این زنجیره است؛ هر بخش یک حلقه، با لینک به منبع کاملش در دنت‌کست.',
        ],
        "subtopics": [
            {"slug": "post-and-core", "title_fa": "پست و کور",           "icon": "icon-key",     "intro_fa": "اولین حلقه‌ی زنجیره. تصمیم درباره‌ی پست و کور — یا گاهی پرهیز از آن — تعیین می‌کند آیا اصلاً پایه‌ای برای ترمیم وجود دارد. <strong>فرول</strong> کافی، آماده‌سازی صحیح دنتین ریشه، و انتخاب جنس پست، شالوده‌ی همه‌ی مراحل بعدی است."},
            {"slug": "preparation",   "title_fa": "آماده‌سازی و تراش",   "icon": "icon-ruler",   "intro_fa": "تراش، گام عملی پس از تعیین بنیان است. هر دهم میلی‌متر، یک معامله بین حفظ بافت و فضای کافی برای ماده‌ی ترمیمی است. کیفیت تراش، حد بالایی برای دقت قالب‌گیری، <strong>تطابق مارجینال</strong> و طول عمر نهایی ترمیم می‌سازد."},
            {"slug": "impression",    "title_fa": "قالب‌گیری",            "icon": "icon-camera",  "intro_fa": "وقتی تراش تمام شد، قالب‌گیری پل میان دهان و لابراتوار است. دقت این مرحله — معمولی یا <strong>اسکن دیجیتال</strong> — حد بالایی برای تطابق نهایی ترمیم تعیین می‌کند. هیچ ترمیمی از قالبِ ناقص بهتر در نمی‌آید."},
            {"slug": "crowns-onlays", "title_fa": "روکش و اینله/آنله",   "icon": "icon-shield",  "intro_fa": "ترمیم نهایی — تک‌واحدی، چندواحدی، اینله یا آنله — حلقه‌ای است که حلقه‌های قبلی را به‌هم می‌رساند. انتخاب نوع و ماده‌ی ترمیم باید با <strong>بنیان ساخته‌شده</strong>، نوع تراش و شرایط اکلوزال هماهنگ باشد."},
            {"slug": "cementation",   "title_fa": "سمان‌کردن",            "icon": "icon-link",    "intro_fa": "آخرین حلقه‌ی زنجیره — اتصال نهایی ترمیم به دندان. انتخاب <strong>رزین سمنت</strong>، آماده‌سازی سطوح، کنترل آلودگی، و حذف کامل اضافات سمان، نقاطی هستند که موفقیت همه‌ی مراحل قبل به آن‌ها وابسته می‌شود."},
            {"slug": "failures",      "title_fa": "شکست و عوارض",         "icon": "icon-warning", "intro_fa": "وقتی زنجیره می‌شکند. الگوهای شکست — از جداشدگی روکش و فرکچر تا <strong>پوسیدگی ثانویه</strong> — معمولاً به یک حلقه‌ی ضعیف در ابتدای راه برمی‌گردند. درس گرفتن از شکست‌ها، طراحی بهتر زنجیره‌ی بعدی است."},
        ],
    },
}

TYPE_META = {
    "glossary":         ("گلاسری",  "icon-book"),
    "podcast":          ("پادکست",   "icon-headphones"),
    "notecast":         ("نوت‌کست",  "icon-note"),
    "insight":          ("اینسایت",   "icon-lightbulb"),
    "dentai":           ("دنت‌AI",    "icon-bot"),
    "chairside":        ("چِرساید", "icon-chair"),
    "metanote":         ("متانوت",  "icon-meta"),
    "litecast":         ("لایت‌کست",  "icon-volume"),
    "photocast":        ("فوتوکست", "icon-camera"),
    "dentcast_plus":    ("دنت‌کست+",    "icon-film"),
    "sharehub":         ("شِیر هاب",  "icon-link"),
    "unknown":          ("",              "icon-bullet"),
}


def svg_icon(symbol_id):
    return (
        '<svg class="dc-svg-icon" aria-hidden="true">'
        '<use href="/assets/icons/icons.svg#' + symbol_id + '"/>'
        '</svg>'
    )


TOOLBAR_DRAWER_HTML = (
    '<div id="dcToolbarDrawer" class="dc-toolbar-drawer" aria-hidden="true">\n'
    '  <div class="dc-toolbar-drawer-inner">\n'
    '    <span class="dc-toolbar-drawer-label">ابزارها</span>\n'
    '    <button class="dc-drawer-tool-seg" type="button" id="tool-pwa"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10 18h4"/><path d="M12 7v6"/><path d="m9.5 10.5 2.5 2.5 2.5-2.5"/></svg></span><span class="dc-drawer-tool-txt">نصب</span></button>\n'
    '    <button class="dc-drawer-tool-seg" type="button" id="tool-consult"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span><span class="dc-drawer-tool-txt">مشاوره</span></button>\n'
    '    <button class="dc-drawer-tool-seg" type="button" id="tool-about"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></svg></span><span class="dc-drawer-tool-txt">درباره</span></button>\n'
    '  </div>\n'
    '</div>\n'
)

RADAR_OVERLAY_HTML = (
    '<div id="dcRadarOverlay" class="radar-overlay" aria-hidden="true">\n'
    '  <div class="radar-overlay-header">\n'
    '    <button id="dcCloseRadarOverlay" class="radar-close-btn">&times;</button>\n'
    '    <div class="radar-header-title">رادار دنت‌کست (جایگزین گوگل)</div>\n'
    '  </div>\n'
    '  <div class="radar-overlay-body">\n'
    '    <div class="radar-search-box">\n'
    '      <input type="text" id="dcRadarInput" placeholder="نام سایت، زمینه فعالیت یا کلمه کلیدی..." autocomplete="off">\n'
    '    </div>\n'
    '    <div id="dcRadarResults" class="radar-results">\n'
    '      <div class="radar-initial-msg">برای جستجو در بین سایت‌های دندانپزشکی، تایپ کنید...</div>\n'
    '    </div>\n'
    '  </div>\n'
    '</div>\n'
)

GLOBAL_SEARCH_HTML = (
    '  <!-- 🔍 Global Search -->\n'
    '  <div class="dc-global-filter-box" id="dcGlobalBox">\n'
    '    <button class="dc-close-results"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>\n'
    '    <h3 class="dc-global-filter-title">جستجوی سراسری دنت‌کست</h3>\n'
    '    <input id="dcSearch" class="dc-search-input" placeholder="جستجو در همهٔ بخش‌های دنت‌کست…">\n'
    '    <div class="dc-filter-list">\n'
    '      <button class="dc-filter-btn active" data-type="dentcast">دنت‌کست</button>\n'
    '      <button class="dc-filter-btn active" data-type="notecast">نوت‌کست</button>\n'
    '      <button class="dc-filter-btn active" data-type="clinical">نکات کلینیکی</button>\n'
    '      <!-- <button class="dc-filter-btn active" data-type="litecast">لایت‌کست</button>-->\n'
    '      <!-- <button class="dc-filter-btn active" data-type="photocast">فوتوکست</button>-->\n'
    '      <button class="dc-filter-btn active" data-type="dentcast_plus">ویدیوها</button>\n'
    '      <button class="dc-filter-btn active" data-type="dentai">مقالات</button>\n'
    '      <button class="dc-filter-btn active" data-type="meta">metanote</button>\n'
    '      <button class="dc-filter-btn active" data-type="chairside">chairside</button>\n'
    '      <button class="dc-filter-btn active" data-type="sharehub">Share Hub</button>\n'
    '    </div>\n'
    '    <div class="dc-results-box" id="dcResults"></div>\n'
    '  </div>\n'
)

GLOBAL_SEARCH_CSS_LINK = '  <link rel="stylesheet" href="/global-search.css?v=1">\n'

GLOBAL_SEARCH_SCRIPTS = (
    '<script src="/global-search.js?v=5"></script>\n'
    '<script src="/global-search-ui.js?v=1"></script>\n'
    '<script src="/shake-search.js?v=1"></script>\n'
)

URL_TO_TYPE = [
    ("/glossary/",      "glossary"),
    ("/episodes/",      "podcast"),
    ("/notecast/",      "notecast"),
    ("/insight/",       "insight"),
    ("/dentai/",        "dentai"),
    ("/chairside/",     "chairside"),
    ("/metanotes/",     "metanote"),
    ("/litecast/",      "litecast"),
    ("/photocast/",     "photocast"),
    ("/dentcast-plus/", "dentcast_plus"),
    ("/sharehub/",      "sharehub"),
]

JSON_TYPE_TO_KEY = {
    "notecast":     "notecast",
    "dentai":       "dentai",
    "clinical":     "insight",
    "chairside":    "chairside",
    "meta":         "metanote",
    "litecast":     "litecast",
    "photocast":    "photocast",
    "dentcast_plus": "dentcast_plus",
    "sharehub":     "sharehub",
    "dentcast":     "podcast",
    "glossary":     "glossary",
}


def detect_type(entry, source):
    if source == "glossary":
        return "glossary"
    t = entry.get("type")
    if t and t in JSON_TYPE_TO_KEY:
        return JSON_TYPE_TO_KEY[t]
    url = entry.get("page_url") or entry.get("url") or ""
    for prefix, key in URL_TO_TYPE:
        if url.startswith(prefix):
            return key
    return "unknown"


def esc(s):
    return html.escape(s or "", quote=True)


def render_item(entry, source):
    title = entry.get("title") or entry.get("fa_title") or "(بدون عنوان)"
    url = entry.get("page_url") or entry.get("url") or "#"
    tkey = detect_type(entry, source)
    label_fa, symbol_id = TYPE_META[tkey]
    return (
        '      <li class="pillar-item" data-type="' + esc(tkey) + '">\n'
        '        <a href="' + esc(url) + '" class="pillar-item-link">\n'
        '          <span class="pillar-item-icon" aria-hidden="true">' + svg_icon(symbol_id) + '</span>\n'
        '          <span class="pillar-item-title">' + esc(title) + '</span>\n'
        '          <span class="sr-only"> ' + esc(label_fa) + '</span>\n'
        '        </a>\n'
        '      </li>\n'
    )


def fa_digits(n):
    table = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")
    return str(n).translate(table)


def render_subtopic_card(sub_slug, sub_title, sub_symbol_id, items, intro_fa=""):
    count = len(items)
    items_html = "".join(render_item(it["entry"], it["source"]) for it in items)
    intro_html = (
        '      <p class="pillar-subtopic-intro">' + intro_fa + '</p>\n'
        if intro_fa else ''
    )
    return (
        '  <details class="pillar-card" data-subtopic="' + esc(sub_slug) + '">\n'
        '    <summary class="pillar-card-summary">\n'
        '      <span class="pillar-card-icon" aria-hidden="true">' + svg_icon(sub_symbol_id) + '</span>\n'
        '      <h2 class="pillar-card-title">' + esc(sub_title) + '</h2>\n'
        '      <span class="pillar-card-count" aria-label="' + fa_digits(count) + ' مورد">'
        '(' + fa_digits(count) + ')</span>\n'
        '      <span class="pillar-card-chevron" aria-hidden="true">▾</span>\n'
        '    </summary>\n'
        '    <div class="pillar-card-body">\n'
        + intro_html +
        '      <ul class="pillar-list">\n'
        + items_html +
        '      </ul>\n'
        '      <div class="pillar-card-fade" aria-hidden="true"></div>\n'
        '    </div>\n'
        '  </details>\n'
    )


def sort_items(items):
    def k(it):
        e = it["entry"]; src = it["source"]
        if src == "glossary":
            return (0, (e.get("slug") or e.get("title") or "").lower())
        url = (e.get("page_url") or e.get("url") or "").lower()
        return (1, url)
    return sorted(items, key=k)


def build_jsonld(cfg, canonical, flat_ordered):
    item_list_elements = []
    for i, it in enumerate(flat_ordered, start=1):
        e = it["entry"]
        title = e.get("title") or e.get("fa_title") or "(بدون عنوان)"
        url = e.get("page_url") or e.get("url") or ""
        if url.startswith("/"):
            url_abs = "https://dentcast.org" + url
        else:
            url_abs = url
        item_list_elements.append({
            "@type": "ListItem",
            "position": i,
            "name": title,
            "url": url_abs,
        })

    data = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "url": canonical,
                "name": cfg["page_title"],
                "description": cfg["meta_description"],
                "inLanguage": "fa",
                "isPartOf": {"@id": "https://dentcast.org/#website"},
                "author": {"@id": "https://dentcast.org/about.html#person-fouad-shahabian"},
                "mainEntity": {
                    "@type": "ItemList",
                    "numberOfItems": len(item_list_elements),
                    "itemListElement": item_list_elements,
                },
            }
        ],
    }
    return json.dumps(data, ensure_ascii=False, indent=2)


# ROOT path is set via env var for portable execution.
_root_env = os.environ.get("DENTCAST_ROOT")
if _root_env:
    ROOT = Path(_root_env).resolve()
else:
    HERE = Path(__file__).resolve().parent
    ROOT = HERE.parent
BRAIN_PATH = ROOT / "dentcast-brain.json"
GLOSS_PATH = ROOT / "glossary" / "glossary.json"


def build_pillar(slug):
    if slug not in PILLARS:
        raise SystemExit("Unknown pillar slug: " + slug)
    cfg = PILLARS[slug]

    brain = json.loads(BRAIN_PATH.read_text(encoding="utf-8"))
    gloss_doc = json.loads(GLOSS_PATH.read_text(encoding="utf-8"))
    gloss = gloss_doc["glossary"]

    collected = []
    for e in brain:
        p = e.get("pillar")
        if isinstance(p, dict) and p.get("primary") == slug:
            collected.append({"source": "brain", "entry": e})
    for e in gloss:
        p = e.get("pillar")
        if isinstance(p, dict) and p.get("primary") == slug:
            collected.append({"source": "glossary", "entry": e})

    groups = defaultdict(list)
    for it in collected:
        groups[it["entry"]["pillar"].get("subtopic")].append(it)

    cards_html_parts = []
    counts = {}
    flat_ordered = []
    for sub in cfg["subtopics"]:
        sub_slug  = sub["slug"]
        sub_title = sub["title_fa"]
        sub_icon  = sub["icon"]
        sub_intro = sub.get("intro_fa", "")
        items = sort_items(groups.get(sub_slug, []))
        counts[sub_slug] = len(items)
        cards_html_parts.append(render_subtopic_card(sub_slug, sub_title, sub_icon, items, sub_intro))
        flat_ordered.extend(items)
    cards_html = "".join(cards_html_parts)

    intro_html = "\n".join(
        '      <p>' + p + '</p>' for p in cfg["intro_paragraphs"]
    )

    page = render_page(slug, cfg, intro_html, cards_html, flat_ordered)

    out_dir = ROOT / "pillar" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "index.html"
    out_path.write_text(page, encoding="utf-8")

    print("Built " + str(out_path.relative_to(ROOT)))
    print("Total items: " + str(sum(counts.values())))
    for sub in cfg["subtopics"]:
        print("  " + sub["slug"].ljust(11) + " " + str(counts[sub["slug"]]))
    return out_path


def render_page(slug, cfg, intro_html, cards_html, flat_ordered):
    canonical = "https://dentcast.org/pillar/" + slug + "/"
    jsonld_body = build_jsonld(cfg, canonical, flat_ordered)

    head = (
        '<!DOCTYPE html>\n'
        '<html lang="fa" dir="rtl">\n'
        '<head>\n'
        '  <meta charset="UTF-8">\n'
        '  <meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '  <title>' + esc(cfg["page_title"]) + '</title>\n'
        '  <meta name="description" content="' + esc(cfg["meta_description"]) + '">\n'
        '  <link rel="canonical" href="' + canonical + '">\n'
        '  <link rel="alternate" hreflang="fa-IR" href="https://dentcast.ir/pillar/' + slug + '/">\n'
        '  <link rel="alternate" hreflang="fa"    href="https://dentcast.org/pillar/' + slug + '/">\n'
        '  <link rel="alternate" hreflang="x-default" href="https://dentcast.org/pillar/' + slug + '/">\n'
        '  <link rel="icon" href="/logo-v2.png" type="image/png" sizes="512x512">\n'
        '  <link rel="apple-touch-icon" href="/logo-v2.png">\n'
        '  <meta name="theme-color" content="#F3F5F7">\n'
        '  <meta property="og:type" content="website">\n'
        '  <meta property="og:locale" content="fa_IR">\n'
        '  <meta property="og:site_name" content="DentCast">\n'
        '  <meta property="og:title" content="' + esc(cfg["page_title"]) + '">\n'
        '  <meta property="og:description" content="' + esc(cfg["meta_description"]) + '">\n'
        '  <meta property="og:url" content="' + canonical + '">\n'
        '  <meta property="og:image" content="https://dentcast.org/dentcast-cover.webp">\n'
        '  <meta name="twitter:card" content="summary_large_image">\n'
        '  <meta name="twitter:title" content="' + esc(cfg["page_title"]) + '">\n'
        '  <meta name="twitter:description" content="' + esc(cfg["meta_description"]) + '">\n'
        '  <meta name="twitter:image" content="https://dentcast.org/dentcast-cover.webp">\n'
        '\n'
        '  <!-- JSON-LD structured data -->\n'
        '  <script type="application/ld+json">\n'
        + jsonld_body + '\n'
        '  </script>\n'
        '\n'
        '  <link rel="stylesheet" href="/dc-theme.css">\n'
        '  <link rel="stylesheet" href="/dc-nav.css">\n'
        '  <link rel="stylesheet" href="/global-search.css?v=1">\n'
        '\n'
        '  <link rel="stylesheet" href="/pillar/bonding/bonding.css">\n'
        '\n'
        '  <style>\n'
        '    /* Optional intro paragraph at the top of a subtopic card body.\n'
        '       Rendered only when a subtopic defines a non-empty intro_fa\n'
        '       in PILLARS. Calm muted block, RTL accent on the right.\n'
        '       Default palette (used by bonding) matches the pillar-index\n'
        '       default teal; per-pillar overrides below stay scoped via\n'
        '       [data-pillar="..."] on <body>. */\n'
        '    .pillar-subtopic-intro {\n'
        '      margin: 0 0 16px 0;\n'
        '      padding: 12px 16px;\n'
        '      background: rgba(45, 106, 122, 0.06);\n'
        '      border-right: 3px solid rgba(45, 106, 122, 0.35);\n'
        '      border-radius: 6px;\n'
        '      font-size: 14px;\n'
        '      line-height: 1.7;\n'
        '      color: var(--text, #333);\n'
        '    }\n'
        '    [data-theme="dark"] .pillar-subtopic-intro {\n'
        '      background: rgba(74, 154, 171, 0.10);\n'
        '      border-right-color: rgba(74, 154, 171, 0.45);\n'
        '      color: var(--text, #ddd);\n'
        '    }\n'
        '    /* ceramics — turquoise: #1ca5a5 light / #3dd6c4 dark */\n'
        '    [data-pillar="ceramics"] .pillar-subtopic-intro {\n'
        '      background: rgba(28, 165, 165, 0.07);\n'
        '      border-right-color: rgba(28, 165, 165, 0.40);\n'
        '    }\n'
        '    [data-theme="dark"] [data-pillar="ceramics"] .pillar-subtopic-intro {\n'
        '      background: rgba(61, 214, 196, 0.10);\n'
        '      border-right-color: rgba(61, 214, 196, 0.45);\n'
        '    }\n'
        '  </style>\n'
        '\n'
        "  <!-- Theme init verbatim from metanotes/index.html -->\n"
        "  <script>\n"
        "    (function(){\n"
        "      const s=localStorage.getItem('dc-theme');\n"
        "      const d=window.matchMedia('(prefers-color-scheme:dark)').matches;\n"
        "      if(s==='dark'||(s===null&&d)) document.documentElement.setAttribute('data-theme','dark');\n"
        "    })();\n"
        "  </script>\n"
        '</head>\n'
    )

    body = (
        '<body data-pillar="' + esc(slug) + '">\n'
        '\n'
        '<header class="dc-topbar">\n'
        '  <div class="dc-topbar-actions">\n'
        '    <a href="/" aria-label="صفحه اصلی دنت‌کست" style="display:flex;align-items:center;margin-left:8px;flex-shrink:0;"><img src="/logo-v2.png" alt="DentCast" width="38" height="38" style="display:block;object-fit:contain;"></a>\n'
        '    <button class="dc-topbar-btn" id="btn-toolbar-toggle" aria-label="ابزارها" aria-expanded="false"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>\n'
        '    <button class="dc-topbar-btn dcOpenSearch" aria-label="جستجو"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>\n'
        '  </div>\n'
        '  <div class="dc-topbar-brand">\n'
        '    <div class="dc-topbar-brand-name">DentCast</div>\n'
        '    <a href="/about.html" class="dc-topbar-brand-sub">دکتر فواد شهابیان</a>\n'
        '  </div>\n'
        '</header>\n'
        '\n'
        '<div id="dcToolbarDrawer" class="dc-toolbar-drawer" aria-hidden="true">\n'
        '  <div class="dc-toolbar-drawer-inner">\n'
        '    <span class="dc-toolbar-drawer-label">ابزارها</span>\n'
        '    <button class="dc-drawer-tool-seg" type="button" id="tool-pwa"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10 18h4"/><path d="M12 7v6"/><path d="m9.5 10.5 2.5 2.5 2.5-2.5"/></svg></span><span class="dc-drawer-tool-txt">نصب</span></button>\n'
        '    <button class="dc-drawer-tool-seg" type="button" id="tool-consult"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span><span class="dc-drawer-tool-txt">مشاوره</span></button>\n'
        '    <button class="dc-drawer-tool-seg" type="button" id="tool-about"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></svg></span><span class="dc-drawer-tool-txt">درباره</span></button>\n'
        '  </div>\n'
        '</div>\n'
        '<div id="dcRadarOverlay" class="radar-overlay" aria-hidden="true">\n'
        '  <div class="radar-overlay-header">\n'
        '    <button id="dcCloseRadarOverlay" class="radar-close-btn">&times;</button>\n'
        '    <div class="radar-header-title">رادار دنت‌کست (جایگزین گوگل)</div>\n'
        '  </div>\n'
        '  <div class="radar-overlay-body">\n'
        '    <div class="radar-search-box">\n'
        '      <input type="text" id="dcRadarInput" placeholder="نام سایت، زمینه فعالیت یا کلمه کلیدی..." autocomplete="off">\n'
        '    </div>\n'
        '    <div id="dcRadarResults" class="radar-results">\n'
        '      <div class="radar-initial-msg">برای جستجو در بین سایت‌های دندانپزشکی، تایپ کنید...</div>\n'
        '    </div>\n'
        '  </div>\n'
        '</div>\n'
        '\n'
        '<div id="dc-top"></div>\n'
        '\n'
        '<div class="wrap">\n'
        '\n'
        '  <header>\n'
        '    <h1>' + esc(cfg["h1_fa"]) + '</h1>\n'
        '    <p class="pillar-subtitle">' + esc(cfg["subtitle_fa"]) + '</p>\n'
        '  </header>\n'
        '\n'
        '  <!-- 🔍 Global Search -->\n'
        '  <div class="dc-global-filter-box" id="dcGlobalBox">\n'
        '    <button class="dc-close-results"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>\n'
        '    <h3 class="dc-global-filter-title">جستجوی سراسری دنت‌کست</h3>\n'
        '    <input id="dcSearch" class="dc-search-input" placeholder="جستجو در همهٔ بخش‌های دنت‌کست…">\n'
        '    <div class="dc-filter-list">\n'
        '      <button class="dc-filter-btn active" data-type="dentcast">دنت‌کست</button>\n'
        '      <button class="dc-filter-btn active" data-type="notecast">نوت‌کست</button>\n'
        '      <button class="dc-filter-btn active" data-type="clinical">نکات کلینیکی</button>\n'
        '      <!-- <button class="dc-filter-btn active" data-type="litecast">لایت‌کست</button>-->\n'
        '      <!-- <button class="dc-filter-btn active" data-type="photocast">فوتوکست</button>-->\n'
        '      <button class="dc-filter-btn active" data-type="dentcast_plus">ویدیوها</button>\n'
        '      <button class="dc-filter-btn active" data-type="dentai">مقالات</button>\n'
        '      <button class="dc-filter-btn active" data-type="meta">metanote</button>\n'
        '      <button class="dc-filter-btn active" data-type="chairside">chairside</button>\n'
        '      <button class="dc-filter-btn active" data-type="sharehub">Share Hub</button>\n'
        '    </div>\n'
        '    <div class="dc-results-box" id="dcResults"></div>\n'
        '  </div>\n'
        '\n'
        '  <main>\n'
        '    <section class="intro pillar-intro" aria-label="مقدمه">\n'
        + intro_html + '\n'
        '    </section>\n'
        '\n'
        '    <section class="pillar-cards" aria-label="دسته‌بندی موضوعی">\n'
        + cards_html +
        '    </section>\n'
        '  </main>\n'
        '\n'
        '  <footer class="dc-site-footer">\n'
        '    <a href="../" class="btn-home"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg> بازگشت به فهرست موضوعی</a>\n'
        '    <a href="/about.html" class="btn-about"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg> درباره‌ی دکتر فواد شهابیان و دنت‌کست</a>\n'
        '    <div class="footer-copy">© 2025 DentCast — طراحی و توسعه توسط <strong>دکتر فواد شهابیان</strong></div>\n'
        '  </footer>\n'
        '\n'
        '</div>\n'
        '\n'
        '<!-- تم تاگل -->\n'
        '<button id="dc-theme-toggle" aria-label="تغییر تم"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M20.5 14.2A8.2 8.2 0 0 1 9.8 3.5 8.8 8.8 0 1 0 20.5 14.2z"/></svg></button>\n'
        '\n'
        '<!-- Theme toggle behavior moved to /dc-nav.js (single source) -->\n'
        '<script src="/global-search.js?v=5"></script>\n'
        '<script src="/global-search-ui.js?v=1"></script>\n'
        '<script src="/shake-search.js?v=1"></script>\n'
        '<script src="/dc-nav.js" defer></script>\n'
        '\n'
        '</body>\n'
        '</html>\n'
    )

    return head + body


def _count_pillar(slug, brain, gloss):
    items = 0
    subs = set()
    for e in brain:
        p = e.get("pillar")
        if isinstance(p, dict) and p.get("primary") == slug:
            items += 1
            if p.get("subtopic"): subs.add(p["subtopic"])
    for e in gloss:
        p = e.get("pillar")
        if isinstance(p, dict) and p.get("primary") == slug:
            items += 1
            if p.get("subtopic"): subs.add(p["subtopic"])
    return items, len(subs)


def build_jsonld_index(canonical, pillars_info):
    items = []
    for i, info in enumerate(pillars_info, start=1):
        items.append({
            "@type": "ListItem",
            "position": i,
            "name": info["h1_fa"],
            "url": "https://dentcast.org/pillar/" + info["slug"] + "/",
            "description": info["subtitle_fa_short"],
        })
    data = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "url": canonical,
                "name": "فهرست موضوعی / دنت‌کست",
                "description": INDEX_META_DESCRIPTION,
                "inLanguage": "fa",
                "isPartOf": {"@id": "https://dentcast.org/#website"},
                "author": {"@id": "https://dentcast.org/about.html#person-fouad-shahabian"},
                "mainEntity": {
                    "@type": "ItemList",
                    "numberOfItems": len(items),
                    "itemListElement": items,
                },
            }
        ],
    }
    return json.dumps(data, ensure_ascii=False, indent=2)


INDEX_META_DESCRIPTION = (
    "نقشه‌ی موضوعی دنت‌کست — "
    "مجموعه‌ای از pillar‌های دندان‌پزشکی که "
    "محتوای پادکست، گلاسری، نوت‌کست "
    "و یادداشت‌های بالینی را در ساختاری "
    "منسجم سازماندهی می‌کنند."
)

INDEX_INTRO_HTML = (
    "دنت‌کست در طول سال‌ها به شبکه‌ای از "
    "اپیزود، گلاسری، نوت‌کست و یادداشت "
    "بالینی تبدیل شده. هر <strong>موضوع</strong> "
    "اینجا یک نقطه‌ی ورود است به این شبکه — "
    "مفاهیم پایه تا چالش‌های پیشرفته، با لینک "
    "به منبع کامل. نقشه به‌مرور رشد می‌کند."
)

INDEX_INLINE_STYLE = (
    "<style>\n"
    "/* Pillar index — visual sibling of Glossary index.\n"
    "   Teal palette mirrors Glossary's blue at equivalent intensity:\n"
    "     light primary teal: #2d6a7a — mirrors --pr (#022360)\n"
    "     dark primary teal:  #4a9aab — mirrors dark --pr (#5b9cf6)\n"
    "   Opacities mirror Glossary's. */\n"
    "\n"
    "/* Page container */\n"
    ".pillar-index .page { max-width: 680px; margin: 0 auto; padding: 0 14px 60px; }\n"
    "\n"
    "/* Hero / title */\n"
    ".pillar-index .top { padding: 12px 0 10px; }\n"
    ".pillar-index .nav-back { margin-bottom: 8px; }\n"
    ".pillar-index .back-link { display: inline-flex; align-items: center; gap: 4px; font-size: .78rem; font-weight: 600; color: var(--txt3); transition: color var(--tr); }\n"
    ".pillar-index .back-link::before { content: \"\\2190 \\00A0\"; }\n"
    ".pillar-index .back-link:hover { color: #2d6a7a; }\n"
    "[data-theme=\"dark\"] .pillar-index .back-link:hover { color: #4a9aab; }\n"
    "\n"
    ".pillar-index .hero { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }\n"
    ".pillar-index .title { font-size: 1.1rem; font-weight: 900; color: #2d6a7a; display: flex; gap: 8px; align-items: center; transition: color var(--tr2); margin: 0; }\n"
    ".pillar-index .title .dot { width: 9px; height: 9px; border-radius: var(--r-f); background: #2d6a7a; box-shadow: 0 0 0 4px rgba(45,106,122,.15); flex-shrink: 0; }\n"
    ".pillar-index .subtitle { color: var(--txt3); font-size: .80rem; line-height: 1.6; transition: color var(--tr2); }\n"
    "[data-theme=\"dark\"] .pillar-index .title { color: #4a9aab; }\n"
    "[data-theme=\"dark\"] .pillar-index .title .dot { background: #4a9aab; box-shadow: 0 0 0 4px rgba(74,154,171,.15); }\n"
    "\n"
    "/* Intro paragraph — free-flowing text */\n"
    "body:has(.dc-topbar) .pillar-intro { background: transparent; border: 0; box-shadow: none; padding: 0; backdrop-filter: none; -webkit-backdrop-filter: none; margin: 6px 0 14px; }\n"
    ".pillar-intro p { color: var(--txt2); font-size: .82rem; line-height: 1.85; margin: 0; }\n"
    ".pillar-intro p strong { color: var(--txt); }\n"
    "\n"
    "/* Stats — three separate chips */\n"
    ".pillar-index-stats { display: flex; flex-direction: row; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 16px 0; }\n"
    ".pillar-index-stat-chip { display: inline-flex; align-items: baseline; gap: 6px; padding: 8px 16px; border-radius: 22px; background: rgba(45,106,122,.10); border: 1px solid rgba(45,106,122,.25); }\n"
    ".pillar-index-stat-chip .stat-value { font-size: 16px; font-weight: 700; color: #2d6a7a; font-feature-settings: \"tnum\"; font-variant-numeric: tabular-nums; }\n"
    ".pillar-index-stat-chip .stat-label { font-size: 13px; color: var(--txt3); }\n"
    "[data-theme=\"dark\"] .pillar-index-stat-chip { background: rgba(74,154,171,.15); border-color: rgba(74,154,171,.35); }\n"
    "[data-theme=\"dark\"] .pillar-index-stat-chip .stat-value { color: #4a9aab; }\n"
    "\n"
    "/* List wrap (outer card frame, same as Glossary's .listWrap) */\n"
    ".pillar-index .listWrap { margin-top: 4px; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--r-xl); overflow: hidden; box-shadow: var(--card-sh); transition: all var(--tr2); }\n"
    "\n"
    "/* Pillar card row */\n"
    ".pillar-card-row { display: flex; align-items: stretch; gap: 12px; padding: 14px 14px; margin: 6px 6px; border-radius: var(--r-md); background: var(--surface2); border: 1px solid rgba(45,106,122,.25); transition: all var(--tr); -webkit-tap-highlight-color: transparent; color: inherit; text-decoration: none; }\n"
    ".pillar-card-row:hover { background: var(--surface3); border-color: rgba(45,106,122,.35); transform: translateX(-2px); }\n"
    ".pillar-card-row:active { transform: scale(.99); }\n"
    "[data-theme=\"dark\"] .pillar-card-row { border-color: rgba(74,154,171,.30); }\n"
    "[data-theme=\"dark\"] .pillar-card-row:hover { border-color: rgba(74,154,171,.45); }\n"
    "\n"
    ".pillar-card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }\n"
    ".pillar-card-header { display: flex; align-items: center; gap: 8px; }\n"
    ".pillar-card-icon { font-size: 1.1rem; line-height: 1; color: #2d6a7a; flex-shrink: 0; display: inline-flex; align-items: center; }\n"
    ".pillar-card-icon .dc-svg-icon { width: 1.2em; height: 1.2em; }\n"
    "[data-theme=\"dark\"] .pillar-card-icon { color: #4a9aab; }\n"
    ".pillar-card-name { margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: #2d6a7a; letter-spacing: -.2px; }\n"
    "[data-theme=\"dark\"] .pillar-card-name { color: #6ab5c4; }\n"
    ".pillar-card-subtitle { margin: 0; font-size: .78rem; color: var(--txt2); line-height: 1.5; }\n"
    ".pillar-card-meta { margin: 0; font-size: .7rem; color: var(--txt3); font-feature-settings: \"tnum\"; }\n"
    "\n"
    "/* Subtopic list — label on right (RTL), small teal chip on left */\n"
    ".pillar-card-subtopics { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 0; font-size: .78rem; color: var(--txt2); }\n"
    ".pillar-card-subtopics li { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border2); }\n"
    ".pillar-card-subtopics li:last-child { border-bottom: 0; }\n"
    ".subtopic-label { font-size: .82rem; color: var(--txt); }\n"
    ".subtopic-chip { display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 22px; padding: 0 8px; border-radius: 11px; background: rgba(45,106,122,.10); color: #2d6a7a; font-size: 12px; font-weight: 600; font-feature-settings: \"tnum\"; font-variant-numeric: tabular-nums; }\n"
    "[data-theme=\"dark\"] .subtopic-chip { background: rgba(74,154,171,.18); color: #4a9aab; }\n"
    "\n"
    "/* Arrow (chevron) on the LEFT in RTL */\n"
    ".pillar-card-arrow { width: 30px; height: 30px; border-radius: var(--r-sm); display: grid; place-items: center; background: rgba(45,106,122,.10); border: 1px solid rgba(45,106,122,.25); color: #2d6a7a; flex-shrink: 0; align-self: center; transition: all var(--tr2); }\n"
    ".pillar-card-arrow .dc-svg-icon { width: 1em; height: 1em; }\n"
    "[data-theme=\"dark\"] .pillar-card-arrow { background: rgba(74,154,171,.15); border-color: rgba(74,154,171,.35); color: #4a9aab; }\n"
    "\n"
    "@media (max-width: 480px) {\n"
    "  .pillar-card-row { padding: 12px 12px; }\n"
    "  .pillar-card-name { font-size: .92rem; }\n"
    "}\n"
    "\n"
    "/* Per-pillar accent — ceramics uses turquoise in place of the\n"
    "   default teal. Same mechanism, same places as the default above;\n"
    "   selectors are scoped to [data-pillar=\"ceramics\"] so bonding\n"
    "   keeps the default.\n"
    "     light primary turquoise: #1ca5a5\n"
    "     dark primary turquoise:  #3dd6c4 */\n"
    ".pillar-card-row[data-pillar=\"ceramics\"] { border-color: rgba(28,165,165,.25); }\n"
    ".pillar-card-row[data-pillar=\"ceramics\"]:hover { border-color: rgba(28,165,165,.35); }\n"
    ".pillar-card-row[data-pillar=\"ceramics\"] .pillar-card-icon { color: #1ca5a5; }\n"
    ".pillar-card-row[data-pillar=\"ceramics\"] .pillar-card-name { color: #1ca5a5; }\n"
    ".pillar-card-row[data-pillar=\"ceramics\"] .subtopic-chip { background: rgba(28,165,165,.10); color: #1ca5a5; }\n"
    ".pillar-card-row[data-pillar=\"ceramics\"] .pillar-card-arrow { background: rgba(28,165,165,.10); border-color: rgba(28,165,165,.25); color: #1ca5a5; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"ceramics\"] { border-color: rgba(61,214,196,.30); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"ceramics\"]:hover { border-color: rgba(61,214,196,.45); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"ceramics\"] .pillar-card-icon { color: #3dd6c4; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"ceramics\"] .pillar-card-name { color: #3dd6c4; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"ceramics\"] .subtopic-chip { background: rgba(61,214,196,.18); color: #3dd6c4; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"ceramics\"] .pillar-card-arrow { background: rgba(61,214,196,.15); border-color: rgba(61,214,196,.35); color: #3dd6c4; }\n"
    "\n"
    "/* Per-pillar accent — fixed-pros uses warm brown in place of teal.\n"
    "   Same mechanism, same places as the default teal above; selectors\n"
    "   are scoped to [data-pillar=\"fixed-pros\"] so other cards stay teal.\n"
    "     light primary brown: #9a6a2d\n"
    "     dark primary brown:  #c89456 */\n"
    ".pillar-card-row[data-pillar=\"fixed-pros\"] { border-color: rgba(154,106,45,.25); }\n"
    ".pillar-card-row[data-pillar=\"fixed-pros\"]:hover { border-color: rgba(154,106,45,.35); }\n"
    ".pillar-card-row[data-pillar=\"fixed-pros\"] .pillar-card-icon { color: #9a6a2d; }\n"
    ".pillar-card-row[data-pillar=\"fixed-pros\"] .pillar-card-name { color: #9a6a2d; }\n"
    ".pillar-card-row[data-pillar=\"fixed-pros\"] .subtopic-chip { background: rgba(154,106,45,.10); color: #9a6a2d; }\n"
    ".pillar-card-row[data-pillar=\"fixed-pros\"] .pillar-card-arrow { background: rgba(154,106,45,.10); border-color: rgba(154,106,45,.25); color: #9a6a2d; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"fixed-pros\"] { border-color: rgba(200,148,86,.30); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"fixed-pros\"]:hover { border-color: rgba(200,148,86,.45); }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"fixed-pros\"] .pillar-card-icon { color: #c89456; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"fixed-pros\"] .pillar-card-name { color: #d8a570; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"fixed-pros\"] .subtopic-chip { background: rgba(200,148,86,.18); color: #c89456; }\n"
    "[data-theme=\"dark\"] .pillar-card-row[data-pillar=\"fixed-pros\"] .pillar-card-arrow { background: rgba(200,148,86,.15); border-color: rgba(200,148,86,.35); color: #c89456; }\n"
    "</style>"
)


def _count_per_subtopic(slug, brain, gloss):
    counts = defaultdict(int)
    for e in brain:
        p = e.get("pillar")
        if isinstance(p, dict) and p.get("primary") == slug:
            sub = p.get("subtopic")
            if sub:
                counts[sub] += 1
    for e in gloss:
        p = e.get("pillar")
        if isinstance(p, dict) and p.get("primary") == slug:
            sub = p.get("subtopic")
            if sub:
                counts[sub] += 1
    return counts


def build_index():
    brain = json.loads(BRAIN_PATH.read_text(encoding="utf-8"))
    gloss = json.loads(GLOSS_PATH.read_text(encoding="utf-8"))["glossary"]

    pillars_info = []
    for slug, cfg in PILLARS.items():
        items, subs = _count_pillar(slug, brain, gloss)
        per_sub = _count_per_subtopic(slug, brain, gloss)
        subtopic_list = [
            {"slug": sub["slug"], "title_fa": sub["title_fa"], "count": per_sub.get(sub["slug"], 0)}
            for sub in cfg["subtopics"]
        ]
        pillars_info.append({
            "slug": slug,
            "h1_fa": cfg["h1_fa"],
            "subtitle_fa_short": cfg["subtitle_fa_short"],
            "icon": cfg["icon"],
            "items": items,
            "subtopics": subs,
            "subtopic_list": subtopic_list,
        })

    cards_html = "".join(_render_index_card(info) for info in pillars_info)
    page = _render_index_page(pillars_info, cards_html)

    out_dir = ROOT / "pillar"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "index.html"
    out_path.write_text(page, encoding="utf-8")

    print("Built " + str(out_path.relative_to(ROOT)))
    print("Pillars listed: " + str(len(pillars_info)))
    for info in pillars_info:
        print("  " + info["slug"].ljust(11) + " " + str(info["items"]) + " items, " + str(info["subtopics"]) + " subtopics")
    return out_path


def _render_index_card(info):
    subtopic_lis = "".join(
        '          <li>\n'
        '            <span class="subtopic-label">' + esc(s["title_fa"]) + '</span>\n'
        '            <span class="subtopic-chip">' + fa_digits(s["count"]) + '</span>\n'
        '          </li>\n'
        for s in info["subtopic_list"]
    )
    return (
        '      <a class="pillar-card-row" data-pillar="' + esc(info["slug"]) + '" href="/pillar/' + esc(info["slug"]) + '/">\n'
        '        <div class="pillar-card-body">\n'
        '          <div class="pillar-card-header">\n'
        '            <span class="pillar-card-icon" aria-hidden="true">' + svg_icon("icon-target") + '</span>\n'
        '            <h2 class="pillar-card-name">' + esc(info["h1_fa"]) + '</h2>\n'
        '          </div>\n'
        '          <p class="pillar-card-subtitle">' + esc(info["subtitle_fa_short"]) + '</p>\n'
        '          <p class="pillar-card-meta">' + fa_digits(info["items"]) + ' مطلب · ' + fa_digits(info["subtopics"]) + ' زیرموضوع</p>\n'
        '          <ul class="pillar-card-subtopics">\n'
        + subtopic_lis +
        '          </ul>\n'
        '        </div>\n'
        '        <div class="pillar-card-arrow" aria-hidden="true">\n'
        '          <svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>\n'
        '        </div>\n'
        '      </a>\n'
    )


def _render_index_page(pillars_info, cards_html):
    canonical = "https://dentcast.org/pillar/"
    page_title = "فهرست موضوعی / دنت‌کست"
    h1_fa = "فهرست موضوعی"
    subtitle_fa = "نقشه‌ی موضوعی دنت‌کست"
    jsonld_body = build_jsonld_index(canonical, pillars_info)

    total_pillars   = len(pillars_info)
    total_items     = sum(p["items"] for p in pillars_info)
    total_subtopics = sum(p["subtopics"] for p in pillars_info)

    stats_html = (
        '      <div class="pillar-index-stats">\n'
        '        <span class="pillar-index-stat-chip"><span class="stat-value">' + fa_digits(total_pillars)   + '</span><span class="stat-label">موضوع</span></span>\n'
        '        <span class="pillar-index-stat-chip"><span class="stat-value">' + fa_digits(total_items)     + '</span><span class="stat-label">مطلب</span></span>\n'
        '        <span class="pillar-index-stat-chip"><span class="stat-value">' + fa_digits(total_subtopics) + '</span><span class="stat-label">زیرموضوع</span></span>\n'
        '      </div>\n'
    )

    head = (
        '<!DOCTYPE html>\n'
        '<html lang="fa" dir="rtl">\n'
        '<head>\n'
        '  <meta charset="UTF-8">\n'
        '  <meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '  <title>' + esc(page_title) + '</title>\n'
        '  <meta name="description" content="' + esc(INDEX_META_DESCRIPTION) + '">\n'
        '  <link rel="canonical" href="' + canonical + '">\n'
        '  <link rel="alternate" hreflang="fa-IR" href="https://dentcast.ir/pillar/">\n'
        '  <link rel="alternate" hreflang="fa"    href="https://dentcast.org/pillar/">\n'
        '  <link rel="alternate" hreflang="x-default" href="https://dentcast.org/pillar/">\n'
        '  <link rel="icon" href="/logo-v2.png" type="image/png" sizes="512x512">\n'
        '  <link rel="apple-touch-icon" href="/logo-v2.png">\n'
        '  <meta name="theme-color" content="#F3F5F7">\n'
        '  <meta property="og:type" content="website">\n'
        '  <meta property="og:locale" content="fa_IR">\n'
        '  <meta property="og:site_name" content="DentCast">\n'
        '  <meta property="og:title" content="' + esc(page_title) + '">\n'
        '  <meta property="og:description" content="' + esc(INDEX_META_DESCRIPTION) + '">\n'
        '  <meta property="og:url" content="' + canonical + '">\n'
        '  <meta property="og:image" content="https://dentcast.org/dentcast-cover.webp">\n'
        '  <meta name="twitter:card" content="summary_large_image">\n'
        '  <meta name="twitter:title" content="' + esc(page_title) + '">\n'
        '  <meta name="twitter:description" content="' + esc(INDEX_META_DESCRIPTION) + '">\n'
        '  <meta name="twitter:image" content="https://dentcast.org/dentcast-cover.webp">\n'
        '\n'
        '  <!-- JSON-LD structured data -->\n'
        '  <script type="application/ld+json">\n'
        + jsonld_body + '\n'
        '  </script>\n'
        '\n'
        '  <link rel="stylesheet" href="/dc-theme.css">\n'
        '  <link rel="stylesheet" href="/dc-nav.css">\n'
        '  <link rel="stylesheet" href="/global-search.css?v=1">\n'
        '\n'
        '  ' + INDEX_INLINE_STYLE + '\n'
        '\n'
        "  <!-- Theme init verbatim from metanotes/index.html -->\n"
        "  <script>\n"
        "    (function(){\n"
        "      const s=localStorage.getItem('dc-theme');\n"
        "      const d=window.matchMedia('(prefers-color-scheme:dark)').matches;\n"
        "      if(s==='dark'||(s===null&&d)) document.documentElement.setAttribute('data-theme','dark');\n"
        "    })();\n"
        "  </script>\n"
        '</head>\n'
    )

    body = (
        '<body class="pillar-index">\n'
        '\n'
        '<header class="dc-topbar">\n'
        '  <div class="dc-topbar-actions">\n'
        '    <a href="/" aria-label="صفحه اصلی دنت‌کست" style="display:flex;align-items:center;margin-left:8px;flex-shrink:0;"><img src="/logo-v2.png" alt="DentCast" width="38" height="38" style="display:block;object-fit:contain;"></a>\n'
        '    <button class="dc-topbar-btn" id="btn-toolbar-toggle" aria-label="ابزارها" aria-expanded="false"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>\n'
        '    <button class="dc-topbar-btn dcOpenSearch" aria-label="جستجو"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>\n'
        '  </div>\n'
        '  <div class="dc-topbar-brand">\n'
        '    <div class="dc-topbar-brand-name">DentCast</div>\n'
        '    <a href="/about.html" class="dc-topbar-brand-sub">دکتر فواد شهابیان</a>\n'
        '  </div>\n'
        '</header>\n'
        '\n'
        '<div id="dcToolbarDrawer" class="dc-toolbar-drawer" aria-hidden="true">\n'
        '  <div class="dc-toolbar-drawer-inner">\n'
        '    <span class="dc-toolbar-drawer-label">ابزارها</span>\n'
        '    <button class="dc-drawer-tool-seg" type="button" id="tool-pwa"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10 18h4"/><path d="M12 7v6"/><path d="m9.5 10.5 2.5 2.5 2.5-2.5"/></svg></span><span class="dc-drawer-tool-txt">نصب</span></button>\n'
        '    <button class="dc-drawer-tool-seg" type="button" id="tool-consult"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span><span class="dc-drawer-tool-txt">مشاوره</span></button>\n'
        '    <button class="dc-drawer-tool-seg" type="button" id="tool-about"><span class="dc-drawer-tool-ico"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></svg></span><span class="dc-drawer-tool-txt">درباره</span></button>\n'
        '  </div>\n'
        '</div>\n'
        '<div id="dcRadarOverlay" class="radar-overlay" aria-hidden="true">\n'
        '  <div class="radar-overlay-header">\n'
        '    <button id="dcCloseRadarOverlay" class="radar-close-btn">&times;</button>\n'
        '    <div class="radar-header-title">رادار دنت‌کست (جایگزین گوگل)</div>\n'
        '  </div>\n'
        '  <div class="radar-overlay-body">\n'
        '    <div class="radar-search-box">\n'
        '      <input type="text" id="dcRadarInput" placeholder="نام سایت، زمینه فعالیت یا کلمه کلیدی..." autocomplete="off">\n'
        '    </div>\n'
        '    <div id="dcRadarResults" class="radar-results">\n'
        '      <div class="radar-initial-msg">برای جستجو در بین سایت‌های دندانپزشکی، تایپ کنید...</div>\n'
        '    </div>\n'
        '  </div>\n'
        '</div>\n'
        '\n'
        '<div id="dc-top"></div>\n'
        '\n'
        '<div class="wrap">\n'
        '\n'
        '  <!-- 🔍 Global Search -->\n'
        '  <div class="dc-global-filter-box" id="dcGlobalBox">\n'
        '    <button class="dc-close-results"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>\n'
        '    <h3 class="dc-global-filter-title">جستجوی سراسری دنت‌کست</h3>\n'
        '    <input id="dcSearch" class="dc-search-input" placeholder="جستجو در همهٔ بخش‌های دنت‌کست…">\n'
        '    <div class="dc-filter-list">\n'
        '      <button class="dc-filter-btn active" data-type="dentcast">دنت‌کست</button>\n'
        '      <button class="dc-filter-btn active" data-type="notecast">نوت‌کست</button>\n'
        '      <button class="dc-filter-btn active" data-type="clinical">نکات کلینیکی</button>\n'
        '      <button class="dc-filter-btn active" data-type="dentcast_plus">ویدیوها</button>\n'
        '      <button class="dc-filter-btn active" data-type="dentai">مقالات</button>\n'
        '      <button class="dc-filter-btn active" data-type="meta">metanote</button>\n'
        '      <button class="dc-filter-btn active" data-type="chairside">chairside</button>\n'
        '      <button class="dc-filter-btn active" data-type="sharehub">Share Hub</button>\n'
        '    </div>\n'
        '    <div class="dc-results-box" id="dcResults"></div>\n'
        '  </div>\n'
        '\n'
        '  <main class="page">\n'
        '\n'
        '    <div class="top">\n'
        '      <div class="hero">\n'
        '        <div class="nav-back">\n'
        '          <a href="/index.html" class="back-link">بازگشت به صفحهٔ اصلی دنت‌کست</a>\n'
        '        </div>\n'
        '        <h1 class="title"><span class="dot" aria-hidden="true"></span>' + esc(h1_fa) + '</h1>\n'
        '        <div class="subtitle">' + esc(subtitle_fa) + '</div>\n'
        '      </div>\n'
        '\n'
        '      <section class="intro pillar-intro" aria-label="مقدمه">\n'
        '        <p>' + INDEX_INTRO_HTML + '</p>\n'
        '      </section>\n'
        '\n'
        + stats_html +
        '    </div>\n'
        '\n'
        '    <div class="listWrap">\n'
        + cards_html +
        '    </div>\n'
        '\n'
        '  </main>\n'
        '\n'
        '</div>\n'
        '\n'
        '<!-- تم تاگل -->\n'
        '<button id="dc-theme-toggle" aria-label="تغییر تم"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M20.5 14.2A8.2 8.2 0 0 1 9.8 3.5 8.8 8.8 0 1 0 20.5 14.2z"/></svg></button>\n'
        '\n'
        '<!-- Theme toggle behavior moved to /dc-nav.js (single source) -->\n'
        '<script src="/global-search.js?v=5"></script>\n'
        '<script src="/global-search-ui.js?v=1"></script>\n'
        '<script src="/shake-search.js?v=1"></script>\n'
        '<script src="/dc-nav.js" defer></script>\n'
        '\n'
        '</body>\n'
        '</html>\n'
    )
    return head + body


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print("Usage: python build_pillar.py <target>", file=sys.stderr)
        print("Targets: " + ", ".join(list(PILLARS.keys()) + ["index", "all"]), file=sys.stderr)
        sys.exit(1)
    target = args[0]
    if target == "index":
        build_index()
    elif target == "all":
        for slug in PILLARS.keys():
            build_pillar(slug)
        build_index()
    elif target in PILLARS:
        build_pillar(target)
    else:
        print("Unknown target: " + target, file=sys.stderr)
        print("Targets: " + ", ".join(list(PILLARS.keys()) + ["index", "all"]), file=sys.stderr)
        sys.exit(1)
