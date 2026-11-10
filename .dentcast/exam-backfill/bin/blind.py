# usage: blind.py <folder> : checks anchors + draft-check, builds isolated review dir
import sys,json,glob,os,shutil,subprocess
B=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
folder=sys.argv[1]; R=f'{B}/run-{folder}'; V=f'{B}/rev-{folder}'
shutil.rmtree(V,ignore_errors=True); os.makedirs(V+'/blind'); os.makedirs(V+'/review')
shutil.copytree(R+'/pages',V+'/pages'); shutil.copy(f'{B}/BRIEF-reviewer.md',V)
blind=[]; bad=0
for f in sorted(glob.glob(f'{R}/drafts/*.json')):
    d=json.load(open(f)); cid=d['content_id']; body=open(f"{R}/pages/{cid.replace('/','__')}.txt").read()
    r=subprocess.run(['python3','tools/validate_exam_questions.py','--draft-check',f],cwd='/home/user/dentcast-hub.github.io',capture_output=True,text=True)
    if r.returncode: print('DRAFTCHECK FAIL',cid); bad+=1
    for i,q in enumerate(d['questions']):
        if q.get('anchor_quote','') not in body or not q.get('anchor_quote'): print('ANCHOR FAIL',cid,i); q['_anchor_fail']=True
        blind.append({'qid':f'{cid}#{i}','content_id':cid,'prompt_fa':q['prompt_fa'],'options':q['options']})
    json.dump(d,open(f,'w'),ensure_ascii=False,indent=1)
json.dump(blind,open(f'{V}/blind/questions.json','w'),ensure_ascii=False,indent=1)
pages=len(glob.glob(f'{R}/pages/*.txt')); drafts=len(glob.glob(f'{R}/drafts/*.json'))
print(f'{folder}: pages {pages}, drafts {drafts}, questions {len(blind)}, draftcheck fails {bad}')
