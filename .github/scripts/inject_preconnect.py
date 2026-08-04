#!/usr/bin/env python3
"""
DentCast API preconnect injector.

Puts a <link rel="preconnect"> for both API hosts at the top of every page's
<head>, so the browser opens the DNS + TCP + TLS connection while it is still
parsing the HTML instead of after.

Why this exists (measured 2026-08-04): the Spot ad card cannot render until
/me answers — that gate is what keeps a premium visitor from ever seeing an ad,
and it is not negotiable. But on the FIRST page of a tab, /me is preceded by a
cold connection to an API host the browser has never talked to, plus a /health
probe. A visitor arriving from a Telegram link always lands in a fresh in-app
webview, so they always pay it: the card took ~2.7-3.0s to appear, against
70-170ms on a refresh (which reuses the connection and the cached base).

Preconnect removes the handshake from that critical path without touching the
premium rule at all: it only means the socket is already open when api.js asks
for it. Combined with the concurrent base probe in plus/js/api.js, the sponsor's
card shows up on the first view instead of after the visitor has scrolled past.

Both hosts are listed on every page deliberately — the .org and .ir codebases
are mirrors and per-domain logic is forbidden here (see CLAUDE.md). The unused
one costs a single idle socket that the browser drops on its own.

`crossorigin` is REQUIRED and not decoration: the API is called with
credentials, and a connection preconnected in anonymous mode would not be
reused for a credentialed CORS request — the handshake would simply happen
twice and the whole point would be lost.

Idempotent: a page already carrying the marker is skipped.

Usage:
    python3 .github/scripts/inject_preconnect.py            # inject across the repo
    python3 .github/scripts/inject_preconnect.py --check    # exit 1 if any page is missing it
"""

import os
import re
import sys

MARKER = 'rel="preconnect" href="https://api.dentcast'

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SNIPPET = (
    "  <!-- Open the API connection while the HTML is still parsing: /me gates the\n"
    "       ad card, and on a first visit the TLS handshake was in front of it. -->\n"
    '  <link rel="preconnect" href="https://api.dentcast.ir" crossorigin>\n'
    '  <link rel="preconnect" href="https://api.dentcast.org" crossorigin>\n'
)

HEAD_OPEN_RE = re.compile(r"(<head(?:\s[^>]*)?>[ \t]*\n)", re.IGNORECASE)


def iter_html_files():
    for dirpath, dirnames, filenames in os.walk(REPO_ROOT):
        dirnames[:] = [d for d in dirnames if d not in (".git", ".github", "node_modules")]
        for name in filenames:
            if name.lower().endswith(".html"):
                yield os.path.join(dirpath, name)


def needs_injection(text):
    return MARKER not in text


def inject(text):
    """Return (new_text, changed). Inserts the links right after <head>."""
    if not needs_injection(text):
        return text, False
    new_text, n = HEAD_OPEN_RE.subn(lambda m: m.group(1) + SNIPPET, text, count=1)
    if n == 0:
        return text, False  # no <head> — not a full page
    return new_text, True


def main():
    check_only = "--check" in sys.argv[1:]
    changed, skipped, missing = [], [], []

    for path in sorted(iter_html_files()):
        with open(path, "r", encoding="utf-8") as fh:
            text = fh.read()
        rel = os.path.relpath(path, REPO_ROOT)

        if not needs_injection(text):
            skipped.append(rel)
            continue

        new_text, did = inject(text)
        if not did:
            continue  # no <head> — not a real page

        if check_only:
            missing.append(rel)
            continue

        with open(path, "w", encoding="utf-8") as fh:
            fh.write(new_text)
        changed.append(rel)

    if check_only:
        if missing:
            print("Missing API preconnect on %d page(s):" % len(missing))
            for rel in missing:
                print("  " + rel)
            sys.exit(1)
        print("OK - all %d page(s) already preconnect to the API." % len(skipped))
        return

    print("Preconnect injected into %d page(s); %d already had it." % (len(changed), len(skipped)))


if __name__ == "__main__":
    main()
