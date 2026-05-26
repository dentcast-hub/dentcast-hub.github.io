#!/usr/bin/env python3
"""
build_episodes.py — DentCast Episodes Hub Builder
=================================================
Generates the fully static episodes.html landing page by reading the
single source of truth (dentcast.json), sorting episodes newest-first,
rendering every episode as a real <a href> in the HTML source (so Google
crawls them), and writing the result to episodes.html.

Runtime JS is limited to UI behavior only: player expand/collapse,
"نمایش بیشتر" archive expansion, and (via external scripts) the theme
toggle and global search. The episode list, featured card, stats and
Jalali dates are all baked in at build time.

Run from the project root:
    python tools/build_episodes.py

Output:
    episodes.html  (overwritten in place)

Sources read (never modified):
    dentcast.json

No other file in the project is read or written. Deterministic — two
runs on the same calendar day produce a byte-identical file.
"""
from __future__ import annotations
import datetime
import html
import json
import math
import os
import re
import sys
from pathlib import Path

# -------------------------------------------------------------------
# ROOT path (env var override for portable execution; pillar pattern)
# -------------------------------------------------------------------
_root_env = os.environ.get("DENTCAST_ROOT")
if _root_env:
    ROOT = Path(_root_env).resolve()
else:
    HERE = Path(__file__).resolve().parent
    ROOT = HERE.parent

JSON_PATH  = ROOT / "dentcast.json"
BRAIN_PATH = ROOT / "dentcast-brain.json"
OUT_PATH   = ROOT / "episodes.html"

# Project epoch — first DentCast episode published 17 Jul 2019, but the
# user's stated reference for "years active" is 31 Aug 2019.
PROJECT_START = datetime.date(2019, 8, 31)

# Chunk size for the archive's initial visible slice. The rest sit in
# the same <ol> (so crawlers see them) and are hidden with a CSS rule
# keyed on the data-collapsed attribute.
INITIAL_CHUNK = 30

# Hard cap on hashtag chips rendered per archive row. Brain entries
# sometimes carry 20+ tags; the spec says max 3, in array order.
MAX_TAGS_PER_ITEM = 3

# Taxonomy guard — the SEO prose downstream is anchored to these five
# clusters. If the live top-5 pillars in brain drift from this set, the
# build still succeeds but stdout carries a warning so the prose can be
# revisited by hand.
EXPECTED_TOP_PILLARS = {"implantology", "bonding", "ceramics", "esthetic", "occlusion"}


# -------------------------------------------------------------------
# Small helpers — Persian digits, escaping, date conversion
# -------------------------------------------------------------------
FA_DIGITS_TABLE = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")
FA_MONTHS = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
]


def esc(s):
    return html.escape(s or "", quote=True)


def fa_digits(n):
    return str(n).translate(FA_DIGITS_TABLE)


def greg_to_jalali(gy, gm, gd):
    """Standard Hijri-Shamsi conversion (same algorithm as v1 JS)."""
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    if gy <= 1600:
        jy = 0
        gy -= 621
    else:
        jy = 979
        gy -= 1600
    gy2 = (gy + 1) if gm > 2 else gy
    days = (365 * gy) + (gy2 + 3) // 4 - (gy2 + 99) // 100 + (gy2 + 399) // 400 - 80 + gd + g_d_m[gm - 1]
    jy += 33 * (days // 12053)
    days %= 12053
    jy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        jy += (days - 1) // 365
        days = (days - 1) % 365
    if days < 186:
        jm = 1 + days // 31
        jd = 1 + (days % 31)
    else:
        jm = 7 + (days - 186) // 30
        jd = 1 + ((days - 186) % 30)
    return jy, jm, jd


def parse_published(s):
    """Parse the RFC-822-ish 'Wed, 17 Jul 2019 09:26:37 GMT' string.
    Returns a datetime.date (UTC) or None on failure."""
    if not s:
        return None
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(s)
        return dt.date()
    except Exception:
        pass
    # Fallback: try ISO format
    try:
        return datetime.datetime.fromisoformat(s.replace("Z", "+00:00")).date()
    except Exception:
        return None


def format_jalali_date(published):
    d = parse_published(published)
    if d is None:
        return ""
    jy, jm, jd = greg_to_jalali(d.year, d.month, d.day)
    return fa_digits(jd) + " " + FA_MONTHS[jm - 1] + " " + fa_digits(jy)


# -------------------------------------------------------------------
# Episode-data helpers — cleaning, parsing, sorting
# -------------------------------------------------------------------
_TITLE_PREFIX_RE = re.compile(r"^[\d.]+\s*[-–]\s*")
_TAG_RE = re.compile(r"<[^>]*>")
_WS_RE  = re.compile(r"\s+")


def clean_title(t):
    return _TITLE_PREFIX_RE.sub("", (t or "").strip())


def strip_html(s):
    if not s:
        return ""
    txt = _TAG_RE.sub(" ", s)
    txt = html.unescape(txt)
    return _WS_RE.sub(" ", txt).strip()


def excerpt(text, max_chars=170):
    if len(text) <= max_chars:
        return text
    cut = text[:max_chars]
    sp = cut.rfind(" ")
    if sp > max_chars * 0.6:
        cut = cut[:sp]
    return cut + "…"


def duration_to_seconds(d):
    if not d:
        return 0
    parts = d.split(":")
    try:
        nums = [int(p) for p in parts]
    except ValueError:
        return 0
    if len(nums) == 2:
        return nums[0] * 60 + nums[1]
    if len(nums) == 3:
        return nums[0] * 3600 + nums[1] * 60 + nums[2]
    return 0


def parse_episode_num(s):
    try:
        return float(s)
    except (TypeError, ValueError):
        return 0.0


def load_brain(path):
    """dentcast-brain.json is a JSON array, occasionally with trailing
    NUL bytes from filesystem padding — strip them before parsing.
    Returns a dict keyed by str(episode), holding only episode-shaped
    entries (those with caption + hashtags + pillar)."""
    raw = path.read_bytes().rstrip(b"\x00").rstrip()
    data = json.loads(raw.decode("utf-8"))
    by_ep = {}
    for entry in data:
        if not isinstance(entry, dict):
            continue
        ep = entry.get("episode")
        if ep is None:
            continue
        if "caption" not in entry or "hashtags" not in entry or "pillar" not in entry:
            continue
        by_ep[str(ep)] = entry
    return by_ep


def pillar_counts(brain_by_ep):
    from collections import Counter
    counter = Counter()
    for b in brain_by_ep.values():
        p = b.get("pillar") or {}
        if isinstance(p, dict):
            prim = p.get("primary")
            if prim:
                counter[prim] += 1
    return counter


# -------------------------------------------------------------------
# Locked HTML chunks — copied byte-for-byte from the existing page so
# the build script never has to think about them again.
# -------------------------------------------------------------------
THEME_INIT_SCRIPT = (
    '  <!-- Theme init — no flash -->\n'
    '  <script>\n'
    '    (function(){\n'
    "      const s=localStorage.getItem('dc-theme');\n"
    "      const d=window.matchMedia('(prefers-color-scheme:dark)').matches;\n"
    "      if(s==='dark'||(s===null&&d)) document.documentElement.setAttribute('data-theme','dark');\n"
    '    })();\n'
    '  </script>\n'
)

TOPBAR_HTML = (
    '<!-- DC NAV: TOP BAR -->\n'
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
    '<!-- 🔍 سرچ (بیرون از blur) -->\n'
    '<div class="dc-global-filter-box" id="dcGlobalBox">\n'
    '  <button class="dc-close-results"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>\n'
    '  <h3 class="dc-global-filter-title">جستجوی سراسری دنت‌کست</h3>\n'
    '  <input id="dcSearch" class="dc-search-input" placeholder="جستجو در همهٔ بخش‌های دنت‌کست…">\n'
    '  <div class="dc-filter-list">\n'
    '    <button class="dc-filter-btn active" data-type="dentcast">دنت‌کست</button>\n'
    '    <button class="dc-filter-btn active" data-type="notecast">نوت‌کست</button>\n'
    '    <button class="dc-filter-btn active" data-type="clinical">نکات کلینیکی</button>\n'
    '    <button class="dc-filter-btn active" data-type="litecast">لایت‌کست</button>\n'
    '    <button class="dc-filter-btn active" data-type="photocast">فوتوکست</button>\n'
    '    <button class="dc-filter-btn active" data-type="dentcast_plus">ویدیوها</button>\n'
    '    <button class="dc-filter-btn active" data-type="dentai">مقالات</button>\n'
    '  </div>\n'
    '  <div class="dc-results-box" id="dcResults"></div>\n'
    '</div>\n'
)

THEME_TOGGLE_HTML = (
    '<!-- تم تاگل -->\n'
    '<button id="dc-theme-toggle" aria-label="تغییر تم"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M20.5 14.2A8.2 8.2 0 0 1 9.8 3.5 8.8 8.8 0 1 0 20.5 14.2z"/></svg></button>\n'
)

EXTERNAL_SCRIPTS_HTML = (
    '<!-- Theme toggle behavior moved to /dc-nav.js (single source) -->\n'
    '<script src="/global-search.js?v=5" defer></script>\n'
    '<script src="/global-search-ui.js?v=1" defer></script>\n'
    '<script src="/shake-search.js?v=1" defer></script>\n'
    '<script src="/dc-nav.js" defer></script>\n'
)

def render_seo_block(ep_count, hours, years):
    """SEO hidden block — 6 paragraphs of natural Persian prose anchored
    to the actual pillar+hashtag taxonomy of dentcast-brain.json. The
    paragraphs are hardcoded for editorial quality; only the count/years
    are templated. The taxonomy-drift guard in build() warns if the
    top-5 pillars stop matching what these paragraphs assume."""
    n  = fa_digits(ep_count)
    yr = fa_digits(years)
    hr = fa_digits(hours)

    paragraphs = [
        # P1 — what DentCast is
        "دنت‌کست پادکست تخصصی دندان‌پزشکی به زبان فارسی است که توسط دکتر فؤاد شهابیان، "
        "متخصص پروتزهای دندانی، تولید می‌شود. در حال حاضر " + n + " اپیزود و حدود "
        + hr + " ساعت محتوای علمی در طول " + yr + " سال فعالیت در دسترس قرار دارد. "
        "ساختار اپیزودها بر پایه‌ی مرور مقاله‌های مرجع و بررسی کانسپت‌های بالینی پروتز و "
        "ایمپلنت بنا شده است؛ نه برای سرگرمی، نه به قصد آموزش سطحی، بلکه برای روشن‌تر شدن "
        "منطق پشت تصمیم‌های کلینیکی روزانه.",

        # P2 — implantology cluster (largest pillar, 39 episodes)
        "بزرگ‌ترین خوشه‌ی محتوایی دنت‌کست به ایمپلنتولوژی اختصاص دارد. در این بخش، کانسپت‌های "
        "کلیدی مثل Zero Bone Loss و رویکرد Bio-Restorative پشت آن، انتخاب اباتمنت "
        "(Ti-base، Multi-unit، Healing Abutment)، پلنینگ سه‌بعدی ایمپلنت، Emergence Profile، "
        "مدیریت بافت نرم اطراف ایمپلنت و پروتکل‌های ایمپلنت فوری اپیزود به اپیزود از روی "
        "مقالات اصلی مرور شده‌اند. تمرکز روی همان نقطه‌ای است که جراحی و پروتز به هم می‌رسند: "
        "ایمپلنت به‌عنوان بخشی از یک سیستم بیولوژیک و پروتزی واحد، نه صرفاً یک فیکسچر داخل "
        "استخوان.",

        # P3 — bonding + ceramics + adhesive (32 + 27 episodes)
        "خوشه‌ی بعدی شامل دندان‌پزشکی ادهزیو، باندینگ و سرامیک‌هاست. اینجا از شیمی سطح مینا و "
        "عاج، انتخاب رزین سمنت و آماده‌سازی سطح سرامیک‌های مختلف بحث می‌شود؛ از لیتیوم دی‌سیلیکات "
        "و فلدسپاتیک تا زیرکونیا و انواع لمینیت. کانسپت‌هایی مثل IDS و DME، رویکرد بیومیمتیک "
        "در ترمیم، و پروتکل سمان رزینی روی سرامیک‌های سیلیکا-بیس و زیرکونیا با ارجاع مستقیم به "
        "منابع پایه دنبال شده‌اند.",

        # P4 — esthetic + occlusion + TMD (19 + 14 episodes + treatment planning)
        "خوشه‌ی زیبایی و خوشه‌ی اکلوژن دو مسیر مستقل اما به‌هم پیوسته‌اند. طراحی لبخند، "
        "اصلاح بُعد عمودی و انتخاب درمان زیبایی در کنار مرور کانسپت‌های کلاسیک اکلوژن از "
        "مراجعی مثل داوسون و اوکیسون، تشخیص گلوبال، رابطه‌ی اکلوژن با درمان‌های پروتزی پیچیده و "
        "مدیریت بیماران با اختلال مفصل گیجگاهی-فکی (TMD) در اپیزودهای متعدد دنبال می‌شود. "
        "اینجا منطق «از کجا تشخیص آغاز می‌شود» مهم‌تر از فهرست‌کردن علائم است.",

        # P5 — digital + fixed/removable pros + materials (smaller but distinct)
        "خوشه‌های کوچک‌تر اما متمایز شامل دندان‌پزشکی دیجیتال (اسکنر داخل دهانی، طراحی CAD-CAM، "
        "نقش هوش مصنوعی در پروتز)، پروتزهای ثابت و متحرک، اوردنچر، پست و کور و انتخاب مواد "
        "است. این بخش‌ها لزوماً پر-اپیزود نیستند ولی تصمیم‌های بالینی واقعی را پوشش می‌دهند و "
        "حلقه‌های میانی بین سایر خوشه‌ها را کامل می‌کنند.",

        # P6 — editorial stance
        "دنت‌کست در همه‌ی این حوزه‌ها روی یک رویکرد ثابت ایستاده: تکیه بر مقاله‌ی منبع، طرح "
        "صریح اختلاف‌نظرها، و پرهیز از قطعیتِ زودهنگام. هدف، نه ارائه‌ی «بهترین پروتکل»، "
        "بلکه روشن‌تر کردن منطق پشت تصمیم بالینی است.",
    ]

    body = "".join('      <p>' + esc(p) + '</p>\n' for p in paragraphs)
    return (
        '    <!-- ============================================================\n'
        '         SECTION 6 — SEO HIDDEN BLOCK\n'
        '         Anchored to live pillar/hashtag taxonomy in brain.json.\n'
        '         Top-5 pillars expected: ' + ", ".join(sorted(EXPECTED_TOP_PILLARS)) + '\n'
        '    ============================================================ -->\n'
        '    <div class="visually-hidden" aria-hidden="true">\n'
        '      <h2>حوزه‌های پوشش دنت‌کست</h2>\n'
        + body +
        '    </div>\n'
    )

FOOTER_HTML = (
    '    <!-- ============================================================\n'
    '         SECTION 7 — FOOTER  (LOCKED)\n'
    '    ============================================================ -->\n'
    '    <footer class="page-footer dc-site-footer">\n'
    '      <a href="/index.html" class="btn-home"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg> برگشت به صفحه‌ی اصلی</a>\n'
    '      <a href="/about.html" class="btn-about"><svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg> درباره‌ی دکتر فواد شهابیان</a>\n'
    '      <div class="footer-copy">© 2025 DentCast — طراحی و توسعه توسط <strong>فواد شهابیان</strong></div>\n'
    '    </footer>\n'
)

AD_CARD_HTML = (
    '    <!-- ============================================================\n'
    '         SECTION 2 — AD CARD (moved up; same content + mailto)\n'
    '    ============================================================ -->\n'
    '    <section class="section">\n'
    '      <article class="ad-card" id="card-ad-contact">\n'
    '        <a href="mailto:info@dentcast.ir?subject=درخواست معرفی برند در دنت‌کست" class="ad-link">\n'
    '          <div class="dc-card-main">\n'
    '            <div class="dc-card-title">\n'
    '              اینجا محل معرفی برند شما به جامعه دندانپزشکیست.\n'
    '            </div>\n'
    '          </div>\n'
    '          <strong class="ad-strong">تماس بگیرید</strong>\n'
    '        </a>\n'
    '      </article>\n'
    '    </section>\n'
)

LISTEN_SECTION_HTML = (
    '    <!-- ============================================================\n'
    '         SECTION 4 — LISTEN (دو پلیر تاشده، انتخاب کاربر)\n'
    '    ============================================================ -->\n'
    '    <section class="section dc-listen" aria-labelledby="listenTitle">\n'
    '      <div class="section-head">\n'
    '        <h2 class="section-title" id="listenTitle">گوش دادن آنلاین</h2>\n'
    '        <span class="section-note">دو مسیر موازی — مطابق وضعیت اینترنت‌تان انتخاب کنید</span>\n'
    '      </div>\n'
    '\n'
    '      <div class="player-grid">\n'
    '\n'
    '        <!-- پلیر داخلی (سرور ایران) — تاشده، با لیزی‌ماونت -->\n'
    '        <div class="player-cell">\n'
    '          <div class="pc-title">پلیر داخلی دنت‌کست</div>\n'
    '          <div class="pc-note">میزبانی روی سرور ایران؛ سریع‌ترین حالت برای شنوندگان داخل کشور.</div>\n'
    '          <button id="internalBtn" type="button" class="capsule-btn" aria-expanded="false" aria-controls="internalPlayerWrap">\n'
    '            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>\n'
    '            پخش با پلیر داخلی\n'
    '          </button>\n'
    '\n'
    '          <div id="internalPlayerWrap" class="player-wrap" hidden>\n'
    '            <button id="internalClose" class="player-close" type="button">\n'
    '              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>\n'
    '              بستن پلیر داخلی\n'
    '            </button>\n'
    '            <div id="internalFrameHolder" class="player-frame-holder internal"></div>\n'
    '          </div>\n'
    '        </div>\n'
    '\n'
    '        <!-- پلیر Acast — تاشده، با همان الگوی لیزی‌ماونت قبلی -->\n'
    '        <div class="player-cell">\n'
    '          <div class="pc-title">پلیر Acast</div>\n'
    '          <div class="pc-note">پلتفرم خارجی؛ گزینه‌ی پشتیبان در زمان محدودیت‌های شبکه‌ی ملی.</div>\n'
    '          <button id="acast-btn" type="button" class="capsule-btn" aria-expanded="false" aria-controls="acast-wrap">\n'
    '            <svg class="dc-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 14a9 9 0 0 1 18 0"/><path d="M5 14h3v7H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z"/><path d="M19 14h-3v7h3a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2z"/></svg>\n'
    '            پخش با پلیر Acast\n'
    '          </button>\n'
    '\n'
    '          <div id="acast-wrap" class="player-wrap" hidden>\n'
    '            <button id="acast-close" class="player-close" type="button">\n'
    '              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>\n'
    '              بستن پلیر Acast\n'
    '            </button>\n'
    '            <div id="acast-frame-holder" class="player-frame-holder acast"></div>\n'
    '          </div>\n'
    '        </div>\n'
    '\n'
    '      </div>\n'
    '    </section>\n'
)


# -------------------------------------------------------------------
# Inline CSS — token-driven; values reuse the locked CSS variables
# from index.html. Add the data-collapsed rule for the archive list.
# -------------------------------------------------------------------
INLINE_CSS = (
    '/* =====================================================\n'
    '   CSS VARIABLES — مطابق index.html  (LOCKED)\n'
    '===================================================== */\n'
    ':root{\n'
    '  --pr:#022360; --pr-rgb:2,35,96;\n'
    '  --ac:#0b5fff; --ac-rgb:11,95,255;\n'
    '\n'
    '  --bg:#f0f2f5;\n'
    '  --surface:#ffffff;\n'
    '  --surface2:#f4f6fb;\n'
    '  --surface3:#eaecf5;\n'
    '  --border:rgba(2,35,96,.10);\n'
    '  --border2:rgba(2,35,96,.06);\n'
    '\n'
    '  --txt:#0a1a33;\n'
    '  --txt2:#4a5f85;\n'
    '  --txt3:#8a9cbe;\n'
    '\n'
    '  --card-bg:#ffffff;\n'
    '  --card-border:rgba(2,35,96,.09);\n'
    '  --card-sh:0 1px 3px rgba(2,35,96,.07),0 4px 14px rgba(2,35,96,.04);\n'
    '  --card-sh2:0 4px 18px rgba(2,35,96,.13),0 1px 4px rgba(2,35,96,.07);\n'
    '\n'
    '  --chip-bg:rgba(11,95,255,.08);\n'
    '  --chip-bd:rgba(11,95,255,.20);\n'
    '  --chip-txt:#022360;\n'
    '\n'
    '  --tr:.17s cubic-bezier(.4,0,.2,1);\n'
    '  --tr2:.26s cubic-bezier(.4,0,.2,1);\n'
    '  --r-sm:10px; --r-md:14px; --r-lg:18px; --r-xl:22px; --r-f:999px;\n'
    '}\n'
    '\n'
    '[data-theme="dark"]{\n'
    '  --pr:#5b9cf6; --pr-rgb:91,156,246;\n'
    '  --ac:#5b9cf6; --ac-rgb:91,156,246;\n'
    '\n'
    '  --bg:#0e1621;\n'
    '  --surface:#17212b; --surface2:#1e2c3a; --surface3:#232e3c;\n'
    '  --border:rgba(255,255,255,.08); --border2:rgba(255,255,255,.04);\n'
    '\n'
    '  --txt:#e8f0ff; --txt2:#8aaac8; --txt3:#4a6a88;\n'
    '\n'
    '  --card-bg:#1e2c3a; --card-border:rgba(255,255,255,.07);\n'
    '  --card-sh:0 1px 3px rgba(0,0,0,.22),0 4px 14px rgba(0,0,0,.14);\n'
    '  --card-sh2:0 4px 18px rgba(0,0,0,.28);\n'
    '\n'
    '  --chip-bg:rgba(91,156,246,.12); --chip-bd:rgba(91,156,246,.24); --chip-txt:#8ab4f8;\n'
    '}\n'
    '\n'
    '/* RESET */\n'
    '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}\n'
    'html{height:100%;width:100%;}\n'
    'body{\n'
    '  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;\n'
    '  font-size:16px; line-height:1.5;\n'
    '  background:var(--bg); color:var(--txt);\n'
    '  min-height:100vh;\n'
    '  -webkit-font-smoothing:antialiased;\n'
    '  transition:background var(--tr2),color var(--tr2);\n'
    '}\n'
    'a{text-decoration:none;color:inherit;cursor:pointer;}\n'
    'button{font:inherit;color:inherit;background:none;border:none;outline:none;cursor:pointer;}\n'
    'ul,ol{list-style:none;}\n'
    '[hidden]{display:none!important;}\n'
    '\n'
    '.visually-hidden{\n'
    '  position:absolute;width:1px;height:1px;padding:0;\n'
    '  margin:-1px;overflow:hidden;clip:rect(0,0,0,0);\n'
    '  white-space:nowrap;border:0;\n'
    '}\n'
    '\n'
    'body.search-open #page-content{\n'
    '  filter:blur(8px);\n'
    '  pointer-events:none;\n'
    '  user-select:none;\n'
    '  transition:filter .25s ease;\n'
    '}\n'
    '#page-content{ transition:filter .25s ease; }\n'
    '\n'
    '.wrap{ max-width:760px; margin:0 auto; padding:18px 18px 96px; }\n'
    '@media (min-width:720px){ .wrap{ padding:32px 28px 120px; } }\n'
    '.section + .section{ margin-top:44px; }\n'
    '@media (min-width:720px){ .section + .section{ margin-top:64px; } }\n'
    '\n'
    '/* HERO */\n'
    '.dc-hero{ padding:36px 0 8px; text-align:start; }\n'
    '.dc-hero .eyebrow{\n'
    '  display:inline-block;\n'
    '  font-size:.72rem; letter-spacing:.6px; font-weight:700;\n'
    '  color:var(--ac);\n'
    '  padding:5px 12px;\n'
    '  background:var(--chip-bg);\n'
    '  border:1px solid var(--chip-bd);\n'
    '  border-radius:var(--r-f);\n'
    '  margin-bottom:18px;\n'
    '}\n'
    '.dc-hero h1{\n'
    '  font-size:1.85rem; font-weight:800; color:var(--txt);\n'
    '  letter-spacing:-.4px; line-height:1.4; margin-bottom:14px;\n'
    '}\n'
    '.dc-hero .hero-lede{\n'
    '  font-size:1rem; color:var(--txt2);\n'
    '  line-height:1.85; max-width:62ch; margin-bottom:22px;\n'
    '}\n'
    '@media (min-width:720px){\n'
    '  .dc-hero{ padding:48px 0 12px; }\n'
    '  .dc-hero h1{ font-size:2.25rem; line-height:1.35; }\n'
    '  .dc-hero .hero-lede{ font-size:1.05rem; }\n'
    '}\n'
    '\n'
    '.hero-stats{\n'
    '  display:flex; flex-wrap:wrap; gap:22px 32px;\n'
    '  padding:18px 0;\n'
    '  border-top:1px solid var(--border2);\n'
    '  border-bottom:1px solid var(--border2);\n'
    '  margin-bottom:24px;\n'
    '}\n'
    '.hero-stat{ display:flex; flex-direction:column; gap:3px; }\n'
    '.hero-stat .v{ font-size:1.05rem; font-weight:700; color:var(--txt); letter-spacing:-.2px; font-variant-numeric:tabular-nums; }\n'
    '.hero-stat .k{ font-size:.74rem; color:var(--txt3); letter-spacing:.3px; }\n'
    '\n'
    '/* FEATURED */\n'
    '.dc-featured .featured-label{\n'
    '  font-size:.74rem; letter-spacing:.6px; font-weight:700;\n'
    '  color:var(--txt3); margin-bottom:12px;\n'
    '  display:flex; align-items:center; gap:8px;\n'
    '}\n'
    '.dc-featured .featured-label::before{\n'
    '  content:""; width:18px; height:1px; background:var(--txt3);\n'
    '  display:inline-block;\n'
    '}\n'
    '.featured-card{\n'
    '  display:block; background:var(--card-bg);\n'
    '  border:1px solid var(--card-border);\n'
    '  border-radius:var(--r-xl);\n'
    '  padding:24px 22px;\n'
    '  box-shadow:var(--card-sh);\n'
    '  transition:transform var(--tr), box-shadow var(--tr2), border-color var(--tr);\n'
    '  position:relative; overflow:hidden;\n'
    '}\n'
    '.featured-card:hover{\n'
    '  transform:translateY(-1px);\n'
    '  box-shadow:var(--card-sh2);\n'
    '  border-color:rgba(var(--pr-rgb),.20);\n'
    '}\n'
    '@media (min-width:720px){ .featured-card{ padding:30px 30px; } }\n'
    '.featured-num{\n'
    '  display:inline-flex; align-items:baseline; gap:4px;\n'
    '  font-size:.78rem; color:var(--ac); font-weight:700;\n'
    '  letter-spacing:.2px; margin-bottom:12px;\n'
    '}\n'
    '.featured-num .hash{ color:var(--txt3); font-weight:500; }\n'
    '.featured-title{\n'
    '  font-size:1.25rem; font-weight:800; line-height:1.55;\n'
    '  color:var(--txt); letter-spacing:-.2px; margin-bottom:12px;\n'
    '}\n'
    '@media (min-width:720px){ .featured-title{ font-size:1.4rem; line-height:1.5; } }\n'
    '.featured-excerpt{\n'
    '  font-size:.93rem; color:var(--txt2); line-height:1.85; margin-bottom:18px;\n'
    '  display:-webkit-box;\n'
    '  -webkit-line-clamp:2;\n'
    '  -webkit-box-orient:vertical;\n'
    '  overflow:hidden;\n'
    '  text-overflow:ellipsis;\n'
    '  line-clamp:2;\n'
    '}\n'
    '.featured-meta{\n'
    '  display:flex; flex-wrap:wrap; align-items:center; gap:10px 14px;\n'
    '  font-size:.78rem; color:var(--txt3);\n'
    '  padding-top:14px; border-top:1px solid var(--border2);\n'
    '}\n'
    '.featured-meta .dot{ width:3px; height:3px; border-radius:50%; background:var(--txt3); opacity:.55; display:inline-block; }\n'
    '.featured-meta .more{\n'
    '  margin-inline-start:auto; color:var(--ac); font-weight:700; font-size:.82rem;\n'
    '  display:inline-flex; align-items:center; gap:4px;\n'
    '}\n'
    '.featured-meta .more svg{ width:.95em; height:.95em; transform:scaleX(-1); }\n'
    '\n'
    '/* LISTEN */\n'
    '.dc-listen .section-head{ display:flex; align-items:baseline; gap:10px; margin-bottom:14px; flex-wrap:wrap; }\n'
    '.section-title{ font-size:1.02rem; font-weight:700; color:var(--txt); letter-spacing:-.1px; }\n'
    '.section-note{ font-size:.78rem; color:var(--txt3); }\n'
    '\n'
    '.player-grid{ display:grid; grid-template-columns:1fr; gap:12px; }\n'
    '@media (min-width:640px){ .player-grid{ grid-template-columns:1fr 1fr; gap:14px; } }\n'
    '.player-cell{\n'
    '  background:var(--card-bg);\n'
    '  border:1px solid var(--card-border);\n'
    '  border-radius:var(--r-lg);\n'
    '  padding:18px 18px;\n'
    '  display:flex; flex-direction:column; gap:8px;\n'
    '  transition:border-color var(--tr), box-shadow var(--tr2);\n'
    '}\n'
    '.player-cell:hover{ border-color:rgba(var(--pr-rgb),.18); }\n'
    '.player-cell .pc-title{ font-size:.92rem; font-weight:700; color:var(--txt); }\n'
    '.player-cell .pc-note{ font-size:.78rem; color:var(--txt3); line-height:1.7; margin-bottom:6px; min-height:2.7em; }\n'
    '.player-cell .capsule-btn{ align-self:flex-start; margin-top:auto; }\n'
    '\n'
    '/* پلیر داخلی — پررنگ و برندی (قاب آبیِ پُر، دکمه‌ی فیلد، متن سفید) */\n'
    '.player-cell:has(#internalBtn){\n'
    '  background:var(--pr);\n'
    '  border:1px solid rgba(var(--ac-rgb),.55);\n'
    '  box-shadow:\n'
    '    0 8px 28px rgba(var(--pr-rgb),.22),\n'
    '    0 1px 4px rgba(var(--pr-rgb),.10);\n'
    '  padding:6px;\n'
    '}\n'
    '[data-theme="dark"] .player-cell:has(#internalBtn){\n'
    '  background:#0d1e3a;\n'
    '  border:1px solid rgba(var(--ac-rgb),.55);\n'
    '  box-shadow:\n'
    '    0 8px 30px rgba(0,0,0,.45),\n'
    '    0 1px 4px rgba(0,0,0,.30);\n'
    '}\n'
    '[data-theme="dark"] .player-cell:has(#internalBtn) .capsule-btn{\n'
    '  background:#1a4ec6; border:1px solid #1a4ec6;\n'
    '}\n'
    '.player-cell:has(#internalBtn) .pc-title{ color:#fff; }\n'
    '.player-cell:has(#internalBtn) .pc-note{ color:rgba(255,255,255,.72); }\n'
    '.player-cell:has(#internalBtn) .capsule-btn{\n'
    '  background:var(--ac); color:#fff; border:1px solid var(--ac);\n'
    '}\n'
    '.player-cell:has(#internalBtn) .capsule-btn:hover{ filter:brightness(1.06); transform:translateY(-1px); }\n'
    '.player-cell:has(#internalBtn) .capsule-btn:active{ transform:scale(.97); }\n'
    '\n'
    '/* پلیر Acast — تأکید آرام (همان درمانی که قبلاً روی پلیر داخلی بود) */\n'
    '.player-cell:not(:has(#internalBtn)){\n'
    '  background:rgba(var(--ac-rgb),.06);\n'
    '  border:1px solid rgba(var(--ac-rgb),.18);\n'
    '  box-shadow:var(--card-sh2);\n'
    '}\n'
    '[data-theme="dark"] .player-cell:not(:has(#internalBtn)){\n'
    '  background:rgba(var(--ac-rgb),.10);\n'
    '}\n'
    '\n'
    '.capsule-btn{\n'
    '  appearance:none; border:1.5px solid rgba(var(--pr-rgb),.25);\n'
    '  cursor:pointer; display:inline-flex; align-items:center; justify-content:center;\n'
    '  gap:7px; padding:10px 18px;\n'
    '  border-radius:var(--r-f);\n'
    '  font-family:inherit; font-weight:700; font-size:.85rem;\n'
    '  color:var(--pr); background:rgba(var(--pr-rgb),.06);\n'
    '  transition:background var(--tr), transform var(--tr), border-color var(--tr);\n'
    '}\n'
    '.capsule-btn:hover{ background:rgba(var(--pr-rgb),.11); transform:translateY(-1px); }\n'
    '.capsule-btn:active{ transform:scale(.97); }\n'
    '.capsule-btn svg{ width:1em; height:1em; }\n'
    '[data-theme="dark"] .capsule-btn{ color:#8ab4f8; border-color:rgba(91,156,246,.25); background:rgba(91,156,246,.08); }\n'
    '\n'
    '.player-wrap{\n'
    '  margin-top:12px; border-radius:var(--r-lg); overflow:hidden;\n'
    '  background:var(--card-bg); border:1px solid var(--card-border);\n'
    '  box-shadow:var(--card-sh);\n'
    '}\n'
    '.player-close{\n'
    '  display:block; width:100%; padding:9px 14px; text-align:center;\n'
    '  font-size:.78rem; font-weight:600; color:var(--txt3);\n'
    '  background:var(--surface2); border-bottom:1px solid var(--border);\n'
    '  cursor:pointer; transition:color var(--tr);\n'
    '}\n'
    '.player-close:hover{ color:var(--txt); }\n'
    '.player-close svg{ width:.9em; height:.9em; vertical-align:-.15em; margin-inline-start:3px; }\n'
    '.player-frame-holder iframe{ width:100%; max-width:100%; border:none; display:block; background:var(--surface2); }\n'
    '.player-frame-holder.internal iframe{ min-height:560px; height:560px; }\n'
    '.player-frame-holder.acast iframe{ height:380px; }\n'
    '\n'
    '/* ARCHIVE */\n'
    '.dc-archive .archive-head{\n'
    '  display:flex; align-items:baseline; justify-content:space-between;\n'
    '  gap:12px; margin-bottom:18px; flex-wrap:wrap;\n'
    '}\n'
    '.dc-archive .lhs{ display:flex; flex-direction:column; gap:3px; }\n'
    '.dc-archive .count{ font-size:.76rem; color:var(--txt3); font-variant-numeric:tabular-nums; }\n'
    '\n'
    '.episode-list{\n'
    '  display:flex; flex-direction:column;\n'
    '  border-top:1px solid var(--border2);\n'
    '}\n'
    '/* Crawlable but visually clipped: items past INITIAL_CHUNK hidden\n'
    '   only when data-collapsed is true. JS removes the attribute on click. */\n'
    '.episode-list[data-collapsed="true"] > li:nth-child(n+' + str(INITIAL_CHUNK + 1) + '){ display:none; }\n'
    '\n'
    '.episode-item{\n'
    '  display:flex; flex-direction:row;\n'
    '  align-items:flex-start; gap:14px;\n'
    '  padding:18px 4px;\n'
    '  border-bottom:1px solid var(--border2);\n'
    '  color:var(--txt);\n'
    '  transition:background var(--tr), padding var(--tr);\n'
    '  position:relative;\n'
    '}\n'
    '.episode-item:hover{ background:var(--surface2); padding-inline-start:10px; padding-inline-end:10px; }\n'
    '.episode-item:focus-visible{ outline:2px solid var(--ac); outline-offset:2px; border-radius:8px; }\n'
    '\n'
    '/* Logo thumbnail — same /logo-v2.png the topbar already cached.\n'
    '   Decorative (empty alt); explicit width/height attrs in HTML prevent\n'
    '   layout shift. Shrinks on narrow screens to keep the title row readable. */\n'
    '.episode-item .ep-logo{\n'
    '  flex-shrink:0;\n'
    '  width:44px; height:44px;\n'
    '  border-radius:10px;\n'
    '  border:1px solid var(--border);\n'
    '  object-fit:contain;\n'
    '  background:var(--surface);\n'
    '  display:block;\n'
    '}\n'
    '@media (max-width:480px){\n'
    '  .episode-item .ep-logo{ width:36px; height:36px; border-radius:9px; }\n'
    '}\n'
    '\n'
    '/* Text column — takes the remaining width; preserves the original\n'
    '   3-column grid (ep-num | body | chev) so caption and chips align\n'
    '   to the start of the text column, not under the logo. */\n'
    '.episode-item .ep-content{\n'
    '  flex:1 1 auto; min-width:0;\n'
    '  display:grid; grid-template-columns:42px 1fr auto;\n'
    '  align-items:start; gap:12px;\n'
    '}\n'
    '.episode-item .ep-num{\n'
    '  font-size:.95rem; font-weight:700; color:var(--txt3);\n'
    '  font-variant-numeric:tabular-nums; letter-spacing:-.2px;\n'
    '  text-align:start; white-space:nowrap;\n'
    '  padding-top:2px;\n'
    '}\n'
    '.episode-item:hover .ep-num{ color:var(--ac); }\n'
    '.episode-item .ep-body{ display:flex; flex-direction:column; gap:8px; min-width:0; }\n'
    '.episode-item .ep-title{\n'
    '  font-size:.97rem; font-weight:600; line-height:1.65; color:var(--txt);\n'
    '  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;\n'
    '}\n'
    '.episode-item .ep-meta{\n'
    '  font-size:.74rem; color:var(--txt3);\n'
    '  display:flex; align-items:center; gap:8px;\n'
    '  font-variant-numeric:tabular-nums;\n'
    '  margin-top:-2px;\n'
    '}\n'
    '.episode-item .ep-meta .dot{ width:2.5px; height:2.5px; border-radius:50%; background:var(--txt3); opacity:.55; display:inline-block; }\n'
    '\n'
    '/* Caption — subtle one-liner from brain.caption */\n'
    '.episode-item .ep-caption{\n'
    '  font-size:.82rem; color:var(--txt2);\n'
    '  line-height:1.7; margin:0;\n'
    '  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;\n'
    '}\n'
    '\n'
    '/* Hashtag chips — restrained, non-interactive */\n'
    '.episode-item .ep-tags{\n'
    '  display:flex; flex-wrap:wrap; gap:6px;\n'
    '  margin-top:2px;\n'
    '}\n'
    '.episode-item .ep-tag{\n'
    '  display:inline-flex; align-items:center;\n'
    '  font-size:.7rem; font-weight:600; line-height:1;\n'
    '  padding:4px 10px;\n'
    '  border-radius:var(--r-f);\n'
    '  background:var(--chip-bg);\n'
    '  color:var(--chip-txt);\n'
    '  border:1px solid var(--chip-bd);\n'
    '  white-space:nowrap;\n'
    '  transition:background var(--tr), color var(--tr), border-color var(--tr);\n'
    '}\n'
    '.episode-item:hover .ep-tag{\n'
    '  background:rgba(var(--ac-rgb),.10);\n'
    '  border-color:rgba(var(--ac-rgb),.25);\n'
    '}\n'
    '[data-theme="dark"] .episode-item .ep-tag{ color:#8ab4f8; }\n'
    '\n'
    '.episode-item .ep-chev{\n'
    '  color:var(--txt3); opacity:.7;\n'
    '  transition:opacity var(--tr), transform var(--tr), color var(--tr);\n'
    '  padding-top:2px;\n'
    '}\n'
    '.episode-item .ep-chev svg{ width:18px; height:18px; transform:scaleX(-1); }\n'
    '.episode-item:hover .ep-chev{ opacity:1; color:var(--ac); transform:translateX(-2px); }\n'
    '\n'
    '.show-more-wrap{ display:flex; justify-content:center; margin-top:24px; }\n'
    '.show-more{\n'
    '  padding:11px 26px; border-radius:var(--r-f);\n'
    '  border:1px solid var(--border); background:var(--surface);\n'
    '  color:var(--txt2); font-size:.85rem; font-weight:600;\n'
    '  transition:all var(--tr);\n'
    '}\n'
    '.show-more:hover{ color:var(--txt); border-color:rgba(var(--pr-rgb),.22); background:var(--surface2); }\n'
    '\n'
    '/* AD CARD */\n'
    '.ad-card{\n'
    '  background:var(--card-bg);\n'
    '  border:1px solid var(--card-border);\n'
    '  border-inline-end:3px solid rgba(245,162,8,.55);\n'
    '  border-radius:var(--r-lg);\n'
    '  box-shadow:var(--card-sh);\n'
    '  overflow:hidden;\n'
    '  transition:transform var(--tr), background var(--tr);\n'
    '}\n'
    '.ad-card:active{ transform:scale(.99); background:var(--surface2); }\n'
    '.ad-card .ad-link{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 18px; }\n'
    '.ad-card .dc-card-title{ font-weight:600; font-size:.88rem; color:var(--txt2); line-height:1.7; }\n'
    '.ad-card .ad-strong{\n'
    '  background:rgba(245,162,8,.10); color:#b07d00;\n'
    '  padding:6px 14px; border-radius:var(--r-f);\n'
    '  font-size:.72rem; font-weight:700;\n'
    '  border:1px solid rgba(245,162,8,.25); white-space:nowrap; flex-shrink:0;\n'
    '}\n'
    '[data-theme="dark"] .ad-card .dc-card-title{ color:var(--txt2); }\n'
    '[data-theme="dark"] .ad-card .ad-strong{ color:#c49820; background:rgba(245,162,8,.08); }\n'
    '\n'
    '/* FOOTER */\n'
    '.page-footer{\n'
    '  margin-top:48px; text-align:center;\n'
    '  display:flex; flex-direction:column; align-items:center; gap:10px; padding-bottom:20px;\n'
    '}\n'
    '.btn-home{\n'
    '  display:inline-flex; align-items:center; gap:6px;\n'
    '  background:var(--pr); color:#fff;\n'
    '  border-radius:var(--r-md); padding:12px 32px;\n'
    '  font-weight:800; font-size:.92rem;\n'
    '  box-shadow:0 4px 14px rgba(var(--pr-rgb),.28);\n'
    '  transition:all var(--tr); text-decoration:none;\n'
    '}\n'
    '.btn-home:active{ transform:scale(.97); box-shadow:0 2px 8px rgba(var(--pr-rgb),.20); }\n'
    '[data-theme="dark"] .btn-home{ background:#2b5278; box-shadow:0 4px 14px rgba(0,0,0,.28); }\n'
    '.btn-about{\n'
    '  display:inline-flex; align-items:center; gap:5px;\n'
    '  background:var(--surface2); color:var(--txt2);\n'
    '  border:1px solid var(--border); border-radius:var(--r-f);\n'
    '  padding:7px 18px; font-weight:600; font-size:.80rem;\n'
    '  text-decoration:none; transition:all var(--tr);\n'
    '}\n'
    '.btn-about:active{ background:var(--surface3); }\n'
    '.footer-copy{ font-size:.76rem; color:var(--txt3); margin-top:4px; }\n'
    '.footer-copy strong{ color:var(--ac); }\n'
    '[data-theme="dark"] .footer-copy strong{ color:#8ab4f8; }\n'
    '\n'
    '/* THEME TOGGLE */\n'
    '#dc-theme-toggle{\n'
    '  position:fixed; bottom:20px; left:14px; z-index:250;\n'
    '  width:42px; height:42px; border-radius:var(--r-f);\n'
    '  background:#17212b; color:#e8f0ff;\n'
    '  border:1px solid rgba(255,255,255,.12);\n'
    '  box-shadow:0 4px 16px rgba(0,0,0,.28);\n'
    '  display:flex; align-items:center; justify-content:center;\n'
    '  font-size:19px; cursor:pointer;\n'
    '  transition:all var(--tr);\n'
    '}\n'
    '#dc-theme-toggle:active{ transform:scale(.86); }\n'
)


# -------------------------------------------------------------------
# Inline JS — UI behavior only (player toggles + show more)
# -------------------------------------------------------------------
INLINE_BEHAVIOR_JS = (
    '(function(){\n'
    "  'use strict';\n"
    '\n'
    '  // ---------- Internal player (lazy mount /player.html) ----------\n'
    "  var iBtn   = document.getElementById('internalBtn');\n"
    "  var iWrap  = document.getElementById('internalPlayerWrap');\n"
    "  var iClose = document.getElementById('internalClose');\n"
    "  var iHold  = document.getElementById('internalFrameHolder');\n"
    '  var iFrame = null;\n'
    '\n'
    '  function mountInternal(){\n'
    '    if (iFrame) return;\n'
    "    iFrame = document.createElement('iframe');\n"
    "    iFrame.src = '/player.html?v=3';\n"
    "    iFrame.title = 'پلیر داخلی دنت‌کست';\n"
    "    iFrame.loading = 'lazy';\n"
    "    iFrame.allow = 'autoplay';\n"
    '    iHold.appendChild(iFrame);\n'
    '  }\n'
    '  function openInternal(scroll){\n'
    "    iBtn.style.display = 'none';\n"
    '    iWrap.hidden = false;\n'
    "    iBtn.setAttribute('aria-expanded', 'true');\n"
    '    mountInternal();\n'
    '    if (scroll){\n'
    "      setTimeout(function(){ iWrap.scrollIntoView({behavior:'smooth', block:'center'}); }, 30);\n"
    '    }\n'
    '  }\n'
    '  function closeInternal(){\n'
    '    iWrap.hidden = true;\n'
    "    iBtn.style.display = 'inline-flex';\n"
    "    iBtn.setAttribute('aria-expanded', 'false');\n"
    '    if (iFrame){ iFrame.remove(); iFrame = null; }\n'
    '  }\n'
    "  iBtn.addEventListener('click', function(){ openInternal(false); });\n"
    "  iClose.addEventListener('click', closeInternal);\n"
    '\n'
    '  // ---------- Acast player (lazy mount, same pattern) ----------\n'
    "  var aBtn   = document.getElementById('acast-btn');\n"
    "  var aWrap  = document.getElementById('acast-wrap');\n"
    "  var aClose = document.getElementById('acast-close');\n"
    "  var aHold  = document.getElementById('acast-frame-holder');\n"
    "  var ACAST_URL = 'https://embed.acast.com/624b5545ecc0e600134ea0df?theme=light&feed=true';\n"
    '  var aFrame = null;\n'
    "  aBtn.addEventListener('click', function(){\n"
    "    aBtn.style.display = 'none';\n"
    '    aWrap.hidden = false;\n'
    "    aBtn.setAttribute('aria-expanded', 'true');\n"
    '    if (!aFrame){\n'
    "      aFrame = document.createElement('iframe');\n"
    '      aFrame.src = ACAST_URL;\n'
    "      aFrame.width = '100%';\n"
    "      aFrame.height = '380';\n"
    "      aFrame.frameBorder = '0';\n"
    "      aFrame.loading = 'lazy';\n"
    "      aFrame.allow = 'autoplay; encrypted-media';\n"
    "      aFrame.style.border = '0';\n"
    "      aFrame.title = 'Acast Player';\n"
    '      aHold.appendChild(aFrame);\n'
    '    }\n'
    '  });\n'
    "  aClose.addEventListener('click', function(){\n"
    '    aWrap.hidden = true;\n'
    "    aBtn.style.display = 'inline-flex';\n"
    "    aBtn.setAttribute('aria-expanded', 'false');\n"
    '    if (aFrame){ aFrame.remove(); aFrame = null; }\n'
    '  });\n'
    '\n'
    '  // ---------- Show more (reveal hidden archive items) ----------\n'
    "  var list = document.getElementById('episodeList');\n"
    "  var more = document.getElementById('showMoreBtn');\n"
    "  var moreWrap = document.getElementById('showMoreWrap');\n"
    '  if (more && list){\n'
    "    more.addEventListener('click', function(){\n"
    "      list.removeAttribute('data-collapsed');\n"
    "      moreWrap.hidden = true;\n"
    '    });\n'
    '  }\n'
    '\n'
    '})();\n'
)


# -------------------------------------------------------------------
# Per-section render helpers
# -------------------------------------------------------------------
def render_hero(ep_count, hours, years):
    return (
        '    <!-- ============================================================\n'
        '         SECTION 1 — HERO\n'
        '    ============================================================ -->\n'
        '    <section class="section dc-hero" aria-labelledby="heroTitle">\n'
        '      <span class="eyebrow">دنت‌کست | پادکست تخصصی دندانپزشکی</span>\n'
        '      <h1 id="heroTitle">خوانش دقیق مقاله‌ها،<br>برای تصمیم‌های بالینی روشن‌تر.</h1>\n'
        '      <p class="hero-lede">\n'
        '        دنت‌کست جایی‌ست برای مرور آرام و مستندِ پروتکل‌های کلینیکی، خواندن مقاله‌های مرجع و گفت‌وگو درباره‌ی مفاهیمی که در کارِ روزانه‌ی پروتز، ایمپلنت، اکلوژن و دندانپزشکی ادهزیو به آن‌ها برمی‌خوریم. بدون شعار، بدون قطعیتِ زودهنگام.\n'
        '      </p>\n'
        '\n'
        '      <div class="hero-stats" role="list" aria-label="آمار پادکست">\n'
        '        <div class="hero-stat" role="listitem">\n'
        '          <span class="v">' + fa_digits(ep_count) + '</span>\n'
        '          <span class="k">اپیزود</span>\n'
        '        </div>\n'
        '        <div class="hero-stat" role="listitem">\n'
        '          <span class="v">' + fa_digits(hours) + '</span>\n'
        '          <span class="k">ساعت محتوا</span>\n'
        '        </div>\n'
        '        <div class="hero-stat" role="listitem">\n'
        '          <span class="v">' + fa_digits(years) + '</span>\n'
        '          <span class="k">سال فعالیت</span>\n'
        '        </div>\n'
        '      </div>\n'
        '    </section>\n'
    )


def render_featured(ep):
    title = clean_title(ep.get("title", ""))
    desc  = excerpt(strip_html(ep.get("description", "")), 170)
    date  = format_jalali_date(ep.get("published", ""))
    num   = fa_digits(ep.get("episode", ""))
    href  = ep.get("page_url") or "#"
    dur   = ep.get("duration") or ""

    return (
        '    <!-- ============================================================\n'
        '         SECTION 3 — FEATURED / LATEST EPISODE  (static)\n'
        '    ============================================================ -->\n'
        '    <section class="section dc-featured" aria-labelledby="featuredLabel">\n'
        '      <div class="featured-label" id="featuredLabel">آخرین اپیزود</div>\n'
        '      <a class="featured-card" href="' + esc(href) + '" aria-label="' + esc("آخرین اپیزود: " + title) + '">\n'
        '        <div class="featured-num"><span class="hash">اپیزود</span> ' + num + '</div>\n'
        '        <div class="featured-title">' + esc(title) + '</div>\n'
        '        <p class="featured-excerpt">' + esc(desc) + '</p>\n'
        '        <div class="featured-meta">\n'
        '          <span>' + esc(dur) + '</span>\n'
        '          <span class="dot"></span>\n'
        '          <span>' + esc(date) + '</span>\n'
        '          <span class="more">ادامه\n'
        '            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>\n'
        '          </span>\n'
        '        </div>\n'
        '      </a>\n'
        '    </section>\n'
    )


def render_episode_li(ep, brain_entry):
    num   = fa_digits(ep.get("episode", ""))
    title = clean_title(ep.get("title", ""))
    href  = ep.get("page_url") or "#"
    dur   = ep.get("duration") or ""
    date  = format_jalali_date(ep.get("published", ""))
    aria  = "اپیزود " + num + ": " + title

    # Caption — optional. Trim and skip placeholders.
    caption_raw = ""
    if brain_entry:
        caption_raw = (brain_entry.get("caption") or "").strip()
    caption_html = ""
    if caption_raw:
        caption_html = (
            '                <p class="ep-caption">' + esc(caption_raw) + '</p>\n'
        )

    # Hashtags — first MAX_TAGS_PER_ITEM only, preserve order, keep "#".
    tags_html = ""
    if brain_entry:
        tags = brain_entry.get("hashtags") or []
        tags = [t for t in tags if isinstance(t, str) and t.strip()]
        tags = tags[:MAX_TAGS_PER_ITEM]
        if tags:
            chips = "".join(
                '                  <span class="ep-tag">' + esc(t) + '</span>\n'
                for t in tags
            )
            tags_html = (
                '                <div class="ep-tags" aria-hidden="true">\n'
                + chips +
                '                </div>\n'
            )

    # Logo thumbnail — re-uses the topbar's /logo-v2.png (already cached
    # by the time the archive renders). Decorative; empty alt is correct.
    # Explicit width/height attrs prevent layout shift even though the
    # image is in the browser's memory cache after the first request.
    return (
        '        <li>\n'
        '          <a class="episode-item" href="' + esc(href) + '" aria-label="' + esc(aria) + '">\n'
        '            <img class="ep-logo" src="/logo-v2.png" alt="" width="44" height="44" loading="lazy" decoding="async">\n'
        '            <div class="ep-content">\n'
        '              <span class="ep-num">' + num + '</span>\n'
        '              <div class="ep-body">\n'
        '                <div class="ep-title">' + esc(title) + '</div>\n'
        '                <div class="ep-meta">\n'
        '                  <span>' + esc(dur) + '</span>\n'
        '                  <span class="dot"></span>\n'
        '                  <span>' + esc(date) + '</span>\n'
        '                </div>\n'
        + caption_html
        + tags_html +
        '              </div>\n'
        '              <span class="ep-chev" aria-hidden="true">\n'
        '                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>\n'
        '              </span>\n'
        '            </div>\n'
        '          </a>\n'
        '        </li>\n'
    )


def render_archive(episodes_sorted, brain_by_ep):
    items_html = "".join(
        render_episode_li(e, brain_by_ep.get(str(e.get("episode")))) for e in episodes_sorted
    )
    total = len(episodes_sorted)
    hidden = max(0, total - INITIAL_CHUNK)

    collapsed_attr = ' data-collapsed="true"' if total > INITIAL_CHUNK else ''
    more_block = ''
    if total > INITIAL_CHUNK:
        more_block = (
            '      <div class="show-more-wrap" id="showMoreWrap">\n'
            '        <button id="showMoreBtn" class="show-more" type="button">'
            'نمایش بیشتر (' + fa_digits(hidden) + ' مورد دیگر)'
            '</button>\n'
            '      </div>\n'
        )

    return (
        '    <!-- ============================================================\n'
        '         SECTION 5 — ARCHIVE (همهٔ اپیزودها، static)\n'
        '    ============================================================ -->\n'
        '    <section class="section dc-archive" aria-labelledby="archiveTitle">\n'
        '      <div class="archive-head">\n'
        '        <div class="lhs">\n'
        '          <h2 class="section-title" id="archiveTitle">آرشیو اپیزودها</h2>\n'
        '          <span class="count">' + fa_digits(total) + ' اپیزود</span>\n'
        '        </div>\n'
        '      </div>\n'
        '\n'
        '      <ol class="episode-list" id="episodeList"' + collapsed_attr + '>\n'
        + items_html +
        '      </ol>\n'
        + more_block +
        '    </section>\n'
    )


def build_jsonld_blocks(ep_count):
    """Generate the three JSON-LD blocks. PodcastSeries description is
    updated to reflect the live episode count. The other two remain
    structurally identical to the locked v1 page."""
    count_fa = fa_digits(ep_count)
    podcast_desc = (
        "مرجع آنلاین و پادکست تخصصی پروتکل‌های کلینیکی پروتز و ایمپلنت. "
        "شامل بیش از " + count_fa + " اپیزود آموزشی در حوزه‌های Zero Bone Loss، "
        "مدیریت TMD و دندانپزشکی دیجیتال."
    )

    podcast_series = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "PodcastSeries",
                "@id": "https://dentcast.org/#podcast",
                "name": "دنت‌کست | DentCast",
                "description": podcast_desc,
                "url": "https://dentcast.org/episodes.html",
                "image": "https://dentcast.org/logo-v2.png",
                "inLanguage": "fa",
                "author": {"@id": "https://dentcast.org/about.html#person-fouad-shahabian"},
                "publisher": {"@id": "https://dentcast.org/#org-dentcast"},
            }
        ],
    }

    collection_page = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": "https://dentcast.org/episodes.html#collectionpage",
        "url": "https://dentcast.org/episodes.html",
        "name": "همهٔ اپیزودهای دنت‌کست",
        "description": "آرشیو کامل اپیزودهای پادکست تخصصی دنت‌کست در حوزه پروتز، ایمپلنت و دندان‌پزشکی ترمیمی مبتنی بر شواهد.",
        "inLanguage": "fa",
        "isPartOf": {"@id": "https://dentcast.org/#website"},
        "about": {"@id": "https://dentcast.org/#podcast"},
        "author": {"@id": "https://dentcast.org/about.html#person-fouad-shahabian"},
        "image": {
            "@type": "ImageObject",
            "url": "https://dentcast.org/dentcast-cover.webp",
            "width": 1200,
            "height": 630,
        },
    }

    breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "دنت‌کست", "item": "https://dentcast.org/"},
            {"@type": "ListItem", "position": 2, "name": "اپیزودها", "item": "https://dentcast.org/episodes.html"},
        ],
    }

    def dump(d):
        return json.dumps(d, ensure_ascii=False, indent=2)

    return (
        '  <script type="application/ld+json">\n' + dump(podcast_series) + '\n</script>\n'
        '\n'
        '  <script type="application/ld+json">\n' + dump(collection_page) + '\n  </script>\n'
        '\n'
        '  <script type="application/ld+json">\n' + dump(breadcrumb) + '\n  </script>\n'
    )


def build_head(ep_count):
    count_fa = fa_digits(ep_count)
    meta_desc = (
        "آرشیو کامل " + count_fa + " اپیزود پادکست تخصصی دنت‌کست: مرور پروتکل‌های "
        "کلینیکی پروتز، ایمپلنت (Zero Bone Loss، ITI)، باندینگ سرامیک، TMD، "
        "دندانپزشکی دیجیتال و اباتمنتهای پیشرفته. توسط دکتر فؤاد شهابیان."
    )
    title_str = "همهٔ اپیزودهای دنت‌کست | DentCast Episodes"

    return (
        '<!DOCTYPE html>\n'
        '<html lang="fa" dir="rtl">\n'
        '<head>\n'
        '  <meta charset="UTF-8">\n'
        '  <!-- Auto-generated by tools/build_episodes.py — do not edit by hand. Run the script to regenerate. -->\n'
        '  <title>' + esc(title_str) + '</title>\n'
        '  <meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '  <meta name="description" content="' + esc(meta_desc) + '">\n'
        '  <meta name="author" content="دکتر فؤاد شهابیان">\n'
        '  <link rel="canonical" href="https://dentcast.org/episodes.html">\n'
        '  <link rel="alternate" hreflang="fa-IR" href="https://dentcast.ir/episodes.html">\n'
        '  <link rel="alternate" hreflang="fa" href="https://dentcast.org/episodes.html">\n'
        '  <link rel="alternate" hreflang="x-default" href="https://dentcast.org/episodes.html">\n'
        '  <link rel="stylesheet" href="/global-search.css?v=1">\n'
        '  <link rel="icon" href="/logo-v2.png" type="image/png" sizes="512x512">\n'
        '  <meta name="theme-color" content="#F3F5F7">\n'
        '\n'
        + THEME_INIT_SCRIPT +
        '\n'
        '  <style>\n'
        + INLINE_CSS +
        '  </style>\n'
        '\n'
        + build_jsonld_blocks(ep_count) +
        '\n'
        '    <link rel="stylesheet" href="/dc-theme.css">\n'
        '<link rel="stylesheet" href="/dc-nav.css">\n'
        '  <meta property="og:type" content="website">\n'
        '  <meta property="og:locale" content="fa_IR">\n'
        '  <meta property="og:site_name" content="DentCast">\n'
        '  <meta property="og:title" content="' + esc(title_str) + '">\n'
        '  <meta property="og:description" content="' + esc(meta_desc) + '">\n'
        '  <meta property="og:url" content="https://dentcast.org/episodes.html">\n'
        '  <meta property="og:image" content="https://dentcast.org/dentcast-cover.webp">\n'
        '  <meta property="og:image:width" content="1200">\n'
        '  <meta property="og:image:height" content="630">\n'
        '  <meta name="twitter:card" content="summary_large_image">\n'
        '  <meta name="twitter:title" content="' + esc(title_str) + '">\n'
        '  <meta name="twitter:description" content="' + esc(meta_desc) + '">\n'
        '  <meta name="twitter:image" content="https://dentcast.org/dentcast-cover.webp">\n'
        '  <meta name="robots" content="index, follow, max-image-preview:large">\n'
        '</head>\n'
    )


def build_body(ep_count, hours, years, featured_ep, episodes_sorted, brain_by_ep):
    return (
        '<body>\n'
        + TOPBAR_HTML
        + TOOLBAR_DRAWER_HTML
        + RADAR_OVERLAY_HTML
        + '\n\n'
        + GLOBAL_SEARCH_HTML
        + '\n'
        '<!-- محتوای اصلی صفحه -->\n'
        '<main id="page-content" aria-label="صفحهٔ اصلی اپیزودهای دنت‌کست">\n'
        '  <div class="wrap">\n'
        '\n'
        + render_hero(ep_count, hours, years) +
        '\n'
        + AD_CARD_HTML +
        '\n'
        + render_featured(featured_ep) +
        '\n'
        + LISTEN_SECTION_HTML +
        '\n'
        + render_archive(episodes_sorted, brain_by_ep) +
        '\n'
        + render_seo_block(ep_count, hours, years) +
        '\n'
        + FOOTER_HTML +
        '\n'
        '  </div>\n'
        '</main>\n'
        '\n'
        + THEME_TOGGLE_HTML +
        '\n'
        '<!-- UI behavior — player toggles + show more -->\n'
        '<script>\n'
        + INLINE_BEHAVIOR_JS +
        '</script>\n'
        '\n'
        + EXTERNAL_SCRIPTS_HTML +
        '</body>\n'
        '</html>\n'
    )


# -------------------------------------------------------------------
# Main entry
# -------------------------------------------------------------------
def build():
    if not JSON_PATH.exists():
        raise SystemExit("Source not found: " + str(JSON_PATH))
    if not BRAIN_PATH.exists():
        raise SystemExit("Source not found: " + str(BRAIN_PATH))

    episodes = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    if not isinstance(episodes, list) or not episodes:
        raise SystemExit("dentcast.json is empty or malformed.")

    brain_by_ep = load_brain(BRAIN_PATH)

    # Sort descending by parseFloat(episode); this is the single,
    # authoritative order baked into the page.
    episodes_sorted = sorted(
        episodes,
        key=lambda e: parse_episode_num(e.get("episode")),
        reverse=True,
    )
    featured = episodes_sorted[0]

    # Stats
    ep_count = len(episodes_sorted)
    total_sec = sum(duration_to_seconds(e.get("duration", "")) for e in episodes_sorted)
    hours = math.ceil(total_sec / 3600)
    today = datetime.date.today()
    days_active = max(0, (today - PROJECT_START).days)
    years = math.ceil(days_active / 365.25)

    head = build_head(ep_count)
    body = build_body(ep_count, hours, years, featured, episodes_sorted, brain_by_ep)
    page = head + body

    OUT_PATH.write_text(page, encoding="utf-8", newline="\n")

    # Brain coverage + taxonomy guard
    matched = sum(1 for e in episodes_sorted if str(e.get("episode")) in brain_by_ep)
    missing = ep_count - matched

    counts = pillar_counts(brain_by_ep)
    top5 = {name for name, _ in counts.most_common(5)}

    print(
        "Built episodes.html — "
        + fa_digits(ep_count) + " اپیزود، "
        + fa_digits(hours) + " ساعت، "
        + fa_digits(years) + " سال."
    )
    print(
        "Brain join: " + fa_digits(matched) + "/" + fa_digits(ep_count)
        + " episodes matched"
        + (" (" + fa_digits(missing) + " without brain entry)" if missing else "")
        + "."
    )
    if top5 != EXPECTED_TOP_PILLARS:
        added   = top5 - EXPECTED_TOP_PILLARS
        dropped = EXPECTED_TOP_PILLARS - top5
        print(
            "WARNING: top-5 pillars drifted — SEO prose may be stale.\n"
            "  expected: " + ", ".join(sorted(EXPECTED_TOP_PILLARS)) + "\n"
            "  current:  " + ", ".join(sorted(top5))
            + (("\n  added: " + ", ".join(sorted(added))) if added else "")
            + (("\n  dropped: " + ", ".join(sorted(dropped))) if dropped else "")
        )


if __name__ == "__main__":
    build()
