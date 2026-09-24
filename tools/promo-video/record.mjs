import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// usage: (from repo root) npx http-server -p 8080 -s -c-1 .   then   node tools/promo-video/record.mjs
// writes frames/, list.txt and marks.json into the current directory.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const SITE = process.env.SITE || 'http://localhost:8080';
const SILENT = process.env.SILENT_MP3 || 'silent.mp3';   // 15:02 of silence, see README
const W=540,H=960, OUT='frames';
fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT);
const b = await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const ctx = await b.newContext({ viewport:{width:W,height:H}, deviceScaleFactor:2, isMobile:true, hasTouch:true, locale:'fa-IR' });
await ctx.addInitScript(()=>{
  if (location.pathname.startsWith('/__promo')) return;
  try{localStorage.setItem('dc-tos-v2', JSON.stringify({hello2:1}));}catch(e){}
  const css=`#dcSearchOverlay,#dcSearchOverlay *:not(svg):not(path){font-family:'Vazirmatn',sans-serif!important}
  [class*="dc-spot"],#dc-float-search{display:none!important}
  ::-webkit-scrollbar{display:none}`;
  const add=()=>{const s=document.createElement('style');s.textContent=css;(document.head||document.documentElement).appendChild(s)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
});
await ctx.route('**/spot/spot.js*', r=>r.abort());
await ctx.route('**/*googletagmanager*', r=>r.abort());
await ctx.route(SITE+'/__promo/**', r=>{
  const u=new URL(r.request().url()).pathname.replace('/__promo','');
  if(u==='/stage.html') return r.fulfill({path:path.join(HERE,'stage.tpl'),contentType:'text/html; charset=utf-8'});
  if(u==='/logo-v2.png') return r.fulfill({path:path.join(ROOT,'logo-v2.png')});
  if(u==='/vazir.woff2') return r.fulfill({path:path.join(ROOT,'fonts/Vazirmatn[wght].woff2'),contentType:'font/woff2'});
  return r.fulfill({status:404});
});
const serveSilent = r => { // the real bucket is unreachable here; media seeking needs byte ranges
  const buf=fs.readFileSync(SILENT), m=/bytes=(\d+)-(\d*)/.exec(r.request().headers()['range']||'');
  if(!m) return r.fulfill({status:200,body:buf,headers:{'content-type':'audio/mpeg','accept-ranges':'bytes','access-control-allow-origin':'*'}});
  const a=+m[1], b=m[2]?+m[2]:buf.length-1;
  return r.fulfill({status:206,body:buf.subarray(a,b+1),headers:{'content-type':'audio/mpeg','accept-ranges':'bytes','content-length':String(b-a+1),'content-range':`bytes ${a}-${b}/${buf.length}`,'access-control-allow-origin':'*'}});
};
await ctx.route('https://dentopedia.s3.ir-thr-at1.arvanstorage.ir/**', serveSilent);
const page = await ctx.newPage();
await page.goto(SITE+'/__promo/stage.html');
await page.evaluate(s=>document.getElementById('f').src=s+'/',SITE);
const fr = () => page.frames().find(f=>f!==page.mainFrame() && f.url().startsWith(SITE));
await page.waitForTimeout(3500);
const S=(fn,...a)=>page.evaluate(([fn,a])=>window.S[fn](...a),[fn,a]);
const sleep=ms=>page.waitForTimeout(ms);
const center=async sel=>{const r=await fr().locator(sel).first().evaluate(e=>{const b=e.getBoundingClientRect();return[b.left+b.width/2,b.top+b.height/2+47]});return r;};

// ---- start screencast
const cdp = await ctx.newCDPSession(page);
const frames=[]; let t0=null, marks={};
cdp.on('Page.screencastFrame', async ({data,metadata,sessionId})=>{ frames.push({data,ts:metadata.timestamp}); cdp.send('Page.screencastFrameAck',{sessionId}).catch(()=>{}); });
await cdp.send('Page.startScreencast',{format:'jpeg',quality:94,maxWidth:1080,maxHeight:1920,everyNthFrame:1});
const mark=k=>marks[k]=Date.now()/1000;
mark('start');
// 0: intro
await S('intro'); await sleep(500);
await S('cap','<b>دنت‌کست</b> — جامع‌ترین منبع فارسی پروتز');
await sleep(2400);
// 1: search tap
await S('cap','هر سؤالِ بالینی، <b>یک جستجو</b>');
let [x,y]=await center('#panel-studio .dc-exa-search');
await S('fingerShow',x+60,y+260); await sleep(250);
await S('fingerMove',x+40,y); await sleep(800);
await S('press',true); await S('ripple'); await sleep(140);
await fr().evaluate(()=>document.querySelector('#panel-studio .dc-exa-search').click());
await S('press',false); await sleep(300); await S('fingerHide');
await S('camera',1.12,195,120); await sleep(700);
// 2: typing
const word='کانتکت'; const delays=[210,170,260,150,230,190];
for (let i=0;i<word.length;i++){ await fr().locator('#dcSearch').pressSequentially(word[i]); await sleep(delays[i]); }
await sleep(900);
await S('camera',.93,195,0); await S('cap','«<b>کانتکت</b>» — همهٔ دنت‌کست در یک لحظه');
await sleep(1600);
// 3: pick 121.1
const res = fr().locator('#dcSearchOverlay').getByText('اپیزود 121.1').first();
await res.scrollIntoViewIfNeeded();
const [rx,ry]=await res.evaluate(e=>{const b=e.getBoundingClientRect();return[b.left+b.width/2,b.top+b.height/2+47]});
await S('fingerShow',rx-20,ry+220); await sleep(200);
await S('fingerMove',rx+30,ry,800); await sleep(1000);
await res.evaluate(e=>{const row=e.closest('a,li,[role=button],div');row.style.transition='background .3s,transform .3s';row.style.background='rgba(37,99,235,.12)';row.style.transform='scale(1.02)';});
await S('press',true); await S('ripple'); await sleep(300);
await S('veil',1); await sleep(350);
await res.evaluate(e=>(e.closest('a')||e).click());
await S('press',false); await S('fingerHide');
mark('nav');
await fr().waitForLoadState('load').catch(()=>{});
await sleep(450);
// 4: episode
await S('veil',0);
await S('cap','دنتوپدیا ۱۱ · <b>مدیریت کانتکتِ ۶ و ۷</b>');
await sleep(2000);
await fr().evaluate(()=>{const el=document.querySelector('.ep-player-wrap');const y=el.getBoundingClientRect().top+scrollY-260;window.scrollTo({top:y,behavior:'smooth'});});
await sleep(1400);
[x,y]=await center('#ep-play');
await S('fingerShow',x+120,y+200); await sleep(200);
await S('fingerMove',x,y,750); await sleep(900);
await S('press',true); await S('ripple'); await sleep(120);
await fr().evaluate(()=>document.getElementById('ep-play').click());
mark('play');
await S('press',false);
await S('eq',true); await S('cap','▶︎ <b>پخش شد</b>');
await sleep(1300);
// 5: drag to middle
const sb=await fr().locator('#ep-seek').evaluate(e=>{const b=e.getBoundingClientRect();return{l:b.left,r:b.right,y:b.top+b.height/2+47,v:+e.value}});
const kx=v=>sb.r-(sb.r-sb.l)*v/100; // RTL? check direction below
const dir=await fr().locator('#ep-seek').evaluate(e=>getComputedStyle(e).direction);
const px=v=> dir==='rtl'? kx(v) : sb.l+(sb.r-sb.l)*v/100;
const v0=await fr().locator('#ep-seek').evaluate(e=>+e.value);
await S('fingerMove',px(v0),sb.y,600); await sleep(700);
await S('press',true);
await S('cap','مستقیم برو <b>وسطِ اپیزود</b>');
const target=49.6, steps=40;
for(let i=1;i<=steps;i++){const e=i/steps, k=e<.5?2*e*e:1-Math.pow(-2*e+2,2)/2; const v=v0+(target-v0)*k;
  await fr().locator('#ep-seek').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},v);
  await S('fingerMove',px(v),sb.y,40); await sleep(28);}
mark('seeked');
await sleep(250); await S('press',false); await sleep(400); await S('fingerHide');
await S('camDur',4200); await S('camera',1.2,195,sb.y); await sleep(1500);
await S('cap','درست <b>همان‌جا</b> که لازم داری');
await sleep(4200);
await S('camDur',1100); await S('camera',.93,195,0); await sleep(900);
await S('eq',false);
await S('outro'); mark('outro'); await sleep(3400);
await cdp.send('Page.stopScreencast');
mark('end');
const seekTo = await fr().locator('#ep-audio').evaluate(a=>a.currentTime).catch(()=>null);
await b.close();
// write frames
frames.forEach((f,i)=>fs.writeFileSync(`${OUT}/${String(i).padStart(5,'0')}.jpg`, Buffer.from(f.data,'base64')));
const base=frames[0].ts; let s='ffconcat version 1.0\n';
frames.forEach((f,i)=>{const d=i+1<frames.length? frames[i+1].ts-f.ts : 0.5; s+=`file ${OUT}/${String(i).padStart(5,'0')}.jpg\nduration ${d.toFixed(4)}\n`;});
s+=`file ${OUT}/${String(frames.length-1).padStart(5,'0')}.jpg\n`;
fs.writeFileSync('list.txt',s);
const rel=Object.fromEntries(Object.entries(marks).map(([k,v])=>[k,+(v-marks.start).toFixed(2)]));
fs.writeFileSync('marks.json',JSON.stringify({marks:rel,startWall:marks.start,seekTarget:+(902*target/100).toFixed(2),firstFrameWall:base,audioPosAtEnd:seekTo,frames:frames.length},null,1));
console.log(frames.length, rel, seekTo);
