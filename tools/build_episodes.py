#!/usr/bin/env python3
"""
build_episodes.py — DentCast Episodes Hub Builder
=================================================
Generates the fully static episodes.html landing page. The page CHROME
(head, CSS, nav, archive toolbar/sort/pagination, jump button, JS, footer)
lives verbatim in tools/episodes_template.html; this script injects only
the dynamic bits: the episode <li> list (newest-first, every episode a
real <a href> so Google crawls them) and the three stats. This split is
deliberate — the template is the single place to change page chrome, and
keeping it verbatim guarantees the builder reproduces the hand-maintained
page exactly instead of drifting from it.

Template markers filled at build time:
    @@EPISODE_LIST@@  -> the rendered <li> list (from dentcast.json + brain)
    @@EP_COUNT@@      -> episode count   (hero, meta/OG/Twitter, JSON-LD, archive, SEO)
    @@HOURS@@         -> total hours     (hero, SEO)
    @@YEARS@@         -> years active    (hero, SEO)

To change page chrome (CSS/JS/layout), edit the TEMPLATE, then run this
script. Do NOT hand-edit episodes.html — it is overwritten in place.

Run from the project root:
    python tools/build_episodes.py

Output:
    episodes.html  (overwritten in place)

Sources read (never modified):
    dentcast.json, dentcast-brain.json, tools/episodes_template.html

Deterministic for a given calendar day (only @@YEARS@@ is date-derived).
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
# The page shell (head, CSS, nav, archive chrome, JS, footer) lives in a
# verbatim template so the builder reproduces the hand-maintained page
# exactly. Only the dynamic bits are injected: the episode <li> list
# (@@EPISODE_LIST@@) and the three stats (@@EP_COUNT@@/@@HOURS@@/@@YEARS@@).
# To change page chrome, edit the TEMPLATE, not this script.
TEMPLATE_PATH = ROOT / "tools" / "episodes_template.html"

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


def round_to_half(value):
    """Round to the nearest 0.5 with half-up tie-breaking."""
    return math.floor(value * 2 + 0.5) / 2


def persian_half(value):
    """Format a round-to-half value as a Persian-digit string. Whole values
    render without a decimal (۷۰); halves use U+066B ARABIC DECIMAL SEPARATOR
    (۶۹٫۵)."""
    rounded = round_to_half(value)
    whole = int(rounded)
    s = str(whole) if rounded == whole else str(whole) + ".5"
    return s.translate(str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")).replace(".", "٫")


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
# Episode <li> renderer — the ONLY chunk this script generates. All
# page chrome (head, CSS, nav, archive toolbar, JS, footer) lives in
# tools/episodes_template.html and is injected verbatim by build().
# -------------------------------------------------------------------
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


# -------------------------------------------------------------------
# Main entry
# -------------------------------------------------------------------
def build():
    if not JSON_PATH.exists():
        raise SystemExit("Source not found: " + str(JSON_PATH))
    if not BRAIN_PATH.exists():
        raise SystemExit("Source not found: " + str(BRAIN_PATH))
    if not TEMPLATE_PATH.exists():
        raise SystemExit("Template not found: " + str(TEMPLATE_PATH))

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

    # Stats
    ep_count = len(episodes_sorted)
    total_sec = sum(duration_to_seconds(e.get("duration", "")) for e in episodes_sorted)
    hours = persian_half(total_sec / 3600)
    today = datetime.date.today()
    days_active = max(0, (today - PROJECT_START).days)
    years = persian_half(days_active / 365.25)

    # Render the episode <li> list (newest-first) and inject it, plus the
    # three stats, into the verbatim page template.
    items_html = "".join(
        render_episode_li(e, brain_by_ep.get(str(e.get("episode"))))
        for e in episodes_sorted
    )
    page = TEMPLATE_PATH.read_text(encoding="utf-8")
    page = (
        page.replace("@@EPISODE_LIST@@", items_html)
            .replace("@@EP_COUNT@@", fa_digits(ep_count))
            .replace("@@HOURS@@", hours)
            .replace("@@YEARS@@", years)
    )
    if "@@" in page:
        raise SystemExit("Unsubstituted @@MARKER@@ left in output — template/builder out of sync.")

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
            "WARNING: top-5 pillars drifted - SEO prose may be stale.\n"
            "  expected: " + ", ".join(sorted(EXPECTED_TOP_PILLARS)) + "\n"
            "  current:  " + ", ".join(sorted(top5))
            + (("\n  added: " + ", ".join(sorted(added))) if added else "")
            + (("\n  dropped: " + ", ".join(sorted(dropped))) if dropped else "")
        )


if __name__ == "__main__":
    build()
