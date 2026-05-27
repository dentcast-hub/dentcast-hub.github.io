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


def compute_years(today=None):
    today = today or date.today()
    return round((today - ACTIVITY_START).days / 365.25)


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
    return math.floor(total_seconds / 3600)


def compute_content():
    return len(json.loads(BRAIN_JSON.read_text(encoding="utf-8")))


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

    values = {
        "YEARS": compute_years(),
        "HOURS": compute_hours(),
        "CONTENT": compute_content(),
    }

    changes = []
    for name, value in values.items():
        new_fa = to_fa(value)
        html, old_fa = replace_marker(html, name, new_fa)
        changes.append(f"{name}: {old_fa or '∅'} → {new_fa}")

    INDEX.write_text(html, encoding="utf-8")
    print("Updated homepage counters — " + ", ".join(changes))


if __name__ == "__main__":
    main()
