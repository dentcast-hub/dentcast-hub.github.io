#!/usr/bin/env python3
"""
DentCast Sitemap Generator
- homepage را اول می‌آورد
- فایل‌های مُرده/قدیمی را skip می‌کند
- lastmod از آخرین git commit هر فایل
- priority و changefreq بر اساس نوع صفحه
"""

import subprocess, os, re

DOMAIN = "https://dentcast.org"
BASE   = "."

# ── فایل‌هایی که هرگز نباید در سایت‌مپ باشند ──────────────────────────────
EXCLUDE_NAMES = {"404.html", "player.html"}
EXCLUDE_PATTERNS = [
    r"index-old\.html$",        # نسخه‌های deprecated
    r"index-\d+\.html$",        # index-1.html و مشابه
    r"google[0-9a-f]+\.html$",  # فایل‌های تأیید Google Search Console
    r".*\(.*\).*\.html$",       # فایل با پرانتز در اسم: player (1).html
]

# ── تاریخ آخرین کامیت هر فایل (یک فراخوانی git برای کل repo) ─────────────
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


# ── کشف همه فایل‌های HTML ───────────────────────────────────────────────────
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

# ── ساخت لیست نهایی ─────────────────────────────────────────────────────────
entries = [("/", DOMAIN + "/")]           # homepage اول
seen    = {DOMAIN + "/", DOMAIN + "/index.html"}

for path in html_files:
    url = DOMAIN + path
    if url in seen:
        continue
    seen.add(url)
    entries.append((path, url))

# ── نوشتن sitemap.xml ───────────────────────────────────────────────────────
lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
]
for path, url in entries:
    d = get_date("/index.html" if path == "/" else path)
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

print(f"✅  sitemap.xml — {len(entries)} URLs written.")
