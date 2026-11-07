#!/usr/bin/env python3
"""Guards around a DES SOURCE record: rating rule, one record per paper, rating audit.

Module 08 (Part 1, Part 2, Part 2d, Part 3(7)). Three things the earlier Part 3
checks (quotes, arithmetic, band, schema, Persian text) cannot see, because they
check that a record is well-formed, not that its ratings follow Step 3b.

WHY (publish-queue preparation, 2026-11-07). Elgamal et al. 2025
(10.1186/s12903-025-06214-9, FULL_TEXT) was scored 52/C three times with
ROBINS-I `missing data` = `some_concerns`, while the record's own note said
"no participant flow, no statement of losses or exclusions" and its quote
("each participant in specific areas, including occlusal") was not about
losses at all. Spec 3b line 1: under FULL_TEXT, silence is `high`, so the
record should have read 0.55 → 36/D. Every existing check passed it; it was
caught only because queue item 22 had already scored the same DOI.

  check FILE                 (1) the rating-rule check on a des.json, a bare SOURCE
                             object, a list, or a des-scores-shaped {content_id: record}.
                             Exit 1 on any finding (a record about to be stored is new).
  lookup DOI                 (2) every stored SOURCE record for this DOI (case-insensitive):
                             plus/des-scores.json and the queue items on branch `queue`.
  compare FILE               (2) each RESEARCH source of FILE against the stored records of
                             its DOI: s_design, question_type, tool, domain ratings,
                             multiplier, penalties, score, band. Exit 1 on any difference.
  audit-build FILE --texts T --out DIR
                             (3) the stronger reviewer's rating-audit blocks
                             (DIR/audit-system.md + DIR/audit-input-src<k>.json).
  audit-apply DIR --record FILE --texts T
                             (3) validate DIR/audit-src<k>.json and compare every audited
                             3b line with the record's rating; writes DIR/audit-receipt.json.
                             Exit 1 when a line disagrees (the record is invalid: rerun or
                             adjudication, never a hand patch), 2 when the audit is malformed.

The record is never modified by any of these commands.
"""
import argparse
import glob
import hashlib
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "plus" / "des-scores.json"
# The current spec's system-prompt cut. The Part 2d audit takes Step 3 (3a–3b-ii)
# from it verbatim, so a spec bump moves this path (v3.6: 3b-ii «What addresses a
# domain», the reading the Elgamal record split on).
KNOWLEDGE = ROOT / ".dentcast" / "des-v3.6-knowledge.md"

# The day the rating-rule check became binding (publish-queue item 22 / the
# Elgamal record, founder session 2026-11-07). Phase F fails a finding on a
# source stamped >= 3.5 in a record scored on or after this day and reports
# it as a warning on older records, which are never re-labelled or re-scored
# by a rule that postdates them (module 08, «des-version-history»). It stays
# binding on every later stamp (3.6 states the rule in the spec itself, 3b-ii).
RATING_RULE_FROM = "2026-11-07"
RATING_RULE_VERSION = (3, 5)

# ── (1) the rating-rule check ─────────────────────────────────────────────
#
# Spec 3b: `some_concerns` is line 4 — "the text ADDRESSES it but partially or
# ambiguously". Two shapes of a record contradict that line by themselves:
#
#   EMPTY_QUOTE   a `low` or `some_concerns` domain with no evidence_quote
#                 (Core Rule 2: only an absence-based `high` may omit it).
#   ABSENCE_NOTE  (FULL_TEXT only) a `some_concerns` domain whose note states
#                 that the safeguard's content is absent AND whose quote holds
#                 no word of that domain. The quote is the text addressing the
#                 domain; when it is about something else and the note says the
#                 rest is missing, the record itself shows silence — line 1.
#
# Why both conditions and not the note alone (measured on every stored record,
# 2026-11-07): an absence phrase sits in the note of almost every legitimate
# «described, one element missing» rating («allocation concealment is not
# mentioned», «assessor blinding never mentioned» — spec 3b-ii, Hälg 2008).
# 31 of the stored FULL_TEXT `some_concerns` domains carry one; the note
# alone would fail queue item 22's own correct record. The off-domain quote is
# what separates the Elgamal record from them.
#
# The AMSTAR-2 excluded-studies domain is exempt from ABSENCE_NOTE: its
# `some_concerns` (3b-iii line 2) is by definition «no list, but…», so its note
# always states an absence.

ABSENCE_EN = [
    r"\bno (?:explicit |formal |clear |separate |dedicated )?(?:statement|mention|description|report(?:ing)?|"
    r"information|account|data|details?|declaration|disclosure)\b",
    r"\bno (?:[\w-]+ ){0,3}(?:(?:was|were|is|are) )?(?:reported|described|stated|mentioned|declared|disclosed|"
    r"documented|given|provided|found)\b",
    r"\b(?:not|never) (?:[\w-]+ )?(?:reported|described|stated|mentioned|specified|addressed|documented|disclosed|"
    r"declared|discussed)\b",
    r"\bnever (?:[\w-]+ )?(?:states?|reports?|mentions?|describes?|addresses?|documents?|specifies?|gives?)\b",
    r"\b(?:does|do|did) not (?:report|describe|state|mention|address|document|specify|disclose|declare|discuss|give)\b",
    r"\bsilent\b|\bsilence\b",
    r"\bnothing (?:is |was )?(?:reported|stated|said|described)\b",
    r"\bno (?:participant|patient|subject|specimen|sample) flow\b|\bno flow diagram\b",
    r"\bno (?:mention|reference|word) of\b|\bwithout (?:any )?(?:mention|statement|report(?:ing)?|description) of\b",
]
ABSENCE_FA = [
    r"ذکر\s*نشده", r"گزارش\s*نشده", r"اشاره(?:‌|\s)?ای\s+(?:\S+\s+){0,6}?نشده", r"هیچ\s+اشاره",
    r"توصیف\s*نشده", r"بیان\s*نشده", r"نیامده", r"سکوت", r"حرفی\s+(?:\S+\s+){0,4}?نزده",
]
# Phrases that look like absence and are not: an affirmative disclosure («no
# conflicts of interest»), «not applicable», a penalty row that did not fire,
# a reported zero («no losses occurred»).
ABSENCE_GUARD = [
    r"\bnot applicable\b", r"\bno penalty\b", r"\bno (?:potential |financial )?(?:conflicts?|competing)\b",
    r"\bno (?:losses|dropouts?|drop-outs?|withdrawals?|exclusions?) (?:occurred|were (?:observed|recorded))\b",
]

_MISSING = (r"missing|\blos[st]\b|losses|drop-?\s?outs?|withdr|attrition|exclu|follow(?:ed)?[- ]up|complet|\bflow\b|"
            r"analy[sz]|\bn\s?=|\bnumber of\b|retain|available|incomplete|discontinu|censor|recall|\black")
_MEASURE = (r"measur|assess|exami|evaluat|blind|mask|calibrat|observer|rater|investigator|radiolog|operator|record|"
            r"scor|reliab|agreement|\bicc\b|kappa|repeat|software|instrument|device|criteri|outcome|scan|superimpos|"
            r"deviation|digital|probing|radiograph")
# The words a quote about each fixed domain (spec 3a) uses. Broad on purpose:
# a miss here makes a correct record look off-domain, so the list errs toward
# "on-domain". An unknown domain label is never judged off-domain.
DOMAIN_WORDS = {
    "randomization process": r"random|allocat|sequence|conceal|envelope|stratif|\bblock|computer|coin|lottery|assign",
    "deviations from intended interventions": (r"blind|mask|protocol|intention|\bitt\b|per[- ]protocol|deviat|adher|"
                                               r"complian|cross-?over|operator|surgeon|clinician|treat|interven|placebo|"
                                               r"sham|allocat|received|performed"),
    "missing outcome data": _MISSING,
    "missing data": _MISSING,
    "measurement of the outcome": _MEASURE,
    "selection of the reported result": r"regist|protocol|pre-?specif|a priori|\bplan|trial|clinicaltrials|outcome",
    "confounding": r"confound|adjust|match|stratif|multivari|regression|covariat|baseline|comparab|propensity|restrict|own control",
    "selection of participants": (r"inclu|exclu|eligib|consecutive|recruit|select|enrol|criteri|invited|taken|referred|"
                                  r"sample|participants? (?:between|aged|were)"),
    "classification of interventions/exposures": (r"group|classif|defin|expos|interven|assign|received|treated|cohort|"
                                                  r"categor|restor|implant|prosthes|denture|workflow"),
    "protocol registered before commencement": r"protocol|regist|prospero|a priori|\bosf\b",
    "adequacy of the literature search": (r"search|database|medline|pubmed|embase|scopus|cochrane|web of science|"
                                          r"scholar|keyword|lilacs"),
    "justification for excluding individual studies": r"exclu|full[- ]text|screen|prisma|flow|eligib",
    "risk of bias assessment of included studies": (r"bias|quality|apprais|\brob|newcastle|jadad|grade|robins|checklist|"
                                                    r"critical|amstar|quadas"),
    "appropriateness of meta-analytical methods": (r"meta|pool|random[- ]effect|fixed|heterogen|\bi2|i²|model|forest|"
                                                   r"statist|synthes"),
    "assessment of publication bias": r"publication bias|funnel|egger|begg|small[- ]stud|reporting bias",
    "clearly stated aims": r"aim|objective|purpose|hypothes|goal",
    "sample size justification": r"sample size|power|calculat|g\*?power|effect size",
    "randomization / allocation of specimens": r"random|allocat|assign|divided|distribut|group",
    "operator and assessor blinding": r"blind|mask|operator|assessor|examiner|investigator|calibrat|single|same",
    "appropriate statistical analysis": (r"statist|\btest|anova|t-test|p\s?[<=>]|signific|analy[sz]|kruskal|wilcoxon|"
                                         r"tukey|regression|spss|alpha|mann"),
    "conflict of interest / funding": r"conflict|interest|fund|grant|support|sponsor|compet|financ|declar|disclos",
    "patient selection": r"patient|consecutive|random|inclu|exclu|recruit|select|eligib|case-control|enrol",
    "index test": r"index|test|threshold|blind|interpret|cut-?off",
    "reference standard": r"reference|gold standard|standard|blind|histolog",
    "flow and timing": r"interval|timing|time|flow|all patients|received|exclu|withdr|same day",
}
EXCLUDED_STUDIES = "justification for excluding individual studies"


def ver_ge(version, target):
    if not isinstance(version, str):
        return False
    try:
        major, _, minor = version.partition(".")
        return (int(major), int(minor or 0)) >= target
    except ValueError:
        return False


def absence_phrases(note):
    """The absence statements in a domain note (English and Persian), after the guards."""
    text = str(note or "")
    for g in ABSENCE_GUARD:
        text = re.sub(g, " ", text, flags=re.I)
    out = [m.group(0) for p in ABSENCE_EN for m in re.finditer(p, text, re.I)]
    out += [m.group(0) for p in ABSENCE_FA for m in re.finditer(p, text)]
    return out


def quote_on_domain(domain, quote):
    """True / False, or None when the domain label is not one of spec 3a's."""
    pat = DOMAIN_WORDS.get(str(domain or "").strip().lower())
    if pat is None:
        return None
    return bool(re.search(pat, str(quote or ""), re.I))


def rating_findings(src):
    """[{domain, rating, code, detail}] for one SOURCE object; [] when it is not RESEARCH."""
    out = []
    if not isinstance(src, dict) or src.get("content_type") != "RESEARCH":
        return out
    full = src.get("text_basis") == "FULL_TEXT"
    for d in ((src.get("q_method") or {}).get("domains") or []):
        if not isinstance(d, dict):
            continue
        dom, rating = d.get("domain"), d.get("rating")
        quote, note = str(d.get("evidence_quote") or ""), str(d.get("note") or "")
        if rating in ("low", "some_concerns") and not quote.strip():
            out.append({"domain": dom, "rating": rating, "code": "EMPTY_QUOTE",
                        "detail": f"«{dom}» is rated {rating} with an empty evidence_quote — only an absence-based "
                                  "`high` may omit the quote (spec Core Rule 2, 3b)"})
            continue
        if not full or rating != "some_concerns" or str(dom or "").strip().lower() == EXCLUDED_STUDIES:
            continue
        said = absence_phrases(note)
        if said and quote_on_domain(dom, quote) is False:
            out.append({"domain": dom, "rating": rating, "code": "ABSENCE_NOTE",
                        "detail": f"«{dom}» is some_concerns under FULL_TEXT, but its note states absence "
                                  f"({'; '.join(dict.fromkeys(said))}) and its quote ({quote[:70]!r}) is not about "
                                  "this domain — the record shows silence, which spec 3b line 1 rates `high`"})
    return out


def rating_rule_binding(src, scored_at):
    """Phase F: FAIL (True) or WARN (False). A record about to be stored has no scored_at yet: binding."""
    return ver_ge(src.get("des_version"), RATING_RULE_VERSION) and (not scored_at or str(scored_at) >= RATING_RULE_FROM)


# ── reading records ───────────────────────────────────────────────────────

def sources_of(obj):
    """[(label, scored_at, source)] from a des.json, a bare SOURCE object, a list, or {content_id: record}."""
    if isinstance(obj, list):
        return [(f"src{i}", None, s) for i, s in enumerate(obj)]
    if isinstance(obj, dict) and isinstance(obj.get("sources"), list):
        return [(f"src{i}", obj.get("scored_at"), s) for i, s in enumerate(obj["sources"])]
    if isinstance(obj, dict) and "des_version" in obj:
        return [("src0", None, obj)]
    if isinstance(obj, dict):
        out = []
        for cid, rec in obj.items():
            if isinstance(rec, dict) and isinstance(rec.get("sources"), list):
                out += [(f"{cid}#src{i}", rec.get("scored_at"), s) for i, s in enumerate(rec["sources"])]
        return out
    return []


def load(path):
    text = Path(path).read_text(encoding="utf-8").strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
    return json.loads(text)


def norm_doi(doi):
    d = str(doi or "").strip().lower()
    return re.sub(r"^(?:https?://(?:dx\.)?doi\.org/|doi:\s*)", "", d)


def record_sha256(src):
    return hashlib.sha256(json.dumps(src, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()


def queue_records(queue_ref="origin/queue", queue_dir=None):
    """[(item, index, source)] from every queue item's 05-DES-Fidelity/des.json, read without writing:
    `git show <ref>:<path>` first, the filesystem (--queue-dir) when the ref is not there."""
    found = []
    try:
        names = subprocess.run(["git", "-C", str(ROOT), "ls-tree", "-r", "--name-only", queue_ref, "--", "queue"],
                               capture_output=True, text=True, check=True).stdout.splitlines()
        for n in names:
            if n.endswith("/05-DES-Fidelity/des.json"):
                blob = subprocess.run(["git", "-C", str(ROOT), "show", f"{queue_ref}:{n}"],
                                      capture_output=True, text=True, check=True).stdout
                found.append((n.split("/")[1], json.loads(blob)))
    except (subprocess.CalledProcessError, ValueError, OSError):
        found = []
    if not found and queue_dir:
        for p in sorted(glob.glob(str(Path(queue_dir) / "*" / "05-DES-Fidelity" / "des.json"))):
            try:
                found.append((Path(p).parts[-3], json.loads(Path(p).read_text(encoding="utf-8"))))
            except ValueError:
                continue
    out = []
    for item, des in found:
        for label, _, s in sources_of(des):
            out.append((item, int(label.rsplit("src", 1)[1]), s))
    return out


def existing_records(doi, queue_ref="origin/queue", queue_dir=None, site=SITE):
    """Every stored SOURCE record whose citation.doi is this DOI (case-insensitive)."""
    want = norm_doi(doi)
    out = []
    data = json.loads(Path(site).read_text(encoding="utf-8")) if Path(site).exists() else {}
    for cid, rec in data.items():
        for i, s in enumerate((rec or {}).get("sources") or []):
            if isinstance(s, dict) and norm_doi((s.get("citation") or {}).get("doi")) == want:
                out.append({"where": "site", "id": cid, "index": i, "source": s})
    for item, i, s in queue_records(queue_ref, queue_dir):
        if isinstance(s, dict) and norm_doi((s.get("citation") or {}).get("doi")) == want:
            out.append({"where": "queue", "id": item, "index": i, "source": s})
    return out


def summary(s):
    qm = s.get("q_method") or {}
    return {"des_version": s.get("des_version"), "text_basis": s.get("text_basis"),
            "question_type": s.get("question_type"), "s_design": (s.get("s_design") or {}).get("value"),
            "tool": qm.get("tool"), "multiplier": qm.get("multiplier"),
            "domains": [[d.get("domain"), d.get("rating")] for d in (qm.get("domains") or [])],
            "penalties": [[p.get("base_points"), p.get("points")] for p in (s.get("penalties") or [])],
            "des_score": s.get("des_score"), "band": s.get("band"), "record_sha256": record_sha256(s)}


COMPARED = ("question_type", "s_design", "tool", "multiplier", "domains", "penalties", "des_score", "band")


def differences(new, old):
    a, b = summary(new), summary(old)
    out = []
    for k in COMPARED:
        if k == "domains":
            da, db = dict(map(tuple, a[k])), dict(map(tuple, b[k]))
            for dom in list(dict.fromkeys(list(da) + list(db))):
                if da.get(dom) != db.get(dom):
                    out.append({"field": f"domain «{dom}»", "new": da.get(dom), "stored": db.get(dom)})
        elif a[k] != b[k]:
            out.append({"field": k, "new": a[k], "stored": b[k]})
    return out


def comparable(new, old):
    """A stored record is the same measurement only under the same text_basis and des_version."""
    return new.get("text_basis") == old.get("text_basis") and new.get("des_version") == old.get("des_version")


# ── (3) the rating audit ──────────────────────────────────────────────────

LINE_RATING = {1: "high", 2: "high", 3: "low", 4: "some_concerns", 5: "NR"}

AUDIT_INSTRUCTION = """You are the stronger reviewer of a DentCast Evidence Score (DES) record. This is a RATING AUDIT, not a scoring call: never produce a DES object, never rescore, never rescale, never compute a multiplier or a score.

Below are the spec's own Step 3 rules (3a, 3b, 3b-i, 3b-iii, 3b-ii), verbatim. The user turn is one JSON block: the record's tool, its text_basis, the record itself (read its domain list) and the source_text.

For EACH domain of record.q_method.domains, in the record's order, decide which line of 3b (1–5) is the FIRST that matches the source_text, reading the whole text (3b-ii's duty of search applies). For the AMSTAR-2 domain «justification for excluding individual studies» apply 3b-iii and answer with the 3b line of the same rating: 3b-iii line 1 (low) → 3, line 2 (some_concerns) → 4, line 3 (high) → 1.

Prove each answer:
- line 1 because the text says the step was not done, or line 2, 3 or 4: "quotes" holds the sentence(s) of source_text that prove it, copied verbatim (one or more whole sentences).
- line 1 because the text is silent (FULL_TEXT only): "quotes" is [] and "note" names the sections you read and the wording you looked for.
- line 5 exists only under ABSTRACT_ONLY or SECONDARY_REPORT.

Do not look at the record's rating to decide; decide from the text and the rules, then answer. Output a single raw JSON object and nothing else:
{"domains": [{"domain": "<exactly the record's domain label>", "line": <1-5>, "quotes": ["…"], "note": "…"}]}
"""


def spec_step3(knowledge=KNOWLEDGE):
    """The spec's Step 3 rating rules, verbatim: from «### 3a» up to «### 3c»."""
    text = Path(knowledge).read_text(encoding="utf-8")
    a, b = text.find("### 3a"), text.find("### 3c")
    if a < 0 or b < 0 or b <= a:
        sys.exit(f"{knowledge}: cannot find the Step 3 rating rules (### 3a … ### 3c)")
    return text[a:b].rstrip() + "\n"


def text_key(s, n):
    doi = norm_doi((s.get("citation") or {}).get("doi"))
    return doi or f"s{n}"


def texts_for(src, texts, k):
    key = text_key(src, k + 1)
    t = texts.get(key)
    if not t:
        sys.exit(f"no text for {key} in --texts")
    if t.get("text_basis") != src.get("text_basis"):
        sys.exit(f"{key}: --texts gives {t.get('text_basis')} but the record was scored on {src.get('text_basis')}")
    return t["source_text"]


def audit_build(record_path, texts_path, out):
    rec = load(record_path)
    texts = {norm_doi(k): v for k, v in load(texts_path).items()}
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    system = AUDIT_INSTRUCTION + "\n---\n\n" + spec_step3()
    (out / "audit-system.md").write_text(system, encoding="utf-8")
    built = []
    for label, _, s in sources_of(rec):
        k = int(label.rsplit("src", 1)[1])
        if not isinstance(s, dict) or s.get("content_type") != "RESEARCH":
            continue
        blk = {"mode": "DES_RATING_AUDIT", "tool": (s.get("q_method") or {}).get("tool"),
               "text_basis": s.get("text_basis"), "record": s, "source_text": texts_for(s, texts, k)}
        p = out / f"audit-input-src{k}.json"
        p.write_text(json.dumps(blk, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        built.append(str(p))
    print(json.dumps({"status": "built", "system_prompt": str(out / "audit-system.md"),
                      "system_prompt_sha256": hashlib.sha256(system.encode("utf-8")).hexdigest(),
                      "blocks": built,
                      "run": "cd \"$(mktemp -d)\" && claude -p --system-prompt-file <DIR>/audit-system.md --tools \"\" "
                             "--model <stronger model> < <DIR>/audit-input-src<k>.json > <DIR>/audit-src<k>.json"},
                     ensure_ascii=False, indent=1))
    return 0


def _norm(s):
    s = unicodedata.normalize("NFKC", s or "").replace("­", "").replace(" ", " ")
    for a, b in (("‐", "-"), ("‑", "-"), ("–", "-"), ("—", "-"), ("‘", "'"),
                 ("’", "'"), ("“", '"'), ("”", '"')):
        s = s.replace(a, b)
    s = re.sub(r"-\s*\n\s*", "", s)
    return re.sub(r"\s+", " ", s).strip()


def audit_apply(out, record_path, texts_path):
    out = Path(out)
    rec = load(record_path)
    texts = {norm_doi(k): v for k, v in load(texts_path).items()}
    problems, sources, disagree = [], [], 0
    for label, _, s in sources_of(rec):
        k = int(label.rsplit("src", 1)[1])
        if not isinstance(s, dict) or s.get("content_type") != "RESEARCH":
            continue
        hay = _norm(texts_for(s, texts, k))
        p = out / f"audit-src{k}.json"
        if not p.exists():
            problems.append(f"src{k}: {p.name} is missing (the stronger reviewer's answer)")
            continue
        try:
            ans = load(p)
        except ValueError as e:
            problems.append(f"src{k}: {p.name} is not JSON ({e})")
            continue
        doms = (s.get("q_method") or {}).get("domains") or []
        got = (ans or {}).get("domains") if isinstance(ans, dict) else None
        if not isinstance(got, list) or [g.get("domain") for g in got if isinstance(g, dict)] != [d.get("domain") for d in doms]:
            problems.append(f"src{k}: the audit must answer exactly the record's domains, in order")
            continue
        rows = []
        for d, g in zip(doms, got):
            line, quotes = g.get("line"), g.get("quotes") or []
            if line not in LINE_RATING:
                problems.append(f"src{k} «{d.get('domain')}»: line must be 1–5, got {line!r}")
                continue
            if line == 5 and s.get("text_basis") == "FULL_TEXT":
                problems.append(f"src{k} «{d.get('domain')}»: line 5 (NR) does not exist under FULL_TEXT")
            if line in (2, 3, 4) and not quotes:
                problems.append(f"src{k} «{d.get('domain')}»: line {line} needs the sentence(s) that prove it")
            if line == 1 and not quotes and not str(g.get("note") or "").strip():
                problems.append(f"src{k} «{d.get('domain')}»: an absence (line 1) needs a note naming what was read")
            bad = [q for q in quotes if _norm(q) not in hay]
            if bad:
                problems.append(f"src{k} «{d.get('domain')}»: quote not verbatim in source_text: {bad[0][:70]!r}")
            want = LINE_RATING[line]
            same = want == d.get("rating")
            disagree += 0 if same else 1
            rows.append({"domain": d.get("domain"), "record": d.get("rating"), "audited_line": line,
                         "audited_rating": want, "agree": same, "quotes": quotes, "note": g.get("note")})
        sources.append({"index": k, "doi": (s.get("citation") or {}).get("doi"), "record_sha256": record_sha256(s),
                        "domains": rows})
    status = "malformed" if problems else ("disagree" if disagree else "agree")
    receipt = {"status": status, "problems": problems, "sources": sources}
    (out / "audit-receipt.json").write_text(json.dumps(receipt, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(json.dumps(receipt, ensure_ascii=False, indent=1))
    return 2 if problems else (1 if disagree else 0)


# ── CLI ───────────────────────────────────────────────────────────────────

def cmd_check(path):
    found = 0
    for label, _, s in sources_of(load(path)):
        for f in rating_findings(s):
            found += 1
            print(f"FAIL  {label} {f['code']}: {f['detail']}")
    if not found:
        print("ok    no rating-rule finding (spec 3b: EMPTY_QUOTE, ABSENCE_NOTE)")
    return 1 if found else 0


def cmd_lookup(doi, queue_ref, queue_dir):
    recs = existing_records(doi, queue_ref, queue_dir)
    print(json.dumps({"doi": norm_doi(doi), "found": len(recs),
                      "records": [{"where": r["where"], "id": r["id"], "index": r["index"], **summary(r["source"])}
                                  for r in recs]}, ensure_ascii=False, indent=1))
    return 0 if recs else 1


def cmd_compare(path, queue_ref, queue_dir):
    report, diff = [], False
    for label, _, s in sources_of(load(path)):
        if not isinstance(s, dict) or s.get("content_type") != "RESEARCH":
            continue
        doi = norm_doi((s.get("citation") or {}).get("doi"))
        if not doi:
            continue
        row = {"source": label, "doi": doi, "stored": []}
        for r in existing_records(doi, queue_ref, queue_dir):
            old = r["source"]
            ent = {"where": r["where"], "id": r["id"], "index": r["index"],
                   "des_version": old.get("des_version"), "text_basis": old.get("text_basis")}
            if not comparable(s, old):
                ent["status"] = "not_comparable"
                ent["differences"] = differences(s, old)
            else:
                d = differences(s, old)
                ent["status"] = "different" if d else "identical"
                ent["differences"] = d
                diff = diff or bool(d)
            row["stored"].append(ent)
        row["status"] = ("new" if not row["stored"] else
                         "different" if any(e["status"] == "different" for e in row["stored"]) else
                         "identical" if any(e["status"] == "identical" for e in row["stored"]) else "not_comparable")
        report.append(row)
    print(json.dumps({"status": "different" if diff else "ok", "sources": report}, ensure_ascii=False, indent=1))
    return 1 if diff else 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check", help="(1) the rating-rule check on a DES file")
    c.add_argument("file")
    for name, hlp in (("lookup", "(2) stored records of a DOI"), ("compare", "(2) a new record vs the stored ones")):
        p = sub.add_parser(name, help=hlp)
        p.add_argument("doi" if name == "lookup" else "file")
        p.add_argument("--queue-ref", default="origin/queue", help="git ref of the queue branch (default origin/queue)")
        p.add_argument("--queue-dir", help="a queue/ folder on disk, read when the ref is not there")
    b = sub.add_parser("audit-build", help="(3) the stronger reviewer's rating-audit blocks")
    b.add_argument("file")
    b.add_argument("--texts", required=True)
    b.add_argument("--out", required=True)
    a = sub.add_parser("audit-apply", help="(3) validate the audit and compare it with the record")
    a.add_argument("dir")
    a.add_argument("--record", required=True)
    a.add_argument("--texts", required=True)
    args = ap.parse_args(argv)
    if args.cmd == "check":
        return cmd_check(args.file)
    if args.cmd == "lookup":
        return cmd_lookup(args.doi, args.queue_ref, args.queue_dir)
    if args.cmd == "compare":
        return cmd_compare(args.file, args.queue_ref, args.queue_dir)
    if args.cmd == "audit-build":
        return audit_build(args.file, args.texts, args.out)
    return audit_apply(args.dir, args.record, args.texts)


if __name__ == "__main__":
    sys.exit(main())
