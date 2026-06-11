#!/usr/bin/env python3
"""Update the homepage's brain-derived statics in index.html.

1. The three stats counters — replaces only the number between each
   COUNTER:<name>:START/END marker pair. Persian digits only.
2. The hero card's static fallback (badge episode number, title, audio
   data-src) — from the newest brain entry carrying audio_url.
3. The «تازه‌های دنت‌کست» rail's static fallback cards — each data-cat
   card gets its category's newest entry (title + href). The homepage JS
   does the same at runtime; this keeps the no-JS/SEO text fresh too.

A url-less newest entry leaves its card untouched (never regress to an
older item). Standard library only.
"""

import json
import math
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
EPISODES_JSON = ROOT / "dentcast.json"
BRAIN_JSON = ROOT / "dentcast-brain.json"
GLOSSARY_JSON = ROOT / "glossary" / "glossary.json"
LITE_GLOSSARY_JSON = ROOT / "litecast" / "lite-glossary.json"

ACTIVITY_START = date(2019, 9, 1)  # September 2019 / شهریور ۱۳۹۸

FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹"


def to_fa(n):
    """Convert an integer (or its string form) to Persian digits."""
    return str(n).translate(str.maketrans("0123456789", FA_DIGITS))


def fa_to_int(s):
    """Parse a Persian (or Latin) digit string back to an int."""
    latin = s.translate(str.maketrans(FA_DIGITS, "0123456789"))
    digits = re.sub(r"[^0-9]", "", latin)
    return int(digits) if digits else 0


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


def compute_years(today=None):
    today = today or date.today()
    return (today - ACTIVITY_START).days / 365.25


def compute_hours():
    episodes = json.loads(EPISODES_JSON.read_text(encoding="utf-8"))
    total_seconds = 0
    for ep in episodes:
        parts = [int(p) for p in str(ep["duration"]).split(":")]
        if len(parts) == 3:
            h, m, s = parts
        elif len(parts) == 2:
            h, m, s = 0, parts[0], parts[1]
        else:
            h, m, s = 0, 0, 0
        total_seconds += h * 3600 + m * 60 + s
    return total_seconds / 3600


def compute_content():
    """Total online content = brain entries + full glossary + lite glossary.
    Returns (total, brain_count, glossary_count, lite_count)."""
    brain_count = len(json.loads(BRAIN_JSON.read_text(encoding="utf-8")))
    glossary_count = len(json.loads(GLOSSARY_JSON.read_text(encoding="utf-8"))["glossary"])
    lite_count = len(json.loads(LITE_GLOSSARY_JSON.read_text(encoding="utf-8"))["LightGlossary"])
    return brain_count + glossary_count + lite_count, brain_count, glossary_count, lite_count


RAIL_CATS = (
    "clinical", "notecast", "meta", "chairside",
    "dentai", "promptologist", "sharehub", "dentcast_plus",
)


def esc_html(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def latest_brain_state():
    """(latest-per-category dict, newest episode entry with audio)."""
    brain = json.loads(BRAIN_JSON.read_text(encoding="utf-8"))
    latest, episode = {}, None
    for e in brain:
        if not isinstance(e, dict):
            continue
        ty = e.get("type") or ""
        url = (e.get("page_url") or e.get("url") or "").strip()
        title = (e.get("title") or "").strip()
        if ty in RAIL_CATS:
            # the LAST entry of a category is its newest, even when url-less
            latest[ty] = {"title": title, "url": url}
        if e.get("audio_url") and url and title:
            episode = e
    return latest, episode


def refresh_hero(html, episode):
    """Hero fallback: badge number, title, audio src. Returns (html, note)."""
    if not episode:
        return html, "hero: no episode with audio_url (skipped)"
    title = esc_html((episode.get("title") or "").strip())
    num = to_fa(episode.get("episode") or "")
    src = esc_html((episode.get("audio_url") or "").strip())
    html = re.sub(
        r'(<h2 class="dc-home-hero-title">).*?(</h2>)',
        lambda m: m.group(1) + title + m.group(2), html, count=1, flags=re.S)
    if num:
        html = re.sub(
            r'(<span class="dc-home-hero-badge">.*?</svg>)[^<]*(</span>)',
            lambda m: m.group(1) + " قسمت " + num + " · تازه\u200cترین" + m.group(2),
            html, count=1, flags=re.S)
    if src:
        html = re.sub(
            r'(id="dcHeroPlay"[^>]*data-src=")[^"]*(")',
            lambda m: m.group(1) + src + m.group(2), html, count=1)
    return html, "hero: episode " + (episode.get("episode") or "?")


def refresh_rail(html, latest):
    """Rail fallbacks: per-category title + href. Returns (html, notes)."""
    notes = []
    for cat in RAIL_CATS:
        it = latest.get(cat) or {}
        title, url = it.get("title") or "", it.get("url") or ""
        if not (title and url):
            notes.append(cat + ": kept (newest entry url-less)")
            continue
        pat = re.compile(
            r'(<a class="dc-rail-card" data-cat="' + cat + r'" href=")[^"]*('
            r'"[^>]*>.*?<p class="dc-rail-title">).*?(</p>)', re.S)
        new_html, n = pat.subn(
            lambda m: m.group(1) + esc_html(url) + m.group(2) + esc_html(title) + m.group(3),
            html, count=1)
        if n:
            html = new_html
            notes.append(cat + ": " + url)
        else:
            notes.append(cat + ": card not found (skipped)")
    return html, notes


def replace_marker(html, name, new_fa):
    """Replace the text between COUNTER:<name>:START/END markers. Returns
    (new_html, old_fa)."""
    pattern = re.compile(
        r"(<!-- COUNTER:%s:START -->)(.*?)(<!-- COUNTER:%s:END -->)"
        % (re.escape(name), re.escape(name)),
        re.DOTALL,
    )
    match = pattern.search(html)
    if not match:
        raise SystemExit(f"marker COUNTER:{name} not found in {INDEX.name}")
    old = match.group(2)
    new_html = pattern.sub(lambda m: m.group(1) + new_fa + m.group(3), html, count=1)
    return new_html, old


def main():
    html = INDEX.read_text(encoding="utf-8")

    content_total, brain_count, glossary_count, lite_count = compute_content()
    values = {
        "YEARS": persian_half(compute_years()),
        "HOURS": persian_half(compute_hours()),
        "CONTENT": to_fa(content_total),
    }

    changes = []
    for name, new_fa in values.items():
        html, old_fa = replace_marker(html, name, new_fa)
        changes.append(f"{name}: {old_fa or '∅'} → {new_fa}")

    latest, episode = latest_brain_state()
    html, hero_note = refresh_hero(html, episode)
    html, rail_notes = refresh_rail(html, latest)

    INDEX.write_text(html, encoding="utf-8")
    print("Updated homepage counters — " + ", ".join(changes))
    print("  " + hero_note)
    for n in rail_notes:
        print("  rail " + n)
    print(
        f"  CONTENT breakdown: brain={brain_count} + glossary={glossary_count}"
        f" + lite={lite_count} = {content_total}"
    )


if __name__ == "__main__":
    main()
