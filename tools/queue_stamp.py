#!/usr/bin/env python3
"""Stamp a publish-queue item before its freeze: provenance, SHA256SUMS, manifest.

publish-queue.md principle 4 and step 7 «گذر پایانی و انجماد»: when both independent
reviews (principle 13) and the final sweep are closed, three mechanical things remain, always the same,
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
  4. **Mechanical cross-file checks** (`checks`, also in --dry-run). Problems:
     author order per DOI equal in 04-منبع/کاتالوگ.json, 05-DES-Fidelity/des.json
     and 04-منبع/منابع.md; every catalogue and DES DOI present in منابع.md.
     Warnings: a keyword of 09 with no token in 01/02/06; a flashcard
     description ≥ 0.75 similar to an FAQ answer; deixis («این مقاله» …) in
     10/08; leftover review wording («منتظر تأیید», TODO, stray `{{…}}`).
     An absent or differently shaped file skips its check with a note.

The status line («آماده») is the agent's own edit in 00-وضعیت.md after this
tool succeeds; approvals stay only in 00's table (other files cite «تأیید #k»).

    python3 tools/queue_stamp.py <queue-item> [--repo <main checkout>] [--ref origin/main] [--dry-run] [--strict]

Exit 0 complete, 4 incomplete (missing fields or check problems; with --strict
check warnings too), 2 refused.
"""
import argparse
import difflib
import hashlib
import json
import re
import subprocess
import sys
import unicodedata
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


# ---- 4. mechanical cross-file checks -------------------------------------------------
REFS, CATALOG, DES = "04-منبع/منابع.md", "04-منبع/کاتالوگ.json", "05-DES-Fidelity/des.json"
KEYWORDS, CARDS, EXAM = "09-کلیدواژه‌ها.md", "10-فلش‌کارت-FAQ.json", "08-سؤال‌های-آزمون.json"
TEXTS = ("01-متن.md", "02-عنوان-کپشن.md", "06-انگلیسی.md")
OVERLAP = 0.75
GROUNDED = 0.75
DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "0123456789" * 2)
DEIXIS = ("این کیس", "این متن", "این مقاله", "در این مطلب", "مطلب حاضر")
LEFTOVER = (("منتظر تأیید", False), ("borderline", True), ("pending founder", True), ("TODO", False))
PROSE = {"01-متن.md", "02-عنوان-کپشن.md", "06-انگلیسی.md"}  # W4 skips the Latin markers in the page prose
ALLOWED_PH = {LINKS_FILE: {"{{main_sha}}", "{{glossary_sha256}}", "{{brain_sha256}}"}, CARDS: {"{{PAGE_URL}}"}}
STOP = {"the", "and", "for", "with", "from", "into", "its", "are", "was", "این", "برای", "های", "که", "از", "با"}
DOI_RE = re.compile(r"DOI:\s*(?:https?://(?:dx\.)?doi\.org/)?(\S+)", re.I)
INITIALS = re.compile(r"^(?:[A-Z]{1,4}|[A-Z]\.?(?:-?[A-Z]\.?){0,3})$")


def norm(s):
    """casefold, no diacritics, dots, hyphens, apostrophes or spaces: «Al-Gabri» == «al gabri»."""
    s = unicodedata.normalize("NFKD", s.casefold())
    return re.sub(r"[\s.\-‐‑'’]", "", "".join(c for c in s if not unicodedata.combining(c)))


def load_json(item, rel, notes):
    p = item / rel
    if not p.is_file():
        notes.append(f"skipped: {rel} absent")
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except ValueError:
        notes.append(f"skipped: {rel} is not JSON")
        return None


def ref_lines(text):
    """{doi: [surname, …]} from منابع.md's numbered lines «1. Surname AB, … “Title.” … DOI: …»."""
    out = {}
    for line in text.splitlines():
        m, d = re.match(r"\s*\d+\.\s+(.*)", line), DOI_RE.search(line)
        if not (m and d):
            continue
        names = re.split(r"[“\"]", m.group(1), maxsplit=1)[0]
        chunks = [c.strip().rstrip(".").strip() for c in names.split(",") if c.strip().rstrip(".").strip()]
        surnames = []
        for c in chunks:
            if norm(c) in ("etal", "et"):
                surnames.append("…")
                break
            words = c.split()
            surnames.append(norm(" ".join(words[:-1] if len(words) > 1 and INITIALS.match(words[-1]) else words)))
        out[d.group(1).rstrip(".,;)").casefold()] = surnames
    return out


def same_order(full_names, surnames):
    """Full names («First Last») against bare surnames; «…» (et al.) ends the comparison."""
    if "…" in surnames:
        k = surnames.index("…")
        return len(full_names) >= k and same_order(full_names[:k], surnames[:k])
    return len(full_names) == len(surnames) and all(norm(f).endswith(s) and s for f, s in zip(full_names, surnames))


def check_authors(item, problems, notes):
    refs_p = item / REFS
    refs_text = refs_p.read_text(encoding="utf-8") if refs_p.is_file() else None
    if refs_text is None:
        notes.append(f"skipped: {REFS} absent (author order and DOI coverage not checked)")
    cat, des = load_json(item, CATALOG, notes), load_json(item, DES, notes)
    if cat is not None and not isinstance(cat, list):
        notes.append(f"skipped: {CATALOG} is not a list")
        cat = None
    if des is not None and not isinstance((des or {}).get("sources") if isinstance(des, dict) else None, list):
        notes.append(f"skipped: {DES} has no sources[]")
        des = None
    des_authors = {}
    for s in (des or {}).get("sources") or []:
        c = (s or {}).get("citation") or {}
        if c.get("doi"):
            des_authors[c["doi"].casefold()] = [a.strip() for a in (c.get("authors") or "").split(",") if a.strip()]
    refs = ref_lines(refs_text) if refs_text is not None else {}
    low = (refs_text or "").casefold()
    for e in cat or []:
        doi = (e or {}).get("doi") if isinstance(e, dict) else None
        if not doi:
            continue
        key = doi.casefold()
        if refs_text is not None and key not in low:
            problems.append(f"P2 {doi}: in {CATALOG} but not in {REFS}")
        names = e.get("authors")
        if not isinstance(names, list) or not names:
            continue
        sur = [norm(n.split()[-1]) for n in names if n.split()]
        if key in des_authors and des_authors[key]:
            dsur = [norm(n.split()[-1]) for n in des_authors[key] if n.split()]
            if dsur != sur:
                problems.append(f"P1 {doi}: author order differs between {CATALOG} {sur} and {DES} {dsur}")
        if key in refs and not same_order(names, refs[key]):
            problems.append(f"P1 {doi}: author order differs between {CATALOG} {sur} and {REFS} {refs[key]}")
    if refs_text is not None:
        for key in des_authors:
            if key not in low:
                problems.append(f"P2 {key}: in {DES} but not in {REFS}")
        for key, names in des_authors.items():
            if key in refs and names and not same_order(names, refs[key]) and not any(
                    isinstance(e, dict) and (e.get("doi") or "").casefold() == key and e.get("authors") for e in cat or []):
                problems.append(f"P1 {key}: author order differs between {DES} and {REFS} {refs[key]}")


def fa_norm(s, zwnj):
    s = unicodedata.normalize("NFKC", s).casefold().replace("ي", "ی").replace("ك", "ک").translate(DIGITS)
    s = re.sub(r"[\u064B-\u065F\u0670]", "", s)
    return s.replace("\u200c", "\u200c" if zwnj else "")


def kw_tokens(kw, zwnj):
    toks = re.split(r"[\s()\[\]{}«»\"'“”،,.;:!?؟/\\|\-–—]+", fa_norm(kw, zwnj))
    return [t[:-1] if re.fullmatch(r"[a-z]{5,}s", t) else t for t in toks if len(t) >= 3 and t not in STOP]


def check_keywords(item, warnings, notes):
    """A keyword is grounded when ≥ GROUNDED of its content tokens (≥ 3 letters, not a stop word) occur in
    01/02/06. «Any one token» let «selective laser melting RPD framework» pass on «rpd» alone."""
    kws = qm.keyword_lines(qm.lines_of(item, KEYWORDS))
    if not kws:
        notes.append(f"skipped: {KEYWORDS} absent or not a keyword list")
        return
    raw = "\n".join((item / t).read_text(encoding="utf-8") for t in TEXTS if (item / t).is_file())
    if not raw:
        notes.append("skipped: keyword grounding (01/02/06 absent)")
        return
    hay = [fa_norm(raw, False), fa_norm(raw, True)]
    for kw in kws:
        best, missing = 0.0, []
        for zw in (False, True):
            toks = kw_tokens(kw, zw)
            if not toks:
                continue
            miss = [t for t in toks if not any(t in h for h in hay)]
            share = 1 - len(miss) / len(toks)
            if share >= best:
                best, missing = share, miss
        if best < GROUNDED:
            warnings.append(f"W1 {KEYWORDS}: keyword «{kw}» not grounded in {'/'.join(TEXTS)} "
                            f"({best:.0%} of its tokens; missing {missing})")


def strings(x):
    if isinstance(x, str):
        yield x
    elif isinstance(x, dict):
        for v in x.values():
            yield from strings(v)
    elif isinstance(x, list):
        for v in x:
            yield from strings(v)


def check_cards(item, warnings, notes):
    cards = load_json(item, CARDS, notes)
    if isinstance(cards, dict) and "skip" in cards:
        notes.append(f"skipped: {CARDS} is a skip object")
    elif isinstance(cards, dict):
        terms = [t for s in cards.get("definedTermSets") or [] if isinstance(s, dict)
                 for t in s.get("hasDefinedTerm") or [] if isinstance(t, dict) and isinstance(t.get("description"), str)]
        qs = [q for f in cards.get("faqPages") or [] if isinstance(f, dict)
              for q in f.get("mainEntity") or [] if isinstance(q, dict)
              and isinstance((q.get("acceptedAnswer") or {}).get("text"), str)]
        if not terms or not qs:
            notes.append(f"skipped: flashcard/FAQ overlap ({CARDS} has no DefinedTerm descriptions or FAQ answers)")
        for t in terms:
            for q in qs:
                r = difflib.SequenceMatcher(None, t["description"], q["acceptedAnswer"]["text"]).ratio()
                if r >= OVERLAP:
                    warnings.append(f"W2 {CARDS}: term {t.get('@id') or t.get('name')} «{t.get('name')}» description "
                                    f"{r:.2f} similar to the answer of «{q.get('name')}»")
    elif cards is not None:
        notes.append(f"skipped: {CARDS} has another shape")
    for rel, data in ((CARDS, cards), (EXAM, load_json(item, EXAM, []) if (item / EXAM).is_file() else None)):
        for st in strings(data):
            for ph in DEIXIS:
                if ph in st:
                    warnings.append(f"W3 {rel}: «{ph}» in «{st[:60]}»")


def check_leftovers(item, warnings):
    for p in sorted(item.rglob("*")):
        rel = p.relative_to(item).as_posix()
        if not p.is_file() or p.suffix not in (".md", ".json") or rel == qm.STATUS_FILE:
            continue
        try:
            text = p.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        prose = rel in PROSE  # English words such as «borderline» are ordinary text there, not markers
        for n, line in enumerate(text.splitlines(), 1):
            hits = [w for w, fold in LEFTOVER if not (prose and fold)
                    and (w.casefold() in line.casefold() if fold else w in line)]
            hits += [ph for ph in re.findall(r"\{\{[^{}]*\}\}", line) if ph not in ALLOWED_PH.get(rel, ())]
            hits += ["{{"] if "{{" in re.sub(r"\{\{[^{}]*\}\}", "", line) else []
            if hits:
                warnings.append(f"W4 {rel}:{n}: {', '.join(dict.fromkeys(hits))}")


def checks(item):
    """{problems, warnings}: mechanical cross-file errors a human review would otherwise have to catch."""
    problems, warnings, notes = [], [], []
    check_authors(item, problems, notes)
    check_keywords(item, warnings, notes)
    check_cards(item, warnings, notes)
    check_leftovers(item, warnings)
    return {"problems": problems, "warnings": warnings + notes}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("item")
    ap.add_argument("--repo", default=str(ROOT), help="the main checkout the analysis read (default: this one)")
    ap.add_argument("--ref", default="origin/main", help="the main ref (default origin/main; HEAD when absent)")
    ap.add_argument("--dry-run", action="store_true", help="report only; write nothing")
    ap.add_argument("--strict", action="store_true", help="check warnings count as problems")
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
        chk = checks(item)
    except QueueRefusal as e:
        print(json.dumps({"status": "refused", **e.detail}, ensure_ascii=False, indent=1))
        return 2
    if a.strict:
        chk = {"problems": chk["problems"] + chk["warnings"], "warnings": []}
    incomplete = bool(manifest and (manifest["missing"] or manifest["problems"])) or bool(chk["problems"])
    print(json.dumps({"status": "dry_run" if a.dry_run else ("incomplete" if incomplete else "stamped"),
                      "provenance": prov, "links": links, "sha256sums_rows": sums.count("\n"),
                      "manifest": manifest, "checks": chk}, ensure_ascii=False, indent=1))
    return 4 if incomplete else 0


if __name__ == "__main__":
    sys.exit(main())
