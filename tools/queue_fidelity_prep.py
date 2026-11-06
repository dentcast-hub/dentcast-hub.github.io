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

The default content_id is the next free number of the item's category on this
checkout (a temporary id; publish day takes the live one). texts.json is the
shape des_fidelity_units.py reads (tools/pdf_source_text.py writes it).
"""
import argparse
import json
import re
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
    ap.add_argument("item")
    ap.add_argument("--content-id", help="temporary content_id (default: the next free one of the category)")
    ap.add_argument("--texts", help="texts.json for --build (DOI or S<n> → source_text, text_basis)")
    ap.add_argument("--checkout", help="an existing throwaway copy (marker, no .git) instead of a new one")
    ap.add_argument("--build", help="where the input blocks go (default: <work>/blocks)")
    a = ap.parse_args(argv)
    item = Path(a.item).resolve()
    if not item.is_dir():
        return fail("ITEM_NOT_FOUND", f"{a.item} is not a queue item folder")
    cid = a.content_id or default_content_id(item)
    if not cid:
        return fail("CATEGORY_UNSUPPORTED", f"{item.name}: no queue template for this folder's category")
    if a.checkout:
        copy = Path(a.checkout).resolve()
        work = copy.parent
    else:
        work = Path(tempfile.mkdtemp(prefix="dentcast-fidelity-prep-"))
        copy = make_copy(work / "checkout")
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
    receipt = {"status": "prepared", "not_for_publish": True, "checkout": str(copy), "content_id": cid,
               "page": f"{copy / cid}.html", "draft_placeholders": draft.get("placeholders"),
               "scope": units["mode"], "units": len(units["units"]),
               "plan": {k: len(v) for k, v in units["plan"].items()},
               "units_tool": str(copy / "tools/des_fidelity_units.py"), "blocks": []}
    swept = (copy / ".dentcast/des-fidelity-plans" / f"{cid}.json").exists()
    if a.texts and units.get("sources", 1) >= 2 and units["mode"] == "SOURCE" and not swept:
        # module 08 Part 2c: on a multi-source page the orphan sweep runs first;
        # no checker block is built until every sentence's source is settled
        out = Path(a.build).resolve() if a.build else work / "blocks"
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
