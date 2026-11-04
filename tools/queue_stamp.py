#!/usr/bin/env python3
"""Stamp a publish-queue item before its freeze: provenance, SHA256SUMS, manifest.

publish-queue.md «اصول» 4 and 13 and «گذر پایانی»: when the final pass and the
independent review are closed, three mechanical things remain, always the same,
and this tool does them in that order:

  1. **Provenance of 11-لینک‌های-گلاسری.md.** The full SHA of the main commit the
     link analysis read, and the sha256 of `glossary/glossary.json` and
     `dentcast-brain.json` at that commit (read with `git show`, never from a
     working tree that may differ). Written into the placeholders
     `{{main_sha}}`, `{{glossary_sha256}}`, `{{brain_sha256}}` of 11's header
     when present; otherwise only reported (nothing guessed into prose).
  2. **SHA256SUMS** regenerated: every file of the item except `00-وضعیت.md`
     and `SHA256SUMS` itself, `sha256sum` format, sorted.
  3. **12-انتشار.json against the files**, through queue_manifest.py: the
     fresh sums check, the manifest draft and its missing fields, every image
     file named, and the title/caption equal to 02 when 02 reads.

The status line («آماده») is the agent's own edit in 00-وضعیت.md after this
tool succeeds; approvals stay only in 00's table (other files cite «تأیید #k»).

    python3 tools/queue_stamp.py <queue-item> [--repo <main checkout>] [--ref origin/main] [--dry-run]

Exit 0 complete, 4 incomplete (missing fields listed), 2 refused.
"""
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import queue_manifest as qm  # noqa: E402
from queue_manifest import QueueRefusal  # noqa: E402

LINKS_FILE = "11-لینک‌های-گلاسری.md"
PROVENANCE = {"main_sha": None, "glossary_sha256": "glossary/glossary.json", "brain_sha256": "dentcast-brain.json"}
EXCLUDED = {qm.STATUS_FILE, "SHA256SUMS"}


def git(repo, *args, binary=False):
    r = subprocess.run(["git", "-C", str(repo), *args], capture_output=True)
    if r.returncode != 0:
        raise QueueRefusal("GIT", f"git {' '.join(args)} failed: {r.stderr.decode('utf-8', 'replace').strip()[:200]}")
    return r.stdout if binary else r.stdout.decode("utf-8").strip()


def provenance(repo, ref):
    """{main_sha, glossary_sha256, brain_sha256} at `ref` of `repo`."""
    sha = git(repo, "rev-parse", "--verify", f"{ref}^{{commit}}")
    out = {"ref": ref, "main_sha": sha}
    for key, rel in PROVENANCE.items():
        if rel:
            out[key] = hashlib.sha256(git(repo, "show", f"{sha}:{rel}", binary=True)).hexdigest()
    return out


def stamp_links(item, prov, write):
    """Fill the placeholders of 11's header; report when there are none."""
    p = item / LINKS_FILE
    if not p.exists():
        return {"file": LINKS_FILE, "status": "absent"}
    text = p.read_text(encoding="utf-8")
    new, filled = text, []
    for key in PROVENANCE:
        ph = "{{" + key + "}}"
        if ph in new:
            new = new.replace(ph, prov[key])
            filled.append(key)
    present = [k for k in PROVENANCE if prov[k] in text]
    if filled and write:
        p.write_text(new, encoding="utf-8")
    status = "stamped" if filled else ("already_stamped" if len(present) == len(PROVENANCE) else "no_placeholders")
    return {"file": LINKS_FILE, "status": status, "filled": filled,
            "note": None if filled or status == "already_stamped" else
            "11 has no {{main_sha}}/{{glossary_sha256}}/{{brain_sha256}} placeholders: copy the reported values "
            "into its header by hand (or add the placeholders and rerun)"}


def sums_text(item):
    rows = []
    for p in sorted(item.rglob("*")):
        rel = p.relative_to(item).as_posix()
        if p.is_file() and rel not in EXCLUDED and not any(part.startswith(".") for part in p.relative_to(item).parts):
            rows.append(f"{hashlib.sha256(p.read_bytes()).hexdigest()}  {rel}\n")
    return "".join(rows)


def verify_manifest(item):
    """queue_manifest's own check, minus the status gate (the item is not «آماده» yet)."""
    sums = qm.check_sums(item)
    d = qm.draft(item)
    miss = qm.missing(d)
    problems = []
    m = qm.plain(d)
    for img in m.get("images") or []:
        f = img.get("file")
        if f and not (item / f).is_file():
            problems.append(f"images.{img.get('n')}.file: {f} is not in the item")
    if d["_source"]["value"] == "manifest":
        l02 = qm.lines_of(item, "02-عنوان-کپشن.md") or []
        for key, head in (("title_fa", "عنوان"), ("caption_fa", "کپشن")):
            sv = qm.single_value(qm.section_any(l02, head))
            if sv and m.get(key) is not None and m[key] != sv[1]:
                problems.append(f"{key}: 12-انتشار.json differs from 02-عنوان-کپشن.md:{sv[0]}")
    return {"source": d["_source"]["value"], "checked": len(sums["checked"]), "missing": miss, "problems": problems}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("item")
    ap.add_argument("--repo", default=str(ROOT), help="the main checkout the analysis read (default: this one)")
    ap.add_argument("--ref", default="origin/main", help="the main ref (default origin/main; HEAD when absent)")
    ap.add_argument("--dry-run", action="store_true", help="report only; write nothing")
    a = ap.parse_args(argv)
    item = Path(a.item).resolve()
    try:
        if not item.is_dir():
            raise QueueRefusal("ITEM_NOT_FOUND", f"{a.item} is not a queue item folder")
        ref = a.ref
        try:
            git(a.repo, "rev-parse", "--verify", f"{ref}^{{commit}}")
        except QueueRefusal:
            if a.ref != "origin/main":
                raise
            ref = "HEAD"
        prov = provenance(a.repo, ref)
        links = stamp_links(item, prov, write=not a.dry_run)
        sums = sums_text(item)
        if not a.dry_run:
            (item / "SHA256SUMS").write_text(sums, encoding="utf-8")
        manifest = verify_manifest(item) if not a.dry_run else None
    except QueueRefusal as e:
        print(json.dumps({"status": "refused", **e.detail}, ensure_ascii=False, indent=1))
        return 2
    incomplete = bool(manifest and (manifest["missing"] or manifest["problems"]))
    print(json.dumps({"status": "dry_run" if a.dry_run else ("incomplete" if incomplete else "stamped"),
                      "provenance": prov, "links": links, "sha256sums_rows": sums.count("\n"),
                      "manifest": manifest}, ensure_ascii=False, indent=1))
    return 4 if incomplete else 0


if __name__ == "__main__":
    sys.exit(main())
