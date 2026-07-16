#!/usr/bin/env python3
"""Detect real editorial publishes in a git push and fire the Plus
`article_published` event for each. This is the engine behind the
`.github/workflows/notify-new-articles.yml` Action (Phase E, automated).

A page qualifies as a "new article to notify" ONLY when ALL of these hold:

  1. It is an article content TYPE. Type = the page's top folder (first path
     segment of its canonical content_id). Everything counts EXCEPT the excluded
     folders below (glossary, litecast). LiteCast is `.ir`-only and outside the
     Plus push ecosystem; glossary is a reference type, not an article.
  2. It carries the explicit PUBLISH MARKER `<meta name="dc-notify" content="true">`
     in its <head>. Publication as a notification event is an editorial decision,
     added by the publish flow; a new file without the marker (a draft) never fires.
  3. Its canonical CONTENT_ID has not been notified before. content_id comes from
     the page's <link rel="canonical"> (the SEO-frozen slug), NOT the file path, so
     a move/rename that keeps the slug is not a new article. The API enforces this
     via idempotency (records each content_id once); this script just hands it every
     qualifying candidate and lets the API dedup on retry.

The git diff selects the CANDIDATE set (changed .html files); the three gates above
decide what actually fires. Idempotency does dedup-on-retry only — never the job of
deciding what counts as an article.

Usage (CI):
    python tools/notify_new_articles.py --base-sha <before> --head-sha <after>
Usage (local test / manual):
    python tools/notify_new_articles.py --files chairside/chairside-9.html [--dry-run]

Config via environment (same as tools/notify_new_article.py):
    PLUS_API_BASE, ADMIN_USER, ADMIN_PASSWORD
"""
import argparse
import os
import re
import subprocess
import sys

# tools/ is on sys.path[0] when run as `python tools/notify_new_articles.py`.
from notify_new_article import to_path, content_id_from_path, post_article

# Persian titles/logs must print on any console (Windows defaults to cp1252).
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass

EXCLUDE_FOLDERS = {"litecast", "glossary"}
ZERO_SHA = "0" * 40

CANONICAL_RE = re.compile(
    r'<link\b[^>]*\brel=["\']canonical["\'][^>]*>', re.IGNORECASE)
HREF_RE = re.compile(r'\bhref=["\']([^"\']+)["\']', re.IGNORECASE)
# the publish marker, tolerant of attribute order/spacing
MARKER_RE = re.compile(
    r'<meta\b[^>]*\bname=["\']dc-notify["\'][^>]*>', re.IGNORECASE)
CONTENT_TRUE_RE = re.compile(r'\bcontent=["\']true["\']', re.IGNORECASE)
TITLE_RE = re.compile(r'<title>(.*?)</title>', re.IGNORECASE | re.DOTALL)


def run_git(args):
    return subprocess.run(
        ["git", *args], capture_output=True, text=True, encoding="utf-8"
    ).stdout


def changed_html_files(base_sha, head_sha):
    """Added/modified .html files between base and head. Falls back to the head
    commit alone when base is missing/zero (first push, force-push, shallow)."""
    valid_base = base_sha and base_sha != ZERO_SHA and run_git(
        ["cat-file", "-t", base_sha]).strip() == "commit"
    if valid_base:
        out = run_git(["diff", "--name-only", "--diff-filter=AM", base_sha, head_sha])
    else:
        out = run_git(["show", "--pretty=", "--name-only", "--diff-filter=AM", head_sha])
    return [f for f in (l.strip() for l in out.splitlines()) if f.lower().endswith(".html")]


def canonical_path(html):
    tag = CANONICAL_RE.search(html)
    if not tag:
        return None
    href = HREF_RE.search(tag.group(0))
    return to_path(href.group(1)) if href else None


def has_marker(html):
    tag = MARKER_RE.search(html)
    return bool(tag and CONTENT_TRUE_RE.search(tag.group(0)))


def load_brain_titles():
    """Map normalized page path -> editorial title from dentcast-brain.json, so the
    push uses the real title (not the '<title> | دنت‌کست' chrome)."""
    import json
    titles = {}
    try:
        brain = json.load(open("dentcast-brain.json", encoding="utf-8"))
    except Exception:
        return titles
    arr = brain if isinstance(brain, list) else next(
        (v for v in brain.values() if isinstance(v, list)), [])
    for e in arr:
        if isinstance(e, dict) and e.get("page_url") and e.get("title"):
            titles[to_path(e["page_url"])] = e["title"]
    return titles


def title_for(path, html, brain_titles):
    if path in brain_titles:
        return brain_titles[path]
    m = TITLE_RE.search(html)
    if m:
        # drop a trailing " | دنت‌کست"-style site suffix
        return re.split(r'\s*[|｜]\s*', m.group(1).strip())[0].strip()
    return content_id_from_path(path)


def qualify(files, brain_titles):
    """Yield (content_id, url, title, reason_or_None) for each candidate file.
    reason is a skip reason string when the file does NOT qualify."""
    for f in files:
        if not os.path.isfile(f):
            yield (f, None, None, "file no longer exists")
            continue
        html = open(f, encoding="utf-8", errors="replace").read()
        path = canonical_path(html)
        if not path:
            yield (f, None, None, "no canonical link")
            continue
        content_id = content_id_from_path(path)
        folder = content_id.split("/", 1)[0]
        if folder in EXCLUDE_FOLDERS:
            yield (content_id, path, None, f"excluded type '{folder}'")
            continue
        if not has_marker(html):
            yield (content_id, path, None, "no dc-notify marker")
            continue
        yield (content_id, path, title_for(path, html, brain_titles), None)


def main():
    p = argparse.ArgumentParser(description="Fire article_published for real publishes in a push.")
    p.add_argument("--base-sha", default=os.environ.get("GITHUB_EVENT_BEFORE", ""))
    p.add_argument("--head-sha", default=os.environ.get("GITHUB_SHA", "HEAD"))
    p.add_argument("--files", nargs="*", help="explicit file list (bypasses git diff; for testing)")
    p.add_argument("--api-base", default=os.environ.get("PLUS_API_BASE", "https://api.dentcast.org"))
    p.add_argument("--dry-run", action="store_true", help="detect and print, do not POST")
    args = p.parse_args()

    files = args.files if args.files is not None else changed_html_files(args.base_sha, args.head_sha)
    if not files:
        print("no changed .html files; nothing to do")
        return 0

    brain_titles = load_brain_titles()
    fired, skipped, errors = [], [], 0

    user = os.environ.get("ADMIN_USER")
    password = os.environ.get("ADMIN_PASSWORD")
    need_creds = not args.dry_run

    for content_id, url, title, reason in qualify(files, brain_titles):
        if reason:
            skipped.append((content_id, reason))
            continue
        if args.dry_run:
            print(f"WOULD fire: content_id={content_id} url={url} title={title!r}")
            fired.append(content_id)
            continue
        if not user or not password:
            print("error: set ADMIN_USER and ADMIN_PASSWORD in the environment", file=sys.stderr)
            return 2
        try:
            data = post_article(args.api_base, user, password, content_id, title, url)
            tag = "recorded" if data.get("recorded") else "already-recorded (no re-notify)"
            print(f"fired: content_id={content_id} -> {tag}, premium_recipients={data.get('premiumRecipients', 0)}")
            fired.append(content_id)
        except RuntimeError as e:
            print(f"error: content_id={content_id} :: {e}", file=sys.stderr)
            errors += 1

    print(f"\nsummary: {len(fired)} fired, {len(skipped)} skipped, {errors} error(s)")
    for cid, reason in skipped:
        print(f"  skip {cid}: {reason}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
