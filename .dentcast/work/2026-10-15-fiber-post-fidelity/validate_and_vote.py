"""Reproduce SOURCE-part validation/voting with the repository's own functions.

The CLI cannot vote a POOLED page directly. Each generated block is SOURCE
scope, so call its existing vote_source function per part, then use the
ordinary CLI --merge over final/out-S<n>.json. No verdict is patched here.
"""
from pathlib import Path
import json,sys

ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'tools'))
import verify_publish as vp
from des_fidelity_units import vote_source

WORK=Path(__file__).resolve().parent
FINAL=WORK/'final'; FINAL.mkdir(exist_ok=True)
F5={'des_version','mode','scope','text_basis','claims','counts','assessable','fidelity_score','level','provisional','source_conclusion','fact_fa','interpretation_fa'}
adj=json.loads((WORK/'adjudicate.json').read_text()) if (WORK/'adjudicate.json').exists() else {}
rev=json.loads((WORK/'review.json').read_text()) if (WORK/'review.json').exists() else {}
results=[]; pending=0
for n in range(1,5):
    tag=f'S{n}'
    inp=json.loads((WORK/f'input-pooled-{tag}.json').read_text())
    runs=[]
    for k in (1,2,3):
        p=WORK/f'out-{tag}-{k}.json'
        if not p.exists():
            if k<=2: raise SystemExit(f'missing {p}')
            continue
        d=json.loads(p.read_text())
        want=inp['units']
        if k==3:
            want=json.loads((WORK/f'tiebreak-{tag}'/f'input-pooled-{tag}.json').read_text())['units']
        assert set(d)==F5,(p,'F5 key set')
        assert [(x['id'],x['claim_quote']) for x in d['claims']]==[(x['id'],x['text']) for x in want],(p,'ids/text/order')
        assert d['source_conclusion']==inp['source_conclusion'],(p,'conclusion')
        assert d['scope']=='SOURCE' and d['text_basis']=='ABSTRACT_ONLY' and d['provisional'] is True
        rep=vp.Report(f'{tag}-run{k}')
        vp.des_check_fidelity(rep,f'{tag}-run{k}',d,'SOURCE','ABSTRACT_ONLY',vp.des_norm(' '.join(x['text'] for x in want)),vp.des_norm(inp['source_text']))
        assert not rep.failures,rep.render()
        runs.append(d)
    pairs=lambda d:[(c['verdict'],c.get('change_kind')) for c in d['claims']]
    agree=sum(a==b for a,b in zip(pairs(runs[0]),pairs(runs[1])))
    out,tie,unresolved,unreviewed=vote_source(runs,adj.get(tag),rev.get(tag))
    row={'source':tag,'agreement':agree,'total':len(inp['units']),'runs':len(runs),'tie_break_pending':tie,'unresolved':unresolved,'unreviewed_flags':unreviewed,'counts':out['counts'],'score':out['fidelity_score'],'level':out['level']}
    results.append(row)
    open_count=len(tie)+len(unresolved)+len(unreviewed);pending+=open_count
    if not open_count:
        rep=vp.Report(tag)
        vp.des_check_fidelity(rep,tag,out,'SOURCE','ABSTRACT_ONLY',vp.des_norm(' '.join(x['text'] for x in inp['units'])),vp.des_norm(inp['source_text']))
        assert not rep.failures,rep.render()
        (FINAL/f'out-{tag}.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(row,ensure_ascii=False))
summary={'results':results,'agreement':sum(r['agreement'] for r in results),'total':sum(r['total'] for r in results),'pending':pending,'validation':'F5 schema; exact IDs/text/order; canonical des_check_fidelity; exact echoed conclusion','voting':'unchanged tools/des_fidelity_units.py vote_source called per SOURCE part'}
(WORK/'validation-and-agreement.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
if pending: raise SystemExit(f'{pending} unit decisions/reviews pending')
