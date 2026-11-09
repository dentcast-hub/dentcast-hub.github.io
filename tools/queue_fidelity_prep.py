#!/usr/bin/env python3
"""Prepare a publish-queue item's FIDELITY inputs in a throwaway copy.

publish-queue.md «آماده‌سازی» (DES and Fidelity, module 08 Part 2b): the units a
FIDELITY call judges are cut from the page publish day will build, by
tools/des_fidelity_units.py, never by hand. During preparation there is no
page yet, so this tool:

  1. makes a throwaway copy of the repository (`git archive HEAD`, no `.git`,
     a `.dentcast-throwaway` marker) — or reuses one given with --checkout;
  2. runs the copy's `queue_apply.py <item> <content_id> --draft --throwaway`
     (draft page + the item's DES record from 05-DES-Fidelity/des.json);
  3. runs the copy's `des_fidelity_units.py <content_id> --json` (scope, unit
     count, plan) and, with --texts, `--texts T --build DIR` (one input block
     per call);
  4. prints one JSON receipt with every path.

Nothing is written to this checkout or to the queue branch. The copy is never
a publish (queue_apply refuses --draft anywhere else).

    python3 tools/queue_fidelity_prep.py ../dentcast-queue/queue/NN-sharehub-slug \\
        [--content-id sharehub/share-46] [--texts texts.json] [--checkout DIR] [--build DIR]
    python3 tools/queue_fidelity_prep.py --cleanup WORK_DIR [WORK_DIR ...]   # the literal path(s) of the receipt
    python3 tools/queue_fidelity_prep.py --cleanup --all

The work directory (`dentcast-fidelity-prep-*` under the temp dir: the copy, the
blocks, the checker outputs) is a full copy of the site, so it is not left
behind: a new run for the same item replaces that item's older work directories
(a rerun means a fresh draft), and `--cleanup` removes the named work
directories, or with `--all` every one under the temp dir, once the FIDELITY
record is stored in 05-DES-Fidelity/ (publish-queue.md, step 5). Removal is
Python's shutil.rmtree on a directory that passes is_work_dir(): the
`dentcast-fidelity-prep-` prefix, this tool's prep.json, the throwaway marker
in checkout/, no `.git`, no symlink. No shell `rm` is run, and `--cleanup`
with no path refuses (CLEANUP_TARGET) instead of sweeping, so an empty shell
variable never widens it. Run the receipt's `cleanup` line as printed (one
line, literal path), not inside a multi-line script with variables.

The default content_id is the next free number of the item's category on this
checkout (a temporary id; publish day takes the live one). texts.json is the
shape des_fidelity_units.py reads (tools/pdf_source_text.py writes it).
"""
import argparse
import datetime
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import queue_apply as qa  # noqa: E402


def fail(code, message, **detail):
    print(json.dumps({"status": "refused", "code": code, "message": message, **detail}, ensure_ascii=False, indent=1))
    return 2


PREFIX = "dentcast-fidelity-prep-"
NOTE = "prep.json"


def is_work_dir(p):
    """A work directory this tool made: prefix, a marked copy, no .git, no symlink on the way — nothing else is
    ever removed."""
    p = Path(p)
    return (p.is_dir() and not p.is_symlink() and p.name.startswith(PREFIX) and _note_ok(p)
            and not (p / "checkout").is_symlink()
            and (p / "checkout" / qa.THROWAWAY_MARKER).is_file() and not (p / "checkout" / ".git").exists())


def _note_ok(p):  # the note this tool writes beside the copy (prep.json) is a plain file
    return (p / NOTE).is_file() and not (p / NOTE).is_symlink()


def work_dirs(tmp=None):
    return sorted(d for d in Path(tmp or tempfile.gettempdir()).glob(PREFIX + "*") if is_work_dir(d))


def supersede(item, tmp=None):
    """Remove this item's older work directories (a new run is a fresh draft); returns what went."""
    gone = []
    for d in work_dirs(tmp):
        try:
            note = json.loads((d / NOTE).read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if note.get("item") == str(item):
            shutil.rmtree(d, ignore_errors=True)
            gone.append(str(d))
    return gone


def cleanup(paths, tmp=None):
    """--cleanup: remove the named work directories, or all of them; refuse anything that is not one."""
    removed, skipped = [], []
    targets = [Path(p).resolve() for p in paths] if paths else work_dirs(tmp)
    for d in targets:
        if is_work_dir(d):
            shutil.rmtree(d, ignore_errors=True)
            removed.append(str(d))
        else:
            skipped.append({"path": str(d), "reason": "not a throwaway work directory of this tool"})
    print(json.dumps({"status": "cleaned", "removed": removed, "skipped": skipped}, ensure_ascii=False, indent=1))
    return 0 if not skipped else 2


def package_warnings(item, units):
    """publish-queue.md «محتوای هر پوشه», 05-DES-Fidelity: des.json is {"scored_at", "sources"}; plan.json exists
    only when the units tool recorded a plan (a multi-source sweep, a founder plan). Said here, not in silence."""
    import queue_stamp as qs  # noqa: PLC0415
    out = []
    qs.check_des_package(item, out, out)
    pp = item / qs.PLAN
    if pp.is_file() and units.get("sources", 1) < 2:
        try:
            plan = json.loads(pp.read_text(encoding="utf-8"))
        except ValueError:
            plan = {}
        if not (isinstance(plan, dict) and plan.get("sweep")) and (plan or {}).get("origin") != "founder":
            out.append(f"{qs.PLAN}: a one-source page has no orphan sweep (module 08, single-source tier) — "
                       "delete plan.json; the tool gives every unit to the one source")
    return list(dict.fromkeys(out))


def make_copy(dest):
    dest.mkdir(parents=True, exist_ok=False)
    arch = subprocess.run(["git", "-C", str(ROOT), "archive", "--format=tar", "HEAD"], capture_output=True, check=True)
    subprocess.run(["tar", "-x", "-C", str(dest)], input=arch.stdout, check=True)
    (dest / qa.THROWAWAY_MARKER).write_text("throwaway copy for queue preparation — never a publish\n", encoding="utf-8")
    return dest


def default_content_id(item):
    m = re.fullmatch(r"\d\d-([a-z]+)-.+", item.name)
    if not m or m.group(1) not in qa.CATEGORIES:
        return None
    c = qa.CATEGORIES[m.group(1)]
    return f"{c['dir']}/{c['stem']}{qa.next_number(m.group(1))[0]}"


def run_json(cmd, cwd):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    try:
        out = json.loads(r.stdout) if r.stdout.strip().startswith(("{", "[")) else None
    except ValueError:
        out = None
    return r, out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("paths", nargs="*", help="the queue item folder; with --cleanup, work directories (none: all)")
    ap.add_argument("--cleanup", action="store_true",
                    help="remove throwaway work directories (after the FIDELITY record is stored in 05)")
    ap.add_argument("--all", action="store_true",
                    help="with --cleanup: every work directory of this tool under the temp dir")
    ap.add_argument("--content-id", help="temporary content_id (default: the next free one of the category)")
    ap.add_argument("--texts", help="texts.json for --build (DOI or S<n> → source_text, text_basis)")
    ap.add_argument("--checkout", help="an existing throwaway copy (marker, no .git) instead of a new one")
    ap.add_argument("--build", help="where the input blocks go (default: <work>/blocks)")
    ap.add_argument("--sweep-first", action="store_true",
                    help="optional on a multi-source page (module 08 Part 2c, founder 2026-11-09): hand every body "
                         "sentence to the stronger reviewer before the checker runs; without it the blocks are built "
                         "from the markers' assignment at once")
    a = ap.parse_args(argv)
    if a.cleanup:
        # an empty shell variable must never widen the scope: a sweep of every
        # work directory is asked for by name (--all), never implied by no path
        if not a.paths and not a.all:
            return fail("CLEANUP_TARGET", "give the work directory the receipt printed (its literal path), "
                        "or --all for every work directory of this tool under the temp dir")
        if a.paths and a.all:
            return fail("CLEANUP_TARGET", "give work directories or --all, not both")
        return cleanup(a.paths)
    if len(a.paths) != 1:
        return fail("ITEM_REQUIRED", "give exactly one queue item folder (or --cleanup)")
    item = Path(a.paths[0]).resolve()
    if not item.is_dir():
        return fail("ITEM_NOT_FOUND", f"{a.paths[0]} is not a queue item folder")
    cid = a.content_id or default_content_id(item)
    if not cid:
        return fail("CATEGORY_UNSUPPORTED", f"{item.name}: no queue template for this folder's category")
    if a.checkout:
        copy = Path(a.checkout).resolve()
        work = copy.parent
    else:
        superseded = supersede(item)
        work = Path(tempfile.mkdtemp(prefix=PREFIX))
        copy = make_copy(work / "checkout")
        (work / NOTE).write_text(json.dumps({"item": str(item), "content_id": cid,
                                             "created": datetime.datetime.now().isoformat(timespec="seconds")},
                                            ensure_ascii=False) + "\n", encoding="utf-8")
    if not (copy / qa.THROWAWAY_MARKER).is_file() or (copy / ".git").exists():
        return fail("NOT_THROWAWAY", f"{copy} is not a throwaway copy ({qa.THROWAWAY_MARKER}, no .git)")
    py = sys.executable
    r, draft = run_json([py, str(copy / "tools/queue_apply.py"), str(item), cid, "--draft", "--throwaway"], copy)
    if r.returncode != 0 or not draft or draft.get("status") != "draft":
        return fail("DRAFT_FAILED", "queue_apply.py --draft refused or failed", output=draft or r.stdout[-2000:],
                    stderr=r.stderr[-2000:], checkout=str(copy))
    if not draft.get("des_record"):
        return fail("DES_PACKAGE_MISSING", "05-DES-Fidelity/des.json is missing: the SOURCE records come first "
                    "(module 08 Part 2), then the FIDELITY units", checkout=str(copy), page=f"{copy / cid}.html")
    r, units = run_json([py, str(copy / "tools/des_fidelity_units.py"), cid, "--json"], copy)
    if r.returncode != 0 or not units:
        return fail("UNITS_FAILED", "des_fidelity_units.py --json failed", stderr=r.stderr[-2000:], checkout=str(copy))
    receipt = {"status": "prepared", "not_for_publish": True, "checkout": str(copy), "work": str(work),
               "cleanup": f"python3 tools/queue_fidelity_prep.py --cleanup {work}", "cleanup_when": "after Part 4", "content_id": cid,
               "page": f"{copy / cid}.html", "draft_placeholders": draft.get("placeholders"),
               "scope": units["mode"], "units": len(units["units"]),
               "plan": {k: len(v) for k, v in units["plan"].items()},
               "units_tool": str(copy / "tools/des_fidelity_units.py"), "blocks": []}
    if not a.checkout and superseded:
        receipt["superseded_removed"] = superseded
    warn = package_warnings(item, units)
    if warn:
        receipt["warnings"] = warn
    swept = (copy / ".dentcast/des-fidelity-plans" / f"{cid}.json").exists()
    if a.sweep_first and a.texts and units.get("sources", 1) >= 2 and units["mode"] == "SOURCE" and not swept:
        # module 08 Part 2c: the orphan sweep is optional (founder 2026-11-09);
        # asked for, it runs before any checker block is built
        out = Path(a.build).resolve() if a.build else work / "blocks"
        out.mkdir(parents=True, exist_ok=True)
        r = subprocess.run([py, str(copy / "tools/des_fidelity_units.py"), cid, "--texts", str(Path(a.texts).resolve()),
                            "--orphans", str(out)], cwd=copy, capture_output=True, text=True)
        if r.returncode != 0:
            return fail("ORPHANS_FAILED", "des_fidelity_units.py --orphans refused", stderr=r.stderr[-2000:],
                        checkout=str(copy))
        receipt["sweep_first"] = str(out / "orphans-input.json")
        receipt["next"] = (f"stronger reviewer writes {out / 'orphans.json'}; then, in the checkout, "
                           f"units_tool {cid} --sweep {out} and units_tool {cid} --texts <texts.json> --build <dir>")
        print(json.dumps(receipt, ensure_ascii=False, indent=1))
        return 0
    if a.texts:
        out = Path(a.build).resolve() if a.build else work / "blocks"
        r = subprocess.run([py, str(copy / "tools/des_fidelity_units.py"), cid, "--texts", str(Path(a.texts).resolve()),
                            "--build", str(out)], cwd=copy, capture_output=True, text=True)
        if r.returncode != 0:
            return fail("BUILD_FAILED", "des_fidelity_units.py --build refused", stderr=r.stderr[-2000:],
                        checkout=str(copy))
        receipt["blocks"] = [l for l in r.stdout.splitlines() if l.strip()]
        receipt["build_dir"] = str(out)
    print(json.dumps(receipt, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
