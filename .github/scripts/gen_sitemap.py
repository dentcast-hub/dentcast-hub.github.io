#!/usr/bin/env python3
"""
DentCast Sitemap Generator
- homepage را اول می‌آورد
- فایل‌های مُرده/قدیمی را skip می‌کند
- canonical را از خود HTML می‌خواند و در sitemap همان را قرار می‌دهد
- صفحاتی که <meta name="robots" content="…noindex…"> دارند skip می‌شوند
- lastmod از آخرین git commit هر فایل
- priority و changefreq بر اساس نوع صفحه (path-based)
- در پایان: گزارش هشدارها (no-canonical, off-domain, duplicates)
"""

import subprocess, os, re, sys, datetime

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

# lastmod is derived from each file's git history below. A shallow clone (e.g. the
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
    elif line.endswith(".html") and line not in dates:
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
_status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
_dirty = set()
for _line in _status.stdout.splitlines():
    _p = _line[3:]
    if " -> " in _p:            # rename: take the destination path
        _p = _p.split(" -> ", 1)[1]
    _p = _p.strip().strip('"')
    if _p.endswith(".html"):
        _dirty.add("/" + _p)


def get_date(path):
    if path in _dirty:
        return TODAY
    return dates.get(path, TODAY)


def get_priority(path):
    if path == "/":
        return "1.0"
    if re.search(
        r"/(glossary|notecast|insight|litecast|chairside|dentai|"
        r"metanotes|dentcast-plus|photocast|sharehub)/index\.html$", path
    ):
        return "0.9"
    if re.search(r"/notecast/episode-\d+\.html$", path):
        return "0.8"
    if re.search(r"/insight/insight-\d+\.html$", path):
        return "0.8"
    if re.search(r"/glossary/[^/]+\.html$", path) and "index" not in path:
        return "0.8"
    if re.search(
        r"/(litecast|chairside|dentai|metanotes|dentcast-plus|sharehub|photocast)/", path
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


def _first_group(m):
    if not m:
        return None
    for g in m.groups():
        if g is not None:
            return g
    return None


def read_canonical_and_robots(file_path):
    try:
        with open(file_path, "rb") as f:
            raw = f.read()
        text = raw.decode("utf-8", errors="replace")
    except OSError:
        return None, None
    end = text.lower().find("</head>")
    head = text if end == -1 else text[:end]
    canon_m = CANONICAL_RE.search(head)
    if canon_m is None:
        canon_m = CANONICAL_RE_REVERSE.search(head)
    canon = _first_group(canon_m)
    robots = _first_group(ROBOTS_RE.search(head))
    return (
        canon.strip() if canon else None,
        robots.strip().lower() if robots else None,
    )


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

warn_no_canonical = []
warn_off_domain = []
warn_duplicates = {}
skipped_noindex = []

for rel in html_files:
    file_path = "." + rel
    canon, robots = read_canonical_and_robots(file_path)

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
    bucket.append((rel, canon))


def write_sitemap(filename, bucket, home_url):
    def _sort_key(item):
        path, url = item
        is_home = (url == home_url)
        return (0 if is_home else 1, url)

    bucket = sorted(bucket, key=_sort_key)

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for path, url in bucket:
        d = get_date("/index.html" if path == "/index.html" else path)
        lines += [
            "  <url>",
            f"    <loc>{url}</loc>",
            f"    <lastmod>{d}</lastmod>",
            f"    <changefreq>{get_freq(path)}</changefreq>",
            f"    <priority>{get_priority(path)}</priority>",
            "  </url>",
        ]
    lines.append("</urlset>")

    with open(filename, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
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
