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
        "page_title":       "فهرست موضوعی — باندینگ / دنت‌کست",
        "meta_description": "نقشه‌ی موضوعی باندینگ در دندان‌پزشکی — از مفاهیم پایه تا چالش‌های پیشرفته. مجموعه‌ای از اپیزودها، گلاسری، نوت‌کست‌ها و یادداشت‌های بالینی دنت‌کست در یک ساختار واحد.",
        "h1_fa":        "فهرست موضوعی",
        "subtitle_fa":  "باندینگ — نقشه‌ی موضوعی دنت‌کست",
        "intro_paragraphs": [
            'باندینگ مدرن، یکی از معدود نقاطی است که دندان\u200cپزشکی واقعاً تبدیل به یک رشته\u200cی مولکولی می\u200cشود. این\u200cجا دیگر فقط با شکل و فرم سر و کار نداریم؛ با شیمی سطح، با ساختار کلاژن، با لایه\u200cهایی به ضخامت چند میکرون که تعیین می\u200cکنند یک ترمیم پنج سال دوام می\u200cآورد یا پنج ماه.',
            'پشت هر تصمیم باندینگ، یک زنجیره از مفاهیم نشسته است: substrate ای که می\u200cخواهیم به آن باند شویم چیست — مینای پریزماتیک، عاج با توبول\u200cهای باز، سرامیک سیلیکا\u200cبیس، زیرکونیا، فلز؟ چه استراتژی\u200cای متناسب با این substrate است؟ چه ماده\u200cای، با چه pH، در چه ترتیبی روی آن می\u200cنشیند؟ و در نهایت، باند ایجاد شده در شرایط بالینی واقعی — رطوبت، آلودگی، فشار اکلوزال، گذر زمان — چقدر پایدار می\u200cماند؟',
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
        '<svg class="dc-icon" aria-hidden="true">'
        '<use href="/assets/icons/icons.svg#' + symbol_id + '"/>'
        '</svg>'
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

    intro_html = "\n".join(
        '      <p>' + esc(p) + '</p>' for p in cfg["intro_paragraphs"]
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
        '<div id="dc-top"></div>\n'
        '\n'
        '<div class="wrap">\n'
        '\n'
        '  <header>\n'
        '    <h1>' + esc(cfg["h1_fa"]) + '</h1>\n'
        '    <p class="pillar-subtitle">' + esc(cfg["subtitle_fa"]) + '</p>\n'
        '  </header>\n'
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
        '    <a href="/index.html" class="btn-home"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg> برگشت به صفحه‌ی اصلی</a>\n'
        '    <a href="/about.html" class="btn-about"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg> درباره‌ی دکتر فواد شهابیان و دنت‌کست</a>\n'
        '    <div class="footer-copy">© 2025 DentCast — طراحی و توسعه توسط <strong>دکتر فواد شهابیان</strong></div>\n'
        '  </footer>\n'
        '\n'
        '</div>\n'
        '\n'
        '</body>\n'
        '</html>\n'
    )

    return head + body


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print("Usage: python tools/build_pillar.py <pillar-slug>", file=sys.stderr)
        print("Known slugs: " + ", ".join(PILLARS.keys()), file=sys.stderr)
        sys.exit(1)
    build_pillar(args[0])
