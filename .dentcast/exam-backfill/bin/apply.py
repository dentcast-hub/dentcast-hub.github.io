# usage: apply.py <folder> : appends accepted rows to plus/exam-questions.json
import sys,json,glob,os,hashlib
B=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
folder=sys.argv[1]; R=f'{B}/run-{folder}'; V=f'{B}/rev-{folder}'
os.chdir('/home/user/dentcast-hub.github.io')
rev={}
for f in glob.glob(f'{V}/review/*.json'):
    for r in json.load(open(f)): rev[r['qid']]=r
path='plus/exam-questions.json'; raw=open(path,encoding='utf-8').read(); data=json.loads(raw); by=data['byContent']
ids={q['id'] for v in by.values() for q in v['questions']}
acc=rej=0; log=[]
for f in sorted(glob.glob(f'{R}/drafts/*.json')):
    d=json.load(open(f)); cid=d['content_id']
    for i,q in enumerate(d['questions']):
        r=rev.get(f'{cid}#{i}')
        why=None
        if q.get('_anchor_fail'): why='anchor'
        elif not r: why='no review'
        elif r['answer']!=q['correct']: why=f"key {q['correct']} vs reviewer {r['answer']}"
        elif r['defensible_others']: why='defensible others'
        elif r['verdict']!='accept': why='reviewer reject: '+r.get('note','')
        if why: rej+=1; log.append(f'DROP {cid}#{i}: {why}'); continue
        n=1
        while 'r-'+hashlib.sha1(f'{cid}|backfill-{n}'.encode()).hexdigest()[:8] in ids: n+=1
        qid='r-'+hashlib.sha1(f'{cid}|backfill-{n}'.encode()).hexdigest()[:8]; ids.add(qid)
        by.setdefault(cid,{'questions':[]})['questions'].append({'id':qid,'kind':'mcq','prompt_fa':q['prompt_fa'],'options':q['options'],'correct':q['correct'],'source':'backfill'})
        acc+=1
s=json.dumps(data,ensure_ascii=False,indent=2)+('\n' if raw.endswith('\n') else '')
open(path,'w',encoding='utf-8').write(s)
open(f'{R}/apply-log.txt','w').write('\n'.join(log))
print('\n'.join(log)); print(f'{folder}: accepted {acc}, dropped {rej}')
