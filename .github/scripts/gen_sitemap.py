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

import subprocess, os, re, sys

DOMAIN = "https://dentcast.org"
BASE   = "."

EXCLUDE_NAMES = {"404.html", "player.html"}
EXCLUDE_PATTERNS = [
    r"index-old\.html$",
    r"index-\d+\.html$",
    r"google[0-9a-f]+\.html$",
    r".*\(.*\).*\.html$",
]

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


def get_date(path):
    return dates.get(path, "2025-01-01")


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

    if not (canon == DOMAIN + "/" or canon.startswith(DOMAIN + "/")):
        warn_off_domain.append((rel, canon))
        continue

    warn_duplicates.setdefault(canon, []).append(rel)
    if canon in seen:
        continue
    seen.add(canon)
    entries.append((rel, canon))


def _sort_key(item):
    path, url = item
    is_home = (url == DOMAIN + "/")
    return (0 if is_home else 1, url)


entries.sort(key=_sort_key)

lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
]
for path, url in entries:
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

with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print(f"OK  sitemap.xml — {len(entries)} URLs written.")
print()
print("=== Summary ===")
print(f"  HTML files considered (after EXCLUDE_*): {len(html_files)}")
print(f"  Skipped: noindex                        : {len(skipped_noindex)}")
print(f"  Skipped: no canonical                   : {len(warn_no_canonical)}")
print(f"  Skipped: off-domain canonical           : {len(warn_off_domain)}")
print(f"  URLs emitted                            : {len(entries)}")

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
