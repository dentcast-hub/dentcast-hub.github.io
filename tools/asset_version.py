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

# An import specifier inside an ES module, in the two forms this repo uses:
# static `… from '…'` (import and export alike) and dynamic `import('…')`. The
# path is either relative (`./js/des.js`) or site-absolute (`/plus/js/api.js`) —
# both occur, and an earlier version of this regex matched only the relative
# form, so `library-gate.js`'s dynamic `import('/plus/js/premium-cta.js')` was
# outside every fingerprint it should have been inside.
#
# `stamp` is optional because this same regex both READS specifiers (for the
# graph) and REWRITES them (for the module stamp below), and it has to match a
# specifier that already carries one.
#
# The trailing lookahead skips a specifier that is CONCATENATED with something
# (`import('./js/workbench.js' + PLUS_V)`). That form is a hand-built url, and
# stamping the literal half of it would produce `…?v=1?v=102`. There is no such
# line left in the repo — the one that existed was this same fix applied by hand
# to a single module — but the guard stays, because the next one would be
# silently mangled rather than caught.
SPEC_RE = re.compile(
    r'''(?P<head>\bfrom\s*|\bimport\s*\(\s*)'''
    r'''(?P<q>['"])(?P<spec>(?:\.{1,2}/|/)[^'"?\s]+\.js)(?P<stamp>\?v=\d+)?(?P=q)'''
    r'''(?!\s*\+)''')
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

# ── the same story a second time, for spot.js ───────────────────────────────
# spot/spot.js is loaded by THREE hand-written copies of one constant, because
# the two standalone Plus views do not pull in dc-nav.js. Nothing derived that
# number from spot.js's contents, so it had both failure modes at once: it went
# stale when spot.js changed, and the three copies drifted apart from each
# other. Both happened. The drift (dc-nav.js on 30, the two Plus views on 28
# since 2026-08-12) meant the dashboard and the profile executed a four-version
# old spot.js, which is what the CI guard in .github/workflows was written to
# catch after that cost a sponsor campaign once already.
#
# So the tool owns all three, exactly as it owns `var V`: one fingerprint over
# spot.js's import graph, one number written to every copy. The CI guard stays
# — it is a second, independent pair of eyes on a constant that is duplicated
# by necessity, and it is the thing that would notice if this block ever missed
# a fourth copy.
SPOT_LOADERS = [ROOT / 'dc-nav.js', ROOT / 'plus' / 'index.html', ROOT / 'plus' / 'profile.html']
SPOT_V_RE = re.compile(r"""(?P<pre>var SPOT_V = ')(?P<v>\d+)(?P<post>';)""")
SPOT_ASSET = '/spot/spot.js'
SPOT_KEY = 'spot.js:SPOT_V'


def spot_versions() -> dict[Path, int]:
    out: dict[Path, int] = {}
    for f in SPOT_LOADERS:
        if not f.is_file():
            continue
        m = SPOT_V_RE.search(f.read_text(encoding='utf-8', errors='replace'))
        if m:
            out[f] = int(m.group('v'))
    return out


def set_spot_version(v: int) -> None:
    for f in SPOT_LOADERS:
        if not f.is_file():
            continue
        with open(f, 'r', encoding='utf-8', newline='') as fh:
            text = fh.read()
        out = SPOT_V_RE.sub(lambda m: f"{m.group('pre')}{v}{m.group('post')}", text)
        if out != text:
            with open(f, 'w', encoding='utf-8', newline='') as fh:
                fh.write(out)


def audit_spot() -> list[str]:
    live = spot_versions()
    missing = [f.relative_to(ROOT).as_posix() for f in SPOT_LOADERS
               if f.is_file() and f not in live]
    if missing:
        return [f'{SPOT_KEY}: no `var SPOT_V` in {", ".join(missing)} — a loader was '
                f'renamed or removed']
    if not live:
        return [f'{SPOT_KEY}: no loader found at all']
    if len(set(live.values())) > 1:
        where = ', '.join(f'{f.relative_to(ROOT).as_posix()}={v}' for f, v in live.items())
        return [f'{SPOT_KEY}: the loaders disagree — {where}. Whichever view carries the '
                f'lower one keeps executing an old spot.js']
    known = load_manifest().get(SPOT_KEY)
    fp = fingerprint(SPOT_ASSET)
    cur = next(iter(live.values()))
    if known is None:
        return [f'{SPOT_KEY}: not in the manifest yet']
    if known.get('hash') != fp:
        return [f'{SPOT_KEY}: {SPOT_ASSET} changed since SPOT_V={known.get("v")} was '
                f'stamped (fingerprint {known.get("hash")} -> {fp}) but SPOT_V was not raised']
    if known.get('v') != cur:
        return [f'{SPOT_KEY}: manifest says SPOT_V={known.get("v")}, the loaders say {cur}']
    return []


def bump_spot() -> int | None:
    """Raise SPOT_V in all three loaders if spot.js changed or they drifted."""
    if not audit_spot():
        return None
    manifest = load_manifest()
    known = manifest.get(SPOT_KEY) or {}
    live = spot_versions()
    # max over every copy AND the manifest: after a drift the highest number has
    # already been served, and a stamp that has been served must never come back
    # pointing at different bytes.
    new_v = max([*live.values(), int(known.get('v', 0))] or [0]) + 1
    set_spot_version(new_v)
    manifest[SPOT_KEY] = {'v': new_v, 'hash': fingerprint(SPOT_ASSET)}
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST, 'w', encoding='utf-8', newline='') as fh:
        fh.write(json.dumps(dict(sorted(manifest.items())), indent=2, ensure_ascii=False) + '\n')
    print(f'  spot.js  ->  var SPOT_V = \'{new_v}\'  (all {len(SPOT_LOADERS)} loaders)')
    return new_v


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
            h.update(hashable(f))
    return h.hexdigest()[:16]


def set_nav_version(v: int) -> None:
    # newline='' for the same reason the page rewrite below uses it.
    with open(NAV_LOADER, 'r', encoding='utf-8', newline='') as fh:
        text = fh.read()
    out = NAV_V_RE.sub(lambda m: f"{m.group('pre')}{v}{m.group('post')}", text, count=1)
    with open(NAV_LOADER, 'w', encoding='utf-8', newline='') as fh:
        fh.write(out)


# ── the modules nothing stamps at all ───────────────────────────────────────
# The two blocks above stamp ENTRY points: the url in a page's HTML, and the
# four assets dc-nav.js injects. Nothing stamped what those entries IMPORT.
# `/plus/plus.js?v=101` is a fresh url on every bump, but the very first line
# inside it is `import … from './js/config.js'`, and THAT url never changes. So
# the browser refetched the entry and then satisfied all 50-odd of its imports
# from cache, and a change confined to a module — which is where nearly all of
# this codebase's behaviour lives — shipped invisibly for as long as the CDN
# felt like it. That is the same failure as the `var V` block above, one level
# deeper, and it was found the same way: somebody said a feature was missing
# (2026-08-15, the DES card's provenance line).
#
# ONE number for every module, not one per entry. The same module is imported
# by several entries and by two different spellings of its own path, and an
# import specifier is a url: two spellings carrying two different stamps are
# two urls, which the browser instantiates as two separate module objects with
# separate state. A per-entry stamp would therefore have traded a caching bug
# for a much worse aliasing bug. One number means every specifier for a given
# file is byte-identical, whoever wrote it.
MODULES_KEY = 'modules:M'

# Module entry points this tool does not otherwise know about. spot.js is loaded
# by its own hand-written constant (`var SPOT_V`, three copies, guarded by its
# own CI workflow) rather than by a `?v=` in any page, so nothing here would
# have found it — yet it imports `/plus/js/api.js` and `/plus/js/config.js`,
# the same two modules plus.js imports. Leaving it out did not merely miss a
# stamp: api.js would then be fetched at two different urls in one page, which
# the browser instantiates as two module objects with two separate session
# caches. Caught in a browser run, not by reading the code.
EXTRA_MODULE_ENTRIES = ['/spot/spot.js']


def module_files() -> list[Path]:
    """The module GRAPH: files connected to a stamped entry by an import.

    A stamped `.js` that neither imports nor is imported is not part of it and
    is deliberately left out — `dc-nav.js` is the case that matters. It is a
    plain script, so there is nothing in it to stamp; including it anyway put
    the `var V` constant that bump_nav() writes inside this fingerprint, and the
    two passes then took turns invalidating each other, so `--bump` raised M on
    every run forever. This tool must never hash a number it writes itself —
    the same rule that keeps service-worker.js out of stamp-version.py.
    """
    entries = [ROOT / a.lstrip('/') for a in NAV_ASSETS + EXTRA_MODULE_ENTRIES]
    entries += [ROOT / a.lstrip('/') for a in stamped()]
    seen: dict[str, Path] = {}
    for e in entries:
        if not e.is_file():
            continue
        g = graph(e)
        if len(g) < 2:  # an island: no imports, nothing importing it
            continue
        for f in g:
            if f.suffix == '.js' and not any(
                    part in SKIP_DIRS for part in f.relative_to(ROOT).parts):
                seen[f.relative_to(ROOT).as_posix()] = f
    return [seen[k] for k in sorted(seen)]


def modules_fingerprint() -> str:
    h = hashlib.sha256()
    for f in module_files():
        h.update(f.relative_to(ROOT).as_posix().encode())
        h.update(hashable(f))
    return h.hexdigest()[:16]


def live_module_version() -> tuple[int | None, set[int]]:
    """(the stamp in use, every distinct stamp found). More than one is drift."""
    found: set[int] = set()
    for f in module_files():
        for m in SPEC_RE.finditer(f.read_text(encoding='utf-8', errors='replace')):
            if m.group('stamp'):
                found.add(int(m.group('stamp')[3:]))
    return (max(found) if found else None), found


def set_module_version(v: int) -> int:
    """Stamp every internal import specifier. Returns the number of files touched."""
    touched = 0
    for f in module_files():
        # newline='' on both sides, same reason as the HTML pass below.
        with open(f, 'r', encoding='utf-8', newline='') as fh:
            text = fh.read()
        out = apply_stamps(text, v)
        if out != text:
            with open(f, 'w', encoding='utf-8', newline='') as fh:
                fh.write(out)
            touched += 1
    return touched


def audit_modules() -> list[str]:
    live, found = live_module_version()
    known = load_manifest().get(MODULES_KEY)
    fp = modules_fingerprint()
    if len(found) > 1:
        return [f'{MODULES_KEY}: import specifiers disagree on the version — '
                f'{sorted(found)}. Whichever module carries the lower stamp keeps '
                f'serving the old file, and two stamps on one file load it twice']
    if live is None:
        return [f'{MODULES_KEY}: no import specifier carries ?v= — every module is '
                f'unversioned and a returning browser can keep serving the old one']
    if known is None:
        return [f'{MODULES_KEY}: not in the manifest yet']
    if known.get('hash') != fp:
        return [f'{MODULES_KEY}: a module changed since M={known.get("v")} was stamped '
                f'(fingerprint {known.get("hash")} -> {fp}) but M was not raised']
    if known.get('v') != live:
        return [f'{MODULES_KEY}: manifest says M={known.get("v")}, the imports say {live}']
    return []


def html_pages() -> list[Path]:
    return sorted(
        p for p in ROOT.rglob('*.html')
        if not any(part in SKIP_DIRS for part in p.relative_to(ROOT).parts)
    )


def resolve_spec(src: Path, spec: str) -> Path:
    """Where an import specifier written inside `src` actually points.

    A site-absolute specifier is resolved from the site root, not from the file
    — which is also why one global module stamp is the only safe scheme: the
    same module is imported both ways (`./api.js` from plus.js, `/plus/js/api.js`
    from upboard-page.js) and both must keep resolving to ONE url. Two different
    stamps on those two lines would instantiate api.js twice, giving the two
    halves of the page separate module state.
    """
    spec = spec.split('?')[0]
    if spec.startswith('/'):
        return (ROOT / spec.lstrip('/')).resolve()
    return (src.parent / spec).resolve()


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
        if f.suffix == '.css':
            for m in CSS_IMPORT_RE.finditer(text):
                queue.append(resolve_spec(f, m.group('p')))
        else:
            for m in SPEC_RE.finditer(text):
                queue.append(resolve_spec(f, m.group('spec')))
    # Sort by the POSIX string, not by Path: Path ordering is platform-normalised
    # (case-folded on Windows), so two machines could hash the same graph in two
    # different orders. On Linux this is the identical order it always produced.
    return sorted(seen, key=lambda p: p.relative_to(ROOT).as_posix())


def hashable(f: Path) -> bytes:
    """A file's bytes with the module stamps taken back out.

    Every hash in this tool runs through here, and it has to: the module stamp
    below is WRITTEN INTO the same files these fingerprints are computed from,
    so hashing the raw bytes would make each bump change the fingerprint that
    justified it, and --bump would never reach a fixed point. Stripping the
    stamps means a fingerprint moves when the CODE moves and at no other time.
    """
    raw = f.read_bytes()
    if f.suffix != '.js':
        return raw
    text = raw.decode('utf-8', errors='replace')
    return strip_stamps(text).encode('utf-8', errors='replace')


def strip_stamps(text: str) -> str:
    return SPEC_RE.sub(
        lambda m: f"{m.group('head')}{m.group('q')}{m.group('spec')}{m.group('q')}", text)


def apply_stamps(text: str, v: int) -> str:
    return SPEC_RE.sub(
        lambda m: f"{m.group('head')}{m.group('q')}{m.group('spec')}?v={v}{m.group('q')}", text)


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
        h.update(hashable(f))
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


def bump_modules() -> int | None:
    """Raise the shared module stamp if any module changed. Returns the new M.

    Runs FIRST, for the same reason bump_nav runs before the HTML pass: this
    writes into the module files, and those files are inside the import graphs
    the two passes after it fingerprint. It is safe only because every hash goes
    through hashable(), which takes the stamps back out — otherwise this write
    would move the very fingerprints the later passes are about to read.
    """
    if not audit_modules():
        return None
    manifest = load_manifest()
    known = manifest.get(MODULES_KEY) or {}
    live, _ = live_module_version()
    new_v = max(live or 0, int(known.get('v', 0))) + 1
    touched = set_module_version(new_v)
    manifest[MODULES_KEY] = {'v': new_v, 'hash': modules_fingerprint()}
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST, 'w', encoding='utf-8', newline='') as fh:
        fh.write(json.dumps(dict(sorted(manifest.items())), indent=2, ensure_ascii=False) + '\n')
    print(f'  module imports  ->  ?v={new_v}  ({touched} file(s) rewritten)')
    return new_v


def bump() -> int:
    modules_bumped = bump_modules()
    # Before the HTML pass, like bump_nav and for the same reason: this writes
    # SPOT_V into dc-nav.js, and dc-nav.js is itself stamped on every page.
    spot_bumped = bump_spot()
    nav_bumped = bump_nav()

    problems, state = audit()
    if not problems:
        done = [x for x in (modules_bumped, spot_bumped, nav_bumped) if x is not None]
        if not done:
            print('nothing to bump — every stamp already matches its content')
        else:
            print(f'{len(done)} loader constant(s) bumped.')
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
    problems = audit_modules() + audit_spot() + audit_nav() + problems
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
