#!/usr/bin/env python3
"""Fire the DentCast Plus `article_published` event for a freshly published page.

This is the publish-flow hook (Phase E of .dentcast/workflows/README.md). It tells
the Plus API a new article exists; the API notifies premium subscribers
immediately and schedules the free digest (see plus-api/src/services/article-notify.ts).

It is SAFE TO RE-RUN: the API records each article idempotently by content_id, so a
second call (or a re-deploy) is a no-op and never re-notifies. Delivery only reaches
users who opted into "نوتیف مطلب جدید" and have a push subscription; everyone else is
skipped silently.

Usage:
    python tools/notify_new_article.py --url /insight/insight-1.html --title "عنوان مطلب"
    python tools/notify_new_article.py --url https://dentcast.org/notecast/n-33.html \
        --title "..." [--content-id notecast/n-33] [--published-at 2026-07-16T09:00:00Z]

content_id defaults to the URL path minus the leading slash and ".html" (identical to
the client's detectContentId), so normally you only pass --url and --title.

Config via environment:
    PLUS_API_BASE   default https://api.dentcast.org
    ADMIN_USER      HTTP Basic user  (same as the /admin KPI page)
    ADMIN_PASSWORD  HTTP Basic password
"""
import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from urllib.parse import urlparse


def to_path(url: str) -> str:
    """Root-relative page path. An absolute URL is reduced to its pathname so the
    notification link resolves on whichever origin the subscriber is on (.org/.ir)."""
    if url.startswith("http://") or url.startswith("https://"):
        url = urlparse(url).path
    if not url.startswith("/"):
        url = "/" + url
    return url


def content_id_from_path(path: str) -> str:
    """Mirror the client's detectContentId: strip leading slash + trailing .html."""
    cid = path.lstrip("/")
    if cid.lower().endswith(".html"):
        cid = cid[: -len(".html")]
    return cid or "index"


def post_article(api_base, user, password, content_id, title, url, published_at=None, timeout=20):
    """POST the article_published event. Returns the parsed JSON response dict.
    Raises RuntimeError on any HTTP/network failure. Shared by the single-page CLI
    and the git-range detector (tools/notify_new_articles.py)."""
    payload = {"content_id": content_id, "title": title, "url": url}
    if published_at:
        payload["published_at"] = published_at
    endpoint = api_base.rstrip("/") + "/admin/articles/published"
    token = base64.b64encode(f"{user}:{password}".encode("utf-8")).decode("ascii")
    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={"content-type": "application/json", "authorization": "Basic " + token},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{e.code} {e.reason} :: {e.read().decode('utf-8', 'replace')}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"could not reach {endpoint} :: {e.reason}") from e


def main() -> int:
    p = argparse.ArgumentParser(description="Fire the Plus article_published event.")
    p.add_argument("--url", required=True, help="page URL or root-relative path")
    p.add_argument("--title", required=True, help="article title (Persian)")
    p.add_argument("--content-id", help="override; defaults to the URL path minus .html")
    p.add_argument("--published-at", help="ISO timestamp; defaults to now on the server")
    p.add_argument("--api-base", default=os.environ.get("PLUS_API_BASE", "https://api.dentcast.org"))
    args = p.parse_args()

    user = os.environ.get("ADMIN_USER")
    password = os.environ.get("ADMIN_PASSWORD")
    if not user or not password:
        print("error: set ADMIN_USER and ADMIN_PASSWORD in the environment", file=sys.stderr)
        return 2

    path = to_path(args.url)
    content_id = args.content_id or content_id_from_path(path)
    try:
        data = post_article(
            args.api_base, user, password, content_id, args.title, path, args.published_at
        )
    except RuntimeError as e:
        print(f"error: {e}", file=sys.stderr)
        return 1

    payload = {"content_id": content_id}
    recorded = data.get("recorded")
    print(
        f"article_published: content_id={payload['content_id']} "
        f"recorded={recorded} premium_recipients={data.get('premiumRecipients', 0)}"
        + ("" if recorded else "  (already recorded earlier - no re-notify)")
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
