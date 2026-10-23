"""Pure pre-first-cut scope and approval guards for connected publishing.

These guards validate declared, reviewed facts. They cannot manufacture founder
approval, infer omitted related pages, or replace the active publishing modules.
Only metadata is stored in canonical v3 context.decisions (no schema fork).
"""
from html.parser import HTMLParser
from pathlib import PurePosixPath
import posixpath
from urllib.parse import urlsplit, unquote
import re

import dentcast_publish_handoff as h

LEAD = "first_cut_lead_provenance_v1"
SCOPE = "first_cut_scope_audit_v1"
APPROVAL_SCOPE = "authored-intro"
WEBP_HEADER = (b"VP8 ", b"VP8L", b"VP8X")


def need(value, reason):
    h.require(bool(value), reason)


def only_decision(publication, kind):
    found = [d for d in publication["context"]["decisions"]
             if isinstance(d, dict) and d.get("kind") == kind]
    need(len(found) == 1, "FIRST_CUT_DECLARATION_REQUIRED:" + kind)
    return found[0]


def validate_lead_provenance(publication):
    """Require a real lead-origin declaration and approval for agent-authored text."""
    lead = only_decision(publication, LEAD)
    need(set(lead) == {"kind", "origin", "source_ref", "evidence"}
         and lead["origin"] in ("author_original", "agent_authored", "not_applicable")
         and h.nonempty(lead["source_ref"])
         and isinstance(lead["evidence"], list)
         and lead["evidence"] and all(h.nonempty(s) for s in lead["evidence"]),
         "FIRST_CUT_LEAD_PROVENANCE_INVALID")
    if lead["origin"] == "agent_authored":
        approvals = [a for a in publication["context"]["approvals"]
                     if a["scope"] == APPROVAL_SCOPE]
        need(len(approvals) == 1
             and approvals[0]["status"] == "confirmed"
             and h.nonempty(approvals[0]["decision"])
             and approvals[0]["evidence"],
             "AGENT_LEAD_EXPLICIT_FOUNDER_APPROVAL_REQUIRED")
    return lead


def validate_declarations(publication):
    """Require explicit review of lead provenance and first-cut write scope."""
    validate_lead_provenance(publication)
    audit = only_decision(publication, SCOPE)
    need(set(audit) == {"kind", "landing_path", "landing_mode",
                        "builder_ref", "related_changed_paths",
                        "observed_changed_paths", "evidence"},
         "FIRST_CUT_SCOPE_AUDIT_FIELDS")
    path = audit["landing_path"]
    page_dir = publication["content_id"].split("/", 1)[0]
    expected = "episodes.html" if page_dir == "episodes" else page_dir + "/index.html"
    need(path == expected, "FIRST_CUT_LANDING_IDENTITY")
    need(audit["landing_mode"] in ("included", "generated_later", "client_render")
         and h.nonempty(audit["builder_ref"])
         and isinstance(audit["evidence"], list) and audit["evidence"]
         and all(h.nonempty(e) for e in audit["evidence"]),
         "FIRST_CUT_LANDING_REVIEW_REQUIRED")
    targets = set(publication["target_paths"])
    if audit["landing_mode"] == "included":
        need(path in targets, "FIRST_CUT_LANDING_NOT_DECLARED:" + path)
    else:
        need(path not in targets, "FIRST_CUT_LANDING_MODE_CONTRADICTS_SCOPE")
    for key in ("related_changed_paths", "observed_changed_paths"):
        entries = audit[key]
        need(isinstance(entries, list) and len(entries) == len(set(entries)),
             "FIRST_CUT_AUDIT_PATHS_INVALID:" + key)
        for name in entries:
            h.relative_path(name)
            need(name in targets, "FIRST_CUT_CHANGED_PATH_NOT_DECLARED:" + name)
    need(publication["content_id"] + ".html" in audit["observed_changed_paths"],
         "FIRST_CUT_PAGE_NOT_OBSERVED_CHANGED")
    return audit


def is_webp(data):
    return (len(data) >= 20 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"
            and int.from_bytes(data[4:8], "little") + 8 == len(data)
            and data[12:16] in WEBP_HEADER)


def resolve_webp(raw, html_path):
    if not isinstance(raw, str) or not raw.strip():
        return None
    raw = raw.strip()
    if raw.startswith("data:"):
        return None  # Inline image bytes are already within the HTML payload.
    parsed = urlsplit(raw)
    if parsed.scheme and parsed.scheme not in ("http", "https"):
        need(False, "UNSUPPORTED_WEBP_REFERENCE")
    if parsed.netloc and parsed.hostname not in ("dentcast.org", "dentcast.ir"):
        # Third-party assets are not stored in this Git repository.
        return None
    name = unquote(parsed.path)
    if not name.lower().endswith(".webp"):
        return None
    if name.startswith("/"):
        target = name.lstrip("/")
    else:
        target = posixpath.normpath(posixpath.join(posixpath.dirname(html_path), name))
    h.relative_path(target)
    return target


class _References(HTMLParser):
    def __init__(self, html_path):
        super().__init__(convert_charrefs=True)
        self.html_path = html_path
        self.images = set()

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ("src", "data-src", "href", "poster", "content"):
                self.add(value)
            if key in ("srcset", "data-srcset") and value:
                for item in value.split(","):
                    self.add(item.strip().split(" ", 1)[0])
            if key == "style" and value:
                for item in re.findall(r"url\(\s*['\"]?([^'\")]+)", value):
                    self.add(item)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def add(self, value):
        path = resolve_webp(value, self.html_path)
        if path:
            self.images.add(path)


def referenced_webps(files):
    result = set()
    for path, body in files.items():
        if not path.lower().endswith(".html"):
            continue
        try:
            parser = _References(path)
            parser.feed(body.decode("utf-8"))
            parser.close()
        except (UnicodeError, ValueError) as exc:
            raise h.Blocked("FIRST_CUT_HTML_REF_PARSE_FAILED:" + path) from exc
        result.update(parser.images)
    return result


def validate_media(files, baseline_verifier=None):
    """Check ALL referenced local WebP (even ones absent from target_paths).

    The verifier must read the blob from the immutable expected GitHub base
    commit. No 'trust me' boolean from the manifest counts as verification.
    """
    checked = []
    for path in sorted(referenced_webps(files)):
        if path in files:
            need(is_webp(files[path]), "FIRST_CUT_INVALID_REFERENCED_WEBP:" + path)
            continue
        ok = False
        if baseline_verifier is not None:
            ok = baseline_verifier(path)
        need(ok, "FIRST_CUT_WEBP_NOT_IN_BUNDLE_OR_BASE:" + path)
        checked.append(path)
    return checked


def verify_remote_landing(publication, files, baseline_reader):
    """Independently inspect GitHub baseline category index before first cut."""
    audit = only_decision(publication, SCOPE)
    path = audit["landing_path"]
    if audit["landing_mode"] == "included":
        body = files.get(path)
        need(isinstance(body, bytes), "FIRST_CUT_LANDING_BYTES_MISSING")
        slug = publication["content_id"].rsplit("/", 1)[-1] + ".html"
        pattern = (rb"<a\b[^>]*\bhref\s*=\s*['\"][^'\"]*" +
                   re.escape(slug.encode("utf-8")) + rb"(?:[?#][^'\"]*)?['\"]")
        need(re.search(pattern, body, flags=re.I),
             "FIRST_CUT_LANDING_ENTRY_MISSING:" + path)
        return
    try:
        body = baseline_reader(path)
    except (ValueError, KeyError, OSError) as exc:
        raise h.Blocked("FIRST_CUT_LANDING_BASE_NOT_VERIFIED:" + path) from exc
    need(isinstance(body, bytes) and bool(body), "FIRST_CUT_LANDING_BASE_NOT_VERIFIED")
    # The live insight/sharehub/notecast/litecast landing pages use static li/a.
    manual_rows = re.search(rb"<li\b[^>]*>\s*<a\b[^>]*\bhref\s*=", body, re.I)
    need(not manual_rows, "MANUAL_LANDING_MUST_BE_INCLUDED_BEFORE_CUT:" + path)
