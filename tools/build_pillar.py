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
# Currently only "bonding" is defined. Add a new entry to PILLARS to
# build a new pillar page; the rest of the script is data-driven.
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
            'باندینگ مدرن، یکی از معدود نقاطی است که دندان\u200cپزشکی واقعاً تبدیل به یک <strong>رشته\u200cی مولکولی</strong> می\u200cشود. این\u200cجا دیگر فقط با شکل و فرم سر و کار نداریم؛ با شیمی سطح، با ساختار کلاژن، با لایه\u200cهایی به ضخامت چند میکرون که تعیین می\u200cکنند یک ترمیم <strong>پنج سال</strong> دوام می\u200cآورد یا <strong>پنج ماه</strong>.',
            'پشت هر تصمیم باندینگ، یک زنجیره از مفاهیم نشسته است:',
            '<strong>substrate</strong> ای که می\u200cخواهیم به آن باند شویم چیست؟ — مینای پریزماتیک، عاج با توبول\u200cهای باز، سرامیک سیلیکا\u200cبیس، زیرکونیا، فلز.',
            'چه <strong>استراتژی</strong>\u200cای متناسب با این substrate است؟ چه ماده\u200cای، با چه <strong>pH</strong>، در چه ترتیبی روی آن می\u200cنشیند؟',
            'و در نهایت، باند ایجاد شده در شرایط بالینی واقعی — رطوبت، آلودگی، فشار اکلوزال، گذر زمان — چقدر <strong>پایدار</strong> می\u200cماند؟',
            'این صفحه یک نقشه\u200cی موضوعی برای ورود به این جهان است. مطالب در پنج لایه دسته\u200cبندی شده\u200cاند، از مفاهیم پایه تا چالش\u200cهای پیشرفته. اگر تازه با باندینگ آشنا می\u200cشوید، از بالا شروع کنید. اگر دنبال یک مفهوم خاص یا یک تصمیم بالینی مشخص هستید، مستقیم به دسته\u200cی مرتبط بروید. هر مورد به منبع کاملش در دنت\u200cکست لینک شده — اپیزود پادکست، نوت\u200cکست، گلاسری، یا یادداشت بالینی.',
        ],
        "subtopics": [
            ("basics",     "مفاهیم پایه",     "icon-book"),
            ("materials",  "مواد و شیمی",  "icon-flask"),
            ("strategies", "استراتژی‌ها و نسل‌ها", "icon-compass"),
            ("clinical",   "کاربردهای بالینی",   "icon-tooth"),
            ("advanced",   "موضوعات پیشرفته",   "icon-target"),
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


# -------------------------------------------------------------------
# Nav-shell sibling blocks + asset references — byte-identical copies
# from metanotes/index.html. The pillar topbar's hamburger and search
# buttons depend on these elements existing in the DOM; without them,
# dc-nav.js silently no-ops. Keep in sync with Meta Base.
# -------------------------------------------------------------------
# Module-level constants — byte-identical copies of the four sibling blocks
# from metanotes/index.html (the canonical reference for the site nav shell).
# These must NOT diverge from Meta Base; if Meta Base changes, sync these.
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


def render_subtopic_card(sub_slug, sub_title, sub_symbol_id, items):
    count = len(items)
    items_html = "".join(render_item(it["entry"], it["source"]) for it in items)
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
    for sub_slug, sub_title, sub_icon in cfg["subtopics"]:
        items = sort_items(groups.get(sub_slug, []))
        counts[sub_slug] = len(items)
        cards_html_parts.append(render_subtopic_card(sub_slug, sub_title, sub_icon, items))
        flat_ordered.extend(items)
    cards_html = "".join(cards_html_parts)

    # intro paragraphs may contain inline <strong> markup; emit as-is (PILLARS is trusted).
    intro_html = "\n".join(
        '      <p>' + p + '</p>' for p in cfg["intro_paragraphs"]
    )

    page = render_page(cfg, intro_html, cards_html, flat_ordered)

    out_dir = ROOT / "pillar" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "index.html"
    out_path.write_text(page, encoding="utf-8")

    print("Built " + str(out_path.relative_to(ROOT)))
    print("Total items: " + str(sum(counts.values())))
    for sub_slug, _, _ in cfg["subtopics"]:
        print("  " + sub_slug.ljust(11) + " " + str(counts[sub_slug]))
    return out_path


def render_page(cfg, intro_html, cards_html, flat_ordered):
    canonical = "https://dentcast.org/pillar/bonding/"
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
        '  <link rel="alternate" hreflang="fa-IR" href="https://dentcast.ir/pillar/bonding/">\n'
        '  <link rel="alternate" hreflang="fa"    href="https://dentcast.org/pillar/bonding/">\n'
        '  <link rel="alternate" hreflang="x-default" href="https://dentcast.org/pillar/bonding/">\n'
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
        '<body>\n'
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


# -------------------------------------------------------------------
# Index page builder.
# Generates pillar/index.html — the landing page that lists every
# registered pillar. Counts are computed from the JSON sources so
# adding a new pillar to PILLARS (with valid `icon` and
# `subtitle_fa_short` fields) is enough to update the index next
# build. No manual edits elsewhere.
# -------------------------------------------------------------------
def _count_pillar(slug, brain, gloss):
    """Return (total_items, distinct_subtopics) for a pillar slug."""
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
    """JSON-LD for the index page — CollectionPage + mainEntity ItemList."""
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


# Module-level constants used by the index page.
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
    "   Teal accent palette mirrors Glossary's blue at equal intensity:\n"
    "     light primary teal: #1e5a6a (rgb 30,90,106)  — mirrors --pr (#022360)\n"
    "     light accent teal:  #1c8a9a (rgb 28,138,154) — mirrors --ac (#0b5fff)\n"
    "     dark accent teal:   #6ab5c4 (rgb 106,181,196)\n"
    "   Spacing/typography mirror Glossary verbatim. */\n"
    "\n"
    "/* Page container */\n"
    ".pillar-index .page { max-width: 680px; margin: 0 auto; padding: 0 14px 60px; }\n"
    "\n"
    "/* Hero / title */\n"
    ".pillar-index .top { padding: 12px 0 10px; }\n"
    ".pillar-index .nav-back { margin-bottom: 8px; }\n"
    ".pillar-index .back-link { display: inline-flex; align-items: center; gap: 4px; font-size: .78rem; font-weight: 600; color: var(--txt3); transition: color var(--tr); }\n"
    ".pillar-index .back-link::before { content: \"\\2190 \\00A0\"; }\n"
    ".pillar-index .back-link:hover { color: #1c8a9a; }\n"
    "[data-theme=\"dark\"] .pillar-index .back-link:hover { color: #6ab5c4; }\n"
    "\n"
    ".pillar-index .hero { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }\n"
    ".pillar-index .title { font-size: 1.1rem; font-weight: 900; color: #1e5a6a; display: flex; gap: 8px; align-items: center; transition: color var(--tr2); margin: 0; }\n"
    ".pillar-index .title .dot { width: 9px; height: 9px; border-radius: var(--r-f); background: #1c8a9a; box-shadow: 0 0 0 4px rgba(28,138,154,.15); flex-shrink: 0; }\n"
    ".pillar-index .subtitle { color: var(--txt3); font-size: .80rem; line-height: 1.6; transition: color var(--tr2); }\n"
    "[data-theme=\"dark\"] .pillar-index .title { color: #6ab5c4; }\n"
    "[data-theme=\"dark\"] .pillar-index .title .dot { background: #6ab5c4; box-shadow: 0 0 0 4px rgba(106,181,196,.15); }\n"
    "\n"
    "/* Intro paragraph (override site-wide .intro card styling — pillar intro is free-flowing text) */\n"
    "body:has(.dc-topbar) .pillar-intro { background: transparent; border: 0; box-shadow: none; padding: 0; backdrop-filter: none; -webkit-backdrop-filter: none; margin: 6px 0 14px; }\n"
    ".pillar-intro p { color: var(--txt2); font-size: .82rem; line-height: 1.85; margin: 0; }\n"
    ".pillar-intro p strong { color: var(--txt); }\n"
    "\n"
    "/* Stats chip row */\n"
    ".pillar-index .metaRow { display: flex; justify-content: flex-start; align-items: center; gap: 10px; margin-top: 4px; margin-bottom: 12px; }\n"
    ".pillar-index .stats-chip { padding: 5px 10px; border-radius: var(--r-f); border: 1px solid var(--border); background: var(--surface2); font-size: .76rem; color: var(--txt3); user-select: none; white-space: nowrap; transition: all var(--tr2); font-feature-settings: \"tnum\"; }\n"
    "\n"
    "/* List wrap (outer card frame, same as Glossary's .listWrap) */\n"
    ".pillar-index .listWrap { margin-top: 4px; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--r-xl); overflow: hidden; box-shadow: var(--card-sh); transition: all var(--tr2); }\n"
    "\n"
    "/* Pillar card row — analogous to Glossary's .term but richer */\n"
    ".pillar-card-row { display: flex; align-items: stretch; gap: 12px; padding: 14px 14px; margin: 6px 6px; border-radius: var(--r-md); background: var(--surface2); border: 1px solid var(--border2); transition: all var(--tr); -webkit-tap-highlight-color: transparent; color: inherit; text-decoration: none; }\n"
    ".pillar-card-row:hover { background: var(--surface3); border-color: var(--border); transform: translateX(-2px); }\n"
    ".pillar-card-row:active { transform: scale(.99); }\n"
    "\n"
    ".pillar-card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }\n"
    ".pillar-card-header { display: flex; align-items: center; gap: 8px; }\n"
    ".pillar-card-icon { font-size: 1.1rem; line-height: 1; color: #1e5a6a; flex-shrink: 0; display: inline-flex; align-items: center; }\n"
    ".pillar-card-icon .dc-svg-icon { width: 1.2em; height: 1.2em; }\n"
    "[data-theme=\"dark\"] .pillar-card-icon { color: #6ab5c4; }\n"
    ".pillar-card-name { margin: 0; font-size: .95rem; font-weight: 800; color: var(--txt); letter-spacing: -.2px; }\n"
    ".pillar-card-subtitle { margin: 0; font-size: .78rem; color: var(--txt2); line-height: 1.5; }\n"
    ".pillar-card-meta { margin: 0; font-size: .7rem; color: var(--txt3); font-feature-settings: \"tnum\"; }\n"
    "\n"
    ".pillar-card-subtopics { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 0; font-size: .78rem; color: var(--txt2); }\n"
    ".pillar-card-subtopics li { padding: 5px 0; border-bottom: 1px solid var(--border2); display: flex; justify-content: space-between; align-items: center; gap: 8px; }\n"
    ".pillar-card-subtopics li:last-child { border-bottom: 0; }\n"
    ".pillar-card-subtopics .subtopic-count { color: var(--txt3); font-size: .7rem; font-feature-settings: \"tnum\"; }\n"
    "\n"
    "/* Arrow (chevron) on the LEFT in RTL (body first, arrow last in DOM) */\n"
    ".pillar-card-arrow { width: 30px; height: 30px; border-radius: var(--r-sm); display: grid; place-items: center; background: rgba(28,138,154,.08); border: 1px solid rgba(28,138,154,.18); color: #1c8a9a; flex-shrink: 0; align-self: center; transition: all var(--tr2); }\n"
    ".pillar-card-arrow .dc-svg-icon { width: 1em; height: 1em; }\n"
    "[data-theme=\"dark\"] .pillar-card-arrow { background: rgba(106,181,196,.12); border-color: rgba(106,181,196,.30); color: #6ab5c4; }\n"
    "\n"
    "/* Sticky footer chain — preserved from prior op */\n"
    "html, body { min-height: 100vh; }\n"
    "body { display: flex; flex-direction: column; }\n"
    "body > .wrap { flex: 1 0 auto; display: flex; flex-direction: column; }\n"
    ".wrap > main { flex: 1 0 auto; }\n"
    ".wrap > .dc-site-footer, .wrap > footer { flex-shrink: 0; }\n"
    "\n"
    "@media (max-width: 480px) {\n"
    "  .pillar-card-row { padding: 12px 12px; }\n"
    "  .pillar-card-name { font-size: .92rem; }\n"
    "}\n"
    "</style>"
)


def _count_per_subtopic(slug, brain, gloss):
    """Return dict {subtopic_slug: count} for one pillar."""
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
    """Build pillar/index.html — landing page that lists every registered pillar."""
    brain = json.loads(BRAIN_PATH.read_text(encoding="utf-8"))
    gloss = json.loads(GLOSS_PATH.read_text(encoding="utf-8"))["glossary"]

    pillars_info = []
    for slug, cfg in PILLARS.items():
        items, subs = _count_pillar(slug, brain, gloss)
        per_sub = _count_per_subtopic(slug, brain, gloss)
        subtopic_list = [
            {"slug": s_slug, "title_fa": s_title, "count": per_sub.get(s_slug, 0)}
            for (s_slug, s_title, _icon) in cfg["subtopics"]
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
    """Render one pillar card: header (icon + title), subtitle, meta, subtopic list, left-side chevron."""
    subtopic_lis = "".join(
        '          <li>' + esc(s["title_fa"]) + ' <span class="subtopic-count">(' + fa_digits(s["count"]) + ')</span></li>\n'
        for s in info["subtopic_list"]
    )
    return (
        '      <a class="pillar-card-row" href="/pillar/' + esc(info["slug"]) + '/">\n'
        '        <div class="pillar-card-body">\n'
        '          <div class="pillar-card-header">\n'
        '            <span class="pillar-card-icon" aria-hidden="true">' + svg_icon(info["icon"]) + '</span>\n'
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

    # Aggregate stats across all pillars (future-proof: scales with len(PILLARS))
    total_pillars   = len(pillars_info)
    total_items     = sum(p["items"] for p in pillars_info)
    total_subtopics = sum(p["subtopics"] for p in pillars_info)
    stats_text = (
        fa_digits(total_pillars) + " موضوع · "
        + fa_digits(total_items) + " مطلب · "
        + fa_digits(total_subtopics) + " زیرموضوع"
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
        '      <div class="metaRow">\n'
        '        <div class="stats-chip" id="statsChip">' + stats_text + '</div>\n'
        '      </div>\n'
        '    </div>\n'
        '\n'
        '    <div class="listWrap">\n'
        + cards_html +
        '    </div>\n'
        '\n'
        '  </main>\n'
        '\n'
        '  <footer class="dc-site-footer">\n'
        '    <a href="/index.html" class="btn-home"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg> برگشت به صفحه‌ی اصلی</a>\n'
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



# -------------------------------------------------------------------
# CLI dispatch — supports: <pillar-slug> | index | all
# -------------------------------------------------------------------
if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print("Usage: python tools/build_pillar.py <target>", file=sys.stderr)
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
