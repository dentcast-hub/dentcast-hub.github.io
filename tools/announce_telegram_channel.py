#!/usr/bin/env python3
"""Post a one-line announcement to the DentCast Telegram channel for each newly
published page — title, one-line description, link. One message per item.

Engine behind the "Announce new content in Telegram" step of
`.github/workflows/notify-new-articles.yml`. It runs on GitHub's runners, NOT on
our own server — which matters: `api.telegram.org` is unreachable from the API
container in Iran (ArvanCloud confirmed the national filtering on 2026-07-27), so
the Plus notification channel cannot use Telegram at all. A GitHub runner sits
outside that block, so this path works where that one does not. Do not "simplify"
this later by moving it into the API.

A page is announced only when ALL of these hold:

  1. It is NEW, not an edit. "New" = the commit that ADDED the file is inside the
     push range. Git history is the signal rather than a state file or a date
     field, because an edit to a published page keeps every field it had and
     would otherwise re-announce it forever.
  2. It carries the publish marker `<meta name="dc-notify" content="true">` —
     the same editorial gate `tools/notify_new_articles.py` uses, so "published"
     means one thing in this repo, not two. This gate is doing real work: a
     publish also adds an English mirror under `<type>/en/…`, which is a new file
     too and would otherwise double-post every item. EXCEPTION: `glossary` and
     `litecast` never get the marker (`.dentcast/workflows/README.md` says so
     explicitly), so for those two the newness gate stands alone.

Title and description come from `dentcast-brain.json` (the repo's source of
truth: `title` + `caption`, the Pulse sentence), falling back to the page's own
<title> / meta description. The link is built from the page's canonical path, so
a rename that keeps the slug still links correctly.

Usage (CI):
    python tools/announce_telegram_channel.py --base-sha <before> --head-sha <after>
Usage (local):
    python tools/announce_telegram_channel.py --files insight/insight-58.html --dry-run

Environment:
    TELEGRAM_BOT_TOKEN    bot token (GitHub Actions secret) — never hardcode it
    TELEGRAM_CHANNEL_ID   channel id (-100…) or @username (GitHub Actions secret)
    SITE_BASE_URL         link origin, default https://dentcast.ir
"""
import argparse
import html
import json
import os
import re
import sys
import urllib.error
import urllib.request

# tools/ is sys.path[0] when run as `python tools/announce_telegram_channel.py`,
# so publish detection is REUSED rather than re-implemented. One definition of
# "a real publish" for the whole repo.
from notify_new_article import to_path, content_id_from_path
from notify_new_articles import (
    ZERO_SHA,
    canonical_path,
    changed_html_files,
    has_marker,
    load_brain_titles,
    run_git,
)

# Persian titles must print on any console (Windows defaults to cp1252).
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass

API = "https://api.telegram.org/bot{token}/sendMessage"

# The two types the publish router deliberately never marks (README.md, Phase E
# skip cases). For them, "new file" is the only available publish signal.
MARKERLESS_FOLDERS = {"glossary", "litecast"}

DESC_RE = re.compile(
    r'<meta\b[^>]*\bname=["\']description["\'][^>]*\bcontent=["\']([^"\']*)["\']',
    re.IGNORECASE)


def meta_description(page_html):
    """The page's own <meta name="description"> — fallback when the brain has no
    caption for this page (older entries, or a type that carries no Pulse line)."""
    m = DESC_RE.search(page_html)
    return m.group(1).strip() if m else None


def one_line(text, limit=200):
    """One short line, cut on a sentence boundary.

    The brain's `caption` is not one shape: for a Promptologist episode it is a
    single line, for an Insight it is a full ~1500-character summary. Posting the
    long one verbatim buries the link under a wall of text, so cut at the last
    sentence end before the limit — falling back to the last word — and mark the
    cut so nobody mistakes it for the whole thing.

    KEEP IN STEP with `teaser()` in plus-api/src/services/article-notify.ts: the
    Plus push notifications are cut by a port of this function, so the channel
    post and the push read the same. A change to the limit, the sentence-end set
    or the fallback belongs in both."""
    if not text:
        return None
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    window = text[:limit]
    cut = max(window.rfind(c) for c in ".؟!؛?")
    if cut < limit // 3:                      # no usable sentence end: cut on a word
        cut = window.rfind(" ")
    if cut <= 0:
        cut = limit
    return window[:cut + 1].rstrip() + " …"


def push_commits(base_sha, head_sha):
    """The set of commits this push introduced. Falls back to the head commit
    alone when base is missing/zero (first push, force-push, shallow clone) —
    same tolerance as the existing notifier."""
    valid_base = base_sha and base_sha != ZERO_SHA and run_git(
        ["cat-file", "-t", base_sha]).strip() == "commit"
    args = ["rev-list", f"{base_sha}..{head_sha}"] if valid_base else ["rev-list", head_sha, "-1"]
    return {line.strip() for line in run_git(args).splitlines() if line.strip()}


def added_in_range(base_sha, head_sha):
    """Files ADDED in this push, in ONE git call.

    The per-file history check below is exact but costs a process each; a routine
    push here can touch 726 files (the site-wide asset version bump), and paying
    726 subprocess spawns to discover that none of them are new is not acceptable
    in CI. So: narrow with one diff, then verify only the handful that survive."""
    valid_base = base_sha and base_sha != ZERO_SHA and run_git(
        ["cat-file", "-t", base_sha]).strip() == "commit"
    if valid_base:
        out = run_git(["diff", "--name-only", "--diff-filter=A", base_sha, head_sha])
    else:
        out = run_git(["show", "--pretty=", "--name-only", "--diff-filter=A", head_sha])
    return {line.strip() for line in out.splitlines() if line.strip()}


def first_added_sha(path):
    """The commit that first ADDED this file, or None. `git log` is newest-first,
    so the last line is the earliest add — which also makes a delete/re-add
    resolve to the ORIGINAL publish rather than looking new again."""
    lines = [l.strip() for l in run_git(
        ["log", "--diff-filter=A", "--format=%H", "--", path]).splitlines() if l.strip()]
    return lines[-1] if lines else None


def build_message(title, description, url):
    """Title (bold) + one-line description + link. HTML parse mode with
    everything escaped: a Persian title containing & or < would otherwise make
    Telegram reject the whole send with a 400 and the item would vanish."""
    lines = [f"<b>{html.escape(title)}</b>"]
    if description:
        lines.append(html.escape(description))
    lines.append(html.escape(url))
    return "\n\n".join(lines)


def send_message(token, chat_id, text, timeout=20):
    payload = json.dumps({
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
    }).encode("utf-8")
    req = urllib.request.Request(
        API.format(token=token), data=payload,
        headers={"content-type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:300]
        # Telegram puts the real reason in the body ("chat not found", "bot is not
        # a member of the channel chat"), never in the status alone.
        raise RuntimeError(f"HTTP {e.code}: {body}") from None
    except urllib.error.URLError as e:
        raise RuntimeError(f"network error: {e.reason}") from None


def candidates(files, commits, brain_titles, brain_captions):
    """Yield (content_id, url_path, title, description, skip_reason).
    skip_reason is None when the item should be announced.

    `commits` = {"shas", "added"} for a push, or None for a manual run with an
    explicit file list, which skips the newness gate entirely (the caller chose
    those files on purpose). The gate lives here rather than in the caller so a
    skipped item can never escape half-populated."""
    for f in files:
        if not os.path.isfile(f):
            yield (f, None, None, None, "file no longer exists")
            continue

        if commits is not None:
            # Cheap gate first (one diff for the whole push), then the exact one:
            # a file deleted and re-added later must resolve to its ORIGINAL
            # publish, or a rename would re-announce old content as new.
            if f not in commits["added"] or first_added_sha(f) not in commits["shas"]:
                yield (f, None, None, None, "not new (edit to existing content)")
                continue

        page_html = open(f, encoding="utf-8", errors="replace").read()
        path = canonical_path(page_html)
        if not path:
            yield (f, None, None, None, "no canonical link")
            continue

        content_id = content_id_from_path(path)
        folder = content_id.split("/", 1)[0]
        if folder not in MARKERLESS_FOLDERS and not has_marker(page_html):
            yield (content_id, path, None, None, "no dc-notify marker (draft or en-mirror)")
            continue

        title = brain_titles.get(path) or content_id
        description = one_line(brain_captions.get(path) or meta_description(page_html))
        yield (content_id, path, title, description, None)


def main():
    p = argparse.ArgumentParser(description="Announce new publishes in the Telegram channel.")
    p.add_argument("--base-sha", default=os.environ.get("GITHUB_EVENT_BEFORE", ""))
    p.add_argument("--head-sha", default=os.environ.get("GITHUB_SHA", "HEAD"))
    p.add_argument("--files", nargs="*", help="explicit file list (bypasses git diff; for testing)")
    p.add_argument("--site-base", default=os.environ.get("SITE_BASE_URL", "https://dentcast.ir"))
    p.add_argument("--dry-run", action="store_true", help="detect and print, send nothing")
    args = p.parse_args()

    files = args.files if args.files is not None else changed_html_files(args.base_sha, args.head_sha)
    if not files:
        print("no changed .html files; nothing to announce")
        return 0

    brain_titles, brain_captions = load_brain_titles()
    # None = manual run with an explicit file list: trust the caller about newness
    # rather than skipping everything they asked for.
    commits = None if args.files is not None else {
        "shas": push_commits(args.base_sha, args.head_sha),
        "added": added_in_range(args.base_sha, args.head_sha),
    }

    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    channel = os.environ.get("TELEGRAM_CHANNEL_ID")
    if not args.dry_run and (not token or not channel):
        print("TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL_ID not set; skipping Telegram announcements.")
        return 0

    sent, skipped, errors = [], [], 0
    # One message per item, in publish order — never a batched summary: each item
    # gets its own link preview, and a reader can forward or reply to one alone.
    for cid, path, title, desc, reason in candidates(files, commits, brain_titles, brain_captions):
        if reason:
            skipped.append((cid, reason))
            continue

        url = args.site_base.rstrip("/") + to_path(path)
        text = build_message(title, desc, url)
        if args.dry_run:
            print(f"WOULD post:\n{text}\n")
            sent.append(cid)
            continue
        try:
            send_message(token, channel, text)
            print(f"posted: {cid}")
            sent.append(cid)
        except RuntimeError as e:
            print(f"error: {cid} :: {e}", file=sys.stderr)
            errors += 1

    print(f"\nsummary: {len(sent)} posted, {len(skipped)} skipped, {errors} error(s)")
    for cid, reason in skipped:
        print(f"  skipped {cid}: {reason}")
    # A push with nothing new is a normal, silent success. A send that actually
    # failed is not: it exits non-zero so a bad token or wrong channel id shows up
    # red in the Actions log instead of quietly dropping announcements.
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
