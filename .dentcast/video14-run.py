import json, subprocess, urllib.request
from pathlib import Path
def run(*args):
    p=subprocess.run(args,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    print(p.stdout,flush=True)
    if p.returncode: raise RuntimeError(str(args))
print("PREFLIGHT_BEGIN",flush=True)
run("python3","tools/dentcast_publish_handoff.py","plan")
run("python3","-c","import sys,json;sys.path.insert(0,'tools');from build_pillar import PILLARS; print(json.dumps({k:[s['slug'] for s in v['subtopics']] for k,v in PILLARS.items()},ensure_ascii=False))")
run("python3","tools/hashtag_ref.py","--simulate","پست و کور لق می‌خوره")
run("python3","tools/hashtag_ref.py","--simulate","ثبات پست و کور")
url="https://dentcast.arvanvod.ir/vkxeWA47OD/M9a0Oxm7ve/origin_config.json"
conf=json.load(urllib.request.urlopen(url,timeout=40))
print("CONFIG",json.dumps(conf,ensure_ascii=False))
mp4="https://dentcast.arvanvod.ir/vkxeWA47OD/M9a0Oxm7ve/origin_jbraJvaOQbLWL1a3dXUVLFKIPH6EdUJAsXCu1bmt.mp4"
try:
    with urllib.request.urlopen(urllib.request.Request(mp4,method="HEAD"),timeout=40) as r:
        print("MP4_HEAD",r.status,dict(r.headers))
except Exception as e: print("MP4_HEAD_ERROR",str(e))
print("HANDOFF_REFS",flush=True)
refs=subprocess.check_output(["git","for-each-ref","--format=%(refname)","refs/remotes/origin"],text=True).splitlines()
for ref in refs:
    p=subprocess.run(["git","cat-file","-e",ref+":.dentcast/PUBLISH-HANDOFF.md"],capture_output=True)
    if p.returncode==0: print(ref,flush=True)
print("PREFLIGHT_END",flush=True)
