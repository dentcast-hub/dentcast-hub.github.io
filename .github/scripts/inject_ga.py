#!/usr/bin/env python3
"""
DentCast Google Analytics 4 injector.

Walks the repo and injects the deferred (lazy-loaded) GA4 snippet into the
<head> of every HTML page that doesn't already have it. The snippet loads
gtag.js ONLY after the page's `load` event, so it never blocks first paint.

Idempotent: a page is skipped if it already contains the GA4 measurement ID,
so re-running produces no changes. Files without a <head> (e.g. the Google
site-verification stub) are skipped automatically.

The .org and .ir codebases are mirrors; this same tag is intended to deploy to
both. Do NOT add per-domain logic here.

Usage:
    python3 .github/scripts/inject_ga.py            # inject across the repo
    python3 .github/scripts/inject_ga.py --check    # exit 1 if any page is missing it
"""

import os
import re
import sys

GA_MEASUREMENT_ID = "G-GMM0WC8X3M"

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# The exact deferred snippet, indented two spaces to sit inside <head>.
GA_SNIPPET = (
    "  <!-- Google Analytics (deferred: loads only after the page is fully rendered) -->\n"
    "  <script>\n"
    "    window.addEventListener('load', function () {\n"
    "      window.dataLayer = window.dataLayer || [];\n"
    "      function gtag(){ dataLayer.push(arguments); }\n"
    "      window.gtag = gtag;\n"
    "      gtag('js', new Date());\n"
    "      gtag('config', '" + GA_MEASUREMENT_ID + "');\n"
    "      var ga = document.createElement('script');\n"
    "      ga.async = true;\n"
    "      ga.src = 'https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID + "';\n"
    "      document.head.appendChild(ga);\n"
    "    });\n"
    "  </script>\n"
)

# Matches the opening <head> tag (with or without attributes), capturing the
# trailing newline so we can splice the snippet onto the next line.
HEAD_OPEN_RE = re.compile(r"(<head(?:\s[^>]*)?>[ \t]*\n)", re.IGNORECASE)


def iter_html_files():
    for dirpath, dirnames, filenames in os.walk(REPO_ROOT):
        # Don't descend into VCS / CI plumbing.
        dirnames[:] = [d for d in dirnames if d not in (".git", ".github")]
        for name in filenames:
            if name.lower().endswith(".html"):
                yield os.path.join(dirpath, name)


def needs_injection(text):
    return GA_MEASUREMENT_ID not in text


def inject(text):
    """Return (new_text, changed). Inserts the snippet right after <head>."""
    if not needs_injection(text):
        return text, False
    new_text, n = HEAD_OPEN_RE.subn(lambda m: m.group(1) + GA_SNIPPET, text, count=1)
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
            # Has no <head> — not a real page (e.g. verification stub).
            continue

        if check_only:
            missing.append(rel)
            continue

        with open(path, "w", encoding="utf-8") as fh:
            fh.write(new_text)
        changed.append(rel)

    if check_only:
        if missing:
            print("Missing GA4 tag on %d page(s):" % len(missing))
            for rel in missing:
                print("  " + rel)
            sys.exit(1)
        print("OK — all %d page(s) already carry the GA4 tag." % len(skipped))
        return

    print("GA4 injected into %d page(s); %d already had it." % (len(changed), len(skipped)))


if __name__ == "__main__":
    main()
