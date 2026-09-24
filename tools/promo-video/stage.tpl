<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=540,initial-scale=1">
<style>
@font-face{font-family:V;src:url(vazir.woff2) format('woff2');font-weight:100 900}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:540px;height:960px;overflow:hidden;background:#060b16;font-family:V,sans-serif;color:#eaf1ff}
/* ── background: two drifting glows, a fading grid, slow light sweep ── */
#bg{position:absolute;inset:0;overflow:hidden}
.glow{position:absolute;border-radius:50%;filter:blur(70px)}
.g1{width:460px;height:460px;background:#1d4ed8;top:-150px;right:-150px;opacity:.55;animation:d1 13s ease-in-out infinite alternate}
.g2{width:380px;height:380px;background:#0ea5a4;bottom:-140px;left:-140px;opacity:.32;animation:d2 16s ease-in-out infinite alternate}
.g3{width:280px;height:280px;background:#7c3aed;top:42%;left:26%;opacity:.16;animation:d1 10s ease-in-out infinite alternate-reverse}
@keyframes d1{to{transform:translate(-90px,130px) scale(1.18)}}
@keyframes d2{to{transform:translate(120px,-150px) scale(1.22)}}
#grid{position:absolute;inset:0;background-image:linear-gradient(rgba(120,160,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(120,160,255,.07) 1px,transparent 1px);background-size:28px 28px;-webkit-mask-image:radial-gradient(ellipse at 50% 28%,#000 18%,transparent 72%)}
#dust{position:absolute;inset:0}
#dust i{position:absolute;width:3px;height:3px;border-radius:50%;background:#93c5fd;opacity:0;animation:fl 9s linear infinite}
@keyframes fl{0%{opacity:0;transform:translateY(0)}15%{opacity:.55}85%{opacity:.35}100%{opacity:0;transform:translateY(-260px)}}

/* ── hook: full-screen typewriter before the phone appears ── */
#hook{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;justify-content:center;padding:0 44px;gap:14px;transition:opacity .8s,transform .9s cubic-bezier(.6,0,.2,1),filter .8s}
#hook.gone{opacity:0;transform:translateY(-120px) scale(.9);filter:blur(10px)}
#hook .k{font-size:17px;font-weight:600;color:#7dd3fc;letter-spacing:.2px;opacity:0;transform:translateY(8px);transition:all .6s}
#hook .k.on{opacity:1;transform:none}
#hook .l{font-size:40px;line-height:1.35;font-weight:900;min-height:54px}
#hook .l.big{font-size:44px}
#hook .q{font-size:30px;font-weight:800;background:linear-gradient(90deg,#60a5fa,#5eead4);-webkit-background-clip:text;color:transparent;min-height:44px}
.caret{display:inline-block;width:3px;height:.9em;background:#5eead4;margin-right:4px;vertical-align:-.1em;animation:bl .8s steps(1) infinite}
@keyframes bl{50%{opacity:0}}

/* ── top: brand, caption, step rail ── */
#top{position:absolute;top:18px;left:0;right:0;z-index:5;display:flex;flex-direction:column;align-items:center;opacity:0;transition:opacity .8s}
#top.on{opacity:1}
.brand{display:flex;align-items:center;gap:8px;direction:ltr;font-weight:800;font-size:15px;opacity:.9}
.brand img{width:22px;height:22px;border-radius:6px;background:#fff;padding:2px}
#cap{margin-top:8px;height:64px;position:relative;width:100%}
.c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center;opacity:0;transform:translateY(12px);filter:blur(8px);transition:all .6s cubic-bezier(.2,.8,.2,1)}
.c.on{opacity:1;transform:none;filter:none}
.c.off{opacity:0;transform:translateY(-12px);filter:blur(8px)}
.c small{font-size:13px;font-weight:700;color:#7dd3fc;letter-spacing:.3px}
.c span{font-size:23px;font-weight:800;line-height:1.3}
.c b{background:linear-gradient(90deg,#60a5fa,#5eead4);-webkit-background-clip:text;color:transparent}
#rail{display:flex;gap:6px;margin-top:6px;direction:rtl}
#rail div{font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:999px;border:1px solid rgba(148,163,184,.25);color:rgba(226,232,240,.45);transition:all .5s}
#rail div.done{color:#93c5fd;border-color:rgba(96,165,250,.35)}
#rail div.now{color:#04111f;background:linear-gradient(90deg,#60a5fa,#5eead4);border-color:transparent;box-shadow:0 0 18px rgba(94,234,212,.45)}

/* ── phone + camera ── */
#camwrap{position:absolute;left:0;right:0;top:150px;bottom:0;display:flex;justify-content:center;padding-top:8px;overflow:hidden;-webkit-mask-image:linear-gradient(transparent 0,#000 16px)}
#cam{position:relative;width:390px;height:844px;flex:none;transform-origin:50% 0;transform:translateY(900px) scale(.9);transition:transform 1.1s cubic-bezier(.65,0,.25,1)}
#phone{position:absolute;inset:0;border-radius:52px;box-shadow:0 0 0 9px #0f172a,0 0 0 10.5px #334155,0 40px 90px rgba(0,0,0,.6),0 0 140px rgba(59,130,246,.28);overflow:hidden;background:#fff}
#phone iframe{border:0;width:390px;height:797px;display:block;position:absolute;top:47px;left:0}
#sbar{position:absolute;top:0;left:0;right:0;height:47px;background:#fff;display:flex;justify-content:space-between;align-items:center;padding:4px 34px 0 40px;direction:ltr;font:600 15px -apple-system,system-ui,sans-serif;color:#0f172a}
#sbar .ic{display:flex;gap:6px;align-items:center}
#island{pointer-events:none;position:absolute;top:10px;left:50%;width:108px;height:30px;margin-left:-54px;background:#000;border-radius:20px;z-index:4}
#veil{position:absolute;inset:0;background:#f5f8ff;opacity:0;pointer-events:none;transition:opacity .35s;z-index:3}
#finger{pointer-events:none;position:absolute;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(255,255,255,.38);border:2px solid rgba(255,255,255,.95);box-shadow:0 6px 24px rgba(15,23,42,.35),inset 0 0 12px rgba(37,99,235,.35);z-index:6;opacity:0;transition:opacity .3s,transform .15s;backdrop-filter:blur(2px)}
#finger.press{transform:scale(.78)}
.ripple{pointer-events:none;position:absolute;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid rgba(37,99,235,.8);z-index:6;animation:rp .6s ease-out forwards}
@keyframes rp{to{transform:scale(2.6);opacity:0}}

/* ── badge that pops beside the phone (e.g. «هایلایت شد») ── */
#pop{position:absolute;z-index:7;left:50%;bottom:34px;transform:translate(-50%,24px) scale(.9);opacity:0;transition:all .55s cubic-bezier(.2,.9,.25,1.2);background:rgba(15,23,42,.82);border:1px solid rgba(148,163,184,.28);padding:11px 20px;border-radius:999px;backdrop-filter:blur(10px);box-shadow:0 12px 40px rgba(0,0,0,.45);font-size:15px;font-weight:700;white-space:nowrap;display:flex;gap:9px;align-items:center}
#pop.on{opacity:1;transform:translate(-50%,0) scale(1)}
#pop i{width:12px;height:12px;border-radius:4px;display:inline-block}

/* ── outro ── */
#outro{position:absolute;inset:0;z-index:9;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 40%,rgba(12,24,52,.84),rgba(5,9,18,.97));opacity:0;transition:opacity .9s;gap:14px;padding:0 40px;text-align:center}
#outro.on{opacity:1}
#outro img{width:82px;height:82px;border-radius:22px;background:#fff;padding:8px;box-shadow:0 0 80px rgba(59,130,246,.55)}
#outro h2{font-size:30px;font-weight:900;line-height:1.4}
#outro h2 b{background:linear-gradient(90deg,#60a5fa,#5eead4);-webkit-background-clip:text;color:transparent}
#outro p{font-size:17px;font-weight:600;color:#bcd0f5}
#outro .url{margin-top:8px;font-size:19px;direction:ltr;padding:9px 26px;border-radius:999px;border:1px solid rgba(147,197,253,.45);color:#93c5fd;font-weight:800;box-shadow:0 0 30px rgba(59,130,246,.25)}
#outro > *{opacity:0;transform:translateY(14px);transition:all .7s cubic-bezier(.2,.8,.2,1)}
#outro.on > *{opacity:1;transform:none}
#outro.on > *:nth-child(2){transition-delay:.18s}#outro.on > *:nth-child(3){transition-delay:.4s}#outro.on > *:nth-child(4){transition-delay:.65s}
#black{position:absolute;inset:0;z-index:30;background:#060b16;transition:opacity 1s}
</style></head><body>
<div id="bg"><div class="glow g1"></div><div class="glow g2"></div><div class="glow g3"></div><div id="grid"></div><div id="dust"></div></div>

<div id="hook"><div class="k" id="hk">یه سؤال بالینی تو ذهنته…</div><div class="l" id="h1"></div><div class="q" id="h2"></div></div>

<div id="top"><div class="brand"><img src="logo-v2.png">DentCast</div><div id="cap"></div>
  <div id="rail"><div>بپرس</div><div>بنویس</div><div>پیدا کن</div><div>بخوان</div><div>هایلایت کن</div></div></div>

<div id="camwrap"><div id="cam"><div id="phone"><div id="sbar"><span>9:41</span><span class="ic"><svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#0f172a"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="#0f172a"/><rect x="10" y="3" width="3" height="9" rx="1" fill="#0f172a"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0f172a"/></svg><svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 2.5c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .7 10.4 10.4 0 0 0 .8 3.6L2 4.9A8.6 8.6 0 0 1 8 2.5zm0 3.6c1.4 0 2.6.5 3.5 1.4l1.2-1.3A6.7 6.7 0 0 0 8 4.3a6.7 6.7 0 0 0-4.7 1.9l1.2 1.3c.9-.9 2.1-1.4 3.5-1.4zM8 9.6l1.9-2a2.7 2.7 0 0 0-3.8 0z" fill="#0f172a"/></svg><svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="22" height="12" rx="3.5" fill="none" stroke="#0f172a" opacity=".4"/><rect x="2" y="2" width="17" height="9" rx="2" fill="#0f172a"/><rect x="24" y="4.5" width="2" height="4" rx="1" fill="#0f172a" opacity=".4"/></svg></span></div><iframe id="f" src="about:blank"></iframe><div id="veil"></div></div><div id="island"></div><div id="finger"></div></div></div>

<div id="pop"></div>
<div id="outro"><img src="logo-v2.png"><h2>سؤالت رو <b>بپرس</b>،<br>جوابش رو <b>نگه دار</b>.</h2><p>دنت‌کست — جامع‌ترین منبع فارسی پروتز</p><div class="url">dentcast.ir</div></div>
<div id="black"></div>
<script>
const $=id=>document.getElementById(id), cam=$('cam'), finger=$('finger'), capEl=$('cap');
for(let i=0;i<22;i++){const d=document.createElement('i');d.style.left=(Math.random()*100)+'%';d.style.top=(40+Math.random()*60)+'%';d.style.animationDelay=(-Math.random()*9)+'s';d.style.animationDuration=(7+Math.random()*6)+'s';$('dust').appendChild(d);}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function typeInto(el,text,speed){el.innerHTML='<span></span><i class="caret"></i>';const s=el.firstChild;for(const ch of text){s.textContent+=ch;await wait(ch===' '?speed*1.6:speed*(0.7+Math.random()*0.6));}}
window.S={
 unblack(){$('black').style.opacity=0},
 async hook(){
   await wait(300); $('hk').classList.add('on'); await wait(900);
   await typeInto($('h1'),'کانتکت بین ۶ و ۷',70); await wait(250);
   $('h1').querySelector('.caret').remove();
   const l2=document.createElement('div');l2.className='l';$('hook').insertBefore(l2,$('h2'));
   await typeInto(l2,'هی باز میشه…',80); l2.querySelector('.caret').remove(); await wait(500);
   await typeInto($('h2'),'چیکار باید بکنم؟',75); await wait(1300);
 },
 hookOut(){$('hook').classList.add('gone');$('top').classList.add('on');cam.style.transform='translateY(0) scale(.86)';},
 cap(kicker,html){capEl.querySelectorAll('.c').forEach(c=>{c.classList.remove('on');c.classList.add('off');setTimeout(()=>c.remove(),650)});const d=document.createElement('div');d.className='c';d.innerHTML=(kicker?'<small>'+kicker+'</small>':'')+'<span>'+html+'</span>';capEl.appendChild(d);requestAnimationFrame(()=>requestAnimationFrame(()=>d.classList.add('on')));},
 step(i){[...$('rail').children].forEach((d,k)=>{d.classList.toggle('now',k===i);d.classList.toggle('done',k<i)})},
 camera(s,ox,oy,ms){if(ms)cam.style.transitionDuration=ms+'ms';cam.style.transformOrigin=ox+'px '+oy+'px';cam.style.transform='translateY(0) scale('+s+')';},
 fingerShow(x,y){finger.style.transition='none';finger.style.left=x+'px';finger.style.top=y+'px';finger.offsetWidth;finger.style.opacity=1},
 fingerMove(x,y,ms=700){finger.style.transition=`opacity .3s,transform .15s,left ${ms}ms cubic-bezier(.45,0,.2,1),top ${ms}ms cubic-bezier(.45,0,.2,1)`;finger.style.left=x+'px';finger.style.top=y+'px'},
 fingerHide(){finger.style.opacity=0},
 press(on){finger.classList.toggle('press',on)},
 ripple(){const r=document.createElement('div');r.className='ripple';r.style.left=finger.style.left;r.style.top=finger.style.top;cam.appendChild(r);setTimeout(()=>r.remove(),700)},
 veil(o){$('veil').style.opacity=o},
 pop(html){const p=$('pop');if(!html){p.classList.remove('on');return}p.innerHTML=html;p.classList.add('on')},
 outro(){$('outro').classList.add('on')}
};
</script></body></html>
