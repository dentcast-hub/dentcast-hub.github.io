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

# ── the assets no page references ───────────────────────────────────────────
# Four shared assets are never written into a page's HTML: dc-nav.js appends
# them at runtime, all behind ONE hand-written constant (`var V = '79';`). The
# scanner above only sees `?v=` inside HTML, so for these it saw nothing — and
# "nothing" reads exactly like "nothing to do". Changing plus.js therefore
# shipped a file that every returning browser and the CDN kept serving from
# cache at the old stamp: deployed, live, and invisible. That happened once
# (2026-08-12, the article-threads block) and the only reason it was ever found
# is that somebody said the feature was missing.
#
# So the constant is tracked here too. The four share one number by
# construction, so they are fingerprinted as ONE group: if any of their import
# graphs changed, V goes up and dc-nav.js is rewritten.
NAV_LOADER = ROOT / 'dc-nav.js'
NAV_V_RE = re.compile(r"""(?P<pre>var V = ')(?P<v>\d+)(?P<post>';)""")
NAV_ASSETS = [
    '/plus/plus.js', '/plus/plus.css', '/plus/plus-pages.css', '/plus/plus-desktop.css',
]
# Its own manifest key, so it cannot collide with a real asset path.
NAV_KEY = 'dc-nav.js:V'


def nav_version() -> int | None:
    """The `var V` dc-nav.js stamps its injected assets with."""
    if not NAV_LOADER.is_file():
        return None
    m = NAV_V_RE.search(NAV_LOADER.read_text(encoding='utf-8', errors='replace'))
    return int(m.group('v')) if m else None


def nav_fingerprint() -> str:
    """One digest over all four injected assets — they share one stamp."""
    h = hashlib.sha256()
    for asset in NAV_ASSETS:
        entry = ROOT / asset.lstrip('/')
        if not entry.is_file():
            continue
        for f in graph(entry):
            h.update(f.relative_to(ROOT).as_posix().encode())
            h.update(f.read_bytes())
    return h.hexdigest()[:16]


def set_nav_version(v: int) -> None:
    # newline='' for the same reason the page rewrite below uses it.
    with open(NAV_LOADER, 'r', encoding='utf-8', newline='') as fh:
        text = fh.read()
    out = NAV_V_RE.sub(lambda m: f"{m.group('pre')}{v}{m.group('post')}", text, count=1)
    with open(NAV_LOADER, 'w', encoding='utf-8', newline='') as fh:
        fh.write(out)


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
    # Sort by the POSIX string, not by Path: Path ordering is platform-normalised
    # (case-folded on Windows), so two machines could hash the same graph in two
    # different orders. On Linux this is the identical order it always produced.
    return sorted(seen, key=lambda p: p.relative_to(ROOT).as_posix())


def fingerprint(asset: str) -> str:
    entry = ROOT / asset.lstrip('/')
    if not entry.is_file():
        raise FileNotFoundError(asset)
    h = hashlib.sha256()
    for f in graph(entry):
        # as_posix(), never str(): str(Path) is backslash-separated on Windows, so
        # hashing it made the fingerprint PLATFORM-DEPENDENT — the same commit
        # produced one digest on a Windows machine and another on the Linux CI
        # runner, and --check could never pass from Windows. On Linux the two are
        # the same string, so this changes no existing fingerprint.
        h.update(f.relative_to(ROOT).as_posix().encode())
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


def audit_nav() -> list[str]:
    """The dc-nav.js constant, which no page stamps and the scanner cannot see."""
    live = nav_version()
    if live is None:
        return ['dc-nav.js: `var V` not found — the injected assets are unversioned']
    known = load_manifest().get(NAV_KEY)
    fp = nav_fingerprint()
    if known is None:
        return [f'{NAV_KEY}: not in the manifest yet']
    if known.get('hash') != fp:
        return [f'{NAV_KEY}: {", ".join(NAV_ASSETS)} changed since V={known.get("v")} '
                f'was stamped (fingerprint {known.get("hash")} -> {fp}) but V was not raised']
    if known.get('v') != live:
        return [f'{NAV_KEY}: manifest says V={known.get("v")}, dc-nav.js says V={live}']
    return []


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


def bump_nav() -> int | None:
    """Raise dc-nav.js's `var V` if the assets it injects changed. Returns the new V.

    Runs BEFORE the HTML pass on purpose: rewriting the constant changes
    dc-nav.js's own bytes, and dc-nav.js is itself a stamped asset on every
    page. Doing it first means the pass below sees the new bytes and raises
    `/dc-nav.js?v=` in the same run — otherwise the loader would ship with a
    new V that no browser ever fetches, which is the exact failure this whole
    block exists to prevent, one level up.
    """
    if not audit_nav():
        return None
    manifest = load_manifest()
    known = manifest.get(NAV_KEY) or {}
    live = nav_version() or 0
    new_v = max(live, int(known.get('v', 0))) + 1
    set_nav_version(new_v)
    manifest[NAV_KEY] = {'v': new_v, 'hash': nav_fingerprint()}
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST, 'w', encoding='utf-8', newline='') as fh:
        fh.write(json.dumps(dict(sorted(manifest.items())), indent=2, ensure_ascii=False) + '\n')
    print(f'  dc-nav.js  ->  var V = \'{new_v}\'  ({", ".join(NAV_ASSETS)})')
    return new_v


def bump() -> int:
    nav_bumped = bump_nav()

    problems, state = audit()
    if not problems:
        if nav_bumped is None:
            print('nothing to bump — every stamp already matches its content')
        else:
            print('1 loader constant bumped.')
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
        # newline='' on BOTH sides so a page's line endings survive the rewrite
        # untouched. With the defaults, read_text() collapses them to '\n' and
        # write_text() re-expands to os.linesep — which on Windows silently
        # converted all 767 pages to CRLF, turning a one-token stamp edit into a
        # whole-file diff. This tool changes a version number; it must change
        # nothing else about the bytes it writes.
        with open(page, 'r', encoding='utf-8', newline='') as fh:
            text = fh.read()

        def swap(m: re.Match) -> str:
            v = new_version.get(m.group('path'))
            return f"{m.group('path')}?v={v}" if v else m.group(0)

        out = REF_RE.sub(swap, text)
        if out != text:
            with open(page, 'w', encoding='utf-8', newline='') as fh:
                fh.write(out)
            changed_pages += 1

    for asset, v in new_version.items():
        manifest[asset] = {'v': v, 'hash': state[asset]['hash']}
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    # newline='' for the same reason as the pages above: the manifest is LF in the
    # repo and must not become CRLF just because it was written from Windows.
    with open(MANIFEST, 'w', encoding='utf-8', newline='') as fh:
        fh.write(json.dumps(dict(sorted(manifest.items())), indent=2, ensure_ascii=False) + '\n')

    for asset, v in sorted(new_version.items()):
        print(f'  {asset}  ->  ?v={v}')
    print(f'{len(new_version)} asset(s) bumped across {changed_pages} page(s).')
    return 0


def check() -> int:
    problems, _ = audit()
    problems = audit_nav() + problems
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
