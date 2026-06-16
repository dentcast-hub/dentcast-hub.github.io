#!/usr/bin/env python3
"""
enrich_cabinet.py
Resolves metadata and semantic tags for cabinet papers that the title-only pass
could not tag (DOI-named, author-year, citation-only, and heavy/nameless files).

Pipeline per unresolved paper:
  1. DOI in filename            -> CrossRef /works/{doi}
  2. author+year / citation     -> CrossRef bibliographic query (disambiguated by topic folder)
  3. heavy / nameless           -> read first 2 pages of the PDF, extract a DOI, then CrossRef

From CrossRef it stores: real title, journal, year, subjects, abstract,
and builds semantic tags (ontology over title+abstract+subjects).

Safe to stop and rerun: progress is cached, resolved records are skipped.

Requirements:  pip install requests pypdf
Usage:         python enrich_cabinet.py
"""

import json, re, time, os, sys, html

# ----------------------------- CONFIG -----------------------------
CATALOG_IN   = "dentcast_cabinet_full_catalog.json"          # input (semantic version)
CATALOG_OUT  = "dentcast_cabinet_full_catalog.enriched.json" # output
CACHE_FILE   = "enrich_cache.json"                           # resume cache
UNRESOLVED   = "unresolved_log.json"
MAILTO       = "foad.shahabian@gmail.com"   # CrossRef polite pool (your email)
SLEEP        = 0.15                          # seconds between CrossRef calls
PDF_PAGES    = 2                             # pages to scan for a DOI in heavy files
# ------------------------------------------------------------------

try:
    import requests
except ImportError:
    sys.exit("pip install requests")
HEADERS = {"User-Agent": f"DentCastCabinet/1.0 (mailto:{MAILTO})"}

# ---- semantic ontology: surface form -> canonical concept ----
ONT = {
 "zirconia":"zirconia","y-tzp":"zirconia","ytzp":"zirconia","monolithic":"monolithic-restoration",
 "translucen":"translucency","lithium disilicate":"lithium-disilicate","e.max":"lithium-disilicate",
 "emax":"lithium-disilicate","feldspathic":"feldspathic","leucite":"leucite","glass-ceramic":"glass-ceramic",
 "glass ceramic":"glass-ceramic","alumina":"alumina","veneer":"veneer","laminate":"veneer","ceramic":"ceramic",
 "porcelain":"porcelain","metal-ceramic":"metal-ceramic","metal ceramic":"metal-ceramic","pfm":"metal-ceramic",
 "peek":"peek","pekk":"peek","pmma":"pmma","adhesi":"adhesion","bond strength":"bond-strength","bonding":"bonding",
 "universal adhesive":"universal-adhesive","dentin seal":"immediate-dentin-sealing","deep margin elevation":"deep-margin-elevation",
 "self-adhesive":"self-adhesive-cement","resin cement":"resin-cement","cement":"cementation","silan":"silanization",
 "sandblast":"airborne-abrasion","airborne":"airborne-abrasion","etch":"etching","mdp":"mdp","primer":"primer",
 "surface treatment":"surface-treatment","surface conditioning":"surface-treatment","dentin":"dentin","enamel":"enamel",
 "endocrown":"endocrown","onlay":"onlay","inlay":"inlay","partial crown":"partial-crown","fiber post":"fiber-post",
 "fibre post":"fiber-post","post and core":"post-core","post & core":"post-core","ferrule":"ferrule",
 "root filled":"endodontically-treated","endodontically treated":"endodontically-treated","biomimetic":"biomimetic",
 "noncarious cervical":"nccl","nccl":"nccl","tooth wear":"tooth-wear","tooth preparation":"tooth-preparation",
 "crown preparation":"tooth-preparation","finish line":"finish-line","single crown":"single-crown",
 "fixed dental prosthes":"fdp","fixed partial dentur":"fdp","cantilever":"cantilever","pontic":"pontic",
 "maryland":"resin-bonded-fdp","resin-bonded":"resin-bonded-fdp","emergence":"emergence-profile",
 "crown contour":"crown-contour","platform switch":"platform-switching","abutment":"abutment","titanium base":"ti-base",
 "ti-base":"ti-base","tibase":"ti-base","multi-unit":"multi-unit-abutment","multiunit":"multi-unit-abutment",
 "custom abutment":"custom-abutment","stock abutment":"stock-abutment","healing abutment":"healing-abutment",
 "screw loosen":"screw-loosening","screw retain":"screw-retained","cement retain":"cement-retained","preload":"screw-preload",
 "abutment screw":"abutment-screw","torque":"tightening-torque","conical connection":"conical-connection","morse":"conical-connection",
 "internal hex":"internal-connection","external hex":"external-connection","implant connection":"implant-abutment-connection",
 "implant-abutment connection":"implant-abutment-connection","one abutment one time":"one-abutment-one-time",
 "osseointegrat":"osseointegration","primary stability":"primary-stability","insertion torque":"insertion-torque",
 "marginal bone":"marginal-bone-loss","crestal bone":"crestal-bone-loss","bone loss":"bone-loss",
 "peri-implantitis":"peri-implantitis","periimplantitis":"peri-implantitis","mucositis":"peri-implant-mucositis",
 "peri-implant":"peri-implant-tissue","soft tissue thickness":"soft-tissue-thickness","mucosal thickness":"soft-tissue-thickness",
 "keratinized":"keratinized-mucosa","phenotype":"peri-implant-phenotype","biotype":"gingival-phenotype",
 "papilla":"interdental-papilla","biological width":"supracrestal-tissue","biologic width":"supracrestal-tissue",
 "subcrestal":"subcrestal-placement","guided bone regeneration":"gbr","gbr":"gbr","guided tissue":"gtr",
 "membrane":"barrier-membrane","sinus floor":"sinus-augmentation","sinus lift":"sinus-augmentation",
 "sinus augmentation":"sinus-augmentation","ridge augmentation":"ridge-augmentation","ridge preservation":"ridge-preservation",
 "socket preservation":"socket-preservation","socket shield":"socket-shield","partial extraction":"partial-extraction-therapy",
 "immediate implant":"immediate-placement","immediate placement":"immediate-placement","immediate loading":"immediate-loading",
 "early loading":"early-loading","loading protocol":"loading-protocol","connective tissue graft":"connective-tissue-graft",
 "free gingival graft":"free-gingival-graft","root coverage":"root-coverage","recession":"gingival-recession",
 "soft tissue augmentation":"soft-tissue-augmentation","bone graft":"bone-graft","xenograft":"xenograft",
 "autogenous":"autogenous-graft","allograft":"allograft","deproteinized bovine":"dbbm","short implant":"short-implant",
 "narrow implant":"narrow-diameter-implant","tilted implant":"tilted-implant","zygomatic":"zygomatic-implant",
 "mini implant":"mini-implant","implant survival":"implant-survival","implant failure":"implant-failure",
 "occlusal overload":"occlusal-overload","occlusal scheme":"occlusal-scheme","occlusion":"occlusion",
 "vertical dimension":"vertical-dimension","dahl":"dahl-concept","parafunction":"parafunction","bruxism":"bruxism",
 "splint":"splinting","osseoperception":"osseoperception","propriocept":"proprioception","tactile":"tactile-sensibility",
 "temporomandibular":"tmd","mandibular flexure":"mandible-flexure","complete denture":"complete-denture",
 "removable partial":"rpd","overdenture":"overdenture","attachment":"overdenture-attachment","all-on-4":"all-on-4",
 "all on 4":"all-on-4","full-arch":"full-arch","full arch":"full-arch","cbct":"cbct","intraoral scan":"intraoral-scanning",
 "trueness":"scan-accuracy","accuracy":"accuracy","cad-cam":"cad-cam","cadcam":"cad-cam","3d print":"3d-printing",
 "additive manufactur":"3d-printing","milling":"milling","deep learning":"deep-learning","machine learning":"machine-learning",
 "artificial intelligence":"artificial-intelligence","photogrammetr":"photogrammetry","digital workflow":"digital-workflow",
 "guided surgery":"guided-surgery","computer-aided":"guided-surgery","flapless":"flapless","dynamic navigation":"dynamic-navigation",
 "survival rate":"survival","success rate":"success","complication":"complications","fracture":"fracture",
 "pink esthetic":"pink-esthetic-score","white esthetic":"white-esthetic-score","esthetic outcome":"esthetic-outcome",
 "patient-reported":"prom","quality of life":"quality-of-life","longevity":"longevity","smile":"smile-esthetics",
 "shade":"shade-matching","color stability":"color-stability","bleaching":"bleaching","anterior":"anterior-region",
 "posterior":"posterior-region","molar":"molar","premolar":"premolar","maxilla":"maxilla","mandib":"mandible",
 "esthetic zone":"esthetic-zone","diabet":"diabetes","smoking":"smoking","periodontitis":"periodontitis",
 "bisphosphonate":"antiresorptive","radiation":"radiotherapy","articaine":"local-anesthesia","lidocaine":"local-anesthesia",
 "anesthe":"local-anesthesia","digital smile":"digital-smile-design","provisional":"provisional-restoration",
 "interim":"provisional-restoration","fatigue":"fatigue-behavior","buccal bone":"buccal-bone","supracrestal":"supracrestal-tissue",
 "systematic review":"systematic-review","meta-analys":"meta-analysis","randomized":"rct","clinical trial":"clinical-trial",
 "retrospective":"retrospective","prospective":"prospective","cohort":"cohort","case report":"case-report",
 "case series":"case-series","in vitro":"in-vitro","finite element":"finite-element-analysis","animal":"animal-study",
 "consensus":"consensus","narrative review":"narrative-review","scoping review":"scoping-review","umbrella":"umbrella-review",
}

def semantic_tags(*texts):
    blob = " " + " ".join(t.lower() for t in texts if t) + " "
    return {c for surf, c in ONT.items() if surf in blob}

# ---- DOI helpers ----
DOI_RE = re.compile(r'10\.\d{4,9}/[^\s"<>\)\]]+', re.I)

def doi_from_name(fn):
    s = re.sub(r'\.pdf$', '', fn, flags=re.I)
    s = s.replace('@', '/')
    m = re.search(r'10\.\d{4,9}/?\S*', s)
    if not m:
        return None
    cand = m.group(0).replace('_', '.')
    cand = re.sub(r'[.\-]+$', '', cand)
    cand = re.sub(r'[\u0600-\u06FF].*$', '', cand)  # cut trailing Persian
    return cand if re.match(r'^10\.\d{4,9}/\S+$', cand) else None

def doi_from_pdf(path):
    try:
        from pypdf import PdfReader
        r = PdfReader(path)
        txt = ""
        for pg in r.pages[:PDF_PAGES]:
            txt += (pg.extract_text() or "") + "\n"
        m = DOI_RE.search(txt)
        if m:
            return re.sub(r'[.\-]+$', '', m.group(0))
    except Exception:
        return None
    return None

def parse_author_year(fn):
    s = re.sub(r'\.pdf$', '', fn, flags=re.I)
    s = re.sub(r'\s*\(\d+\)$', '', s)
    m = re.search(r'([A-Za-z]{3,})\s*(?:et\s*al)?[\s_\-]*((?:19|20)\d\d)', s)
    if m:
        return m.group(1).lower(), m.group(2)
    return None, None

def clean_abstract(a):
    if not a:
        return ""
    a = re.sub(r'<[^>]+>', ' ', a)
    a = html.unescape(a)
    return re.sub(r'\s+', ' ', a).strip()

# ---- CrossRef ----
def cr_get(doi):
    try:
        r = requests.get(f"https://api.crossref.org/works/{doi}", headers=HEADERS, timeout=20)
        if r.status_code == 200:
            return r.json()["message"]
    except Exception:
        pass
    return None

def cr_query(author, year, topic):
    try:
        params = {"query.author": author,
                  "filter": f"from-pub-date:{year}-01-01,until-pub-date:{year}-12-31",
                  "rows": 5, "mailto": MAILTO}
        r = requests.get("https://api.crossref.org/works", headers=HEADERS, params=params, timeout=20)
        if r.status_code != 200:
            return None
        items = r.json()["message"].get("items", [])
        if not items:
            return None
        tw = set(re.findall(r'[a-z]{4,}', topic.lower()))
        best, bestscore = None, -1
        for it in items:
            title = " ".join(it.get("title", []) or []).lower()
            subj = " ".join(it.get("subject", []) or []).lower()
            score = len(tw & set(re.findall(r'[a-z]{4,}', title + " " + subj)))
            if score > bestscore:
                best, bestscore = it, score
        # require at least one topic-word overlap to accept (avoid wrong matches)
        return best if bestscore >= 1 else None
    except Exception:
        return None

def msg_to_fields(m):
    title = " ".join(m.get("title", []) or []).strip()
    journal = " ".join(m.get("container-title", []) or []).strip()
    year = None
    for k in ("published-print", "published-online", "issued"):
        dp = m.get(k, {}).get("date-parts", [[None]])
        if dp and dp[0] and dp[0][0]:
            year = dp[0][0]; break
    subjects = m.get("subject", []) or []
    abstract = clean_abstract(m.get("abstract", ""))
    doi = m.get("DOI", "")
    typ = m.get("type", "")
    return title, journal, year, subjects, abstract, doi, typ

# ---- main ----
def needs_work(p):
    return not p.get("semantic_tagged")

def main():
    cat = json.load(open(CATALOG_IN, encoding="utf-8"))
    papers = cat["papers"]
    cache = {}
    if os.path.exists(CACHE_FILE):
        cache = json.load(open(CACHE_FILE, encoding="utf-8"))

    todo = [p for p in papers if needs_work(p) and p["id"] not in cache]
    print(f"{len(papers)} papers total, {len(todo)} to resolve this run "
          f"({len(cache)} cached).")

    done = 0
    for p in papers:
        if not needs_work(p):
            continue
        pid = p["id"]
        if pid in cache:
            p.update(cache[pid]); continue

        fn = p["file_name"]; topic = p.get("topic", "")
        method = None; msg = None

        # 1. DOI in filename
        d = doi_from_name(fn)
        if d:
            msg = cr_get(d); method = "filename-doi"; time.sleep(SLEEP)

        # 2. author-year / citation query
        if not msg:
            au, yr = parse_author_year(fn)
            if au and yr:
                msg = cr_query(au, yr, topic); method = "author-year-query"; time.sleep(SLEEP)

        # 3. heavy: read DOI from the PDF first pages
        if not msg:
            lp = p.get("local_path", "")
            if lp and os.path.exists(lp):
                d2 = doi_from_pdf(lp)
                if d2:
                    msg = cr_get(d2); method = "pdf-doi"; time.sleep(SLEEP)

        if msg:
            title, journal, year, subjects, abstract, doi, typ = msg_to_fields(msg)
            tags = set(t for t in p.get("tags", []) if t.startswith("topic:"))
            tags |= semantic_tags(title, abstract, " ".join(subjects))
            enrich = {
                "real_title": title or p["title"],
                "doi": doi, "journal": journal,
                "crossref_year": year, "subjects": subjects,
                "abstract": abstract[:1200],
                "tags": sorted(tags),
                "semantic_tagged": True,
                "resolution_method": method,
            }
            p.update(enrich); cache[pid] = enrich
        else:
            cache[pid] = {"resolution_method": "unresolved"}
            p["resolution_method"] = "unresolved"

        done += 1
        if done % 25 == 0:
            json.dump(cache, open(CACHE_FILE, "w", encoding="utf-8"), ensure_ascii=False)
            print(f"  resolved {done}/{len(todo)} ...")

    json.dump(cache, open(CACHE_FILE, "w", encoding="utf-8"), ensure_ascii=False)

    resolved = sum(1 for p in papers if p.get("resolution_method") not in (None, "unresolved"))
    sem = sum(1 for p in papers if p.get("semantic_tagged"))
    unresolved = [p["local_path"] for p in papers if p.get("resolution_method") == "unresolved"]
    cat["enrichment"] = {
        "resolved_via_crossref": resolved,
        "semantically_tagged_total": sem,
        "unresolved": len(unresolved),
    }
    json.dump(cat, open(CATALOG_OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(unresolved, open(UNRESOLVED, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\nDONE. crossref-resolved this/total: {resolved} | "
          f"semantically tagged total: {sem}/{len(papers)} | unresolved: {len(unresolved)}")
    print(f"wrote {CATALOG_OUT} and {UNRESOLVED}")

if __name__ == "__main__":
    main()
