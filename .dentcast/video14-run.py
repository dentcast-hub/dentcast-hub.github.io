import copy
import hashlib
import html
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

CID = 'dentcast-plus/video-14'
PAGE = CID + '.html'
EN = 'dentcast-plus/en/video-14.html'
HANDOFF = '.dentcast/PUBLISH-HANDOFF.md'
REPORT = 'reports/video-14-publication.md'
DATA = json.loads("{\"title\":\"پست و کور توی دندون لق می‌خوره و ثبات نداره، حالا چی‌کار کنیم؟\",\"caption\":\"پست و کور توی دندون لق می‌خوره و ثبات نداره، حالا چی‌کار کنیم؟\\n\\nوقتی پست و کور روی دندون ثبات نداره، یکی از اولین چیزایی که به ذهنم می‌رسه یه نقطه تیزه، چه روی دندون چه روی خود پست و کور، که نمی‌ذاره پست کامل بنشینه.\\n\\nمثلاً یه قسمتی از دندون تیز بوده و من با دورالی روش پست و کور ساختم. اولش کیپ بوده و ثبات داشته، ولی بعد از ریختگی همون نقطه تیز مانع نشستن کامل شده. یا نوک پست خیلی تیز بوده و بعد از تبدیل شدن به فلز، ندولی یا ضایعه‌ای روش ایجاد شده و نمی‌ذاره بشینه.\\n\\nبرای همین توی همچین حالتی اول برمی‌گردم جای تیز رو بررسی می‌کنم و اگه لازم بود اصلاحش می‌کنم. خیلی وقتا همین مشکل رو حل می‌کنه، اما تو این مورد حل نشد.\\n\\nپس پست و کور رو از اول تکرار کردم. چون با این عدم ثبات نمی‌تونی روکش رو روش بذاری. وقتی روکش وارد سیکل جویدن بشه و نیروهای جویدن بهش وارد بشه، اگه ثبات نداشته باشیم، این نیروها به اینترفیس سمان و پست منتقل میشه، نیروی برشی ایجاد میکنه و در نهایت روکش همراه با سمان از دندون در میاد.\",\"en_title\":\"The Post and Core Rocks in the Tooth and Is Unstable: What Should We Do?\",\"en_caption\":\"The post and core rocks in the tooth and is unstable. What should we do?\\n\\nWhen a post and core is unstable on the tooth, one of the first things I think of is a sharp point, either on the tooth or on the post and core itself, that prevents the post from seating fully.\\n\\nFor example, a part of the tooth may have been sharp when I used Duralay to make the post and core over it. Initially, it fitted snugly and was stable, but after casting, that same sharp point prevented complete seating. Or the tip of the post may have been very sharp, and after it was converted into metal, a nodule or defect formed on it and prevented it from seating.\\n\\nThat is why, in this situation, I first go back and check the sharp area and adjust it if necessary. This often solves the problem, but it did not in this case.\\n\\nSo I remade the post and core from scratch. You cannot place a crown over it with this lack of stability. Once the crown enters the chewing cycle and is subjected to chewing forces, if we do not have stability, those forces are transferred to the cement–post interface, creating shear forces, and eventually the crown comes off the tooth together with the cement.\",\"tags\":[\"#دنتکست_پلاس\",\"#پست_و_کور\"],\"keywords\":[\"لق خوردن پست و کور\",\"عدم ثبات پست و کور\",\"نشستن کامل پست\",\"نقطه تیز پست و کور\",\"ندول ریختگی\",\"نیروی برشی سمان\",\"cast post and core instability\",\"post and core rocking\",\"incomplete post seating\",\"casting nodule\",\"cement interface shear forces\"],\"des\":{\"des_version\":\"3.4\",\"content_type\":\"COMMENTARY\",\"question_type\":null,\"text_basis\":\"FULL_TEXT\",\"citation\":{\"title\":\"پست و کور توی دندون لق می‌خوره و ثبات نداره، حالا چی‌کار کنیم؟\",\"authors\":\"دکتر فواد شهابیان\",\"year\":2026,\"journal\":\"\",\"doi\":\"\"},\"journal_quartile\":{\"value\":\"NR\",\"source\":\"NR\"},\"s_design\":null,\"q_method\":null,\"penalties\":null,\"commentary_checklist\":[{\"item\":\"reasoning chain is explicit\",\"points\":4,\"evidence_quote\":\"این نیروها به اینترفیس سمان و پست منتقل میشه، نیروی برشی ایجاد میکنه و در نهایت روکش همراه با سمان از دندون در میاد.\",\"note\":\"زنجیرهٔ مکانیکی عدم ثبات، انتقال نیرو و از دست رفتن روکش بیان شده است.\"},{\"item\":\"relationship to published evidence is stated\",\"points\":0,\"evidence_quote\":\"\",\"note\":\"رابطه‌ای با پژوهش منتشرشده بیان نشده است.\"},{\"item\":\"scope of the claim is bounded\",\"points\":3,\"evidence_quote\":\"خیلی وقتا همین مشکل رو حل می‌کنه، اما تو این مورد حل نشد.\",\"note\":\"کارایی اصلاح نقطهٔ تیز با قید فراوانی و استثنای همین مورد محدود شده است.\"},{\"item\":\"explicitly labeled as experience/opinion, not evidence\",\"points\":0,\"evidence_quote\":\"\",\"note\":\"روایت اول‌شخص است، اما برچسب صریح تجربه یا نظر در برابر شواهد ندارد.\"}],\"des_score\":12,\"band\":\"E\",\"provisional\":false,\"fact_fa\":\"این روایت بالینی امتیاز ۱۲ و باند E دارد.\",\"interpretation_fa\":\"ارزش این روایت در نشان‌دادن مسیر بررسی نشست ناقص پست و کور و تصمیم به تکرار آن پس از رفع‌نشدن عدم ثبات است. متن، استدلال بالینی نویسنده را توضیح می‌دهد و گزارش یک پژوهش نیست.\"}}")
TITLE = DATA['title']
CAPTION = DATA['caption']
BASE = 'https://dentcast.arvanvod.ir/vkxeWA47OD/M9a0Oxm7ve/'
CONFIG = BASE + 'origin_config.json'
PLAYER = 'https://player.arvancloud.ir/index.html?config=' + CONFIG
YT = 'uRwMJoWCEdw'
NOTE = 'Reviewed actual scoped work, current handoff, and previous remote delivery'
NOW = datetime.now(timezone.utc)
TODAY = NOW.date().isoformat()
TMP = Path(tempfile.mkdtemp(prefix='dentcast-video14-'))
LOG = TMP / 'commands.log'
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'

def command(*args, check=True, quiet=False):
    p = subprocess.run(args, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    with LOG.open('a') as f:
        f.write('\n$ ' + ' '.join(args[:3]) + '\n' + p.stdout)
    if not quiet:
        print(p.stdout, flush=True)
    if check and p.returncode:
        raise RuntimeError('Command failed: ' + repr(args[:3]) + '\n' + p.stdout)
    return p

def helper(*args, check=True):
    p = command(sys.executable, 'tools/dentcast_publish_handoff.py', *args, check=check, quiet=True)
    try:
        result = json.loads(p.stdout)
    except ValueError:
        print(p.stdout, flush=True)
        raise
    print('CHECKPOINT', args[0], result.get('status'), result.get('next_step'), result.get('error', ''), flush=True)
    if p.returncode and check:
        raise RuntimeError(p.stdout)
    return result

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def digest():
    return sha(HANDOFF)

def read(path):
    return Path(path).read_text(encoding='utf-8')

def write(path, text):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(text, encoding='utf-8')

def append_report(text):
    write(REPORT, (read(REPORT) if Path(REPORT).exists() else '# Video 14 publication\n\n') + text + '\n\n')

def record_context(key, value):
    state = helper('inspect', check=False)['recorded_state']['publication']
    state['context'][key].append(value)
    path = TMP / 'state.json'
    path.write_text(json.dumps(state, ensure_ascii=False))
    helper('record', '--input', str(path), '--expected-sha256', digest(), '--reconcile-note', NOTE)

def deliver(label):
    command('git', 'add', '-A', quiet=True)
    inspected = helper('inspect', check=False)
    state = inspected['recorded_state']['publication']
    tracked_work = set(inspected['recorded_state']['snapshot']['files'])
    tracked_work.update(inspected['current_snapshot']['files'])
    state['target_paths'] = sorted(set(state['target_paths']) | tracked_work)
    path = TMP / 'state.json'
    path.write_text(json.dumps(state, ensure_ascii=False))
    helper('record', '--input', str(path), '--expected-sha256', digest(), '--reconcile-note', NOTE)
    command('git', 'add', HANDOFF, quiet=True)
    command('git', 'commit', '-m', 'Publish video 14: ' + label, quiet=True)
    command('git', 'push', 'origin', 'HEAD:codex/publish-video-14', quiet=True)
    result = helper('inspect', '--check-remote')
    if result['git_snapshot_portable'] != 'yes':
        raise RuntimeError(json.dumps(result))

def run_step(sid, action=None, skip=None, evidence=None):
    inspected = helper('inspect', check=False)
    previous = next(s for s in inspected['recorded_state']['publication']['steps'] if s['id'] == sid)
    if previous['status'] in ('completed', 'skipped'):
        print('RESUME_ALREADY_RESOLVED',sid,previous['status'],flush=True)
        return
    helper('step', '--id', sid, '--status', 'started', '--expected-sha256', digest(), '--reconcile-note', NOTE)
    try:
        if action:
            action()
        append_report('## ' + sid + '\n' + (skip or evidence or 'Executed and checked; see committed files and GitHub Actions log.'))
        command('git', 'add', '-A', quiet=True)
        args = ['step', '--id', sid, '--status', 'skipped' if skip else 'completed', '--expected-sha256', digest(), '--reconcile-note', NOTE]
        if skip:
            args += ['--reason', skip]
        else:
            args += ['--evidence', REPORT + '#' + sid, '--evidence', 'https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/' + os.environ['GITHUB_RUN_ID']]
        helper(*args)
        deliver(sid)
    except Exception as exc:
        print('STEP_FAILED', sid, str(exc), flush=True)
        helper('step', '--id', sid, '--status', 'failed', '--expected-sha256', digest(), '--reason', str(exc)[:2000], '--reconcile-note', NOTE, check=False)
        try:
            deliver(sid + ' blocked')
        except Exception as delivery_error:
            print('DELIVERY_ERROR', str(delivery_error), flush=True)
        raise

def map_schema(doc, transform):
    pattern = r'(<script\s+type="application/ld\+json"[^>]*>)([\s\S]*?)(</script>)'
    def update(m):
        node = json.loads(m[2])
        transform(node)
        return m[1] + '\n' + json.dumps(node, ensure_ascii=False, indent=2) + '\n' + m[3]
    return re.sub(pattern, update, doc)

def replace_meta(doc, name, value):
    pattern = r'(<meta\s+(?:name|property)="' + re.escape(name) + r'"\s+content=")[^"]*(")'
    doc, n = re.subn(pattern, lambda m: m[1] + html.escape(value, quote=True) + m[2], doc)
    assert n == 1, (name, n)
    return doc

def paragraph_html(text):
    return '\n'.join('<p>' + html.escape(p) + '</p>' for p in text.split('\n\n'))

def schema_transform(node, en=False):
    if node.get('@type') == 'VideoObject':
        node.update(name=DATA['en_title'] if en else TITLE,
                    description=DATA['en_caption'] if en else CAPTION,
                    thumbnailUrl=[BASE+'thumbnail.jpg'],
                    uploadDate=NOW.isoformat(timespec='seconds'),
                    datePublished=TODAY, dateModified=TODAY,
                    inLanguage='en' if en else 'fa', embedUrl=PLAYER,
                    contentUrl=MEDIA['source'][0]['src'])
        node['mainEntityOfPage']['@id'] = 'https://dentcast.org/' + (EN if en else PAGE)
    elif node.get('@type') == 'BreadcrumbList':
        node['itemListElement'][-1].update(name=(DATA['en_title'] if en else TITLE)+' | DentCast+', item='https://dentcast.org/'+(EN if en else PAGE))

def build_page():
    doc = read('dentcast-plus/video-13.html')
    old_title = BRAIN_PREV['title']
    doc = doc.replace('video-13.html', 'video-14.html').replace(old_title, html.escape(TITLE))
    doc = doc.replace('VRom8rJvaY', 'M9a0Oxm7ve').replace('NZUeT9BaaAs', YT)
    doc = doc.replace('VID_20231226_203751.mp4', MEDIA['title'])
    for key in ['description', 'og:description', 'twitter:description']:
        doc = replace_meta(doc, key, CAPTION)
    doc = map_schema(doc, schema_transform)
    pattern = r'(<div class="text-box">)([\s\S]*?)(</div>)'
    def body(m):
        toggle = re.search(r'<a class="lang-btn"[\s\S]*?</a>', m[2]).group()
        return m[1] + '\n' + toggle + '\n' + paragraph_html(CAPTION) + '\n' + m[3]
    doc, n = re.subn(pattern, body, doc, count=1)
    assert n == 1
    # The three template related slots are value-swapped for this topic.
    old_urls = ['/dentcast-plus/video-12.html','/dentai/dentai-33.html','/dentcast-plus/video-11.html']
    selected = [('/dentcast-plus/video-10.html', 'چند نکته برای ساخت پست مستقیم آکریلی چیرساید'),
                ('/metanotes/meta-20.html', 'پست و کور یک‌مرحله‌ای؛ وقتی «عدم تطابق» به نفع درمان تمام می‌شود'),
                ('/insight/insight-54.html', 'مدیریت افتادن مکرر روکش: رویکرد حذف گام‌به‌گام علل')]
    for old, (url, label) in zip(old_urls, selected):
        pat = r'<a href="' + re.escape(old) + r'" class="dc-related-capsule">[\s\S]*?</a>'
        doc, count = re.subn(pat, '<a href="'+url+'" class="dc-related-capsule">'+html.escape(label)+'</a>', doc)
        assert count == 1
    assert doc.count("gtag('config'") == 1
    assert 'VRom8rJvaY' not in doc and 'origin_446' not in doc
    write(PAGE, doc)

def landing():
    doc = read('dentcast-plus/index.html')
    card = re.search(r'    <a href="video-13.html" class="video-card">[\s\S]*?</a>', doc).group()
    new = card.replace('video-13.html', 'video-14.html').replace('VRom8rJvaY','M9a0Oxm7ve').replace(BRAIN_PREV['title'], html.escape(TITLE))
    assert doc.count('href="video-14.html"') == 0
    write('dentcast-plus/index.html', doc.replace(card,new+'\n\n'+card,1))

def audit():
    doc = read(PAGE)
    assert 'href="https://dentcast.org/'+PAGE+'"' in doc
    assert 'href="https://dentcast.ir/'+PAGE+'"' in doc
    assert 'en/video-14.html' in doc
    assert 'M9a0Oxm7ve' in doc and YT in doc
    assert '2026-09-07' not in doc
    append_report('Meta audit: canonical, fa hreflang, OG/Twitter title/description, VideoObject dates, media and toggle all OK. Publication date: '+TODAY)

def backlinks():
    # Semantic review: post/core fit, cement failure, retention, resistance.
    # Other glossary concepts are not what this clinical narrative resolves.
    for slug in ['post-and-core','dental-cement','retention','resistance']:
        path = 'glossary/'+slug+'.html'
        before = sha(path)
        doc = read(path)
        block = re.search(r'<div class="dc-related-section">[\s\S]*?</div>\s*</div>', doc)
        if not block:
            append_report(slug+': no related section; unchanged '+before)
            continue
        links = re.findall(r'<a\b', block.group())
        if len(links) >= 5:
            append_report(slug+': at cap ('+str(len(links))+'); unchanged '+before)
            continue
        match = re.search(r'(<div class="dc-related-capsules">)([\s\S]*?)(</div>)', block.group())
        assert match
        changed = block.group().replace(match.group(), match[1]+match[2]+'\n    <a href="/'+PAGE+'" class="dc-related-capsule">'+html.escape(TITLE)+'</a>\n  '+match[3])
        write(path, doc[:block.start()]+changed+doc[block.end():])
        append_report(slug+': appended one link; SHA256 '+before+' -> '+sha(path))

def inline_links():
    doc = read(PAGE)
    m = re.search(r'(<div class="text-box">)([\s\S]*?)(</div>)',doc)
    body=m[2]
    # Preserve the h1 and author wording, link first technical body occurrence.
    body=body.replace('پست و کور','<a href="/glossary/post-and-core.html">پست و کور</a>',1)
    body=body.replace('اینترفیس سمان و پست','اینترفیس <a href="/glossary/dental-cement.html">سمان</a> و پست',1)
    write(PAGE,doc[:m.start()]+m[1]+body+m[3]+doc[m.end():])
    append_report('Fresh semantic inline analysis: post-and-core and dental-cement are exact technical concepts; linked once each. No generic "forces" or "stability" links. Episodes about cement types/bonding were excluded because their specific material protocols are not discussed here.')

def related_check():
    doc=read(PAGE)
    block=re.search(r'<div class="dc-related-section">[\s\S]*?</div>\s*</div>',doc).group()
    assert len(re.findall(r'<a\b',block))==5
    append_report('Fresh semantic comparison: video-10 addresses direct acrylic cast-post fabrication; meta-20 addresses cast post fit; insight-54 addresses recurrent decementation. Two navigation capsules + three related slots = 5/5. No additional links or removals at this step.')

def des_score():
    spec=read('.dentcast/dentcast-evidence-score-v3.4.md').split('## Appendix')[0]
    assert 'COMMENTARY track' in spec
    source=DATA['des']
    assert source['content_type']=='COMMENTARY'
    assert source['des_score']==5+sum(x['points'] for x in source['commentary_checklist'])
    for item in source['commentary_checklist']:
        if item['points']: assert item['evidence_quote'] in CAPTION
    path='plus/des-scores.json'
    data=json.loads(read(path))
    assert CID not in data
    data[CID]={'scored_at':TODAY,'sources':[source]}
    write(path,json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    append_report('DES SOURCE: own caption, FULL_TEXT, COMMENTARY, '+str(source['des_score'])+'/E, provisional=false. Exact quotes, arithmetic, band and null track fields checked. No paper/DOI was inferred. FIDELITY does not run on a self-commentary record.')

def hashtags():
    for phrase in ['دنتکست پلاس','پست و کور']:
        command('python3','tools/hashtag_ref.py','--simulate',phrase)
    # Existing canonical concepts only; no vocabulary or alias creation.
    assert all(tag in read('dentcast-hashtag-reference.json') for tag in DATA['tags'])

def brain():
    data=json.loads(read('dentcast-brain.json'))
    entry=copy.deepcopy(BRAIN_PREV)
    entry.update(video='14',title=TITLE,caption=CAPTION,hashtags=DATA['tags'],keywords=DATA['keywords'],page_url='/'+PAGE,pillar={'primary':'fixed-pros','secondary':[],'subtopic':'post-and-core'})
    assert list(entry)==list(BRAIN_PREV)
    data.append(entry)
    write('dentcast-brain.json',json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    command('python3','tools/hashtag_ref.py','--sync')
    command('python3','tools/hashtag_ref.py','--check')
    command('python3','tools/hashtag_ref.py','--simulate','پست و کور لق می‌خوره')
    append_report('Brain entry appended at global tail with exact same ordered keys as video 13. Canonical tags reused: '+', '.join(DATA['tags'])+'; no new concept minted.\n```json\n'+json.dumps(entry,ensure_ascii=False,indent=2)+'\n```')

def pillar_check():
    sys.path.insert(0,'tools')
    from build_pillar import PILLARS
    entries=[e for e in json.loads(read('dentcast-brain.json')) if e.get('page_url')=='/'+PAGE]
    if entries:
        assert entries[-1]['pillar']=={'primary':'fixed-pros','secondary':[],'subtopic':'post-and-core'}
    assert 'post-and-core' in [s['slug'] for s in PILLARS['fixed-pros']['subtopics']]
    assert 'href="/pillar/fixed-pros/"' in read(PAGE)

def pathways():
    command('python3','tools/pathway_place.py',CID)
    command('python3','tools/pathway_place.py','--insert',CID,'--pathway','post-and-core','--after','dentcast-plus/video-13')
    command('python3','tools/pathway_place.py','--insert',CID,'--pathway','failure-troubleshooting','--after','insight/insight-54')
    command('python3','tools/pathway_place.py','--coverage')
    append_report('Semantic placement: post-and-core after video-13 (post fabrication/cementation -> fit troubleshooting); failure-troubleshooting after insight-54 (recurrent crown loss -> unstable post/core). milestone=false in both. No third pathway: fixed-pros is deliberately the crown/preparation track, separate from its post/core sibling.')

def pulse():
    doc=read('index.html')
    pat=r'(<ul class="dc-pulse-list">)([\s\S]*?)(</ul>)'
    m=re.search(pat,doc)
    items=re.findall(r'<li\b[\s\S]*?</li>',m[2])
    assert len(items)>1
    line='<li>یک ویدیوی تازه در دنت‌کست پلاس با عنوانِ «<a href="/'+PAGE+'">'+html.escape(TITLE)+'</a>» منتشر شد</li>'
    write('index.html',doc[:m.start()]+m[1]+'\n'+line+'\n'+'\n'.join(items[:-1])+'\n'+m[3]+doc[m.end():])
    append_report('Pulse top line: '+line+'\nRemoved lowest: '+items[-1])

def builders():
    commands=[['python3','tools/update-homepage-counters.py'],['python3','tools/build_pillar.py','all'],['node','tools/build_quiz_index.mjs'],['python3','.github/scripts/inject_img_attrs.py'],['node','tools/build_plus_index.mjs'],['python3','tools/build_upboard_index.py'],['python3','.github/scripts/gen_sitemap.py']]
    for args in commands: command(*args)
    assert '/'+PAGE in read('pillar/fixed-pros/index.html')
    assert CID in read('pillar/fixed-pros/structure.json')
    assert CID in read('plus/content-index.json') and CID in read('up-board/index.json')
    append_report('All page-publish builders ran in canonical order. Episode and challenge builders inapplicable; no new flashcards/quiz authored for optional video type. Pillar flat list and post-and-core sidecar verified. Existing shared asset suffixes reviewed through git diff.')

def stamp():
    old=re.search(r"dentcast-assets-([a-z0-9]+)",read('service-worker.js')).group(1)
    command('python3','tools/stamp-version.py')
    new=re.search(r"dentcast-assets-([a-z0-9]+)",read('service-worker.js')).group(1)
    append_report('Content version '+old+' -> '+new)

def english():
    before=sha('metanotes/en/meta-1.html')
    doc=read('dentcast-plus/en/video-13.html')
    doc=doc.replace('video-13.html','video-14.html').replace('My Method for Cementing a Two-Piece Post',html.escape(DATA['en_title']))
    doc=doc.replace('VRom8rJvaY','M9a0Oxm7ve').replace('VID_20231226_203751.mp4',MEDIA['title'])
    for key in ['description','og:description','twitter:description']:
        doc=replace_meta(doc,key,DATA['en_caption'])
    doc=map_schema(doc,lambda node:schema_transform(node,True))
    doc,n=re.subn(r'(<div class="text-box">)[\s\S]*?(</div>)',lambda m:m[1]+'\n'+paragraph_html(DATA['en_caption'])+'\n'+m[2],doc,count=1)
    assert n==1
    # Keep the translated video body and add the same optional external player.
    fa=read(PAGE)
    if '"BreadcrumbList"' not in doc:
        for block in re.findall(r'<script type="application/ld\+json">([\s\S]*?)</script>',fa):
            node=json.loads(block)
            if node.get('@type')=='BreadcrumbList':
                schema_transform(node,True)
                markup='<script type="application/ld+json">\n'+json.dumps(node,ensure_ascii=False,indent=2)+'\n</script>'
                doc=doc.replace('</head>',markup+'\n</head>')
    external=re.search(r'<div class="yt-container">[\s\S]*?</script>',fa).group()
    external=external.replace('مشاهده ویدیو در یوتیوب (پلیر خارجی)','Watch on YouTube (external player)').replace('بستن ویدیو','Close video')
    player_css=re.search(r'<h1>[\s\S]*?</h1>\s*(<style>[\s\S]*?</style>)',fa).group(1)
    doc=doc.replace('<div class="text-box">',player_css+'\n'+external+'\n<div class="text-box">',1)
    write(EN,doc)
    command('python3','.github/scripts/inject_hreflang.py')
    command('python3','tools/noindex_en_mirrors.py','--check')
    assert before==sha('metanotes/en/meta-1.html')
    assert 'href="../video-14.html"' in doc and 'href="en/video-14.html"' in fa
    assert 'noindex, follow' in doc and 'hreflang=' not in doc
    append_report('English mirror translated all five original paragraphs, preserved video type structure and JSON-LD shapes, inherited English chrome and CSS from same-type reference, and retained external YouTube player. Reciprocal toggles, noindex, no hreflang; standard SHA256 '+before+' unchanged.')

def execute():
    global MEDIA, BRAIN_PREV
    command('git','config','core.hooksPath','.githooks',quiet=True)
    resuming = Path(HANDOFF).exists()
    MEDIA=json.load(urllib.request.urlopen(CONFIG,timeout=40))
    assert MEDIA['mediaid']=='M9a0Oxm7ve'
    with urllib.request.urlopen(MEDIA['source'][0]['src'],timeout=40) as response:
        assert response.status==200
        assert '#EXTM3U' in response.read().decode()
    data=json.loads(read('dentcast-brain.json'))
    videos=[x for x in data if x.get('type')=='dentcast_plus']
    assert sorted(int(x['video']) for x in videos) in [list(range(1,14)),list(range(1,15))]
    BRAIN_PREV=next(e for e in videos if e['video']=='13')
    assert BRAIN_PREV['video']=='13'
    template_hash=sha('dentcast-plus/video-13.html')
    plan=helper('plan')['steps']
    inputs={'content_id':CID,'category':'dentcast_plus','target_paths':[PAGE,EN,'dentcast-brain.json','dentcast-plus/index.html',REPORT], 'status':'in_progress','blocker':None,'context':{'inputs':[{'title':TITLE,'caption':CAPTION,'config':CONFIG,'youtube':'https://youtube.com/shorts/'+YT}], 'decisions':[{'quiz':'No quiz or FAQ: explicit user instruction','evidence_basis':'COMMENTARY own clinical narrative','pillar':'fixed-pros/post-and-core'}], 'approvals':[{'scope':'title and publication','decision':'Use supplied first sentence as title and publish; user explicitly confirmed title and requested completion through connected GitHub','status':'confirmed','evidence':['User title confirmation and subsequent explicit publication instruction']}], 'pending_questions':[],'validation':[],'delivery':[],'unrelated_changes':[]},'steps':plan,'external_actions':[]}
    f=TMP/'init.json';f.write_text(json.dumps(inputs,ensure_ascii=False))
    if resuming:
        deliver('reconcile interrupted checkpoint and expand watched output inventory')
    else:
        helper('init','--input',str(f))
    def rules():
        files=['AGENTS.md','.dentcast/workflows/global/README.md','.dentcast/workflows/README.md','.dentcast/workflows/agent-parity.md']
        files += ['.dentcast/workflows/global/'+name+'.md' for name in ['repo-conventions','plus-premium','site-invariants']]
        files += ['.dentcast/workflows/modules/'+s['module'] for s in plan]
        for path in sorted(set(files)):
            assert read(path)
            append_report(path+' SHA256 '+sha(path))
    run_step('rules',rules,evidence='Active workflow sources loaded, category exceptions and user override reviewed; exact source fingerprints below.')
    run_step('0',evidence='Text and media supplied, no attached research paper; normal video publish. Preflight scanned every remote ref for fixed handoff: none found.')
    run_step('A',evidence='Read live flat brain and glossary; all category shapes discovered. Latest dentcast_plus is video 13. PILLARS read from main-based builder.')
    run_step('B.1',evidence='dentcast_plus explicitly selected by user.')
    run_step('B.2',evidence='Series 1..13 contiguous; next identifier video-14.')
    run_step('B.3',evidence='Exact public-safe caption retained in context.inputs; title separately confirmed by user.')
    run_step('B.3.5',evidence='Natural conversational clinical narrative. No AI-style rewrites needed or applied.')
    run_step('B.4',evidence='Arvan config, HLS master and media ID successfully fetched; YouTube ID from user. HLS is verified contentUrl; OCR MP4 failed validation and was not used.')
    run_step('B.4.7',skip='No accompanying paper file; image is video-host metadata.')
    run_step('B.4.8',evidence='COMMENTARY: own clinical case reasoning, no retrievable paper cited; source_text is exact caption, FULL_TEXT.')
    run_step('B.4.9',evidence='Ordinary instructional video, not challenge; explicit user no-quiz instruction.')
    run_step('B.5',evidence='Pulse announcement follows title-only pattern: new DentCast Plus video, linked approved title. No clinical finding revealed.')
    for sid in ['C.0','C.0.1','C.0.2','C.0.3','C.0.4']:
        run_step(sid,skip='Not LiteCast; category is dentcast_plus.')
    run_step('C.1',evidence='Locked template dentcast-plus/video-13.html SHA256 '+template_hash)
    run_step('C.2',build_page)
    for sid in ['C.0.5','C.0.6']:
        run_step(sid,skip='LiteCast-only internal linking; specialist steps apply instead.')
    run_step('C.2.4',pillar_check,evidence='Unambiguous subject: fixed-pros / post-and-core. No taxonomy changes.')
    run_step('C.2.5',lambda:None,evidence='Exactly one related section, two canonical navigation capsules inherited intact: /glossary/ and /pillar/fixed-pros/.')
    run_step('C.2.6',landing)
    run_step('C.3',audit)
    run_step('C.4',lambda:(_ for _ in ()).throw(RuntimeError('Template changed')) if sha('dentcast-plus/video-13.html')!=template_hash else append_report('Template SHA256 before = after = '+template_hash))
    run_step('C.4.5',skip='Not a NoteCast; no parent episode mutation.')
    run_step('C.4.5-b',skip='Not an episode/NoteCast pair.')
    run_step('C.4.6',skip='Not a Promptologist sequence.')
    run_step('C.4.7',backlinks)
    run_step('C.4.7-b',skip='Not a glossary term publication.')
    run_step('C.4.8',inline_links)
    run_step('C.4.9',related_check)
    for sid in ['C.4.10.1','C.4.10.2','C.4.10.3']:
        run_step(sid,skip='No attached paper; no Drive/catalog/citation action.')
    run_step('C.4.11',skip='DentCast+ optional educational bank; this publication is video and caption only, no separate flashcards authored.')
    run_step('C.4.12',skip='Explicit user instruction: no quiz. No FAQPage or scored questions authored.')
    run_step('C.4.13',des_score)
    run_step('C.4.14',skip='Ordinary video, not a challenge.')
    run_step('C.5.0',hashtags)
    run_step('C.5',brain)
    run_step('C.5.5',pillar_check)
    run_step('C.5.6',pathways)
    run_step('C.5.6-b',evidence='bundle-post-core rejected at Gate 1: dentcast-plus is a case/video type, not a foundational bundle type. No failure-troubleshooting bundle. No bundle changed.')
    run_step('C.6',pulse)
    run_step('C.8',builders)
    run_step('C.7',stamp)
    run_step('D',english)
    run_step('E',lambda:(_ for _ in ()).throw(RuntimeError('notify marker missing')) if read(PAGE).count('<meta name="dc-notify" content="true">')!=1 else None,evidence='Exactly one dc-notify marker; standard main push notification workflow owns delivery.')
    result=helper('verify','--expected-sha256',digest(),'--expect-title',TITLE,'--expect-caption',CAPTION,check=False)
    print('PHASE_F_RESULT',json.dumps(result,ensure_ascii=False),flush=True)
    deliver('F verified')
    if result['status']=='blocked':
        raise RuntimeError('Phase F requires correction; full result above')
    # Preserve the completed Phase F and await live delivery rather than claiming it early.
    print('READY_FOR_REVIEW_AND_MAIN_DELIVERY',flush=True)

if __name__ == '__main__':
    execute()
