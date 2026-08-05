#!/usr/bin/env python3
"""Cache-buster stamps that are checked, not remembered.

Every page loads the shared assets through a stamped URL — `/dc-nav.js?v=39`,
`/plus/js/pricing-page.js?v=1`. The stamp is the ONLY thing that makes a browser
fetch the new file: the path never changes, .org is served by GitHub Pages behind
Cloudflare (whose browser TTL is hours, and which does not honour our `_headers`
file — that only applies to Cloudflare Pages), so an unstamped change reaches a
returning visitor whenever the cache feels like it and not before.

That is not a theoretical risk. On 2026-08-05 the «اشتراک» button was added to
the toolbar drawer: the markup went into index.html (HTML, short cache — it
arrived) and its click handler went into dc-nav.js (stamped `?v=39`, unchanged —
it did not). The result on dentcast.org was a button that was visible and did
absolutely nothing. Eight `/plus/` entry modules changed in the same batch with
the same omission, which is why the premium buy-buttons did not appear either.

So the stamp is derived from CONTENT rather than trusted to a checklist:

  * an asset's fingerprint is a hash of its whole IMPORT GRAPH, not just its own
    bytes. `reading-compass-page.js` is three lines of glue; the button that went
    missing lives in `premium-cta.js`, which it imports and which carries no
    stamp of its own. Hashing only the entry file would have called that change
    invisible — exactly the bug this exists to catch.
  * `.dentcast/asset-versions.json` records, per asset, the version stamped in
    the HTML and the fingerprint that version was cut from.
  * `--check` (CI) fails when a fingerprint moved and its stamp did not, or when
    two pages stamp different versions of the same asset.
  * `--bump` does the whole edit: raises the stale versions, rewrites every
    occurrence across all HTML, and rewrites the manifest.

Usage:
    python3 tools/asset_version.py --check     # CI gate
    python3 tools/asset_version.py --bump      # after changing a shared asset
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / '.dentcast' / 'asset-versions.json'

# A stamped reference in a page: href/src="/dc-nav.js?v=39".
REF_RE = re.compile(r'(?P<path>/[A-Za-z0-9_./-]+\.(?:js|css))\?v=(?P<v>\d+)')

# Static and dynamic ES-module imports, plus CSS @import. Enough for this repo's
# modules, which import each other by plain relative path and nothing else.
JS_IMPORT_RE = re.compile(
    r'''(?:import|export)\s[^;'"]*?from\s*['"](?P<p>\.{1,2}/[^'"]+)['"]'''
    r'''|import\s*\(\s*['"](?P<d>\.{1,2}/[^'"]+)['"]\s*\)''')
CSS_IMPORT_RE = re.compile(r'''@import\s+(?:url\()?['"](?P<p>[^'"]+)['"]''')

# Directories that hold no site page (build inputs, tooling, dependencies).
SKIP_DIRS = {'.git', 'node_modules', 'plus-api', '.dentcast', '.github', '.cursor'}


def html_pages() -> list[Path]:
    return sorted(
        p for p in ROOT.rglob('*.html')
        if not any(part in SKIP_DIRS for part in p.relative_to(ROOT).parts)
    )


def graph(entry: Path) -> list[Path]:
    """Every file whose contents can change what `entry` does, entry included."""
    seen: list[Path] = []
    queue = [entry]
    while queue:
        f = queue.pop()
        if f in seen or not f.is_file():
            continue
        seen.append(f)
        text = f.read_text(encoding='utf-8', errors='replace')
        rx = CSS_IMPORT_RE if f.suffix == '.css' else JS_IMPORT_RE
        for m in rx.finditer(text):
            rel = m.group('p') or m.groupdict().get('d')
            if rel:
                queue.append((f.parent / rel.split('?')[0]).resolve())
    return sorted(seen)


def fingerprint(asset: str) -> str:
    entry = ROOT / asset.lstrip('/')
    if not entry.is_file():
        raise FileNotFoundError(asset)
    h = hashlib.sha256()
    for f in graph(entry):
        h.update(str(f.relative_to(ROOT)).encode())
        h.update(f.read_bytes())
    return h.hexdigest()[:16]


def stamped() -> dict[str, dict[int, list[str]]]:
    """asset -> {version: [pages stamping it]} across the whole site."""
    found: dict[str, dict[int, list[str]]] = {}
    for page in html_pages():
        text = page.read_text(encoding='utf-8', errors='replace')
        for m in REF_RE.finditer(text):
            asset, v = m.group('path'), int(m.group('v'))
            found.setdefault(asset, {}).setdefault(v, []).append(
                str(page.relative_to(ROOT)))
    return found


def load_manifest() -> dict:
    if MANIFEST.is_file():
        return json.loads(MANIFEST.read_text(encoding='utf-8'))
    return {}


def audit() -> tuple[list[str], dict]:
    """Returns (problems, state) where state[asset] = {v, hash, drift}."""
    manifest = load_manifest()
    problems: list[str] = []
    state: dict[str, dict] = {}

    for asset, versions in sorted(stamped().items()):
        try:
            fp = fingerprint(asset)
        except FileNotFoundError:
            problems.append(f'{asset}: stamped by a page but the file does not exist')
            continue
        live = max(versions)
        # Two pages disagreeing is its own failure: whichever page carries the
        # lower stamp keeps serving the old file forever.
        drift = len(versions) > 1
        if drift:
            where = '; '.join(
                f'v={v} on {len(pages)} page(s) e.g. {pages[0]}'
                for v, pages in sorted(versions.items()))
            problems.append(f'{asset}: pages disagree on the version — {where}')
        known = manifest.get(asset)
        if known is None:
            problems.append(f'{asset}: not in the manifest yet')
        elif known.get('hash') != fp:
            problems.append(
                f'{asset}: changed since v={known.get("v")} was stamped '
                f'(fingerprint {known.get("hash")} -> {fp}) but ?v= was not raised')
        elif known.get('v') != live:
            problems.append(
                f'{asset}: manifest says v={known.get("v")}, pages stamp v={live}')
        state[asset] = {'v': live, 'hash': fp, 'stale': known is None
                        or known.get('hash') != fp or known.get('v') != live}
    return problems, state


def bump() -> int:
    problems, state = audit()
    if not problems:
        print('nothing to bump — every stamp already matches its content')
        return 0

    manifest = load_manifest()
    new_version: dict[str, int] = {}
    for asset, s in state.items():
        known = manifest.get(asset)
        if known is not None and known.get('hash') == s['hash'] and known.get('v') == s['v']:
            continue
        # Never reuse a number: a stamp that has ever been served must not come
        # back pointing at different bytes.
        new_version[asset] = max(s['v'], int((known or {}).get('v', 0))) + 1

    changed_pages = 0
    for page in html_pages():
        text = page.read_text(encoding='utf-8')

        def swap(m: re.Match) -> str:
            v = new_version.get(m.group('path'))
            return f"{m.group('path')}?v={v}" if v else m.group(0)

        out = REF_RE.sub(swap, text)
        if out != text:
            page.write_text(out, encoding='utf-8')
            changed_pages += 1

    for asset, v in new_version.items():
        manifest[asset] = {'v': v, 'hash': state[asset]['hash']}
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(
        json.dumps(dict(sorted(manifest.items())), indent=2, ensure_ascii=False) + '\n',
        encoding='utf-8')

    for asset, v in sorted(new_version.items()):
        print(f'  {asset}  ->  ?v={v}')
    print(f'{len(new_version)} asset(s) bumped across {changed_pages} page(s).')
    return 0


def check() -> int:
    problems, _ = audit()
    if problems:
        print('Stale cache-buster stamps:\n')
        for p in problems:
            print(f'  - {p}')
        print('\nFix with:  python3 tools/asset_version.py --bump')
        return 1
    print('OK - every ?v= stamp matches the content it points at.')
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--check', action='store_true', help='fail if a stamp is stale (CI)')
    ap.add_argument('--bump', action='store_true', help='raise stale stamps and rewrite pages')
    args = ap.parse_args()
    if args.bump:
        return bump()
    return check()


if __name__ == '__main__':
    sys.exit(main())
