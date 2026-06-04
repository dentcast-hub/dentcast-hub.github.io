#!/usr/bin/env python3
"""Stamp a content-derived version across the site for cache-busting.

The version is a short hash of the content sources of truth (the brain plus the
two glossaries). Whenever any content is published the hash changes, so:

  1. the service worker's CACHE_NAME bumps  -> old asset caches are purged and
     the browser re-fetches everything, keeping the whole site consistent;
  2. every `dentcast-brain.json?v=<ver>` fetch URL changes -> any intermediary
     /CDN cache that ignores `no-store` is still defeated.

Run it as part of the build (after content changes). Standard library only.
"""

import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Content sources of truth — any publish changes at least one of these.
CONTENT_SOURCES = [
    ROOT / "dentcast-brain.json",
    ROOT / "glossary" / "glossary.json",
    ROOT / "litecast" / "lite-glossary.json",
]

SERVICE_WORKER = ROOT / "service-worker.js"
CACHE_PREFIX = "dentcast-assets-"


def content_version():
    """Short hex digest over the concatenated content sources."""
    h = hashlib.sha256()
    for p in CONTENT_SOURCES:
        h.update(p.read_bytes())
    return h.hexdigest()[:10]


def stamp_service_worker(ver):
    """Rewrite CACHE_NAME = '...'; returns (changed, old, new)."""
    text = SERVICE_WORKER.read_text(encoding="utf-8")
    new_name = f"{CACHE_PREFIX}{ver}"
    pattern = re.compile(r"(const\s+CACHE_NAME\s*=\s*')([^']*)(')")
    m = pattern.search(text)
    if not m:
        raise SystemExit(f"CACHE_NAME not found in {SERVICE_WORKER.name}")
    old = m.group(2)
    if old == new_name:
        return False, old, new_name
    SERVICE_WORKER.write_text(pattern.sub(rf"\g<1>{new_name}\g<3>", text, count=1), encoding="utf-8")
    return True, old, new_name


def stamp_brain_fetches(ver):
    """Rewrite every `dentcast-brain.json?v=<...>` query string in all HTML.
    Returns a list of (path, count) for files changed."""
    pattern = re.compile(r"(dentcast-brain\.json\?v=)[0-9A-Za-z._-]*")
    changed = []
    for html in ROOT.rglob("*.html"):
        if "/.git/" in str(html):
            continue
        text = html.read_text(encoding="utf-8")
        new_text, n = pattern.subn(rf"\g<1>{ver}", text)
        if n and new_text != text:
            html.write_text(new_text, encoding="utf-8")
            changed.append((html.relative_to(ROOT), n))
    return changed


def main():
    ver = content_version()
    print(f"content version: {ver}")

    sw_changed, sw_old, sw_new = stamp_service_worker(ver)
    print(f"service worker CACHE_NAME: {sw_old} -> {sw_new}" + ("" if sw_changed else " (unchanged)"))

    changed = stamp_brain_fetches(ver)
    total = sum(n for _, n in changed)
    print(f"brain fetch ?v= stamped: {total} occurrence(s) in {len(changed)} file(s)")
    for path, n in changed:
        print(f"  {path} ({n})")


if __name__ == "__main__":
    main()
