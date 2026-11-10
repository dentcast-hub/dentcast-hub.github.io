# usage: prep.py <folder> <batchsize>  -> $B/run-<folder>/{pages,drafts,existing-prompts.json,batches.json}; review dir $B/rev-<folder>
import sys,json,re,os,shutil
from html.parser import HTMLParser
B=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO='/home/user/dentcast-hub.github.io'; os.chdir(REPO)
folder=sys.argv[1]; bs=int(sys.argv[2])
miss=json.load(open(f'{B}/missing.json'))['missing']
ex=json.load(open('plus/exam-questions.json'))['byContent']
items=[c for c in miss if c.split('/')[0]==folder and not ex.get(c,{}).get('questions')]
R=f'{B}/run-{folder}'; os.makedirs(R+'/pages',exist_ok=True); os.makedirs(R+'/drafts',exist_ok=True)
class P(HTMLParser):
    def __init__(s): super().__init__(); s.out=[]; s.depth=0; s.skip=0
    def handle_starttag(s,t,a):
        a=dict(a)
        if s.depth==0 and t=='main' and 'article-content-wrap' in (a.get('class') or ''): s.depth=1; return
        if s.depth:
            if t=='main': s.depth+=1
            if t in('script','style','svg','nav'): s.skip+=1
            if t in('p','h1','h2','h3','h4','li','div','br','tr','blockquote','summary'): s.out.append('\n')
    def handle_endtag(s,t):
        if s.depth:
            if t in('script','style','svg','nav') and s.skip: s.skip-=1
            if t=='main': s.depth-=1
    def handle_data(s,d):
        if s.depth and not s.skip: s.out.append(d)
for c in items:
    p=P(); p.feed(open(c+'.html',encoding='utf-8').read())
    t=''.join(p.out); t=re.sub(r'[ \t]+',' ',t); t=re.sub(r'\n\s*\n+','\n\n',t).strip()
    open(f"{R}/pages/{c.replace('/','__')}.txt",'w').write(t)
    if len(t)<800: print('THIN',c,len(t))
pw=json.load(open('plus/pathways.json')); paths=pw.get('pathways',pw) if isinstance(pw,dict) else pw
pids={p for c in items for p in miss[c]}
out={}
for p in paths:
    if p.get('id') in pids and p.get('kind')!='bundle':
        out[p['id']]=[{'content_id':s['content_id'],'prompt_fa':q['prompt_fa']} for s in p['steps'] for q in ex.get(s['content_id'],{}).get('questions',[]) if q.get('status','live')!='rejected']
json.dump(out,open(f'{R}/existing-prompts.json','w'),ensure_ascii=False,indent=0)
batches=[items[i:i+bs] for i in range(0,len(items),bs)]
json.dump(batches,open(f'{R}/batches.json','w'),ensure_ascii=False,indent=1)
shutil.copy(f'{B}/BRIEF-drafter.md',f'{R}/BRIEF-drafter.md')
print(folder,len(items),'items',len(batches),'batches',[len(b) for b in batches])
