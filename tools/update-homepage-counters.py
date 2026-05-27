#!/usr/bin/env python3
"""Update the three homepage stats counters in index.html.

Reads the sources of truth, computes each counter, and replaces only the
number between its HTML comment markers in index.html. Persian digits only.
Standard library only.
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

    INDEX.write_text(html, encoding="utf-8")
    print("Updated homepage counters — " + ", ".join(changes))
    print(
        f"  CONTENT breakdown: brain={brain_count} + glossary={glossary_count}"
        f" + lite={lite_count} = {content_total}"
    )


if __name__ == "__main__":
    main()
