#!/usr/bin/env python3
"""
DentCast Sitemap Generator
- homepage را اول می‌آورد
- فایل‌های مُرده/قدیمی را skip می‌کند
- canonical را از خود HTML می‌خواند و در sitemap همان را قرار می‌دهد
- صفحاتی که <meta name="robots" content="…noindex…"> دارند skip می‌شوند
- lastmod از تاریخِ خودِ محتوا (JSON-LD)، و برای صفحاتِ بی‌تاریخ از آخرین git commit
- priority و changefreq بر اساس نوع صفحه (path-based)
- در پایان: گزارش هشدارها (no-canonical, off-domain, duplicates)
"""

import subprocess, os, re, sys, datetime, json
from xml.sax.saxutils import escape as xml_escape
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools"))
from dentcast_text_io import write_text

DOMAIN = "https://dentcast.org"
DOMAIN_IR = "https://dentcast.ir"
BASE   = "."

EXCLUDE_NAMES = {"404.html", "player.html"}
EXCLUDE_PATTERNS = [
    r"index-old\.html$",
    r"index-\d+\.html$",
    r"google[0-9a-f]+\.html$",
    r".*\(.*\).*\.html$",
]

# ---------------------------------------------------------------------------
# lastmod: the page's OWN content date first, git only as the fallback.
#
# `lastmod` answers "when did this page's content last change". Git cannot
# answer that in this repo: a site-wide chrome sweep (a header icon, an asset
# stamp) touches every page without changing a word of any of them, so
# latest-commit semantics stamps all ~556 URLs with one date — measured
# 2026-08-13: 555 of 556 came out as the same day, which is exactly the noise
# Google learns to distrust. The page's JSON-LD `dateModified` is the only
# thing in the tree that tracks the content itself, and the publish workflow
# stamps it on every content page.
#
# So: `dateModified` (else `datePublished`) when the page has one — 5xx of them
# do — and the git history only for the handful of hubs/landing pages that
# carry no JSON-LD date at all (index.html, {type}/index.html, pillar/*, the
# dentcast-plus videos). Those are also the pages a chrome sweep legitimately
# changes, so latest-commit is the right semantic exactly where it is used.
#
# The git map below is still needed for that fallback. A shallow clone (e.g. the
# publish environment) truncates that history and yields wrong dates, which then
# differ from the full-history sitemap CI regenerates — causing a corrective second
# commit/push that races the GitHub Pages deployment ("Deployment failed, try again
# later"). Ensure full history first. No-op in CI (checks out with fetch-depth: 0)
# and degrades gracefully to the shallow behavior if the fetch can't run.
if subprocess.run(["git", "rev-parse", "--is-shallow-repository"],
                  capture_output=True, text=True).stdout.strip() == "true":
    subprocess.run(["git", "fetch", "--unshallow", "--quiet"], check=False)

result = subprocess.run(
    ["git", "log", "--format=%cd", "--date=format:%Y-%m-%d",
     "--diff-filter=AM", "--name-only", "--", "*.html"],
    capture_output=True, text=True
)
dates = {}
current_date = ""
for line in result.stdout.splitlines():
    line = line.strip()
    if re.match(r"^\d{4}-\d{2}-\d{2}$", line):
        current_date = line
    # `git log` streams newest -> oldest, so the FIRST time a path appears is its
    # latest commit. The membership test must use the same "/"-prefixed key the
    # map is stored under: testing the bare path never matched, so every older
    # commit overwrote the newer one and each file ended up with its FIRST-ever
    # commit date (found 2026-08-13; dentcast.org itself read 2025-11-02).
    elif line.endswith(".html") and "/" + line not in dates:
        dates["/" + line] = current_date


TODAY = datetime.date.today().strftime("%Y-%m-%d")

# Files with uncommitted changes (staged, modified, or untracked .html) have no
# final commit date yet. The sitemap is generated *before* the publish commit, so
# without this those files fall back to a stale date; after the commit lands, CI
# regenerates and computes today's date instead. That mismatch made the sitemap
# workflow push a second, racing commit to main on every publish (two overlapping
# GitHub Pages deployments -> "Deployment failed, try again later"). Treating dirty
# .html as today makes the locally generated sitemap match the one CI regenerates
# post-commit, so no second push is needed.
#
# This applies ONLY to the git-fallback pages now. A dirty page that carries its
# own JSON-LD date already has, in the working tree, the exact date CI will read
# after the commit — guessing TODAY on top of that could only disagree with it.
_status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
_dirty = set()
for _line in _status.stdout.splitlines():
    _p = _line[3:]
    if " -> " in _p:            # rename: take the destination path
        _p = _p.split(" -> ", 1)[1]
    _p = _p.strip().strip('"')
    if _p.endswith(".html"):
        _dirty.add("/" + _p)


def get_date(path, content_date=None):
    """lastmod for one page: its own content date, else its git history.

    `content_date` is the page's JSON-LD dateModified/datePublished (None for the
    hubs and landing pages, which carry no JSON-LD date). The _dirty = TODAY
    fallback belongs to the git branch alone — see the note above it.
    """
    if content_date:
        return content_date
    if path in _dirty:
        return TODAY
    return dates.get(path, TODAY)


def get_priority(path):
    if path == "/":
        return "1.0"
    if re.search(
        r"/(glossary|notecast|insight|litecast|chairside|dentai|"
        r"metanotes|dentcast-plus|photocast|sharehub|plak-sefr|taraz)/index\.html$", path
    ):
        return "0.9"
    # پرامپتولوژیست is a section whose landing page happens to sit one level
    # deeper (/dentai/promptologist/), so the pattern above — which anchors on a
    # single path segment — never matched it and the /dentai/ clause below
    # claimed it at 0.7, alone among every section landing page on the site.
    if path == "/dentai/promptologist/index.html":
        return "0.9"
    if re.search(r"/notecast/episode-\d+\.html$", path):
        return "0.8"
    if re.search(r"/insight/insight-\d+\.html$", path):
        return "0.8"
    if re.search(r"/glossary/[^/]+\.html$", path) and "index" not in path:
        return "0.8"
    if re.search(
        r"/(litecast|chairside|dentai|metanotes|dentcast-plus|sharehub|photocast|plak-sefr|taraz)/", path
    ):
        return "0.7"
    return "0.6"


def get_freq(path):
    if path == "/" or path.endswith("index.html"):
        return "weekly"
    return "monthly"


def is_excluded(rel_path):
    name = os.path.basename(rel_path)
    if name in EXCLUDE_NAMES:
        return True
    for pat in EXCLUDE_PATTERNS:
        if re.search(pat, rel_path):
            return True
    return False


CANONICAL_RE = re.compile(
    r'<link\b[^>]*\brel\s*=\s*["\']?canonical["\']?[^>]*\bhref\s*=\s*'
    r'(?:"([^"]+)"|\'([^\']+)\'|([^\s>]+))[^>]*>',
    re.IGNORECASE,
)
CANONICAL_RE_REVERSE = re.compile(
    r'<link\b[^>]*\bhref\s*=\s*'
    r'(?:"([^"]+)"|\'([^\']+)\'|([^\s>]+))'
    r'[^>]*\brel\s*=\s*["\']?canonical["\']?[^>]*>',
    re.IGNORECASE,
)
ROBOTS_RE = re.compile(
    r'<meta\b[^>]*\bname\s*=\s*["\']?robots["\']?[^>]*\bcontent\s*=\s*'
    r'(?:"([^"]*)"|\'([^\']*)\'|([^\s>]+))[^>]*>',
    re.IGNORECASE,
)
# The page's own content date, from its JSON-LD. `dateModified` is the one that
# means what lastmod means; `datePublished` is the fallback for a page that
# carries only that. Both live inside <head> on every page that has them
# (verified across the tree), so the existing head slice is enough — same
# read-the-page-itself approach as tools/build_pillar.py's page_date().
DATE_MODIFIED_RE = re.compile(r'"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})')
DATE_PUBLISHED_RE = re.compile(r'"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})')


def _first_group(m):
    if not m:
        return None
    for g in m.groups():
        if g is not None:
            return g
    return None


def read_page_meta(file_path):
    """(canonical, robots, content_date) read from one page's <head>."""
    try:
        with open(file_path, "rb") as f:
            raw = f.read()
        text = raw.decode("utf-8", errors="replace")
    except OSError:
        return None, None, None
    end = text.lower().find("</head>")
    head = text if end == -1 else text[:end]
    canon_m = CANONICAL_RE.search(head)
    if canon_m is None:
        canon_m = CANONICAL_RE_REVERSE.search(head)
    canon = _first_group(canon_m)
    robots = _first_group(ROBOTS_RE.search(head))
    date_m = DATE_MODIFIED_RE.search(head) or DATE_PUBLISHED_RE.search(head)
    return (
        canon.strip() if canon else None,
        robots.strip().lower() if robots else None,
        date_m.group(1) if date_m else None,
    )


# ---------------------------------------------------------------------------
# Image sitemap entries.
#
# A page earns <image:image> entries only when it declares a real picture in its
# own JSON-LD: an ImageObject with a `contentUrl` that points at an image file.
# That is the exact signal the LiteCast pages that carry an illustration already
# write (lite-CAST40, lite-CAST42), and it is deliberately narrow: the other
# ImageObject nodes on the site are publisher logos or have no contentUrl, and the
# `contentUrl`s that exist elsewhere are audio/video embeds. Nothing is inferred
# from og:image, which most pages point at the shared site cover.
IMAGE_EXT_RE = re.compile(r"\.(?:webp|jpe?g|png|gif|avif)(?:\?.*)?$", re.IGNORECASE)
LDJSON_RE = re.compile(
    r'<script\b[^>]*type\s*=\s*["\']application/ld\+json["\'][^>]*>(.*?)</script>',
    re.IGNORECASE | re.DOTALL,
)


def _walk_image_objects(node, out):
    if isinstance(node, dict):
        t = node.get("@type")
        types = t if isinstance(t, list) else [t]
        url = node.get("contentUrl")
        if "ImageObject" in types and isinstance(url, str) and IMAGE_EXT_RE.search(url):
            out.append(url.strip())
        for v in node.values():
            _walk_image_objects(v, out)
    elif isinstance(node, list):
        for v in node:
            _walk_image_objects(v, out)


def read_page_images(file_path):
    """Image URLs a page declares via JSON-LD ImageObject.contentUrl, in order."""
    try:
        with open(file_path, "rb") as f:
            text = f.read().decode("utf-8", errors="replace")
    except OSError:
        return []
    end = text.lower().find("</head>")
    head = text if end == -1 else text[:end]
    found = []
    for m in LDJSON_RE.finditer(head):
        try:
            _walk_image_objects(json.loads(m.group(1)), found)
        except ValueError:
            continue
    seen_img, ordered = set(), []
    for u in found:
        if u not in seen_img:
            seen_img.add(u)
            ordered.append(u)
    return ordered


html_files = []
for root, dirs, files in os.walk(BASE):
    dirs[:] = [d for d in dirs if not d.startswith(".")]
    for f in files:
        if not f.endswith(".html"):
            continue
        full = os.path.join(root, f)
        rel  = "/" + os.path.relpath(full, BASE).replace("\\", "/")
        if not is_excluded(rel):
            html_files.append(rel)
html_files.sort()

entries = []
entries_ir = []
seen = set()
page_images = {}        # canonical URL -> [image URL, ...] (only pages that declare any)

warn_no_canonical = []
warn_off_domain = []
warn_duplicates = {}
skipped_noindex = []
git_dated = []          # emitted pages with no JSON-LD date (the git fallback)

for rel in html_files:
    file_path = "." + rel
    canon, robots, content_date = read_page_meta(file_path)

    if robots and "noindex" in robots:
        skipped_noindex.append(rel)
        continue

    if not canon:
        warn_no_canonical.append(rel)
        continue

    if canon == DOMAIN + "/" or canon.startswith(DOMAIN + "/"):
        bucket = entries
    elif canon == DOMAIN_IR + "/" or canon.startswith(DOMAIN_IR + "/"):
        bucket = entries_ir
    else:
        warn_off_domain.append((rel, canon))
        continue

    warn_duplicates.setdefault(canon, []).append(rel)
    if canon in seen:
        continue
    seen.add(canon)
    if not content_date:
        git_dated.append(rel)
    bucket.append((rel, canon, content_date))
    imgs = read_page_images(file_path)
    if imgs:
        page_images[canon] = imgs


def write_sitemap(filename, bucket, home_url):
    def _sort_key(item):
        path, url, _date = item
        is_home = (url == home_url)
        return (0 if is_home else 1, url)

    bucket = sorted(bucket, key=_sort_key)

    # The image namespace is declared only in a file that actually carries image
    # entries, so a sitemap without any stays byte-identical to what it was.
    has_images = any(url in page_images for _p, url, _d in bucket)
    urlset = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
    if has_images:
        urlset += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        urlset + ">",
    ]
    for path, url, content_date in bucket:
        d = get_date(path, content_date)
        lines += [
            "  <url>",
            f"    <loc>{url}</loc>",
            f"    <lastmod>{d}</lastmod>",
            f"    <changefreq>{get_freq(path)}</changefreq>",
            f"    <priority>{get_priority(path)}</priority>",
        ]
        for img in page_images.get(url, []):
            lines += [
                "    <image:image>",
                f"      <image:loc>{xml_escape(img)}</image:loc>",
                "    </image:image>",
            ]
        lines.append("  </url>")
    lines.append("</urlset>")

    write_text(filename, "\n".join(lines) + "\n")
    return len(bucket)


n_org = write_sitemap("sitemap.xml", entries, DOMAIN + "/")
n_ir = write_sitemap("sitemap-ir.xml", entries_ir, DOMAIN_IR + "/")

print(f"OK  sitemap.xml — {n_org} URLs written.")
print(f"OK  sitemap-ir.xml — {n_ir} URLs written.")
print()
print("=== Summary ===")
print(f"  HTML files considered (after EXCLUDE_*): {len(html_files)}")
print(f"  Skipped: noindex                        : {len(skipped_noindex)}")
print(f"  Skipped: no canonical                   : {len(warn_no_canonical)}")
print(f"  Skipped: off-domain canonical           : {len(warn_off_domain)}")
print(f"  URLs emitted (sitemap.xml / .org)       : {len(entries)}")
print(f"  URLs emitted (sitemap-ir.xml / .ir)     : {len(entries_ir)}")
print(f"  lastmod from the page's own JSON-LD     : "
      f"{len(entries) + len(entries_ir) - len(git_dated)}")
print(f"  lastmod from git history (no JSON-LD)   : {len(git_dated)}")
print(f"  pages with image:image entries          : {len(page_images)}")

if git_dated:
    print("\nlastmod from git history (page carries no JSON-LD date):")
    for r in git_dated:
        print(f"  {r}")

if skipped_noindex:
    print("\nSkipped (noindex):")
    for r in skipped_noindex:
        print(f"  {r}")

if warn_no_canonical:
    print("\nWARN  Files with no <link rel=\"canonical\"> (skipped):")
    for r in warn_no_canonical:
        print(f"  {r}")

if warn_off_domain:
    print("\nWARN  Files whose canonical points outside dentcast.org (skipped):")
    for r, u in warn_off_domain:
        print(f"  {r}  ->  {u}")

dupes = {u: files for u, files in warn_duplicates.items() if len(files) > 1}
if dupes:
    print("\nWARN  Duplicate canonical URLs across multiple files:")
    for u, files in dupes.items():
        print(f"  {u}")
        for r in files:
            print(f"    <- {r}")
