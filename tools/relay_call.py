#!/usr/bin/env python3
"""Relay route for an isolated model call (agent-parity.md «مسیر رله»).

Some agents (ChatGPT, a cloud agent with no CLI, any client without sub-agents)
cannot open a separate, tool-less context themselves, which DES/Fidelity needs:
the SOURCE call, the Fidelity sweeper, the judge, the orphan sweep and the Part 2d
audit each run in a context that has seen nothing else. The relay keeps that
independence by letting the founder carry the call: the agent packs ONE file,
the founder opens a fresh chat (a new conversation, memory off / temporary chat,
no project files), attaches it, and brings the answer back; the agent ingests it.
Nothing about the scoring changes: the system prompt and the input block are the
same bytes a CLI run would send. Claude's own route (Agent tool, `claude -p`) does
not use this.

    python3 tools/relay_call.py pack --system .dentcast/des-v3.7-knowledge.md \\
        --input DIR/input-src0.json --answer-to DIR/out-src0-1.json --out RELAY.md
    python3 tools/relay_call.py pack --system DIR/judge-system.md \\
        --input DIR/judge-input-src0.json --answer-to DIR/judge-src0.json --out RELAY.md
    python3 tools/relay_call.py pack --input DIR/orphans-input.json \\
        --answer-to DIR/orphans.json --out RELAY.md          # the block names its own answer
    python3 tools/relay_call.py ingest PASTED.txt --relay RELAY.md

One paper, one trip (founder 2026-11-25): the SOURCE call and the Fidelity sweep of the
same paper travel in ONE file and come back in ONE reply, so a page with five papers
is five trips, not fifteen:

    python3 tools/relay_call.py pack-paper --system .dentcast/des-v3.7-knowledge.md \\
        --source-block BLOCK.json --fidelity-input DIR/input-src0.json \\
        --des-to DIR/des-src0.json --fidelity-to DIR/out-src0-1.json --out RELAY.md

`ingest` then splits the reply into the two answer files. It refuses a reply whose
`citation.doi` is another paper's (the chat answered from an older context): that, and a
reply that is not JSON, are the only cases carried again. Anything else in a SOURCE
answer is repaired by tools/des_repair.py, never by a new trip.

`ingest` takes the chat's whole reply (prose or ```json fences around it are fine),
keeps the one JSON object, checks it parses and — for a Fidelity sweeper or judge
answer — that it answers every unit of the input, and writes it, unchanged, to the
path the relay names. It never edits a verdict. A RELAY.md holds the paper's text:
keep it under .dentcast/relay/ or outside the repository (pack refuses any other path inside it).
"""
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
META = re.compile(r"<!-- relay-meta (\{.*?\}) -->")

HEAD = """# One isolated call

You are run as an isolated, tool-less model call. Do not browse, search, run code or
use any file other than this one. Everything between «BEGIN SYSTEM» and «END SYSTEM»
is your instruction (your system prompt). Everything between «BEGIN INPUT» and «END
INPUT» is the only user turn. Answer exactly as the instruction says: a single raw
JSON object and nothing else — no prose before or after it.
"""


HEAD_PAPER = """# One isolated call, two tasks on one paper

You are run as an isolated, tool-less model call. Do not browse, search, run code or
use any file other than this one, and use nothing from any earlier conversation.
Everything between «BEGIN SYSTEM» and «END SYSTEM» is your instruction (your system
prompt). «BEGIN INPUT» to «END INPUT» holds one JSON object with two input blocks:

1. `task_1_source`: run the SOURCE track on it exactly as the instruction says, as if
   it were the only user turn. Do not read `task_2_fidelity` before you have finished.
2. `task_2_fidelity`: then run the FIDELITY track on it. Its `source_text` is the
   `source_text` of task 1 (it is not repeated). Nothing from task 1's score may
   change a verdict here.

Answer with a single raw JSON object and nothing else:
{"source": <the SOURCE output object>, "fidelity": <the FIDELITY output object>}
"""


def wrong_paper(obj, block):
    """The one content check ingest makes on a SOURCE answer: is it this paper's?"""
    want = re.sub(r"^https?://(dx\.)?doi\.org/", "", str(block.get("doi") or "").strip().lower())
    got = re.sub(r"^https?://(dx\.)?doi\.org/", "", str((obj.get("citation") or {}).get("doi") or "").strip().lower())
    if want and got and want != got:
        sys.exit(f"WRONG_PAPER: the reply is about {got}, this file is {want} — the chat answered from another "
                 "context. Open a NEW temporary chat with only this file and bring that reply; nothing is written")


def relay_out(a):
    out = Path(a.out).resolve()
    allowed = (ROOT / ".dentcast" / "relay").resolve()
    if ROOT.resolve() in out.parents and allowed not in out.parents:
        sys.exit("--out inside the repository must be under .dentcast/relay/ (the founder's relay folder)")
    return out


def pack_paper(a):
    out = relay_out(a)
    src_b = Path(a.source_block).read_bytes()
    fid_b = Path(a.fidelity_input).read_bytes()
    try:
        src, fid = json.loads(src_b), json.loads(fid_b)
    except ValueError as e:
        sys.exit(f"an input block is not JSON: {e}")
    if fid.get("mode") != "FIDELITY" or "source_text" not in src:
        sys.exit("--source-block is the Step 0 block (with source_text); --fidelity-input is --build's input-src<k>.json")
    if " ".join(fid.get("source_text", "").split()) != " ".join(src["source_text"].split()):
        sys.exit("the two blocks carry different source texts: FIDELITY is judged on the text SOURCE scored")
    system = Path(a.system).read_bytes()
    meta = {"kind": "paper", "source_block": str(Path(a.source_block).resolve()), "source_sha256": sha(src_b),
            "input": str(Path(a.fidelity_input).resolve()), "input_sha256": sha(fid_b),
            "des_to": str(Path(a.des_to).resolve()), "answer_to": str(Path(a.fidelity_to).resolve()),
            "system": str(Path(a.system).resolve()), "system_sha256": sha(system)}
    both = {"task_1_source": src,
            "task_2_fidelity": {**fid, "source_text": "<the source_text of task_1_source, unchanged>"}}
    body = (HEAD_PAPER + "\n<!-- relay-meta " + json.dumps(meta, ensure_ascii=False) + " -->\n\n"
            + "===== BEGIN SYSTEM =====\n" + system.decode("utf-8")
            + "\n===== END SYSTEM =====\n\n===== BEGIN INPUT =====\n"
            + json.dumps(both, ensure_ascii=False, indent=1) + "\n===== END INPUT =====\n")
    out.write_text(body, encoding="utf-8")
    print(json.dumps({"status": "packed", "relay": str(out), "bytes": len(body.encode("utf-8")),
                      "des_to": meta["des_to"], "fidelity_to": meta["answer_to"],
                      "founder": "open a NEW chat (temporary / memory off, no project), attach this one file, "
                                 "send «Follow the file.», and bring the whole reply back"},
                     ensure_ascii=False, indent=1))
    return 0


def sha(b):
    return hashlib.sha256(b).hexdigest()


def pack(a):
    out = relay_out(a)
    inp = Path(a.input).read_bytes()
    try:
        json.loads(inp)
    except ValueError as e:
        sys.exit(f"--input is not JSON: {e}")
    system = Path(a.system).read_bytes() if a.system else b""
    meta = {"answer_to": str(Path(a.answer_to).resolve()), "input": str(Path(a.input).resolve()),
            "input_sha256": sha(inp), "system": str(Path(a.system).resolve()) if a.system else None,
            "system_sha256": sha(system) if a.system else None}
    body = (HEAD + "\n<!-- relay-meta " + json.dumps(meta, ensure_ascii=False) + " -->\n\n"
            + "===== BEGIN SYSTEM =====\n"
            + (system.decode("utf-8") if a.system else
               "The input block states the task and the answer shape in its own fields "
               "(«mode», «answer»). Follow them.\n")
            + "\n===== END SYSTEM =====\n\n===== BEGIN INPUT =====\n" + inp.decode("utf-8")
            + "\n===== END INPUT =====\n")
    out.write_text(body, encoding="utf-8")
    print(json.dumps({"status": "packed", "relay": str(out), "bytes": len(body.encode("utf-8")),
                      "answer_to": meta["answer_to"], "system_sha256": meta["system_sha256"],
                      "founder": "open a NEW chat (temporary / memory off, no project), attach this one file, "
                                 "send «Follow the file.», and bring the whole reply back"},
                     ensure_ascii=False, indent=1))
    return 0


def first_object(text):
    """The one JSON object in a chat reply (fences and prose around it tolerated)."""
    dec = json.JSONDecoder()
    found = []
    i = text.find("{")
    while i >= 0:
        try:
            obj, end = dec.raw_decode(text, i)
        except ValueError:
            i = text.find("{", i + 1)
            continue
        if isinstance(obj, dict):
            found.append(obj)
        i = text.find("{", end)
    if len(found) != 1:
        sys.exit(f"the reply holds {len(found)} top-level JSON objects; exactly one is expected — ask the chat "
                 "again for the single raw JSON object, never merge or edit by hand")
    return found[0]


def coverage(obj, block):
    """Fidelity sweeper / judge: every unit of the input must be answered."""
    units = [u["id"] for u in block.get("units", []) if isinstance(u, dict) and "id" in u]
    if not units:
        return []
    mode = block.get("mode")
    if mode == "FIDELITY":
        got = {c.get("id") for c in obj.get("claims", []) if isinstance(c, dict)}
    elif mode == "FIDELITY_JUDGE":
        got = set(obj)
    elif mode == "ORPHAN_SWEEP":
        got = set(obj)
    else:
        return []
    return [u for u in units if u not in got]


def ingest(a):
    rtext = Path(a.relay).read_text(encoding="utf-8")
    m = META.search(rtext)
    if not m:
        sys.exit(f"{a.relay} is not a relay file (no relay-meta line)")
    meta = json.loads(m.group(1))
    inp = Path(meta["input"])
    if inp.exists() and sha(inp.read_bytes()) != meta["input_sha256"]:
        sys.exit(f"{inp} changed after the relay was packed — pack it again and rerun the call")
    obj = first_object(Path(a.reply).read_text(encoding="utf-8"))
    des = None
    if meta.get("kind") == "paper":
        if not isinstance(obj.get("source"), dict) or not isinstance(obj.get("fidelity"), dict):
            sys.exit('the reply must be one object {"source": {...}, "fidelity": {...}} — ask the same chat for '
                     "exactly that shape")
        sb = Path(meta["source_block"])
        if sb.exists():
            wrong_paper(obj["source"], json.loads(sb.read_text(encoding="utf-8")))
        des, obj = obj["source"], obj["fidelity"]
    elif inp.exists():
        block = json.loads(inp.read_text(encoding="utf-8"))
        if "mode" not in block:
            wrong_paper(obj, block)
    if inp.exists():
        missing = coverage(obj, json.loads(inp.read_text(encoding="utf-8")))
        if missing:
            sys.exit(f"the answer leaves {len(missing)} unit(s) unanswered: {missing[:10]} — rerun the call in a "
                     "fresh chat on the whole file; never fill units by hand")
    dest = Path(meta["answer_to"])
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf-8")
    if des is not None:
        dd = Path(meta["des_to"])
        dd.parent.mkdir(parents=True, exist_ok=True)
        dd.write_text(json.dumps(des, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({"status": "ingested", "written": str(dest), "des_written": meta.get("des_to") if des is not None else None,
                      "next": "python3 tools/des_repair.py <des> --texts texts.json (repairs, never a new trip)" if des is not None else None, "model": "UNVERIFIED unless the founder names it",
                      "route": "relay (founder-carried fresh chat)"}, ensure_ascii=False, indent=1))
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("pack")
    p.add_argument("--system", help="the system prompt file (omit when the block names its own task)")
    p.add_argument("--input", required=True, help="the input block (JSON), the only user turn")
    p.add_argument("--answer-to", required=True, help="where ingest writes the answer")
    p.add_argument("--out", required=True, help="the relay file: outside the repository or under .dentcast/relay/")
    pp = sub.add_parser("pack-paper", help="SOURCE + Fidelity sweep of one paper in one file")
    pp.add_argument("--system", required=True, help="the spec (.dentcast/des-v3.7-knowledge.md)")
    pp.add_argument("--source-block", required=True, help="the Step 0 block (JSON: doi, source_text, text_basis, metadata)")
    pp.add_argument("--fidelity-input", required=True, help="DIR/input-src<k>.json from des_fidelity_units.py --build")
    pp.add_argument("--des-to", required=True, help="where ingest writes the SOURCE answer")
    pp.add_argument("--fidelity-to", required=True, help="where ingest writes the sweep (DIR/out-src<k>-1.json)")
    pp.add_argument("--out", required=True, help="the relay file: outside the repository or under .dentcast/relay/")
    i = sub.add_parser("ingest")
    i.add_argument("reply", help="the chat's whole reply, saved as text")
    i.add_argument("--relay", required=True, help="the relay file the call was made from")
    a = ap.parse_args()
    return {"pack": pack, "pack-paper": pack_paper}.get(a.cmd, ingest)(a)


if __name__ == "__main__":
    sys.exit(main())
