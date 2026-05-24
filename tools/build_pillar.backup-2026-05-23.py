#!/usr/bin/env python3
"""
build_pillar.py — DentCast Pillar Page Builder
================================================
Generates a static HTML pillar page for a given pillar slug by reading
the two JSON sources of truth (dentcast-brain.json + glossary/glossary.json),
filtering entries by pillar.primary, grouping by pillar.subtopic, and
rendering a fully static HTML file. No JavaScript on the output page —
all card content is present in the raw HTML so search engines see the
entire link graph.

Run from the project root:
    python tools/build_pillar.py bonding

Output:
    pillar/<slug>/index.html

Sources read (never modified):
    dentcast-brain.json
    glossary/glossary.json

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
        "meta_description": (
            "نقشه‌ی موضوعی باندینگ در دندان‌پزشکی — از مفاهیم پایه تا "
            "چالش‌های پیشرفته. مجموعه‌ای از اپیزودها، گلاسری، نوت‌کست‌ها "
            "و یادداشت‌های بالینی دنت‌کست در یک ساختار واحد."
        ),
        "h1_fa":        "فهرست موضوعی",
        "subtitle_fa":  "باندینگ — نقشه‌ی موضوعی دنت‌کست",
        "intro_paragraphs": [
            (
                "باندینگ مدرن، یکی از معدود نقاطی است که دندان‌پزشکی واقعاً "
                "تبدیل به یک رشته‌ی مولکولی می‌شود. این‌جا دیگر فقط با شکل و "
                "فرم سر و کار نداریم؛ با شیمی سطح، با ساختار کلاژن، با "
                "لایه‌هایی به ضخامت چند میکرون که تعیین می‌کنند یک ترمیم "
                "پنج سال دوام می‌آورد یا پنج ماه."
            ),
            (
                "پشت هر تصمیم باندینگ، یک زنجیره از مفاهیم نشسته است: "
                "substrate ای که می‌خواهیم به آن باند شویم چیست — مینای "
                "پریزماتیک، عاج با توبول‌های باز، سرامیک سیلیکا‌بیس، "
                "زیرکونیا، فلز؟ چه استراتژی‌ای متناسب با این substrate "
                "است؟ چه ماده‌ای، با چه pH، در چه ترتیبی روی آن می‌نشیند؟ "
                "و در نهایت، باند ایجاد شده در شرایط بالینی واقعی — "
                "رطوبت، آلودگی، فشار اکلوزال، گذر زمان — چقدر پایدار "
                "می‌ماند؟"
            ),
            (
                "این صفحه یک نقشه‌ی موضوعی برای ورود به این جهان است. "
                "مطالب در پنج لایه دسته‌بندی شده‌اند، از مفاهیم پایه تا "
                "چالش‌های پیشرفته. اگر تازه با باندینگ آشنا می‌شوید، از "
                "بالا شروع کنید. اگر دنبال یک مفهوم خاص یا یک تصمیم "
                "بالینی مشخص هستید، مستقیم به دسته‌ی مرتبط بروید. هر "
                "مورد به منبع کاملش در دنت‌کست لینک شده — اپیزود پادکست، "
                "نوت‌کست، گلاسری، یا یادداشت بالینی."
            ),
        ],
        # Subtopic ordering and labels. Counts are filled in at render time.
        "subtopics": [
            ("basics",     "مفاهیم پایه",         "\U0001F4D6"),  # 📖
            ("materials",  "مواد و شیمی",         "⚗️"),  # ⚗️
            ("strategies", "استراتژی‌ها و نسل‌ها", "\U0001F9ED"),  # 🧭
            ("clinical",   "کاربردهای بالینی",    "\U0001F9B7"),  # 🦷
            ("advanced",   "موضوعات پیشرفته",     "\U0001F52E"),  # 🔮
        ],
    },
}

# -------------------------------------------------------------------
# Content-type detection.
# Maps the JSON's existing `type` field (when present) and the URL
# path (always available) to a (label_fa, emoji) pair. Used both to
# pick the prefix glyph for each list item and to attach data-type
# attributes for downstream styling.
# -------------------------------------------------------------------
TYPE_META = {
    # key            : (label_fa,         emoji)
    "glossary":         ("گلاسری",         "\U0001F4D6"),  # 📖
    "podcast":          ("پادکست",         "\U0001F3A7"),  # 🎧
    "notecast":         ("نوت‌کست",         "\U0001F4DD"),  # 📝
    "insight":          ("اینسایت",        "\U0001F4A1"),  # 💡
    "dentai":           ("دنت‌AI",         "\U0001F916"),  # 🤖
    "chairside":        ("چِرساید",        "\U0001FA91"),  # 🪑
    "metanote":         ("متانوت",         "➕"),       # ➕ (≈ ✚)
    "litecast":         ("لایت‌کست",        "\U0001F50A"),  # 🔊
    "photocast":        ("فوتوکست",        "\U0001F4F7"),  # 📷
    "dentcast_plus":    ("دنت‌کست+",       "\U0001F3AC"),  # 🎬
    "sharehub":         ("شِیر هاب",       "\U0001F517"),  # 🔗
    "unknown":          ("",               "•"),       # •
}

URL_TO_TYPE = [
    ("/glossary/",     "glossary"),
    ("/episodes/",     "podcast"),
    ("/notecast/",     "notecast"),
    ("/insight/",      "insight"),
    ("/dentai/",       "dentai"),
    ("/chairside/",    "chairside"),
    ("/metanotes/",    "metanote"),
    ("/litecast/",     "litecast"),
    ("/photocast/",    "photocast"),
    ("/dentcast-plus/", "dentcast_plus"),
    ("/sharehub/",     "sharehub"),
]

JSON_TYPE_TO_KEY = {
    "notecast":     "notecast",
    "dentai":       "dentai",
    "clinical":     "insight",       # brain uses "clinical" for insight items
    "chairside":    "chairside",
    "meta":         "metanote",
    "litecast":     "litecast",
    "photocast":    "photocast",
    "dentcast_plus": "dentcast_plus",
    "sharehub":     "sharehub",
    "dentcast":     "podcast",
    "glossary":     "glossary",
}


def detect_type(entry: dict, source: str) -> str:
    """Return a key into TYPE_META."""
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


# -------------------------------------------------------------------
# Rendering helpers.
# -------------------------------------------------------------------
def esc(s: str) -> str:
    return html.escape(s or "", quote=True)


def render_item(entry: dict, source: str) -> str:
    """Render a single <li> for one entry."""
    title = entry.get("title") or entry.get("fa_title") or "(بدون عنوان)"
    url = entry.get("page_url") or entry.get("url") or "#"
    tkey = detect_type(entry, source)
    label_fa, emoji = TYPE_META[tkey]
    return (
        '      <li class="pillar-item" data-type="' + esc(tkey) + '">\n'
        '        <a href="' + esc(url) + '" class="pillar-item-link">\n'
        '          <span class="pillar-item-icon" aria-hidden="true">' + emoji + '</span>\n'
        '          <span class="pillar-item-title">' + esc(title) + '</span>\n'
        '          <span class="sr-only"> — ' + esc(label_fa) + '</span>\n'
        '        </a>\n'
        '      </li>\n'
    )


def fa_digits(n: int) -> str:
    """Convert ASCII digits to Persian/Eastern Arabic digits."""
    table = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")
    return str(n).translate(table)


def render_subtopic_card(sub_slug: str, sub_title: str, sub_icon: str, items: list[dict]) -> str:
    """Render one <details> card for a subtopic group."""
    count = len(items)
    items_html = "".join(render_item(it["entry"], it["source"]) for it in items)
    return (
        '  <details class="pillar-card" data-subtopic="' + esc(sub_slug) + '">\n'
        '    <summary class="pillar-card-summary">\n'
        '      <span class="pillar-card-icon" aria-hidden="true">' + sub_icon + '</span>\n'
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


def sort_items(items: list[dict]) -> list[dict]:
    """Spec fallback: glossary entries first (alphabetical by slug/title),
    then brain entries (alphabetical by URL path).

    The JSON sources don't carry inbound link counts, so this is the
    documented secondary sort key.
    """
    def k(it: dict):
        e = it["entry"]; src = it["source"]
        if src == "glossary":
            return (0, (e.get("slug") or e.get("title") or "").lower())
        url = (e.get("page_url") or e.get("url") or "").lower()
        return (1, url)
    return sorted(items, key=k)


# -------------------------------------------------------------------
# Main build.
# -------------------------------------------------------------------
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
BRAIN_PATH = ROOT / "dentcast-brain.json"
GLOSS_PATH = ROOT / "glossary" / "glossary.json"


def build_pillar(slug: str) -> Path:
    if slug not in PILLARS:
        raise SystemExit(f"Unknown pillar slug: {slug}. Known: {list(PILLARS.keys())}")
    cfg = PILLARS[slug]

    brain = json.loads(BRAIN_PATH.read_text(encoding="utf-8"))
    gloss_doc = json.loads(GLOSS_PATH.read_text(encoding="utf-8"))
    gloss = gloss_doc["glossary"]

    # Collect bonding entries from both sources, tagged with source.
    collected = []
    for e in brain:
        p = e.get("pillar")
        if isinstance(p, dict) and p.get("primary") == slug:
            collected.append({"source": "brain", "entry": e})
    for e in gloss:
        p = e.get("pillar")
        if isinstance(p, dict) and p.get("primary") == slug:
            collected.append({"source": "glossary", "entry": e})

    # Group by subtopic. Entries with subtopic === null go into "_unassigned".
    groups: dict[str | None, list[dict]] = defaultdict(list)
    for it in collected:
        groups[it["entry"]["pillar"].get("subtopic")].append(it)

    # Render cards in the order specified in PILLARS[slug]["subtopics"].
    cards_html_parts = []
    counts = {}
    for sub_slug, sub_title, sub_icon in cfg["subtopics"]:
        items = sort_items(groups.get(sub_slug, []))
        counts[sub_slug] = len(items)
        cards_html_parts.append(render_subtopic_card(sub_slug, sub_title, sub_icon, items))
    cards_html = "".join(cards_html_parts)

    intro_html = "\n".join(
        '      <p>' + esc(p) + '</p>' for p in cfg["intro_paragraphs"]
    )

    page = render_page(cfg, intro_html, cards_html)

    out_dir = ROOT / "pillar" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "index.html"
    out_path.write_text(page, encoding="utf-8")

    # Print a brief build summary to stdout for the operator.
    print(f"Built {out_path.relative_to(ROOT)}")
    print(f"Total items: {sum(counts.values())}")
    for sub_slug, _, _ in cfg["subtopics"]:
        print(f"  {sub_slug:11s} {counts[sub_slug]}")
    return out_path


# -------------------------------------------------------------------
# Page template — kept inline so the build script is single-file.
# -------------------------------------------------------------------
def render_page(cfg: dict, intro_html: str, cards_html: str) -> str:
    canonical = "https://dentcast.org/pillar/bonding/"
    return f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(cfg['page_title'])}</title>
  <meta name="description" content="{esc(cfg['meta_description'])}">
  <link rel="canonical" href="{canonical}">
  <link rel="alternate" hreflang="fa-IR" href="https://dentcast.ir/pillar/bonding/">
  <link rel="alternate" hreflang="fa"    href="https://dentcast.org/pillar/bonding/">
  <link rel="alternate" hreflang="x-default" href="https://dentcast.org/pillar/bonding/">
  <link rel="icon" href="/logo-v2.png" type="image/png" sizes="512x512">
  <link rel="apple-touch-icon" href="/logo-v2.png">
  <meta name="theme-color" content="#F3F5F7">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fa_IR">
  <meta property="og:site_name" content="DentCast">
  <meta property="og:title" content="{esc(cfg['page_title'])}">
  <meta property="og:description" content="{esc(cfg['meta_description'])}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="https://dentcast.org/dentcast-cover.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(cfg['page_title'])}">
  <meta name="twitter:description" content="{esc(cfg['meta_description'])}">
  <meta name="twitter:image" content="https://dentcast.org/dentcast-cover.webp">

  <!-- Site-wide stylesheets (read from existing site; not modified) -->
  <link rel="stylesheet" href="/dc-theme.css">
  <link rel="stylesheet" href="/dc-nav.css">

  <!-- Page-specific styles -->
  <link rel="stylesheet" href="/pillar/bonding/bonding.css">

  <!--
    Note (build-time): per spec, this pillar page contains no <script>
    tags. The site's normal theme-init and JSON-LD blocks present on
    metanotes/index.html are intentionally omitted here. Trade-off:
    dark-mode users may see a brief light-mode flash on first paint.
    Can be reintroduced if desired.
  -->
</head>
<body>

<!-- DC NAV: TOP BAR (replicated from metanotes/index.html so the page sits in the same shell) -->
<header class="dc-topbar">
  <div class="dc-topbar-actions">
    <a href="/" aria-label="صفحه اصلی دنت‌کست" style="display:flex;align-items:center;margin-left:8px;flex-shrink:0;"><img src="/logo-v2.png" alt="DentCast" width="38" height="38" style="display:block;object-fit:contain;"></a>
    <button class="dc-topbar-btn" id="btn-toolbar-toggle" aria-label="ابزارها" aria-expanded="false"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>
    <button class="dc-topbar-btn dcOpenSearch" aria-label="جستجو"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>
  </div>
  <div class="dc-topbar-brand">
    <div class="dc-topbar-brand-name">DentCast</div>
    <a href="/about.html" class="dc-topbar-brand-sub">دکتر فواد شهابیان</a>
  </div>
</header>

<div id="dc-top"></div>

<div class="wrap">

  <header>
    <h1>{esc(cfg['h1_fa'])}</h1>
    <p class="pillar-subtitle">{esc(cfg['subtitle_fa'])}</p>
  </header>

  <main>
    <section class="intro pillar-intro" aria-label="مقدمه">
{intro_html}
    </section>

    <section class="pillar-cards" aria-label="دسته‌بندی موضوعی">
{cards_html}
    </section>
  </main>

  <footer class="dc-site-footer">
    <a href="/index.html" class="btn-home"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg> برگشت به صفحه‌ی اصلی</a>
    <a href="/about.html" class="btn-about"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg> درباره‌ی دکتر فواد شهابیان و دنت‌کست</a>
    <div class="footer-copy">© 2025 DentCast — طراحی و توسعه توسط <strong>فواد شهابیان</strong></div>
  </footer>

</div>

</body>
</html>
"""


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print("Usage: python tools/build_pillar.py <pillar-slug>", file=sys.stderr)
        print("Known slugs: " + ", ".join(PILLARS.keys()), file=sys.stderr)
        sys.exit(1)
    build_pillar(args[0])
                                                                                                                                                                                                                                                                                                                                                                       