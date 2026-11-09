#!/usr/bin/env python3
"""DES v3.5 FIDELITY — the caller's half: split a page into units and say
which cited source each unit is judged against.

The spec (appendix rules 7 and 10) takes segmentation and attribution out of
the model's hands, because those two were the largest sources of run-to-run
disagreement in the release tests. This tool IS those two rules, so every
agent produces byte-identical input blocks for the same page.

    python3 tools/des_fidelity_units.py sharehub/share-22            # report
    python3 tools/des_fidelity_units.py sharehub/share-22 --json     # machine-readable

    # build the FIDELITY input blocks, one per call, into DIR:
    python3 tools/des_fidelity_units.py sharehub/share-22 \\
        --texts texts.json --build DIR

`texts.json` maps each source's DOI (lower case) — or, for a source with no
DOI (a textbook, a standard), its position tag `S<n>` — to
{"source_text": "...", "text_basis": "ABSTRACT_ONLY" | "FULL_TEXT" | ...} —
the same text the SOURCE call scored, on the same basis (the tool refuses
a mismatch — spec v2.7+ appendix rule 11). Resolving it (cabinet, PubMed, WebFetch,
the founder's own copy of a book) is step 4.13 Part 1's job, not this tool's.

A NOT_APPRAISABLE source (spec v3.1) is judged like any other when its text
was in hand (`text_basis` FULL_TEXT or EXCERPT): the score and the fidelity
are two questions, and the gate is the text, never the score. A
CITATION_ONLY record has no text and gets no call.

Three modes, decided here and nowhere else:
  * ONE scored source          → every unit goes to it (scope SOURCE).
  * several, some named inline → each unit goes to the source(s) it names, or
    to the one named last earlier in its paragraph (scope SOURCE, one call per
    source that received at least one unit).
  * several, none named inline → scope POOLED: one call PER SOURCE (each
    `input-pooled-S<n>.json`, judged as SOURCE), then `--merge DIR` folds the
    answers (`out-S<n>.json`) into the one pooled object by spec F6.

From spec v3.5 (records stamped 3.5 or later; older pages assign exactly as
before) the assignment is completed on the caller's side:
  * declared markers — `.dentcast/des-source-markers.json`
    {content_id: {"S<n>": {"markers": [...], "disambiguators": [...]}}} adds
    the page's own Persian forms («اوکیسون», «کتاب»); a unit reaching several
    sources is narrowed to the ones whose disambiguator (their year, always,
    plus any declared) it also contains (appendix rule 10);
  * a recorded plan — `.dentcast/des-fidelity-plans/<content_id>.json`
    {"content_id", "origin": "founder"|"orphan_sweep", "plan": {"<k>": [ids]},
    "decision": {...}, "sweep": [...]} replaces the computed assignment, here
    and in Phase F (rule 10);
  * `--orphans DIR --texts T` writes the stronger reviewer's block
    (`orphans-input.json`). On a page with two or more sources it runs FIRST,
    before any checker run (founder 1405/08/15): with no `voted-src*.json` in
    DIR every body unit goes to the reviewer, so each sentence's source is
    settled before anything is judged. After a vote (records prepared under
    the earlier order) it lists the units no call judged or every call left
    silent. `--sweep DIR` checks its `orphans.json` and adds found units to the
    plan (rule 12);
  * `--vote --base` accepts a plan that grew (rule 13) and, with `--texts`,
    a source text that grew, when every non-MATCHES unit was re-checked
    (rule 14).

A core audio episode (`episodes/…`) gets DES only, never a FIDELITY call
(founder, 1405/08/04): its page is a caption, a player and labels, not a
write-up of the paper. The tool says so and builds nothing for it.
"""
import argparse
import difflib
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import verify_publish as vp  # noqa: E402  (article_region, text_of)

HMARK = "\x01"
MARKERS_FILE = ROOT / ".dentcast/des-source-markers.json"
PLANS_DIR = ROOT / ".dentcast/des-fidelity-plans"
FA_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
# Arabic-script LETTERS (not diacritics, not ZWNJ): a declared Persian marker
# is a whole word when no letter touches it on either side.
FA_LETTER = "\u0621-\u063A\u0641-\u064A\u066E-\u066F\u0671-\u06D3\u06D5\u06EE-\u06EF\u06FA-\u06FC\u06FF"
TERMINATORS = re.compile(r"(?<=[.!?؟۔])\s+")
BLOCK_TAGS = re.compile(r"(?i)</?(p|div|li|ul|ol|br|section|blockquote|tr|td|th|table|figcaption)\b[^>]*>")
INITIALS = re.compile(r"^[A-ZÀ-Ý]{1,4}$")
# Words that open journal titles and name nothing in particular. A journal's
# first word is a marker only when it is NOT one of these — «Cochrane» names one
# review family; «Journal», «Dental» or «BMC» would name half the literature.
JOURNAL_STOP = {
    "journal", "j", "the", "international", "int", "american", "european", "eur",
    "british", "br", "acta", "annals", "archives", "bmc", "clinical", "clin",
    "dental", "dent", "dentistry", "oral", "operative", "materials", "plos",
    "scientific", "frontiers", "applied", "advances", "medicine", "medical", "open",
    # demonyms open national journals and name a country, not a source
    "brazilian", "chinese", "japanese", "korean", "indian", "iranian", "australian",
    "canadian", "german", "italian", "turkish", "saudi", "egyptian", "swiss",
}


NA_TEXT_BASES = ("FULL_TEXT", "EXCERPT")


def scorable(src):
    """A source the FIDELITY call can run against (README step 4.13 Part 2b).
    From spec v3.1 a NOT_APPRAISABLE source is one too, whenever its SOURCE
    call read a text (FULL_TEXT or EXCERPT) — a book with only its reference
    line in hand (CITATION_ONLY, or a pre-3.1 record) has nothing to judge."""
    if src.get("error"):
        return False
    if src.get("content_type") == "NOT_APPRAISABLE":
        # v3.4: a consensus read whole is recorded SECONDARY_REPORT and is a complete text
        if src.get("source_kind") == "consensus" and vp.des_ge(src.get("des_version"), (3, 4)):
            return src.get("text_basis") in NA_TEXT_BASES + ("SECONDARY_REPORT",)
        return vp.des_ge(src.get("des_version"), (3, 1)) and src.get("text_basis") in NA_TEXT_BASES
    return True


def markers_for(src):
    """Latin markers that name this source in prose: the first author's family
    name as cited (and its last word, when that word is distinctive), the DOI,
    and the journal's first word when it is a proper name rather than a generic
    one («مرور Cochrane» names a review by its library, never by Miao)."""
    cit = src.get("citation") or {}
    first = (cit.get("authors") or "").split(",")[0].strip()
    words = first.split()
    while words and INITIALS.match(words[-1]):
        words.pop()
    out = set()
    if words:
        out.add(" ".join(words))
        if len(words[-1]) >= 4:
            out.add(words[-1])
    else:
        # spec v3.1 appendix rule 10: a work with no author (a glossary, a
        # standard) is named in prose by its title, as one whole phrase, minus
        # a leading article and a trailing parenthetical. A work WITH an
        # author keeps the author rule alone, so no earlier assignment moves.
        t = re.sub(r"\s*\([^)]*\)\s*$", "", (cit.get("title") or "").strip().rstrip("."))
        t = re.sub(r"^(?:the|a|an)\s+", "", t, flags=re.I).strip()
        if len(t.split()) >= 2:
            out.add(t)
    if cit.get("doi"):
        out.add(cit["doi"])
    jw = (cit.get("journal") or "").split()
    if jw and jw[0].lower().strip(".:,") not in JOURNAL_STOP and len(jw[0]) >= 5 and jw[0][0].isupper():
        out.add(jw[0].strip(".:,"))
    return {m for m in out if m}


def names(unit_text, marks):
    low = unit_text.lower()
    for m in marks:
        if re.search(r"(?<![A-Za-z])" + re.escape(m.lower()) + r"(?![A-Za-z])", low):
            return True
    return False


def names_v35(unit_text, marks):
    """Spec v3.5 rule 10: a marker matches as a whole word in either script —
    Latin markers keep the Latin boundary, a Persian one must not touch an
    Arabic-script letter, and Persian/Arabic digits read as Latin ones."""
    low = unit_text.lower().translate(FA_DIGITS)
    for m in marks:
        mm = m.lower().translate(FA_DIGITS)
        if re.search(r"[A-Za-z]", mm):
            pat = r"(?<![A-Za-z])" + re.escape(mm) + r"(?![A-Za-z])"
        else:
            pat = r"(?<![" + FA_LETTER + r"])" + re.escape(mm) + r"(?![" + FA_LETTER + r"])"
        if re.search(pat, low):
            return True
    return False


def is_v35(sources):
    return any(vp.des_ge((s or {}).get("des_version"), (3, 5)) for s in sources)


def declared_for(content_id):
    """{source index: {"markers": [...], "disambiguators": [...]}} declared for
    this page in .dentcast/des-source-markers.json (keys S<n>, 1-based)."""
    if not content_id or not MARKERS_FILE.exists():
        return {}
    rec = json.loads(MARKERS_FILE.read_text(encoding="utf-8")).get(content_id) or {}
    out = {}
    for tag, v in rec.items():
        if not re.fullmatch(r"S[1-9][0-9]*", tag):
            sys.exit(f"{MARKERS_FILE.name}: {content_id}: bad source tag {tag!r} (want S<n>)")
        out[int(tag[1:]) - 1] = {"markers": list(v.get("markers") or []),
                                 "disambiguators": list(v.get("disambiguators") or [])}
    return out


def plan_path(content_id):
    return PLANS_DIR / f"{content_id}.json"


def recorded_plan(content_id, units, sources):
    """Spec v3.5 rule 10: a recorded plan replaces the computed assignment.
    Refused when an id is not a unit of the page or a key is not a source."""
    p = plan_path(content_id) if content_id else None
    if not p or not p.exists():
        return None
    rec = json.loads(p.read_text(encoding="utf-8"))
    if rec.get("content_id") != content_id:
        sys.exit(f"{p}: content_id {rec.get('content_id')!r} is not {content_id!r}")
    if rec.get("origin") not in ("founder", "orphan_sweep"):
        sys.exit(f"{p}: origin must be founder or orphan_sweep")
    if rec.get("origin") == "orphan_sweep" and not rec.get("sweep"):
        sys.exit(f"{p}: an orphan_sweep plan needs its sweep receipt")
    if rec.get("origin") == "founder" and (rec.get("decision") or {}).get("status") != "confirmed":
        sys.exit(f"{p}: a founder plan needs decision.status = confirmed")
    ids = {u["id"] for u in units}
    plan = {}
    for k, v in (rec.get("plan") or {}).items():
        k = int(k)
        if not (0 <= k < len(sources)) or not scorable(sources[k]):
            sys.exit(f"{p}: source index {k} is not a source with a text")
        bad = [i for i in v if i not in ids]
        if bad:
            sys.exit(f"{p}: {bad} are not units of the page — re-check the plan against the current page")
        order = [u["id"] for u in units]
        plan[k] = sorted(set(v), key=order.index)
    return {k: ids_ for k, ids_ in plan.items() if ids_}


def stop_line(line, sources):
    letters = re.sub(r"^[^\w]+|[^\w]+$", "", line)
    if letters.lower() in ("منابع", "منبع", "references", "reference"):
        return True
    if line.strip() == "نویسنده:":
        return True
    low = line.lower().replace("“", "").replace("”", "").replace('"', "")
    for s in sources:
        cit = s.get("citation") or {}
        doi = (cit.get("doi") or "").lower()
        title = (cit.get("title") or "").lower().rstrip(".")
        if doi and doi in low:
            return True
        if title and len(title) > 12 and title in low and citation_shaped(low, title, cit):
            return True
    return False


def citation_shaped(low, title, cit):
    """A line holding a source's title is the citation block only when it reads
    like a reference: it names a year or the journal, or it is little more than
    the title itself. Prose that names a paper by its title («مقاله مروری
    Pre-prosthetic orthodontics در بحث دیپ‌بایت …») is body text, not the end
    of the article."""
    if re.search(r"(?<!\d)(?:19|20)\d\d(?!\d)", low.translate(FA_DIGITS)):
        return True
    journal = (cit.get("journal") or "").lower().strip()
    if journal and journal in low:
        return True
    return len(low) <= len(title) + 40


def is_audio_episode(content_id):
    """A core podcast episode page: DES only, no FIDELITY (founder, 1405/08/04)."""
    return content_id.startswith("episodes/")


# A full stop that ends no sentence (publish-queue item 24, 2026-11-07): a
# figure caption «تصویر ۱. … منبع: … Fig. 1» was cut into «تصویر ۱.», «… Fig.»
# and «1». The split keeps three things whole, and nothing else changes:
#   * a caption label opening its line — «تصویر ۱.», «شکل 2.», «جدول ۳.»,
#     «Figure 4.», «Table 1.» — stays with the caption sentence after it;
#   * a reference abbreviation followed by its number — «Fig. 1», «Figs. 2»,
#     «Tab. 3», «Eq. 4», «No. 5», «Ref. 6»;
#   * «e.g.», «i.e.», «vs.», which never end a sentence.
CAPTION_LABEL = re.compile(r"^(?:تصویر|شکل|جدول|نمودار|Figure|Fig\.|Table|Chart)\s*[0-9۰-۹٠-٩]+[A-Za-z]?\.$", re.I)
NUM_ABBREV = re.compile(r"(?<![A-Za-z])(?:Figs?|Tab|Eqs?|Nos?|Refs?)\.$", re.I)
NEVER_FINAL = re.compile(r"(?<![A-Za-z])(?:e\.g|i\.e|vs)\.$", re.I)
STARTS_NUM = re.compile(r"^[(\[]?[0-9۰-۹٠-٩]")


def sentences(line):
    """`line` cut at its sentence terminators (TERMINATORS), except where the
    full stop belongs to a caption label or an abbreviation (above)."""
    out = []
    for t in (x.strip() for x in TERMINATORS.split(line)):
        if not t:
            continue
        if out and ((len(out) == 1 and CAPTION_LABEL.match(out[0]))
                    or NEVER_FINAL.search(out[-1])
                    or (NUM_ABBREV.search(out[-1]) and STARTS_NUM.match(t))):
            out[-1] = out[-1] + " " + t
        else:
            out.append(t)
    return out


CMARK = "\x02"
INTERNAL = ("para", "caption")  # unit keys that never reach an input block


STORED = object()  # split_page(): read the page's own record from plus/des-scores.json
_SCORES = {}


def stored_fidelity(content_id):
    """The FIDELITY slot plus/des-scores.json holds for this page (None when
    there is none), read once per file version."""
    p = ROOT / "plus/des-scores.json"
    try:
        key = (str(p), p.stat().st_mtime_ns)
    except OSError:
        return None
    if key not in _SCORES:
        _SCORES.clear()
        _SCORES[key] = json.loads(p.read_text(encoding="utf-8"))
    return (_SCORES[key].get(content_id) or {}).get("fidelity")


def split_page(content_id, sources, legacy=None, fidelity=STORED):
    """The page's units in reading order. A unit cut from a <figcaption>
    carries `caption: True` (internal, like `para`: never in an input block),
    so a re-check after captions were added can tell them from body text
    (`--carry`).

    Which cut (`split_for`): a page whose FIDELITY record was judged on the
    cut before `sentences()` keeps that cut, so no stored id moves — for every
    caller (this tool, Phase F, the queue install). `fidelity` is the record to
    fit (default: the page's own in plus/des-scores.json; the queue install
    passes the frozen one); `legacy=True`/`False` forces a cut."""
    if legacy is None:
        return split_for(content_id, sources, stored_fidelity(content_id) if fidelity is STORED else fidelity)
    doc = (ROOT / f"{content_id}.html").read_text(encoding="utf-8")
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", doc, re.S)
    reg = vp.article_region(doc)
    reg = re.sub(r"(?is)<h[1-6]\b[^>]*>(.*?)</h[1-6]>",
                 lambda m: "\n" + HMARK + re.sub(r"<[^>]+>", "", m.group(1)).replace("\n", " ") + "\n", reg)
    reg = re.sub(r"(?is)<figcaption\b[^>]*>(.*?)</figcaption>",
                 lambda m: "\n" + CMARK + re.sub(r"<[^>]+>", "", m.group(1)).replace("\n", " ") + "\n", reg)
    reg = BLOCK_TAGS.sub("\n", reg)
    lines = ([HMARK + vp.text_of(h1.group(1))] if h1 else []) + html.unescape(re.sub(r"<[^>]+>", "", reg)).split("\n")
    units, para = [], 0
    for raw in lines:
        is_h = raw.lstrip().startswith(HMARK)
        is_c = raw.lstrip().startswith(CMARK)
        line = re.sub(r"[ \t\r]+", " ", raw.replace(HMARK, "").replace(CMARK, "")).strip()
        if not line:
            continue
        if stop_line(line, sources):
            break
        para += 1
        for t in ([x.strip() for x in TERMINATORS.split(line) if x.strip()] if legacy else sentences(line)):
            u = {"id": f"u{len(units) + 1}", "text": t, "para": para}
            if is_h:
                u["heading"] = True
            if is_c:
                u["caption"] = True
            units.append(u)
    return units


def judged_quotes(fidelity):
    """Every (id, claim_quote) of a stored or frozen FIDELITY slot (array,
    pooled object, or None)."""
    objs = fidelity if isinstance(fidelity, list) else [fidelity]
    return [(c.get("id"), c.get("claim_quote") or "") for f in objs if isinstance(f, dict)
            for c in f.get("claims") or [] if c.get("claim_quote")]


def split_for(content_id, sources, fidelity=None):
    """The units of a page that may already carry a FIDELITY record. A record
    keeps the segmentation it was judged on, as it keeps its source_conclusion:
    today's cut is used only when it fits the stored claims strictly better
    than the cut before `sentences()` did (more claims are units of it by
    text; on a tie, by id and text); otherwise the earlier cut is returned, so
    no published or frozen record shifts an id and a frozen queue record
    installs exactly as it did before this rule (a date line synced on publish
    day matches neither cut and counts for neither). A page with no record (a
    queue draft, a new publish) always gets today's cut."""
    units = split_page(content_id, sources, legacy=False)
    quotes = judged_quotes(fidelity)
    if not quotes:
        return units
    old = split_page(content_id, sources, legacy=True)

    def fit(us):
        texts, pairs = {u["text"] for u in us}, {(u["id"], u["text"]) for u in us}
        return sum(q in texts for _, q in quotes), sum(q in pairs for q in quotes)
    return units if fit(units) > fit(old) else old


def assign(units, sources, content_id=None):
    """Spec F6 + appendix rule 10. Markers come from EVERY cited source (a book
    with no text still takes the units that name it — they are about the book,
    not about the paper beside it); calls go only to the sources with a text.
    v3.2 (founder, 1405/07/20): a page that names SOME of
    its sources used to leave every unit naming none of them in no call at all
    — on sharehub/share-10 that was the whole body, written from the one paper
    the prose never names. Those units now go to the cited source(s) no unit
    names; when that is one source it is an ordinary SOURCE call."""
    v35 = is_v35(sources)
    if v35:
        fixed = recorded_plan(content_id, units, sources)
        if fixed is not None:
            return "SOURCE", fixed
    cited = [i for i, s in enumerate(sources) if not s.get("error")]
    idx = [i for i in cited if scorable(sources[i])]
    if len(cited) == 1:
        return "SOURCE", {idx[0]: [u["id"] for u in units]} if idx else {}
    marks = {i: markers_for(sources[i]) for i in cited}
    if v35:
        decl = declared_for(content_id)
        for i in cited:
            marks[i] |= set(decl.get(i, {}).get("markers", []))
        dis = {}
        for i in cited:
            year = (sources[i].get("citation") or {}).get("year")
            dis[i] = set(decl.get(i, {}).get("disambiguators", [])) | ({str(year)} if year else set())

        def hits(text):
            h = [i for i in cited if names_v35(text, marks[i])]
            if len(h) > 1:
                keep = [i for i in h if dis[i] and names_v35(text, dis[i])]
                if keep:
                    h = keep
            return h
        direct = {u["id"]: hits(u["text"]) for u in units}
    else:
        direct = {u["id"]: [i for i in cited if names(u["text"], marks[i])] for u in units}
    if not any(direct.values()):
        return "POOLED", {"pooled": [u["id"] for u in units]}
    out = {i: [] for i in idx}
    carry, cur_para = [], None
    remainder = []
    for u in units:
        if u["para"] != cur_para or u.get("heading"):
            carry, cur_para = [], u["para"]
        hit = direct[u["id"]]
        if hit:
            carry = hit
        if u.get("heading"):
            continue
        if not (hit or carry):
            remainder.append(u["id"])
        for i in (hit or carry):
            if i in out:
                out[i].append(u["id"])
    unnamed = [i for i in idx if not any(i in d for d in direct.values())]
    if remainder and unnamed:
        if len(unnamed) > 1:
            # a pooled part over several unnamed sources is not defined yet: the
            # remainder stays in no call, as before, and the caller is told
            print(f"note: {len(remainder)} units name no source and {len(unnamed)} sources with a text are never "
                  f"named — those units reach no call (spec F6; several unnamed sources are not pooled yet)",
                  file=sys.stderr)
        else:
            out[unnamed[0]].extend(remainder)
    return "SOURCE", {i: ids for i, ids in out.items() if ids}


def last_sentence(text):
    parts = [p.strip() for p in TERMINATORS.split(text.replace("\n", " ")) if p.strip()]
    return parts[-1] if parts else ""


CONCL_HEAD = re.compile(r"(?<![A-Za-z])(?<!In )(?:CONCLUSIONS?|Conclusions?)\b:?\s+(?=[A-Z])")
BACK_MATTER = re.compile(r"(?<![A-Za-z])(?:Abbreviations|Acknowledg(?:e)?ments?|ACKNOWLEDGE?MENTS?|ACKNOWLEDG|Supplementary|"
                         r"Fundings?|FUNDINGS?|CRediT|Declarations?(?: of [Ii]nterests?)?|Data availab(?:ility|le)|DATA AVAILABILITY|Authors?[’'] contributions|Author Contributions|"
                         r"AUTHOR CONTRIBUTIONS|CONFLICT OF INTEREST|Conflicts? of interest|Competing [Ii]nterests|"
                         r"ORCID|REFERENCES|References)\b")


# Page furniture a PDF extraction carries into the text: the publisher's
# download/licence footer («Downloaded from … Wiley Online Library … See the
# Terms and Conditions … Creative Commons License»), copyright lines. A
# sentence holding one of these is never the paper's conclusion.
BOILERPLATE = re.compile(r"(?i)downloaded from\b|wiley online library|terms and conditions|creative commons licen[cs]e|"
                         r"rules of use|oa articles are governed|this is an open access article|all rights reserved|"
                         r"^\s*©|\bcopyright\b")


def last_real_sentence(text):
    """The last sentence of `text` that is not page furniture (BOILERPLATE)."""
    parts = [p.strip() for p in TERMINATORS.split(text.replace("\n", " ")) if p.strip()]
    real = [p for p in parts if not BOILERPLATE.search(p)]
    return real[-1] if real else (parts[-1] if parts else "")


def conclusion_of(text, basis):
    """source_conclusion (spec appendix rule 7). An abstract ends on its
    conclusion; a full text ends on its back matter (ORCID, declarations), so
    under FULL_TEXT it is the last sentence of the paper's last Conclusion(s)
    section, cut at the first back-matter heading after it. A sentence that is
    page furniture (a download or licence footer) is passed over. This only
    shapes NEW input blocks: a stored record keeps the source_conclusion it
    echoed (Phase F never recomputes it), so no existing record moves."""
    if basis == "FULL_TEXT":
        heads = list(CONCL_HEAD.finditer(text))
        if heads:
            body = text[heads[-1].end():]
            m = BACK_MATTER.search(body)
            return last_real_sentence(body[:m.start()] if m else body)
    return last_real_sentence(text)


def _squash(x):
    return re.sub(r"\s+", " ", x).strip()


def source_conclusion_for(t):
    """The echoed conclusion. A caller may pin it with `source_conclusion` in
    texts.json when the paper's layout defeats conclusion_of() (a bulleted
    conclusion, a figure or a vendor list between the section and the back
    matter). The pinned sentence must be a verbatim substring of the source
    text — the tool refuses anything the paper does not say."""
    pin = t.get("source_conclusion")
    if pin:
        if _squash(pin) not in _squash(t["source_text"]):
            sys.exit("texts.json: source_conclusion is not a verbatim substring of source_text")
        return _squash(pin)
    got = conclusion_of(t["source_text"], t["text_basis"])
    if not got.strip():
        # publish-queue item 24 (J Prosthet Dent, Elsevier): a two-column page
        # glued «CONCLUSIONS REFERENCES» into one line, the cut fell on
        # REFERENCES and the block went out with source_conclusion "" — echoed
        # by both checker runs. An empty conclusion is never written silently.
        sys.exit("source_conclusion came out empty (the PDF layout defeated conclusion_of(), e.g. a glued "
                 "«CONCLUSIONS REFERENCES» heading) — pin the paper's own last conclusion sentence as "
                 "\"source_conclusion\" in texts.json (pdf_source_text.py --conclusion \"…\") before the first run")
    return got


BASIS_ORDER = ["FULL_TEXT", "SECONDARY_REPORT", "ABSTRACT_ONLY", "EXCERPT"]


def weakest(bases):
    """Spec F6 / v3.1: the pooled basis is the weakest of the parts' —
    FULL_TEXT < SECONDARY_REPORT < ABSTRACT_ONLY < EXCERPT."""
    known = [b for b in bases if b in BASIS_ORDER]
    return max(known, key=BASIS_ORDER.index) if known else None


def text_key(s, n):
    """texts.json key: the DOI, lower case; a DOI-less source (a book, a
    standard) by its position tag S<n> (1-based, the tag F6 uses)."""
    doi = ((s.get("citation") or {}).get("doi") or "").strip().lower()
    return doi or f"s{n}"


def text_for(s, texts, n):
    """The FIDELITY call reads what the SOURCE call scored (spec v2.7 F0,
    appendix rule 11): a page written from a full text is never judged
    against its abstract. Refuse a text whose basis differs from the record.
    A NOT_APPRAISABLE source is no exception (v3.1): its SOURCE call read the
    chapter or the entry, and this call reads the same."""
    key = text_key(s, n)
    if key not in texts:
        sys.exit(f"no text for {key} in --texts")
    t = texts[key]
    want = s.get("text_basis")
    if want and t.get("text_basis") != want:
        sys.exit(f"{key}: --texts gives {t.get('text_basis')} but the SOURCE record was scored "
                 f"on {want} — pass the same text the SOURCE call scored (spec appendix rule 11)")
    return t


def build(content_id, sources, units, mode, plan, texts, outdir):
    """One input block per CALL. Under POOLED (spec v2.7 F6) that is one
    block PER SOURCE, each judged alone as scope SOURCE and carrying
    `pooled_part` («S2») so the caller can merge the answers afterwards
    (`--merge`) — one model never reads two full papers in one call, which is
    where the v2.7 precision test lost its verdicts."""
    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    by_id = {u["id"]: u for u in units}
    pub = lambda ids: [{k: v for k, v in by_id[i].items() if k not in INTERNAL} for i in ids]
    url = f"https://dentcast.org/{content_id}.html"
    made = []
    for key, ids in plan.items():
        if key == "pooled":
            for n, s in enumerate(sources, 1):
                if not scorable(s):
                    continue
                t = text_for(s, texts, n)
                blk = {"mode": "FIDELITY", "scope": "SOURCE", "pooled_part": f"S{n}",
                       "source_text": t["source_text"], "text_basis": t["text_basis"], "units": pub(ids),
                       "derivative_url": url,
                       "source_conclusion": source_conclusion_for(t)}
                p = outdir / f"input-pooled-S{n}.json"
                p.write_text(json.dumps(blk, ensure_ascii=False, indent=1), encoding="utf-8")
                made.append(str(p))
        else:
            s = sources[key]
            t = text_for(s, texts, key + 1)
            blk = {"mode": "FIDELITY", "scope": "SOURCE", "source_text": t["source_text"],
                   "text_basis": t["text_basis"], "units": pub(ids), "derivative_url": url,
                   "source_conclusion": source_conclusion_for(t)}
            p = outdir / f"input-src{key}.json"
            p.write_text(json.dumps(blk, ensure_ascii=False, indent=1), encoding="utf-8")
            made.append(str(p))
    return made


SILENT = ("NOT_IN_SOURCE", "NOT_ASSESSABLE")
EXCLUDED = ("NOT_A_CLAIM", "AUTHOR_VIEW")


def compose_fa(claims, counts, assessable, level, version, pooled):
    """fact_fa / interpretation_fa composed from a tally the caller built
    (POOLED merge, majority vote) — never by a model that saw only one run."""
    fa = lambda n: str(n).translate(str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹"))
    src_fa = "منابع" if pooled else "منبع"
    lvl_fa = {"HIGH": "بالا", "MEDIUM": "متوسط", "LOW": "پایین", "INSUFFICIENT_CLAIMS": "ادعای کافی ندارد"}[level]
    if vp.des_ge(version, (2, 8)):
        # v2.8 F4: the score is over the claims the sources ADDRESS; a sentence
        # they are silent about is counted, never called a fault (F5 fact_fa)
        fact = (f"از {fa(assessable)} ادعایی که {src_fa} به آن پرداخته‌اند، {fa(counts['matches'])} مورد مطابق است، "
                f"{fa(counts['altered'])} مورد تغییر یافته و {fa(counts['reversed'])} مورد برعکس؛ سطح انطباق {lvl_fa}"
                + (f"؛ {fa(counts['not_in_source'])} جمله‌ی دیگر در {src_fa} نیامده است." if counts['not_in_source'] else "."))
    else:
        fact = (f"از {fa(assessable)} ادعای قابل‌بررسی، {fa(counts['matches'])} مورد با {src_fa} مطابق است، "
                f"{fa(counts['altered'])} مورد تغییر یافته و {fa(counts['reversed'])} مورد برعکس؛ سطح انطباق {lvl_fa}.")
    flagged = [c for c in claims if c["verdict"] in ("ALTERED", "REVERSED")]
    if not flagged:
        interp = ("هر ادعای قابل‌بررسی با دست‌کم یکی از منابع مطابق است." if pooled
                  else "هر ادعای قابل‌بررسی با منبع مطابق است.")
    else:
        kinds = {"HEDGE_REMOVED": "قاطع‌تر از منبع", "HEDGE_ADDED": "محتاط‌تر از منبع", "MAGNITUDE_CHANGED": "اندازه متفاوت",
                 "POPULATION_OR_CONDITION_CHANGED": "دامنه گسترده‌تر از منبع", "GROUP_OR_COMPARATOR_CHANGED": "گروه مقایسه متفاوت"}
        items = [f"«{c['claim_quote'][:50]}…» ({'برعکس' if c['verdict'] == 'REVERSED' else kinds.get(c['change_kind'], 'تغییریافته')})"
                 for c in flagged[:6]]
        interp = "موارد تغییریافته یا برعکس: " + "؛ ".join(items) + ("." if len(flagged) <= 6 else f"؛ و {fa(len(flagged) - 6)} مورد دیگر.")
    return fact, interp


def merge_pooled(parts, basis):
    """Spec v2.7 F6: fold the per-source answers of a POOLED page into the one
    pooled object, deterministically. Per unit: MATCHES when any source states
    it; else ALTERED when any does (the earliest source's kind and quote);
    else REVERSED when any does; else silence (by the pooled basis); and
    NOT_A_CLAIM / AUTHOR_VIEW only when EVERY source said so (attribution does
    not depend on the source, so one call attributing the unit wins — F1's
    default). `parts` is {"S1": output, "S2": output, …}."""
    tags = sorted(parts, key=lambda s: int(s[1:]))
    n_units = len(parts[tags[0]]["claims"])
    # v3.3: a SECONDARY_REPORT read whole is a complete text for this question
    # (silence → NOT_IN_SOURCE, not provisional); below 3.3 it was abstract-like.
    complete = basis == "FULL_TEXT" or (
        basis == "SECONDARY_REPORT" and vp.des_ge(parts[tags[0]].get("des_version", "2.8"), (3, 3)))
    claims = []
    for i in range(n_units):
        rows = [(tag, parts[tag]["claims"][i]) for tag in tags]
        cid = rows[0][1]["id"]
        assert all(c["id"] == cid for _, c in rows), f"part outputs disagree on unit order at {cid}"
        base = {"id": cid, "claim_quote": rows[0][1]["claim_quote"]}
        pick = None
        for want in ("MATCHES", "ALTERED", "REVERSED"):
            hit = [(tag, c) for tag, c in rows if c["verdict"] == want]
            if hit:
                tag, c = hit[0]
                pick = {**base, "verdict": want, "change_kind": c.get("change_kind") if want == "ALTERED" else None,
                        "source_quote": c.get("source_quote", ""), "source_ref": tag}
                others = [f"{t2}: {c2['verdict']}" for t2, c2 in rows if t2 != tag and c2["verdict"] not in SILENT]
                note = (c.get("note") or "").strip()
                if others:
                    note = (note + "; " if note else "") + "other sources: " + ", ".join(others)
                if note:
                    pick["note"] = note
                break
        if pick is None:
            if all(c["verdict"] in EXCLUDED for _, c in rows):
                v = rows[0][1]["verdict"]
                pick = {**base, "verdict": v, "change_kind": None, "source_quote": "", "source_ref": None,
                        "note": rows[0][1].get("note") or v.lower()}
            else:
                v = "NOT_IN_SOURCE" if complete else "NOT_ASSESSABLE"
                pick = {**base, "verdict": v, "change_kind": None, "source_quote": "", "source_ref": None,
                        "note": "no source addresses it: " + ", ".join(f"{t2}: {c2['verdict']}" for t2, c2 in rows)}
        claims.append(pick)
    vs = [c["verdict"] for c in claims]
    counts = {"matches": vs.count("MATCHES"), "altered": vs.count("ALTERED"), "reversed": vs.count("REVERSED"),
              "not_in_source": vs.count("NOT_IN_SOURCE"), "not_assessable": vs.count("NOT_ASSESSABLE"),
              "author_view": vs.count("AUTHOR_VIEW"), "not_a_claim": vs.count("NOT_A_CLAIM")}
    version = parts[tags[0]].get("des_version", "2.8")
    assessable, score, level = vp.des_fidelity_recompute(counts, version)
    fact, interp = compose_fa(claims, counts, assessable, level, version, pooled=True)
    concl = "\n".join(f"[{tag}] {parts[tag].get('source_conclusion', '')}" for tag in tags)
    return {"des_version": version, "mode": "FIDELITY", "scope": "POOLED",
            "text_basis": basis, "claims": claims, "counts": counts, "assessable": assessable,
            "fidelity_score": score, "level": level, "provisional": not complete,
            "source_conclusion": concl, "fact_fa": fact, "interpretation_fa": interp}

FLAGGED = ("ALTERED", "REVERSED")


def vote_source(runs, adjudicated=None, reviewed=None, overruled=None):
    """Majority vote over repeated SOURCE-scope runs of ONE source (workflow
    step 4.13 Part 2c). runs[0] and runs[1] are the two FULL runs; runs[2]
    is the tie-break run over the units the two disagreed on. Per unit:
      * two votes that agree → that answer;
      * two votes that differ → `tiebreak` until the third run covers it;
      * three votes → the (verdict, change_kind) pair at least two share,
        quote/note from the earliest run in it; none shared → `unresolved`
        until `adjudicated[uid]` supplies the claim fields;
      * one vote (a re-check base that judged a unit once) → that answer.
    Every unit whose final verdict is ALTERED/REVERSED needs a stronger-model review
    in `reviewed[uid]` = {"agree": bool, "reason": str}; without one it is
    `unreviewed` and blocks. `agree: true` keeps the flagged verdict (Part 3b
    asks the founder). `agree: false` settles the unit as MATCHES (founder,
    1405/08/15: a lighter majority cannot outrank the reviewer that exists
    to catch its shared misreading): `change_kind` null, `source_quote` and
    `source_ref` kept, and `note` keeps the majority's verdict, kind and note
    beside the reviewer's reason. Counts, score, level and the Persian lines
    are recomputed from the settled claims. When `overruled` is a list, the
    ids so settled are appended to it (reported to the founder as
    information, never asked). Returns (object, tiebreak, unresolved, unreviewed)."""
    adjudicated, reviewed = adjudicated or {}, reviewed or {}
    base = runs[0]
    by_run = [{c["id"]: c for c in r["claims"]} for r in runs]
    claims, tiebreak, unresolved, unreviewed = [], [], [], []
    for c0 in base["claims"]:
        uid = c0["id"]
        votes = [(i, br[uid]) for i, br in enumerate(by_run) if uid in br]
        keys = [(c["verdict"], c.get("change_kind")) for _, c in votes]
        if uid in adjudicated:
            pick = {**c0, **adjudicated[uid]}
        elif len(votes) == 1:
            pick = c0
        elif len(votes) == 2 and keys[0] != keys[1]:
            tiebreak.append(uid)
            pick = c0
        else:
            top = max(set(keys), key=lambda k: (keys.count(k), -keys.index(k)))
            if keys.count(top) * 2 <= len(keys):
                unresolved.append(uid)
                pick = c0
            else:
                pick = votes[keys.index(top)][1]
        assert pick["claim_quote"] == c0["claim_quote"], f"runs disagree on the text of {uid}"
        if pick["verdict"] in FLAGGED and uid not in tiebreak + unresolved:
            r = reviewed.get(uid)
            if r is None:
                unreviewed.append(uid)
            elif not r.get("agree"):
                was = pick["verdict"] + (f"/{pick['change_kind']}" if pick.get("change_kind") else "")
                prior = (pick.get("note") or "").strip()
                pick = {**pick, "verdict": "MATCHES", "change_kind": None,
                        "note": f"Checker majority: {was}" + (f" — {prior}" if prior else "")
                                + "; overruled by the stronger review: " + (r.get("reason") or "").strip()}
                if overruled is not None:
                    overruled.append(uid)
        claims.append(pick)
    vs = [c["verdict"] for c in claims]
    counts = {"matches": vs.count("MATCHES"), "altered": vs.count("ALTERED"), "reversed": vs.count("REVERSED"),
              "not_in_source": vs.count("NOT_IN_SOURCE"), "not_assessable": vs.count("NOT_ASSESSABLE"),
              "author_view": vs.count("AUTHOR_VIEW"), "not_a_claim": vs.count("NOT_A_CLAIM")}
    version = base.get("des_version")
    assessable, score, level = vp.des_fidelity_recompute(counts, version)
    fact, interp = compose_fa(claims, counts, assessable, level, version, pooled=False)
    out = {**base, "claims": claims, "counts": counts, "assessable": assessable,
           "fidelity_score": score, "level": level, "fact_fa": fact, "interpretation_fa": interp}
    return out, tiebreak, unresolved, unreviewed


def caption_carry(base_claims, page_units):
    """Founder ruling 2026-11-07 (publish queue item 24, approval 4): «وقتی فقط
    کپشن اضافه شده فقط کپشن باید چک بشه، بقیه همه تأییدشده». Align the base's
    claims with today's units of the same source by their exact text (the
    claim_quote is the unit, byte for byte) and return (mapping old id → new
    id, the new caption ids, problems). Only inserted <figcaption> units are
    new; any base claim that is gone, changed, split or joined, and any new
    unit that is not a caption, is a problem — then nothing is carried and the
    full step runs again."""
    old_t = [c.get("claim_quote") for c in base_claims]
    new_t = [u["text"] for u in page_units]
    mapping, new, problems = {}, [], []
    sm = difflib.SequenceMatcher(None, old_t, new_t, autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for d in range(i2 - i1):
                mapping[base_claims[i1 + d]["id"]] = page_units[j1 + d]["id"]
            continue
        for i in range(i1, i2):
            problems.append(f"{base_claims[i]['id']} «{(old_t[i] or '')[:60]}» is no longer a unit of the page")
        for u in page_units[j1:j2]:
            if u.get("caption") and tag == "insert":
                new.append(u["id"])
            else:
                problems.append(f"{u['id']} «{u['text'][:60]}» is new and is not a figure caption")
    return mapping, new, problems


def carry_base(base, page_units, k):
    """The base re-keyed to today's ids when captions were added (caption_carry);
    returns (base, new caption ids). Refuses with the reason otherwise."""
    mapping, new, problems = caption_carry(base["claims"], page_units)
    if problems:
        sys.exit(f"src{k}: only figure captions may be added between the base and the page — "
                 + "; ".join(problems[:6]) + (f"; and {len(problems) - 6} more" if len(problems) > 6 else "")
                 + " — run the full step again")
    return {**base, "claims": [{**c, "id": mapping[c["id"]]} for c in base["claims"]]}, new


def carried_base(content_id, base, page_units, k):
    """--vote --base after figure captions were added to the page: the base
    re-keyed to today's ids and the caption ids that need runs; (base, [])
    when the ids did not move or no caption is new (the ordinary re-check
    rules then apply, unchanged)."""
    if [c["id"] for c in base["claims"]] == [u["id"] for u in page_units]:
        return base, []
    _m, new, _p = caption_carry(base["claims"], page_units)
    if not new:
        return base, []
    if content_id and plan_path(content_id).exists():
        sys.exit(f"src{k}: {plan_path(content_id).relative_to(ROOT)} names the old page's unit ids — captions added "
                 "to a page with a recorded plan need the full step")
    return carry_base(base, page_units, k)


def rebase(base, runs, page_units, k):
    """Part 3b re-check: the last full voted object stands for every unit the
    founder did not edit, and the new runs cover the edited ones only. Refuse
    unless the page's units for this source are still the base's units, same
    ids in the same order, each with the same text — except the units the new
    runs judged, whose text must be the page's current text. An edit that
    split or joined a sentence shifts ids, and then only a full run is honest."""
    rechecked = {c["id"] for r in runs for c in r["claims"]}
    base_ids = [c["id"] for c in base["claims"]]
    page_ids = [u["id"] for u in page_units]
    if base_ids != page_ids:
        # spec v3.5 rule 13: a plan may GROW (orphan sweep, founder plan) when
        # every added unit was re-checked; ids still never shift or vanish.
        added = [i for i in page_ids if i not in base_ids]
        if not added or [i for i in page_ids if i in base_ids] != base_ids or set(added) - rechecked:
            sys.exit(f"src{k}: the page's units are no longer the base's (ids shifted) — run the full step again")
        first = {c["id"]: c for c in runs[0]["claims"]} if runs else {}
        by_base = {c["id"]: c for c in base["claims"]}
        base = {**base, "claims": [by_base.get(i) or first[i] for i in page_ids]}
    stale = [u["id"] for u, c in zip(page_units, base["claims"])
             if u["text"] != c["claim_quote"] and u["id"] not in rechecked]
    if stale:
        sys.exit(f"src{k}: {stale} changed on the page but were not re-checked")
    for r in runs:
        for c in r["claims"]:
            cur = next(u["text"] for u in page_units if u["id"] == c["id"])
            if c["claim_quote"] != cur:
                sys.exit(f"src{k}: re-check of {c['id']} judged old text")
    if not runs:
        return [base]
    first = {c["id"]: c for c in runs[0]["claims"]}
    run0 = {**base, "claims": [first.get(c["id"], c) for c in base["claims"]]}
    return [run0] + runs[1:]


SILENT_ONLY = ("NOT_IN_SOURCE", "NOT_ASSESSABLE")


def orphan_units(units, plan, voted):
    """Spec v3.5 rule 12: body units no call judged, or that every call
    judging them left silent. Headings and NOT_A_CLAIM/AUTHOR_VIEW are not
    orphans — the first are labels, the others are excluded by design.
    Before any vote (`voted` empty: the sweep-first order of a multi-source
    page) that is every body unit, the plan's own included: the reviewer
    settles every sentence's source once, then the page is measured once."""
    seen = {}
    for k, v in voted.items():
        for c in v["claims"]:
            seen.setdefault(c["id"], []).append(c["verdict"])
    out = []
    for u in units:
        if u.get("heading"):
            continue
        vs = seen.get(u["id"], [])
        if any(v in EXCLUDED for v in vs):
            continue
        if not vs or all(v in SILENT_ONLY for v in vs):
            out.append(u)
    return out


def unswept(content_id, units, sources, mode, plan):
    """Module 08 Part 2c (founder 2026-11-09): the body sentences of a multi-source
    v3.5+ page that the assignment gives to no source — no source named, none carried
    from the paragraph. They would reach no call, so the orphan sweep is owed before
    they are measured. Empty when the sweep is not needed: one source, POOLED (every
    unit goes to every source), a recorded plan (sweep or founder), records older than
    v3.5, and units that name a cited source with no text (they are about that source)."""
    if mode != "SOURCE" or not is_v35(sources) or sum(1 for s in sources if scorable(s)) < 2:
        return []
    if plan_path(content_id).exists():
        return []
    taken = {i for ids in plan.values() for i in ids}
    decl = declared_for(content_id)
    textless = [markers_for(s) | set(decl.get(k, {}).get("markers", []))
                for k, s in enumerate(sources) if not s.get("error") and not scorable(s)]
    return [u["id"] for u in units
            if not u.get("heading") and u["id"] not in taken and re.search(r"\w", u["text"])
            and not any(names_v35(u["text"], m) for m in textless)]


def refuse_unswept(content_id, units, sources, mode, plan):
    left = unswept(content_id, units, sources, mode, plan)
    if left:
        sys.exit(f"{len(left)} body sentence(s) reach no source on this multi-source page: {left} — the orphan "
                 f"sweep is owed first (module 08 Part 2c): --orphans DIR --texts T → the stronger reviewer's "
                 f"orphans.json → --sweep DIR, then build again")


PACKET_KIND = "dentcast-des-fidelity-packet"


def is_packet(obj):
    return isinstance(obj, dict) and obj.get("kind") == PACKET_KIND


def fidelity_from(path, sources):
    """A finished FIDELITY result as stored in plus/des-scores.json: a list parallel
    to sources (None where no call ran) or a POOLED object. PATH is a JSON file
    (any shape accept() takes) or a directory holding voted-src<k>.json / pooled.json."""
    p = Path(path)
    if p.is_dir():
        if (p / "pooled.json").exists():
            return json.loads((p / "pooled.json").read_text(encoding="utf-8"))
        out = [None] * len(sources)
        for f in p.glob("voted-src*.json"):
            out[int(f.stem[len("voted-src"):])] = json.loads(f.read_text(encoding="utf-8"))
        return out
    obj = json.loads(p.read_text(encoding="utf-8"))
    if isinstance(obj, dict) and "fidelity" in obj and "sources" in obj:
        return obj["fidelity"]
    if isinstance(obj, dict) and obj.get("mode") == "FIDELITY":
        if obj.get("scope") == "POOLED":
            return obj
        idx = [k for k, s in enumerate(sources) if scorable(s)]
        if len(idx) != 1:
            sys.exit("one FIDELITY object for a page with several sources: give a list or a directory")
        out = [None] * len(sources)
        out[idx[0]] = obj
        return out
    if isinstance(obj, dict):
        out = [None] * len(sources)
        for k, v in obj.items():
            out[int(str(k).removeprefix("src"))] = v
        return out
    return obj


def des_quote_rows(rep, sources, texts):
    """Part 3(1) and 3(7) on the packet's DES records: every evidence_quote is in the
    text the packet carries, and the rating rule holds. Arithmetic, band and schema are
    Phase F's (verify_publish.py), which runs on the installed record as always."""
    import des_record_guard as guard  # noqa: PLC0415
    for n, s in enumerate(sources, 1):
        tag = f"src{n - 1}"
        if s.get("error") or s.get("text_basis") == "CITATION_ONLY":
            continue
        t = texts.get(text_key(s, n))
        if not t:
            rep.fail("accept", f"{tag}: the packet carries no source text for {text_key(s, n)}")
            continue
        hay = vp.des_norm(t["source_text"])
        research = [(s.get("s_design") or {}).get("evidence_quote")] + \
            [d.get("evidence_quote") for d in ((s.get("q_method") or {}).get("domains") or [])] + \
            [x.get("evidence_quote") for x in (s.get("penalties") or [])]
        bad = [q for q in research if q and vp.des_norm(q) not in hay]
        rep.check(not bad, "accept", f"{tag} every DES evidence_quote is verbatim in the source text",
                  f"{tag} has {len(bad)} evidence_quote(s) not in the source text, e.g. {bad[0][:60]!r}" if bad else "",
                  "Part 3(1) — rerun the SOURCE call, never hand-patch")
        com = [c for c in (s.get("commentary_checklist") or []) if c.get("evidence_quote")]
        off = [c for c in com if vp.des_norm(c["evidence_quote"]) not in hay and not c.get("note")]
        rep.check(not off, "accept", f"{tag} commentary quotes are in the text (or carry their section note)",
                  f"{tag} has {len(off)} commentary quote(s) in neither the text nor a noted section page",
                  "Part 3(1)")
        for f in guard.rating_findings(s):
            rep.fail("accept", f"{tag} {f['code']}: {f['detail']}", "Part 3(7) — rerun and audit, never hand-patch")


def accept(content_id, sources, units, mode, plan, packet, texts):
    """Module 08 «Acceptance is mechanical» (founder 2026-11-09): the one test a
    Fidelity result from any agent or client must pass. It checks only what can
    be checked — the units are this page's, in the tool's ids; every claim_quote
    is its unit's text; every source_quote is verbatim in the source text; the
    verdicts, kinds, counts, score and level follow the spec (Phase F's own
    des_check_fidelity). It never asks how the result was produced: no model
    ids, no run receipts, no preflight. Returns a verify_publish Report."""
    rep = vp.Report(content_id)
    by_id = {u["id"]: u for u in units}
    if isinstance(packet, dict) and packet.get("mode") == "FIDELITY":
        if mode != "POOLED" and len(plan) != 1:
            rep.fail("accept", f"one FIDELITY object for a page the tool splits into {len(plan)} calls",
                     "give {src<k>: object} or a list parallel to sources")
            return rep
        packet = {"pooled": packet} if mode == "POOLED" else {k: packet for k in plan}
    if isinstance(packet, list):
        packet = {k: f for k, f in enumerate(packet) if f is not None}
    if isinstance(packet, dict):
        packet = {(k if k == "pooled" else int(str(k).removeprefix("src"))): v for k, v in packet.items()}
    else:
        rep.fail("accept", "the packet is not a FIDELITY object, a list parallel to sources, or {src<k>: object}")
        return rep
    rep.check(set(packet) == set(plan), "accept", f"one result per call the tool owes ({sorted(plan, key=str)})",
              f"the packet holds {sorted(packet, key=str)} but the tool owes {sorted(plan, key=str)}",
              "a result for every owed call, nothing else (Part 2b)")
    for k in sorted(set(packet) & set(plan), key=str):
        f, ids = packet[k], plan[k]
        tag = "fidPOOLED" if k == "pooled" else f"fid{k}"
        got = [c.get("id") for c in (f.get("claims") or [])]
        rep.check(got == ids, "accept", f"{tag} judges exactly the tool's units ({len(ids)})",
                  f"{tag} ids differ from the tool's: missing {[i for i in ids if i not in got][:8]}, "
                  f"extra {[i for i in got if i not in ids][:8]}",
                  "units come only from des_fidelity_units.py on the final page text")
        drift = [c.get("id") for c in f.get("claims") or []
                 if c.get("id") in by_id and c.get("claim_quote") != by_id[c["id"]]["text"]]
        rep.check(not drift, "accept", f"{tag} every claim_quote is its unit's text, byte for byte",
                  f"{tag} claim_quote differs from the page on {drift[:8]} — judged on another text",
                  "re-check only those units (Part 3b, --build --only, --vote --base)")
        if k == "pooled":
            ts = [text_for(s, texts, n) for n, s in enumerate(sources, 1) if scorable(s)]
            basis = weakest([t["text_basis"] for t in ts])
            hay = " ".join(vp.des_norm(t["source_text"]) for t in ts)
            scope = "POOLED"
        else:
            t = text_for(sources[k], texts, k + 1)
            basis, hay, scope = sources[k].get("text_basis"), vp.des_norm(t["source_text"]), "SOURCE"
        page_hay = vp.des_norm(" ".join(by_id[i]["text"] for i in ids if i in by_id))
        vp.des_check_fidelity(rep, tag, f, scope, basis, page_hay, hay)
    return rep


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("content_id")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--texts")
    ap.add_argument("--build")
    ap.add_argument("--merge", metavar="DIR", help="fold DIR/out-S<n>.json (one per source) into DIR/pooled.json")
    ap.add_argument("--only", metavar="IDS", help="with --build: keep only these units (comma list), for the "
                    "confirming runs of step 4.13 Part 2c")
    ap.add_argument("--base", metavar="OLD_DIR", help="with --vote: re-check only. OLD_DIR holds the voted-src<k>.json "
                    "of the last full run; DIR holds runs over the EDITED units alone (Part 3b). Every other unit "
                    "must still be on the page with the same id and text, or the tool refuses")
    ap.add_argument("--carry", metavar="OLD_DIR", help="figure captions were added to the page after the full run "
                    "whose voted-src<k>.json is in OLD_DIR (founder 2026-11-07): map every old unit to its new id by "
                    "its text, list the caption units to judge now (with --texts/--build DIR: build blocks of those "
                    "only); refuses when any text other than a caption moved")
    ap.add_argument("--vote", metavar="DIR", help="majority-vote DIR/out-src<k>-<run>.json (runs 1-2 full, run 3 the "
                    "units they disagree on) into DIR/voted-src<k>.json; DIR/review.json holds the stronger-model "
                    "review of every flagged unit; DIR/adjudicate.json "
                    "{\"src<k>\": {uid: claim fields}} settles a unit with no majority")
    ap.add_argument("--orphans", metavar="DIR", help="spec v3.5 rule 12: after --vote DIR, list the units no call judged "
                    "or every call left silent and write DIR/orphans-input.json (needs --texts) for the stronger reviewer")
    ap.add_argument("--sweep", metavar="DIR", help="spec v3.5 rule 12: verify DIR/orphans.json and add each found unit "
                    "to that source in the recorded plan; prints the units to re-check and the ones found nowhere")
    ap.add_argument("--accept", metavar="FILE", help="module 08 «Acceptance is mechanical»: check a finished "
                    "FIDELITY result (one object, a list parallel to sources, or {src<k>: object}; a voted-src<k>.json "
                    "or a des-scores fidelity slot) against this page and --texts; exit 0 = accepted. Asks nothing "
                    "about how it was produced")
    ap.add_argument("--pack", metavar="OUT", help="write ONE handoff file (DES + FIDELITY + the source texts they "
                    "were judged on) for another agent or client; needs --texts, takes --fidelity, refuses unless the "
                    "packet passes --accept. OUT must be outside the repository (it holds the papers' text)")
    ap.add_argument("--fidelity", metavar="FILE_OR_DIR", help="with --pack: the finished FIDELITY result (a file, or "
                    "the vote directory with voted-src<k>.json / pooled.json); default: the stored record's")
    ap.add_argument("--des", metavar="FILE", help="with --pack: the DES record {scored_at, sources} when it is not "
                    "(yet) in plus/des-scores.json")
    ap.add_argument("--install", action="store_true", help="with --accept PACKET: once accepted, write its DES and "
                    "FIDELITY into plus/des-scores.json under content_id (Part 4); then run Phase F as always")
    a = ap.parse_args()
    sp = ROOT / "plus/des-scores.json"
    store = json.loads(sp.read_text(encoding="utf-8")) if sp.exists() else {}
    rec = store.get(a.content_id)
    packet = None
    if a.accept:
        packet = json.loads(Path(a.accept).read_text(encoding="utf-8"))
        if is_packet(packet):
            if packet.get("content_id") != a.content_id:
                sys.exit(f"the packet is for {packet.get('content_id')!r}, not {a.content_id!r}")
            rec = {**packet["des"], "fidelity": packet["fidelity"]}
        else:
            packet = None
    if a.pack and a.des:
        rec = json.loads(Path(a.des).read_text(encoding="utf-8"))
    if not rec:
        sys.exit(f"no DES record for {a.content_id}")
    if is_audio_episode(a.content_id):
        print(f"{a.content_id}: audio episode — DES only, no FIDELITY call (founder, 1405/08/04)")
        if a.build or a.vote or a.merge:
            sys.exit("refusing to build or vote FIDELITY for an audio episode")
        return
    sources = rec["sources"]
    units = split_page(a.content_id, sources)  # keeps the cut its stored record was judged on
    mode, plan = assign(units, sources, a.content_id)
    if a.pack or a.accept:
        refuse_unswept(a.content_id, units, sources, mode, plan)
    if a.pack:
        if not a.texts:
            sys.exit("--pack needs --texts (the packet carries the text every quote is checked against)")
        out = Path(a.pack).resolve()
        if ROOT.resolve() in out.parents:
            sys.exit("--pack OUT must be outside the repository: the packet holds the papers' text, which never "
                     "enters public Git history")
        texts = {k.lower(): v for k, v in json.loads(Path(a.texts).read_text(encoding="utf-8")).items()}
        fid = fidelity_from(a.fidelity, sources) if a.fidelity else rec.get("fidelity")
        if fid is None:
            sys.exit("no FIDELITY result: give --fidelity (the vote directory or file)")
        want = {text_key(s, n) for n, s in enumerate(sources, 1)
                if not s.get("error") and s.get("text_basis") != "CITATION_ONLY"}
        packet = {"kind": PACKET_KIND, "version": 1, "content_id": a.content_id,
                  "des": {"scored_at": rec.get("scored_at"), "sources": sources}, "fidelity": fid,
                  "texts": {k: v for k, v in texts.items() if k in want}}
        if a.accept is None:
            a.accept = "(packet)"
    if a.accept:
        texts = packet.get("texts") if packet else None
        if a.texts:
            texts = {k.lower(): v for k, v in json.loads(Path(a.texts).read_text(encoding="utf-8")).items()}
        if texts is None:
            sys.exit("--accept needs --texts (or a packet, which carries them)")
        if packet:
            fid = packet["fidelity"]
        else:
            fid = json.loads(Path(a.accept).read_text(encoding="utf-8"))
            if isinstance(fid, dict) and "fidelity" in fid and "sources" in fid:
                fid = fid["fidelity"]          # a whole des-scores record
        rep = accept(a.content_id, sources, units, mode, plan, fid, texts)
        if packet:
            des_quote_rows(rep, sources, texts)
        print(rep.render())
        if rep.failures:
            sys.exit(f"NOT ACCEPTED — {len(rep.failures)} mechanical check(s) failed (rows above); "
                     "nothing else is a reason to refuse")
        if a.pack:
            out.write_text(json.dumps(packet, ensure_ascii=False, indent=1), encoding="utf-8")
            print(f"PACKED {out} — hand this one file over; the receiver runs: python3 tools/des_fidelity_units.py "
                  f"{a.content_id} --accept <file> --install")
            return
        print("ACCEPTED — the result is this page's and checks out mechanically; no receipt, model id or "
              "re-run is owed (module 08, «Acceptance is mechanical»)")
        if a.install:
            if not packet:
                sys.exit("--install takes a packet (--pack's file)")
            new_rec = {**packet["des"], "fidelity": packet["fidelity"]}
            if store.get(a.content_id) == new_rec:
                print("plus/des-scores.json already holds exactly this record — nothing to write")
                return
            import queue_install_des as qi  # noqa: PLC0415  (the queue's byte-preserving writer)
            path = ROOT / "plus/des-scores.json"
            path.write_bytes(qi.append_entries(path, [(a.content_id, new_rec)]).encode("utf-8"))
            print(f"INSTALLED into plus/des-scores.json[{a.content_id!r}] — Part 3b for any unit still "
                  "ALTERED/REVERSED, then Phase F (verify_publish.py) as always")
        return
    if a.merge:
        if mode != "POOLED":
            sys.exit("--merge is for a POOLED page")
        d = Path(a.merge)
        parts = {p.stem[4:]: json.loads(p.read_text(encoding="utf-8")) for p in sorted(d.glob("out-S*.json"))}
        want = {f"S{n}" for n, s in enumerate(sources, 1) if scorable(s)}
        if set(parts) != want:
            sys.exit(f"--merge needs {sorted(want)}, found {sorted(parts)}")
        # the pooled basis is the weakest of the PARTS' own (each copied its
        # input's), which is the same as the sources' for a paper and the only
        # honest reading for a NOT_APPRAISABLE source (v3.1)
        merged = merge_pooled(parts, weakest([p.get("text_basis") for p in parts.values()]))
        (d / "pooled.json").write_text(json.dumps(merged, ensure_ascii=False, indent=1), encoding="utf-8")
        print(d / "pooled.json", merged["fidelity_score"], merged["level"])
        return
    if a.vote:
        d = Path(a.vote)
        adj_p = d / "adjudicate.json"
        adj = json.loads(adj_p.read_text(encoding="utf-8")) if adj_p.exists() else {}
        rev_p = d / "review.json"
        rev = json.loads(rev_p.read_text(encoding="utf-8")) if rev_p.exists() else {}
        open_units = 0
        by_id = {u["id"]: u for u in units}
        for k in sorted(plan, key=str):
            if k == "pooled":
                sys.exit("--vote is per source (scope SOURCE); a POOLED page votes each S<n> part, then --merge")
            runs = [json.loads(p.read_text(encoding="utf-8"))
                    for p in sorted(d.glob(f"out-src{k}-*.json"), key=lambda p: int(p.stem.rsplit("-", 1)[1]))]
            base_p = Path(a.base) / f"voted-src{k}.json" if a.base else None
            if base_p and not base_p.exists():
                # v3.5 rule 13: a source the sweep gave its first units has no
                # base; its runs must then cover every unit it holds
                got = {c["id"] for r in runs for c in r["claims"]}
                if not (is_v35(sources) and runs and set(plan[k]) <= got):
                    sys.exit(f"--base: no {base_p}")
                base_p = None
            if base_p:
                base = json.loads(base_p.read_text(encoding="utf-8"))
                base, carried = carried_base(a.content_id, base, [by_id[i] for i in plan[k]], k)
                if carried:
                    # Part 2c step 1 for the units judged now: two runs each
                    short = [i for i in carried if sum(i in {c["id"] for c in r["claims"]} for r in runs) < 2]
                    if short:
                        sys.exit(f"src{k}: captions added since the base: {short} need two checker runs each "
                                 f"(out-src{k}-1.json and -2.json over --carry's blocks)")
                    print(f"src{k}: captions added since the base — {len(base['claims'])} unit(s) carried with their "
                          f"verdicts, {len(carried)} caption unit(s) judged now: {carried}")
                if a.texts:
                    # spec v3.5 rule 14: a source text that grew since the base
                    old_p = Path(a.base) / f"input-src{k}.json"
                    if not old_p.exists():
                        sys.exit(f"--texts with --base: no {old_p} (the base's own input) to compare the text with")
                    texts = {kk.lower(): vv for kk, vv in json.loads(Path(a.texts).read_text(encoding="utf-8")).items()}
                    old_t = _squash(json.loads(old_p.read_text(encoding="utf-8"))["source_text"])
                    new_t = _squash(text_for(sources[k], texts, k + 1)["source_text"])
                    if old_t != new_t:
                        if old_t not in new_t:
                            sys.exit(f"src{k}: the source text changed and does not contain the base's — run the full step")
                        rech = {c["id"] for r in runs for c in r["claims"]}
                        owed = [c["id"] for c in base["claims"] if c["verdict"] != "MATCHES" and c["id"] not in rech]
                        if owed:
                            sys.exit(f"src{k}: the source text grew; re-check every non-MATCHES unit first: {owed}")
                runs = rebase(base, runs, [by_id[i] for i in plan[k]], k)
            elif not a.base:
                # Part 2c step 1: two full checker runs per block, always — also on a
                # one-source page. A sentence one run calls MATCHES is otherwise never
                # looked at again; the second run is never skipped.
                want = set(plan[k])
                full = [r for r in runs[:2] if want <= {c["id"] for c in r.get("claims", [])}]
                if len(full) < 2:
                    sys.exit(f"src{k}: --vote needs two full checker runs (out-src{k}-1.json and -2.json, every unit "
                             "of the block); the second run is never skipped (step 4.13 Part 2c)")
            if not runs:
                continue
            overruled = []
            out, tiebreak, unresolved, unreviewed = vote_source(runs, adj.get(f"src{k}"), rev.get(f"src{k}"),
                                                                overruled)
            (d / f"voted-src{k}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
            flagged = [c["id"] for c in out["claims"] if c["verdict"] in FLAGGED]
            print(f"src{k}: {len(runs)} run(s) · {out['fidelity_score']} {out['level']} · "
                  f"flagged {flagged or '—'} · tie-break {tiebreak or '—'} · no majority {unresolved or '—'} · "
                  f"awaiting stronger-model review {unreviewed or '—'} · "
                  f"overruled by the stronger review → MATCHES (report, do not ask) {overruled or '—'}")
            open_units += len(tiebreak) + len(unresolved) + len(unreviewed)
        if open_units:
            sys.exit(f"{open_units} unit(s) open — tie-break run (--only), {adj_p} for no majority, "
                     f"{rev_p} for the stronger-model review of every flagged unit")
        return
    if (a.orphans or a.sweep) and not is_v35(sources):
        sys.exit("--orphans/--sweep are spec v3.5 steps; this page's records are older")
    if a.orphans:
        if not a.texts:
            sys.exit("--orphans needs --texts (the reviewer reads every source)")
        d = Path(a.orphans)
        voted = {int(p.stem[len("voted-src"):]): json.loads(p.read_text(encoding="utf-8"))
                 for p in d.glob("voted-src*.json")}
        if mode != "SOURCE":
            sys.exit("--orphans is for a SOURCE-scope page")
        if not voted and sum(1 for s in sources if scorable(s)) < 2:
            sys.exit("--orphans before a vote is the multi-source order; a one-source page has no sweep "
                     "(module 08 Part 2c, single-source tier)")
        texts = {k.lower(): v for k, v in json.loads(Path(a.texts).read_text(encoding="utf-8")).items()}
        orph = orphan_units(units, plan, voted)
        srcs = [{"tag": f"S{n}", "text_basis": text_for(s, texts, n)["text_basis"],
                 "source_text": text_for(s, texts, n)["source_text"]}
                for n, s in enumerate(sources, 1) if scorable(s)]
        blk = {"mode": "ORPHAN_SWEEP", "phase": "after_vote" if voted else "before_runs", "units": [{k2: v for k2, v in u.items() if k2 not in INTERNAL} for u in orph],
               "sources": srcs,
               "answer": "orphans.json: {uid: {found: 'S<n>'|null, source_quote, note}} — find, never judge"}
        (d / "orphans-input.json").write_text(json.dumps(blk, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"{len(orph)} orphan unit(s): {[u['id'] for u in orph]} -> {d / 'orphans-input.json'}")
        return
    if a.sweep:
        d = Path(a.sweep)
        blk = json.loads((d / "orphans-input.json").read_text(encoding="utf-8"))
        ans = json.loads((d / "orphans.json").read_text(encoding="utf-8"))
        want = [u["id"] for u in blk["units"]]
        missing = [i for i in want if i not in ans]
        if missing:
            sys.exit(f"orphans.json does not answer {missing}")
        hay = {s["tag"]: vp.des_norm(s["source_text"]) for s in blk["sources"]}
        found, absent = {}, []
        for uid in want:
            r = ans[uid]
            tag = r.get("found")
            if tag is None:
                absent.append(uid)
                continue
            if tag not in hay:
                sys.exit(f"{uid}: found in {tag!r}, which is not a source of the block")
            q = vp.des_norm(r.get("source_quote") or "")
            if not q or q not in hay[tag]:
                sys.exit(f"{uid}: source_quote is not a verbatim substring of {tag} (rule 2)")
            found.setdefault(int(tag[1:]) - 1, []).append(uid)
        p = plan_path(a.content_id)
        rec = json.loads(p.read_text(encoding="utf-8")) if p.exists() else \
            {"content_id": a.content_id, "origin": "orphan_sweep", "plan": {str(k): v for k, v in plan.items()}}
        order = [u["id"] for u in units]
        for k, ids in found.items():
            cur = set(rec["plan"].get(str(k), [])) | set(ids)
            rec["plan"][str(k)] = sorted(cur, key=order.index)
        rec.setdefault("sweep", []).append({"found": {f"S{k + 1}": v for k, v in found.items()},
                                            "absent": absent, "receipt": str(d / "orphans.json")})
        if found:
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(json.dumps(rec, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        if blk.get("phase") == "before_runs":
            for k, ids in found.items():
                print(f"src{k}: {len(ids)} unit(s) found")
            print("every sentence's source is settled: --build DIR --texts T (full blocks), two checker runs "
                  "per block, --vote DIR (module 08 Part 2c)")
        else:
            for k, ids in found.items():
                print(f"src{k}: re-check {','.join(ids)} (--build --only, two runs, --vote --base)")
        print(f"found in no source (report to the founder): {absent or '—'}")
        return
    if a.carry:
        # founder ruling 2026-11-07: captions added after a full run → only they are judged
        if mode == "POOLED":
            sys.exit("--carry is per source (scope SOURCE); a POOLED page runs its full step")
        if plan_path(a.content_id).exists():
            sys.exit(f"{plan_path(a.content_id).relative_to(ROOT)} names the old page's unit ids — captions added "
                     "to a page with a recorded plan need the full step")
        by_id = {u["id"]: u for u in units}
        report, todo = {}, []
        for k in sorted(plan, key=str):
            base_p = Path(a.carry) / f"voted-src{k}.json"
            if not base_p.exists():
                sys.exit(f"--carry: no {base_p} (the last full run's vote)")
            base = json.loads(base_p.read_text(encoding="utf-8"))
            cur = [by_id[i] for i in plan[k]]
            moved, new = carry_base(base, cur, k)
            report[f"src{k}"] = {"carried": len(moved["claims"]),
                                 "renumbered": sum(c["id"] != m["id"] for c, m in zip(base["claims"], moved["claims"])),
                                 "judge_now": new}
            todo += new
        print(json.dumps({"carry": report, "units_on_page": len(units),
                          "next": "two checker runs over the blocks of judge_now only, then "
                                  f"--vote DIR --base {a.carry}" if todo else "nothing new: the base stands"},
                         ensure_ascii=False, indent=1))
        if not a.build:
            return
        if not todo:
            return
        a.only = ",".join(todo)
    if a.build:
        if not a.texts:
            sys.exit("--build needs --texts")
        texts = {k.lower(): v for k, v in json.loads(Path(a.texts).read_text(encoding="utf-8")).items()}
        if not a.only:
            refuse_unswept(a.content_id, units, sources, mode, plan)
        if a.only:
            keep = set(a.only.split(","))
            plan = {k: [i for i in ids if i in keep] for k, ids in plan.items()}
            plan = {k: ids for k, ids in plan.items() if ids}
        for p in build(a.content_id, sources, units, mode, plan, texts, a.build):
            print(p)
        return
    if a.json:
        print(json.dumps({"mode": mode, "units": units, "plan": {str(k): v for k, v in plan.items()},
                          "sources": sum(1 for s in sources if scorable(s)),
                          "unswept": unswept(a.content_id, units, sources, mode, plan)},
                         ensure_ascii=False, indent=1))
        return
    print(f"{a.content_id}: {len(units)} units, scope {mode}")
    left = unswept(a.content_id, units, sources, mode, plan)
    if left:
        print(f"  orphan sweep owed before the build: {len(left)} body sentence(s) reach no source {left}")
    for k, ids in plan.items():
        label = "pooled" if k == "pooled" else f"src{k} {sorted(markers_for(sources[k]))}"
        print(f"  {label}: {len(ids)} units")


if __name__ == "__main__":
    main()
