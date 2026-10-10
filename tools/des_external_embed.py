#!/usr/bin/env python3
"""Build the self-contained FIDELITY embed for an article on ANOTHER site.

    python3 tools/des_external_embed.py RESULT.json \
        --cite "Holiel AA et al. Biomed Eng Comput Biol. 2026" \
        --doi 10.1177/11795972261463709 \
        --out dentcast-fidelity.js [--code DF-7KQ-29M] [--date "۱۸ مهر ۱۴۰۵"]

RESULT.json is ONE FIDELITY object exactly as the spec emits it (or as
`tools/des_fidelity_units.py --vote` folds it): `claims`, `counts`,
`assessable`, `fidelity_score`, `level`, `text_basis`, `source_conclusion`.
The scoring itself is the ordinary step 4.13 Part 2b/2c pipeline — this tool
only packages its result; it never judges a sentence.

What comes out is ONE .js file the other site serves from its own host. It
carries the data, the wording, the styles and the Vazirmatn faces inline, so it
makes no request to dentcast at runtime (founder, 1405/07/18: «اگر سایت من
پایین باشه اونام دچار مشکل»). Full contract: .dentcast/workflows/external-fidelity.md

The fingerprint is SHA-256 over the evaluated sentences (every unit's
`claim_quote`, NFC, joined by newlines) — what the verification page will
compare, so a later edit to the article is detectable without the site ever
calling us.
"""
import argparse
import base64
import hashlib
import json
import pathlib
import secrets
import sys
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / 'tools' / 'des_external_embed.tpl.js'
FONTS = {'__FONT_R__': 'Vazirmatn-Regular.woff2', '__FONT_B__': 'Vazirmatn-Bold.woff2'}
VERIFY = 'https://dentcast.org/verify/{code}'

# Same alphabet as plus-api/src/services/reference.ts (no 0/O, 1/I/L, 5/S, 8/B):
# the code is read aloud and retyped by a stranger.
ALPHABET = 'ACDEFGHJKMNPQRTUVWXY2346789'

# Same words as plus/js/des.js fidelityWord / FID_KIND_FA — one vocabulary on
# both surfaces, so a reader who met one has already met the other.
KIND_FA = {
    'HEDGE_REMOVED': 'قاطع‌تر از منبع',
    'HEDGE_ADDED': 'محتاط‌تر از منبع',
    'MAGNITUDE_CHANGED': 'عدد متفاوت با منبع',
    'POPULATION_OR_CONDITION_CHANGED': 'گسترده‌تر از منبع',
    'GROUP_OR_COMPARATOR_CHANGED': 'مقایسه‌ی متفاوت با منبع',
}
SILENT = ('NOT_ASSESSABLE', 'NOT_IN_SOURCE')


def fidelity_word(f):
    c = f.get('counts') or {}
    if f['level'] == 'INSUFFICIENT_CLAIMS':
        return 'ادعای کافی برای سنجش ندارد'
    if f['level'] == 'LOW':
        return 'تطابق پایین'
    if f['level'] == 'MEDIUM':
        return 'تطابق متوسط'
    if not c.get('altered') and not c.get('reversed'):
        return 'کاملاً مطابق'
    return 'تطابق خیلی بالا' if f['fidelity_score'] >= 95 else 'تطابق بالا'


def mint_code():
    pick = lambda n: ''.join(secrets.choice(ALPHABET) for _ in range(n))
    return f'DF-{pick(3)}-{pick(3)}'


def fingerprint(claims):
    text = '\n'.join(c['claim_quote'] for c in claims)
    return hashlib.sha256(unicodedata.normalize('NFC', text).encode()).hexdigest()


def bundle(f, cite, doi, code, date, spec):
    cl = f['claims']
    return {
        'code': code,
        'spec': spec or f.get('des_version', ''),
        'evaluated': date,
        'fingerprint': fingerprint(cl),
        'verify': VERIFY.format(code=code),
        'source': {'cite': cite, 'doi': doi},
        # Drives ONE neutral line only («مبنای سنجش: چکیده‌ی مقاله»). Never the
        # word «مقدماتی» and never «چکیده» beside the verdict (founder,
        # 1405/07/18): the author may well have written from the abstract, and
        # the chip must not suggest our check fell short of their source.
        'provisional': f.get('text_basis') == 'ABSTRACT_ONLY',
        'word': fidelity_word(f),
        'level': f['level'],
        'score': f.get('fidelity_score'),
        'counts': f['counts'],
        'assessable': f['assessable'],
        'matches': [{'t': c['claim_quote'], 's': c['source_quote']} for c in cl if c['verdict'] == 'MATCHES'],
        'diffs': [{'t': c['claim_quote'], 's': c['source_quote'],
                   'rev': c['verdict'] == 'REVERSED',
                   'kind': 'برعکسِ منبع' if c['verdict'] == 'REVERSED'
                   else KIND_FA.get(c.get('change_kind'), 'متفاوت با منبع')}
                  for c in cl if c['verdict'] in ('ALTERED', 'REVERSED')],
        'silent': [c['claim_quote'] for c in cl if c['verdict'] in SILENT],
        'author': [c['claim_quote'] for c in cl if c['verdict'] == 'AUTHOR_VIEW'],
        'conclusion': f.get('source_conclusion', ''),
    }


def build(b):
    js = TEMPLATE.read_text()
    js = js.replace('__BUNDLE__', json.dumps(b, ensure_ascii=False))
    for ph, name in FONTS.items():
        js = js.replace(ph, base64.b64encode((ROOT / 'fonts' / name).read_bytes()).decode())
    if any(p in js for p in ('__BUNDLE__', *FONTS)):
        sys.exit('placeholder left in template')
    return js


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('result')
    ap.add_argument('--cite', required=True)
    ap.add_argument('--doi', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--code', help='reuse an existing code (a rebuild); default mints a new one')
    ap.add_argument('--date', default='', help='evaluation date as printed, e.g. «۱۸ مهر ۱۴۰۵»')
    ap.add_argument('--spec', default='', help='spec version; default the result\'s des_version')
    a = ap.parse_args()
    f = json.loads(pathlib.Path(a.result).read_text())
    if f.get('mode') != 'FIDELITY' or 'claims' not in f:
        sys.exit('not a FIDELITY result')
    b = bundle(f, a.cite, a.doi, a.code or mint_code(), a.date, a.spec)
    pathlib.Path(a.out).write_text(build(b))
    print(f"{a.out}  code={b['code']}  word={b['word']}  fingerprint={b['fingerprint'][:12]}  "
          f"{pathlib.Path(a.out).stat().st_size // 1024} KB")


if __name__ == '__main__':
    main()
