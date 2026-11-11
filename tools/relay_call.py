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

`ingest` takes the chat's whole reply (prose or ```json fences around it are fine),
keeps the one JSON object, checks it parses and — for a Fidelity sweeper or judge
answer — that it answers every unit of the input, and writes it, unchanged, to the
path the relay names. It never edits a verdict. A RELAY.md holds the paper's text:
keep it outside the repository (pack refuses a path inside it) and never commit it.
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


def sha(b):
    return hashlib.sha256(b).hexdigest()


def pack(a):
    out = Path(a.out).resolve()
    if ROOT.resolve() in out.parents:
        sys.exit("--out must be outside the repository: a relay file holds the paper's text, which never "
                 "enters public Git history")
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
    if inp.exists():
        missing = coverage(obj, json.loads(inp.read_text(encoding="utf-8")))
        if missing:
            sys.exit(f"the answer leaves {len(missing)} unit(s) unanswered: {missing[:10]} — rerun the call in a "
                     "fresh chat on the whole file; never fill units by hand")
    dest = Path(meta["answer_to"])
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({"status": "ingested", "written": str(dest), "model": "UNVERIFIED unless the founder names it",
                      "route": "relay (founder-carried fresh chat)"}, ensure_ascii=False, indent=1))
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("pack")
    p.add_argument("--system", help="the system prompt file (omit when the block names its own task)")
    p.add_argument("--input", required=True, help="the input block (JSON), the only user turn")
    p.add_argument("--answer-to", required=True, help="where ingest writes the answer")
    p.add_argument("--out", required=True, help="the relay file, outside the repository")
    i = sub.add_parser("ingest")
    i.add_argument("reply", help="the chat's whole reply, saved as text")
    i.add_argument("--relay", required=True, help="the relay file the call was made from")
    a = ap.parse_args()
    return pack(a) if a.cmd == "pack" else ingest(a)


if __name__ == "__main__":
    sys.exit(main())
