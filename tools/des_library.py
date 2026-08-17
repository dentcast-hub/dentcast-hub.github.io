#!/usr/bin/env python3
"""
plus/des-library.json — the reader-submission corpus for «ارزیاب DES».

WHY A SECOND FILE. `plus/des-scores.json` is keyed by `content_id` (a page
path) and is fetched by plus/js/des.js on EVERY article page load. Reader
submissions have no page, and growing that file grows a download every visitor
pays for. It is also written by the publishing workflow and gated by
verify_publish.py; a second writer means conflicts. So the corpus lives here.

WHAT IS STORED IS IDENTITY, NOT THE PAPER. No abstract, no full text, no
fingerprint of either — just the fields a citation is made of, plus the spec's
output object verbatim. Lookup is a dict hit on a short key, never a scan.

ONE PAPER, MANY KEYS. `index` maps every key ever seen onto a paper id. That is
what lets an abstract and a full text of the same study land on one record.

AMBIGUITY MEANS DECLINE. A title that cannot be trusted mints no `ttl:` key.
A missed cache hit costs a few tokens; a wrong key returns ANOTHER PAPER'S
evaluation. See .dentcast/des-scorer-handoff.md RULE 1.

Usage
  python3 tools/des_library.py check                     validate the library
  python3 tools/des_library.py lookup --doi 10.x/y       is this paper known?
  python3 tools/des_library.py lookup --title "..."
  python3 tools/des_library.py add rec.json --tags '#a,#b' [--submitted-by UUID]
                                                         validate + normalise + append
  python3 tools/des_library.py seed                      import the site's own
                                                         scored sources as a base
"""
import argparse
import hashlib
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIB = ROOT / 'plus' / 'des-library.json'
SITE = ROOT / 'plus' / 'des-scores.json'
HASHTAGS = ROOT / 'dentcast-hashtag-reference.json'

FA_DIGITS = str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')

# The four transparency rows, in the spec's own order. The store settled on
# Persian strings long ago (40 records use exactly these); a scoring model
# handed the English table will paraphrase them, so they are normalised here
# rather than trusted. base_points is a property of the ROW, never the paper.
PENALTY_ROWS = [
    (8, 'بیانیه‌ی تعارض منافع وجود ندارد', r'conflict|interest|تعارض|منافع'),
    (5, 'کارآزمایی به‌صورت پیش‌نگر ثبت نشده', r'regist|prospectiv|ثبت|پیش‌?نگر'),
    (5, 'توجیه حجم نمونه یا آنالیز توان وجود ندارد', r'sample|size|power|نمونه|توان'),
    (3, 'دوره‌ی پیگیری کوتاه‌تر از آنچه پیامد لازم دارد', r'follow|پیگیری'),
]

BAND_RANGES = [('A', 80, 100), ('B', 60, 79), ('C', 40, 59), ('D', 20, 39), ('E', 0, 19)]


# ── Persian folding. ZWNJ is not a space and ی/ي, ک/ك are two spellings of one
#    letter — the reason plus/js/hl-view.js has foldFa. Keys only, never display.
def fold(t):
    t = str(t or '')
    t = re.sub(r'[‌‎‏]', '', t)
    t = t.replace('ي', 'ی').replace('ى', 'ی').replace('ك', 'ک')
    t = re.sub(r'[ً-ْ]', '', t)
    t = re.sub(r'[.,;:!?()\[\]{}"\'«»،؛؟\-–—/\\]', ' ', t)
    return re.sub(r'\s+', ' ', t).strip().lower()


def h8(s):
    return hashlib.sha1(fold(s).encode('utf-8')).hexdigest()[:10]


def round_half_up(x):
    """Half AWAY FROM ZERO. Python's round() goes to even and would put a
    boundary case in the wrong band; the spec makes this part of the score."""
    return int(x + 0.5) if x >= 0 else -int(-x + 0.5)


def band_for(score):
    for name, lo, hi in BAND_RANGES:
        if lo <= score <= hi:
            return name
    return None


# ────────────────────────────────────────────────────────────── validation ──
def validate(rec):
    """Return a list of problems. Empty list means the record is arithmetically
    sound; it says nothing about whether the JUDGEMENTS are right."""
    p = []
    ct = rec.get('content_type')
    if ct != 'RESEARCH':
        return p if ct in ('COMMENTARY', 'NOT_APPRAISABLE') else ['content_type نامعتبر: %r' % ct]

    sd = (rec.get('s_design') or {}).get('value')
    qm = rec.get('q_method') or {}
    mult = qm.get('multiplier')
    if not isinstance(sd, int) or not (0 <= sd <= 100):
        p.append('s_design.value نامعتبر: %r' % sd)
    if not isinstance(mult, (int, float)):
        p.append('multiplier نامعتبر: %r' % mult)
    if p:
        return p

    if mult not in (0.30, 0.55, 0.80, 1.00):
        p.append('multiplier باید یکی از ۰٫۳۰/۰٫۵۵/۰٫۸۰/۱٫۰۰ باشد، نه %r' % mult)

    # domain count is fixed per tool — a dropped domain changes the counts that
    # decide the multiplier, so it is an error, not a style issue.
    expected = {'RoB2': 5, 'ROBINS-I': 5, 'AMSTAR-2': 6, 'QUIN': 6, 'QUADAS-2': 4}
    tool = qm.get('tool')
    doms = qm.get('domains') or []
    if tool not in expected:
        p.append('ابزار نامعتبر: %r' % tool)
    elif len(doms) != expected[tool]:
        p.append('%s باید دقیقاً %d دامنه داشته باشد، %d دارد' % (tool, expected[tool], len(doms)))

    for d in doms:
        if d.get('rating') not in ('low', 'some_concerns', 'high', 'NR'):
            p.append('rating نامعتبر در «%s»: %r' % (d.get('domain'), d.get('rating')))
        if not d.get('evidence_quote') and not d.get('note'):
            p.append('دامنه‌ی «%s» نه نقل‌قول دارد نه note' % d.get('domain'))

    # multiplier must follow from the counts (Step 3c), not from judgement
    high = sum(1 for d in doms if d.get('rating') == 'high')
    conc = sum(1 for d in doms if d.get('rating') in ('some_concerns', 'NR'))
    if high >= 2:
        want = 0.30
    elif high == 1 or conc >= 3:
        want = 0.55
    elif conc >= 1:
        want = 0.80
    else:
        want = 1.00
    if mult > want:
        p.append('ضریب با شمارش دامنه‌ها نمی‌خواند: %d high، %d some_concerns → حداکثر %.2f، ولی %.2f آمده'
                 % (high, conc, want, mult))

    # every penalty row must be present, and each scaled per Step 4a
    pens = rec.get('penalties') or []
    if len(pens) != 4:
        p.append('باید هر چهار ردیف جریمه ذکر شوند (حتی وقتی صفرند)، %d آمده' % len(pens))
    total = 0
    for pen in pens:
        bp, pts = pen.get('base_points'), pen.get('points')
        if not isinstance(bp, int) or not isinstance(pts, int):
            p.append('جریمه‌ی «%s» عدد صحیح نیست' % pen.get('item'))
            continue
        if pts:
            want_pts = max(1, round_half_up(bp * sd / 100))
            if pts != want_pts:
                p.append('جریمه‌ی «%s»: باید %d باشد (max(1, %d×%d÷100))، %d آمده'
                         % (pen.get('item'), want_pts, bp, sd, pts))
        if pts == 0 and not pen.get('note'):
            p.append('جریمه‌ی صفرِ «%s» باید note داشته باشد' % pen.get('item'))
        total += pts

    want_score = max(0, round_half_up(sd * mult) - total)
    if rec.get('des_score') != want_score:
        p.append('des_score باید %d باشد (round_half_up(%d×%.2f) − %d)، %r آمده'
                 % (want_score, sd, mult, total, rec.get('des_score')))
    want_band = band_for(want_score)
    if rec.get('band') != want_band:
        p.append('band باید %s باشد برای امتیاز %d، %r آمده' % (want_band, want_score, rec.get('band')))

    if rec.get('text_basis') in ('ABSTRACT_ONLY', 'SECONDARY_REPORT') and not rec.get('provisional'):
        p.append('%s باید provisional=true باشد' % rec.get('text_basis'))
    if rec.get('text_basis') == 'FULL_TEXT' and rec.get('provisional'):
        p.append('FULL_TEXT نباید provisional باشد')

    interp = rec.get('interpretation_fa') or ''
    if len(interp.split()) > 60:
        p.append('interpretation_fa بیش از ۶۰ واژه است (%d)' % len(interp.split()))
    if len(re.findall(r'[.!؟]', interp)) > 4:
        p.append('interpretation_fa بیش از چهار جمله است')
    return p


def normalise(rec):
    """Fix conventions the spec does not state but the store has settled.
    Returns (record, list of changes). Judgement is never touched."""
    changed = []

    # Persian digits. 180 of 181 stored fact_fa use them; the string renders
    # straight onto the card, so a Latin digit is visibly a different card.
    for k in ('fact_fa', 'interpretation_fa'):
        v = rec.get(k)
        if v and re.search(r'[0-9]', v):
            rec[k] = v.translate(FA_DIGITS)
            changed.append('%s: ارقام لاتین → فارسی' % k)

    # The four penalty rows, by their settled Persian names.
    for pen in rec.get('penalties') or []:
        item = str(pen.get('item') or '')
        for bp, fa_name, pat in PENALTY_ROWS:
            if pen.get('base_points') == bp and re.search(pat, item, re.I):
                if item != fa_name:
                    pen['item'] = fa_name
                    changed.append('جریمه: «%s» → «%s»' % (item[:34], fa_name))
                break
    return rec, changed


# ───────────────────────────────────────────────────────────────── storage ──
def load(path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding='utf-8'))


def new_library():
    return {
        'version': 1,
        'about': 'پیکره‌ی مقالات امتیازخورده‌ی DES — کلید هویت، نه متن مقاله. '
                 'plus/des-scores.json دست‌نخورده می‌ماند؛ آن فایل برای صفحات سایت است.',
        'index': {},
        'papers': {},
    }


def keys_for(citation, title_ok=True):
    """Strongest first. A title that was not trusted mints no ttl: key."""
    out = []
    doi = (citation.get('doi') or '').strip().lower()
    pmid = str(citation.get('pmid') or '').strip()
    title = (citation.get('title') or '').strip()
    if doi:
        out.append('doi:' + doi)
    if pmid:
        out.append('pmid:' + pmid)
    if title and title_ok:
        out.append('ttl:' + h8(title))
    return out


def site_corpus():
    """The site's OWN scored sources. 51 unique DOIs already — the library does
    not start empty, and a reader pasting one of them must be answered from
    here rather than scored again."""
    data = load(SITE, {})
    seen = {}
    for cid, rec in data.items():
        for s in rec.get('sources', []):
            if s.get('content_type') != 'RESEARCH':
                continue
            c = s.get('citation') or {}
            for k in keys_for(c):
                seen.setdefault(k, []).append(cid)
    return seen


def cmd_lookup(args):
    lib = load(LIB, new_library())
    site = site_corpus()
    probe = []
    if args.doi:
        probe.append('doi:' + args.doi.strip().lower())
    if args.pmid:
        probe.append('pmid:' + args.pmid.strip())
    if args.title:
        probe.append('ttl:' + h8(args.title))
    if not probe:
        sys.exit('یکی از --doi / --pmid / --title را بده')
    for k in probe:
        if k in lib['index']:
            pid = lib['index'][k]
            p = lib['papers'][pid]
            print('در کتابخانه — %s (%s) با کلید %s' % (pid, p['des']['band'], k))
            print('   %s' % p['des']['citation']['title'])
            return 0
        if k in site:
            print('در صفحات خودِ سایت — %s با کلید %s' % ('، '.join(site[k]), k))
            print('   امتیازدهی لازم نیست؛ همان رکورد سرو می‌شود.')
            return 0
    print('پیدا نشد — این مقاله باید امتیاز بگیرد.')
    return 1


def cmd_check(args):
    lib = load(LIB, new_library())
    bad = 0
    for pid, p in lib['papers'].items():
        probs = validate(p['des'])
        for k in p['keys']:
            if lib['index'].get(k) != pid:
                probs.append('کلید %s به %r اشاره می‌کند نه %s' % (k, lib['index'].get(k), pid))
        if probs:
            bad += 1
            print('FAIL %s' % pid)
            for x in probs:
                print('   · %s' % x)
    print('%d مقاله بررسی شد، %d مشکل‌دار' % (len(lib['papers']), bad))
    return 1 if bad else 0


def cmd_add(args):
    rec = json.loads(Path(args.record).read_text(encoding='utf-8'))
    citation = rec.get('citation') or {}
    title = (citation.get('title') or '').strip()

    # RULE 1. No title, no title key — and for a reader submission a missing
    # title is worth one question rather than a guess.
    if not title:
        sys.exit('این رکورد عنوان ندارد. عنوان مقاله را بپرس و در citation.title بگذار — '
                 'بدون آن فقط DOI/PMID کلید می‌سازند و اگر آن‌ها هم نباشند مقاله عملاً کش نمی‌شود.')

    probs = validate(rec)
    if probs:
        print('رکورد رد شد — %d مشکل:' % len(probs))
        for x in probs:
            print('   · %s' % x)
        return 1

    rec, changed = normalise(rec)

    lib = load(LIB, new_library())
    site = site_corpus()
    ks = keys_for(citation)

    for k in ks:
        if k in lib['index']:
            print('از قبل در کتابخانه است (%s، کلید %s) — چیزی اضافه نشد.' % (lib['index'][k], k))
            return 0
    already = [(k, site[k]) for k in ks if k in site]

    pid = 'p_%04d' % (len(lib['papers']) + 1)
    tags = [t.strip() for t in (args.tags or '').split(',') if t.strip()]
    if tags:
        ref = load(HASHTAGS, {'concepts': [], 'aliases': {}})
        legal = {c['tag'] for c in ref.get('concepts', [])}
        unknown = [t for t in tags if t not in legal]
        if unknown:
            sys.exit('این هشتگ‌ها در dentcast-hashtag-reference.json نیستند: %s\n'
                     'یا فرم canonical را بردار یا مفهوم تازه را اول در کتابخانه ثبت کن.'
                     % '، '.join(unknown))

    lib['papers'][pid] = {
        'id': pid,
        'keys': ks,
        'hashtags': tags,
        'des': rec,                       # the spec's output object, VERBATIM
        'scored_at': date.today().isoformat(),
        'scored_by': args.scored_by,
        'submitted_by': args.submitted_by,
        'notified': False,
        'also_cited_by': sorted({c for _, cids in already for c in cids}),
    }
    for k in ks:
        lib['index'][k] = pid

    LIB.write_text(json.dumps(lib, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

    print('ثبت شد: %s — %s %s/۱۰۰ · %s' % (pid, rec['band'], rec['des_score'], rec['question_type']))
    print('   کلیدها: %s' % '  '.join(ks))
    print('   هشتگ‌ها: %s' % ('  '.join(tags) if tags else '— (هیچ)'))
    for c in changed:
        print('   نرمال‌سازی: %s' % c)
    if already:
        print('   توجه: همین مقاله در صفحات سایت هم هست: %s'
              % '، '.join(sorted({c for _, cids in already for c in cids})))
    if not lib['papers'][pid]['submitted_by']:
        print('   اطلاعیه فرستاده نشد: submitted_by خالی است.')
    else:
        print('   اطلاعیه: POST /admin/notices/user  {user: %s, kind: "system", '
              'title: "ارزیابی مقاله‌ات آماده است"}' % args.submitted_by)
    return 0


def main():
    ap = argparse.ArgumentParser(description='کتابخانه‌ی DES — ثبت و جست‌وجوی مقالات امتیازخورده')
    sub = ap.add_subparsers(dest='cmd', required=True)

    sub.add_parser('check').set_defaults(fn=cmd_check)

    lk = sub.add_parser('lookup')
    lk.add_argument('--doi')
    lk.add_argument('--pmid')
    lk.add_argument('--title')
    lk.set_defaults(fn=cmd_lookup)

    ad = sub.add_parser('add')
    ad.add_argument('record', help='فایل JSON خروجی مدل')
    ad.add_argument('--tags', default='', help='هشتگ‌ها با کاما، همه canonical')
    ad.add_argument('--submitted-by', default=None)
    ad.add_argument('--scored-by', default='gemini')
    ad.set_defaults(fn=cmd_add)

    args = ap.parse_args()
    sys.exit(args.fn(args))


if __name__ == '__main__':
    main()
